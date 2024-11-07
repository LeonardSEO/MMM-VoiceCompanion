const NodeHelper = require("node_helper");
const Log = require("logger");
const { OpenAI } = require("openai");
const fs = require("fs");
const { exec } = require('child_process');
const {
  Porcupine,
  BuiltinKeyword
} = require("@picovoice/porcupine-node");
const { PvRecorder } = require("@picovoice/pvrecorder-node");

const retryWithBackoff = async (operation, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            const isRetryableError = 
                error.message.includes('ECONNRESET') ||
                error.message.includes('Connection error') ||
                error.code === 'ETIMEDOUT';
            
            if (!isRetryableError) throw error;
            
            const delay = Math.pow(2, i) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

module.exports = NodeHelper.create({
    start: function() {
        Log.log("Starting node helper for: " + this.name);
        this.openai = null;
        this.porcupine = null;
        this.recorder = null;
        this.isListening = false;
        this.conversationMode = false;
        this.conversationTimeout = null;
        this.standbyTimeout = null;
    },

    socketNotificationReceived: function(notification, payload) {
        Log.log("MMM-VoiceCompanion helper received a socket notification: " + notification);
        if (notification === "INIT") {
            this.config = payload;
            Log.log("Received configuration:");
            Log.log("Wake Word: " + this.config.wakeWord);
            Log.log("OpenAI Key received: " + (this.config.openAiKey ? "Yes" : "No"));
            Log.log("Porcupine Access Key received: " + (this.config.porcupineAccessKey ? "Yes" : "No"));
            
            if (!this.config.openAiKey) {
                Log.error("OpenAI API key is missing!");
            }
            if (!this.config.porcupineAccessKey) {
                Log.error("Porcupine Access Key is missing!");
            }
            
            this.openai = new OpenAI({ apiKey: this.config.openAiKey });
            this.setupPorcupine();
        }
    },

    setupPorcupine: function() {
        try {
            this.porcupine = new Porcupine(
                this.config.porcupineAccessKey,
                [BuiltinKeyword[this.config.wakeWord]],
                [0.5]
            );

            const frameLength = this.porcupine.frameLength;
            
            // List available audio devices
            const devices = PvRecorder.getAudioDevices();
            Log.log("Available audio devices:", devices);

            try {
                this.recorder = new PvRecorder(
                    -1, // Default audio device
                    frameLength
                );
                this.recorder.start();
            } catch (recorderError) {
                Log.error("Error initializing PvRecorder:", recorderError);
                Log.log("Trying to use a specific audio device...");
                
                // Try to use the first available device
                if (devices.length > 0) {
                    this.recorder = new PvRecorder(
                        0, // First available device
                        frameLength
                    );
                    this.recorder.start();
                } else {
                    throw new Error("No audio devices available");
                }
            }

            Log.log("MMM-VoiceCompanion: Porcupine and recorder setup complete");
            this.listenForWakeWord();
        } catch (error) {
            Log.error("MMM-VoiceCompanion Error setting up Porcupine:", error);
            this.sendSocketNotification("SETUP_ERROR", error.message);
        }
    },

    listenForWakeWord: async function() {
        while (true) {
            const pcm = await this.recorder.read();
            const keywordIndex = this.porcupine.process(pcm);

            if (keywordIndex !== -1 || this.conversationMode) {
                Log.log("MMM-VoiceCompanion: Wake word detected or in conversation mode!");
                this.sendSocketNotification("WAKE_WORD_DETECTED", {});
                await this.handleSpeechInput();
            }

            if (this.conversationMode && Date.now() - this.lastInteractionTime > this.config.standbyTimeout) {
                this.exitConversationMode();
            }
        }
    },

    handleSpeechInput: async function() {
        if (!this.conversationMode) {
            this.enterConversationMode();
        }
        
        try {
            // Record audio for 5 seconds after wake word
            const audioBuffer = await this.recordAudio(5000);
            
            if (!audioBuffer) {
                throw new Error("Failed to record audio");
            }

            const transcription = await this.transcribeAudio(audioBuffer);
            if (!transcription || transcription.trim().length === 0) {
                throw new Error("No speech detected");
            }

            Log.log("MMM-VoiceCompanion Transcription:", transcription);

            const response = await this.getChatResponse(transcription);
            Log.log("MMM-VoiceCompanion Assistant response:", response);

            await this.textToSpeech(response);
            this.sendSocketNotification("RESPONSE_RECEIVED", response);
        } catch (error) {
            Log.error("MMM-VoiceCompanion Error processing audio:", error);
            this.sendSocketNotification("RESPONSE_RECEIVED", "Sorry, I couldn't understand that. Could you please try again?");
        }

        this.resetConversationTimer();
    },

    enterConversationMode: function() {
        this.conversationMode = true;
        this.sendSocketNotification("ENTER_CONVERSATION_MODE", {});
        this.resetConversationTimer();
    },

    exitConversationMode: function() {
        this.conversationMode = false;
        clearTimeout(this.conversationTimeout);
        clearTimeout(this.standbyTimeout);
        this.sendSocketNotification("EXIT_CONVERSATION_MODE", {});
    },

    resetConversationTimer: function() {
        clearTimeout(this.conversationTimeout);
        clearTimeout(this.standbyTimeout);
        this.lastInteractionTime = Date.now();
        this.conversationTimeout = setTimeout(() => this.exitConversationMode(), this.config.conversationTimeout);
        this.standbyTimeout = setTimeout(() => this.exitConversationMode(), this.config.standbyTimeout);
    },

    recordAudio: function(duration) {
        return new Promise((resolve) => {
            const chunks = [];
            let silenceFrames = 0;
            const recordingInterval = setInterval(() => {
                const frame = this.recorder.read();
                if (frame && frame.length > 0) {
                    // Convert Int16Array to Buffer
                    const frameBuffer = Buffer.from(frame.buffer);
                    chunks.push(frameBuffer);
                }
            }, 20);

            setTimeout(() => {
                clearInterval(recordingInterval);
                if (chunks.length === 0) {
                    Log.error("No audio data recorded");
                    resolve(null);
                    return;
                }
                
                // Convert PCM data to WAV format
                const sampleRate = 16000;
                const numChannels = 1;
                const bitsPerSample = 16;
                
                // Calculate total samples
                const totalSamples = chunks.reduce((acc, chunk) => acc + chunk.length / 2, 0);
                
                // Create WAV header
                const header = Buffer.alloc(44);
                header.write('RIFF', 0);
                header.writeUInt32LE(36 + totalSamples * 2, 4);
                header.write('WAVE', 8);
                header.write('fmt ', 12);
                header.writeUInt32LE(16, 16);
                header.writeUInt16LE(1, 20);
                header.writeUInt16LE(numChannels, 22);
                header.writeUInt32LE(sampleRate, 24);
                header.writeUInt32LE(sampleRate * numChannels * bitsPerSample / 8, 28);
                header.writeUInt16LE(numChannels * bitsPerSample / 8, 32);
                header.writeUInt16LE(bitsPerSample, 34);
                header.write('data', 36);
                header.writeUInt32LE(totalSamples * 2, 40);
                
                const audioData = Buffer.concat(chunks);
                const wavBuffer = Buffer.concat([header, audioData]);
                
                resolve(wavBuffer);
            }, duration);
        });
    },

    transcribeAudio: async function(audioBuffer) {
        if (!audioBuffer) {
            throw new Error("No audio data to transcribe");
        }

        const tempFilePath = "/tmp/audio.wav";
        
        try {
            // Write the WAV file
            fs.writeFileSync(tempFilePath, audioBuffer);
            
            // Verify file was written successfully
            const stats = fs.statSync(tempFilePath);
            if (stats.size === 0) {
                throw new Error("Generated audio file is empty");
            }
            
            // Log file info for debugging
            Log.log(`Audio file size: ${stats.size} bytes`);
            
            const transcription = await retryWithBackoff(async () => {
                const formData = new FormData();
                formData.append('file', fs.createReadStream(tempFilePath));
                formData.append('model', 'whisper-1');
                
                return await this.openai.audio.transcriptions.create({
                    file: fs.createReadStream(tempFilePath),
                    model: "whisper-1",
                    response_format: "text"
                });
            });

            return transcription.text;
        } catch (error) {
            Log.error("Transcription error:", error);
            throw error;
        } finally {
            // Clean up temp file
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
    },

    getChatResponse: async function(input) {
        const chatCompletion = await this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: input }],
        });

        return chatCompletion.choices[0].message.content;
    },

    textToSpeech: async function(text) {
        const tempFilePath = "/tmp/tts_output.wav";

        const mp3 = await this.openai.audio.speech.create({
            model: "tts-1",
            voice: this.config.voiceId,
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        fs.writeFileSync(tempFilePath, buffer);

        return new Promise((resolve, reject) => {
            exec(`aplay ${tempFilePath}`, (error, stdout, stderr) => {
                fs.unlinkSync(tempFilePath);
                if (error) {
                    console.error(`Error playing audio: ${error}`);
                    reject(error);
                } else {
                    console.log('Audio played successfully');
                    resolve();
                }
            });
        });
    }
});

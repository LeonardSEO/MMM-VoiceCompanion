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
            const sensitivity = 0.7; // Increased sensitivity
            Log.log(`Setting up Porcupine with wake word: ${this.config.wakeWord} and sensitivity: ${sensitivity}`);

            this.porcupine = new Porcupine(
                this.config.porcupineAccessKey,
                [BuiltinKeyword[this.config.wakeWord]],
                [sensitivity]
            );

            const frameLength = this.porcupine.frameLength;
            
            // List available audio devices
            try {
                const devices = PvRecorder.getAvailableDevices();
                if (devices && devices.length > 0) {
                    Log.log("Available audio devices:", devices);
                } else {
                    throw new Error("No audio devices found.");
                }
            } catch (deviceError) {
                Log.error("Error getting audio devices:", deviceError);
                throw deviceError;
            }

            // Initialize recorder with the first available audio device
            try {
                this.recorder = new PvRecorder(frameLength, 0);
                this.recorder.start();
            } catch (recorderError) {
                Log.error("Error initializing PvRecorder:", recorderError);
                throw new Error("Failed to initialize the audio recorder.");
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
            try {
                const pcm = await this.recorder.read();
                const keywordIndex = this.porcupine.process(pcm);

                if (keywordIndex !== -1) {
                    Log.log(`MMM-VoiceCompanion: Wake word detected! Index: ${keywordIndex}`);
                    this.sendSocketNotification("WAKE_WORD_DETECTED", {});
                    await this.handleSpeechInput();
                } else if (this.conversationMode) {
                    Log.log("MMM-VoiceCompanion: In conversation mode");
                    await this.handleSpeechInput();
                }

                // Periodic logging
                if (Date.now() % 10000 < 20) {
                    Log.log("MMM-VoiceCompanion: Still listening for wake word...");
                }

                if (this.conversationMode && Date.now() - this.lastInteractionTime > this.config.standbyTimeout) {
                    this.exitConversationMode();
                }
            } catch (error) {
                Log.error("Error in listenForWakeWord:", error);
                // Consider adding a small delay here to prevent tight loop in case of persistent errors
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    },

    handleSpeechInput: async function() {
        if (!this.conversationMode) {
            this.enterConversationMode();
        }
        
        // Record audio for 5 seconds after wake word
        const audioBuffer = await this.recordAudio(5000);
        
        try {
            const transcription = await this.transcribeAudio(audioBuffer);
            Log.log("MMM-VoiceCompanion Transcription:", transcription);

            const response = await this.getChatResponse(transcription);
            Log.log("MMM-VoiceCompanion Assistant response:", response);

            await this.textToSpeech(response);
            this.sendSocketNotification("RESPONSE_RECEIVED", response);
        } catch (error) {
            Log.error("MMM-VoiceCompanion Error processing audio:", error);
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
            const recordingInterval = setInterval(() => {
                chunks.push(this.recorder.read());
            }, 20); // Assuming 20ms frame size

            setTimeout(() => {
                clearInterval(recordingInterval);
                const audioBuffer = Buffer.concat(chunks);
                resolve(audioBuffer);
            }, duration);
        });
    },

    transcribeAudio: async function(audioBuffer) {
        const tempFilePath = "/tmp/audio.wav";
        fs.writeFileSync(tempFilePath, audioBuffer);

        const transcription = await this.openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: "whisper-1",
        });

        fs.unlinkSync(tempFilePath);
        return transcription.text;
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

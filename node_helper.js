const NodeHelper = require("node_helper");
const Log = require("logger");
const { exec } = require('child_process');
const {
  Porcupine,
  BuiltinKeyword
} = require("@picovoice/porcupine-node");
const { PvRecorder } = require("@picovoice/pvrecorder-node");
const { OpenAI } = require("openai");
const fs = require('fs');

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
        this.state = 'idle';
        this.backgroundNoiseLevel = 0;
        this.backgroundNoiseSamples = 0;
        this.silenceFrames = 0;
    },

    socketNotificationReceived: function(notification, payload) {
        Log.log("MMM-VoiceCompanion helper received a socket notification: " + notification);
        if (notification === "INIT") {
            this.config = payload;
            this.openai = new OpenAI({ apiKey: this.config.openAiKey });
            this.setupPorcupine();
        }
    },

    setupPorcupine: function() {
        try {
            const sensitivity = 0.7;
            Log.log(`Setting up Porcupine with wake word: ${this.config.wakeWord} and sensitivity: ${sensitivity}`);

            this.porcupine = new Porcupine(
                this.config.porcupineAccessKey,
                [BuiltinKeyword[this.config.wakeWord]],
                [sensitivity]
            );

            const frameLength = this.porcupine.frameLength;
            
            // List available audio devices
            const devices = PvRecorder.getAvailableDevices();
            Log.log("Available audio devices:", devices);

            // Initialize recorder with configurable audio device index
            const audioDeviceIndex = this.config.audioDeviceIndex || 0;
            const bufferSizeMSec = 500;
            this.recorder = new PvRecorder(
                frameLength,
                audioDeviceIndex,
                bufferSizeMSec,
                false, // logOverflow
                false  // logSilence
            );
            this.recorder.start();

            Log.log("MMM-VoiceCompanion: Porcupine and recorder setup complete");
            this.listenForWakeWord();
        } catch (error) {
            Log.error("MMM-VoiceCompanion Error setting up Porcupine:", error);
            this.sendSocketNotification("SETUP_ERROR", error.message);
        }
    },

    listenForWakeWord: async function() {
        let isInterrupted = false;
        while (!isInterrupted) {
            try {
                const pcm = await this.recorder.read();
                
                this.updateBackgroundNoiseLevel(pcm);
                this.detectSilence(pcm);

                if (this.state === 'recording' && this.silenceFrames >= this.config.silenceDuration) {
                    Log.log("Silence detected...");
                    await this.stopRecording();
                }

                const keywordIndex = this.porcupine.process(pcm);
                if (keywordIndex !== -1) {
                    Log.info(`Wake word detected: ${this.config.wakeWord}`);
                    this.sendSocketNotification('WAKE_WORD_DETECTED', {});
                    await this.startRecording();
                }

                if (Date.now() % 10000 < 20) {
                    Log.log("MMM-VoiceCompanion: Still listening for wake word...");
                }

                if (this.conversationMode && Date.now() - this.lastInteractionTime > this.config.standbyTimeout) {
                    this.exitConversationMode();
                }
            } catch (error) {
                Log.error("Error in listenForWakeWord:", error);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    },

    updateBackgroundNoiseLevel: function(pcm) {
        const rms = Math.sqrt(pcm.reduce((sum, sample) => sum + sample ** 2, 0) / pcm.length);
        this.backgroundNoiseLevel = ((this.backgroundNoiseLevel * this.backgroundNoiseSamples) + rms) / (this.backgroundNoiseSamples + 1);
        this.backgroundNoiseSamples++;
    },

    detectSilence: function(pcm) {
        const rms = Math.sqrt(pcm.reduce((sum, sample) => sum + sample ** 2, 0) / pcm.length);
        const silenceThreshold = this.backgroundNoiseLevel * this.config.silenceThreshold;
        if (rms < silenceThreshold) {
            this.silenceFrames++;
        } else {
            this.silenceFrames = 0;
        }
    },

    startRecording: async function() {
        this.state = 'recording';
        this.sendSocketNotification('START_RECORDING');
        this.lastInteractionTime = Date.now();
        this.audio = [];
    },

    stopRecording: async function() {
        if (this.state !== 'recording') return;

        this.state = 'processing';
        this.sendSocketNotification('STOP_RECORDING');

        const audioBuffer = Buffer.from(this.audio);
        const tempFilePath = '/tmp/audio.wav';
        fs.writeFileSync(tempFilePath, audioBuffer);

        try {
            const transcription = await this.transcribeAudio(tempFilePath);
            Log.log("Transcription:", transcription);

            if (transcription) {
                const response = await this.getChatResponse(transcription);
                Log.log("Assistant response:", response);

                await this.textToSpeech(response);
                this.sendSocketNotification("RESPONSE_RECEIVED", response);
            }
        } catch (error) {
            Log.error("Error processing audio:", error);
        }

        this.state = 'idle';
        this.audio = [];
    },

    transcribeAudio: async function(filePath) {
        const transcription = await this.openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
        });
        return transcription.text;
    },

    getChatResponse: async function(input) {
        const chatCompletion = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: input }],
        });
        return chatCompletion.choices[0].message.content;
    },

    textToSpeech: async function(text) {
        const tempFilePath = '/tmp/tts_output.wav';

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
                    Log.error(`Error playing audio: ${error}`);
                    reject(error);
                } else {
                    Log.log('Audio played successfully');
                    resolve();
                }
            });
        });
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
    }
});

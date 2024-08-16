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
            this.recorder = new PvRecorder(
                -1, // Default audio device
                frameLength
            );
            this.recorder.start();

            Log.log("MMM-VoiceCompanion: Porcupine and recorder setup complete");
            this.listenForWakeWord();
        } catch (error) {
            Log.error("MMM-VoiceCompanion Error setting up Porcupine:", error);
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
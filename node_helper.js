const NodeHelper = require("node_helper");
const Log = require("logger");
const { OpenAI } = require("openai");
const Microphone = require("node-microphone");
const fs = require("fs");
const { Readable } = require("stream");
const Speaker = require("speaker");

module.exports = NodeHelper.create({
    start: function() {
        Log.log("Starting node helper for: " + this.name);
        this.openai = null;
        this.isListening = false;
        this.audioBuffer = [];
    },

    socketNotificationReceived: function(notification, payload) {
        Log.log("MMM-VoiceCompanion helper received a socket notification: " + notification);
        if (notification === "INIT") {
            this.config = payload;
            this.openai = new OpenAI({ apiKey: this.config.openAiKey });
            this.setupMicrophone();
        }
    },

    setupMicrophone: function() {
        const mic = new Microphone();
        const micStream = mic.startRecording();

        micStream.on("data", (data) => {
            if (this.isListening) {
                this.audioBuffer.push(data);
            }
        });

        this.isListening = true;
        this.sendSocketNotification("STATUS_UPDATE", "Listening...");
        Log.log("MMM-VoiceCompanion: Microphone setup complete");
    },

    processAudio: async function() {
        this.isListening = false;
        const audioBuffer = Buffer.concat(this.audioBuffer);
        this.audioBuffer = [];

        try {
            const transcription = await this.transcribeAudio(audioBuffer);
            Log.log("MMM-VoiceCompanion Transcription:", transcription);

            if (transcription.toLowerCase().includes(this.config.wakeWord.toLowerCase())) {
                const response = await this.getChatResponse(transcription);
                Log.log("MMM-VoiceCompanion Assistant response:", response);

                await this.textToSpeech(response);
                this.sendSocketNotification("RESPONSE_RECEIVED", response);
            }
        } catch (error) {
            Log.error("MMM-VoiceCompanion Error processing audio:", error);
        }

        this.isListening = true;
        this.sendSocketNotification("STATUS_UPDATE", "Listening...");
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
        const mp3 = await this.openai.audio.speech.create({
            model: "tts-1",
            voice: this.config.voiceId,
            input: text,
        }, { responseType: "stream" });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        const readable = new Readable();
        readable._read = () => {};
        readable.push(buffer);
        readable.push(null);

        const speaker = new Speaker({
            channels: 1,
            bitDepth: 16,
            sampleRate: 24000,
        });

        readable.pipe(speaker);

        return new Promise((resolve) => {
            speaker.on("close", () => {
                resolve();
            });
        });
    }
});
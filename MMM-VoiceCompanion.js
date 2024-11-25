Module.register("MMM-VoiceCompanion", {
    defaults: {
        wakeWord: "PORCUPINE",
        porcupineAccessKey: "",
        openAiKey: "",
        language: "en",
        voiceId: "echo",
        conversationTimeout: 120000, // 2 minutes
        standbyTimeout: 30000 // 30 seconds
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        this.sendSocketNotification("INIT", this.config);
        this.status = "Waiting for wake word...";
        this.response = "";
        this.conversationMode = false;
        this.lastInteractionTime = Date.now();
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "voice-companion";

        const statusElem = document.createElement("div");
        statusElem.className = "status";
        statusElem.innerText = this.status;
        wrapper.appendChild(statusElem);

        const overlay = document.createElement("div");
        overlay.className = "voice-overlay " + (this.conversationMode ? "active" : "");

        const responseElem = document.createElement("div");
        responseElem.className = "response";
        responseElem.innerText = this.response;

        overlay.appendChild(responseElem);
        wrapper.appendChild(overlay);

        return wrapper;
    },

    getStyles: function() {
        return ["MMM-VoiceCompanion.css"];
    },

    socketNotificationReceived: function(notification, payload) {
        Log.log("MMM-VoiceCompanion received a socket notification: " + notification);
        if (notification === "STATUS_UPDATE") {
            this.status = payload;
            this.updateDom();
        } else if (notification === "RESPONSE_RECEIVED") {
            this.response = payload;
            this.updateDom();
            this.sendNotification("SHOW_ALERT", {
                title: "Voice Companion",
                message: payload,
                timer: 5000
            });
        } else if (notification === "ENTER_CONVERSATION_MODE") {
            this.conversationMode = true;
            this.lastInteractionTime = Date.now();
            this.updateDom();
        } else if (notification === "EXIT_CONVERSATION_MODE") {
            this.conversationMode = false;
            this.updateDom();
        } else if (notification === "SETUP_ERROR") {
            this.status = "Error: " + payload;
            this.updateDom();
            this.sendNotification("SHOW_ALERT", {
                title: "Voice Companion Error",
                message: payload,
                timer: 10000
            });
        }
    },

    notificationReceived: function(notification, payload, sender) {
        if (notification === "ALL_MODULES_STARTED") {
            Log.log("MMM-VoiceCompanion: All modules started");
            this.sendNotification("SHOW_ALERT", {
                title: "Voice Companion",
                message: "Voice assistant is ready. Say '" + this.config.wakeWord + "' to start.",
                timer: 5000
            });
        }
    }
});

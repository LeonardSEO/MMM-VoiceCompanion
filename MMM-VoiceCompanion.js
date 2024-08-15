Module.register("MMM-VoiceCompanion", {
    defaults: {
        wakeWord: "Hey Mirror",
        openAiKey: "",
        language: "en",
        voiceId: "echo"
    },

    start: function() {
        Log.info("Starting module: " + this.name);
        this.sendSocketNotification("INIT", this.config);
        this.status = "Waiting for wake word...";
        this.response = "";
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "voice-companion";

        const statusElem = document.createElement("div");
        statusElem.className = "status";
        statusElem.innerText = this.status;
        wrapper.appendChild(statusElem);

        const responseElem = document.createElement("div");
        responseElem.className = "response";
        responseElem.innerText = this.response;
        wrapper.appendChild(responseElem);

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
        if (notification === "DOM_OBJECTS_CREATED") {
            Log.log("MMM-VoiceCompanion: DOM objects created");
        }
    }
});
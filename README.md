# MMM-VoiceCompanion
<img src="./screenshot-logo.png" alt="MMM-VoiceCompanion Logo" width="500"/>

A voice-activated assistant module for MagicMirror² using Porcupine for wake word detection, OpenAI's Whisper for speech recognition, and GPT for natural language processing.

## Features

- Wake word detection using Porcupine
- Speech-to-text using OpenAI's Whisper API
- Natural language processing using GPT-4o-mini
- Text-to-speech using OpenAI's TTS API
- Conversation mode for continuous interaction
- Standby mode for power efficiency and privacy

## Prerequisites

Before installing this module, make sure you have the following:

1. A working installation of [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror)
2. Node.js version 12 or later
3. npm (Node Package Manager)
4. A microphone connected to your MagicMirror device
5. Speakers or an audio output device
6. An OpenAI API key (you can obtain one by signing up at [OpenAI](https://openai.com))
7. A Picovoice Porcupine access key (sign up at [Picovoice Console](https://console.picovoice.ai/))

## Installation

1. Navigate to your MagicMirror's `modules` folder:
   ```bash
   cd ~/MagicMirror/modules/
   ```

2. Clone this repository:
   ```bash
   git clone https://github.com/LeonardSEO/MMM-VoiceCompanion.git
   ```

3. Change to the newly created module directory:
   ```bash
   cd MMM-VoiceCompanion
   ```

4. Install the dependencies:
   ```bash
   npm install
   ```

5. Add the module to your `config/config.js` file in the MagicMirror directory:
```javascript
{
    module: "MMM-VoiceCompanion",
    disabled: false,
    config: {
        wakeWord: "HEY_GOOGLE",
        porcupineAccessKey: "YOUR_KEY",
        openAiKey: "YOUR_KEY",
        voiceId: "echo",
        language: "en",
        conversationTimeout: 120000,
        standbyTimeout: 30000,
        audioDeviceIndex: -1,  // Use -1 for default device
        silenceThreshold: 500, // Adjust this value to fine-tune silence detection
        silenceDuration: 100, // Number of frames of silence to trigger stop recording
        debug: true
    }
}
```
   Replace `"your-porcupine-access-key-here"` and `"your-openai-api-key-here"` with your actual API keys.

6. Restart your MagicMirror:
   ```bash
   pm2 restart MagicMirror
   ```

## Configuration Options

| Option              | Description                                                |
|---------------------|------------------------------------------------------------|
| wakeWord            | The wake word to activate the voice assistant (must be one of the BuiltinKeyword values) |
| porcupineAccessKey  | Your Porcupine access key                                  |
| openAiKey           | Your OpenAI API key                                        |
| language            | The language code for speech recognition (default: "en")   |
| voiceId             | The voice ID for text-to-speech (default: "echo")          |
| conversationTimeout | Time in milliseconds before conversation mode ends (default: 120000) |
| standbyTimeout      | Time in milliseconds of inactivity before entering standby mode (default: 30000) |

## Wake Words

The following wake words are available as built-in keywords for Porcupine:

- ALEXA
- AMERICANO
- BLUEBERRY
- BUMBLEBEE
- COMPUTER
- GRAPEFRUIT
- GRASSHOPPER
- HEY_GOOGLE
- HEY_SIRI
- JARVIS
- OK_GOOGLE
- PICOVOICE
- PORCUPINE
- TERMINATOR

Choose one of these values for the `wakeWord` configuration option.

## Usage

1. Say the configured wake word (e.g., "Hey Google") to activate the voice assistant.
2. The module will enter conversation mode, indicated by an overlay on the screen.
3. Speak your query or command. The assistant will process your speech and respond both visually and audibly.
4. Continue the conversation without repeating the wake word. The module will remain in conversation mode for the duration specified by `conversationTimeout`.
5. If there's no interaction for the duration specified by `standbyTimeout`, the module will enter standby mode.
6. To start a new conversation, say the wake word again.

## Update

To update the MMM-VoiceCompanion module to the latest version, follow these steps:

1. Navigate to your MagicMirror's `modules` folder:
   ```bash
   cd ~/MagicMirror/modules/MMM-VoiceCompanion
   ```

2. Pull the latest changes from the repository:
   ```bash
   git pull
   ```

3. Update the module's dependencies:
   ```bash
   npm update
   ```

4. Restart your MagicMirror to apply the updates:
   ```bash
   pm2 restart MagicMirror
   ```

This will ensure your module is up-to-date with the latest features and bug fixes.

## Development

This module uses ESLint to ensure code quality. To run the linter:

```bash
npm run lint
```

To automatically fix linting issues:

```bash
npm run lint:fix
```

## Troubleshooting

If you encounter any issues:

1. Check the MagicMirror logs for any error messages:
   ```bash
   pm2 logs MagicMirror
   ```

2. Ensure your microphone and speakers are properly connected and functioning.
3. Verify that your Porcupine and OpenAI API keys are correct and have the necessary permissions.
4. Make sure you have a stable internet connection, as this module requires online access for API calls.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://github.com/LeonardSEO/MMM-VoiceCompanion/blob/main/LICENSE)

## Acknowledgements

- [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror) for the amazing smart mirror platform
- [Picovoice](https://picovoice.ai/) for the Porcupine wake word detection
- [OpenAI](https://openai.com/) for the powerful GPT and Whisper APIs

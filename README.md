# MMM-VoiceCompanion

A voice-activated assistant module for MagicMirror² using OpenAI's Whisper for speech recognition and GPT for natural language processing.

## Features

- Wake word detection
- Speech-to-text using OpenAI's Whisper API
- Natural language processing using GPT-4o-mini
- Text-to-speech using OpenAI's TTS API

## Prerequisites

Before installing this module, make sure you have the following:

1. A working installation of [MagicMirror²](https://github.com/MichMich/MagicMirror)
2. Node.js version 12 or later
3. npm (Node Package Manager)
4. A microphone connected to your MagicMirror device
5. Speakers or an audio output device
6. An OpenAI API key (you can obtain one by signing up at [OpenAI](https://openai.com))

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
        position: "top_right",
        config: {
            wakeWord: "Hey Mirror",
            openAiKey: "your-openai-api-key-here",
            language: "en",
            voiceId: "echo"
        }
    }
    ```
   Replace `"your-openai-api-key-here"` with your actual OpenAI API key.

6. Restart your MagicMirror:
    ```bash
    pm2 restart MagicMirror
    ```

## Configuration Options

| Option      | Description                                                |
|-------------|------------------------------------------------------------|
| wakeWord    | The wake word to activate the voice assistant (default: "Hey Mirror") |
| openAiKey   | Your OpenAI API key                                       |
| language    | The language code for speech recognition (default: "en")  |
| voiceId     | The voice ID for text-to-speech (default: "echo")         |

## Usage

Once the module is installed and configured, you should see a new section on your MagicMirror display showing the voice assistant's status.

1. Say the wake word (default: "Hey Mirror") to activate the voice assistant.
2. After the wake word is detected, you can ask a question or give a command.
3. The module will process your speech, generate a response, and speak it back to you.
4. The response will also be displayed on the MagicMirror screen.

## Troubleshooting

If you encounter any issues:

1. Check the MagicMirror logs for any error messages:
    ```bash
    pm2 logs MagicMirror
    ```

2. Ensure your microphone and speakers are properly connected and functioning.
3. Verify that your OpenAI API key is correct and has the necessary permissions.
4. Make sure you have a stable internet connection, as this module requires online access for API calls.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://github.com/LeonardSEO/MMM-VoiceCompanion/blob/main/LICENSE)

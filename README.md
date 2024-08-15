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
    git clone https://github.com/yourusername/MMM-VoiceCompanion.git
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

MIT

## GitHub Instructions

1. Create a new repository on GitHub named "MMM-VoiceCompanion".
2. Initialize the repository in your local MMM-VoiceCompanion folder:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/yourusername/MMM-VoiceCompanion.git
    git push -u origin main
    ```

3. Create a `.gitignore` file in the module folder with the following content:
    ```
    node_modules/
    .DS_Store
    ```

4. Commit and push the `.gitignore` file:
    ```bash
    git add .gitignore
    git commit -m "Add .gitignore"
    git push
    ```

5. Update the README.md with any additional information or screenshots as your module develops.

6. Whenever you make changes, commit and push them to GitHub:
    ```bash
    git add .
    git commit -m "Description of changes"
    git push
    ```

This comprehensive guide should help users of all skill levels install and use your MMM-VoiceCompanion module. The documentation provides clear steps, explains prerequisites, and offers troubleshooting tips. As you develop the module further, remember to keep the documentation up-to-date and add screenshots to illustrate the module's functionality.

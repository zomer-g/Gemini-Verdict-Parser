# 📑 Gemini Court Verdict Parser

This Google Apps Script extracts structured data from Hebrew court verdicts in `.doc` format using Google AI Studio's Gemini 1.5 Pro API.

## ✨ Features

- Extracts text from Word `.doc` or `.docx` files in a Google Drive folder
- Sends text to Gemini with a structured prompt
- Parses the returned JSON object
- Saves the result to another folder in `.json` format

## 🔧 Setup

1. **Open [Google Apps Script](https://script.google.com/)** and create a new project.
2. Paste the code from `Code.gs`.
3. Replace the placeholders:
   - `YOUR_SOURCE_FOLDER_ID`
   - `YOUR_TARGET_FOLDER_ID`
   - `YOUR_GEMINI_API_KEY`
4. Enable the following services:
   - Google Drive API (`Drive` under "Advanced Services")
   - Google Docs API (`DocumentApp`)
5. Run `processCourtVerdictsWithGemini()`.

## 📥 Input

- Folder with `.doc` or `.docx` files containing Hebrew court verdicts.

## 📤 Output

- JSON files with fields:
  - `court name`
  - `name of file`
  - `name of case`
  - `Articles of conviction`
  - `prison term`
  - `Service work`
  - `suspended sentence`

## 🔒 Notes

- This script uses Gemini API via **API key**, not OAuth.
- Be sure **not to expose your API key** publicly.

## 📄 License

MIT License

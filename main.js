// === Configuration Constants (to be filled by user) ===
const SOURCE_FOLDER_ID = 'YOUR_SOURCE_FOLDER_ID'; // Folder with DOC files
const TARGET_FOLDER_ID = 'YOUR_TARGET_FOLDER_ID'; // Folder to store JSON output
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

/**
 * 🔁 Main Function: Process all DOC files in the source folder
 */
function processCourtVerdictsWithGemini() {
  Logger.log('🚀 Script started.');

  try {
    const folder = DriveApp.getFolderById(SOURCE_FOLDER_ID);
    const files = folder.getFiles();
    let processedCount = 0;

    while (files.hasNext()) {
      const file = files.next();
      const mimeType = file.getMimeType();
      Logger.log(`🔍 Checking file: ${file.getName()} (${mimeType})`);

      if (
        mimeType === "application/msword" || 
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        Logger.log(`📄 Processing supported DOC file: ${file.getName()}`);

        const docText = extractDocText(file);
        Logger.log('📜 Extracted text length: ' + docText.length);

        const prompt = buildPrompt(docText);
        const response = sendToGemini(prompt);

        if (response) {
          Logger.log('💾 Saving parsed JSON...');
          saveJsonToDrive(response, file.getName());
          processedCount++;
        } else {
          Logger.log('⚠️ Gemini returned no parseable content.');
        }
      } else {
        Logger.log(`⛔ Skipping unsupported file type: ${file.getName()} (${mimeType})`);
      }
    }

    if (processedCount === 0) {
      Logger.log('📭 No supported DOC files were processed.');
    } else {
      Logger.log(`✅ Finished processing ${processedCount} files.`);
    }

  } catch (e) {
    Logger.log(`❌ Error occurred: ${e.message}`);
  }

  Logger.log('🏁 Script finished.');
}

/**
 * 📄 Convert DOC file to Google Doc and extract its text
 */
function extractDocText(file) {
  Logger.log('📥 Converting DOC to Google Doc...');
  const googleDoc = DocumentApp.openById(
    Drive.Files.insert({ title: file.getName(), mimeType: MimeType.GOOGLE_DOCS }, file.getBlob()).id
  );
  const text = googleDoc.getBody().getText();
  Logger.log('📃 Extracted text preview: ' + text.substring(0, 300));
  return text;
}

/**
 * 🧠 Construct the prompt for Gemini
 */
function buildPrompt(text) {
  return `
I have a court verdict in Hebrew. I need you to extract specific information and provide it to me as a JSON object with the following fields:

* court name (string): The name of the court that issued the verdict.
* name of file (string): The file name as it appears at the top of the document (e.g., "ME-22-11-62899-242").
* name of case (string): The case name (e.g., "תפ 62899-11-22 מדינת ישראל נ' קירמה").
* Articles of conviction (list of strings): A list of the specific offenses the defendant was convicted of.
* prison term (number): The length of the prison sentence imposed (in months).
* Service work (boolean): Indicate whether the prison term is to be served as community service. (true/false).
* suspended sentence (boolean): Indicate if there is a suspended sentence. (true/false).

Here is the verdict text:

${text}
`;
}

/**
 * 🤖 Send the prompt to Gemini and return parsed JSON
 */
function sendToGemini(promptText) {
  try {
    const payload = {
      contents: [
        {
          parts: [{ text: promptText }]
        }
      ]
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(GEMINI_URL, options);
    const code = response.getResponseCode();
    const body = response.getContentText();

    Logger.log(`📩 Gemini Response Code: ${code}`);
    Logger.log(`📩 Gemini Response Body: ${body}`);

    if (code !== 200) {
      throw new Error(`Gemini API error. Code: ${code}`);
    }

    const json = JSON.parse(body);
    const content = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return null;

    const cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .replace(/^[\s\r\n]+|[\s\r\n]+$/g, '')
      .trim();

    return JSON.stringify(JSON.parse(cleaned), null, 2);

  } catch (e) {
    Logger.log('❌ Gemini fetch error: ' + e.message);
    return null;
  }
}

/**
 * 💾 Save parsed JSON to Drive folder
 */
function saveJsonToDrive(jsonText, originalName) {
  const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
  const fileName = originalName.replace(/\.[^/.]+$/, '') + '_parsed.json';
  folder.createFile(fileName, jsonText, MimeType.PLAIN_TEXT);
  Logger.log(`✅ Saved JSON: ${fileName}`);
}

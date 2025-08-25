// sheetLogger.js
const { google } = require("googleapis");
const path = require("path");

// טעינת המפתח
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "book-lending-system-data-3e2236f7aeb8.json"), // הקובץ שהעלית
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// ה־ID של ה־Google Sheet שלך (מהלינק)
const SPREADSHEET_ID = "1-xb9-8HSkRiNWHbOUdmyunoXFAsQURrVJ97ysxMPnuI";

async function logAction(studentId, studentName, bookName, actionType, date) {
  try {
    const values = [[studentId, studentName, bookName, actionType, date]];
await sheets.spreadsheets.values.append({
  spreadsheetId: SPREADSHEET_ID,
  range: "גיליון1!A:E", // 👈 שם הגיליון אצלך
  valueInputOption: "USER_ENTERED",
  requestBody: { values },
});

    console.log("✅ נרשמה שורה חדשה בגוגל שיטס!");
  } catch (err) {
    console.error("❌ שגיאה בלוג ל־Google Sheets:", err);
  }
}

module.exports = { logAction };

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 🔧 שנה לפורט אם הוא שונה
const BASE_URL = 'http://localhost:3000/api';

// 🗂 שנה כאן לשם הקובץ שברצונך לשחזר ממנו
const BACKUP_FILE = path.join(__dirname, 'backups', 'backup_2025-06-14T19-42-00.json');

async function restore() {
  if (!fs.existsSync(BACKUP_FILE)) {
    console.error('❌ קובץ הגיבוי לא נמצא:', BACKUP_FILE);
    return;
  }

  const data = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));

  const endpoints = ['students', 'books', 'borrowed', 'returned'];

  for (const key of endpoints) {
    if (!Array.isArray(data[key])) {
      console.warn(`⚠️ נתונים חסרים או שגויים ב־"${key}"`);
      continue;
    }

    try {
      await axios.put(`${BASE_URL}/${key}`, data[key], {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`✅ ${key} שוחזרו (${data[key].length} רשומות)`);
    } catch (err) {
      console.error(`❌ שגיאה בשחזור ${key}:`, err.message);
    }
  }
}

restore();

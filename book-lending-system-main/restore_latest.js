const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BACKUP_DIR = path.join(__dirname, 'backups');
const BASE_URL = 'http://localhost:3000/api';

function getLatestBackupFile() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
    .sort()
    .reverse();

  return files.length > 0 ? path.join(BACKUP_DIR, files[0]) : null;
}

async function restore() {
  const latestFile = getLatestBackupFile();
  if (!latestFile) {
    console.error('❌ לא נמצא קובץ גיבוי אחרון');
    return;
  }

  console.log(`🔄 טוען גיבוי: ${latestFile}`);
  const data = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));

  const endpoints = ['students', 'books', 'borrowed', 'returned'];
  for (const key of endpoints) {
    try {
      await axios.put(`${BASE_URL}/${key}`, data[key], {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`✅ ${key} שוחזרו (${data[key]?.length || 0} רשומות)`);
    } catch (err) {
      console.error(`❌ שגיאה בשחזור ${key}:`, err.message);
    }
  }
}

restore();

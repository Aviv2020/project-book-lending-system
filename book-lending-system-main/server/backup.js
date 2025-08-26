const fs = require('fs');
const path = require('path');
const axios = require('axios');

// הגדרות
const BASE_URL = 'http://localhost:3000/api';
const BACKUP_DIR = path.join(__dirname, 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const FILE_NAME = `backup_${TIMESTAMP}.json`;
const FILE_PATH = path.join(BACKUP_DIR, FILE_NAME);

async function fetchData() {
  const [students, books, borrowed, returned] = await Promise.all([
    axios.get(`${BASE_URL}/students`),
    axios.get(`${BASE_URL}/books`),
    axios.get(`${BASE_URL}/borrowed`),
    axios.get(`${BASE_URL}/returned`)
  ]);

  return {
    timestamp: new Date().toISOString(),
    students: students.data,
    books: books.data,
    borrowed: borrowed.data,
    returned: returned.data
  };
}

async function createBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
  }

  const data = await fetchData();
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ גיבוי נשמר: ${FILE_PATH}`);
}

createBackup().catch(err => {
  console.error('❌ שגיאה בגיבוי:', err.message);
});

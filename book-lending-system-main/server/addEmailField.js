const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', '2026', 'students.json');

try {
  // קריאת הקובץ
  const data = fs.readFileSync(filePath, 'utf8');
  const students = JSON.parse(data);

  // עדכון כל תלמיד
  const updated = students.map(student => ({
    ...student,
    email: student.email || 'non'
  }));

  // שמירה חזרה לקובץ
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');

  console.log('✔️ שדה email נוסף לכל תלמיד (אם היה חסר)');
} catch (err) {
  console.error('❌ שגיאה:', err);
}

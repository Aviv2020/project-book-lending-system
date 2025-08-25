const fs = require('fs');

// טען את קובץ ההשאלות
const borrowed = JSON.parse(fs.readFileSync('borrowed_minified.json', 'utf8'));

// פונקציה להמרה לפי קיבוץ על studentId + date
const grouped = {};

// נעבור על כל ההשאלות
borrowed.forEach(entry => {
  const key = `${entry.studentId}__${entry.date}`;
  if (!grouped[key]) {
    grouped[key] = {
      id: entry.id, // אפשר להשאיר את הראשון
      studentId: entry.studentId,
      bookIds: [],
      returned: [],
      date: entry.date,
      signature: entry.signature || null,
      bulkId: entry.bulkId || null,
      borrowerType: entry.borrowerType || null,
      borrowerName: entry.borrowerName || null
    };
  }

  // הוסף את הספר ואת מצב ההחזרה (אם יש אינדיקציה לכך)
  grouped[key].bookIds.push(entry.bookId);
  grouped[key].returned.push(false); // הנחה: כל הספרים לא הוחזרו עדיין
});

// המר לאובייקטים
const result = Object.values(grouped);

// שמור לקובץ חדש
fs.writeFileSync('borrowed_grouped.json', JSON.stringify(result, null, 2), 'utf8');

console.log('✅ borrowed_grouped.json נוצר בהצלחה.');

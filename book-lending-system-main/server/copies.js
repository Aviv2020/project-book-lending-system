const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data'); // או '../server/data' אם אתה מריץ מבחוץ
const YEARS = fs.readdirSync(DATA_DIR).filter(name => /^\d{4}$/.test(name)); // רק תיקיות של שנים

let totalFixed = 0;

YEARS.forEach(year => {
  const filePath = path.join(DATA_DIR, year, 'books.json');
  if (!fs.existsSync(filePath)) return;

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`שגיאה בקריאת JSON של שנה ${year}:`, e.message);
    return;
  }

  let updated = false;

  raw.forEach(book => {
    if (typeof book.stockCount === 'string') {
      const original = book.stockCount;
      var numeric = parseInt(book.stockCount, 10);
      if (!isNaN(numeric)) {
        if(numeric === 0)
        {
            numeric = 1;
        }
        book.stockCount = numeric;
        updated = true;
        totalFixed++;
        console.log(`📘 שנה ${year} → עודכן ספר: ${book.name} מ-${original} ל-${numeric}`);
      }
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, JSON.stringify(raw, null, 2), 'utf8');
    console.log(`💾 קובץ ${year}/books.json נשמר`);
  }
});

console.log(`\n🎉 הסתיים. עודכנו ${totalFixed} ספרים עם stockCount כמספר.`);

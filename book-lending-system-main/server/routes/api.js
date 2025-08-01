const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', 'data');
const DEFAULT_FILES = ['students', 'books', 'borrowed', 'returned', 'charges'];

const MIN_YEAR = 2026;

// מחזיר את השנה הבאה כ-string (לועזית)
function getNextGregorianYearName(gregorianYearStr) {
  const next = parseInt(gregorianYearStr, 10) + 1;
  return next.toString();
}

// מבטיח שקובץ ריק קיים
function ensureFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]');
  }
}

// יצירת תיקיה + קבצים ריקים אם לא קיימים
function ensureYearStructure(year) {
  const yearPath = path.join(DATA_DIR, year.toString());
  if (!fs.existsSync(yearPath)) {
    fs.mkdirSync(yearPath, { recursive: true });
    DEFAULT_FILES.forEach(name => {
const f = path.join(yearPath, `${name}.json`);
      fs.writeFileSync(f, '[]');
    });
console.log(`📁 נוצרה תיקיית שנה ${year} עם קבצים ריקים`);
  }
}

// נתיב שמחזיר את השנים הזמינות - עכשיו מ- MIN_YEAR ועד השנה הנוכחית + 1 (לפי בקשת הפשטות)
router.get('/availableYears', (req, res) => {
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 1;

  const years = [];
  for (let y = MIN_YEAR; y <= maxYear; y++) {
    years.push(y);
  }
  res.json(years);
});

// פונקציית middleware לוולידציה של השנה
function validateYearAccess(req, res, next) {
  const yearParam = req.params.year;
  if (!yearParam) return res.status(400).send('שנה לא סופקה');

  const year = parseInt(yearParam, 10);
  if (isNaN(year)) return res.status(400).send('שנה לא חוקית');

  if (year < MIN_YEAR) {
    return res.status(403).send("גישה לשנים לפני ${MIN_YEAR} אסורה");
  }

  // אין מגבלת עליונה - ניתן לגשת לכל שנה >= MIN_YEAR

  next();
}

// מחילים את המידלוויר על כל הנתיבים עם :year/:file
router.use('/:year/:file', validateYearAccess);

// GET /api/:year/:file
router.get('/:year/:file', (req, res) => {
  const { year, file } = req.params;

  // ודא שהתיקיה קיימת
  ensureYearStructure(year);

  // ודא שהתיקיה של השנה הבאה קיימת (לא חובה, אפשר להשאיר, זה שימושי לעתיד)
  const nextYear = getNextGregorianYearName(year);
  if (nextYear) ensureYearStructure(nextYear);

const filePath = path.join(DATA_DIR, year, `${file}.json`);
  ensureFileExists(filePath);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('שגיאה בקריאת קובץ');
    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).send('שגיאה בפענוח JSON');
    }
  });
});

// PUT /api/:year/:file
router.put('/:year/:file', (req, res) => {
  const { year, file } = req.params;
  const dirPath = path.join(DATA_DIR, year);
const filePath = path.join(DATA_DIR, year, `${file}.json`);

  fs.mkdir(dirPath, { recursive: true }, err => {
    if (err) return res.status(500).send('שגיאה ביצירת תיקיה');
    fs.writeFile(filePath, JSON.stringify(req.body, null, 2), err => {
      if (err) return res.status(500).send('שגיאה בשמירה');
      res.send('✔️ נשמר בהצלחה');
    });
  });
});

module.exports = router;

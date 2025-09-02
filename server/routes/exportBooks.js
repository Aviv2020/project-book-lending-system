const express = require('express');
const ExcelJS = require('exceljs');
const router = express.Router();
const Book = require('../models/Book'); // מודל ספרים ממונגו

// פונקציית סינון
function matchesFilters(book, filters) {
  const normalize = str => (str || '').trim().replace(/[״"׳"]/g, '');

  const {
    search = '',
    level = '',
    volume = '',
    publisher = '',
    type = '',
    grade = '',
    stockMin,
    stockMax
  } = filters;

  const lowerSearch = search.toLowerCase();

  const values = [
    book.name,
    book.subject,
    book.grade,
    book.level,
    book.volume,
    book.publisher,
    book.type,
    book.note,
    book.price
  ].map(x => (x || '').toLowerCase());

  const matchesSearch = lowerSearch === '' || values.some(v => v.includes(lowerSearch));

  let matchesLevel = true;
  if (level) {
    const levelGroups = {
      "הקבצה א": ["הקבצה א", "הקבצה א ו-א מואצת"],
      "הקבצה א מואצת": ["הקבצה א מואצת", "הקבצה א ו-א מואצת"],
      "הקבצה א ו-א מואצת": ["הקבצה א", "הקבצה א מואצת", "הקבצה א ו-א מואצת"]
    };
    const selectedGroup = levelGroups[normalize(level)] || [normalize(level)];
    matchesLevel = selectedGroup.includes(normalize(book.level));
  }

  const matchesVolume = !volume || normalize(book.volume) === normalize(volume);
  const matchesPublisher = !publisher || (book.publisher || '').toLowerCase().includes(publisher.toLowerCase());
  const matchesType = !type || normalize(book.type) === normalize(type);

  let matchesGrade = true;
  if (grade && grade !== 'all') {
    let allowedGrades;
    if (grade === 'mid') {
      allowedGrades = ['ז', 'ח', 'ט'];
    } else if (grade === 'high') {
      allowedGrades = ['י', 'יא', 'יב'];
    } else {
      allowedGrades = [normalize(grade)];
    }
    const bookGrades = (book.grade || '').split(',').map(g => normalize(g));
    matchesGrade = bookGrades.some(g => allowedGrades.includes(g));
  }

  const stockCount = Number(book.stockCount) || 0;
  let matchesStock = true;
  if (stockMin !== undefined && stockMax !== undefined) {
    matchesStock = stockCount >= Number(stockMin) && stockCount <= Number(stockMax);
  } else if (stockMin !== undefined) {
    matchesStock = stockCount >= Number(stockMin);
  } else if (stockMax !== undefined) {
    matchesStock = stockCount <= Number(stockMax);
  }

  return matchesSearch && matchesLevel && matchesVolume && matchesPublisher && matchesType && matchesGrade && matchesStock;
}

// יצוא ספרים מסוננים ל־Excel
router.get('/', async (req, res) => {
  try {
    const allBooks = await Book.find().lean(); // טעינת כל הספרים מהמונגו
    const books = allBooks.filter(book => matchesFilters(book, req.query));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ספרים מסוננים');

    sheet.columns = [
      { header: 'שם הספר', key: 'name', width: 30 },
      { header: 'מקצוע', key: 'subject', width: 20 },
      { header: 'שכבת גיל', key: 'grade', width: 15 },
      { header: 'רמת לימוד', key: 'level', width: 15 },
      { header: 'כרך', key: 'volume', width: 10 },
      { header: 'שם הוצאה', key: 'publisher', width: 20 },
      { header: 'סוג', key: 'type', width: 15 },
      { header: 'כמות במלאי', key: 'stockCount', width: 15 },
      { header: 'הערות', key: 'note', width: 30 },
      { header: 'מחיר', key: 'price', width: 10 },
    ];

    // עיצוב כותרות
    const headerRow = sheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      cell.alignment = { horizontal: 'center' };
    });

    // הוספת נתונים
    books.forEach(book => {
      sheet.addRow({
        name: book.name || '',
        subject: book.subject || '',
        grade: book.grade || '',
        level: book.level || '',
        volume: book.volume || '',
        publisher: book.publisher || '',
        type: book.type || '',
        stockCount: Number(book.stockCount) || 0,
        note: book.note || '',
        price: Number(book.price) || 50
      });
    });

    // עיצוב תוכן
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        if (rowNumber === 1) return; // אל תשנה כותרות
        if (colNumber === 1) {
          cell.alignment = { horizontal: 'right' };
        } else {
          cell.alignment = { horizontal: 'center' };
        }
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=filtered_books.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('❌ שגיאה ביצוא ספרים:', err);
    res.status(500).json({ error: 'שגיאה ביצוא ספרים' });
  }
});

module.exports = router;

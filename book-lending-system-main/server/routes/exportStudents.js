// routes/exportStudents.js
const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');

// ✅ מודלים
const Student = require('../models/Student');
const Borrowed = require('../models/Borrowed');
const Book = require('../models/Book');
const Charge = require('../models/Charge');

router.post('/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);

    // שליפת כל התלמידים לשנה
    const students = await Student.find({ year });

    // שליפת כל ההשאלות, הספרים והחיובים מראש כדי למנוע שאילתות מרובות
    const borrowed = await Borrowed.find({ year });
    const books = await Book.find({ year });
    const charges = await Charge.find({ year });

    // הכנה ל־lookup מהיר
    const booksMap = new Map(books.map(b => [b.id, b]));
    const chargesByStudent = new Map();
    charges.forEach(c => {
      if (!chargesByStudent.has(c.studentId)) {
        chargesByStudent.set(c.studentId, []);
      }
      chargesByStudent.get(c.studentId).push(c);
    });

    // בניית רשומות לאקסל
    const rows = students.map(student => {
      const studentCharges = chargesByStudent.get(student.id) || [];
      const chargedBorrowIds = new Set(
        studentCharges.filter(c => !c.paid).map(c => c.borrowId)
      );

      // ספרים מושאלים שלא הוחזרו ולא חויבו
      const borrowedBooks = borrowed
        .filter(b => b.studentId === student.id && Array.isArray(b.bookIds) && Array.isArray(b.returned))
        .flatMap(b =>
          b.bookIds.map((bookId, idx) => {
            if (b.returned[idx]) return null;
            if (chargedBorrowIds.has(b.id)) return null;
            const book = booksMap.get(bookId);
            if (!book) return null;
            return `${book.name} (${book.subject})`;
          }).filter(Boolean)
        ).join(', ') || "אין";

      // ספרים שחויבו ולא שולמו
      const unpaidCharges = studentCharges.filter(c => !c.paid);
      const chargedBooks = unpaidCharges.map(c => `${c.bookName} (${c.type})`).join(', ') || "אין";

      const totalDebt = unpaidCharges.length * 50;

      return {
        name: student.name,
        id: student.id,
        school: student.school,
        classroom: student.classroom,
        inLoanProject: student.inLoanProject ? "כן" : "לא",
        borrowedBooks,
        chargedBooks,
        totalDebt
      };
    });

    // בניית אקסל
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('תלמידים');

    const headers = [
      { header: 'שם מלא', key: 'name' },
      { header: 'תעודת זהות', key: 'id' },
      { header: 'בית ספר', key: 'school' },
      { header: 'כיתה', key: 'classroom' },
      { header: 'משתתף בפרויקט השאלת ספרים', key: 'inLoanProject' },
      { header: 'ספרים שהושאלו', key: 'borrowedBooks' },
      { header: 'ספרים שחויבו', key: 'chargedBooks' },
      { header: 'חוב כולל (₪)', key: 'totalDebt' }
    ];

    sheet.columns = headers.map(h => ({
      header: h.header,
      key: h.key,
      width: h.header.length + 5
    }));

    rows.forEach(student => {
      student.totalDebt = parseFloat(student.totalDebt) || 0;
      sheet.addRow(student);
    });

    // עיצוב כותרות
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF007BFF' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=filtered-students.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("❌ שגיאה ביצוא תלמידים:", err);
    res.status(500).json({ error: "שגיאה ביצוא תלמידים", details: err.message });
  }
});

module.exports = router;

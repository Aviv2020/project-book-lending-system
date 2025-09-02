const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const Volunteer = require('../models/Volunteer');  // מודל המתנדבים

router.get('/', async (req, res) => {
  try {
    const volunteers = await Volunteer.find().lean();

    // אגרגציה של כל המתנדבים
    const aggregatedVolunteers = aggregateVolunteers(volunteers);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('מתנדבים');

    const headers = [
      { header: 'שם מלא', key: 'name' },
      { header: 'בית ספר', key: 'school' },
      { header: 'כיתה', key: 'class' },
      { header: 'תאריכים', key: 'dates' },
      { header: 'שעות התנדבות', key: 'totalHours' },
      { header: 'הערות', key: 'notes' }
    ];

    sheet.columns = headers.map(h => ({
      header: h.header,
      key: h.key,
      width: h.header.length + 5
    }));

    aggregatedVolunteers.forEach(volunteer => {
      sheet.addRow({
        name: volunteer.name,
        school: volunteer.school,
        class: volunteer.class,
        dates: volunteer.dates.join(', '),
        totalHours: volunteer.totalHours,
        notes: (volunteer.notes || []).join('; ')
      });
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

    // יישור עמודות
    sheet.getColumn(1).eachCell((cell, row) => {
      if (row !== 1) cell.alignment = { horizontal: 'right' };
    });
    for (let i = 2; i <= headers.length; i++) {
      sheet.getColumn(i).eachCell((cell, row) => {
        if (row !== 1) cell.alignment = { horizontal: 'center' };
      });
    }

    // התאמת רוחב
    sheet.columns.forEach(column => {
      let maxLength = column.header.length;
      column.eachCell({ includeEmpty: true }, cell => {
        const value = cell.value ? cell.value.toString() : '';
        if (value.length > maxLength) maxLength = value.length;
      });
      column.width = maxLength + 2;
    });

    // שליחה
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=volunteers.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('❌ שגיאה ביצוא מתנדבים:', err);
    res.status(500).json({ error: 'שגיאה ביצוא מתנדבים' });
  }
});

// פונקציה לאגרגציה של נתוני מתנדבים
function aggregateVolunteers(volunteers) {
  const aggregated = {};

  volunteers.forEach(volunteer => {
    const { name, school, class: classroom, dates = [], timeRanges = [], notes } = volunteer;

    if (!aggregated[name]) {
      aggregated[name] = {
        name,
        school,
        class: classroom,
        dates: [],
        totalHours: 0,
        notes: []
      };
    }

    // תאריכים
    aggregated[name].dates.push(...dates);

    // חישוב שעות מה־timeRanges
    timeRanges.forEach(range => {
      const [start, end] = range.split(' - ');
      aggregated[name].totalHours += calculateVolunteerHours(start, end);
    });

    // הערות
    if (notes) aggregated[name].notes.push(notes);
  });

  return Object.values(aggregated);
}

// מחשב שעות מתוך טווח
function calculateVolunteerHours(startTime, endTime) {
  const start = new Date(`1970-01-01T${startTime}:00Z`);
  const end = new Date(`1970-01-01T${endTime}:00Z`);
  const diffInMs = end - start;
  return diffInMs > 0 ? diffInMs / (1000 * 60 * 60) : 0;
}

module.exports = router;

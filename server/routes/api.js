// routes/api.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// סאב-ראוטרים מיוחדים
router.use('/exportBooks', require('./exportBooks'));
router.use('/exportStudents', require('./exportStudents'));
router.use('/export-volunteers', require('./exportVolunteers'));
router.use('/email', require('./email'));
const mongoose = require('mongoose');
// ✅ מודלים
const Student = require('../models/Student');
const Book = require('../models/Book');
const Borrowed = require('../models/Borrowed');
const Returned = require('../models/Returned');
const Charge = require('../models/Charge');
const Volunteer = require('../models/Volunteer');
const Cluster = require('../models/Cluster');
const Address = require('../models/Address'); // 📍 Address model

// שנה מינימלית לשימוש
const MIN_YEAR = 2026;

/* ===========================
   📍 פונקציונליות כתובות
   =========================== */

// שליפה של כל הכתובות
router.get('/addresses', async (req, res) => {
  try {
    const addresses = await Address.find({});
    res.json(addresses);
  } catch (err) {
    console.error("❌ address list error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// הוספת כתובת חדשה
router.post('/addresses', async (req, res) => {
  try {
    const { title, lat, lng } = req.body;
    const result = await Address.create({ title, lat, lng });
    res.json(result);
  } catch (err) {
    console.error("❌ address save error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// מחיקה לפי _id
router.delete('/addresses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Address.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ error: "Address not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ address delete error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

/* ===========================
   Middleware – בדיקת שנה חוקית
   =========================== */
function validateYearAccess(req, res, next) {
  const yearParam = req.params.year;
  if (!yearParam) return res.status(400).json({ error: 'שנה לא סופקה' });

  const year = parseInt(yearParam, 10);
  if (isNaN(year)) return res.status(400).json({ error: 'שנה לא חוקית' });

  if (year < MIN_YEAR) {
    return res.status(403).json({ error: `גישה לשנים לפני ${MIN_YEAR} אסורה` });
  }

  req.year = year;
  next();
}

router.use('/:year/:collection', validateYearAccess);

/* ===========================
   CRUD לפי שנה/קולקציה
   =========================== */

// 🔹 GET /:year/:collection
router.get('/:year/:collection', async (req, res) => {
  try {
    const { year, collection } = req.params;
    const Model = getModel(collection);

    if (!Model) return res.json([]);

    const data = await Model.find({ year });
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'שגיאה בשליפת נתונים',
      details: err.message
    });
  }
});

// 🔹 POST /:year/:collection
router.post('/:year/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const year = req.year;
    const Model = getModel(collection);

    const data = { ...req.body, year };
    if (!data.id) data.id = uuidv4();

    const doc = new Model(data);
    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error("❌ שגיאה ביצירת מסמך:", err);
    res.status(400).json({ error: 'שגיאה ביצירת מסמך חדש', details: err.message });
  }
});

// 🔹 PUT /:year/:collection/:id
// 🔹 PUT /:year/:collection/:id
router.put('/:year/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const year = req.year;
    const Model = getModel(collection);

    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      // אם זה _id חוקי של מונגו
      query = { _id: id, year };
    } else {
      // אחרת נניח שזה ה־UUID שלך
      query = { id, year };
    }

    const updated = await Model.findOneAndUpdate(
      query,
      { ...req.body, year },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'לא נמצא לעדכון' });
    res.json(updated);
  } catch (err) {
    console.error("❌ שגיאה בעדכון מסמך:", err);
    res.status(500).json({ error: 'שגיאה בעדכון מסמך', details: err.message });
  }
});

// 🔹 PUT /:year/:collection (החלפת קולקציה)
router.put('/:year/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const year = req.year;
    const Model = getModel(collection);
    const data = req.body;

    if (!Array.isArray(data)) return res.status(400).json({ error: 'המידע חייב להיות מערך' });

    await Model.deleteMany({ year });
    const inserted = await Model.insertMany(
      data.map(d => ({ ...d, year, id: d.id || uuidv4() }))
    );

    res.json({ success: true, count: inserted.length });
  } catch (err) {
    console.error("❌ שגיאה בהחלפת הקולקציה:", err);
    res.status(500).json({ error: 'שגיאה בהחלפת הקולקציה', details: err.message });
  }
});

// 🔹 DELETE /:year/:collection/:id
router.delete('/:year/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const year = req.year;
    const Model = getModel(collection);

    const deleted = await Model.findOneAndDelete({ id, year });
    if (!deleted) return res.status(404).json({ error: 'לא נמצא למחיקה' });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ שגיאה במחיקה:", err);
    res.status(500).json({ error: 'שגיאה במחיקה', details: err.message });
  }
});

// 🔹 DELETE /:year/:collection (מחיקה מרובה)
router.delete('/:year/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const year = req.year;
    const Model = getModel(collection);

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'חסר מערך ids למחיקה' });
    }

    const result = await Model.deleteMany({ year, id: { $in: ids } });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error("❌ שגיאה במחיקה מרובה:", err);
    res.status(500).json({ error: 'שגיאה במחיקה מרובה', details: err.message });
  }
});

/* ===========================
   🔹 GET /availableYears
   =========================== */
router.get('/availableYears', (req, res) => {
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 1;
  const years = [];
  for (let y = MIN_YEAR; y <= maxYear; y++) years.push(y);
  res.json(years);
});

/* ===========================
   פונקציה פנימית – התאמת collection למודל
   =========================== */
function getModel(collection) {
  switch (collection) {
    case 'students': return Student;
    case 'books': return Book;
    case 'borrowed': return Borrowed;
    case 'returned': return Returned;
    case 'charges': return Charge;
    case 'volunteers': return Volunteer;
    case 'clusters': return Cluster;
    case 'Address':
    case 'addresses': return Address; // ✅ תמיכה גם בקטן וגם בגדול
    default: return null;
  }
}

/* ===========================
   🔹 סטטיסטיקות
   =========================== */
router.get('/:year/stats/:type', async (req, res) => {
  try {
    const { year, type } = req.params;

    if (type === 'studentsBySchool') {
      const result = await Student.aggregate([
        { $match: { year: parseInt(year) } },
        { $group: { _id: "$school", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      return res.json(result);
    }

    if (type === 'studentsByClass') {
      const result = await Student.aggregate([
        { $match: { year: parseInt(year) } },
        { $group: { _id: "$classroom", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      return res.json(result);
    }

    if (type === 'booksBySubject') {
      const result = await Book.aggregate([
        { $match: { year: parseInt(year) } },
        { $group: { _id: "$subject", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      return res.json(result);
    }

    if (type === 'booksByType') {
      const result = await Book.aggregate([
        { $match: { year: parseInt(year) } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      return res.json(result);
    }

    res.status(400).json({ error: "Unknown stats type" });
  } catch (err) {
    console.error("❌ Stats error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;

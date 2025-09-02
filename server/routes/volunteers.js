const express = require('express');
const router = express.Router();
const Volunteer = require('../models/Volunteer'); // המודל שלך

// שליפת כל המתנדבים
router.get('/volunteers', async (req, res) => {
  try {
    const volunteers = await Volunteer.find().lean();
    res.json(volunteers);
  } catch (err) {
    console.error('❌ שגיאה בשליפת מתנדבים מהמסד:', err);
    res.status(500).json({ error: 'שגיאה בטעינת מתנדבים' });
  }
});

// שליפת מתנדבים לפי שנה (אם תרצה עדיין לסנן)
router.get('/volunteers/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const volunteers = await Volunteer.find({ year }).lean();
    res.json(volunteers);
  } catch (err) {
    console.error('❌ שגיאה בשליפת מתנדבים לפי שנה:', err);
    res.status(500).json({ error: 'שגיאה בטעינת מתנדבים' });
  }
});

module.exports = router;

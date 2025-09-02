const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  year: { type: Number, required: true }, // שנה אקדמית (2026 וכו')
  
  name: { type: String, required: true }, // שם מתנדב
  school: { type: String },               // בית ספר
  class: { type: String },                // כיתה (י2, יב3 וכו')

  dates: { type: [Date], default: [] },   // רשימת תאריכים (YYYY-MM-DD)
  timeRanges: { type: [String], default: [] }, // רשימת טווחי שעות תואמים (07:30 - 12:00)

  totalHours: { type: Number, default: 0 }, // סה"כ שעות מחושבות
  notes: { type: String, default: '' }      // הערות נוספות
}, {
  timestamps: true
});

module.exports = mongoose.model('Volunteer', volunteerSchema, 'volunteers');

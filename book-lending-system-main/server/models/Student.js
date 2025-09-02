const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  year: { type: Number, required: true }, // השנה האקדמית (2026, 2027 וכו')
  name: { type: String, required: true }, // שם מלא
  id: { type: String, required: true, unique: false }, // ת"ז (לא unique כי ייתכן תלמידים עם אותה ת"ז בשנים שונות)
  school: { type: String }, // שם בית ספר
  classroom: { type: String }, // כיתה (למשל יב3)
  inLoanProject: { type: Boolean, default: false }, // משתתף בפרויקט השאלת ספרים
  note: { type: String, default: '' }, // הערות חופשיות
  majors: { type: [String], default: [] }, // מגמות (מערך מחרוזות)
  email: { type: String, default: '' } // מייל (יכול להיות "non")
}, {
  timestamps: true // מוסיף createdAt, updatedAt
});

module.exports = mongoose.model('Student', studentSchema, 'students');

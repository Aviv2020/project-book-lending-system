const mongoose = require('mongoose');

const chargeSchema = new mongoose.Schema({
  year: { type: Number, required: true }, // שנה אקדמית (2026 וכו')

  studentId: { type: String, required: true }, // מזהה תלמיד
  bookId: { type: String, required: true },    // מזהה ספר
  bookName: { type: String, default: '' },     // שם הספר (כדי שיהיה זמין גם בלי lookup)

  type: { type: String, enum: ['lost', 'damaged', 'other'], required: true }, // סוג החיוב
  date: { type: Date, default: Date.now },     // תאריך יצירת החיוב

  paid: { type: Boolean, default: false },     // האם שולם
  borrowId: { type: String }                   // מזהה השאלה קשור
}, {
  timestamps: true
});

module.exports = mongoose.model('Charge', chargeSchema, 'charges');

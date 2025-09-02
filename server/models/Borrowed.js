const mongoose = require('mongoose');

const borrowedSchema = new mongoose.Schema({
  year: { type: Number, required: true }, // השנה האקדמית (2026, 2027 וכו')
  id: { type: String, required: true },   // מזהה ייחודי להשאלה (UUID)
  
  studentId: { type: String, required: true }, // ת"ז של התלמיד
  
  bookIds: { type: [String], required: true }, // מערך מזהי ספרים
  returned: { type: [Boolean], required: true }, // מקביל ל-bookIds, האם הוחזר
  
  date: { type: Date, default: Date.now }, // תאריך השאלה
  signature: { type: String }, // חתימה (Base64 Image)
  
  bulkId: { type: String }, // מזהה פעולה מרוכזת (אם זה היה השאלה קבוצתית)
  borrowerType: { type: String, default: 'student' }, // סוג שואל
  borrowerName: { type: String, default: '' } // שם השואל (אם לא התלמיד עצמו)
}, {
  timestamps: true // מוסיף createdAt, updatedAt
});

module.exports = mongoose.model('Borrowed', borrowedSchema, 'borrowed');

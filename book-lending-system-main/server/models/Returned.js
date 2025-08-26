const mongoose = require('mongoose');

const returnedSchema = new mongoose.Schema({
  year: { type: Number, required: true }, // השנה האקדמית (2026 וכו')
  id: { type: String, required: true },   // מזהה ייחודי להחזרה (UUID)

  // פרטי התלמיד
  student: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    school: { type: String },
    classroom: { type: String },
    inLoanProject: { type: Boolean, default: false }
  },

  // פרטי הספר
  book: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    subject: { type: String },
    grade: { type: String },
    level: { type: String },
    volume: { type: String },
    publisher: { type: String },
    type: { type: String },
    note: { type: String },
    price: { type: String }
  },

  // מועדי ההחזרה
  date: { type: Date, default: Date.now },      // מתי נרשמה ההחזרה
  returnDate: { type: Date },                   // תאריך החזרה בפועל

  signature: { type: String },                  // חתימה (Base64 image)
  bulkId: { type: String },                     // מזהה פעולה מרוכזת

  borrowerType: { type: String, default: 'student' },
  borrowerName: { type: String, default: '' }   // שם השואל/מחזיר
}, {
  timestamps: true // מוסיף createdAt, updatedAt
});

module.exports = mongoose.model('Returned', returnedSchema, 'returned');

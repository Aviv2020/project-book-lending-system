const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  year: { type: Number, required: true }, // השנה האקדמית (2026, 2027 וכו')
  id: { type: String, required: true },   // מזהה ייחודי (UUID או דומה)
  name: { type: String, required: true }, // שם הספר
  subject: { type: String },              // נושא (למשל: ספרות)
  grade: { type: String },                // שכבות לימוד (י, יא, יב)
  level: { type: String },                // רמת לימוד (3 יח"ל, 4 יח"ל, 5 יח"ל, כללי וכו')
  volume: { type: String },               // כרך / יחידה
  publisher: { type: String },            // הוצאה לאור
  type: { type: String },                 // סוג (חוברת פנימית, ספר לימוד וכו')
  note: { type: String, default: '' },    // הערות נוספות
  price: { type: String, default: '50' }, // מחיר (כברירת מחדל 50 אם לא מוגדר)
  stockCount: { type: String, default: '0' } // כמות במלאי
}, {
  timestamps: true // מוסיף createdAt, updatedAt
});

module.exports = mongoose.model('Book', bookSchema, 'books');

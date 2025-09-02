const mongoose = require('mongoose');

const clusterSchema = new mongoose.Schema({
  year: { type: Number, required: true }, // שנה אקדמית (למשל 2025)

  id: { type: String, required: true, unique: true }, // מזהה פנימי של הקלסטר
  name: { type: String, required: true },             // שם הקלסטר (לדוגמה: "מתמטיקה ברמת 5 יח\"ל לשכבה י'")
  
  grades: [{ type: String }],                         // רשימת שכבות רלוונטיות (למשל ["י"])
  bookIds: [{ type: String }]                         // מזהי הספרים ששייכים לקלסטר
}, {
  timestamps: true
});

module.exports = mongoose.model('Cluster', clusterSchema, 'clusters');

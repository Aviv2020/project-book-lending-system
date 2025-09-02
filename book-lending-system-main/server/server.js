const express = require('express');
const path = require('path');
const mongoose = require('mongoose');   // ⬅️ חדש
const app = express();
const apiRoutes = require('./routes/api');
const goolgeMapsRoutes = require('./routes/googleMaps');
require('dotenv').config({ path: path.join(__dirname, '../access.env') });

console.log('🔁 התחלת server.js');

// חיבור ל־MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ DB Connection Error:", err));

// אפשר לקבוע גבול גבוה מאוד, אך לא להסיר אותו לגמרי
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));
console.log('✅ JSON body limit set');

// הגשת קבצים סטטיים מהתיקייה public
app.use(express.static(path.join(__dirname, '../public'), { index: 'login.html' }));

// ניתוב של כל קריאות /api ל־routes/api.js
app.use('/api', apiRoutes);
//קריאות ל googleMaps
app.use('/maps', goolgeMapsRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 השרת פעיל על http://localhost:${PORT}/`);
});

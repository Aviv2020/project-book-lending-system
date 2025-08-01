const express = require('express');
const path = require('path');
const app = express();
const apiRoutes = require('./routes/api');

console.log('🔁 התחלת server.js');

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));
console.log('✅ JSON body limit set');

// הגשת קבצים סטטיים מהתיקייה public
app.use(express.static(path.join(__dirname, '../public'), { index: 'login.html' }));

// ניתוב של כל קריאות /api ל־routes/api.js
app.use('/api', apiRoutes);

const PORT = 3000;
app.listen(PORT, () => {
console.log("🚀 השרת פעיל על http://localhost:${PORT}/");
});

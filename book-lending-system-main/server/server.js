const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');          // ⬅️ חדש
const { Server } = require('socket.io'); // ⬅️ חדש
const app = express();
const apiRoutes = require('./routes/api');
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

// === Socket.IO setup ===
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",   // ⬅️ אם יש דומיין ספציפי ל־Client, תחליף אותו
  }
});

// חיבור לקוח
io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

// === Mongo Change Streams (Borrowed + Returned) ===
const Borrowed = require('./models/Borrowed');
const Returned = require('./models/Returned');

// מאזין לשינויים ב־Borrowed
Borrowed.watch().on('change', (change) => {
  console.log('📢 Borrowed changed:', change);
  io.emit('borrowedChanged', change);
});

// מאזין לשינויים ב־Returned
Returned.watch().on('change', (change) => {
  console.log('📢 Returned changed:', change);
  io.emit('returnedChanged', change);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 השרת פעיל על http://localhost:${PORT}/`);
});

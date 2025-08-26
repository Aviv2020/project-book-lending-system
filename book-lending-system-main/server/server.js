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
const collections = {
  students: require('./models/Student'),
  books: require('./models/Book'),
  borrowed: require('./models/Borrowed'),
  returned: require('./models/Returned'),
  charges: require('./models/Charge'),
  volunteers: require('./models/Volunteer'),
  clusters: require('./models/Cluster')
};

Object.entries(collections).forEach(([name, Model]) => {
  Model.watch().on("change", (change) => {
    console.log(`📢 ${name} changed:`, change);
    io.emit(`${name}Changed`, change); // שולח לכל הלקוחות
  });
});


const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 השרת פעיל על http://localhost:${PORT}/`);
});

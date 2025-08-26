const mongoose = require('mongoose');
require('dotenv').config({ path: '../access.env' }); // ודא שהקובץ access.env קיים ומכיל MONGO_URI

// מודלים
const Borrowed = require('./models/Borrowed');
const Returned = require('./models/Returned');

async function clearCollections() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // מחיקת כל המסמכים
    const borrowedResult = await Borrowed.deleteMany({});
    const returnedResult = await Returned.deleteMany({});

    console.log(`🗑️ נמחקו ${borrowedResult.deletedCount} מסמכים מ-borrowed`);
    console.log(`🗑️ נמחקו ${returnedResult.deletedCount} מסמכים מ-returned`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ שגיאה:", err);
  }
}

clearCollections();

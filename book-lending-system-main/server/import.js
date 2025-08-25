const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// טעינת קובץ access.env שנמצא מחוץ ל-server/
require('dotenv').config({ path: path.join(__dirname, '../access.env') });

// חיבור ל־MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ DB Connection Error:", err));

const dataDir = path.join(__dirname, 'data', '2026');

// רשימת הקבצים והקולקציות המתאימות
const collections = {

  students: 'students.json'

};

async function importData() {
  try {
    for (const [collection, fileName] of Object.entries(collections)) {
      const filePath = path.join(dataDir, fileName);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ File not found: ${filePath}`);
        continue;
      }

      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // מחיקת נתונים ישנים באוסף לפני הכנסת החדשים
      await mongoose.connection.collection(collection).deleteMany({});
      console.log(`🗑️ Cleared old data from '${collection}'`);

      // הכנסת נתונים חדשים
      if (jsonData.length > 0) {
        const result = await mongoose.connection.collection(collection).insertMany(jsonData);
        console.log(`📥 Imported ${result.insertedCount} documents into '${collection}'`);
      } else {
        console.log(`⚠️ No data found in ${fileName}`);
      }
    }
  } catch (err) {
    console.error("❌ Error importing data:", err);
  } finally {
    mongoose.disconnect();
  }
}

importData();

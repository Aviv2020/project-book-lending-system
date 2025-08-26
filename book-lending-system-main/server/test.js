const { logAction } = require("./sheetLogger");

(async () => {
  const now = new Date().toLocaleString("he-IL");
  await logAction("333599611", "אביב בן עמר", "מקראה בספרות", "בדיקת חיבור", now);
})();

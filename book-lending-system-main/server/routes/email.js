const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { sendFirstBorrowMail } = require('../utils/emailTemplates');

// הגדר את החשבון שדרכו תשלח המיילים
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'booklendingsystem@gmail.com',
    pass: 'snwu edog booa teqj'
  }
});

// שליחת מייל רגיל (טקסט פשוט)
router.post('/send', async (req, res) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'שדות חובה חסרים (to, subject, text)' });
  }

  if (to === 'non') {
    console.log('📭 לא נשלח מייל כי הכתובת היא non');
    return res.json({ success: false, message: 'כתובת מייל non - מייל לא נשלח' });
  }

  try {
    await transporter.sendMail({
      from: '"Book Lending System" <booklendingsystem@gmail.com>',
      to,
      subject,
      text
    });

    res.json({ success: true, message: '✔️ מייל נשלח בהצלחה' });
  } catch (error) {
    console.error('❌ שגיאה בשליחת מייל:', error);
    res.status(500).json({ error: 'שגיאה בשליחת המייל' });
  }
});

// שליחת מייל HTML מעוצב להשאלה ראשונה
router.post('/sendFirstBorrow', async (req, res) => {
  const { email, name, date, books } = req.body;

  if (!email || !name || !date || !Array.isArray(books)) {
    return res.status(400).json({ error: 'שדות חובה חסרים (email, name, date, books)' });
  }

  if (email === 'non') {
    console.log('📭 לא נשלח מייל כי הכתובת היא non');
    return res.json({ success: false, message: 'כתובת מייל non - מייל לא נשלח' });
  }

  try {
    await sendFirstBorrowMail({ to: email, name, date, books });
    res.json({ success: true, message: '✔️ מייל HTML נשלח בהצלחה' });
  } catch (error) {
  console.error('❌ שגיאה בשליחת מייל עדכון:', error.message);
  console.error('📄 Stack:', error.stack);
  console.error('📦 Error Object:', JSON.stringify(error, null, 2));
  res.status(500).json({ error: 'שגיאה בשליחת מייל העדכון' });
}

});


const { sendFollowUpBorrowMail } = require('../utils/emailTemplates');

// שליחת מייל HTML מעוצב לעדכון השאלה (לא ראשונית)
router.post('/sendFollowUpBorrow', async (req, res) => {
  const { email, name, books } = req.body;

  if (!email || !name || !Array.isArray(books)) {
    return res.status(400).json({ error: 'שדות חובה חסרים (email, name, books)' });
  }

  if (email === 'non') {
    console.log('📭 לא נשלח מייל כי הכתובת היא non');
    return res.json({ success: false, message: 'כתובת מייל non - מייל לא נשלח' });
  }

  try {
 await sendFollowUpBorrowMail({ to: email, name, books });


    res.json({ success: true, message: '✔️ מייל עדכון נשלח בהצלחה' });
  } catch (error) {
  console.error('❌ שגיאה בשליחת מייל עדכון:', error.message);
  console.error('📄 Stack:', error.stack);
  console.error('📦 Error Object:', JSON.stringify(error, null, 2));
  res.status(500).json({ error: 'שגיאה בשליחת מייל העדכון' });
}

});

module.exports = router;

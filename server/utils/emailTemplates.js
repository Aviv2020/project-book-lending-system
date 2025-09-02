const nodemailer = require('nodemailer');
const path = require('path');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'booklendingsystem@gmail.com',
    pass: 'snwu edog booa teqj'
  }
});

async function sendFirstBorrowMail({ to, name, date, books }) {
  if (!to || to === 'non') return;

  const bookList = books.map(book => `<li>${book}</li>`).join('');

  const html = `
  <div dir="rtl" style="font-family: 'Segoe UI', sans-serif; background-color: #f6f6f6; padding: 20px; text-align: right;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); overflow: hidden;">
      <div style="background-color: #004080; padding: 20px; text-align: center;">
        <img src="cid:katzirLogo" alt="לוגו קציר" style="height: 60px;" />
      </div>

      <div style="background-color: #e0efff; padding: 15px 30px;">
        <h2 style="margin: 0; color: #004080; font-size: 20px;">📘 השאלת ספרים ראשונית לתלמיד ${name}</h2>
      </div>

      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #444;">
          שלום ${name},<br/><br/>
          השאלת הספרים שלך לשנת הלימודים תשפ"ו בתאריך <strong>${date}</strong> התקבלה בהצלחה!
        </p>

        <p style="font-size: 15px;">להלן רשימת הספרים המושאלים:</p>

        <ul style="padding-right: 20px; color: #333; font-size: 16px;">
          ${bookList}
        </ul>

        <p style="margin-top: 30px; font-size: 15px; color: #444;">
          בברכה<span style="display:none">‎</span>,<br/>
          צוות פרויקט השאלת הספרים<br/>
          <span style="font-size: 12px; color: #888;">מזהה: ${Math.floor(Math.random() * 100000)}</span>
        </p>

        <p style="font-size: 1px; color: #ffffff;">&nbsp;</p>
      </div>
    </div>
  </div>
  `;

  await transporter.sendMail({
    from: '"Book Lending System" <booklendingsystem@gmail.com>',
    to,
    subject: `השאלת ספרים – ${name}`,
    html,
    attachments: [{
      filename: 'katzir-logo.jpeg',
      path: path.join(__dirname, '..', '..', 'public', 'katzir-logo.jpeg'),
      cid: 'katzirLogo'
    }]
  });
}

async function sendFollowUpBorrowMail({ to, name, books }) {
  if (!to || to === 'non') return;

  const bookList = books.map(book => `<li>${book}</li>`).join('');

  const html = `
  <div dir="rtl" style="font-family: 'Segoe UI', sans-serif; background-color: #f6f6f6; padding: 20px; text-align: right;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); overflow: hidden;">
      <div style="background-color: #004080; padding: 20px; text-align: center;">
        <img src="cid:katzirLogo" alt="לוגו קציר" style="height: 60px;" />
      </div>

      <div style="background-color: #e0efff; padding: 15px 30px;">
        <h2 style="margin: 0; color: #004080; font-size: 20px;">📚 עדכון ספרים מושאלים לתלמיד ${name}</h2>
      </div>

      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #444;">
          שלום ${name},<br/><br/>
          להלן רשימת הספרים המעודכנים שכרגע נמצאים ברשותך כמושאלים:
        </p>

        <ul style="padding-right: 20px; color: #333; font-size: 16px;">
          ${bookList}
        </ul>

        <p style="margin-top: 30px; font-size: 15px; color: #444;">
          בברכה<span style="display:none">‎</span>,<br/>
          צוות פרויקט השאלת הספרים<br/>
          <span style="font-size: 12px; color: #888;">מזהה: ${Math.floor(Math.random() * 100000)}</span>
        </p>

        <p style="font-size: 1px; color: #ffffff;">&nbsp;</p>
      </div>
    </div>
  </div>
  `;

  await transporter.sendMail({
    from: '"Book Lending System" <booklendingsystem@gmail.com>',
    to,
    subject: `📚 עדכון ספרים מושאלים עבור ${name}`,
    html,
    attachments: [{
      filename: 'katzir-logo.jpeg',
      path: path.join(__dirname, '..', '..', 'public', 'katzir-logo.jpeg'),
      cid: 'katzirLogo'
    }]
  });
}

module.exports = {
  sendFirstBorrowMail,
  sendFollowUpBorrowMail
};

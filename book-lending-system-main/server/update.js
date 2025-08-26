const nodemailer = require('nodemailer');

async function testMail() {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'booklendingsystem@gmail.com',
      pass: 'snwu edog booa teqj'
    }
  });

  let info = await transporter.sendMail({
    from: '"Book Lending System" <booklendingsystem@gmail.com>',
    to: 'avivbenamar@gmail.com',
    subject: 'בדיקת מערכת',
    text: 'האם ההודעה הזאת הגיעה?'
  });

  console.log('✅ נשלח:', info.messageId);
}

testMail().catch(console.error);

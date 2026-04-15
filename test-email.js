const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ahmed@theagentfactory.io',
    pass: 'gbcxdgedxqtkiarn'  // No spaces!
  }
});

transporter.sendMail({
  from: 'The Agent Factory <ahmed@theagentfactory.io>',
  to: 'ahmedkhokhar082@gmail.com',
  subject: 'Test Email',
  text: 'If you receive this, email is working!'
}, (error, info) => {
  if (error) {
    console.error('❌ Failed:', error.message);
  } else {
    console.log('✅ Sent:', info.messageId);
  }
});
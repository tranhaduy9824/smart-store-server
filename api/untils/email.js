const nodemailer = require('nodemailer');

const sendEmail = (email, link) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD_EMAIL
        }
    });
    const mailOptions = {
        from: 'youremail@gmail.com',
        to: email,
        subject: 'Password reset',
        text: link
    };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = sendEmail;
/**
 * @author slow_bear
 * @fileoverview Send verification email
 */
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const EMAIL_CONTENT_PATH = 'public/welcome.html';
const EMAIL_SUBJECT = 'Blay 이메일 주소 인증 요청';
const EMAIL_AUTH_URI = 'signup/authenticated';

const injectDataToEmail = (template, vars = {}) => {
  const fileContent = fs.readFileSync(template, 'utf8');
  let finalTemplate = fileContent;
  Object.keys(vars).forEach((key) => {
    const regex = new RegExp(`{${key}}`, 'g');
    finalTemplate = finalTemplate.replace(regex, vars[key]);
  });

  return finalTemplate;
};

const sendVerificationEmail = async (email) => {
  const emailPath = path.join(__dirname, EMAIL_CONTENT_PATH);
  const content = injectDataToEmail(emailPath, {
    completeJoinUrl: `${process.env.HOST_FRONT_URL}/${EMAIL_AUTH_URI}`,
  });
  try {
    await nodemailer
      .createTransport({
        service: process.env.GMAIL_SERVICE,
        host: process.env.GMAIL_HOST,
        port: 456,
        secure: true,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD,
        },
      })
      .sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: EMAIL_SUBJECT,
        html: content,
      });
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  sendVerificationEmail,
};

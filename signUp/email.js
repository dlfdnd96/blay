/**
 * @author slow_bear
 * @fileoverview Send verification email
 */
const nodemailer = require('nodemailer');
const path = require('path');
const mjmlUtils = require('mjml-utils');

const EMAIL_CONTENT_PATH = 'public/welcome.html';
const EMAIL_SUBJECT = 'Blay 이메일 주소 인증 요청';
const EMAIL_AUTH_URI = 'authenticated';

const sendVerificationEmail = async (email) => {
  const emailPath = path.join(__dirname, EMAIL_CONTENT_PATH);
  let content = '';
  if (process.env.NODE_ENV === 'production') {
    content = await mjmlUtils.inject(emailPath, {
      completeJoinUrl: `${process.env.PRODUCTION_HOST_FRONT_URL}/${EMAIL_AUTH_URI}`,
    });
  } else {
    content = await mjmlUtils.inject(emailPath, {
      completeJoinUrl: `${process.env.TEST_HOST_FRONT_URL}/${EMAIL_AUTH_URI}`,
    });
  }

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

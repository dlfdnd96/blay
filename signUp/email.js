/**
 * @author slow_bear
 * @version 1.0
 * @fileoverview Send verification email
 * @requires nodemailer
 */
const nodemailer = require('nodemailer');

const GetHostName = (nodeEnv) => {
  if (nodeEnv === 'production') {
    return process.env.PRODUCTION_HOST_URL;
  }
  if (nodeEnv === 'test') {
    return process.env.TEST_HOST_URL;
  }
  return process.env.LOCAL_HOST_URL;
};
/**
 * Setting up verification email and send it
 * @requires nodemailer
 * @param {string} email Plan text email
 * @param {string} emailToken Verification url
 * @returns {Promise} Sending email info or error
 */
const sendVerificationEmail = async (email, emailToken) => {
  const hostName = GetHostName(process.env.NODE_ENV);
  try {
    // TODO: 어쩌면 HTTPS로 바꿔야 할 수도?
    await nodemailer
      .createTransport({
        service: process.env.GMAIL_SERVICE,
        host: process.env.GMAIL_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD,
        },
      })
      .sendMail({
        // FIXME: 인증 이메일 html로 바꾸기
        from: process.env.GMAIL_USER,
        to: email,
        subject: '테스트 메일',
        html: `<p> 테스트 메일 입니다 </p><br> <a href="${hostName}/auth/email/${emailToken}?user=${email}">이메일 인증하기</a>`,
      });
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  sendVerificationEmail,
};

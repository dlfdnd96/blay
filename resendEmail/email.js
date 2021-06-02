/**
 * @author slow_bear
 * @fileoverview Send email
 */
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const VERIFICATION_EMAIL_CONTENT_PATH = 'public/welcome.html';
const PASSWORD_RESET_EMAIL_CONTENT_PATH = 'public/reset_password.html';
const VERIFICATION_EMAIL_SUBJECT = 'Blay 이메일 주소 인증 요청';
const PASSWORD_RESET_EMAIL_SUBJECT = 'Blay 패스워드 수정 인증 요청';
const PASSWORD_RESET_CATEGORY = 'reset_password';
const EMAIL_AUTH_URI = 'signup/authenticated';
const EMAIL_SET_PASSWORD_URI = 'set-password';

const injectDataToEmail = (template, vars = {}) => {
  const fileContent = fs.readFileSync(template, 'utf8');
  let finalTemplate = fileContent;
  Object.keys(vars).forEach((key) => {
    const regex = new RegExp(`{${key}}`, 'g');
    finalTemplate = finalTemplate.replace(regex, vars[key]);
  });

  return finalTemplate;
};

const bindURLValueToEmailVerificationHTML = (emailPath) => {
  const content = injectDataToEmail(emailPath, {
    completeJoinUrl: `${process.env.HOST_FRONT_URL}/${EMAIL_AUTH_URI}`,
  });
  return content;
};

const bindURLValueToResetPasswordHTML = (emailPath) => {
  const content = injectDataToEmail(emailPath, {
    findPasswordUrl: `${process.env.HOST_FRONT_URL}/${EMAIL_SET_PASSWORD_URI}`,
  });
  return content;
};

/**
 * Send email
 * @param {string} email Plane email text
 * @param {string} category Plane email category text
 * @returns {Array} Processing result
 */
const sendEmail = async (email, category) => {
  const emailSubject = category === PASSWORD_RESET_CATEGORY
    ? PASSWORD_RESET_EMAIL_SUBJECT
    : VERIFICATION_EMAIL_SUBJECT;
  const filePath = category === PASSWORD_RESET_CATEGORY
    ? PASSWORD_RESET_EMAIL_CONTENT_PATH
    : VERIFICATION_EMAIL_CONTENT_PATH;
  const result = [];
  try {
    const emailPath = path.join(__dirname, filePath);
    let content = '';
    if (category === PASSWORD_RESET_CATEGORY) {
      content = await bindURLValueToResetPasswordHTML(emailPath);
    } else {
      content = await bindURLValueToEmailVerificationHTML(emailPath);
    }

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
        subject: emailSubject,
        html: content,
      });
  } catch (error) {
    result.push(500, 'INTERNAL_SERVER_ERROR', error.message, 901);
    return result;
  }

  return result;
};

module.exports = {
  sendEmail,
};

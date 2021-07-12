/**
 * @author slow_bear
 * @fileoverview Send email
 */
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

const HOST_FRONT_URL = process.env.HOST_FRONT_URL as string;

const EMAIL_SET_PASSWORD_URI = 'login/set-password';

const DATA = {
  subject: 'PlayBus 패스워드 수정 인증 요청',
  contentPath: 'public/reset_password.html',
};

const injectDataToEmail = (
  template: string,
  vars = {} as Record<string, string>,
) => {
  const fileContent = fs.readFileSync(template, 'utf8');

  let finalTemplate = fileContent;
  Object.keys(vars).forEach((key) => {
    const regex = new RegExp(`{${key}}`, 'g');
    finalTemplate = finalTemplate.replace(regex, vars[key]);
  });

  return finalTemplate;
};

/**
 * Send email
 * @param {string} email Plane email text
 * @param {string} category Plane email category text
 * @returns {Array} Processing result
 */
const sendEmail = async (email: string, nickname = ''): Promise<nodemailer.SentMessageInfo> => {
  const emailPath = path.join(__dirname, DATA.contentPath);

  const userId = (nickname === '') ? email.split('@')[0] : nickname;
  const content = injectDataToEmail(emailPath, {
    findPasswordUrl: `${HOST_FRONT_URL}/${EMAIL_SET_PASSWORD_URI}/${email}`,
    userId,
  });

  const result = await nodemailer
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
      subject: DATA.subject,
      html: content,
    });

  return result;
};

export default sendEmail;

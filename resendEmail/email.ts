/**
 * @author slow_bear
 * @fileoverview Send email
 */
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { mysql } from '../database';

const HOST_FRONT_URL = process.env.HOST_FRONT_URL as string;

const EMAIL_AUTH_URI = 'signup/authenticated';
const EMAIL_SET_PASSWORD_URI = 'login/set-password';

const PASSWORD_RESET = {
  subject: 'PlayBus 패스워드 수정 인증 요청',
  contentPath: 'public/reset_password.html',
};

const VERIFICATION_EMAIL = {
  subject: 'PlayBus 이메일 주소 인증 요청',
  contentPath: 'public/welcome.html',
};

export const CATEGORY = {
  PASSWORD_RESET,
  VERIFICATION_EMAIL,
};

export type ResendEmailCategory = keyof typeof CATEGORY;

const getUserNicknameByEmailQuery = `SELECT nickname
 FROM Accounts
 WHERE email = ?`;

const getUserNicknameByEmail = async (email: string) => {
  interface QueryResult {
    nickname: string | null | undefined;
  }
  const selectQueryResult: QueryResult[] | [] = await mysql.query(
    getUserNicknameByEmailQuery,
    email,
  );

  return selectQueryResult[0]?.nickname;
};

const injectDataToEmail = (template: string, vars = {} as Record<string, string>) => {
  const fileContent = fs.readFileSync(template, 'utf8');

  let finalTemplate = fileContent;
  Object.keys(vars).forEach((key) => {
    const regex = new RegExp(`{${key}}`, 'g');
    finalTemplate = finalTemplate.replace(regex, vars[key]);
  });

  return finalTemplate;
};

const bindUrlToHtml = async (emailPath: string, email: string) => {
  const nickname = await getUserNicknameByEmail(email);

  const userId = nickname || email.split('@')[0];
  const content = injectDataToEmail(emailPath, {
    completeJoinUrl: `${HOST_FRONT_URL}/${EMAIL_AUTH_URI}`,
    findPasswordUrl: `${HOST_FRONT_URL}/${EMAIL_SET_PASSWORD_URI}`,
    userId,
  });

  return content;
};

/**
 * Send email
 * @param {string} email Plane email text
 * @param {string} category Plane email category text
 * @returns {Array} Processing result
 */
export const sendEmail = async (email: string, category: ResendEmailCategory) => {
  const data = CATEGORY[category];

  const emailPath = path.join(__dirname, data.contentPath);

  const content = await bindUrlToHtml(emailPath, email);

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
      subject: data.subject,
      html: content,
    });

  return result;
};

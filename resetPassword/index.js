/**
 * @author slow_bear
 * @version 1.0
 * @fileoverview Processing password reset and sending password reset email
 * @requires bcrypt
 * @requires module:database/mysql
 * @requires module:Email
 * @requires module:Shared/utils/emailRegex
 */
const bcrypt = require('bcrypt');

const Email = require('./Email');
const mysql = require('../database');
const { emailRegex } = require('../Shared/utils');

const TEMP_PASSWORD_LENGTH = 12;

const updateAccounts = `UPDATE Accounts
SET password = ?
WHERE email = ?`;

/**
 * Generate temp password
 * @param {number} length Password length
 * @returns {string} Plan text temp password
 */
const GeneratePassword = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomCharacter = '';
  for (let i = 0; i < length; i += 1) {
    randomCharacter += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomCharacter;
};

/**
 * Update user's password to temp password
 * @param {object} db Mysql
 * @param {string} password Plan text password
 * @param {string} email Plan text email
 * @returns {object} Processing result
 */
const UpdatePassword = async (db, password, email) => {
  await db.transaction()
    .query(updateAccounts, [password, email])
    .query((row) => {
      if (row.affectedRows < 1) {
        throw new Error('No user');
      }
    })
    .rollback()
    .commit();
};

/**
 * Processing password reset and sending password reset email
 * @requires bcrypt
 * @requires module:database/mysql
 * @requires module:Email
 * @requires module:Shared/utils
 * @param {object} context Azure functions object
 * @param {object} req http request
 * @returns {object} Processing result
 */
module.exports = async (context, req) => {
  const { email } = req.body;
  if (!emailRegex(email)) {
    // TODO: Error 작성 필요
    // 에러 예시 내용: 이메일이 올바르지 않습니다.
    context.done(new Error('Invalid email'));
  }

  try {
    await mysql.connect();
  } catch (error) {
    // TODO: Error 작성 필요
    context.done(error);
  }

  // 랜덤 비밀번호 생성
  const accPassword = GeneratePassword(TEMP_PASSWORD_LENGTH);
  const hashedPassword = await bcrypt.hash(accPassword, TEMP_PASSWORD_LENGTH);
  try {
    await UpdatePassword(mysql, hashedPassword, email);
  } catch (error) {
    mysql.quit();
    // TODO: Error 작성 필요
    context.done(error);
  }

  mysql.quit();
  // 비밀번호 초기화 이메일 전송
  const resetPasswordEmail = new Email({
    to: email,
    from: process.env.GMAIL_USER,
    subject: '비밀번호 초기화',
    content: `<p> 비밀번호 초기화 메일 입니다 </p><br> 비밀번호: ${accPassword}`,
  });
  try {
    await resetPasswordEmail
      .google({ id: process.env.GMAIL_USER, password: process.env.GMAIL_PASSWORD })
      .send();
  } catch (error) {
    // TODO: Error 작성 필요
    context.done(error);
  }

  // TODO: 리턴 처리 필요
  context.done();
};

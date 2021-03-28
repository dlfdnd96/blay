/**
 * @author slow_bear
 * @version 1.0
 * @fileoverview Processing user sign up
 * @requires bcrypt
 * @requires crypto
 * @requires module:database/mysql
 * @requires module:utils/emailRegex
 * @requires module:utils/passwordRegex
 * @requires module:utils/createResponse
 * @requires module:email/sendVerificationEmail
 */
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const mysql = require('../database');
const { emailRegex, passwordRegex, createResponse } = require('../Shared/utils');
const { sendVerificationEmail } = require('./email');

const PASSWORD_LENGTH = 12;
const EMAIL_TOKEN_LENGTH = 20;

const callCheckExistEmailAndName = 'CALL CheckExistEmailAndName(?, ?)';
const getUserInfo = 'SELECT @existEmail AS existEmail, @existName AS existName';
const insertAccounts = `INSERT INTO Accounts(email, name, password, verification_url, created_date, deleted_date)
VALUES (?, ?, ?, ?, ?, ?)`;

const AddUser = async (db, email, name, pwHash, emailToken) => {
  await db.transaction()
    .query(insertAccounts, [email, name, pwHash, emailToken, new Date(), '9999-12-31 23:59:59'])
    .query((row) => {
      if (row.affectedRows === 0) {
        throw new Error({
          code: 'The server occured error',
        });
      }
    })
    .rollback()
    .commit();
};
const GetUserInfo = async (db, email, name) => {
  const queryResult = await db.transaction()
    .query(callCheckExistEmailAndName, [email, name])
    .query(getUserInfo)
    .rollback()
    .commit();
  return queryResult[1][0];
};

/**
 * Processing user sing up module
 * @requires bcrypt
 * @requires crypto
 * @requires module:database/mysql
 * @requires module:utils/emailRegex
 * @requires module:utils/passwordRegex
 * @requires module:utils/createResponse
 * @requires module:email/sendVerificationEmail
 * @param {object} context Azure functions object
 * @param {object} req http request
 * @returns {object} Processing result
 */
module.exports = async (context, req) => {
  // 토큰이 존재한다면 로그인 상태이므로 error 발생
  // FIXME: 토큰을 어디에 저장하냐에 따라 변경해야 함
  if (req.headers.authorization) {
    context.res = createResponse(500, 'LOGGED_IN', 'Already logged in');
    context.done('LOGGED_IN');
    return;
  }

  // TODO: 이용약관 처리 어떻게 할까..
  const {
    email, password, name, term1, term2, term3,
  } = req.body;
  // 이메일 규칙 확인
  if (!emailRegex(email)) {
    context.res = createResponse(403, 'INVALID_EMAIL', 'Given user email was invalid');
    context.done('INVALID_EMAIL');
    return;
  }
  // 비밀번호 규칙 확인
  if (!passwordRegex(password)) {
    context.res = createResponse(403, 'INVALID_PASSWORD', 'Given user password was invalid');
    context.done('INVALID_PASSWORD');
    return;
  }
  // 약관 동의 확인
  if (!term1 || !term2 || !term3) {
    context.res = createResponse(403, 'INVALID_TERMS', 'All required terms and conditions must be agreed');
    context.done('INVALID_TERMS');
    return;
  }
  try {
    await mysql.connect();
  } catch (error) {
    context.res = createResponse(500, 'SERVER_ERROR', error.code);
    context.done(error);
    return;
  }

  const user = await GetUserInfo(mysql, email, name)
    .catch((error) => {
      context.res = createResponse(500, 'SERVER_ERROR', error.code);
      context.done(error);
    });
  if (user.existEmail === 'Already exist email') {
    mysql.quit();
    context.res = createResponse(500, 'DUPLICATE_EMAIL', 'Given user email already in database');
    context.done('DUPLICATE_EMAIL');
    return;
  }
  if (user.existName === 'Already exist name') {
    mysql.quit();
    context.res = createResponse(500, 'DUPLICATE_NAME', 'Given user name already in database');
    context.done('DUPLICATE_NAME');
    return;
  }
  // DB에 유저 정보 저장 후 인증 이메일 전송
  const emailToken = crypto.randomBytes(EMAIL_TOKEN_LENGTH).toString('hex');
  const pwHash = await bcrypt.hash(password, PASSWORD_LENGTH);
  try {
    await AddUser(mysql, email, name, pwHash, emailToken);
  } catch (error) {
    mysql.quit();
    context.res = createResponse(500, 'SERVER_ERROR', error.code);
    context.done(error);
    return;
  }

  mysql.quit();
  try {
    await sendVerificationEmail(email, emailToken);
  } catch (error) {
    context.res = createResponse(500, 'SERVER_ERROR', error);
    context.done(error);
  }

  context.done();
};

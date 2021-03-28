/**
 * @author slow_bear
 * @version 1.0
 * @fileoverview Processing user email verification
 * @requires module:database/mysql
 * @requires module:utils/createResponse
 * @requires module:utils/emailRegex
 */
const mysql = require('../database');
const { createResponse, emailRegex } = require('../Shared/utils');

const MS_SECONDS_IN_A_DAY = 86400000;

const getUserInfo = `SELECT email, verified, created_date, verification_url
FROM Accounts
WHERE email = ?`;
const updateVerified = `UPDATE Accounts
SET verified = 1
WHERE email = ?`;

const UpdateVerified = async (db, email) => {
  await db.transaction()
    .query(updateVerified, email)
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

const GetUserInfo = async (db, email) => {
  const queryResult = await db.transaction()
    .query(getUserInfo, email)
    .query((row) => {
      if (row.affectedRows === 0) {
        throw new Error({
          code: 'Given user email was invalid',
        });
      }
    })
    .rollback()
    .commit();
  return queryResult[0][0];
};
/**
  * Processing user sing up
  * @requires module:mysql
  * @requires module:utils/createResponse
  * @requires module:utils/emailRegex
  * @param {object} context Azure functions object
  * @param {object} req http request
  * @returns {object} Processing result
  */
module.exports = async (context, req) => {
  const { emailToken } = context.bindingData;
  const email = req.query.user;
  // email 형식이 올바르지 않을 경우
  if (!emailRegex(email)) {
    context.res = createResponse(403, 'INVALID_EMAIL', 'Given user email was invalid');
    context.done();
    return;
  }

  try {
    await mysql.connect();
  } catch (error) {
    context.res = createResponse(500, 'SERVER_ERROR', error.code);
    context.done(error);
    return;
  }

  const user = await GetUserInfo(mysql, email)
    .catch((error) => {
      mysql.quit();
      context.res = createResponse(500, 'SERVER_ERROR', error.code);
      context.done(error);
    });
  // 이미 인증된 이메일인지 확인
  if (user.verified === 1) {
    mysql.quit();
    context.res = createResponse(403, 'ALREADY_VERIFIED', 'Given user already verified');
    context.done('ALREADY_VERIFIED');
    return;
  }
  // 인증 이메일 일치 확인
  if (user.verification_url !== emailToken) {
    mysql.quit();
    context.res = createResponse(403, 'INVALID_VERIFICATION', 'Not matched user email and verification url');
    context.done('INVALID_VERIFICATION');
    return;
  }
  // 유효시간 지났는지 확인
  const expiredTime = new Date(user.created_date).getTime() + MS_SECONDS_IN_A_DAY;
  const currentTime = new Date().getTime();
  if (currentTime > expiredTime) {
    mysql.quit();
    context.res = createResponse(403, 'INVALID_VERIFICATION', 'Given verification was expired');
    context.done('INVALID_VERIFICATION');
    return;
  }

  try {
    await UpdateVerified(mysql, email);
  } catch (error) {
    mysql.quit();
    context.res = createResponse(500, 'SERVER_ERROR', error.code);
    context.done(error);
  }

  mysql.quit();
  context.done();
};

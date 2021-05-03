/**
 * @author slow_bear
 * @fileoverview Processing user email verification
 */
const mysql = require('../database');
const { createResponse } = require('../Shared/utils');
const { authenticateJWT } = require('../Shared/security/jwtProvider');
const { CustomError } = require('../Shared/middleware/errorHandler');

const MS_SECONDS_IN_A_DAY = 86400000;
const VERIFIED = 'Y';
const EXPIRED_JWT = 'EXPIRED_JWT';

const getUserInfoQuery = `SELECT email, verified, created_date
FROM Accounts
WHERE id = ?`;
const updateVerifiedQuery = `UPDATE Accounts
SET verified = 'Y'
WHERE email = ?`;

/**
 * Update verified
 * @param {Object} db Mysql
 * @param {string} email Plan email text
 */
const updateVerified = async (db, email) => {
  await db.transaction()
    .query(updateVerifiedQuery, email)
    .query((row) => {
      if (row.affectedRows < 1) {
        throw new CustomError('INTERNAL_SERVER_ERROR', 'SQL execute error');
      }
    })
    .commit();
};

/**
 * Get user information
 * @param {object} db Mysql
 * @param {number} id Plan id
 * @returns {object} Processing result
 */
const getUserInfo = async (db, id) => {
  const queryResult = await db.query(getUserInfoQuery, id);
  return queryResult[0];
};

module.exports = async (context, req) => {
  let decodedToken = {};
  try {
    decodedToken = await authenticateJWT(req);
  } catch (error) {
    if (error.error === EXPIRED_JWT) {
      context.res = createResponse(500, error.error, error.message, 900);
    } else {
      context.res = createResponse(500, error.error, error.message, 902);
    }

    context.done();
    return;
  }

  const { id } = decodedToken;
  try {
    await mysql.connect();
  } catch (error) {
    context.res = createResponse(500, 'INTERNAL_SERVER_ERROR', error.message, 500);
    context.done();
    return;
  }

  let user = {};
  try {
    user = await getUserInfo(mysql, id);
  } catch (error) {
    mysql.quit();
    context.res = createResponse(500, 'INTERNAL_SERVER_ERROR', error.message, 500);
    context.done();
    return;
  }

  if (!user) {
    mysql.quit();
    context.res = createResponse(403, 'NOT_A_MEMBER', 'Given user was not a member', 900);
    context.done();
    return;
  }
  if (user.verified === VERIFIED) {
    mysql.quit();
    context.res = createResponse(403, 'ALREADY_VERIFIED', 'Given user already verified', 900);
    context.done();
    return;
  }
  // 유효시간 지났는지 확인
  const expiredTime = new Date(user.created_date).getTime() + MS_SECONDS_IN_A_DAY;
  const currentTime = new Date().getTime();
  if (currentTime > expiredTime) {
    mysql.quit();
    context.res = createResponse(403, 'INVALID_VERIFICATION', 'Given verification was expired', 900);
    context.done();
    return;
  }

  try {
    await updateVerified(mysql, user.email);
  } catch (error) {
    mysql.quit();
    context.res = createResponse(500, 'INTERNAL_SERVER_ERROR', error.message, 500);
    context.done();
    return;
  }

  mysql.quit();
  context.res = createResponse(200, '', '', 200);
  context.done();
};

/**
 * @author slow_bear
 * @fileoverview Processing resend email
 */
const mysql = require('../database');
const { createResponse } = require('../Shared/utils');
const { CustomError } = require('../Shared/middleware/errorHandler');
const { sendEmail } = require('./email');
const { authenticateJWT } = require('../Shared/security/jwtProvider');

// 커링 가능?
const getResponse = async (error = undefined) => {
  if (!error) {
    return createResponse(200, '', '', 200);
  }

  if (error instanceof CustomError) {
    return createResponse(error.status, error.error, error.message, error.rescode);
  }

  return createResponse(500, 'INTERNAL_SERVER_ERROR', error.message, 500);
};

/**
  * Get count of requesting reset email in 24 hours
  * @param {string} email Plane email text
  * @returns {Array} Processing result
  */
const get24hResetEmailCount = async (email) => {
  const get24hResetEmailCountQuery = `SELECT email, COUNT(email) AS count
  FROM ResetPasswordAccounts
  WHERE email = ?
  AND created_date BETWEEN DATE_ADD(NOW(), INTERVAL -1 DAY) AND NOW()`;
  const queryResult = await mysql.query(get24hResetEmailCountQuery, email);
  return queryResult;
};

/**
  * Insert user's reset email
  * @param {string} email Plane email text
  */
const insertResetEmailAccount = async (email) => {
  const insertResetEmailQuery = `INSERT INTO ResetPasswordAccounts (email, created_date)
  VALUES (?, NOW())`;
  await mysql.transaction()
    .query(insertResetEmailQuery, email)
    .query((row) => {
      if (row.affectedRows < 1) {
        throw new CustomError(500, 'INTERNAL_SERVER_ERROR', 500, 'SQL execute error');
      }
    })
    .commit();
};

/**
  * Send password reset email
  * @param {string} email Plane email text
  */
const sendPasswordResetEmail = async (email) => {
  // 24시간안에 3번 이상 보냈는지 확인
  const resetEmail = await get24hResetEmailCount(email);
  if (resetEmail.length > 0 && resetEmail[0].count >= 3) {
    throw new CustomError(403, 'INVALID_DEMAND', 900, 'Too many attempts to reset your password', 900);
  }

  const passwordResetCategory = 'password_reset';
  await sendEmail(email, passwordResetCategory);
  await insertResetEmailAccount(email);
};

/**
 * Get user information
 * @param {number} id Plane user id number
 * @returns {object} Processing result
 */
const getUserEmail = async (id) => {
  const getUserEmailQuery = `SELECT email
  FROM Accounts
  WHERE id = ?`;
  const queryResult = await mysql.query(getUserEmailQuery, id);
  return queryResult[0];
};

/**
 * Send verification email
 * @param {number} id Plane user id number
 */
const sendVerificationEmail = async (id) => {
  const user = await getUserEmail(id);
  if (!user) {
    throw new CustomError(403, 'NOT_A_MEMBER', 900, 'Given user was not a member');
  }

  const verificationCategory = 'verification';
  await sendEmail(user.email, verificationCategory);
};

module.exports = async (context, req) => {
  const isPasswordReset = (token) => token === undefined;
  const connectMysql = async () => mysql.connect();
  const disconnectMysql = async () => mysql.quit();
  if (isPasswordReset(req.body.token)) {
    const { email } = req.body;
    try {
      await connectMysql();
      await sendPasswordResetEmail(email);
      await disconnectMysql();
    } catch (e) {
      if (mysql.getClient()) {
        await disconnectMysql();
      }

      context.res = await getResponse(e);
      return;
    }
  } else {
    try {
      const decodedToken = await authenticateJWT(req);
      const { id } = decodedToken;
      await connectMysql();
      await sendVerificationEmail(id);
      await disconnectMysql();
    } catch (e) {
      if (mysql.getClient()) {
        await disconnectMysql();
      }

      context.res = await getResponse(e);
      return;
    }
  }

  context.res = await getResponse();
};

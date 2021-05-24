/**
 * @author slow_bear
 * @fileoverview Processing resend email
 */
const mysql = require('../database');
const { createResponse } = require('../Shared/utils');
const { CustomError } = require('../Shared/middleware/errorHandler');
const { sendEmail } = require('./email');
const { authenticateJWT } = require('../Shared/security/jwtProvider');

const EXPIRED_JWT = 'EXPIRED_JWT';
const VERIFICATION_CATEGORY = 'verification';
const PASSWORD_RESET_CATEGORY = 'reset_password';

const getUserEmailQuery = `SELECT email
FROM Accounts
WHERE id = ?`;
const insertResetEmailQuery = `INSERT INTO ResetPasswordAccounts (email, created_date)
VALUES (?, NOW())`;
const deleteResetEmailAccountQuery = `DELETE FROM ResetPasswordAccounts
WHERE id = (
  SELECT id
  FROM (
    SELECT r.id
    FROM ResetPasswordAccounts AS r
    WHERE r.email = ?
    ORDER BY r.created_date DESC
    LIMIT 1
  ) AS temp
)`;
const get24hResetEmailCountQuery = `SELECT email, COUNT(email) AS count
FROM ResetPasswordAccounts
WHERE email = ?
AND created_date BETWEEN DATE_ADD(NOW(), INTERVAL -1 DAY) AND NOW()`;

/**
 * Get user information
 * @param {object} db Mysql
 * @param {number} id Plane user id number
 * @returns {object} Processing result
 */
const getUserEmail = async (db, id) => {
  const queryResult = await db.query(getUserEmailQuery, id);
  return queryResult[0];
};

/**
  * Insert user's reset email
  * @param {object} db Mysql
  * @param {string} email Plane email text
  */
const insertResetEmailAccount = async (db, email) => {
  await db.transaction()
    .query(insertResetEmailQuery, email)
    .query((row) => {
      if (row.affectedRows < 1) {
        throw new CustomError('INTERNAL_SERVER_ERROR', 'SQL execute error');
      }
    })
    .commit();
};

/**
  * Delete user's reset email
  * @param {object} db Mysql
  * @param {string} email Plane email text
  */
const deleteResetEmailAccount = async (db, email) => {
  await db.transaction()
    .query(deleteResetEmailAccountQuery, email)
    .query((row) => {
      if (row.affectedRows < 1) {
        throw new CustomError('INTERNAL_SERVER_ERROR', 'SQL execute error');
      }
    })
    .commit();
};

/**
  * Get count of requesting reset email in 24 hours
  * @param {object} db Mysql
  * @param {string} email Plane email text
  * @returns {Array} Processing result
  */
const get24hResetEmailCount = async (db, email) => {
  const queryResult = await db.query(get24hResetEmailCountQuery, email);
  return queryResult;
};

/**
  * Send password reset email
  * @param {string} email Plane email text
  */
const sendPasswordResetEmail = async (email) => {
  // await mysql.connect().catch((e) => {
  //   throw new CustomError(500, 'INTERNAL_SERVER_ERROR', 500, e.message);
  // });
  const temp = async () => mysql.connect();
  context.log(temp);

  // 24시간안에 3번 이상 보냈는지 확인
  const resetEmail = await get24hResetEmailCount(mysql, email);
  if (resetEmail.length > 0 && resetEmail[0].count >= 3) {
    mysql.quit();
    throw new CustomError(403, 'INVALID_DEMAND', 900, 'Too many attempts to reset your password', 900);
  }

  await insertResetEmailAccount(mysql, email).catch((e) => {
    mysql.quit();
    throw new CustomError(500, 'INTERNAL_SERVER_ERROR', 500, e.message);
  });

  await sendEmail(email, PASSWORD_RESET_CATEGORY).catch(async (e) => {
    await deleteResetEmailAccount(mysql, email).catch((de) => {
      mysql.quit();
      throw new CustomError(500, 'INTERNAL_SERVER_ERROR', 500, de.message);
    });

    mysql.quit();
    throw new CustomError(500, 'INTERNAL_SERVER_ERROR', 901, e.message);
  });

  mysql.quit();
};

const isPasswordReset = (token) => token === undefined;

module.exports = async (context, req) => {
  if (isPasswordReset(req.body.token)) {
    const { email } = req.body;
    try {
      await sendPasswordResetEmail(email);
    } catch (e) {
      if (e instanceof CustomError) {
        context.res = createResponse(e.status, e.error, e.message, e.rescode);
      }

      return;
    }
  } else {
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
      user = await getUserEmail(mysql, id);
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

    const emailResult = await sendEmail(user.email, VERIFICATION_CATEGORY);
    if (emailResult.length > 0) {
      context.res = createResponse(...emailResult);
      context.done();
      return;
    }
  }

  context.res = createResponse(200, '', '', 200);
};

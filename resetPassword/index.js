/**
 * @author slow_bear
 * @fileoverview Processing email verification or password reset
 */
const bcrypt = require('bcrypt');
const path = require('path');
const mjmlUtils = require('mjml-utils');

const mysql = require('../database');
const Email = require('./Email');
const { emailRegex, passwordRegex, createResponse } = require('../Shared/utils');
const { CustomError } = require('../Shared/middleware/errorHandler');

const PASSWORD_SALT = 12;
const EMAIL_SUBJECT = 'Blay 패스워드 수정 인증 요청';
const EMAIL_CONTENT_PATH = 'public/reset_password.html';
const EMAIL_SET_PASSWORD_URI = 'set-password';

const getUserEmailQuery = `SELECT 1 = 1
FROM Accounts
WHERE email = ?`;
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
const updateAccountsQuery = `UPDATE Accounts
SET password = ?
WHERE email = ?`;
const getResetEmailQuery = `SELECT email, COUNT(email) AS count
FROM ResetPasswordAccounts
WHERE email = ?
AND created_date BETWEEN DATE_ADD(NOW(), INTERVAL -1 DAY) AND NOW()`;
const getLatestResetEmailQuery = `SELECT email
FROM ResetPasswordAccounts
WHERE email = ?
AND created_date BETWEEN DATE_ADD(NOW(), INTERVAL -1 DAY) AND NOW()
ORDER BY created_date DESC
LIMIT 1`;

/**
  * Get user's email
  * @param {object} db Mysql
  * @param {string} email Plan text email
  * @returns {Array} Processing result
  */
const verifyEmail = async (db, email) => {
  const queryResult = await db.query(getUserEmailQuery, email);
  return queryResult;
};

/**
  * Insert user's reset email
  * @param {object} db Mysql
  * @param {string} email Plan text email
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
  * @param {string} email Plan text email
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
  * Update user's password to temp password
  * @param {object} db Mysql
  * @param {string} password Plan text password
  * @param {string} email Plan text email
  */
const updatePassword = async (db, password, email) => {
  await db.transaction()
    .query(updateAccountsQuery, [password, email])
    .query((row) => {
      if (row.affectedRows < 1) {
        throw new CustomError('NOT_A_MEMBER', 'Given user was not a member');
      }
    })
    .commit();
};

/**
  * Update user's password to temp password
  * @param {object} db Mysql
  * @param {string} email Plan text email
  * @returns {Array} Processing result
  */
const getResetEmail = async (db, email) => {
  const queryResult = await db.query(getResetEmailQuery, email);
  return queryResult;
};

/**
  * Get user's latest reset email
  * @param {object} db Mysql
  * @param {string} email Plan text email
  * @returns {Array} Processing result
  */
const getLatestResetEmail = async (db, email) => {
  const queryResult = await db.query(getLatestResetEmailQuery, email);
  return queryResult;
};

/**
  * Setting up password reset email and send it
  * @requires nodemailer
  * @param {string} email Plan text email
  * @returns {Promise} Sending email info or error
  */
const sendEmail = async (email) => {
  const result = [];
  try {
    const emailPath = path.join(__dirname, EMAIL_CONTENT_PATH);
    let emailContent = '';
    if (process.env.NODE_ENV === 'production') {
      emailContent = await mjmlUtils.inject(emailPath, {
        findPasswordUrl: `${process.env.PRODUCTION_HOST_FRONT_URL}/${EMAIL_SET_PASSWORD_URI}`,
      });
    } else {
      emailContent = await mjmlUtils.inject(emailPath, {
        findPasswordUrl: `${process.env.TEST_HOST_FRONT_URL}/${EMAIL_SET_PASSWORD_URI}`,
      });
    }

    const resetPasswordEmail = new Email({
      to: email,
      from: process.env.GMAIL_USER,
      subject: EMAIL_SUBJECT,
      content: emailContent,
    });
    await resetPasswordEmail
      .google({ id: process.env.GMAIL_USER, password: process.env.GMAIL_PASSWORD })
      .send();
  } catch (error) {
    result.push(500, 'INTERNAL_SERVER_ERROR', error.message, 901);
    return result;
  }

  return result;
};

/**
  * Check user's email
  * @param {string} email Plan text email
  * @returns {Array} Response result
  */
const checkEmail = async (email) => {
  const result = [];
  if (!emailRegex(email)) {
    result.push(403, 'INVALID_EMAIL', 'Given user email was invalid', 900);
    return result;
  }

  try {
    await mysql.connect();
  } catch (error) {
    result.push(500, 'INTERNAL_SERVER_ERROR', error.message, 500);
    return result;
  }

  try {
    const user = await verifyEmail(mysql, email);
    if (user.length === 0) {
      throw new CustomError('NOT_A_MEMBER', 'Given user was not a member');
    }
  } catch (error) {
    mysql.quit();
    if (error.error && error.error === 'NOT_A_MEMBER') {
      result.push(403, error.error, error.message, 900);
    } else {
      result.push(500, 'INTERNAL_SERVER_ERROR', error.message, 500);
    }

    return result;
  }

  mysql.quit();
  return result;
};

/**
  * Send password reset email
  * @param {string} email Plan text email
  * @returns {Array} Response result
  */
const sendPasswordResetEmail = async (email) => {
  const result = [];
  try {
    await mysql.connect();
  } catch (error) {
    result.push(500, 'INTERNAL_SERVER_ERROR', error.message, 500);
    return result;
  }

  // 24시간안에 3번 이상 보냈는지 확인
  const resetEmail = await getResetEmail(mysql, email);
  if (resetEmail.length > 0 && resetEmail[0].count >= 3) {
    mysql.quit();
    result.push(403, 'INVALID_DEMAND', 'Too many attempts to reset your password', 900);
    return result;
  }

  try {
    await insertResetEmailAccount(mysql, email);
  } catch (error) {
    mysql.quit();
    result.push(500, 'INTERNAL_SERVER_ERROR', error.message, 500);
    return result;
  }

  const emailResult = await sendEmail(email);
  if (emailResult.length > 0) {
    try {
      await deleteResetEmailAccount(mysql, email);
    } catch (error) {
      mysql.quit();
      result.push(500, 'INTERNAL_SERVER_ERROR', error.message, 500);
      return result;
    }

    result.push(...emailResult);
    return result;
  }

  mysql.quit();
  return result;
};

/**
  * Reset password
  * @param {string} email Plan text email
  * @param {string} password Plan text password
  * @returns {Array} Response result
  */
const resetPassword = async (email, password) => {
  const result = [];
  if (!emailRegex(email)) {
    result.push(403, 'INVALID_EMAIL', 'Given user email was invalid', 900);
    return result;
  }

  if (!passwordRegex(password)) {
    result.push(403, 'INVALID_PASSWORD', 'Given user password was invalid', 900);
    return result;
  }

  try {
    await mysql.connect();
  } catch (error) {
    result.push(500, 'INTERNAL_SERVER_ERROR', error.message, 500);
    return result;
  }

  const latestResetEmail = await getLatestResetEmail(mysql, email);
  // 이메일 24시간 확인
  if (latestResetEmail.length === 0) {
    result.push(403, 'INVALID_EMAIL', 'Given password reset email was expired', 900);
    return result;
  }

  const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT);
  try {
    await updatePassword(mysql, hashedPassword, email);
  } catch (error) {
    mysql.quit();
    result.push(500, 'INTERNAL_SERVER_ERROR', error.message, 500);
    return result;
  }

  mysql.quit();
  return result;
};

module.exports = async (context, req) => {
  const { email, password } = req.body;
  if (!password) {
    const emailResult = await checkEmail(email);
    if (emailResult.length > 0) {
      context.res = createResponse(...emailResult);
      context.done();
      return;
    }

    const sendResult = await sendPasswordResetEmail(email);
    if (sendResult.length > 0) {
      context.res = createResponse(...sendResult);
      context.done();
      return;
    }
  } else {
    const result = await resetPassword(email, password);
    if (result.length > 0) {
      context.res = createResponse(...result);
      context.done();
      return;
    }
  }

  context.res = createResponse(200, '', '', 200);
  context.done();
};

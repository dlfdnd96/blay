/**
 * @author slow_bear
 * @fileoverview Processing user sign up
 */
const bcrypt = require('bcrypt');

const mysql = require('../database');
const { emailRegex, passwordRegex, createResponse } = require('../Shared/utils');
const { sendVerificationEmail } = require('./email');
const { CustomError } = require('../Shared/middleware/errorHandler');
const { generateAccessToken } = require('../Shared/security/jwtProvider');

const PASSWORD_SALT_COUNT = 12;
const DISAGREED_NEWS_TERMS = 'N';
const AGREED_NEWS_TERMS = 'Y';

const getUserInfoQuery = `SELECT 1 = 1
FROM Accounts
WHERE email = ?`;
const insertUserQuery = `INSERT INTO Accounts(email, password, created_date, deleted_date, news_email_yn)
VALUES (?, ?, ?, ?, ?)`;
const deleteUserQuery = `DELETE FROM Accounts
WHERE email = ?`;
const getSignUpUserQuery = `SELECT id, email, verified, created_date
FROM Accounts
WHERE email = ?`;

/**
 * Get user Information
 * @param {object} db Mysql
 * @param {string} email Plan email text
 * @returns {Array} Processing result
 */
const getUserInfo = async (db, email) => {
  const queryResult = await db.transaction()
    .query(getUserInfoQuery, email)
    .rollback()
    .commit();
  return queryResult[0];
};

/**
 * Insert user Information
 * @param {object} db Mysql
 * @param {string} email Plan email text
 * @param {string} pwHash Hashed password text
 * @param {char} newsTerms Agreed or disagreed news terms text
 */
const addUser = async (db, email, pwHash, newsTerms) => {
  await db.transaction()
    .query(insertUserQuery, [email, pwHash, new Date(), '9999-12-31 23:59:59', newsTerms])
    .query((row) => {
      if (row.affectedRows < 1) {
        throw new CustomError('INTERNAL_SERVER_ERROR', 'SQL execute error');
      }
    })
    .commit();
};

/**
 * Delete user information
 * @param {object} db Mysql
 * @param {string} email Plan email text
 */
const deleteUser = async (db, email) => {
  await db.transaction()
    .query(deleteUserQuery, email)
    .query((row) => {
      if (row.affectedRows < 1) {
        throw new CustomError('INTERNAL_SERVER_ERROR', 'SQL execute error');
      }
    })
    .commit();
};

/**
 * Get sign up user information
 * @param {object} db Mysql
 * @param {string} email Plan email text
 * @returns {object} Processing result
 */
const getSignUpUser = async (db, email) => {
  const queryResult = await db.query(getSignUpUserQuery, email);
  return queryResult[0];
};

module.exports = async (context, req) => {
  if (req.body.token) {
    context.res = createResponse(403, 'ALREADY_LOGED_IN', 'Given user was loged in', 900);
    context.done();
    return;
  }

  const {
    email, password, termsAndConditions, personalInformationTerms, newsTerms,
  } = req.body;
  if (!emailRegex(email)) {
    context.res = createResponse(403, 'INVALID_EMAIL', 'Given user email was invalid', 900);
    context.done();
    return;
  }
  if (!passwordRegex(password)) {
    context.res = createResponse(403, 'INVALID_PASSWORD', 'Given user password was invalid', 900);
    context.done();
    return;
  }
  if (!termsAndConditions || !personalInformationTerms) {
    context.res = createResponse(403, 'INVALID_TERMS', 'All required terms and conditions must be agreed', 900);
    context.done();
    return;
  }
  try {
    await mysql.connect();
  } catch (error) {
    context.res = createResponse(500, 'INTERNAL_SERVER_ERROR', error.message, 500);
    context.done();
    return;
  }

  let user = {};
  try {
    user = await getUserInfo(mysql, email);
  } catch (error) {
    context.res = createResponse(500, 'INTERNAL_SERVER_ERROR', error.message, 500);
    context.done();
    return;
  }

  if (user.length > 0) {
    mysql.quit();
    context.res = createResponse(403, 'DUPLICATE_EMAIL', 'Given user email already in database', 900);
    context.done();
    return;
  }

  const pwHash = await bcrypt.hash(password, PASSWORD_SALT_COUNT);
  try {
    if (newsTerms) {
      await addUser(mysql, email, pwHash, AGREED_NEWS_TERMS);
    } else {
      await addUser(mysql, email, pwHash, DISAGREED_NEWS_TERMS);
    }
  } catch (error) {
    mysql.quit();
    context.res = createResponse(500, 'INTERNAL_SERVER_ERROR', error.message, 500);
    context.done();
    return;
  }

  let signUpUser = {};
  try {
    signUpUser = await getSignUpUser(mysql, email);
  } catch (dbSelectError) {
    try {
      await deleteUser(mysql, email);
    } catch (dbDeleteError) {
      context.res = createResponse(500, 'INTERNAL_SERVER_ERROR', dbDeleteError.message, 500);
      context.done();
      return;
    }

    context.res = createResponse(500, 'INTERNAL_SERVER_ERROR', dbSelectError.message, 500);
    context.done();
    return;
  }
  mysql.quit();

  try {
    await sendVerificationEmail(email);
  } catch (emailError) {
    try {
      await deleteUser(mysql, email);
    } catch (dbError) {
      context.res = createResponse(500, 'INTERNAL_SERVER_ERROR', dbError.message, 500);
      context.done();
      return;
    }

    context.res = createResponse(500, 'INTERNAL_SERVER_ERROR', emailError.message, 901);
    context.done();
    return;
  }

  const tokenPayload = {
    id: signUpUser.id,
    verified: signUpUser.verified,
    createDate: signUpUser.created_date,
    email: signUpUser.email,
  };
  const token = await generateAccessToken(tokenPayload);
  context.res = createResponse(200, '', { ...tokenPayload, token }, 200);
  context.done();
};

/**
 * @author slow_bear
 * @fileoverview Processing log in
 */
const bcrypt = require('bcrypt');

const mysql = require('../database');
const { generateAccessToken } = require('../Shared/security/jwtProvider');
const { emailRegex, passwordRegex, createResponse } = require('../Shared/utils');

const NOT_VERIFIED = 'N';

const getUserInfoQuery = `SELECT id, email, password, verified, created_date
FROM Accounts
WHERE email = ?`;

const getUserInfo = async (db, email) => {
  const queryResult = await db.query(getUserInfoQuery, email);
  return queryResult[0];
};

module.exports = async (context, req) => {
  const { email, password } = req.body;
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

  if (!user) {
    mysql.quit();
    context.res = createResponse(403, 'NOT_A_MEMBER', 'Given user was not a member', 900);
    context.done();
    return;
  }

  const verificationPassword = await bcrypt.compare(password, user.password);
  if (!verificationPassword) {
    mysql.quit();
    context.res = createResponse(403, 'NOT_MATCHED_PASSWORD', 'Given user password was not matched', 900);
    context.done();
    return;
  }
  if (user.verified === NOT_VERIFIED) {
    mysql.quit();
    context.res = createResponse(403, 'NOT_VERIFIED', 'Given user was not verified', 900);
    context.done();
    return;
  }

  mysql.quit();
  const tokenPayload = {
    id: user.id, verified: user.verified, createdDate: user.created_date, email: user.email,
  };
  const token = await generateAccessToken(tokenPayload);
  context.res = createResponse(200, '', { ...tokenPayload, token }, 200);
  context.done();
};

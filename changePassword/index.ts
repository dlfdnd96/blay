/**
 * @author slow_bear
 * @fileoverview Processing email verification or password reset
 */
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import * as bcrypt from 'bcrypt';

import { ServerlessMysql } from 'serverless-mysql';
import { mysql } from '../database';
import { emailRegex, passwordRegex } from '../Shared/utils';
import * as PlayBusRes from '../Shared/resObj';

interface ReqBody {
  readonly email: string;
  readonly password: string;
}

const PASSWORD_SALT = 12;

const updateAccountsQuery = `UPDATE Accounts
 SET password = ?
 WHERE email = ?`;
const getLatestResetEmailQuery = `SELECT email
 FROM ResetPasswordAccounts
 WHERE email = ?
 AND created_date BETWEEN DATE_ADD(NOW(), INTERVAL -1 DAY) AND NOW()
 ORDER BY created_date DESC
 LIMIT 1`;

/**
 * Update user's password to temp password
 * @param {object} db Mysql
 * @param {string} password Plan text password
 * @param {string} email Plan text email
 */
const updatePassword = async (db: ServerlessMysql, password: string, email: string)
: Promise<void> => {
  await db.transaction()
    .query(updateAccountsQuery, [password, email])
    .query((row: { affectedRows: number; }) => {
      if (row.affectedRows < 1) {
        throw new Error('updatePassword(): 0 affected rows');
      }
    })
    .commit();
};

/**
 * Get user's latest reset email
 * @param {object} db Mysql
 * @param {string} email Plan text email
 * @returns {Array} Processing result
 */
const getLatestResetEmail = async (db: ServerlessMysql, email: string)
: Promise<Array<{ count: number; }>> => {
  const queryResult: Array<{
    count: number;
  }> = await db.query(getLatestResetEmailQuery, email);
  return queryResult;
};

/**
 * Change password
 * @param {string} email Plan text email
 * @param {string} password Plan text password
 * @returns {Array} Response result
 */
const changePassword = async (db: ServerlessMysql, email: string, password: string)
: Promise<void> => {
  const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT);
  await updatePassword(db, hashedPassword, email);
};

const main: AzureFunction = async (context: Context, req: HttpRequest) => {
  const { email, password } = req.body as ReqBody;
  try {
    // check user email
    if (!emailRegex(email)) {
      context.res = PlayBusRes.ERROR_RESPONSE.EMAIL_INVALID;
      return;
    }
    // check new password
    if (!passwordRegex(password)) {
      context.res = PlayBusRes.ERROR_RESPONSE.PASSWORD_INVALID;
      return;
    }

    // 이메일 24시간 확인
    const latestResetEmail = await getLatestResetEmail(mysql, email);
    if (latestResetEmail.length === 0) {
      context.res = PlayBusRes.ERROR_RESPONSE.EMAIL_EXPIRED;
      return;
    }
    await changePassword(mysql, email, password);
    await mysql.end();
  } catch (e) {
    if (mysql.getClient()) {
      await mysql.end();
    }
    context.log.error('[resetPassword] Unusual error case');
    context.log.error(`${e as string}`);
    context.res = PlayBusRes.getUnusualErrorResponse(e);
    return;
  }
  context.res = PlayBusRes.SUCCESS.DEFAULT;
};

export default main;

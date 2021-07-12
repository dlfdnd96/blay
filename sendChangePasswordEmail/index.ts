/**
 * @author slow_bear
 * @fileoverview Processing email verification or password reset
 */
import { AzureFunction, Context, HttpRequest } from '@azure/functions';

import { ServerlessMysql } from 'serverless-mysql';
import { mysql } from '../database';
import sendEmail from './email';
import { emailRegex } from '../Shared/utils';
import * as PlayBusRes from '../Shared/resObj';

interface ReqBody {
  readonly email: string;
  readonly password: string;
}

const getUserEmailQuery = `SELECT 1 = 1, nickname
 FROM Accounts
 WHERE email = ?`;
const insertResetEmailQuery = `INSERT INTO ResetPasswordAccounts (email, created_date)
 VALUES (?, NOW())`;

const getResetEmailQuery = `SELECT email, COUNT(email) AS count
 FROM ResetPasswordAccounts
 WHERE email = ?
 AND created_date BETWEEN DATE_ADD(NOW(), INTERVAL -1 DAY) AND NOW()`;

/**
 * Get user's email
 * @param {object} db Mysql
 * @param {string} email Plan text email
 * @returns {Array} Processing result
 */
const verifyEmail = async (db: ServerlessMysql, email: string)
: Promise<Array<{
  nickname: string | null;
}>> => db.query(getUserEmailQuery, email);

/**
 * Insert user's reset email
 * @param {object} db Mysql
 * @param {string} email Plan text email
 */
const insertResetEmailAccount = async (db: ServerlessMysql, email: string)
: Promise<void> => {
  await db.transaction()
    .query(insertResetEmailQuery, email)
    .query((row: { affectedRows: number; }) => {
      if (row.affectedRows < 1) {
        throw new Error('insertResetEmailAccount(): 0 affected rows');
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
const getResetEmail = async (db: ServerlessMysql, email: string)
: Promise<Array<{ count: number; }>> => {
  const queryResult: Array<{
    count: number;
  }> = await db.query(getResetEmailQuery, email);
  return queryResult;
};

const main: AzureFunction = async (context: Context, req: HttpRequest) => {
  const { email } = req.body as ReqBody;
  try {
    // check user email
    if (!emailRegex(email)) {
      context.res = PlayBusRes.ERROR_RESPONSE.EMAIL_INVALID;
    }
    const user: Array<{
      nickname: string | null;
    }> = await verifyEmail(mysql, email);
    if (user.length === 0) {
      context.res = PlayBusRes.ERROR_RESPONSE.USER_NOT_A_MEMBER;
      return;
    }

    // send email
    const resetEmail: Array<{
      count: number;
    }> = await getResetEmail(mysql, email);
    if (resetEmail.length > 0 && resetEmail[0].count >= 3) {
      // too many requests for reset password
      context.res = PlayBusRes.ERROR_RESPONSE.PASSWORD_INVALID_DEMAND;
      return;
    }
    await sendEmail(email, (user[0]?.nickname) || '');

    // save reset email history
    await insertResetEmailAccount(mysql, email);
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

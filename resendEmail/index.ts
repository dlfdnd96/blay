/**
 * @author slow_bear
 * @fileoverview Processing resend email
 */
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { ServerlessMysql } from 'serverless-mysql';
import { mysql } from '../database';
import * as playBusResponse from '../Shared/resObj';
import { sendEmail, ResendEmailCategory, CATEGORY } from './email';
import { authenticateJWT } from '../Shared/security/jwtProvider';
import { emailRegex } from '../Shared/utils';

// serverless-mysql용 임시 type
interface OkPacket {
  fieldCount: number;
  affectedRows: number;
  insertId: number;
  serverStatus: number;
  warningCount: number;
  message: string;
  protocol41: boolean;
  changedRows: number;
}

const getUserEmailByEmailQuery = `SELECT email
 FROM Accounts
 WHERE email = ?`;
const insertResetEmailQuery = `INSERT INTO ResetPasswordAccounts (email, created_date)
VALUES (?, NOW())`;
const get24hResetEmailCountQuery = `SELECT email, COUNT(email) AS count
FROM ResetPasswordAccounts
WHERE email = ?
AND created_date BETWEEN DATE_ADD(NOW(), INTERVAL -1 DAY) AND NOW()`;

const getUserEmailByEmail = async (db: ServerlessMysql, email: string) => {
  interface QueryResult {
    email: string | undefined;
  }
  const selectQueryResult: QueryResult[] = await db.query(getUserEmailByEmailQuery, email);

  return selectQueryResult[0]?.email;
};

/**
 * Insert user's reset email
 * @param {object} db Mysql
 * @param {string} email Plane email text
 */
const insertResetEmailAccount = async (db: ServerlessMysql, email: string) => {
  const insertQueryResult: OkPacket = await db.query(insertResetEmailQuery, email);

  if (insertQueryResult.affectedRows < 1) {
    throw new Error('insert failed');
  }

  return insertQueryResult;
};

/**
 * Get count of requesting reset email in 24 hours
 * @param {object} db Mysql
 * @param {string} email Plane email text
 * @returns {Array} Processing result
 */
const get24hResetEmailCount = async (db: ServerlessMysql, email: string) => {
  interface QueryResult {
    email: string;
    count: number;
  }
  const queryResult: QueryResult[] = await db.query(get24hResetEmailCountQuery, email);

  return queryResult[0].count;
};

/**
 * Send password reset email
 * @param {string} email Plane email text
 * @returns {Array} Response result
 */
const sendPasswordResetEmail = async (email: string) => {
  const result = await sendEmail(email, 'PASSWORD_RESET');

  await insertResetEmailAccount(mysql, email);

  return result;
};

const resendEmail: AzureFunction = async (context: Context, req: HttpRequest) => {
  interface RequestBody {
    category: ResendEmailCategory;
    email: string;
  }
  const { category, email } = req.body as RequestBody;

  try {
    // Validation check
    if (!emailRegex(email)) {
      context.res = playBusResponse.ERROR_RESPONSE.EMAIL_INVALID;
      return context.done();
    }
    if (!Object.keys(CATEGORY).includes(category)) {
      context.res = playBusResponse.ERROR_RESPONSE.INVALID_CATEGORY;
      return context.done();
    }

    // Business logic start
    if (category === 'PASSWORD_RESET') {
      const userEmail = await getUserEmailByEmail(mysql, email);

      if (!userEmail) {
        await mysql.end();

        context.res = playBusResponse.ERROR_RESPONSE.USER_NOT_A_MEMBER;
        return context.done();
      }

      // 24시간안에 3번 이상 보냈는지 확인
      const sendEmailCount = await get24hResetEmailCount(mysql, email);

      if (sendEmailCount >= 3) {
        context.res = playBusResponse.ERROR_RESPONSE.PASSWORD_INVALID_DEMAND;
        return context.done();
      }
      await sendPasswordResetEmail(email);
    }

    if (category === 'VERIFICATION_EMAIL') {
      const decodedToken = authenticateJWT(req) as Record<string, any>; // 임시

      const userEmail = await getUserEmailByEmail(mysql, decodedToken.sub);

      if (!userEmail) {
        await mysql.end();

        context.res = playBusResponse.ERROR_RESPONSE.USER_NOT_A_MEMBER;
        return context.done();
      }

      await sendEmail(userEmail, 'VERIFICATION_EMAIL');
    }

    await mysql.end();

    context.res = playBusResponse.SUCCESS.DEFAULT;
    return context.done();
  } catch (error) {
    context.log.error('[resendEmail] Unusual error case', error);
    context.res = playBusResponse.getUnusualErrorResponse(error);
    return context.done();
  }
};

export default resendEmail;

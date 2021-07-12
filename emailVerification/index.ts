import { Context, HttpRequest } from '@azure/functions';
import { ServerlessMysql } from 'serverless-mysql';

import { mysql } from '../database';
import * as PlaybusRes from '../Shared/resObj';
import { authenticateJWT } from '../Shared/security/jwtProvider';

interface UserInformation {
  readonly email: string;
  readonly verified: string;
  readonly created_date: string;
}

const MS_SECONDS_IN_A_DAY = 86400000;
const VERIFIED = 'Y';

const getUserInfoQuery = `SELECT email, verified, created_date
FROM Accounts
WHERE email = ?`;
const updateVerifiedQuery = `UPDATE Accounts
SET verified = 'Y'
WHERE email = ?`;
const get24hResetEmailCountQuery = `SELECT email, COUNT(email) AS count
FROM ResetPasswordAccounts
WHERE email = ?
AND created_date BETWEEN DATE_ADD(NOW(), INTERVAL -1 DAY) AND NOW()`;

/**
 * Update verified
 * @param {Object} db Mysql
 * @param {string} email Plan email text
 */
const updateVerified = async (db: ServerlessMysql, email: string) => {
  await db.transaction()
    .query(updateVerifiedQuery, email)
    .commit();
};

/**
 * Check if email was expired
 * @param {string} userCreatedDate Date the user signed up
 * @returns {boolean} True if expired email
 */
const isExpiredEmail = (userCreatedDate: string): boolean => {
  const expiredTime = new Date(userCreatedDate).getTime() + MS_SECONDS_IN_A_DAY;
  const currentTime = new Date().getTime();
  return currentTime > expiredTime;
};

/**
 * Check that whether there is a resent email
 * @param {Object} db MySQL
 * @param {string} email Plan email text
 * @returns True when there is not a resent email in 24h
 */
const isNotEmailResendIn24h = async (db: ServerlessMysql, email: string) => {
  const queryResult: {
    readonly count: number
  }[] = await db.query(get24hResetEmailCountQuery, email);
  if (queryResult[0].count > 0) {
    return false;
  }

  return true;
};

/**
 * Get user information
 * @param {object} db Mysql
 * @param {string} email Plan email
 * @returns {object} Processing result
 */
const getUserInfo = async (db: ServerlessMysql, email: string) => {
  const queryResult: UserInformation[] = await db.query(getUserInfoQuery, email);
  return queryResult[0];
};

export default async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    const decodedToken = authenticateJWT(req) as Record<string, unknown>;
    await mysql.connect();
    const user: UserInformation = await getUserInfo(mysql, decodedToken.sub as string);
    if (!user) {
      context.res = PlaybusRes.ERROR_RESPONSE.USER_NOT_A_MEMBER;
      return;
    }
    if (user.verified === VERIFIED) {
      context.res = PlaybusRes.ERROR_RESPONSE.VERIFICATION_ALREADY_VERIFIED;
      return;
    }
    if (await isNotEmailResendIn24h(mysql, user.email) && isExpiredEmail(user.created_date)) {
      context.res = PlaybusRes.ERROR_RESPONSE.VERIFICATION_INVALID;
      return;
    }

    await updateVerified(mysql, user.email);
    await mysql.end();
  } catch (e) {
    if (mysql.getClient()) {
      await mysql.end();
    }

    context.log.error('[emailVerification] Unusual error case');
    context.log.error(e);
    context.res = PlaybusRes.getUnusualErrorResponse(e);
    return;
  }

  context.res = PlaybusRes.SUCCESS.DEFAULT;
};

import { Context, HttpRequest } from '@azure/functions';
import { hash } from 'bcrypt';
import { ServerlessMysql } from 'serverless-mysql';

import { mysql } from '../database';
import sendVerificationEmail from './email';
import * as PlaybusRes from '../Shared/resObj';
import { generateAccessToken } from '../Shared/security/jwtProvider';
import { emailRegex, passwordRegex } from '../Shared/utils';

interface AddUser {
  readonly email: string;
  readonly password: string;
  readonly newsTerms: 'Y' | 'N';
}
interface RequestedSignUp {
  readonly email: string;
  readonly password: string;
  readonly termsAndConditions: boolean;
  readonly personalInformationTerms: boolean;
  readonly newsTerms: boolean;
}
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
interface SignUpUser {
  readonly id: number;
  readonly email: string;
  readonly verified: 'Y' | 'N';
  readonly created_date: string;
}

const PASSWORD_SALT_COUNT = 12;
const NEWS_TERMS_STATUS: {
  readonly AGREED: 'Y';
  readonly DISAGREED: 'N';
} = { AGREED: 'Y', DISAGREED: 'N' } as const;

const getSignUpUserQuery = `SELECT id, email, verified, created_date
FROM Accounts
WHERE email = ?`;
const deleteUserQuery = `DELETE FROM Accounts
WHERE email = ?`;
const insertUserQuery = `INSERT INTO Accounts(email, password, created_date, deleted_date, news_email_yn)
VALUES (?, ?, ?, ?, ?)`;
const getSignedUpUserQuery = `SELECT email, COUNT(email) AS count
FROM Accounts
WHERE email = ?`;

/**
 * Get sign up user information
 * @param {object} db Mysql
 * @param {string} email Plan email text
 * @returns {object} Processing result
 */
async function getSignUpUser(db: ServerlessMysql, email: string): Promise<SignUpUser> {
  const queryResult: SignUpUser[] = await db.query(getSignUpUserQuery, email);

  if (queryResult.length === 0) {
    throw new Error('No user data');
  }

  return queryResult[0];
}

/**
 * Delete user information
 * @param {object} db Mysql
 * @param {string} email Plan email text
 */
async function deleteUser(db: ServerlessMysql, email: string): Promise<void> {
  const deleteQueryResult: OkPacket = await db.query(deleteUserQuery, email);

  if (deleteQueryResult.affectedRows < 1) {
    throw new Error('delete failed');
  }
}

/**
 * Insert user Information
 * @param {object} db Mysql
 * @param {string} email Plan email text
 * @param {string} pwHash Hashed password text
 * @param {char} newsTerms Agreed or disagreed news terms text
 */
async function addUser(db: ServerlessMysql, user: AddUser): Promise<void> {
  const insertQueryResult: OkPacket = await db.query(insertUserQuery, [user.email, user.password, new Date(), '9999-12-31 23:59:59', user.newsTerms]);

  if (insertQueryResult.affectedRows < 1) {
    throw new Error('insert failed');
  }
}

/**
 * Check if email signed up
 * @param db MySQL
 * @param email Plan email text
 * @returns True if email signed up
 */
async function isSignedUpUser(db: ServerlessMysql, email: string): Promise<boolean> {
  const queryResult: {
    readonly count: number
  }[] = await db.query(getSignedUpUserQuery, email);
  if (queryResult[0].count > 0) {
    return true;
  }

  return false;
}

export default async (context: Context, req: HttpRequest): Promise<void> => {
  if (req.headers.authorization) {
    context.res = PlaybusRes.ERROR_RESPONSE.AUTH_ALREADY_LOGGED_IN;
    return;
  }

  const {
    email, password, termsAndConditions, personalInformationTerms, newsTerms,
  } = req.body as RequestedSignUp;
  if (!emailRegex(email)) {
    context.res = PlaybusRes.ERROR_RESPONSE.EMAIL_INVALID;
    return;
  }
  if (!passwordRegex(password)) {
    context.res = PlaybusRes.ERROR_RESPONSE.PASSWORD_INVALID;
    return;
  }
  if (!termsAndConditions || !personalInformationTerms) {
    context.res = PlaybusRes.ERROR_RESPONSE.TERMS_INVALID;
    return;
  }

  try {
    await mysql.connect();
    if (await isSignedUpUser(mysql, email)) {
      context.res = PlaybusRes.ERROR_RESPONSE.EMAIL_DUPLICATE;
      return;
    }

    const pwHash = await hash(password, PASSWORD_SALT_COUNT);
    if (newsTerms) {
      await addUser(mysql, { email, password: pwHash, newsTerms: NEWS_TERMS_STATUS.AGREED });
    } else {
      await addUser(mysql, { email, password: pwHash, newsTerms: NEWS_TERMS_STATUS.DISAGREED });
    }

    try {
      await sendVerificationEmail(email);
    } catch (e) {
      await deleteUser(mysql, email);
      throw e;
    }

    const token: string = generateAccessToken(email);
    const signUpUser: SignUpUser = await getSignUpUser(mysql, email);
    await mysql.end();
    context.res = PlaybusRes.SUCCESS.CUSTOM_MESSAGE({ ...signUpUser, token });
  } catch (e) {
    if (mysql.getClient()) {
      await mysql.end();
    }

    context.log.error('[resetPassword] Unusual error case');
    context.log.error(e);
    context.res = PlaybusRes.getUnusualErrorResponse(e);
  }
};

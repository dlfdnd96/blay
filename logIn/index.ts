/**
 * @author slow_bear
 * @fileoverview Processing log in
 */
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { compare } from 'bcrypt';
import { ServerlessMysql } from 'serverless-mysql';

import { mysql } from '../database';
import * as PlaybusRes from '../Shared/resObj';
import { generateAccessToken } from '../Shared/security/jwtProvider';
import { emailRegex, passwordRegex } from '../Shared/utils';

const NOT_VERIFIED = 'N';

const getUserInfoQuery = `SELECT id, email, password, verified, nickname, simple_introduce, position, avatar_id, created_date
FROM Accounts
WHERE email = ?`;

interface UserInfo {
  avatar_id: boolean;
  position: number;
  simple_introduce: string;
  id: number;
  email: string;
  password: string;
  verified: 'Y' | 'N';
  created_date: string;
  nickname: string | null;
}

interface ReqBody {
  readonly email: string;
  readonly password: string;
}

const getUserInfo = async (
  db: ServerlessMysql,
  email: string,
): Promise<UserInfo> => {
  try {
    const queryResult: Array<UserInfo> = await db.query(
      getUserInfoQuery,
      email,
    );
    return queryResult[0];
  } finally {
    await db.end();
  }
};

const validateUser = (user: UserInfo | undefined): boolean => {
  if (!user) {
    return false;
  }
  return true;
};

const validatePwd = async (
  password: string,
  encrypted: string,
): Promise<boolean> => {
  const isValid = await compare(password, encrypted);
  if (!isValid) {
    return false;
  }
  return true;
};

const validateVerification = (verified: 'Y' | 'N'): boolean => {
  if (verified === NOT_VERIFIED) {
    return false;
  }
  return true;
};

const validateCharacter = (user: UserInfo): boolean => {
  if (!user.nickname || !user.simple_introduce || !user.position || !user.avatar_id) {
    return false;
  }
  return true;
};

const getTokenPayload = (user: UserInfo) => {
  if (!(user.nickname)) {
    return {
      id: user.id,
      verified: user.verified,
      createdDate: user.created_date,
      email: user.email,
    };
  }
  return {
    id: user.id,
    verified: user.verified,
    createdDate: user.created_date,
    email: user.email,
    nickname: user.nickname,
  };
};

const logIn: AzureFunction = async (
  context: Context,
  req: HttpRequest,
): Promise<void> => {
  const { email, password } = req.body as ReqBody;

  if (!emailRegex(email)) {
    context.res = PlaybusRes.ERROR_RESPONSE.EMAIL_INVALID;
    return;
  }

  if (!passwordRegex(password)) {
    context.res = PlaybusRes.ERROR_RESPONSE.USER_LOGIN_FAILED;
    return;
  }

  try {
    await mysql.connect();
    const user: UserInfo | undefined = await getUserInfo(mysql, email);

    if (!validateUser(user)) {
      context.log(`[logIn] USER_NOT_A_MEMBER:\nusername : ${email}`);
      context.res = PlaybusRes.ERROR_RESPONSE.USER_LOGIN_FAILED;
      return;
    }
    if (!(await validatePwd(password, user.password))) {
      context.log(`[logIn] PASSWORD_NOT_MATCHED:\nusername : ${email}`);
      context.res = PlaybusRes.ERROR_RESPONSE.USER_LOGIN_FAILED;
      return;
    }

    if (!validateVerification(user.verified)) {
      context.res = PlaybusRes.ERROR_RESPONSE.USER_NOT_VERIFIED;
      return;
    }

    let token;
    if (!validateCharacter(user)) {
      token = generateAccessToken(user.email);
    } else {
      token = generateAccessToken(user.email, { nickname: user.nickname });
    }

    context.res = PlaybusRes.SUCCESS.CUSTOM_MESSAGE({
      ...getTokenPayload(user),
      token,
    });
  } catch (e) {
    context.log.error('[logIn] Unusual error case');
    context.log.error(`${e as string}`);
    context.res = PlaybusRes.getUnusualErrorResponse(e);
  }
};

export default logIn;

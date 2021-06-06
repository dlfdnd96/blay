import { HttpRequest, Context } from '@azure/functions'
import { mysql } from '../database';
import { authenticateJWT } from '../Shared/security/jwtProvider';
import { CustomError } from '../Shared/middleware/errorHandler';
import * as PlayBusResposne from '../Shared/resObj';

const MS_SECONDS_IN_A_DAY = 86400000;
const VERIFIED = 'Y';

// TODO: 좀 더 멋지게
interface UserInformation {
  id: number;
}
interface User {
  email: string;
  verified: string;
  created_date: string;
}
interface MySQL {
  affectedRows: number;
}

const updateVerified = async (email: string) => {
  const updateVerifiedQuery = `UPDATE Accounts
  SET verified = 'Y'
  WHERE email = ?`;
  await mysql.transaction()
    .query(updateVerifiedQuery, email)
    .query((row: MySQL) => {
      if (row.affectedRows < 1) {
        throw new CustomError(500, 'INTERNAL_SERVER_ERROR', 500, 'SQL execute error');
      }
    })
    .commit();
};

const getUserInfo = async (id: number): Promise<object> => {
  const getUserInfoQuery = `SELECT email, verified, created_date
  FROM Accounts
  WHERE id = ?`;
  const queryResult: Array<object> = await mysql.query(getUserInfoQuery, id);
  return queryResult[0];
};

const doEmailVerification = async (req: HttpRequest) => {
  const decodedToken: string | object = authenticateJWT(req);
  const { id }: UserInformation = decodedToken as UserInformation;

  await mysql.connect();
  const user: User = await getUserInfo(id) as User;
  if (!user) {
    mysql.quit();
    throw new CustomError(403, 'NOT_A_MEMBER', 900, 'Given user was not a member');
  }
  if (user.verified === VERIFIED) {
    mysql.quit();
    throw new CustomError(403, 'ALREADY_VERIFIED', 900, 'Given user already verified');
  }
  // 유효시간 지났는지 확인
  // TODO: 함수화 하기
  const expiredTime: number = new Date(user.created_date).getTime() + MS_SECONDS_IN_A_DAY;
  const currentTime: number = new Date().getTime();
  if (currentTime > expiredTime) {
    mysql.quit();
    throw new CustomError(403, 'INVALID_VERIFICATION', 900, 'Given verification was expired');
  }

  await updateVerified(user.email);
  mysql.quit();
}

const emailVerification = async (context: Context, req: HttpRequest) => {
  try {
    await doEmailVerification(req);
  } catch (e) {
    //TODO: 응답처리 고치기
    if (e.shortErrorMessage === 'NOT_A_MEMBER') {
      context.res = PlayBusResposne.USER.NOT_A_MEMBER;
    } else if (e.shortErrorMessage === 'ALREADY_VERIFIED') {
      context.res = PlayBusResposne.VERIFICATION.ALREADY_VERIFIED;
    } else if (e.shortErrorMessage === 'INVALID_VERIFICATION') {
      context.res = PlayBusResposne.VERIFICATION.INVALID;
    } else {
      context.res = PlayBusResposne.ERROR.INTERNAL;
    }

    context.done();
    return;
  }

  context.res = PlayBusResposne.SUCCESS.DEFAULT;
  context.done();
};

export default emailVerification;

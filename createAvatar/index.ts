import { Context, HttpRequest } from '@azure/functions';
import { ServerlessMysql } from 'serverless-mysql';
import { mysql } from '../database';

import * as PlaybusRes from '../Shared/resObj';

interface Avatar {
  readonly email: string;
  readonly nickname: string;
  readonly simpleIntroduce: string;
  readonly position: number;
  readonly avatarId: number;
}

const getUserQuery = `SELECT 1 = 1
FROM Accounts
WHERE email = ?`;

const updateUserQuery = `UPDATE Accounts
SET nickname = ?, simple_introduce = ?, position = ?, avatar_id = ?
WHERE email = ?`;

/**
 * Get user Information
 * @param {object} db Mysql
 * @param {string} email Plan email text
 * @returns {Boolean} Processing result
 */
const isExistEmail = async (db: ServerlessMysql, email: string): Promise<boolean> => {
  const queryResult: [] = await db.query(getUserQuery, email);
  return queryResult.length > 0;
};

/**
 * Update avatar
 * @param {object} db Mysql
 * @param {object} avatar requested avatar
 */
const updateAvatar = async (db: ServerlessMysql, avatar: Avatar) => {
  await db.query(updateUserQuery, [
    avatar.nickname,
    avatar.simpleIntroduce,
    avatar.position,
    avatar.avatarId,
    avatar.email,
  ]);
};

export default async (context: Context, req: HttpRequest): Promise<void> => {
  const {
    email, nickname, simpleIntroduce, position, avatarId,
  } = req.body as Avatar;

  try {
    await mysql.connect();
    if (!(await isExistEmail(mysql, email))) {
      context.res = PlaybusRes.ERROR_RESPONSE.EMAIL_INVALID;
      return;
    }

    await updateAvatar(mysql, {
      email, nickname, simpleIntroduce, position, avatarId,
    });
    await mysql.end();
  } catch (e) {
    if (mysql.getClient()) {
      await mysql.end();
    }

    context.log.error('[createAvatar] Unusual error case');
    context.log.error(e);
    context.res = PlaybusRes.getUnusualErrorResponse(e);
    return;
  }

  context.res = PlaybusRes.SUCCESS.DEFAULT;
};

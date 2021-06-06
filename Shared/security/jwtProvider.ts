import { HttpRequest } from '@azure/functions';
import { sign, TokenExpiredError, verify } from 'jsonwebtoken';
import { CustomError } from '../middleware/errorHandler';

const authenticateJWT = (req: HttpRequest): string | object => {
  const jwtToken = req.headers.authorization || req.body.token;
  if (!jwtToken) {
    throw new CustomError(500, 'NOT_EXISTED_JWT', 902, 'JWT was not existed');
  }

  try {
    return verify(jwtToken, process.env.JWT_SECRET_KEY as string);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new CustomError(500, 'EXPIRED_JWT', 900, 'JWT was expired');
    }
    throw new CustomError(500, 'INVALID_JWT', 902, 'JWT was invalid');
  }
};

const generateAccessToken = (payload: object): string => {
  try {
    return sign(payload, process.env.JWT_SECRET_KEY as string, { algorithm: 'HS256', expiresIn: '1w' });
  } catch (e) {
    throw new CustomError(500, 'INVALID_JWT', 902, 'JWT was invalid');
  }
};

const decoderJwtToken = (jwtToken: string): string | object => {
  const decoded = verify(jwtToken, process.env.JWT_SECRET_KEY as string);
  if (!decoded) {
    throw new CustomError(500, 'INVALID_JWT', 902, 'JWT was invalid');
  }

  return decoded;
};

export { authenticateJWT, generateAccessToken, decoderJwtToken };

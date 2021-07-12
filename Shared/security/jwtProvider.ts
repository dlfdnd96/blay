import { HttpRequest } from '@azure/functions';
import { sign, verify } from 'jsonwebtoken';

/**
 * Authenticate JWT
 * @param {Object} req Request
 * @returns {string | Object} The decoded token.
 */
export function authenticateJWT(req: HttpRequest): Record<string, unknown> | string {
  return verify(req.headers.authorization || '', process.env.JWT_SECRET_KEY as string) as Record<string, unknown> | string;
}

/**
 * Generate Access JWT
 * @param {Object} payload Input data in JWT
 * @returns {string} JWT Token
 */
export function generateAccessToken(
  userEmail: string, payload?: string | Record<string, unknown>,
): string {
  const tokens = sign(payload || {}, process.env.JWT_SECRET_KEY as string, {
    algorithm: 'HS256',
    issuer: 'playbus.biz',
    subject: userEmail,
    expiresIn: '7d',
  });
  return tokens;
}

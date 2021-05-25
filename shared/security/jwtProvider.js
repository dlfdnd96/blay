const jwt = require('jsonwebtoken');
const { CustomError } = require('../middleware/errorHandler');

/**
 * Authenticate JWT
 * @param {Object} req Request
 * @returns {Promise} Processing result
 */
const authenticateJWT = async (req) => {
  const jwtToken = req.headers.authorization || req.body.token;
  if (!jwtToken) {
    throw new CustomError(500, 'NOT_EXISTED_JWT', 'JWT was not existed', 902);
  }

  let user = {};
  try {
    user = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new CustomError(500, 'EXPIRED_JWT', 'JWT was expired', 900);
    }
    throw new CustomError(500, 'INVALID_JWT', 'JWT was invalid', 902);
  }

  return user;
};

/**
 * Generate Access JWT
 * @param {Object} payload Input data in JWT
 * @returns {Promise} Processing result
 */
const generateAccessToken = async (payload) => {
  const tokens = jwt.sign(payload, process.env.JWT_SECRET_KEY, { algorithm: 'HS256', expiresIn: '1w' });
  return tokens;
};

/**
 * Decode JWT
 * @param {Object} jwtToken JWT
 * @returns {Promise} Processing result
 */
const decoderJwtToken = async (jwtToken) => {
  const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);
  if (!decoded) {
    throw new CustomError('INVALID_JWT', 'JWT was invalid');
  }

  return decoded;
};

module.exports = { authenticateJWT, generateAccessToken, decoderJwtToken };

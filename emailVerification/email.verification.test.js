const mockMysql = require('../database');
const emailVerification = require('.');
const { generateAccessToken } = require('../Shared/security/jwtProvider');
const config = require('../local.settings.json');

describe('EmailVerification', () => {
  const setMockDatabase = async (connectValue, quitValue, queryValue) => {
    mockMysql.connect = connectValue && connectValue.stack && connectValue.message
      ? jest.fn().mockImplementation(() => { throw new Error(connectValue); })
      : jest.fn().mockImplementation(() => connectValue);
    mockMysql.quit = jest.fn().mockImplementation(() => quitValue);
    mockMysql.query = queryValue && queryValue.stack && queryValue.message
      ? jest.fn().mockImplementation(() => { throw new Error(queryValue); })
      : jest.fn().mockImplementation(() => queryValue);
  };

  const setRequest = async (token) => {
    const request = {
      headers: {},
      body: {
        token,
      },
    };
    return request;
  };

  const context = {
    log: jest.fn(),
    done: jest.fn(),
  };
  const testEmail = 'dlfdnd96@gmail.com';
  const defaultMySQLConnectData = true;
  const defaultMySQLQuitData = true;
  const defaultMySQLQueryData = [{
    id: 1,
    verified: 'N',
    created_date: new Date().toJSON().slice(0, 19).replace('T', ' '),
  }];
  const defaultTokenData = {
    id: 1,
    verified: 'N',
    createdDate: new Date().toJSON().slice(0, 19).replace('T', ' '),
    email: testEmail,
  };
  let req = {};

  beforeAll(() => {
    process.env = Object.assign(process.env, {
      ...config.Values,
    });
  });

  beforeEach(async () => {
    await setMockDatabase(defaultMySQLConnectData, defaultMySQLQuitData, defaultMySQLQueryData);
    const generatedToken = await generateAccessToken(defaultTokenData);
    req = await setRequest(generatedToken);
  });

  describe('emailVerification', () => {
    it('verify a email', async () => {
      jest
        .spyOn(mockMysql, 'transaction')
        .mockImplementation(() => ({
          query: jest.fn().mockReturnValue(({
            query: jest.fn().mockReturnValue({
              commit: jest.fn().mockResolvedValue(true),
            }),
          })),
        }));
      await emailVerification(context, req);
      expect(context.res.status).toEqual(200);
      expect(context.res.body).toEqual({
        error: '',
        message: '',
        rescode: 200,
      });
    });

    it('should occur error because of wrong update verified query', async () => {
      jest
        .spyOn(mockMysql, 'transaction')
        .mockImplementation(() => ({
          query: jest.fn().mockReturnValue(({
            query: jest.fn().mockReturnValue({
              commit: jest.fn().mockRejectedValue(new Error('Updating user error')),
            }),
          })),
        }));
      await emailVerification(context, req);
      expect(context.res.status).toEqual(500);
      expect(context.res.body).toEqual({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Updating user error',
        rescode: 500,
      });
    });

    it('should occur error because of expired email', async () => {
      const now = new Date();
      const wrongMySQLQueryData = [{
        id: 1,
        verified: 'N',
        created_date: new Date(Date.parse(now) - 1 * 1000 * 60 * 60 * 24).toJSON().slice(0, 19).replace('T', ' '),
      }];
      await setMockDatabase(defaultMySQLConnectData, defaultMySQLQuitData, wrongMySQLQueryData);
      await emailVerification(context, req);
      expect(context.res.status).toEqual(403);
      expect(context.res.body).toEqual({
        error: 'INVALID_VERIFICATION',
        message: 'Given verification was expired',
        rescode: 900,
      });
    });

    it('should occur error because of already verified', async () => {
      const wrongMySQLQueryData = [{
        id: 1,
        verified: 'Y',
        created_date: new Date().toJSON().slice(0, 19).replace('T', ' '),
      }];
      await setMockDatabase(defaultMySQLConnectData, defaultMySQLQuitData, wrongMySQLQueryData);
      await emailVerification(context, req);
      expect(context.res.status).toEqual(403);
      expect(context.res.body).toEqual({
        error: 'ALREADY_VERIFIED',
        message: 'Given user already verified',
        rescode: 900,
      });
    });

    it('should occur error because of not a member', async () => {
      const wrongMySQLQueryData = [];
      await setMockDatabase(defaultMySQLConnectData, defaultMySQLQuitData, wrongMySQLQueryData);
      await emailVerification(context, req);
      expect(context.res.status).toEqual(403);
      expect(context.res.body).toEqual({
        error: 'NOT_A_MEMBER',
        message: 'Given user was not a member',
        rescode: 900,
      });
    });

    it('should occur error because wrong get user info query', async () => {
      await setMockDatabase(defaultMySQLConnectData, defaultMySQLQuitData, new Error('Getting user info error'));
      await emailVerification(context, req);
      expect(context.res.status).toEqual(500);
      expect(context.res.body).toEqual({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error: Getting user info error',
        rescode: 500,
      });
    });

    it('should occur error because of wrong database connection', async () => {
      await setMockDatabase(new Error('Database connection error'), defaultMySQLQuitData, defaultMySQLQueryData);
      await emailVerification(context, req);
      expect(context.res.status).toEqual(500);
      expect(context.res.body).toEqual({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error: Database connection error',
        rescode: 500,
      });
    });

    it('should occur error because of invalid jwt', async () => {
      const wrongJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      req = await setRequest(wrongJWT);
      await emailVerification(context, req);
      expect(context.res.status).toEqual(500);
      expect(context.res.body).toEqual({
        error: 'INVALID_JWT',
        message: 'JWT was invalid',
        rescode: 902,
      });
    });

    it('should occur error because jwt was expired', async () => {
      const expiredJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MjA2MzY3NDYsImV4cCI6MTYyMDAwMDAwMH0.Y22fbtVSv1l3CUgKZaFFpTFPPNvK0dLzsbVYCLD1PSg';
      req = await setRequest(expiredJWT);
      await emailVerification(context, req);
      expect(context.res.status).toEqual(500);
      expect(context.res.body).toEqual({
        error: 'EXPIRED_JWT',
        message: 'JWT was expired',
        rescode: 900,
      });
    });

    it('should occur error because jwt was expired', async () => {
      const emptyJWT = '';
      req = await setRequest(emptyJWT);
      await emailVerification(context, req);
      expect(context.res.status).toEqual(500);
      expect(context.res.body).toEqual({
        error: 'NOT_EXISTED_JWT',
        message: 'JWT was not existed',
        rescode: 902,
      });
    });
  });
});

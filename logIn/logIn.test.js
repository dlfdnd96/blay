const bcrypt = require('bcrypt');

const mockMysql = require('../database');
const logIn = require('.');
const config = require('../local.settings.json');

const PASSWORD_SALT_COUNT = 12;

describe('logIn', () => {
  const setMockDatabase = async (connectValue, quitValue, queryValue) => {
    mockMysql.connect = connectValue && connectValue.stack && connectValue.message
      ? jest.fn().mockImplementation(() => { throw new Error(connectValue); })
      : jest.fn().mockImplementation(() => connectValue);
    mockMysql.quit = jest.fn().mockImplementation(() => quitValue);
    mockMysql.query = queryValue && queryValue.stack && queryValue.message
      ? jest.fn().mockImplementation(() => { throw new Error(queryValue); })
      : jest.fn().mockImplementation(() => queryValue);
  };

  const setMySQLQuery = async (id, password, verified, createdDate, email) => {
    const data = [{
      id,
      password,
      verified,
      created_date: createdDate,
      email,
    }];
    return data;
  };

  const setHashedPassword = async (password) => {
    const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_COUNT);
    return hashedPassword;
  };

  const setRequest = async (email, password) => {
    const request = {
      headers: {},
      body: {
        email,
        password,
      },
    };
    return request;
  };

  const context = {
    log: jest.fn(),
    done: jest.fn(),
  };
  const defaultEmail = 'dlfdnd96@gmail.com';
  const defaultPassword = 'TestPW12!!';
  const defaultMySQLConnectData = true;
  const defaultMySQLQuitData = true;
  const defaultCreatedDate = new Date().toJSON().slice(0, 19).replace('T', ' ');
  let defaultMySQLQueryData = {};
  let req = {};

  beforeAll(() => {
    process.env = Object.assign(process.env, {
      ...config.Values,
    });
  });

  beforeEach(async () => {
    const hashedPassword = await setHashedPassword(defaultPassword);
    defaultMySQLQueryData = await setMySQLQuery(1, hashedPassword, 'Y', defaultCreatedDate, defaultEmail);
    await setMockDatabase(defaultMySQLConnectData, defaultMySQLQuitData, defaultMySQLQueryData);
    req = await setRequest(defaultEmail, defaultPassword);
  });

  describe('logIn', () => {
    it('success login', async () => {
      await logIn(context, req);
      expect(context.res.status).toEqual(200);
      expect(context.res.body).toEqual({
        error: '',
        message: {
          id: 1,
          verified: 'Y',
          createdDate: defaultCreatedDate,
          email: defaultEmail,
          token: expect.any(String),
        },
        rescode: 200,
      });
    });

    it('should occur error because user was not verified', async () => {
      defaultMySQLQueryData[0].verified = 'N';
      await setMockDatabase(defaultMySQLConnectData, defaultMySQLQuitData, defaultMySQLQueryData);
      await logIn(context, req);
      expect(context.res.status).toEqual(403);
      expect(context.res.body).toEqual({
        error: 'NOT_VERIFIED',
        message: 'Given user was not verified',
        rescode: 900,
      });
    });

    it('should occur error because of not matching password', async () => {
      defaultMySQLQueryData[0].password = 'WrongPW12!!';
      await setMockDatabase(defaultMySQLConnectData, defaultMySQLQuitData, defaultMySQLQueryData);
      await logIn(context, req);
      expect(context.res.status).toEqual(403);
      expect(context.res.body).toEqual({
        error: 'NOT_MATCHED_PASSWORD',
        message: 'Given user password was not matched',
        rescode: 900,
      });
    });

    it('should occur error because of not a member', async () => {
      const wrongMySQLQueryData = [];
      await setMockDatabase(defaultMySQLConnectData, defaultMySQLQuitData, wrongMySQLQueryData);
      await logIn(context, req);
      expect(context.res.status).toEqual(403);
      expect(context.res.body).toEqual({
        error: 'NOT_A_MEMBER',
        message: 'Given user was not a member',
        rescode: 900,
      });
    });

    it('should occur error because wrong get user info query', async () => {
      await setMockDatabase(defaultMySQLConnectData, defaultMySQLQuitData, new Error('Getting user info error'));
      await logIn(context, req);
      expect(context.res.status).toEqual(500);
      expect(context.res.body).toEqual({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error: Getting user info error',
        rescode: 500,
      });
    });

    it('should occur error because of wrong database connection', async () => {
      await setMockDatabase(new Error('Database connection error'), defaultMySQLQuitData, defaultMySQLQueryData);
      await logIn(context, req);
      expect(context.res.status).toEqual(500);
      expect(context.res.body).toEqual({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Error: Database connection error',
        rescode: 500,
      });
    });

    it('should occur error because of invalid password', async () => {
      const invalidPassword = 'invalidPW12';
      req = await setRequest(defaultEmail, invalidPassword);
      await logIn(context, req);
      expect(context.res.status).toEqual(403);
      expect(context.res.body).toEqual({
        error: 'INVALID_PASSWORD',
        message: 'Given user password was invalid',
        rescode: 900,
      });
    });

    it('should occur error because of invalid email', async () => {
      const invalidEmail = 'revi@innovirus';
      req = await setRequest(invalidEmail, defaultPassword);
      await logIn(context, req);
      expect(context.res.status).toEqual(403);
      expect(context.res.body).toEqual({
        error: 'INVALID_EMAIL',
        message: 'Given user email was invalid',
        rescode: 900,
      });
    });
  });
});

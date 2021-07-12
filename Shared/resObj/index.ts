import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';

export type PlaybusResponse = {
  status: 200 | 400 | 401 | 403 | 500;
  body: {
    error: string;
    message: string;
    rescode: number;
  };
};

export const ERROR_RESPONSE = {
  get INVALID_CATEGORY(): PlaybusResponse {
    return {
      status: 400,
      body: {
        error: 'INVALID_CATEGORY',
        message: 'Category is invalid',
        rescode: 900,
      },
    };
  },
  get EMAIL_INVALID(): PlaybusResponse {
    return {
      status: 403,
      body: {
        error: 'INVALID_EMAIL',
        message: 'Given user email was invalid',
        rescode: 900,
      },
    };
  },
  get EMAIL_DUPLICATE(): PlaybusResponse {
    return {
      status: 403,
      body: {
        error: 'DUPLICATE_EMAIL',
        message: 'Given user email is already in database',
        rescode: 900,
      },
    };
  },
  get EMAIL_EXPIRED(): PlaybusResponse {
    return {
      status: 403,
      body: {
        error: 'EXPIRED_EMAIL',
        message: 'Given password reset email was expired',
        rescode: 900,
      },
    };
  },
  get EMAIL_TRANSFER_FAILED(): PlaybusResponse {
    return {
      status: 403,
      body: {
        error: 'FAILED_EMAIL_TRANSFER',
        message: 'Sending email was failed',
        rescode: 901,
      },
    };
  },
  get JWT_ERROR(): PlaybusResponse {
    return {
      status: 500,
      body: {
        error: 'FAILED_JWT_HANDLING',
        message: 'JWT error was occured',
        rescode: 902,
      },
    };
  },
  get USER_LOGIN_FAILED(): PlaybusResponse {
    return {
      status: 403,
      body: {
        error: 'LOGIN_FAILED',
        message: 'Given username or password is not matched',
        rescode: 900,
      },
    };
  },
  get USER_NOT_A_MEMBER(): PlaybusResponse {
    return {
      status: 403,
      body: {
        error: 'NOT_A_MEMBER',
        message: 'Given user was not a member',
        rescode: 900,
      },
    };
  },
  get USER_NOT_VERIFIED(): PlaybusResponse {
    return {
      status: 403,
      body: {
        error: 'NOT_VERIFIED',
        message: 'Given user was not verified',
        rescode: 900,
      },
    };
  },
  get VERIFICATION_ALREADY_VERIFIED(): PlaybusResponse {
    return {
      status: 403,
      body: {
        error: 'ALREADY_VERIFIED',
        message: 'Given user was already verified',
        rescode: 900,
      },
    };
  },
  get VERIFICATION_INVALID(): PlaybusResponse {
    return {
      status: 403,
      body: {
        error: 'INVALID_VERIFICATION',
        message: 'Given verification was expired',
        rescode: 900,
      },
    };
  },
  get PASSWORD_INVALID(): PlaybusResponse {
    return {
      status: 403,
      body: {
        error: 'INVALID_PASSWORD',
        message: 'Given user password was invalid',
        rescode: 900,
      },
    };
  },
  get PASSWORD_NOT_MATCHED(): PlaybusResponse {
    return {
      status: 403,
      body: {
        error: 'NOT_MATCHED_PASSWORD',
        message: 'Given user password was not matched',
        rescode: 900,
      },
    };
  },
  get PASSWORD_INVALID_DEMAND(): PlaybusResponse {
    return {
      status: 403,
      body: {
        error: 'INVALID_DEMAND',
        message: 'Too many attempts to reset your password',
        rescode: 900,
      },
    };
  },
  get AUTH_ALREADY_LOGGED_IN(): PlaybusResponse {
    return {
      status: 403,
      body: {
        error: 'ALREADY_LOGGED_IN',
        message: 'Given user was already logged in',
        rescode: 900,
      },
    };
  },
  get TERMS_INVALID(): PlaybusResponse {
    return {
      status: 403,
      body: {
        error: 'INVALID_TERMS',
        message: 'All requiredd terms and conditions must be agreed',
        rescode: 900,
      },
    };
  },
  get DISCORD_CHANNEL_DUPLICATE(): PlaybusResponse {
    return {
      status: 500,
      body: {
        error: 'DUPLICATE_QUEST_DISCORD_CHANNEL',
        message: 'Given quest ID has already been activated',
        rescode: 900,
      },
    };
  },
  get DISCORD_CHANNEL_NOT_FOUND(): PlaybusResponse {
    return {
      status: 500,
      body: {
        error: 'QUEST_DISCORD_CHANNEL_NOT_FOUND',
        message: 'Project not found. Have you tried /activeChannelAs?',
        rescode: 900,
      },
    };
  },
  get DISCORD_USER_NOT_FOUND(): PlaybusResponse {
    return {
      status: 500,
      body: {
        error: 'USER_NOT_FOUND',
        message: 'User not found. Have you tried /addMeDiscord or !addMeAs?',
        rescode: 500,
      },
    };
  },
  get INTERNAL_SERVER_ERROR(): PlaybusResponse {
    return {
      status: 500,
      body: {
        error: 'INTERNAL_SERVER_ERROR',
        message: '',
        rescode: 500,
      },
    };
  },
};

export const SUCCESS = {
  get DEFAULT(): PlaybusResponse {
    return {
      status: 200,
      body: {
        error: '',
        message: '',
        rescode: 200,
      },
    };
  },
  CUSTOM_MESSAGE: (msg: string | Record<string, unknown>): PlaybusResponse => ({
    status: 200,
    body: {
      error: '',
      message: msg,
      rescode: 200,
    },
  } as PlaybusResponse),
};

export const getUnusualErrorResponse = (e: unknown): PlaybusResponse => {
  if (e instanceof Error) {
    // nodemailer error
    // [message example]
    //   Invalid login: 535-5.7.8 Username and Password not accepted. Learn more at
    //   [2021-06-27T17:26:44.227Z] 535 5.7.8  https://support.google.com/mail/?p=BadCredentials y18sm7235002pgh.52 - gsmtp
    if (/^(\d+)(?:\s(\d+\.\d+\.\d+))?\s/.exec(e.message.split('\n')[1])?.length === 3) {
      return ERROR_RESPONSE.EMAIL_TRANSFER_FAILED;
    }
  }
  if (
    e instanceof JsonWebTokenError
    || e instanceof TokenExpiredError
    || e instanceof NotBeforeError
  ) {
    return ERROR_RESPONSE.JWT_ERROR;
  }

  return ERROR_RESPONSE.INTERNAL_SERVER_ERROR;
};

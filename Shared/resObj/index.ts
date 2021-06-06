export type PlaybusResponse = {
  status: 200 | 403 | 500,
  body: {
    error: string,
    message: string,
    rescode: number
  }
}

export const SUCCESS = {
  DEFAULT: {
    status: 200,
    body: {
      error: '',
      message: '',
      rescode: 200,
    }
  } as PlaybusResponse,
  CUSTOM_MESSAGE: (msg: string | object) => ({
    status: 200,
    body: {
      error: '',
      message: msg,
      rescode: 200,
    }
  }) as PlaybusResponse,
}

export const JWT = {
  NOT_EXIST: {
    status: 500,
    body: {
      error: 'NOT_EXISTED_JWT',
      message: 'JWT was not existed in header or body',
      rescode: 902,
    }
  } as PlaybusResponse,
  INVALID: {
    status: 500,
    body: {
      error: 'INVAID_JWT',
      message: 'JWT was invalid',
      rescode: 902,
    }
  } as PlaybusResponse,
  EXPIRED: {
    status: 500,
    body: {
      error: 'EXPIRED_JWT',
      message: 'JWT was expired',
      rescode: 900,
    }
  } as PlaybusResponse,
}

export const EMAIL = {
  INVALID: {
    status: 403,
    body: {
      error: 'INVALID_EMAIL',
      message: 'Given user email was invalid',
      rescode: 900,
    }
  } as PlaybusResponse,
  DUPLICATE: {
    status: 403,
    body: {
      error: 'DUPLICATE_EMAIL',
      message: 'Given user email is already in database',
      rescode: 900,
    }
  } as PlaybusResponse,
}

export const USER = {
  NOT_A_MEMBER: {
    status: 403,
    body: {
      error: 'NOT_A_MEMBER',
      message: 'Given user was not a member',
      rescode: 900,
    }
  } as PlaybusResponse,
  NOT_VERIFIED: {
    status: 403,
    body: {
      error: 'NOT_VERIFIED',
      message: 'Given user was not verified',
      rescode: 900,
    }
  } as PlaybusResponse,
}

export const VERIFICATION = {
  ALREADY_VERIFIED: {
    status: 403,
    body: {
      error: 'ALREADY_VERIFIED',
      message: 'Given user was already verified',
      rescode: 900,
    }
  } as PlaybusResponse,
  INVALID: {
    status: 403,
    body: {
      error: 'INVALID_VERIFICATION',
      message: 'Given verification was expired',
      rescode: 900,
    }
  } as PlaybusResponse,
}

export const PASSWORD = {
  INVALID: {
    status: 403,
    body: {
      error: 'INVALID_PASSWORD',
      message: 'Given user password was invalid',
      rescode: 900,
    }
  } as PlaybusResponse,
  NOT_MATCHED: {
    status: 403,
    body: {
      error: 'NOT_MATCHED_PASSWORD',
      message: 'Given user password was not matched',
      rescode: 900,
    }
  } as PlaybusResponse,
  INVALID_DEMAND: {
    status: 403,
    body: {
      error: 'INVALID_DEMAND',
      message: 'Too many attempts to reset your password',
      rescode: 900,
    }
  } as PlaybusResponse,
}

export const AUTH = {
  ALREADY_LOGGED_IN: {
    status: 403,
    body: {
      error: 'ALREADY_LOGGED_IN',
      message: 'Given user was already logged in',
      rescode: 900,
    }
  } as PlaybusResponse,
}

export const TERMS = {
  INVALID: {
    status: 403,
    body: {
      error: 'INVALID_TERMS',
      message: 'All requiredd terms and conditions must be agreed',
      rescode: 900,
    }
  } as PlaybusResponse,
}

export const DISCORD = {
  CHANNEL_DUPLICATE: {
    status: 500,
    body: {
      error: 'DUPLICATE_QUEST_DISCORD_CHANNEL',
      message: 'Given quest ID has already been activated',
      rescode: 900,
    }
  } as PlaybusResponse,
  CHANNEL_NOT_FOUND: {
    status: 500,
    body: {
      error: 'QUEST_DISCORD_CHANNEL_NOT_FOUND',
      message: 'Project not found. Have you tried /activeChannelAs?',
      rescode: 900,
    }
  } as PlaybusResponse,
  USER_NOT_FOUND: {
    status: 500,
    body: {
      error: 'USER_NOT_FOUND',
      message: 'User not found. Have you tried /addMeDiscord or !addMeAs?',
      rescode: 500,
    }
  } as PlaybusResponse,
}

export const ERROR = {
  INTERNAL: (errorMsg: string) => ({
    status: 500,
    body: {
      error: 'INTERNAL_SERVER_ERROR',
      message: errorMsg,
      rescode: 500,
    }
  }) as PlaybusResponse,
}
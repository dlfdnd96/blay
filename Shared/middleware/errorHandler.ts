class CustomError extends Error {
  httpStatus: number;
  shortErrorMessage: string;
  subResponseCode: number;
  constructor(status: number, error: string, rescode: number, ...message: string[]) {
    super(...message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }

    this.httpStatus = status;
    this.shortErrorMessage = error;
    this.subResponseCode = rescode;
  }
}

export { CustomError };

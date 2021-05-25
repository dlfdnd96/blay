class CustomError extends Error {
  constructor(status, error, rescode, ...message) {
    super(...message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }

    this.status = status;
    this.error = error;
    this.rescode = rescode;
  }
}

module.exports = { CustomError };

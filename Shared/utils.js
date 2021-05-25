/**
 * @author jinu
 * @author slow_bear
 * @version 1.0
 * @fileoverview utils collection
 */

// Expects datestring to be in YYYYDDMM format
module.exports.parseTime = (dateString, timeString) => {
  if (timeString == '') return null;
  const time = timeString.match(/(\d+)(:(\d\d))/);

  if (!time) {
    return null;
  }

  const d = new Date(parseInt(dateString.substring(0, 4)),
    parseInt(dateString.substring(4, 6)) - 1,
    parseInt(dateString.substring(6, 8)),
    parseInt(time[1]),
    parseInt(time[3]));
  return d;
};

/**
 * Check email regular expression
 * @param {string} email Plan text email
 * @returns {boolean} True when email was valid
 */
module.exports.emailRegex = (email) => {
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
};

/**
 * Check password regular expression
 * @param {string} password Plan text password
 * @returns {boolean} True when password was valid
 */
module.exports.passwordRegex = (password) => {
  const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,12}$/;
  return pwRegex.test(password);
};

/**
 * Create response data
 * @param {string} status Response status code
 * @param {string} error Response error code
 * @param {string} message Resopnse detailed error message
 */
module.exports.createResponse = (status, error, message, rescode) => ({
  status,
  body: {
    error,
    message,
    rescode,
  },
});

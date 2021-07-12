/**
 * @author jinu
 * @author slow_bear
 * @version 1.0
 * @fileoverview utils collection for discord
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
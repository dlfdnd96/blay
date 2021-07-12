// Expects datestring to be in YYYYDDMM format
export function parseTime(dateString: string, timeString: string): null | Date {
  if (timeString === '') {
    return null;
  }

  const time = /(\d+)(:(\d\d))/.exec(timeString);
  if (!time) {
    return null;
  }

  return new Date(parseInt(dateString.substring(0, 4), 10),
    parseInt(dateString.substring(4, 6), 10) - 1,
    parseInt(dateString.substring(6, 8), 10),
    parseInt(time[1], 10),
    parseInt(time[3], 10));
}

/**
 * Check email regular expression
 * @param {string} email Plan text email
 * @returns {boolean} True when email was valid
 */
export function emailRegex(email: string): boolean {
  const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(email);
}

/**
 * Check password regular expression
 * @param {string} password Plan text password
 * @returns {boolean} True when password was valid
 */
export function passwordRegex(password: string): boolean {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,12}$/;
  return regex.test(password);
}

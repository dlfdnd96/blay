// Expects datestring to be in YYYYDDMM format
export function parseTime(dateString: string, timeString: string): null | Date {
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

export function emailRegex(email: string): boolean {
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
};

export function passwordRegex(password: string): boolean {
  const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,12}$/;
  return pwRegex.test(password);
};

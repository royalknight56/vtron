const dayMs = 86400000;
const epoch1900 = Date.UTC(1899, 11, 31);
const epoch1904 = Date.UTC(1904, 0, 1);
const march1900 = Date.UTC(1900, 2, 1);

export function serialFromTimestamp(timestamp: number, date1904 = false) {
  if (date1904) return (timestamp - epoch1904) / dayMs;
  // Excel reserves serial 60 for the fictitious 1900-02-29.
  return (timestamp - epoch1900) / dayMs + (timestamp >= march1900 ? 1 : 0);
}

export function calendarSerial(year: number, month: number, day: number, date1904 = false) {
  // Offset in Excel days, so DATE(1900, 3, 0) also lands on serial 60.
  return serialFromTimestamp(Date.UTC(year, month - 1, 1), date1904) + day - 1;
}

export function dateParts(serial: number, date1904 = false) {
  const days = Math.floor(serial);
  if (!Number.isFinite(days) || days < 0 || days > (date1904 ? 2957003 : 2958465)) return null;
  if (!date1904 && days === 0) return { year: 1900, month: 1, day: 0 };
  if (!date1904 && days === 60) return { year: 1900, month: 2, day: 29 };
  const timestamp = date1904 ? epoch1904 + days * dayMs : epoch1900 + (days - (days > 60 ? 1 : 0)) * dayMs;
  const date = new Date(timestamp);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export function parseCalendarInput(value: string, date1904 = false) {
  const match = /^(\d{4})([-/])(\d{1,2})\2(\d{1,2})$/.exec(value.trim());
  if (!match) return null;
  const year = +match[1], month = +match[3], day = +match[4];
  if (day < 1) return null;
  const serial = calendarSerial(year, month, day, date1904);
  const parts = dateParts(serial, date1904);
  return parts && parts.year === year && parts.month === month && parts.day === day ? serial : null;
}

export type ClockFormat = 'time' | 'duration' | 'datetime';

export function parseClockInput(input: string, date1904 = false) {
  const match = /^(?:(\d{4}[-/]\d{1,2}[-/]\d{1,2})[ T])?(\d{1,4}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?\s*(AM|PM)?$/i.exec(input.trim());
  if (!match) return null;
  const [, calendar, hour, minute, second, fraction, period] = match;
  const day = calendar ? parseCalendarInput(calendar, date1904) : 0;
  let hours = Number(hour);
  if (day === null || +minute > 59 || Number(second || 0) > 59 || (calendar && hours >= 24)) return null;
  if (period) {
    if (hours < 1 || hours > 12) return null;
    hours = hours % 12 + (period.toUpperCase() === 'PM' ? 12 : 0);
  }
  const seconds = hours * 3600 + +minute * 60 + Number(second || 0) + Number('0.' + (fraction || '0'));
  const fmt: ClockFormat = calendar ? 'datetime' : hours >= 24 ? 'duration' : 'time';
  const clock = (fmt === 'duration' ? '[h]' : hour.length === 2 ? 'hh' : 'h') + ':mm' + (second ? ':ss' : '');
  const code = (calendar ? 'yyyy-mm-dd ' : '') + clock +
    (fraction ? '.' + '0'.repeat(fraction.length) : '') + (period ? ' AM/PM' : '');
  return { serial: day + seconds / 86400, time: (seconds % 86400) / 86400, fmt, code };
}

// The editing value includes components hidden by the display format.
export function temporalEditValue(serial: number, fmt: ClockFormat | 'date', date1904 = false) {
  if (!dateParts(serial, date1904)) return String(serial);
  const millis = Math.round(serial * dayMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  const hours = Math.floor(millis / 3600000);
  const clock = pad(fmt === 'duration' ? hours : hours % 24) + ':' + pad(Math.floor(millis / 60000) % 60) +
    ':' + pad(Math.floor(millis / 1000) % 60) + (millis % 1000 ? '.' + String(millis % 1000).padStart(3, '0') : '');
  if (fmt === 'duration' || (fmt === 'time' && serial < 1)) return clock;
  const date = dateParts(millis / dayMs, date1904);
  if (!date) return String(serial);
  const calendar = date.year + '-' + pad(date.month) + '-' + pad(date.day);
  return fmt === 'date' && millis % dayMs === 0 ? calendar : calendar + ' ' + clock;
}

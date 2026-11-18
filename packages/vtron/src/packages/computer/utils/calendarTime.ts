// Calendar cells use UTC midnight as a civil date, independently of the browser's time zone.
export const dayMs = 86_400_000;
export function wallClockFormatter(timeZone?: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}
export function wallTime(instant: number, format: Intl.DateTimeFormat) {
  const parts = Object.fromEntries(format.formatToParts(instant).map((p) => [p.type, p.value]));
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
}
export function civilDay(time: number) {
  return Math.floor(time / dayMs) * dayMs;
}
export function reminderInstant(day: number, time: string, format: Intl.DateTimeFormat) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN;
  const [hour, minute] = time.split(':').map(Number);
  const wanted = day + (hour * 60 + minute) * 60_000;
  // Test offsets on either side of a DST change. A skipped local time has no matching instant.
  const matches = [wanted - dayMs, wanted + dayMs]
    .map((t) => wanted - (wallTime(t, format) - t))
    .filter((t) => wallTime(t, format) === wanted);
  return matches.length ? Math.min(...matches) : NaN;
}

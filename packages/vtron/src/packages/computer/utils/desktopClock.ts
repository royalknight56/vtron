import type { DesktopPreferences } from '@/packages/type/type';

export function formatDesktopClock(date: Date, preferences?: DesktopPreferences, seconds = false) {
  const timeZone = preferences?.timeZone || undefined;
  const locale = preferences?.region || undefined;
  const localDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  if (!locale && !timeZone && !preferences?.dateFormat) return localClock(date, localDate, seconds);
  try {
    const time = new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: seconds ? '2-digit' : undefined,
      hourCycle: 'h23',
    }).format(date);
    const label = new Intl.DateTimeFormat(locale ?? 'zh-CN', {
      timeZone,
      dateStyle: preferences?.dateFormat === 'long' ? 'long' : 'short',
    }).format(date);
    return { time, date: label };
  } catch {
    return localClock(date, localDate, seconds);
  }
}

function localClock(date: Date, label: string, seconds: boolean) {
  const parts = [date.getHours(), date.getMinutes()];
  if (seconds) parts.push(date.getSeconds());
  return { time: parts.map((part) => String(part).padStart(2, '0')).join(':'), date: label };
}

import type { System } from '@packages/kernel';
import { join } from '@/packages/util/Path';
import { i18n } from '../i18n';
import { formatDesktopClock } from './desktopClock';

export type ScheduleEntry = { id?: string; time: number; text: string; endTime?: number; location?: string };
export type StoredEntry = ScheduleEntry & { source?: string };
function directory(sys: System) {
  return join(sys._options.userLocation || '', 'Schedule');
}
function sourcePath(sys: System, entry: StoredEntry) {
  const d = new Date(entry.time);
  return entry.source ?? join(directory(sys), `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}.json`);
}
async function readDay(sys: System, path: string): Promise<ScheduleEntry[]> {
  const content = await sys.fs.readFile(path);
  if (!content) return [];
  const entries = JSON.parse(content);
  if (!Array.isArray(entries)) throw new SyntaxError('Invalid schedule');
  return entries;
}
export async function readSchedule(sys: System): Promise<StoredEntry[]> {
  const dir = directory(sys);
  if (!(await sys.fs.exists(dir))) return [];
  const files = (await sys.fs.readdir(dir)).filter((f) => /^\d+-\d{1,2}-\d{1,2}\.json$/.test(f.name));
  const groups = await Promise.all(
    files.map(async (file) => {
      try {
        return (await readDay(sys, file.path))
          .filter((n) => n && Number.isFinite(n.time) && typeof n.text === 'string')
          .map((n) => ({ ...n, source: file.path }));
      } catch (error) {
        // An invalid day file must not disable reminders in the rest of the calendar.
        if (error instanceof SyntaxError) return [];
        throw error;
      }
    })
  );
  return groups.flat().sort((a, b) => a.time - b.time);
}
const writes = new WeakMap<System, Promise<void>>();
function changeDay(sys: System, path: string, change: (entries: ScheduleEntry[]) => void) {
  const write = (writes.get(sys) ?? Promise.resolve()).then(async () => {
    const dir = directory(sys);
    if (!(await sys.fs.exists(dir))) await sys.fs.mkdir(dir);
    const entries = await readDay(sys, path);
    change(entries);
    if (entries.length) await sys.fs.writeFile(path, JSON.stringify(entries));
    else if (await sys.fs.exists(path)) await sys.fs.unlink(path);
    sys.emitEvent('schedule.change');
  });
  writes.set(
    sys,
    write.catch(() => {})
  );
  return write;
}
export function addSchedule(sys: System, entry: ScheduleEntry) {
  return changeDay(sys, sourcePath(sys, entry), (entries) =>
    entries.push({
      ...entry,
      id: Array.from(crypto.getRandomValues(new Uint32Array(4)), (part) =>
        part.toString(16).padStart(8, '0')
      ).join(''),
    })
  );
}
export function changeSchedule(sys: System, entry: StoredEntry, text?: string) {
  return changeDay(sys, sourcePath(sys, entry), (entries) => {
    const index = entries.findIndex((n) =>
      entry.id ? n.id === entry.id : n.time === entry.time && n.text === entry.text
    );
    if (index < 0) throw new Error('Schedule entry no longer exists');
    if (text === undefined) entries.splice(index, 1);
    else entries[index].text = text;
  });
}
export function startScheduleReminders(sys: System) {
  let generation = 0;
  let timer: ReturnType<typeof setTimeout>;
  let cutoff = Date.now();
  let armed = new Set<number>();
  async function reload() {
    const version = ++generation;
    clearTimeout(timer);
    const requested = Date.now();
    let entries: ScheduleEntry[];
    try {
      entries = await readSchedule(sys);
    } catch {
      return;
    }
    if (version !== generation) return;
    // Past entries are still visible in the agenda. Arm only reminders scheduled for this session.
    const pending = entries.filter((n) => n.time > cutoff && (n.time >= requested || armed.has(n.time)));
    armed = new Set(pending.map((entry) => entry.time));
    let index = 0;
    function tick() {
      const now = Date.now();
      while (index < pending.length && pending[index].time <= now) {
        const n = pending[index++];
        cutoff = n.time;
        armed.delete(n.time);
        const { time } = formatDesktopClock(new Date(n.time), sys.getConfig('desktopPreferences'));
        sys.createNotify({ source: i18n('schedule'), title: i18n('schedule.reminder'), content: time + '  ' + n.text });
      }
      if (index < pending.length)
        timer = setTimeout(tick, Math.min(2_147_483_647, pending[index].time - now));
    }
    tick();
  }
  void reload();
  sys.mountEvent('schedule.change', reload);
  return () => {
    generation++;
    clearTimeout(timer);
    sys.offEvent('schedule.change', reload);
  };
}

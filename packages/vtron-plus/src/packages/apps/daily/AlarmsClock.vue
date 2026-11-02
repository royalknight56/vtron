<template>
  <Win10Frame title="闹钟和时钟" background="#f2f2f2" titlebar-background="#e6e6e6">
    <nav class="clock-tabs" aria-label="时钟功能">
      <button
        v-for="item in tabs"
        :key="item.id"
        :class="{ active: tab === item.id }"
        :aria-current="tab === item.id ? 'page' : undefined"
        @click="
          tab = item.id;
          editing = null;
          cityPicker = false;
        "
      >
        <span
          v-if="item.image"
          class="tab-icon"
          :style="{ maskImage: `url(${item.image})` }"
          aria-hidden="true"
        ></span
        ><span v-else class="mdl" aria-hidden="true">{{ item.icon }}</span
        ><span>{{ item.name }}</span>
      </button>
    </nav>
    <div v-if="tab === 'alarm'" class="awake-notice">
      <span class="mdl" aria-hidden="true">&#xE7BA;</span>闹钟仅在本页面打开且设备处于唤醒状态时提醒。
    </div>
    <div class="clock-content" :aria-busy="!ready">
      <template v-if="editing">
        <section class="editor-page" :aria-label="editing.kind === 'alarm' ? '编辑闹钟' : '编辑计时器'">
          <div class="time-inputs">
            <label
              ><input
                v-model.number="draft.hours"
                type="number"
                min="0"
                :max="editing.kind === 'alarm' ? 23 : 99"
                aria-label="小时"
              /><span>小时</span></label
            ><b>:</b
            ><label
              ><input v-model.number="draft.minutes" type="number" min="0" max="59" aria-label="分钟" /><span
                >分钟</span
              ></label
            ><template v-if="editing.kind === 'timer'"
              ><b>:</b
              ><label
                ><input v-model.number="draft.seconds" type="number" min="0" max="59" aria-label="秒" /><span
                  >秒</span
                ></label
              ></template
            >
          </div>
          <label class="edit-label"
            >{{ editing.kind === 'alarm' ? '闹钟名称' : '计时器名称'
            }}<input v-model="draft.name" maxlength="80"
          /></label>
          <template v-if="editing.kind === 'alarm'"
            ><div class="edit-label">
              重复
              <div class="repeat-days">
                <button
                  v-for="(day, index) in weekdayLabels"
                  :key="day"
                  :class="{ checked: draft.days.includes(index) }"
                  :aria-pressed="draft.days.includes(index)"
                  @click="toggleDay(index)"
                >
                  {{ day }}
                </button>
              </div>
              <span class="repeat-description">{{ draft.days.length ? '在选定的日期提醒' : '仅一次' }}</span>
            </div>
            <label class="edit-label"
              >声音<select disabled aria-label="闹钟声音">
                <option>钟声</option>
              </select></label
            ></template
          >
          <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
          <div class="edit-actions">
            <button v-if="editing.id" class="delete-edit" @click="deleteEdited">
              <span class="mdl" aria-hidden="true">&#xE74D;</span>删除</button
            ><span></span
            ><button @click="saveEdited"><span class="mdl" aria-hidden="true">&#xE74E;</span>保存</button
            ><button @click="editing = null">取消</button>
          </div>
        </section>
      </template>
      <template v-else-if="tab === 'alarm'">
        <div class="alarm-list">
          <div v-for="alarm in alarms" :key="alarm.id" class="alarm-row" :class="{ off: !alarm.enabled }">
            <button class="alarm-main" @click="editAlarm(alarm)">
              <span class="alarm-time">{{ pad(alarm.hours) }}:{{ pad(alarm.minutes) }}</span
              ><strong>{{ alarm.name || '闹钟' }}</strong
              ><span>{{ repeatLabel(alarm.days) }}</span></button
            ><button
              class="alarm-toggle"
              role="switch"
              :aria-checked="alarm.enabled"
              :aria-label="`${alarm.name || '闹钟'}开关`"
              @click="toggleAlarm(alarm)"
            >
              <span class="toggle-track"><span></span></span><span>{{ alarm.enabled ? '开' : '关' }}</span>
            </button>
          </div>
          <div v-if="!alarms.length" class="empty-state">没有闹钟</div>
        </div>
      </template>
      <template v-else-if="tab === 'world'">
        <div class="world-view">
          <div class="world-map-stage"><img :src="worldMap" class="world-map" alt="世界地图" /></div>
          <div class="world-cities">
            <div
              v-for="city in worldCities"
              :key="city.zone"
              class="city-tile"
              :style="{ left: city.x + '%', top: city.y + '%' }"
            >
              <strong>{{ zoneTime(city.zone) }}</strong
              ><span>{{ city.name }}</span
              ><small>{{ zoneDay(city.zone) }}</small
              ><button
                v-if="!city.local"
                :aria-label="`删除${city.name}`"
                title="删除时钟"
                @click="removeCity(city.zone)"
              >
                <span class="mdl" aria-hidden="true">&#xE8BB;</span>
              </button>
            </div>
          </div>
          <div v-if="cityPicker" class="city-picker">
            <input v-model="citySearch" type="search" aria-label="搜索城市" placeholder="输入位置" /><button
              v-for="city in availableCities"
              :key="city.zone"
              @click="addCity(city.zone)"
            >
              {{ city.name }}<span>{{ zoneTime(city.zone) }}</span>
            </button>
            <p v-if="!availableCities.length">没有可添加的城市</p>
          </div>
        </div>
      </template>
      <template v-else-if="tab === 'timer'">
        <div class="timers" :class="{ single: timers.length === 1 }">
          <section v-for="timer in timers" :key="timer.id" class="timer-tile">
            <button
              class="timer-name"
              :disabled="timer.running"
              :aria-label="`编辑${timer.name}`"
              @click="editTimer(timer)"
            >
              {{ timer.name || '计时器' }}
            </button>
            <div class="timer-face" :class="{ running: timer.running }">
              <span>{{ durationText(remaining(timer)) }}</span>
            </div>
            <div class="timer-controls">
              <button
                class="circle-primary"
                :aria-label="timer.running ? '暂停计时器' : '开始计时器'"
                :title="timer.running ? '暂停' : '开始'"
                @click="toggleTimer(timer)"
              >
                <span class="mdl" aria-hidden="true">{{ timer.running ? '\uE769' : '\uE768' }}</span></button
              ><button
                class="circle-secondary"
                aria-label="重置计时器"
                title="重置"
                @click="resetTimer(timer)"
              >
                <span class="mdl" aria-hidden="true">&#xE72C;</span>
              </button>
            </div>
          </section>
          <div v-if="!timers.length" class="empty-state">没有计时器</div>
        </div>
      </template>
      <template v-else>
        <section class="stopwatch">
          <div class="stopwatch-time">
            {{ stopwatchText }}<small>{{ stopwatchFraction }}</small>
          </div>
          <div class="stopwatch-controls">
            <button
              class="circle-primary"
              :aria-label="stopwatchRunning ? '暂停秒表' : '开始秒表'"
              @click="toggleStopwatch"
            >
              <span class="mdl" aria-hidden="true">{{ stopwatchRunning ? '\uE769' : '\uE768' }}</span></button
            ><button
              class="circle-secondary"
              :disabled="!stopwatchRunning"
              aria-label="记录分段"
              title="分段"
              @click="lap"
            >
              <span class="mdl" aria-hidden="true">&#xE7C1;</span></button
            ><button
              class="circle-secondary"
              :disabled="stopwatchRunning || !stopwatchBase"
              aria-label="重置秒表"
              title="重置"
              @click="resetStopwatch"
            >
              <span class="mdl" aria-hidden="true">&#xE72C;</span>
            </button>
          </div>
          <div class="lap-list">
            <div v-for="(value, index) in [...laps].reverse()" :key="laps.length - index">
              <span>{{ laps.length - index }}</span
              ><span
                >{{ durationText(Math.floor(value / 1000) * 1000) }}.{{
                  String(Math.floor((value % 1000) / 10)).padStart(2, '0')
                }}</span
              >
            </div>
          </div>
        </section>
      </template>
    </div>
    <footer class="clock-appbar">
      <button aria-label="设置" title="设置" disabled>
        <span class="mdl" aria-hidden="true">&#xE713;</span></button
      ><span></span
      ><button
        v-if="!editing && tab !== 'stopwatch'"
        :aria-label="tab === 'alarm' ? '添加新闹钟' : tab === 'timer' ? '添加新计时器' : '添加城市'"
        :title="tab === 'alarm' ? '添加新闹钟' : tab === 'timer' ? '添加新计时器' : '添加城市'"
        @click="addItem"
      >
        <span class="mdl" aria-hidden="true">&#xE710;</span></button
      ><button v-if="!editing && tab === 'world'" aria-label="比较时间" title="比较时间" disabled>
        <span class="tab-icon" :style="{ maskImage: `url(${worldIcon})` }" aria-hidden="true"></span></button
      ><button aria-label="更多选项" title="更多选项" disabled>
        <span class="mdl" aria-hidden="true">&#xE712;</span>
      </button>
    </footer>
    <div v-if="alert" class="ring-overlay" role="alertdialog" :aria-label="alert.title">
      <span
        class="tab-icon ring-icon"
        :style="{ maskImage: `url(${alert.kind === 'alarm' ? alarmIcon : timerIcon})` }"
        aria-hidden="true"
      ></span>
      <h2>{{ alert.title }}</h2>
      <p>{{ alert.kind === 'alarm' ? '闹钟时间到了' : '计时器已结束' }}</p>
      <div>
        <button v-if="alert.kind === 'alarm'" @click="snooze">推迟 5 分钟</button
        ><button @click="alert = null">关闭</button>
      </div>
    </div>
    <div v-if="storageError" class="storage-error" role="alert">
      设置保存失败。<button @click="persist">重试</button>
    </div>
  </Win10Frame>
</template>
<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import { BrowserWindow, Dialog, System } from 'vtron';
import Win10Frame from './Win10Frame.vue';
import worldMap from './world-map.png';
import alarmIcon from './clock-alarm.svg';
import worldIcon from './clock-world.svg';
import timerIcon from './clock-timer.svg';
interface Alarm {
  id: string;
  name: string;
  hours: number;
  minutes: number;
  days: number[];
  enabled: boolean;
  nextAt: number;
}
interface Timer {
  id: string;
  name: string;
  duration: number;
  remaining: number;
  deadline: number;
  running: boolean;
}
const system = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');
const visible = ref(!document.hidden);
const tabs = [
  { id: 'alarm', name: '闹钟', icon: '', image: alarmIcon },
  { id: 'world', name: '世界时钟', icon: '', image: worldIcon },
  { id: 'timer', name: '计时器', icon: '', image: timerIcon },
  { id: 'stopwatch', name: '秒表', icon: '\uE916', image: '' },
] as const;
const tab = ref<'alarm' | 'world' | 'timer' | 'stopwatch'>('alarm');
const alarms = ref<Alarm[]>([
  {
    id: crypto.randomUUID(),
    name: '早上好',
    hours: 7,
    minutes: 0,
    days: [0, 1, 2, 3, 4, 5, 6],
    enabled: false,
    nextAt: 0,
  },
]);
const timers = ref<Timer[]>([
  {
    id: crypto.randomUUID(),
    name: '计时器',
    duration: 15 * 60000,
    remaining: 15 * 60000,
    deadline: 0,
    running: false,
  },
]);
const now = ref(Date.now());
const monotonicNow = ref(performance.now());
const storageError = ref(false);
const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];
const editing = ref<{ kind: 'alarm' | 'timer'; id?: string } | null>(null);
const draft = ref({ hours: 7, minutes: 0, seconds: 0, name: '', days: [] as number[] });
const formError = ref('');
const alert = ref<{ kind: 'alarm' | 'timer'; id: string; title: string } | null>(null);
const folder = `${system._options.userLocation || '/C/Users/'}Note`;
const statePath = `${folder}/.alarms-clock.json`;
const ready = ref(false);
let alive = true;
let ticker: ReturnType<typeof setInterval> | undefined;
let writeQueue = Promise.resolve();
const cities = [
  { name: '北京', zone: 'Asia/Shanghai', x: 82.3, y: 33.4 },
  { name: '东京', zone: 'Asia/Tokyo', x: 88.8, y: 36.2 },
  { name: '新加坡', zone: 'Asia/Singapore', x: 78.8, y: 59.2 },
  { name: '新德里', zone: 'Asia/Kolkata', x: 71.4, y: 40.9 },
  { name: '伦敦', zone: 'Europe/London', x: 50, y: 25.7 },
  { name: '巴黎', zone: 'Europe/Paris', x: 50.7, y: 27.4 },
  { name: '莫斯科', zone: 'Europe/Moscow', x: 60.5, y: 22.9 },
  { name: '纽约', zone: 'America/New_York', x: 29.4, y: 32.9 },
  { name: '洛杉矶', zone: 'America/Los_Angeles', x: 17.2, y: 37.3 },
  { name: '里约热内卢', zone: 'America/Sao_Paulo', x: 38, y: 75.3 },
  { name: '约翰内斯堡', zone: 'Africa/Johannesburg', x: 57.8, y: 77.5 },
  { name: '悉尼', zone: 'Australia/Sydney', x: 92, y: 82.6 },
];
const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const addedZones = ref<string[]>([]);
const worldCities = computed(() => [
  {
    ...(cities.find((city) => city.zone === localZone) || { x: 82, y: 20 }),
    name: '本地时间',
    zone: localZone,
    local: true,
  },
  ...cities
    .filter((city) => addedZones.value.includes(city.zone) && city.zone !== localZone)
    .map((city) => ({ ...city, local: false })),
]);
const cityPicker = ref(false);
const citySearch = ref('');
const availableCities = computed(() =>
  cities.filter(
    (city) =>
      city.zone !== localZone &&
      !addedZones.value.includes(city.zone) &&
      city.name.includes(citySearch.value.trim())
  )
);
function zoneTime(zone: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now.value);
}
function zoneDay(zone: string) {
  return new Intl.DateTimeFormat('zh-CN', { timeZone: zone, weekday: 'long' }).format(now.value);
}
function addCity(zone: string) {
  addedZones.value.push(zone);
  cityPicker.value = false;
  citySearch.value = '';
  void persist();
}
function removeCity(zone: string) {
  addedZones.value = addedZones.value.filter((value) => value !== zone);
  void persist();
}
function pad(value: number) {
  return String(value).padStart(2, '0');
}
function durationText(value: number) {
  const seconds = Math.max(0, Math.ceil(value / 1000));
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}
function repeatLabel(days: number[]) {
  if (!days.length) return '仅一次';
  if (days.length === 7) return '每天';
  if ([1, 2, 3, 4, 5].every((day) => days.includes(day)) && days.length === 5) return '工作日';
  return days.map((day) => `周${weekdayLabels[day]}`).join('、');
}
function nextOccurrence(alarm: Alarm, from = Date.now()) {
  for (let offset = 0; offset < 8; offset++) {
    const candidate = new Date(from);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(alarm.hours, alarm.minutes, 0, 0);
    if (candidate.getTime() > from && (!alarm.days.length || alarm.days.includes(candidate.getDay())))
      return candidate.getTime();
  }
  return 0;
}
function toggleAlarm(alarm: Alarm) {
  if (!ready.value) return;
  alarm.enabled = !alarm.enabled;
  alarm.nextAt = alarm.enabled ? nextOccurrence(alarm) : 0;
  void persist();
}
function editAlarm(alarm?: Alarm) {
  if (!ready.value) return;
  editing.value = { kind: 'alarm', id: alarm?.id };
  draft.value = {
    hours: alarm?.hours ?? 7,
    minutes: alarm?.minutes ?? 0,
    seconds: 0,
    name: alarm?.name || '闹钟',
    days: [...(alarm?.days || [])],
  };
  formError.value = '';
}
function editTimer(timer?: Timer) {
  if (!ready.value) return;
  if (timer?.running) return;
  const duration = timer?.duration ?? 15 * 60000;
  editing.value = { kind: 'timer', id: timer?.id };
  draft.value = {
    hours: Math.floor(duration / 3600000),
    minutes: Math.floor((duration % 3600000) / 60000),
    seconds: Math.floor((duration % 60000) / 1000),
    name: timer?.name || '计时器',
    days: [],
  };
  formError.value = '';
}
function toggleDay(day: number) {
  draft.value.days = draft.value.days.includes(day)
    ? draft.value.days.filter((value) => value !== day)
    : [...draft.value.days, day].sort();
}
function saveEdited() {
  if (!editing.value) return;
  const { hours, minutes, seconds } = draft.value;
  if (
    ![hours, minutes, seconds].every(Number.isInteger) ||
    hours < 0 ||
    hours > (editing.value.kind === 'alarm' ? 23 : 99) ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    formError.value = '请输入有效的时间。';
    return;
  }
  if (editing.value.kind === 'alarm') {
    const alarm: Alarm = {
      id: editing.value.id || crypto.randomUUID(),
      name: draft.value.name.trim() || '闹钟',
      hours,
      minutes,
      days: [...draft.value.days],
      enabled: true,
      nextAt: 0,
    };
    alarm.nextAt = nextOccurrence(alarm);
    const index = alarms.value.findIndex((item) => item.id === alarm.id);
    if (index >= 0) alarms.value[index] = alarm;
    else alarms.value.push(alarm);
  } else {
    const duration = (hours * 3600 + minutes * 60 + seconds) * 1000;
    if (!duration) {
      formError.value = '计时器时长必须大于零。';
      return;
    }
    const timer: Timer = {
      id: editing.value.id || crypto.randomUUID(),
      name: draft.value.name.trim() || '计时器',
      duration,
      remaining: duration,
      deadline: 0,
      running: false,
    };
    const index = timers.value.findIndex((item) => item.id === timer.id);
    if (index >= 0) timers.value[index] = timer;
    else timers.value.push(timer);
  }
  editing.value = null;
  void persist();
}
async function deleteEdited() {
  if (!editing.value?.id) return;
  const edit = { ...editing.value };
  const result = await Dialog.showMessageBox({
    title: '删除',
    message: `确定要删除此${edit.kind === 'alarm' ? '闹钟' : '计时器'}吗？`,
    type: 'warning',
    buttons: ['删除', '取消'],
  });
  if (result.response !== 0 || !alive) return;
  if (edit.kind === 'alarm') alarms.value = alarms.value.filter((alarm) => alarm.id !== edit.id);
  else timers.value = timers.value.filter((timer) => timer.id !== edit.id);
  editing.value = null;
  void persist();
}
function addItem() {
  if (!ready.value) return;
  if (tab.value === 'alarm') editAlarm();
  else if (tab.value === 'timer') editTimer();
  else if (tab.value === 'world') cityPicker.value = !cityPicker.value;
}
function remaining(timer: Timer) {
  return timer.running ? Math.max(0, timer.deadline - now.value) : timer.remaining;
}
function toggleTimer(timer: Timer) {
  if (!ready.value) return;
  if (timer.running) {
    timer.remaining = remaining(timer);
    timer.running = false;
    timer.deadline = 0;
  } else {
    if (timer.remaining <= 0) timer.remaining = timer.duration;
    timer.deadline = Date.now() + timer.remaining;
    timer.running = true;
    now.value = Date.now();
  }
  void persist();
}
function resetTimer(timer: Timer) {
  if (!ready.value) return;
  timer.running = false;
  timer.deadline = 0;
  timer.remaining = timer.duration;
  void persist();
}
const stopwatchRunning = ref(false);
const stopwatchBase = ref(0);
let stopwatchStarted = 0;
const laps = ref<number[]>([]);
const stopwatchElapsed = computed(
  () => stopwatchBase.value + (stopwatchRunning.value ? monotonicNow.value - stopwatchStarted : 0)
);
const stopwatchText = computed(() => durationText(Math.floor(stopwatchElapsed.value / 1000) * 1000));
const stopwatchFraction = computed(() => '.' + pad(Math.floor((stopwatchElapsed.value % 1000) / 10)));
let frameId = 0;
function animateStopwatch() {
  monotonicNow.value = performance.now();
  frameId = requestAnimationFrame(animateStopwatch);
}
function onVisibility() {
  visible.value = !document.hidden;
}
watch(
  () =>
    stopwatchRunning.value &&
    tab.value === 'stopwatch' &&
    visible.value &&
    win?.windowInfo.state !== 'minimize',
  (active) => {
    cancelAnimationFrame(frameId);
    if (active) frameId = requestAnimationFrame(animateStopwatch);
  }
);
function toggleStopwatch() {
  if (stopwatchRunning.value) {
    stopwatchBase.value += performance.now() - stopwatchStarted;
    stopwatchRunning.value = false;
  } else {
    stopwatchStarted = performance.now();
    monotonicNow.value = stopwatchStarted;
    stopwatchRunning.value = true;
  }
}
function resetStopwatch() {
  stopwatchRunning.value = false;
  stopwatchBase.value = 0;
  laps.value = [];
}
function lap() {
  if (stopwatchRunning.value) laps.value.push(stopwatchBase.value + performance.now() - stopwatchStarted);
}
function notify(kind: 'alarm' | 'timer', id: string, title: string) {
  alert.value = { kind, id, title };
  system.createNotify({ title: kind === 'alarm' ? '闹钟' : '计时器', content: title });
}
function snooze() {
  if (!alert.value) return;
  const alarm = alarms.value.find((item) => item.id === alert.value!.id);
  if (alarm) {
    alarm.enabled = true;
    alarm.nextAt = Date.now() + 5 * 60000;
    void persist();
  }
  alert.value = null;
}
function tick() {
  now.value = Date.now();
  monotonicNow.value = performance.now();
  let changed = false;
  for (const alarm of alarms.value) {
    if (!alarm.enabled || !alarm.nextAt || alarm.nextAt > now.value) continue;
    if (now.value - alarm.nextAt < 60000) notify('alarm', alarm.id, alarm.name);
    if (!alarm.days.length) {
      alarm.enabled = false;
      alarm.nextAt = 0;
    } else alarm.nextAt = nextOccurrence(alarm, now.value);
    changed = true;
  }
  for (const timer of timers.value) {
    if (timer.running && timer.deadline <= now.value) {
      timer.running = false;
      timer.remaining = 0;
      timer.deadline = 0;
      notify('timer', timer.id, timer.name);
      changed = true;
    }
  }
  if (changed) void persist();
}
function persist(): Promise<void> {
  if (!ready.value) return Promise.resolve();
  const snapshot = JSON.stringify({ alarms: alarms.value, timers: timers.value, zones: addedZones.value });
  writeQueue = writeQueue
    .catch(() => {})
    .then(async () => {
      if (!(await system.fs.exists(folder))) await system.fs.mkdir(folder);
      await system.fs.writeFile(statePath, snapshot);
      storageError.value = false;
    })
    .catch(() => {
      storageError.value = true;
    });
  return writeQueue;
}
function validNumber(value: unknown, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}
onMounted(async () => {
  try {
    const raw = await system.fs.readFile(statePath);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.alarms))
        alarms.value = saved.alarms
          .filter(
            (alarm: any) =>
              alarm &&
              typeof alarm.id === 'string' &&
              typeof alarm.name === 'string' &&
              validNumber(alarm.hours, 0, 23) &&
              validNumber(alarm.minutes, 0, 59) &&
              Array.isArray(alarm.days)
          )
          .map((alarm: any) => ({
            ...alarm,
            days: alarm.days.filter(
              (day: unknown) => Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6
            ),
            enabled: !!alarm.enabled,
            nextAt: validNumber(alarm.nextAt, 0, Number.MAX_SAFE_INTEGER) ? alarm.nextAt : 0,
          }));
      if (Array.isArray(saved.timers))
        timers.value = saved.timers
          .filter(
            (timer: any) =>
              timer &&
              typeof timer.id === 'string' &&
              typeof timer.name === 'string' &&
              validNumber(timer.duration, 1000, 360000000) &&
              validNumber(timer.remaining, 0, 360000000)
          )
          .map((timer: any) => ({
            ...timer,
            running: !!timer.running && validNumber(timer.deadline, 1, Number.MAX_SAFE_INTEGER),
            deadline: validNumber(timer.deadline, 0, Number.MAX_SAFE_INTEGER) ? timer.deadline : 0,
          }));
      if (Array.isArray(saved.zones))
        addedZones.value = [
          ...new Set(saved.zones.filter((zone: unknown) => cities.some((city) => city.zone === zone))),
        ] as string[];
    }
  } catch {
    storageError.value = true;
  }
  for (const alarm of alarms.value) if (alarm.enabled && !alarm.nextAt) alarm.nextAt = nextOccurrence(alarm);
  ready.value = true;
  if (alive) {
    tick();
    ticker = setInterval(tick, 250);
    document.addEventListener('visibilitychange', onVisibility);
  }
});
onUnmounted(() => {
  alive = false;
  clearInterval(ticker);
  cancelAnimationFrame(frameId);
  document.removeEventListener('visibilitychange', onVisibility);
  void persist();
});
</script>
<style scoped>
button,
input,
select {
  font: inherit;
  color: inherit;
}
button {
  border: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  cursor: default;
}
button:disabled {
  opacity: 0.35;
}
button:focus-visible {
  outline: 1px dotted currentColor;
  outline-offset: -3px;
}
.mdl {
  font: 20px/1 'SEGOEUIMDL';
}
.clock-tabs {
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  height: 68px;
  background: #e6e6e6;
  padding-left: 13px;
}
.clock-tabs button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 80px;
  padding: 0 4px;
  color: #666;
  font-size: 12px;
}
.clock-tabs button:hover {
  background: #d8d8d8;
}
.clock-tabs button.active {
  color: #0078d7;
}
.clock-tabs button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #0078d7;
}
.clock-tabs .mdl {
  font-size: 18px;
}
.tab-icon {
  display: block;
  width: 18px;
  height: 18px;
  background: currentColor;
  mask-size: contain;
  mask-position: center;
  mask-repeat: no-repeat;
}
.awake-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-height: 29px;
  padding: 5px 12px;
  color: #9b4e35;
  background: #ededed;
  font-size: 12px;
}
.awake-notice .mdl {
  font-size: 14px;
}
.clock-content {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #f2f2f2;
}
.alarm-list {
  flex: 1;
  padding: 4px 12px;
}
.alarm-row {
  display: flex;
  align-items: center;
  gap: 20px;
  min-height: 110px;
  width: 100%;
  max-width: 560px;
}
.alarm-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  width: 260px;
  padding: 8px 0;
  text-align: left;
}
.alarm-main:hover {
  background: #e8e8e8;
}
.alarm-time {
  font-size: 34px;
  font-weight: 300;
  line-height: 1.1;
}
.alarm-main strong {
  font-size: 14px;
  font-weight: 600;
}
.alarm-row.off .alarm-main {
  color: #777;
}
.alarm-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 5px;
}
.toggle-track {
  display: flex;
  align-items: center;
  width: 40px;
  height: 20px;
  padding: 3px;
  border: 1px solid #666;
  border-radius: 12px;
  background: transparent;
}
.toggle-track > span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #777;
}
.alarm-toggle[aria-checked='true'] .toggle-track {
  background: #0078d7;
  border-color: #0078d7;
}
.alarm-toggle[aria-checked='true'] .toggle-track > span {
  margin-left: auto;
  background: #fff;
}
.empty-state {
  width: 100%;
  padding: 60px 20px;
  text-align: center;
  color: #777;
}
.clock-appbar {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 50px;
  padding: 0 8px;
  background: #e6e6e6;
}
.clock-appbar > span {
  flex: 1;
}
.clock-appbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 44px;
}
.clock-appbar button:hover:enabled {
  background: #d0d0d0;
}
.world-view {
  position: relative;
  flex: 1;
  min-height: 280px;
  background: #fff;
  overflow: hidden;
}
.world-map-stage {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  aspect-ratio: 874 / 368;
  overflow: hidden;
}
.world-map {
  position: absolute;
  top: -5.44%;
  left: -3.89%;
  width: 109.84%;
  height: auto;
  max-width: none;
  opacity: 0.75;
}
.world-cities {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  aspect-ratio: 874 / 368;
}
.city-tile {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0;
  color: white;
  width: 80px;
  transform: translate(0, -100%);
}
.city-tile::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: -3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #111;
}
.city-tile strong {
  box-sizing: border-box;
  width: 100%;
  padding: 4px 8px 0;
  background: #2982cc;
  font-size: 14px;
  font-weight: 600;
}
.city-tile > span {
  box-sizing: border-box;
  width: 100%;
  padding: 0 8px 3px;
  background: #2982cc;
  font-size: 12px;
}
.city-tile small {
  font-size: 12px;
  padding: 1px 8px;
  background: #1c5e96;
}
.city-tile > button {
  position: absolute;
  top: 0;
  right: -21px;
  width: 21px;
  height: 22px;
  padding: 0;
  color: #fff;
  background: #2588cd;
}
.city-tile > button .mdl {
  font-size: 9px;
}
.city-picker {
  position: absolute;
  z-index: 2;
  top: 0;
  bottom: 0;
  left: 0;
  width: 245px;
  padding: 12px;
  overflow: auto;
  background: #f2f2f2;
  box-shadow: 2px 0 6px #0002;
}
.city-picker > input {
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  padding: 5px 8px;
  border: 1px solid #888;
  background: #fff;
  outline: 0;
}
.city-picker > button {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 38px;
  padding: 8px 3px;
  text-align: left;
}
.city-picker > button:hover {
  background: #ddd;
}
.city-picker > button > span {
  color: #666;
}
.editor-page {
  box-sizing: border-box;
  flex: 1;
  padding: 20px 24px;
  overflow: auto;
}
.time-inputs {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 20px;
}
.time-inputs > b {
  padding-top: 7px;
  font-size: 38px;
  font-weight: 300;
}
.time-inputs label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  color: #666;
}
.time-inputs input {
  box-sizing: border-box;
  width: 88px;
  height: 64px;
  padding: 5px 8px;
  border: 1px solid #aaa;
  background: #fff;
  font-size: 38px;
  font-weight: 300;
  text-align: center;
}
.edit-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 340px;
  margin-bottom: 18px;
  font-size: 14px;
}
.edit-label > input,
.edit-label > select {
  box-sizing: border-box;
  min-height: 32px;
  border: 1px solid #888;
  background: #fff;
  padding: 5px 8px;
}
.edit-label > select:disabled {
  color: #777;
  border-color: #bbb;
  background: #ececec;
}
.repeat-days {
  display: flex;
  gap: 5px;
}
.repeat-days > button {
  width: 35px;
  height: 30px;
  border: 1px solid #888;
  background: #ddd;
}
.repeat-days > button.checked {
  border-color: #0078d7;
  background: #0078d7;
  color: #fff;
}
.repeat-description {
  color: #777;
  font-size: 12px;
}
.edit-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
}
.edit-actions > span {
  flex: 1;
}
.edit-actions button {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 68px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid #aaa;
  background: #e5e5e5;
}
.edit-actions .mdl {
  font-size: 16px;
}
.form-error {
  color: #b52619;
}
.timers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  width: 100%;
  align-content: start;
  gap: 24px;
  padding: 20px;
}
.timers.single {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.timer-tile {
  min-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.timer-name {
  font-size: 16px;
}
.timer-face {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 186px;
  height: 186px;
  border: 3px solid #b6b6b6;
  border-radius: 50%;
  color: #555;
}
.timer-face.running {
  border-color: #0078d7;
  color: #111;
}
.timer-face > span {
  font-size: 32px;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
}
.timer-controls,
.stopwatch-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
}
.circle-primary,
.circle-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  padding: 0;
  border-radius: 50%;
}
.circle-primary {
  color: #fff;
  background: #0078d7;
}
.circle-primary:hover {
  background: #0063b1;
}
.circle-secondary {
  border: 1px solid #777;
  background: transparent;
}
.circle-secondary:hover:enabled {
  background: #ddd;
}
.circle-primary .mdl {
  font-size: 20px;
}
.circle-secondary .mdl {
  font-size: 18px;
}
.stopwatch {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px 15px;
}
.stopwatch-time {
  font-size: clamp(36px, 7vw, 66px);
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  white-space: nowrap;
}
.stopwatch-time small {
  font-size: 0.62em;
}
.stopwatch-controls {
  margin-top: 30px;
}
.lap-list {
  width: 100%;
  max-width: 400px;
  overflow: auto;
  margin-top: 25px;
}
.lap-list > div {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  padding: 8px 12px;
  border-bottom: 1px solid #ddd;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}
.ring-overlay {
  position: absolute;
  z-index: 10;
  inset: 100px 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f2f2f2f7;
  text-align: center;
  padding: 24px;
}
.ring-icon {
  color: #0078d7;
  width: 50px;
  height: 50px;
}
.ring-overlay h2 {
  font-size: 30px;
  font-weight: 300;
  margin: 20px 0 6px;
}
.ring-overlay p {
  font-size: 16px;
  margin: 0 0 28px;
}
.ring-overlay > div {
  display: flex;
  gap: 12px;
}
.ring-overlay button {
  min-width: 100px;
  padding: 8px 16px;
  border: 1px solid #888;
  background: #ddd;
}
.storage-error {
  flex-shrink: 0;
  padding: 4px 12px;
  background: #fff3e1;
  color: #a12616;
  font-size: 11px;
}
.storage-error button {
  text-decoration: underline;
}
</style>

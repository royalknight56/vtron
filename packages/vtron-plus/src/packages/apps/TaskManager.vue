<template>
  <div class="tm-app">
    <nav class="tm-nav" aria-label="任务管理器视图">
      <button
        :class="{ active: tab === 'tasks' }"
        :aria-current="tab === 'tasks' ? 'page' : undefined"
        @click="tab = 'tasks'"
      >
        进程
      </button>
      <button
        :class="{ active: tab === 'perf' }"
        :aria-current="tab === 'perf' ? 'page' : undefined"
        @click="tab = 'perf'"
      >
        性能
      </button>
    </nav>

    <main class="tm-main">
      <template v-if="tab === 'tasks'">
        <div class="search-bar">
          <input
            v-model="query"
            type="search"
            aria-label="搜索应用名称或窗口 ID"
            placeholder="搜索名称或窗口 ID"
            @keydown.esc="query = ''"
          />
        </div>
        <div class="task-list">
          <table aria-label="运行中的应用窗口">
            <thead>
              <tr>
                <th
                  v-for="column in columns"
                  :key="column.key"
                  :class="'col-' + column.key"
                  :aria-sort="sortCol === column.key ? (sortAsc ? 'ascending' : 'descending') : 'none'"
                >
                  <button @click="toggleSort(column.key)">
                    {{ column.label
                    }}<span class="sort-arrow" aria-hidden="true">{{
                      sortCol === column.key ? (sortAsc ? '↑' : '↓') : ''
                    }}</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="task in sortedTasks"
                :key="task.id"
                :class="{ selected: selectedId === task.id }"
                :tabindex="
                  selectedId === task.id || (selectedId === null && task.id === sortedTasks[0]?.id) ? 0 : -1
                "
                :aria-label="`${task.title}，${stateLabel(task.win)}，窗口 ID ${task.id}`"
                @click="selectedId = task.id"
                @focus="selectedId = task.id"
                @dblclick="focusTask(task.win)"
                @keydown="onRowKey($event, task.id)"
              >
                <td>
                  <div class="task-name">
                    <img v-if="task.icon" :src="task.icon" alt="" /><svg
                      v-else
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <rect x="2" y="3" width="16" height="14" rx="2" />
                      <path d="M2 7h16" /></svg
                    ><span :title="task.title">{{ task.title }}</span>
                  </div>
                </td>
                <td>
                  <span class="task-status" :class="{ muted: task.win.isMinimized() }">{{
                    stateLabel(task.win)
                  }}</span>
                </td>
                <td class="number">{{ task.id }}</td>
                <td class="number">
                  {{ Math.round(task.win.windowInfo.width) }} × {{ Math.round(task.win.windowInfo.height) }}
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="!sortedTasks.length" class="empty">
            {{ query.trim() ? '未找到匹配的任务' : '暂无运行中的应用窗口' }}
          </div>
        </div>
        <footer class="tm-footer">
          <span
            >{{ query.trim() ? `${sortedTasks.length} / ${tasks.length}` : tasks.length }} 个应用窗口</span
          >
          <div class="task-actions">
            <button :disabled="!selected" @click="focusSelected">切换到</button>
            <button :disabled="!canMinimize" @click="minimizeSelected">最小化</button>
            <button :disabled="!selected" @click="closeSelected">结束任务</button>
          </div>
        </footer>
      </template>

      <template v-else>
        <header class="tm-toolbar">
          <span>页面性能</span><span class="sampling-status">{{ sampling ? '每秒更新' : '采样已暂停' }}</span>
        </header>
        <div class="perf-content">
          <section class="metric" aria-labelledby="fps-title">
            <div class="metric-heading">
              <h2 id="fps-title">页面帧率</h2>
              <span class="metric-value">{{ fps === null ? '—' : fps }} <small>FPS</small></span>
            </div>
            <div class="chart-scale">
              <span>{{ fpsMax }} FPS</span>
            </div>
            <svg
              class="chart fps-chart"
              viewBox="0 0 600 120"
              preserveAspectRatio="none"
              role="img"
              aria-label="最近 60 秒的页面帧率"
            >
              <path
                class="chart-grid"
                d="M0 30H600M0 60H600M0 90H600M100 0V120M200 0V120M300 0V120M400 0V120M500 0V120"
              />
              <path class="chart-area" :d="chartArea(fpsHistory, fpsMax)" />
              <path class="chart-line" :d="chartLine(fpsHistory, fpsMax)" />
            </svg>
            <div class="chart-scale"><span>60 秒前</span><span>现在</span></div>
          </section>
          <section class="metric" aria-labelledby="memory-title">
            <div class="metric-heading">
              <h2 id="memory-title">页面 JS 堆内存</h2>
              <span class="metric-value"
                >{{ memory ? formatMB(memory.used) : '不可用' }}<small v-if="memory"> MB</small></span
              >
            </div>
            <template v-if="memory">
              <div class="chart-scale">
                <span>{{ formatMB(memoryMax) }} MB</span>
              </div>
              <svg
                class="chart memory-chart"
                viewBox="0 0 600 120"
                preserveAspectRatio="none"
                role="img"
                aria-label="最近 60 秒的页面 JS 堆内存"
              >
                <path
                  class="chart-grid"
                  d="M0 30H600M0 60H600M0 90H600M100 0V120M200 0V120M300 0V120M400 0V120M500 0V120"
                />
                <path class="chart-area" :d="chartArea(memoryHistory, memoryMax)" />
                <path class="chart-line" :d="chartLine(memoryHistory, memoryMax)" />
              </svg>
              <div class="chart-scale">
                <span>60 秒前</span><span>堆上限 {{ formatMB(memory.limit) }} MB</span>
              </div>
            </template>
            <div v-else class="memory-unavailable">当前浏览器未提供 JS 堆内存数据</div>
          </section>
          <dl class="system-info">
            <div>
              <dt>应用窗口</dt>
              <dd>{{ tasks.length }}</dd>
            </div>
            <div>
              <dt>页面运行时间</dt>
              <dd>{{ uptime }}</dd>
            </div>
            <div>
              <dt>逻辑处理器</dt>
              <dd>{{ cores || '不可用' }}</dd>
            </div>
            <div>
              <dt>语言</dt>
              <dd>{{ language }}</dd>
            </div>
          </dl>
          <p class="metric-note">数据来自当前浏览器页面，不包含系统 CPU 占用及各应用的独立内存。</p>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import { BrowserWindow, System } from 'vtron';

const sys = inject<System>('system')!;
const selfWin = inject<BrowserWindow>('browserWindow');
const tab = ref<'tasks' | 'perf'>('tasks');
const query = ref('');
const selectedId = ref<number | null>(null);
type SortColumn = 'name' | 'status' | 'id' | 'size';
const columns: { key: SortColumn; label: string }[] = [
  { key: 'name', label: '名称' },
  { key: 'status', label: '状态' },
  { key: 'id', label: '窗口 ID' },
  { key: 'size', label: '窗口尺寸' },
];
const sortCol = ref<SortColumn>('name');
const sortAsc = ref(true);
const tasks = computed(() =>
  sys.stateManager.windowTree.windowOrder
    .filter((win) => win.windowInfo.isCreated)
    .map((win) => ({
      id: win.id,
      title: win.windowInfo.title || '无标题窗口',
      icon: win.windowInfo.icon,
      win,
    }))
);
const sortedTasks = computed(() => {
  const search = query.value.trim().toLocaleLowerCase();
  return tasks.value
    .filter(
      (task) => !search || task.title.toLocaleLowerCase().includes(search) || String(task.id).includes(search)
    )
    .sort((a, b) => {
      let diff = 0;
      if (sortCol.value === 'name') diff = a.title.localeCompare(b.title, 'zh-CN');
      if (sortCol.value === 'status') diff = stateLabel(a.win).localeCompare(stateLabel(b.win), 'zh-CN');
      if (sortCol.value === 'id') diff = a.id - b.id;
      if (sortCol.value === 'size')
        diff =
          a.win.windowInfo.width * a.win.windowInfo.height - b.win.windowInfo.width * b.win.windowInfo.height;
      return (diff || a.id - b.id) * (sortAsc.value ? 1 : -1);
    });
});
const selected = computed(() => sortedTasks.value.find((task) => task.id === selectedId.value));
const canMinimize = computed(
  () => selected.value && selected.value.win.isMinimizable() && !selected.value.win.isMinimized()
);
watch(sortedTasks, (list) => {
  if (!list.some((task) => task.id === selectedId.value)) selectedId.value = null;
});
function toggleSort(column: SortColumn) {
  if (sortCol.value === column) sortAsc.value = !sortAsc.value;
  else {
    sortCol.value = column;
    sortAsc.value = true;
  }
}
type TaskWindow = Pick<
  BrowserWindow,
  'windowInfo' | 'isMinimized' | 'isMaximized' | 'isFullScreen' | 'isDestroyed' | 'restore' | 'moveTop'
>;
function stateLabel(win: TaskWindow) {
  if (win.isMinimized()) return '已最小化';
  if (win.windowInfo.istop) return '前台运行';
  if (win.isMaximized()) return '已最大化';
  if (win.isFullScreen()) return '全屏';
  return '运行中';
}
function focusTask(win: TaskWindow) {
  if (win.isDestroyed()) return;
  if (win.isMinimized()) win.restore();
  win.moveTop();
}
function focusSelected() {
  if (selected.value) focusTask(selected.value.win);
}
function minimizeSelected() {
  if (canMinimize.value) selected.value!.win.minimize();
}
function closeSelected() {
  selected.value?.win.close();
}
function onRowKey(event: KeyboardEvent, id: number) {
  if (event.key === 'Enter') {
    event.preventDefault();
    focusSelected();
    return;
  }
  const index = sortedTasks.value.findIndex((task) => task.id === id);
  let next = index;
  if (event.key === 'ArrowDown') next = Math.min(index + 1, sortedTasks.value.length - 1);
  else if (event.key === 'ArrowUp') next = Math.max(index - 1, 0);
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = sortedTasks.value.length - 1;
  else return;
  event.preventDefault();
  selectedId.value = sortedTasks.value[next].id;
  const rows = (event.currentTarget as HTMLElement).parentElement?.children;
  (rows?.[next] as HTMLElement | undefined)?.focus();
}

const cores = navigator.hardwareConcurrency;
const language = navigator.language;
const visible = ref(!document.hidden);
const sampling = computed(
  () => tab.value === 'perf' && visible.value && selfWin?.windowInfo.state !== 'minimize'
);
const fps = ref<number | null>(null);
const fpsHistory = ref<(number | null)[]>([]);
const memoryHistory = ref<(number | null)[]>([]);
const memory = ref<{ used: number; limit: number } | null>(null);
const uptime = ref('0:00:00');
const fpsMax = computed(() =>
  Math.max(60, Math.ceil(Math.max(...fpsHistory.value.map((value) => value ?? 0)) / 30) * 30)
);
const memoryMax = computed(() =>
  Math.max(64, Math.ceil(Math.max(...memoryHistory.value.map((value) => value ?? 0)) / 64) * 64)
);
function formatMB(value: number) {
  return value.toLocaleString('zh-CN', { maximumFractionDigits: 1 });
}
const maxPoints = 60;
function pushSample(history: (number | null)[], value: number | null) {
  history.push(value);
  if (history.length > maxPoints) history.shift();
}
function chartSegments(history: (number | null)[], max: number) {
  const segments: string[][] = [];
  history.forEach((value, index) => {
    if (value === null) return;
    if (index === 0 || history[index - 1] === null) segments.push([]);
    const x = ((maxPoints - history.length + index) * 600) / (maxPoints - 1);
    const y = 119 - Math.min(1, Math.max(0, value / max)) * 118;
    segments[segments.length - 1].push(`${x.toFixed(1)},${y.toFixed(1)}`);
  });
  return segments;
}
function chartLine(history: (number | null)[], max: number) {
  return chartSegments(history, max)
    .map((points) => `M${points.join('L')}`)
    .join('');
}
function chartArea(history: (number | null)[], max: number) {
  return chartSegments(history, max)
    .map(
      (points) =>
        `M${points[0].split(',')[0]},120L${points.join('L')}L${points[points.length - 1].split(',')[0]},120Z`
    )
    .join('');
}
let frameCount = 0;
let lastSample = 0;
let lastHistoryTime = 0;
let rafId = 0;
let intervalId: ReturnType<typeof setInterval> | undefined;
function countFrame() {
  frameCount++;
  rafId = requestAnimationFrame(countFrame);
}
function readMemory() {
  const info = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } })
    .memory;
  memory.value =
    info && Number.isFinite(info.usedJSHeapSize) && info.usedJSHeapSize >= 0 && info.jsHeapSizeLimit > 0
      ? { used: info.usedJSHeapSize / 1048576, limit: info.jsHeapSizeLimit / 1048576 }
      : null;
}
function updateUptime() {
  const seconds = Math.floor(performance.now() / 1000);
  uptime.value = `${Math.floor(seconds / 3600)}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
function sample() {
  const now = performance.now();
  // Preserve elapsed time as gaps when the page or task manager was hidden.
  if (lastHistoryTime) {
    const missing = Math.min(maxPoints, Math.max(0, Math.round((now - lastHistoryTime) / 1000) - 1));
    for (let i = 0; i < missing; i++) {
      pushSample(fpsHistory.value, null);
      pushSample(memoryHistory.value, null);
    }
  }
  fps.value = Math.round((frameCount * 1000) / (now - lastSample));
  frameCount = 0;
  lastSample = lastHistoryTime = now;
  readMemory();
  updateUptime();
  pushSample(fpsHistory.value, fps.value);
  pushSample(memoryHistory.value, memory.value?.used ?? null);
}
function stopSampling() {
  cancelAnimationFrame(rafId);
  clearInterval(intervalId);
  intervalId = undefined;
  fps.value = null;
}
function startSampling() {
  stopSampling();
  frameCount = 0;
  lastSample = performance.now();
  readMemory();
  updateUptime();
  rafId = requestAnimationFrame(countFrame);
  intervalId = setInterval(sample, 1000);
}
function onVisibilityChange() {
  visible.value = !document.hidden;
}
watch(sampling, (active) => (active ? startSampling() : stopSampling()));
onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange));
onUnmounted(() => {
  stopSampling();
  document.removeEventListener('visibilitychange', onVisibilityChange);
});
</script>

<style scoped>
.tm-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: #202020;
  background: #fff;
  font:
    12px/1.5 'Segoe UI',
    'Microsoft YaHei',
    sans-serif;
  user-select: none;
  container-type: inline-size;
}
.tm-app *,
.tm-app *::before,
.tm-app *::after {
  box-sizing: border-box;
}
button,
input {
  font: inherit;
}
button {
  cursor: default;
}
button:disabled {
  color: #888;
  border-color: #d5d5d5;
  background: #eee;
}
button:focus-visible,
tr:focus-visible {
  outline: 1px dotted #202020;
  outline-offset: -4px;
}
input:focus-visible {
  outline: 1px solid #0078d7;
  outline-offset: -1px;
}
.tm-nav {
  display: flex;
  align-items: flex-end;
  flex-shrink: 0;
  height: 32px;
  padding: 5px 5px 0;
  border-bottom: 1px solid #aaa;
  background: #f0f0f0;
}
.tm-nav button {
  position: relative;
  min-width: 58px;
  height: 25px;
  margin: 0 2px -1px 0;
  padding: 2px 14px;
  border: 1px solid #aaa;
  border-radius: 0;
  color: #202020;
  background: #e9e9e9;
}
.tm-nav button:hover {
  background: #f7f7f7;
}
.tm-nav button.active {
  height: 27px;
  background: #fff;
  border-bottom-color: #fff;
}
.tm-main {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}
.search-bar {
  display: flex;
  justify-content: flex-end;
  padding: 10px 12px;
  border-bottom: 1px solid #ddd;
}
.search-bar input {
  width: 260px;
  max-width: 100%;
  height: 27px;
  padding: 3px 7px;
  color: #202020;
  background: #fff;
  border: 1px solid #aaa;
  border-radius: 0;
  user-select: text;
}
.task-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
}
thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #fff;
}
th {
  padding: 0;
  border-bottom: 1px solid #e5e5e5;
  font-weight: 400;
  text-align: left;
  color: #444;
}
th + th {
  border-left: 1px solid #e5e5e5;
}
th button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border: 0;
  background: transparent;
  color: inherit;
  white-space: nowrap;
  text-align: left;
}
th button:hover {
  background: #e5f3ff;
}
.sort-arrow {
  margin-left: 3px;
  color: #555;
}
.col-name {
  width: auto;
}
.col-status {
  width: 105px;
}
.col-id {
  width: 85px;
}
.col-size {
  width: 120px;
}
td {
  height: 34px;
  padding: 6px 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
td + td {
  border-left: 1px solid #f4f4f4;
}
tbody tr:hover {
  background: #e5f3ff;
}
tbody tr.selected {
  background: #cce8ff;
}
.task-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.task-name img,
.task-name svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  object-fit: contain;
}
.task-name svg {
  fill: none;
  stroke: #666;
  stroke-width: 1.3;
}
.task-name span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.task-status {
  color: #404040;
}
.task-status.muted {
  color: #777;
}
.number {
  color: #555;
  font-variant-numeric: tabular-nums;
}
.empty {
  padding: 60px 20px;
  color: #777;
  text-align: center;
}
.tm-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  min-height: 50px;
  padding: 10px 12px;
  border-top: 1px solid #ddd;
  background: #f0f0f0;
  flex-shrink: 0;
}
.task-actions {
  display: flex;
  gap: 7px;
  margin-left: auto;
}
.task-actions button {
  min-width: 76px;
  padding: 3px 10px;
  border: 1px solid #adadad;
  border-radius: 0;
  color: #202020;
  background: #e1e1e1;
  white-space: nowrap;
}
.task-actions button:hover:enabled {
  border-color: #0078d7;
  background: #e5f1fb;
}
.task-actions button:active:enabled {
  border-color: #005499;
  background: #cce4f7;
}
.task-actions button:disabled {
  color: #888;
  border-color: #ccc;
  background: #e9e9e9;
}
.tm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
}
.sampling-status {
  color: #777;
}
.perf-content {
  flex: 1;
  overflow: auto;
  padding: 16px 24px;
}
.metric + .metric {
  margin-top: 20px;
}
.metric-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}
h2 {
  margin: 0;
  font-size: 19px;
  font-weight: 400;
}
.metric-value {
  font-size: 22px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}
.metric-value small {
  font-size: 12px;
  color: #666;
}
.chart {
  display: block;
  width: 100%;
  height: 112px;
  border: 1px solid var(--chart-color);
  background: #fff;
  overflow: hidden;
}
.fps-chart {
  --chart-color: #2980a6;
  --chart-fill: #d9edf6;
}
.memory-chart {
  --chart-color: #8b57a4;
  --chart-fill: #eee3f3;
}
.chart-grid {
  stroke: #d9e8ee;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  fill: none;
}
.memory-chart .chart-grid {
  stroke: #e8deed;
}
.chart-area {
  fill: var(--chart-fill);
  fill-opacity: 0.65;
}
.chart-line {
  fill: none;
  stroke: var(--chart-color);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.chart-scale {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 11px;
  margin: 3px 0;
}
.memory-unavailable {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 112px;
  border: 1px solid #ddd;
  color: #777;
  background: #fafafa;
}
.system-info {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 30px;
  padding-top: 16px;
  margin: 20px 0 0;
  border-top: 1px solid #ddd;
}
.system-info div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
dt {
  color: #666;
}
dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.metric-note {
  margin: 16px 0 0;
  color: #777;
  font-size: 12px;
}
@container (max-width: 500px) {
  .col-size,
  td:last-child {
    display: none;
  }
  .col-id {
    width: 75px;
  }
  .col-status {
    width: 88px;
  }
  .system-info {
    grid-template-columns: 1fr;
  }
  .perf-content {
    padding: 14px;
  }
}
</style>

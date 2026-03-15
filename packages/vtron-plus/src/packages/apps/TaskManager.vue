<template>
  <div class="tm-app" ref="appRef">
    <div class="tab-bar">
      <button
        class="tab-btn"
        :class="{ active: tab === 'process' }"
        @click="tab = 'process'"
      >
        进程
      </button>
      <button
        class="tab-btn"
        :class="{ active: tab === 'perf' }"
        @click="tab = 'perf'"
      >
        性能
      </button>
    </div>

    <div v-show="tab === 'process'" class="tab-pane process-pane">
      <table class="proc-table">
        <thead>
          <tr>
            <th class="th-name" @click="toggleSort('name')">
              名称 {{ sortArrow('name') }}
            </th>
            <th class="th-status" @click="toggleSort('status')">
              状态 {{ sortArrow('status') }}
            </th>
            <th class="th-id" @click="toggleSort('id')">ID {{ sortArrow('id') }}</th>
            <th class="th-size">大小</th>
            <th class="th-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in sortedProcesses"
            :key="p.id"
            :class="{ highlight: p.istop }"
          >
            <td class="td-name">
              <img v-if="p.icon" :src="p.icon" class="proc-icon" />
              <span class="proc-name-text">{{ p.title || '(无标题)' }}</span>
            </td>
            <td>
              <span class="badge" :class="'badge-' + p.state">{{
                stateLabel(p.state)
              }}</span>
            </td>
            <td class="td-id">{{ p.id }}</td>
            <td class="td-size">{{ p.width }}×{{ p.height }}</td>
            <td class="td-actions">
              <button
                class="act-btn focus-btn"
                @click="doFocus(p.win)"
                title="聚焦"
              >
                ⬆
              </button>
              <button
                class="act-btn min-btn"
                @click="doMinimize(p.win)"
                title="最小化"
              >
                −
              </button>
              <button
                class="act-btn close-btn"
                @click="doClose(p.win)"
                title="结束任务"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="sortedProcesses.length === 0" class="empty">暂无运行中的进程</div>
      <div class="proc-footer">
        <span>进程数: {{ sortedProcesses.length }}</span>
        <button class="end-all-btn" @click="endAllOther">结束所有其他任务</button>
      </div>
    </div>

    <div v-show="tab === 'perf'" class="tab-pane perf-pane">
      <div class="chart-grid">
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-label">CPU</span>
            <span class="chart-val">{{ cpuPercent }}%</span>
          </div>
          <canvas ref="cpuCanvas" class="chart-cv"></canvas>
          <div class="chart-footer">逻辑处理器: {{ cores }}</div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <span class="chart-label">内存</span>
            <span class="chart-val">{{ memUsedMB }} MB</span>
          </div>
          <canvas ref="memCanvas" class="chart-cv"></canvas>
          <div class="chart-footer">{{ memInfo }}</div>
        </div>
      </div>
      <div class="sys-info">
        <div class="si-title">系统信息</div>
        <div class="si-row">
          <span>运行时间</span><span>{{ uptimeStr }}</span>
        </div>
        <div class="si-row">
          <span>窗口数</span><span>{{ windowCount }}</span>
        </div>
        <div class="si-row">
          <span>帧率</span><span>{{ currentFps }} FPS</span>
        </div>
        <div class="si-row">
          <span>处理器核心</span><span>{{ cores }}</span>
        </div>
        <div class="si-row">
          <span>平台</span><span>{{ platform }}</span>
        </div>
        <div class="si-row">
          <span>语言</span><span>{{ lang }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, computed, onMounted, onUnmounted } from 'vue';
import { System, BrowserWindow } from 'vtron';

const sys = inject<System>('system')!;
const selfWin = inject<BrowserWindow>('browserWindow');

const tab = ref<'process' | 'perf'>('process');

const sortCol = ref<'name' | 'status' | 'id'>('id');
const sortAsc = ref(true);

function toggleSort(col: 'name' | 'status' | 'id') {
  if (sortCol.value === col) sortAsc.value = !sortAsc.value;
  else {
    sortCol.value = col;
    sortAsc.value = true;
  }
}

function sortArrow(col: string) {
  if (sortCol.value !== col) return '';
  return sortAsc.value ? '↑' : '↓';
}

interface ProcInfo {
  id: number;
  title: string;
  icon: string;
  state: string;
  width: number;
  height: number;
  istop: boolean;
  win: BrowserWindow;
}

const processes = ref<ProcInfo[]>([]);

function refreshProcesses() {
  const order = sys.stateManager.windowTree.windowOrder;
  processes.value = order
    .filter((w: BrowserWindow) => w.windowInfo.isCreated)
    .map((w: BrowserWindow) => ({
      id: w.id,
      title: w.windowInfo.title || '',
      icon: w.windowInfo.icon,
      state: w.windowInfo.state,
      width: w.windowInfo.width,
      height: w.windowInfo.height,
      istop: w.windowInfo.istop,
      win: w,
    }));
}

const sortedProcesses = computed(() => {
  const list = [...processes.value];
  const dir = sortAsc.value ? 1 : -1;
  switch (sortCol.value) {
    case 'name':
      return list.sort((a, b) => a.title.localeCompare(b.title) * dir);
    case 'status':
      return list.sort((a, b) => a.state.localeCompare(b.state) * dir);
    case 'id':
      return list.sort((a, b) => (a.id - b.id) * dir);
  }
  return list;
});

const stateLabels: Record<string, string> = {
  normal: '运行中',
  minimize: '已最小化',
  maximize: '已最大化',
  fullscreen: '全屏',
};

function stateLabel(s: string) {
  return stateLabels[s] || s;
}

function doFocus(w: BrowserWindow) {
  if (w.isMinimized()) w.restore();
  w.moveTop();
}

function doMinimize(w: BrowserWindow) {
  w.minimize();
}

function doClose(w: BrowserWindow) {
  w.close();
  setTimeout(refreshProcesses, 600);
}

function endAllOther() {
  const order = [...sys.stateManager.windowTree.windowOrder];
  order.forEach((w: BrowserWindow) => {
    if (w !== selfWin && w.windowInfo.isCreated) w.close();
  });
  setTimeout(refreshProcesses, 600);
}

const cpuCanvas = ref<HTMLCanvasElement>();
const memCanvas = ref<HTMLCanvasElement>();

const cpuData: number[] = [];
const memDataArr: number[] = [];
const MAX_PTS = 60;

const cpuPercent = ref(0);
const memUsedMB = ref(0);
const memTotalMB = ref(0);
const currentFps = ref(0);
const windowCount = ref(0);
const cores = navigator.hardwareConcurrency || 0;
const platform = navigator.platform || '';
const lang = navigator.language || '';
const loadTime = performance.now();
const uptimeStr = ref('0:00:00');

const memInfo = computed(() => {
  if (memTotalMB.value > 0)
    return `已用 ${memUsedMB.value} MB / ${memTotalMB.value} MB`;
  return 'JS 堆内存';
});

let frameCount = 0;
let lastSecond = performance.now();
let rafId = 0;
let tickId = 0;

function countFrame() {
  frameCount++;
  rafId = requestAnimationFrame(countFrame);
}

function tick() {
  const now = performance.now();
  const elapsed = (now - lastSecond) / 1000;
  if (elapsed > 0) {
    currentFps.value = Math.round(frameCount / elapsed);
  }
  frameCount = 0;
  lastSecond = now;

  cpuPercent.value = Math.max(
    1,
    Math.min(100, Math.round(100 - (currentFps.value / 60) * 95)),
  );
  cpuData.push(cpuPercent.value);
  if (cpuData.length > MAX_PTS) cpuData.shift();

  const perf = performance as any;
  if (perf.memory) {
    memUsedMB.value = Math.round(perf.memory.usedJSHeapSize / 1048576);
    memTotalMB.value = Math.round(perf.memory.jsHeapSizeLimit / 1048576);
  }
  memDataArr.push(memUsedMB.value);
  if (memDataArr.length > MAX_PTS) memDataArr.shift();

  const s = Math.floor((now - loadTime) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  uptimeStr.value = `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  windowCount.value = sys.stateManager.windowTree.windowOrder.filter(
    (w: BrowserWindow) => w.windowInfo.isCreated,
  ).length;

  refreshProcesses();

  syncAndDraw(cpuCanvas.value, cpuData, 100, '#4CAF50');
  syncAndDraw(
    memCanvas.value,
    memDataArr,
    memTotalMB.value || Math.max(...memDataArr, 50),
    '#42A5F5',
  );
}

function syncAndDraw(
  canvas: HTMLCanvasElement | undefined,
  data: number[],
  max: number,
  color: string,
) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const w = Math.floor(rect.width);
  const h = Math.floor(rect.height);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawChart(canvas, data, max, color);
}

function drawChart(
  canvas: HTMLCanvasElement,
  data: number[],
  max: number,
  color: string,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  if (w === 0 || h === 0) return;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#2a2a4a';
  ctx.lineWidth = 0.5;
  for (let i = 1; i < 4; i++) {
    const y = (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (let i = 1; i < 10; i++) {
    const x = (w / 10) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  if (data.length < 2 || max <= 0) return;

  const step = w / (MAX_PTS - 1);
  const pad = 2;

  ctx.beginPath();
  ctx.moveTo(0, h);
  data.forEach((v, i) => {
    ctx.lineTo(i * step, h - (v / max) * (h - pad * 2) - pad);
  });
  ctx.lineTo((data.length - 1) * step, h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + '50');
  grad.addColorStop(1, color + '08');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * step;
    const y = h - (v / max) * (h - pad * 2) - pad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

onMounted(() => {
  refreshProcesses();
  rafId = requestAnimationFrame(countFrame);
  tickId = window.setInterval(tick, 1000);
});

onUnmounted(() => {
  cancelAnimationFrame(rafId);
  clearInterval(tickId);
});
</script>

<style scoped>
.tm-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  user-select: none;
}

.tab-bar {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #ddd;
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #333;
  background: #f0f0f0;
}

.tab-btn.active {
  color: #1a73e8;
  border-bottom-color: #1a73e8;
  font-weight: 500;
}

.tab-pane {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

/* ---- Process Table ---- */

.proc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.proc-table thead {
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

.proc-table th {
  padding: 8px 10px;
  text-align: left;
  font-weight: 500;
  color: #555;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  white-space: nowrap;
}

.proc-table th:hover {
  color: #1a73e8;
}

.th-name {
  width: 40%;
}

.th-status {
  width: 15%;
}

.th-id {
  width: 10%;
}

.th-size {
  width: 15%;
}

.th-actions {
  width: 20%;
  text-align: center;
  cursor: default !important;
}

.proc-table tbody tr {
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s;
}

.proc-table tbody tr:hover {
  background: #e8f0fe;
}

.proc-table tbody tr.highlight {
  background: #f0f7ff;
}

.proc-table td {
  padding: 6px 10px;
  vertical-align: middle;
}

.td-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.proc-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.proc-name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.badge-normal {
  background: #e6f4ea;
  color: #1e8e3e;
}

.badge-minimize {
  background: #fce8e6;
  color: #d93025;
}

.badge-maximize {
  background: #e8f0fe;
  color: #1a73e8;
}

.badge-fullscreen {
  background: #fef7e0;
  color: #f9ab00;
}

.td-id {
  font-family: monospace;
  color: #888;
}

.td-size {
  font-family: monospace;
  color: #888;
}

.td-actions {
  text-align: center;
}

.act-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  color: #555;
  transition: all 0.15s;
  margin: 0 2px;
}

.focus-btn:hover {
  background: #e8f0fe;
  color: #1a73e8;
}

.min-btn:hover {
  background: #fef7e0;
  color: #f9ab00;
}

.close-btn:hover {
  background: #fce8e6;
  color: #d93025;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  padding: 40px;
}

.proc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fff;
  border-top: 1px solid #ddd;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.end-all-btn {
  padding: 4px 12px;
  border: 1px solid #d93025;
  border-radius: 4px;
  background: transparent;
  color: #d93025;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.end-all-btn:hover {
  background: #d93025;
  color: #fff;
}

/* ---- Performance Tab ---- */

.perf-pane {
  padding: 12px;
  gap: 12px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
}

.chart-label {
  font-weight: 600;
  color: #333;
}

.chart-val {
  font-size: 18px;
  font-weight: 600;
  color: #1a73e8;
}

.chart-cv {
  display: block;
  width: 100%;
  height: 100px;
}

.chart-footer {
  padding: 6px 14px 10px;
  font-size: 11px;
  color: #888;
}

.sys-info {
  background: #fff;
  border-radius: 8px;
  padding: 12px 14px;
  margin-top: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.si-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #eee;
}

.si-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 12px;
  color: #555;
}

.si-row span:last-child {
  color: #333;
  font-weight: 500;
}
</style>

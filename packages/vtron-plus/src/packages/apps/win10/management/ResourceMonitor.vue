<template>
  <div class="resource-monitor">
    <ClassicMenu :menus="menus" @action="menuAction" />
    <nav class="resource-tabs" aria-label="资源类型">
      <button
        v-for="item in tabs"
        :key="item"
        :class="{ selected: tab === item }"
        :disabled="item !== '概述' && item !== '内存'"
        @click="tab = item"
      >
        {{ item }}
      </button>
    </nav>
    <div class="resource-workspace">
      <main class="resource-panels">
        <template v-if="tab === '概述'">
          <section class="resource-section window-section" :class="{ collapsed: !windowsOpen }">
            <button
              class="resource-section-heading"
              :aria-expanded="windowsOpen"
              @click="windowsOpen = !windowsOpen"
            >
              <strong>应用窗口（Vtron）</strong><span>{{ windows.length }} 个窗口</span
              ><span class="management-glyph">{{ windowsOpen ? '\uE70E' : '\uE70D' }}</span>
            </button>
            <div v-if="windowsOpen" class="resource-window-table">
              <table class="management-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" disabled aria-label="选择所有窗口" /></th>
                    <th>应用窗口</th>
                    <th>窗口 ID</th>
                    <th>状态</th>
                    <th>窗口尺寸</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in windows" :key="item.id" @dblclick="focusWindow(item.win)">
                    <td><input type="checkbox" disabled :aria-label="`选择${item.title}`" /></td>
                    <td>
                      <span class="resource-window-name"
                        ><img v-if="item.icon" :src="item.icon" alt="" />{{ item.title }}</span
                      >
                    </td>
                    <td>{{ item.id }}</td>
                    <td>{{ item.win.isMinimized() ? '已最小化' : '正在运行' }}</td>
                    <td>
                      {{ Math.round(item.win.windowInfo.width) }} ×
                      {{ Math.round(item.win.windowInfo.height) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section class="resource-section unavailable-section">
            <button class="resource-section-heading" disabled>
              <strong>CPU</strong><span>当前浏览器未提供 CPU 占用率</span
              ><span class="management-glyph">&#xE70D;</span>
            </button>
          </section>
          <section class="resource-section unavailable-section">
            <button class="resource-section-heading" disabled>
              <strong>磁盘</strong><span>无法读取宿主磁盘 I/O</span
              ><span class="management-glyph">&#xE70D;</span>
            </button>
          </section>
          <section class="resource-section unavailable-section">
            <button class="resource-section-heading" disabled>
              <strong>网络</strong><span>无法读取宿主网络吞吐量</span
              ><span class="management-glyph">&#xE70D;</span>
            </button>
          </section>
          <section class="resource-section">
            <button
              class="resource-section-heading"
              :aria-expanded="memoryOpen"
              @click="memoryOpen = !memoryOpen"
            >
              <strong>内存（页面 JS 堆）</strong
              ><span>{{ memory ? `${mb(memory.used)} MB 已使用` : '当前浏览器未提供' }}</span
              ><span class="management-glyph">{{ memoryOpen ? '\uE70E' : '\uE70D' }}</span>
            </button>
            <dl v-if="memoryOpen" class="resource-memory-values">
              <div v-for="row in memoryRows" :key="row[0]">
                <dt>{{ row[0] }}</dt>
                <dd>{{ row[1] }}</dd>
              </div>
            </dl>
          </section>
        </template>
        <section v-else class="resource-section resource-memory-section">
          <div class="resource-section-heading">
            <strong>页面 JS 堆内存</strong><span>{{ memory ? `${mb(memory.used)} MB` : '不可用' }}</span>
          </div>
          <table class="management-table">
            <thead>
              <tr>
                <th>项目</th>
                <th>值</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in memoryRows" :key="row[0]">
                <td>{{ row[0] }}</td>
                <td>{{ row[1] }}</td>
              </tr>
            </tbody>
          </table>
          <p class="resource-memory-note">
            此数据来自当前浏览器页面，不表示宿主物理内存或单个窗口的独立内存。
          </p>
        </section>
      </main>
      <aside class="resource-graphs">
        <div class="resource-graph-heading">{{ sampling ? '实时监视' : '监视已暂停' }}</div>
        <section v-for="chart in charts" :key="chart.name" class="resource-chart">
          <header>
            <span>{{ chart.name }}</span
            ><span>{{ chart.scale }}</span>
          </header>
          <div class="resource-chart-grid">
            <svg viewBox="0 0 240 90" preserveAspectRatio="none" role="img" :aria-label="chart.name">
              <polyline
                v-if="chart.values.length"
                :points="chartPoints(chart.values, chart.max)"
                fill="none"
                stroke="#00ff36"
                stroke-width="1.2"
                vector-effect="non-scaling-stroke"
              /></svg
            ><span v-if="chart.unavailable" class="resource-chart-unavailable">不可用</span>
          </div>
          <footer>
            <span>60 秒</span><span>{{ chart.current }}</span>
          </footer>
        </section>
      </aside>
    </div>
    <footer class="management-status">
      <span>当前数据源：Vtron 浏览器页面</span><span>{{ sampling ? '每秒采样' : '已暂停' }}</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue';
import { BrowserWindow, System } from 'vtron';
import ClassicMenu from './ClassicMenu.vue';
import type { ConsoleMenu } from './managementApps';

const system = inject<System>('system')!;
const selfWindow = inject<BrowserWindow>('browserWindow');
const tabs = ['概述', 'CPU', '内存', '磁盘', '网络'];
const tab = ref('概述');
const windowsOpen = ref(true);
const memoryOpen = ref(false);
const sampling = ref(false);
const fps = ref<number | null>(null);
const memory = ref<{ used: number; total: number; limit: number } | null>(null);
const fpsHistory = ref<number[]>([]);
const memoryHistory = ref<number[]>([]);
const windowHistory = ref<number[]>([]);
let animationFrame = 0;
let samplingTimer: ReturnType<typeof setInterval> | undefined;
let frames = 0;
let sampleStarted = 0;
const windows = computed(() =>
  system.stateManager.windowTree.windowOrder
    .filter((win) => win.windowInfo.isCreated)
    .map((win) => ({
      id: win.id,
      title: win.windowInfo.title || '无标题窗口',
      icon: win.windowInfo.icon,
      win,
    }))
);
const memoryRows = computed(() => [
  ['数据范围', '当前浏览器页面的 JavaScript 堆'],
  ['已使用', memory.value ? `${mb(memory.value.used)} MB` : '当前浏览器未提供'],
  ['已分配', memory.value ? `${mb(memory.value.total)} MB` : '当前浏览器未提供'],
  ['堆上限', memory.value ? `${mb(memory.value.limit)} MB` : '当前浏览器未提供'],
]);
const menus = computed<ConsoleMenu[]>(() => [
  {
    label: '文件(F)',
    items: [
      { label: '保存设置…', disabled: true },
      { label: '退出(X)', action: 'exit' },
    ],
  },
  {
    label: '监视器(M)',
    items: [
      { label: '开始监视(S)', action: 'start', disabled: sampling.value },
      { label: '停止监视(T)', action: 'stop', disabled: !sampling.value },
    ],
  },
  {
    label: '帮助(H)',
    items: [
      { label: '帮助主题', disabled: true },
      { label: '关于资源监视器', disabled: true },
    ],
  },
]);
const charts = computed(() => {
  const fpsMax = Math.max(60, Math.ceil(Math.max(0, ...fpsHistory.value) / 30) * 30);
  const memoryMax = Math.max(16, Math.ceil(Math.max(0, ...memoryHistory.value) / 16) * 16);
  const windowMax = Math.max(10, Math.ceil(Math.max(0, ...windowHistory.value) / 10) * 10);
  return [
    {
      name: '页面帧率',
      scale: fpsHistory.value.length ? `${fpsMax} FPS` : '— FPS',
      current: fps.value === null ? '—' : `${fps.value} FPS`,
      values: fpsHistory.value,
      max: fpsMax,
      unavailable: false,
    },
    {
      name: '页面 JS 堆',
      scale: memoryHistory.value.length ? `${memoryMax} MB` : '— MB',
      current: memory.value ? `${mb(memory.value.used)} MB` : '浏览器未提供',
      values: memoryHistory.value,
      max: memoryMax,
      unavailable: !memory.value,
    },
    {
      name: 'Vtron 应用窗口',
      scale: windowHistory.value.length ? `${windowMax} 个` : '—',
      current: `${windows.value.length} 个窗口`,
      values: windowHistory.value,
      max: windowMax,
      unavailable: false,
    },
  ];
});
function mb(value: number) {
  return (value / 1048576).toFixed(1);
}
function chartPoints(values: number[], max: number) {
  return values
    .map(
      (value, index) =>
        `${240 - (values.length - 1 - index) * (240 / 59)},${90 - Math.min(1, value / max) * 90}`
    )
    .join(' ');
}
function readMemory() {
  const snapshot = (
    performance as Performance & {
      memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
    }
  ).memory;
  memory.value =
    snapshot &&
    [snapshot.usedJSHeapSize, snapshot.totalJSHeapSize, snapshot.jsHeapSizeLimit].every(
      (value) => Number.isFinite(value) && value >= 0
    )
      ? { used: snapshot.usedJSHeapSize, total: snapshot.totalJSHeapSize, limit: snapshot.jsHeapSizeLimit }
      : null;
}
function push(history: typeof fpsHistory, value: number) {
  history.value = [...history.value.slice(-59), value];
}
function countFrame() {
  frames++;
  animationFrame = requestAnimationFrame(countFrame);
}
function sample() {
  const now = performance.now();
  fps.value = Math.round((frames * 1000) / Math.max(1, now - sampleStarted));
  frames = 0;
  sampleStarted = now;
  readMemory();
  push(fpsHistory, fps.value);
  push(windowHistory, windows.value.length);
  if (memory.value) push(memoryHistory, memory.value.used / 1048576);
}
function startSampling() {
  if (sampling.value) return;
  sampling.value = true;
  frames = 0;
  sampleStarted = performance.now();
  readMemory();
  animationFrame = requestAnimationFrame(countFrame);
  samplingTimer = setInterval(sample, 1000);
}
function stopSampling() {
  sampling.value = false;
  cancelAnimationFrame(animationFrame);
  if (samplingTimer) clearInterval(samplingTimer);
  samplingTimer = undefined;
}
function menuAction(action: string) {
  if (action === 'start') startSampling();
  if (action === 'stop') stopSampling();
  if (action === 'exit') selfWindow?.close();
}
function focusWindow(win: Pick<BrowserWindow, 'isMinimized' | 'restore' | 'moveTop'>) {
  if (win.isMinimized()) win.restore();
  win.moveTop();
}
onMounted(startSampling);
onUnmounted(stopSampling);
</script>

<template>
  <div class="outer">
    <div class="tab">
      <div class="tab-item">{{ i18n('general') }}</div>
    </div>
    <div class="content">
      <div class="volume-header">
        <img :src="volumeIcon" class="volume-img" />
        <span class="volume-label">{{ i18n('local.disk') }} ({{ letter }}:)</span>
      </div>
      <div class="split-line"></div>

      <div class="chart-area">
        <div
          class="pie-chart"
          :style="{ background: `conic-gradient(#4393d0 0% ${usagePercent}%, #e6e6e6 ${usagePercent}% 100%)` }"
        >
          <div class="pie-hole"></div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color legend-used"></span>
            <span>{{ i18n('volume.used.space') }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-color legend-free"></span>
            <span>{{ i18n('volume.free.space') }}</span>
          </div>
        </div>
      </div>

      <div class="split-line"></div>

      <div class="propitem">
        <div class="propname">{{ i18n('volume.type.label') }}：</div>
        <div class="propvalue">{{ i18n('volume.disk.type') }}</div>
      </div>
      <div class="propitem">
        <div class="propname">{{ i18n('fs.type') }}：</div>
        <div class="propvalue">{{ fsName }}</div>
      </div>

      <div class="split-line"></div>

      <div class="propitem">
        <div class="propname">{{ i18n('volume.used.space') }}：</div>
        <div class="propvalue">
          <span class="legend-color legend-used"></span>
          {{ usedSizeStr }}
        </div>
      </div>
      <div class="propitem">
        <div class="propname">{{ i18n('volume.items.count') }}：</div>
        <div class="propvalue">{{ totalItems }}</div>
      </div>

      <div class="split-line"></div>

      <div class="capacity-section">
        <div class="capacity-bar">
          <div class="capacity-fill" :style="{ width: usagePercent + '%' }"></div>
        </div>
      </div>
    </div>
    <div class="button-group">
      <WinButton @click="confirm">{{ i18n('confirm') }}</WinButton>
      <WinButton @click="confirm">{{ i18n('cancel') }}</WinButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import WinButton from '@packages/components/WinButton.vue';
import volumeIcon from '@packages/assets/volume-local.png';
import { i18n } from '@/packages/computer/i18n';
import { BrowserWindow } from '@/packages/services';
import { System, VtronFileWithoutContent } from '@packages/kernel';

const sys = inject<System>('system')!;
const browserWindow: BrowserWindow | undefined = inject('browserWindow');

const letter = ref('');
const fsName = ref('');
const usedSizeStr = ref('0 B');
const totalItems = ref(0);
const usagePercent = ref(0);

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

async function scanDir(path: string): Promise<{ size: number; count: number }> {
  let size = 0;
  let count = 0;
  try {
    const files: VtronFileWithoutContent[] = await sys.fs.readdir(path);
    for (const f of files) {
      count++;
      if (f.isDirectory) {
        const sub = await scanDir(f.path);
        size += sub.size;
        count += sub.count;
      } else {
        size += f.size || 0;
      }
    }
  } catch {
    // ignore errors
  }
  return { size, count };
}

onMounted(async () => {
  const volPath = browserWindow?.config?.content as string;
  if (!volPath) return;

  letter.value = volPath.split('/').filter(Boolean)[0] || '';
  fsName.value = sys.fs?.name || 'VtronFS';

  const stats = await scanDir(volPath);
  totalItems.value = stats.count;
  usedSizeStr.value = formatSize(stats.size);
  usagePercent.value = Math.min(95, Math.max(5, Math.round((stats.size / (stats.size + 1024 * 1024)) * 100)));
});

function confirm() {
  browserWindow?.close();
}
</script>
<style lang="scss" scoped>
.outer {
  display: flex;
  flex-direction: column;
  background-color: var(--color-ui-gray);
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  font-size: var(--ui-font-size);

  .tab {
    display: flex;
    height: var(--ui-list-item-height);
    transform: translateY(1px);

    .tab-item {
      width: 50px;
      text-align: center;
      padding-top: 2px;
      border: var(--light-border);
      border-bottom: none;
      background-color: #fff;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    background-color: #fff;
    border: var(--light-border);
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px 0;
  }

  .button-group {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
    gap: 10px;
  }
}

.volume-header {
  display: flex;
  align-items: center;
  padding: 6px 20px;
  width: 100%;
  box-sizing: border-box;
}

.volume-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  margin-right: 10px;
}

.volume-label {
  font-size: 13px;
  color: #222;
}

.split-line {
  height: 1px;
  width: calc(100% - 30px);
  background-color: #d0d0d0;
  margin: 6px 0;
}

.chart-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 10px 0;
}

.pie-chart {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}

.pie-hole {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #333;
}

.legend-color {
  display: inline-block;
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.legend-used {
  background-color: #4393d0;
}

.legend-free {
  background-color: #e6e6e6;
}

.propitem {
  display: flex;
  padding: 3px 20px;
  width: 100%;
  box-sizing: border-box;

  .propname {
    width: 90px;
    flex-shrink: 0;
    color: #555;
    user-select: none;
  }

  .propvalue {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    word-break: break-all;
    color: #222;
  }
}

.capacity-section {
  width: calc(100% - 40px);
  padding: 4px 0;
}

.capacity-bar {
  width: 100%;
  height: 16px;
  background-color: #e6e6e6;
  overflow: hidden;
}

.capacity-fill {
  height: 100%;
  background-color: #4393d0;
  transition: width 0.3s;
}
</style>

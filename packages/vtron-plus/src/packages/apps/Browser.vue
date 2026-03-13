<template>
  <div class="browser">
    <div class="browser__tabbar" v-dragable @dblclick="handleDbclick">
      <div class="browser__tabs">
        <div
          class="browser__tab"
          :class="{ 'browser__tab--active': currentTab === '主页' }"
          @click="switchTab('主页')"
        >
          <span class="browser__tab-icon segoicon SEGOEUIMDL">&#xE80F;</span>
          <span class="browser__tab-label">主页</span>
        </div>
        <div
          class="browser__tab"
          v-for="item in tabs"
          :key="item"
          :class="{ 'browser__tab--active': currentTab === item }"
          @click="switchTab(item)"
        >
          <span class="browser__tab-icon segoicon SEGOEUIMDL">&#xE774;</span>
          <span class="browser__tab-label">{{ item }}</span>
          <div class="browser__tab-close" @click.stop="removeTab(item)">
            <span class="segoicon SEGOEUIMDL">&#xE711;</span>
          </div>
        </div>
        <button class="browser__add" @click="addTab" title="新建标签页">
          <span class="segoicon SEGOEUIMDL">&#xE710;</span>
        </button>
      </div>
      <div class="browser__winbtns">
        <WinUpButtonGroupVue :browser-window="browserWindow" />
      </div>
    </div>

    <BrowserTab
      key="主页"
      v-show="currentTab === '主页'"
      :isCurrent="currentTab === '主页'"
    />
    <BrowserTab
      v-for="item in tabs"
      :key="item"
      v-show="currentTab === item"
      :isCurrent="currentTab === item"
    />
  </div>
</template>

<script lang="ts" setup>
import { inject, ref } from 'vue';
import { BrowserWindow, vDragable, WinUpButtonGroupVue } from 'vtron';
import BrowserTab from './Browser/BrowserTab.vue';

const browserWindow = inject<BrowserWindow>('browserWindow')!;
const tabs = ref<string[]>([]);
const currentTab = ref('主页');
let tabCounter = 0;

function addTab() {
  const name = '新标签页 ' + ++tabCounter;
  tabs.value.push(name);
  currentTab.value = name;
}

function removeTab(tab: string) {
  const idx = tabs.value.indexOf(tab);
  if (idx === -1) return;
  tabs.value.splice(idx, 1);
  if (currentTab.value === tab) {
    currentTab.value = tabs.value[idx - 1] ?? tabs.value[idx] ?? '主页';
  }
}

function switchTab(tab: string) {
  currentTab.value = tab;
}

function handleDbclick() {
  if (browserWindow.isMaximized()) {
    browserWindow.unmaximize();
  } else {
    browserWindow.maximize();
  }
}
</script>

<style scoped lang="scss">
.browser {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #fff;
}

.browser__tabbar {
  display: flex;
  align-items: flex-end;
  height: 38px;
  background: #dee1e6;
  padding-left: 10px;
  user-select: none;
  flex-shrink: 0;
}

.browser__tabs {
  display: flex;
  align-items: flex-end;
  flex: 1;
  min-width: 0;
  height: 100%;
  gap: 1px;
  overflow: hidden;
  padding-top: 6px;
}

.browser__tab {
  display: flex;
  align-items: center;
  height: 30px;
  max-width: 220px;
  min-width: 48px;
  padding: 0 6px 0 10px;
  background: rgba(255, 255, 255, 0.45);
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  gap: 6px;
  transition: background 0.15s;
  flex-shrink: 1;
  flex-basis: 180px;

  &--active {
    background: #fff;
  }

  &:hover:not(&--active) {
    background: rgba(255, 255, 255, 0.7);
  }
}

.browser__tab-icon {
  font-size: 12px;
  color: #5f6368;
  flex-shrink: 0;
}

.browser__tab-label {
  font-size: 12px;
  color: #3c4043;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.browser__tab-close {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.15s;

  .segoicon {
    font-size: 9px;
    color: #5f6368;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.12);
  }
}

.browser__add {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  margin: 0 4px;
  align-self: center;
  transition: background 0.15s;

  .segoicon {
    font-size: 12px;
    color: #5f6368;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.08);
  }
}

.browser__winbtns {
  width: 100px;
  flex-shrink: 0;
  align-self: stretch;
}
</style>

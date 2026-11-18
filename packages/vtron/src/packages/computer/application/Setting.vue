<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="window-outer"
    :class="{
      focus: focusState && currentRouter !== 'main',
    }"
  >
    <div class="upbar" v-dragable>
      <div class="upbar-left">
        <button
          class="back-arr"
          v-if="currentRouter !== 'main'"
          type="button"
          :aria-label="i18n('windows.setting')"
          @click="back"
        >
          ←
        </button>
        <div class="upbar-text">
          {{ i18n('setting') }}
        </div>
      </div>
      <div class="upbar-right">
        <WinUpButtonGroup :browser-window="browserWindow"></WinUpButtonGroup>
      </div>
    </div>
    <Transition name="fade" mode="out-in" appear>
      <component v-if="activePanel" :is="activePanel.content" v-bind="['system', 'custom', 'language'].includes(activePanel.key) ? { initialPage } : {}"
                 :key="activePanel.key + ':' + navigationId" />
      <div v-else class="outer">
        <h1 class="settings-title">{{ i18n('windows.setting') }}</h1>
        <div class="main_uper">
          <button
            v-for="item in setList"
            :key="item.key"
            class="set_item"
            type="button"
            @click="openSet(item.key)"
            v-glowing="{ color: '#3c3c3ce4', scale: 0.6 }"
          >
            <span class="set_item-img">
              <span v-if="item.glyph" class="SEGOEUIMDL" aria-hidden="true">{{ item.glyph }}</span>
              <img v-else :src="item.icon" alt="" />
            </span>
            <span class="set_item-right">
              <span class="set_item-title">{{ item.title }}</span>
              <span class="set_item-desc">{{ item.desc }}</span>
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
<script lang="ts" setup>
import { computed, inject, ref, onUnmounted } from 'vue';
import { getSettingPanels } from './settingPanels';
import WinUpButtonGroup from '@/packages/components/WinUpButtonGroup.vue';
import { vDragable } from '@/packages/computer/layout/windowGroup/MakeDragable';

import { i18n } from '@/packages/computer/i18n';
import { BrowserWindow } from '@/packages/services';
import { System } from '@packages/kernel';

import { vGlowing } from '@/packages/computer/utils/glowingBorder';

const browserWindow = inject<BrowserWindow>('browserWindow')!;
const sys = inject<System>('system')!;

const currentRouter = ref(browserWindow.config?.router || 'main');

const navigationId = ref(0);
const initialPage = ref<number>(browserWindow.config?.page ?? 0);
function navigate(_source: string, router: string, page: number) {
  navigationId.value++;
  initialPage.value = page;
  currentRouter.value = router;
}
browserWindow.on('settings.navigate', navigate);
onUnmounted(() => browserWindow.off('settings.navigate', navigate));

const focusState = ref(false);
browserWindow?.on('focus', () => {
  focusState.value = true;
});
browserWindow?.on('blur', () => {
  focusState.value = false;
});
function back() {
  initialPage.value = 0;
  currentRouter.value = 'main';
}
function openSet(key: string) {
  currentRouter.value = key;
}
const setList = computed(() => getSettingPanels(sys));
const activePanel = computed(() => setList.value.find((item) => item.key === currentRouter.value));
</script>

<style lang="scss" scoped>
@import '@packages/main.css';

.window-outer {
  --settings-sidebar-width: 200px;
  background-color: white;
  width: 100%;
  height: 100%;
  border: #0076d795 1px solid;
  box-sizing: border-box;
  // box-shadow: inset -599px 0px 0px 0px #ffffff;
  transition: background-color 0.1s;
  overflow: hidden;
}

.window-outer.focus {
  background-color: rgba(255, 255, 255, 0.704);
  backdrop-filter: blur(10px);
}

.upbar {
  height: 40px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;

  .upbar-left {
    display: flex;
    align-items: center;
    font-size: 12px;
    height: 100%;

    .back-arr {
      padding: 0 6px;
      border: 0;
      background: transparent;
      color: inherit;
      margin-right: 3px;
      font-size: 14px;
      width: 40px;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .back-arr:hover {
      color: var(--color-ui-gray);
      background-color: var(--color-dark);
    }

    .upbar-text {
      font-size: 14px;
      margin-left: 10px;
    }
  }

  .upbar-right {
    width: calc(100% - var(--settings-sidebar-width));
    display: flex;
    justify-content: flex-end;
    height: 100%;
    background-color: white;
  }
}

.outer {
  height: calc(100% - 40px);
  overflow: auto;
  background: white;
}

.settings-title {
  margin: 22px 18px 20px;
  text-align: center;
  font-size: 24px;
  font-weight: 400;
}

.main_uper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 174px), 1fr));
  gap: 8px;
  max-width: 980px;
  margin: 0 auto;
  padding: 0 20px 20px;
}

.set_item {
  min-width: 0;
  min-height: 76px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 8px;
  background: white;
  border: 1px solid transparent;
  color: inherit;
  font: inherit;
  text-align: left;
}

.set_item:hover {
  border-color: #999;
}

.set_item-img {
  width: 28px;
  flex-shrink: 0;
  color: #0078d7;
  font-size: 24px;
  text-align: center;
}

.set_item-img img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.set_item-title {
  display: block;
  font-size: 14px;
  line-height: 1.3;
}

.set_item-desc {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #595959;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}

.fade-leave-active {
  pointer-events: none;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

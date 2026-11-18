<template>
  <div class="custom-outer">
    <div class="state-item" v-for="item in visibleTrays" :key="item._id" :class="{ 'clock-tray': item.image === DateTime }" @keydown.esc="closeCalendar(item, $event)">
      <component :is="item.image === DateTime ? 'button' : 'div'" class="state-icon"
        :aria-label="item.image === DateTime ? i18n('calendar.title') : undefined"
        :aria-expanded="item.image === DateTime ? item._contextMenuShow : undefined"
        @click="handleClick(item, $event)">
        <div class="inner">
          <VtronImage v-if="typeof item.image === 'string'" :path="item.image"></VtronImage>
          <component v-else :is="item.image"></component>
        </div>
      </component>
      <Transition name="fade">
        <div
          class="context-menu"
          v-if="item._contextMenuShow"
          :class="{ 'calendar-flyout': item.image === DateTime }"
          :style="item.image === DateTime ? undefined : {
            width: item._contextMenuWidth + 'px',
            height: item._contextMenuHeight + 'px',
          }"
        >
          <component :is="item._contextMenu"></component>
        </div>
      </Transition>
    </div>
  </div>
</template>
<script setup lang="ts">
import VtronImage from '@/packages/computer/application/components/VtronImage.vue';
import { System } from '@/packages/kernel';
import { Tray, Menu } from '@/packages/services';
import { computed, inject } from 'vue';
import DateTime from '@/packages/computer/application/trayItems/DateTime.vue';

import { i18n } from '../../../i18n';

const sys = inject<System>('system')!;

const traylst = sys.stateManager.trayState.current;
const visibleTrays = computed(() => sys.getConfig('desktopPreferences')?.showTaskbarClock === false
  ? traylst.filter((tray) => tray.image !== DateTime)
  : traylst
);
function closeCalendar(item: Tray, event: KeyboardEvent) {
  if (item.image !== DateTime || !item._contextMenuShow) return;
  event.stopPropagation();
  item._contextMenuShow = false;
  (event.currentTarget as HTMLElement).querySelector('button')?.focus();
}
function handleClick(item: Tray, ev: MouseEvent) {
  if (item._contextMenu instanceof Menu) {
    item._contextMenu.popup(ev);
  } else {
    item._contextMenuShow = !item._contextMenuShow;
  }
  traylst.forEach((tray) => {
    if (tray._id !== item._id) {
      tray._contextMenuShow = false;
    }
  });
  sys.emitEvent('tray.show', item);
}
sys.mountEvent('tray.hidden', () => {
  traylst.forEach((item) => {
    item._contextMenuShow = false;
  });
});
</script>
<style lang="scss" scoped>
.custom-outer {
  display: flex;
  height: 100%;
  flex-direction: row-reverse;
  align-items: center;
}
.state-item {
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
}
.state-icon {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
}
.state-item.clock-tray { position: static; }
.clock-tray > button { padding: 0; border: none; background: transparent; color: inherit; font: inherit; }
.context-menu.calendar-flyout { width: min(360px, 100%); height: auto; overflow: visible; contain: none; }
.state-item:hover {
  background-color: rgba(255, 255, 255, 0.519);
}
.inner {
  padding: 0 8px;
  height: 60%;
  display: flex;
  align-items: center;
}
.context-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  z-index: 80;
  width: 100%;
  height: 100%;

  overflow: hidden;
  contain: content;
}

.fade-enter-active {
  transition: all 0.4s var(--aniline);
}
.fade-leave-active {
  transition: all 0.2s;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0px);
  // 裁剪
  clip-path: inset(0 0 0 0);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(30px);
  // 裁剪
  clip-path: inset(0 0 30px 0);
}
</style>

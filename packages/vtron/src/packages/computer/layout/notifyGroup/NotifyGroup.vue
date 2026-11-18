<template>
  <div v-if="preferences?.showNotifications !== false" class="notify" @mousedown.stop>
    <TransitionGroup name="toast" tag="div">
      <article class="notify-item" v-for="note in banners" :key="note.id">
        <component :is="note._onClickFn ? 'button' : 'div'" class="body" @click="activate(note)">
          <small>{{ note.source }}</small>
          <strong>{{ note.title }}</strong>
          <span>{{ note.content }}</span>
        </component>
        <button
          type="button"
          class="dismiss SEGOEUIMDL"
          :aria-label="i18n('center.dismiss')"
          @click="state.hideBanner(note)"
        >
          &#xE72A;
        </button>
      </article>
    </TransitionGroup>
  </div>
</template>
<script setup lang="ts">
import { computed, inject } from 'vue';
import type { Notify } from '@/packages/services';
import type { System } from '@packages/kernel';
import { i18n } from '../../i18n';
const sys = inject<System>('system')!;
const state = sys.stateManager.notify;
const preferences = computed(() => sys.getConfig('desktopPreferences'));
const banners = computed(() =>
  preferences.value?.alarmsOnly ? state.current.filter((note) => note.alarm) : state.current
);
function activate(note: Notify) {
  if (!note._onClickFn) return;
  note.close();
  note._onClickFn();
}
</script>
<style scoped>
.notify {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 100;
  width: min(360px, 100%);
  pointer-events: none;
}
.notify-item {
  position: relative;
  margin: 0 6px 6px;
  background: #f5f5f5;
  color: #171717;
  box-shadow: 0 3px 12px #0003;
  border: 1px solid #0003;
  pointer-events: auto;
  font:
    14px/1.4 'Segoe UI',
    'Microsoft YaHei UI',
    sans-serif;
}
button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.body {
  box-sizing: border-box;
  width: 100%;
  padding: 11px 32px 13px 15px;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  text-align: left;
  font: inherit;
}
small {
  margin-bottom: 5px;
  font-size: 12px;
  color: #555;
}
.body span {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  overflow-wrap: anywhere;
}
.dismiss {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 5px;
}
.dismiss:hover {
  background: #0001;
}
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
}
</style>

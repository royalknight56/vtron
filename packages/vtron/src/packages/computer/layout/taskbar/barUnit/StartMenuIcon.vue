<template>
  <button
    ref="start"
    type="button"
    class="startmenuicon"
    :aria-label="i18n('startMenu.start')"
    :aria-expanded="visible"
    @click.stop="sys.emitEvent('taskbar.startmenu.leftClick', $event)"
  >
    <img class="startmenuicon-img" alt="" :src="sys._options.logo || winimg" />
  </button>
  <label class="task-search">
    <span class="SEGOEUIMDL" aria-hidden="true">&#xE721;</span>
    <input
      ref="input"
      v-model="query"
      role="combobox"
      autocomplete="off"
      :placeholder="i18n('startMenu.query')"
      :aria-label="i18n('startMenu.query')"
      :aria-expanded="visible && !!query.trim()"
      :aria-controls="visible && query.trim() ? listId : undefined"
      :aria-activedescendant="visible && query.trim() ? activeId : undefined"
      @click.stop="show"
      @input="show"
      @keydown="handleKey"
    />
  </label>
  <StartSearch
    v-if="visible && query.trim()"
    ref="results"
    class="search-popup"
    :list-id="listId"
    :query="query"
    @select="activeId = $event"
  />
  <Transition v-else name="startmenu">
    <StartMenu v-if="visible" class="startmenu" @keydown.esc.stop="escape" />
  </Transition>
</template>
<script lang="ts" setup>
import winimg from '@/assets/win.png';
import type { System } from '@packages/kernel';
import { getCurrentInstance, inject, onUnmounted, ref } from 'vue';
import StartMenu from '../startMenu/StartMenu.vue';
import StartSearch from '../startMenu/StartSearch.vue';
import { i18n } from '../../../i18n';

const sys = inject<System>('system')!;
const visible = ref(false);
const query = ref('');
const input = ref<HTMLInputElement>();
const start = ref<HTMLButtonElement>();
const results = ref<InstanceType<typeof StartSearch>>();
const listId = 'start-results-' + getCurrentInstance()!.uid;
const activeId = ref<string>();
function show() {
  sys.emitEvent('messagecenter.hidden');
  visible.value = true;
  input.value?.focus();
}
function hide() {
  visible.value = false;
  query.value = '';
  activeId.value = undefined;
}
function escape() {
  sys.emitEvent('uipop.hidden');
  start.value?.focus();
}
function toggle() {
  if (visible.value && query.value) {
    query.value = '';
    show();
  } else if (visible.value) hide();
  else show();
}
function handleKey(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) return;
  if (event.key === 'Escape') escape();
  else if (results.value && ['ArrowDown', 'ArrowUp'].includes(event.key))
    results.value.move(event.key === 'ArrowDown' ? 1 : -1);
  else if (results.value && event.key === 'Enter') results.value.openSelected();
  else return;
  event.preventDefault();
  event.stopPropagation();
}
sys.mountEvent('startmenu.changeVisible', toggle);
sys.mountEvent('startmenu.hidden', hide);
onUnmounted(() => {
  sys.offEvent('startmenu.changeVisible', toggle);
  sys.offEvent('startmenu.hidden', hide);
});
</script>
<style lang="scss" scoped>
.startmenuicon {
  flex: none;
  padding: 0;
  border: 0;
  width: var(--startmenu-icon-size);
  height: var(--task-bar-height);
  background-color: var(--theme-main-color);
  user-select: none;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 41;
}

.startmenuicon-img {
  // width: 50%;
  height: 40%;
}

.startmenu,
.search-popup {
  position: absolute;
  bottom: var(--task-bar-height);
  left: 0;
}

.startmenuicon:hover {
  background-color: var(--color-gray-hover);

  .startmenuicon-img {
    opacity: 0.5;
  }
}

.startmenu-enter-active {
  transition: all 0.3s var(--aniline);
}

.startmenu-leave-active {
  transition: all 0.05s;
}

.startmenu-enter-from {
  transform: translateY(100px);
  opacity: 0;
}

.startmenu-leave-to {
  transform: translateY(350px);
  opacity: 0;
}
.task-search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 0 1 220px;
  min-width: 44px;
  height: var(--task-bar-height);
  color: #333;
  background: #f7f7f7;
}
.task-search span {
  position: absolute;
  left: 12px;
  pointer-events: none;
}
.task-search input {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 0 8px 0 38px;
  border: 1px solid #aaa;
  border-radius: 0;
  background: transparent;
  color: #161616;
  font: inherit;
}
.task-search input::placeholder {
  font-size: 13px;
  font-weight: 400;
  color: #666;
}
.task-search input:focus {
  outline: 2px solid #0078d7;
  outline-offset: -2px;
  background: #fff;
}
.search-popup {
  z-index: 42;
}
@media (max-width: 620px) {
  .task-search {
    flex: 0 0 44px;
  }
  .task-search:not(:focus-within) input::placeholder {
    color: transparent;
  }
  .task-search:focus-within {
    flex-basis: min(42vw, 220px);
  }
  .startmenu {
    max-width: 100%;
  }
}
</style>

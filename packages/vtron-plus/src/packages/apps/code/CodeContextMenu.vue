<template>
  <span ref="anchor" class="code-context-anchor" aria-hidden="true"></span>
  <Teleport v-if="root" :to="root">
    <div
      ref="menu"
      class="code-context-menu"
      role="menu"
      aria-label="文件操作"
      tabindex="-1"
      :style="{ left: left + 'px', top: top + 'px', visibility: positioned ? 'visible' : 'hidden' }"
      @keydown="onKeydown"
      @contextmenu.prevent.stop
      @click.stop
      @mousedown.stop
    >
      <template v-for="(item, index) in items" :key="index">
        <div v-if="item.separator" class="code-context-separator" role="separator"></div>
        <button
          v-else
          :ref="element => setButton(index, element)"
          type="button"
          role="menuitem"
          tabindex="-1"
          :disabled="item.disabled"
          :aria-disabled="item.disabled || undefined"
          @focus="activeIndex = index"
          @click="select(item)"
        ><span>{{ item.label }}</span><kbd v-if="item.key">{{ item.key }}</kbd></button>
      </template>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

type ContextMenuItem = {
  label: string;
  key?: string;
  disabled?: boolean;
  separator?: boolean;
  run: () => void;
};

const props = defineProps<{ x: number; y: number; items: ContextMenuItem[] }>();
const emit = defineEmits<{ (event: 'close'): void }>();
const anchor = ref<HTMLElement>();
const root = shallowRef<HTMLElement>();
const menu = ref<HTMLElement>();
const buttons = new Map<number, HTMLButtonElement>();
const left = ref(0);
const top = ref(0);
const positioned = ref(false);
const activeIndex = ref(-1);
let disposed = false;

function setButton(index: number, element: unknown) {
  if (element instanceof HTMLButtonElement) buttons.set(index, element);
  else buttons.delete(index);
}

function enabledIndices(): number[] {
  return props.items.flatMap((item: ContextMenuItem, index: number) => item.separator || item.disabled ? [] : [index]);
}

function focusItem(index: number) {
  activeIndex.value = index;
  buttons.get(index)?.focus({ preventScroll: true });
}

async function placeMenu() {
  await nextTick();
  if (disposed || !root.value || !menu.value) return;
  const host = root.value;
  const bounds = host.getBoundingClientRect();
  const scaleX = host.offsetWidth ? bounds.width / host.offsetWidth : 1;
  const scaleY = host.offsetHeight ? bounds.height / host.offsetHeight : 1;
  const x = (props.x - bounds.left) / (scaleX || 1) - host.clientLeft;
  const y = (props.y - bounds.top) / (scaleY || 1) - host.clientTop;
  left.value = Math.max(4, Math.min(x, host.clientWidth - menu.value.offsetWidth - 4));
  top.value = Math.max(4, Math.min(y, host.clientHeight - menu.value.offsetHeight - 4));
  positioned.value = true;
}

function close() { emit('close'); }

function select(item: ContextMenuItem) {
  if (item.separator || item.disabled) return;
  close();
  item.run();
}

function onKeydown(event: KeyboardEvent) {
  const indices = enabledIndices();
  const current = indices.indexOf(activeIndex.value);
  if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape', 'Tab'].includes(event.key)) {
    event.stopPropagation();
    if (event.key !== 'Tab') event.preventDefault();
  } else return;
  if (event.key === 'Escape' || event.key === 'Tab') return close();
  if (event.key === 'Enter' || event.key === ' ') {
    const item = props.items[activeIndex.value];
    if (item) select(item);
    return;
  }
  if (!indices.length) return;
  let next = current;
  if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = indices.length - 1;
  else if (event.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % indices.length;
  else if (event.key === 'ArrowUp') next = current < 0 ? indices.length - 1 : (current - 1 + indices.length) % indices.length;
  focusItem(indices[next]);
}

function onOutsidePointer(event: PointerEvent) {
  if (!(event.target instanceof Node) || !menu.value?.contains(event.target)) close();
}

watch(() => [props.x, props.y, props.items], () => { void placeMenu(); });

onMounted(async () => {
  root.value = anchor.value?.closest<HTMLElement>('.vc') || undefined;
  if (!root.value) return close();
  document.addEventListener('pointerdown', onOutsidePointer, true);
  window.addEventListener('resize', close);
  await placeMenu();
  if (disposed) return;
  const first = enabledIndices()[0];
  if (first !== undefined) focusItem(first);
  else menu.value?.focus({ preventScroll: true });
});

onBeforeUnmount(() => {
  disposed = true;
  document.removeEventListener('pointerdown', onOutsidePointer, true);
  window.removeEventListener('resize', close);
  buttons.clear();
});
</script>

<style scoped>
.code-context-anchor { display: none; }
.code-context-menu { position: absolute; z-index: 100; display: flex; flex-direction: column; width: 248px; max-width: calc(100% - 8px); max-height: calc(100% - 8px); padding: 4px; overflow: auto; box-sizing: border-box; border: 1px solid var(--border, #454545); border-radius: 5px; background: var(--sidebar, #252526); color: var(--fg, #ccc); box-shadow: 0 3px 14px #0006; font: inherit; outline: none; user-select: none; }
.code-context-menu button { display: flex; flex-shrink: 0; align-items: center; justify-content: space-between; gap: 24px; width: 100%; min-height: 26px; padding: 4px 10px; border: 0; border-radius: 3px; background: transparent; color: inherit; font: inherit; text-align: left; cursor: default; }
.code-context-menu button:hover:not(:disabled), .code-context-menu button:focus { background: var(--hover, #2a2d2e); outline: none; }
.code-context-menu button:disabled { color: var(--muted, #969696); opacity: .55; }
.code-context-menu button > span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.code-context-menu kbd { flex-shrink: 0; color: var(--muted, #969696); font: inherit; font-size: 11px; white-space: nowrap; }
.code-context-separator { flex-shrink: 0; height: 1px; margin: 4px 6px; background: var(--border, #454545); }
</style>

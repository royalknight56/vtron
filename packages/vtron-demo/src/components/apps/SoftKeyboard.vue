<template>
  <section class="soft-keyboard" aria-label="软键盘" @mousedown="handleMouseDown">
    <header class="keyboard-handle" v-dragable>
      <div class="keyboard-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <rect x="2.5" y="5" width="19" height="14" rx="3" />
          <path d="M6.5 9h1m4 0h1m4 0h1M6.5 12h1m4 0h1m4 0h1M8 15.5h8" stroke-linecap="round" />
        </svg>
        <span>软键盘</span>
      </div>
      <button type="button" class="keyboard-close" title="关闭软键盘" aria-label="关闭软键盘" @mousedown.stop @touchstart.stop @click="close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" stroke-linecap="round" /></svg>
      </button>
    </header>
    <div class="keyboard-container">
      <div class="keyboard-row">
        <button v-for="key in row1" :key="key" type="button" class="keyboard-key" @click="handleKeyPress(key, $event)">{{ key }}</button>
      </div>
      <div class="keyboard-row" :class="{ 'keyboard-row-inset': !isSymbolMode }">
        <button v-for="key in row2" :key="key" type="button" class="keyboard-key" @click="handleKeyPress(key, $event)">{{ key }}</button>
      </div>
      <div class="keyboard-row">
        <button v-if="!isSymbolMode" type="button" class="keyboard-key keyboard-function shift" :class="{ 'is-active': isShiftActive }" :aria-pressed="isShiftActive" title="切换大写" aria-label="切换大写" @click="toggleShift($event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m12 4 8 9h-5v7H9v-7H4Z" stroke-linejoin="round" /></svg>
        </button>
        <button v-for="key in row3" :key="key" type="button" class="keyboard-key" @click="handleKeyPress(key, $event)">{{ key }}</button>
        <button type="button" class="keyboard-key keyboard-function backspace" title="退格" aria-label="退格" @click="handleBackspace($event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m8 5-6 7 6 7h13V5Z" stroke-linejoin="round" /><path d="m11 9 6 6m0-6-6 6" stroke-linecap="round" /></svg>
        </button>
      </div>
      <div class="keyboard-row">
        <button type="button" class="keyboard-key keyboard-function keyboard-mode" :aria-pressed="isSymbolMode" :aria-label="isSymbolMode ? '切换字母' : '切换数字和符号'" @click="toggleSymbols($event)">{{ isSymbolMode ? 'ABC' : '123 / 符' }}</button>
        <button type="button" class="keyboard-key space" aria-label="空格" @click="handleKeyPress(' ', $event)">空格</button>
        <button type="button" class="keyboard-key enter" @click="handleEnter($event)">回车</button>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { BrowserWindow, vDragable } from 'vtron';
import { ref, computed, onMounted, onUnmounted, inject } from 'vue';

const browserWindow = inject<BrowserWindow>('browserWindow');


const props = defineProps({
  onInput: {
    type: Function,
    default: () => {},
  },
  onEnter: {
    type: Function,
    default: () => {},
  },
});

const isShiftActive = ref(false);
const isSymbolMode = ref(false);
let activeElement: HTMLElement | null = null;

// 字母键盘布局
const lettersLower = {
  row1: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  row2: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  row3: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
};

const lettersUpper = {
  row1: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  row2: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  row3: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
};

// 符号键盘布局
const symbols = {
  row1: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  row2: ['@', '#', '$', '%', '&', '*', '-', '+', '(', ')'],
  row3: ['!', '"', "'", ':', ';', '/', '?', ',', '.'],
};

const row1 = computed(() => {
  if (isSymbolMode.value) return symbols.row1;
  return isShiftActive.value ? lettersUpper.row1 : lettersLower.row1;
});

const row2 = computed(() => {
  if (isSymbolMode.value) return symbols.row2;
  return isShiftActive.value ? lettersUpper.row2 : lettersLower.row2;
});

const row3 = computed(() => {
  if (isSymbolMode.value) return symbols.row3;
  return isShiftActive.value ? lettersUpper.row3 : lettersLower.row3;
});

// 监听焦点变化，记录当前活动元素
function handleFocusIn(e: FocusEvent) {
  if (
    e.target instanceof HTMLElement &&
    (e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.getAttribute('contenteditable') === 'true')
  ) {
    activeElement = e.target;
  }
}

function handleMouseDown(event: MouseEvent) {
  event.preventDefault();
}

// 模拟键盘输入
function simulateKeyInput(key: string) {
  if (!activeElement) return;

  if (key === 'Backspace') {
    // 处理退格键
    if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
      const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;

      if (start === end && start > 0) {
        // 没有选中文本，删除前一个字符
        const value = input.value;
        input.value = value.substring(0, start - 1) + value.substring(end);
        input.selectionStart = input.selectionEnd = start - 1;

        // 触发input事件
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      } else if (start !== end) {
        // 有选中文本，删除选中部分
        const value = input.value;
        input.value = value.substring(0, start) + value.substring(end);
        input.selectionStart = input.selectionEnd = start;

        // 触发input事件
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      }
    } else if (activeElement.getAttribute('contenteditable') === 'true') {
      // 对于contenteditable元素，使用document.execCommand
      document.execCommand('delete', false);
    }
  } else if (key === 'Enter') {
    // 处理回车键
    if (activeElement.tagName === 'TEXTAREA' || activeElement.getAttribute('contenteditable') === 'true') {
      document.execCommand('insertLineBreak');
    } else if (activeElement.tagName === 'INPUT') {
      // 对于input元素，可以触发表单提交或模拟Tab键
      if ('form' in activeElement) {
        (activeElement as unknown as HTMLFormElement).form?.dispatchEvent(
          new Event('submit', { bubbles: true })
        );
      }
    }
  } else {
    // 处理普通字符输入
    if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
      const input = activeElement as HTMLInputElement | HTMLTextAreaElement;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;

      // 替换选中文本或插入字符
      const value = input.value;
      input.value = value.substring(0, start) + key + value.substring(end);
      input.selectionStart = input.selectionEnd = start + key.length;

      // 触发input事件
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    } else if (activeElement.getAttribute('contenteditable') === 'true') {
      // 对于contenteditable元素
      document.execCommand('insertText', false, key);
    }
  }
}

function handleKeyPress(key: string, event: MouseEvent) {
  event.preventDefault(); // 阻止默认行为
  simulateKeyInput(key);

  if (isShiftActive.value && !isSymbolMode.value) {
    isShiftActive.value = false;
  }
}

function handleBackspace(event: MouseEvent) {
  event.preventDefault();
  simulateKeyInput('Backspace');
}

function handleEnter(event: MouseEvent) {
  event.preventDefault();
  simulateKeyInput('Enter');
}

function toggleShift(event: MouseEvent) {
  event.preventDefault();
  isShiftActive.value = !isShiftActive.value;
}

function toggleSymbols(event: MouseEvent) {
  event.preventDefault();
  isSymbolMode.value = !isSymbolMode.value;
  isShiftActive.value = false;
}

function close() {
  browserWindow?.close();
}

onMounted(() => {
  // 添加全局焦点事件监听
  document.addEventListener('focusin', handleFocusIn);

  // 初始化样式
  browserWindow?.setFrame(false);
  const width = Math.min(640, window.innerWidth - 24);
  browserWindow?.setSize(width, 286);
  browserWindow?.setPosition(Math.max(12, (window.innerWidth - width) / 2), Math.max(12, window.innerHeight - 342));
  browserWindow?.setBackgroundColor('transparent');
  browserWindow?.setResizable(false);
  browserWindow?.setAlwaysOnTop(true);
});

onUnmounted(() => {
  // 移除全局焦点事件监听
  document.removeEventListener('focusin', handleFocusIn);
});
</script>

<style lang="scss" scoped>
.soft-keyboard {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 10px 12px 14px;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, .9);
  border-radius: 18px;
  background: rgba(235, 238, 244, .96);
  color: #303744;
  box-shadow: 0 16px 48px rgba(22, 33, 53, .18), 0 2px 8px rgba(22, 33, 53, .06);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.keyboard-handle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 30px;
  margin: 0 0 12px;
  cursor: grab;
  &:active { cursor: grabbing; }
}
.keyboard-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 4px;
  color: #626c7d;
  font-size: 12px;
  font-weight: 500;
  svg { width: 19px; height: 19px; }
}
.keyboard-close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 5px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #697384;
  cursor: pointer;
  &:hover { background: rgba(35, 47, 69, .08); color: #303744; }
  &:active { background: rgba(35, 47, 69, .13); }
  svg { width: 18px; height: 18px; }
}
.keyboard-container {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
}
.keyboard-row {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 6px;
  justify-content: center;
}
.keyboard-row-inset { margin-inline: calc((100% + 6px) / 20); }
.keyboard-key {
  display: grid;
  place-items: center;
  flex: 1;
  min-width: 0;
  padding: 0 4px;
  border: 1px solid rgba(208, 214, 224, .8);
  border-bottom-color: #c5ccd8;
  border-radius: 9px;
  background: #fff;
  color: #303744;
  box-shadow: 0 2px 0 rgba(180, 189, 204, .5);
  font: inherit;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 100ms ease, transform 100ms ease, box-shadow 100ms ease;
  &:hover { background: #f8faff; border-color: #b9c9e5; }
  &:active { transform: translateY(2px); background: #e0e9fa; box-shadow: none; }
  svg { width: 21px; height: 21px; }
}
.keyboard-key:focus-visible, .keyboard-close:focus-visible { outline: 2px solid #4677cb; outline-offset: 2px; }
.keyboard-function {
  background: #dce2eb;
  color: #536074;
  border-color: #cdd5e1;
  &:hover { background: #d2ddeb; }
}
.shift, .backspace { flex: 1.5; }
.keyboard-mode { flex: 1.7; font-size: 13px; font-weight: 500; }
.space { flex: 6; color: #778295; font-size: 13px; }
.enter {
  flex: 2;
  border-color: #4774ba;
  background: #4d7bc7;
  color: #fff;
  box-shadow: 0 2px 0 #3e66aa;
  font-size: 14px;
  font-weight: 500;
  &:hover { border-color: #3969b6; background: #4272c0; }
  &:active { background: #3563aa; }
}
.is-active {
  border-color: #a8bfe8;
  background: #d2e2ff;
  color: #2a61bc;
  &:hover { background: #c5d9fb; }
}
@media (max-width: 600px) {
  .soft-keyboard { padding: 8px 8px 12px; border-radius: 15px; }
  .keyboard-row { gap: 4px; }
  .keyboard-row-inset { margin-inline: calc((100% + 4px) / 20); }
  .keyboard-key { border-radius: 7px; font-size: 16px; }
  .keyboard-mode { font-size: 11px; }
  .space, .enter { font-size: 13px; }
  .shift, .backspace { flex: 1.35; }
  .keyboard-key svg { width: 18px; height: 18px; }
}
@media (prefers-reduced-motion: reduce) {
  .keyboard-key { transition: none; }
}
</style>

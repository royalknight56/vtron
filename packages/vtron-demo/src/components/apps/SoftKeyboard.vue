<template>
  <div class="soft-keyboard" @mousedown="handleMouseDown">
          <!-- handle -->
    <div class="keyboard-handle" v-dragable>
        <i class="fas fa-hand-pointer">↔</i>
        <!-- close -->
        <div class="close" @click="close">
            <i class="fas fa-times">×</i>
        </div>
    </div>
    <div class="keyboard-container">
      <div class="keyboard-row">
        <button v-for="key in row1" :key="key" @mousedown="handleKeyPress(key, $event)" class="keyboard-key">{{ key }}</button>
      </div>
      <div class="keyboard-row">
        <button v-for="key in row2" :key="key" @mousedown="handleKeyPress(key, $event)" class="keyboard-key">{{ key }}</button>
      </div>
      <div class="keyboard-row">
        <button class="keyboard-key shift" @mousedown="toggleShift($event)">
          <i class="fas fa-arrow-up">⇧</i>
        </button>
        <button v-for="key in row3" :key="key" @mousedown="handleKeyPress(key, $event)" class="keyboard-key">{{ key }}</button>
        <button class="keyboard-key backspace" @mousedown="handleBackspace($event)">
          <i class="fas fa-backspace">⌫</i>
        </button>
      </div>
      <div class="keyboard-row">
        <button class="keyboard-key" @mousedown="toggleSymbols($event)">{{ isSymbolMode ? 'ABC' : '?123' }}</button>
        <button class="keyboard-key space" @mousedown="handleKeyPress(' ', $event)">空格</button>
        <button class="keyboard-key enter" @mousedown="handleEnter($event)">回车</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { BrowserWindow,vDragable } from 'vtron';
import { ref, computed, onMounted, onUnmounted, inject } from 'vue';

const browserWindow = inject<BrowserWindow>('browserWindow');
const props = defineProps({
  onInput: {
    type: Function,
    default: () => {}
  },
  onEnter: {
    type: Function,
    default: () => {}
  }
});

const isShiftActive = ref(false);
const isSymbolMode = ref(false);
let activeElement: HTMLElement | null = null;

// 字母键盘布局
const lettersLower = {
  row1: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  row2: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  row3: ['z', 'x', 'c', 'v', 'b', 'n', 'm']
};

const lettersUpper = {
  row1: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  row2: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  row3: ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
};

// 符号键盘布局
const symbols = {
  row1: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  row2: ['@', '#', '$', '%', '&', '*', '-', '+', '(', ')'],
  row3: ['!', '"', '\'', ':', ';', '/', '?', ',', '.']
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
  if (e.target instanceof HTMLElement && 
      (e.target.tagName === 'INPUT' || 
       e.target.tagName === 'TEXTAREA' || 
       e.target.getAttribute('contenteditable') === 'true')) {
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
      if ("form" in activeElement) {
        (activeElement as unknown as HTMLFormElement).form?.dispatchEvent(new Event('submit', { bubbles: true }));
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
  browserWindow?.setSize(600, 280);
  browserWindow?.setBackgroundColor('rgba(240, 240, 240, 0.0)');
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
  width: 100%;
  background-color: rgba(240, 240, 240, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 18px;
  box-sizing: border-box;
  user-select: none;
  position: absolute;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.keyboard-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 30px;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.keyboard-key {
  min-width: 32px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &:active {
    background-color: rgba(220, 220, 220, 0.8);
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
}

.shift, .backspace {
  min-width: 50px;
}

.space {
  flex: 1;
  min-width: 120px;
}

.enter {
  min-width: 70px;
//   background-color: rgba(74, 144, 226, 0.8);
//   color: white;
  
  &:active {
    // background-color: rgba(58, 128, 210, 0.9);
  }
}

.keyboard-handle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 30px;
  padding: 0 15px;
  box-sizing: border-box;
  background-color: rgba(240, 240, 240, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px 10px 0 0;
  .close{
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .close:hover {
    background-color: rgba(243, 75, 75, 0.3);
  }
}

.keyboard-handle-icon {
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
  }

}

</style>

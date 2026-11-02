<template>
  <Win10Frame title="屏幕键盘" :icon="win?.windowInfo.icon" background="#1b1b1b" titlebar-background="#fff">
    <div ref="keyboard" class="on-screen-keyboard">
      <div class="text-strip">
        <input v-model="buffer" aria-label="待复制文本" autocomplete="off" spellcheck="false" /><button
          :disabled="!buffer || !canCopy"
          @pointerdown.prevent
          @click="copyBuffer"
        >
          {{ copyStatus || '复制' }}
        </button>
      </div>
      <div class="keyboard-layout" @pointerdown.prevent>
        <div class="main-keys">
          <div v-for="(row, index) in rows" :key="index" class="key-row">
            <button
              v-for="(key, keyIndex) in row"
              :key="keyIndex"
              :style="{ flexGrow: key.grow || 1 }"
              :class="{
                number: key.upper,
                toggled: (key.action === 'shift' && shift) || (key.action === 'caps' && caps),
                space: key.value === ' ',
              }"
              :disabled="key.disabled"
              :title="key.disabled ? '此系统按键暂不可用' : key.name || key.label"
              :aria-label="key.name || key.label || '空格'"
              :aria-pressed="key.action === 'shift' ? shift : key.action === 'caps' ? caps : undefined"
              @click="press(key)"
            >
              <span v-if="key.upper" class="upper">{{ key.upper }}</span
              ><span>{{ keyLabel(key) }}</span>
            </button>
          </div>
        </div>
        <div class="navigation-keys">
          <template v-for="(key, index) in navigation" :key="index"
            ><button
              :disabled="key.disabled"
              :title="key.disabled ? '此系统按键暂不可用' : key.name || key.label"
              :aria-label="key.name || key.label"
              @click="press(key)"
            >
              {{ key.label }}
            </button></template
          >
        </div>
        <div v-if="numeric" class="numeric-keys">
          <button
            v-for="key in ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'Enter']"
            :key="key"
            :aria-label="key"
            @click="press({ label: key, value: key })"
          >
            {{ key === 'Enter' ? '↵' : key }}
          </button>
        </div>
      </div>
      <div v-if="status" class="keyboard-status" role="status">{{ status }}</div>
      <div v-if="options" class="options-backdrop" @pointerdown.stop>
        <div class="options-dialog" role="dialog" aria-label="屏幕键盘选项">
          <h2>选项</h2>
          <label><input type="checkbox" disabled />使用单击声</label
          ><label><input v-model="numeric" type="checkbox" />打开数字小键盘</label
          ><label><input type="radio" checked disabled />单击按键</label
          ><label><input type="radio" disabled />悬停在按键上</label
          ><label><input type="radio" disabled />扫描按键</label
          ><label><input type="checkbox" disabled />使用文本预测</label>
          <div><button @click="options = false">确定</button></div>
        </div>
      </div>
    </div>
  </Win10Frame>
</template>
<script setup lang="ts">
import { inject, onMounted, onUnmounted, ref } from 'vue';
import { BrowserWindow, System } from 'vtron';
import Win10Frame from '../../daily/Win10Frame.vue';
import { editableIn, editText, type Editable } from './keyboardInput';
interface Key {
  label: string;
  value?: string;
  upper?: string;
  grow?: number;
  disabled?: boolean;
  action?: string;
  name?: string;
}
const system = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');
const keyboard = ref<HTMLElement>();
const buffer = ref('');
const shift = ref(false);
const caps = ref(false);
const numeric = ref(false);
const options = ref(false);
const status = ref('');
const copyStatus = ref('');
const canCopy = !!navigator.clipboard?.writeText;
let active: Editable | null = null;
let savedRange: Range | null = null;
let root: HTMLElement | undefined;
const letters = (text: string): Key[] => Array.from(text, (label) => ({ label, value: label }));
const off = (label: string): Key => ({ label, disabled: true });
const rows: Key[][] = [
  [
    off('Esc'),
    ...Array.from('`1234567890-=', (label, index) => ({
      label,
      value: label,
      upper: '~!@#$%^&*()_+'[index],
    })),
    { label: '⌫', value: 'Backspace', name: '退格', grow: 1.5 },
  ],
  [
    { label: 'Tab', value: 'Tab', grow: 1.5 },
    ...letters('qwertyuiop'),
    { label: '[', value: '[', upper: '{' },
    { label: ']', value: ']', upper: '}' },
    { label: '\\', value: '\\', upper: '|' },
    { label: 'Del', value: 'Delete' },
  ],
  [
    { label: 'Caps', action: 'caps', grow: 2 },
    ...letters('asdfghjkl'),
    { label: ';', value: ';', upper: ':' },
    { label: "'", value: "'", upper: '"' },
    { label: 'Enter', value: 'Enter', grow: 2.5 },
  ],
  [
    { label: 'Shift', action: 'shift', grow: 2.5 },
    ...letters('zxcvbnm'),
    { label: ',', value: ',', upper: '<' },
    { label: '.', value: '.', upper: '>' },
    { label: '/', value: '/', upper: '?' },
    { label: '↑', value: 'ArrowUp' },
    { label: 'Shift', action: 'shift', grow: 2 },
  ],
  [
    off('Fn'),
    off('Ctrl'),
    off('⊞'),
    off('Alt'),
    { label: '', value: ' ', grow: 5.5 },
    off('Alt'),
    off('Ctrl'),
    { label: '←', value: 'ArrowLeft' },
    { label: '↓', value: 'ArrowDown' },
    { label: '→', value: 'ArrowRight' },
    off('▤'),
  ],
];
const navigation: Key[] = [
  { label: 'Home', value: 'Home' },
  { label: 'PgUp', disabled: true },
  off('Nav'),
  { label: 'End', value: 'End' },
  off('PgDn'),
  off('Mv Up'),
  off('Insert'),
  off('Pause'),
  off('Mv Dn'),
  off('PrtScn'),
  off('ScrLk'),
  off('Dock'),
  { label: 'Options', action: 'options', name: '选项' },
  off('Help'),
  off('Fade'),
];
function keyLabel(key: Key) {
  if (/^[a-z]$/.test(key.label)) return shift.value !== caps.value ? key.label.toUpperCase() : key.label;
  return key.label;
}
function trackFocus(event: FocusEvent) {
  if (!root) return;
  if (
    keyboard.value?.contains(event.target as Node) &&
    !(event.target as HTMLElement).matches('.text-strip input')
  )
    return;
  const target = editableIn(root, event.target);
  if (target) {
    active = target;
    savedRange = null;
    status.value = '';
  }
}
function rememberSelection() {
  const selection = document.getSelection();
  if (
    active &&
    !(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) &&
    selection?.rangeCount &&
    active.contains(selection.anchorNode)
  )
    savedRange = selection.getRangeAt(0).cloneRange();
}
function currentTarget() {
  if (active?.isConnected && root?.contains(active)) return active;
  return keyboard.value?.querySelector<HTMLInputElement>('.text-strip input') || null;
}
function press(key: Key) {
  if (key.disabled) return;
  status.value = '';
  if (key.action === 'shift') {
    shift.value = !shift.value;
    return;
  }
  if (key.action === 'caps') {
    caps.value = !caps.value;
    return;
  }
  if (key.action === 'options') {
    options.value = true;
    return;
  }
  const target = currentTarget();
  if (!target || !root) return;
  if (key.value === 'Tab') {
    const fields = Array.from(
      root.querySelectorAll<HTMLElement>('input,textarea,[contenteditable="true"]')
    ).filter((el) => !keyboard.value?.contains(el) && !!editableIn(root!, el) && el.getClientRects().length);
    const index = fields.indexOf(target);
    fields[(index + 1) % fields.length]?.focus({ preventScroll: true });
    return;
  }
  if (
    savedRange &&
    !(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) &&
    target.contains(savedRange.commonAncestorContainer)
  ) {
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(savedRange);
  }
  let value = key.value || key.label;
  if (/^[a-z]$/.test(value)) value = shift.value !== caps.value ? value.toUpperCase() : value;
  else if (key.upper && shift.value) value = key.upper;
  const applied = editText(root, target, value);
  if (!applied) status.value = '此按键不适用于当前编辑框。';
  shift.value = false;
  copyStatus.value = '';
  rememberSelection();
}
async function copyBuffer() {
  try {
    await navigator.clipboard.writeText(buffer.value);
    copyStatus.value = '已复制';
  } catch {
    copyStatus.value = '复制失败';
  }
}
onMounted(() => {
  root = system.rootRef;
  if (!root) return;
  root.addEventListener('focusin', trackFocus);
  document.addEventListener('selectionchange', rememberSelection);
  active = editableIn(root, document.activeElement);
});
onUnmounted(() => {
  root?.removeEventListener('focusin', trackFocus);
  document.removeEventListener('selectionchange', rememberSelection);
  active = null;
  savedRange = null;
});
</script>
<style scoped>
.on-screen-keyboard {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  position: relative;
  padding: 0 4px 4px;
  background: #1b1b1b;
  color: #fff;
}
.text-strip {
  display: flex;
  align-items: center;
  min-height: 46px;
  padding: 0 4px;
  gap: 8px;
}
.text-strip input {
  flex: 1;
  min-width: 0;
  height: 32px;
  border: 0;
  outline: 0;
  border-radius: 0;
  background: transparent;
  color: #fff;
  font:
    18px 'Segoe UI',
    sans-serif;
}
.text-strip button {
  padding: 4px 12px;
  border: 1px solid #555;
  background: #333;
  color: #fff;
  font:
    12px 'Segoe UI',
    sans-serif;
}
.text-strip button:disabled {
  visibility: hidden;
}
.keyboard-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 7px;
}
.main-keys {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}
.key-row {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 4px;
}
.key-row button {
  position: relative;
  flex-basis: 0;
  min-width: 0;
  padding: 3px 4px;
  text-align: left;
  font-size: 18px;
}
.keyboard-layout button {
  border: 0;
  border-radius: 0;
  background: #333;
  color: #fff;
  cursor: default;
  font-family: 'Segoe UI', sans-serif;
  line-height: 1.1;
}
.keyboard-layout button:disabled {
  color: #8c8c8c;
}
.keyboard-layout button:enabled:hover {
  background: #555;
}
.keyboard-layout button:enabled:active,
.keyboard-layout button.toggled {
  background: #0078d7;
}
.keyboard-layout button:focus-visible {
  outline: 1px solid white;
  outline-offset: -3px;
}
.key-row .number > span:last-child {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20px;
}
.upper {
  color: #888;
  font-size: 17px;
}
.navigation-keys {
  display: grid;
  width: 132px;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: 4px;
}
.navigation-keys button {
  padding: 3px 3px;
  text-align: left;
  font-size: 12px;
}
.numeric-keys {
  display: grid;
  width: 144px;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}
.numeric-keys button {
  font-size: 18px;
}
.keyboard-status {
  position: absolute;
  top: 4px;
  right: 8px;
  padding: 3px 6px;
  background: #1b1b1b;
  color: #ccc;
  font-size: 11px;
}
.options-backdrop {
  display: flex;
  position: absolute;
  z-index: 2;
  inset: 0;
  align-items: center;
  justify-content: center;
  background: #0005;
}
.options-dialog {
  min-width: 280px;
  padding: 12px 20px;
  border: 1px solid #888;
  background: #f0f0f0;
  color: #111;
  box-shadow: 0 3px 15px #0007;
}
.options-dialog h2 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 400;
}
.options-dialog label {
  display: flex;
  align-items: center;
  height: 26px;
  gap: 7px;
}
.options-dialog input {
  margin: 0;
  accent-color: #0078d7;
}
.options-dialog > div {
  text-align: right;
  margin-top: 10px;
}
.options-dialog button {
  width: 75px;
  height: 25px;
  border: 1px solid #999;
  border-radius: 0;
  background: #e1e1e1;
}
</style>

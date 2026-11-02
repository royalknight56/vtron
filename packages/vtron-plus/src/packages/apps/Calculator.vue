<template>
  <Win10Frame title="计算器" background="#e6e6e6">
    <div ref="rootRef" class="calc-app" tabindex="0" @keydown="onKeydown">
      <div class="calc-main">
        <div class="calc-toolbar">
          <button aria-label="打开导航" title="打开导航" @click="menuOpen = !menuOpen">
            <span class="mdl" aria-hidden="true">&#xE700;</span>
          </button>
          <h1>标准</h1>
          <button disabled aria-label="保持在最前面" title="保持在最前面">
            <span class="mdl" aria-hidden="true">&#xE740;</span></button
          ><span class="toolbar-space"></span
          ><button
            class="history-toggle"
            aria-label="历史记录"
            title="历史记录"
            @click="showPanel('history')"
          >
            <span class="mdl" aria-hidden="true">&#xE81C;</span>
          </button>
        </div>
        <div class="calc-display">
          <div class="expression">{{ expression }}</div>
          <output
            aria-label="计算结果"
            aria-live="polite"
            :class="{ 'small-result': displayText.length > 12 }"
            >{{ displayText }}</output
          >
        </div>
        <div class="memory-bar">
          <button :disabled="memory === null" @click="memory = null">MC</button
          ><button :disabled="memory === null || !!error" @click="recallMemory">MR</button
          ><button :disabled="!!error" @click="storeMemory('add')">M+</button
          ><button :disabled="!!error" @click="storeMemory('subtract')">M−</button
          ><button :disabled="!!error" @click="storeMemory('set')">MS</button
          ><button
            class="memory-toggle"
            :disabled="memory === null"
            aria-label="显示内存"
            @click="showPanel('memory')"
          >
            M<span class="mdl tiny" aria-hidden="true">&#xE70D;</span>
          </button>
        </div>
        <div class="keypad">
          <button
            v-for="key in keys"
            :key="key.action"
            :class="{ digit: key.digit, equals: key.action === 'equals' }"
            :aria-label="key.label"
            @click="activate(key.action)"
          >
            <span v-if="key.icon" class="mdl" aria-hidden="true">{{ key.icon }}</span
            ><span v-else>{{ key.text }}</span>
          </button>
        </div>
      </div>
      <aside class="history-panel" :class="{ 'panel-open': panelOpen }" aria-label="计算历史与内存">
        <div class="panel-tabs">
          <button :class="{ active: panel === 'history' }" @click="panel = 'history'">历史记录</button
          ><button :class="{ active: panel === 'memory' }" @click="panel = 'memory'">内存</button
          ><button class="panel-close" aria-label="关闭面板" @click="panelOpen = false">
            <span class="mdl" aria-hidden="true">&#xE70D;</span>
          </button>
        </div>
        <div class="panel-content">
          <template v-if="panel === 'history'"
            ><p v-if="!history.length" class="panel-empty">尚无历史记录</p>
            <button
              v-for="(item, index) in history"
              :key="index"
              class="history-item"
              @click="useHistory(item.result)"
            >
              <span>{{ item.expression }}</span
              ><strong>{{ format(item.result) }}</strong>
            </button></template
          ><template v-else
            ><p v-if="memory === null" class="panel-empty">内存中未保存任何内容</p>
            <div v-else class="memory-item">
              <strong>{{ format(memory) }}</strong>
              <div>
                <button @click="memory = null">MC</button
                ><button :disabled="!!error" @click="storeMemory('add')">M+</button
                ><button :disabled="!!error" @click="storeMemory('subtract')">M−</button>
              </div>
            </div></template
          >
        </div>
        <div class="panel-bottom">
          <button
            :disabled="panel === 'history' ? !history.length : memory === null"
            :aria-label="panel === 'history' ? '清除历史记录' : '清除内存'"
            @click="panel === 'history' ? (history = []) : (memory = null)"
          >
            <span class="mdl" aria-hidden="true">&#xE74D;</span>
          </button>
        </div>
      </aside>
      <div v-if="menuOpen" class="navigation-menu">
        <button class="nav-heading" @click="menuOpen = false">
          <span class="mdl" aria-hidden="true">&#xE700;</span>计算器</button
        ><button class="nav-current" @click="menuOpen = false">
          <span class="mdl" aria-hidden="true">&#xE8EF;</span>标准</button
        ><button disabled>科学</button><button disabled>绘图</button><button disabled>程序员</button
        ><button disabled>日期计算</button>
        <div class="nav-separator"></div>
        <div class="nav-label">转换器</div>
        <button
          v-for="name in [
            '货币',
            '体积',
            '长度',
            '重量和质量',
            '温度',
            '能量',
            '面积',
            '速度',
            '时间',
            '功率',
            '数据',
            '压力',
            '角度',
          ]"
          :key="name"
          disabled
        >
          {{ name }}
        </button>
      </div>
    </div>
  </Win10Frame>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import Win10Frame from './daily/Win10Frame.vue';
type Operator = 'add' | 'subtract' | 'multiply' | 'divide';
const rootRef = ref<HTMLElement>();
const input = ref('0');
const error = ref('');
const expression = ref('');
const memory = ref<number | null>(null);
const history = ref<{ expression: string; result: number }[]>([]);
const menuOpen = ref(false);
const panelOpen = ref(false);
const panel = ref<'history' | 'memory'>('history');
let accumulator: number | null = null;
let operator: Operator | null = null;
let overwrite = true;
let awaitingOperand = false;
let lastOperator: Operator | null = null;
let lastOperand = 0;
const symbols: Record<Operator, string> = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
function format(value: number) {
  return Number.isFinite(value)
    ? Number(value.toPrecision(15)).toLocaleString('en-US', { maximumSignificantDigits: 15 })
    : String(value);
}
const displayText = computed(() => {
  if (error.value) return error.value;
  if (input.value.includes('.') && !/[eE]/.test(input.value)) {
    const [whole, decimal] = input.value.split('.');
    return `${Number(whole).toLocaleString('en-US')}.${decimal}`;
  }
  return format(Number(input.value));
});

const keys = [
  { icon: '\uE94C', label: '百分比', action: 'percent' },
  { text: 'CE', label: '清除当前输入', action: 'clearEntry' },
  { text: 'C', label: '全部清除', action: 'clear' },
  { icon: '\uE94F', label: '退格', action: 'backspace' },
  { text: '¹/ₓ', label: '倒数', action: 'reciprocal' },
  { text: 'x²', label: '平方', action: 'square' },
  { icon: '\uE94B', label: '平方根', action: 'sqrt' },
  { icon: '\uE94A', label: '除', action: 'divide' },
  ...['7', '8', '9'].map((text) => ({ text, label: text, action: text, digit: true })),
  { icon: '\uE947', label: '乘', action: 'multiply' },
  ...['4', '5', '6'].map((text) => ({ text, label: text, action: text, digit: true })),
  { icon: '\uE949', label: '减', action: 'subtract' },
  ...['1', '2', '3'].map((text) => ({ text, label: text, action: text, digit: true })),
  { icon: '\uE948', label: '加', action: 'add' },
  { icon: '\uE94D', label: '正负号', action: 'negate', digit: true },
  { text: '0', label: '0', action: '0', digit: true },
  { text: '.', label: '小数点', action: 'decimal', digit: true },
  { icon: '\uE94E', label: '等于', action: 'equals' },
] as { text?: string; icon?: string; label: string; action: string; digit?: boolean }[];
function clear() {
  input.value = '0';
  error.value = '';
  expression.value = '';
  accumulator = null;
  operator = null;
  overwrite = true;
  lastOperator = null;
  lastOperand = 0;
  awaitingOperand = false;
}
function result(value: number) {
  if (!Number.isFinite(value)) {
    error.value = Number.isNaN(value) ? '无效输入' : '结果溢出';
    operator = null;
    accumulator = null;
    overwrite = true;
    return false;
  }
  input.value = String(Number(value.toPrecision(15)));
  return true;
}
function calculate(left: number, right: number, op: Operator) {
  if (op === 'divide' && right === 0) {
    error.value = left === 0 ? '结果未定义' : '除数不能为零';
    accumulator = null;
    operator = null;
    overwrite = true;
    return null;
  }
  const value =
    op === 'add'
      ? left + right
      : op === 'subtract'
        ? left - right
        : op === 'multiply'
          ? left * right
          : left / right;
  return result(value) ? value : null;
}
function enterDigit(digit: string) {
  awaitingOperand = false;
  if (error.value) clear();
  if (overwrite) {
    input.value = digit;
    overwrite = false;
    if (!operator) {
      expression.value = '';
      lastOperator = null;
    }
  } else if (input.value.replace(/[-.]/g, '').length < 16)
    input.value = input.value === '0' ? digit : input.value + digit;
}
function chooseOperator(next: Operator) {
  if (error.value) return;
  const current = Number(input.value);
  if (operator && accumulator !== null && !awaitingOperand) {
    const value = calculate(accumulator, current, operator);
    if (value === null) return;
    accumulator = value;
  } else accumulator = current;
  operator = next;
  awaitingOperand = true;
  lastOperator = null;
  overwrite = true;
  expression.value = `${format(accumulator)} ${symbols[next]}`;
}
function equals() {
  if (error.value) return;
  const op = operator || lastOperator;
  if (!op) {
    expression.value = `${format(Number(input.value))} =`;
    overwrite = true;
    return;
  }
  const left = operator && accumulator !== null ? accumulator : Number(input.value);
  const right = operator ? Number(input.value) : lastOperand;
  const value = calculate(left, right, op);
  if (value === null) return;
  expression.value = `${format(left)} ${symbols[op]} ${format(right)} =`;
  history.value.unshift({ expression: expression.value, result: value });
  if (history.value.length > 100) history.value.pop();
  lastOperator = op;
  lastOperand = right;
  accumulator = null;
  operator = null;
  overwrite = true;
}
function activate(action: string) {
  if (/^\d$/.test(action)) {
    enterDigit(action);
    return;
  }
  if (action === 'clear') {
    clear();
    return;
  }
  if (action === 'clearEntry') {
    awaitingOperand = false;
    if (error.value) clear();
    else {
      input.value = '0';
      overwrite = true;
    }
    return;
  }
  if (error.value) return;
  if (action in symbols) {
    chooseOperator(action as Operator);
    return;
  }
  if (action === 'equals') {
    equals();
    return;
  }
  if (action === 'backspace') {
    if (!overwrite) input.value = input.value.length > 1 ? input.value.slice(0, -1) : '0';
    if (input.value === '-') input.value = '0';
    return;
  }
  if (action === 'decimal') {
    awaitingOperand = false;
    if (overwrite) {
      input.value = '0.';
      overwrite = false;
      if (!operator) expression.value = '';
    } else if (!input.value.includes('.')) input.value += '.';
    return;
  }
  if (action === 'negate') {
    awaitingOperand = false;
    if (Number(input.value) !== 0)
      input.value = input.value.startsWith('-') ? input.value.slice(1) : '-' + input.value;
    return;
  }
  const value = Number(input.value);
  if (action === 'percent') {
    awaitingOperand = false;
    result(
      (operator === 'add' || operator === 'subtract') && accumulator !== null
        ? (accumulator * value) / 100
        : value / 100
    );
    overwrite = true;
    return;
  }
  if (action === 'reciprocal' && value === 0) {
    error.value = '除数不能为零';
    overwrite = true;
    return;
  }
  if (action === 'sqrt' && value < 0) {
    error.value = '无效输入';
    overwrite = true;
    return;
  }
  const next = action === 'reciprocal' ? 1 / value : action === 'square' ? value * value : Math.sqrt(value);
  if (result(next)) {
    awaitingOperand = false;
    expression.value =
      action === 'reciprocal'
        ? `1/(${format(value)})`
        : action === 'square'
          ? `sqr(${format(value)})`
          : `√(${format(value)})`;
    overwrite = true;
  }
}
function storeMemory(mode: 'set' | 'add' | 'subtract') {
  if (error.value) return;
  const value = Number(input.value);
  const next = mode === 'set' ? value : (memory.value ?? 0) + value * (mode === 'add' ? 1 : -1);
  if (Number.isFinite(next)) memory.value = next;
  overwrite = true;
}
function recallMemory() {
  if (memory.value !== null) {
    awaitingOperand = false;
    input.value = String(memory.value);
    overwrite = true;
    error.value = '';
  }
}
function useHistory(value: number) {
  awaitingOperand = false;
  input.value = String(value);
  expression.value = '';
  operator = null;
  accumulator = null;
  lastOperator = null;
  error.value = '';
  overwrite = true;
  panelOpen.value = false;
}
function showPanel(next: 'history' | 'memory') {
  const same = panel.value === next;
  panel.value = next;
  panelOpen.value = !panelOpen.value || !same;
}
function onKeydown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const actions: Record<string, string> = {
    '+': 'add',
    '-': 'subtract',
    '*': 'multiply',
    '/': 'divide',
    '=': 'equals',
    Enter: 'equals',
    Escape: 'clear',
    Delete: 'clearEntry',
    Backspace: 'backspace',
    '.': 'decimal',
    ',': 'decimal',
    '%': 'percent',
    F9: 'negate',
  };
  const action = /^\d$/.test(event.key) ? event.key : actions[event.key];
  if (!action) return;
  event.preventDefault();
  activate(action);
}
onMounted(async () => {
  await nextTick();
  rootRef.value?.focus({ preventScroll: true });
});
</script>
<style scoped>
.calc-app,
.calc-app *,
.calc-app *::before,
.calc-app *::after {
  box-sizing: border-box;
}
.calc-app {
  container-type: inline-size;
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  outline: none;
  overflow: hidden;
  user-select: none;
}
.calc-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
button {
  font: inherit;
  color: inherit;
  border: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  cursor: default;
}
button:disabled {
  color: #aaa;
}
button:hover:enabled {
  border-color: #bfbfbf;
  background: #d5d5d5;
}
button:focus-visible {
  outline: 1px dotted #333;
  outline-offset: -3px;
}
.mdl {
  font: 18px/1 'SEGOEUIMDL';
}
.mdl.tiny {
  font-size: 8px;
}
.calc-toolbar {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 6px;
  flex-shrink: 0;
}
.calc-toolbar button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
h1 {
  font-size: 20px;
  line-height: 30px;
  font-weight: 600;
  margin: 0 10px 0 6px;
}
.toolbar-space {
  flex: 1;
}
.calc-display {
  height: 96px;
  flex-shrink: 0;
  padding: 8px 14px 9px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
}
.expression {
  min-height: 24px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #666;
  font-size: 14px;
}
output {
  font-size: 46px;
  line-height: 58px;
  font-weight: 600;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
}
output.small-result {
  font-size: 31px;
}
.memory-bar {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  height: 38px;
  padding: 0 3px;
  flex-shrink: 0;
}
.memory-bar button {
  font-size: 12px;
  font-weight: 600;
}
.memory-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}
.keypad {
  display: grid;
  flex: 1;
  min-height: 246px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(6, 1fr);
  gap: 2px;
  padding: 0 4px 4px;
}
.keypad button {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: #f0f0f0;
}
.keypad button:nth-child(-n + 7) {
  font-size: 15px;
}
.keypad .mdl {
  font-size: 16px;
}
.keypad button.digit {
  background: #fafafa;
  font-weight: 600;
}
.keypad button.equals {
  background: #8abce1;
}
.keypad button.equals:hover {
  background: #4599d5;
}
.keypad button:hover {
  background: #d9d9d9;
}
.keypad button:active {
  background: #bfbfbf;
}
.history-panel {
  display: flex;
  flex-direction: column;
  width: 260px;
  padding: 0 7px;
}
.panel-tabs {
  display: flex;
  gap: 22px;
  align-items: center;
  height: 43px;
  flex-shrink: 0;
}
.panel-tabs > button {
  position: relative;
  height: 37px;
  padding: 0 0 5px;
  font-size: 14px;
  font-weight: 600;
}
.panel-tabs > button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #0078d7;
}
.panel-content {
  overflow: auto;
  flex: 1;
  padding-top: 8px;
}
.panel-empty {
  margin: 14px 0;
  font-size: 14px;
  font-weight: 600;
}
.history-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
  gap: 6px;
  padding: 12px 5px;
  text-align: right;
}
.history-item > span {
  color: #666;
  font-size: 13px;
}
.history-item strong,
.memory-item strong {
  font-size: 22px;
  font-weight: 600;
}
.panel-bottom {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.panel-bottom button {
  width: 34px;
  height: 34px;
}
.memory-item {
  text-align: right;
  padding: 12px 5px;
}
.memory-item button {
  padding: 5px 8px;
}
.panel-close {
  display: none;
}
.navigation-menu {
  position: absolute;
  z-index: 3;
  inset: 0 auto 0 0;
  width: 260px;
  overflow: auto;
  background: #e6e6e6;
  box-shadow: 2px 0 5px #0002;
}
.navigation-menu > button {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  height: 36px;
  padding: 0 20px;
  text-align: left;
}
.navigation-menu .nav-heading {
  height: 44px;
  font-weight: 600;
  padding-left: 14px;
}
.navigation-menu .nav-current {
  background: #ccc;
  border-left: 3px solid #0078d7;
  padding-left: 17px;
}
.nav-label {
  padding: 9px 20px;
  font-weight: 600;
}
.nav-separator {
  margin: 8px 12px;
  height: 1px;
  background: #bbb;
}
@container (min-width: 520px) {
  .calc-main {
    width: calc(100% - 260px);
  }
  .history-toggle {
    visibility: hidden;
  }
  .memory-bar {
    grid-template-columns: repeat(5, 1fr);
  }
  .memory-toggle {
    display: none;
  }
}
@container (max-width: 519px) {
  .history-panel {
    display: none;
  }
  .history-panel.panel-open {
    display: flex;
    position: absolute;
    z-index: 2;
    inset: auto 0 0;
    width: auto;
    height: 67%;
    padding: 8px 14px;
    background: #e6e6e6;
    box-shadow: 0 -2px 6px #0002;
  }
  .panel-tabs {
    gap: 24px;
  }
  .panel-tabs .panel-close {
    display: block;
    margin-left: auto;
    width: 32px;
  }
}
</style>

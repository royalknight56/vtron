<template>
  <Win10Frame title="字符映射表" :icon="win?.windowInfo.icon" background="#f0f0f0" titlebar-background="#fff">
    <div class="character-map">
      <div class="font-row">
        <label :for="`${id}-font`">字体(F):</label>
        <select :id="`${id}-font`" v-model="font">
          <option v-for="name in fonts" :key="name">{{ name }}</option>
        </select>
        <button disabled title="帮助暂不可用">帮助</button>
      </div>
      <div class="character-scroll">
        <div class="character-grid" :style="{ fontFamily: font }" role="grid" aria-label="字符">
          <button
            v-for="item in filteredCharacters"
            :key="item.code"
            :class="{ selected: selected.code === item.code }"
            :title="`U+${hex(item.code)}: ${item.name}`"
            role="gridcell"
            :aria-selected="selected.code === item.code"
            @click="selected = item"
            @dblclick="appendCharacter"
          >
            {{ item.char }}
          </button>
        </div>
        <p v-if="!filteredCharacters.length" class="no-results">未找到字符。</p>
      </div>
      <div class="copy-row">
        <label :for="`${id}-copy`">复制字符(C):</label
        ><input
          :id="`${id}-copy`"
          v-model="text"
          :style="{ fontFamily: font }"
          aria-label="复制字符"
          @input="copied = false"
        />
        <button @click="appendCharacter">选择(S)</button
        ><button :disabled="!text || !canCopy" @click="copy">{{ copied ? '已复制' : '复制(C)' }}</button>
      </div>
      <label class="advanced-toggle"
        ><input v-model="advanced" type="checkbox" @change="resizeAdvanced" />高级查看(V)</label
      >
      <div v-if="advanced" class="advanced-panel">
        <label
          >字符集:<select>
            <option>Unicode</option>
          </select></label
        >
        <label
          >分组依据:<select v-model="group">
            <option value="">全部</option>
            <option v-for="block in groups" :key="block.id" :value="block.id">{{ block.name }}</option>
          </select></label
        >
        <div class="search-row">
          <label>搜索(S):<input v-model="query" aria-label="搜索字符" @keydown.enter="search" /></label
          ><button @click="search">{{ appliedQuery ? '重置(R)' : '搜索(S)' }}</button
          ><label class="unicode-jump"
            >转到 Unicode:<input
              v-model="unicode"
              maxlength="6"
              aria-label="转到 Unicode"
              @keydown.enter="jump" /></label
          ><button @click="jump">转到</button>
        </div>
      </div>
      <div class="status-bar" role="status">{{ error || `U+${hex(selected.code)}: ${selected.name}` }}</div>
    </div>
  </Win10Frame>
</template>
<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { BrowserWindow } from 'vtron';
import Win10Frame from '../../daily/Win10Frame.vue';
import { characters, groups } from './characters';
const win = inject<BrowserWindow>('browserWindow');
const id = `character-map-${crypto.randomUUID()}`;
const fonts = ['Arial', 'Segoe UI', 'Microsoft YaHei', 'Times New Roman', 'Courier New', 'Georgia'];
const font = ref('Arial');
const selected = ref(characters[0]);
const text = ref('');
const advanced = ref(false);
const group = ref('');
const query = ref('');
const appliedQuery = ref('');
const unicode = ref('');
const copied = ref(false);
const error = ref('');
const canCopy = !!navigator.clipboard?.writeText;
const aliases: Record<string, string> = {
  欧元: 'EURO SIGN',
  版权: 'COPYRIGHT SIGN',
  注册: 'REGISTERED SIGN',
  商标: 'TRADE MARK SIGN',
  人民币: 'YEN SIGN',
  乘号: 'MULTIPLICATION',
  除号: 'DIVISION',
  箭头: 'ARROW',
  希腊: 'GREEK',
  圆周率: 'GREEK SMALL LETTER PI',
  爱心: 'HEART',
};
const filteredCharacters = computed(() => {
  const term = appliedQuery.value.trim();
  const name = (aliases[term] || term).toUpperCase();
  const code = /^(?:U\+|0x)([0-9a-f]{1,6})$/i.exec(term);
  return characters.filter(
    (item) =>
      (!group.value || item.group === group.value) &&
      (!term ||
        item.char === term ||
        item.name.includes(name) ||
        (code && item.code === parseInt(code[1], 16)))
  );
});
function hex(code: number) {
  return code.toString(16).toUpperCase().padStart(4, '0');
}
function appendCharacter() {
  text.value += selected.value.char;
  copied.value = false;
  error.value = '';
}
async function copy() {
  try {
    await navigator.clipboard.writeText(text.value);
    copied.value = true;
    error.value = '';
  } catch {
    error.value = '无法复制到剪贴板。';
  }
}
function search() {
  appliedQuery.value = appliedQuery.value ? '' : query.value.trim();
  error.value = '';
}
function jump() {
  const code = parseInt(unicode.value.replace(/^U\+/i, ''), 16);
  const found = characters.find((item) => item.code === code);
  if (!found) {
    error.value = '当前字符集中没有此字符。';
    return;
  }
  selected.value = found;
  group.value = '';
  appliedQuery.value = `U+${hex(code)}`;
  error.value = '';
}
function resizeAdvanced() {
  if (win) win.setSize(win.windowInfo.width, win.windowInfo.height + (advanced.value ? 90 : -90));
}
</script>
<style scoped>
button,
input,
select {
  font: inherit;
  color: inherit;
  border-radius: 0;
}
button {
  min-height: 23px;
  border: 1px solid #999;
  background: #e1e1e1;
  padding: 2px 9px;
  cursor: default;
}
button:enabled:hover {
  background: #e5f1fb;
  border-color: #0078d7;
}
button:disabled {
  color: #888;
  background: #e4e4e4;
}
input,
select {
  box-sizing: border-box;
  height: 24px;
  border: 1px solid #888;
  background: #fff;
  padding: 2px 4px;
  min-width: 0;
}
button:focus-visible {
  outline: 1px dotted #111;
  outline-offset: -4px;
}
.character-map {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 12px 12px 0;
}
.font-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  height: 24px;
}
.font-row label {
  width: 54px;
}
.font-row select {
  flex: 1;
}
.font-row button {
  width: 86px;
}
.character-scroll {
  flex: 1;
  min-height: 150px;
  margin: 12px 14px 15px;
  border: 1px solid #888;
  background: white;
  overflow-x: hidden;
  overflow-y: scroll;
}
.character-grid {
  display: grid;
  grid-template-columns: repeat(20, minmax(0, 1fr));
  grid-auto-rows: 27px;
  align-content: start;
}
.character-grid button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 27px;
  min-width: 0;
  padding: 0;
  border: 0;
  border-right: 1px solid #aaa;
  border-bottom: 1px solid #aaa;
  background: white;
  color: #111;
  font-size: 20px;
  line-height: 1;
  overflow: hidden;
}
.character-grid button.selected {
  outline: 2px solid #0078d7;
  outline-offset: -2px;
  z-index: 1;
}
.character-grid button:hover {
  background: #e5f1fb;
}
.copy-row {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 27px;
  flex-shrink: 0;
}
.copy-row > label {
  white-space: nowrap;
  width: 104px;
}
.copy-row > input {
  flex: 1;
  width: 60px;
  height: 27px;
  font-size: 18px;
}
.copy-row > button {
  width: 85px;
}
.advanced-toggle {
  display: flex;
  align-items: center;
  height: 26px;
  gap: 4px;
  flex-shrink: 0;
}
.advanced-toggle input {
  width: 13px;
  height: 13px;
  margin: 0;
  accent-color: #0078d7;
}
.advanced-panel {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 2px 0 6px;
  flex-shrink: 0;
}
.advanced-panel > label {
  display: flex;
  align-items: center;
  gap: 8px;
}
.advanced-panel > label select {
  width: 210px;
  margin-left: auto;
  margin-right: 168px;
}
.search-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.search-row label {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.search-row label input {
  width: 110px;
}
.search-row .unicode-jump {
  margin-left: auto;
  font-size: 11px;
}
.search-row .unicode-jump input {
  width: 50px;
}
.status-bar {
  min-height: 22px;
  margin: 0 -11px;
  padding: 2px 5px;
  border: 1px solid #aaa;
  border-bottom: 0;
  background: #f0f0f0;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.no-results {
  padding: 20px;
  text-align: center;
}
</style>

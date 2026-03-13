<template>
  <div class="excel-app" @keydown="onKeyDown" tabindex="0" ref="appRef">
    <div class="toolbar">
      <div class="tool-group">
        <button class="tool-btn" @click="createNew" title="新建">新建</button>
        <button class="tool-btn save-btn" @click="saveFile" title="保存 (Ctrl+S)">保存</button>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <button class="tool-btn" :class="{ active: isBold }" @click="toggleFormat('b')" title="加粗">
          <strong>B</strong>
        </button>
        <button class="tool-btn" :class="{ active: isItalic }" @click="toggleFormat('i')" title="斜体">
          <em>I</em>
        </button>
        <button class="tool-btn" :class="{ active: isUnderline }" @click="toggleFormat('u')" title="下划线">
          <span style="text-decoration: underline">U</span>
        </button>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <button
          class="tool-btn"
          :class="{ active: cellAlign === 'left' }"
          @click="setAlign('left')"
          title="左对齐"
        >
          <span class="align-icon al-left"><i></i><i></i><i></i></span>
        </button>
        <button
          class="tool-btn"
          :class="{ active: cellAlign === 'center' }"
          @click="setAlign('center')"
          title="居中"
        >
          <span class="align-icon al-center"><i></i><i></i><i></i></span>
        </button>
        <button
          class="tool-btn"
          :class="{ active: cellAlign === 'right' }"
          @click="setAlign('right')"
          title="右对齐"
        >
          <span class="align-icon al-right"><i></i><i></i><i></i></span>
        </button>
      </div>
      <div class="tool-sep"></div>
      <div class="tool-group">
        <label class="tool-btn color-wrap" title="背景色">
          <span class="color-preview" :style="{ background: bgColor }"></span>
          <input type="color" class="color-input" v-model="bgColor" @input="applyBgColor" />
        </label>
        <label class="tool-btn color-wrap" title="字体色">
          <span class="color-label">A</span>
          <span class="color-bar" :style="{ background: fontColor }"></span>
          <input type="color" class="color-input" v-model="fontColor" @input="applyFontColor" />
        </label>
      </div>
    </div>

    <div class="formula-bar">
      <div class="cell-ref">{{ cellRef }}</div>
      <div class="fx-label">fx</div>
      <input
        class="fx-input"
        :value="fxDisplay"
        @input="onFxInput"
        @keydown.enter="appRef?.focus()"
      />
    </div>

    <div class="grid-container" ref="gridContainer">
      <table class="grid-table">
        <thead>
          <tr>
            <th class="corner-header"></th>
            <th
              v-for="c in colList"
              :key="c"
              class="col-header"
              :class="{ highlight: selectedCol === c }"
            >
              {{ colName(c) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rowList" :key="r">
            <td class="row-header" :class="{ highlight: selectedRow === r }">{{ r + 1 }}</td>
            <td
              v-for="c in colList"
              :key="c"
              class="cell"
              :class="{ selected: selectedRow === r && selectedCol === c }"
              :style="cellStyle(r, c)"
              @mousedown.prevent="select(r, c)"
              @dblclick="startEdit(r, c)"
            >
              <input
                v-if="editRow === r && editCol === c"
                class="cell-editor"
                v-model="editVal"
                v-focus
                @blur="commitEdit"
                @keydown.enter.prevent="commitEdit(); moveSelect(1, 0)"
                @keydown.tab.prevent="commitEdit(); moveSelect(0, 1)"
                @keydown.escape="cancelEdit"
              />
              <span v-else class="cell-display">{{ getCellValue(r, c) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="sheet-bar">
      <div class="sheet-tabs">
        <div
          v-for="(sheet, idx) in wb.sheets"
          :key="idx"
          class="sheet-tab"
          :class="{ active: sheetIdx === idx }"
          @click="switchSheet(idx)"
          @dblclick="startRename(idx)"
        >
          <input
            v-if="renameIdx === idx"
            class="rename-input"
            v-model="renameVal"
            v-focus
            @blur="finishRename"
            @keydown.enter="finishRename"
            @keydown.escape="cancelRename"
          />
          <span v-else>{{ sheet.name }}</span>
          <span
            v-if="wb.sheets.length > 1 && renameIdx !== idx"
            class="close-tab"
            @click.stop="removeSheet(idx)"
          >&times;</span>
        </div>
      </div>
      <button class="add-sheet-btn" @click="addSheet" title="新建工作表">+</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, reactive, computed, onMounted, nextTick } from 'vue';
import { System, BrowserWindow, Notify, join } from 'vtron';

const vFocus = {
  mounted: (el: HTMLInputElement) => {
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  },
};

interface CellData {
  v: string;
  b?: boolean;
  i?: boolean;
  u?: boolean;
  a?: 'left' | 'center' | 'right';
  bg?: string;
  fc?: string;
}

interface Sheet {
  name: string;
  cells: Record<string, CellData>;
}

interface Workbook {
  sheets: Sheet[];
}

const ROW_COUNT = 50;
const COL_COUNT = 26;
const rowList = Array.from({ length: ROW_COUNT }, (_, i) => i);
const colList = Array.from({ length: COL_COUNT }, (_, i) => i);

const sys = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');

const appRef = ref<HTMLElement | null>(null);
const gridContainer = ref<HTMLElement | null>(null);

const wb = reactive<Workbook>({
  sheets: [{ name: 'Sheet1', cells: {} }],
});
const sheetIdx = ref(0);
const selectedRow = ref(0);
const selectedCol = ref(0);
const editRow = ref(-1);
const editCol = ref(-1);
const editVal = ref('');
const filePath = ref('');
const renameIdx = ref(-1);
const renameVal = ref('');
const bgColor = ref('#ffffff');
const fontColor = ref('#000000');

const activeSheet = computed(() => wb.sheets[sheetIdx.value]);

const cellRef = computed(() => colName(selectedCol.value) + (selectedRow.value + 1));

const fxDisplay = computed(() => {
  const cell = getCell(selectedRow.value, selectedCol.value);
  return cell?.v ?? '';
});

const isBold = computed(() => getCell(selectedRow.value, selectedCol.value)?.b ?? false);
const isItalic = computed(() => getCell(selectedRow.value, selectedCol.value)?.i ?? false);
const isUnderline = computed(() => getCell(selectedRow.value, selectedCol.value)?.u ?? false);
const cellAlign = computed(() => getCell(selectedRow.value, selectedCol.value)?.a ?? '');

function colName(idx: number): string {
  let name = '';
  let n = idx;
  while (n >= 0) {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  }
  return name;
}

function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

function getCell(r: number, c: number): CellData | undefined {
  return activeSheet.value.cells[cellKey(r, c)];
}

function setCell(r: number, c: number, data: Partial<CellData>) {
  const key = cellKey(r, c);
  const existing = activeSheet.value.cells[key];
  if (existing) {
    Object.assign(existing, data);
  } else {
    activeSheet.value.cells[key] = { v: '', ...data };
  }
}

function getCellValue(r: number, c: number): string {
  return getCell(r, c)?.v ?? '';
}

function cellStyle(r: number, c: number): Record<string, string> {
  const cell = getCell(r, c);
  if (!cell) return {};
  const s: Record<string, string> = {};
  if (cell.b) s.fontWeight = 'bold';
  if (cell.i) s.fontStyle = 'italic';
  if (cell.u) s.textDecoration = 'underline';
  if (cell.a) s.textAlign = cell.a;
  if (cell.bg) s.backgroundColor = cell.bg;
  if (cell.fc) s.color = cell.fc;
  return s;
}

function select(r: number, c: number) {
  if (editRow.value >= 0) commitEdit();
  selectedRow.value = r;
  selectedCol.value = c;
  appRef.value?.focus();
}

function moveSelect(dr: number, dc: number) {
  const newR = Math.max(0, Math.min(ROW_COUNT - 1, selectedRow.value + dr));
  const newC = Math.max(0, Math.min(COL_COUNT - 1, selectedCol.value + dc));
  selectedRow.value = newR;
  selectedCol.value = newC;
  scrollIntoView(newR, newC);
}

function scrollIntoView(r: number, c: number) {
  nextTick(() => {
    const row = gridContainer.value?.querySelector(`tbody tr:nth-child(${r + 1})`);
    const cell = row?.querySelector(`td:nth-child(${c + 2})`) as HTMLElement;
    cell?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
}

function startEdit(r: number, c: number, initialValue?: string) {
  editRow.value = r;
  editCol.value = c;
  editVal.value = initialValue !== undefined ? initialValue : getCellValue(r, c);
}

function commitEdit() {
  if (editRow.value < 0) return;
  const val = editVal.value;
  if (val || getCell(editRow.value, editCol.value)) {
    setCell(editRow.value, editCol.value, { v: val });
  }
  editRow.value = -1;
  editCol.value = -1;
  nextTick(() => appRef.value?.focus());
}

function cancelEdit() {
  editRow.value = -1;
  editCol.value = -1;
  nextTick(() => appRef.value?.focus());
}

function toggleFormat(prop: 'b' | 'i' | 'u') {
  const cell = getCell(selectedRow.value, selectedCol.value);
  const current = cell?.[prop] ?? false;
  setCell(selectedRow.value, selectedCol.value, { [prop]: !current });
}

function setAlign(align: 'left' | 'center' | 'right') {
  setCell(selectedRow.value, selectedCol.value, { a: align });
}

function applyBgColor() {
  setCell(selectedRow.value, selectedCol.value, { bg: bgColor.value });
}

function applyFontColor() {
  setCell(selectedRow.value, selectedCol.value, { fc: fontColor.value });
}

function onFxInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  setCell(selectedRow.value, selectedCol.value, { v: val });
}

function switchSheet(idx: number) {
  if (editRow.value >= 0) commitEdit();
  sheetIdx.value = idx;
}

function addSheet() {
  const num = wb.sheets.length + 1;
  wb.sheets.push({ name: `Sheet${num}`, cells: {} });
  sheetIdx.value = wb.sheets.length - 1;
}

function removeSheet(idx: number) {
  if (wb.sheets.length <= 1) return;
  wb.sheets.splice(idx, 1);
  if (sheetIdx.value >= wb.sheets.length) {
    sheetIdx.value = wb.sheets.length - 1;
  }
}

function startRename(idx: number) {
  renameIdx.value = idx;
  renameVal.value = wb.sheets[idx].name;
}

function finishRename() {
  if (renameIdx.value >= 0 && renameVal.value.trim()) {
    wb.sheets[renameIdx.value].name = renameVal.value.trim();
  }
  renameIdx.value = -1;
}

function cancelRename() {
  renameIdx.value = -1;
}

function createNew() {
  wb.sheets = [{ name: 'Sheet1', cells: {} }];
  sheetIdx.value = 0;
  selectedRow.value = 0;
  selectedCol.value = 0;
  editRow.value = -1;
  editCol.value = -1;
  filePath.value = '';
}

async function saveFile() {
  const data = JSON.stringify({ sheets: wb.sheets });
  let path = filePath.value || win?.config?.path;

  if (!path) {
    const desktopPath = join(sys._options.userLocation || '/C/Users', 'Desktop');
    path = join(desktopPath, '新建表格.vtxls');
    let counter = 1;
    while (await sys.fs.exists(path)) {
      path = join(desktopPath, `新建表格 (${counter}).vtxls`);
      counter++;
    }
  }

  try {
    await sys.fs.writeFile(path, data);
    filePath.value = path;
    new Notify({ title: '保存成功', content: `已保存到 ${path}` });
  } catch {
    new Notify({ title: '保存失败', content: '文件保存出错' });
  }
}

async function loadFile(path: string) {
  try {
    const content = await sys.fs.readFile(path);
    if (content) {
      const data = JSON.parse(content);
      wb.sheets = data.sheets || [{ name: 'Sheet1', cells: {} }];
      sheetIdx.value = 0;
      filePath.value = path;
    }
  } catch {
    new Notify({ title: '打开失败', content: '文件格式不正确' });
  }
}

function onKeyDown(e: KeyboardEvent) {
  const mod = e.ctrlKey || e.metaKey;

  if (mod && e.key === 's') {
    e.preventDefault();
    saveFile();
    return;
  }
  if (mod && e.key === 'b') {
    e.preventDefault();
    toggleFormat('b');
    return;
  }
  if (mod && e.key === 'i') {
    e.preventDefault();
    toggleFormat('i');
    return;
  }
  if (mod && e.key === 'u') {
    e.preventDefault();
    toggleFormat('u');
    return;
  }

  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT') return;

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      moveSelect(-1, 0);
      break;
    case 'ArrowDown':
      e.preventDefault();
      moveSelect(1, 0);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      moveSelect(0, -1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      moveSelect(0, 1);
      break;
    case 'Tab':
      e.preventDefault();
      moveSelect(0, e.shiftKey ? -1 : 1);
      break;
    case 'Enter':
      e.preventDefault();
      startEdit(selectedRow.value, selectedCol.value);
      break;
    case 'Delete':
    case 'Backspace': {
      e.preventDefault();
      const key = cellKey(selectedRow.value, selectedCol.value);
      delete activeSheet.value.cells[key];
      break;
    }
    default:
      if (e.key.length === 1 && !mod) {
        e.preventDefault();
        startEdit(selectedRow.value, selectedCol.value, e.key);
      }
  }
}

onMounted(() => {
  appRef.value?.focus();
  if (win?.config?.path) {
    loadFile(win.config.path);
  }
});
</script>

<style scoped>
.excel-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  background: #fff;
  outline: none;
  overflow: hidden;
  user-select: none;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background: #f3f3f3;
  border-bottom: 1px solid #e0e0e0;
  gap: 4px;
  flex-shrink: 0;
}

.tool-group {
  display: flex;
  gap: 2px;
}

.tool-btn {
  padding: 4px 10px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: #333;
  line-height: 1.4;
  transition: background 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
}

.tool-btn:hover {
  background: #e0e0e0;
  border-color: #ccc;
}

.tool-btn.active {
  background: #d3e3fd;
  border-color: #a8c7fa;
}

.save-btn {
  background: #e8f0fe;
  color: #1a73e8;
}

.save-btn:hover {
  background: #d3e3fd;
}

.tool-sep {
  width: 1px;
  height: 20px;
  background: #d0d0d0;
  margin: 0 4px;
  flex-shrink: 0;
}

.align-icon {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 14px;
}

.align-icon i {
  height: 2px;
  background: #555;
  border-radius: 1px;
  font-style: normal;
}

.al-left i:nth-child(1) { width: 100%; }
.al-left i:nth-child(2) { width: 65%; }
.al-left i:nth-child(3) { width: 80%; }

.al-center {
  align-items: center;
}
.al-center i:nth-child(1) { width: 100%; }
.al-center i:nth-child(2) { width: 65%; }
.al-center i:nth-child(3) { width: 80%; }

.al-right {
  align-items: flex-end;
}
.al-right i:nth-child(1) { width: 100%; }
.al-right i:nth-child(2) { width: 65%; }
.al-right i:nth-child(3) { width: 80%; }

.color-wrap {
  position: relative;
  cursor: pointer;
  padding: 4px 6px;
  gap: 0;
  flex-direction: column;
}

.color-preview {
  width: 14px;
  height: 10px;
  border: 1px solid #bbb;
  border-radius: 2px;
}

.color-label {
  font-weight: 700;
  font-size: 13px;
  line-height: 1;
}

.color-bar {
  width: 14px;
  height: 3px;
  border-radius: 1px;
}

.color-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.formula-bar {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
  flex-shrink: 0;
  height: 28px;
}

.cell-ref {
  width: 60px;
  padding: 0 8px;
  text-align: center;
  font-weight: 600;
  border-right: 1px solid #e0e0e0;
  color: #333;
  font-size: 12px;
  line-height: 28px;
}

.fx-label {
  padding: 0 8px;
  color: #888;
  font-style: italic;
  border-right: 1px solid #e0e0e0;
  font-size: 12px;
  line-height: 28px;
}

.fx-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0 8px;
  font-size: 12px;
  font-family: inherit;
  height: 100%;
}

.grid-container {
  flex: 1;
  overflow: auto;
  position: relative;
}

.grid-table {
  border-collapse: collapse;
  table-layout: fixed;
}

.corner-header {
  width: 40px;
  min-width: 40px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  position: sticky;
  top: 0;
  left: 0;
  z-index: 3;
}

.col-header {
  width: 80px;
  min-width: 80px;
  padding: 3px 4px;
  text-align: center;
  background: #f8f9fa;
  border: 1px solid #ddd;
  font-weight: 500;
  color: #666;
  font-size: 11px;
  position: sticky;
  top: 0;
  z-index: 2;
}

.col-header.highlight {
  background: #d3e3fd;
  color: #1a73e8;
}

.row-header {
  width: 40px;
  min-width: 40px;
  padding: 2px 4px;
  text-align: center;
  background: #f8f9fa;
  border: 1px solid #ddd;
  font-weight: 500;
  color: #666;
  font-size: 11px;
  position: sticky;
  left: 0;
  z-index: 1;
}

.row-header.highlight {
  background: #d3e3fd;
  color: #1a73e8;
}

.cell {
  border: 1px solid #e8e8e8;
  padding: 0;
  height: 24px;
  position: relative;
  cursor: cell;
  background: #fff;
}

.cell:hover {
  background: #f0f7ff;
}

.cell.selected {
  outline: 2px solid #1a73e8;
  outline-offset: -1px;
  z-index: 1;
}

.cell-display {
  display: block;
  padding: 2px 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 20px;
  font-size: 12px;
}

.cell-editor {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 2px 4px;
  font-size: 12px;
  font-family: inherit;
  background: #fff;
  box-sizing: border-box;
}

.sheet-bar {
  display: flex;
  align-items: center;
  background: #f3f3f3;
  border-top: 1px solid #e0e0e0;
  padding: 0 4px;
  flex-shrink: 0;
  min-height: 30px;
}

.sheet-tabs {
  display: flex;
  overflow-x: auto;
  flex: 1;
  gap: 0;
}

.sheet-tab {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  cursor: pointer;
  border: 1px solid transparent;
  border-bottom: none;
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  transition: background 0.15s;
  gap: 6px;
}

.sheet-tab:hover {
  background: #e8e8e8;
}

.sheet-tab.active {
  background: #fff;
  border-color: #e0e0e0;
  border-bottom: 2px solid #1a73e8;
  color: #1a73e8;
  font-weight: 500;
}

.close-tab {
  font-size: 14px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.close-tab:hover {
  color: #e53935;
}

.rename-input {
  width: 60px;
  border: 1px solid #1a73e8;
  border-radius: 2px;
  outline: none;
  padding: 1px 4px;
  font-size: 12px;
}

.add-sheet-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-sheet-btn:hover {
  background: #e0e0e0;
}
</style>

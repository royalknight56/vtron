<template>
  <div
    ref="appRef"
    class="excel-app office-window"
    tabindex="0"
    @keydown="onKeyDown"
    @copy="onCopy"
    @cut="onCut"
    @paste="onPaste"
  >
    <OfficeTitlebar class="office-title" @close="closeWindow">
      <span class="app-icon" aria-hidden="true">X</span>
      <input v-model="documentName" class="document-name" aria-label="工作簿名称" @change="renameDocument" />
      <span class="save-state" role="status">{{
        dirty ? '未保存' : filePath ? '已保存' : '新建工作簿'
      }}</span>
      <div class="quick-actions">
        <button title="保存 Ctrl+S" aria-label="保存" @click="saveFile()">
          <svg viewBox="0 0 20 20"><path d="M3 2h12l3 3v13H2V2h1Zm2 0v6h9V2M5 18v-7h10v7M11 3v3" /></svg>
        </button>
        <button title="撤销 Ctrl+Z" aria-label="撤销" :disabled="!undoStack.length" @click="undo">↶</button>
        <button title="重做 Ctrl+Y" aria-label="重做" :disabled="!redoStack.length" @click="redo">↷</button>
      </div>
    </OfficeTitlebar>
    <nav class="ribbon-tabs" role="tablist" aria-label="Excel 功能区">
      <button
        v-for="item in tabs"
        :key="item.id"
        :class="{ active: tab === item.id, 'file-tab': item.id === 'file' }"
        role="tab"
        :aria-selected="tab === item.id"
        @click="tab = item.id"
      >
        {{ item.label }}
      </button>
    </nav>
    <section v-if="tab !== 'file'" class="ribbon" aria-label="功能区命令">
      <template v-if="tab === 'home'">
        <div class="ribbon-group clipboard-group">
          <div class="group-controls">
            <button class="large-tool" @click="pasteClipboard">
              <span class="large-symbol">▣</span>粘贴
            </button>
            <div class="stack">
              <button @click="copySelection(true)">剪切</button><button @click="copySelection()">复制</button
              ><button @click="clearValues">清除内容</button>
            </div>
          </div>
          <small>剪贴板</small>
        </div>
        <div class="ribbon-group">
          <div class="group-controls font-controls">
            <select
              :value="currentCell.ff || '等线'"
              aria-label="字体"
              @change="format({ ff: eventValue($event) })"
            >
              <option>等线</option>
              <option>微软雅黑</option>
              <option>宋体</option>
              <option>Arial</option>
              <option>Calibri</option></select
            ><select
              :value="currentCell.fs || 11"
              aria-label="字号"
              @change="format({ fs: +eventValue($event) })"
            >
              <option v-for="size in [9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36]" :key="size">
                {{ size }}
              </option>
            </select>
            <div class="format-row">
              <button
                :class="{ pressed: currentCell.b }"
                title="加粗 Ctrl+B"
                @click="format({ b: !currentCell.b })"
              >
                <b>B</b></button
              ><button
                :class="{ pressed: currentCell.i }"
                title="斜体 Ctrl+I"
                @click="format({ i: !currentCell.i })"
              >
                <i>I</i></button
              ><button
                :class="{ pressed: currentCell.u }"
                title="下划线 Ctrl+U"
                @click="format({ u: !currentCell.u })"
              >
                <u>U</u></button
              ><label class="color-tool" title="填充颜色"
                ><span :style="{ backgroundColor: currentCell.bg || '#ffff00' }">▰</span
                ><input
                  type="color"
                  aria-label="填充颜色"
                  :value="currentCell.bg || '#ffff00'"
                  @input="format({ bg: eventValue($event) })" /></label
              ><label class="color-tool" title="字体颜色"
                ><span :style="{ borderBottomColor: currentCell.fc || '#c00000' }">A</span
                ><input
                  type="color"
                  aria-label="字体颜色"
                  :value="currentCell.fc || '#c00000'"
                  @input="format({ fc: eventValue($event) })" /></label
              ><button
                :class="{ pressed: currentCell.border }"
                title="所有边框"
                @click="format({ border: !currentCell.border })"
              >
                ▦
              </button>
            </div>
          </div>
          <small>字体</small>
        </div>
        <div class="ribbon-group">
          <div class="group-controls stack">
            <div class="format-row">
              <button
                v-for="align in alignments"
                :key="align.id"
                :class="{ pressed: currentCell.a === align.id }"
                :title="align.label"
                @click="format({ a: align.id })"
              >
                <svg viewBox="0 0 20 20"><path :d="align.path" /></svg></button
              ><button :class="{ pressed: currentCell.wrap }" @click="format({ wrap: !currentCell.wrap })">
                自动换行
              </button>
            </div>
            <button :class="{ pressed: !!currentMerge }" @click="mergeSelection">
              {{ currentMerge ? '取消合并' : '合并居中' }}
            </button>
          </div>
          <small>对齐方式</small>
        </div>
        <div class="ribbon-group">
          <div class="group-controls stack">
            <select
              :value="currentCell.fmt || 'general'"
              aria-label="数字格式"
              @change="format({ fmt: eventValue($event) as CellData['fmt'] })"
            >
              <option value="general">常规</option>
              <option value="number">数值</option>
              <option value="currency">货币</option>
              <option value="percent">百分比</option>
              <option value="date">日期</option>
            </select>
            <div class="format-row">
              <button title="货币格式" @click="format({ fmt: 'currency' })">¥</button
              ><button title="百分比格式" @click="format({ fmt: 'percent' })">%</button
              ><button title="千位分隔数值" @click="format({ fmt: 'number' })">,</button>
            </div>
          </div>
          <small>数字</small>
        </div>
        <div class="ribbon-group">
          <div class="group-controls stack">
            <button @click="autoSum">∑ 自动求和</button><button @click="openFind">查找与替换</button
            ><button @click="sortSelection(false)">升序排列</button>
          </div>
          <small>编辑</small>
        </div>
      </template>
      <template v-else-if="tab === 'insert'">
        <div class="ribbon-group">
          <div class="group-controls">
            <button class="large-tool" @click="insertDimension('row', false)">
              <span class="large-symbol">⊞</span>插入行</button
            ><button class="large-tool" @click="insertDimension('col', false)">
              <span class="large-symbol">⊞</span>插入列</button
            ><button class="large-tool" @click="insertDimension('row', true)">
              <span class="large-symbol">⊟</span>删除行</button
            ><button class="large-tool" @click="insertDimension('col', true)">
              <span class="large-symbol">⊟</span>删除列
            </button>
          </div>
          <small>单元格</small>
        </div>
        <div class="ribbon-group">
          <div class="group-controls">
            <button class="large-tool" @click="applyTable">
              <span class="large-symbol">▦</span>套用表格样式</button
            ><button class="large-tool" @click="mergeSelection">
              <span class="large-symbol">▤</span>合并单元格
            </button>
          </div>
          <small>表格</small>
        </div>
        <div class="ribbon-group">
          <div class="group-controls">
            <button class="large-tool" @click="addSheet"><span class="large-symbol">⊕</span>工作表</button
            ><button class="large-tool" @click="duplicateSheet">
              <span class="large-symbol">▱</span>复制工作表
            </button>
          </div>
          <small>工作表</small>
        </div>
      </template>
      <template v-else-if="tab === 'formulas'">
        <div class="ribbon-group">
          <div class="group-controls">
            <button class="large-tool" @click="autoSum"><span class="large-symbol">∑</span>自动求和</button>
            <div class="stack">
              <button v-for="name in ['SUM', 'AVERAGE', 'COUNT']" :key="name" @click="insertFunction(name)">
                {{ name === 'SUM' ? '求和' : name === 'AVERAGE' ? '平均值' : '计数' }}
              </button>
            </div>
            <div class="stack">
              <button v-for="name in ['MIN', 'MAX', 'IF']" :key="name" @click="insertFunction(name)">
                {{ name === 'MIN' ? '最小值' : name === 'MAX' ? '最大值' : '条件判断' }}
              </button>
            </div>
          </div>
          <small>函数库</small>
        </div>
        <div class="ribbon-group">
          <div class="group-controls stack">
            <label><input v-model="showFormulas" type="checkbox" />显示公式</label
            ><button @click="formulaHelp = !formulaHelp">
              {{ formulaHelp ? '收起函数说明' : '函数说明' }}
            </button>
          </div>
          <small>公式审核</small>
        </div>
        <p v-if="formulaHelp" class="function-help">
          支持
          SUM、AVERAGE、MIN、MAX、COUNT、COUNTA、IF、IFERROR、ROUND、ABS、AND、OR、NOT、LEN、CONCAT、UPPER、LOWER。<br />示例：=SUM(A1:A5)　=IF(B2&gt;=60,"及格","待改进")　='Sheet
          2'!A1
        </p>
      </template>
      <template v-else-if="tab === 'data'">
        <div class="ribbon-group">
          <div class="group-controls">
            <button class="large-tool" @click="sortSelection(false)">
              <span class="large-symbol">A↓</span>升序</button
            ><button class="large-tool" @click="sortSelection(true)">
              <span class="large-symbol">Z↓</span>降序</button
            ><button
              class="large-tool"
              :class="{ pressed: filterEnabled }"
              @click="filterEnabled = !filterEnabled"
            >
              <span class="large-symbol">▽</span>筛选</button
            ><button class="large-tool" @click="filters = {}">
              <span class="large-symbol">×</span>清除筛选
            </button>
          </div>
          <small>排序与筛选</small>
        </div>
        <div class="ribbon-group">
          <div class="group-controls stack">
            <label><input v-model="hasHeaders" type="checkbox" />首行为标题</label>
          </div>
          <small>数据区域</small>
        </div>
        <div class="ribbon-group">
          <div class="group-controls">
            <button class="large-tool" @click="removeDuplicates">
              <span class="large-symbol">≠</span>删除重复行</button
            ><button class="large-tool" @click="openFind">
              <span class="large-symbol">⌕</span>查找与替换
            </button>
          </div>
          <small>数据工具</small>
        </div>
        <div class="ribbon-group">
          <div class="group-controls">
            <button class="large-tool" @click="importRef?.click()">
              <span class="large-symbol">↓</span>导入文件</button
            ><button class="large-tool" @click="download('csv')">
              <span class="large-symbol">↑</span>导出 CSV
            </button>
          </div>
          <small>导入与导出</small>
        </div>
      </template>
      <template v-else-if="tab === 'view'">
        <div class="ribbon-group">
          <div class="group-controls stack">
            <label><input v-model="gridLines" type="checkbox" />网格线</label
            ><label><input v-model="freezeRow" type="checkbox" />冻结首行</label
            ><label><input v-model="showFormulas" type="checkbox" />显示公式</label>
          </div>
          <small>显示</small>
        </div>
        <div class="ribbon-group">
          <div class="group-controls stack">
            <button @click="zoom = 100">100%</button><button @click="askSize('width')">设置列宽</button
            ><button @click="askSize('height')">设置行高</button>
          </div>
          <small>单元格大小</small>
        </div>
        <div class="ribbon-group">
          <div class="group-controls stack">
            <button @click="rowCount = Math.min(10000, rowCount + 100)">增加 100 行</button
            ><button @click="colCount = Math.min(256, colCount + 10)">增加 10 列</button
            ><button @click="printSheet">打印</button>
          </div>
          <small>工作区</small>
        </div>
      </template>
    </section>
    <section v-if="tab === 'file'" class="file-panel">
      <div class="file-actions">
        <h2>工作簿</h2>
        <button @click="createNew">新建</button><button @click="openVirtual">从桌面打开</button
        ><button @click="importRef?.click()">从本机导入</button><button @click="saveFile()">保存</button
        ><button @click="saveFile(true)">另存为</button><button @click="download('xlsx')">下载 .xlsx</button
        ><button @click="download('csv')">下载 .csv</button
        ><button @click="download('vtxls')">下载 .vtxls</button><button @click="printSheet">打印</button>
      </div>
      <div class="file-details">
        <h1>{{ documentName || '新建工作簿' }}</h1>
        <p>{{ filePath || '尚未保存到桌面' }}</p>
        <p>{{ wb.sheets.length }} 张工作表 · {{ populatedCells }} 个单元格</p>
        <p v-if="importWarning" class="import-warning">{{ importWarning }}</p>
        <button class="primary" @click="tab = 'home'">返回编辑</button>
      </div>
    </section>
    <template v-else>
      <div class="formula-bar">
        <input
          v-model="nameBox"
          class="name-box"
          aria-label="名称框"
          @keydown.enter.prevent="goToAddress"
          @blur="nameBox = selectionAddress"
        /><span class="formula-divider"></span
        ><button title="取消编辑" aria-label="取消编辑" @pointerdown.prevent="cancelEdit">×</button
        ><button title="确认输入" aria-label="确认输入" @click="commitFormula">✓</button
        ><span class="fx-symbol">ƒx</span
        ><input
          ref="formulaRef"
          v-model="formulaValue"
          class="formula-input"
          aria-label="公式栏"
          @focus="formulaFocused = true"
          @blur="commitFormula"
          @keydown.enter.prevent="
            commitFormula();
            focusGrid();
          "
          @keydown.escape.prevent="
            formulaValue = currentCell.v;
            formulaFocused = false;
            focusGrid();
          "
        />
      </div>
      <div v-if="notice" class="inline-notice" role="status">
        {{ notice }}<button aria-label="关闭提示" @click="notice = ''">×</button>
      </div>
      <div
        ref="gridContainer"
        class="grid-container"
        :class="{ 'hide-grid': !gridLines, 'freeze-row': freezeRow }"
        @pointerup="selecting = false"
        @pointerleave="selecting = false"
      >
        <table
          class="grid-table"
          :style="{ zoom: `${zoom}%` }"
          aria-label="电子表格"
          role="grid"
          :aria-rowcount="rowCount"
          :aria-colcount="colCount"
        >
          <colgroup>
            <col style="width: 44px" />
            <col v-for="c in colList" :key="c" :style="{ width: `${columnWidth(c)}px` }" />
          </colgroup>
          <thead>
            <tr>
              <th class="corner-header" title="全选" @click="selectAll">◢</th>
              <th
                v-for="c in colList"
                :key="c"
                class="col-header"
                :class="{ highlight: c >= range.c && c <= range.ec }"
                @click="selectColumn(c, $event.shiftKey)"
              >
                {{ colName(c)
                }}<span
                  class="resize-handle"
                  title="拖动调整列宽"
                  @pointerdown.stop.prevent="startResize($event, c)"
                ></span>
              </th>
            </tr>
            <tr v-if="filterEnabled" class="filter-row">
              <th></th>
              <th v-for="c in colList" :key="c">
                <input v-model="filters[c]" :aria-label="`筛选 ${colName(c)} 列`" placeholder="筛选" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in rowList"
              :key="r"
              :class="{ 'first-data-row': r === 0 }"
              :style="{ height: `${activeSheet.heights?.[r] || 27}px` }"
            >
              <th
                class="row-header"
                :class="{ highlight: r >= range.r && r <= range.er }"
                @click="selectRow(r, $event.shiftKey)"
              >
                {{ r + 1 }}
              </th>
              <template v-for="c in colList" :key="c"
                ><td
                  v-if="!hiddenMerged(r, c)"
                  :data-address="address(r, c)"
                  class="cell"
                  :class="{
                    selected: selectedRow === r && selectedCol === c,
                    'in-range': inRange(r, c),
                    'error-cell': isError(r, c),
                  }"
                  :style="cellStyle(r, c)"
                  :rowspan="mergeAt(r, c)?.er !== undefined ? mergeAt(r, c)!.er - r + 1 : 1"
                  :colspan="mergeAt(r, c)?.ec !== undefined ? mergeAt(r, c)!.ec - c + 1 : 1"
                  role="gridcell"
                  :aria-selected="inRange(r, c)"
                  @pointerdown.prevent="selectCell(r, c, $event.shiftKey)"
                  @pointerenter="extendSelection(r, c)"
                  @dblclick="startEdit(r, c)"
                >
                  <input
                    v-if="editRow === r && editCol === c"
                    ref="cellEditorRef"
                    v-model="editValue"
                    class="cell-editor"
                    aria-label="编辑单元格"
                    @pointerdown.stop
                    @blur="commitEdit"
                    @keydown="onEditKey"
                  /><span v-else class="cell-display">{{ displayValue(r, c) }}</span>
                </td></template
              >
            </tr>
          </tbody>
        </table>
      </div>
      <div class="sheet-bar">
        <button
          title="上一张工作表"
          aria-label="上一张工作表"
          :disabled="sheetIdx === 0"
          @click="switchSheet(sheetIdx - 1)"
        >
          ‹</button
        ><button
          title="下一张工作表"
          aria-label="下一张工作表"
          :disabled="sheetIdx === wb.sheets.length - 1"
          @click="switchSheet(sheetIdx + 1)"
        >
          ›
        </button>
        <div class="sheet-tabs" role="tablist" aria-label="工作表">
          <button
            v-for="(sheet, index) in wb.sheets"
            :key="index"
            class="sheet-tab"
            :class="{ active: sheetIdx === index }"
            role="tab"
            :aria-selected="sheetIdx === index"
            @click="switchSheet(index)"
            @dblclick="renameSheet(index)"
          >
            {{ sheet.name }}
          </button>
        </div>
        <button class="add-sheet" title="新建工作表" aria-label="新建工作表" @click="addSheet">+</button
        ><button title="重命名当前工作表" @click="renameSheet(sheetIdx)">重命名</button
        ><button title="删除当前工作表" :disabled="wb.sheets.length === 1" @click="removeSheet">删除</button>
      </div>
      <footer class="status-bar">
        <span>{{ editRow >= 0 ? '输入' : '就绪' }}</span
        ><span class="selection-stats">{{ selectionStats }}</span
        ><span class="zoom-controls"
          ><button aria-label="缩小" @click="zoom = Math.max(60, zoom - 10)">−</button
          ><input
            v-model.number="zoom"
            type="range"
            min="60"
            max="150"
            step="10"
            aria-label="缩放比例"
          /><button aria-label="放大" @click="zoom = Math.min(150, zoom + 10)">+</button
          ><button @click="zoom = 100">{{ zoom }}%</button></span
        >
      </footer>
    </template>
    <input
      ref="importRef"
      type="file"
      accept=".vtxls,.json,.xlsx,.csv,.tsv,.txt"
      hidden
      @change="importFile"
    />
    <div v-if="dialog" class="modal-backdrop" @keydown.esc.stop="closeDialog">
      <form
        class="office-dialog"
        role="dialog"
        aria-modal="true"
        :aria-label="dialog.title"
        @submit.prevent="submitDialog"
      >
        <div class="dialog-heading">
          <h2>{{ dialog.title }}</h2>
          <button type="button" aria-label="关闭" @click="closeDialog">×</button>
        </div>
        <template v-if="dialog.kind === 'confirm'"
          ><p>{{ dialog.message }}</p>
          <div class="dialog-actions">
            <button type="button" @click="resolveConfirm('cancel')">取消</button
            ><button type="button" @click="resolveConfirm('discard')">不保存</button
            ><button type="button" class="primary" @click="resolveConfirm('save')">保存</button>
          </div></template
        ><template v-else
          ><label
            >{{ dialog.label
            }}<input
              ref="dialogInputRef"
              v-model="dialog.value"
              :type="dialog.kind === 'width' || dialog.kind === 'height' ? 'number' : 'text'"
              required /></label
          ><label v-if="dialog.kind === 'find'">替换为<input v-model="replaceValue" /></label>
          <div v-if="dialog.kind === 'open'" class="open-file-list">
            <button
              v-for="item in openFiles"
              :key="item.path"
              type="button"
              @click="dialog.value = item.path"
            >
              {{ item.name }}<small>{{ item.path }}</small>
            </button>
            <p v-if="!openFiles.length">可以输入桌面中的完整文件路径。</p>
          </div>
          <p v-if="dialogError" class="dialog-error" role="alert">{{ dialogError }}</p>
          <div class="dialog-actions">
            <button type="button" @click="closeDialog">取消</button
            ><button v-if="dialog.kind === 'find'" type="button" @click="replaceAll">全部替换</button
            ><button class="primary" type="submit">
              {{ dialog.kind === 'find' ? '查找下一个' : dialog.kind === 'open' ? '打开' : '确定' }}
            </button>
          </div></template
        >
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { BrowserWindow, join, System } from 'vtron';
import OfficeTitlebar from './office/OfficeTitlebar.vue';
import {
  address,
  cellKey,
  CellData,
  colName,
  formatValue,
  makeEvaluator,
  parseAddress,
  parseDelimited,
  Sheet,
  toDelimited,
  validateWorkbook,
  Workbook,
} from './office/excelModel';
import { decodeDataText, exportXlsx, importXlsx } from './office/excelWorkbook';

const sys = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');
const appRef = ref<HTMLElement>(),
  gridContainer = ref<HTMLElement>(),
  formulaRef = ref<HTMLInputElement>(),
  importRef = ref<HTMLInputElement>(),
  cellEditorRef = ref<HTMLInputElement[]>(),
  dialogInputRef = ref<HTMLInputElement>();
const tabs = [
  { id: 'file', label: '文件' },
  { id: 'home', label: '开始' },
  { id: 'insert', label: '插入' },
  { id: 'formulas', label: '公式' },
  { id: 'data', label: '数据' },
  { id: 'view', label: '视图' },
];
const alignments = [
  { id: 'left' as const, label: '左对齐', path: 'M3 4h14M3 8h9M3 12h14M3 16h9' },
  { id: 'center' as const, label: '居中', path: 'M3 4h14M6 8h8M3 12h14M6 16h8' },
  { id: 'right' as const, label: '右对齐', path: 'M3 4h14M8 8h9M3 12h14M8 16h9' },
];
const tab = ref('home'),
  wb = reactive<Workbook>({ sheets: [{ name: 'Sheet1', cells: {} }] }),
  sheetIdx = ref(0);
const activeSheet = computed(() => wb.sheets[sheetIdx.value]);
const documentName = ref('新建工作簿'),
  filePath = ref(''),
  savedSnapshot = ref(''),
  notice = ref(''),
  importWarning = ref('');
const selectedRow = ref(0),
  selectedCol = ref(0),
  endRow = ref(0),
  endCol = ref(0),
  selecting = ref(false);
const rowCount = ref(100),
  colCount = ref(26),
  editRow = ref(-1),
  editCol = ref(-1),
  editValue = ref('');
const formulaValue = ref(''),
  formulaFocused = ref(false),
  nameBox = ref('A1'),
  zoom = ref(100),
  showFormulas = ref(false),
  formulaHelp = ref(false),
  gridLines = ref(true),
  freezeRow = ref(false),
  filterEnabled = ref(false),
  hasHeaders = ref(true),
  filters = ref<Record<number, string>>({});
const undoStack = ref<string[]>([]),
  redoStack = ref<string[]>([]);
const snapshot = computed(() => JSON.stringify({ sheets: wb.sheets }));
const dirty = computed(() => snapshot.value !== savedSnapshot.value);
const evaluator = computed(() => {
  // The evaluator caches cell results, so invalidate it for every workbook edit, including other sheets and undo.
  snapshot.value;
  return makeEvaluator(wb);
});
const range = computed(() => ({
  r: Math.min(selectedRow.value, endRow.value),
  c: Math.min(selectedCol.value, endCol.value),
  er: Math.max(selectedRow.value, endRow.value),
  ec: Math.max(selectedCol.value, endCol.value),
}));
const selectionAddress = computed(
  () =>
    address(selectedRow.value, selectedCol.value) +
    (selectedRow.value !== endRow.value || selectedCol.value !== endCol.value
      ? `:${address(endRow.value, endCol.value)}`
      : '')
);
const currentCell = computed(
  () => activeSheet.value.cells[cellKey(selectedRow.value, selectedCol.value)] || { v: '' }
);
const currentMerge = computed(() =>
  (activeSheet.value.merges || []).find((m) => m.r === selectedRow.value && m.c === selectedCol.value)
);
const colList = computed(() => Array.from({ length: colCount.value }, (_, i) => i));
const rowList = computed(() =>
  Array.from({ length: rowCount.value }, (_, i) => i).filter(
    (r) =>
      !filterEnabled.value ||
      r === 0 ||
      Object.entries(filters.value).every(
        ([c, word]) =>
          !word ||
          String(evaluator.value(sheetIdx.value, r, +c))
            .toLowerCase()
            .includes(word.toLowerCase())
      )
  )
);
const populatedCells = computed(() =>
  wb.sheets.reduce((sum, sheet) => sum + Object.keys(sheet.cells).length, 0)
);
const selectionStats = computed(() => {
  const values: (string | number | boolean)[] = [];
  for (const [key, cell] of Object.entries(activeSheet.value.cells)) {
    const [r, c] = key.split(',').map(Number);
    if (inRange(r, c) && cell.v !== '') values.push(evaluator.value(sheetIdx.value, r, c));
  }
  const nums = values.filter((v) => typeof v === 'number') as number[];
  return values.length > 1
    ? `计数: ${values.length}${nums.length ? `　平均值: ${formatValue(nums.reduce((a, b) => a + b, 0) / nums.length)}　求和: ${formatValue(nums.reduce((a, b) => a + b, 0))}` : ''}`
    : '';
});
const eventValue = (event: Event) => (event.target as HTMLInputElement).value;
const focusGrid = () => nextTick(() => appRef.value?.focus());
const inRange = (r: number, c: number) =>
  r >= range.value.r && r <= range.value.er && c >= range.value.c && c <= range.value.ec;
const columnWidth = (c: number) => activeSheet.value.widths?.[c] || 100;
const mergeAt = (r: number, c: number) =>
  (activeSheet.value.merges || []).find((m) => m.r === r && m.c === c);
const hiddenMerged = (r: number, c: number) =>
  (activeSheet.value.merges || []).some(
    (m) => r >= m.r && r <= m.er && c >= m.c && c <= m.ec && (r !== m.r || c !== m.c)
  );
const isError = (r: number, c: number) => String(evaluator.value(sheetIdx.value, r, c)).startsWith('#');
function displayValue(r: number, c: number) {
  const cell = activeSheet.value.cells[cellKey(r, c)];
  return showFormulas.value ? cell?.v || '' : formatValue(evaluator.value(sheetIdx.value, r, c), cell?.fmt);
}
function cellStyle(r: number, c: number): Record<string, string> {
  const cell = activeSheet.value.cells[cellKey(r, c)] || { v: '' };
  const numeric = typeof evaluator.value(sheetIdx.value, r, c) === 'number';
  return {
    fontFamily: cell.ff || 'Calibri, 等线, sans-serif',
    fontSize: `${cell.fs || 11}pt`,
    fontWeight: cell.b ? '700' : '400',
    fontStyle: cell.i ? 'italic' : 'normal',
    textDecoration: cell.u ? 'underline' : 'none',
    textAlign: cell.a || (numeric ? 'right' : 'left'),
    backgroundColor: cell.bg || '',
    color: cell.fc || '',
    whiteSpace: cell.wrap ? 'pre-wrap' : 'nowrap',
    boxShadow: cell.border ? 'inset 0 0 0 .5px #808080' : '',
    lineHeight: cell.wrap ? '1.4' : '',
  };
}
function syncFormula() {
  if (!formulaFocused.value) formulaValue.value = currentCell.value.v;
  nameBox.value = selectionAddress.value;
}
watch([selectionAddress, () => currentCell.value.v], syncFormula, { immediate: true });
function history() {
  undoStack.value.push(snapshot.value);
  if (undoStack.value.length > 40) undoStack.value.shift();
  redoStack.value = [];
}
function mutate(fn: () => void) {
  commitEdit();
  history();
  fn();
  syncFormula();
}
function undo() {
  commitEdit();
  const data = undoStack.value.pop();
  if (!data) return;
  redoStack.value.push(snapshot.value);
  restore(data);
}
function redo() {
  const data = redoStack.value.pop();
  if (!data) return;
  undoStack.value.push(snapshot.value);
  restore(data);
}
function restore(data: string) {
  wb.sheets = JSON.parse(data).sheets;
  sheetIdx.value = Math.min(sheetIdx.value, wb.sheets.length - 1);
  formulaFocused.value = false;
  syncFormula();
}
function eachSelected(fn: (r: number, c: number) => void) {
  const { r, c, er, ec } = range.value;
  for (let row = r; row <= er; row++) for (let col = c; col <= ec; col++) fn(row, col);
}
function format(data: Partial<CellData>) {
  mutate(() =>
    eachSelected((r, c) => {
      const key = cellKey(r, c);
      activeSheet.value.cells[key] = { ...(activeSheet.value.cells[key] || { v: '' }), ...data };
    })
  );
  focusGrid();
}
function clearValues() {
  mutate(() =>
    eachSelected((r, c) => {
      const cell = activeSheet.value.cells[cellKey(r, c)];
      if (cell) cell.v = '';
    })
  );
  focusGrid();
}
function selectCell(r: number, c: number, extend = false) {
  commitEdit();
  const merge = (activeSheet.value.merges || []).find((m) => r >= m.r && r <= m.er && c >= m.c && c <= m.ec);
  if (merge) {
    r = merge.r;
    c = merge.c;
  }
  if (!extend) {
    selectedRow.value = r;
    selectedCol.value = c;
  }
  endRow.value = r;
  endCol.value = c;
  selecting.value = true;
  focusGrid();
}
function extendSelection(r: number, c: number) {
  if (selecting.value) {
    endRow.value = r;
    endCol.value = c;
  }
}
function selectRow(r: number, extend = false) {
  commitEdit();
  if (!extend) selectedRow.value = r;
  selectedCol.value = 0;
  endRow.value = r;
  endCol.value = colCount.value - 1;
  focusGrid();
}
function selectColumn(c: number, extend = false) {
  commitEdit();
  if (!extend) selectedCol.value = c;
  selectedRow.value = 0;
  endRow.value = rowCount.value - 1;
  endCol.value = c;
  focusGrid();
}
function selectAll() {
  selectedRow.value = selectedCol.value = 0;
  endRow.value = rowCount.value - 1;
  endCol.value = colCount.value - 1;
  focusGrid();
}
function move(dr: number, dc: number, extend = false) {
  const row = Math.min(9999, Math.max(0, (extend ? endRow.value : selectedRow.value) + dr)),
    col = Math.min(255, Math.max(0, (extend ? endCol.value : selectedCol.value) + dc));
  rowCount.value = Math.max(rowCount.value, row + 1);
  colCount.value = Math.max(colCount.value, col + 1);
  if (!extend) {
    selectedRow.value = row;
    selectedCol.value = col;
  }
  endRow.value = row;
  endCol.value = col;
  nextTick(() =>
    gridContainer.value
      ?.querySelector(`[data-address="${address(row, col)}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  );
}
function goToAddress() {
  const refs = nameBox.value.split(':').map(parseAddress);
  if (!refs[0] || (refs.length > 1 && !refs[1])) {
    notice.value = '请输入有效地址，例如 A1 或 A1:C10';
    syncFormula();
    return;
  }
  selectedRow.value = refs[0].r;
  selectedCol.value = refs[0].c;
  endRow.value = refs[1]?.r ?? refs[0].r;
  endCol.value = refs[1]?.c ?? refs[0].c;
  rowCount.value = Math.max(rowCount.value, range.value.er + 1);
  colCount.value = Math.max(colCount.value, range.value.ec + 1);
  focusGrid();
  nextTick(() =>
    gridContainer.value
      ?.querySelector(`[data-address="${address(selectedRow.value, selectedCol.value)}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  );
}
function startEdit(r: number, c: number, initial?: string) {
  selectCell(r, c);
  selecting.value = false;
  editRow.value = r;
  editCol.value = c;
  editValue.value = initial ?? activeSheet.value.cells[cellKey(r, c)]?.v ?? '';
  nextTick(() => {
    const input = gridContainer.value?.querySelector('.cell-editor') as HTMLInputElement;
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  });
}
function commitEdit() {
  if (editRow.value < 0) return;
  const key = cellKey(editRow.value, editCol.value);
  if ((activeSheet.value.cells[key]?.v || '') !== editValue.value) {
    history();
    activeSheet.value.cells[key] = { ...activeSheet.value.cells[key], v: editValue.value };
  }
  editRow.value = editCol.value = -1;
  syncFormula();
}
function cancelEdit() {
  editRow.value = editCol.value = -1;
  formulaFocused.value = false;
  syncFormula();
  focusGrid();
}
function commitFormula() {
  if (formulaFocused.value && formulaValue.value !== currentCell.value.v) {
    history();
    activeSheet.value.cells[cellKey(selectedRow.value, selectedCol.value)] = {
      ...currentCell.value,
      v: formulaValue.value,
    };
  }
  formulaFocused.value = false;
  syncFormula();
}
function onEditKey(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault();
    e.stopPropagation();
    commitEdit();
    move(e.key === 'Enter' ? (e.shiftKey ? -1 : 1) : 0, e.key === 'Tab' ? (e.shiftKey ? -1 : 1) : 0);
    focusGrid();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    cancelEdit();
  }
}
let internalClipboard: { text: string; cells: CellData[][]; r: number; c: number } | null = null;
function selectedRows() {
  const rows: string[][] = [];
  for (let r = range.value.r; r <= range.value.er; r++) {
    const row: string[] = [];
    for (let c = range.value.c; c <= range.value.ec; c++)
      row.push(activeSheet.value.cells[cellKey(r, c)]?.v || '');
    rows.push(row);
  }
  return rows;
}
function cacheClipboard() {
  commitEdit();
  const rows = selectedRows(),
    cells: CellData[][] = [];
  for (let r = range.value.r; r <= range.value.er; r++) {
    const row: CellData[] = [];
    for (let c = range.value.c; c <= range.value.ec; c++)
      row.push({ ...(activeSheet.value.cells[cellKey(r, c)] || { v: '' }) });
    cells.push(row);
  }
  const text = toDelimited(rows, '\t');
  internalClipboard = { text, cells, r: range.value.r, c: range.value.c };
  return text;
}
function isTextTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)
  );
}
function onCopy(e: ClipboardEvent) {
  if (isTextTarget(e.target)) return;
  e.preventDefault();
  e.clipboardData?.setData('text/plain', cacheClipboard());
}
function onCut(e: ClipboardEvent) {
  if (isTextTarget(e.target)) return;
  onCopy(e);
  clearValues();
}
function onPaste(e: ClipboardEvent) {
  if (isTextTarget(e.target)) return;
  e.preventDefault();
  pasteText(e.clipboardData?.getData('text/plain') || '');
}
async function copySelection(cut = false) {
  try {
    await navigator.clipboard.writeText(cacheClipboard());
    if (cut) clearValues();
    notice.value = cut ? '已剪切选区' : '已复制选区';
  } catch {
    notice.value = '请在网格中使用 Ctrl+C / Ctrl+X 复制或剪切';
  }
  focusGrid();
}
async function pasteClipboard() {
  try {
    pasteText(await navigator.clipboard.readText());
  } catch {
    notice.value = '请在网格中使用 Ctrl+V 粘贴';
  }
  focusGrid();
}
function shiftFormula(value: string, dr: number, dc: number) {
  if (!value.startsWith('=')) return value;
  return rewriteRefs(value, (ref) => {
    const match = /^(\$?)([A-Z]+)(\$?)([1-9]\d*)$/i.exec(ref);
    const coord = parseAddress(ref);
    if (!match || !coord) return ref;
    const r = coord.r + (match[3] ? 0 : dr),
      c = coord.c + (match[1] ? 0 : dc);
    return r < 0 || c < 0 || r > 9999 || c > 255 ? '#REF!' : `${match[1]}${colName(c)}${match[3]}${r + 1}`;
  });
}
function pasteText(text: string) {
  if (!text) return;
  commitEdit();
  const rows = parseDelimited(text, '\t');
  if (rows.length > 10000 - selectedRow.value || rows.some((row) => row.length > 256 - selectedCol.value)) {
    notice.value = '粘贴内容超出 10000 行、256 列限制';
    return;
  }
  const clip = internalClipboard?.text === text ? internalClipboard : null;
  mutate(() => {
    rows.forEach((row, ri) =>
      row.forEach((v, ci) => {
        const r = selectedRow.value + ri,
          c = selectedCol.value + ci,
          source = clip?.cells[ri]?.[ci];
        activeSheet.value.cells[cellKey(r, c)] = source
          ? { ...source, v: shiftFormula(source.v, selectedRow.value - clip!.r, selectedCol.value - clip!.c) }
          : { ...activeSheet.value.cells[cellKey(r, c)], v };
      })
    );
  });
  endRow.value = selectedRow.value + rows.length - 1;
  endCol.value = selectedCol.value + Math.max(...rows.map((row) => row.length)) - 1;
  rowCount.value = Math.max(rowCount.value, endRow.value + 1);
  colCount.value = Math.max(colCount.value, endCol.value + 1);
  focusGrid();
}
function rewriteRefs(formula: string, fn: (ref: string, qualifier: string) => string) {
  return formula
    .split(/("(?:[^"]|"")*")/g)
    .map((part, i) =>
      i % 2
        ? part
        : part.replace(
            /((?:'(?:[^']|'')+'|[A-Za-z_\u4e00-\u9fff][\w.\u4e00-\u9fff]*)!)?(\$?[A-Za-z]{1,3}\$?[1-9]\d*)(?![\w.])/g,
            (_, qualifier: string | undefined, ref: string) => (qualifier || '') + fn(ref, qualifier || '')
          )
    )
    .join('');
}
async function mergeSelection() {
  const { r, c, er, ec } = range.value;
  if (currentMerge.value) {
    mutate(() => {
      activeSheet.value.merges = (activeSheet.value.merges || []).filter((m) => m !== currentMerge.value);
    });
    return;
  }
  if (r === er && c === ec) return;
  const hasData = Object.entries(activeSheet.value.cells).some(([key, cell]) => {
    const [rr, cc] = key.split(',').map(Number);
    return inRange(rr, cc) && (rr !== r || cc !== c) && cell.v !== '';
  });
  if (hasData) {
    const choice = await confirmAction('合并单元格', '合并会仅保留左上角内容。先保存工作簿可保留当前版本。');
    if (choice === 'cancel' || (choice === 'save' && !(await saveFile()))) return;
  }
  mutate(() => {
    activeSheet.value.merges = (activeSheet.value.merges || []).filter(
      (m) => !(r <= m.er && er >= m.r && c <= m.ec && ec >= m.c)
    );
    eachSelected((rr, cc) => {
      if (rr !== r || cc !== c) delete activeSheet.value.cells[cellKey(rr, cc)];
    });
    activeSheet.value.merges.push({ r, c, er, ec });
    activeSheet.value.cells[cellKey(r, c)] = {
      ...(activeSheet.value.cells[cellKey(r, c)] || { v: '' }),
      a: 'center',
    };
  });
  selectedRow.value = r;
  selectedCol.value = c;
}
function applyTable() {
  mutate(() =>
    eachSelected((r, c) => {
      const key = cellKey(r, c),
        head = r === range.value.r;
      activeSheet.value.cells[key] = {
        ...(activeSheet.value.cells[key] || { v: '' }),
        bg: head ? '#217346' : (r - range.value.r) % 2 ? '#e9f2ec' : '#ffffff',
        fc: head ? '#ffffff' : '#202020',
        b: head,
        border: true,
      };
    })
  );
}
function usedBounds(sheet = activeSheet.value) {
  let er = 0,
    ec = 0;
  for (const key of Object.keys(sheet.cells)) {
    const [r, c] = key.split(',').map(Number);
    er = Math.max(er, r);
    ec = Math.max(ec, c);
  }
  return { er, ec };
}
function dataRange() {
  if (range.value.r !== range.value.er || range.value.c !== range.value.ec) return { ...range.value };
  const bounds = usedBounds();
  return { r: 0, c: 0, ...bounds };
}
function sortSelection(desc: boolean) {
  commitEdit();
  const area = dataRange(),
    col = selectedCol.value,
    rows: Array<{
      cells: Array<CellData | undefined>;
      value: string | number | boolean;
      originalRow: number;
    }> = [];
  if (hasHeaders.value && area.r === 0 && area.er > 0) area.r++;
  for (let r = area.r; r <= area.er; r++)
    rows.push({
      cells: Array.from(
        { length: area.ec - area.c + 1 },
        (_, i) => activeSheet.value.cells[cellKey(r, area.c + i)]
      ),
      value: evaluator.value(sheetIdx.value, r, col),
      originalRow: r,
    });
  rows.sort((a, b) => {
    const cmp =
      typeof a.value === 'number' && typeof b.value === 'number'
        ? a.value - b.value
        : String(a.value).localeCompare(String(b.value), 'zh-CN', { numeric: true });
    return desc ? -cmp : cmp;
  });
  mutate(() => {
    rows.forEach((row, ri) =>
      row.cells.forEach((cell, ci) => {
        const key = cellKey(area.r + ri, area.c + ci);
        if (cell)
          activeSheet.value.cells[key] = {
            ...cell,
            v: shiftFormula(cell.v, area.r + ri - row.originalRow, 0),
          };
        else delete activeSheet.value.cells[key];
      })
    );
    activeSheet.value.merges = (activeSheet.value.merges || []).filter(
      (m) => m.er < area.r || m.r > area.er || m.ec < area.c || m.c > area.ec
    );
  });
  notice.value = '已按当前列排序；多列数据可先选择完整区域';
}
function removeDuplicates() {
  const area = dataRange(),
    seen = new Set<string>(),
    rows: CellData[][] = [];
  let removed = 0;
  for (let r = area.r; r <= area.er; r++) {
    const row = Array.from(
      { length: area.ec - area.c + 1 },
      (_, i) => activeSheet.value.cells[cellKey(r, area.c + i)] || { v: '' }
    );
    const key = JSON.stringify(row.map((cell) => cell.v));
    if (seen.has(key)) removed++;
    else {
      seen.add(key);
      rows.push(row);
    }
  }
  if (!removed) {
    notice.value = '未找到重复行';
    return;
  }
  mutate(() => {
    for (let r = area.r; r <= area.er; r++)
      for (let c = area.c; c <= area.ec; c++) delete activeSheet.value.cells[cellKey(r, c)];
    rows.forEach((row, i) =>
      row.forEach((cell, j) => (activeSheet.value.cells[cellKey(area.r + i, area.c + j)] = { ...cell }))
    );
    activeSheet.value.merges = [];
  });
  notice.value = `已删除 ${removed} 个重复行`;
}
function insertFunction(name: string) {
  const selected = range.value;
  const multiple = selected.r !== selected.er || selected.c !== selected.ec;
  if (multiple && selected.er < 9999) {
    selectedRow.value = endRow.value = selected.er + 1;
    selectedCol.value = endCol.value = selected.c;
    rowCount.value = Math.max(rowCount.value, selected.er + 2);
  }
  formulaValue.value =
    name === 'IF'
      ? '=IF(1>0,"是","否")'
      : multiple
        ? `=${name}(${address(selected.r, selected.c)}:${address(selected.er, selected.ec)})`
        : `=${name}()`;
  formulaFocused.value = true;
  formulaRef.value?.focus();
  if (!multiple && name !== 'IF')
    nextTick(() =>
      formulaRef.value?.setSelectionRange(formulaValue.value.length - 1, formulaValue.value.length - 1)
    );
}
function autoSum() {
  const { r, c, er, ec } = range.value;
  if (r !== er || c !== ec) {
    const target = er + 1;
    if (target > 9999) return;
    const expr = `=SUM(${address(r, c)}:${address(er, c)})`;
    selectedRow.value = endRow.value = target;
    selectedCol.value = endCol.value = c;
    mutate(() => (activeSheet.value.cells[cellKey(target, c)] = { v: expr }));
    rowCount.value = Math.max(rowCount.value, target + 1);
    return;
  }
  let start = r - 1;
  while (start >= 0 && activeSheet.value.cells[cellKey(start, c)]?.v) start--;
  if (start < r - 1) {
    const expr = `=SUM(${address(start + 1, c)}:${address(r - 1, c)})`;
    mutate(() => (activeSheet.value.cells[cellKey(r, c)] = { v: expr }));
  } else {
    formulaValue.value = '=SUM()';
    formulaFocused.value = true;
    formulaRef.value?.focus();
    formulaRef.value?.setSelectionRange(5, 5);
  }
}
function insertDimension(axis: 'row' | 'col', remove: boolean) {
  commitEdit();
  const start = axis === 'row' ? range.value.r : range.value.c,
    end = axis === 'row' ? range.value.er : range.value.ec,
    count = end - start + 1,
    limit = axis === 'row' ? 10000 : 256;
  const affected = activeSheet.value.name;
  if (
    !remove &&
    Object.keys(activeSheet.value.cells).some(
      (key) => +key.split(',')[axis === 'row' ? 0 : 1] >= limit - count
    )
  ) {
    notice.value = '插入后将超出工作表范围';
    return;
  }
  mutate(() => {
    const cells: Record<string, CellData> = {};
    for (const [key, cell] of Object.entries(activeSheet.value.cells)) {
      let [r, c] = key.split(',').map(Number);
      const value = axis === 'row' ? r : c;
      if (remove && value >= start && value <= end) continue;
      const next = value >= start ? (remove ? Math.max(start, value - count) : value + count) : value;
      if (axis === 'row') r = next;
      else c = next;
      cells[cellKey(r, c)] = { ...cell };
    }
    activeSheet.value.cells = cells;
    activeSheet.value.merges = [];
    const sizes = axis === 'row' ? activeSheet.value.heights : activeSheet.value.widths;
    if (sizes) {
      const mapped: Record<number, number> = {};
      for (const [key, size] of Object.entries(sizes)) {
        const i = +key;
        if (remove && i >= start && i <= end) continue;
        mapped[i >= start ? i + (remove ? -count : count) : i] = size;
      }
      if (axis === 'row') activeSheet.value.heights = mapped;
      else activeSheet.value.widths = mapped;
    }
    for (const sheet of wb.sheets)
      for (const cell of Object.values(sheet.cells))
        if (cell.v.startsWith('='))
          cell.v = rewriteRefs(cell.v, (ref, qualifier) => {
            const name = qualifier
              ? qualifier.slice(0, -1).replace(/^'|'$/g, '').replace(/''/g, "'")
              : sheet.name;
            if (name.toLowerCase() !== affected.toLowerCase()) return ref;
            const match = /^(\$?)([A-Z]+)(\$?)([1-9]\d*)$/i.exec(ref),
              coord = parseAddress(ref);
            if (!match || !coord) return ref;
            let value = axis === 'row' ? coord.r : coord.c;
            if (remove && value >= start && value <= end) return '#REF!';
            if (value >= start) value += remove ? -count : count;
            return value < 0 || value >= limit
              ? '#REF!'
              : `${match[1]}${colName(axis === 'col' ? value : coord.c)}${match[3]}${(axis === 'row' ? value : coord.r) + 1}`;
          });
  });
  notice.value = `已${remove ? '删除' : '插入'} ${count} ${axis === 'row' ? '行' : '列'}`;
}
function startResize(event: PointerEvent, c: number) {
  const x = event.clientX,
    width = columnWidth(c);
  let next = width;
  const move = (e: PointerEvent) => {
    next = Math.min(500, Math.max(40, width + ((e.clientX - x) * 100) / zoom.value));
    if (!activeSheet.value.widths) activeSheet.value.widths = {};
    activeSheet.value.widths[c] = next;
  };
  history();
  window.addEventListener('pointermove', move);
  const stop = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', stop);
  };
  window.addEventListener('pointerup', stop);
  resizeCleanup = stop;
}
let resizeCleanup: (() => void) | undefined;
function switchSheet(index: number) {
  commitEdit();
  if (index < 0 || index >= wb.sheets.length) return;
  sheetIdx.value = index;
  selectedRow.value = selectedCol.value = endRow.value = endCol.value = 0;
  filters.value = {};
  expandImportedGrid();
  syncFormula();
  focusGrid();
}
function uniqueSheetName(name = 'Sheet') {
  let n = 1;
  while (wb.sheets.some((s) => s.name.toLowerCase() === `${name}${n}`.toLowerCase())) n++;
  return `${name}${n}`;
}
function addSheet() {
  mutate(() => wb.sheets.push({ name: uniqueSheetName(), cells: {} }));
  switchSheet(wb.sheets.length - 1);
}
function duplicateSheet() {
  const data = JSON.parse(JSON.stringify(activeSheet.value)) as Sheet;
  data.name = uniqueSheetName(activeSheet.value.name.slice(0, 25) + ' 副本');
  mutate(() => wb.sheets.push(data));
  switchSheet(wb.sheets.length - 1);
}
async function removeSheet() {
  if (wb.sheets.length <= 1) return;
  const choice = await confirmAction('删除工作表', `删除“${activeSheet.value.name}”？可用撤销恢复。`);
  if (choice === 'cancel') return;
  if (choice === 'save' && !(await saveFile())) return;
  const index = sheetIdx.value;
  mutate(() => {
    wb.sheets.splice(index, 1);
    sheetIdx.value = Math.min(index, wb.sheets.length - 1);
  });
  switchSheet(sheetIdx.value);
}
function renameSheet(index: number) {
  openDialog({
    kind: 'rename',
    title: '重命名工作表',
    label: '工作表名称',
    value: wb.sheets[index].name,
    index,
  });
}
function renameDocument() {
  documentName.value =
    documentName.value
      .replace(/[\\/:*?"<>|]/g, '')
      .trim()
      .slice(0, 100) || '新建工作簿';
  if (
    filePath.value &&
    filePath.value
      .split('/')
      .pop()!
      .replace(/\.vtxls$/i, '') !== documentName.value
  ) {
    filePath.value = '';
    savedSnapshot.value = '';
  }
}

type DialogState = {
  kind: 'open' | 'save' | 'rename' | 'find' | 'width' | 'height' | 'confirm';
  title: string;
  label?: string;
  value?: string;
  index?: number;
  message?: string;
};
const dialog = ref<DialogState | null>(null),
  dialogError = ref(''),
  replaceValue = ref(''),
  openFiles = ref<Array<{ path: string; name: string }>>([]);
let confirmResolve: ((value: 'cancel' | 'discard' | 'save') => void) | null = null,
  saveResolve: ((value: boolean) => void) | null = null;
function openDialog(value: DialogState) {
  dialog.value = value;
  dialogError.value = '';
  nextTick(() => {
    dialogInputRef.value?.focus();
    dialogInputRef.value?.select();
  });
}
function closeDialog() {
  if (dialog.value?.kind === 'confirm') resolveConfirm('cancel');
  else {
    dialog.value = null;
    saveResolve?.(false);
    saveResolve = null;
    focusGrid();
  }
}
function confirmAction(title: string, message: string) {
  return new Promise<'cancel' | 'discard' | 'save'>((resolve) => {
    confirmResolve = resolve;
    openDialog({ kind: 'confirm', title, message });
  });
}
function resolveConfirm(value: 'cancel' | 'discard' | 'save') {
  dialog.value = null;
  const resolve = confirmResolve;
  confirmResolve = null;
  resolve?.(value);
}
async function mayReplace() {
  commitEdit();
  commitFormula();
  if (!dirty.value) return true;
  const result = await confirmAction('保存工作簿', '当前工作簿有未保存的更改。');
  return result === 'discard' || (result === 'save' && (await saveFile()));
}
async function closeWindow() {
  if (await mayReplace()) win?.close();
}
async function createNew() {
  if (!(await mayReplace())) return;
  removeDraft();
  wb.sheets = [{ name: 'Sheet1', cells: {} }];
  filePath.value = '';
  draftScope.value = 'new';
  documentName.value = '新建工作簿';
  sheetIdx.value = 0;
  undoStack.value = [];
  redoStack.value = [];
  savedSnapshot.value = snapshot.value;
  switchSheet(0);
  tab.value = 'home';
}
async function openVirtual() {
  if (!(await mayReplace())) return;
  openFiles.value = [];
  openDialog({
    kind: 'open',
    title: '打开工作簿',
    label: '文件路径',
    value: join(sys._options.userLocation || '/C/Users', 'Desktop') + '/',
  });
  try {
    const results = await Promise.all(['.vtxls', '.xlsx', '.csv', '.tsv'].map((ext) => sys.fs.search(ext)));
    openFiles.value = results
      .flat()
      .filter((item) => item.isFile)
      .slice(0, 80)
      .map((item) => ({ path: item.path, name: item.name }));
  } catch {}
}
function askSize(kind: 'width' | 'height') {
  openDialog({
    kind,
    title: kind === 'width' ? '列宽' : '行高',
    label: '像素',
    value: String(
      kind === 'width' ? columnWidth(selectedCol.value) : activeSheet.value.heights?.[selectedRow.value] || 27
    ),
  });
}
function openFind() {
  openDialog({ kind: 'find', title: '查找与替换', label: '查找内容', value: '' });
  replaceValue.value = '';
}
async function submitDialog() {
  if (!dialog.value) return;
  const d = { ...dialog.value },
    value = (d.value || '').trim();
  dialogError.value = '';
  if (!value) {
    dialogError.value = '请输入内容';
    return;
  }
  if (d.kind === 'open') {
    if (await loadFile(value)) {
      dialog.value = null;
      tab.value = 'home';
    } else dialogError.value = '文件不存在或格式无法读取';
    return;
  }
  if (d.kind === 'save') {
    const path = value.endsWith('.vtxls') ? value : value + '.vtxls';
    if (/[\\:*?"<>|]/.test(path) || !path.startsWith('/')) {
      dialogError.value = '请输入以 / 开头的有效桌面路径';
      return;
    }
    if ((await sys.fs.exists(path)) && path !== filePath.value) {
      dialogError.value = '该文件已存在，请修改文件名';
      return;
    }
    const success = await writeNative(path);
    if (success) {
      dialog.value = null;
      const resolve = saveResolve;
      saveResolve = null;
      resolve?.(true);
      tab.value = 'home';
    } else dialogError.value = '保存失败，请检查路径';
    return;
  }
  if (d.kind === 'rename') {
    if (
      value.length > 31 ||
      /[\\/?*\[\]:]/.test(value) ||
      wb.sheets.some((s, i) => i !== d.index && s.name.toLowerCase() === value.toLowerCase())
    ) {
      dialogError.value = '名称需唯一，不超过 31 字，且不含 / \\ ? * [ ] :';
      return;
    }
    const previous = wb.sheets[d.index!].name;
    mutate(() => {
      wb.sheets[d.index!].name = value;
      for (const sheet of wb.sheets)
        for (const cell of Object.values(sheet.cells))
          if (cell.v.startsWith('='))
            cell.v = cell.v
              .split(/("(?:[^"]|"")*")/g)
              .map((part, i) =>
                i % 2
                  ? part
                  : part.replace(
                      /('(?:[^']|'')+'|[A-Za-z_\u4e00-\u9fff][\w.\u4e00-\u9fff]*)!/g,
                      (full, name: string) =>
                        name.replace(/^'|'$/g, '').replace(/''/g, "'").toLowerCase() ===
                        previous.toLowerCase()
                          ? `'${value.replace(/'/g, "''")}'!`
                          : full
                    )
              )
              .join('');
    });
    dialog.value = null;
    return;
  }
  if (d.kind === 'width' || d.kind === 'height') {
    const size = +value,
      min = d.kind === 'width' ? 40 : 22,
      max = d.kind === 'width' ? 500 : 400;
    if (!Number.isFinite(size) || size < min || size > max) {
      dialogError.value = `请输入 ${min}–${max} 之间的数字`;
      return;
    }
    mutate(() => {
      if (d.kind === 'width') {
        activeSheet.value.widths ||= {};
        for (let c = range.value.c; c <= range.value.ec; c++) activeSheet.value.widths[c] = size;
      } else {
        activeSheet.value.heights ||= {};
        for (let r = range.value.r; r <= range.value.er; r++) activeSheet.value.heights[r] = size;
      }
    });
    dialog.value = null;
    return;
  }
  if (d.kind === 'find') {
    const entries = Object.entries(activeSheet.value.cells)
      .filter(([, cell]) => cell.v.toLowerCase().includes(value.toLowerCase()))
      .map(([key]) => key.split(',').map(Number))
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const next =
      entries.find(([r, c]) => r > selectedRow.value || (r === selectedRow.value && c > selectedCol.value)) ||
      entries[0];
    if (!next) {
      dialogError.value = '未找到匹配内容';
      return;
    }
    selectedRow.value = endRow.value = next[0];
    selectedCol.value = endCol.value = next[1];
    rowCount.value = Math.max(rowCount.value, next[0] + 1);
    colCount.value = Math.max(colCount.value, next[1] + 1);
    notice.value = `找到 ${entries.length} 处匹配`;
    nextTick(() =>
      gridContainer.value
        ?.querySelector(`[data-address="${address(next[0], next[1])}"]`)
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    );
  }
}
function replaceAll() {
  const query = dialog.value?.value;
  if (!query) return;
  let count = 0;
  mutate(() => {
    for (const cell of Object.values(activeSheet.value.cells))
      if (cell.v.includes(query)) {
        count += cell.v.split(query).length - 1;
        cell.v = cell.v.split(query).join(replaceValue.value);
      }
  });
  dialogError.value = `已替换 ${count} 处`;
}
function desktopPath(name = documentName.value) {
  return join(sys._options.userLocation || '/C/Users', 'Desktop', name + '.vtxls');
}
async function nextAvailablePath() {
  let index = 1,
    path = desktopPath();
  while (await sys.fs.exists(path)) path = desktopPath(`${documentName.value} (${index++})`);
  return path;
}
async function writeNative(path: string) {
  try {
    await sys.fs.writeFile(path, snapshot.value);
    removeDraft();
    filePath.value = path;
    draftScope.value = path;
    documentName.value = path
      .split('/')
      .pop()!
      .replace(/\.vtxls$/i, '');
    savedSnapshot.value = snapshot.value;
    removeDraft();
    notice.value = `已保存到 ${path}`;
    return true;
  } catch {
    notice.value = '保存失败，请检查文件路径';
    return false;
  }
}
async function saveFile(as = false): Promise<boolean> {
  commitEdit();
  commitFormula();
  renameDocument();
  if (as) {
    const path = await nextAvailablePath();
    return new Promise((resolve) => {
      saveResolve = resolve;
      openDialog({ kind: 'save', title: '另存为', label: '桌面文件路径', value: path });
    });
  }
  const path = filePath.value || (await nextAvailablePath());
  return writeNative(path);
}
function expandImportedGrid() {
  const bounds = usedBounds();
  rowCount.value = Math.max(100, Math.min(500, bounds.er + 20));
  colCount.value = Math.max(26, Math.min(60, bounds.ec + 5));
}
function applyWorkbook(data: Workbook, name: string, path = '', sourcePath = '') {
  removeDraft();
  wb.sheets = data.sheets;
  filePath.value = path;
  draftScope.value = path || sourcePath || 'new';
  documentName.value = name.replace(/\.(xlsx|vtxls|csv|tsv|txt|json)$/i, '') || '新建工作簿';
  sheetIdx.value = 0;
  undoStack.value = [];
  redoStack.value = [];
  savedSnapshot.value = path ? snapshot.value : '';
  switchSheet(0);
  tab.value = 'home';
}
function decodeText(raw: string) {
  if (raw.startsWith('data:')) return decodeDataText(raw);
  if (!/[\r\n,\t{}]/.test(raw) && /^[A-Za-z0-9+/]+={0,2}$/.test(raw) && raw.length % 4 === 0) {
    try {
      const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      if (/[\r\n,\t{}]/.test(decoded) || /[^\x20-\x7e]/.test(decoded)) return decoded;
    } catch {}
  }
  return raw;
}
function fromText(text: string, name: string) {
  if (/\.(csv|tsv|txt)$/i.test(name)) {
    const delimiter = /\.(tsv|txt)$/i.test(name) || text.split(/\r?\n/)[0].includes('\t') ? '\t' : ',';
    const rows = parseDelimited(text, delimiter);
    if (rows.length > 10000 || rows.some((row) => row.length > 256)) throw new Error('表格超出支持范围');
    const cells: Record<string, CellData> = {};
    rows.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v !== '') cells[cellKey(r, c)] = { v };
      })
    );
    return validateWorkbook({ sheets: [{ name: 'Sheet1', cells }] });
  }
  return validateWorkbook(JSON.parse(text));
}
async function loadFile(path: string) {
  try {
    const raw = await sys.fs.readFile(path);
    if (raw === null) throw new Error('文件不存在');
    const xlsx = /\.xlsx$/i.test(path),
      data = xlsx ? await importXlsx(raw) : fromText(decodeText(raw), path);
    applyWorkbook(data, path.split('/').pop()!, /\.vtxls$/i.test(path) ? path : '', path);
    importWarning.value = xlsx
      ? '已读取单元格、公式、常见格式和合并区域；图表、宏及其他高级对象不会导入。'
      : '';
    if (xlsx) notice.value = importWarning.value;
    return true;
  } catch (error) {
    notice.value = error instanceof Error ? error.message : '无法打开工作簿';
    return false;
  }
}
async function importFile(e: Event) {
  const input = e.target as HTMLInputElement,
    file = input.files?.[0];
  input.value = '';
  if (!file || !(await mayReplace())) return;
  if (file.size > 10 * 1024 * 1024) {
    notice.value = '请选择小于 10 MB 的工作簿';
    return;
  }
  try {
    const xlsx = /\.xlsx$/i.test(file.name),
      data = xlsx ? await importXlsx(await file.arrayBuffer()) : fromText(await file.text(), file.name);
    applyWorkbook(data, file.name);
    importWarning.value = xlsx
      ? '已读取单元格、公式、常见格式和合并区域；图表、宏及其他高级对象不会导入。'
      : '';
    notice.value = xlsx ? importWarning.value : '已导入，保存后会在桌面创建 .vtxls 副本';
  } catch (error) {
    notice.value = error instanceof Error ? error.message : '文件无法读取';
  }
}
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function download(type: 'xlsx' | 'csv' | 'vtxls') {
  commitEdit();
  commitFormula();
  try {
    const name = documentName.value || '工作簿';
    if (type === 'xlsx') downloadBlob(await exportXlsx(wb), name + '.xlsx');
    else if (type === 'vtxls')
      downloadBlob(new Blob([snapshot.value], { type: 'application/json' }), name + '.vtxls');
    else {
      const { er, ec } = usedBounds(),
        rows = Array.from({ length: er + 1 }, (_, r) =>
          Array.from({ length: ec + 1 }, (_, c) =>
            formatValue(evaluator.value(sheetIdx.value, r, c), activeSheet.value.cells[cellKey(r, c)]?.fmt)
          )
        );
      downloadBlob(
        new Blob(['\uFEFF' + toDelimited(rows)], { type: 'text/csv;charset=utf-8' }),
        name + '.csv'
      );
    }
    notice.value = type === 'xlsx' ? '已导出工作簿，包含单元格、公式、格式与合并区域' : '已导出文件';
  } catch {
    notice.value = '导出失败，请重试';
  }
}
function printSheet() {
  const area = dataRange(),
    frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  const table = doc.createElement('table');
  table.style.cssText = 'border-collapse:collapse;width:100%;font:11pt Calibri,sans-serif';
  for (let r = area.r; r <= area.er; r++) {
    const tr = doc.createElement('tr');
    for (let c = area.c; c <= area.ec; c++) {
      if (hiddenMerged(r, c)) continue;
      const td = doc.createElement('td');
      td.textContent = displayValue(r, c);
      Object.assign(td.style, cellStyle(r, c));
      td.style.border = '1px solid #aaa';
      td.style.padding = '4px';
      const m = mergeAt(r, c);
      if (m) {
        td.rowSpan = m.er - r + 1;
        td.colSpan = m.ec - c + 1;
      }
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  doc.title = documentName.value;
  doc.body.appendChild(table);
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  setTimeout(() => frame.remove(), 1000);
}
function onKeyDown(e: KeyboardEvent) {
  const mod = e.ctrlKey || e.metaKey,
    key = e.key.toLowerCase();
  if (mod && key === 's') {
    e.preventDefault();
    e.stopPropagation();
    saveFile(e.shiftKey);
    return;
  }
  if (isTextTarget(e.target) || dialog.value) return;
  if (e.key === 'Process' || e.keyCode === 229) {
    startEdit(selectedRow.value, selectedCol.value, '');
    return;
  }
  if (mod && key === 'z') {
    e.preventDefault();
    e.shiftKey ? redo() : undo();
    return;
  }
  if (mod && key === 'y') {
    e.preventDefault();
    redo();
    return;
  }
  if (mod && ['b', 'i', 'u'].includes(key)) {
    e.preventDefault();
    const prop = key as 'b' | 'i' | 'u';
    format({ [prop]: !currentCell.value[prop] });
    return;
  }
  if (mod && key === 'a') {
    e.preventDefault();
    selectAll();
    return;
  }
  if (mod && key === 'f') {
    e.preventDefault();
    openFind();
    return;
  }
  const directions: Record<string, [number, number]> = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  };
  if (directions[e.key]) {
    e.preventDefault();
    move(...directions[e.key], e.shiftKey);
    return;
  }
  if (e.key === 'Tab') {
    e.preventDefault();
    move(0, e.shiftKey ? -1 : 1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    move(e.shiftKey ? -1 : 1, 0);
  } else if (e.key === 'F2') {
    e.preventDefault();
    startEdit(selectedRow.value, selectedCol.value);
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    clearValues();
  } else if (e.key.length === 1 && !mod && !e.altKey) {
    e.preventDefault();
    startEdit(selectedRow.value, selectedCol.value, e.key);
  }
}
const draftScope = ref(win?.config?.path || 'new');
const draftKey = () => `vtron-excel-draft:${draftScope.value}`;
function removeDraft() {
  try {
    localStorage.removeItem(draftKey());
  } catch {}
}
function persistDraft() {
  try {
    if (dirty.value)
      localStorage.setItem(
        draftKey(),
        JSON.stringify({ workbook: wb, name: documentName.value, path: filePath.value, time: Date.now() })
      );
    else removeDraft();
  } catch {}
}
let draftTimer: ReturnType<typeof setTimeout> | undefined;
watch(snapshot, () => {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(persistDraft, 500);
});
watch([documentName, dirty], () =>
  win?.setTitle(`${documentName.value}${dirty.value ? ' *' : ''} - Excel`)
);
function beforeUnload(e: BeforeUnloadEvent) {
  if (dirty.value) {
    persistDraft();
    e.preventDefault();
    e.returnValue = '';
  }
}
onMounted(async () => {
  savedSnapshot.value = snapshot.value;
  let draft: string | null = null;
  try {
    draft = localStorage.getItem(draftKey());
  } catch {}
  if (win?.config?.path) await loadFile(win.config.path);
  if (draft) {
    try {
      const data = JSON.parse(draft),
        book = validateWorkbook(data.workbook);
      if (JSON.stringify(book) !== snapshot.value) {
        wb.sheets = book.sheets;
        documentName.value = data.name || documentName.value;
        filePath.value = data.path || filePath.value;
        savedSnapshot.value = '';
        notice.value = '已恢复上次未保存的草稿';
        switchSheet(0);
      }
    } catch {}
  }
  window.addEventListener('beforeunload', beforeUnload);
  win?.setTitle(`${documentName.value}${dirty.value ? ' *' : ''} - Excel`);
  focusGrid();
});
onBeforeUnmount(() => {
  commitEdit();
  persistDraft();
  clearTimeout(draftTimer);
  resizeCleanup?.();
  window.removeEventListener('beforeunload', beforeUnload);
});
</script>

<style scoped>
.excel-app {
  --accent: #217346;
  --line: #d9dedb;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  background: #fff;
  color: #242424;
  font:
    12px 'Segoe UI',
    'Microsoft YaHei',
    sans-serif;
  overflow: hidden;
  outline: 0;
  position: relative;
  user-select: none;
}
.excel-app * {
  box-sizing: border-box;
}
.excel-app button,
.excel-app input,
.excel-app select {
  font: inherit;
}
.excel-app button {
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  min-height: 26px;
  padding: 3px 8px;
  white-space: nowrap;
}
.excel-app button:hover {
  background: #e5eae7;
}
.excel-app button:active {
  background: #d5e2da;
}
.excel-app button:disabled {
  opacity: 0.35;
  cursor: default;
}
.excel-app button:focus-visible,
.excel-app input:focus-visible,
.excel-app select:focus-visible {
  outline: 2px solid #217346;
  outline-offset: -2px;
}
.office-title {
  height: 43px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 0 0 16px;
  background: var(--accent);
  color: white;
}
.app-icon {
  display: grid;
  place-content: center;
  height: 25px;
  width: 24px;
  border: 1px solid #ffffff90;
  font-size: 18px;
  font-weight: 700;
}
.document-name {
  color: white;
  min-width: 80px;
  width: 170px;
  max-width: 36%;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  padding: 4px;
  font-size: 13px !important;
  font-weight: 600 !important;
  outline: 0;
}
.document-name:hover,
.document-name:focus {
  border-color: #ffffff70;
  background: #ffffff15;
}
.save-state {
  font-size: 11px;
  color: #e3efe7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.quick-actions {
  margin-left: auto;
  display: flex;
  gap: 5px;
}
.quick-actions button {
  font-size: 23px;
  width: 31px;
  height: 30px;
  padding: 0;
  color: #fff;
}
.quick-actions button:hover {
  background: #ffffff26;
}
.quick-actions svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.3;
}
.ribbon-tabs {
  display: flex;
  align-items: stretch;
  gap: 3px;
  background: #f5f6f5;
  border-bottom: 1px solid var(--line);
  height: 35px;
  flex: none;
  padding: 0 10px;
  overflow-x: auto;
}
.ribbon-tabs button {
  position: relative;
  padding: 0 17px;
  border-radius: 0;
  min-height: 34px;
}
.ribbon-tabs button.active {
  color: var(--accent);
  font-weight: 600;
  background: #fff;
}
.ribbon-tabs button.active:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 15px;
  right: 15px;
  height: 3px;
  background: var(--accent);
  border-radius: 2px;
}
.ribbon-tabs .file-tab {
  color: var(--accent);
}
.ribbon {
  display: flex;
  align-items: stretch;
  flex: none;
  height: 107px;
  padding: 8px 8px 4px;
  background: #fafbfa;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
  gap: 0;
}
.ribbon-group {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid #dde1de;
  padding: 0 12px;
  gap: 5px;
  flex: none;
  min-width: 80px;
}
.ribbon-group:last-child {
  border-right: 0;
}
.group-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.ribbon-group small {
  display: block;
  text-align: center;
  color: #727a75;
  font-size: 10px;
  line-height: 14px;
}
.ribbon select {
  height: 26px;
  border: 1px solid #ccd3ce;
  border-radius: 2px;
  background: white;
  padding: 2px 5px;
  color: #242424;
  min-width: 50px;
}
.ribbon .stack {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1px;
}
.ribbon .stack button {
  text-align: left;
  min-height: 22px;
  padding: 1px 5px;
}
.ribbon .large-tool {
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 4px 8px;
}
.large-symbol {
  font-size: 27px;
  color: var(--accent);
  font-family: Arial, sans-serif;
  line-height: 30px;
}
.font-controls {
  display: grid;
  grid-template-columns: 124px 53px;
  gap: 5px;
}
.format-row {
  display: flex;
  align-items: center;
  gap: 1px;
  grid-column: 1/-1;
}
.format-row button {
  padding: 2px 6px;
  min-width: 26px;
}
.format-row svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  vertical-align: middle;
}
.excel-app .pressed {
  background: #d4e5da;
  border-color: #b4cbbd;
}
.color-tool {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 29px;
  height: 26px;
  border-radius: 3px;
  cursor: pointer;
}
.color-tool:hover {
  background: #e5eae7;
}
.color-tool span {
  display: block;
  min-width: 16px;
  text-align: center;
  font-weight: 700;
  border-bottom: 3px solid transparent;
  line-height: 17px;
}
.color-tool input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.ribbon label {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.ribbon input[type='checkbox'] {
  accent-color: var(--accent);
}
.function-help {
  margin: 0 15px;
  min-width: 350px;
  font-size: 12px;
  line-height: 1.8;
  color: #526057;
  align-self: center;
  user-select: text;
}
.formula-bar {
  height: 34px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
  padding: 3px 8px;
  background: #fff;
  border-bottom: 1px solid var(--line);
}
.name-box {
  width: 87px;
  height: 26px;
  border: 1px solid #d7dcd9;
  border-radius: 2px;
  text-align: center;
  padding: 3px 4px;
  color: #333;
}
.formula-divider {
  width: 1px;
  background: #d5dcd7;
  height: 22px;
  margin: 0 6px;
}
.formula-bar button {
  font-size: 19px;
  color: #717d75;
  padding: 0;
  width: 25px;
}
.fx-symbol {
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 19px;
  color: #52685a;
  padding: 0 8px;
}
.formula-input {
  flex: 1;
  min-width: 0;
  height: 25px;
  border: 1px solid #d7dcd9;
  outline: none;
  padding: 3px 8px;
  user-select: text;
}
.formula-input:focus {
  border-color: #217346;
}
.grid-container {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #f5f6f5;
  scrollbar-color: #bdc5c0 #f2f4f2;
  scrollbar-width: thin;
}
.grid-table {
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  background: #fff;
  width: max-content;
  min-width: 100%;
  font-family: Calibri, '等线', sans-serif;
}
.grid-table th,
.grid-table td {
  border-right: 1px solid #e0e4e1;
  border-bottom: 1px solid #e0e4e1;
  box-sizing: border-box;
}
.col-header {
  position: sticky;
  top: 0;
  height: 26px;
  min-width: 40px;
  background: #f5f6f5;
  color: #555f59;
  font-size: 11px;
  font-weight: 400;
  text-align: center;
  z-index: 3;
  cursor: s-resize;
  user-select: none;
}
.resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 4;
}
.resize-handle:hover {
  background: #21734677;
}
.corner-header {
  position: sticky;
  left: 0;
  top: 0;
  width: 44px;
  min-width: 44px;
  z-index: 5;
  background: #f5f6f5;
  color: #a3ada6;
  cursor: cell;
  text-align: right;
  padding-right: 5px;
}
.row-header {
  position: sticky;
  left: 0;
  background: #f5f6f5;
  font-size: 11px;
  font-weight: 400;
  color: #58635b;
  width: 44px;
  min-width: 44px;
  text-align: center;
  z-index: 2;
  cursor: e-resize;
}
.col-header.highlight,
.row-header.highlight {
  color: #17673b;
  background: #dcece1;
  box-shadow: inset 0 -1px #217346;
}
.cell {
  height: 27px;
  padding: 0;
  position: relative;
  cursor: cell;
  vertical-align: middle;
  overflow: hidden;
  min-width: 40px;
  background: #fff;
}
.cell.in-range {
  background: #e7f0eb;
}
.cell.selected {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
  z-index: 1;
  background: #fff;
}
.cell.selected:after {
  content: '';
  width: 5px;
  height: 5px;
  position: absolute;
  right: 0;
  bottom: 0;
  background: var(--accent);
  border: 1px solid #fff;
}
.cell-display {
  display: block;
  min-height: 24px;
  padding: 3px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: inherit;
  user-select: none;
  line-height: 20px;
}
.cell-editor {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 2px solid var(--accent);
  background: #fff;
  outline: 0;
  padding: 2px 5px;
  font: inherit !important;
  z-index: 6;
  user-select: text;
}
.error-cell {
  color: #ab2929;
}
.hide-grid td {
  border-color: transparent;
}
.freeze-row .first-data-row td,
.freeze-row .first-data-row th {
  position: sticky;
  top: 26px;
  z-index: 2;
  background: #fff;
  border-bottom: 2px solid #aebbb2;
}
.freeze-row .first-data-row th {
  z-index: 4;
  background: #f5f6f5;
}
.filter-row th {
  position: sticky;
  top: 26px;
  z-index: 3;
  background: #f3f6f3;
  padding: 3px;
}
.filter-row input {
  width: 100%;
  min-width: 0;
  border: 1px solid #cbd5ce;
  height: 23px;
  background: white;
  padding: 2px 4px;
  font-size: 11px;
  user-select: text;
}
.filter-row th:first-child {
  left: 0;
  z-index: 5;
}
.freeze-row:has(.filter-row) .first-data-row td,
.freeze-row:has(.filter-row) .first-data-row th {
  top: 56px;
}
.sheet-bar {
  height: 36px;
  flex: none;
  display: flex;
  align-items: center;
  padding: 0 8px;
  background: #f5f6f5;
  border-top: 1px solid var(--line);
  gap: 1px;
  min-width: 0;
}
.sheet-bar button {
  font-size: 12px;
  padding: 3px 7px;
  color: #5c6a61;
}
.sheet-bar > button:first-child,
.sheet-bar > button:nth-child(2) {
  font-size: 20px;
  min-width: 24px;
  padding: 0;
}
.sheet-tabs {
  display: flex;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  height: 100%;
  scrollbar-width: none;
  margin-left: 10px;
  gap: 2px;
  align-items: stretch;
}
.sheet-tabs .sheet-tab {
  border-radius: 0;
  padding: 0 20px;
  font-size: 12px;
  position: relative;
}
.sheet-tabs .sheet-tab.active {
  color: var(--accent);
  font-weight: 600;
  background: white;
  border-bottom: 3px solid var(--accent);
}
.sheet-bar .add-sheet {
  font-size: 21px;
  margin: 0 10px;
  line-height: 26px;
  padding: 0 4px;
}
.status-bar {
  height: 27px;
  flex: none;
  background: #f5f6f5;
  border-top: 1px solid #e1e5e2;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 11px;
  color: #526057;
}
.selection-stats {
  margin-left: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.selection-stats:not(:empty) + .zoom-controls {
  margin-left: 0;
}
.zoom-controls input {
  accent-color: var(--accent);
  width: 95px;
  height: 4px;
}
.zoom-controls button {
  min-height: 22px;
  padding: 0 4px;
  font-size: 11px;
}
.zoom-controls button:first-child,
.zoom-controls button:nth-last-child(2) {
  font-size: 17px;
}
.inline-notice {
  min-height: 29px;
  padding: 5px 10px;
  background: #f5f1df;
  color: #6d5c24;
  border-bottom: 1px solid #e4dcb9;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  flex: none;
}
.inline-notice button {
  margin-left: auto;
  min-height: 18px;
  height: 18px;
  padding: 0 4px;
  font-size: 17px;
}
.file-panel {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #fff;
}
.file-actions {
  width: 185px;
  flex: none;
  background: #f2f5f3;
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.file-actions h2 {
  font-size: 18px;
  font-weight: 500;
  margin: 0 8px 15px;
}
.file-actions button {
  text-align: left;
  padding: 9px 14px;
  min-height: 37px;
  color: #28593b;
}
.file-details {
  padding: 42px;
  max-width: 640px;
  user-select: text;
}
.file-details h1 {
  font-size: 27px;
  font-weight: 500;
  margin: 0 0 18px;
  overflow-wrap: anywhere;
}
.file-details p {
  color: #647168;
  font-size: 13px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.file-details .primary {
  margin-top: 20px;
}
.import-warning {
  background: #fff8df;
  padding: 12px;
}
.excel-app .primary {
  background: var(--accent);
  color: #fff;
  border: 1px solid #17643a;
  padding: 6px 20px;
}
.excel-app .primary:hover {
  background: #185d38;
}
.modal-backdrop {
  position: absolute;
  inset: 0;
  z-index: 30;
  background: #0003;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}
.office-dialog {
  width: 410px;
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  background: #fff;
  border: 1px solid #bec9c1;
  box-shadow: 0 12px 40px #0003;
  padding: 20px;
  border-radius: 6px;
  user-select: text;
}
.dialog-heading {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
  gap: 10px;
}
.dialog-heading h2 {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.3;
  margin: 0;
}
.dialog-heading button {
  font-size: 21px;
  margin-left: auto;
  padding: 0;
  min-width: 25px;
}
.office-dialog > label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 13px;
  color: #516257;
}
.office-dialog input {
  border: 1px solid #bfcac3;
  background: #fff;
  height: 33px;
  padding: 5px 8px;
  outline: 0;
  user-select: text;
  color: #242424;
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  margin-top: 22px;
}
.dialog-actions button {
  border: 1px solid #cad2cc;
  padding: 5px 14px;
  min-height: 31px;
}
.office-dialog p {
  line-height: 1.7;
}
.dialog-error {
  color: #ae2d2d;
  font-size: 12px;
  margin: 10px 0;
}
.open-file-list {
  max-height: 210px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.open-file-list button {
  padding: 7px;
  text-align: left;
  white-space: normal;
}
.open-file-list small {
  display: block;
  font-size: 10px;
  color: #76867b;
  overflow-wrap: anywhere;
  margin-top: 3px;
}
.open-file-list p {
  color: #718177;
  font-size: 12px;
}
@media (max-width: 650px) {
  .save-state {
    display: none;
  }
  .office-title {
    padding: 0 10px;
    gap: 9px;
  }
  .document-name {
    max-width: 55%;
    width: 180px;
  }
  .ribbon-tabs {
    padding: 0 3px;
    gap: 0;
  }
  .ribbon-tabs button {
    padding: 0 13px;
  }
  .ribbon {
    height: 102px;
    padding-left: 0;
  }
  .ribbon-group {
    padding: 0 9px;
  }
  .selection-stats {
    max-width: 40%;
  }
  .zoom-controls input {
    width: 60px;
  }
  .status-bar {
    gap: 7px;
    padding: 0 7px;
  }
  .sheet-bar > button:last-child,
  .sheet-bar > button:nth-last-child(2) {
    display: none;
  }
  .file-actions {
    width: 140px;
  }
  .file-details {
    padding: 24px;
  }
  .function-help {
    min-width: 300px;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto !important;
  }
}
</style>

<template>
  <section ref="appRef" class="word-app office-window" @keydown="onKeyDown">
    <OfficeTitlebar class="word-titlebar" @close="closeWindow">
      <span class="word-mark" aria-hidden="true">W</span><strong>Word</strong>
      <button class="quick" title="保存 Ctrl+S" aria-label="保存" @click="saveFile()">▣</button>
      <button class="quick" title="撤销 Ctrl+Z" aria-label="撤销" @mousedown.prevent @click="exec('undo')">
        ↶
      </button>
      <button class="quick" title="重做 Ctrl+Y" aria-label="重做" @mousedown.prevent @click="exec('redo')">
        ↷
      </button>
      <button class="document-title" title="重命名文档" @click="openModal('rename')">
        {{ documentName }}<span>⌄</span>
      </button>
      <span class="save-state" role="status">{{
        busy ? '正在处理…' : dirty ? '未保存' : filePath ? '已保存' : '本地文档'
      }}</span>
    </OfficeTitlebar>
    <nav class="word-tabs" aria-label="功能区" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab"
        role="tab"
        :aria-selected="activeTab === tab"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </nav>
    <div v-if="activeTab === '文件'" class="file-panel">
      <div class="file-actions">
        <button @click="createNew"><span>＋</span>新建空白文档</button>
        <button @click="showOpen"><span>▱</span>{{ office.standalone ? '打开文件' : '打开桌面文档' }}</button>
        <button v-if="!office.standalone" @click="importRef?.click()"><span>↥</span>从电脑导入</button>
        <button :disabled="busy" @click="saveFile()"><span>▣</span>保存</button>
        <button :disabled="busy" @click="showSaveAs()"><span>▣</span>另存为</button>
        <button v-if="!office.standalone" @click="exportDocument('docx')"><span>W</span>下载 DOCX</button>
        <button @click="exportDocument('html')"><span>⤓</span>下载 HTML</button>
        <button @click="exportDocument('txt')"><span>⤓</span>下载纯文本</button>
        <button @click="printDocument"><span>▤</span>打印 / 保存 PDF</button>
      </div>
      <div class="file-info">
        <h2>{{ documentName }}</h2>
        <p>{{ filePath || (office.standalone ? '尚未保存为文件' : '尚未保存到桌面') }}</p>
        <p>{{ charCount }} 字 · {{ paragraphCount }} 段</p>
      </div>
    </div>
    <div v-else class="word-ribbon" @mousedown="rememberSelection">
      <template v-if="activeTab === '开始'">
        <div class="ribbon-group clipboard-group">
          <div class="ribbon-controls">
            <button class="large-tool" @mousedown.prevent @click="pasteText"><b>▣</b>粘贴</button>
            <div class="stack">
              <button @mousedown.prevent @click="exec('cut')">剪切</button
              ><button @mousedown.prevent @click="exec('copy')">复制</button
              ><button @mousedown.prevent @click="exec('removeFormat')">清除格式</button>
            </div>
          </div>
          <span class="group-label">剪贴板</span>
        </div>
        <div class="ribbon-group">
          <div class="stack">
            <div class="tool-row">
              <select v-model="fontFamily" aria-label="字体" @change="exec('fontName', fontFamily)">
                <option>等线</option>
                <option>宋体</option>
                <option>微软雅黑</option>
                <option>Arial</option>
                <option>Calibri</option>
                <option>Times New Roman</option></select
              ><select v-model="fontSize" class="font-size" aria-label="字号" @change="applyFontSize">
                <option
                  v-for="size in [9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72]"
                  :key="size"
                  :value="size"
                >
                  {{ size }}
                </option>
              </select>
            </div>
            <div class="tool-row">
              <button
                :class="{ selected: formats.bold }"
                title="加粗 Ctrl+B"
                aria-label="加粗"
                @mousedown.prevent
                @click="exec('bold')"
              >
                <b>B</b></button
              ><button
                :class="{ selected: formats.italic }"
                title="斜体 Ctrl+I"
                aria-label="斜体"
                @mousedown.prevent
                @click="exec('italic')"
              >
                <i>I</i></button
              ><button
                :class="{ selected: formats.underline }"
                title="下划线 Ctrl+U"
                aria-label="下划线"
                @mousedown.prevent
                @click="exec('underline')"
              >
                <u>U</u></button
              ><button title="删除线" aria-label="删除线" @mousedown.prevent @click="exec('strikeThrough')">
                <s>ab</s></button
              ><button title="上标" aria-label="上标" @mousedown.prevent @click="exec('superscript')">
                x²</button
              ><button title="下标" aria-label="下标" @mousedown.prevent @click="exec('subscript')">x₂</button
              ><label class="color-control" title="文本突出显示颜色"
                ><span :style="{ background: highlightColor }">ab</span
                ><input
                  v-model="highlightColor"
                  type="color"
                  aria-label="文本突出显示颜色"
                  @input="exec('hiliteColor', highlightColor)" /></label
              ><label class="color-control" title="字体颜色"
                ><span :style="{ borderBottom: `3px solid ${textColor}` }">A</span
                ><input
                  v-model="textColor"
                  type="color"
                  aria-label="字体颜色"
                  @input="exec('foreColor', textColor)"
              /></label>
            </div>
          </div>
          <span class="group-label">字体</span>
        </div>
        <div class="ribbon-group">
          <div class="stack">
            <div class="tool-row">
              <button
                title="项目符号"
                aria-label="项目符号"
                @mousedown.prevent
                @click="exec('insertUnorderedList')"
              >
                ☷</button
              ><button title="编号" aria-label="编号" @mousedown.prevent @click="exec('insertOrderedList')">
                1≡</button
              ><button title="减少缩进" aria-label="减少缩进" @mousedown.prevent @click="exec('outdent')">
                ⇤</button
              ><button title="增加缩进" aria-label="增加缩进" @mousedown.prevent @click="exec('indent')">
                ⇥</button
              ><select
                v-model="lineHeight"
                aria-label="行距"
                @change="applyParagraphStyle('lineHeight', lineHeight)"
              >
                <option value="1">1.0</option>
                <option value="1.5">1.5</option>
                <option value="2">2.0</option>
              </select>
            </div>
            <div class="tool-row">
              <button
                v-for="(label, key) in alignments"
                :key="key"
                :title="label"
                :aria-label="label"
                @mousedown.prevent
                @click="exec(key)"
              >
                <span :class="['align-symbol', key]">≡</span></button
              ><button title="删除表格" aria-label="删除所在表格" @mousedown.prevent @click="deleteTable">
                ▦−
              </button>
            </div>
          </div>
          <span class="group-label">段落</span>
        </div>
        <div class="ribbon-group style-group">
          <div class="style-tiles">
            <button
              v-for="style in styles"
              :key="style.tag"
              :class="style.tag"
              @mousedown.prevent
              @click="exec('formatBlock', style.tag)"
            >
              <span>{{ style.sample }}</span
              >{{ style.name }}
            </button>
          </div>
          <span class="group-label">样式</span>
        </div>
        <div class="ribbon-group">
          <div class="stack">
            <button @click="openSearch(false)">⌕ 查找</button>
            <button @click="openSearch(true)">替换</button>
            <button @mousedown.prevent @click="selectAll">全选</button>
          </div>
          <span class="group-label">编辑</span>
        </div>
      </template>
      <template v-else-if="activeTab === '插入'">
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button
              class="large-tool"
              title="分页符 Ctrl+Enter"
              @mousedown.prevent
              @click="insertPageBreak"
            >
              <b>▤</b>分页符</button
            ><button class="large-tool" @click="openModal('table')"><b>▦</b>表格</button>
          </div>
          <span class="group-label">页面与表格</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button class="large-tool" @click="imageRef?.click()"><b>▧</b>图片</button
            ><button class="large-tool" @click="openModal('link')"><b>↗</b>链接</button
            ><button class="large-tool" @mousedown.prevent @click="exec('unlink')"><b>⌁</b>取消链接</button>
          </div>
          <span class="group-label">插入内容</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button class="large-tool" @mousedown.prevent @click="exec('insertHorizontalRule')">
              <b>―</b>水平线</button
            ><button
              class="large-tool"
              @mousedown.prevent
              @click="insertHtml(wordEscape(new Date().toLocaleDateString('zh-CN')))"
            >
              <b>▣</b>日期</button
            ><button class="large-tool" @click="openModal('symbol')"><b>Ω</b>符号</button>
          </div>
          <span class="group-label">文本</span>
        </div>
      </template>
      <template v-else-if="activeTab === '布局'">
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <label class="layout-field">
              页边距
              <select v-model="marginPreset" aria-label="页边距" :disabled="readOnly">
                <option
                  v-for="preset in marginPresets"
                  :key="preset.name"
                  :value="preset.name"
                  :disabled="!marginsFit(layout.width, layout.height, preset.margins)"
                >
                  {{ preset.name }}
                </option>
                <option value="" disabled>自定义</option>
              </select>
            </label>
            <label class="layout-field">
              纸张方向
              <select v-model="orientation" aria-label="纸张方向" :disabled="readOnly">
                <option
                  value="portrait"
                  :disabled="orientation !== 'portrait' && !marginsFit(layout.height, layout.width)"
                >
                  纵向
                </option>
                <option
                  value="landscape"
                  :disabled="orientation !== 'landscape' && !marginsFit(layout.height, layout.width)"
                >
                  横向
                </option>
              </select>
            </label>
            <label class="layout-field">
              纸张大小
              <select v-model="paperSize" aria-label="纸张大小" :disabled="readOnly">
                <option
                  v-for="paper in paperSizes"
                  :key="paper.name"
                  :value="paper.name"
                  :disabled="!marginsFit(...orientedSize(paper.width, paper.height))"
                >
                  {{ paper.name }}
                </option>
                <option value="" disabled>自定义</option>
              </select>
            </label>
            <button :disabled="readOnly" @click="openModal('margins')">自定义页边距</button>
          </div>
          <span class="group-label">页面设置</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button class="large-tool" @mousedown.prevent @click="exec('outdent')"><b>⇤</b>减少缩进</button
            ><button class="large-tool" @mousedown.prevent @click="exec('indent')"><b>⇥</b>增加缩进</button
            ><label class="layout-field"
              >段落间距<select
                v-model="paragraphSpacing"
                @change="applyParagraphStyle('marginBottom', paragraphSpacing)"
              >
                <option value="0px">无</option>
                <option value="8pt">8 磅</option>
                <option value="12pt">12 磅</option>
                <option value="18pt">18 磅</option>
              </select></label
            >
          </div>
          <span class="group-label">段落</span>
        </div>
      </template>
      <template v-else-if="activeTab === '视图'">
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <label class="layout-field"
              ><span><input v-model="showRuler" type="checkbox" />标尺</span></label
            ><label class="layout-field"
              ><span><input v-model="readOnly" type="checkbox" />阅读模式</span></label
            ><label class="layout-field"><span><input v-model="navigationOpen" type="checkbox" />导航窗格</span></label
            >
          </div>
          <span class="group-label">显示</span>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-controls">
            <button class="large-tool" @click="zoom = 100"><b>100%</b>实际大小</button
            ><button class="large-tool" @click="fitWidth"><b>↔</b>适合窗口</button
            ><button class="large-tool" @click="printDocument"><b>▤</b>打印</button>
          </div>
          <span class="group-label">缩放与打印</span>
        </div>
      </template>
    </div>
    <div class="word-body">
      <WordNavigation v-if="navigationOpen" ref="navigationRef" :editor="editorRef" :workspace="workspaceRef"
        :revision="revision" :read-only="readOnly" @close="closeNavigation" @replace="replaceMatches" @report="report" />
    <main ref="workspaceRef" class="word-workspace">
      <div class="document-spread" :style="{ width: `${(pageWidth * zoom) / 100}px` }">
        <div
          v-if="showRuler"
          class="word-ruler"
          :style="{
            paddingLeft: `${(pagePadding.left * zoom) / 100}px`,
            paddingRight: `${(pagePadding.right * zoom) / 100}px`,
          }"
        >
          <span v-for="n in 16" :key="n">{{ n - 1 }}</span>
        </div>
        <div
          class="page-shell"
          :style="{ width: `${(pageWidth * zoom) / 100}px`, minHeight: `${(pageHeight * zoom) / 100}px` }"
        >
          <article
            ref="pageRef"
            class="word-page"
            :style="{
              width: `${pageWidth}px`,
              minHeight: `${pageHeight}px`,
              padding: pagePaddingCss,
              zoom: `${zoom}%`,
            }"
          >
            <div
              ref="editorRef"
              class="editor-content"
              role="textbox"
              aria-label="文档正文"
              aria-multiline="true"
              :style="{ minHeight: `${Math.max(0, pageHeight - pagePadding.top - pagePadding.bottom)}px` }"
              :contenteditable="!readOnly"
              spellcheck="false"
              @input="onInput"
              @paste="onPaste"
              @drop="onDrop"
              @click="onEditorClick"
            ></div>
          </article>
        </div>
      </div>
    </main>
    </div>
    <footer class="word-status">
      <span>{{ charCount }} 字</span><span>{{ paragraphCount }} 段</span
      ><span class="status-message" role="status">{{
        statusMessage || (readOnly ? '阅读模式' : '编辑模式')
      }}</span
      ><button title="缩小" aria-label="缩小" @click="zoom = Math.max(40, zoom - 10)">−</button
      ><input v-model.number="zoom" type="range" min="40" max="160" step="10" aria-label="缩放比例" /><button
        title="放大"
        aria-label="放大"
        @click="zoom = Math.min(160, zoom + 10)"
      >
        ＋</button
      ><button class="zoom-value" @click="zoom = 100">{{ zoom }}%</button>
    </footer>
    <input
      ref="importRef"
      class="hidden-input"
      type="file"
      :accept="office.standalone ? '.docx,.html,.htm,.txt' : '.vtdoc,.html,.htm,.txt,.docx'"
      @change="importDocument"
    />
    <input
      ref="imageRef"
      class="hidden-input"
      type="file"
      accept="image/png,image/jpeg,image/gif,image/webp"
      @change="insertImage"
    />
    <div v-if="modal" class="word-modal-backdrop" @click.self="closeModal" @keydown.esc.stop="closeModal">
      <form
        class="word-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="modalTitle"
        @submit.prevent="submitModal"
      >
        <header>
          <h2>{{ modalTitle }}</h2>
          <button type="button" aria-label="关闭对话框" @click="closeModal">×</button>
        </header>
        <template v-if="modal === 'rename' || modal === 'save'"
          ><label>文件名<input v-model="modalValue" autofocus maxlength="100" /></label>
          <p v-if="modal === 'save'" class="modal-note">保存到桌面，使用 .vtdoc 格式。</p></template
        >
        <template v-else-if="modal === 'open'"
          ><label
            >文件路径<input v-model="modalValue" autofocus placeholder="/C/Users/Desktop/文档.vtdoc"
          /></label>
          <div class="recent-files">
            <button
              v-for="file in desktopFiles"
              :key="file.path"
              type="button"
              @click="modalValue = file.path"
            >
              ▱ {{ file.name }}
            </button>
            <p v-if="!desktopFiles.length">桌面暂无可编辑文档</p>
          </div>
          <button
            type="button"
            @click="
              closeModal();
              importRef?.click();
            "
          >
            从电脑导入…
          </button></template
        >
        <template v-else-if="modal === 'table'"
          ><div class="table-fields">
            <label>行数<input v-model.number="tableRows" type="number" min="1" max="30" required /></label
            ><label
              >列数<input v-model.number="tableCols" type="number" min="1" max="12" required
            /></label></div
        ></template>
        <template v-else-if="modal === 'link'"
          ><label>显示文本<input v-model="linkText" /></label
          ><label>链接地址<input v-model="modalValue" placeholder="https://" required /></label
        ></template>
        <div v-else-if="modal === 'margins'" class="margin-fields">
          <label v-for="side in wordMarginSides" :key="side">
            {{ marginLabels[side] }}（毫米）
            <input
              v-model.number="marginInputs[side]"
              type="number"
              :min="side === 'top' || side === 'bottom' ? undefined : 0"
              step="any"
              required
            />
          </label>
        </div>
        <template v-else-if="modal === 'symbol'"
          ><div class="symbol-grid">
            <button
              v-for="symbol in '©®™€¥℃°±×÷≠≤≥∞√∑αβπΩ→←↑↓✓★'"
              :key="symbol"
              type="button"
              @click="
                insertHtml(wordEscape(symbol));
                closeModal();
              "
            >
              {{ symbol }}
            </button>
          </div></template
        >
        <p v-if="modalError" class="modal-error" role="alert">{{ modalError }}</p>
        <footer v-if="modal !== 'symbol'">
          <button type="button" @click="closeModal">取消</button
          ><button class="primary" type="submit">
            {{
              modal === 'open'
                ? '打开'
                : modal === 'save'
                  ? '保存'
                  : modal === 'table' || modal === 'link'
                    ? '插入'
                    : '确定'
            }}
          </button>
        </footer>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import OfficeTitlebar from './office/OfficeTitlebar.vue';
import { saveOfficeDownload, useOfficeFiles } from './office/officeFiles';
import WordNavigation from './office/WordNavigation.vue';
import {
  wordDefaultLayout,
  wordEscape,
  wordMarginSides,
  wordMmToTwips,
  wordPageBreak,
  wordPageLayout,
  wordReadDocx,
  wordSafeUrl,
  wordSanitize,
  wordTwipsToMm,
  wordWriteDocx,
  type WordDocument,
  type WordMargins,
  type WordPageLayout,
} from './office/wordFormats';

const appRef = ref<HTMLElement>();
const editorRef = ref<HTMLElement>();
const pageRef = ref<HTMLElement>();
const workspaceRef = ref<HTMLElement>();
const importRef = ref<HTMLInputElement>();
const imageRef = ref<HTMLInputElement>();
const tabs = ['文件', '开始', '插入', '布局', '视图'];
const activeTab = ref('开始');
const documentName = ref('新建文档');
const filePath = ref('');
const office = useOfficeFiles();
const { win } = office;
const dirty = ref(false);
const busy = ref(false);
const statusMessage = ref('');
const fontFamily = ref('等线');
const fontSize = ref(12);
const textColor = ref('#18212f');
const highlightColor = ref('#fff29a');
const lineHeight = ref('1.5');
const paragraphSpacing = ref('8pt');
const layout = ref(wordPageLayout());
const marginPresets = [
  { name: '普通', margins: wordDefaultLayout.margins },
  { name: '窄', margins: { top: 720, right: 720, bottom: 720, left: 720 } },
  { name: '适中', margins: { top: 1440, right: 1080, bottom: 1440, left: 1080 } },
  { name: '宽', margins: { top: 1440, right: 2880, bottom: 1440, left: 2880 } },
];
const paperSizes = [
  { name: 'A4', width: wordDefaultLayout.width, height: wordDefaultLayout.height },
  { name: 'A5', width: 8391, height: 11906 },
  { name: 'Letter', width: 12240, height: 15840 },
  { name: 'Legal', width: 12240, height: 20160 },
];
const marginLabels = { top: '上', right: '右', bottom: '下', left: '左' };
const marginInputs = reactive({ top: 0, right: 0, bottom: 0, left: 0 });
const marginPreset = computed({
  get: () =>
    marginPresets.find((preset) =>
      wordMarginSides.every((side) => preset.margins[side] === layout.value.margins[side])
    )?.name || '',
  set: (name) => {
    const preset = marginPresets.find((item) => item.name === name);
    if (preset) applyLayout({ ...layout.value, margins: preset.margins });
  },
});
const orientation = computed({
  get: () => layout.value.orientation,
  set: (value: WordPageLayout['orientation']) => {
    if (value === layout.value.orientation) return;
    const { width, height } = layout.value;
    applyLayout({ ...layout.value, orientation: value, width: height, height: width });
  },
});
const paperSize = computed({
  get: () =>
    paperSizes.find(({ width, height }) => {
      const [w, h] = orientedSize(width, height);
      // Word producers round ISO paper sizes slightly differently.
      return Math.abs(w - layout.value.width) <= 2 && Math.abs(h - layout.value.height) <= 2;
    })?.name || '',
  set: (name) => {
    const paper = paperSizes.find((item) => item.name === name);
    if (!paper) return;
    const [width, height] = orientedSize(paper.width, paper.height);
    applyLayout({ ...layout.value, width, height });
  },
});
const zoom = ref(90);
const showRuler = ref(true);
const readOnly = ref(false);
const plainText = ref('');
const charCount = computed(() => plainText.value.replace(/\s+/g, '').length);
const paragraphCount = computed(() =>
  plainText.value.trim() ? plainText.value.trim().split(/\n+/).length : 0
);
const pageWidth = computed(() => layout.value.width / 15);
const pageHeight = computed(() => layout.value.height / 15);
const pagePadding = computed(() => {
  const { top, right, bottom, left } = layout.value.margins;
  return { top: Math.abs(top) / 15, right: right / 15, bottom: Math.abs(bottom) / 15, left: left / 15 };
});
const pagePaddingCss = computed(() =>
  wordMarginSides.map((side) => `${pagePadding.value[side]}px`).join(' ')
);
const formats = reactive({ bold: false, italic: false, underline: false });
const alignments = {
  justifyLeft: '左对齐',
  justifyCenter: '居中',
  justifyRight: '右对齐',
  justifyFull: '两端对齐',
};
const styles = [
  { tag: 'p', name: '正文', sample: 'AaBb' },
  { tag: 'h1', name: '标题 1', sample: '标题' },
  { tag: 'h2', name: '标题 2', sample: '标题' },
];
const navigationOpen = ref(false);
const navigationRef = ref<InstanceType<typeof WordNavigation>>();
const revision = ref(0);
let savedRange: Range | null = null;
let replacing = false;
let draftTimer: ReturnType<typeof setTimeout> | undefined;
let messageTimer: ReturnType<typeof setTimeout> | undefined;
const draftKey = `vtron-word-draft:${Date.now()}:${Math.random().toString(36).slice(2)}`;
type Modal = '' | 'rename' | 'save' | 'open' | 'table' | 'link' | 'symbol' | 'margins';
const modal = ref<Modal>('');
const modalValue = ref('');
const modalError = ref('');
const linkText = ref('');
const tableRows = ref(3);
const tableCols = ref(3);
const desktopFiles = ref<{ name: string; path: string }[]>([]);
const modalTitle = computed(
  () =>
    ({
      rename: '重命名文档',
      save: '另存为',
      open: '打开文档',
      table: '插入表格',
      link: '插入链接',
      symbol: '插入符号',
      margins: '自定义页边距',
      '': '',
    })[modal.value]
);
const desktop = office.desktop;
function removeDraft(key = draftKey) {
  try {
    office.drafts?.removeItem(key);
  } catch {
    /* unavailable storage */
  }
}
function report(message: string) {
  statusMessage.value = message;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    statusMessage.value = '';
  }, 4500);
}
function currentText() {
  return editorRef.value?.innerText || '';
}
function updateStats() {
  plainText.value = currentText();
  revision.value++;
}
function persistDraft() {
  if (!dirty.value) return;
  try {
    office.drafts?.setItem(
      draftKey,
      JSON.stringify({
        path: filePath.value,
        name: documentName.value,
        html: editorRef.value?.innerHTML || '',
        layout: layout.value,
        time: Date.now(),
      })
    );
  } catch {
    /* storage can be unavailable */
  }
}
function markDirty() {
  dirty.value = true;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(persistDraft, 500);
}
function orientedSize(width: number, height: number): [number, number] {
  return orientation.value === 'landscape' ? [height, width] : [width, height];
}
function marginsFit(width: number, height: number, margins = layout.value.margins) {
  return margins.left + margins.right < width && Math.abs(margins.top) + Math.abs(margins.bottom) < height;
}
function applyLayout(value: WordPageLayout) {
  layout.value = value;
  markDirty();
}
function onInput() {
  if (replacing) return;
  updateStats();
  markDirty();
}
function rememberSelection() {
  const selection = window.getSelection();
  if (
    selection?.rangeCount &&
    editorRef.value?.contains(selection.anchorNode) &&
    editorRef.value.contains(selection.focusNode)
  )
    savedRange = selection.getRangeAt(0).cloneRange();
}
function trackSelection() {
  rememberSelection();
  if (!savedRange || !editorRef.value?.contains(window.getSelection()?.anchorNode || null)) return;
  for (const key of ['bold', 'italic', 'underline'] as const) formats[key] = document.queryCommandState(key);
}
function restoreSelection() {
  const editor = editorRef.value;
  if (!editor) return;
  editor.focus();
  const selection = window.getSelection();
  if (savedRange && editor.contains(savedRange.startContainer) && editor.contains(savedRange.endContainer)) {
    selection?.removeAllRanges();
    selection?.addRange(savedRange);
  } else {
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
    savedRange = range;
  }
}
function exec(command: string, value?: string) {
  if (readOnly.value) return;
  restoreSelection();
  const result = document.execCommand(command, false, value);
  if (!result && ['copy', 'cut'].includes(command)) report('请使用 Ctrl+C / Ctrl+X');
  else if (!['copy'].includes(command)) onInput();
  rememberSelection();
  trackSelection();
}
function applyFontSize() {
  if (readOnly.value) return;
  restoreSelection();
  document.execCommand('fontSize', false, '7');
  editorRef.value?.querySelectorAll('font[size="7"]').forEach((font) => {
    (font as HTMLElement).style.fontSize = `${fontSize.value}pt`;
    font.removeAttribute('size');
  });
  onInput();
  rememberSelection();
}
function applyParagraphStyle(property: 'lineHeight' | 'marginBottom', value: string) {
  if (readOnly.value) return;
  restoreSelection();
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0);
  let blocks = Array.from(
    editorRef.value!.querySelectorAll<HTMLElement>('p,div,h1,h2,h3,h4,li,blockquote')
  ).filter((el) => range.intersectsNode(el));
  if (!blocks.length) {
    document.execCommand('formatBlock', false, 'p');
    const parent = selection.anchorNode?.parentElement?.closest<HTMLElement>('p,div');
    if (parent && parent !== editorRef.value) blocks = [parent];
  }
  blocks.forEach((el) => {
    el.style[property] = value;
  });
  onInput();
  rememberSelection();
}
function insertHtml(html: string) {
  exec('insertHTML', wordSanitize(html));
}
function insertPageBreak() {
  if (readOnly.value) return;
  restoreSelection();
  const selection = window.getSelection();
  if (
    [selection?.anchorNode, selection?.focusNode].some((node) =>
      (node instanceof Element ? node : node?.parentElement)?.closest('table')
    )
  ) {
    report('请在表格外插入分页符');
    return;
  }
  insertHtml(wordPageBreak);
}
function selectAll() {
  restoreSelection();
  const range = document.createRange();
  range.selectNodeContents(editorRef.value!);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  rememberSelection();
}
async function pasteText() {
  if (readOnly.value) return;
  try {
    const text = await navigator.clipboard.readText();
    insertHtml(wordEscape(text).replace(/\r?\n/g, '<br>'));
  } catch {
    report('请在正文中使用 Ctrl+V 粘贴');
  }
}
function onPaste(event: ClipboardEvent) {
  if (readOnly.value) return;
  event.preventDefault();
  const html = event.clipboardData?.getData('text/html');
  const text = event.clipboardData?.getData('text/plain') || '';
  rememberSelection();
  insertHtml(html || wordEscape(text).replace(/\r?\n/g, '<br>'));
}
function onDrop(event: DragEvent) {
  event.preventDefault();
  report(office.standalone ? '请通过“插入 → 图片”或“文件 → 打开文件”添加文件' : '请通过“插入 → 图片”或“文件 → 从电脑导入”添加文件');
}
function onEditorClick(event: MouseEvent) {
  const anchor = (event.target as HTMLElement).closest('a');
  if (anchor) {
    event.preventDefault();
    if ((event.ctrlKey || event.metaKey) && wordSafeUrl(anchor.href))
      window.open(anchor.href, '_blank', 'noopener,noreferrer');
    else report('按住 Ctrl / ⌘ 并单击可打开链接');
  }
}
function deleteTable() {
  if (readOnly.value) return;
  restoreSelection();
  const table = window.getSelection()?.anchorNode?.parentElement?.closest('table');
  if (!table || !editorRef.value?.contains(table)) return report('请先将光标放入表格');
  const range = document.createRange();
  range.selectNode(table);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  document.execCommand('delete');
  onInput();
  rememberSelection();
}
async function confirmDiscard() {
  if (!dirty.value) return true;
  const result = await office.showMessageBox({
    title: '文档尚未保存',
    message: '保存当前文档后再继续？',
    type: 'question',
    buttons: ['保存', '不保存', '取消'],
  });
  if (result.response === 0) {
    await saveFile();
    return !dirty.value;
  }
  return result.response === 1;
}
async function closeWindow() {
  if (!busy.value && await confirmDiscard()) win?.close();
}
async function createNew() {
  if (!(await confirmDiscard())) return;
  clearTimeout(draftTimer);
  removeDraft();
  filePath.value = '';
  documentName.value = '新建文档';
  layout.value = wordPageLayout();
  setContent('<p><br></p>');
  dirty.value = false;
  activeTab.value = '开始';
}
function setContent(html: string) {
  if (editorRef.value) editorRef.value.innerHTML = wordSanitize(html) || '<p><br></p>';
  savedRange = null;
  updateStats();
}
function setDocument(doc: WordDocument) {
  layout.value = doc.layout;
  setContent(doc.html);
}
function openModal(type: Modal) {
  rememberSelection();
  modal.value = type;
  modalError.value = '';
  modalValue.value = type === 'rename' || type === 'save' ? documentName.value : '';
  linkText.value = window.getSelection()?.toString() || '';
  if (type === 'margins') {
    for (const side of wordMarginSides)
      marginInputs[side] = wordTwipsToMm(layout.value.margins[side]);
  }
  nextTick(() => appRef.value?.querySelector<HTMLInputElement>('.word-modal input')?.focus());
}
function closeModal() {
  modal.value = '';
  modalError.value = '';
}
async function showOpen() {
  if (office.standalone) return importRef.value?.click();
  openModal('open');
  try {
    const files = await office.fs.readdir(desktop());
    desktopFiles.value = files
      .filter((file) => /\.(vtdoc|html?|txt|docx)$/i.test(file.name))
      .map((file) => ({ name: file.name, path: file.path }));
  } catch {
    desktopFiles.value = [];
  }
}
function cleanName(value: string) {
  const name = value.trim().replace(/\.vtdoc$/i, '');
  return name && !/[\\/:*?"<>|]/.test(name) && name !== '.' && name !== '..' ? name : '';
}
async function submitModal() {
  try {
    if (modal.value === 'rename') {
      const name = cleanName(modalValue.value);
      if (!name) throw new Error('请输入有效的文件名');
      documentName.value = name;
      filePath.value = '';
      markDirty();
    }
    if (modal.value === 'save') {
      const name = cleanName(modalValue.value);
      if (!name) throw new Error('请输入有效的文件名');
      const path = desktop(`${name}.vtdoc`);
      const replace = path !== filePath.value && (await office.fs.exists(path));
      if (replace) {
        const answer = await office.showMessageBox({
          title: '替换文件',
          message: `${name}.vtdoc 已存在，是否替换？`,
          buttons: ['替换', '取消'],
          type: 'question',
        });
        if (answer.response !== 0) return;
      }
      await writeFile(path, name);
    }
    if (modal.value === 'open') {
      const path = modalValue.value.trim();
      if (!path) throw new Error('请选择文档');
      if (!(await confirmDiscard())) return;
      await loadFile(path);
    }
    if (modal.value === 'table') {
      const rows = Math.min(30, Math.max(1, Math.floor(tableRows.value)));
      const cols = Math.min(12, Math.max(1, Math.floor(tableCols.value)));
      insertHtml(
        `<table style="border-collapse:collapse;width:100%"><tbody>${Array.from({ length: rows }, () => `<tr>${Array.from({ length: cols }, () => '<td style="border:1px solid #b7c9e2;padding-left:6px;padding-right:6px"><p><br></p></td>').join('')}</tr>`).join('')}</tbody></table><p><br></p>`
      );
    }
    if (modal.value === 'link') {
      const url = modalValue.value.trim();
      if (!wordSafeUrl(url)) throw new Error('请输入 http、https、mailto 或 tel 链接');
      insertHtml(`<a href="${wordEscape(url)}">${wordEscape(linkText.value || url)}</a>`);
    }
    if (modal.value === 'margins') {
      const margins = Object.fromEntries(
        wordMarginSides.map((side) => [side, wordMmToTwips(marginInputs[side])])
      ) as WordMargins;
      if (!marginsFit(layout.value.width, layout.value.height, margins))
        throw new Error('页边距之和必须小于纸张对应的尺寸');
      applyLayout({ ...layout.value, margins });
    }
    closeModal();
    if (activeTab.value === '文件') activeTab.value = '开始';
  } catch (error) {
    modalError.value = error instanceof Error ? error.message : '操作失败';
  }
}
function serializeHtml() {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>${wordEscape(documentName.value)}</title><meta name="vtron-word-layout" content="${wordEscape(JSON.stringify(layout.value))}"><style>${printLayoutCss()}</style></head><body>${wordSanitize(editorRef.value?.innerHTML || '')}</body></html>`;
}
async function writeFile(path: string, name: string) {
  busy.value = true;
  try {
    const snapshot = serializeHtml();
    await office.fs.writeFile(path, snapshot);
    const editedDuringSave = snapshot !== serializeHtml();
    filePath.value = path;
    documentName.value = name;
    dirty.value = editedDuringSave;
    clearTimeout(draftTimer);
    if (editedDuringSave) persistDraft();
    else removeDraft();
    report('已保存到桌面');
    win?.setTitle(`${name} - Word`);
  } finally {
    busy.value = false;
  }
}
function showSaveAs() {
  if (office.standalone) void saveFile(true);
  else openModal('save');
}
async function saveFile(saveAs = false) {
  if (busy.value) return;
  try {
    if (office.standalone) {
      busy.value = true;
      const html = editorRef.value?.innerHTML || '';
      const snapshotLayout = layout.value;
      const name = await saveOfficeDownload(documentName.value, 'docx', saveAs,
        () => wordWriteDocx(html, snapshotLayout));
      if (!name) return;
      documentName.value = name;
      filePath.value = name + '.docx';
      dirty.value = html !== editorRef.value?.innerHTML || snapshotLayout !== layout.value;
      report(`已发起下载 ${filePath.value}`);
      return;
    }
    let path = filePath.value;
    if (!path || !/\.vtdoc$/i.test(path)) {
      path = desktop(`${documentName.value}.vtdoc`);
      let count = 1;
      while (await office.fs.exists(path)) path = desktop(`${documentName.value} (${count++}).vtdoc`);
    }
    await writeFile(
      path,
      path
        .split('/')
        .pop()!
        .replace(/\.vtdoc$/i, '')
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存失败，请检查文件路径';
    report(message);
    office.notifySaveError(message);
  } finally {
    busy.value = false;
  }
}
function decodeText(content: string) {
  if (/^data:/i.test(content)) {
    const index = content.indexOf(',');
    const head = content.slice(0, index);
    const value = content.slice(index + 1);
    return /;base64/i.test(head)
      ? new TextDecoder().decode(Uint8Array.from(atob(value), (char) => char.charCodeAt(0)))
      : decodeURIComponent(value);
  }
  return content;
}
function legacyLayout(margin: number, orientation: string | null | undefined) {
  const twips = [12.7, 25.4, 38.1].includes(margin) ? wordMmToTwips(margin) : 1440;
  return wordPageLayout({
    orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
    margins: { top: twips, right: twips, bottom: twips, left: twips },
  });
}
async function readContent(content: string, name: string): Promise<WordDocument> {
  if (/\.docx$/i.test(name))
    return wordReadDocx(content.startsWith('data:') ? content.slice(content.indexOf(',') + 1) : content);
  const text = decodeText(content);
  if (/\.txt$/i.test(name))
    return { html: `<p>${wordEscape(text).replace(/\r?\n/g, '<br>')}</p>`, layout: wordPageLayout() };
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const margin = Number(doc.querySelector('meta[name="vtron-word-margin"]')?.getAttribute('content'));
  const dir = doc.querySelector('meta[name="vtron-word-orientation"]')?.getAttribute('content');
  const metadata = doc.querySelector('meta[name="vtron-word-layout"]')?.getAttribute('content');
  let page = legacyLayout(margin, dir);
  if (metadata) {
    try {
      page = wordPageLayout(JSON.parse(metadata) || undefined);
    } catch {
      // Keep the legacy layout when the new metadata cannot be read.
    }
  }
  return { html: doc.body.innerHTML, layout: page };
}
async function loadFile(path: string) {
  if (!/\.(vtdoc|html?|txt|docx)$/i.test(path)) throw new Error('支持 VTDOC、DOCX、HTML 和 TXT 文档');
  busy.value = true;
  try {
    const content = await office.fs.readFile(path);
    if (content === null || content === undefined) throw new Error('文件不存在');
    setDocument(await readContent(content, path));
    filePath.value = /\.vtdoc$/i.test(path) ? path : '';
    documentName.value = path
      .split('/')
      .pop()!
      .replace(/\.[^.]+$/, '');
    dirty.value = false;
    activeTab.value = '开始';
    win?.setTitle(`${documentName.value} - Word`);
  } finally {
    busy.value = false;
  }
}
async function importDocument(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || busy.value || !(await confirmDiscard())) return;
  if (file.size > 20 * 1024 * 1024) return report('请选择小于 20 MB 的文档');
  busy.value = true;
  try {
    const doc = /\.docx$/i.test(file.name)
      ? await wordReadDocx(await file.arrayBuffer())
      : await readContent(await file.text(), file.name);
    setDocument(doc);
    documentName.value = file.name.replace(/\.[^.]+$/, '');
    filePath.value = office.standalone ? file.name : '';
    if (office.standalone) dirty.value = false;
    else markDirty();
    activeTab.value = '开始';
    report(office.standalone ? `已打开 ${file.name}` : '已导入，保存后可在桌面打开');
  } catch (error) {
    report(error instanceof Error ? error.message : '导入失败');
  } finally {
    busy.value = false;
  }
}
async function insertImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || readOnly.value) return;
  if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024)
    return report('请选择小于 5 MB 的 PNG、JPEG、GIF 或 WebP 图片');
  const reader = new FileReader();
  reader.onload = () =>
    insertHtml(
      `<img src="${String(reader.result)}" alt="${wordEscape(file.name)}" style="max-width:100%"><p><br></p>`
    );
  reader.readAsDataURL(file);
}
async function exportDocument(type: 'docx' | 'html' | 'txt') {
  try {
    const blob =
      type === 'docx'
        ? await wordWriteDocx(editorRef.value?.innerHTML || '', layout.value)
        : new Blob([type === 'txt' ? currentText() : serializeHtml()], {
            type: type === 'txt' ? 'text/plain;charset=utf-8' : 'text/html;charset=utf-8',
          });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${documentName.value}.${type}`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    report(`已下载 ${type.toUpperCase()}`);
  } catch {
    report('导出失败，请重试');
  }
}
function printLayoutCss() {
  // The final empty block keeps a page break at the end of the document printable.
  return `@page{size:${pageWidth.value}px ${pageHeight.value}px;margin:${pagePaddingCss.value}}
    @media print{body{margin:0}body::after{content:"";display:block}[data-word-page-break]{display:block;break-after:page}}`;
}
function printDocument() {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;opacity:0;pointer-events:none';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><title>${wordEscape(documentName.value)}</title><style>${printLayoutCss()}body{margin:0;font:12pt/1.5 Calibri,"等线",sans-serif;color:#18212f}img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{border:1px solid #aaa;padding:6px}p{margin:0 0 8pt}</style></head><body>${wordSanitize(editorRef.value?.innerHTML || '')}</body></html>`
  );
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 60000);
  }, 300);
}
function fitWidth() {
  zoom.value = Math.max(
    40,
    Math.min(160, Math.floor((((workspaceRef.value?.clientWidth || 800) - 56) / pageWidth.value) * 100))
  );
}
function openSearch(replace: boolean) {
  if (activeTab.value === '文件') activeTab.value = '开始';
  navigationOpen.value = true;
  nextTick(() => navigationRef.value?.openSearch(replace));
}
function closeNavigation() {
  navigationOpen.value = false;
  editorRef.value?.focus({ preventScroll: true });
}
function replaceMatches(ranges: Range[], text: string) {
  if (readOnly.value || !ranges.length) return;
  replacing = true;
  try {
    for (const range of ranges) {
      savedRange = range;
      restoreSelection();
      document.execCommand(text ? 'insertText' : 'delete', false, text);
    }
  } finally {
    replacing = false;
    onInput();
    rememberSelection();
  }
}
function moveInTable(backward: boolean) {
  const selection = window.getSelection();
  const node = selection?.focusNode;
  const parent = node instanceof Element ? node : node?.parentElement;
  const cell = parent?.closest<HTMLTableCellElement>('td,th');
  const table = cell?.closest('table');
  if (!cell || !table || !selection || !editorRef.value?.contains(table)) return false;
  const cells = Array.from(table.rows).flatMap((row) => Array.from(row.cells));
  const index = cells.indexOf(cell);
  let target = cells[index + (backward ? -1 : 1)];
  if (!target && !backward) {
    // Replace the table through the native editing command so adding a row is undoable.
    const copy = table.cloneNode(true) as HTMLTableElement;
    // Carry the last row's column layout across both horizontal and vertical merges.
    const last = copy.rows.length - 1;
    const occupiedUntil: number[] = [];
    const templates: HTMLTableCellElement[] = [];
    Array.from(copy.rows).forEach((row, r) => {
      let c = 0;
      for (const td of Array.from(row.cells)) {
        while (occupiedUntil[c] > r) c++;
        const end = Math.min(copy.rows.length, r + (td.rowSpan || copy.rows.length));
        for (let n = 0; n < td.colSpan; n++) occupiedUntil[c + n] = end;
        if (end > last) templates[c] = td;
        c += td.colSpan;
      }
    });
    const added = copy.insertRow();
    for (const template of templates.filter(Boolean)) {
      const td = added.insertCell();
      td.style.cssText = template.style.cssText;
      td.colSpan = template.colSpan;
      td.innerHTML = '<p><br></p>';
    }
    const tables = Array.from(editorRef.value.querySelectorAll('table'));
    const position = tables.indexOf(table);
    const range = document.createRange();
    range.selectNode(table);
    selection.removeAllRanges();
    selection.addRange(range);
    if (!document.execCommand('insertHTML', false, copy.outerHTML)) return true;
    const updated = editorRef.value.querySelectorAll('table')[position];
    target = updated?.rows[last + 1]?.cells[0];
    onInput();
  }
  if (target) {
    const range = document.createRange();
    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
    rememberSelection();
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  return true;
}
function onKeyDown(event: KeyboardEvent) {
  const mod = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();
  if (
    mod && key === 'enter' && !event.shiftKey && !event.altKey && !event.isComposing &&
    !readOnly.value && editorRef.value?.contains(event.target as Node)
  ) {
    event.preventDefault();
    insertPageBreak();
  } else if (mod && key === 's') {
    event.preventDefault();
    event.shiftKey ? showSaveAs() : saveFile();
  } else if (mod && key === 'f') {
    event.preventDefault();
    openSearch(false);
  } else if (mod && key === 'h') {
    event.preventDefault();
    openSearch(true);
  } else if (mod && key === 'p') {
    event.preventDefault();
    printDocument();
  } else if (mod && key === 'o') {
    event.preventDefault();
    showOpen();
  } else if (event.key === 'Escape') {
    if (modal.value) closeModal();
    else if (navigationOpen.value) closeNavigation();
  } else if (event.key === 'Tab' && !mod && !event.altKey && !readOnly.value && editorRef.value?.contains(event.target as Node)) {
    event.preventDefault();
    if (!moveInTable(event.shiftKey)) exec(event.shiftKey ? 'outdent' : 'indent');
  }
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) {
    persistDraft();
    event.preventDefault();
    event.returnValue = '';
  }
}
onMounted(async () => {
  document.addEventListener('selectionchange', trackSelection);
  window.addEventListener('beforeunload', beforeUnload);
  await nextTick();
  setContent('<p><br></p>');
  const initialPath = office.initialPath;
  if (initialPath) {
    try {
      await loadFile(initialPath);
    } catch {
      report('无法打开文档');
    }
  }
  try {
    const entries = Object.keys(office.drafts || {})
      .filter((key) => key.startsWith('vtron-word-draft:'))
      .map((key) => {
        try {
          return { key, data: JSON.parse(office.drafts?.getItem(key) || '{}') };
        } catch {
          return null;
        }
      })
      .filter((entry) => entry && entry.data.path === initialPath && typeof entry.data.html === 'string')
      .sort((a, b) => b!.data.time - a!.data.time);
    const recovered = entries[0];
    if (recovered) {
      const answer = await office.showMessageBox({
        title: '恢复未保存文档',
        message: `找到“${recovered.data.name || '新建文档'}”的未保存草稿，是否恢复？`,
        buttons: ['恢复', '忽略'],
        type: 'question',
      });
      if (answer.response === 0) {
        setDocument({
          html: recovered.data.html,
          layout: recovered.data.layout
            ? wordPageLayout(recovered.data.layout)
            : legacyLayout(recovered.data.margin, recovered.data.orientation),
        });
        documentName.value = recovered.data.name || '新建文档';
        markDirty();
        removeDraft(recovered.key);
      } else if (answer.response === 1) removeDraft(recovered.key);
    }
  } catch {
    /* unavailable storage */
  }
  editorRef.value?.focus();
});
onBeforeUnmount(() => {
  persistDraft();
  clearTimeout(draftTimer);
  clearTimeout(messageTimer);
  document.removeEventListener('selectionchange', trackSelection);
  window.removeEventListener('beforeunload', beforeUnload);
});
</script>

<style scoped>
.word-app {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f0f2f4;
  color: #252b33;
  font:
    12px/1.4 'Segoe UI',
    'Microsoft YaHei',
    sans-serif;
  position: relative;
  --word-blue: #185abd;
  --word-line: #e1e5eb;
  --word-muted: #667080;
}
.word-app * {
  box-sizing: border-box;
}
.word-app button,
.word-app select,
.word-app input {
  font: inherit;
}
.word-app button {
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  cursor: pointer;
  border-radius: 4px;
  padding: 5px 8px;
  white-space: nowrap;
}
.word-app button:hover {
  background: #e8edf5;
}
.word-app button:active {
  background: #dce5f3;
}
.word-app button:disabled {
  opacity: 0.5;
  cursor: default;
}
.word-app button:focus-visible,
.word-app select:focus-visible,
.word-app input:focus-visible {
  outline: 2px solid #2c75d6;
  outline-offset: -1px;
}
.word-titlebar {
  height: 42px;
  min-height: 42px;
  background: #185abd;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 0 0 15px;
  color: #fff;
}
.word-mark {
  display: grid;
  place-items: center;
  font-size: 19px;
  font-weight: 700;
  width: 26px;
  height: 27px;
  background: #fff;
  color: #185abd;
  border-radius: 2px;
}
.word-titlebar strong {
  font-size: 14px;
  letter-spacing: 0.1px;
  margin-right: 10px;
}
.word-titlebar .quick {
  font-size: 21px;
  line-height: 1;
  width: 30px;
  padding: 3px;
  color: #fff;
}
.word-titlebar button:hover {
  background: #ffffff24;
}
.document-title {
  font-size: 13px !important;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
  color: #fff !important;
  text-align: left;
  margin-left: 10px;
}
.document-title > span {
  margin-left: 14px;
  color: #d5e3fa;
}
.save-state {
  font-size: 11px;
  color: #dce8fb;
  white-space: nowrap;
  margin-left: 3px;
}
.word-tabs {
  height: 35px;
  min-height: 35px;
  background: #f9fafc;
  display: flex;
  gap: 8px;
  padding-left: 15px;
  border-bottom: 1px solid var(--word-line);
}
.word-tabs button {
  position: relative;
  min-width: 50px;
  border-radius: 0;
  padding: 6px 10px;
  color: #434a55;
}
.word-tabs button.active {
  font-weight: 600;
  color: #185abd;
}
.word-tabs button.active:after {
  content: '';
  position: absolute;
  height: 3px;
  bottom: 0;
  left: 10px;
  right: 10px;
  background: #185abd;
  border-radius: 3px 3px 0 0;
}
.word-ribbon {
  display: flex;
  background: #fafbfd;
  border-bottom: 1px solid #d7dce4;
  min-height: 104px;
  height: 104px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 9px 8px 5px;
  gap: 0;
  flex-shrink: 0;
  box-shadow: 0 1px 2px #182b4810;
}
.ribbon-group {
  position: relative;
  flex-shrink: 0;
  padding: 0 11px 17px;
  border-right: 1px solid #dde2ea;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.ribbon-group:last-child {
  border-right: 0;
}
.ribbon-controls,
.tool-row {
  display: flex;
  align-items: center;
  gap: 3px;
}
.ribbon-controls {
  height: 65px;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.stack > button {
  text-align: left;
  padding-block: 1px;
}
.word-ribbon button {
  height: 27px;
  min-width: 26px;
  font-size: 12px;
  padding: 3px 6px;
}
.word-ribbon button.selected {
  background: #dce8fa;
  border-color: #b8d0f5;
}
.word-ribbon select {
  border: 1px solid #d8dfe9;
  border-radius: 3px;
  height: 26px;
  color: #29323e;
  background: #fff;
  max-width: 125px;
  padding: 1px 4px;
}
.word-ribbon .font-size {
  width: 48px;
}
.word-ribbon .large-tool {
  display: flex;
  flex-direction: column;
  gap: 3px;
  height: 64px;
  padding: 5px 10px;
  justify-content: center;
  align-items: center;
}
.large-tool > b {
  font-size: 25px;
  font-weight: 400;
  color: #305d96;
  line-height: 1.2;
}
.group-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 10px;
  color: #707888;
  line-height: 15px;
  pointer-events: none;
}
.color-control {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 27px;
  height: 27px;
  cursor: pointer;
  border-radius: 3px;
}
.color-control:hover {
  background: #e8edf5;
}
.color-control > span {
  font-size: 14px;
  padding: 0 3px;
  line-height: 17px;
}
.color-control input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.align-symbol {
  font-size: 22px;
  line-height: 15px;
  display: block;
}
.justifyRight {
  transform: scaleX(-1);
}
.style-tiles {
  display: flex;
  gap: 5px;
  align-items: center;
  height: 61px;
}
.style-tiles button {
  border: 1px solid #dee4ed;
  border-radius: 2px;
  height: 58px;
  min-width: 64px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 10px;
  background: white;
  gap: 3px;
}
.style-tiles button > span {
  font-size: 16px;
}
.style-tiles .h1 > span {
  font-size: 21px;
  font-weight: 500;
  color: #245d9b;
}
.style-tiles .h2 > span {
  font-size: 17px;
  color: #245d9b;
}
.layout-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 3px 10px;
  font-size: 12px;
}
.layout-field input {
  vertical-align: middle;
  margin-right: 5px;
  accent-color: #185abd;
}
.word-body {
  display: flex;
  flex: 1;
  min-height: 0;
}
.word-workspace {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #edf0f4;
  padding: 12px 28px 40px;
}
.document-spread {
  margin: 0 auto;
  max-width: none;
}
.word-ruler {
  height: 23px;
  display: flex;
  justify-content: space-between;
  border: 1px solid #dce1e8;
  background: #fff;
  color: #7f8893;
  font-size: 9px;
  line-height: 15px;
  margin-bottom: 10px;
  background-image: repeating-linear-gradient(90deg, transparent, transparent 9px, #d4d9df 9px, #d4d9df 10px);
  background-position: 0 17px;
  background-size: 100% 5px;
  background-repeat: no-repeat;
  overflow: hidden;
}
.word-ruler span {
  width: 12px;
  text-align: center;
}
.page-shell {
  background: #fff;
  box-shadow: 0 1px 6px #24355221;
}
.word-page {
  background: #fff;
  transform-origin: top left;
  box-sizing: border-box;
}
.editor-content {
  outline: 0;
  font:
    12pt/1.5 Calibri,
    '等线',
    'Microsoft YaHei',
    sans-serif;
  overflow-wrap: anywhere;
  cursor: text;
  color: #18212f;
  white-space: normal;
}
.editor-content:deep([data-word-page-break]) {
  display: block;
  margin: 8pt 0;
  border-bottom: 1px dashed #a2acb8;
  color: #596778;
  font: 11px/1.5 system-ui, sans-serif;
  text-align: center;
}
.editor-content:deep([data-word-page-break])::before {
  content: '分页符';
}
.editor-content:deep(p) {
  margin: 0 0 8pt;
}
.editor-content:deep(h1) {
  font-size: 26pt;
  font-weight: 500;
  margin: 20pt 0 12pt;
  color: #245d9b;
}
.editor-content:deep(h2) {
  font-size: 20pt;
  font-weight: 500;
  margin: 16pt 0 10pt;
  color: #245d9b;
}
.editor-content:deep(h3) {
  font-size: 16pt;
  font-weight: 500;
  color: #245d9b;
}
.editor-content:deep(table) {
  border-collapse: collapse;
  width: 100%;
  table-layout: fixed;
  margin: 10pt 0;
}
.editor-content:deep(td),
.editor-content:deep(th) {
  border: 1px solid #b7c9e2;
  padding: 6px;
  vertical-align: top;
  min-width: 30px;
}
.editor-content:deep(td p) {
  margin: 0;
}
.editor-content:deep(img) {
  max-width: 100%;
  height: auto;
  vertical-align: middle;
}
.editor-content:deep(a) {
  color: #185abd;
  text-decoration: underline;
}
.editor-content:deep(blockquote) {
  margin-left: 24pt;
  border-left: 3px solid #c9d9ef;
  padding-left: 12pt;
  color: #52657e;
}
.word-status {
  height: 29px;
  min-height: 29px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 14px;
  background: #fbfcfd;
  border-top: 1px solid #dce1e7;
  color: #627083;
  font-size: 11px;
}
.status-message {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.word-status button {
  padding: 0 2px;
  font-size: 14px;
  height: 24px;
  min-width: 20px;
}
.word-status input {
  width: 100px;
  height: 16px;
  accent-color: #185abd;
}
.word-status .zoom-value {
  font-size: 11px;
  min-width: 38px;
}
.hidden-input {
  display: none;
}
.file-panel {
  display: flex;
  gap: 30px;
  flex: 1;
  overflow: auto;
  padding: 28px;
  background: #f7f9fc;
  min-height: 190px;
}
.file-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(100px, 1fr));
  gap: 12px;
  max-width: 650px;
  flex: 1;
  align-content: start;
}
.file-actions button {
  background: #fff;
  border: 1px solid #e0e5ed;
  padding: 16px 12px;
  display: flex;
  align-items: center;
  gap: 11px;
  min-height: 60px;
  text-align: left;
  box-shadow: 0 1px 2px #182b4805;
}
.file-actions button span {
  color: #185abd;
  font-size: 24px;
  line-height: 1;
}
.file-info {
  max-width: 250px;
  overflow-wrap: anywhere;
  padding: 8px 0;
  color: #697687;
}
.file-info h2 {
  font-size: 19px;
  color: #303c4c;
  font-weight: 500;
  margin: 0 0 14px;
}
.file-info p {
  font-size: 12px;
  margin: 8px 0;
}
.file-panel ~ .word-body {
  display: none;
}
.word-modal-backdrop {
  position: absolute;
  inset: 0;
  background: #16283c5e;
  z-index: 20;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}
.word-modal {
  width: 400px;
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  background: white;
  border: 1px solid #d3dce9;
  border-radius: 8px;
  box-shadow: 0 14px 54px #15243b45;
  padding: 20px;
}
.word-modal header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.word-modal h2 {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
}
.word-modal header button {
  font-size: 23px;
  padding: 0 6px;
  line-height: 22px;
}
.word-modal label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 12px 0;
  color: #535f70;
}
.word-modal input {
  width: 100%;
  border: 1px solid #c9d2df;
  border-radius: 4px;
  padding: 8px;
  color: #253448;
  background: #fff;
}
.word-modal footer {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  margin-top: 24px;
}
.word-modal footer button {
  border: 1px solid #cbd4e2;
  min-width: 65px;
}
.word-modal .primary {
  background: #185abd;
  border-color: #185abd;
  color: #fff;
}
.word-modal .primary:hover {
  background: #124b9e;
}
.modal-note {
  font-size: 11px;
  color: #6a7585;
}
.modal-error {
  font-size: 12px;
  color: #bd3030;
}
.table-fields,
.margin-fields {
  display: flex;
  gap: 15px;
}
.table-fields > label,
.margin-fields > label {
  flex: 1;
}
.recent-files {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 180px;
  overflow: auto;
  margin: 8px 0;
}
.recent-files button {
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
}
.recent-files p {
  color: #7c8591;
  text-align: center;
  font-size: 12px;
}
.symbol-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.symbol-grid button {
  font-size: 21px;
  height: 38px;
  border: 1px solid #e1e6ed;
}
.word-app button,
.word-app input,
.word-app select {
  transition: background-color 100ms;
}
.word-app input[type='range'] {
  cursor: pointer;
}
@media (max-width: 700px) {
  .word-titlebar {
    gap: 4px;
    padding: 0 0 0 9px;
  }
  .document-title {
    max-width: 170px;
    margin-left: 2px;
  }
  .save-state {
    display: none;
  }
  .word-tabs {
    padding-left: 5px;
    gap: 1px;
  }
  .word-workspace {
    padding: 10px 18px 30px;
  }
  .word-status {
    gap: 10px;
    padding: 0 8px;
  }
  .word-status input {
    width: 65px;
  }
  .file-panel {
    padding: 15px;
    flex-direction: column;
    gap: 15px;
  }
  .file-actions {
    grid-template-columns: repeat(2, minmax(100px, 1fr));
    flex: none;
  }
  .file-info {
    max-width: 100%;
  }
  .word-status > span:nth-child(2) {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .word-app button,
  .word-app input,
  .word-app select {
    transition: none;
  }
}
</style>

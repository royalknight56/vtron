<template>
  <div ref="appRef" class="vc" :class="{ 'vc-light': theme === 'light' }" @keydown="onKeydown">
    <CodeTitlebar :folder-name="folderName" :menus="menus" :maximized="maximized" @quick-open="showQuickOpen" @minimize="win?.minimize()" @maximize="toggleMaximize" @close="closeWindow" />

    <div class="vc-workbench">
      <nav class="vc-activity" aria-label="侧栏视图">
        <button :class="{ active: sidebarVisible && sidebar === 'files' }" title="资源管理器" aria-label="资源管理器" @click="toggleSidebar('files')"><CodeIcon name="files" /></button>
        <button :class="{ active: sidebarVisible && sidebar === 'search' }" title="在文件中搜索" aria-label="在文件中搜索" @click="toggleSidebar('search')"><CodeIcon name="search" /></button>
        <span></span>
        <button title="切换颜色主题" aria-label="切换颜色主题" @click="toggleTheme"><CodeIcon name="theme" /></button>
      </nav>

      <aside v-show="sidebarVisible" class="vc-sidebar" :style="{ width: sidebarWidth + 'px' }">
        <CodeExplorer v-show="sidebar === 'files'" ref="explorer" :workspace="workspace" :active-id="activeId" :active-path="activeDocument?.path || ''" :dirty-paths="documents.filter(isDirty).map(doc => doc.path)" :locked="saving || preparingRun" :before-remove="beforeRemove" @open="openFromExplorer" @choose-folder="chooseFolder" @terminal="openTerminalAt" @moved="onFileMoved" @removed="onFileRemoved" @status="report" />
        <template v-if="sidebar === 'search'">
          <div class="vc-sidebar-heading"><span>搜索</span><button title="刷新文件" aria-label="刷新文件" @click="refreshFolder"><CodeIcon name="refresh" /></button></div>
          <form class="vc-search-form" @submit.prevent="searchWorkspace"><input v-model="searchTerm" aria-label="搜索文件内容" placeholder="搜索文件内容" /><button :disabled="searching || !searchTerm.trim()" title="搜索" aria-label="执行搜索"><CodeIcon name="search" /></button></form>
          <div class="vc-search-summary">{{ searching ? '正在搜索…' : searchSummary }}</div>
          <div class="vc-search-results"><button v-for="(result, index) in searchResults" :key="result.path + ':' + result.line + ':' + index" :title="result.path" @click="openFile(result.path, result.line)"><strong>{{ basename(result.path) }}<small>:{{ result.line }}</small></strong><span>{{ result.preview }}</span></button></div>
        </template>
      </aside>
      <div v-if="sidebarVisible" class="vc-sash" @mousedown.prevent="startResize"></div>

      <main class="vc-main">
        <div class="vc-tabs" role="tablist" aria-label="打开的文件">
          <div v-for="doc in documents" :key="doc.id" class="vc-tab" :class="{ active: doc.id === activeId }" role="tab" :aria-selected="doc.id === activeId" :title="doc.path || doc.name" tabindex="0" @click="activate(doc.id)" @keydown.enter="activate(doc.id)" @auxclick.middle.prevent="closeDocument(doc)">
            <CodeFileIcon :name="doc.name" /><span class="vc-tab-name">{{ doc.name }}</span><button :aria-label="'关闭 ' + doc.name" :title="isDirty(doc) ? '未保存 · 关闭' : '关闭'" @click.stop="closeDocument(doc)"><span v-if="isDirty(doc)" class="vc-dirty-dot"></span><CodeIcon v-else name="close" /></button>
          </div>
          <button class="vc-new-tab" title="新建文件 (Ctrl+N)" aria-label="新建标签页" @click="newFile"><CodeIcon name="plus" /></button>
        </div>
        <div v-if="activeDocument" class="vc-breadcrumb"><span :title="activeDocument.path">{{ activeDocument.path ? dirname(activeDocument.path).replace(/^\//, '').split('/').join(' › ') + ' › ' : '' }}<strong>{{ activeDocument.name }}</strong></span><button v-if="canRun" class="vc-run-file" title="保存并运行当前 JS 文件 (Ctrl+F5)" aria-label="运行当前 JS 文件" :disabled="saving || preparingRun || terminalBusy" @click="runCurrentFile"><CodeIcon name="run" /></button><button title="保存 (Ctrl+S)" aria-label="保存当前文件" :disabled="saving" @click="saveDocument()"><CodeIcon name="save" /></button><button title="格式化文档" aria-label="格式化文档" @click="surface?.format()"><CodeIcon name="format" /></button><button title="切换终端 (Ctrl+`)" aria-label="切换终端" :class="{ selected: terminalVisible }" @click="toggleTerminal"><CodeIcon name="terminal" /></button></div>
        <div v-if="activeDocument" class="vc-editor-host">
          <CodeSurface ref="surface" :document-id="activeDocument.id" :path="activeDocument.path || activeDocument.name" :value="activeDocument.value" :theme="theme" :target-line="targetLine" :focus-on-mount="focusEditorOnMount" :open-ids="documents.map(doc => doc.id)" @update:value="updateValue" @cursor="cursor = $event" @save="saveDocument()" />
        </div>
        <div v-else class="vc-welcome">
          <img :src="vscodeIcon" alt="" /><h1>VS Code</h1>
          <div class="vc-start-actions"><button @click="newFile"><CodeIcon name="newFile" /><span>新建文件</span><kbd>Ctrl+N</kbd></button><button @click="showQuickOpen"><CodeIcon name="file" /><span>打开文件…</span><kbd>Ctrl+P</kbd></button><button @click="chooseFolder"><CodeIcon name="folderOpen" /><span>打开文件夹…</span></button></div>
          <div v-if="recentFiles.length" class="vc-recent"><h2>最近打开</h2><button v-for="path in recentFiles.slice(0, 5)" :key="path" :title="path" @click="openFile(path)"><span>{{ basename(path) }}</span><small>{{ dirname(path) }}</small></button></div>
        </div>
        <div v-if="terminalVisible" class="vc-terminal-sash" role="separator" aria-label="调整终端高度" aria-orientation="horizontal" @mousedown.prevent="startTerminalResize"></div>
        <CodeTerminal v-if="terminalCreated" v-show="terminalVisible" ref="terminal" :initial-cwd="workspace" :visible="terminalVisible" :theme="theme" :style="{ height: terminalHeight + 'px' }" @hide="terminalVisible = false" @busy="terminalBusy = $event" @command-finished="refreshFolder" />
      </main>
    </div>

    <footer class="vc-status"><button title="打开文件夹" @click="chooseFolder"><CodeIcon name="folder" />{{ folderName }}</button><span class="vc-status-message" role="status">{{ status }}</span><button v-if="decodedBase64 !== undefined" title="兼容桌面拖入的 Base64 文件，点击解码为 UTF-8 文本" @click="decodeBase64">解码 Base64</button><span class="vc-status-right"><span v-if="activeDocument">行 {{ cursor.line }}，列 {{ cursor.column }}</span><span>UTF-8</span><span v-if="activeDocument">{{ activeDocument.value.includes('\r\n') ? 'CRLF' : 'LF' }}</span><span>{{ activeDocument ? languageName(activeDocument.name) : 'VS Code' }}</span></span></footer>

    <div v-if="quickOpen" class="vc-picker-backdrop" @click.self="quickOpen = false"><section class="vc-picker" role="dialog" aria-label="快速打开文件" @keydown.esc.stop="quickOpen = false"><input ref="quickInput" v-model="quickQuery" aria-label="文件名或完整路径" placeholder="输入文件名或完整路径" @keydown.down.prevent="quickIndex = Math.min(quickIndex + 1, quickMatches.length - 1)" @keydown.up.prevent="quickIndex = Math.max(quickIndex - 1, 0)" @keydown.enter.prevent="pickQuickFile" /><div class="vc-picker-list"><button v-for="(file, index) in quickMatches" :key="file.path" :class="{ selected: index === quickIndex }" @click="openFile(file.path); quickOpen = false"><CodeIcon name="file" /><span>{{ file.name }}</span><small>{{ dirname(file.path) }}</small></button><div v-if="!quickMatches.length" class="vc-empty-list">{{ indexing ? '正在读取文件…' : '没有匹配文件' }}</div></div></section></div>
    <div v-if="pathPrompt" class="vc-prompt-backdrop"><form class="vc-prompt" role="dialog" :aria-label="pathPrompt.title" @submit.prevent="finishPrompt(true)" @keydown.esc.prevent.stop="finishPrompt(false)"><h2>{{ pathPrompt.title }}</h2><input ref="pathInput" v-model="pathPrompt.value" aria-label="文件系统路径" autocomplete="off" /><div><button type="button" @click="finishPrompt(false)">取消</button><button class="vc-primary" type="submit">{{ pathPrompt.title === '保存文件' ? '保存' : '打开' }}</button></div></form></div>
    <input ref="importInput" class="vc-hidden" type="file" multiple aria-label="从电脑导入代码文件" @change="importFiles" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { BrowserWindow, System, basename, dirname, join, normalize, type VtronFileWithoutContent } from 'vtron';
import CodeIcon from './CodeIcon.vue';
import CodeTerminal from './CodeTerminal.vue';
import CodeTitlebar from './CodeTitlebar.vue';
import CodeExplorer from './CodeExplorer.vue';
import CodeFileIcon from './CodeFileIcon.vue';
import { isTextFile, languageName, sortedFiles } from './filePresentation';
import { containsPath } from './useCodeExplorer';
import vscodeIcon from '../../assets/vscode.svg';

const CodeSurface = defineAsyncComponent(() => import('./CodeSurface.vue'));
type CodeDocument = { id: string; path: string; name: string; value: string; savedValue: string };
type Surface = { focus(): void; find(): void; replace(): void; undo(): void; redo(): void; format(): void; goToLine(): void; revealLine(line: number): void };
const sys = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');
const appRef = ref<HTMLElement>();
const surface = ref<Surface>();
const focusEditorOnMount = ref(true);
const theme = ref<'dark' | 'light'>(localStorage.getItem('vtron-code-theme') === 'light' ? 'light' : 'dark');
const workspace = ref(join(sys.getConfig('userLocation') || '/C/Users/', 'Desktop'));
const folderName = computed(() => basename(workspace.value) || workspace.value);
const documents = ref<CodeDocument[]>([]);
const activeId = ref('');
const activeDocument = computed(() => documents.value.find(doc => doc.id === activeId.value));
const canRun = computed(() => /\.[cm]?js$/i.test(activeDocument.value?.name || ''));
const terminal = ref<{ focus(): void; clear(): void; runFile(path: string): Promise<boolean>; openAt(path: string): Promise<boolean> }>();
const terminalCreated = ref(false);
const terminalVisible = ref(false);
const terminalHeight = ref(210);
const terminalBusy = ref(false);
const preparingRun = ref(false);
const decodedBase64 = computed(() => {
  const text = activeDocument.value?.value.trim() || '';
  if (text.length < 4 || text.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(text)) return undefined;
  try {
    const value = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(text), char => char.charCodeAt(0)));
    return /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value) ? undefined : value;
  } catch { return undefined; }
});
const cursor = ref({ line: 1, column: 1 });
const targetLine = ref<number>();
const sidebar = ref<'files' | 'search'>('files');
const sidebarVisible = ref(true);
const sidebarWidth = ref(230);
const explorer = ref<{ refresh(): Promise<void>; focusSelected(): void }>();
const status = ref('');
const saving = ref(false);
const maximized = computed(() => win?.isMaximized() ?? false);
const recentFiles = ref<string[]>(readStored('vtron-code-recent', []));
const quickOpen = ref(false);
const quickInput = ref<HTMLInputElement>();
const quickQuery = ref('');
const quickIndex = ref(0);
const indexedFiles = ref<VtronFileWithoutContent[]>([]);
const indexing = ref(false);
const searchTerm = ref('');
const searching = ref(false);
const searchSummary = ref('');
const searchResults = ref<{ path: string; line: number; preview: string }[]>([]);
const pathPrompt = ref<{ title: string; value: string }>();
const pathInput = ref<HTMLInputElement>();
const importInput = ref<HTMLInputElement>();
let resolvePrompt: ((value: string | null) => void) | undefined;
const draftPrefix = `vtron-code-draft:${sys._options.id || 0}:`;
let serial = 0;
let disposed = false;
let draftTimer: ReturnType<typeof setTimeout> | undefined;
let searchVersion = 0;
let resizeCleanup: (() => void) | undefined;
let terminalResizeCleanup: (() => void) | undefined;

const menus = [
  { name: '文件', items: [
    { label: '新建文件', key: 'Ctrl+N', run: newFile },
    { label: '打开文件…', key: 'Ctrl+O', run: showQuickOpen },
    { label: '从电脑导入文件…', key: '', run: () => importInput.value?.click() },
    { label: '打开文件夹…', key: '', run: chooseFolder },
    { label: '保存', key: 'Ctrl+S', run: () => saveDocument() },
    { label: '另存为…', key: 'Ctrl+Shift+S', run: () => saveDocument(activeDocument.value, true) },
    { label: '全部保存', key: '', run: saveAll },
    { label: '下载当前文件', key: '', run: downloadFile },
    { label: '关闭编辑器', key: 'Ctrl+W', run: () => activeDocument.value && closeDocument(activeDocument.value) },
  ] },
  { name: '编辑', items: [
    { label: '撤销', key: 'Ctrl+Z', run: () => surface.value?.undo() },
    { label: '重做', key: 'Ctrl+Shift+Z', run: () => surface.value?.redo() },
    { label: '查找', key: 'Ctrl+F', run: () => surface.value?.find() },
    { label: '替换', key: 'Ctrl+H', run: () => surface.value?.replace() },
    { label: '格式化文档', key: 'Shift+Alt+F', run: () => surface.value?.format() },
    { label: '转到行…', key: 'Ctrl+G', run: () => surface.value?.goToLine() },
    { label: '解码 Base64 文本', key: '', run: decodeBase64 },
  ] },
  { name: '查看', items: [
    { label: '切换侧栏', key: 'Ctrl+B', run: () => { sidebarVisible.value = !sidebarVisible.value; } },
    { label: '在文件中搜索', key: 'Ctrl+Shift+F', run: () => { sidebar.value = 'search'; sidebarVisible.value = true; } },
    { label: '切换颜色主题', key: '', run: toggleTheme },
  ] },
  { name: '终端', items: [
    { label: '显示终端', key: 'Ctrl+`', run: showTerminal },
    { label: '运行当前 JS 文件', key: 'Ctrl+F5', run: runCurrentFile },
    { label: '清空终端', key: '', run: () => terminal.value?.clear() },
    { label: '隐藏终端', key: '', run: () => { terminalVisible.value = false; } },
  ] },
];

const quickMatches = computed(() => {
  const query = quickQuery.value.trim().toLowerCase();
  return indexedFiles.value.filter(file => !query || file.path.toLowerCase().includes(query)).slice(0, 80);
});
watch(quickQuery, () => { quickIndex.value = 0; });
watch(documents, () => { clearTimeout(draftTimer); draftTimer = setTimeout(persistDrafts, 400); }, { deep: true });
watch([activeId, () => activeDocument.value?.value, () => activeDocument.value?.path], () => {
  const doc = activeDocument.value;
  win?.setTitle((doc ? (isDirty(doc) ? '● ' : '') + doc.name + ' — ' : '') + 'VS Code');
});

function readStored<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
function report(message: string) { status.value = message; }
function isDirty(doc: CodeDocument) { return doc.value !== doc.savedValue; }
function toggleMaximize() { maximized.value ? win?.unmaximize() : win?.maximize(); }
function toggleTheme() { theme.value = theme.value === 'dark' ? 'light' : 'dark'; localStorage.setItem('vtron-code-theme', theme.value); }
function toggleSidebar(view: 'files' | 'search') { sidebarVisible.value = sidebar.value !== view || !sidebarVisible.value; sidebar.value = view; }
function activate(id: string, focusEditor = true) { focusEditorOnMount.value = focusEditor; targetLine.value = undefined; activeId.value = id; cursor.value = { line: 1, column: 1 }; if (focusEditor) nextTick(() => surface.value?.focus()); }
function newFile() {
  const id = `untitled-${Date.now()}-${++serial}`;
  documents.value.push({ id, path: '', name: `未命名-${serial}.txt`, value: '', savedValue: '' });
  activate(id);
}
function updateValue(value: string) { if (activeDocument.value) activeDocument.value.value = value; }
async function refreshFolder() { await explorer.value?.refresh(); }
async function chooseFolder() {
  const result = await askPath('打开文件夹', workspace.value);
  if (!result?.trim()) return;
  try {
    const path = resolvePath(result.trim());
    const stat = await sys.fs.stat(path);
    if (!stat?.isDirectory) return report('文件夹不存在');
    workspace.value = path; indexedFiles.value = []; searchVersion++; searching.value = false;
    searchResults.value = []; searchSummary.value = '';
  } catch { report('无法打开文件夹'); }
}
function askPath(title: string, value: string): Promise<string | null> {
  if (pathPrompt.value) return Promise.resolve(null);
  pathPrompt.value = { title, value };
  nextTick(() => { pathInput.value?.focus(); pathInput.value?.select(); });
  return new Promise(resolve => { resolvePrompt = resolve; });
}
function finishPrompt(accept: boolean) {
  const result = accept ? pathPrompt.value?.value || '' : null;
  pathPrompt.value = undefined; resolvePrompt?.(result); resolvePrompt = undefined;
}
function resolvePath(input: string) { return normalize(input.startsWith('/') ? input : join(workspace.value, input)); }
async function openFile(path: string, line?: number, focusEditor = true) {
  if (disposed) return;
  try {
    const existing = documents.value.find(doc => doc.path === path);
    if (existing) activate(existing.id, focusEditor);
    else {
      const stat = await sys.fs.stat(path);
      if (!stat || !stat.isFile) return report('文件不存在');
      if (!isTextFile(stat)) return report('请选择小于 2 MB 的文本或代码文件');
      const value = await sys.fs.readFile(path);
      if (disposed) return;
      if (value === null || !isTextFile(stat, value)) return report('无法作为文本打开此文件');
      const pending = documents.value.find(doc => doc.path === path);
      if (pending) activate(pending.id, focusEditor);
      else {
        documents.value.push({ id: `file-${Date.now()}-${++serial}`, path, name: basename(path), value, savedValue: value });
        activate(documents.value[documents.value.length - 1].id, focusEditor);
      }
    }
    recentFiles.value = [path, ...recentFiles.value.filter(item => item !== path)].slice(0, 12);
    localStorage.setItem('vtron-code-recent', JSON.stringify(recentFiles.value));
    if (line) { targetLine.value = line; await nextTick(); surface.value?.revealLine(line); report(`已打开 ${basename(path)}，第 ${line} 行`); }
    else report('');
  } catch (error) { report(`打开失败：${String(error)}`); }
}
async function openFromExplorer(path: string, focusEditor = false) {
  await openFile(path, undefined, focusEditor);
  if (!focusEditor) explorer.value?.focusSelected();
}
function invalidateFiles() {
  indexedFiles.value = []; searchVersion++; searching.value = false;
  searchResults.value = []; searchSummary.value = '';
}
function onFileMoved(from: string, to: string) {
  const remap = (path: string) => containsPath(from, path) ? to + path.slice(from.length) : path;
  for (const doc of documents.value) if (doc.path && containsPath(from, doc.path)) {
    localStorage.removeItem(draftKey(doc)); doc.path = remap(doc.path); doc.name = basename(doc.path);
  }
  recentFiles.value = [...new Set(recentFiles.value.map(remap))];
  localStorage.setItem('vtron-code-recent', JSON.stringify(recentFiles.value));
  persistDrafts(); invalidateFiles();
}
async function beforeRemove(path: string) {
  if (saving.value || preparingRun.value) return false;
  for (const doc of documents.value.filter(doc => doc.path && containsPath(path, doc.path))) if (!(await mayClose(doc))) return false;
  return true;
}
function onFileRemoved(path: string) {
  const removed = documents.value.filter(doc => doc.path && containsPath(path, doc.path));
  for (const doc of removed) localStorage.removeItem(draftKey(doc));
  documents.value = documents.value.filter(doc => !removed.includes(doc));
  if (!activeDocument.value) activeId.value = documents.value[0]?.id || '';
  recentFiles.value = recentFiles.value.filter(file => !containsPath(path, file));
  localStorage.setItem('vtron-code-recent', JSON.stringify(recentFiles.value));
  invalidateFiles();
}
async function openTerminalAt(path: string) {
  await showTerminal();
  if (!(await terminal.value?.openAt(path))) report('终端正在运行命令，请结束后再切换目录');
}
async function saveDocument(doc = activeDocument.value, saveAs = false): Promise<boolean> {
  if (!doc || saving.value) return false;
  saving.value = true;
  try {
    let path = doc.path;
    if (!path || saveAs) {
      const result = await askPath('保存文件', path || join(workspace.value, doc.name));
      if (!result?.trim()) return false;
      path = resolvePath(result.trim());
      if (documents.value.some(other => other !== doc && other.path === path)) { report('此文件已在另一个标签页打开'); return false; }
    }
    const stat = await sys.fs.stat(path);
    if (stat?.isDirectory) { report('目标是文件夹，请输入文件名'); return false; }
    if (stat) {
      const disk = await sys.fs.readFile(path);
      if ((path !== doc.path || disk !== doc.savedValue) && disk !== doc.value) {
        const answer = await sys.createDialog().showMessageBox({ title: '确认覆盖', message: path === doc.path ? '文件已在其他位置修改，仍要覆盖？' : '文件已存在，是否覆盖？', buttons: ['覆盖', '取消'], type: 'question' });
        if (answer.response !== 0) return false;
      }
    }
    if (!(await sys.fs.stat(dirname(path)))?.isDirectory) { report('父文件夹不存在'); return false; }
    const value = doc.value;
    const oldKey = draftKey(doc);
    await sys.fs.writeFile(path, value);
    doc.path = path; doc.name = basename(path); doc.savedValue = value;
    localStorage.removeItem(oldKey); persistDrafts();
    await refreshFolder(); report(`已保存 ${doc.name}`); return true;
  } catch (error) { report(`保存失败：${String(error)}`); return false; }
  finally { saving.value = false; }
}
async function saveAll() { for (const doc of documents.value) if ((isDirty(doc) || !doc.path) && !(await saveDocument(doc))) return; }
async function mayClose(doc: CodeDocument) {
  if (!isDirty(doc)) return true;
  const answer = await sys.createDialog().showMessageBox({ title: '文件尚未保存', message: `是否保存对 ${doc.name} 的更改？`, buttons: ['保存', '不保存', '取消'], type: 'question' });
  if (answer.response === 0) return (await saveDocument(doc)) && !isDirty(doc);
  return answer.response === 1;
}
async function closeDocument(doc: CodeDocument) {
  if (saving.value || !(await mayClose(doc))) return;
  const index = documents.value.indexOf(doc); documents.value.splice(index, 1); localStorage.removeItem(draftKey(doc));
  if (activeId.value === doc.id) activeId.value = documents.value[Math.min(index, documents.value.length - 1)]?.id || '';
}
async function closeWindow() {
  if (saving.value) return;
  for (const doc of documents.value) if (!(await mayClose(doc))) return;
  for (const doc of documents.value) localStorage.removeItem(draftKey(doc));
  documents.value = []; win?.close();
}
function draftKey(doc: CodeDocument) { return draftPrefix + encodeURIComponent(doc.path || doc.id); }
function persistDrafts() {
  try { for (const doc of documents.value) { const key = draftKey(doc); if (isDirty(doc)) localStorage.setItem(key, JSON.stringify(doc)); else localStorage.removeItem(key); } }
  catch { report('草稿空间不足，请及时保存文件'); }
}
async function restoreDrafts() {
  if (disposed) return;
  const drafts: CodeDocument[] = [];
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key?.startsWith(draftPrefix)) continue;
    const doc = readStored<CodeDocument | null>(key, null);
    if (doc && typeof doc.id === 'string' && typeof doc.name === 'string' && typeof doc.path === 'string' && typeof doc.value === 'string' && typeof doc.savedValue === 'string' && isDirty(doc)) drafts.push(doc);
  }
  if (!drafts.length) return;
  const answer = await sys.createDialog().showMessageBox({ title: '恢复未保存文件', message: `发现 ${drafts.length} 个未保存文件，是否恢复？`, buttons: ['恢复', '丢弃'], type: 'question' });
  if (disposed) return;
  if (answer.response === 0) { documents.value.push(...drafts); activate(drafts[0].id); }
  else if (answer.response === 1) for (const doc of drafts) localStorage.removeItem(draftKey(doc));
}
async function collectFiles(root: string): Promise<VtronFileWithoutContent[]> {
  const list: VtronFileWithoutContent[] = [];
  const visit = async (path: string) => {
    if (disposed) return;
    for (const file of sortedFiles(await sys.fs.readdir(path))) {
      if (file.name === 'node_modules') continue;
      if (file.isDirectory && !file.isSymlink) await visit(file.path);
      else if (file.isFile && isTextFile(file)) list.push(file);
    }
  };
  await visit(root); return list;
}
async function showQuickOpen() {
  quickOpen.value = true; quickQuery.value = ''; quickIndex.value = 0;
  await nextTick(); quickInput.value?.focus(); indexing.value = true;
  try { indexedFiles.value = await collectFiles(workspace.value); }
  catch { report('无法读取工作区文件'); }
  finally { indexing.value = false; }
}
function pickQuickFile() {
  const file = quickMatches.value[quickIndex.value];
  if (file) { openFile(file.path); quickOpen.value = false; }
  else if (quickQuery.value.startsWith('/')) { openFile(resolvePath(quickQuery.value)); quickOpen.value = false; }
}
async function searchWorkspace() {
  const term = searchTerm.value.trim(); if (!term) return;
  const version = ++searchVersion; searching.value = true; searchResults.value = [];
  try {
    const files = await collectFiles(workspace.value);
    const results: typeof searchResults.value = [];
    for (const file of files) {
      if (version !== searchVersion || disposed) return;
      const value = documents.value.find(doc => doc.path === file.path)?.value ?? await sys.fs.readFile(file.path);
      if (value === null || !isTextFile(file, value)) continue;
      value.split(/\r?\n/).forEach((text, index) => { if (text.toLowerCase().includes(term.toLowerCase())) results.push({ path: file.path, line: index + 1, preview: text.trim().slice(0, 180) }); });
    }
    if (version === searchVersion) { searchResults.value = results; searchSummary.value = `${results.length} 个结果 · ${files.length} 个文件`; }
  } catch { report('搜索失败，请检查文件夹是否可访问'); }
  finally { if (version === searchVersion) searching.value = false; }
}
function downloadFile() {
  const doc = activeDocument.value; if (!doc) return;
  const url = URL.createObjectURL(new Blob([doc.value], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = doc.name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function importFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  for (const file of Array.from(input.files || [])) {
    if (!isTextFile(file)) { report(`无法导入 ${file.name}，请选择小于 2 MB 的文本文件`); continue; }
    const value = await file.text();
    if (disposed) return;
    if (!isTextFile(file, value)) { report(`无法作为文本打开 ${file.name}`); continue; }
    const id = `import-${Date.now()}-${++serial}`;
    documents.value.push({ id, path: '', name: file.name, value, savedValue: '' }); activate(id);
    report('已从电脑导入，保存后将写入桌面文件系统');
  }
  input.value = '';
}
function decodeBase64() {
  const doc = activeDocument.value; if (!doc) return;
  if (decodedBase64.value === undefined) return report('当前内容不是有效的 Base64 UTF-8 文本');
  doc.value = decodedBase64.value; report('已解码为 UTF-8 文本，保存后生效');
}
async function showTerminal() {
  terminalCreated.value = true; terminalVisible.value = true;
  await nextTick(); terminal.value?.focus();
}
function toggleTerminal() {
  if (terminalVisible.value) terminalVisible.value = false;
  else void showTerminal();
}
async function runCurrentFile() {
  const doc = activeDocument.value;
  if (!doc || !/\.[cm]?js$/i.test(doc.name)) return report('请选择 JavaScript 文件运行');
  if (preparingRun.value || terminalBusy.value || saving.value) return;
  preparingRun.value = true;
  try {
    if ((!doc.path || isDirty(doc)) && !(await saveDocument(doc))) return;
    if (disposed) return;
    if (isDirty(doc)) return report('文件内容已变化，请保存后再运行');
    await showTerminal();
    await terminal.value?.runFile(doc.path);
  } finally { preparingRun.value = false; }
}
function startTerminalResize(event: MouseEvent) {
  terminalResizeCleanup?.();
  const startY = event.clientY; const height = terminalHeight.value;
  const move = (e: MouseEvent) => { terminalHeight.value = Math.max(120, Math.min(480, (appRef.value?.clientHeight || 700) * 0.6, height + startY - e.clientY)); };
  const end = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', end); terminalResizeCleanup = undefined; };
  terminalResizeCleanup = end; window.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
}
function startResize(event: MouseEvent) {
  resizeCleanup?.(); const startX = event.clientX; const width = sidebarWidth.value;
  const move = (e: MouseEvent) => { sidebarWidth.value = Math.max(170, Math.min(420, (appRef.value?.clientWidth || 1000) * 0.48, width + e.clientX - startX)); };
  const end = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', end); resizeCleanup = undefined; };
  resizeCleanup = end; window.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
}
function onKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || !(event.ctrlKey || event.metaKey)) return;
  if (pathPrompt.value) { event.preventDefault(); return; }
  if (event.code === 'Backquote') { event.preventDefault(); toggleTerminal(); return; }
  if (event.key === 'F5') { event.preventDefault(); void runCurrentFile(); return; }
  if (event.target instanceof Element && event.target.closest('.code-terminal')) return;
  const key = event.key.toLowerCase();
  if (['n', 'o', 'p', 's', 'w', 'b'].includes(key) || (key === 'f' && event.shiftKey)) {
    event.preventDefault(); event.stopPropagation();
    if (key === 'n') newFile();
    if (key === 'o' || key === 'p') showQuickOpen();
    if (key === 's') saveDocument(activeDocument.value, event.shiftKey);
    if (key === 'w' && activeDocument.value) closeDocument(activeDocument.value);
    if (key === 'b') sidebarVisible.value = !sidebarVisible.value;
    if (key === 'f') { sidebar.value = 'search'; sidebarVisible.value = true; }
  }
}
function beforeUnload(event: BeforeUnloadEvent) { persistDrafts(); if (documents.value.some(isDirty)) { event.preventDefault(); event.returnValue = ''; } }
const externalOpen = (_source: unknown, path: string) => { if (typeof path === 'string') openFile(path); };
win?.on('code:open', externalOpen);
onMounted(async () => {
  window.addEventListener('beforeunload', beforeUnload);
  await refreshFolder(); if (disposed) return;
  await restoreDrafts(); if (disposed) return;
  if (win?.config.path && typeof win.config.path === 'string') await openFile(win.config.path);
});
onBeforeUnmount(() => { disposed = true; searchVersion++; finishPrompt(false); clearTimeout(draftTimer); persistDrafts(); resizeCleanup?.(); terminalResizeCleanup?.(); win?.off('code:open', externalOpen); window.removeEventListener('beforeunload', beforeUnload); });
</script>

<style scoped>
.vc { --bg: #1e1e1e; --sidebar: #252526; --activity: #333333; --title: #3c3c3c; --tabs: #252526; --fg: #cccccc; --muted: #969696; --border: #303031; --hover: #2a2d2e; --selected: #37373d; --input: #3c3c3c; --blue: #007acc; --tree-focus: #04395e; --tree-drop: #383b3d; position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; background: var(--bg); color: var(--fg); border-radius: inherit; overflow: hidden; outline: 1px solid #ffffff1a; outline-offset: -1px; font: 13px 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; }
.vc-light { --bg: #ffffff; --sidebar: #f3f3f3; --activity: #2c2c2c; --title: #dddddd; --tabs: #ececec; --fg: #333333; --muted: #6c6c6c; --border: #e4e4e4; --hover: #e8e8e8; --selected: #d6ebff; --input: #ffffff; --tree-focus: #cce8ff; --tree-drop: #d6e5ef; }
.vc * { box-sizing: border-box; }
.vc-hidden { display: none; }
.vc { color-scheme: dark; }.vc-light { color-scheme: light; }
.vc button, .vc input { font: inherit; }
.vc button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0; border: 0; color: inherit; background: transparent; cursor: pointer; }
.vc button:hover { background: var(--hover); }
.vc button:focus-visible, .vc input:focus { outline: 1px solid #007fd4; outline-offset: -1px; }
.vc button:disabled { opacity: .4; cursor: default; }
.vc kbd { color: var(--muted); font: inherit; font-size: 11px; white-space: nowrap; }
.vc-workbench { display: flex; flex: 1; min-height: 0; min-width: 0; }
.vc-activity { display: flex; flex-direction: column; width: 48px; flex-shrink: 0; background: var(--activity); color: #969696; }
.vc-activity > span { flex: 1; }
.vc-activity button { height: 48px; position: relative; }
.vc-activity button svg { width: 23px; height: 23px; }
.vc-activity button:hover, .vc-activity button.active { color: #ffffff; background: transparent; }
.vc-activity button.active::before { content: ''; width: 2px; height: 100%; position: absolute; left: 0; background: #ffffff; }
.vc-sidebar { flex-shrink: 0; display: flex; flex-direction: column; background: var(--sidebar); overflow: hidden; }
.vc-sidebar-heading { height: 36px; padding: 0 12px 0 20px; display: flex; align-items: center; justify-content: space-between; font-size: 11px; }
.vc-sidebar-heading button { width: 24px; height: 24px; }
.vc-sidebar-heading svg { width: 15px; height: 15px; }
.vc-dirty-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.vc-empty-list { padding: 16px; font-size: 12px; color: var(--muted); }
.vc-sash { width: 4px; margin: 0 -2px; z-index: 3; flex-shrink: 0; cursor: ew-resize; }
.vc-sash:hover { background: var(--blue); }
.vc-main { display: flex; flex-direction: column; flex: 1; min-width: 0; min-height: 0; border-left: 1px solid var(--border); }
.vc-tabs { min-height: 35px; height: 35px; background: var(--tabs); display: flex; overflow-x: auto; flex-shrink: 0; scrollbar-width: thin; scrollbar-color: #6665 transparent; }
.vc-tab { display: flex; align-items: center; gap: 7px; padding: 0 8px 0 12px; min-width: 120px; max-width: 230px; height: 35px; flex-shrink: 0; font-size: 12px; cursor: pointer; color: var(--muted); background: var(--tabs); border-right: 1px solid var(--border); border-top: 1px solid transparent; }
.vc-tab.active { background: var(--bg); color: var(--fg); border-top-color: #007acc; }
.vc-tab-name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.vc-tab button { width: 20px; height: 20px; margin-left: auto; border-radius: 3px; }
.vc-tab button svg { width: 13px; height: 13px; }
.vc-new-tab { width: 34px; height: 34px; flex-shrink: 0; }
.vc-new-tab svg { width: 15px; height: 15px; }
.vc-breadcrumb { height: 28px; display: flex; align-items: center; padding: 0 10px 0 18px; gap: 8px; font-size: 12px; flex-shrink: 0; box-shadow: 0 2px 4px #0001; z-index: 1; }
.vc-breadcrumb > span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); }
.vc-breadcrumb strong { font-weight: 400; color: var(--fg); }
.vc-breadcrumb button { width: 22px; height: 22px; }
.vc-breadcrumb svg { width: 15px; height: 15px; }
.vc-breadcrumb .vc-run-file { color: #89d185; }
.vc-light .vc-breadcrumb .vc-run-file { color: #16825d; }
.vc-terminal-sash { height: 4px; margin: -2px 0; cursor: ns-resize; flex-shrink: 0; z-index: 3; }
.vc-terminal-sash:hover { background: var(--blue); }
.vc-editor-host { flex: 1; min-height: 0; min-width: 0; overflow: hidden; position: relative; }
.vc-welcome { flex: 1; min-height: 0; overflow: auto; padding: 38px clamp(20px, 7vw, 80px); }
.vc-welcome > img { width: 66px; height: 66px; opacity: .8; }
.vc-welcome h1 { font-size: 30px; font-weight: 300; margin: 18px 0 24px; color: var(--fg); }
.vc-start-actions { display: flex; flex-direction: column; align-items: flex-start; max-width: 380px; }
.vc-start-actions button { width: 100%; padding: 7px 0; color: #3794ff; justify-content: flex-start; }
.vc-start-actions svg { width: 17px; height: 17px; }
.vc-start-actions kbd { margin-left: auto; }
.vc-recent { margin-top: 32px; max-width: 440px; }
.vc-recent h2 { font-size: 16px; font-weight: 400; margin: 0 0 10px; }
.vc-recent button { width: 100%; justify-content: flex-start; padding: 5px 0; font-size: 12px; text-align: left; }
.vc-recent span { color: #3794ff; flex-shrink: 0; }
.vc-recent small { margin-left: 8px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vc-status { display: flex; align-items: center; height: 22px; flex-shrink: 0; background: #007acc; color: #fff; font-size: 11px; }
.vc-status button { height: 100%; padding: 0 10px; }
.vc-status button:hover { background: #ffffff20; }
.vc-status svg { width: 13px; height: 13px; }
.vc-status-message { flex: 1; min-width: 0; padding-left: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vc-status-right { display: flex; align-items: center; gap: 16px; padding: 0 12px; white-space: nowrap; }
.vc-search-form { display: flex; align-items: center; margin: 0 12px; gap: 5px; }
.vc input { color: var(--fg); background: var(--input); border: 1px solid #8886; padding: 5px 7px; min-width: 0; outline: none; }
.vc-search-form input { width: 100%; font-size: 12px; }
.vc-search-form button { width: 26px; height: 26px; flex-shrink: 0; }
.vc-search-summary { padding: 10px 14px; font-size: 11px; color: var(--muted); }
.vc-search-results { overflow: auto; min-height: 0; }
.vc-search-results button { display: flex; flex-direction: column; align-items: flex-start; width: 100%; text-align: left; padding: 6px 14px; gap: 3px; font-size: 12px; }
.vc-search-results strong { font-weight: 400; }.vc-search-results small { color: var(--muted); }
.vc-search-results button > span { font: 11px Consolas, monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; color: var(--muted); }
.vc-picker-backdrop { position: absolute; inset: 36px 0 22px; z-index: 25; }
.vc-picker { width: min(600px, 90%); margin: 0 auto; background: var(--sidebar); border: 1px solid var(--border); border-radius: 0 0 6px 6px; box-shadow: 0 8px 28px #0008; overflow: hidden; padding: 7px; }
.vc-picker > input { width: 100%; border-color: #007fd4; }
.vc-picker-list { max-height: 300px; overflow: auto; margin-top: 6px; }
.vc-picker-list button { width: 100%; justify-content: flex-start; padding: 5px 7px; gap: 7px; text-align: left; font-size: 12px; }
.vc-picker-list button.selected { background: var(--selected); }
.vc-picker-list svg { width: 14px; height: 14px; }
.vc-picker-list small { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vc-prompt-backdrop { position: absolute; inset: 36px 0 22px; z-index: 50; display: flex; justify-content: center; align-items: flex-start; padding-top: 50px; background: #0005; }
.vc-prompt { width: min(520px, 90%); padding: 20px; background: var(--sidebar); border: 1px solid var(--border); box-shadow: 0 8px 30px #0008; border-radius: 5px; }
.vc-prompt h2 { font-size: 16px; font-weight: 500; margin: 0 0 14px; }.vc-prompt input { width: 100%; }
.vc-prompt > div { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }.vc-prompt button { padding: 5px 18px; background: var(--input); border: 1px solid var(--border); }.vc-prompt .vc-primary { background: #0e639c; color: #fff; }
@media (max-width: 700px) { .vc-status-right { gap: 8px; }.vc-sidebar { max-width: 40%; } }
</style>

<style>
.wintmp_outer.max:has(> .wintmp_main > .vc), .wintmp_outer.fullscreen:has(> .wintmp_main > .vc) { border-radius: 0 !important; box-shadow: none !important; }
.wintmp_outer.max > .wintmp_main > .vc { outline: none; border-radius: 0; }
.wintmp_outer.max:has(> .wintmp_main > .vc) > .win_drag_border { display: none; }
</style>

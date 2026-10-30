<template>
  <div ref="host" class="code-surface" aria-label="代码编辑器"></div>
</template>

<script lang="ts">
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TypeScriptWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Workers are bundled beside the application, so editing also works without a CDN.
(globalThis as typeof globalThis & { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
  getWorker(_moduleId, label) {
    if (label === 'json') return new JsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
    if (label === 'typescript' || label === 'javascript') return new TypeScriptWorker();
    return new EditorWorker();
  },
};

let surfaceSequence = 0;

function languageFor(path: string) {
  const name = path.split('/').pop()?.toLowerCase() || '';
  if (name === 'dockerfile') return 'dockerfile';
  const extension = name.includes('.') ? name.split('.').pop() || '' : '';
  const languages: Record<string, string> = {
    js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
    ts: 'typescript', mts: 'typescript', cts: 'typescript', tsx: 'typescript',
    json: 'json', jsonc: 'json', html: 'html', htm: 'html', vue: 'html', svelte: 'html',
    css: 'css', scss: 'scss', less: 'less', md: 'markdown', markdown: 'markdown',
    py: 'python', sh: 'shell', bash: 'shell', zsh: 'shell', yaml: 'yaml', yml: 'yaml',
    xml: 'xml', svg: 'xml', sql: 'sql', rs: 'rust', go: 'go', java: 'java',
    c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cs: 'csharp', php: 'php',
    rb: 'ruby', lua: 'lua', toml: 'ini', ini: 'ini', conf: 'ini',
    bat: 'bat', cmd: 'bat', ps1: 'powershell', r: 'r', swift: 'swift',
  };
  return languages[extension] || 'plaintext';
}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  documentId: string;
  path: string;
  value: string;
  theme: 'dark' | 'light';
  openIds: string[];
  targetLine?: number;
  focusOnMount?: boolean;
}>();
const emit = defineEmits<{
  (event: 'update:value', value: string): void;
  (event: 'cursor', position: { line: number; column: number }): void;
  (event: 'save'): void;
}>();

const host = ref<HTMLElement>();
const instanceId = ++surfaceSequence;
const models = new Map<string, monaco.editor.ITextModel>();
const views = new Map<string, monaco.editor.ICodeEditorViewState>();
const subscriptions: monaco.IDisposable[] = [];
let editor: monaco.editor.IStandaloneCodeEditor | undefined;
let activeId = '';
let applyingExternalValue = false;

function syncDocument() {
  if (!editor) return;
  if (!props.documentId) {
    if (activeId) {
      const state = editor.saveViewState();
      if (state) views.set(activeId, state);
    }
    editor.setModel(null);
    activeId = '';
    return;
  }

  let model = models.get(props.documentId);
  if (!model) {
    const fileName = props.path.split('/').pop() || 'untitled.txt';
    const uri = monaco.Uri.from({
      scheme: 'inmemory',
      authority: `vtron-code-${instanceId}`,
      path: `/${encodeURIComponent(props.documentId)}/${fileName}`,
    });
    model = monaco.editor.createModel(props.value, languageFor(props.path), uri);
    models.set(props.documentId, model);
  }

  if (activeId !== props.documentId) {
    if (activeId) {
      const state = editor.saveViewState();
      if (state) views.set(activeId, state);
    }
    activeId = props.documentId;
    applyingExternalValue = true;
    try {
      editor.setModel(model);
      const state = views.get(activeId);
      if (state) editor.restoreViewState(state);
    } finally {
      applyingExternalValue = false;
    }
  }

  const language = languageFor(props.path);
  if (model.getLanguageId() !== language) monaco.editor.setModelLanguage(model, language);
  if (model.getValue() !== props.value) {
    applyingExternalValue = true;
    try {
      model.setValue(props.value);
    } finally {
      applyingExternalValue = false;
    }
  }
  reportCursor();
}

function reportCursor() {
  const position = editor?.getPosition();
  emit('cursor', { line: position?.lineNumber || 1, column: position?.column || 1 });
}

function pruneModels() {
  const open = new Set(props.openIds);
  for (const [id, model] of models) {
    if (open.has(id)) continue;
    if (editor?.getModel() === model) {
      editor.setModel(null);
      activeId = '';
    }
    model.dispose();
    models.delete(id);
    views.delete(id);
  }
}

onMounted(() => {
  if (!host.value) return;
  editor = monaco.editor.create(host.value, {
    model: null,
    theme: props.theme === 'dark' ? 'vs-dark' : 'vs',
    automaticLayout: true,
    fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace",
    fontSize: 13,
    lineHeight: 22,
    tabSize: 2,
    insertSpaces: true,
    lineNumbers: 'on',
    minimap: { enabled: true, maxColumn: 80, renderCharacters: false },
    scrollBeyondLastLine: false,
    padding: { top: 12, bottom: 12 },
    bracketPairColorization: { enabled: true },
    folding: true,
    smoothScrolling: true,
    renderWhitespace: 'selection',
    fixedOverflowWidgets: true,
  });
  subscriptions.push(
    editor.onDidChangeModelContent(() => {
      if (
        editor && activeId && !applyingExternalValue && activeId === props.documentId &&
        editor.getModel() === models.get(activeId)
      ) emit('update:value', editor.getValue());
    }),
    editor.onDidChangeCursorPosition(reportCursor),
    editor.addAction({
      id: 'vtron.save',
      label: '保存文件',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => emit('save'),
    })
  );
  syncDocument();
  revealTargetLine();
  if (props.focusOnMount !== false) editor.focus();
});

watch(() => [props.documentId, props.path, props.value], syncDocument);
watch(() => [props.documentId, props.targetLine], revealTargetLine);
watch(() => props.openIds.slice(), pruneModels);
watch(() => props.theme, (theme) => monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs'));

onBeforeUnmount(() => {
  subscriptions.forEach((subscription) => subscription.dispose());
  editor?.dispose();
  models.forEach((model) => model.dispose());
  models.clear();
  views.clear();
});

function focus() { editor?.focus(); }
function find() { editor?.getAction('actions.find')?.run(); }
function replace() { editor?.getAction('editor.action.startFindReplaceAction')?.run(); }
function undo() { editor?.trigger('vtron', 'undo', null); editor?.focus(); }
function redo() { editor?.trigger('vtron', 'redo', null); editor?.focus(); }
async function format() { await editor?.getAction('editor.action.formatDocument')?.run(); }
function goToLine() { editor?.getAction('editor.action.gotoLine')?.run(); }
function revealLine(line: number) {
  const model = editor?.getModel();
  if (!editor || !model || !Number.isFinite(line)) return;
  const lineNumber = Math.max(1, Math.min(model.getLineCount(), Math.trunc(line)));
  editor.setPosition({ lineNumber, column: 1 });
  editor.revealLineInCenter(lineNumber);
  editor.focus();
}
function revealTargetLine() {
  if (props.targetLine !== undefined) revealLine(props.targetLine);
}

defineExpose({ focus, find, replace, undo, redo, format, goToLine, revealLine });
</script>

<style scoped>
.code-surface {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>

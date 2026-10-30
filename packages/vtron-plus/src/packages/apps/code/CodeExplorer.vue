<template>
  <section ref="host" class="code-explorer" aria-label="资源管理器文件树" @keydown="onKeydown" @contextmenu.prevent.stop="showContext($event)" @dragover.prevent.stop="dragOver($event, workspace)" @drop.prevent.stop="drop($event, workspace)" @dragleave="dragLeave">
    <div class="explorer-heading"><span>资源管理器</span><button title="打开文件夹…" aria-label="打开文件夹" @click="emit('chooseFolder')"><CodeIcon name="folderOpen" /></button></div>
    <div class="workspace-heading" :class="{ 'drop-target': dropTarget === workspace }" @contextmenu.prevent.stop="showContext($event)" @dragover.prevent.stop="dragOver($event, workspace)" @drop.prevent.stop="drop($event, workspace)">
      <button class="workspace-name" :title="workspace" :aria-expanded="!collapsed" @click="collapsed = !collapsed; selected = workspace"><CodeIcon name="chevron" :class="{ expanded: !collapsed }" /><strong>{{ folderName }}</strong></button>
      <div class="explorer-actions">
        <button title="新建文件…" aria-label="工作区新建文件" :disabled="busy" @click="beginCreate(false)"><CodeIcon name="newFile" /></button>
        <button title="新建文件夹…" aria-label="新建文件夹" :disabled="busy" @click="beginCreate(true)"><CodeIcon name="newFolder" /></button>
        <button title="刷新资源管理器" aria-label="刷新文件" :disabled="busy || loading" @click="refresh"><CodeIcon name="refresh" /></button>
        <button title="全部折叠" aria-label="全部折叠" @click="expanded.clear()"><CodeIcon name="collapse" /></button>
      </div>
    </div>
    <div ref="tree" class="explorer-tree" role="tree" aria-label="工作区文件" tabindex="0" :aria-busy="loading" :class="{ 'root-drop': dropTarget === workspace }" @click.self="selected = workspace">
      <template v-for="entry in displayEntries" :key="entry.key">
        <form v-if="entry.edit" class="explorer-row explorer-edit" :style="{ paddingLeft: 10 + entry.depth * 16 + 'px' }" @submit.prevent="finishEdit" @click.stop>
          <span class="tree-chevron"></span><CodeIcon v-if="edit?.directory" name="folder" class="folder-icon" /><CodeFileIcon v-else :name="edit?.value || 'file.txt'" />
          <div class="edit-field"><input ref="nameInput" v-model="edit!.value" :aria-label="edit?.kind === 'rename' ? '重命名' : edit?.directory ? '新文件夹名称' : '新文件名称'" :disabled="busy" autocomplete="off" spellcheck="false" @keydown.esc.prevent.stop="cancelEdit" @blur="blurEdit" /><span v-if="edit?.error" class="edit-error" role="alert">{{ edit.error }}</span></div>
        </form>
        <div v-else-if="entry.file" role="treeitem" :aria-label="entry.file.name" :aria-level="entry.depth + 1" :aria-expanded="entry.file.isDirectory ? expanded.has(entry.file.path) : undefined" :aria-selected="selected === entry.file.path" :tabindex="selected === entry.file.path ? 0 : -1" :data-path="entry.file.path" :draggable="!busy && !edit" class="explorer-row" :class="{ selected: selected === entry.file.path, active: activePath === entry.file.path, cut: clipboard?.cut && containsPath(clipboard.path, entry.file.path), 'drop-target': dropTarget === entry.file.path }" :style="{ paddingLeft: 10 + entry.depth * 16 + 'px' }" :title="entry.file.path" @click="openEntry(entry.file)" @dblclick="!entry.file.isDirectory && emit('open', entry.file.path, true)" @contextmenu.prevent.stop="showContext($event, entry.file)" @dragstart.stop="dragStart($event, entry.file)" @dragend="clearDrag" @dragover.prevent.stop="dragOver($event, entry.file.isDirectory ? entry.file.path : entry.file.parentPath)" @drop.prevent.stop="drop($event, entry.file.isDirectory ? entry.file.path : entry.file.parentPath)">
          <CodeIcon v-if="entry.file.isDirectory" name="chevron" class="tree-chevron" :class="{ expanded: expanded.has(entry.file.path) }" /><span v-else class="tree-chevron"></span>
          <CodeIcon v-if="entry.file.isDirectory" :name="expanded.has(entry.file.path) ? 'folderOpen' : 'folder'" class="folder-icon" /><CodeFileIcon v-else :name="entry.file.name" />
          <span class="tree-name">{{ entry.file.name }}</span><span v-if="dirtyPaths.includes(entry.file.path)" class="dirty-dot" title="未保存"></span>
        </div>
      </template>
      <div v-if="!entries.length && !edit && !collapsed" class="empty-list">{{ loading ? '正在读取…' : '文件夹为空' }}</div>
    </div>
    <CodeContextMenu v-if="context" :x="context.x" :y="context.y" :items="context.items" @close="closeContext" />
  </section>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, ref, toRef, watch } from 'vue';
import { basename, dirname, join, type System, type VtronFileWithoutContent } from 'vtron';
import CodeIcon from './CodeIcon.vue';
import CodeFileIcon from './CodeFileIcon.vue';
import CodeContextMenu from './CodeContextMenu.vue';
import { containsPath, useCodeExplorer } from './useCodeExplorer';

const props = defineProps<{ workspace: string; activeId: string; activePath: string; dirtyPaths: string[]; locked: boolean; beforeRemove: (path: string) => Promise<boolean> }>();
const emit = defineEmits<{
  (event: 'open', path: string, focusEditor?: boolean): void;
  (event: 'chooseFolder'): void;
  (event: 'terminal', path: string): void;
  (event: 'moved', from: string, to: string): void;
  (event: 'removed', path: string): void;
  (event: 'status', message: string): void;
}>();
const system = inject<System>('system')!;
const host = ref<HTMLElement>();
const tree = ref<HTMLElement>();
const nameInput = ref<HTMLInputElement[]>();
const model = useCodeExplorer(system, toRef(props, 'workspace'), { status: message => emit('status', message), moved: (from, to) => emit('moved', from, to), removed: path => emit('removed', path) });
const { entries, expanded, selected, loading, busy: modelBusy, collapsed, clipboard, refresh, reveal, toggle, directoryFor, create, rename, paste, move, remove } = model;
const busy = computed(() => modelBusy.value || props.locked);
const folderName = computed(() => basename(props.workspace) || props.workspace);
type Edit = { kind: 'create' | 'rename'; parent: string; path?: string; directory: boolean; value: string; error: string };
const edit = ref<Edit>();
type MenuItem = { label: string; key?: string; disabled?: boolean; separator?: boolean; run: () => void };
const context = ref<{ x: number; y: number; items: MenuItem[] }>();
const dropTarget = ref('');
let draggedPaths: string[] = [];
let expandTimer: ReturnType<typeof setTimeout> | undefined;
const displayEntries = computed(() => {
  const result: { key: string; depth: number; file?: VtronFileWithoutContent; edit?: boolean }[] = entries.value.map(entry => ({ ...entry, key: entry.file.path }));
  if (!edit.value) return result;
  if (edit.value.kind === 'rename') {
    const row = result.find(entry => entry.file?.path === edit.value?.path);
    if (row) { row.edit = true; row.file = undefined; }
  } else {
    const parentIndex = result.findIndex(entry => entry.file?.path === edit.value?.parent);
    result.splice(parentIndex + 1, 0, { key: 'new-entry', depth: parentIndex < 0 ? 0 : result[parentIndex].depth + 1, edit: true });
  }
  return result;
});
watch(() => [props.activeId, props.activePath], ([id, path], previous) => {
  if (!previous || id !== previous[0] || !previous[1]) void reveal(path).catch(error => emit('status', String(error)));
}, { immediate: true });
watch(() => props.workspace, () => { edit.value = undefined; context.value = undefined; clearDrag(); });

function handle(action: () => Promise<unknown>) { void action().catch(error => emit('status', String(error))); }
function closeContext() { context.value = undefined; nextTick(() => { if (document.activeElement === document.body) focusSelected(); }); }
function focusSelected() {
  nextTick(() => {
    const row = Array.from(tree.value?.querySelectorAll<HTMLElement>('[data-path]') || []).find(element => element.dataset.path === selected.value);
    (row || tree.value)?.focus({ preventScroll: true }); row?.scrollIntoView({ block: 'nearest' });
  });
}
function focusName(selectExtension = false) {
  nextTick(() => {
    const input = nameInput.value?.[0]; input?.focus();
    const end = !selectExtension && !edit.value?.directory && (edit.value?.value.lastIndexOf('.') || 0) > 0 ? edit.value!.value.lastIndexOf('.') : edit.value?.value.length;
    input?.setSelectionRange(0, end || 0);
  });
}
async function beginCreate(directory: boolean, path = selected.value) {
  if (busy.value) return;
  context.value = undefined;
  const root = props.workspace;
  try {
    const parent = await directoryFor(path);
    if (parent !== props.workspace) await model.expand(parent);
    if (root !== props.workspace) return;
    collapsed.value = false;
    edit.value = { kind: 'create', parent, directory, value: '', error: '' }; focusName();
  } catch (error) { emit('status', String(error)); }
}
async function beginRename(path = selected.value) {
  if (busy.value || path === props.workspace) return;
  const root = props.workspace;
  const file = await system.fs.stat(path); if (!file) return;
  if (root !== props.workspace) return;
  edit.value = { kind: 'rename', parent: dirname(path), path, directory: file.isDirectory, value: file.name, error: '' }; focusName();
}
async function finishEdit() {
  const pending = edit.value; if (!pending || busy.value) return;
  pending.error = '';
  try {
    const success = pending.kind === 'rename' ? await rename(pending.path!, pending.value) : await create(pending.parent, pending.value, pending.directory);
    if (!success) return;
    edit.value = undefined; focusSelected();
    if (pending.kind === 'create' && !pending.directory) emit('open', join(pending.parent, pending.value), true);
  } catch (error) { pending.error = String(error).replace(/^Error: /, ''); focusName(true); }
}
function cancelEdit() { if (!busy.value) { edit.value = undefined; focusSelected(); } }
function blurEdit() { if (!busy.value) edit.value = undefined; }
function openEntry(file: VtronFileWithoutContent) {
  if (edit.value) return;
  selected.value = file.path;
  if (file.isDirectory) void toggle(file);
  else emit('open', file.path, false);
}
async function requestRemove(path: string) {
  if (busy.value || path === props.workspace) return;
  const answer = await system.createDialog().showMessageBox({ title: '删除', message: `将“${basename(path)}”及其内容移到回收站？`, buttons: ['移到回收站', '取消'], type: 'question' });
  if (answer.response !== 0 || !(await props.beforeRemove(path))) return;
  await remove(path); focusSelected();
}
function setClipboard(path: string, cut: boolean) { clipboard.value = { path, cut }; }
async function copyPath(path: string, relative = false) {
  try { await navigator.clipboard.writeText(relative && containsPath(props.workspace, path) ? path.slice(props.workspace.replace(/\/$/, '').length + 1) || '.' : path); emit('status', '已复制路径'); }
  catch { emit('status', '无法写入剪贴板，请检查浏览器权限'); }
}
function showContext(event: MouseEvent, file?: VtronFileWithoutContent) {
  if (edit.value || busy.value) return;
  const path = file?.path || props.workspace;
  selected.value = path;
  const parent = file && !file.isDirectory ? dirname(path) : path;
  const separator: MenuItem = { label: '', separator: true, run() {} };
  const items: MenuItem[] = [];
  if (file?.isFile) items.push({ label: '打开', key: 'Enter', run: () => emit('open', path, true) }, separator);
  items.push({ label: '新建文件…', run: () => void beginCreate(false, parent) }, { label: '新建文件夹…', run: () => void beginCreate(true, parent) }, separator,
    { label: '在集成终端中打开', run: () => emit('terminal', parent) }, separator);
  if (file) items.push({ label: '剪切', key: 'Ctrl+X', run: () => setClipboard(path, true) }, { label: '复制', key: 'Ctrl+C', run: () => setClipboard(path, false) });
  items.push({ label: '粘贴', key: 'Ctrl+V', disabled: !clipboard.value, run: () => handle(() => paste(parent)) }, separator,
    { label: '复制路径', run: () => void copyPath(path) }, { label: '复制相对路径', run: () => void copyPath(path, true) });
  if (file) items.push(separator, { label: '重命名…', key: 'F2', run: () => handle(() => beginRename(path)) }, { label: '删除', key: 'Delete', run: () => handle(() => requestRemove(path)) });
  else items.push(separator, { label: '刷新', run: () => void refresh() });
  context.value = { x: event.clientX, y: event.clientY, items };
}

function dragStart(event: DragEvent, file: VtronFileWithoutContent) {
  if (busy.value || edit.value || !event.dataTransfer) { event.preventDefault(); return; }
  context.value = undefined; selected.value = file.path; draggedPaths = [file.path];
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('application/x-vtron-code-paths', JSON.stringify(draggedPaths));
  event.dataTransfer.setData('fromobj', 'web'); event.dataTransfer.setData('frompath', JSON.stringify(draggedPaths));
  event.dataTransfer.setData('text/plain', file.path);
}
function acceptsDrag(event: DragEvent) {
  return !busy.value && !edit.value && !!event.dataTransfer && ['application/x-vtron-code-paths', 'frompath'].some(type => event.dataTransfer!.types.includes(type));
}
function canDrop(paths: string[], parent: string) { return paths.every(path => !containsPath(path, parent) && dirname(path) !== parent && path !== props.workspace); }
function dragOver(event: DragEvent, parent: string) {
  if (!acceptsDrag(event) || draggedPaths.length && !canDrop(draggedPaths, parent)) { clearTimeout(expandTimer); if (event.dataTransfer) event.dataTransfer.dropEffect = 'none'; dropTarget.value = ''; return; }
  event.dataTransfer!.dropEffect = 'move';
  if (dropTarget.value === parent) return;
  clearTimeout(expandTimer); dropTarget.value = parent;
  if (parent !== props.workspace && !expanded.has(parent)) expandTimer = setTimeout(() => { handle(() => model.expand(parent)); }, 650);
}
async function drop(event: DragEvent, parent: string) {
  const accepted = acceptsDrag(event);
  const raw = event.dataTransfer?.getData('application/x-vtron-code-paths') || event.dataTransfer?.getData('frompath');
  clearDrag(); if (!accepted || !raw) return;
  try {
    const paths: unknown = JSON.parse(raw);
    if (!Array.isArray(paths) || !paths.length || !paths.every(path => typeof path === 'string' && path.startsWith('/'))) return;
    if (!canDrop(paths, parent)) return emit('status', '不能移到原位置、自身或子文件夹');
    for (const path of paths) if (!paths.some(other => other !== path && containsPath(other, path))) await move(path, join(parent, basename(path)));
    focusSelected();
  } catch (error) { emit('status', `移动失败：${String(error)}`); }
}
function clearDrag() { clearTimeout(expandTimer); dropTarget.value = ''; draggedPaths = []; }
function dragLeave(event: DragEvent) { if (!host.value?.contains(event.relatedTarget as Node | null)) { clearTimeout(expandTimer); dropTarget.value = ''; } }

function onKeydown(event: KeyboardEvent) {
  if (edit.value || context.value || event.target instanceof HTMLInputElement) return;
  const path = selected.value;
  const row = entries.value.find(entry => entry.file.path === path)?.file;
  if ((event.ctrlKey || event.metaKey) && ['c', 'x', 'v'].includes(event.key.toLowerCase())) {
    event.preventDefault(); event.stopPropagation();
    if (event.key.toLowerCase() === 'v') handle(async () => paste(await directoryFor()));
    else if (row) setClipboard(path, event.key.toLowerCase() === 'x');
    return;
  }
  if (event.key === 'F2') { event.preventDefault(); handle(() => beginRename()); }
  else if (event.key === 'Delete') { event.preventDefault(); handle(() => requestRemove(path)); }
  else if (event.key === 'Enter' && row) { event.preventDefault(); row.isDirectory ? void toggle(row) : emit('open', path, true); }
  else if (event.key === 'ContextMenu' || event.shiftKey && event.key === 'F10') {
    event.preventDefault(); const bounds = (event.target as HTMLElement).getBoundingClientRect();
    showContext(new MouseEvent('contextmenu', { clientX: bounds.left + 30, clientY: bounds.bottom }), row);
  } else if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
    event.preventDefault(); const index = entries.value.findIndex(entry => entry.file.path === path);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? entries.value.length - 1 : Math.max(0, Math.min(entries.value.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
    selected.value = entries.value[next]?.file.path || props.workspace; focusSelected();
  } else if (event.key === 'ArrowRight' && row?.isDirectory) {
    event.preventDefault(); if (!expanded.has(path)) handle(() => model.expand(path)); else { selected.value = model.children.value[path]?.[0]?.path || path; focusSelected(); }
  } else if (event.key === 'ArrowLeft' && row) {
    event.preventDefault(); if (expanded.has(path)) expanded.delete(path); else { selected.value = dirname(path); focusSelected(); }
  } else if (event.key === 'Escape') { clipboard.value = undefined; }
}
onBeforeUnmount(clearDrag);
defineExpose({ refresh, reveal, focusSelected, newFile: () => beginCreate(false), newFolder: () => beginCreate(true) });
</script>

<style scoped>
.code-explorer { display: flex; flex: 1; flex-direction: column; min-height: 0; min-width: 0; user-select: none; }
.code-explorer * { box-sizing: border-box; }
.code-explorer button { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 3px; background: transparent; color: inherit; cursor: pointer; font: inherit; }
.code-explorer button:hover { background: var(--hover); }.code-explorer button:disabled { opacity: .4; cursor: default; }
.code-explorer button:focus-visible, .explorer-tree:focus-visible { outline: 1px solid var(--blue); outline-offset: -1px; }
.code-explorer button svg { width: 16px; height: 16px; }
.explorer-heading { display: flex; align-items: center; justify-content: space-between; height: 35px; min-height: 35px; padding: 0 10px 0 20px; font-size: 11px; }
.workspace-heading { display: flex; align-items: center; flex-shrink: 0; height: 24px; padding: 0 6px 0 4px; }
.workspace-heading .workspace-name { flex: 1; min-width: 0; width: auto; height: 24px; justify-content: flex-start; gap: 3px; text-align: left; border-radius: 0; }
.workspace-name svg { width: 14px; height: 14px; }.workspace-name strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; font-weight: 700; }
.explorer-actions { display: flex; gap: 1px; }.expanded { transform: rotate(90deg); }
.explorer-tree { flex: 1; min-height: 0; overflow: auto; padding-bottom: 18px; outline: none; scrollbar-width: thin; scrollbar-color: #7776 transparent; }
.explorer-row { display: flex; align-items: center; position: relative; height: 22px; min-width: 100%; width: max-content; padding-right: 12px; gap: 5px; font-size: 13px; white-space: nowrap; cursor: pointer; outline: none; }
.explorer-row:hover { background: var(--hover); }.explorer-row.selected { background: var(--selected); }
.explorer-tree:focus-within .explorer-row.selected { background: var(--tree-focus, #04395e); }
.explorer-row:focus-visible { outline: 1px solid var(--blue); outline-offset: -1px; }
.explorer-row.cut { opacity: .5; }.tree-chevron { width: 12px; height: 12px; flex-shrink: 0; }.folder-icon { width: 16px; height: 16px; color: #dcb67a; }
.tree-name { overflow: hidden; text-overflow: ellipsis; flex: 1; }.dirty-dot { flex-shrink: 0; width: 6px; height: 6px; margin-left: 8px; border-radius: 50%; background: currentColor; }
.explorer-row.drop-target, .workspace-heading.drop-target { background: var(--tree-drop, #383b3d); outline: 1px solid var(--blue); outline-offset: -1px; }
.explorer-tree.root-drop { box-shadow: inset 0 0 0 1px var(--blue); background: var(--hover); }
.explorer-edit { width: 100%; height: auto; min-height: 22px; padding-right: 8px; cursor: default; align-items: flex-start; }.explorer-edit > svg, .explorer-edit > span { margin-top: 3px; }
.edit-field { flex: 1; min-width: 0; position: relative; }.edit-field input { width: 100%; height: 22px; padding: 0 4px; border: 1px solid var(--blue); border-radius: 0; outline: none; background: var(--input); color: var(--fg); font: inherit; }
.edit-error { display: block; white-space: normal; padding: 4px 6px; border: 1px solid #be1100; border-top: 0; background: var(--sidebar); color: var(--fg); font-size: 12px; line-height: 18px; }
.empty-list { padding: 12px 20px; color: var(--muted); font-size: 12px; }
</style>

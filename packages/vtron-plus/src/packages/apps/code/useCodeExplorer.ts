import { computed, onBeforeUnmount, reactive, ref, watch, type Ref } from 'vue';
import { basename, dirname, join, normalize, moveToRecycleBin, type System, type VtronFileWithoutContent } from 'vtron';
import { sortedFiles } from './filePresentation';

export function containsPath(parent: string, path: string) { return path === parent || path.startsWith(parent.replace(/\/$/, '') + '/'); }

export function useCodeExplorer(system: System, workspace: Ref<string>, events: {
  status(message: string): void;
  moved(from: string, to: string): void;
  removed(path: string): void;
}) {
  const children = ref<Record<string, VtronFileWithoutContent[]>>({});
  const expanded = reactive(new Set<string>());
  const selected = ref(workspace.value);
  const loading = ref(false);
  const busy = ref(false);
  const collapsed = ref(false);
  const clipboard = ref<{ path: string; cut: boolean }>();
  let revision = 0;
  let disposed = false;
  const entries = computed(() => {
    const result: { file: VtronFileWithoutContent; depth: number }[] = [];
    function visit(path: string, depth: number) {
      for (const file of children.value[path] || []) {
        result.push({ file, depth });
        if (file.isDirectory && expanded.has(file.path)) visit(file.path, depth + 1);
      }
    }
    if (!collapsed.value) visit(workspace.value, 0);
    return result;
  });

  async function load(path: string) {
    const version = revision;
    const list = sortedFiles(await system.fs.readdir(path));
    if (!disposed && version === revision) children.value[path] = list;
  }
  async function refresh() {
    const version = ++revision;
    const root = workspace.value;
    loading.value = true;
    try {
      const next: Record<string, VtronFileWithoutContent[]> = { [root]: sortedFiles(await system.fs.readdir(root)) };
      for (const path of [...expanded].sort((a, b) => a.length - b.length)) {
        if (!containsPath(root, path)) continue;
        try { next[path] = sortedFiles(await system.fs.readdir(path)); }
        catch { if (version === revision) expanded.delete(path); }
      }
      if (!disposed && version === revision) children.value = next;
    } catch (error) { events.status(`读取文件夹失败：${String(error)}`); }
    finally { if (version === revision) loading.value = false; }
  }
  async function expand(path: string) { const version = revision; await load(path); if (!disposed && version === revision && containsPath(workspace.value, path)) expanded.add(path); }
  async function toggle(file: VtronFileWithoutContent) {
    selected.value = file.path;
    if (expanded.has(file.path)) expanded.delete(file.path);
    else { try { await expand(file.path); } catch (error) { events.status(`无法打开文件夹：${String(error)}`); } }
  }
  async function reveal(path: string) {
    if (!path || !containsPath(workspace.value, path)) return;
    const root = workspace.value;
    const version = revision;
    selected.value = path;
    collapsed.value = false;
    const parents: string[] = [];
    for (let parent = dirname(path); parent !== root && containsPath(root, parent); parent = dirname(parent)) parents.unshift(parent);
    for (const parent of parents) {
      await expand(parent);
      if (disposed || root !== workspace.value || version !== revision) return;
    }
  }
  async function directoryFor(path = selected.value) {
    const file = await system.fs.stat(path);
    return file?.isDirectory ? path : file ? dirname(path) : workspace.value;
  }
  function validateName(name: string) {
    if (!name.trim() || name === '.' || name === '..' || /[\\/:*?"<>|\x00-\x1f]/.test(name) || /[. ]$/.test(name)) throw new Error('请输入有效的文件名，不能包含路径分隔符或以空格、点结尾');
  }
  async function changed(message: string) {
    system.emitEvent('file.props.edit');
    await refresh();
    events.status(message);
  }
  async function operation(action: () => Promise<void>) {
    if (busy.value) return false;
    busy.value = true;
    try { await action(); return true; }
    catch (error) { events.status(String(error)); throw error; }
    finally { busy.value = false; }
  }
  async function create(parent: string, name: string, directory: boolean) {
    return operation(async () => {
      validateName(name);
      const path = join(parent, name);
      if (await system.fs.stat(path)) throw new Error('同名文件或文件夹已存在');
      if (directory) await system.fs.mkdir(path);
      else await system.fs.writeFile(path, '', { flag: 'wx' });
      if (parent !== workspace.value) expanded.add(parent);
      collapsed.value = false; selected.value = path;
      await changed(`已新建 ${name}`);
    });
  }
  async function move(from: string, to: string) {
    return operation(async () => {
      from = normalize(from); to = normalize(to);
      if (from === to) return;
      if (from === workspace.value || containsPath(from, to)) throw new Error('不能将文件夹移入自身或其子文件夹');
      if (!(await system.fs.stat(from))) throw new Error('源文件已不存在，请刷新文件树');
      if (await system.fs.stat(to)) throw new Error('目标已有同名文件或文件夹');
      await system.fs.rename(from, to, { overwrite: false });
      const remap = (path: string) => containsPath(from, path) ? to + path.slice(from.length) : path;
      const opened = [...expanded].map(remap); expanded.clear(); opened.forEach(path => expanded.add(path));
      if (dirname(to) !== workspace.value) expanded.add(dirname(to));
      selected.value = remap(selected.value);
      if (clipboard.value && containsPath(from, clipboard.value.path)) clipboard.value.path = remap(clipboard.value.path);
      events.moved(from, to);
      await changed(`已移动 ${basename(to)}`);
    });
  }
  async function rename(path: string, name: string) { validateName(name); return move(path, join(dirname(path), name)); }
  async function paste(parent: string) {
    const source = clipboard.value;
    if (!source) return;
    const target = join(parent, basename(source.path));
    if (source.cut) { if (await move(source.path, target)) clipboard.value = undefined; return; }
    return operation(async () => {
      if (containsPath(source.path, target)) throw new Error('不能复制到自身或子文件夹');
      if (!(await system.fs.stat(source.path))) throw new Error('源文件已不存在');
      if (await system.fs.stat(target)) throw new Error('目标已有同名文件或文件夹');
      await system.fs.copyFile(source.path, target);
      if (parent !== workspace.value) expanded.add(parent);
      selected.value = target;
      await changed(`已复制 ${basename(target)}`);
    });
  }
  async function remove(path: string) {
    return operation(async () => {
      if (path === workspace.value) throw new Error('不能删除工作区根目录');
      await moveToRecycleBin(system, [path]);
      if (await system.fs.stat(path)) throw new Error('无法移动到回收站，请检查文件权限');
      for (const opened of expanded) if (containsPath(path, opened)) expanded.delete(opened);
      if (clipboard.value && containsPath(path, clipboard.value.path)) clipboard.value = undefined;
      selected.value = dirname(path);
      events.removed(path);
      await changed(`已将 ${basename(path)} 移到回收站`);
    });
  }
  watch(workspace, () => { revision++; children.value = {}; expanded.clear(); selected.value = workspace.value; collapsed.value = false; void refresh(); }, { immediate: true });
  onBeforeUnmount(() => { disposed = true; revision++; });
  return { entries, expanded, selected, children, loading, busy, collapsed, clipboard, refresh, expand, reveal, toggle, directoryFor, create, move, rename, paste, remove };
}

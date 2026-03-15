import * as fspath from '@/packages/util/Path';
import { VtronFileInterface } from './FIleInterface';
import { VtronFile, VtronFileMode, VtronFileWithoutContent } from './FileSystem';

class VtronLocalFileSystem implements VtronFileInterface {
  private static IDB_NAME = 'VtronLocalFSHandles';
  private static IDB_STORE = 'handles';

  private rootHandle: FileSystemDirectoryHandle | null = null;
  private _savedHandle: FileSystemDirectoryHandle | null = null;
  private _resolveReady: ((value: VtronLocalFileSystem) => void) | null = null;
  private _watchMap: Map<RegExp, (path: string, content: string) => void> = new Map();
  private volumeMap: Map<string, VtronFileInterface> = new Map();
  private permissionMap: Map<string, number> = new Map();
  private nextId = 1;
  readonly name = 'Local';
  isFirstRun = true;
  private rootPath: string;

  onerror: (e: any) => void = (e) => {
    console.error('LocalFileSystem error', e);
  };

  constructor(rootPath = '/', handle?: FileSystemDirectoryHandle) {
    this.rootPath = rootPath;
    if (handle) {
      this.rootHandle = handle;
    }
  }

  on(event: 'error', func: (e: any) => void) {
    this.onerror = func;
  }

  setRootHandle(handle: FileSystemDirectoryHandle) {
    this.rootHandle = handle;
    if (this._resolveReady) {
      this._resolveReady(this);
      this._resolveReady = null;
    }
  }

  whenReady(): Promise<VtronLocalFileSystem> {
    if (this.rootHandle) {
      return Promise.resolve(this);
    }
    return new Promise<VtronLocalFileSystem>((resolve) => {
      this._resolveReady = resolve;
    });
  }

  /**
   * 尝试从 IndexedDB 恢复上次选择的目录句柄。
   * 如果浏览器仍然授予了读写权限，则自动恢复，返回 true；
   * 否则返回 false，需要用户调用 openDirectoryPicker()。
   */
  async tryRestore(): Promise<boolean> {
    try {
      const saved = await this.loadHandleFromIDB();
      if (!saved) return false;

      const perm = await (saved as any).queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') {
        this.setRootHandle(saved);
        return true;
      }
      this._savedHandle = saved;
      return false;
    } catch {
      return false;
    }
  }

  /**
   * 必须由用户手势（如点击）触发。
   * 如果有上次保存的句柄，会先尝试 requestPermission 重新授权；
   * 否则弹出目录选择器让用户选择新目录。
   * 选择后自动保存到 IndexedDB。
   */
  async openDirectoryPicker(): Promise<void> {
    if (this._savedHandle) {
      try {
        const perm = await (this._savedHandle as any).requestPermission({ mode: 'readwrite' });
        if (perm === 'granted') {
          this.setRootHandle(this._savedHandle);
          this._savedHandle = null;
          return;
        }
      } catch {
        /* requestPermission failed, fall through to picker */
      }
      this._savedHandle = null;
    }

    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API is not supported in this browser');
    }
    const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
    await this.saveHandleToIDB(handle);
    this.setRootHandle(handle);
  }

  // ---- IndexedDB persistence for FileSystemDirectoryHandle ----

  private openIDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(VtronLocalFileSystem.IDB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(VtronLocalFileSystem.IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async saveHandleToIDB(handle: FileSystemDirectoryHandle): Promise<void> {
    const db = await this.openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VtronLocalFileSystem.IDB_STORE, 'readwrite');
      tx.objectStore(VtronLocalFileSystem.IDB_STORE).put(handle, this.rootPath);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  private async loadHandleFromIDB(): Promise<FileSystemDirectoryHandle | null> {
    const db = await this.openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VtronLocalFileSystem.IDB_STORE, 'readonly');
      const req = tx.objectStore(VtronLocalFileSystem.IDB_STORE).get(this.rootPath);
      req.onsuccess = () => { db.close(); resolve(req.result || null); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  }

  registerWatcher(path: RegExp, callback: (path: string, content: string) => void) {
    this._watchMap.set(path, callback);
  }

  private commitWatch(path: string, content: string) {
    this._watchMap.forEach((callback, reg) => {
      if (reg.test(path)) {
        callback(path, content);
      }
    });
  }

  async serializeFileSystem(): Promise<VtronFile[]> {
    return [];
  }

  async deserializeFileSystem(_files: VtronFile[]): Promise<void> {
    // no-op
  }

  async removeFileSystem(): Promise<void> {
    this.rootHandle = null;
    this.permissionMap.clear();
    this.nextId = 1;
  }

  mountVolume(path: string, volume: VtronFileInterface) {
    this.volumeMap.set(path, volume);
  }

  checkVolumeChild(path: string): VtronFileInterface | undefined {
    let volume: VtronFileInterface | undefined;
    this.volumeMap.forEach((vol, key) => {
      if (fspath.dirname(key) === path) {
        volume = vol;
      }
    });
    return volume;
  }

  checkVolumePath(path: string): VtronFileInterface | undefined {
    if (this.volumeMap.has(path)) {
      return this.volumeMap.get(path);
    }
    let volume: VtronFileInterface | undefined;
    this.volumeMap.forEach((vol, key) => {
      if (fspath.isChildPath(key, path)) {
        volume = vol;
      }
    });
    return volume;
  }

  private beforeGuard<
    T extends {
      [K in keyof VtronFileInterface]-?: VtronFileInterface[K] extends (...args: any) => any ? K : never;
    }[keyof VtronFileInterface] &
      keyof VtronFileInterface,
  >(volume: VtronFileInterface, opt: T, ...args: any[]) {
    return (volume[opt] as (...args: any) => any)(...args);
  }

  // ---- path → FileSystemHandle helpers ----

  private getRelativeSegments(path: string): string[] {
    if (path === this.rootPath) return [];
    const rel = fspath.relative(this.rootPath, path);
    if (!rel || rel === '.' || rel === '') return [];
    return rel.split('/').filter((s) => s.length > 0);
  }

  private async resolveDirectoryHandle(
    path: string,
    create = false
  ): Promise<FileSystemDirectoryHandle | null> {
    if (!this.rootHandle) return null;
    const segments = this.getRelativeSegments(path);
    let current = this.rootHandle;
    for (const seg of segments) {
      try {
        current = await current.getDirectoryHandle(seg, { create });
      } catch {
        return null;
      }
    }
    return current;
  }

  private async resolveFileHandle(path: string, create = false): Promise<FileSystemFileHandle | null> {
    if (!this.rootHandle) return null;
    const parentPath = fspath.dirname(path);
    const fileName = fspath.basename(path);
    const dir = await this.resolveDirectoryHandle(parentPath);
    if (!dir) return null;
    try {
      return await dir.getFileHandle(fileName, { create });
    } catch {
      return null;
    }
  }

  private async getEntryKind(path: string): Promise<'file' | 'directory' | null> {
    if (!this.rootHandle) return null;
    const segments = this.getRelativeSegments(path);
    if (segments.length === 0) return 'directory';

    const parentSegments = segments.slice(0, -1);
    const name = segments[segments.length - 1];

    let parentHandle = this.rootHandle;
    for (const seg of parentSegments) {
      try {
        parentHandle = await parentHandle.getDirectoryHandle(seg);
      } catch {
        return null;
      }
    }

    try {
      await parentHandle.getDirectoryHandle(name);
      return 'directory';
    } catch {
      /* not a directory */
    }
    try {
      await parentHandle.getFileHandle(name);
      return 'file';
    } catch {
      return null;
    }
  }

  private createFileEntry(path: string, kind: 'file' | 'directory', file?: File): VtronFileWithoutContent {
    const mode = this.permissionMap.get(path) ?? 0o777;
    const now = new Date();
    const vtronFile = new VtronFile(path, '', {
      isFile: kind === 'file',
      isDirectory: kind === 'directory',
      size: file?.size ?? 0,
      mtime: file ? new Date(file.lastModified) : now,
      atime: now,
      birthtime: now,
      mode: mode as VtronFileMode,
    });
    (vtronFile as any).id = this.nextId++;
    const { content: _, ...rest } = vtronFile;
    return rest;
  }

  // ---- VtronFileInterface ----

  async readFile(path: string): Promise<string | null> {
    try {
      const volume = this.checkVolumePath(path);
      if (volume) {
        return this.beforeGuard(volume, 'readFile', path);
      }
      const fileHandle = await this.resolveFileHandle(path);
      if (!fileHandle) return null;
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (e: any) {
      this.onerror(e.toString());
      return Promise.reject(e);
    }
  }

  async writeFile(
    path: string,
    data: string,
    opt?: {
      flag?: 'w' | 'a' | 'wx';
    }
  ): Promise<void> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'writeFile', path, data, opt);
    }

    const parentPath = fspath.dirname(path);
    const parentExists = await this.exists(parentPath);
    if (!parentExists) {
      this.onerror('Cannot write file to a non-exist path:' + path);
      return Promise.reject('Cannot write file to a non-exist path:' + path);
    }

    try {
      const kind = await this.getEntryKind(path);

      if (kind === 'directory') {
        return Promise.reject('Cannot write file to a directory');
      }
      if (kind === 'file' && opt?.flag === 'wx') {
        return;
      }
      if (kind === 'file' && opt?.flag === 'a') {
        const handle = await this.resolveFileHandle(path);
        if (handle) {
          const file = await handle.getFile();
          data = (await file.text()) + data;
        }
      }

      const fileHandle = await this.resolveFileHandle(path, true);
      if (!fileHandle) {
        return Promise.reject('Failed to create file: ' + path);
      }
      const writable = await (fileHandle as any).createWritable();
      await writable.write(data);
      await writable.close();
      this.commitWatch(path, data);
    } catch (e: any) {
      this.onerror(e.toString());
      return Promise.reject(e);
    }
  }

  async appendFile(path: string, content: string): Promise<void> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'appendFile', path, content);
    }

    const fileHandle = await this.resolveFileHandle(path);
    if (!fileHandle) {
      this.onerror('File not found');
      return Promise.reject('File not found');
    }

    const file = await fileHandle.getFile();
    const newContent = (await file.text()) + content;

    const writable = await (fileHandle as any).createWritable();
    await writable.write(newContent);
    await writable.close();

    this.commitWatch(path, newContent);
  }

  async readdir(fpath: string): Promise<VtronFileWithoutContent[]> {
    const path = fspath.resolve(fpath);
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'readdir', path);
    }

    const volume2 = this.checkVolumeChild(path);
    let vol: VtronFileWithoutContent[] = [];
    if (volume2) {
      try {
        vol = await this.beforeGuard(volume2, 'readdir', path);
      } catch {
        this.onerror('Failed to read volume directory:' + path);
      }
    }

    const dirHandle = await this.resolveDirectoryHandle(path);
    if (!dirHandle) {
      return [...vol];
    }

    const result: VtronFileWithoutContent[] = [];
    for await (const [name, handle] of (dirHandle as any).entries()) {
      const entryPath = fspath.join(path, name);
      if (handle.kind === 'file') {
        try {
          const file = await (handle as FileSystemFileHandle).getFile();
          result.push(this.createFileEntry(entryPath, 'file', file));
        } catch {
          result.push(this.createFileEntry(entryPath, 'file'));
        }
      } else {
        result.push(this.createFileEntry(entryPath, 'directory'));
      }
    }

    return [...result, ...vol];
  }

  async exists(path: string): Promise<boolean> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      try {
        return this.beforeGuard(volume, 'exists', path);
      } catch {
        this.onerror('Failed to read volume directory:' + path);
      }
    }
    return (await this.getEntryKind(path)) !== null;
  }

  async stat(path: string): Promise<VtronFileWithoutContent | null> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      try {
        return this.beforeGuard(volume, 'stat', path);
      } catch {
        this.onerror('Failed to read volume directory:' + path);
      }
    }

    const kind = await this.getEntryKind(path);
    if (!kind) return null;

    if (kind === 'file') {
      const fileHandle = await this.resolveFileHandle(path);
      if (fileHandle) {
        const file = await fileHandle.getFile();
        return this.createFileEntry(path, 'file', file);
      }
    }
    return this.createFileEntry(path, 'directory');
  }

  async unlink(path: string): Promise<void> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      try {
        return this.beforeGuard(volume, 'unlink', path);
      } catch {
        this.onerror('Failed to unlink volume file:' + path);
      }
    }

    const kind = await this.getEntryKind(path);
    if (!kind) {
      return Promise.reject('File not found');
    }
    if (kind === 'directory') {
      return Promise.reject('Cannot delete a directory');
    }

    const parentPath = fspath.dirname(path);
    const fileName = fspath.basename(path);
    const parentHandle = await this.resolveDirectoryHandle(parentPath);
    if (!parentHandle) {
      return Promise.reject('Parent directory not found');
    }

    await parentHandle.removeEntry(fileName);
    this.commitWatch(path, '');
  }

  async rename(path: string, newPath: string): Promise<void> {
    const volume = this.checkVolumePath(path);
    const volume2 = this.checkVolumePath(newPath);
    if (!!volume && !!volume2) {
      return this.beforeGuard(volume, 'rename', path, newPath);
    } else if ((!!volume && !volume2) || (!volume && !!volume2)) {
      this.onerror('Cannot rename between volumes');
      return Promise.reject('Cannot rename between volumes');
    }

    if (path === newPath) return;
    if (fspath.isChildPath(path, newPath)) {
      this.onerror('Cannot rename to child path');
      return Promise.reject('Cannot rename to child path');
    }

    await this.dfsCopy(path, newPath);
    await this.dfsRemove(path);
    this.commitWatch(path, '');
  }

  private async dfsCopy(srcPath: string, destPath: string): Promise<void> {
    const kind = await this.getEntryKind(srcPath);
    if (!kind) return;

    if (kind === 'file') {
      const fileHandle = await this.resolveFileHandle(srcPath);
      if (!fileHandle) return;
      const file = await fileHandle.getFile();
      const content = await file.text();

      const parentPath = fspath.dirname(destPath);
      await this.resolveDirectoryHandle(parentPath, true);

      const newHandle = await this.resolveFileHandle(destPath, true);
      if (!newHandle) return;
      const writable = await (newHandle as any).createWritable();
      await writable.write(content);
      await writable.close();
    } else {
      await this.resolveDirectoryHandle(destPath, true);

      const srcDir = await this.resolveDirectoryHandle(srcPath);
      if (!srcDir) return;

      for await (const [name] of (srcDir as any).entries()) {
        await this.dfsCopy(fspath.join(srcPath, name), fspath.join(destPath, name));
      }
    }
  }

  private async dfsRemove(path: string): Promise<void> {
    if (path === this.rootPath) return;

    const mode = this.permissionMap.get(path) ?? 0o777;
    if (mode <= 0o111) {
      this.onerror('Cannot delete a readonly file');
      return;
    }

    const parentPath = fspath.dirname(path);
    const name = fspath.basename(path);
    const parentHandle = await this.resolveDirectoryHandle(parentPath);
    if (!parentHandle) return;

    try {
      await parentHandle.removeEntry(name, { recursive: true });
    } catch {
      // entry might already be removed
    }
    this.commitWatch(path, '');
  }

  async rm(path: string): Promise<void> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'rm', path);
    }

    const stats = await this.stat(path);
    if (!stats) {
      this.onerror('File not found');
      return Promise.reject('File not found');
    }
    if (stats.isDirectory) {
      return this.rmdir(path);
    } else {
      return this.unlink(path);
    }
  }

  async rmdir(path: string): Promise<void> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'rmdir', path);
    }
    await this.dfsRemove(path);
  }

  async mkdir(path: string): Promise<void> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'mkdir', path);
    }

    const transedPath = fspath.transformPath(path);
    let parentPath = fspath.dirname(transedPath);
    if (parentPath === '') parentPath = '/';

    const parentExists = await this.exists(parentPath);
    if (!parentExists) {
      this.onerror('Cannot create directory to a non-exist path:' + parentPath);
      return Promise.reject('Cannot create directory to a non-exist path:' + parentPath);
    }

    const alreadyExists = await this.exists(transedPath);
    if (alreadyExists) return;

    const dirHandle = await this.resolveDirectoryHandle(transedPath, true);
    if (!dirHandle) {
      return Promise.reject('Failed to create directory: ' + transedPath);
    }
    this.commitWatch(transedPath, '');
  }

  async copyFile(src: string, dest: string): Promise<void> {
    const volume = this.checkVolumePath(src);
    const volume2 = this.checkVolumePath(dest);

    if (!!volume && !!volume2) {
      return this.beforeGuard(volume, 'copyFile', src, dest);
    } else if ((!!volume && !volume2) || (!volume && !!volume2)) {
      this.onerror('Cannot copyFile between volumes');
      return Promise.reject('Cannot copyFile between volumes');
    }

    await this.dfsCopy(src, dest);
    this.commitWatch(src, '');
  }

  async chmod(path: string, mode: VtronFileMode): Promise<void> {
    const respath = fspath.resolve(path);
    const volume = this.checkVolumePath(respath);
    if (volume) {
      return this.beforeGuard(volume, 'chmod', respath, mode);
    }

    const fileExists = await this.exists(respath);
    if (!fileExists) {
      return Promise.reject('File not found');
    }
    this.permissionMap.set(respath, mode);
  }

  async search(keyword: string): Promise<VtronFileWithoutContent[]> {
    const result: VtronFileWithoutContent[] = [];
    await this.dfsSearch(this.rootPath, keyword, result);
    return result;
  }

  private async dfsSearch(
    dirPath: string,
    keyword: string,
    result: VtronFileWithoutContent[]
  ): Promise<void> {
    const dirHandle = await this.resolveDirectoryHandle(dirPath);
    if (!dirHandle) return;

    for await (const [name, handle] of (dirHandle as any).entries()) {
      const entryPath = fspath.join(dirPath, name);
      if (name.startsWith(keyword)) {
        if (handle.kind === 'file') {
          try {
            const file = await (handle as FileSystemFileHandle).getFile();
            result.push(this.createFileEntry(entryPath, 'file', file));
          } catch {
            result.push(this.createFileEntry(entryPath, 'file'));
          }
        } else {
          result.push(this.createFileEntry(entryPath, 'directory'));
        }
      }
      if (handle.kind === 'directory') {
        await this.dfsSearch(entryPath, keyword, result);
      }
    }
  }
}

export { VtronLocalFileSystem };

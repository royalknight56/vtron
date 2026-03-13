import * as fspath from '@/packages/util/Path';
import { VtronFileInterface } from './FIleInterface';
import { VtronFile, VtronFileMode, VtronFileWithoutContent } from './FileSystem';

class VtronMemoryFileSystem implements VtronFileInterface {
  private files: Map<string, VtronFile> = new Map();
  private _watchMap: Map<RegExp, (path: string, content: string) => void> = new Map();
  private volumeMap: Map<string, VtronFileInterface> = new Map();
  private nextId = 1;
  readonly name = 'Memory';
  isFirstRun = true;

  onerror: (e: any) => void = (e) => {
    console.error('MemoryFileSystem error', e);
  };

  constructor(rootPath = '/') {
    const rootDir = new VtronFile(rootPath, '', {
      mode: 0o111,
      isDirectory: true,
    });
    rootDir.parentPath = rootPath === '/' ? '' : fspath.dirname(rootPath);
    (rootDir as any).id = this.nextId++;
    this.files.set(rootPath, rootDir);
  }

  on(event: 'error', func: (e: any) => void) {
    this.onerror = func;
  }

  whenReady(): Promise<VtronMemoryFileSystem> {
    return Promise.resolve(this);
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
    return Array.from(this.files.values());
  }

  async deserializeFileSystem(files: VtronFile[]): Promise<void> {
    this.files.clear();
    this.nextId = 1;
    for (const file of files) {
      (file as any).id = this.nextId++;
      this.files.set(file.path, file);
    }
  }

  async removeFileSystem(): Promise<void> {
    this.files.clear();
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
  >(volume: VtronFileInterface, opt: T, ...args: Parameters<Required<VtronFileInterface>[T] & ((...args: any) => any)>) {
    return (volume[opt] as (...args: any) => any)(...args);
  }

  private getFilesByParentPath(parentPath: string): VtronFile[] {
    const result: VtronFile[] = [];
    this.files.forEach((file) => {
      if (file.parentPath === parentPath) {
        result.push(file);
      }
    });
    return result;
  }

  async readFile(path: string): Promise<string | null> {
    try {
      const volume = this.checkVolumePath(path);
      if (volume) {
        return this.beforeGuard(volume, 'readFile', path);
      }
      const file = this.files.get(path);
      return file ? file.content : null;
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

    const existing = this.files.get(path);

    if (!existing) {
      const newFile = new VtronFile(path, data, {
        isFile: true,
        size: data.length,
      });
      (newFile as any).id = this.nextId++;
      this.files.set(path, newFile);
      this.commitWatch(path, data);
      return;
    }

    if (existing.isDirectory) {
      return Promise.reject('Cannot write file to a directory');
    }

    if (opt?.flag === 'wx') {
      return;
    }

    if (opt?.flag === 'a') {
      data = existing.content + data;
    }

    existing.content = data;
    existing.size = data.length;
    existing.mtime = new Date();
    this.commitWatch(path, data);
  }

  async appendFile(path: string, content: string): Promise<void> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'appendFile', path, content);
    }

    const file = this.files.get(path);
    if (!file) {
      this.onerror('File not found');
      return Promise.reject('File not found');
    }

    file.content += content;
    file.size = file.content.length;
    file.mtime = new Date();
    this.commitWatch(path, file.content);
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

    const children = this.getFilesByParentPath(path);
    const result: VtronFileWithoutContent[] = children.map((f) => {
      const { content: _, ...rest } = f;
      return rest;
    });

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
    return this.files.has(path);
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

    const file = this.files.get(path);
    if (!file) return null;
    const { content: _, ...rest } = file;
    return rest;
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

    const file = this.files.get(path);
    if (!file) {
      return Promise.reject('File not found');
    }
    if (file.isDirectory) {
      return Promise.reject('Cannot delete a directory');
    }

    this.files.delete(path);
    this.commitWatch(path, file.content);
  }

  private dfsRename(filePath: string, newPath: string) {
    const file = this.files.get(filePath);
    if (!file) return;

    if (file.isDirectory) {
      const children = this.getFilesByParentPath(filePath);
      for (const child of children) {
        const childNewPath = fspath.join(newPath, fspath.basename(child.path));
        this.dfsRename(child.path, childNewPath);
      }
    }

    this.files.delete(filePath);
    file.path = newPath;
    file.parentPath = fspath.dirname(newPath);
    file.name = fspath.basename(newPath);
    file.mtime = new Date();
    this.files.set(newPath, file);
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

    if (path === newPath) {
      return;
    }
    if (fspath.isChildPath(path, newPath)) {
      this.onerror('Cannot rename to child path');
      return Promise.reject('Cannot rename to child path');
    }

    const file = this.files.get(path);
    if (file) {
      this.dfsRename(path, newPath);
      this.commitWatch(path, file.content);
    }
  }

  private dfsRmdir(filePath: string) {
    const file = this.files.get(filePath);
    if (!file) return;

    if (file.mode && file.mode <= 0o111) {
      this.onerror('Cannot delete a readonly file');
      return;
    }

    if (file.isDirectory) {
      const children = this.getFilesByParentPath(filePath);
      for (const child of children) {
        this.dfsRmdir(child.path);
      }
    }

    this.files.delete(filePath);
    this.commitWatch(filePath, file.content);
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

    const file = this.files.get(path);
    if (file) {
      this.dfsRmdir(path);
    }
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

    if (this.files.has(transedPath)) {
      return;
    }

    const dir = new VtronFile(transedPath, '', {
      isDirectory: true,
    });
    (dir as any).id = this.nextId++;
    this.files.set(transedPath, dir);
    this.commitWatch(transedPath, '');
  }

  private dfsCopyFile(srcPath: string, destPath: string) {
    const file = this.files.get(srcPath);
    if (!file) return;

    if (file.isDirectory) {
      const children = this.getFilesByParentPath(srcPath);
      for (const child of children) {
        const childDestPath = fspath.join(destPath, fspath.basename(child.path));
        this.dfsCopyFile(child.path, childDestPath);
      }
    }

    const newFile = new VtronFile(destPath, file.content, {
      isFile: file.isFile,
      isDirectory: file.isDirectory,
      isSymlink: file.isSymlink,
      size: file.size,
      mode: file.mode as VtronFileMode,
    });
    (newFile as any).id = this.nextId++;
    this.files.set(destPath, newFile);
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

    const file = this.files.get(src);
    if (file) {
      this.dfsCopyFile(src, dest);
      this.commitWatch(src, file.content);
    }
  }

  async chmod(path: string, mode: VtronFileMode): Promise<void> {
    const respath = fspath.resolve(path);
    const volume = this.checkVolumePath(respath);
    if (volume) {
      return this.beforeGuard(volume, 'chmod', respath, mode);
    }

    const file = this.files.get(respath);
    if (file) {
      file.mode = mode;
      file.mtime = new Date();
    } else {
      return Promise.reject('File not found');
    }
  }

  async search(keyword: string): Promise<VtronFileWithoutContent[]> {
    const result: VtronFileWithoutContent[] = [];
    this.files.forEach((file) => {
      if (file.name.startsWith(keyword)) {
        const { content: _, ...rest } = file;
        result.push(rest);
      }
    });
    return result;
  }
}

export { VtronMemoryFileSystem };

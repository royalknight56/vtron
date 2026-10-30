import { decodeFileBytes, decodeFileText, encodeFileBytes, readFileBytes, writeFileBytes } from './binary';
import * as fspath from '@/packages/util/Path';
import { VtronFileInterface } from './FIleInterface';
import { VtronFile, VtronFileMode, VtronFileWithoutContent } from './FileSystem';
function fileSystemError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

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
  >(volume: VtronFileInterface, opt: T, ...args: any[]) {
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

  async readBinaryFile(path: string): Promise<Uint8Array | null> {
    const volume = this.checkVolumePath(path);
    if (volume) return readFileBytes(volume, path);
    const file = this.files.get(path);
    if (!file) return null;
    if (!file.isFile) throw fileSystemError('EISDIR', 'Cannot read a directory');
    return file.binary === undefined ? new TextEncoder().encode(file.content) : decodeFileBytes(file.binary);
  }
  async writeBinaryFile(path: string, data: Uint8Array, options: { flag?: 'w' | 'a' | 'wx' } = {}): Promise<void> {
    if (!(data instanceof Uint8Array)) throw new TypeError('File bytes must be Uint8Array');
    const volume = this.checkVolumePath(path);
    if (volume) return writeFileBytes(volume, path, data, options);
    const parent = this.files.get(fspath.dirname(path));
    if (!parent) throw fileSystemError('ENOENT', 'Destination parent does not exist');
    if (!parent.isDirectory) throw fileSystemError('ENOTDIR', 'Destination parent is not a directory');
    const previous = this.files.get(path), flag = options.flag ?? 'w';
    if (!['w', 'a', 'wx'].includes(flag)) throw fileSystemError('ERR_NOT_SUPPORTED', 'Unsupported binary write flag');
    if (previous && !previous.isFile) throw fileSystemError('EISDIR', 'Cannot write a non-file');
    if (previous && flag === 'wx') throw fileSystemError('EEXIST', 'File already exists');
    let bytes = data.slice();
    if (previous && flag === 'a') { const old = previous.binary === undefined ? new TextEncoder().encode(previous.content) : decodeFileBytes(previous.binary); bytes = new Uint8Array(old.length + data.length); bytes.set(old); bytes.set(data, old.length); }
    const file = previous ?? new VtronFile(path, '', { isFile: true });
    if (!previous) { (file as any).id = this.nextId++; file.mode = 0o666; }
    file.content = ''; file.binary = encodeFileBytes(bytes); file.size = bytes.length; file.mtime = file.ctime = new Date();
    this.files.set(path, file); this.commitWatch(path, '');
  }

  async readFile(path: string): Promise<string | null> {
    try {
      const volume = this.checkVolumePath(path);
      if (volume) {
        return this.beforeGuard(volume, 'readFile', path);
      }
      const file = this.files.get(path);
      return file ? file.binary === undefined ? file.content : decodeFileText(decodeFileBytes(file.binary)) : null;
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
    if (existing?.binary !== undefined) return this.writeBinaryFile(path, new TextEncoder().encode(data), opt);

    if (!existing) {
      const newFile = new VtronFile(path, data, {
        isFile: true,
        size: new TextEncoder().encode(data).byteLength,
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
    existing.size = new TextEncoder().encode(data).byteLength;
    existing.mtime = existing.ctime = new Date();
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

    if (file.binary !== undefined) return this.writeBinaryFile(path, new TextEncoder().encode(content), { flag: 'a' });
    file.content += content;
    file.size = new TextEncoder().encode(file.content).byteLength;
    file.mtime = file.ctime = new Date();
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
      const { content: _, binary: _binary, ...rest } = f;
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
    if (volume) return this.beforeGuard(volume, 'stat', path);

    const file = this.files.get(path);
    if (!file) return null;
    const { content, binary, ...rest } = file;
    if (rest.isFile) rest.size = binary === undefined ? new TextEncoder().encode(content).byteLength : decodeFileBytes(binary).length;
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
    file.mtime = file.ctime = new Date();
    this.files.set(newPath, file);
  }

  async rename(path: string, newPath: string, options?: { overwrite?: boolean }): Promise<void> {
    const volume = this.checkVolumePath(path);
    const destinationVolume = this.checkVolumePath(newPath);
    if (volume !== destinationVolume) throw fileSystemError('EXDEV', 'Cannot rename between volumes');
    if (volume) return this.beforeGuard(volume, 'rename', path, newPath, options);

    const file = this.files.get(path);
    if (!file) throw fileSystemError('ENOENT', 'File not found: ' + path);
    if (path === newPath) return;
    if (fspath.isChildPath(path, newPath)) throw fileSystemError('EINVAL', 'Cannot rename to child path');
    const parent = this.files.get(fspath.dirname(newPath));
    if (!parent) throw fileSystemError('ENOENT', 'Destination parent not found');
    if (!parent.isDirectory) throw fileSystemError('ENOTDIR', 'Destination parent is not a directory');
    const destination = this.files.get(newPath);
    if (destination && options?.overwrite === false)
      throw fileSystemError('EEXIST', 'Destination already exists');
    if (destination && options?.overwrite === true && (!file.isFile || !destination.isFile)) {
      throw fileSystemError(
        destination.isDirectory ? 'EISDIR' : 'EINVAL',
        'Only regular files can be overwritten'
      );
    }
    this.dfsRename(path, newPath);
    this.commitWatch(path, file.content);
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
    if (file.binary !== undefined) newFile.binary = file.binary;
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
      file.mode = mode; file.ctime = new Date();
      file.mtime = file.ctime = new Date();
    } else {
      return Promise.reject('File not found');
    }
  }

  async search(keyword: string): Promise<VtronFileWithoutContent[]> {
    const result: VtronFileWithoutContent[] = [];
    this.files.forEach((file) => {
      if (file.name.startsWith(keyword)) {
        const { content: _, binary: _binary, ...rest } = file;
        result.push(rest);
      }
    });
    return result;
  }
}

export { VtronMemoryFileSystem };

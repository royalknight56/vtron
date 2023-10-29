import * as fspath from '@feature/core/Path';
import { VtronFileInterface } from './FIleInterface';
type DateLike = Date | string | number;
class VtronFileInfo {
  isFile = true;
  isDirectory = false;
  isSymlink = false;
  size = 0;
  mtime: DateLike = new Date();
  atime: DateLike = new Date();
  birthtime: DateLike = new Date();
  constructor(
    isFile?: boolean,
    isDirectory?: boolean,
    isSymlink?: boolean,
    size?: number,
    mtime?: DateLike,
    atime?: DateLike,
    birthtime?: DateLike
  ) {
    if (isFile !== undefined) {
      this.isFile = isFile;
    }
    if (isDirectory !== undefined) {
      this.isDirectory = isDirectory;
    }
    if (isSymlink !== undefined) {
      this.isSymlink = isSymlink;
    }
    if (size !== undefined) {
      this.size = size;
    }
    if (mtime !== undefined) {
      this.mtime = mtime;
    }
    if (atime !== undefined) {
      this.atime = atime;
    }
    if (birthtime !== undefined) {
      this.birthtime = birthtime;
    }
  }
}

class VtronFile extends VtronFileInfo {
  path: string;
  parentPath: string;
  content: string;
  id?: number;
  constructor(
    path: string,
    // parentPath: string,
    content: string,
    // icon: string, type: string,
    info: Partial<VtronFileInfo>,
    id?: number
  ) {
    if (info.isFile) {
      info.isDirectory = false;
      info.isSymlink = false;
    }
    if (info.isDirectory) {
      info.isFile = false;
      info.isSymlink = false;
    }
    if (info.isSymlink) {
      info.isFile = false;
      info.isDirectory = false;
    }
    super(info.isFile, info.isDirectory, info.isSymlink, info.size, info.mtime, info.atime, info.birthtime);
    this.path = path;
    this.parentPath = fspath.dirname(path);
    this.content = content;
    // this.icon = icon;
    // this.type = type;

    this.id = id;

    if (id === undefined) {
      delete this.id;
    }
  }
}
export type VtronFileWithoutContent = Omit<VtronFile, 'content'>;
class VtronFileSystem implements VtronFileInterface {
  private db!: IDBDatabase;
  private _ready: ((value: VtronFileSystem) => void) | null = null;
  private _watchMap: Map<RegExp, (path: string, content: string) => void> = new Map();

  private volumeMap: Map<string, VtronFileInterface> = new Map();
  constructor(rootPath = '/', id = '') {
    const request = window.indexedDB.open('FileSystemDB' + id, 1);

    request.onerror = () => {
      console.error('Failed to open database');
    };

    request.onsuccess = () => {
      this.db = request.result;
      this._ready?.(this);
    };

    request.onupgradeneeded = () => {
      this.db = request.result;
      const objectStore = this.db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
      objectStore.createIndex('parentPath', 'parentPath');
      objectStore.createIndex('path', 'path', { unique: true });
      const rootDir = new VtronFile(rootPath, '', {
        isDirectory: true,
      });

      rootDir.parentPath = rootPath === '/' ? '' : fspath.dirname(rootPath);
      objectStore.add(rootDir);
    };
  }

  async initFileSystem() {
    await this.whenReady();
    return this;
  }
  serializeFileSystem() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('files', 'readonly');
      const objectStore = transaction.objectStore('files');
      const request = objectStore.getAll();
      request.onerror = () => {
        reject('Failed to read file');
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }
  deserializeFileSystem(files: VtronFile[]) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('files', 'readwrite');
      const objectStore = transaction.objectStore('files');
      const request = objectStore.clear();
      request.onerror = () => {
        reject('Failed to clear file');
      };
      request.onsuccess = () => {
        files.forEach((file) => {
          objectStore.add(file);
        });
        resolve(void 0);
      };
    });
  }
  whenReady(): Promise<VtronFileSystem> {
    if (this.db) {
      return Promise.resolve(this);
    }
    return new Promise<VtronFileSystem>((resolve) => {
      this._ready = resolve;
    });
  }
  registerWatcher(path: RegExp, callback: (path: string, content: string) => void) {
    this._watchMap.set(path, callback);
  }
  commitWatch(path: string, content: string) {
    this._watchMap.forEach((callback, reg) => {
      if (reg.test(path)) {
        callback(path, content);
      }
    });
  }
  async removeFileSystem() {
    window.indexedDB.deleteDatabase('FileSystemDB');
    return Promise.resolve();
  }

  mountVolume(path: string, volume: VtronFileInterface) {
    this.volumeMap.set(path, volume);
  }

  checkVolumeChild(path: string): VtronFileInterface | undefined {
    let volume: VtronFileInterface | undefined;
    this.volumeMap.forEach((volumem, key) => {
      if (fspath.dirname(key) === path) {
        volume = volumem;
      }
    });
    return volume;
  }
  /**
   * 判断指定路径是否为卷的路径
   * @param path
   * @returns
   */
  checkVolumePath(path: string): VtronFileInterface | undefined {
    if (this.volumeMap.has(path)) {
      return this.volumeMap.get(path);
    }
    let volume: VtronFileInterface | undefined;
    this.volumeMap.forEach((volumem, key) => {
      if (fspath.isChildPath(key, path)) {
        volume = volumem;
      }
    });
    return volume;
  }

  /**
   * 使用对应的卷的文件系统
   */
  beforeGuard<T extends keyof VtronFileInterface>(
    volume: VtronFileInterface,
    opt: T,
    ...args: Parameters<VtronFileInterface[T]>
  ) {
    return (volume[opt] as (...args: Parameters<VtronFileInterface[T]>) => ReturnType<VtronFileInterface[T]>)(
      ...args
    );
  }

  /**
   * 读取指定路径的文件内容
   * @param path 文件路径
   * @returns 文件内容
   */
  async readFile(path: string): Promise<string | null> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'readFile', path);
    }

    const transaction = this.db.transaction('files', 'readonly');
    const objectStore = transaction.objectStore('files');

    const index = objectStore.index('path');
    const range = IDBKeyRange.only(path);
    const request = index.get(range);

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        reject('Failed to read file');
      };
      request.onsuccess = () => {
        const file: VtronFile = request.result;
        resolve(file ? file.content : null);
      };
    });
  }

  /**
   * 写入文件内容到指定路径 不存在则创建，存在则覆盖
   * @param path 文件路径
   * @param content 文件内容
   */
  async writeFile(path: string, data: string, opt?: any): Promise<void> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'writeFile', path, data, opt);
    }

    const parentPath = fspath.dirname(path);
    // judge if file exists
    const exists = await this.exists(parentPath);
    if (!exists) {
      return Promise.reject('Cannot write file to a non-exist path:' + path);
    }
    const stat = await this.stat(path);
    const transaction = this.db.transaction('files', 'readwrite');
    const objectStore = transaction.objectStore('files');

    if (!stat) {
      const request = objectStore.add(
        new VtronFile(path, data, {
          isFile: true,
        })
      );
      return new Promise((resolve, reject) => {
        request.onerror = () => {
          console.error('Failed to write file');
          reject('Failed to write file');
        };
        request.onsuccess = () => {
          this.commitWatch(path, data);
          resolve();
        };
      });
    } else {
      const request = objectStore.put(
        new VtronFile(
          path,
          data,
          {
            isFile: true,
          },
          stat.id
        )
      );
      return new Promise((resolve, reject) => {
        request.onerror = () => {
          console.error('Failed to write file');
          reject('Failed to write file');
        };
        request.onsuccess = () => {
          this.commitWatch(path, data);
          resolve();
        };
      });
    }
  }
  async appendFile(path: string, content: string): Promise<void> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'appendFile', path, content);
    }

    const transaction = this.db.transaction('files', 'readwrite');
    const objectStore = transaction.objectStore('files');

    const index = objectStore.index('path');
    const range = IDBKeyRange.only(path);
    const request = index.get(range);

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        console.error('Failed to read file');
        reject('Failed to read file');
      };
      request.onsuccess = () => {
        const file: VtronFile = request.result;
        if (file) {
          file.content += content;
          const request = objectStore.put(file);
          request.onerror = () => {
            console.error('Failed to write file');
            reject('Failed to write file');
          };
          request.onsuccess = () => {
            this.commitWatch(path, file.content);
            resolve();
          };
        } else {
          console.error('File not found');
          reject('File not found');
        }
      };
    });
  }
  /**
   * 读取指定路径下的所有文件和文件夹
   * @param path 目录路径
   * @returns 文件和文件夹列表
   */
  async readdir(path: string): Promise<VtronFileWithoutContent[]> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'readdir', path);
    }

    const volume2 = this.checkVolumeChild(path);
    let vol: VtronFileWithoutContent[] = [];
    if (volume2) {
      vol = await this.beforeGuard(volume2, 'readdir', path);
    }

    const transaction = this.db.transaction('files', 'readonly');
    const objectStore = transaction.objectStore('files');

    const index = objectStore.index('parentPath');
    const range = IDBKeyRange.only(path);
    const request = index.getAll(range);

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        console.error('Failed to read directory');
        reject('Failed to read directory');
      };
      request.onsuccess = () => {
        const files = request.result;
        resolve([...files, ...vol]);
      };
    });
  }

  async exists(path: string): Promise<boolean> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'exists', path);
    }

    try {
      const transaction = this.db.transaction('files', 'readonly');
      const objectStore = transaction.objectStore('files');

      const index = objectStore.index('path');
      const range = IDBKeyRange.only(path);
      const request = index.getAll(range);

      return new Promise((resolve, reject) => {
        request.onerror = () => {
          console.error('Failed to read file');
          reject('Failed to read file');
        };
        request.onsuccess = () => {
          const fileArray: VtronFile[] = request.result;
          resolve(fileArray.length ? true : false);
        };
      });
    } catch (e) {
      return false;
    }
  }

  async stat(path: string): Promise<VtronFileWithoutContent | null> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'stat', path);
    }

    const transaction = this.db.transaction('files', 'readonly');
    const objectStore = transaction.objectStore('files');

    const index = objectStore.index('path');
    const range = IDBKeyRange.only(path);
    const request = index.get(range);

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        console.error('Failed to read file');
        reject('Failed to read file');
      };
      request.onsuccess = () => {
        const file: VtronFile = request.result;
        resolve(file);
      };
    });
  }

  /**
   * 删除指定路径的文件
   * @param path 文件路径
   */
  async unlink(path: string): Promise<void> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'unlink', path);
    }

    const transaction = this.db.transaction('files', 'readwrite');
    const objectStore = transaction.objectStore('files');

    const index = objectStore.index('path');
    const range = IDBKeyRange.only(path);
    const request = index.get(range);

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        console.error('Failed to delete file');
        reject('Failed to delete file');
      };
      request.onsuccess = () => {
        const file: VtronFile = request.result;
        if (file) {
          if (file.isDirectory) {
            reject('Cannot delete a directory');
          } else {
            objectStore.delete(request.result.id);
            this.commitWatch(path, file.content);
            resolve();
          }
        } else {
          reject('File not found');
        }
      };
    });
  }
  private async dfsRename(vfile: VtronFile, objectStore: IDBObjectStore, newPath: string) {
    if (vfile.isDirectory) {
      objectStore.index('parentPath').openCursor(IDBKeyRange.only(vfile.path)).onsuccess = (event: any) => {
        const cursor: IDBCursorWithValue = event.target.result;
        if (cursor) {
          const tempfile = cursor.value;
          const tempNewPath = fspath.join(newPath, fspath.basename(tempfile.path));
          this.dfsRename(tempfile, objectStore, tempNewPath);
          cursor.continue();
        }
      };
    }
    const vParentPath = fspath.dirname(newPath);
    vfile.path = newPath;
    vfile.parentPath = vParentPath;
    objectStore.put(vfile);
  }
  async rename(path: string, newPath: string): Promise<void> {
    const volume = this.checkVolumePath(path);
    const volume2 = this.checkVolumePath(newPath);
    if (!!volume && !!volume2) {
      return this.beforeGuard(volume, 'rename', path, newPath);
    } else if ((!!volume && !volume2) || (!volume && !!volume2)) {
      return Promise.reject('Cannot rename between volumes');
    }
    // if (volume) {
    //   return this.beforeGuard(volume,'rename', path,newPath);
    // }

    // this.beforeGuard('rename', path, newPath);
    // cannot rename to child path
    // /C/Users /C/Users/Desktop/Users
    if (path === newPath) {
      return Promise.resolve();
    }
    if (fspath.isChildPath(path, newPath)) {
      return Promise.reject('Cannot rename to child path');
    }
    // if (newPath.startsWith(path)) {//bug
    //   return Promise.reject('Cannot rename to child path');
    // }

    const transaction = this.db.transaction('files', 'readwrite');
    const objectStore = transaction.objectStore('files');

    const index = objectStore.index('path');
    const range = IDBKeyRange.only(path);
    const request = index.get(range);

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        reject('Failed to read file');
      };
      request.onsuccess = () => {
        const file: VtronFile = request.result;
        if (file) {
          this.dfsRename(file, objectStore, newPath);
          this.commitWatch(path, file.content);
        }

        resolve();
      };
    });
  }
  private async dfsRmdir(vfile: VtronFile, objectStore: IDBObjectStore) {
    if (vfile.isDirectory) {
      objectStore.index('parentPath').openCursor(IDBKeyRange.only(vfile.path)).onsuccess = (event: any) => {
        const cursor: IDBCursorWithValue = event.target.result;
        if (cursor) {
          const tempfile = cursor.value;
          this.dfsRmdir(tempfile, objectStore);
          cursor.continue();
        }
      };
    }
    objectStore.index('path').openCursor(IDBKeyRange.only(vfile.path)).onsuccess = (event: any) => {
      const cursor: IDBCursorWithValue = event.target.result;
      if (cursor) {
        objectStore.delete(cursor.value.id);
        cursor.continue();
      }
    };
  }
  /**
   * 删除指定路径的文件夹及其内容
   * @param path 文件夹路径
   */
  async rmdir(path: string): Promise<void> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'rmdir', path);
    }

    const transaction = this.db.transaction('files', 'readwrite');
    const objectStore = transaction.objectStore('files');

    const index = objectStore.index('path');
    const range = IDBKeyRange.only(path);
    const request = index.get(range);

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        reject('Failed to read file');
      };
      request.onsuccess = () => {
        const file: VtronFile = request.result;
        if (file) {
          this.dfsRmdir(file, objectStore);
        }
        this.commitWatch(path, file.content);
        resolve();
      };
    });
  }

  /**
   * 创建新的文件夹
   * @param path 文件夹路径
   */
  async mkdir(path: string): Promise<void> {
    const volume = this.checkVolumePath(path);
    if (volume) {
      return this.beforeGuard(volume, 'mkdir', path);
    }

    const transedPath = fspath.transformPath(path);
    let parentPath = fspath.dirname(transedPath);
    if (parentPath === '') parentPath = '/';
    // judge if file exists
    const exists = await this.exists(parentPath);
    if (!exists) {
      console.error('Cannot create directory to a non-exist path:' + parentPath);
      return Promise.reject('Cannot create directory to a non-exist path:' + parentPath);
    }

    const res = await this.exists(transedPath);
    if (res) {
      // console.error("Directory already exists");
      return Promise.resolve();
    }

    const transaction = this.db.transaction('files', 'readwrite');
    const objectStore = transaction.objectStore('files');

    const request = objectStore.add(
      new VtronFile(transedPath, '', {
        isDirectory: true,
      })
    );

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        console.error('Failed to create directory');
        reject('Failed to create directory');
      };
      request.onsuccess = () => {
        this.commitWatch(transedPath, '');
        resolve();
      };
    });
  }

  private async dfsCopFile(vfile: VtronFile, objectStore: IDBObjectStore, newPath: string) {
    if (vfile.isDirectory) {
      objectStore.index('parentPath').openCursor(IDBKeyRange.only(vfile.path)).onsuccess = (event: any) => {
        const cursor: IDBCursorWithValue = event.target.result;
        if (cursor) {
          const tempfile = cursor.value;
          const tempNewPath = fspath.join(newPath, fspath.basename(tempfile.path));
          this.dfsCopFile(tempfile, objectStore, tempNewPath);
          cursor.continue();
        }
      };
    }
    const newFile = {
      ...vfile,
      path: newPath,
      parentPath: fspath.dirname(newPath),
    };
    delete newFile.id;
    objectStore.put(newFile);
  }
  async copyFile(src: string, dest: string): Promise<void> {
    const volume = this.checkVolumePath(src);
    const volume2 = this.checkVolumePath(dest);

    if (!!volume && !!volume2) {
      return this.beforeGuard(volume, 'copyFile', src, dest);
    } else if ((!!volume && !volume2) || (!volume && !!volume2)) {
      return Promise.reject('Cannot copyFile between volumes');
    }

    const transaction = this.db.transaction('files', 'readwrite');
    const objectStore = transaction.objectStore('files');

    const index = objectStore.index('path');
    const range = IDBKeyRange.only(src);
    const request = index.get(range);

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        reject('Failed to read file');
      };
      request.onsuccess = () => {
        const file: VtronFile = request.result;
        if (file) {
          this.dfsCopFile(file, objectStore, dest);
          this.commitWatch(src, file.content);
        }

        resolve();
      };
    });
  }

  // async mountVolume(path: string, volume: string): Promise<void> {}
}

export { VtronFile, VtronFileInfo, VtronFileSystem };

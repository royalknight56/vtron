import { System } from '../system';
import { InitFile, InitFileItem } from './SystemFileConfig';
import { initAppList } from '@packages/hook/useAppOpen';
import * as fspath from '@feature/core/Path';
import { Shell } from './Shell';
class VtronFileInfo {
  isFile = true;
  isDirectory = false;
  isSymlink = false;
  size = 0;
  mtime = new Date();
  atime = new Date();
  birthtime = new Date();
  constructor(
    isFile?: boolean,
    isDirectory?: boolean,
    isSymlink?: boolean,
    size?: number,
    mtime?: Date,
    atime?: Date,
    birthtime?: Date
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
  // icon: string;
  // type: string;
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
class VtronFileSystem {
  private db!: IDBDatabase;
  private _ready: ((value: VtronFileSystem) => void) | null = null;
  private _watchMap: Map<RegExp, (path: string, content: string) => void> = new Map();
  constructor() {
    const request = window.indexedDB.open('FileSystemDB', 1);

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
      const rootDir = new VtronFile('/', '', {
        isDirectory: true,
      });
      rootDir.parentPath = '';
      objectStore.add(rootDir);
    };
  }
  private async createDir(fileItem: InitFileItem, path = '') {
    if (fileItem.type === 'file') {
      if (fileItem.content) {
        await this.writeFile(path + '/' + fileItem.name, fileItem.content);
      }
    } else if (fileItem.type === 'dir') {
      await this.mkdir(path + '/' + fileItem.name);

      if (fileItem.children?.length) {
        for (let i = 0; i < fileItem.children.length; i++) {
          await this.createDir(fileItem.children[i], path + '/' + fileItem.name);
        }
      }
    }
  }
  async runPlugin(system: System) {
    const pluginsFile = await this.readdir('/C/System/plugs');
    if (pluginsFile) {
      pluginsFile.forEach((file) => {
        if (file.isFile) {
          const content = file.content;
          if (content) {
            new Shell(system, '/', 'root').exec('node ' + file.path);
          }
        }
      });
    }
  }
  async initFileSystem() {
    await this.whenReady();
    await this.createDir(InitFile);
    this.registerWatcher(/^\/C\/Users\//, (path, content) => {
      initAppList();
    });
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
    return new Promise<VtronFileSystem>((resolve, reject) => {
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
  removeFileSystem() {
    window.indexedDB.deleteDatabase('FileSystemDB');
  }

  /**
   * 读取指定路径的文件内容
   * @param path 文件路径
   * @returns 文件内容
   */
  async readFile(path: string): Promise<string | null> {
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
  async writeFile(
    path: string,
    par: {
      content: string;
    }
  ): Promise<void> {
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
        new VtronFile(path, par.content, {
          isFile: true,
        })
      );
      return new Promise((resolve, reject) => {
        request.onerror = () => {
          console.error('Failed to write file');
          reject('Failed to write file');
        };
        request.onsuccess = () => {
          this.commitWatch(path, par.content);
          resolve();
        };
      });
    } else {
      const request = objectStore.put(
        new VtronFile(
          path,
          par.content,
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
          this.commitWatch(path, par.content);
          resolve();
        };
      });
    }
  }
  async appendFile(path: string, content: string): Promise<void> {
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
  async readdir(path: string): Promise<VtronFile[]> {
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
        resolve(files);
      };
    });
  }

  async exists(path: string): Promise<boolean> {
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

  async stat(path: string): Promise<VtronFile | null> {
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
  async rename(path: string, newPath: string): Promise<void> {
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
          function updatePath(vfile: VtronFile, vFileNewPath: string, vParentPath: string) {
            if (vfile.isDirectory) {
              objectStore.index('parentPath').openCursor(IDBKeyRange.only(vfile.path)).onsuccess = (
                event: any
              ) => {
                const cursor: IDBCursorWithValue = event.target.result;
                if (cursor) {
                  const tempfile = cursor.value;
                  // let tempNewPath = vFileNewPath + '/' + tempfile.path.split('/').slice(-1)[0];
                  const tempNewPath = fspath.join(vFileNewPath, tempfile.path.split('/').slice(-1)[0]);
                  updatePath(tempfile, tempNewPath, vFileNewPath);
                  cursor.continue();
                }
              };
              vfile.path = vFileNewPath;
              vfile.parentPath = vParentPath;
              objectStore.put(vfile);
            } else {
              vfile.path = vFileNewPath;
              vfile.parentPath = vParentPath;
              objectStore.put(vfile);
            }
          }
          updatePath(file, newPath, newPath.split('/').slice(0, -1).join('/'));
        }
        this.commitWatch(path, file.content);
        resolve();
      };
    });
  }

  /**
   * 删除指定路径的文件夹及其内容
   * @param path 文件夹路径
   */
  async rmdir(path: string): Promise<void> {
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
          function updatePath(vfile: VtronFile) {
            if (vfile.isDirectory) {
              objectStore.index('parentPath').openCursor(IDBKeyRange.only(vfile.path)).onsuccess = (
                event: any
              ) => {
                const cursor: IDBCursorWithValue = event.target.result;
                if (cursor) {
                  const tempfile = cursor.value;
                  updatePath(tempfile);
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
          updatePath(file);
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
    let parentPath = path.split('/').slice(0, -1).join('/');
    if (parentPath === '') parentPath = '/';
    // judge if file exists
    const exists = await this.exists(parentPath);
    if (!exists) {
      console.error('Cannot create directory to a non-exist path:' + parentPath);
      return Promise.reject('Cannot create directory to a non-exist path:' + parentPath);
    }

    const res = await this.exists(path);
    if (res) {
      // console.error("Directory already exists");
      return Promise.resolve();
    }

    const transaction = this.db.transaction('files', 'readwrite');
    const objectStore = transaction.objectStore('files');

    const request = objectStore.add(
      new VtronFile(path, '', {
        isDirectory: true,
      })
    );

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        console.error('Failed to create directory');
        reject('Failed to create directory');
      };
      request.onsuccess = () => {
        this.commitWatch(path, '');
        resolve();
      };
    });
  }
}

export { VtronFile, VtronFileInfo, VtronFileSystem };

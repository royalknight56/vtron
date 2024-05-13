import * as fspath from '@/packages/util/Path';
import { System } from '../System';
import { initBuiltinFileOpener } from './initBuiltinFileOpener';

export type FileOpener = {
  name?: string;
  icon: string;
  hiddenInChosen?: boolean;
  func: (path: string, content: string) => void;
};

export class FileOpenerOperations {
  system: System;
  flieOpenerMap: Map<string, FileOpener> = new Map();
  constructor(system: System) {
    this.system = system;
  }

  /** 注册文件打开器 */
  registerFileOpener(type: string | string[], opener: FileOpener) {
    if (Array.isArray(type)) {
      type.forEach((item) => {
        this.flieOpenerMap.set(item, opener);
      });
      return;
    }
    this.flieOpenerMap.set(type, opener);
  }
  getOpener(type: string) {
    return this.flieOpenerMap.get(type);
  }
  getAllFileOpener() {
    return this.flieOpenerMap;
  }

  /**打开vtron 文件系统的文件 */
  async openFile(path: string) {
    const fileStat = await this.system.fs.stat(path);
    if (!fileStat) {
      throw new Error('文件不存在');
    }
    if (fileStat?.isDirectory) {
      this.flieOpenerMap.get('dir')?.func.call(this, path, '');
      return;
    } else {
      const fileContent = await this.system.fs.readFile(path);
      this.flieOpenerMap
        .get(fspath.extname(fileStat?.path || '') || 'link')
        ?.func.call(this, path, fileContent || '');
    }
  }
  init() {
    initBuiltinFileOpener(this.system);
  }
}

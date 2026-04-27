/**
 * @author vtron-nas
 * 远程文件系统实现，所有操作代理到后端 NAS API
 * 实现 VtronFileInterface 接口
 */
import type { VtronFileInterface } from 'vtron';
import * as fsApi from '../api/fs';

type WatcherCallback = (path: string, content: string) => void;
type ErrorCallback = (err: string) => void;

export class RemoteFileSystem implements VtronFileInterface {
  readonly name = 'RemoteFS';
  isFirstRun = false;

  private watchers: Array<{ pattern: RegExp; callback: WatcherCallback }> = [];
  private errorCallbacks: ErrorCallback[] = [];
  private ready: Promise<VtronFileInterface>;
  private resolveReady!: (v: VtronFileInterface) => void;

  constructor() {
    this.ready = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
    /* 连接后端验证就绪状态 */
    this.init();
  }

  private async init(): Promise<void> {
    try {
      /* 尝试读根目录，确认后端可用 */
      await fsApi.readdir('/');
      this.resolveReady(this);
    } catch {
      /* 后端暂不可用，延迟重试 */
      setTimeout(() => this.init(), 2000);
    }
  }

  async whenReady(): Promise<VtronFileInterface> {
    return this.ready;
  }

  async readFile(path: string): Promise<string | null> {
    try {
      return await fsApi.readFile(path);
    } catch (err: any) {
      this.emitError(`readFile 失败: ${path} - ${err.message}`);
      return null;
    }
  }

  async writeFile(path: string, data: string, opt?: { flag?: 'w' | 'a' | 'wx' }): Promise<void> {
    try {
      await fsApi.writeFile(path, data, opt?.flag);
      this.commitWatch(path, data);
    } catch (err: any) {
      this.emitError(`writeFile 失败: ${path} - ${err.message}`);
    }
  }

  async appendFile(path: string, content: string): Promise<void> {
    try {
      await fsApi.appendFile(path, content);
      this.commitWatch(path, content);
    } catch (err: any) {
      this.emitError(`appendFile 失败: ${path} - ${err.message}`);
    }
  }

  async readdir(path: string): Promise<any[]> {
    try {
      return await fsApi.readdir(path);
    } catch (err: any) {
      this.emitError(`readdir 失败: ${path} - ${err.message}`);
      return [];
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      return await fsApi.exists(path);
    } catch {
      return false;
    }
  }

  async stat(path: string): Promise<any> {
    try {
      return await fsApi.stat(path);
    } catch {
      return null;
    }
  }

  async unlink(path: string): Promise<void> {
    try {
      await fsApi.unlinkFile(path);
      this.commitWatch(path, '');
    } catch (err: any) {
      this.emitError(`unlink 失败: ${path} - ${err.message}`);
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    try {
      await fsApi.renameFile(oldPath, newPath);
      this.commitWatch(oldPath, '');
      this.commitWatch(newPath, '');
    } catch (err: any) {
      this.emitError(`rename 失败: ${oldPath} -> ${newPath} - ${err.message}`);
    }
  }

  async rm(path: string): Promise<void> {
    try {
      await fsApi.rm(path);
      this.commitWatch(path, '');
    } catch (err: any) {
      this.emitError(`rm 失败: ${path} - ${err.message}`);
    }
  }

  async rmdir(path: string): Promise<void> {
    try {
      await fsApi.rmdir(path);
      this.commitWatch(path, '');
    } catch (err: any) {
      this.emitError(`rmdir 失败: ${path} - ${err.message}`);
    }
  }

  async mkdir(path: string): Promise<void> {
    try {
      await fsApi.mkdir(path);
      this.commitWatch(path, '');
    } catch (err: any) {
      this.emitError(`mkdir 失败: ${path} - ${err.message}`);
    }
  }

  async copyFile(src: string, dest: string): Promise<void> {
    try {
      await fsApi.copyFile(src, dest);
      this.commitWatch(dest, '');
    } catch (err: any) {
      this.emitError(`copyFile 失败: ${src} -> ${dest} - ${err.message}`);
    }
  }

  async chmod(path: string, mode: number): Promise<void> {
    try {
      await fsApi.chmod(path, mode);
    } catch (err: any) {
      this.emitError(`chmod 失败: ${path} - ${err.message}`);
    }
  }

  async search(keyword: string): Promise<any[]> {
    try {
      return await fsApi.search(keyword);
    } catch {
      return [];
    }
  }

  async serializeFileSystem(): Promise<unknown> {
    return {};
  }

  async deserializeFileSystem(): Promise<unknown> {
    return {};
  }

  async removeFileSystem(): Promise<void> {
    // 远程 FS 不支持此操作
  }

  registerWatcher(pattern: RegExp, callback: WatcherCallback): void {
    this.watchers.push({ pattern, callback });
  }

  on(event: 'error', callback: ErrorCallback): void {
    if (event === 'error') {
      this.errorCallbacks.push(callback);
    }
  }

  /** 触发匹配的 watcher 回调 */
  private commitWatch(path: string, content: string): void {
    for (const w of this.watchers) {
      if (w.pattern.test(path)) {
        w.callback(path, content);
      }
    }
  }

  /** 触发错误回调 */
  private emitError(msg: string): void {
    for (const cb of this.errorCallbacks) {
      cb(msg);
    }
  }
}

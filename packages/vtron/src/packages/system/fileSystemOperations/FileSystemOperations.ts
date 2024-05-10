import { VtronFileInterface } from '@/packages/kernel/file/FIleInterface';
import { VtronFileMode, VtronFileSystem } from '@/packages/kernel/file/FileSystem';
import { SystemOptions } from '@/packages/type/type';
import { InitSystemFile, InitUserFile } from './SystemFileConfig';
import { createInitFile } from './createInitFile';

export class FileSystemOperations {
  options: SystemOptions;
  fs: VtronFileInterface | null;

  constructor(options?: SystemOptions) {
    this.options = options || {};
    this.fs = null;
  }

  async updateFs(options?: SystemOptions) {
    // 如果传入了自定义fs，就使用传入的fs
    if (options?.fs) {
      this.fs = options.fs;
      return options.fs;
    } else {
      this.fs = await new VtronFileSystem();
      return this.fs;
    }
  }
  async init(fs: VtronFileInterface) {
    await fs.whenReady();
    await fs.mkdir('/C');
    await fs.chmod('/C', VtronFileMode.Read);
    await createInitFile(fs, this.options.initFile || InitUserFile, this.options.userLocation);
    await createInitFile(fs, this.options.initFile || InitSystemFile, this.options.systemLocation);
  }

  on(event: 'error', callback: (err: string) => void) {
    this.fs?.on(event, callback);
  }

  registerWatcher(path: RegExp, callback: (path: string, content: string) => void) {
    this.fs?.registerWatcher(path, callback);
  }
}

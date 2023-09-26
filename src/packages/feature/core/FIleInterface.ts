import type { VtronFile } from '@feature/core/fileSystem';

export interface VtronFileInterface {
  readFile: (path: string) => Promise<string | null>;
  writeFile: (
    path: string,
    par: {
      content: string;
    }
  ) => Promise<void>;
  appendFile: (path: string, content: string) => Promise<void>;
  readdir: (path: string) => Promise<VtronFile[]>;
  exists: (path: string) => Promise<boolean>;
  stat: (path: string) => Promise<VtronFile | null>;
  unlink: (path: string) => Promise<void>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
  rmdir: (path: string) => Promise<void>;
  mkdir: (path: string) => Promise<void>;
  copyFile: (src: string, dest: string) => Promise<void>;
  serializeFileSystem: () => Promise<unknown>;
  deserializeFileSystem: (files: VtronFile[]) => Promise<unknown>;
  removeFileSystem: () => Promise<void>;
  registerWatcher: (path: RegExp, callback: (path: string, content: string) => void) => void;
}

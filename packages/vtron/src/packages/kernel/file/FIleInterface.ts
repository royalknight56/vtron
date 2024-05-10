import type { VtronFile, VtronFileWithoutContent } from '@/packages/kernel/file/FileSystem';

export interface VtronFileInterface {
  whenReady: () => Promise<VtronFileInterface>;
  readFile: (path: string) => Promise<string | null>;
  writeFile: (
    path: string,
    data: string,
    opt?: {
      flag?: 'w' | 'a' | 'wx';
    }
  ) => Promise<void>;
  appendFile: (path: string, content: string) => Promise<void>;
  readdir: (path: string) => Promise<VtronFileWithoutContent[]>;
  exists: (path: string) => Promise<boolean>;
  stat: (path: string) => Promise<VtronFileWithoutContent | null>;
  unlink: (path: string) => Promise<void>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
  rmdir: (path: string) => Promise<void>;
  mkdir: (path: string) => Promise<void>;
  copyFile: (src: string, dest: string) => Promise<void>;
  chmod: (path: string, mode: number) => Promise<void>;
  search: (keyword: string) => Promise<VtronFileWithoutContent[]>;
  serializeFileSystem: () => Promise<unknown>;
  deserializeFileSystem: (files: VtronFile[]) => Promise<unknown>;
  removeFileSystem: () => Promise<void>;
  registerWatcher: (path: RegExp, callback: (path: string, content: string) => void) => void;
  on: (event: 'error', callback: (err: string) => void) => void;
}

import * as fspath from '@feature/core/Path';
import { VtronFileWithoutContent } from '@/packages/feature/core/FileSystem';

export type RouterPath = string;
export const useComputer = (adpater: {
  setRouter: (path: RouterPath) => void;
  getRouter: () => RouterPath;
  setFileList: (list: VtronFileWithoutContent[]) => void;
  openFile: (path: RouterPath) => void;
  rmdir: (path: RouterPath) => Promise<void>;
  mkdir: (path: RouterPath) => Promise<void>;
  readdir: (path: RouterPath) => Promise<VtronFileWithoutContent[]>;
  exists: (path: RouterPath) => Promise<boolean>;
  isDirectory: (file: VtronFileWithoutContent) => boolean;
  notify: (title: string, content: string) => void;
}) => {
  const isVia = async (path: RouterPath) => {
    if (path === '') path = '/';
    else if (path === '/') path = '/';
    else if (path.endsWith('/')) path = path.substr(0, path.length - 1);
    const isExist = await adpater.exists(path);
    if (!isExist) {
      adpater.notify('路径不存在', path);
      return false;
    }
    return true;
  };
  const refersh = async () => {
    const currentPath = adpater.getRouter();
    if (!(await isVia(currentPath))) return;
    const result = await adpater.readdir(currentPath);
    if (result) adpater.setFileList(result);
  };
  const createFolder = (path: RouterPath) => {
    const currentPath = adpater.getRouter();
    adpater.mkdir(fspath.join(currentPath, path)).then(
      () => {
        refersh();
      },
      () => {
        // Notify
      }
    );
  };
  const backFolder = () => {
    const path = adpater.getRouter();
    if (path === '/') return;
    adpater.setRouter(fspath.join(path, '..'));
    refersh();
  };
  const openFolder = (file: VtronFileWithoutContent) => {
    if (adpater.isDirectory(file)) {
      adpater.setRouter(file.path);
      refersh();
    } else {
      adpater.openFile(file.path);
    }
  };
  const onComputerMount = async () => {
    await refersh();
  };
  return {
    isVia,
    refersh,
    createFolder,
    backFolder,
    openFolder,
    onComputerMount,
  };
};

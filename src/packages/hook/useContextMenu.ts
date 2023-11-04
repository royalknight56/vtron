import * as fspath from '@feature/core/Path';
import { useSystem } from '@feature/system';
import { BrowserWindow } from '@feature/window/BrowserWindow';
import FileProps from '@feature/builtin/FileProps.vue';
import { VtronFileWithoutContent } from '@/packages/feature/core/FileSystem';
import { i18n } from '@feature/i18n';
import { useRootState } from '../feature/state/Root';

export type ContextMenu = {
  name: string;
  click: () => void;
  children?: ContextMenu[];
};

function useContextMenu() {
  const rootState = useRootState();
  async function createNewFile(path: string) {
    const system = useSystem();
    if (!system) return;
    let newFilePath = fspath.join(path, i18n('new.file') + '.txt');
    if (await system.fs.exists(newFilePath)) {
      let i = 1;
      while (await system.fs.exists(fspath.join(path, `${i18n('new.file')}(${i}).txt`))) {
        i++;
      }
      newFilePath = fspath.join(path, `${i18n('new.file')}(${i}).txt`);
    }
    return await system.fs.writeFile(newFilePath, '');
  }
  async function createNewDir(path: string) {
    const system = useSystem();
    if (!system) return;
    let newFilePath = fspath.join(path, i18n('new.folder'));
    if (await system.fs.exists(newFilePath)) {
      let i = 1;
      while (await system.fs.exists(fspath.join(path, `${i18n('new.folder')}(${i})`))) {
        i++;
      }
      newFilePath = fspath.join(path, `${i18n('new.folder')}(${i})`);
    }
    return await system.fs.mkdir(newFilePath);
  }

  function openPropsWindow(path: string) {
    new BrowserWindow({
      title: i18n('props'),
      content: FileProps,
      config: {
        content: path,
      },
      width: 350,
      height: 400,
      resizable: false,
    }).show();
  }
  function deleteFile(file: VtronFileWithoutContent) {
    const system = useSystem();
    if (!system) return;
    if (file.isDirectory) {
      return system?.fs.rmdir(file.path);
    } else {
      return system?.fs.unlink(file.path);
    }
  }
  async function copyFile(files: VtronFileWithoutContent[]) {
    const system = useSystem();
    if (!system) return;
    if (rootState.system.clipboard) {
      rootState.system.clipboard = files.map((file) => file.path);
    }
  }
  async function pasteFile(path: string) {
    const system = useSystem();
    if (!system) return;
    const clipLen = Object.keys(rootState.system.clipboard).length;
    if (clipLen) {
      const clipFiles = rootState.system.clipboard;

      if (!clipFiles.forEach) {
        return;
      }
      await clipFiles.forEach(async (clipFile: string) => {
        let tempName = fspath.filename(clipFile);
        const ext = fspath.extname(clipFile);

        if (await system.fs.exists(fspath.join(path, tempName) + ext)) {
          let i = 1;
          while (await system.fs.exists(fspath.join(path, `${tempName}(${i})`) + ext)) {
            i++;
          }
          tempName = `${tempName}(${i})`;
        }
        return system.fs.copyFile(clipFile, fspath.join(path, tempName) + ext);
      });
    } else {
      system.emitError('no file in clipboard');
    }
  }
  return { createNewFile, openPropsWindow, createNewDir, deleteFile, copyFile, pasteFile };
}

export { useContextMenu };

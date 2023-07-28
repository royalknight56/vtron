import * as fspath from '@feature/core/Path';
import { useSystem } from '@feature/system';
import { BrowserWindow } from '@feature/window/BrowserWindow';
import FileProps from '@feature/builtin/FileProps.vue';
import { VtronFile } from '@feature/core/fileSystem';
import { i18n } from '@feature/i18n';

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
  return await system.fs.writeFile(newFilePath, {
    content: '',
  });
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

export { createNewFile, openPropsWindow, createNewDir };

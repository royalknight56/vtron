import { System } from '@/packages/kernel';
import * as fspath from '@/packages/util/Path';
import { uniqBy } from '@/packages/util/modash';
import { i18n } from '../../computer/i18n';

async function pasteFile(system: System, path: string) {
  if (!system) return;
  const rootState = system.stateManager;
  const clipLen = Object.keys(rootState.clipboard).length;
  if (clipLen) {
    const clipFiles = rootState.clipboard.getClipboard();

    if (!clipFiles.map) {
      return;
    }
    await await Promise.all(
      clipFiles.map(async (clipFile: string) => {
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
      })
    );
  } else {
    system.emitError('no file in clipboard');
  }
}

async function createNewFile(system: System, path: string) {
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

async function createNewDir(system: System, path: string) {
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

function createDesktopContextMenu(system: System, e: MouseEvent, path?: string, callback?: () => void) {
  const createPath = path || `${system._options.userLocation}Desktop`;
  if (!system) return;

  const menu = system.buildFromTemplate(
    uniqBy(
      [
        {
          label: i18n('refresh'),
          click: () => {
            callback?.();
          },
        },
        {
          label: i18n('new'),
          submenu: [
            {
              label: i18n('new.file'),
              click: () => {
                createNewFile(system, createPath).then(() => {
                  callback?.();
                });
              },
            },
          ],
        },
        {
          label: i18n('paste'),
          click: () => {
            pasteFile(system, createPath).then(() => {
              callback?.();
            });
          },
        },
        {
          label: i18n('new.folder'),
          click: () => {
            createNewDir(system, createPath).then(() => {
              callback?.();
            });
          },
        },
        ...(system.stateManager.options.getOptions('contextMenus') || []),
      ],
      (val) => val.label
    )
  );
  menu.popup(e);
}
export { createDesktopContextMenu };

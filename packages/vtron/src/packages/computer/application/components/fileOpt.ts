import FileProps from '@/packages/computer/application/FileProps.vue';
import OpenWiteDialogVue from '@/packages/computer/application/OpenWiteDialog.vue';
import { i18n } from '@/packages/computer/i18n';
import { System, VtronFileWithoutContent } from '@/packages/kernel';
import { Dialog } from '@/packages/services';
import * as fspath from '@/packages/util/Path';

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

function openPropsWindow(system: System, path: string) {
  system
    .createWindow({
      title: i18n('props'),
      content: FileProps,
      config: {
        content: path,
      },
      width: 350,
      height: 400,
      resizable: false,
    })
    .show();
}
function deleteFile(system: System, file: VtronFileWithoutContent) {
  if (!system) return;
  if (file.isDirectory) {
    return system?.fs.rmdir(file.path);
  } else {
    return system?.fs.unlink(file.path);
  }
}
async function openWith(system: System, file: VtronFileWithoutContent) {
  const tempWin = system.createWindow({
    title: i18n('open.with'),
    content: OpenWiteDialogVue,
    config: {
      content: file.path,
    },
    width: 300,
    height: 300,
    center: true,
    frame: false,
    resizable: false,
  });
  tempWin.on('blur', () => {
    tempWin.close();
  });
  tempWin.show();
}

async function copyFile(system: System, paths: string[]) {
  const rootState = system.stateManager;
  if (!system) return;
  rootState.clipboard.setClipboard(paths);
}
async function pasteFile(system: System, path: string) {
  if (!system) return;
  const rootState = system.stateManager;
  const clipLen = Object.keys(rootState.clipboard).length;
  if (clipLen) {
    const clipFiles = rootState.clipboard.getClipboard();

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
// 创建快捷方式
async function createLink(system: System, path: string) {
  if (!system) return;
  if (fspath.extname(path) === '.ln') {
    Dialog.showMessageBox({
      title: i18n('error'),
      message: i18n('cannot.create.shortcut'),
      type: 'error',
    });
    return;
  }
  const parentPath = fspath.dirname(path);
  const baseName = fspath.basename(path);
  const linkPath = fspath.join(parentPath, baseName + '.ln');
  if (await system.fs.exists(linkPath)) {
    Dialog.showMessageBox({
      title: i18n('error'),
      message: i18n('shortcut.has.been.created'),
      type: 'error',
    });
    return;
  }
  return await system.fs.writeFile(linkPath, path);
}

interface RecycleMeta {
  storedName: string;
  originalPath: string;
  originalName: string;
  deletedAt: number;
  isDirectory: boolean;
}

function getRecycleBinPath(system: System) {
  return `${system._options.userLocation}RecycleBin`;
}

function getMetaPath(system: System) {
  return `${getRecycleBinPath(system)}/.meta.json`;
}

async function readRecycleMeta(system: System): Promise<RecycleMeta[]> {
  const raw = await system.fs.readFile(getMetaPath(system));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeRecycleMeta(system: System, meta: RecycleMeta[]) {
  await system.fs.writeFile(getMetaPath(system), JSON.stringify(meta));
}

async function moveToRecycleBin(system: System, paths: string[]) {
  const recyclePath = getRecycleBinPath(system);
  await system.fs.mkdir(recyclePath);

  const meta = await readRecycleMeta(system);

  for (const srcPath of paths) {
    if (srcPath.startsWith(recyclePath)) continue;

    const stat = await system.fs.stat(srcPath);
    if (!stat) continue;

    if (stat.mode !== undefined && stat.mode <= 0o111) continue;

    const originalName = fspath.basename(srcPath);
    const storedName = `${Date.now()}_${originalName}`;
    const destPath = fspath.join(recyclePath, storedName);

    await system.fs.copyFile(srcPath, destPath);
    await system.fs.rm(srcPath);

    meta.push({
      storedName,
      originalPath: srcPath,
      originalName,
      deletedAt: Date.now(),
      isDirectory: stat.isDirectory,
    });
  }

  await writeRecycleMeta(system, meta);
}

async function restoreFromRecycleBin(system: System, storedName: string) {
  const recyclePath = getRecycleBinPath(system);
  const meta = await readRecycleMeta(system);
  const entry = meta.find((m) => m.storedName === storedName);
  if (!entry) return;

  const srcPath = fspath.join(recyclePath, storedName);
  let destPath = entry.originalPath;

  const parentDir = fspath.dirname(destPath);
  if (!(await system.fs.exists(parentDir))) {
    await system.fs.mkdir(parentDir);
  }

  if (await system.fs.exists(destPath)) {
    const ext = fspath.extname(entry.originalName);
    const name = fspath.filename(entry.originalName);
    let i = 1;
    while (await system.fs.exists(fspath.join(parentDir, `${name}(${i})${ext}`))) {
      i++;
    }
    destPath = fspath.join(parentDir, `${name}(${i})${ext}`);
  }

  await system.fs.copyFile(srcPath, destPath);
  await system.fs.rm(srcPath);

  const newMeta = meta.filter((m) => m.storedName !== storedName);
  await writeRecycleMeta(system, newMeta);
}

async function permanentDelete(system: System, storedName: string) {
  const recyclePath = getRecycleBinPath(system);
  const srcPath = fspath.join(recyclePath, storedName);
  await system.fs.rm(srcPath);

  const meta = await readRecycleMeta(system);
  const newMeta = meta.filter((m) => m.storedName !== storedName);
  await writeRecycleMeta(system, newMeta);
}

async function emptyRecycleBin(system: System) {
  const recyclePath = getRecycleBinPath(system);
  const meta = await readRecycleMeta(system);

  for (const entry of meta) {
    const filePath = fspath.join(recyclePath, entry.storedName);
    try {
      await system.fs.rm(filePath);
    } catch {
      // already removed
    }
  }

  await writeRecycleMeta(system, []);
}

export {
  copyFile,
  createLink,
  createNewDir,
  createNewFile,
  deleteFile,
  emptyRecycleBin,
  moveToRecycleBin,
  openPropsWindow,
  openWith,
  pasteFile,
  permanentDelete,
  readRecycleMeta,
  restoreFromRecycleBin,
};

export type { RecycleMeta };

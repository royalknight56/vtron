import { VtronFileWithoutContent } from '@/packages/feature/core/FileSystem';
import { System } from '@feature/system';
import * as FsPath from '@feature/core/Path';
import { emitEvent } from '@feature/event';
import { Dialog } from '../feature/dialog/Dialog';
let dragCallback = () => {
  //
};
export function useFileDrag(system: System) {
  function startDrag(ev: DragEvent, items: VtronFileWithoutContent[], callback: () => void) {
    dragCallback = callback;
    ev?.dataTransfer?.setData('fromobj', 'web');
    ev?.dataTransfer?.setData('frompath', JSON.stringify(items.map((item) => item.path)));
  }
  // 拖到文件放下时
  async function folderDrop(ev: DragEvent, toPath: string) {
    const frompathArrStr = ev?.dataTransfer?.getData('frompath');
    if (!frompathArrStr) return;
    const frompathArr = JSON.parse(frompathArrStr) as string[];
    if (frompathArr.length === 0) {
      return;
    }
    if (frompathArr.includes(toPath)) {
      return;
    }

    const toFile = await system?.fs.stat(toPath);
    if (toFile?.isDirectory) {
      await frompathArr.map(async (frompath) => {
        await system?.fs.rename(frompath, FsPath.join(toPath, FsPath.basename(frompath))).catch((e) => {
          Dialog.showMessageBox({
            message: e,
            type: 'error',
          });
        });
        emitEvent('file.props.edit');
      });
    }
  }
  async function writeFileToInner(
    path: string,
    name?: string,
    content?: string,
    process?: (path: string) => void
  ) {
    return await system?.fs
      .writeFile(FsPath.join(path, name || 'unkown'), content?.replace(/data:.*?;base64,/, '') || '')
      .then(() => {
        process?.(FsPath.join(path, name || 'unkown'));
      });
  }
  // 外部文件拖到文件夹放下时
  async function outerFileDrop(path: string, list: FileList | undefined, process: (path: string) => void) {
    const len = list?.length || 0;
    const { setProgress } = Dialog.showProcessDialog({
      message: '正在写入到文件夹中',
    });
    for (let i = 0; i < len; i++) {
      setProgress((i / len) * 100);
      await new Promise((resolve) => {
        const item = list?.[i];

        // let oFile = null;
        const reader = new FileReader();
        //读取成功
        reader.onload = function () {
          // console.log(reader);
        };
        reader.onloadstart = function () {
          // console.log('读取开始');
        };
        reader.onloadend = async function () {
          await writeFileToInner(path, item?.name, reader.result as string, process);
          resolve(true);
        };
        reader.onabort = function () {
          // console.log('中断');
        };
        reader.onerror = function () {
          // console.log('读取失败');
        };
        reader.onprogress = function (ev) {
          const scale = ev.loaded / ev.total;
          if (scale >= 0.5) {
            reader.abort();
          }
        };
        reader.readAsDataURL(new Blob([item as BlobPart]));
      });
    }
    setProgress(101);
  }

  async function dragFileToDrop(ev: DragEvent, path: string) {
    dragCallback();
    ev.preventDefault();
    const fromobj = ev?.dataTransfer?.getData('fromobj');
    if (fromobj == 'web') {
      folderDrop(ev, path);
    } else {
      const oFileList = ev?.dataTransfer?.files;
      if (system.outerFileDropCallback) {
        system.outerFileDropCallback?.(path, oFileList, () => {
          emitEvent('file.props.edit');
        });
      } else {
        outerFileDrop(path, oFileList, () => {
          emitEvent('file.props.edit');
        });
      }
    }
  }
  return {
    startDrag,
    folderDrop,
    dragFileToDrop,
  };
}

import { VtronFile } from "@packages/feature/core/fileSystem";
import { System } from "@packages/feature/system";
import * as FsPath from "@packages/feature/core/Path"
import { emitEvent } from "@packages/feature/event";
export function useFileDrag(system: System) {

    function startDrag(ev: DragEvent, item: VtronFile) {
        ev?.dataTransfer?.setData('fromobj', 'web');
        ev?.dataTransfer?.setData('frompath', item.path);
    }
    // 拖到文件放下时
    async function folderDrop(ev: DragEvent, toPath: string) {
        let frompath = ev?.dataTransfer?.getData('frompath')
        if (!frompath) return;
        if (frompath == toPath) {
            return;
        }
        let toFile = await system?.fs.stat(toPath)
        if (toFile?.isDirectory) {
            system?.fs.rename(frompath, FsPath.join(toPath, FsPath.basename(frompath))).then(() => {
                emitEvent('file.props.edit');
            });
        }

    }
    return {
        startDrag,
        folderDrop
    }
}

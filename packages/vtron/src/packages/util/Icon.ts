import audioicon from '@packages/assets/audio.png';
import foldericon from '@packages/assets/folder.png';
import imageicon from '@packages/assets/image.png';
import unknownicon from '@packages/assets/unknown.png';
import videoicon from '@packages/assets/video.png';
import volumeLocalIcon from '@packages/assets/volume-local.png';
import volumeNetIcon from '@packages/assets/volume-net.png';
import { VtronFileSystem, VtronFileWithoutContent } from '../kernel/file/FileSystem';

import { System, extname } from '../plug';
export function dealExeIcon(content: string | null | undefined) {
  if (!content) return unknownicon;
  const exeContent = content.split('::');
  const iconImg = exeContent.slice(3).join('::');
  if (iconImg != 'undefined' && iconImg != '' && iconImg != null && iconImg) {
    return iconImg;
  } else {
    return unknownicon;
  }
}
export async function dealIcon(
  file: VtronFileWithoutContent | null | undefined,
  system: System,
  stopCircle = false
) {
  if (!file) return unknownicon;
  if (file.isDirectory && file.parentPath === '/') {
    // 是挂载在根目录的卷
    if (system.fs instanceof VtronFileSystem) {
      if (system.fs.checkVolumePath(file.path)) {
        return volumeNetIcon;
      } else {
        return volumeLocalIcon;
      }
    }
  }
  if (file.isDirectory) return foldericon;
  const ext = extname(file.path);
  if (ext === '.exe' || ext === '.url') {
    const content = await system.fs.readFile(file.path);
    return dealExeIcon(content);
  }
  if (ext === '.png') {
    if (system.fs instanceof VtronFileSystem) {
      if (system.fs.checkVolumePath(file.path)) {
        return imageicon;
      } else {
        // 只有当非自定义文件系统和非自定义卷才直接展示icon
        const content = await system.fs.readFile(file.path);
        return 'data:image/png;base64,' + content || unknownicon;
      }
    } else {
      return imageicon;
    }
  }
  if (ext === '.ln') {
    if (stopCircle) {
      return unknownicon;
    } else {
      const target = await system.fs.readFile(file.path);
      if (target) {
        return dealIcon(await system.fs.stat(target), system, true);
      } else {
        return unknownicon;
      }
    }
  }
  if (ext === '.mp3') return audioicon;
  if (ext === '.mp4') return videoicon;

  return system.getOpener(ext)?.icon || unknownicon;
}

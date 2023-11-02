import { VtronFileSystem, VtronFileWithoutContent } from '../feature/core/FileSystem';
import foldericon from '@packages/assets/folder.png';
import unknownicon from '@packages/assets/unknown.png';
import audioicon from '@packages/assets/audio.png';
import videoicon from '@packages/assets/video.png';
import imageicon from '@packages/assets/image.png';
import { System, extname } from '../plug';
function dealExeIcon(content: string | null | undefined) {
  if (!content) return unknownicon;
  const exeContent = content.split('::');
  const iconImg = exeContent.slice(3).join('::');
  if (iconImg != 'undefined' && iconImg != '' && iconImg != null && iconImg) {
    return iconImg;
  } else {
    return unknownicon;
  }
}
async function dealIcon(file: VtronFileWithoutContent | null | undefined, system: System) {
  if (!file) return unknownicon;
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
      }
    } else {
      return imageicon;
    }
    // 只有当非自定义文件系统和非自定义卷才直接展示icon
    const content = await system.fs.readFile(file.path);
    return content || unknownicon;
  }
  if (ext === '.mp3') return audioicon;
  if (ext === '.mp4') return videoicon;

  return system.getOpener(ext)?.icon || unknownicon;
}
export { dealIcon };

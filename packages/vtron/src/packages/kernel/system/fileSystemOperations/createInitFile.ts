import { VtronFileInterface } from '@/packages/kernel/file/FIleInterface';
import { InitFileItem } from '@/packages/type/type';
import * as fspath from '@/packages/util/Path';

export const createInitFile = async (fs: VtronFileInterface, file: InitFileItem, path = '') => {
  if (file.type === 'file') {
    if (file.content) {
      await fs.writeFile(fspath.join(path, file.name), file.content, {
        flag: 'wx',
      });
      file.mode && (await fs.chmod(fspath.join(path, file.name), file.mode));
    }
  } else if (file.type === 'dir') {
    const tempPath = fspath.join(path, file.name);
    await fs.mkdir(tempPath);
    file.mode && (await fs.chmod(tempPath, file.mode));

    if (file.children?.length) {
      for (let i = 0; i < file.children.length; i++) {
        await createInitFile(fs, file.children[i], tempPath);
      }
    }
  }
};

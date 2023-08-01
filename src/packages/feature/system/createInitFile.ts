import { System } from '.';
import { InitFileItem } from '../core/SystemFileConfig';

export const createInitFile = async (system: System, file: InitFileItem, path = '') => {
  const fs = system.fs;
  if (file.type === 'file') {
    if (file.content) {
      await fs.writeFile(path + '/' + file.name, file.content);
    }
  } else if (file.type === 'dir') {
    await fs.mkdir(path + '/' + file.name);

    if (file.children?.length) {
      for (let i = 0; i < file.children.length; i++) {
        await createInitFile(system, file.children[i], path + '/' + file.name);
      }
    }
  }
};

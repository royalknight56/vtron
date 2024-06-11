import { version } from '../../../../../package.json';
const InitSystemFile = {
  type: 'dir',
  name: '',
  mode: 0o111,
  children: [
    {
      name: 'plugs',
      type: 'dir',
      mode: 0o111,
      children: [],
    },
    {
      name: 'Vtron',
      type: 'dir',
      mode: 0o111,
      children: [
        {
          name: 'version.txt',
          type: 'file',
          content: version,
          mode: 0o111,
        },
      ],
    },
  ],
};
const InitUserFile = {
  type: 'dir',
  name: '',
  mode: 0o111,
  children: [
    {
      name: 'Desktop',
      type: 'dir',
      mode: 0o111,
    },
    {
      name: 'Magnet',
      type: 'dir',
      mode: 0o111,
    },
    {
      name: 'Menulist',
      type: 'dir',
      mode: 0o111,
    },
    {
      name: 'Note',
      type: 'dir',
      mode: 0o111,
    },
    {
      name: 'Photo',
      type: 'dir',
      mode: 0o111,
    },
    {
      name: 'Music',
      type: 'dir',
      mode: 0o111,
    },
    {
      name: 'Schedule',
      type: 'dir',
      mode: 0o111,
    },
  ],
};

export { InitSystemFile, InitUserFile };

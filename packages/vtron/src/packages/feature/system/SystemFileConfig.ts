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
        // {
        //     name: 'Vtron.exe',
        //     type: 'file',
        //     content: {
        //         content: 'link:Program Files:Vtron:Vtron.exe',
        //         name: 'Vtron.exe',
        //         icon: 'https://img.alicdn.com/tfs/TB1ZQ9Xb4v1gK0jSZFFXXb0sXXa-256-256.png',
        //         type: 'link'
        //     }
        // }
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
  ],
};

export { InitSystemFile, InitUserFile };

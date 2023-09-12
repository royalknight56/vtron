const InitFile = {
  type: 'dir',
  name: 'C',
  children: [
    {
      name: 'Users',
      type: 'dir',
      children: [
        {
          name: 'Desktop',
          type: 'dir',
        },
        {
          name: 'Magnet',
          type: 'dir',
        },
        {
          name: 'Menulist',
          type: 'dir',
        },
      ],
    },
    {
      name: 'System',
      type: 'dir',
      children: [
        {
          name: 'plugs',
          type: 'dir',
          children: [],
        },
        {
          name: 'Vtron',
          type: 'dir',
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
    },
  ],
};

export { InitFile };

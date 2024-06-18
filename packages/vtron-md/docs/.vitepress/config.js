module.exports = {
  title: 'Vtron',
  base: '/doc/',
  description: 'Vtron 是一个基于 Vue3 的开发工具，它可以帮助你快速开发window风格的web应用程序。',
  head: [
    [
      'script',
      {
        async: true,
        src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7516773950965588',
        crossorigin: 'anonymous',
      },
    ],
    // <meta name="google-adsense-account" content="ca-pub-7516773950965588"></meta>
    [
      'meta',
      {
        name: 'google-adsense-account',
        content: 'ca-pub-7516773950965588',
      },
    ],
    [
      'meta',
      {
        name: 'description',
        content: 'Vtron 是一个基于 Vue3 的开发工具，它可以帮助你快速开发window风格的web应用程序。',
      },
    ],
    [
      'meta',
      {
        name: 'keywords',
        content: 'vtron,vue3,electron,web应用程序,开发工具',
      },
    ],
  ],
  locales: {
    root: {
      label: 'Chinese',
      lang: 'zh-CN',
    }
  },
  // 配置默认主题
  themeConfig: {
    displayAllHeaders: true, // 默认值：false
    lastUpdated: 'Last Updated', // string | boolean
    aside: true,
    nav: [
      { text: '主页', link: '/' },
      { text: '教程', link: '/guide/how-to-use-vtron.md' },
      { text: 'API', link: '/api/BrowserWindow.md' },
      { text: 'VtronPlus', link: '/plus/VtronPlus.md' },
      { text: '更新', link: '/update/README.md' },
      { text: 'GitHub', link: 'https://github.com/royalknight56/vtron' },
      { text: 'Demo', link: 'http://vtron.site' },
    ],
    sidebar: {
      '/api/': [
        {
          text: 'System',
          link: '/api/System.md',
        },
        {
          text: '系统的配置项',
          link: '/api/System-option.md',
        },
        {
          text: 'BrowserWindow',
          link: '/api/BrowserWindow.md',
        },
        {
          text: 'fs',
          link: '/api/fs.md',
        },
        {
          text: 'path',
          link: '/api/path.md',
        },
        {
          text: 'Menu',
          link: '/api/Menu.md',
        },
        {
          text: 'Dialog',
          link: '/api/Dialog.md',
        },
        {
          text: 'Tray',
          link: '/api/Tray.md',
        },
        {
          text: 'Shell',
          link: '/api/Shell.md',
        },
        {
          text: 'Notify',
          link: '/api/Notify.md',
        },
        {
          text: '其他',
          link: '/api/Other.md',
        },
        {
          text: '插件开发',
          link: '/api/Plugin.md',
        },
      ],
      '/guide/': [
        { text: '如何使用', link: '/guide/how-to-use-vtron.md' },
        { text: '窗口', link: '/guide/guide-window.md' },
        { text: '功能导航', link: '/guide/roadmap.md' },
        { text: '常见问题', link: '/guide/qa.md' },
        // { text: 'What is vtron?', link: '/guide/what-is-vtron.md' },
      ],
    },
  },
};

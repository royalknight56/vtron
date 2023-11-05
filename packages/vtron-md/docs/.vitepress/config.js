module.exports = {
  title: "Vtron",
  base: "/",
  description: "Just playing around",
  head: [
    [
      "script",
      {
        async: true,
        src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7516773950965588",
        crossorigin: "anonymous",
      },
    ],
  ],
  locales: {
    root: {
      label: "Chinese",
      lang: "zh-CN",
    },
    en: {
      label: "English",
      lang: "en-US",
      link: "/en/", // default /en/ -- shows on navbar translations menu, can be external
    },
  },
  // 配置默认主题
  themeConfig: {
    displayAllHeaders: true, // 默认值：false
    lastUpdated: "Last Updated", // string | boolean
    aside: true,
    nav: [
      { text: "主页", link: "/" },
      { text: "教程", link: "/guide/how-to-use-vtron.md" },
      { text: "API", link: "/api/BrowserWindow.md" },
      { text: "VtronPlus", link: "/plus/VtronPlus.md" },
      { text: "更新", link: "/update/README.md" },
      { text: "GitHub", link: "https://github.com/royalknight56/vtron" },
      { text: "Demo", link: "http://myim.online" },
    ],
    sidebar: {
      "/api/": [
        {
          text: "System",
          link: "/api/System.md",
        },
        {
          text: "fs",
          link: "/api/fs.md",
        },
        {
          text: "path",
          link: "/api/path.md",
        },
        {
          text: "event",
          link: "/api/event.md",
        },
        {
          text: "BrowserWindow",
          link: "/api/BrowserWindow.md",
        },
        {
          text: "Dialog",
          link: "/api/Dialog.md",
        },
        {
          text: "Shell",
          link: "/api/Shell.md",
        },
        {
          text: "Notify",
          link: "/api/Notify.md",
        },
        {
          text: "其他",
          link: "/api/Other.md",
        },
        {
          text: "插件开发",
          link: "/api/Plugin.md",
        },
      ],
      "/guide/": [
        { text: "如何使用", link: "/guide/how-to-use-vtron.md" },
        { text: "常见问题", link: "/guide/qa.md" },
        // { text: 'What is vtron?', link: '/guide/what-is-vtron.md' },
      ],
    },
  },
};

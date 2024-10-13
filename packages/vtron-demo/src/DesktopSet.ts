import GitHub from './assets/GitHub.png';
import baidumapicon from './assets/baidumap.png';
import flowicon from './assets/flowicon.png';
import slinotesvg from './assets/slinote.svg';
import friendLinkicon from './assets/friendLink.png';
import markdownicon from './assets/markdown.png';
import vscode from './assets/vscode.png';
import winv3icon from './assets/winv3.png';

import beaticon from './assets/beat.ico';
import kiometicon from './assets/kiomet.webp';
import signalicon from './assets/signal.png';
// import galleryicon from './assets/gallery.png';

import GitStars from './components/apps/GitStars.vue';
import GotoReadMe from './components/apps/GotoReadMe.vue';

import CreateUrl from './components/apps/CreateUrl.vue';
import FriendLink from './components/apps/FriendLink.vue';
import NoteMd from './components/apps/NoteMd.vue';
// import Gallery from './components/apps/Gallery.vue';
const magnetConfig = [
  {
    title: 'kiomet',
    icon: kiometicon,
    width: 800,
    height: 600,
    center: true,
    content: 'https://kiomet.com/',
    backgroundColor: '#2b3948',
    resizable: true,
  },
  {
    title: '百度地图',
    icon: baidumapicon,
    width: 800,
    height: 600,
    center: true,
    content: 'https://map.baidu.com/',
    resizable: true,
  },
  {
    title: '创建网络链接',
    icon: signalicon,
    width: 400,
    height: 400,
    center: true,
    content: CreateUrl,
    resizable: false,
  },
  {
    title: '点个star',
    icon: GitHub,
    width: 170,
    height: 100,
    center: true,
    content: GitStars,
  },
  {
    title: '意见反馈',
    icon: beaticon,
    width: 800,
    height: 600,
    center: true,
    content: 'https://w0akxkb81ek.feishu.cn/share/base/form/shrcnxXNS3dN7XpIfPdXNknjxNf',
  },
];
const desktopConfig = [
  {
    title: 'github1s',
    icon: vscode,
    width: 800,
    height: 700,
    center: true,
    content: 'https://github1s.com/',
    resizable: true,
  },

  // {
  //   title: "MarkDown",
  //   icon: markdownicon,
  //   width: 800,
  //   height: 600,
  //   center: true,
  //   content: MarkDown,
  //   resizable: true,
  // },
  // {
  //     title: '音乐',
  //     icon: moonappicon,
  //     width: 800,
  //     height: 600,
  //     center: true,
  //     content: MusicVue,
  //     resizable: true
  // },
  // {
  //   title: '友链',
  //   icon: friendLinkicon,
  //   width: 600,
  //   height: 400,
  //   center: true,
  //   content: FriendLink,
  //   resizable: true,
  // },
  {
    title: 'Flow-epub阅读器',
    icon: flowicon,
    width: 800,
    height: 600,
    center: true,
    content: 'https://app.flowoss.com/zh-CN',
    resizable: true,
  },
  {
    title: '书立笔记',
    icon: slinotesvg,
    width: 800,
    height: 600,
    center: true,
    content: 'https://slinote.com/',
    resizable: true,
  },

  // {
  //   title: '图库',
  //   icon: galleryicon,
  //   width: 800,
  //   height: 600,
  //   center: true,
  //   content: Gallery,

  //   resizable: true,
  // },
  {
    title: '创建网络链接',
    icon: signalicon,
    width: 400,
    height: 400,
    center: true,
    content: CreateUrl,
    // backgroundColor: "#71c5cf",
    resizable: false,
  },

  // {
  //   title: "PPT",
  //   icon: ppticon,
  //   width: 770,
  //   height: 600,
  //   center: true,
  //   resizable: true,
  //   content: PPT,
  // },
  {
    title: '文档',
    icon: winv3icon,
    width: 770,
    height: 600,
    content: GotoReadMe,
    resizable: true,
  },
];
export { desktopConfig, magnetConfig };

import githubicon from './assets/github.base?raw';
import baidumapicon from './assets/baidumap.base?raw';
import flowicon from './assets/flowicon.png';
import slinotesvg from './assets/slinote.svg';
import friendLinkicon from './assets/friendLinkBase.base?raw';
import vscode from './assets/vscode.png';
import winv3icon from './assets/winv3.png';
import Tmusicicon from './assets/t-music.png';
import signalicon from './assets/signal.base?raw';
import softkeyboardbase from './assets/softkeyboard.base?raw';
import gamebase from './assets/game.base?raw';
import touzi from './assets/touzi.base?raw';
import coin from './assets/coin.base?raw';


import GitStars from './components/apps/GitStars.vue';
import GotoReadMe from './components/apps/GotoReadMe.vue';
import CreateUrl from './components/apps/CreateUrl.vue';
import SoftKeyboard from './components/apps/SoftKeyboard.vue';
// import Gallery from './components/apps/Gallery.vue';

// 提取通用配置
const commonConfig = {
  center: true,
  resizable: true,
  width: 800,
  height: 600,
};

const darkThemeConfig = {
  backgroundColor: '#444',
  textColor: '#fff',
};

// 重构 magnetConfig
const magnetConfig = [
  {
    title: '百度地图',
    icon: baidumapicon,
    ...commonConfig,
    content: 'https://map.baidu.com/',
  },
  {
    title: '创建网络链接',
    icon: signalicon,
    width: 500,
    height: 400,
    center: true,
    content: CreateUrl,
    resizable: false,
  },
  {
    title: '点个star',
    icon: githubicon,
    width: 170,
    height: 100,
    center: true,
    content: GitStars,
  },
  {
    title: '意见反馈',
    icon: friendLinkicon,
    width: 800,
    height: 600,
    center: true,
    content: 'https://w0akxkb81ek.feishu.cn/share/base/form/shrcnxXNS3dN7XpIfPdXNknjxNf',
  },
  {
    title: '2048',
    icon: gamebase,
    width: 800,
    height: 800,
    center: true,
    content: 'https://vtron.site/react/#/2048',
  },
  {
    title: '井字棋',
    icon: gamebase,
    width: 800,
    height: 800,
    center: true,
    content: 'https://vtron.site/react/#/tic-tac-toe',
  },
  {
    title: '抛硬币',
    icon: coin,
    width: 800,
    height: 700,
    center: true,
    content: 'https://vtron.site/coin/',
    resizable: true,
    backgroundColor: '#444',
  },
  {
    title: '掷骰子',
    icon: touzi,
    width: 800,
    height: 700,
    center: true,
    content: 'https://vtron.site/dice/',
    resizable: true,
    backgroundColor: '#444',
  },
];

// 重构 desktopConfig
const desktopConfig = [
  {
    title: 'github1s',
    icon: vscode,
    ...commonConfig,
    height: 700,
    content: 'https://github1s.com/',
  },

  {
    title: '软键盘',
    icon: softkeyboardbase,
    ...commonConfig,
    height: 700,
    content: SoftKeyboard,
    resizable: false,
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
    ...commonConfig,
    content: 'https://app.flowoss.com/zh-CN',
  },
  {
    title: '书立笔记',
    icon: slinotesvg,
    ...commonConfig,
    content: 'https://slinote.com/',
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
    width: 500,
    height: 360,
    center: true,
    content: CreateUrl,
    // backgroundColor: "#71c5cf",
    resizable: false,
  },
  {
    title: 'T-Music',
    icon: Tmusicicon,
    ...commonConfig,
    width: 1000,
    height: 700,
    content: 'https://vtron.site/tmusic/',
    ...darkThemeConfig,
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

import vscode from "./assets/vscode.png";
import GitHub from "./assets/GitHub.png";
import winv3icon from "./assets/winv3.png";
import todoappicon from "./assets/todoapp.png";
import moonappicon from "./assets/moonappicon.webp";
import ppticon from "./assets/ppt.png";
import baidumapicon from "./assets/baidumap.png";
import markdownicon from "./assets/markdown.png";
import friendLinkicon from "./assets/friendLink.png";
import bird1icon from "./assets/bird1.png";
import signalicon from "./assets/signal.png";

// import kiometicon from "./assets/kiomet.webp";

import GitStars from "./components/apps/GitStars.vue";
import GotoReadMe from "./components/apps/GotoReadMe.vue";
import MarkDown from "./components/apps/MarkDown.vue";
import FriendLink from "./components/apps/FriendLink.vue";
import CreateUrl from "./components/apps/CreateUrl.vue";
import NoteMd from "./components/apps/NoteMd.vue";

import PPT from "./components/apps/PPT.vue";

import MusicVue from "./components/apps/Music.vue";

let config = [
  {
    title: "github1s",
    icon: vscode,
    width: 800,
    height: 700,
    center: true,
    content: "https://github1s.com/",
    resizable: true,
  },
  // {
  //   title: "咕噜Todo",
  //   icon: todoappicon,
  //   width: 800,
  //   height: 600,
  //   center: true,
  //   content: "https://groupgroupgroup.group",
  //   resizable: true,
  // },
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
  {
    title: "百度地图",
    icon: baidumapicon,
    width: 800,
    height: 600,
    center: true,
    content: "https://map.baidu.com/",
    resizable: true,
  },
  {
    title: "友链",
    icon: friendLinkicon,
    width: 600,
    height: 400,
    center: true,
    content: FriendLink,
    resizable: true,
  },
  {
    title: "压扁小鸟",
    icon: bird1icon,
    width: 800,
    height: 600,
    center: true,
    content: "https://static.myim.online/yabird/",
    backgroundColor: "#71c5cf",
    resizable: true,
  },
  {
    title: "NoteMd",
    icon: markdownicon,
    width: 800,
    height: 600,
    center: true,
    content: NoteMd,

    resizable: true,
  },
  {
    title: "创建网络链接",
    icon: signalicon,
    width: 400,
    height: 400,
    center: true,
    content: CreateUrl,
    // backgroundColor: "#71c5cf",
    resizable: false,
  },
  // {
  //   title: "kiomet",
  //   icon: kiometicon,
  //   width: 800,
  //   height: 600,
  //   center: true,
  //   content: "https://kiomet.com/",
  //   backgroundColor: "#2b3948",
  //   resizable: true,
  // },

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
    title: "点个star",
    icon: GitHub,
    width: 170,
    height: 100,
    content: GitStars,
  },
  {
    title: "文档",
    icon: winv3icon,
    width: 770,
    height: 600,
    content: GotoReadMe,
    resizable: true,
  },
];
export default config;

import vscode from './assets/vscode.png';
import GitHub from './assets/GitHub.png';
import winv3icon from './assets/winv3.png';
import baidumapicon from './assets/baidumap.png';
import markdownicon from './assets/markdown.png';
import friendLinkicon from './assets/friendLink.png';
import bird1icon from './assets/bird1.png';
import signalicon from './assets/signal.png';

import galleryicon from './assets/gallery.png';

import GitStars from './components/apps/GitStars.vue';
import GotoReadMe from './components/apps/GotoReadMe.vue';

import FriendLink from './components/apps/FriendLink.vue';
import CreateUrl from './components/apps/CreateUrl.vue';
import NoteMd from './components/apps/NoteMd.vue';
import Gallery from './components/apps/Gallery.vue';

const config = [
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
    title: 'PhotoShop',
    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABACAYAAACunKHjAAAAAXNSR0IArs4c6QAABYBJREFUeF7tm31MG2Ucx79Hx9soQ6C8SlthCmHEqSjgUKLGsIguzs3BZmKyaYbRzRjjdGYbRozRqPElwS1qpjNLXLI5HcQsM5MYTRgbL9scKONtgLTNtgq0lEJ563rmKbTpcdf2Dm7dtblL+s/d73nu9/3093ve7nkoyJeTACVzmCMgg5iPBBmEIBCawmrQyACFDMD5UwNYIcG0mgIFHWhKB8AAOK7BEXYUhuZ2f776jgj1/StBKWoAPOmvIgk/nwJN74e+9S1fPnoHQaIAeFfCAoW6ZoSuJdVbIW4QGQ8WIczRJPRN0renDkLX/BKXn9wgNAXtAHW39IUtwkMKGzHYUruwJBtE6KXEQs19iDDl4cqVac8HHCAKvgEozvBZBH+JFqFXQtfa7wdE4UkAT0lUgUhuUSXQNZ/xFxGh2z64lNP0Fuhbj/mLiFEAcSKhl2Y1NHZB3/K5PxC0NL0X1av3oGsh4yT3xdVryCCceDSFMggZhGeyCIwIZVY+0tZW+kzgWesI7FYTpk1XYdNfxuT1XjimJ0VNeoGVid9GEBB3vfyVID9mLUMYOnscxj8OCyonorE0QLgETRn70ffd65gZNYqokVdV0gLhcrltXwkcszO8FIhkJE0Qw+d+hr72E5E08qomcCD+2l3k9mhZTBzCY1WIVGmgKd8HRXQsy9vBY9UwXfiVlwoRjG4NCE/Hl6tzod1cjajkOxh6TOdPYvDH9zk1KjPvQWLB04hISGc9n7H8B/PF0xjrPiuEz60HQbxNL9uBlMe2Mhwn3Wr3ly+wxGSs34Wkhyr8irxW/y2u1x/0azdvIA0QcatKkLXtU4bTjplJtFU96r4XHpsITUUVVuQU8xIXlCAS8sug3cKY88BuG8Pf1aVu0dk7DyFGm8cLAjEKShDqZ/dAVfQMQyQZU3R+9pzzXkR8GvL21LEgELHkUkRGY5kyAeHKBMRmzzXKQQcisXA9NJv2skSOdTai7/s3nPcTHlgHbcU7DJvx/ovo/foVzgi5bfXjzvuj7b/zjaDAtxGUIhzhK1QgOR+fX4ak4k2czv57pArmtnrnM9WajVBveJsFQvfTB5geNvAV68sucCCEeGszdKK7Zpu7SIx2NbJ3cvcA5kunYSLdZVejkFcstJUeCPvEqDMlbLoOt7NhkdHIefUQolKyvIq1dDZgpKkOlk7GGixfONICQSZb+hMfYayLPRiKSslE5vMf+oRBVBMgV08dwJRxgC8EYicNEBO6f2C+9BtMF07hxqTVqwAC4/Z1r/kdS5AeZ+CHvUJgBA6Eq6vzVGmfMMPa0yS4wYu/by2SistB2g5vF4HRvf9Fvgs+gQPhOekSErO+bEm3mvzwZkSnZ3Oa9RyoxMSg360QgU2NmwHCpT4u7xFkbWVP2/W1H2P43Ak+3IMjIlJLt8MxPYGhxuOgb9g5hZHlQbJM6HkZfvkCQ2eOhhaItNK5BeGR5jpMGgdgHzeDtDFkaB0Rn4L0J3awBPcffhOWjobQBMFHFbGxGbrQXcOc2vsoGzyp4YoIviBI9ynpuQZfIZ52qaWVSCvdzruowJnnzek1yKBHvWE3y2lvM0W+6pSZ90J5ZwHictYgMlkLRZSSUZRMvqx95zF2uWExw2zxU4OvsKXaORd/kzSYtQ5j1jIMx4xtKVUGL4ilqOYoK4OYhyKDkEEw80OOCCERIW8mc9IK5e3HrvTgub1Q3nA6HxHyFuQ5ECF3TmPheIrnpvRQbyd4H1MgIOSDKx5RpCkkx5iYn6xFHvAHuLpFHGVyeSgfblvwX801oLkAlQvQq8iX+QD/m8JeR6EHDnSAQi8c1JGlH3fkfH25AuqBXNBQCfMuANZU2Dimlndh6M9xoW+TTwLPE5NByCCYyfM/A4yCX/Y+s20AAAAASUVORK5CYII=',
    width: 800,
    height: 600,
    center: true,
    content: 'https://ps.fktool.com/',
    resizable: true,
  },
  {
    title: '友链',
    icon: friendLinkicon,
    width: 600,
    height: 400,
    center: true,
    content: FriendLink,
    resizable: true,
  },
  {
    title: '压扁小鸟',
    icon: bird1icon,
    width: 800,
    height: 600,
    center: true,
    content: 'https://static.myim.online/yabird/',
    backgroundColor: '#71c5cf',
    resizable: true,
  },
  {
    title: 'NoteMd',
    icon: markdownicon,
    width: 800,
    height: 600,
    center: true,
    content: NoteMd,

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
    title: '点个star',
    icon: GitHub,
    width: 170,
    height: 100,
    content: GitStars,
  },
  {
    title: '文档',
    icon: winv3icon,
    width: 770,
    height: 600,
    content: GotoReadMe,
    resizable: true,
  },
];
export default config;

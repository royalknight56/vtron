import vscode from './assets/vscode.png';
import GitHub from './assets/GitHub.png';
import winv3icon from './assets/winv3.png';
import baidumapicon from './assets/baidumap.png';
import markdownicon from './assets/markdown.png';
import friendLinkicon from './assets/friendLink.png';
import flowicon from './assets/flowicon.png';

import bird1icon from './assets/bird1.png';
import signalicon from './assets/signal.png';
import kiometicon from './assets/kiomet.webp';
import beaticon from './assets/beat.ico';
// import galleryicon from './assets/gallery.png';

import GitStars from './components/apps/GitStars.vue';
import GotoReadMe from './components/apps/GotoReadMe.vue';

import FriendLink from './components/apps/FriendLink.vue';
import CreateUrl from './components/apps/CreateUrl.vue';
import NoteMd from './components/apps/NoteMd.vue';
import CommentVue from './components/apps/Comment.vue';
// import Gallery from './components/apps/Gallery.vue';
const magnetConfig = [
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
    width: 400,
    height: 400,
    center: true,
    content: CommentVue,
    resizable: false,
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
  {
    title: 'PhotoShop',
    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABACAYAAACunKHjAAAAAXNSR0IArs4c6QAABYBJREFUeF7tm31MG2Ucx79Hx9soQ6C8SlthCmHEqSjgUKLGsIguzs3BZmKyaYbRzRjjdGYbRozRqPElwS1qpjNLXLI5HcQsM5MYTRgbL9scKONtgLTNtgq0lEJ563rmKbTpcdf2Dm7dtblL+s/d73nu9/3093ve7nkoyJeTACVzmCMgg5iPBBmEIBCawmrQyACFDMD5UwNYIcG0mgIFHWhKB8AAOK7BEXYUhuZ2f776jgj1/StBKWoAPOmvIgk/nwJN74e+9S1fPnoHQaIAeFfCAoW6ZoSuJdVbIW4QGQ8WIczRJPRN0renDkLX/BKXn9wgNAXtAHW39IUtwkMKGzHYUruwJBtE6KXEQs19iDDl4cqVac8HHCAKvgEozvBZBH+JFqFXQtfa7wdE4UkAT0lUgUhuUSXQNZ/xFxGh2z64lNP0Fuhbj/mLiFEAcSKhl2Y1NHZB3/K5PxC0NL0X1av3oGsh4yT3xdVryCCceDSFMggZhGeyCIwIZVY+0tZW+kzgWesI7FYTpk1XYdNfxuT1XjimJ0VNeoGVid9GEBB3vfyVID9mLUMYOnscxj8OCyonorE0QLgETRn70ffd65gZNYqokVdV0gLhcrltXwkcszO8FIhkJE0Qw+d+hr72E5E08qomcCD+2l3k9mhZTBzCY1WIVGmgKd8HRXQsy9vBY9UwXfiVlwoRjG4NCE/Hl6tzod1cjajkOxh6TOdPYvDH9zk1KjPvQWLB04hISGc9n7H8B/PF0xjrPiuEz60HQbxNL9uBlMe2Mhwn3Wr3ly+wxGSs34Wkhyr8irxW/y2u1x/0azdvIA0QcatKkLXtU4bTjplJtFU96r4XHpsITUUVVuQU8xIXlCAS8sug3cKY88BuG8Pf1aVu0dk7DyFGm8cLAjEKShDqZ/dAVfQMQyQZU3R+9pzzXkR8GvL21LEgELHkUkRGY5kyAeHKBMRmzzXKQQcisXA9NJv2skSOdTai7/s3nPcTHlgHbcU7DJvx/ovo/foVzgi5bfXjzvuj7b/zjaDAtxGUIhzhK1QgOR+fX4ak4k2czv57pArmtnrnM9WajVBveJsFQvfTB5geNvAV68sucCCEeGszdKK7Zpu7SIx2NbJ3cvcA5kunYSLdZVejkFcstJUeCPvEqDMlbLoOt7NhkdHIefUQolKyvIq1dDZgpKkOlk7GGixfONICQSZb+hMfYayLPRiKSslE5vMf+oRBVBMgV08dwJRxgC8EYicNEBO6f2C+9BtMF07hxqTVqwAC4/Z1r/kdS5AeZ+CHvUJgBA6Eq6vzVGmfMMPa0yS4wYu/by2SistB2g5vF4HRvf9Fvgs+gQPhOekSErO+bEm3mvzwZkSnZ3Oa9RyoxMSg360QgU2NmwHCpT4u7xFkbWVP2/W1H2P43Ak+3IMjIlJLt8MxPYGhxuOgb9g5hZHlQbJM6HkZfvkCQ2eOhhaItNK5BeGR5jpMGgdgHzeDtDFkaB0Rn4L0J3awBPcffhOWjobQBMFHFbGxGbrQXcOc2vsoGzyp4YoIviBI9ynpuQZfIZ52qaWVSCvdzruowJnnzek1yKBHvWE3y2lvM0W+6pSZ90J5ZwHictYgMlkLRZSSUZRMvqx95zF2uWExw2zxU4OvsKXaORd/kzSYtQ5j1jIMx4xtKVUGL4ilqOYoK4OYhyKDkEEw80OOCCERIW8mc9IK5e3HrvTgub1Q3nA6HxHyFuQ5ECF3TmPheIrnpvRQbyd4H1MgIOSDKx5RpCkkx5iYn6xFHvAHuLpFHGVyeSgfblvwX801oLkAlQvQq8iX+QD/m8JeR6EHDnSAQi8c1JGlH3fkfH25AuqBXNBQCfMuANZU2Dimlndh6M9xoW+TTwLPE5NByCCYyfM/A4yCX/Y+s20AAAAASUVORK5CYII=',
    width: 800,
    height: 600,
    center: true,
    content: 'https://ps.fktool.com/',
    resizable: true,
    backgroundColor: '#474747',
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
    title: '原神启动',
    icon: 'data:image/bmp;base64,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PVhIsa2ExsGYvbeGMFR6z+j/4PD+2Ov+2ev+3Or93er+3er93u3+2Ov92vH/3/P/3PH/1uv/1e/+1Oz+0uz+0Oz90Ov7z+b9zeX+zOX/yOb90PD/Ll6dj5iZxbycvLicgIRvwt3r6/v/6/z97/r/7/r/7/z+6fT97fn/i5N/8Pv+7vr/7/v96/n6/f//V25sZ3NftKV6qKSKIjp7jafR6vb/3Or+3Or+2ur93+v/4O7+4+3/5O/+4PH/tMfdn7LUorzdxeP0xt7u3vb/3vX/2+7+1e//0+390On9zub+yeb+yej+0fH/IU+UnqaiwbyboqJ+jaK28f//6/z+7vr+7/r/7/z+6vb88Pr/qbmq7vz97fr+8f3/8f//2+zsXnRpiIlpeX5fQWGbOmGq4/j/2Ov91er91uv/2Ov94Ov+4/D95u3/5fD93vD91eb35Pf/5ff/5Pb90eDvcHfIlavc3fj/1/D/1O391e/+0ez80Ov9zef90ez+vN39GEGJwcCjrKWAgJCk8///6fr87vv+7/r/7/v/6/j86vb/z+HV7/z97vr/8P3/+P//l6mlgpiLg4xrTGOSjrH9dpS/2/H/0Oj9z+j+1er/1ev82e/+4u/+6PD+6fX+6fT+6PT/5uz/5u3/5+z/7vP/wNjph4f0ZHHA0+Xy3fL/2uz92+r+2+r90uz+zun/2/D/eKTUV3KStLCDgImO7v//6P3/7fz/7/r/7/v/7/v+5Pb+2O3m7/z97vr/7/3++f//hpSPgpiFNVJrkrH4Tna/1ev/1Ov90uv9z+j61e3/1+r/2uz93+7+5u//5/H+5vL+5vL85O/94+/+4/D+4vH/5fn/ydfrpq7d2en63u7+3+7+3ez+1+r+1Oz+0uz+0Oj+2/b/H1CLsq2Pen198f//7Pr+6vv+7/r/7/r/7vv/5fP95/b37/z97vv+8P//7///j5eMeox5Y4C6fqDtW3+86fj/1Ov+1en92vP/0N/2wtDZ4fT/3u7+5O/+6u/+7PH97vP+5/P+4+/94fD93vH93fH/4Pf/4vn/4PL92+r93ez92+v92Or/1Oz90uz9z+f+1O7/eJzOg42JbW9o7f//6/r+6vv+7/r/7/r/7vz/5/X96PT87v3+7/399P//ssfFysu0bn9tbI3CNl6m0Or/4fH/4er/9v//w72nwYME9cUhxL5r7vj/5/T/5fP+7PL+7vP97vP/7vT+6/T+5vL+4PP83vP+5PH+4PD93uz/3+z92er90+v/0en+z+f9z+f+1Ov/w+L7GDh6R1Rn3/H56/7/6/z/7/r/7/r/7vv/6Pf85vT77vz+8P7++f//k6al3tzAcoF1KUp3h6PV7/3/0Of48Pb/19nRqlkA1IMP3akg5LIY2NfH7/f/7/P+7/P+7/T+2eTv8Pf+7fX97PT/5vX+3fT+3vP95/L93e792Or/1+r/zen8zuj+0Oj+0Oj+0Of/3/b/LFWhAABS1eju8v//7/r/7/r/7vr/7/z96/X/5fH87vz+7/z++f//lKSg2dm+c4N0NVmF1Oz/1+7/iJrR////g1JBoj4AnUkGeRoA0o4JxKx69v//7/P+7vP98Pf/vMvZ9fj/7/T+7vT+7PX/5vL/5/P+6PL94Oz91+z+1Or+zuj9z+b/z+X+0OT+zuX/2/T/VXu+Um27yeHk////+P//8v//9///+v//9v//8///7/z97fv++f//oqye1tm7eYp3Y4S86/7/W3qmkIif////mU8neS0AuGtE/P//lF8Avadz+P//7/X97fX96/X97/n/7/X97/X97/X97PX/6/P+6vP/7PT/4Oz+2e390er8z+b+yOL8yeL9yuH+0Of/3ff/M1ebID6NZX+dh5y0nLLDx93kqr/Mg5eyboWlcIKk7v397/z+9v//p7Cf0tm4hJeBYoG3+f//FCxcl32G8+z37deziVEQ0IVl+///aRsAw7ii+P//8PX97/X97/P/7/P/7/X97/X98vf/8/b/7vT+5vT80uX07Pz/4e7/0uv+0ef/x+H/xuD/yef/pL7Zd4elvczc2Or5yt31uc/0pbzie5bHkrDkr834wuP/zOv/7/z97vr99f//uMCq1dS5mqiRXnyvXnCJAAYmPjlD3MPUZR0OfCEAgScCdRMAXA4A////8vz/8PT97/X97/T+8/r/8/r/9///2+brxtPY8fX/9v3/Z3efY3aV3O366v//3Pn/1/X/1vf/1Pf/qcLhgJWz////+v//7Pv/5ff/5/r/3fb/1/P/zur/yuf/xuL/7/z97/r/8///wsqy1dC3sLqkVXao////cYeeAAAAbmJniWlqchYKZxQCXgoAroeKwczs4PP78vb/9Pn/9/7/0d/itsbFnrOofpmJ5O/48Pb/zej68///aXaPAAAAHB4qSVFZTVNhNTxLAAEYrcXdp8XiV2uWgpy6mq3HkanHiZ/Dd4+4eZXBqcTxrcnvwt387/z97/r/8///yNG50M60zs+6RWaU9///l6KuAAAAAAAADwwMDgEAFwAACwAIITZpp7/g/v//7Pj9u8rLorOrtcm0v9C7wNG+usjH8vr/8vr+rNn+c6LUy+X2wtTZCQsQAAAAAAAAAAAEAAAAm7DE1PL/gKjXJEN2+f//5PT59v//////QVODa4bVdI/eR2Gz7/z97/r/8///yNC6zs211Ne8T26M0N/tqq+5////n6avMDI1AAAAMTlFeYqezuL21ur6p727mK2jv9K+wNe8vdS7w9G6n7Kj9Pn/7vP+8vb9zej8veP/ttTz1ur56vj/WVxn////+///eX2Bi5ag8f//dZ3QXXmY////+///7P39PFKLUW6/fZbjNEucZX3O7/z97vv+8///x864zs2109e5YHyL1ur/7ff/5vH//f//jJGb8fX81/L/tNj4dqXQdZaQvtHCwtW/v9O8u9C6tsu51OjhsMHH9/r/7/P+7/P+8fb+7/b+7Pj97PX/7Pj/u8bS6fP/5fD/8v//pLG55fP/aIXRmrO/////s8fQOVOUgpzoZXzRPVeWp8fugqHJ7vz97/v+8v//zdS/zsyy0dW5fJOZvdTv6PL/4u7+6fL/1uLr8Pv/0+r/frPVjaeWytbFv9DBvdO6utC5u8697Pv8yd7f2unu8vT/7vP+7fP+7PL+6vL/5/P95/T/6PT+6/j/5e7+7vT/7v3/0Of/cJHLJk2T5Pz5aICiU2y7jqjuWHS7dpS68P//g5bDx9/77/z97/r/8v7/0NfIz8yyycy2s8jOk6rP5vX/3e793u794PL/5/f/wNbWeZaIydrGvdG9vtG9tsm5xNXK9P//+P//psXF9Pv/7vL98PT/7vL/7PH+5fL+5fH96fT/6vb/6fj/5vn/nr3PXXyaUHOKeJCVJz1kT2mljKjvi6zrWHLDkKXC5vr/3/j/b4e04fb/7/z97/v/8v7/0t/Szsyu0dbIw9jbYnif4/T/2Or/2+r+3+//2O75aIF3zdnJwM++v8+9ucy4y93R9v//7vz+7v//n7nC7Pb/6vL96fD+6fP+5/P+5PP/5/b/6/v/x9jjnbW8gZuioLirxtzC1ePOcHuVdIrWhKDkdpHNhaLZZ3y0////7vT/sMbkjaTP7v7/6/r+7/n+8fv/2ObhyMms2uDY////VGt9u9Hp4PT/2O//0+j/Y3+AwdLCv8++wdC9vMy3y9rV9v//7/z+8P7/1e7uqMLP6PT/5u//4vD94u//5/T/4/b/rMXLnLK2scTH2Ors+v//z9/Js8XDNkqKb4fLmKvS1OPx8v7/+P//lK3B0uTv9vr/2Ob4Xn6//f//4PT96vb/7Pj/5O3uwcep4evp+///mrC1iaLAfJimxt/3XoOworqnydfD1+jiuMy1xdTM8///8Pr/7/r/9v//ss3Pvdbq4e7/3ev+3fD/5vb/rMHImK+yudHNzuPg8P/+8f///f//orS9GS5zpMHd7P3/+Pr/8vf/8fj/9v//////b4ej6fX99f7/wdftoLnT2fL85vX/6/b/7Pr9vcWq5vHw8P//2ezriKPEz+//cpOmK05QZYB6f5ST3uzpucu/7f//5/3+5P396P7/8v//oLnGxd/52ez/3PD/zOHykauuv8vIwtfS6Pn38v//8Pv/8f//x+DlOUx99f//8/v/8fj/+P//8v//sMXabHqhXW+ZZ36jYnaZ4fH5+v//wMrg2e/33vH74PP+7fv/xs676PHv8f3/+///fZam0u3/oLzcl7Gevc2++f//z97Z5PLw7/3/7vz+7/z87vz8+P//kau6zen/uND2iaPInrOwwc7I0eHi8///8P3/7fv97vz++v//QVaD/P//6vT/+P//zNbniaTBQT1Km3ZRVUcwzd7P7/32////a4SgqbrNz9vv2u732u743vH95fn/zNnM5/Hy7/z/9f//nba6yuT/W3mawNC80+Hf9///1eTf8///7/v+7vv+8f/+8P79+f//hJ+00vD/VHKYl62ry9bO4+7q+v//8f//8/3/8v///P//hZyzyNfu7fz/5vf/bn+ak6m3N0BAtoVHuYRAUkUzyNnJ5vT07v3/////ssvahJi41+//2+373e314PT82Ojq4Ozv6vj/8v7/5vbzbIi/aoaawdG+8///7Pv56fX27/v/7/r/7/r/7vr+7vv/+v//f5+3kazioK+0coh9UW9piaOkt8vMxtTWzuPkxdfYyNfWYn6l+f//oLTKXXGL0ObdOj88lWI/voxXuIZHSTwqydvI5vTz8v//6/v85Pb/6Pv/2+/42O772e/63O/43/L31OXs6vX/6Pn+/f//YX6lfpOe1uXa9P//7vv87/v/7vr/7/r/7vr/7/r/7/r/+///fZi/do+pw8y80tvX////1+jqvM3Quc3Ow9XW4O7x////iaS/gZuvuM7LpbKsKiMhf1Axm2A3t4ZVvpBRQTEfydvO6fT07v7/6vX+4vH+5fT95ff63vH51er81Oz83e/73e743/D54PP87v7/lbG+fZqQ7Pn27/v/7/z+7vr/7vv+7vv+8P3+7vz+7vz+/P//eJWtrL61wsnB+P//8f/+8f//8///9f//8///5fP0Ym51WmNpUVJSKyUjNRsRSywWekswklk3l2Q7q286VTYissK45vDu8P7/6fT+4fL+4/L85PT4/f//7vn62Ov22+v82u303Oz13fH84PT/xt/lfpiL9v//7vn+7vr97/v/7/z97/z98P397v/97//9+P//haKguMG17fn48///7v/97//97//97//97//+8///+///O0BMHQUAQB4PPyQUQSUUSSgUeEYogVAzmWA7f08rfYuI2ePd9P//5/L93vT+4vT+5fP48v7++P//8v/+4fD12+z13e373ez44O/95vn/h6WZ8vv/6fX+6/f+7PX97PX97PX96/T97/r+7/v+9v//o7avzNjS8///7fv/7vv/7/3+7v3+7fv/7/r+7vr+9P//2+7dX21nGgcDPCUVOB0TSiQXWjEdZjYefUgrk1ozREFB0d/U8///3/P/4PD+3/T85fX66/f6+f/++f///P//2/L01O731uz02O764vf/kK6q6vn/5fL87Pf/7fb+6/X+7Pb+7vT97vT97vT99fz/vMbF8vj97/X/7/T97/T97/T97/T97/T97vT97vX+9Pr/uMm80OfXUFlmKA4HOyAUTSkZWzYiYzckeEcujVk1Z0IshZqX6Pb05PT/4/L94vT85PX83e35+P/+7Pr79P7/7/n67Pb87fv72+/32vP+mri45vj84PH83/D85PP+6PT+6/T+7/X97vX97/X98fb/4OXt8ff/7/X97/X97/X97/X97vX97vX97/T98fb/6vD1tcW31uTf/v//BAAGMBoMTC4fRScYPyQUYD4mZjogq3FIZEQrt8G69v//5PP94/X+4vHx3PH98Pr+4PH20+320+v28fr9+v//9///7fv/nb3C4/j94PD43Oz54vP/4vP/5fL+6fb/7PX/7fX/7/P/8Pb+7/P/7/T+7/X97/X97fX96/b96/f+7Pn+8fr/2uLhtce38/r/////Rk5ZLhYKTjAgPiISNBsSJxIOFxgTPDk1Qjs2Higgj52h6fz/5vj+ztjL4/n/3vH46Pf40u370+372e306vj7+///+///n77C5fj/3vH65Pb8s8jb4vX96fT94/P/4vT+7vb+7/X97/X97/P/7/T/7/P+7/T/7vT+7vT+7vT+7/L+8vn/v87H1OTg8/X//f//fIyVMRcLQyYZJg4JKTE3uczQ/////f//+v//9v//5PH74PP/6OzwwriV7v7/2Or76Pr91ez50u391PD90+762/L64/b/qcbM4fT6////6PLzfqrHmLTN7vn/3/L84PP+7fT+8PT+6/b98PP+7/P+7/L96vX+7vP/8PT/7vL97/L/7PP4vMnC8fz/8PP++v7/laexJg8DGQoDTVdi////+P//7/b+7vX/5/P94/T94fL+5fn/1NW9ta6M2+ff2+3/3PL33vT31e/+1u7/1e7/1O7/2fD/0Ov0vNXd7v//mLjHsdX1rsDO9f//5PX35vT87PL97/L/5Pj97/P/7fL97fL+6vX97fP+7/P/7/P+8fX/0dra5e7u7ff/7vP++P//nK23AwAASlRb////8ff/7vT97fX+7fb+6PT+5fP/4ff/2+nm3NW1lpB0x8eu4vP/3+/92vT71e/81u7/1e//1+7/2e/92vL60On0v9nrfqPMe6HNxsnE8///9Pz+9//+9f/98/z88Pr+6/r98fn98/n98fv+7/n97vn+7fb/4vDy0t/c/v//8/r+7/r99f//jZehJCMt////+v3/9/z+9f3+9P396/n93vP94ff+7v382tK13Nu7',
    width: 800,
    height: 600,
    center: true,
    content: 'https://ys.fancyb.top/',
    backgroundColor: '#2e5192',
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
  {
    title: 'Flow-epub阅读器',
    icon: flowicon,
    width: 800,
    height: 600,
    center: true,
    content: "https://app.flowoss.com/zh-CN",
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
export { magnetConfig, desktopConfig };

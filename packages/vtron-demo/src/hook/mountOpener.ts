// import { BrowserWindow, System } from 'vtron';
// import ImageVue from '../components/apps/Image.vue';

// export function mountOpener(system: System) {
//   system.registerFileOpener(['.jpg', '.png'], {
//     name: '图片预览',
//     icon: '',
//     func: (path, content) => {
//       new BrowserWindow({
//         title: path,
//         icon: '',
//         width: 800,
//         height: 600,
//         resizable: true,
//         center: true,
//         content: ImageVue,
//         config: {
//           path: path,
//           content: content,
//         },
//       }).show();
//     },
//   });
// }

/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-06-24 15:53:38
 * @Description: 
 * @FilePath: /myindex/src/main.ts
 */
import { createApp } from 'vue'
import App from './App.vue';
import Win10 from './plug'
import backimg from "./assets/back.jpg"
const app = createApp(App).use(Win10,{
    if_logo_show: true,
    start_time: 0,
    backimg: backimg,
    // login: {
    //   user_name: 'AdDD',
    //   user_password:'123'
    // },
    // start_menu_logo: brow,
  })
app.mount('#app-hash')
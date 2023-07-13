/*
 * @Author: Royal
 * @LastEditTime: 2022-06-24 15:53:38
 * @Description: 
 * @FilePath: /myindex/src/main.ts
 */
import { createApp } from 'vue'
import App from './App.vue';
import Win10 from './packages/plug'
import backimg from "./assets/back.jpg"
const app = createApp(App).use(Win10)
app.mount('#app-hash')
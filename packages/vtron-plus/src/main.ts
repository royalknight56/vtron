import vtron from 'vtron';
import 'vtron/distlib/style.css';
import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
// import 'xterm/css/xterm.css'
createApp(App).use(vtron).mount('#app');

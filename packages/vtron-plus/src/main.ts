import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import vtron from "vtron";
import "vtron/distlib/style.css";
// import 'xterm/css/xterm.css'
createApp(App).use(vtron).mount("#app");

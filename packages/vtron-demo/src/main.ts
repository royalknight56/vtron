/*
 * @Author: Royal
 * @LastEditTime: 2022-09-26 17:02:38
 * @Description: 在main中引入vtron，并use
 */
import { createApp } from "vue";
import App from "./App.vue";
// Main中引入vtron，并且引入样式文件
import vtron from "vtron";
import "vtron/distlib/style.css";
import "xterm/css/xterm.css";
import backimg from "./assets/back.jpg";

import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/tracing";

import mavonEditor from "mavon-editor";
import "mavon-editor/dist/css/index.css";

// use引入的插件，第二个选项是配置项
const app = createApp(App);
app.use(vtron).use(mavonEditor).mount("#app");

Sentry.init({
  app,
  dsn: "https://2d8aca35eff545bc92eb2bd1a4015b5e@o1342161.ingest.sentry.io/6615966",
  integrations: [
    new BrowserTracing({
      tracingOrigins: ["localhost", "myim.online", /^\//],
    }),
  ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

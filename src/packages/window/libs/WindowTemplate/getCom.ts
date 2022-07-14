/*
 * @Author: Royal
 * @LastEditTime: 2022-07-06 15:22:35
 * @Description: 
 */
import { onBeforeMount, ref, defineAsyncComponent } from "vue";
import * as Vue from 'vue'
// @ts-ignore
import { loadModule } from 'vue3-sfc-loader'

function compileStringToComponent(string: string) {
  const options = {
    moduleCache: {
      vue: Vue,
    },
    getFile() {
      return Promise.resolve(string);
    },
    addStyle(styleStr: string) {
      const style = document.createElement('style');
      style.textContent = styleStr;
      const ref = document.head.getElementsByTagName('style')[0] || null;
      document.head.insertBefore(style, ref);
    },

    log(type: any, ...args: any) {
      console.log(type, ...args);
    }
  }
  let com = defineAsyncComponent(() => loadModule(`dyc.vue`, options));
  return com
}
function fetchComponent(url: string) {
  return fetch(url,
    {
      method: 'GET',
    }).then(response => response.json())
    .then(text => {
      return compileStringToComponent(text.content)
    })
}
export { compileStringToComponent, fetchComponent }
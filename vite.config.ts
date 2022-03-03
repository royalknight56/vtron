/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-03-03 15:27:33
 * @Description: 
 * @FilePath: /myindex/vite.config.ts
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// https://vitejs.dev/config/
export default defineConfig({
  // server:{
  //   https:true
  // },
  plugins: [vue()
  ]
})

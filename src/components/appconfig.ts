/*
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-19 16:13:34
 * @Description: 
 * @FilePath: /myindex/src/components/appconfig.ts
 */
import { defineComponent, shallowReactive } from "vue";
interface appInfo{
    name: string,
    apptemp: string,
    icon:string,
    width:number,
    height:number,
    tmp:ReturnType<typeof defineComponent>
}

import { UnwrapNestedRefs } from "@vue/reactivity";

// import computer from "../assets/computer.ico"
// import beat from "../assets/beat.ico"
// import brow from "../assets/浏览器.png"
// import term from "../assets/term.ico"
// import vscode from "../assets/vscode.png"
// // import img1 from "../assets/term.ico"
// import GitHub from "../assets/GitHub.png"

// import { reactive } from "vue"

// import Test1 from "../apps/Test1.vue"
// import Test2 from "../apps/Test2.vue"
// import Test3 from "../apps/Test3.vue"

// import app_console from "../apps/app_console.vue"
// import app_vscode from "../apps/app_vscode.vue"
// import Adm_loading from "../apps/Adm_loading.vue"
// import GitStars from "../apps/GitStars.vue"


let appList:UnwrapNestedRefs<Array<appInfo>> = shallowReactive([
    // {
    //     name: '我的电脑',
    //     apptemp: 'Test1',
    //     icon:computer,
    //     width:400,
    //     height:400,
    //     tmp:Test1
    // }, {
    //     name: '版本信息',
    //     apptemp: 'Test2',
    //     icon:beat,
    //     width:100,
    //     height:100,
    //     tmp:Test2
    // }, {
    //     name: '浏览器',
    //     apptemp: 'Test3',
    //     icon:brow,
    //     width:600,
    //     height:500,
    //     tmp:Test3
    // },{
    //     name: '终端',
    //     apptemp: 'app_console',
    //     icon:term,
    //     width:400,
    //     height:400,
    //     tmp:app_console

    // },{
    //     name: 'vscode',
    //     apptemp: "app_vscode",
    //     icon:vscode,
    //     width:600,
    //     height:500,
    //     tmp:app_vscode
    // },
    // {
    //     name: '后台管理',
    //     apptemp: "Adm_loading",
    //     icon:term,
    //     width:300,
    //     height:400,
    //     tmp:Adm_loading
    // },
    // {
    //     name: '点个star',
    //     apptemp: "GitStars",
    //     icon:GitHub,
    //     width:300,
    //     height:400,
    //     tmp:GitStars
    // },
])

export {appList,appInfo}
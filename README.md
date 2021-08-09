<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-09 11:35:34
 * @Description: 
 * @FilePath: /myindex/README.md
-->
# Win10 UI 框架 Vue3

<span style="color:#999;text-align:center">推荐 Vue 3 + Typescript + Vite + Using `<script setup>`
</span>

<a href="http://myim.online" target="_blank">Demo</a>
<!-- : [myim.online](http://myim.online) -->



# Component 组件

<span style="color:#999;text-align:center">
建议在单独页面中加入以下全部组件
</span>

```html
    <TaskBarVue></TaskBarVue>
    <MenuListVue></MenuListVue>
    <DesktopVue></DesktopVue>
    <BluescenVue></BluescenVue>
```
    
### TaskBar
win10的任务栏
### MenuList
右键的菜单
### Desktop
桌面的图标
### Bluescen
屏幕状态

# Class 类

## DragWindow

引入DragWindow类
构造对象，使用后会在屏幕上显示一个窗口

```js
import {DragWindow} from './components/window/libs/DragWindow'
import Help from './components/window/apps/Help.vue';
new DragWindow(100,100,'关于',200,100,Help)

```

DragWindow参数：

```js
DragWindow(x:number,y:number,title:string,width:number,height:number,content:Object)
```

|  名称   | 含义  |
|  ----  | ----  |
| x  | 左上角位置坐标x |
| y  | 左上角位置坐标y |
| title  | 窗口名称 |
| width  | 窗口宽度 |
| height  | 窗口高度 |
| content  | 窗口的vue对象 |

## MenuIPC

单例模式

## WindowIPC

单例模式
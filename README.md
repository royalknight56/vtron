<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-09 17:34:27
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
建议在单独页面中加入以下组件
</span>

```html
<winVue></winVue>
```
```js
import winVue from "./components/win.vue";
```
    
<!-- ### TaskBar
win10的任务栏
### MenuList
右键的菜单
### Desktop
桌面的图标
### Bluescen
屏幕状态 -->

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

这个类是单例，用于集中管理窗口的状态信息。储存了窗口的状态HashMap

单例模式，调用类的静态成员函数getInstance获取实例

```js
WindowIPC.getInstance()
```
### 实例属性：

```ts
pageMap: UnwrapNestedRefs<pageMapInter>;//窗口的hashMap
```
### 成员函数：

#### getWinnum
```ts
getWinnum() 
```
用于获取窗口编号

#### registerWindow
```ts
registerWindow(id: string, title: string):PageItem 
```
注册一个窗口，需要id，标题

返回PageItem

PageItem：
```ts
interface PageItem {
    id: string,
    wid: number,
    title: string,
    zindex: number,
    ifShow: boolean,
    iftop: boolean,
    ifDestory: boolean,
    ifMax:boolean
}
```

#### unRegisterWindow
```ts
unRegisterWindow(id: string) 
```
注销一个窗口的注册信息


#### upSetWindowIndex
```ts
upSetWindowIndex(id: string):number
```
将窗口移动到顶层


#### hideWindow

```ts
hideWindow(id: string)
```
最小化一个窗口

#### showWindow

```ts
showWindow(id: string)
```
显示窗口

#### destoryWindow

```ts
destoryWindow(id: string)
```
销毁窗口

#### maxWindow

```ts
maxWindow(id: string) 
```
最大化窗口
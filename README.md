<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2021-08-10 17:17:51
 * @Description: 
 * @FilePath: /myindex/README.md
-->
# Win10 UI 框架 Vue3

<span style="color:#999;text-align:center">推荐 Vue 3 + Typescript + Vite + Using `<script setup>`
</span>

<a href="http://myim.online" target="_blank">Demo</a>|<a href="http://myim.online" target="_blank">Demo</a>|<a href="http://myim.online" target="_blank">Demo</a>
<!-- : [myim.online](http://myim.online) -->

# Usage

## 开发流程
1. 引入winVue租组件

```html
<winVue></winVue>
```
```js
import winVue from "./components/win.vue";
```

2. 在apps文件夹下新建vue文件，这个是窗口的内容

3. 在components/window/appconfig.ts下配置桌面的图标
格式：

```js
{
    name: 图标名称,
    apptemp: 组件文件名,
    icon:public图标路径,
    width:宽度,
    height:高度
}
```

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
import Help from './apps/Help.vue';
new DragWindow(100,100,'关于',200,100,{content:Help})

```

DragWindow参数：

```js
DragWindow(x:number,y:number,title:string,width:number,height:number,app:Object)
```

|  名称   | 含义  |
|  ----  | ----  |
| x  | 左上角位置坐标x |
| y  | 左上角位置坐标y |
| title  | 窗口名称 |
| width  | 窗口宽度 |
| height  | 窗口高度 |
| app  | 窗口的选项 |

```js
app:{
    content:窗口的vue对象
    props:传递给vue对象的props
    use:挂载的插件的数组
}
```

usage:
```js
new DragWindow(0, 0, 'Admin后台管理', 300, 400, { content: AdmVue, use: [ElementPlus] })
```

## MenuIPC

这个类是单例模式，用于管理右键菜单（弹出菜单）。在引入MenuListVue组件后，可以在屏幕上调出菜单

调用类的静态成员函数getInstance获取实例

```js
MenuIPC.getInstance():WindowIPC
```
### 实例属性：

### 成员函数：

#### callMenu

```ts
callMenu(x:number,y:number,list:UnwrapNestedRefs<Array<menuItem>>)
```

|  名称   | 含义  |
|  ----  | ----  |
| x  | 左上角位置坐标x |
| y  | 左上角位置坐标y |
| list  | 选项菜单数组 |

```ts
interface menuItem{
    name:string,
    func:Function
}
```
usage:
```ts
MenuIPC.getInstance().callMenu(e.pageX, e.pageY,
        [
            { name: '关机', func: () => { 
                console.log("关机"); computerCTC.getInstance().closePower() } },
            { name: '重启', func: () => { 
                console.log("重启"); computerCTC.getInstance().restartPower() } }

        ]
    )
```

## WindowIPC

这个类是单例模式，用于集中管理窗口的状态信息。储存了窗口的状态HashMap

调用类的静态成员函数getInstance获取实例

```js
WindowIPC.getInstance():WindowIPC
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

#### on

```ts
on(ev:string,func:Function)
```
注册一个事件

#### emit

```ts
emit(ev:string,...args:any)
```
触发一个事件

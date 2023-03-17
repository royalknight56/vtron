# 整个vue app实例改为只能有一个win实例。
这样考虑是因为通过vue可以控制多个win实例了，就不需要再通过system来控制了。这样也能提高api的调用方便程度。
参考electron的文档，electron的app实例只能有一个。
直接通过app来控制。

Electron 
Proton 
Neutron 

app这种方式不太适合，还是调用system去控制
```js
import { app, BrowserWindow } from 'Magneton'
let win = new BrowserWindow()
const { BrowserWindow } = require('electron')

const win = new BrowserWindow({ width: 800, height: 600 })

// Load a remote URL
win.loadURL('https://github.com')

// Or load a local HTML file
win.loadFile('index.html')

app.whenReady().then(() => {
  createWindow()
})
// Magneton 调用方式：
import { System, BrowserWindow } from 'Magneton'
let system = new System({});
system.whenReady().then(() => {
  system.addApp({
    name: 'app1',
    entry: 'http://localhost:8080'||win,
    window: {
      width: 800,
      height: 600
    }
  });
})

let win = new BrowserWindow({
});

```

# 修改了配置项
改为更加语义化的配置项

# 目录结构

通过再hooks里，通过分类不同的文件夹，来管理不同的功能。这样可以更加清晰的看到不同的功能。
是一种更加充血的模式，摒弃原先的按文件类型去分组。

# 库的调用方式

注册了屏幕组件。Screen。
通过调用Screen组件。将内容显示在vueapp内。
接着调用System类，实例化之后，Screen就会自动显示内容，但是没有实例化的时候，Screen是会呈现黑屏状态的，代表系统没有开机。

# API

## System
```js
import {System} from "Magneton";
let system = new System({
  // 配置项
  // 1. 是否开启调试模式
  debug: true,
  // 2. 是否开启全屏
  fullscreen: true,
});

system.whenReady().then(()=>{
    system.addApp(
        {
            name: 'app1',
            icon: 'http://localhost:8080/favicon.ico',
            entry: 'http://localhost:8080',
        }
    );
    system.addApp(
        [{
            entry: win,
        }]
    );
},(err)=>{

});

```
## HTTP

HTTP是一种广泛用于Web应用程序的协议。在Node.js中，可以使用http模块提供的API来创建HTTP服务器和客户端。以下是一些常用的HTTP相关API：

http.createServer([options][, requestListener])：创建HTTP服务器，options是可选参数，可以设置服务器的一些选项，requestListener是一个回调函数，用于处理收到的HTTP请求。
http.Server：HTTP服务器对象，提供了一些事件和方法，例如request事件、listen方法等。
http.request(options[, callback])：创建HTTP客户端请求，options是一个对象，包含请求的选项，callback是一个回调函数，用于处理响应。
http.get(options[, callback])：和http.request()类似，但是用于发送HTTP GET请求。
response.writeHead(statusCode[, statusMessage][, headers])：设置HTTP响应头的信息，statusCode是响应状态码，statusMessage是可选的状态消息，headers是一个包含响应头信息的对象。
response.write(chunk[, encoding][, callback])：向HTTP响应中写入数据，chunk是要写入的数据，encoding是可选的字符编码，callback是一个可选的回调函数，表示数据写入完成。
response.end([data][, encoding][, callback])：结束HTTP响应，data是可选的响应体数据，encoding是可选的字符编码，callback是一个可选的回调函数，表示响应结束完成。
request.abort()：终止HTTP请求。
request.setHeader(name, value)：设置HTTP请求头信息，name是请求头名称，value是请求头的值。
request.write(chunk[, encoding][, callback])：向HTTP请求中写入数据，chunk是要写入的数据，encoding是可选的字符编码，callback是一个可选的回调函数，表示数据写入完成。
这些API可以帮助您构建基于HTTP协议的Web应用程序和客户端。

## 指向内部http的浏览器

上面通过http server 已经创建了一个服务器，通过某个链接去请求的时候，请求会发送到这个http实例。
这样就打通了fs与请求，可以实现简单的浏览器功能。

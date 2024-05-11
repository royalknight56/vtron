
# 修改了配置项

改为更加语义化的配置项

# 目录结构

通过再hooks里，通过分类不同的文件夹，来管理不同的功能。这样可以更加清晰的看到不同的功能。
是一种更加充血的模式，摒弃原先的按文件类型去分组。

# 库的调用方式

注册了屏幕组件。Screen。
通过调用Screen组件。将内容显示在vueapp内。
接着调用System类，实例化之后，Screen就会自动显示内容，但是没有实例化的时候，Screen是会呈现黑屏状态的，代表系统没有开机。


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

## 窗口的创建与关闭，销毁

在electron中，通过BrowserWindow类来创建窗口，通过win.close()来关闭窗口，通过win.destroy()来销毁窗口。

这里在桌面的软件是直接传入了BrowserWindow实例，这样这个窗口会一直在内存中，需要找到一种方法使得窗口在关闭的时候，也会被销毁。

## 把电脑功能的打开目录，创建等功能分离

通过类似于vue跨平台的方式，把这些能力提取为平台无关的，可以保证在网盘应用上，复用现有的能力

## 终端在执行命令的时候，调用可执行程序

## 环境变量

在系统中存储环境变量，环境变量中包含了一些用户或者终端的信息，环境变量存在文件中，在系统启动的时候加载

环境变量中包含终端的一些基本信息，包括但不限于：

PATH：包含可执行文件的路径，当在终端中输入一个命令时，终端会查找 PATH 中列出的路径，以找到对应的可执行文件。

HOME：当前用户的主目录路径。

USER：当前登录的用户名。

SHELL：当前使用的 shell 的路径。

TERM：当前终端的类型。

LANG/LC\_\*：当前系统的语言和区域设置。

PWD：当前工作目录的路径。

PS1：终端提示符的格式设置。

## window 设置url内容

## 新建文件时，会覆盖原有的

## 无法重命名文件

## 在窗口加载时，在标题后面添加loading

# 重构2（代码就是在不断的重构中成长的！）

又不兼容了！！

## system 初始化api设计

现在在Screen组件中没有传入system参数，这样不太对，因为没有体现两个实体之间的联系。

下一版改为需要传入system参数，这样就能体现联系。

改为 <Screen :system="system">

## 系统状态

现在状态管理比较混乱，考虑引入pinia来管理状态。
一个state，不止保存值，也要给出action。

## 高内聚，低耦合

UI和逻辑分离的不彻底

核心逻辑和其他逻辑分离的不彻底。

new System 创建的实例，这里的逻辑都应该属于kernel层。

创建出来的实例，需要传入Screen，Screen组件接收之后的显示逻辑，都属于UI层。

借此逻辑，整个项目分为三层文件夹：kernel、ui、services

kernel
｜- file 文件系统组件，负责文件的增删改查
｜- state 状态管理
｜- event 事件管理

ui
｜- screen 屏幕组件（暂定）比较重要，因为这个组件接收system实例，是kernel层和ui层的桥梁
｜- application 存放系统内置应用
｜- widgets 存放UI组件，例如按钮，输入框
｜- layout 组织布局
｜- shell 终端，也属于ui，tui

services 存放可供系统调用的组件
|- dialog
|- tray
|- menu
|- notification
|- window

utils

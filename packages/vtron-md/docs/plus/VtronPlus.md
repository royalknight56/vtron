# vtron-plus

## 介绍(Description)

vtron-plus 是一个基于 vtron 的插件，它提供了一些常用的功能，比如文件管理器，系统信息，一些文件浏览器等功能

vtron-plus is a plugin based on vtron, it provides some common functions, such as file manager, system information, some file browsers, etc.

## 安装(Installation)

```bash
npm install vtron-plus
```

## 使用(Usage)

```typescript
import { System } from "vtron";
import { vtronPlus } from "vtron-plus";
let system = new System({});
system.whenReady().then(() => {
  system.use(VtronPlus);
});
```

## 功能(Features)

### Terminal

提供了一个终端，可以在终端中执行命令

Provides a terminal that can execute commands in the terminal

### 文件管理器(File Manager)

提供了我的电脑，可以查看当前的文件系统，并对文件进行一些操作

Provides "my computer", you can view the current file system and perform some operations on the file.

### 图片浏览器(Image Browser)

提供了一个图片浏览器，在打开 type 为 image/png 等类型的文件时会自动打开

Provides an image browser, which will automatically open when opening a file of type image/png, etc.

### 文本编辑器(Text Editor)

提供了一个文本编辑器，在打开 type 为 text/plain 等类型的文件时会自动打开

### 视频播放器(Video Player)

可以播放 mp4 格式的视频

### 音频播放器(Audio Player)

可以播放 mp3 格式的音频

### PDF 阅读器(PDF Reader)

提供了一个 PDF 阅读器，在打开 type 为 .pdf 等类型的文件时会自动打开

### DOC 浏览器(DOC Browser)

提供了一个 DOC 浏览器，在打开 type 为 .doc 等类型的文件时会自动打开

### XLS 浏览器(XLS Browser)

提供了一个 XLS 浏览器，在打开 type 为 .xls 等类型的文件时会自动打开

### PPT 编辑器

提供了一个 PPT 编辑器，在打开 type 为 .ppt 等类型的文件时会自动打开

还可以编辑 PPT

<!--
### 系统信息(System Information)
### 系统设置(System Settings)
### 系统日志(System Log)
### 系统监控(System Monitor)
### 系统更新(System Update)
### 系统备份(System Backup)
### 系统还原(System Restore) -->

### 计算器(Calculator)

提供了一个计算器

### 浏览器(Browser)

提供了一个浏览器

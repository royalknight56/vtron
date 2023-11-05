# vtron-plus

## Description

vtron-plus is a plugin based on vtron, it provides some common functions, such as file manager, system information, some file browsers, etc.

## Installation

```bash
npm install vtron-plus
```

## Usage

```typescript
import { System } from "vtron";
import { vtronPlus } from "vtron-plus";
let system = new System({});
system.whenReady().then(() => {
  system.use(VtronPlus);
});
```

## Features

### File Manager

Provides "my computer", you can view the current file system and perform some operations on the file.

### Image Browser

Provides an image browser, which will automatically open when opening a file of type image/png, etc.

### Text Editor

Provides a text editor, which will automatically open when opening a file of type text/plain, etc.

### Video Player

Able to play videos in mp4 format.

### Audio Player

Able to play audio in mp3 format.

### PDF Reader

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

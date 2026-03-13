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
import { System } from 'vtron';
import { vtronPlus } from 'vtron-plus';
let system = new System({});
system.whenReady().then(() => {
  system.use(vtronPlus());
});
```

## 功能(Features)

### 备份恢复和导入文件

提供了一个备份恢复和导入文件的功能，可以将系统中的文件备份到一个文件中，也可以将备份的文件恢复到系统中

### 音乐库

提供了一个音乐库，可以查看当前系统中的音乐，并对音乐进行一些操作

### 图片库

提供了一个图片库，可以查看当前系统中的图片，并对图片进行一些操作

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

### Word 文档编辑器(Word Editor)

提供了一个富文本文档编辑器，支持以下功能：

- 富文本编辑：加粗、斜体、下划线、删除线
- 段落样式：标题 1-4、正文
- 字号选择、字体颜色、背景高亮
- 列表：有序列表、无序列表
- 对齐：左对齐、居中、右对齐、两端对齐
- 撤销/重做、插入分割线
- 底部字数统计
- 通过 fs 保存和读取文件，格式为 `.vtdoc`（HTML 内容）
- 快捷键：Ctrl+S 保存

Feature 标识：`word`

### XLS 浏览器(XLS Browser)

提供了一个 XLS 浏览器，在打开 type 为 .xls 等类型的文件时会自动打开

### Excel 表格编辑器(Excel Editor)

提供了一个电子表格编辑器，支持以下功能：

- 50 行 × 26 列 (A-Z) 可编辑网格
- 单元格编辑：单击选择、双击或直接输入进入编辑模式
- 公式栏显示当前单元格引用和内容
- 格式化：加粗、斜体、下划线、对齐方式、背景色、字体色
- 多工作表：新建、删除、重命名工作表
- 键盘导航：方向键、Tab、Enter、Delete
- 通过 fs 保存和读取文件，格式为 `.vtxls`（JSON）
- 快捷键：Ctrl+S 保存，Ctrl+B/I/U 格式化

Feature 标识：`excel`

### PPT 演示编辑器(PPT Editor)

提供了一个幻灯片演示编辑器，支持以下功能：

- 幻灯片管理：左侧缩略图面板，新增/删除幻灯片
- 文本框操作：添加、拖拽移动、四角缩放、双击编辑
- 格式化：字号、加粗、斜体、文字颜色、对齐方式
- 幻灯片背景色设置
- 放映模式：全屏演示，支持方向键/点击/空格翻页，Escape 退出
- 画布自适应：16:9 画布按比例缩放居中显示
- 通过 fs 保存和读取文件，格式为 `.vtppt`（JSON）
- 快捷键：Ctrl+S 保存，Delete 删除元素，Escape 取消选择

Feature 标识：`pptEditor`

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

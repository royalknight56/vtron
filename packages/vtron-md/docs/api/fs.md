# fs

fs 是用于在浏览器端进行文件操作的库，使用了类似于 node fs 的接口。vtron 提供了两种文件系统实现：

- **VtronFileSystem**：基于 IndexedDB，数据持久化保存，页面刷新后数据不丢失。
- **VtronMemoryFileSystem**：基于内存（Map），数据不持久化，页面刷新后数据丢失，适用于无需持久化的场景，或服务端渲染等无 IndexedDB 环境。

在应用中 fs 需要等待 system 完成初始化工作之后才能使用，所以，在 new System 的运行帧中，fs 是不可用的。可以调用 system.whenReady() 来等待 system 初始化完成。

## 使用方式

默认使用 `VtronFileSystem`（IndexedDB），如需使用内存文件系统，通过 System 配置项传入：

```typescript
import { System, VtronMemoryFileSystem } from 'vtron';

const system = new System({
  fs: new VtronMemoryFileSystem('/'),
});
```

## isFirstRun

文件系统提供 `isFirstRun` 属性，用于判断是否为首次运行：

- **VtronFileSystem**：当 IndexedDB 数据库首次创建时为 `true`，已存在数据库时为 `false`。
- **VtronMemoryFileSystem**：始终为 `true`，因为内存无持久化，每次启动都视为首次运行。

```typescript
system.whenReady().then(() => {
  console.log(system.fs.isFirstRun); // true or false
});
```

## 类型定义

```typescript
class VtronFileInfo {
  isFile: boolean = true;
  isDirectory = false;
  isSymlink = false;
  size = 0;
  mtime = new Date();
  atime = new Date();
  birthtime = new Date();
  constructor(
    isFile?: boolean,
    isDirectory?: boolean,
    isSymlink?: boolean,
    size?: number,
    mtime?: Date,
    atime?: Date,
    birthtime?: Date
  ) {}
}
class VtronFile {
  path: string;
  parentPath: string;
  content: string;
  constructor(path: string, content: string, info: Partial<VtronFileInfo>);
}
```

## VtronFileInterface

所有文件系统实现均需实现此接口：

```typescript
interface VtronFileInterface {
  isFirstRun: boolean;
  whenReady: () => Promise<VtronFileInterface>;
  readFile: (path: string) => Promise<string | null>;
  writeFile: (path: string, data: string, opt?: { flag?: 'w' | 'a' | 'wx' }) => Promise<void>;
  appendFile: (path: string, content: string) => Promise<void>;
  readdir: (path: string) => Promise<VtronFileWithoutContent[]>;
  exists: (path: string) => Promise<boolean>;
  stat: (path: string) => Promise<VtronFileWithoutContent | null>;
  unlink: (path: string) => Promise<void>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
  rm: (path: string) => Promise<void>;
  rmdir: (path: string) => Promise<void>;
  mkdir: (path: string) => Promise<void>;
  copyFile: (src: string, dest: string) => Promise<void>;
  chmod: (path: string, mode: number) => Promise<void>;
  search: (keyword: string) => Promise<VtronFileWithoutContent[]>;
  serializeFileSystem: () => Promise<unknown>;
  deserializeFileSystem: (files: VtronFile[]) => Promise<unknown>;
  removeFileSystem: () => Promise<void>;
  registerWatcher: (path: RegExp, callback: (path: string, content: string) => void) => void;
  on: (event: 'error', callback: (err: string) => void) => void;
}
```

## readFile

读取一个文件的内容

read the content of a file

```typescript
readFile(path: string): Promise<string | null>;

import { system } from "./system";
system.fs.readFile("path/to/file").then((data)=>{
    //...
})
```

## writeFile

写入文件内容到指定路径，如果文件不存在则创建文件

write content to a file, if the file is not exist, it will be created

```typescript
 writeFile(path: string, content: string): Promise<void>;

import { system } from "./system";
system.fs.writeFile("path/to/file","hello world")
```

## appendFile

在文件末尾追加内容

append content to the end of a file

```typescript
appendFile(path: string, content: string): Promise<void>;

import { system } from "./system";
system.fs.appendFile("path/to/file","hello world")
```

## mkdir

创建一个文件夹

create a folder

```typescript
mkdir(path: string): Promise<void>;

import { system } from "./system";
system.fs.mkdir("path/to/folder")
```

## readdir

读取指定路径下的所有文件和文件夹

read all files and folders in a path

```typescript
class VtronFileInfo {
    isFile: boolean = true;
    isDirectory = false;
    isSymlink = false;
    size = 0;
    mtime = new Date();
    atime = new Date();
    birthtime = new Date();
    constructor(isFile?: boolean, isDirectory?: boolean, isSymlink?: boolean, size?: number, mtime?: Date, atime?: Date, birthtime?: Date) {
    }
}
class VtronFile {
    path: string;
    parentPath: string;
    content: string;
    constructor(path: string, content: string,
    info: Partial<VtronFileInfo>,);
}

readdir(path: string): Promise<VtronFile[]>;

import { system } from "./system";
system.fs.readdir("path/to/folder").then((files)=>{
    //...
    files.forEach((file)=>{
        console.log(file.name)
    })
})
```

## exists

判断指定路径的文件或文件夹是否存在

check if a file or folder is exist

```typescript

exists(path: string): Promise<boolean>;

import { system } from "./system";
system.fs.exists("path/to/file").then((exist)=>{
    //...
})
```

## stat

获取指定路径的文件或文件夹的信息

get the info of a file or folder

```typescript
stat(path: string): Promise<VtronFile | null>;

import { system } from "./system";
system.fs.stat("path/to/file").then((file)=>{
    //...
})
```

## unlink

删除指定路径的文件

delete a file

```typescript
unlink(path: string): Promise<void>;

import { system } from "./system";
system.fs.unlink("path/to/file")
```

## rename

重命名指定路径的文件或文件夹

rename a file or folder

```typescript
rename(path: string, newPath: string): Promise<void>;

import { system } from "./system";
system.fs.rename("path/to/file","path/to/new/file")
```

## rmdir

删除指定路径的文件夹，这个操作会删除这个文件夹下的所有文件和文件夹

delete a folder, this operation will delete all files and folders in this folder

```typescript
rmdir(path: string): Promise<void>;

import { system } from "./system";
system.fs.rmdir("path/to/folder")
```

## chmod

设置文件权限，

文件权限用二进制表示

```ts
export enum VtronFileMode {
  Read = 0b001, //1
  Write = 0b010, //2
  Execute = 0b100, //4
  ReadWrite = Read | Write, //3
  ReadExecute = Read | Execute, //5
  WriteExecute = Write | Execute, // 6
  ReadWriteExecute = Read | Write | Execute, //7
}
```

usage：

```ts
chmod('path/to/file', 0b001);
```

# fs

fs 是用于在浏览器端进行文件操作的库，使用了类似于node fs的接口，文件保存在内部的indexedDB中。保存时间和大小相较于localStorage都有明显的提升

在应用中 fs需要等待system完成初始化工作之后才能使用，所以，在new System的运行帧中，fs是不可用的。可以调用system.whenReady()来等待system初始化完成。

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
```

## readFile

读取一个文件的内容

read the content of a file

```typescript
readFile(path: string): Promise<string | null>;

import { useSystem } from "vtron";
const system = useSystem();
system.fs.readFile("path/to/file").then((data)=>{
    //...
})
```

## writeFile

写入文件内容到指定路径，如果文件不存在则创建文件

write content to a file, if the file is not exist, it will be created

```typescript
 writeFile(path: string, par: {
        content: string;
    }): Promise<void>;

import { useSystem } from "vtron";
const system = useSystem();
system.fs.writeFile("path/to/file",{
    content:"hello world",
})
```

## appendFile

在文件末尾追加内容

append content to the end of a file

```typescript
appendFile(path: string, content: string): Promise<void>;

import { useSystem } from "vtron";
const system = useSystem();
system.fs.appendFile("path/to/file","hello world")
```
## mkdir

创建一个文件夹

create a folder

```typescript
mkdir(path: string): Promise<void>;

import { useSystem } from "vtron";
const system = useSystem();
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

import { useSystem } from "vtron";
const system = useSystem();
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

import { useSystem } from "vtron";
const system = useSystem();
system.fs.exists("path/to/file").then((exist)=>{
    //...
})
```

## stat

获取指定路径的文件或文件夹的信息

get the info of a file or folder

```typescript
stat(path: string): Promise<VtronFile | null>;

import { useSystem } from "vtron";
const system = useSystem();
system.fs.stat("path/to/file").then((file)=>{
    //...
})
```

## unlink

删除指定路径的文件

delete a file

```typescript
unlink(path: string): Promise<void>;

import { useSystem } from "vtron";
const system = useSystem();
system.fs.unlink("path/to/file")
```

## rename

重命名指定路径的文件或文件夹

rename a file or folder

```typescript
rename(path: string, newPath: string): Promise<void>;

import { useSystem } from "vtron";
const system = useSystem();
system.fs.rename("path/to/file","path/to/new/file")
```

## rmdir

删除指定路径的文件夹，这个操作会删除这个文件夹下的所有文件和文件夹

delete a folder, this operation will delete all files and folders in this folder

```typescript
rmdir(path: string): Promise<void>;

import { useSystem } from "vtron";
const system = useSystem();
system.fs.rmdir("path/to/folder")
```
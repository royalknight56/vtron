# Shell

shell可以用来执行一些系统命令，比如`ls`、`cd`、`open`等等。

构建时，需要传入shell的路径，作为shell的工作路径

## constructor

构造函数

```typescript
constructor(system:System,router: string = '/C',user: string = 'root')
```

usage

```typescript
import { useSystem ,Shell} from "vtron";
const system = useSystem();
const shell = new Shell(system,'/C','root')
```

## handleCommand

传入需要执行的命令

```typescript
handleCommand(command: string): Promise<void>;
```

可以执行的命令有：

### cat

查看文件内容

### cd

切换目录

### echo

输出内容

### ls

查看目录下的文件

### open

打开文件

### pwd

查看当前目录

### rm

删除文件

### sh

执行shell脚本

### touch

创建文件

### node

执行node函数

node后面如果是文件地址，则执行文件中的内容

如果是js代码，则执行js代码

执行的时候，需要传入main函数

例如：

```js
function main(system){
    system.fs
}
```

main函数可以接收一个参数，是当前的system。

## 输出重定向

在命令中加入 > 可以将输出的命令重定向到文件中

```shell
echo "hello world" > hello.txt
```


## 终端(Terminal)

提供了一个终端，可以执行以上的命令


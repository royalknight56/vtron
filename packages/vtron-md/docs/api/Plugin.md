# Plugin

Vtron 可以通过多种方式进行扩展！

例如可以通过自定义 fs 去接入其他文件系统

也可以通过注册文件打开器，来打开其他类型的文件

在系统启动的时候，都会去读取/C/System/plugs 目录下的文件

之后会使用 shell 运行每个文件。

```js
function main(system) {
  console.log(system);
}
```

这样，就可以通过添加 plug 下的文件，调用 system 的方法来扩展功能。

## 插件开发指南

TODO

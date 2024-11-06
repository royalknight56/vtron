# 在Iframe内部对框架操作

vtron提供了一种在其他页面中，进行操作的方法。

例如，被嵌入的应用是url时，可以在url所指向的页面中操作窗口和系统。

下面是一个示例。

在vtron编写的主应用（基座应用）中，定义新的app。
    
```ts
const sys = new System({
  id: 0,
  desktop: [
    {
      name: '测试app',
      icon: testicon,
      multiple: false,
      window: {
        content: 'http://localhost:5174',
        title: '测试app',
        icon: testicon,
        center: true,
      },
      order: 2,
    },
  ]
});
```

http://localhost:5174是其他应用的地址。可能是vue应用，也可能是react的应用。

在被嵌入的应用中，可以通过vtron提供的api，来操作窗口和系统。

例如，可以通过以下代码，来关闭窗口。

```ts
window.parent.postMessage(
    {
        type: "browser-window",
        action: "destroy",
        params: [],
    },
    "*",
);
```

type是消息类型，action是操作类型，params是参数。

目前有以下操作类型：

browser-window: 调用本窗口的成员方法

system: 调用系统的方法

save-return: 保持上一次操作的返回值

invoke-return: 调用上一次操作的返回值

例如，可以通过以下代码，来创建一个窗口，并改变窗口状态

```ts

window.parent.postMessage(
    {
        type: "system",
        action: "createWindow",
        params: [
        {
            title: "",
            width: 500,
            height: 106,
            content: url,
            show: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            backgroundColor: "#444",
        },
        ],
    },
    "*",
);
window.parent.postMessage(
    {
        type: "save-return",
        id: "lyricWindow",
    },
    "*",
);

window.parent.postMessage(
    {
        type: "invoke-return",
        id: "lyricWindow",
        action: "setBackgroundColor",
        params: ["#00000000"],
    },
    "*",
);
```

第一步，通过调用system的createWindow方法，创建一个窗口。

接下来要及时保存返回值，供下一步操作调用，通过save-return消息，设置一个保存的id。

最后，通过invoke-return消息，调用上一步保存的返回值，调用setBackgroundColor方法，改变窗口的背景颜色。id是上一步保存的id。
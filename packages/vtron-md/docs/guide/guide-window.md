
# 窗口
## 窗口中的操作

下面是包含了部分api操作的示例

```vue
<template>
  <div class="outer">
    {{ sys?.version }}
  </div>
</template>
<script lang="ts" setup>
import { Notify, BrowserWindow, System } from 'vtron';
import { inject, onMounted, ref, onUnmounted } from 'vue';
// 通过inject获取到窗口所在的系统的信息
const system = inject<System>('system')!;
/**
 * 有两种在窗口中使用system的方法，一种是通过inject注入，一种是直接引入system的实例
 * const system = new System();
 * export {
 *  system
 * }
 * 
 * 这样就可以在窗口中直接使用system的实例
 * import { system } from './system';
 * 
 */

// 通过inject导入本窗口的信息
const browserWindow: BrowserWindow = inject('browserWindow') as BrowserWindow;

// 获取本地保存的md文件
system.fs.readFile('/C/User/Note/test.md').then((res) => {
  console.log(res);
});

// 监听窗口的部分事件
browserWindow.on('move', (...arg: any) => {
  console.log('move', arg);
});
browserWindow.on('resize', (...arg: any) => {
  console.log('resize', arg);
});
browserWindow.on('state', (...arg: any) => {
  console.log('state', arg);
});

function nextStep(fun: () => void, time?: number) {
  return new Promise((resolve) => {
    const res = fun();
    setTimeout(() => {
      resolve(res);
    }, time || 50);
  });
}
await nextStep(() => {
  // 获取窗口的位置大小
  const [x, y] = browserWindow.getPosition();
  const [width, height] = browserWindow.getSize();
  // 调用系统提示,创建之后，会在屏幕右下角显示消息通知
  new Notify({
    title: 'title',
    content: `${x},${y},${width},${height}`,
    timeout: 5000,
  });
}, 100);
await nextStep(() => {
  // 设置窗口的位置大小
  browserWindow.setPosition(100, 100);
  browserWindow.setSize(500, 500);
}, 100);

await nextStep(() => {
  // 将窗口居中
  browserWindow.center();
}, 100);

await nextStep(() => {
  const title = browserWindow.getTitle();
  // 设置窗口的标题
  browserWindow.setTitle('新标题');
}, 100);
await nextStep(() => {
  // 窗口最大化
  browserWindow.maximize();
}, 200);
await nextStep(() => {
  // 恢复窗口状态
  browserWindow.restore();
}, 100);
await nextStep(() => {
  // 窗口最小化
  browserWindow.minimize();
}, 200);
await nextStep(() => {
  // 恢复窗口状态
  browserWindow.restore();
}, 100);

await nextStep(() => {
  // 设置窗口全屏
  browserWindow.setFullScreen(true);
}, 100);
await nextStep(() => {
  browserWindow.setFullScreen(false);
}, 100);

</script>
```

## 创建一个窗口

在一个应用中，可以使用`BrowserWindow`类创建一个窗口

```vue
<template>
  <div class="outer">
    <button @click="createWindow">创建窗口</button>
  </div>
</template>
<script lang="ts" setup>
import { BrowserWindow } from 'vtron';
import { ref } from 'vue';
const createWindow = () => {
  const win = new BrowserWindow();
  win.show();
};
</script>
```
通过实例化`BrowserWindow`类，可以创建一个窗口，然后通过`show`方法显示出来

还有另一种方法，通过system的`createWindow`方法创建窗口

```vue
<template>
  <div class="outer">
    <button @click="createWindow">创建窗口</button>
  </div>
</template>
<script lang="ts" setup>
import { system } from './system';
import { ref } from 'vue';
const createWindow = () => {
  const win = system.createWindow({
    content: ///....,
    title: 'Hello',
  });
  win.show();
};
</script>
```

这两种方法有细微的区别，`system.createWindow`创建的窗口，是在当前系统中创建的窗口，

而`BrowserWindow`创建的窗口是没有指定`system`的，之所以会在当前`system`显示出来窗口，是因为`BrowserWindow`类默认是当前的`system`。

可以通过`BrowserWindow.system` 查看到当前`BrowserWindow`的默认`system`，一般是最后创建的`system`实例。

当我们创建多个`system`的时候，就必须使用`system.createWindow`来创建窗口了。


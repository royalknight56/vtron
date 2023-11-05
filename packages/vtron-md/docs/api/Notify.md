# Notify
Notify可以随时调用，在new一个Notify的时候，会在右下角展示一个提示，可以设置timeout，当timeout时间到了，会自动消失

## constructor
<!-- interface NotifyConstructorOptions {
    title: string;
    content: string;
    timeout?: number;
} -->
<!-- constructor(option: NotifyConstructorOptions) { -->
```ts
constructor(option: NotifyConstructorOptions)
interface NotifyConstructorOptions {
    title: string;
    content: string;
    timeout?: number;
}
```
在右下角展示一个提示

Usage:
```ts
import { Notify } from "vtron";
const notify = new Notify({
    title: "title",
    content: "content",
    timeout: 3000,
});
```




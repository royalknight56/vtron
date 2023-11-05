# Notify

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




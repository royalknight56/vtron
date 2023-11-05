# Dialog

Dialog 是一个特定类型的窗体，用于显示消息、接受用户输入以及向用户提出选择。

因为调用方式比较方便，只需要传入一些配置信息，就可以显示一个对话框，所以 Dialog 也可以用于显示一些简单的提示信息。

注意：打开Dialog时，会阻塞其他窗体，直到用户关闭Dialog。

## showMessageBox
```ts
 showMessageBox(
    option:{
        message?: string;
        type?: 'info' | 'error' | 'question' | 'warning';
        title?: string;
        buttons?: string[];
    }):Promise<{
        response: number;
    }>
```

response 是用户点击的按钮的索引

response is the index of the button clicked by the user.

usage:
```ts
import { Dialog } from "@/packages/feature/dialog/Dialog";
import { Notify } from "@/packages/plug";

async function handleClick(){
    let res = await Dialog.showMessageBox({
        type: 'info',
        title: 'title',
        message: '无法将文件移动到“C:',
        buttons: ['确定', '取消']
    });
    /*
    res:
    {
        response: 0
    }
    */
    new Notify({
        title: 'title',
        content: JSON.stringify(res),
        timeout: 5000
    });
}
```
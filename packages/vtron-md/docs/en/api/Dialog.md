# Dialog

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
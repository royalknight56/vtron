# event

事件系统可以监听系统的一些时间触发，也可以手动触发事件

例如常用的有contextMenu.show 事件，触发此事件之后，就会在传入的鼠标事件的位置弹出自定义的右键菜单

## startmenu.hidden

当这个事件触发时，会隐藏startmenu

when this event is triggered, startmenu will be hidden

## startmenu.show

当这个事件触发时，会显示startmenu

when this event is triggered, startmenu will be shown

## contextMenu.hidden

当这个事件触发时，会隐藏contextMenu

when this event is triggered, contextMenu will be hidden

## contextMenu.show

当这个事件触发时，会显示contextMenu

when this event is triggered, contextMenu will be shown

usage:

```typescript
import { useSystem } from "vtron";
const system = useSystem();
ev:MouseEvent
system?.emitEvent('contextMenu.show', {
        mouse: ev,
        menuList: [
            {
                name: '打开',
                click: () => {
                    openFolder(item)
                }
            },
            {
                name: '删除',
                click: () => {
                    if (item.type == 'dir') {
                        system?.fs.rmdir(item.path).then(() => {
                            refersh(router_url.value)
                        });
                    } else {
                        system?.fs.unlink(item.path).then(() => {
                            refersh(router_url.value)
                        });
                    }
                }
            },
        ]
    })
```
# event

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
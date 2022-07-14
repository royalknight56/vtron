import { reactive, ref, Ref, } from "vue";
import { UnwrapNestedRefs } from "@vue/reactivity";
import {System} from '@libs/System';

/*
 * @Author: Royal
 * @LastEditTime: 2022-07-14 18:56:44
 * @Description: 右键菜单控制
 * @FilePath: /myindex/src/components/window/libs/ContextMenu.ts
 * Need CodeReview 
 */
interface menuItem {
    name: string,
    func: Function
}
class ContextMenu {
    private static instance: ContextMenu;

    x: Ref<number>;
    y: Ref<number>;
    menuList: UnwrapNestedRefs<Array<menuItem>>;
    ifShow: Ref<boolean>;
    ifTopDown: Ref<boolean>;
    system:System;
    constructor(system:System) {
        this.system = system;
        this.menuList = reactive([]);
        this.ifShow = ref(false);
        this.x = ref(0);
        this.y = ref(0);
        this.ifTopDown = ref(true)
    }

    private getPosToOuterTop(el: HTMLElement): number {
        if (el.id == 'win10id') {
            return 0;
        }
        let _this = this;
        if (el.offsetParent||el.parentElement) {
            return _this.getPosToOuterTop((el.offsetParent||el.parentElement) as HTMLElement) + (el.offsetTop||0);
        }else{
            return el.offsetTop;
        }
        
    }
    private getPosToOuterLeft(el: HTMLElement): number {
        if (el.id == 'win10id') {
            return 0;
        }
        let _this = this;

        if (el.offsetParent||el.parentElement) {
            return _this.getPosToOuterLeft((el.offsetParent||el.parentElement) as HTMLElement) + (el.offsetLeft||0);
        }else{
            return el.offsetLeft;
        }
        
    }
    callMenu(e: MouseEvent, list: UnwrapNestedRefs<Array<menuItem>>) {
        document.addEventListener("click", (e) => {
            this.ifShow.value = false
        }, {
            once: true
        })
        if (this.y.value > document.body.offsetHeight / 2) {
            this.ifTopDown.value = false
        } else {
            this.ifTopDown.value = true;
        }
        this.x.value = this.getPosToOuterLeft(e.target as HTMLElement) + e.offsetX ;
        this.y.value = this.getPosToOuterTop(e.target as HTMLElement)+ e.offsetY;
        this.ifShow.value = true
        this.menuList.splice(0, this.menuList.length);
        this.menuList.push(...list);
    }
}

export {
    ContextMenu,
    menuItem
}
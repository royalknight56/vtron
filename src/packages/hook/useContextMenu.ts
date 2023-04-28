import * as fspath from "@/packages/feature/core/Path";
import { useSystem } from "@/packages/feature/system";
import { BrowserWindow } from "@/packages/feature/window/BrowserWindow";
import FileProps from '@/packages/feature/builtin/FileProps.vue';
import { VtronFile } from "@/packages/feature/core/fileSystem";

function createNewFile(path: string){
    let system = useSystem();
    if(!system) return Promise.reject();
    return system.fs.writeFile(
        fspath.join(path, '新建文件'), {
        content: "",
        icon: 'file',
        type: "file"
    })
}

function openPropsWindow(path:string){
    new BrowserWindow({
        title: '属性',
        content: FileProps,
        config: {
            content: path
        },
        width: 350,
        height: 400,
        resizable: false,
    }).show();
}

export {
    createNewFile,
    openPropsWindow
}
import * as fspath from "@/packages/feature/core/Path";
import { useSystem } from "@/packages/feature/system";
import { BrowserWindow } from "@/packages/feature/window/BrowserWindow";
import FileProps from '@/packages/feature/builtin/FileProps.vue';
import { VtronFile } from "@/packages/feature/core/fileSystem";

async function createNewFile(path: string){
    let system = useSystem();
    if(!system) return;
    let newFilePath = fspath.join(path, '新建文件');
    if(await system.fs.exists(newFilePath)){
        let i = 1;
        while(await system.fs.exists(fspath.join(path, `新建文件(${i})`))){
            i++;
        }
        newFilePath = fspath.join(path, `新建文件(${i})`);
    }
    return await system.fs.writeFile(
        newFilePath, {
        content: "",
    })
}
async function createNewDir(path: string){
    let system = useSystem();
    if(!system) return;
    let newFilePath = fspath.join(path, '新建文件夹');
    if(await system.fs.exists(newFilePath)){
        let i = 1;
        while(await system.fs.exists(fspath.join(path, `新建文件夹(${i})`))){
            i++;
        }
        newFilePath = fspath.join(path, `新建文件夹(${i})`);
    }
    return await system.fs.mkdir(newFilePath);
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
    openPropsWindow,
    createNewDir
}
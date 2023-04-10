<!--
 * @Author: Royal
 * @LastEditTime: 2022-01-27 15:13:59
 * @Description: 
 * @FilePath: /publishTest/src/components/apps/MyComputer.vue
-->
<template>
    <div class="uper">
        <div class="group">
            <!-- <div class="button">文件</div> -->
            <!-- <div class="button">计算机</div> -->
            <!-- <div class="button">查看</div> -->
            <div class="button" @click="createFolder()">新建</div>
            <div class="button" @click="backFolder()">返回</div>
            <!-- <div class="button" @click="newFolder()">新建</div> -->
        </div>
        <div class="uper_nav">
            <div class="uper_nav_button" @click="backFolder()">
                <svg t="1632984723698" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
                    p-id="10100">
                    <path
                        d="M862.485 481.154H234.126l203.3-203.3c12.497-12.497 12.497-32.758 0-45.255s-32.758-12.497-45.255 0L135.397 489.373c-12.497 12.497-12.497 32.758 0 45.254l256.774 256.775c6.249 6.248 14.438 9.372 22.627 9.372s16.379-3.124 22.627-9.372c12.497-12.497 12.497-32.759 0-45.255l-203.3-203.301h628.36c17.036 0 30.846-13.81 30.846-30.846s-13.81-30.846-30.846-30.846z"
                        p-id="10101" />
                </svg>
            </div>
            <div class="uper_nav_button" @click="backFolder()">
                <svg t="1632984737821" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
                    p-id="10249">
                    <path
                        d="M885.113 489.373L628.338 232.599c-12.496-12.497-32.758-12.497-45.254 0-12.497 12.497-12.497 32.758 0 45.255l203.3 203.3H158.025c-17.036 0-30.846 13.811-30.846 30.846 0 17.036 13.811 30.846 30.846 30.846h628.36L583.084 746.147c-12.497 12.496-12.497 32.758 0 45.255 6.248 6.248 14.438 9.372 22.627 9.372s16.379-3.124 22.627-9.372l256.775-256.775a31.999 31.999 0 0 0 0-45.254z"
                        p-id="10250" />
                </svg>
            </div>
            <div class="uper_nav_button uper_nav_button_small" @click="backFolder()">
                <svg t="1639145779758" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
                    p-id="3080">
                    <path
                        d="M533.333333 516.266667l-174.933333-170.666667-64 59.733333 234.666667 234.666667L768 405.333333l-59.733333-59.733333-174.933334 170.666667z"
                        fill="#444444" p-id="3081" />
                </svg>
            </div>
            <div class="uper_nav_button" @click="backFolder()">
                <svg t="1639145815176" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
                    p-id="3860">
                    <path
                        d="M554.666667 268.8v601.6h-85.333334V268.8L337.066667 401.066667 277.333333 341.333333 512 106.666667 746.666667 341.333333l-59.733334 59.733334L554.666667 268.8z"
                        fill="#444444" p-id="3861" />
                </svg>
            </div>

            <div @click="start_input()" v-if="path_state == 'pendding'" class="path">
                <span>{{ router_url }}</span>
            </div>
            <div @focusout="end_input()" v-if="path_state == 'inputing'" class="path_inputing">
                <input v-model="router_url" @blur="isVia(router_url, true)" />
            </div>
        </div>
    </div>
    <div class="desk-outer" ref="compu" @contextmenu="showOuterMenu($event)">
        <div draggable="true" class="desk-item" v-for="(item, index) in currentList" @dblclick="openFolder(item)"
            @contextmenu="showMenu(item, index, $event)">
            <div class="item_img">

                <img v-if="item.icon === 'dir'" draggable="false" width="50" :src="foldericon" />
                <img v-else-if="item.icon === 'file'" draggable="false" width="50" :src="unknownicon" />
                <img v-else-if="item.icon" draggable="false" width="50" :src="item.icon" />
                <img v-else draggable="false" width="50" :src="unknownicon" />
                <!-- <img draggable="false" width="50" :src="item ? item.icon === 'dir' ? foldericon : item.icon : foldericon" /> -->
            </div>
            <div class="item_name">{{ item.name }}</div>
        </div>
        <div draggable="true" class="desk-item" v-if="creating">
            <div class="item_img">
                <img draggable="false" width="50" :src="foldericon" />
            </div>
            <input class="item_input" v-model="createInput" @blur="creatingEditEnd">
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import type { UnwrapNestedRefs } from "vue";
// import folderimg from "../assets/newFolder.ico";
import foldericon from "@/packages/assets/folder.ico";
import unknownicon from "@/packages/assets/unknown.ico";

// import { Notify, useSystem } from "vtron";
import { Notify } from "../notification/Notification";
import { useSystem } from "../system";
import { BrowserWindow } from "@/packages/plug";
import FileProps from '@/packages/feature/builtin/FileProps.vue';

let system = useSystem();

function pathJoin(...paths: string[]) {
    return paths.join('/').replace(/\/+/g, '/');
}

const createInput = ref("新建文件夹");
const creating = ref(false);
function creatingEditEnd() {
    if (creating.value) {
        // judge if the name is valid
        system?.fs.mkdir(pathJoin(router_url.value, createInput.value)).then(() => {
            refersh(router_url.value);
        }, (err) => {
            new Notify({
                title: "新建文件夹失败",
                content: err,
            });
        });
        creating.value = false;
        createInput.value = "新建文件夹";

    }
}

function showOuterMenu(e: MouseEvent) {
    system?.emitEvent('contextMenu.show', {
        mouse: e,
        menuList: [
            {
                name: '新建文件',
                click: () => {
                    useSystem()?.fs.writeFile(
                        pathJoin(router_url.value, '新建文件'), {
                        content: "",
                        name: "新建文件",
                        icon: unknownicon,
                        type: "file"
                    }).then(()=>{
                        refersh(router_url.value);
                    });
                }
            }
        ]
    });
}
function createFolder() {
    creating.value = true;
}
let router_url = ref("");
watch(router_url, async (newVal, oldVal) => {
    refersh(newVal);
})
router_url.value = "/";
async function refersh(newVal: string) {
    if (!await isVia(newVal)) return;
    let result = await system?.fs.readdir(newVal);
    if (result) currentList.value = result;
}
async function isVia(newVal: string, alert: boolean = false) {
    if (newVal === '') newVal = '/';
    else if (newVal === '/') newVal = '/';
    else if (newVal.endsWith('/')) newVal = newVal.substr(0, newVal.length - 1);
    let isExist = await system?.fs.exists(newVal);
    if (!isExist) {
        if (alert) new Notify({
            title: "路径不存在",
            content: newVal,
        });
        return false;
    }
    return true
}
let currentList = ref<Array<any>>([]);

function openFolder(item: any) {
    if (item.type == 'dir') {
        router_url.value = item.path;
    } else {
        system?.openFile(item.path);
    }
}
function showMenu(item: any, index: number, ev: MouseEvent) {
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
                name: '属性',
                click: () => {
                    new BrowserWindow({
                        title: '属性',
                        content: FileProps,
                        config: {
                            content: item
                        },
                        width: 350,
                        height: 400,
                        resizable: false,
                    }).show();
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
}
function backFolder() {
    let path = router_url.value;
    let arr = path.split('/');
    arr.pop();
    router_url.value = arr.join('/');
}

// function startDrag(ev: DragEvent, item: Folder) {
//     ev?.dataTransfer?.setData('fromobj', 'web');
//     ev?.dataTransfer?.setData('frominfo', JSON.stringify(item));
//     ev?.dataTransfer?.setData('fromid', item.id.toString());
//     // console.log(ev?.dataTransfer)
//     // console.log(item)
//     // ev?.dataTransfer?.setData('text', ev.target.id);
// }

// // 拖到文件放下时
// function folderDrop(ev: DragEvent, item: Folder, index: number) {
//     let fromInfo = JSON.parse(ev?.dataTransfer?.getData('frominfo') || '{}')
//     let fromId = ev?.dataTransfer?.getData('fromid')
//     // console.log(fromInfo)
//     // console.log(item)
//     if (fromInfo.id == item.id) {
//         return;
//     }
//     let file = findFileById(Number(fromId))

//     if (file) {
//         deleteFileById(Number(fromId))
//         folderStack[folderStack.length - 1]?.children?.[index]?.children?.push(file)
//     }
// }
// 拖动文件上传
let compu = ref(null);
onMounted(() => {

    var oBox = <any>compu.value as HTMLElement;
    if (oBox) {
    } else {
        return;
    }
    // var oM = document.getElementById('m1');

    let timer = 0;
    document.ondragover = function () {
        clearTimeout(timer);
        timer = window.setTimeout(function () {
            // oBox.style.display = 'none';
        }, 200);
        //    oBox.style.display = 'block';
    };
    //进入子集的时候 会触发ondragover 频繁触发 不给ondrop机会
    oBox.ondragenter = function () {
        // oBox.innerHTML = '请释放鼠标';
    };
    oBox.ondragover = function () {
        return false;
    };
    oBox.ondragleave = function () {
        // oBox.innerHTML = '请将文件拖拽到此区域';
    };
    oBox.ondrop = function (ev: DragEvent) {
        let fromobj = ev?.dataTransfer?.getData('fromobj');
        if (fromobj == 'web') {
            // 无效

        } else {
            var oFileList = ev?.dataTransfer?.files;
            readFileList(oFileList);
        }

        return false;
    };
})
async function readFileList(list: FileList | undefined) {

    let len = list?.length || 0;
    for (let i = 0; i < len; i++) {
        let item = list?.[i];

        // let oFile = null;
        let reader = new FileReader();
        //读取成功
        reader.onload = function () {
            // console.log(reader);
        };
        reader.onloadstart = function () {
            // console.log('读取开始');
        };
        reader.onloadend = function () {
            if (item?.type == 'image/jpeg' || item?.type == 'image/png' || item?.type == 'image/gif' || item?.type == 'image/bmp' || item?.type == 'image/webp') {
                system?.fs.writeFile(pathJoin(router_url.value, item?.name), {
                    content: reader.result as string,
                    type: item?.type || 'text/plain',
                    icon: reader.result as string,
                    name: item?.name || 'Unknown',
                }).then((res) => {
                    refersh(router_url.value)
                });
            } else {


                system?.fs.writeFile(pathJoin(router_url.value, item?.name || 'unknow'), {
                    content: decodeURIComponent(escape(atob((reader.result?.toString() || '').split(',')[1]))),
                    type: item?.type || 'file',
                    icon: 'file',
                    name: item?.name || 'Unknown',
                }).then((res) => {
                    refersh(router_url.value)
                });
            }
            // system?.fs.writeFile(router_url.value + '/' + item?.name, {
            //     content: reader.result as string,
            //     type: item?.type || 'text/plain',
            //     icon: reader.result as string,
            //     name: item?.name || 'Unknown',
            // }).then((res) => {
            //     refersh(router_url.value)
            // });
            // newFile(item?.name || 'Unknown', reader.result as string)
        };
        reader.onabort = function () {
            // console.log('中断');
        };
        reader.onerror = function () {
            // console.log('读取失败');
        };
        reader.onprogress = function (ev) {
            var scale = ev.loaded / ev.total;
            if (scale >= 0.5) {
                // alert(1);
                reader.abort();
            }
            // console.log(scale);
            // oM.value = scale * 100;
        };
        reader.readAsDataURL(new Blob([item as BlobPart]));
    }
}


let path_state = ref('pendding');
function start_input() {
    path_state.value = 'inputing';
}
function end_input() {
    console.log(router_url.value)
    path_state.value = 'pendding';
}
</script>
<style scoped>
.desk-outer {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    align-content: flex-start;
    flex-wrap: wrap;
}

.desk-item {
    position: relative;
    cursor: default;
    /* user-select: none; */
    box-sizing: border-box;
    /* display: flex; */
    /* align-items: center; */
    width: 70px;
    height: 90px;
    background-color: rgba(119, 119, 119, 0);
    color: white;
    /* text-shadow: 0px 0px 3px #000000; */
    border: 1px solid rgba(0, 0, 0, 0);
}

.desk-item:hover {
    border: 1px solid rgba(255, 255, 255, 0.521);
    background-color: rgba(255, 255, 255, 0.281);
}

.item_img {
    width: 50px;
    height: 40px;
    overflow: hidden;
    padding: 10px;
    text-align: center;
}

.item_img img {
    user-select: none;
}

.item_name {
    overflow: hidden;
    max-width: 200px;
    color: rgba(0, 0, 0, 0.664);
    text-align: center;
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}

.item_input {
    width: 100%;
}

.uper {
    /* height: 40px; */
    background-color: rgba(255, 235, 205, 0);
    font-size: 12px;
    font-weight: 300;
    /* border-bottom: 1px solid black; */
    --button-item-height: 30px;
}

.group {
    display: flex;
    border-bottom: 1px solid rgba(134, 134, 134, 0.267);
    /* padding: 4px 0px; */
}

.button {
    cursor: pointer;
    text-align: center;
    width: 50px;
    transition: all 0.1s;
    background: #ffffff;
    font-family: sans-serif;
    font-size: 12px;
    padding: 2px 4px;
    transition: 0.1s;
    white-space: nowrap;
}

.button:hover {
    /* background-color: #137bd2; */
    background-color: #1b6bad;
    color: white;
}

.uper_nav {
    /* height:var(--button-item-height); */
    display: flex;
}

.uper_nav_button {
    width: calc(var(--button-item-height) - 10px);
    height: var(--button-item-height);
    line-height: var(--button-item-height);
    padding: 4px;
    margin: 0 auto;
    flex-shrink: 0;
    text-align: center;
    filter: brightness(230%);
    display: flex;
    justify-content: center;
    align-items: center;
}

.uper_nav_button_small {
    width: calc(var(--button-item-height) - 16px);
}

.uper_nav_button svg {
    width: calc(var(--button-item-height) - 16px);
    height: calc(var(--button-item-height) - 16px);
}

.path {
    height: calc(var(--button-item-height));
    width: 100%;
    line-height: calc(var(--button-item-height) - 6px);
    padding: 1px 5px;
    margin: 2px 2px;
    border: 1px solid rgba(134, 134, 134, 0.267);
    transition: all 0.1s;
    /* text-align: center; */
    overflow: auto;
    user-select: none;
}

.path span {
    height: var(--button-item-height);
    /* text-align: center; */
    line-height: var(--button-item-height);
}

.path_inputing {
    height: calc(var(--button-item-height));
    width: 100%;
    line-height: calc(var(--button-item-height) - 6px);
    padding: 1px 5px;
    margin: 2px 2px;
    border: 1px solid rgba(134, 134, 134, 0.267);
    transition: all 0.1s;
    user-select: text;
}

.path_inputing input {
    height: 100%;
    width: 100%;
    /* padding: 1px 5px; */
    /* text-align: center; */
    line-height: var(--button-item-height);
    background: none;
    border: none;
    outline: none;
}

.path:hover {
    border: 1px solid rgb(0, 102, 255);
}
</style>
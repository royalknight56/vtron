<!--
 * @Author: Royal
 * @LastEditTime: 2022-10-25 13:51:37
 * @Description: 
 * @FilePath: /publishTest/src/components/apps/GotoReadMe.vue
-->

<template>
    <div class="outer">
        <div class="uper">
            <button class="change uper_button" @click="changeUrl">
                <svg t="1632984723698" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10100" width="20" height="20"><path d="M862.485 481.154H234.126l203.3-203.3c12.497-12.497 12.497-32.758 0-45.255s-32.758-12.497-45.255 0L135.397 489.373c-12.497 12.497-12.497 32.758 0 45.254l256.774 256.775c6.249 6.248 14.438 9.372 22.627 9.372s16.379-3.124 22.627-9.372c12.497-12.497 12.497-32.759 0-45.255l-203.3-203.301h628.36c17.036 0 30.846-13.81 30.846-30.846s-13.81-30.846-30.846-30.846z" fill="" p-id="10101"></path></svg>
            </button>
            <button class="change uper_button" @click="changeUrl">
                <svg t="1632984737821"  class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10249" width="20" height="20"><path d="M885.113 489.373L628.338 232.599c-12.496-12.497-32.758-12.497-45.254 0-12.497 12.497-12.497 32.758 0 45.255l203.3 203.3H158.025c-17.036 0-30.846 13.811-30.846 30.846 0 17.036 13.811 30.846 30.846 30.846h628.36L583.084 746.147c-12.497 12.496-12.497 32.758 0 45.255 6.248 6.248 14.438 9.372 22.627 9.372s16.379-3.124 22.627-9.372l256.775-256.775a31.999 31.999 0 0 0 0-45.254z" fill="" p-id="10250"></path></svg>
            </button>
            <button class="change uper_button" @click="changeUrl">
                 <svg t="1632984867128" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1857" width="15" height="15"><path d="M927.999436 531.028522a31.998984 31.998984 0 0 0-31.998984 31.998984c0 51.852948-10.147341 102.138098-30.163865 149.461048a385.47252 385.47252 0 0 1-204.377345 204.377345c-47.32295 20.016524-97.6081 30.163865-149.461048 30.163865s-102.138098-10.147341-149.461048-30.163865a385.47252 385.47252 0 0 1-204.377345-204.377345c-20.016524-47.32295-30.163865-97.6081-30.163865-149.461048s10.147341-102.138098 30.163865-149.461048a385.47252 385.47252 0 0 1 204.377345-204.377345c47.32295-20.016524 97.6081-30.163865 149.461048-30.163865a387.379888 387.379888 0 0 1 59.193424 4.533611l-56.538282 22.035878A31.998984 31.998984 0 1 0 537.892156 265.232491l137.041483-53.402685a31.998984 31.998984 0 0 0 18.195855-41.434674L639.723197 33.357261a31.998984 31.998984 0 1 0-59.630529 23.23882l26.695923 68.502679a449.969005 449.969005 0 0 0-94.786785-10.060642c-60.465003 0-119.138236 11.8488-174.390489 35.217667a449.214005 449.214005 0 0 0-238.388457 238.388457c-23.361643 55.252253-35.22128 113.925486-35.22128 174.390489s11.8488 119.138236 35.217668 174.390489a449.214005 449.214005 0 0 0 238.388457 238.388457c55.252253 23.368867 113.925486 35.217667 174.390489 35.217667s119.138236-11.8488 174.390489-35.217667A449.210393 449.210393 0 0 0 924.784365 737.42522c23.368867-55.270316 35.217667-113.925486 35.217667-174.390489a31.998984 31.998984 0 0 0-32.002596-32.006209z" fill="" p-id="1858"></path></svg>
            </button>
           
            <input class="urlinput" v-model="urlinput" @keydown="urlkey"/>
        </div>
        
        <iframe class="broifame" :src="urlsrc"></iframe>
    </div>
</template>
<script lang="ts" setup>
import { BrowserWindow } from "vtron";
import { ref,inject } from "vue";

let browserWindow = <BrowserWindow>inject('browserWindow')
window.open('https://v3w10.myim.online')
setTimeout(() => {
    window.open('https://v3w10.myim.online');
})

let urlinput = ref('https://v3w10.myim.online')
let urlsrc = ref('https://v3w10.myim.online')
function urlkey(e:KeyboardEvent) {
    if (e.code == 'Enter') {
        changeUrl()
    }
}
function changeUrl() {
    if(/^(http|https):\/\//.test(urlinput.value)){
        urlsrc.value=urlinput.value
    }else{
        urlsrc.value='https://'+urlinput.value
    }
}
window.open=<any>function(e:any) { 
}
</script>
<style>
iframe {
    overflow: auto;
    width: 100%;
    height: 100%;
}
</style>
<style scoped>
.outer {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}

.tablist{
    box-sizing: border-box;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 12px;
    height: 46px;
    padding: 8px 3px 4px 3px;
    background: #dee1e6;
    border-radius: 5px 5px 0 0;
    overflow: hidden;

    box-sizing: border-box;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 12px;
    height: 46px;
    padding: 8px 3px 4px 3px;
    background: #dee1e6;
    border-radius: 5px 5px 0 0;
    overflow: hidden;
}
.uper{
    display: flex;

    box-sizing: border-box;
    position: relative;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 12px;
    height: 46px;
    padding: 8px 3px 4px 3px;
    background: #f2f4f7;
    border-radius: 5px 5px 0 0;
    overflow: hidden;
}
.urlinput {
    margin: 0px 10px;
    padding: 0px 10px;
    border-radius: 60px;
    border: 0px solid rgba(0, 0, 0, 0.295);
    background: #e7e9ecbd;
    outline: none;
    width: 100%;
}
.urlinput:focus{
    background: #ffffffd8;
}
.uper_button{
    width: 30px;
    border-radius: 30px;
    border: none;
    outline: none;
    background-color: rgba(0, 0, 0, 0);
}
.uper_button:hover{
    background-color: rgba(255, 255, 255, 0.555);

}
.broifame{
    /* height: 100%; */
    width: 100%;
}
</style>
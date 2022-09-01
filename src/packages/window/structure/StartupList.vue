<template>
  <div class="sulist_outer">
    <div class="sulist_item" v-for="(item, index) in appList" @click="openApp(item)">
      <div class="item_img">
        <img class="item_img-img" draggable="false" :src="item.icon" />
      </div>
      <div class="item_name">{{ item.name }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { UnwrapNestedRefs } from "vue";
import { inject, reactive } from "vue";
// import { appList } from "@state/index";
import type { appInfo } from "@state/type"
import { openInfo } from "@builtin/callSystemWins";
import { System } from '@libs/System'
let system = <System>inject('system')

let appList = system.State.startupList

function openApp(item: UnwrapNestedRefs<appInfo>) {
  item.window.show();
}

function rightClick(item: UnwrapNestedRefs<appInfo>, e: MouseEvent) {
  system.ContextMenu.callMenu(e,
    [
      { name: '打开(O)', click: () => { item.window.show(); } },
      {
        name: '属性(R)', click: () => {
          openInfo(system, {
            item,
          })
        }
      },
    ]
  )
}
</script>
<style scoped>
@import '../../main.css';

.sulist_outer {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-content: flex-start;
  /* flex-wrap: wrap; */
  overflow: auto;
  user-select: none;
  z-index: 1;
  position: relative;
}

.sulist_item {
  /* position: relative; */
  cursor: default;
  user-select: none;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 30px;
  padding: 5px;
  background-color: rgba(119, 119, 119, 0);
  color: rgb(56, 56, 56);
  border: 1px solid rgba(0, 0, 0, 0);
}

.sulist_item:hover {
  border: 1px solid rgba(255, 255, 255, 0.521);
  background-color: rgba(255, 255, 255, 0.281);
}

.item_img {
  width: 20px;
  height: 20px;
  overflow: hidden;
  padding: 3px;
  text-align: center;
}

.item_img img {
  width: 100%;
  height: 100%;
}

.item_img-img {
  margin: 0 auto;
}

.item_name {
  margin-top: 2px;
  text-align: center;
  font-size: 13px;
  height: 20px;
  line-height: 20px;
}
</style>
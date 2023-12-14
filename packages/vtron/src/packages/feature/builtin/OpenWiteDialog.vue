<template>
  <div class="outer">
    <div class="opener">
      <div class="opener-item" v-for="item in openerList" :key="item.name" @click="openFile(item)">
        <div class="opener-icon">
          <img :src="item.icon" />
        </div>
        <span class="opener-name">{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { inject, ref, onMounted } from 'vue';
import { useSystem } from '../system';
import { BrowserWindow } from '../window/BrowserWindow';

import { VtronFileWithoutContent } from '@packages/plug';

const window: BrowserWindow | undefined = inject('browserWindow');
const sys = useSystem();
const file = ref<VtronFileWithoutContent | null>();
file.value = await sys?.fs.stat(window?.config.content);
type TempOpener = {
  name: string;
  icon: string;
  func: (path: string, content: string) => void;
};
const openerList = ref<TempOpener[]>([]);
onMounted(() => {
  let tempList: TempOpener[] = [];
  sys.getAllFileOpener().forEach((opener, key) => {
    if (opener.hiddenInChosen) {
      return;
    }
    tempList.push({
      name: opener.name || '',
      icon: opener.icon,
      func: opener.func,
    });
  });
  // group by name
  tempList = tempList.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
  const result: TempOpener[] = [];
  let last = '';
  tempList.forEach((item) => {
    if (item.name !== last) {
      result.push(item);
      last = item.name;
    }
  });
  openerList.value = result;
});
async function openFile(item: TempOpener) {
  const filecontent = await sys?.fs.readFile(window?.config.content);
  item.func(window?.config.content, filecontent || '');
}
</script>
<style lang="scss" scoped>
.outer {
  height: 100%;
  .opener {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    overflow: auto;
    .opener-item {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 240px;
      height: 60px;
      margin: 2px;
      padding: 10px;
      border-radius: 4px;
      flex-grow: 0;
      cursor: pointer;
      &:hover {
        background-color: #eeeeee94;
      }
      .opener-icon {
        width: 130px;
        height: 50px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }
      .opener-name {
        margin-top: 10px;
        display: flex;
        align-items: center;
      }
    }
  }
}
</style>

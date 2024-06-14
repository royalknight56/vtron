<template>
  <div class="outer">
    <div class="opener-title">{{ i18n('how.do.you.want.to.open.this.file') }}</div>
    <div class="opener">
      <div
        class="opener-item opener-hover"
        v-for="item in openerList"
        :key="item.name"
        @click="openFile(item)"
      >
        <div class="opener-icon">
          <img :src="item.icon" />
        </div>
        <span class="opener-name">{{ item.name }}</span>
      </div>
    </div>
    <div class="cancel">
      <button @click="window?.close()">{{ i18n('cancel') }}</button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { inject, ref, onMounted } from 'vue';
import { i18n } from '@packages/ui';
import { BrowserWindow } from '@/packages/services';
import { useSystem } from '@packages/kernel';

const window: BrowserWindow | undefined = inject('browserWindow');
const sys = useSystem();

type TempOpener = {
  name: string;
  icon: string;
  func: (path: string, content: string) => void;
};
const openerList = ref<TempOpener[]>([]);
onMounted(() => {
  let tempList: TempOpener[] = [];
  sys.getAllFileOpener().forEach((opener) => {
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
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  user-select: none;
  border: 1px solid #60606043;

  .opener-title {
    width: 100%;
    height: 40px;
    line-height: 40px;
    padding: 10px;
    padding-left: 20px;
    margin-bottom: 10px;
    box-sizing: border-box;
    font-size: 14px;
    font-weight: 600;
  }

  .opener {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: calc(100% - 100px);
    width: 100%;
    overflow: auto;

    .opener-item {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      height: 50px;
      // margin: 2px;
      padding: 10px;

      box-sizing: border-box;
      flex-grow: 0;
      transition: all 0.1s ease-in-out;

      .opener-icon {
        width: 60px;
        height: 36px;
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
        font-size: 12px;
        display: flex;
        align-items: center;
      }
    }

    .opener-hover:hover {
      cursor: pointer;
      background-color: #60606043;
    }
  }

  .cancel {
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: flex-end;

    button {
      width: 100px;
      height: 30px;
      margin-right: 30px;
      // border-radius: 5px;
      border: none;
      background-color: #60606043;
      transition: all 0.1s ease-in-out;

      &:hover {
        color: white;
        cursor: pointer;
        background-color: #606060;
      }
    }
  }
}
</style>

<template>
  <div class="desk-group">
    <FileList
      :on-chosen="props.onChosen"
      :on-open="openapp"
      :file-list="appList"
      :style-props="sys._rootState.system.options.styleProps?.desktopFileList"
    ></FileList>
  </div>
</template>
<script lang="ts" setup>
import { mountEvent } from '@/packages/feature/event';
import { useSystem } from '@/packages/plug';
import FileList from '@feature/structure/share/FileList.vue';
import { useAppOpen, initAppList } from '@packages/hook/useAppOpen';
import { onMounted } from 'vue';

const sys = useSystem();
const { openapp, appList } = useAppOpen('apps');
const props = defineProps({
  onChosen: {
    type: Function,
    required: true,
  },
});
onMounted(() => {
  mountEvent('file.props.edit', async () => {
    initAppList();
  });
});
</script>
<style lang="scss" scoped>
.desk-group {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  height: 100%;
}
</style>

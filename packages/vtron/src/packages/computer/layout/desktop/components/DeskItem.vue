<template>
  <div class="desk-group">
    <FileList :on-chosen="props.onChosen" :on-open="openapp" :file-list="appList"></FileList>
  </div>
</template>
<script lang="ts" setup>
import { System } from '@packages/kernel';

import FileList from '@/packages/computer/application/components/FileList.vue';
import { useAppOpen } from '@/packages/computer/hook/useAppOpen';
import { inject, onMounted } from 'vue';

const sys = inject<System>('system')!;

const { openapp, appList } = useAppOpen('apps', sys);
const props = defineProps({
  onChosen: {
    type: Function,
    required: true,
  },
});
onMounted(() => {
  sys.mountEvent('file.props.edit', async () => {
    sys.refershApp();
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

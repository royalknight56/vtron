<template>
  <img class="image" v-if="type === 'http'" draggable="false" :src="iconimg" @error="replaceIcon" />
  <img class="image" v-else-if="type === 'base64'" draggable="false" :src="iconimg" @error="replaceIcon" />
  <img class="image" v-else-if="type === 'local' && iconimg" draggable="false" :src="iconimg" />
</template>
<script setup lang="ts">
import { ref } from 'vue';
import unknownicon from '@packages/assets/unknown.png';
import { useSystem } from '@packages/kernel';
const props = defineProps<{
  path?: string;
}>();
const sys = useSystem();
const iconimg = ref(props.path);
const type = getImgType(props.path);

function getImgType(path?: string) {
  if (!path) return 'none';
  if (path.startsWith('http')) return 'http';
  if (path.startsWith('data:')) return 'base64';
  if (path.startsWith('/')) {
    iconimg.value = '';
    sys.fs.readFile(path).then((res) => {
      iconimg.value = res?.toString();
    });
    sys.fs.exists(path).then((res) => {
      if (!res) {
        iconimg.value = unknownicon;
      }
    });
    return 'local';
  }
}

function replaceIcon() {
  iconimg.value = unknownicon;
}
</script>
<style lang="scss" scoped>
.image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
../../../kernel/system
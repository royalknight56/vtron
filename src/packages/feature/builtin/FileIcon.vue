<template>
  <div class="icon">
    <template v-if="file">
      <img v-if="file.isDirectory" draggable="false" :src="foldericon" />
      <img v-else-if="extname(file.path) === '.exe'" draggable="false" :src="dealIcon(file)" />
      <img v-else-if="extname(file.path) === '.url'" draggable="false" :src="dealIcon(file)" />
      <img v-else-if="extname(file.path) === '.png'" draggable="false" :src="file.content" />
      <img v-else-if="extname(file.path) === '.mp4'" draggable="false" :src="videoicon" />
      <img v-else-if="extname(file.path) === '.mp3'" draggable="false" :src="audioicon" />
      <img v-else draggable="false" :src="dealOpenerIcon(file)" />
    </template>
    <template v-else-if="icon">
      <img draggable="false" :src="icon" />
    </template>
    <template v-else>
      <img draggable="false" :src="foldericon" />
    </template>
  </div>
</template>
<script setup lang="ts">
import { defineProps } from 'vue';
import foldericon from '@packages/assets/folder.png';
import unknownicon from '@packages/assets/unknown.png';
import audioicon from '@packages/assets/audio.png';
import videoicon from '@packages/assets/video.png';
import { VtronFile } from '@feature/core/fileSystem';
import { extname } from '@feature/core/Path';
import { useSystem } from '@feature/system';

defineProps<{
  file?: VtronFile | null;
  icon?: string;
}>();
// content: `link::${loc}::${options.name}::${options.icon}`
function dealIcon(file: VtronFile) {
  const exeContent = file.content.split('::');
  const iconImg = exeContent.slice(3).join('::');
  if (iconImg != 'undefined' && iconImg != '' && iconImg != null && iconImg) {
    return iconImg;
  } else {
    return unknownicon;
  }
}
const sys = useSystem();
function dealOpenerIcon(file: VtronFile) {
  const ext = extname(file.path);
  return sys.getOpener(ext)?.icon || unknownicon;
}
</script>
<style lang="scss" scoped>
.icon {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
</style>

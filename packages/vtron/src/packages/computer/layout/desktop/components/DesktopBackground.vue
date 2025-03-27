<template>
  <div class="background" draggable="false" :style="{ backgroundColor: backgroundType === 'color' ? background : 'transparent' }">
    <template v-if="backgroundType === 'image'">
      <Transition name="fade">
        <img v-show="loaded" draggable="false" @load="imgload" class="background_load" :src="background" />
      </Transition>
    </template>
    <template v-else-if="backgroundType === 'webpage'">
      <div class="iframe-container">
        <iframe class="background_iframe" :src="background" frameborder="0"></iframe>
        <div class="overlay"></div>
      </div>
    </template>
  </div>
</template>
<script lang="ts" setup>
import { inject, onMounted, ref, watch } from 'vue';
import { System } from '@packages/kernel';

const sys = inject<System>('system')!;

const backgroundType = ref('color');
const background = ref('#3A98CE');
const loaded = ref(false);

function imgload() {
  loaded.value = true;
}

function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function isImageUrl(url: string) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
}

onMounted(() => {
  refershBack(sys.stateManager.options.getOptions('background'));
});

watch(sys.stateManager.options.options, (nv) => {
  refershBack(nv.background);
});

function refershBack(val: string | undefined) {
  background.value = val || '#3A98CE';

  if (background.value.startsWith('#')) {
    backgroundType.value = 'color';
  } else if (isValidUrl(background.value)) {
    if (isImageUrl(background.value)) {
      backgroundType.value = 'image';
    } else {
      backgroundType.value = 'webpage';
    }
  } else {
    backgroundType.value = 'image';
  }
}
</script>
<style lang="scss" scoped>
.background {
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.704);
  user-select: none;
  .background_unload {
    width: 100%;
    height: 100%;
  }

  .background_load {
    width: 100%;
    height: 100%;
    object-fit: cover;
    user-select: none;
  }
  
  .iframe-container {
    position: relative;
    width: 100%;
    height: 100%;
  }
  
  .background_iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
  
  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: transparent;
    pointer-events: auto;
    z-index: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 0.8;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
@/packages/kernel/system

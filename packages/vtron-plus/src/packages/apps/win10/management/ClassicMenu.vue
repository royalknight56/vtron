<template>
  <nav ref="root" class="management-menu" aria-label="菜单栏" @keydown.esc.stop="opened = -1">
    <div v-for="(menu, index) in menus" :key="menu.label" class="management-menu-item">
      <button
        :class="{ active: opened === index }"
        :aria-expanded="opened === index"
        aria-haspopup="menu"
        @click="opened = opened === index ? -1 : index"
        @mouseenter="opened >= 0 && (opened = index)"
      >
        {{ menu.label }}
      </button>
      <div v-if="opened === index" class="management-popup" role="menu">
        <button
          v-for="item in menu.items"
          :key="item.label"
          role="menuitem"
          :disabled="item.disabled || !item.action"
          @click="choose(item.action)"
        >
          <span>{{ item.label }}</span
          ><span>{{ item.shortcut }}</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import type { ConsoleMenu } from './managementApps';

defineProps<{ menus: ConsoleMenu[] }>();
const emit = defineEmits<{ action: [action: string] }>();
const root = ref<HTMLElement>();
const opened = ref(-1);
function choose(action?: string) {
  if (action) emit('action', action);
  opened.value = -1;
}
function closeOutside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) opened.value = -1;
}
onMounted(() => document.addEventListener('pointerdown', closeOutside));
onUnmounted(() => document.removeEventListener('pointerdown', closeOutside));
</script>

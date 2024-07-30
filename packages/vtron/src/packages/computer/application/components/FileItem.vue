<template>
  <div
    :draggable="editPath !== file.path"
    class="file-item"
    :class="{
      chosen: chosenPaths.includes(file.path),
      'no-chosen': !chosenPaths.includes(file.path),
      'mode-icon': mode === 'icon',
      'mode-list': mode === 'list',
      'mode-big': mode === 'big',
      'mode-middle': mode === 'middle',
      'mode-detail': mode === 'detail',
      'drag-over': hoverPath === file.path,
    }"
    :style="{
      '--theme-color': theme === 'light' ? '#ffffff6b' : '#3bdbff3d',
    }"
    :ref="
      (ref) => {
        if (ref) {
          emit('ref', ref as Element);
        }
      }
    "
  >
    <div class="file-item_img">
      <FileIcon :file="file" />
    </div>
    <span v-if="editPath !== file.path" class="file-item_title">
      {{ dealI18nName(basename(file.path)) }}
    </span>
    <input
      autofocus
      draggable="false"
      @dragover.stop.prevent
      @dragstart.stop.prevent
      @dragenter.stop
      @dblclick.stop
      @mousedown.stop
      @input="onEditName"
      @blur="onEditName"
      v-if="editPath === file.path"
      class="file-item_title file-item_editing"
      v-model="editName"
    />
    <template v-if="mode === 'detail'">
      <div class="file-item_type">
        <span>{{ file.isDirectory ? '-' : dealSize(file.size) }}</span>
      </div>
      <div class="file-item_type">
        <span>{{ file.birthtime.toLocaleString() }}</span>
      </div>
      <div class="file-item_type">
        <span>{{ file.mtime.toLocaleString() }}</span>
      </div>
      <div class="file-item_type">
        <span>{{ file.mode?.toString?.(8) || 'unknow' }}</span>
      </div>
    </template>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, markRaw, inject } from 'vue';
import { VtronFileWithoutContent, basename, System } from '@packages/kernel';
import FileIcon from '@/packages/computer/application/FileIcon.vue';
import { dealSize } from '@/packages/util/fileUtils';

const sys = inject<System>('system')!;
const props = withDefaults(
  defineProps<{
    file: VtronFileWithoutContent;
    theme: string;
    mode: string;

    chosenPaths: string[];
    hoverPath: string;
    editPath: string;
  }>(),
  {
    theme: 'light',
    mode: 'icon',
  }
);

const emit = defineEmits<{
  edit: [name: string];
  ref: [el: Element];
}>();

const editName = ref<string>('');

const chosenIndexs = ref<Array<number>>([]);

onMounted(() => {
  chosenIndexs.value = [];
  editName.value = basename(props.file.path);
});

function dealI18nName(name: string) {
  return name.replace(/.exe$/, '');
}

function onEditName() {
  emit('edit', editName.value);
}
</script>
<style lang="scss" scoped>
.file-item {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: var(--desk-item-size);
  height: var(--desk-item-size);
  font-size: var(--ui-font-size);
  color: var(--icon-title-color);
  padding-top: 4px;
  border: 1px solid transparent;
  margin: 6px;

  .file-item_img {
    width: 60%;
    height: 60%;
    pointer-events: none;
  }

  .file-item_type {
    display: none;
  }

  .file-item_title {
    pointer-events: none;
  }

  .file-item_editing {
    outline: none;
    pointer-events: all;
    resize: none;
    border-radius: 0;
    width: 100%;
    font-size: 12px;
    box-sizing: border-box;
    padding: 0;
    margin: 0;
    border: 1px solid #00000055;
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      'Open Sans',
      'Helvetica Neue',
      sans-serif;
  }
}

.file-item:hover {
  background-color: #b1f1ff4c;
}

.chosen {
  border: 1px dashed #3bdbff3d;
  // background-color: #ffffff6b;
  background-color: var(--theme-color);

  .file-item_title {
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

.no-chosen {
  .file-item_title {
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

.drag-over {
  border: 1px dashed #3bdbff3d;
  // background-color: #ffffff6b;
  background-color: var(--theme-color);
}

.mode-icon {
  .file-item_img {
    width: 60%;
    height: calc(0.6 * var(--desk-item-size));
    margin: 0px auto;
    user-select: none;
    flex-shrink: 0;
  }

  .file-item_title {
    // color: var(--color-ui-desk-item-title);
    // height: calc(0.4 * var(--desk-item-size));
    // display: block;
    text-align: center;
    word-break: break-all;
    flex-grow: 0;
  }
}

.mode-list {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  height: var(--menulist-item-height);
  width: var(--menulist-width);

  .file-item_img {
    width: var(--menulist-item-height);
    height: calc(0.6 * var(--menulist-item-height));

    flex-shrink: 0;
    user-select: none;
  }

  .file-item_title {
    height: min-content;
    word-break: break-all;
  }
}

.mode-icon {
  width: var(--desk-item-size);
  height: var(--desk-item-size);
}

.mode-big {
  width: calc(var(--desk-item-size) * 2.5);
  height: calc(var(--desk-item-size) * 2.5);
}

.mode-middle {
  width: calc(var(--desk-item-size) * 1.5);
  height: calc(var(--desk-item-size) * 1.5);
}

.mode-detail {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  height: var(--menulist-item-height);
  width: 100%;
  margin: 2px;

  .file-item_img {
    width: 30px;
  }

  .file-item_title {
    width: 40%;
    display: flex;
    align-items: center;
    word-break: break-all;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-item_type {
    display: block;
    color: var(--color-dark-hover);
    width: 20%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.file-bar:hover {
  background-color: unset;
  user-select: none;
}
</style>

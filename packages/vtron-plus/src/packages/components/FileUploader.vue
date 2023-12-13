<template>
  <input
    class="upload-input"
    :class="{
      'upload-loading': uploadLoading,
    }"
    type="file"
    name="file"
    id="file"
    :accept="accept"
    @change="uploadFile"
  />
</template>
<script setup lang="ts">
import { ref } from 'vue';
const emits = defineEmits(['change']);
defineProps({
  accept: {
    type: String,
    default: '*',
  },
});
const uploadLoading = ref(false);
function uploadFile(e: any) {
  emits('change', e);
}
</script>
<style lang="scss" scoped>
.upload-input {
  color: transparent;
  background-color: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  font-size: 16px;
  height: 40px;
}

.upload-input::-webkit-file-upload-button {
  visibility: hidden;
}

.upload-input::before {
  content: '上传文件';
  display: flex;
  justify-content: center;
  align-items: center;
  background: #428bca;
  color: #fff;
  padding: 6px 12px;
  outline: none;
  white-space: nowrap;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  cursor: pointer;
  border-radius: 4px;
}

.upload-input:hover::before {
  background-color: #3071a9;
}

.upload-loading {
  cursor: not-allowed;
  filter: grayscale(1);
}
</style>

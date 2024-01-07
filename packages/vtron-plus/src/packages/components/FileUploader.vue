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
  height: 34px;
  width: 200px;
  position: relative;
}

.upload-input::-webkit-file-upload-button {
  visibility: hidden;
}

.upload-input::before {
  content: '上传文件';
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  box-sizing: border-box;
  // background: #56565698;
  color: #000000;
  padding: 4px 1px;
  outline: none;
  white-space: nowrap;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  cursor: pointer;
  border-radius: 0px;
  border: 2px solid #565656;
  transition: all 0.1s;
}
.upload-input::after {
  position: absolute;
  content: '';
  display: block;
  height: 100%;
  width: 0%;
  top: 0;
  left: 0;
  background-color: #35353533;
  transition: all 0.1s;
}
.upload-input:hover::before {
  background-color: #cecece60;
}
.upload-input:hover::after {
  width: 100%;
}

.upload-loading {
  cursor: not-allowed;
  filter: grayscale(1);
}
</style>

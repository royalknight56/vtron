<!--
 * @Author: zhangweiyuan-Royal
 * @LastEditTime: 2022-05-18 11:20:29
 * @Description: 
-->
<template>
  <div class="outer">
    <div v-if="viewerState == 'empty'" @dragenter="fileEnter" @dragover.prevent="preventEvent" @drop.prevent="fileDrop"
      class="file-drop"></div>
    <!-- <input type="file" id="input" @change="handleFiles"> -->
    <div class="img-show">
      <img :src="imgSrc" alt="">
    </div>
  </div>

</template>
<script lang="ts" setup>
import { ref } from 'vue';

const imgSrc = ref('')
const viewerState = ref('empty')
function preventEvent(e: DragEvent) {
  e.preventDefault();
}

function fileEnter(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  console.log('fileEnter')
}
function fileDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  console.log('fileDrop')
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      imgSrc.value = e.target?.result?.toString() || '';
      viewerState.value = 'show'
    }
    reader.readAsDataURL(file)
  }
}
// function handleFiles(e: any) {
//   let files = e.target.files;
//   let reader = new FileReader();
//   reader.onload = (e) => {
//     console.log(e.target?.result);
//     imgSrc.value = e.target?.result?.toString()||'';
//   };
//   reader.readAsDataURL(files[0]);

// }
</script>
<style>
</style>
<style scoped>
.outer {
  width: 100%;
  height: 100%;
}

.file-drop {
  display: block;
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px dashed #ccc;
  border-radius: 5px;
}
.img-show{
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.img-show img{
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
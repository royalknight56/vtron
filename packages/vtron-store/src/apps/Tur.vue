<template>
  <div
    style="
      width: 100%;
      height: 100%;
      background-color: #575454;
      display: flex;
      justify-content: center;
      align-items: center;
    "
  >
    {{ msg }}
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
const msg = ref("安装引导程序");
</script>

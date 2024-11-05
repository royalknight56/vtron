<!--
 * @Author: Jahv
 * @LastEditTime: 2024-11-06 00:06:33
 * @Description: 测试按钮
-->
<template>
  <div class="outer" v-dragable>
    <p style="padding: 10px">
      <WinButtonVue @click="">Test</WinButtonVue>
      <br />
      <WinButtonVue @click="">Test111111111111</WinButtonVue>
      <br />
      <WinButtonVue @click="">长长长长长长长长长长长长长长长长长长</WinButtonVue>
    </p>
  </div>
</template>
<script lang="ts" setup>
import { vDragable, WinButtonVue } from '@packages/plug';
</script>

<template>
  <div class="version">
    <div class="version-item">
      <div class="version-title">Vtron Plus</div>
      <div class="version-content">Version: {{ plusVersion }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import json from "../../../package.json?raw";

const jsonobj = JSON.parse(json);

const plusVersion = jsonobj.version;
const vtronVersion = jsonobj.dependencies.vtron;
</script>
<style scoped>
.version {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  user-select: none;
}
.version-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 10px;
  text-shadow: 0 0 2px #000000;
  transition: all 0.2s;
}
.version-item:hover {
  text-shadow: 0 0 5px #636363;
}
.version-title {
  font-size: 24px;
  font-weight: bold;
}

.version-content {
  font-size: 16px;
  margin-top: 10px;
}
</style>

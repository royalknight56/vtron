<template>
  <div class="app-item">
    <img
      v-if="item?.icon"
      draggable="false"
      class="app-img"
      :src="item?.icon"
      alt=""
    />
    <div class="app-content">
      <div class="app-title">{{ item?.name }}</div>
      <div class="app-desc">{{ item?.desc }}</div>
      <div class="app-button">
        <div
          v-if="installedList?.some((install: any) => install.name == item?.name + '.js')"
        >
          <button @click="uninstall?.(item)">卸载</button>
        </div>
        <div v-else>
          <button v-if="item?.content" @click="install?.(item)">安装</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps({
  item: Object,
  installedList: Array,
  install: Function,
  uninstall: Function,
});
</script>
<style scoped>
.app-item {
  width: 350px;
  height: 100px;
  margin: 10px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #cccccc79;
  transition: all 0.2s;
}

.app-img {
  padding: 10px;
  width: 80px;
  border-radius: 4px;
  border: 1px solid #cccccc7b;
  user-select: none;
}
.app-content {
  margin-left: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  height: 80px;
  width: 100%;
}
.app-title {
  font-size: 16px;
  font-weight: bold;
  padding-bottom: 6px;
  user-select: none;
}
.app-desc {
  font-size: 12px;
  color: #666;
  user-select: none;
}
.app-item:hover {
  box-shadow: 0 0 20px 2px #dddddd5b;
  /* transform: translateY(-2px); */
}
/* .app-item:active {
  box-shadow: 0 0 0px #ccc;
  transform: translateY(0px);
} */
.app-button {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
}
.app-button button {
  width: 60px;
  height: 30px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}
.app-button button:hover {
  box-shadow: 0 0 10px #ccc;
  /* transform: translateY(-2px); */
}
.app-button button:active {
  box-shadow: 0 0 0px #ccc;
  transform: translateY(0px);
}
</style>

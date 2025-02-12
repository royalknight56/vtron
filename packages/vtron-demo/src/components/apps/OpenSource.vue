<template>
  <div class="opensource-container">
    <h2 class="title">开源感谢</h2>
    <div class="project-list">
      <div class="project-item" v-for="(project, index) in projects" :key="index">
        <span class="project-name">{{ project.name }}</span>
        <a :href="project.url" target="_blank" class="project-link">{{ project.url }}</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const projects = [
  {
    name: 'PPTist',
    url: 'https://github.com/pipipi-pikachu/PPTist',
  },
  {
    name: 'mavon-editor',
    url: 'https://github.com/hinesboy/mavonEditor',
  },
  {
    name: '@vue-office',
    url: 'https://github.com/501351981/vue-office',
  },
  {
    name: 'xterm',
    url: 'https://github.com/xtermjs/xterm.js',
  },
];
</script>

<style scoped>
.opensource-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.opensource-container::-webkit-scrollbar {
  width: 6px;
}

.opensource-container::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 3px;
}

.opensource-container::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}

.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.project-item:hover {
  background-color: #e8e8e8;
  transform: translateX(5px);
}

.project-name {
  font-weight: 500;
  margin-right: 12px;
  min-width: 100px;
  flex-shrink: 0;
}

.project-link {
  color: #0366d6;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-link:hover {
  text-decoration: underline;
}
</style>

<template>
  <div class="disk-cleanup">
    <div class="cleanup-tab">磁盘清理</div>
    <div class="cleanup-page">
      <div class="cleanup-summary">
        <img v-if="win?.windowInfo.icon" :src="win.windowInfo.icon" alt="" />
        <p>当前浏览器无法读取 Windows 清理目录。</p>
      </div>
      <label class="cleanup-list-label">要删除的文件(F)：</label>
      <div class="cleanup-files" role="listbox" aria-label="可清理的文件类型">
        <button
          v-for="(item, index) in categories"
          :key="item.name"
          :class="{ selected: selected === index }"
          role="option"
          :aria-selected="selected === index"
          @click="selected = index"
        >
          <input type="checkbox" disabled /><span class="management-glyph">&#xE8A5;</span
          ><span>{{ item.name }}</span
          ><span class="cleanup-file-size">—</span>
        </button>
      </div>
      <div class="cleanup-total"><span>将获得的磁盘空间总量：</span><span>不可用</span></div>
      <fieldset class="cleanup-description">
        <legend>描述</legend>
        <p>{{ categories[selected].description }}</p>
        <div>
          <button disabled><span class="management-glyph">&#xE7BA;</span>清理系统文件(S)</button
          ><button disabled>查看文件(V)</button>
        </div>
      </fieldset>
    </div>
    <footer class="cleanup-buttons">
      <button disabled title="当前环境不支持磁盘清理">确定</button><button @click="win?.close()">取消</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue';
import { BrowserWindow } from 'vtron';
const win = inject<BrowserWindow>('browserWindow');
const selected = ref(0);
const categories = [
  {
    name: '下载的程序文件',
    description: '这里通常列出下载的 ActiveX 控件和 Java 小程序。当前环境无法读取此 Windows 目录。',
  },
  {
    name: 'Internet 临时文件',
    description: '这里通常列出 Windows Internet 临时文件。当前环境无法读取此目录。',
  },
  { name: 'Windows 错误报告和反馈诊断', description: '当前环境无法读取 Windows 错误报告。' },
  { name: 'DirectX 着色器缓存', description: '当前环境无法读取 DirectX 着色器缓存。' },
  { name: '传递优化文件', description: '当前环境无法读取 Windows 传递优化文件。' },
  { name: '回收站', description: '当前环境无法读取宿主 Windows 回收站。此工具不会删除 Vtron 或本机文件。' },
  { name: '临时文件', description: '当前环境无法读取宿主 Windows 临时目录。' },
  { name: '缩略图', description: '当前环境无法读取 Windows 缩略图缓存。' },
];
</script>

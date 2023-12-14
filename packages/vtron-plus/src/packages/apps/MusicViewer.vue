<template>
  <div class="viewer">
    <div class="viewer-img">
      <div class="ani-text">
        {{ basename(window?.config.path) }}
      </div>
    </div>
    <audio-player ref="audioPlayer" theme-color="#444" :audio-list="audioList.map((elm) => elm.url)" />
  </div>
</template>
<script setup lang="ts">
import AudioPlayer from '@liripeng/vue-audio-player';
import { BrowserWindow, basename } from 'vtron';
import { inject } from 'vue';

const window: BrowserWindow | undefined = inject('browserWindow');

const content = base64ToBlobUrl(window?.config.content.replace(/^data:(.)*;base64,/, ''));

const audioList = [
  {
    name: 'audio 1',
    url: content,
  },
];

function base64ToBlobUrl(base64: string) {
  const binStr = atob(base64);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  const blob = new Blob([arr], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  return url;
}
</script>
<style scoped>
.viewer {
  width: 300px;
  height: 100%;
  margin: 0 auto;
}
.viewer-img {
  /* 文本圆形排列，并一直旋转 */
  position: relative;
  width: 60px;
  height: 60px;
  margin: 20px auto;
  padding: 20px;
  border-radius: 50%;
  border: 1px solid #ccc;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  animation: rotate 10s linear infinite;
  /* 文字滚动 */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  box-shadow:
    0 0 30px 2px #c8c8c8,
    0 0 1px 25px #c0c0c0 inset,
    0 0 5px 35px #545454 inset,
    0 0 1px 40px #000000 inset;
  transition: all 0.3s;
}
.viewer-img:hover {
  box-shadow:
    0 0 30px 4px #c8c8c8,
    0 0 1px 25px #c0c0c0e4 inset,
    0 0 5px 35px #6f6f6fd8 inset,
    0 0 1px 40px rgb(0, 0, 0) inset;
}
.viewer-img::after {
  content: ' ';
  display: block;
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: #ffffff;
  border-radius: 50%;
  margin: 0 auto;
}
@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.ani-text {
  display: inline-block;
  white-space: nowrap;
  animation: 4s wordsLoop linear infinite normal;
}

@keyframes wordsLoop {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}
</style>

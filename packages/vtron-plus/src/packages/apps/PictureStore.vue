<!-- music app -->
<template>
  <div class="music">
    <div class="music-header">
      <div class="music-header-left">
        <div class="music-header-left-icon">
          <span class="segoicon SEGOEUIMDL">&#xE728;</span>
        </div>
        <div class="music-header-left-title">
          <span>图片</span>
        </div>
      </div>
      <div class="music-header-right">
        <div class="music-header-right-icon">
          <span class="segoicon SEGOEUIMDL">&#xE728;</span>
        </div>
        <div class="music-header-right-icon">
          <span class="segoicon SEGOEUIMDL">&#xE728;</span>
        </div>
        <div class="music-header-right-icon">
          <span class="segoicon SEGOEUIMDL">&#xE728;</span>
        </div>
      </div>
    </div>
    <div class="music-body">
      <div class="music-body-left">
        <div
          class="music-body-left-title"
          @click="jumpTo(1)"
          :class="{
            chosen: router === 1,
          }"
        >
          <span>我的图片</span>
        </div>
        <div
          class="music-body-left-title"
          @click="jumpTo(2)"
          :class="{
            chosen: router === 2,
          }"
        >
          <span>上传图片</span>
        </div>
      </div>
      <div class="music-body-right" v-if="router === 1">
        <div class="music-list">
          <div class="music-list-item" v-for="item in musicList" :key="item.path" @click="playPhoto(item)">
            <span>{{ item.name }}</span>
          </div>
        </div>

        <div class="viewer" @wheel="handleWheel">
          <img
            v-if="content"
            :src="content"
            :style="{
              transform: `scale(${scale})`,
            }"
          />
        </div>
      </div>
      <div class="music-body-right" v-if="router === 2">
        <div class="music-upload">
          <div class="music-upload-title">
            <span>上传图片</span>
          </div>
          <input class="music-upload-input" type="file" name="file" id="file" accept="image/*" />
          <WinButtonVue @click="upload">上传</WinButtonVue>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { VtronFileWithoutContent, join, useSystem, WinButtonVue } from 'vtron';
// import AudioPlayer from '@liripeng/vue-audio-player';

const sys = useSystem();
const musicList = ref<VtronFileWithoutContent[]>([]);
onMounted(async () => {
  refershFileLst();
});
async function refershFileLst() {
  const list = await sys.fs.readdir(join(sys._options.userLocation || '', 'Photo'));
  musicList.value = list;
}
const router = ref(1);
const jumpTo = (index: number) => {
  router.value = index;
};

function upload() {
  const file = document.getElementById('file') as HTMLInputElement;
  if (file.files) {
    const reader = new FileReader();
    reader.readAsDataURL(file.files[0]);
    reader.onloadend = function () {
      if (file.files) {
        sys.fs
          .writeFile(
            join(sys._options.userLocation || '', 'Photo', file.files[0].name),
            reader.result as string
          )
          .then(() => {
            file.value = '';
            refershFileLst();
            sys.createNotify({
              title: '上传成功',
              content: '上传成功',
            });
          });
      }
    };
  }
}

const content = ref('');

async function playPhoto(item: VtronFileWithoutContent) {
  scale.value = 0.7;
  const path = item.path;
  const fileC = await sys.fs.readFile(path);
  if (fileC) {
    content.value = fileC;
  }
}
const scale = ref(0.7);
function handleWheel(event: WheelEvent) {
  event.preventDefault();
  const delta = Math.sign(event.deltaY);
  if (delta > 0) {
    // 向下滚动，缩小图片
    scale.value -= 0.1;
  } else {
    // 向上滚动，放大图片
    scale.value += 0.1;
  }
}
</script>
<style scoped lang="scss">
.music {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  user-select: none;
  .music-header {
    width: 100%;
    // height: 50px;
    display: flex;
    flex: 0 0 50px; /* 固定高度为100px */
    flex-shrink: 0;
    justify-content: space-between;
    align-items: center;
    .music-header-left {
      width: 50%;
      height: 100%;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      .music-header-left-icon {
        width: 30px;
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        .segoicon {
          font-size: 20px;
          color: #000;
        }
      }
      .music-header-left-title {
        width: 100px;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        span {
          font-size: 20px;
          color: #000;
        }
      }
    }
    .music-header-right {
      width: 50%;
      height: 100%;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      .music-header-right-icon {
        width: 30px;
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        .segoicon {
          font-size: 20px;
          color: #000;
        }
      }
    }
  }
  .music-body {
    width: 100%;
    height: 0;
    flex: 1;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    border-top: 1px dashed #545454;
    .music-body-left {
      width: 80px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      border-right: 1px dashed #545454;
      // margin-top: 40px;
      .music-body-left-title {
        display: flex;
        justify-content: center;
        align-items: center;
        // margin-top: 10px;
        width: 100%;
        padding: 10px 0;
        cursor: pointer;
        span {
          font-size: 16px;
          color: #000;
        }
      }
      .music-body-left-title.chosen {
        background-color: #eee;
      }
      .music-body-left-title:hover {
        background-color: #eee;
      }
    }
    .music-body-right {
      width: calc(100% - 80px);
      height: 100%;
      display: flex;
      .music-list {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 30%;
        padding-top: 20px;
        overflow-y: auto;
        border-right: 1px dashed #545454;
        .music-list-item {
          padding-left: 20px;
          cursor: pointer;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .music-list-item:hover {
          color: white;
          background-color: #c8c8c8;
        }
      }
      .music-upload {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        width: 100%;
        gap: 30px;
        .music-upload-title {
          // margin-bottom: 30px;
        }
      }
    }
  }
}

.viewer {
  width: 100%;
  height: 100%;
  position: relative;
  // top: 20%;
  margin: 0 auto;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
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

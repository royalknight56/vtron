<!-- music app -->
<template>
  <div class="picture-app">
    <header class="picture-app__header">
      <div class="picture-app__header-left">
        <div class="picture-app__icon">
          <span class="segoicon SEGOEUIMDL">&#xE728;</span>
        </div>
        <div class="picture-app__title">
          <span>图片</span>
        </div>
      </div>
      <div class="picture-app__header-right"></div>
    </header>

    <main class="picture-app__main">
      <nav class="picture-app__nav">
        <div
          class="picture-app__nav-item"
          @click="jumpTo(1)"
          :class="{
            'picture-app__nav-item--active': router === 1,
          }"
        >
          <span>我的图片</span>
        </div>
        <div
          class="picture-app__nav-item"
          @click="jumpTo(2)"
          :class="{
            'picture-app__nav-item--active': router === 2,
          }"
        >
          <span>上传图片</span>
        </div>
      </nav>

      <div class="picture-app__container">
        <div class="picture-app__content" v-if="router === 1">
          <div class="picture-app__list">
            <div
              class="picture-app__list-item"
              v-for="item in musicList"
              :key="item.path"
              @click="playPhoto(item)"
              :class="{ 'picture-app__list-item--active': currentPhoto === item.path }"
            >
              <span>{{ item.name }}</span>
            </div>
          </div>

          <div class="picture-app__viewer" @wheel="handleWheel">
            <img
              v-if="content"
              :src="content"
              draggable="false"
              :style="{
                transform: `scale(${scale})`,
              }"
              class="picture-app__image"
            />
          </div>
        </div>

        <div class="picture-app__content" v-if="router === 2">
          <div class="picture-app__upload">
            <div class="picture-app__upload-title">
              <span>上传图片</span>
            </div>
            <FileUploader :accept="'image/*'" @change="upload">
              <div class="picture-app__upload-area">
                <span class="picture-app__upload-icon segoicon SEGOEUIMDL">&#xE7C5;</span>
                <div class="picture-app__upload-text">
                  <span>将文件拖到此处，或</span>
                  <span class="picture-app__upload-highlight">点击上传</span>
                </div>
                <div class="picture-app__upload-hint">支持 jpg、png、gif 等图片格式</div>
              </div>
            </FileUploader>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import { System, VtronFileWithoutContent, join } from 'vtron';
import FileUploader from '../components/FileUploader.vue';

const sys = inject<System>('system')!;
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

function upload(ev: Event) {
  const tar = ev.target as HTMLInputElement;

  if (tar.files) {
    const reader = new FileReader();
    reader.readAsDataURL(tar.files[0]);
    reader.onloadend = function () {
      if (tar.files) {
        sys.fs
          .writeFile(
            join(sys._options.userLocation || '', 'Photo', tar.files[0].name),
            (reader.result || '').toString().replace(/^data:(.)*;base64,/, '')
          )
          .then(() => {
            tar.value = '';
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

// 添加当前选中图片的路径
const currentPhoto = ref('');

async function playPhoto(item: VtronFileWithoutContent) {
  scale.value = 0.7;
  const path = item.path;
  // 设置当前选中图片
  currentPhoto.value = path;
  const fileC = await sys.fs.readFile(path);
  if (fileC) {
    content.value = 'data:image/png;base64,' + fileC;
  } else {
    content.value = '';
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
.picture-app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  user-select: none;

  &__header {
    height: 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #ffffff;
    border-bottom: 1px solid #ebeef5;
    padding: 0 20px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__icon {
    width: 36px;
    height: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f0f7ff;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
    }

    .segoicon {
      font-size: 20px;
      color: #409eff;
    }
  }

  &__title {
    span {
      font-size: 18px;
      font-weight: 600;
      background: linear-gradient(120deg, #409eff, #69c0ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: 0.5px;
    }
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background-color: #fafafa;
  }

  &__nav {
    height: 48px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    background-color: #ffffff;
    border-bottom: 1px solid #ebeef5;
    gap: 24px;
  }

  &__nav-item {
    height: 100%;
    padding: 0 16px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
    color: #606266;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 2px;
      background-color: transparent;
      transition: all 0.2s ease;
    }

    span {
      font-size: 14px;
    }

    &--active {
      color: #409eff;

      &::after {
        background-color: #409eff;
      }
    }

    &:hover:not(&--active) {
      color: #303133;

      &::after {
        background-color: #e0e0e0;
      }
    }
  }

  &__container {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  &__content {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  &__list {
    width: 200px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e0e0e0;
    background-color: #fff;
    overflow-y: auto;
    padding: 20px 0;

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    &::-webkit-scrollbar-thumb {
      background: #ccc;
      border-radius: 4px;

      &:hover {
        background: #999;
      }
    }
  }

  &__list-item {
    position: relative;
    padding: 8px 16px;
    margin: 4px 8px;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
    color: #333;

    &--active {
      background-color: #e6f7ff;
      color: #1890ff;
      font-weight: 500;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background-color: #1890ff;
        border-radius: 0 2px 2px 0;
      }
    }

    &:hover:not(&--active) {
      background-color: #f5f7fa;
      color: #000;
    }

    span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__viewer {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    position: relative;
    padding: 24px;
    overflow: hidden;

    // 添加网格背景
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: linear-gradient(45deg, #f5f5f5 25%, transparent 25%),
        linear-gradient(-45deg, #f5f5f5 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #f5f5f5 75%),
        linear-gradient(-45deg, transparent 75%, #f5f5f5 75%);
      background-size: 20px 20px;
      background-position:
        0 0,
        0 10px,
        10px -10px,
        -10px 0px;
      opacity: 0.3;
    }
  }

  &__image {
    max-width: calc(100% - 48px);
    max-height: calc(100% - 48px);
    object-fit: contain;
    transition: all 0.3s ease;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 1;

    // 添加图片悬停效果
    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
  }

  &__upload {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    padding: 40px;
    overflow-y: auto;
  }

  &__upload-title {
    font-size: 24px;
    font-weight: 500;
    color: #333;
    margin-bottom: 40px;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 3px;
      background: linear-gradient(90deg, #1890ff, #69c0ff);
      border-radius: 2px;
    }
  }

  &__upload-area {
    width: 400px;
    height: 200px;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    background-color: #fafafa;
    padding: 32px;
    gap: 16px;

    &:hover {
      border-color: #1890ff;
      background-color: #f0f7ff;

      .picture-app__upload-icon {
        color: #1890ff;
        transform: translateY(-2px);
      }
    }
  }

  &__upload-icon {
    font-size: 48px;
    color: #999;
    transition: all 0.3s ease;
  }

  &__upload-text {
    color: #666;
    font-size: 16px;
    text-align: center;
    line-height: 1.6;

    .picture-app__upload-highlight {
      color: #1890ff;
      font-weight: 500;
      margin: 0 4px;
    }
  }

  &__upload-hint {
    margin-top: 8px;
    color: #999;
    font-size: 14px;
  }
}

// 删除旧的.viewer相关样式
.viewer,
.viewer-img {
  display: none;
}

// 添加缩放动画
@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// 优化滚动条样式
.music-list::-webkit-scrollbar {
  width: 8px;
}

.music-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.music-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;

  &:hover {
    background: #999;
  }
}
</style>

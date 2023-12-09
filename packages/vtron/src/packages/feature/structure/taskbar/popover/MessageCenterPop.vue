<template>
  <Transition name="fade">
    <div v-if="isPopShow" class="message scroll-bar" @mousedown.stop="">
      <div class="notify-center">
        <div class="message-title">
          共{{ notifyGroup.length }}条提醒
          <span @click="allClear" class="allclear">全部清除</span>
        </div>
        <div class="message-group scroll-bar">
          <div class="message-item" v-for="notify in notifyGroup" :key="notify.id">
            <div class="message-item-title">
              <span>{{ notify.title }}</span>
            </div>
            <div class="message-item-body">
              <span>{{ notify.content }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="system-center">
        <div class="message-title">系统消息</div>
        <div class="message-group scroll-bar">
          <div class="message-item" v-for="notify in systemGroup" :key="notify.id">
            <div class="message-item-title">
              <span>{{ notify.title }}</span>
            </div>
            <div class="message-item-body">
              <span>{{ notify.content }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
<script setup lang="ts">
import { useRootState } from '@feature/state/Root';
import { ref } from 'vue';
import { mountEvent } from '@feature/event';
const notifyGroup = useRootState().system.message.notify;
const systemGroup = useRootState().system.message.system;
const isPopShow = ref(false);
mountEvent('messagecenter.show', () => {
  isPopShow.value = !isPopShow.value;
});
mountEvent('messagecenter.hidden', () => {
  isPopShow.value = false;
});
function allClear() {
  useRootState().system.message.notify.splice(0, notifyGroup.length);
}
</script>
<style lang="scss" scoped>
@import '@packages/assets/main.scss';
.message {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  z-index: 400;
  background-color: var(--color-gray);
  border-left: 1px solid #ccc;
  overflow-y: auto;
  user-select: none;
  box-sizing: content-box;
  display: flex;
  flex-direction: column;
  .message-title {
    padding: 10px 20px;
    font-size: 16px;
    font-weight: bold;
    border-bottom: var(--border-gray);
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    .allclear {
      font-size: small;
      // float: right;
      cursor: pointer;
      &:hover {
        color: var(--color-blue);
      }
    }
  }
  .notify-center {
    height: 50%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .message-group {
    height: 100%;
    overflow: auto;
  }
  .message-item {
    padding: 20px;
    background: var(--color-gray-active);
    width: var(--message-inner-width);
    overflow: hidden;
    margin: 5px auto;
    border: var(--border-transparent);
    transition: all 0.2s ease;
    .message-item-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .message-item-body {
      font-size: 14px;
    }
  }
  .message-item:hover {
    border: var(--border-gray);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s var(--aniline);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateX(0px);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>

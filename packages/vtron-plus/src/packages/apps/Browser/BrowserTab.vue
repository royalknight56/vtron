<template>
  <div class="tab-page">
    <div class="tab-page__toolbar">
      <button
        class="tab-page__nav-btn"
        @click="goBack"
        :disabled="!canGoBack"
        title="后退"
      >
        <span class="segoicon SEGOEUIMDL">&#xE72B;</span>
      </button>
      <button
        class="tab-page__nav-btn"
        @click="goForward"
        :disabled="!canGoForward"
        title="前进"
      >
        <span class="segoicon SEGOEUIMDL">&#xE72A;</span>
      </button>
      <button
        class="tab-page__nav-btn"
        @click="isLoading ? stopLoad() : refresh()"
      >
        <span v-if="isLoading" class="segoicon SEGOEUIMDL">&#xE711;</span>
        <span v-else class="segoicon SEGOEUIMDL tab-page__icon-refresh">&#xE72C;</span>
      </button>
      <button class="tab-page__nav-btn" @click="goHome" title="主页">
        <span class="segoicon SEGOEUIMDL">&#xE80F;</span>
      </button>

      <div class="tab-page__urlbar" :class="{ 'tab-page__urlbar--focus': urlFocused }">
        <span class="tab-page__urlbar-icon segoicon SEGOEUIMDL">&#xE774;</span>
        <input
          class="tab-page__urlbar-input"
          v-model="urlInput"
          @keydown.enter="navigate"
          @focus="onUrlFocus"
          @blur="urlFocused = false"
          placeholder="输入网址或搜索内容"
          spellcheck="false"
        />
      </div>
    </div>

    <div class="tab-page__progress" v-if="isLoading">
      <div class="tab-page__progress-bar"></div>
    </div>

    <iframe
      class="tab-page__frame"
      :src="currentUrl"
      :key="frameKey"
      @load="onLoad"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

const HOMEPAGE = 'https://vtron.site/startpage';

const props = defineProps<{
  isCurrent: boolean;
  homepage?: string;
}>();

const startUrl = props.homepage || HOMEPAGE;
const urlInput = ref(startUrl);
const urlFocused = ref(false);

const history = ref<string[]>([startUrl]);
const historyIndex = ref(0);
const isLoading = ref(false);
const frameKey = ref(0);

const currentUrl = computed(() => history.value[historyIndex.value]);
const canGoBack = computed(() => historyIndex.value > 0);
const canGoForward = computed(() => historyIndex.value < history.value.length - 1);

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return HOMEPAGE;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w-]+(\.[\w-]+)+/.test(trimmed)) return 'https://' + trimmed;
  return 'https://www.bing.com/search?q=' + encodeURIComponent(trimmed);
}

function navigate() {
  const url = normalizeUrl(urlInput.value);
  history.value = history.value.slice(0, historyIndex.value + 1);
  history.value.push(url);
  historyIndex.value = history.value.length - 1;
  urlInput.value = url;
  isLoading.value = true;
}

function goBack() {
  if (!canGoBack.value) return;
  historyIndex.value--;
  urlInput.value = currentUrl.value;
  isLoading.value = true;
}

function goForward() {
  if (!canGoForward.value) return;
  historyIndex.value++;
  urlInput.value = currentUrl.value;
  isLoading.value = true;
}

function refresh() {
  frameKey.value++;
  isLoading.value = true;
}

function stopLoad() {
  isLoading.value = false;
}

function goHome() {
  urlInput.value = HOMEPAGE;
  navigate();
}

function onLoad() {
  isLoading.value = false;
}

function onUrlFocus(e: FocusEvent) {
  urlFocused.value = true;
  (e.target as HTMLInputElement).select();
}

onMounted(() => {
  isLoading.value = true;
});
</script>

<style scoped lang="scss">
.tab-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  background: #fff;

  &__toolbar {
    display: flex;
    align-items: center;
    height: 42px;
    padding: 4px 8px;
    gap: 2px;
    background: #fff;
    border-bottom: 1px solid #ebebeb;
    flex-shrink: 0;
  }

  &__nav-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    border-radius: 50%;
    cursor: pointer;
    color: #5f6368;
    flex-shrink: 0;
    transition: background 0.15s;
    padding: 0;

    .segoicon {
      font-size: 14px;
    }

    &:hover:not(:disabled) {
      background: #f1f3f4;
    }

    &:active:not(:disabled) {
      background: #e8eaed;
    }

    &:disabled {
      opacity: 0.3;
      cursor: default;
    }
  }

  &__icon-refresh {
    transition: transform 0.3s ease;
  }

  &__urlbar {
    flex: 1;
    display: flex;
    align-items: center;
    height: 32px;
    background: #f1f3f4;
    border-radius: 16px;
    padding: 0 14px;
    margin: 0 8px;
    border: 1px solid transparent;
    transition:
      background 0.2s,
      border-color 0.2s,
      box-shadow 0.2s;

    &--focus {
      background: #fff;
      border-color: #e8eaed;
      box-shadow: 0 1px 6px rgba(32, 33, 36, 0.18);
    }
  }

  &__urlbar-icon {
    font-size: 13px;
    color: #5f6368;
    margin-right: 10px;
    flex-shrink: 0;
  }

  &__urlbar-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 13px;
    color: #202124;
    min-width: 0;

    &::placeholder {
      color: #9aa0a6;
    }
  }

  &__progress {
    height: 2px;
    background: #e8eaed;
    overflow: hidden;
    flex-shrink: 0;
  }

  &__progress-bar {
    height: 100%;
    background: #1a73e8;
    border-radius: 0 1px 1px 0;
    animation: progressSlide 1.8s ease-in-out infinite;
  }

  &__frame {
    flex: 1;
    width: 100%;
    border: none;
    min-height: 0;
  }
}

@keyframes progressSlide {
  0% {
    width: 0%;
    margin-left: 0%;
  }
  30% {
    width: 40%;
    margin-left: 10%;
  }
  60% {
    width: 30%;
    margin-left: 60%;
  }
  100% {
    width: 0%;
    margin-left: 100%;
  }
}
</style>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import BrowserIcon from './BrowserIcon.vue';

const HOMEPAGE = import.meta.env.VITE_STARTPAGE_URL || 'https://vtronjs.com/subapps/startpage/';

const props = defineProps<{
  isCurrent: boolean;
  homepage?: string;
  proxyUrl?: string;
}>();
const emit = defineEmits<{
  (event: 'change', state: { title: string; loading: boolean }): void;
}>();

const startUrl = props.homepage || HOMEPAGE;
const homepageOrigin = new URL(startUrl).origin;
const urlInput = ref(startUrl);
const inputRef = ref<HTMLInputElement | null>(null);
const frameRef = ref<HTMLIFrameElement | null>(null);
const history = ref<string[]>([startUrl]);
const historyIndex = ref(0);
const isLoading = ref(true);
const frameKey = ref(0);

const rawUrl = computed(() => history.value[historyIndex.value]);
const isHomepage = computed(() => rawUrl.value.replace(/\/$/, '') === startUrl.replace(/\/$/, ''));
const canGoBack = computed(() => historyIndex.value > 0);
const canGoForward = computed(() => historyIndex.value < history.value.length - 1);
const pageTitle = computed(() => {
  if (isHomepage.value) return '新标签页';
  try {
    return new URL(rawUrl.value).hostname.replace(/^www\./, '');
  } catch {
    return '网页';
  }
});
const currentUrl = computed(() => {
  const url = rawUrl.value;
  if (!props.proxyUrl || isHomepage.value) return url;
  const encoded = encodeURIComponent(url);
  return props.proxyUrl.includes('{url}')
    ? props.proxyUrl.replaceAll('{url}', encoded)
    : props.proxyUrl + encoded;
});

function toWebUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function normalizeInput(input: string): string {
  const value = input.trim();
  if (!value) return startUrl;
  const directUrl = toWebUrl(value);
  if (directUrl) return directUrl;
  if (/^(?:localhost|\d{1,3}(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?(?:[/?#]\S*)?$/i.test(value)) {
    const url = toWebUrl('http://' + value);
    if (url) return url;
  }
  if (/^(?:[^\s./?#:@]+\.)+[^\s./?#:@]+(?::\d+)?(?:[/?#]\S*)?$/.test(value)) {
    const url = toWebUrl('https://' + value);
    if (url) return url;
  }
  return 'https://www.bing.com/search?q=' + encodeURIComponent(value);
}

function navigateTo(url: string) {
  if (url === rawUrl.value) {
    refresh();
  } else {
    history.value = [...history.value.slice(0, historyIndex.value + 1), url];
    historyIndex.value = history.value.length - 1;
    isLoading.value = true;
  }
  urlInput.value = url;
  inputRef.value?.blur();
}

function navigate() {
  navigateTo(normalizeInput(urlInput.value));
}

function goBack() {
  if (canGoBack.value) historyIndex.value--;
}

function goForward() {
  if (canGoForward.value) historyIndex.value++;
}

function refresh() {
  isLoading.value = true;
  frameKey.value++;
}

function onLoad() {
  isLoading.value = false;
  if (isHomepage.value) {
    frameRef.value?.contentWindow?.postMessage({ type: 'vtron:browser:init' }, homepageOrigin);
  }
}

function handleHomepageMessage(event: MessageEvent) {
  if (
    !isHomepage.value ||
    event.source !== frameRef.value?.contentWindow ||
    event.origin !== homepageOrigin ||
    event.data?.type !== 'vtron:startpage:navigate' ||
    typeof event.data.url !== 'string'
  ) return;
  const url = toWebUrl(event.data.url);
  if (url) navigateTo(url);
}

function openExternal() {
  window.open(rawUrl.value, '_blank', 'noopener,noreferrer');
}

function handleShortcut(event: KeyboardEvent) {
  if (!props.isCurrent || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'l') return;
  event.preventDefault();
  inputRef.value?.focus();
  inputRef.value?.select();
}

watch(rawUrl, (url) => {
  urlInput.value = url;
  isLoading.value = true;
});
watch(currentUrl, () => { isLoading.value = true; });
watch([pageTitle, isLoading], ([title, loading]) => emit('change', { title, loading }), { immediate: true });

onMounted(() => {
  window.addEventListener('message', handleHomepageMessage);
  // Scoped to this application so background Chrome windows never steal focus.
  inputRef.value?.closest('.browser')?.addEventListener('keydown', handleShortcut as EventListener);
});
onBeforeUnmount(() => {
  window.removeEventListener('message', handleHomepageMessage);
  inputRef.value?.closest('.browser')?.removeEventListener('keydown', handleShortcut as EventListener);
});
</script>

<template>
  <section class="tab-page" :aria-label="pageTitle" :aria-busy="isLoading">
    <div class="tab-page__toolbar">
      <button type="button" class="tab-page__nav-btn" @click="goBack" :disabled="!canGoBack" title="后退" aria-label="后退">
        <BrowserIcon name="back" />
      </button>
      <button type="button" class="tab-page__nav-btn" @click="goForward" :disabled="!canGoForward" title="前进" aria-label="前进">
        <BrowserIcon name="forward" />
      </button>
      <button type="button" class="tab-page__nav-btn" @click="refresh" title="重新加载" aria-label="重新加载">
        <BrowserIcon name="reload" />
      </button>
      <button type="button" class="tab-page__nav-btn tab-page__home" @click="navigateTo(startUrl)" title="起始页" aria-label="起始页">
        <BrowserIcon name="home" />
      </button>
      <form class="tab-page__urlbar" role="search" @submit.prevent="navigate">
        <span v-if="isLoading" class="tab-page__spinner" aria-hidden="true"></span>
        <BrowserIcon v-else :name="isHomepage ? 'home' : 'globe'" />
        <input
          ref="inputRef"
          class="tab-page__urlbar-input"
          v-model="urlInput"
          @focus="inputRef?.select()"
          @keydown.esc="urlInput = rawUrl; inputRef?.blur()"
          aria-label="网址或搜索内容"
          placeholder="输入网址或搜索内容"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          type="text"
        />
      </form>
      <button type="button" class="tab-page__nav-btn" @click="openExternal" title="在新窗口打开" aria-label="在新窗口打开">
        <BrowserIcon name="external" />
      </button>
    </div>
    <div class="tab-page__progress" :class="{ 'tab-page__progress--loading': isLoading }" aria-hidden="true"><span></span></div>
    <iframe ref="frameRef" :key="frameKey" class="tab-page__frame" :src="currentUrl" :title="pageTitle" @load="onLoad" />
  </section>
</template>

<style scoped lang="scss">
.tab-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  width: 100%;
  background: #fff;
  color: #30343b;

  &__toolbar {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 9px 12px 7px;
    background: #fff;
    flex-shrink: 0;
  }
  &__nav-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: #616772;
    cursor: pointer;
    transition: background 120ms, color 120ms;
    &:hover:not(:disabled) { background: #eef1f5; color: #1d4ed8; }
    &:active:not(:disabled) { background: #e1e8f2; }
    &:focus-visible { outline: 2px solid #4b82e8; outline-offset: 2px; }
    &:disabled { opacity: .3; cursor: default; }
  }
  &__urlbar {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    gap: 10px;
    height: 36px;
    margin: 0 6px;
    padding: 0 13px;
    border: 1px solid transparent;
    border-radius: 19px;
    background: #f0f3f8;
    color: #718096;
    transition: background 120ms, border-color 120ms, box-shadow 120ms;
    &:focus-within { background: #fff; border-color: #92b4ef; box-shadow: 0 0 0 3px #3975dc12; }
  }
  &__urlbar-input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: #30343b;
    font: inherit;
    font-size: 13px;
    &::placeholder { color: #8a919c; }
  }
  &__spinner {
    box-sizing: border-box;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    border: 2px solid #cad9f2;
    border-top-color: #3975dc;
    border-radius: 50%;
    animation: browser-spin 800ms linear infinite;
  }
  &__progress {
    height: 1px;
    background: #edf0f5;
    overflow: hidden;
    flex-shrink: 0;
    span { display: none; height: 100%; width: 35%; background: #477ee2; }
    &--loading span { display: block; animation: browser-progress 1.4s ease-in-out infinite; }
  }
  &__frame { display: block; flex: 1; width: 100%; min-height: 0; border: 0; background: #fff; }
}
@keyframes browser-spin { to { transform: rotate(360deg); } }
@keyframes browser-progress { from { transform: translateX(-100%); } to { transform: translateX(390%); } }
@media (max-width: 480px) {
  .tab-page__toolbar { padding: 7px 5px 6px; gap: 0; }
  .tab-page__home { display: none; }
  .tab-page__urlbar { margin: 0 3px; padding: 0 10px; gap: 7px; }
}
@media (prefers-reduced-motion: reduce) {
  .tab-page * { animation: none !important; transition: none !important; }
}
</style>

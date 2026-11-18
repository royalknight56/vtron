<template>
  <aside class="word-navigation" aria-label="导航窗格">
    <header><strong>导航</strong><button aria-label="关闭导航窗格" @click="emit('close')">×</button></header>
    <input ref="searchInput" v-model="query" type="search" placeholder="搜索文档" aria-label="查找内容"
      @input="showResults" @keydown.enter.prevent="step($event.shiftKey ? -1 : 1); searchInput?.focus({ preventScroll: true })" />
    <div class="nav-tabs" aria-label="导航视图">
      <button :aria-pressed="tab === 'headings'" @click="tab = 'headings'">标题</button>
      <button :aria-pressed="tab === 'results'" @click="tab = 'results'">结果</button>
    </div>
    <template v-if="tab === 'headings'">
      <div class="nav-list">
        <div v-for="item in visibleHeadings" :key="item.index" class="heading-row" :style="{ paddingLeft: (item.level - 1) * 10 + 'px' }">
          <button v-if="item.children" class="disclosure" :aria-label="(collapsed.has(item.el) ? '展开' : '折叠') + item.title"
            :aria-expanded="!collapsed.has(item.el)" @click="toggle(item.el)">{{ collapsed.has(item.el) ? '▸' : '▾' }}</button>
          <span v-else class="disclosure"></span>
          <button class="heading" :title="item.title" :aria-current="item.el === currentHeading ? 'location' : undefined"
            @click="goToHeading(item.el)">{{ item.title }}</button>
        </div>
        <p v-if="!headings.length">文档中没有标题</p>
      </div>
    </template>
    <template v-else>
      <div class="find-actions">
        <span aria-live="polite">{{ matches.length }} 处</span>
        <button aria-label="上一个匹配项" :disabled="!matches.length" @click="step(-1)">↑</button>
        <button aria-label="下一个匹配项" :disabled="!matches.length" @click="step(1)">↓</button>
        <button v-if="!readOnly" :aria-expanded="showReplace" @click="showReplace = !showReplace">替换</button>
      </div>
      <div v-if="showReplace && !readOnly" class="replace-controls">
        <input v-model="replacement" placeholder="替换为" aria-label="替换内容" />
        <button :disabled="!matches.length" @click="replaceCurrent">替换当前</button>
        <button :disabled="!matches.length" @click="replaceAll">全部替换</button>
      </div>
      <div class="nav-list">
        <button v-for="(match, index) in matches.slice(0, limit)" :key="index" class="result"
          :aria-current="index === selected ? 'true' : undefined" @click="choose(index)">{{ match.before }}<mark>{{ match.text }}</mark>{{ match.after }}</button>
        <button v-if="matches.length > limit" @click="limit += 60">显示更多结果</button>
      </div>
    </template>
  </aside>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { searchDocument } from './wordSearch';

const props = defineProps<{ editor?: HTMLElement; workspace?: HTMLElement; revision: number; readOnly: boolean }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'replace', ranges: Range[], text: string): void; (e: 'report', message: string): void }>();
const query = ref('');
const replacement = ref('');
const tab = ref<'headings' | 'results'>('headings');
const showReplace = ref(false);
const selected = ref(-1);
const limit = ref(60);
const searchInput = ref<HTMLInputElement>();
const collapsed = ref(new Set<HTMLElement>());
const currentHeading = ref<HTMLElement>();
const headings = computed(() => {
  props.revision;
  return Array.from(props.editor?.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6') || [])
    .filter(el => !el.closest('table') && el.textContent?.trim())
    .map((el, index) => ({ el, index, title: el.textContent!.trim(), level: Number(el.tagName[1]) }));
});
const visibleHeadings = computed(() => {
  let hiddenBelow = 7;
  return headings.value.flatMap((item, i, all) => {
    if (item.level > hiddenBelow) return [];
    hiddenBelow = collapsed.value.has(item.el) ? item.level : 7;
    return [{ ...item, children: Boolean(all[i + 1] && all[i + 1].level > item.level) }];
  });
});
const matches = computed(() => {
  props.revision;
  return props.editor && tab.value === 'results' ? searchDocument(props.editor, query.value) : [];
});
function toggle(el: HTMLElement) {
  if (collapsed.value.has(el)) collapsed.value.delete(el);
  else collapsed.value.add(el);
}
function showResults() {
  tab.value = 'results';
  selected.value = -1;
  limit.value = 60;
}
function openSearch(replace: boolean) {
  showResults();
  showReplace.value = replace;
  const selection = window.getSelection();
  if (selection && props.editor?.contains(selection.anchorNode) && props.editor.contains(selection.focusNode) && !selection.isCollapsed)
    query.value = selection.toString();
  nextTick(() => { searchInput.value?.focus(); searchInput.value?.select(); });
}
defineExpose({ openSearch });
function selectRange(range: Range) {
  props.editor?.focus({ preventScroll: true });
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}
function goToHeading(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(true);
  selectRange(range);
  el.scrollIntoView({ block: 'start', inline: 'nearest' });
  currentHeading.value = el;
}
function syncHeading() {
  if (!props.workspace || tab.value !== 'headings') return;
  const top = props.workspace.getBoundingClientRect().top + 24;
  const visible = headings.value;
  let lo = 0, hi = visible.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (visible[mid].el.getBoundingClientRect().top <= top) lo = mid + 1;
    else hi = mid;
  }
  currentHeading.value = visible[Math.max(0, lo - 1)]?.el;
}
onMounted(() => props.workspace?.addEventListener('scroll', syncHeading, { passive: true }));
onBeforeUnmount(() => props.workspace?.removeEventListener('scroll', syncHeading));
watch([headings, tab], () => {
  for (const el of collapsed.value) if (!props.editor?.contains(el)) collapsed.value.delete(el);
  nextTick(syncHeading);
}, { immediate: true });
function choose(index: number) {
  const match = matches.value[index];
  if (!match) return;
  selected.value = index;
  limit.value = Math.max(limit.value, index + 1);
  selectRange(match.range);
  match.range.startContainer.parentElement?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
function step(delta: number) {
  const count = matches.value.length;
  if (count) choose(selected.value < 0 ? (delta < 0 ? count - 1 : 0) : (selected.value + delta + count) % count);
}
function replaceCurrent() {
  const index = Math.max(0, selected.value);
  const match = matches.value[index];
  if (!match || props.readOnly) return;
  emit('replace', [match.range], replacement.value);
  // The browser places the caret after the inserted text. A range captured before
  // the edit can move to its beginning when the match spans formatted runs.
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;
  const end = selection.getRangeAt(0).cloneRange();
  end.collapse(false);
  nextTick(() => {
    const next = matches.value.findIndex(item => item.range.compareBoundaryPoints(Range.START_TO_START, end) >= 0);
    selected.value = -1;
    choose(next < 0 ? 0 : next);
  });
}
function replaceAll() {
  if (props.readOnly) return;
  const results = matches.value.slice();
  emit('replace', results.reverse().map(item => item.range), replacement.value);
  selected.value = -1;
  emit('report', `已替换 ${results.length} 处`);
}
</script>
<style scoped>
.word-navigation { flex: 0 0 clamp(145px, 26%, 275px); min-width: 0; display: flex; flex-direction: column; gap: 8px; padding: 12px; background: #fff; border-right: 1px solid var(--word-line); }
.word-navigation header, .find-actions, .nav-tabs { display: flex; align-items: center; gap: 4px; }
.word-navigation header { justify-content: space-between; }
.word-navigation header strong { font-size: 15px; }
.word-navigation input { width: 100%; min-width: 0; border: 1px solid #aab3bf; padding: 5px 7px; }
.nav-tabs { border-bottom: 1px solid var(--word-line); }
.nav-tabs button[aria-pressed=true] { border-bottom: 2px solid var(--word-blue); color: var(--word-blue); }
.word-navigation button { padding: 3px 6px; text-align: left; }
.nav-list { overflow: auto; min-height: 0; }
.heading-row { display: flex; align-items: center; }
.disclosure { width: 20px; flex: none; }
.heading { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.word-navigation [aria-current] { background: #e9f1fc; }
.result { display: block; width: 100%; overflow-wrap: anywhere; }
.find-actions { flex-wrap: wrap; }
.find-actions span { margin-right: auto; }
.nav-list p, .find-actions span { color: var(--word-muted); }
.replace-controls input { margin-bottom: 4px; }
</style>

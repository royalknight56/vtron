<template>
  <div class="apps start-scroll" :aria-label="i18n('startMenu.apps')">
    <div v-if="choosingLetter" class="letter-grid">
      <button
        v-for="letter in alphabet"
        :key="letter"
        type="button"
        :disabled="!groups.has(letter)"
        @click.stop="jump(letter)"
      >
        {{ letter }}
      </button>
    </div>
    <template v-else>
      <section v-for="[letter, entries] in groups" :key="letter">
        <button
          :ref="(el) => collectHeading(letter, el)"
          type="button"
          class="letter"
          @click.stop="choosingLetter = true"
        >
          {{ letter }}
        </button>
        <button
          v-for="{ item, name } in entries"
          :key="item.path"
          type="button"
          class="app"
          :title="name"
          @click.stop="handle(item)"
          @contextmenu.stop.prevent="showShortcutPinMenu(sys, $event, item)"
        >
          <FileIcon class="app-icon" :file="item" /><span>{{ name }}</span>
        </button>
      </section>
    </template>
  </div>
</template>
<script lang="ts" setup>
import { computed, inject, nextTick, ref, type ComponentPublicInstance } from 'vue';
import type { System, VtronFileWithoutContent } from '@packages/kernel';
import { useAppOpen } from '@/packages/computer/hook/useAppOpen';
import FileIcon from '@/packages/computer/application/FileIcon.vue';
import { showShortcutPinMenu } from '@/packages/computer/utils/taskbarPins';
import { i18n } from '../../../../i18n';

const sys = inject<System>('system')!;
const { openapp, appList } = useAppOpen('menulist', sys);
const alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const collator = new Intl.Collator('zh-Hans-u-co-pinyin', { numeric: true });
function initial(name: string) {
  const first = Array.from(name)[0] ?? '';
  if (/^[a-z]$/i.test(first)) return first.toUpperCase();
  if (/^\p{Script=Han}$/u.test(first)) {
    // ICU's Chinese collation index places these markers before each pinyin initial.
    for (const letter of 'ZYXWTSRQPONMLKJHGFEDCBA') {
      if (collator.compare(first, '\uFDD0' + letter) >= 0) return letter;
    }
  }
  return '#';
}
const groups = computed(() => {
  const entries = appList
    .filter((item) => !item.name.startsWith('.'))
    .map((item) => {
      const name = item.name.replace(/\.exe$/i, '');
      return { item, name, letter: initial(name) };
    })
    .sort(
      (a, b) => alphabet.indexOf(a.letter) - alphabet.indexOf(b.letter) || collator.compare(a.name, b.name)
    );
  const grouped = new Map<string, typeof entries>();
  for (const entry of entries) {
    if (!grouped.has(entry.letter)) grouped.set(entry.letter, []);
    grouped.get(entry.letter)!.push(entry);
  }
  return grouped;
});
const choosingLetter = ref(false);
const headings = new Map<string, HTMLElement>();
function collectHeading(letter: string, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) headings.set(letter, el);
  else headings.delete(letter);
}
async function jump(letter: string) {
  choosingLetter.value = false;
  await nextTick();
  const heading = headings.get(letter);
  heading?.focus({ preventScroll: true });
  heading?.scrollIntoView({ block: 'start' });
}
function handle(item: VtronFileWithoutContent) {
  sys.emitEvent('menulist.item.click', item);
  openapp(item);
}
</script>
<style scoped>
.apps {
  padding: 8px 6px 12px 0;
}
.apps button {
  text-align: left;
}
.apps .app,
.apps .letter {
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
}
.apps .letter {
  height: 40px;
  padding: 0 16px;
}
.apps .app {
  gap: 10px;
  padding: 0 8px;
}
.app .app-icon {
  width: 24px;
  height: 24px;
  flex: none;
}
.app span {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.apps button:hover:not(:disabled) {
  background: var(--start-hover);
}
.letter-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}
.letter-grid button {
  min-width: 0;
  height: 40px;
  text-align: center;
}
.letter-grid button:disabled {
  opacity: 0.3;
}
</style>

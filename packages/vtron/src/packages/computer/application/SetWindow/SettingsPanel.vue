<template>
  <div class="settings-panel">
    <nav :aria-label="title">
      <h2>{{ title }}</h2>
      <button
        v-for="(page, index) in pages"
        :key="page"
        type="button"
        :aria-current="index === active ? 'page' : undefined"
        @click="active = index"
      >
        {{ page }}
      </button>
    </nav>
    <section class="settings-page" :aria-label="pages[active]">
      <h1>{{ pages[active] }}</h1>
      <slot :active="active" />
    </section>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; pages: string[] }>();
const active = defineModel<number>({ default: 0 });
</script>

<style scoped>
.settings-panel {
  display: grid;
  grid-template-columns: var(--settings-sidebar-width, 200px) minmax(0, 1fr);
  height: calc(100% - 40px);
  color: #1b1b1b;
}

nav {
  overflow: auto;
  background: #f0f0f0;
}

nav h2 {
  margin: 22px 16px 14px;
  font-size: 15px;
  font-weight: 600;
}

nav button {
  position: relative;
  display: block;
  width: 100%;
  min-height: 44px;
  padding: 8px 16px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 14px;
  text-align: left;
}

nav button:hover,
nav button:focus-visible {
  background: #e1e1e1;
}

nav button[aria-current]::before {
  content: '';
  position: absolute;
  inset: 11px auto 11px 0;
  width: 3px;
  background: #0078d7;
}

.settings-page {
  overflow: auto;
  background: white;
  padding: 18px 28px 30px;
  font-size: 14px;
}

.settings-page h1 {
  margin: 0 0 22px;
  font-size: 28px;
  font-weight: 400;
  line-height: 1.3;
}

.settings-page :deep(h2) {
  margin: 24px 0 10px;
  font-size: 18px;
  font-weight: 500;
}

.settings-page :deep(p) {
  margin: 8px 0 14px;
  line-height: 1.55;
}

.settings-page :deep(.field) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 20px;
}

.settings-page :deep(input:not([type='range'], [type='checkbox'], [type='color'])),
.settings-page :deep(select) {
  box-sizing: border-box;
  width: min(100%, 320px);
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid #777;
  border-radius: 0;
  background: white;
  color: inherit;
  font: inherit;
}

.settings-page :deep(input[type='range']) {
  width: min(100%, 300px);
  accent-color: #0078d7;
}

.settings-page :deep(input[role='switch']) {
  appearance: none;
  display: grid;
  align-items: center;
  width: 42px;
  height: 20px;
  margin: 0;
  padding: 0 3px;
  border: 1px solid #555;
  border-radius: 12px;
  color: #444;
}
.settings-page :deep(input[role='switch']::before) {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
}
.settings-page :deep(input[role='switch']:checked) {
  justify-items: end;
  border-color: #0078d7;
  background: #0078d7;
  color: white;
}

.settings-page :deep(.action) {
  min-height: 32px;
  max-width: 100%;
  padding: 4px 13px;
  border: 2px solid transparent;
  background: #e6e6e6;
  color: inherit;
  font: inherit;
}

.settings-page :deep(.action:hover:not(:disabled)) {
  border-color: #999;
}

.settings-page :deep(.settings-link) {
  display: block;
  width: fit-content;
  padding: 0;
  margin: 10px 0;
  border: 0;
  background: transparent;
  color: #0067b8;
  font: inherit;
  text-align: left;
}

.settings-page :deep(.settings-link:hover) {
  text-decoration: underline;
}
</style>

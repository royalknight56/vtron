<template>
  <dialog ref="menu" class="filter-menu" :aria-label="title" @close="emit('close')" @click.self="outside" @keydown.stop>
    <form @submit.prevent="apply">
      <strong>{{ title }}</strong>
      <button type="button" :disabled="!selected" @click="emit('apply', undefined)">清除此列筛选</button>
      <select v-model="mode" aria-label="筛选方式">
        <option value="values">按值筛选</option><option value="custom">自定义筛选</option>
      </select>
      <template v-if="mode === 'values'">
        <input ref="search" v-model="query" type="search" placeholder="搜索" aria-label="搜索筛选值" />
        <label><input type="checkbox" :checked="all" :indeterminate="some && !all" @change="toggleAll" />全选</label>
        <div class="values">
          <label v-for="value in matches" :key="value">
            <input v-model="checked" type="checkbox" :value="value" />{{ value || '（空白）' }}
          </label>
          <span v-if="!matches.length">无匹配项</span>
        </div>
      </template>
      <template v-else>
        <div v-for="(rule, i) in visibleRules" :key="i" class="rule">
          <select v-if="i === 1" v-model="and" aria-label="条件关系">
            <option :value="true">并且</option><option :value="false">或者</option>
          </select>
          <select v-model="rule.operator" :aria-label="`条件 ${i + 1} 比较方式`">
            <option v-for="(label, key) in operators" :key="key" :value="key">{{ label }}</option>
          </select>
          <input v-model="rule.value" type="text" :aria-label="`条件 ${i + 1} 的值`" placeholder="输入比较值" />
        </div>
        <label><input v-model="twoRules" type="checkbox" />使用第二个条件</label>
      </template>
      <footer><button type="submit" :disabled="mode === 'custom' ? visibleRules.some(rule => !rule.value.length) : !checked.size">确定</button>
        <button type="button" @click="menu?.close()">取消</button></footer>
    </form>
  </dialog>
</template>
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { filterOperators, type ColumnFilter, type FilterRule } from './excelFilter';
import { numericInput } from './excelCriteria';

const props = defineProps<{ title: string; anchor: DOMRect; choices: string[]; numericColumn: boolean; selected?: ColumnFilter }>();
const emit = defineEmits<{ (e: 'apply', values: ColumnFilter | undefined): void; (e: 'close'): void }>();
const menu = ref<HTMLDialogElement>(), search = ref<HTMLInputElement>(), query = ref('');
const custom = Array.isArray(props.selected) ? undefined : props.selected;
const mode = ref(custom ? 'custom' : 'values');
const twoRules = ref(custom?.rules.length === 2), and = ref(custom?.and ?? true);
const operators = { ...filterOperators, begins: '开头是', ends: '结尾是', contains: '包含', excludes: '不包含' };
interface RuleInput { operator: keyof typeof operators; value: string }
function editRule(rule?: FilterRule): RuleInput {
  if (!rule) return { operator: 'equal', value: '' };
  if (rule.operator === 'equal' || rule.operator === 'notEqual') {
    const tokens = rule.value.match(/~[?*~]|[\s\S]/g) || [];
    const first = tokens[0] === '*', last = tokens[tokens.length - 1] === '*';
    const inner = tokens.slice(first ? 1 : 0, last ? -1 : undefined).join('');
    if (inner && first && last) return { operator: rule.operator === 'equal' ? 'contains' : 'excludes', value: inner };
    if (inner && rule.operator === 'equal' && (first || last)) return { operator: first ? 'ends' : 'begins', value: inner };
  }
  return { ...rule };
}
function saveRule({ operator, value }: RuleInput): FilterRule {
  switch (operator) {
    case 'begins': return { operator: 'equal', value: value + '*' };
    case 'ends': return { operator: 'equal', value: '*' + value };
    case 'contains': return { operator: 'equal', value: '*' + value + '*' };
    case 'excludes': return { operator: 'notEqual', value: '*' + value + '*' };
    default: {
      const percent = value.trim().match(/^(.+?)[%％]$/);
      return { operator, value: props.numericColumn && percent && numericInput.test(percent[1]) ? String(Number(percent[1]) / 100) : value };
    }
  }
}
const original = [editRule(custom?.rules[0]), editRule(custom?.rules[1])];
const rules = ref(original.map(rule => ({ ...rule })));
const visibleRules = computed(() => twoRules.value ? rules.value : rules.value.slice(0, 1));
const initial = () => new Set(Array.isArray(props.selected) ? props.selected : props.choices);
const checked = ref(initial());
const matches = computed(() => props.choices.filter(v => (v || '（空白）').toLowerCase().includes(query.value.toLowerCase())));
const all = computed(() => matches.value.length > 0 && matches.value.every(v => checked.value.has(v)));
const some = computed(() => matches.value.some(v => checked.value.has(v)));
watch(query, q => { checked.value = q ? new Set(matches.value) : initial(); });
function toggleAll() {
  const select = !all.value;
  for (const value of matches.value) {
    if (select) checked.value.add(value);
    else checked.value.delete(value);
  }
}
function apply() {
  if (mode.value === 'custom') {
    const conditions = visibleRules.value.map((rule, i) =>
      custom?.rules[i] && rule.operator === original[i].operator && rule.value === original[i].value
        ? custom.rules[i] : saveRule(rule));
    if (custom && (conditions.length < 2 || custom.and === and.value) &&
        custom.rules.length === conditions.length && conditions.every((rule, i) => rule === custom.rules[i])) return emit('close');
    emit('apply', { and: conditions.length === 2 && and.value, rules: conditions });
    return;
  }
  const prior = initial();
  if (!custom && prior.size === checked.value.size && [...prior].every(v => checked.value.has(v))) return emit('close');
  emit('apply', props.choices.every(v => checked.value.has(v)) ? undefined : [...checked.value]);
}
function outside(event: MouseEvent) {
  const rect = menu.value!.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
    menu.value?.close();
}
function position() {
  const el = menu.value!;
  const rect = el.getBoundingClientRect(), anchor = props.anchor;
  el.style.left = Math.max(0, Math.min(anchor.right - rect.width, window.innerWidth - rect.width)) + 'px';
  el.style.top = Math.max(0, anchor.bottom + rect.height <= window.innerHeight ? anchor.bottom : anchor.top - rect.height) + 'px';
}
let observer: ResizeObserver;
onMounted(() => {
  menu.value!.showModal();
  position();
  observer = new ResizeObserver(position);
  observer.observe(menu.value!);
  search.value?.focus();
});
onBeforeUnmount(() => observer?.disconnect());
</script>
<style scoped>
.filter-menu { position: fixed; inset: auto; margin: 0; width: min(228px, 95vw); max-height: 90vh; box-sizing: border-box;
  padding: 10px; border: 1px solid #b5bcb7; color: #222; background: white; font: 13px 'Segoe UI', sans-serif; box-shadow: 0 3px 12px #0002; }
.filter-menu::backdrop { background: transparent; }
form, .rule, .values { display: flex; flex-direction: column; gap: 5px; }
form > strong, label { overflow-wrap: anywhere; }
label { display: flex; gap: 6px; align-items: center; min-height: 21px; }
input[type=checkbox] { accent-color: #217346; flex: none; }
.values { max-height: min(225px, 32vh); overflow: auto; border-block: 1px solid #ddd; padding-block: 4px; }
select, input[type=text], input[type=search], button { font: inherit; padding: 4px 6px; }
footer { display: flex; justify-content: flex-end; gap: 6px; }
</style>

<template>
  <div class="uper_nav">
    <div class="uper_nav_button" @click="backFolder()">
      <svg
        t="1632984723698"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="10100"
      >
        <path
          d="M862.485 481.154H234.126l203.3-203.3c12.497-12.497 12.497-32.758 0-45.255s-32.758-12.497-45.255 0L135.397 489.373c-12.497 12.497-12.497 32.758 0 45.254l256.774 256.775c6.249 6.248 14.438 9.372 22.627 9.372s16.379-3.124 22.627-9.372c12.497-12.497 12.497-32.759 0-45.255l-203.3-203.301h628.36c17.036 0 30.846-13.81 30.846-30.846s-13.81-30.846-30.846-30.846z"
          p-id="10101"
        />
      </svg>
    </div>
    <div class="uper_nav_button" @click="backFolder()">
      <svg
        t="1632984737821"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="10249"
      >
        <path
          d="M885.113 489.373L628.338 232.599c-12.496-12.497-32.758-12.497-45.254 0-12.497 12.497-12.497 32.758 0 45.255l203.3 203.3H158.025c-17.036 0-30.846 13.811-30.846 30.846 0 17.036 13.811 30.846 30.846 30.846h628.36L583.084 746.147c-12.497 12.496-12.497 32.758 0 45.255 6.248 6.248 14.438 9.372 22.627 9.372s16.379-3.124 22.627-9.372l256.775-256.775a31.999 31.999 0 0 0 0-45.254z"
          p-id="10250"
        />
      </svg>
    </div>
    <div class="uper_nav_button uper_nav_button_small" @click="backFolder()">
      <svg
        t="1639145779758"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="3080"
      >
        <path
          d="M533.333333 516.266667l-174.933333-170.666667-64 59.733333 234.666667 234.666667L768 405.333333l-59.733333-59.733333-174.933334 170.666667z"
          fill="#444444"
          p-id="3081"
        />
      </svg>
    </div>
    <div class="uper_nav_button" @click="backFolder()">
      <svg
        t="1639145815176"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="3860"
      >
        <path
          d="M554.666667 268.8v601.6h-85.333334V268.8L337.066667 401.066667 277.333333 341.333333 512 106.666667 746.666667 341.333333l-59.733334 59.733334L554.666667 268.8z"
          fill="#444444"
          p-id="3861"
        />
      </svg>
    </div>

    <div @click="startInput()" v-if="path_state == 'pendding'" class="path">
      <template v-if="modelValue?.startsWith('search:')">
        <span>{{ modelValue }}</span>
      </template>
      <template v-else>
        <span
          class="path-p"
          :key="p"
          v-for="(p, index) in modelValue?.split('/').slice(1)"
          @click.stop="handlePathPClick(index)"
          >/{{ p }}</span
        >
      </template>
    </div>
    <div @focusout="endInput()" v-show="path_state == 'inputing'" class="path_inputing nav-path">
      <input ref="myinput" v-model="inputStr" @keyup.enter="endInput()" />
    </div>
    <div class="search path_inputing">
      <input placeholder="search" v-model="searchStr" @keyup.enter="endSearch" @blur="endSearch" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, nextTick } from 'vue';
const props = defineProps<{
  modelValue?: string;
}>();
const emit = defineEmits(['update:modelValue', 'backFolder', 'refresh', 'search']);

function backFolder() {
  emit('backFolder');
}

/* ------------ 路径输入框 ------------*/
const myinput = ref<HTMLElement | null>(null);
const inputStr = ref(props.modelValue);

const path_state = ref('pendding');
function startInput() {
  path_state.value = 'inputing';
  inputStr.value = props.modelValue;
  nextTick(() => {
    myinput.value?.focus();
  });
}
function endInput() {
  path_state.value = 'pendding';
  emit('refresh', inputStr.value);
}
/* ------------ 路径输入框end ---------*/

/* ------------ 搜索框 ------------*/
const searchStr = ref('');
function endSearch() {
  if (searchStr.value == '') return;
  emit('search', searchStr.value);
  searchStr.value = '';
}

function handlePathPClick(index: number) {
  const path = props.modelValue
    ?.split('/')
    .slice(0, index + 2)
    .join('/');
  if (path === undefined) return;
  if (path === props.modelValue) return;
  emit('refresh', path);
}
</script>
<style lang="scss" scoped>
.uper_nav {
  height: var(--button-item-height);
  display: flex;
}

.uper_nav_button {
  width: calc(var(--button-item-height) - 10px);
  height: var(--button-item-height);
  line-height: var(--button-item-height);
  padding: 0px 4px;
  margin: 0 auto;
  flex-shrink: 0;
  text-align: center;
  filter: brightness(230%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.uper_nav_button_small {
  width: calc(var(--button-item-height) - 16px);
}

.uper_nav_button svg {
  width: calc(var(--button-item-height) - 16px);
  height: calc(var(--button-item-height) - 16px);
}

.path {
  height: calc(var(--button-item-height));
  width: 100%;
  line-height: calc(var(--button-item-height) - 6px);
  padding: 0px 5px;
  margin: 0px 2px;
  border: 1px solid rgba(134, 134, 134, 0.267);
  transition: all 0.1s;
  /* text-align: center; */
  overflow: auto;
  user-select: none;

  display: flex;
  align-items: center;
  .path-p {
    padding: 0;
    margin: 0;
  }
  .path-p:hover {
    color: rgb(0, 102, 255);
    cursor: pointer;
  }
  .path span {
    height: var(--button-item-height);
    /* text-align: center; */
    line-height: var(--button-item-height);
  }
}

.path_inputing {
  height: calc(var(--button-item-height));
  width: 100%;
  line-height: calc(var(--button-item-height) - 6px);
  padding: 0px 5px;
  margin: 0px 2px;
  border: 1px solid rgba(134, 134, 134, 0.267);
  transition: all 0.1s;
  user-select: text;
}

.path_inputing input {
  height: 100%;
  width: 100%;
  /* padding: 1px 5px; */
  /* text-align: center; */
  line-height: var(--button-item-height);
  background: none;
  border: none;
  outline: none;
}
.nav-path {
}
.search {
  width: 200px;
}
.path:hover {
  border: 1px solid rgb(0, 102, 255);
}
</style>

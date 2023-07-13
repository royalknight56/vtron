<template>
    <div class="win-select" :class="{ open: isOpen }" @click="toggleOpen" @blur="isOpen = false">
        <div class="selected-item">
            <span v-if="selectedOption">{{ selectedOption.label }}</span>
            <span v-else>{{ placeholder }}</span>
        </div>
        <div class="options" v-if="isOpen">
            <div class="option" v-for="option in options" :key="option.value" @click.stop="selectOption(option)">
                {{ option.label }}
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';

interface OptionItem {
    label: string;
    value: any;
}
let props = defineProps({
    modelValue: {
        default: '',
        type: [String, Number, Boolean, Symbol]
    },
    options: {
        type: Array<{
            label: string;
            value: any;
        }>,
        default: () => []
    },
    placeholder: {
        type: String,
        default: 'Select an option'
    }
})
let emit = defineEmits(['update:modelValue'])
const isOpen = ref(false);
const selectedOption = ref<OptionItem | null>(null);

const toggleOpen = () => {
    isOpen.value = !isOpen.value;
};

const selectOption = (option: OptionItem) => {
    selectedOption.value = option;
    emit('update:modelValue', option.value);
    isOpen.value = false;
    closeSelect()
};

const findSelectedOption = () => {
    console.log(props)
    const option = props.options.find((option: OptionItem) => option.value === props.modelValue);
    selectedOption.value = option || null;
};

function closeSelect() {
    isOpen.value = false;
}


onMounted(() => {
    findSelectedOption();
    window.addEventListener('click', handleClickOutside);
});
onUnmounted(() => {
    window.removeEventListener('click', handleClickOutside);
});
let handleClickOutside = (event: MouseEvent) => {
    if (!event.target || !(event.target instanceof Element)) {
        return;
    }
    const targetElement = event.target as Element;
    if (!targetElement.closest('.win-select')) {
        isOpen.value = false;
    }
};
</script>


<style scoped  lang="scss">
.win-select {
    /* position: relative;
  display: inline-block;
  width: 200px;
  height: 32px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer; */
    position: relative;
    background-color: var(--color-ui-gray);
    border: var(--light-border);
    cursor: pointer;
    transition: all 0.2s;
    font-size: var(--ui-font-size);
    width: calc(var(--ui-button-width) * 2);
    height: var(--ui-button-height);
    border-width: 1px;
    box-sizing: border-box;

    &:hover {
        border-width: 1px;
        border-color: var(--color-blue);
        background-color: var(--color-light-blue);
    }
}

.win-select.open {
    z-index: 1;
}

.selected-item {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 8px;
}

.selected-item span:first-child {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.options {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    background-color: #fff;
    // border: 1px solid #ccc;
    border-top: none;
    // border-radius: 0 0 4px 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.option {
    padding: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.option:hover {
    background-color: var(--color-blue);
    color: var(--color-white);
}
</style>
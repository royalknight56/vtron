<template>
    <div class="note-scheduler">
        <div class="title">最近日程</div>
        <div v-if="recentNotes.length === 0" class="empty">暂无日程</div>
        <div v-else class="notes-list scroll-bar">
            <div v-for="(note, index) in recentNotes" :key="index" class="note-item">
                <div class="note-time">{{ formatTime(note.time) }}</div>
                <div class="note-text">{{ note.text }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue';
import { System } from '@packages/kernel';
import { join } from '@/packages/plug';

const sys = inject<System>('system')!;
const recentNotes = ref<Array<{ text: string, time: number }>>([]);

// 格式化时间
function formatTime(timestamp: number) {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 读取最近的日程
async function loadRecentNotes() {
    const now = new Date();
    const notes: Array<{ text: string, time: number }> = [];

    // 查找未来7天内的日程
    for (let i = 0; i < 7; i++) {
        const checkDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        const fileName = `${checkDate.getFullYear()}-${checkDate.getMonth() + 1}-${checkDate.getDate()}.json`;

        try {
            const fileContent = await sys.fs.readFile(
                join(sys.stateManager.options.getOptions('userLocation') || '', '/Schedule', fileName)
            );

            if (fileContent) {
                const dayNotes = JSON.parse(fileContent);
                notes.push(...dayNotes);
            }
        } catch (e) {
            continue;
        }
    }

    // 按时间排序并只保留最近的5条
    recentNotes.value = notes
        .filter(note => note.time >= now.getTime())
        .sort((a, b) => a.time - b.time)
        .slice(0, 5);
}

onMounted(() => {
    loadRecentNotes();
});
</script>

<style lang="scss" scoped>
@import '@packages/assets/main.scss';

.note-scheduler {
    width: 110px;
    height: 110px;
    border-radius: 14px;
    background: var(--color-dark);
    position: relative;
    margin: 10px;
    box-shadow: 0 0 6px var(--color-dark);
    padding: 10px;
    color: var(--color-white);
    overflow: hidden;
    box-sizing: border-box;

    .title {
        font-size: 16px;
        margin-bottom: 8px;
        font-weight: bold;
    }

    .empty {
        font-size: 12px;
        color: #999;
        text-align: center;
        margin-top: 20px;
    }

    .notes-list {
        height: calc(100% - 24px);
        overflow-y: auto;

        .note-item {
            margin-bottom: 6px;
            font-size: 12px;

            .note-time {
                color: #999;
                margin-bottom: 2px;
            }

            .note-text {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }
}
</style>

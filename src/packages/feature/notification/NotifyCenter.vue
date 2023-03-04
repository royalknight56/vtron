<template>
    <div class="notify">
        <div class="notify-item" v-for="notify in notifyGroup">
            <div class="notify-item-title">
                <span>{{notify.title}}</span>
            </div>
            <div class="notify-item-body">
                <span>{{ notify.content }}</span>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { useRootState } from '../state/Root';

let notifyGroup = useRootState().system.notify
</script>
<style lang="scss" scoped>
.notify {
    position: absolute;
    top: 0;
    right: 0;
    width: 300px;
    height: 100%;
    background-color: #fff;
    border-left: 1px solid #ccc;
    overflow-y: auto;
    .notify-item {
        padding: 10px;
        border-bottom: 1px solid #ccc;
        .notify-item-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .notify-item-body {
            font-size: 14px;
        }
    }
}
</style>
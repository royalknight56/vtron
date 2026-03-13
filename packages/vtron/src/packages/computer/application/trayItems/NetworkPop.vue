<template>
  <div class="network-pop" @mousedown.stop="">
    <div class="net-header">
      <span class="net-icon segoicon SEGOEUIMDL">{{ isConnected ? '\uE839' : '\uEB55' }}</span>
      <div class="net-status">
        <span class="net-status-text">{{ isConnected ? i18n('network.connected') : i18n('network.disconnected') }}</span>
        <span class="net-eff-type">{{ navigator.connection.effectiveType }}</span>
      </div>
      <span class="net-dot" :class="{ connected: isConnected }"></span>
    </div>
    <div class="net-details">
      <div class="net-row">
        <span class="net-label">{{ i18n('network.speed') }}</span>
        <span class="net-value">{{ navigator.connection.downlink }} Mbps</span>
      </div>
      <div class="net-row">
        <span class="net-label">{{ i18n('network.type') }}</span>
        <span class="net-value">{{ navigator.connection.effectiveType }}</span>
      </div>
      <div class="net-row">
        <span class="net-label">{{ i18n('network.latency') }}</span>
        <span class="net-value">{{ navigator.connection.rtt }} ms</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, inject } from 'vue';
import { System } from '@packages/kernel';
import { i18n } from '@/packages/computer/i18n';

const sys = inject<System>('system')!;
const navigator = sys.stateManager.navigator;

const isConnected = computed(() => navigator.connection.rtt > 0);
</script>
<style lang="scss" scoped>
.network-pop {
  width: 100%;
  height: 100%;
  background-color: #ededed;
  border: 1px solid #9c9c9c;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.net-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);

  .net-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .net-status {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;

    .net-status-text {
      font-size: 13px;
      font-weight: 600;
    }

    .net-eff-type {
      font-size: 11px;
      color: #666;
      margin-top: 1px;
    }
  }

  .net-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    background: #bbb;
    transition: background 0.2s;

    &.connected {
      background: #2ecc40;
    }
  }
}

.net-details {
  padding: 8px 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .net-row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .net-label {
      font-size: 11px;
      color: #888;
    }

    .net-value {
      font-size: 11px;
      font-weight: 500;
    }
  }
}
</style>

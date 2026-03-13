<template>
  <div class="battery-pop" @mousedown.stop="">
    <div class="bat-header">
      <span class="bat-icon segoicon SEGOEUIMDL">{{ iconDisplay }}</span>
      <div class="bat-status">
        <span class="bat-status-text">{{ statusText }}</span>
        <span class="bat-level-text">{{ levelPercent }}%</span>
      </div>
    </div>
    <div class="bat-bar-wrap">
      <div class="bat-bar-bg">
        <div
          class="bat-bar-fill"
          :class="{ low: levelPercent <= 20, charging: battery.isCharging }"
          :style="{ width: levelPercent + '%' }"
        ></div>
      </div>
    </div>
    <div class="bat-details">
      <div class="bat-row">
        <span class="bat-label">{{ i18n('battery.level') }}</span>
        <span class="bat-value">{{ levelPercent }}%</span>
      </div>
      <div class="bat-row">
        <span class="bat-label">{{ i18n('battery.status') }}</span>
        <span class="bat-value">{{ statusText }}</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, ref, computed, watchEffect } from 'vue';
import { System } from '@packages/kernel';
import { i18n } from '@/packages/computer/i18n';

const sys = inject<System>('system')!;
const battery = sys.stateManager.navigator.battery;

const levelPercent = computed(() => Math.round(battery.chargeLevel * 100));

const statusText = computed(() => {
  if (levelPercent.value >= 100) return i18n('battery.full');
  return battery.isCharging ? i18n('battery.charging') : i18n('battery.discharging');
});

const charMap = {
  noC: {
    0: '\uE850', 1: '\uE851', 2: '\uE852', 3: '\uE853', 4: '\uE854',
    5: '\uE855', 6: '\uE856', 7: '\uE857', 8: '\uE858', 9: '\uE859',
  } as Record<number, string>,
  isC: {
    0: '\uE85A', 1: '\uE85B', 2: '\uE85C', 3: '\uE85D', 4: '\uE85E',
    5: '\uE85F', 6: '\uE860', 7: '\uE861', 8: '\uE862', 9: '\uE859',
  } as Record<number, string>,
};

const iconDisplay = ref('\uE850');

watchEffect(() => {
  if (battery.chargeLevel >= 1) {
    iconDisplay.value = charMap.noC[9];
  } else {
    const level = Math.floor(battery.chargeLevel * 10);
    iconDisplay.value = charMap[battery.isCharging ? 'isC' : 'noC'][level];
  }
});
</script>
<style lang="scss" scoped>
.battery-pop {
  width: 100%;
  height: 100%;
  background-color: #ededed;
  border: 1px solid #9c9c9c;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.bat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px 8px;

  .bat-icon {
    font-size: 28px;
    flex-shrink: 0;
  }

  .bat-status {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;

    .bat-status-text {
      font-size: 13px;
      font-weight: 600;
    }

    .bat-level-text {
      font-size: 20px;
      font-weight: 300;
      margin-top: 1px;
    }
  }
}

.bat-bar-wrap {
  padding: 0 14px 8px;

  .bat-bar-bg {
    width: 100%;
    height: 6px;
    background: #d0d0d0;
    border-radius: 3px;
    overflow: hidden;

    .bat-bar-fill {
      height: 100%;
      border-radius: 3px;
      background: #2ecc40;
      transition: width 0.4s ease;

      &.low {
        background: #e74c3c;
      }

      &.charging {
        background: #0078d7;
      }
    }
  }
}

.bat-details {
  padding: 4px 14px 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 4px;

  .bat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .bat-label {
      font-size: 11px;
      color: #888;
    }

    .bat-value {
      font-size: 11px;
      font-weight: 500;
    }
  }
}
</style>

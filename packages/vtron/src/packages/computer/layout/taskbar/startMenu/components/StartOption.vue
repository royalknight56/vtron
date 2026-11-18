<template>
  <nav
    class="rail"
    :class="{ expanded }"
    :aria-label="i18n('startMenu.start')"
    @pointerenter="hoverRail"
    @pointerleave="collapseRail"
  >
    <button
      type="button"
      class="rail-button rail-toggle"
      :aria-expanded="expanded"
      :aria-label="i18n(expanded ? 'startMenu.collapseNav' : 'startMenu.expandNav')"
      @click.stop="toggleRail"
    >
      <span class="rail-icon SEGOEUIMDL" aria-hidden="true">&#xE700;</span>
      <span>{{ i18n('startMenu.start') }}</span>
    </button>
    <button
      v-if="account"
      type="button"
      class="rail-button"
      :title="account.label()"
      @click.stop="openAccount"
    >
      <span class="rail-icon SEGOEUIMDL" aria-hidden="true">&#xE77B;</span>
      <span>{{ account.label() }}</span>
    </button>
    <button
      v-if="showSetting"
      type="button"
      class="rail-button"
      :title="i18n('setting')"
      @click.stop="handleClick(1, $event)"
    >
      <span class="rail-icon SEGOEUIMDL" aria-hidden="true">&#xE713;</span><span>{{ i18n('setting') }}</span>
    </button>
    <button
      v-if="showPower"
      type="button"
      class="rail-button"
      :title="i18n('startMenu.power')"
      @click.stop="handleClick(0, $event)"
    >
      <span class="rail-icon SEGOEUIMDL" aria-hidden="true">&#xE7E8;</span
      ><span>{{ i18n('startMenu.power') }}</span>
    </button>
  </nav>
</template>
<script lang="ts" setup>
import { i18n } from '@/packages/computer/i18n';
import { System } from '@packages/kernel';
import { inject, ref, onUnmounted } from 'vue';

const sys = inject<System>('system')!;
const feature = sys._options.builtinFeature;
const showPower = feature?.includes('Power');
const showSetting = feature?.includes('Setting');
const account = sys._options.startMenuAccount;

const expanded = ref(false);
let expandTimer: ReturnType<typeof setTimeout> | undefined;
function hoverRail(event: PointerEvent) {
  if (event.pointerType === 'mouse')
    expandTimer = setTimeout(() => {
      expanded.value = true;
    }, 450);
}
function toggleRail() {
  clearTimeout(expandTimer);
  expanded.value = !expanded.value;
}
function collapseRail() {
  clearTimeout(expandTimer);
  expanded.value = false;
}
onUnmounted(() => clearTimeout(expandTimer));

function openAccount() {
  sys.emitEvent('startmenu.hidden');
  account?.open();
}

function handleClick(key: number, ev: MouseEvent) {
  switch (key) {
    case 0:
      sys
        .buildFromTemplate([
          {
            label: i18n('startMenu.shutdown'),
            click: () => {
              sys.emitEvent('system.shutdown');
            },
          },
          {
            label: i18n('startMenu.restart'),
            click: () => {
              sys.restart();
            },
          },
          {
            label: i18n('startMenu.recover'),
            click: () => {
              sys
                .createDialog()
                .showMessageBox({
                  title: i18n('startMenu.recover'),
                  message: i18n('is.recover'),
                  buttons: [i18n('startMenu.recover'), i18n('cancel')],
                })
                .then((res) => {
                  if (res.response === 0) {
                    sys.emitEvent('system.recover');
                  }
                });
            },
          },
        ])
        .popup(ev);

      break;
    case 1: {
      sys.emitEvent('startMenu.set.click', {
        mouse: ev,
      });
      const winopt = sys.stateManager.windowMap.get('Builtin', '设置');
      if (winopt) {
        if (winopt._hasShow) {
          return;
        } else {
          if (winopt.type !== 'group') {
            winopt._hasShow = true;
            const win = sys.createWindow(winopt.window);
            win.show();
            win.on('close', () => {
              winopt._hasShow = false;
            });
          }
        }
      }
      break;
    }

    default:
      break;
  }
}
</script>
<style scoped>
.rail {
  position: relative;
  z-index: 1;
  width: var(--rail-width);
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 140ms ease-out;
}
.rail.expanded {
  width: min(248px, 75vw);
  background: var(--color-startmenu);
  box-shadow: 3px 0 9px #0002;
}
.rail .rail-button {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0;
  text-align: left;
  white-space: nowrap;
}
.rail .rail-toggle {
  margin-bottom: auto;
  font-weight: 600;
}
.rail-icon {
  flex: 0 0 var(--rail-width);
  font-size: 16px;
  text-align: center;
}
.rail-button:hover {
  background: var(--start-hover);
}
.rail-button > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<template>
  <div class="control-panel">
    <nav class="control-navigation" aria-label="控制面板导航">
      <button :disabled="!category" title="后退" aria-label="后退" @click="category = ''">
        <span class="management-glyph">&#xE72B;</span>
      </button>
      <button disabled title="前进" aria-label="前进"><span class="management-glyph">&#xE72A;</span></button>
      <button :disabled="!category" title="向上" aria-label="返回控制面板" @click="category = ''">
        <span class="management-glyph">&#xE74A;</span>
      </button>
      <div class="control-address">
        <img v-if="icon" :src="icon" alt="" /><button @click="category = ''">控制面板</button
        ><span class="management-glyph">&#xE76C;</span><span v-if="category">{{ category }}</span>
      </div>
      <input
        v-model="query"
        type="search"
        aria-label="搜索控制面板"
        placeholder="搜索控制面板"
        @keydown.esc="query = ''"
      />
    </nav>
    <div v-if="!category" class="control-categories">
      <header>
        <h1>调整计算机的设置</h1>
        <label
          >查看方式：<select aria-label="查看方式">
            <option>类别</option>
            <option disabled>大图标</option>
            <option disabled>小图标</option>
          </select></label
        >
      </header>
      <div class="control-category-columns">
        <section v-for="column in [categories.slice(0, 4), categories.slice(4)]" :key="column[0].name">
          <div v-for="item in column.filter(matchesCategory)" :key="item.name" class="control-category">
            <img :src="item.icon" alt="" />
            <div>
              <button class="control-category-heading" @click="category = item.name">{{ item.name }}</button
              ><button
                v-for="link in item.links"
                :key="link.label"
                class="control-link"
                :disabled="!link.app"
                @click="link.app && openApp(link.app)"
              >
                {{ link.label }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
    <div v-else class="control-category-page">
      <aside>
        <button class="control-link" @click="category = ''">控制面板主页</button
        ><button
          v-for="item in categories.filter((item) => item.name !== category)"
          :key="item.name"
          class="control-link"
          @click="category = item.name"
        >
          {{ item.name }}
        </button>
      </aside>
      <main>
        <div v-for="entry in categoryEntries" :key="entry.app" class="control-setting">
          <img v-if="appIcon(entry.app)" :src="appIcon(entry.app)" alt="" />
          <div>
            <button
              class="control-category-heading"
              :disabled="!registered(entry.app)"
              @click="openApp(entry.app)"
            >
              {{ managementApps[entry.app].title }}
            </button>
            <p>{{ entry.description }}</p>
          </div>
        </div>
        <p v-if="!categoryEntries.length" class="control-unavailable">当前浏览器未提供此类别的系统设置。</p>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, computed } from 'vue';
import { BrowserWindow, System } from 'vtron';
import { managementApps, type ManagementApp } from './managementApps';
import securityIcon from '../../../assets/win10/system-security.png';
import networkIcon from '../../../assets/win10/network-internet.png';
import hardwareIcon from '../../../assets/win10/hardware-sound.png';
import programsIcon from '../../../assets/win10/programs.png';
import accountsIcon from '../../../assets/win10/user-accounts.png';
import appearanceIcon from '../../../assets/win10/appearance.png';
import clockIcon from '../../../assets/win10/clock-region.png';
import accessIcon from '../../../assets/win10/ease-access.png';

const system = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');
const icon = win?.windowInfo.icon;
const category = ref('');
const query = ref('');
type Link = { label: string; app?: ManagementApp };
const categories: { name: string; icon: string; links: Link[] }[] = [
  {
    name: '系统和安全',
    icon: securityIcon,
    links: [
      { label: '查看计算机状态' },
      { label: '查看系统信息', app: 'systemInformation' },
      { label: '备份和还原 (Windows 7)' },
    ],
  },
  { name: '网络和 Internet', icon: networkIcon, links: [{ label: '查看网络状态和任务' }] },
  {
    name: '硬件和声音',
    icon: hardwareIcon,
    links: [{ label: '查看设备和打印机' }, { label: '设备管理器', app: 'deviceManager' }],
  },
  { name: '程序', icon: programsIcon, links: [{ label: '卸载程序' }] },
  { name: '用户账户', icon: accountsIcon, links: [{ label: '更改账户类型' }] },
  { name: '外观和个性化', icon: appearanceIcon, links: [{ label: '更改主题' }] },
  { name: '时钟和区域', icon: clockIcon, links: [{ label: '更改日期、时间或数字格式' }] },
  {
    name: '轻松使用',
    icon: accessIcon,
    links: [{ label: '让 Windows 建议设置' }, { label: '优化视觉显示' }],
  },
];
const entries: { app: ManagementApp; description: string }[] = [
  { app: 'systemInformation', description: '查看当前浏览器环境的系统摘要' },
  { app: 'diskCleanup', description: '磁盘清理选项' },
  { app: 'resourceMonitor', description: '查看当前浏览器页面的资源使用情况' },
  { app: 'eventViewer', description: '查看事件日志' },
  { app: 'services', description: '查看服务' },
  { app: 'diskManagement', description: '磁盘管理' },
  { app: 'registryEditor', description: '注册表编辑器' },
];
const categoryEntries = computed(() =>
  category.value === '系统和安全'
    ? entries
    : category.value === '硬件和声音'
      ? [{ app: 'deviceManager' as const, description: '查看设备' }]
      : []
);
function matchesCategory(item: (typeof categories)[number]) {
  const term = query.value.trim().toLocaleLowerCase();
  return (
    !term ||
    `${item.name} ${item.links.map((link) => link.label).join(' ')}`.toLocaleLowerCase().includes(term)
  );
}
function registered(app: ManagementApp) {
  const name = managementApps[app].title;
  return (
    system.stateManager.windowMap.get('Menulist', name) || system.stateManager.windowMap.get('Desktop', name)
  );
}
function appIcon(app: ManagementApp) {
  const definition = registered(app);
  return definition && definition.type !== 'group' ? definition.icon : undefined;
}
function openApp(app: ManagementApp) {
  const definition = registered(app);
  if (!definition || definition.type === 'group') return;
  const existing = system.stateManager.windowTree.windowOrder.find(
    (item) => item.windowInfo.isCreated && item.windowInfo.title === definition.name
  );
  if (existing) {
    if (existing.isMinimized()) existing.restore();
    existing.moveTop();
  } else system.createWindow(definition.window).show();
}
</script>

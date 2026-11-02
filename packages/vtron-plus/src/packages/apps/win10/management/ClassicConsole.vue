<template>
  <div
    class="classic-console"
    @keydown.ctrl.f="focusFind"
    @keydown.f5.prevent="app === 'systemInformation' && refreshInfo()"
  >
    <ClassicMenu :menus="menus" @action="menuAction" />
    <div v-if="hasToolbar" class="management-toolbar" aria-label="工具栏">
      <button disabled title="后退" aria-label="后退"><span class="management-glyph">&#xE72B;</span></button>
      <button disabled title="前进" aria-label="前进"><span class="management-glyph">&#xE72A;</span></button>
      <span class="toolbar-separator"></span>
      <button
        v-if="app !== 'deviceManager' && app !== 'diskManagement'"
        :class="{ pressed: showTree }"
        title="显示或隐藏控制台树"
        aria-label="显示或隐藏控制台树"
        @click="showTree = !showTree"
      >
        <span class="management-glyph">&#xE8FD;</span>
      </button>
      <button disabled title="属性" aria-label="属性"><span class="management-glyph">&#xE713;</span></button>
      <span class="toolbar-separator"></span>
      <button disabled title="刷新" aria-label="刷新"><span class="management-glyph">&#xE72C;</span></button>
      <button v-if="app === 'deviceManager'" disabled title="扫描检测硬件改动" aria-label="扫描检测硬件改动">
        <span class="management-glyph">&#xE7F4;</span>
      </button>
      <template v-if="app === 'services'"
        ><span class="toolbar-separator"></span
        ><button disabled title="启动服务" aria-label="启动服务">
          <span class="management-glyph">&#xE768;</span></button
        ><button disabled title="停止服务" aria-label="停止服务">
          <span class="management-glyph">&#xE71A;</span></button
        ><button disabled title="暂停服务" aria-label="暂停服务">
          <span class="management-glyph">&#xE769;</span>
        </button></template
      >
      <button disabled title="帮助" aria-label="帮助">
        <span class="management-glyph help-glyph">&#xE897;</span>
      </button>
    </div>
    <input
      v-if="app === 'registryEditor'"
      class="registry-address"
      :value="registryPath"
      aria-label="注册表路径（只读）"
      readonly
    />
    <div v-if="app === 'deviceManager'" class="device-tree management-white">
      <button class="tree-row selected">
        <span class="tree-expander">⌄</span><img v-if="icon" :src="icon" alt="" /><span>Vtron（浏览器）</span>
      </button>
      <p class="device-unavailable">当前浏览器未提供宿主设备管理接口。</p>
    </div>
    <div v-else-if="app === 'diskManagement'" class="disk-console">
      <div class="disk-volumes">
        <table class="management-table">
          <thead>
            <tr>
              <th v-for="head in diskHeaders" :key="head">{{ head }}</th>
            </tr>
          </thead>
        </table>
        <p class="table-unavailable">当前浏览器无法枚举物理磁盘或分区。</p>
      </div>
      <div class="disk-partitions"><p class="table-unavailable">磁盘信息不可用</p></div>
      <div class="disk-legend">
        <span><i class="unallocated"></i>未分配</span><span><i class="primary-partition"></i>主分区</span>
      </div>
    </div>
    <div v-else class="management-workspace">
      <aside
        v-if="showTree"
        class="management-tree"
        :class="{ 'registry-tree': app === 'registryEditor' }"
        aria-label="控制台树"
      >
        <template v-for="node in treeNodes" :key="node.label">
          <button
            v-if="nodeVisible(node)"
            class="tree-row"
            :class="{ selected: selectedNode === node.label }"
            :style="{ paddingLeft: `${node.depth * 18 + 3}px` }"
            @click="selectedNode = node.label"
          >
            <span v-if="node.branch" class="tree-expander" @click.stop="toggleNode(node.label)">{{
              collapsed.has(node.label) ? '›' : '⌄'
            }}</span
            ><span v-else class="tree-expander"></span>
            <img v-if="node.depth === 0 && icon" :src="icon" alt="" /><span
              v-else
              class="management-glyph tree-folder"
              >&#xE8B7;</span
            ><span>{{ node.label }}</span>
          </button>
        </template>
      </aside>
      <section class="management-details">
        <div v-if="app === 'services' || app === 'eventViewer'" class="management-pane-heading">
          {{ app === 'services' ? '服务（本地）' : selectedNode }}
        </div>
        <div class="management-detail-body">
          <aside v-if="app === 'services' && extended" class="service-description">
            选择一个项目来查看它的描述。
            <p>当前浏览器未连接 Windows 服务管理器。</p>
          </aside>
          <div class="management-table-scroll">
            <table
              class="management-table"
              :class="{ 'system-information-table': app === 'systemInformation' }"
            >
              <thead>
                <tr>
                  <th v-for="heading in headings" :key="heading">{{ heading }}</th>
                </tr>
              </thead>
              <tbody v-if="app === 'systemInformation' && selectedNode === '系统摘要'">
                <tr v-for="row in visibleInfoRows" :key="row[0]">
                  <td>{{ row[0] }}</td>
                  <td>{{ row[1] }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="emptyMessage" class="table-unavailable">{{ emptyMessage }}</p>
          </div>
        </div>
        <footer v-if="app === 'services'" class="service-tabs">
          <button :class="{ selected: extended }" @click="extended = true">扩展</button
          ><button :class="{ selected: !extended }" @click="extended = false">标准</button>
        </footer>
      </section>
      <aside v-if="app === 'eventViewer'" class="management-actions">
        <div class="management-pane-heading">操作</div>
        <h2>{{ selectedNode }}</h2>
        <button v-for="action in eventActions" :key="action" disabled>{{ action }}</button>
      </aside>
    </div>
    <form
      v-if="app === 'systemInformation'"
      class="system-find"
      @submit.prevent="activeQuery = findQuery.trim()"
    >
      <label for="system-find-text">查找内容：</label
      ><input id="system-find-text" ref="findInput" v-model="findQuery" /><button type="submit">查找</button
      ><button
        type="button"
        @click="
          findQuery = '';
          activeQuery = '';
        "
      >
        关闭查找
      </button>
      <div>
        <label><input type="checkbox" disabled />只搜索选定的类别</label
        ><label><input type="checkbox" disabled />只搜索类别名称</label>
      </div>
    </form>
    <footer class="management-status">
      <span>{{
        app === 'systemInformation' ? '当前数据源：Vtron 浏览器环境' : '当前环境：Vtron 浏览器桌面'
      }}</span
      ><span v-if="app !== 'systemInformation'">只读</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onUnmounted } from 'vue';
import { BrowserWindow, System } from 'vtron';
import ClassicMenu from './ClassicMenu.vue';
import type { ConsoleMenu, ManagementApp } from './managementApps';

const props = defineProps<{ app: ManagementApp }>();
const system = inject<System>('system')!;
const win = inject<BrowserWindow>('browserWindow');
const icon = win?.windowInfo.icon;
const showTree = ref(true);
const extended = ref(true);
const collapsed = ref(new Set<string>());
const selectedNode = ref(
  props.app === 'systemInformation'
    ? '系统摘要'
    : props.app === 'registryEditor'
      ? '计算机'
      : props.app === 'services'
        ? '服务（本地）'
        : '事件查看器（本地）'
);
const findQuery = ref('');
const activeQuery = ref('');
const findInput = ref<HTMLInputElement>();
const refreshVersion = ref(0);
const downloadUrls = new Set<string>();
const hasToolbar = computed(() => props.app !== 'registryEditor' && props.app !== 'systemInformation');
const registryPath = computed(() =>
  selectedNode.value === '计算机' ? '计算机' : `计算机\\${selectedNode.value}`
);
const diskHeaders = ['卷', '布局', '类型', '文件系统', '状态', '容量', '可用空间', '% 可用'];
const eventActions = [
  '打开保存的日志…',
  '创建自定义视图…',
  '导入自定义视图…',
  '连接到另一台计算机…',
  '刷新',
  '帮助',
];
interface TreeNode {
  label: string;
  depth: number;
  branch?: boolean;
  parent?: string;
}
const treeNodes = computed<TreeNode[]>(() => {
  if (props.app === 'registryEditor')
    return [
      { label: '计算机', depth: 0, branch: true },
      ...[
        'HKEY_CLASSES_ROOT',
        'HKEY_CURRENT_USER',
        'HKEY_LOCAL_MACHINE',
        'HKEY_USERS',
        'HKEY_CURRENT_CONFIG',
      ].map((label) => ({ label, depth: 1, parent: '计算机' })),
    ];
  if (props.app === 'systemInformation')
    return [
      { label: '系统摘要', depth: 0 },
      ...['硬件资源', '组件', '软件环境'].map((label) => ({ label, depth: 1 })),
    ];
  if (props.app === 'services') return [{ label: '服务（本地）', depth: 0 }];
  return [
    { label: '事件查看器（本地）', depth: 0, branch: true },
    { label: '自定义视图', depth: 1, parent: '事件查看器（本地）' },
    { label: 'Windows 日志', depth: 1, parent: '事件查看器（本地）', branch: true },
    ...['应用程序', '安全', '设置', '系统', '转发的事件'].map((label) => ({
      label,
      depth: 2,
      parent: 'Windows 日志',
    })),
    { label: '应用程序和服务日志', depth: 1, parent: '事件查看器（本地）' },
    { label: '订阅', depth: 1, parent: '事件查看器（本地）' },
  ];
});
const headings = computed(() =>
  props.app === 'registryEditor'
    ? ['名称', '类型', '数据']
    : props.app === 'services'
      ? ['名称', '描述', '状态', '启动类型', '登录为']
      : props.app === 'systemInformation'
        ? ['项目', '值']
        : ['级别', '日期和时间', '来源', '事件 ID', '任务类别']
);
const infoRows = computed(() => {
  void refreshVersion.value;
  const memory = (
    performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }
  ).memory;
  return [
    ['环境', 'Vtron 浏览器桌面'],
    ['Vtron 版本', system.version],
    ['浏览器用户代理', navigator.userAgent],
    ['浏览器报告的平台', navigator.platform || '不可用'],
    ['语言', navigator.language],
    ['时区', Intl.DateTimeFormat().resolvedOptions().timeZone],
    ['浏览器联机状态', navigator.onLine ? '联机' : '脱机'],
    [
      '浏览器报告的逻辑处理器',
      navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : '不可用',
    ],
    ['屏幕分辨率', `${screen.width} × ${screen.height}`],
    ['可用屏幕区域', `${screen.availWidth} × ${screen.availHeight}`],
    ['设备像素比', String(window.devicePixelRatio)],
    ['触摸点数上限', String(navigator.maxTouchPoints)],
    ['Vtron 用户目录', system._options.userLocation || '不可用'],
    ['页面 JS 堆已使用', memory ? `${(memory.usedJSHeapSize / 1048576).toFixed(1)} MB` : '当前浏览器未提供'],
    ['页面 JS 堆上限', memory ? `${(memory.jsHeapSizeLimit / 1048576).toFixed(1)} MB` : '当前浏览器未提供'],
  ];
});
const visibleInfoRows = computed(() => {
  const term = activeQuery.value.toLocaleLowerCase();
  return infoRows.value.filter((row) => !term || row.join(' ').toLocaleLowerCase().includes(term));
});
const emptyMessage = computed(() => {
  if (props.app === 'systemInformation')
    return selectedNode.value !== '系统摘要'
      ? '当前浏览器无法读取此类别的 Windows 系统信息。'
      : visibleInfoRows.value.length
        ? ''
        : '未找到匹配的项目。';
  if (props.app === 'registryEditor') return '当前浏览器无法访问宿主 Windows 注册表。';
  if (props.app === 'services') return '当前浏览器无法枚举或控制 Windows 服务。';
  return '当前浏览器无法读取 Windows 事件日志。';
});
const menus = computed<ConsoleMenu[]>(() => {
  const file = {
    label: '文件(F)',
    items: [
      { label: '打开…', disabled: true },
      {
        label: '导出…',
        action: props.app === 'systemInformation' ? 'export' : undefined,
        disabled: props.app !== 'systemInformation',
      },
      { label: '退出(X)', action: 'exit' },
    ],
  };
  const edit = {
    label: '编辑(E)',
    items: [
      { label: '修改…', disabled: true },
      { label: '新建', disabled: true },
      { label: '删除', disabled: true },
      { label: '查找…', action: props.app === 'systemInformation' ? 'find' : undefined, shortcut: 'Ctrl+F' },
    ],
  };
  const view = {
    label: '查看(V)',
    items: [
      { label: '刷新(R)', action: props.app === 'systemInformation' ? 'refresh' : undefined, shortcut: 'F5' },
      {
        label: showTree.value ? '隐藏控制台树' : '显示控制台树',
        action: props.app === 'deviceManager' || props.app === 'diskManagement' ? undefined : 'tree',
      },
    ],
  };
  const help = {
    label: '帮助(H)',
    items: [
      { label: '帮助主题', disabled: true },
      { label: '关于', disabled: true },
    ],
  };
  if (props.app === 'registryEditor')
    return [
      file,
      edit,
      view,
      {
        label: '收藏夹(A)',
        items: [
          { label: '添加到收藏夹', disabled: true },
          { label: '删除收藏夹', disabled: true },
        ],
      },
      help,
    ];
  if (props.app === 'systemInformation') return [file, edit, view, help];
  return [
    file,
    {
      label: '操作(A)',
      items: [
        { label: props.app === 'deviceManager' ? '扫描检测硬件改动' : '连接到另一台计算机…', disabled: true },
        { label: '属性', disabled: true },
      ],
    },
    view,
    help,
  ];
});
function toggleNode(label: string) {
  const next = new Set(collapsed.value);
  next.has(label) ? next.delete(label) : next.add(label);
  collapsed.value = next;
}
function nodeVisible(node: TreeNode): boolean {
  if (!node.parent) return true;
  const parent = treeNodes.value.find((item) => item.label === node.parent);
  return !collapsed.value.has(node.parent) && (!parent || nodeVisible(parent));
}
function refreshInfo() {
  refreshVersion.value++;
}
function focusFind(event?: KeyboardEvent) {
  if (props.app === 'systemInformation') {
    event?.preventDefault();
    findInput.value?.focus();
  }
}
function menuAction(action: string) {
  if (action === 'exit') win?.close();
  if (action === 'tree') showTree.value = !showTree.value;
  if (action === 'refresh') refreshInfo();
  if (action === 'find') focusFind();
  if (action === 'export') {
    const text = ['数据源：Vtron 浏览器环境', ...infoRows.value.map((row) => row.join('\t'))].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    downloadUrls.add(url);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Vtron-浏览器系统信息.txt';
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      downloadUrls.delete(url);
    }, 1000);
  }
}
onUnmounted(() => downloadUrls.forEach((url) => URL.revokeObjectURL(url)));
</script>

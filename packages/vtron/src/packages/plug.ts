import WinButtonVue from './components/WinButton.vue';
import WinCheckBox from './components/WinCheckBox.vue';
import WinInput from './components/WinInput.vue';
import WinLoadingVue from './components/WinLoading.vue';
import WinLogoVue from './components/WinLogo.vue';
import WinProcess from './components/WinProcess.vue';
import WinSelect from './components/WinSelect.vue';
import WinUpButtonGroupVue from './components/WinUpButtonGroup.vue';

export { i18n } from '@/packages/computer/i18n';
export { vDragable } from '@/packages/computer/layout/windowGroup/MakeDragable';
export { moveToRecycleBin } from '@/packages/computer/application/components/fileOpt';
export type { VtronFileInterface } from '@/packages/kernel/file/FIleInterface';
export * from '@/packages/kernel/file/FileSystem';
export * from '@/packages/kernel/file/MemoryFileSystem';
export * from '@/packages/kernel/file/LocalFileSystem';
export { realpath, mkdir, exists, writeFile, rename, stat } from '@/packages/kernel/file/operations';
export * from '@/packages/kernel/shell/Shell';
export type { ShellInterface, ShellTerminal } from '@/packages/kernel/shell/ShellType';
export type { ShellCommand } from '@/packages/kernel/shell/ShellCommand';
export { parseShellArguments } from '@/packages/kernel/shell/shellArguments';
export { System } from '@/packages/kernel/system';
export { BrowserWindow, Dialog, Menu, MenuItem, Tray } from '@/packages/services';
export { Notify } from '@/packages/services/notification/Notification';
export * from '@/packages/util/Path';
export { createProxyFetch, type ProxyFetchOptions } from '@/packages/network/createProxyFetch';
export * from '@packages/type/type';
export { VtronComputer } from './computer';
export {
  WinButtonVue,
  WinCheckBox,
  WinInput,
  WinLoadingVue,
  WinLogoVue,
  WinProcess,
  WinSelect,
  WinUpButtonGroupVue,
};

export { watch, type VtronWatchEvent, type VtronWatchOptions, type VtronWatchHandle } from '@/packages/kernel/file/watch';

export { readFileBytes, writeFileBytes } from '@/packages/kernel/file/binary';

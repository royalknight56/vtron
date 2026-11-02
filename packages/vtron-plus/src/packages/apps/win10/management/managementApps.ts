export const managementApps = {
  controlPanel: { title: '控制面板', width: 900, height: 620 },
  deviceManager: { title: '设备管理器', width: 760, height: 560 },
  diskManagement: { title: '磁盘管理', width: 900, height: 620 },
  diskCleanup: { title: '磁盘清理', width: 410, height: 510 },
  resourceMonitor: { title: '资源监视器', width: 1000, height: 660 },
  eventViewer: { title: '事件查看器', width: 1060, height: 660 },
  services: { title: '服务', width: 1000, height: 640 },
  systemInformation: { title: '系统信息', width: 900, height: 620 },
  registryEditor: { title: '注册表编辑器', width: 900, height: 600 },
} as const;

export type ManagementApp = keyof typeof managementApps;

export function isManagementApp(value: unknown): value is ManagementApp {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(managementApps, value);
}

export interface ConsoleMenuItem {
  label: string;
  action?: string;
  shortcut?: string;
  disabled?: boolean;
}

export interface ConsoleMenu {
  label: string;
  items: ConsoleMenuItem[];
}

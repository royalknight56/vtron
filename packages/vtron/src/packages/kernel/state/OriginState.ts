const stateOrigin = {
  state: SystemStateEnum.close as SystemStateEnum,
  apps: [] as Array<VtronFileWithoutContent>,
  magnet: [] as Array<VtronFileWithoutContent>,
  menulist: [] as Array<VtronFileWithoutContent>,
  notify: [] as Array<Notify>,
  message: {
    notify: [] as Array<Notify>,
    system: [] as Array<Notify>,
  },
  windowTree: new Tree<BrowserWindow>(),
  windowOrder: new Array<BrowserWindow>(),
  windowMap: {
    Desktop: new Map<string, WinAppOptions>(),
    Magnet: new Map<string, WinAppOptions>(),
    Menulist: new Map<string, WinAppOptions>(),
    Builtin: new Map<string, WinAppOptions>(),
  } as {
    [key: string]: Map<string, WinAppOptions>;
  },
  topWindow: undefined as BrowserWindow | undefined,
  winnum: 0,
  info: {
    screenWidth: window?.innerWidth || 0,
    screenHeight: window?.innerHeight || 0,
    mouseX: 0,
    mouseY: 0,
    battery: {
      isCharging: false,
      chargeLevel: 0,
    },
    brightness: 50,
    connection: {
      effectiveType: '4g',
      rtt: 0,
      downlink: 0,
      saveData: false,
    },
  },
  options: {} as SystemOptions,
  clipboard: {} as any,
  settings: [] as Setting[],
  contextMenu: null as Menu | null,
  error: '',
};

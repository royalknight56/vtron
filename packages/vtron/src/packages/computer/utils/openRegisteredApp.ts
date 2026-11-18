import type { System } from '@packages/kernel';
import type { WinAppOptions } from '@/packages/type/type';

export function openRegisteredApp(system: System, app: WinAppOptions | undefined) {
  if (!app || app.type === 'group') return;
  const singleInstance = app.multiple === false;
  if (singleInstance && app._hasShow) {
    const existing = system.stateManager.windowTree.windowOrder.find(
      win => win.windowInfo.isCreated && win.windowInfo.appId === app.window.appId
    );
    if (existing?.isMinimized()) existing.restore();
    existing?.moveTop();
    return;
  }

  const window = system.createWindow(app.window);
  if (singleInstance) {
    app._hasShow = true;
    window.on('close', () => {
      app._hasShow = false;
    });
  }
  window.show();
}

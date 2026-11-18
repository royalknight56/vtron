import type { System } from '@packages/kernel';

export function openSettings(sys: System, router = 'main', page = 0) {
  const app = sys.stateManager.windowMap.get('Builtin', '设置');
  if (!app || app.type === 'group') return;
  const win = sys.stateManager.windowTree.windowOrder.find(
    (win) => win.content === app.window.content && win.windowInfo.isCreated
  );
  if (win) {
    win.emit('settings.navigate', router, page);
    if (win.isMinimized()) win.restore();
    win.moveTop();
  } else {
    const settings = sys.createWindow({
      ...app.window,
      config: { ...app.window.config, router, page },
    });
    app._hasShow = true;
    settings.on('close', () => {
      app._hasShow = false;
    });
    settings.show();
  }
}

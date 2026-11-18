import type { System } from '@packages/kernel';
import type { WinAppOptions } from '@/packages/type/type';

export function openRegisteredApp(system: System, app: WinAppOptions | undefined) {
  if (!app || app.type === 'group') return;
  const singleInstance = app.multiple === false;
  if (singleInstance && app._hasShow) return;

  const window = system.createWindow(app.window);
  if (singleInstance) {
    app._hasShow = true;
    window.on('close', () => {
      app._hasShow = false;
    });
  }
  window.show();
}

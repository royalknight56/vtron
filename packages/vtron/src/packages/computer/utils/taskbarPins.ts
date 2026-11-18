import type { System, VtronFileWithoutContent } from '@packages/kernel';
import type { WinAppOptionsApp } from '@/packages/type/type';
import type { BrowserWindow } from '@/packages/services';
import { toRaw, type UnwrapNestedRefs } from 'vue';
import { i18n } from '../i18n';

export type TaskWindow = UnwrapNestedRefs<BrowserWindow>;

export function launcherForWindow(apps: Map<string, WinAppOptionsApp>, win: TaskWindow) {
  if (win.windowInfo.appId) return apps.get(win.windowInfo.appId);
  // File openers may create a document window directly, with a document-specific title.
  const matches = [...apps.values()].filter((app) => toRaw(app.window.content) === toRaw(win.content));
  if (matches.length === 1) return matches[0];
  return matches.find((app) => app.window.config?.app && app.window.config.app === win.config?.app);
}

export function pinAction(system: System, id: string) {
  const current = () => system.getConfig('desktopPreferences')?.pinnedTaskbarApps ?? [];
  const pinned = current().includes(id);
  return {
    label: i18n(pinned ? 'taskbar.unpin' : 'taskbar.pin'),
    async click() {
      const ids = current().filter((key) => key !== id);
      if (!pinned) ids.push(id);
      try {
        await system.setConfig('desktopPreferences', {
          ...system.getConfig('desktopPreferences'),
          pinnedTaskbarApps: ids,
        });
      } catch {
        system.createNotify({ title: i18n('taskbar.pin'), content: i18n('taskbar.saveError') });
      }
    },
  };
}

export async function shortcutPinAction(system: System, file: VtronFileWithoutContent) {
  if (!file.name.toLowerCase().endsWith('.exe')) return;
  const [kind, location, key] = ((await system.fs.readFile(file.path)) ?? '').split('::');
  if (kind !== 'link' || !['Desktop', 'Menulist', 'Magnet', 'Builtin', 'Group'].includes(location)) return;
  const app = system.stateManager.windowMap.get(location as 'Desktop', key);
  if (app && app.type !== 'group' && app.window.appId) return pinAction(system, app.window.appId);
}

export async function showShortcutPinMenu(system: System, event: MouseEvent, file: VtronFileWithoutContent) {
  const action = await shortcutPinAction(system, file);
  if (action) system.buildFromTemplate([action]).popup(event);
}

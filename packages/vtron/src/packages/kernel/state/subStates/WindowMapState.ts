import { shallowReactive } from 'vue';
import type { WinAppOptionsApp, WinAppOptions } from '@/packages/type/type';

export class WindowMapState {
  Desktop = shallowReactive(new Map<string, WinAppOptions>());
  Magnet = shallowReactive(new Map<string, WinAppOptions>());
  Menulist = shallowReactive(new Map<string, WinAppOptions>());
  Builtin = shallowReactive(new Map<string, WinAppOptions>());
  Group = shallowReactive(new Map<string, WinAppOptions>());

  get launchers() {
    const apps = new Map<string, WinAppOptionsApp>();
    for (const group of [this.Menulist, this.Desktop, this.Builtin, this.Magnet, this.Group]) {
      for (const app of group.values()) {
        if (app.type !== 'group' && app.window.appId) apps.set(app.window.appId, app);
      }
    }
    return apps;
  }
  get(pos: 'Desktop' | 'Magnet' | 'Menulist' | 'Builtin' | 'Group', key: string) {
    return this[pos].get(key);
  }
  set(pos: 'Desktop' | 'Magnet' | 'Menulist' | 'Builtin' | 'Group', key: string, value: WinAppOptions) {
    if (value.type !== 'group') value.window.appId ??= pos + '/' + value.name;
    this[pos].set(key, value);
  }
}

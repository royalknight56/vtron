import { WinAppOptions } from '@/packages/type/type';

export class WindowMapState {
  Desktop = new Map<string, WinAppOptions>();
  Magnet = new Map<string, WinAppOptions>();
  Menulist = new Map<string, WinAppOptions>();
  Builtin = new Map<string, WinAppOptions>();

  constructor() {}
  get(pos: 'Desktop' | 'Magnet' | 'Menulist' | 'Builtin', key: string) {
    return this[pos].get(key);
  }
  set(pos: 'Desktop' | 'Magnet' | 'Menulist' | 'Builtin', key: string, value: WinAppOptions) {
    this[pos].set(key, value);
  }
}

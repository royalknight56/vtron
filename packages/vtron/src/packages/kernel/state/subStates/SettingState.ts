import { Setting } from '@/packages/type/type';
import { reactive } from 'vue';

export class SettingState {
  settings: Array<Setting> = reactive([]);
  constructor() {}

  pushSettings(setting: Setting): void {
    this.settings.push(setting);
  }
  getSettings(): Array<Setting> {
    return this.settings;
  }
}

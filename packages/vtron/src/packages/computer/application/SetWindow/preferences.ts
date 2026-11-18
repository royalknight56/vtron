import { computed, inject } from 'vue';
import { System } from '@packages/kernel';
import type { DesktopPreferences } from '@/packages/type/type';

export function useDesktopPreferences() {
  const system = inject<System>('system')!;
  const preferences = computed(() => system.getConfig('desktopPreferences') ?? {});
  async function save<K extends keyof DesktopPreferences>(key: K, value: DesktopPreferences[K]) {
    try {
      await system.setConfig('desktopPreferences', { ...preferences.value, [key]: value });
    } catch {
      system.createDialog().showMessageBox({ title: '设置', message: '无法保存设置。', type: 'error' });
    }
  }
  return { system, preferences, save };
}

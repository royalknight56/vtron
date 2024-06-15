import { System } from '@/packages/kernel/system';
import { enUS } from './en-US';
import { AllText, zhCN } from './zh-CN';

export function i18n(key: keyof AllText): string {
  const lang = System.GLOBAL_SYSTEM.stateManager.options.getOptions('lang');
  if (lang == 'zh-CN') {
    return zhCN[key];
  } else if (lang == 'en-US') {
    return enUS[key];
  } else {
    return enUS[key];
  }
}

import { zhCN } from './zh-CN';
import { enUS } from './en-US';
import { useRootState } from '@feature/state/Root';
import type { AllText } from './global-Lang';
let rootState = useRootState();
export function i18n(key: keyof AllText): string {
  if (rootState.system.options.lang == 'zh-CN') {
    return zhCN[key];
  } else if (rootState.system.options.lang == 'en-US') {
    return enUS[key];
  } else {
    return enUS[key];
  }
}

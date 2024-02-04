import { AllText, zhCN } from './zh-CN';
import { enUS } from './en-US';
import { useSystem } from '../../kernel/system';

export function i18n(key: keyof AllText): string {
  const rootState = useSystem()._rootState;
  if (rootState.options.lang == 'zh-CN') {
    return zhCN[key];
  } else if (rootState.options.lang == 'en-US') {
    return enUS[key];
  } else {
    return enUS[key];
  }
}

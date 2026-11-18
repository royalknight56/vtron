import { BrowserWindow } from '@/packages/services';
import { UnwrapNestedRefs } from 'vue';
import { i18n } from '../../computer/i18n';

export function taskbarWindowActions(windowNode: UnwrapNestedRefs<BrowserWindow>) {
  return [
    {
      label: i18n('close'),
      click: () => {
        windowNode.close();
      },
    },
    {
      label: i18n('maximize'),
      click: () => {
        windowNode.maximize();
      },
    },
    {
      label: i18n('minimize'),
      click: () => {
        windowNode.minimize();
      },
    },
  ];
}

import { Menu } from '@/packages/services';
import { UnwrapNestedRefs } from 'vue';
import { i18n } from '../i18n';

export function createTaskbarIconContextMenu(e: MouseEvent, windowNode: UnwrapNestedRefs<BrowserWindow>) {
  Menu.buildFromTemplate([
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
  ]).popup(e);
}

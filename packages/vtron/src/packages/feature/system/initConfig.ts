import { SystemOptions } from '@/packages/type/type';

export const defaultConfig: SystemOptions = {
  background: '#3A98CE',
  lang: 'zh-CN',
  builtinFeature: [
    'MyComputer',
    'AppStore',
    'DataTimeTray',
    'BatteryTray',
    'NetworkTray',
    'ImageOpener',
    'UrlOpener',
    'TextOpener',
    'ShortCutOpener',
    'ExeOpener',
  ],
  userLocation: '/C/Users/',
  systemLocation: '/C/System/',
};

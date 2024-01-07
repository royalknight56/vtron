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
  login: {
    username: localStorage.getItem('vtron-username') || 'admin',
    password: 'admin',
    init: () => {
      return !localStorage.getItem('vtron-username');
    },
  },
  async loginCallback(username, password) {
    return (
      username === localStorage.getItem('vtron-username') &&
      password === localStorage.getItem('vtron-password')
    );
  },
};

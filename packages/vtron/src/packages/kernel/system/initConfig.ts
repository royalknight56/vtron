import { SystemOptions } from '@/packages/type/type';
import { isNil } from '@/packages/util/modash';

export const defaultConfig: SystemOptions = {
  background: '#3A98CE',
  lang: 'zh-CN',
  builtinFeature: [
    'MyComputer',
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
    username: localStorage.getItem('vtron-username') || '',
    password: '',
    init: () => {
      return !localStorage.getItem('vtron-username');
    },
  },
  async loginCallback(username, password) {
    let mark = true;
    const name = localStorage.getItem('vtron-username');
    const pass = localStorage.getItem('vtron-password');
    if (isNil(name)) {
      return mark;
    }
    if (isNil(pass)) {
      return name === username;
    }
    return username === name && password === pass;
  },
};

import { defineComponent, h, markRaw } from 'vue';
import type { System } from '@packages/kernel';
import { i18n } from '@/packages/computer/i18n';
import SetCustom from '@/packages/computer/application/SetWindow/SetCustom.vue';
import SetSystem from '@/packages/computer/application/SetWindow/SetSystem.vue';
import SetLang from '@/packages/computer/application/SetWindow/SetLang.vue';
import SetAccount from '@/packages/computer/application/SetWindow/SetAccount.vue';
import SetWeb, { type WebSettingsCategory } from './SetWindow/SetWeb.vue';
import type { Setting } from '@/packages/type/type';

import e7f8 from '@/assets/icon/e7f8.png'; //系统设置
import e771 from '@/assets/icon/e771.png'; //个性化
import e775 from '@/assets/icon/e775.png'; //语言
import e77b from '@/assets/icon/e77b.png'; //账户

function webSetting(key: WebSettingsCategory, title: string, desc: string, glyph: string): Setting {
  return {
    key,
    title,
    desc,
    glyph,
    icon: '',
    content: markRaw(defineComponent(() => () => h(SetWeb, { category: key }))),
  };
}
const webSettings = [
  webSetting('devices', '设备', '音频和视频设备', '\uE772'),
  webSetting('phone', '手机', '在手机上使用 Vtron', '\uE8EA'),
  webSetting('network', '网络和 Internet', '网络状态', '\uE774'),
  webSetting('gaming', '游戏', '全屏显示', '\uE7FC'),
  webSetting('accessibility', '轻松使用', '放大镜、屏幕键盘', '\uE776'),
  webSetting('search', '搜索', '文件和文件夹', '\uE721'),
  webSetting('privacy', '隐私', '站点权限', '\uE72E'),
];
const order = [
  'system',
  'devices',
  'phone',
  'network',
  'custom',
  'account',
  'language',
  'gaming',
  'accessibility',
  'search',
  'privacy',
  '备份与恢复',
];

export function getSettingPanels(sys: System): Setting[] {
  const customSettings = sys.stateManager.settings.getSettings();
  const features = sys._options.builtinFeature;
  const panels = [
    {
      key: 'system',
      title: i18n('system'),
      desc: '显示、声音、通知、存储、关于',
      icon: e7f8,
      content: markRaw(SetSystem),
    },
    ...webSettings.filter(({ key }) => {
      if (key === 'phone') return Boolean(sys.getConfig('mobileDemoUrl'));
      if (key === 'accessibility') return Boolean(sys.stateManager.windowMap.get('Menulist', '放大镜'));
      return true;
    }),
    ...(features?.includes('Setting-Personalization')
      ? [
          {
            key: 'custom',
            title: i18n('personalization'),
            desc: '背景、锁屏、主题、开始菜单、任务栏',
            icon: e771,
            content: markRaw(SetCustom),
          },
        ]
      : []),
    ...(features?.includes('Setting-Language')
      ? [
          {
            key: 'language',
            title: i18n('time.and.language'),
            desc: '时区、区域、语言',
            icon: e775,
            content: markRaw(SetLang),
          },
        ]
      : []),
    ...(features?.includes('Setting-Account') && !customSettings.some(({ key }) => key === 'account')
      ? [
          {
            key: 'account',
            title: i18n('account'),
            desc: i18n('your.account'),
            icon: e77b,
            content: markRaw(SetAccount),
          },
        ]
      : []),
    ...customSettings,
  ];
  const position = (key: string) => (order.includes(key) ? order.indexOf(key) : order.length);
  return panels.sort((a, b) => position(a.key) - position(b.key));
}

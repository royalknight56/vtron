import { i18n } from '../../i18n';

export function settingPages(key: string) {
  switch (key) {
    case 'system':
      return ['显示', '声音', '通知', '存储', '关于'];
    case 'custom':
      return [i18n('background'), '锁屏界面', '主题', '开始菜单', '任务栏'];
    case 'language':
      return ['日期和时间', '区域', i18n('language')];
    default:
      return [];
  }
}

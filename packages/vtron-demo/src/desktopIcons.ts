import { join, type System } from 'vtron';
import networkSvg from './assets/network.svg?raw';
import backgroundStoreSvg from './assets/background-store.svg?raw';
import gallerySvg from '../../vtron-plus/src/packages/assets/gallery.svg?raw';
import paintSvg from '../../vtron-plus/src/packages/assets/paint.svg?raw';
import taskManagerSvg from '../../vtron-plus/src/packages/assets/taskmgr.svg?raw';
import cameraSvg from '../../vtron-plus/src/packages/assets/camera.svg?raw';
import wordSvg from '../../vtron-plus/src/packages/assets/office-word.svg?raw';
import excelSvg from '../../vtron-plus/src/packages/assets/office-excel.svg?raw';
import powerpointSvg from '../../vtron-plus/src/packages/assets/office-powerpoint.svg?raw';

const svgIcon = (svg: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

export const desktopIcons = {
  '创建网络链接': svgIcon(networkSvg),
  '背景Store': svgIcon(backgroundStoreSvg),
  '图库': svgIcon(gallerySvg),
  '画板': svgIcon(paintSvg),
  '任务管理器': svgIcon(taskManagerSvg),
  '相机': svgIcon(cameraSvg),
  Word: svgIcon(wordSvg),
  Excel: svgIcon(excelSvg),
  PPT: svgIcon(powerpointSvg),
};

export async function applyDesktopIcons(system: System) {
  // 同步已安装的快捷方式，用户刷新后即可看到新版内置图标。
  for (const name of ['图库', '画板', '任务管理器', '相机', 'Word', 'Excel', 'PPT'] as const) {
    const app = system.stateManager.windowMap.get('Desktop', name);
    if (app && app.type !== 'group') {
      app.icon = desktopIcons[name];
      app.window.icon = desktopIcons[name];
    }
  }

  const userLocation = system.getConfig('userLocation') || '/C/Users/';
  let changed = false;
  for (const location of ['Desktop', 'Magnet', 'Menulist'] as const) {
    for (const [name, icon] of Object.entries(desktopIcons)) {
      const path = join(userLocation, location, name + '.exe');
      try {
        const content = await system.fs.readFile(path);
        const prefix = 'link::' + location + '::' + name + '::';
        if (content?.startsWith(prefix) && content !== prefix + icon) {
          await system.fs.writeFile(path, prefix + icon);
          changed = true;
        }
      } catch (error) {
        console.warn('无法更新内置快捷方式图标：' + path, error);
      }
    }
  }

  const groupPath = join(userLocation, 'Desktop', '小工具.group');
  try {
    const content = await system.fs.readFile(groupPath);
    const group = content && JSON.parse(content);
    if (Array.isArray(group)) {
      let groupChanged = false;
      for (const item of group) {
        if (item?.name !== '创建网络链接') continue;
        const icon = desktopIcons['创建网络链接'];
        if (item.icon !== icon) {
          item.icon = icon;
          groupChanged = true;
        }
        if (item.window && typeof item.window === 'object' && item.window.icon !== icon) {
          item.window.icon = icon;
          groupChanged = true;
        }
      }
      if (groupChanged) {
        await system.fs.writeFile(groupPath, JSON.stringify(group));
        changed = true;
      }
    }
  } catch (error) {
    console.warn('无法更新内置小工具分组图标', error);
  }

  if (changed) system.refershApp();
}

import { join, type System } from 'vtron';
import { dailyAppIcons } from '../../vtron-plus/src/packages/apps/daily/icons';
import { windowsAppIcons } from '../../vtron-plus/src/packages/apps/win10/icons';
import networkSvg from './assets/network.svg?raw';
import backgroundStoreSvg from './assets/background-store.svg?raw';
import paintSvg from '../../vtron-plus/src/packages/assets/paint.svg?raw';
import taskManagerSvg from '../../vtron-plus/src/packages/assets/taskmgr.svg?raw';
import cameraSvg from '../../vtron-plus/src/packages/assets/camera.svg?raw';
import wordSvg from '../../vtron-plus/src/packages/assets/office-word.svg?raw';
import excelSvg from '../../vtron-plus/src/packages/assets/office-excel.svg?raw';
import powerpointSvg from '../../vtron-plus/src/packages/assets/office-powerpoint.svg?raw';
import vscodeSvg from '../../vtron-plus/src/packages/assets/vscode.svg?raw';
import oldGameIcon from './assets/game.base?raw';
import oldCoinIcon from './assets/coin.base?raw';
import oldDiceIcon from './assets/touzi.base?raw';
import oldLinkIcon from './assets/friendLinkBase.base?raw';

const svgIcon = (svg: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
const toolIcons = { ...dailyAppIcons, ...windowsAppIcons };
// These icons were embedded in the shortcuts saved by earlier versions.
const retiredGames = new Map([
  ['2048', oldGameIcon],
  ['井字棋', oldGameIcon],
  ['抛硬币', oldCoinIcon],
  ['掷骰子', oldDiceIcon],
]);

function isRetiredGame(name: string, icon: string) {
  const originalIcon = retiredGames.get(name);
  return originalIcon !== undefined && (icon === originalIcon || icon === oldLinkIcon);
}

export const desktopIcons = {
  ...toolIcons,
  创建网络链接: svgIcon(networkSvg),
  背景Store: svgIcon(backgroundStoreSvg),
  图库: windowsAppIcons.照片,
  画板: svgIcon(paintSvg),
  任务管理器: svgIcon(taskManagerSvg),
  相机: svgIcon(cameraSvg),
  Word: svgIcon(wordSvg),
  Excel: svgIcon(excelSvg),
  PPT: svgIcon(powerpointSvg),
  'VS Code': svgIcon(vscodeSvg),
};

export async function applyDesktopIcons(system: System) {
  // 同步已安装的快捷方式，用户刷新后即可看到新版内置图标。
  for (const name of ['图库', '画板', '任务管理器', '相机', 'Word', 'Excel', 'PPT', 'VS Code'] as const) {
    const app = system.stateManager.windowMap.get('Desktop', name);
    if (app && app.type !== 'group') {
      app.icon = desktopIcons[name];
      app.window.icon = desktopIcons[name];
    }
  }

  const userLocation = system.getConfig('userLocation') || '/C/Users/';
  let changed = false;
  for (const name of retiredGames.keys()) {
    const prefix = `link::Magnet::${name}::`;
    for (const location of ['Magnet', 'Desktop', 'Menulist'] as const) {
      const path = join(userLocation, location, name + '.exe');
      try {
        const content = await system.fs.readFile(path);
        if (content?.startsWith(prefix) && isRetiredGame(name, content.slice(prefix.length))) {
          await system.fs.unlink(path);
          changed = true;
        }
      } catch (error) {
        console.warn('无法清理旧游戏入口：' + path, error);
      }
    }
  }

  // Backfill the app list on existing installations and retire the old default desktop links.
  for (const [name, icon] of Object.entries(toolIcons)) {
    const app = system.stateManager.windowMap.get('Menulist', name);
    if (!app || app.type === 'group') continue;
    const menuPath = join(userLocation, 'Menulist', name + '.exe');
    const menuPrefix = `link::Menulist::${name}::`;
    const desktopPath = join(userLocation, 'Desktop', name + '.exe');
    const desktopPrefix = `link::Desktop::${name}::`;
    try {
      if (!(await system.fs.stat(menuPath))) {
        await system.fs.writeFile(menuPath, menuPrefix + icon, { flag: 'wx' });
        changed = true;
      }
      if (name === '照片') {
        if (!(await system.fs.stat(desktopPath))) {
          await system.fs.writeFile(desktopPath, desktopPrefix + icon, { flag: 'wx' });
          changed = true;
        }
        continue;
      }

      const menuLink = await system.fs.readFile(menuPath);
      if (!menuLink?.startsWith(menuPrefix)) continue;
      // The original desktop and menu links had the same icon, including across asset builds.
      const originalIcon = menuLink.slice(menuPrefix.length);
      const desktopLink = await system.fs.readFile(desktopPath);
      if (desktopLink === desktopPrefix + originalIcon || desktopLink === desktopPrefix + icon) {
        const shortcutPath = desktopPath + '.ln';
        if ((await system.fs.readFile(shortcutPath)) === desktopPath) {
          await system.fs.writeFile(shortcutPath, menuPath);
        }
        await system.fs.unlink(desktopPath);
        changed = true;
      }
    } catch (error) {
      console.warn('无法更新内置应用入口：' + name, error);
    }
  }

  if (system.stateManager.windowMap.get('Desktop', '照片')) {
    for (const location of ['Desktop', 'Menulist', 'Magnet'] as const) {
      const legacyPath = join(userLocation, location, '图库.exe');
      const content = await system.fs.readFile(legacyPath);
      if (content?.startsWith(`link::${location}::图库::`)) {
        const photosPath = join(userLocation, location, '照片.exe');
        if (!(await system.fs.stat(photosPath))) {
          await system.fs.writeFile(photosPath, `link::${location}::照片::${desktopIcons.照片}`, {
            flag: 'wx',
          });
        } else {
          const photos = await system.fs.readFile(photosPath);
          if (!photos?.startsWith(`link::${location}::照片::`)) continue;
        }
        await system.fs.unlink(legacyPath);
        changed = true;
      }
    }
  }

  const codeApp = system.stateManager.windowMap.get('Desktop', 'VS Code');
  if (codeApp && codeApp.type !== 'group') {
    try {
      const codePath = join(userLocation, 'Desktop', 'VS Code.exe');
      if (!(await system.fs.stat(codePath))) {
        await system.fs.writeFile(codePath, 'link::Desktop::VS Code::' + desktopIcons['VS Code'], {
          flag: 'wx',
        });
        changed = true;
      }
      // 仅移除旧版内置入口，用户创建的同名文件保持原样。
      const legacyPath = join(userLocation, 'Desktop', 'github1s.exe');
      const legacyContent = await system.fs.readFile(legacyPath);
      if (legacyContent?.startsWith('link::Desktop::github1s::')) {
        await system.fs.unlink(legacyPath);
        changed = true;
      }
    } catch (error) {
      console.warn('无法更新 VS Code 入口', error);
    }
  }
  for (const location of ['Desktop', 'Magnet', 'Menulist'] as const) {
    for (const [name, icon] of Object.entries(desktopIcons)) {
      if (location === 'Desktop' && name !== '照片' && Object.hasOwn(toolIcons, name)) continue;
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
      const items = group.filter((item) => !isRetiredGame(item?.name, item?.icon));
      let groupChanged = items.length !== group.length;
      for (const item of items) {
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
        await system.fs.writeFile(groupPath, JSON.stringify(items));
        changed = true;
      }
    }
  } catch (error) {
    console.warn('无法更新内置小工具分组图标', error);
  }

  if (changed) system.refershApp();
}

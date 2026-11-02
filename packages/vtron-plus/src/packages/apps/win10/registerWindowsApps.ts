import type { System, WinAppOptions } from 'vtron';
import WordPad from './media/WordPad.vue';
import Photos from './media/Photos.vue';
import WindowsMediaPlayer from './media/WindowsMediaPlayer.vue';
import Paint from './media/Paint.vue';
import Magnifier from './accessibility/Magnifier.vue';
import OnScreenKeyboard from './accessibility/OnScreenKeyboard.vue';
import CharacterMap from './accessibility/CharacterMap.vue';
import QuickAssist from './accessibility/QuickAssist.vue';
import ManagementConsole from './management/ManagementConsole.vue';
import CommandPrompt from './CommandPrompt.vue';
import { windowsAppIcons } from './icons';

const definitions = [
  { id: 'wordpad', name: '写字板', component: WordPad, width: 1000, height: 680 },
  { id: 'photos', name: '照片', component: Photos, width: 980, height: 650 },
  { id: 'mediaPlayer', name: 'Windows Media Player', component: WindowsMediaPlayer, width: 980, height: 640 },
  { id: 'paint', name: '画图', component: Paint, width: 1000, height: 680 },
  { id: 'magnifier', name: '放大镜', component: Magnifier, width: 446, height: 90 },
  { id: 'keyboard', name: '屏幕键盘', component: OnScreenKeyboard, width: 1030, height: 340 },
  { id: 'characters', name: '字符映射表', component: CharacterMap, width: 560, height: 446 },
  { id: 'controlPanel', name: '控制面板', component: ManagementConsole, width: 900, height: 620 },
  { id: 'deviceManager', name: '设备管理器', component: ManagementConsole, width: 760, height: 560 },
  { id: 'diskManagement', name: '磁盘管理', component: ManagementConsole, width: 900, height: 620 },
  { id: 'diskCleanup', name: '磁盘清理', component: ManagementConsole, width: 410, height: 510 },
  { id: 'resourceMonitor', name: '资源监视器', component: ManagementConsole, width: 1000, height: 660 },
  { id: 'eventViewer', name: '事件查看器', component: ManagementConsole, width: 1060, height: 660 },
  { id: 'services', name: '服务', component: ManagementConsole, width: 1000, height: 640 },
  { id: 'systemInformation', name: '系统信息', component: ManagementConsole, width: 900, height: 620 },
  { id: 'registryEditor', name: '注册表编辑器', component: ManagementConsole, width: 900, height: 600 },
  { id: 'cmd', name: '命令提示符', component: CommandPrompt, width: 980, height: 512 },
  { id: 'quickAssist', name: '快速助手', component: QuickAssist, width: 360, height: 530 },
] as const;

export function registerWindowsApps(system: System) {
  const options = (definition: (typeof definitions)[number], path?: string) => {
    const root = system.rootRef;
    const areaWidth = root?.clientWidth || window.innerWidth;
    const taskbarHeight = root
      ? parseFloat(getComputedStyle(root).getPropertyValue('--task-bar-height')) || 40
      : 40;
    const areaHeight = (root?.clientHeight || window.innerHeight) - taskbarHeight;
    const width = Math.min(definition.width, Math.max(280, areaWidth - 32));
    const height = Math.min(definition.height, Math.max(80, areaHeight - 32));
    return {
      title: definition.name,
      icon: windowsAppIcons[definition.name],
      content: definition.component,
      width,
      height,
      center: false,
      x: Math.max(0, (areaWidth - width) / 2),
      y: Math.max(0, definition.id === 'keyboard' ? areaHeight - height - 4 : (areaHeight - height) / 2),
      alwaysOnTop: definition.id === 'keyboard' || definition.id === 'magnifier',
      resizable: !['magnifier', 'characters', 'quickAssist'].includes(definition.id),
      frame: false,
      backgroundColor: 'transparent',
      radius: 0,
      style: { boxShadow: '0 4px 18px rgb(0 0 0 / 24%)' },
      config: { app: definition.id, ...(path ? { path } : {}) },
    };
  };
  for (const definition of definitions) {
    const app: WinAppOptions = {
      name: definition.name,
      icon: windowsAppIcons[definition.name],
      multiple: definition.id === 'wordpad' || definition.id === 'paint',
      window: options(definition),
    };
    system.addApp(app);
    system.addMenuList(app);
  }
  const photos = definitions.find((item) => item.id === 'photos')!;
  const player = definitions.find((item) => item.id === 'mediaPlayer')!;
  for (const [definition, extensions] of [
    [photos, ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']],
    [player, ['.mp3', '.wav', '.ogg', '.m4a', '.mp4', '.webm']],
  ] as const) {
    system.registerFileOpener([...extensions], {
      name: definition.name,
      icon: windowsAppIcons[definition.name],
      func: (path) => system.createWindow(options(definition, path)).show(),
    });
  }
}

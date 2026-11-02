import type { System, WinAppOptions } from 'vtron';
import Calculator from '../Calculator.vue';
import Notepad from './Notepad.vue';
import SnippingTool from './SnippingTool.vue';
import StickyNotes from './StickyNotes.vue';
import VoiceRecorder from './VoiceRecorder.vue';
import AlarmsClock from './AlarmsClock.vue';
import { dailyAppIcons } from './icons';

const definitions = [
  { feature: 'calc', name: '计算器', component: Calculator, width: 360, height: 540 },
  { feature: 'notepad', name: '记事本', component: Notepad, width: 760, height: 520 },
  { feature: 'snip', name: '截图工具', component: SnippingTool, width: 450, height: 130 },
  { feature: 'sticky', name: '便笺', component: StickyNotes, width: 360, height: 380 },
  { feature: 'recorder', name: '录音机', component: VoiceRecorder, width: 820, height: 560 },
  { feature: 'clock', name: '闹钟和时钟', component: AlarmsClock, width: 816, height: 572 },
] as const;

export function registerDailyApps(system: System, features: readonly string[]) {
  const options = (definition: (typeof definitions)[number], path?: string) => ({
    title: definition.name,
    icon: dailyAppIcons[definition.name],
    content: definition.component,
    width: Math.min(definition.width, Math.max(280, window.innerWidth - 32)),
    height: Math.min(definition.height, Math.max(200, window.innerHeight - 72)),
    center: true,
    frame: false,
    backgroundColor: 'transparent',
    radius: 0,
    style: { boxShadow: '0 4px 18px rgb(0 0 0 / 24%)' },
    config: path ? { path } : {},
  });
  for (const definition of definitions) {
    if (!features.includes(definition.feature)) continue;
    const app: WinAppOptions = {
      name: definition.name,
      icon: dailyAppIcons[definition.name],
      multiple: definition.feature === 'notepad',
      window: options(definition),
    };
    system.addApp(app);
    system.addMenuList(app);
    if (definition.feature === 'calc') system.addMagnet(app);
  }
  if (features.includes('notepad')) {
    const definition = definitions.find((item) => item.feature === 'notepad')!;
    system.registerFileOpener(['.txt', '.log'], {
      name: '记事本',
      icon: dailyAppIcons['记事本'],
      func: (path) => system.createWindow(options(definition, path)).show(),
    });
  }
}

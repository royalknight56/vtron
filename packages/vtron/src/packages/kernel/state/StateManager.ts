import { Notify } from '@/packages/services/notification/Notification';
import { Menu } from '@/packages/ui/menu/Menu';
import { BrowserWindow } from '@/packages/ui/window/BrowserWindow';
import { UnwrapNestedRefs, markRaw, reactive } from 'vue';
import { System } from '../system';
import { AppListState } from './subStates/AppListState';
import { OptionsState } from './subStates/OptionsState';
import { PowerState } from './subStates/PowerState';
import { SettingState } from './subStates/SettingState';
import { WindowMapState } from './subStates/WindowMapState';
import { WindowTreeState } from './subStates/WindowTreeState';
import { NotifyState } from './subStates/NotifyState';
import { NavigatorState } from './subStates/NavigatorState';
import { RectState } from './subStates/RectState';
import { ContextMenuState } from './subStates/ContextMenuState';
import { ClipboardState } from './subStates/ClipboardState';
import { ErrorState } from './subStates/ErrorState';

export class StateManager {
  private system: System;

  windowMap = new WindowMapState();
  appList = new AppListState();
  settings = new SettingState();
  powerState = new PowerState();
  windowTree = new WindowTreeState();
  notify = new NotifyState();
  navigator = new NavigatorState();
  rect = new RectState();
  contextMenu = new ContextMenuState();
  clipboard = new ClipboardState();
  error = new ErrorState();

  options: OptionsState;

  constructor(system: System) {
    this.system = system;

    const options = this.system._options;
    options.desktop?.forEach((item) => {
      if (typeof item.window.content !== 'string') {
        item.window.content = markRaw(item.window.content);
      }
    });
    options.magnet?.forEach((item) => {
      if (typeof item.window.content !== 'string') {
        item.window.content = markRaw(item.window.content);
      }
    });
    options.menulist?.forEach((item) => {
      if (typeof item.window.content !== 'string') {
        item.window.content = markRaw(item.window.content);
      }
    });
    this.options = new OptionsState(options);
  }
}

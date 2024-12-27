import { markRaw } from 'vue';
import { System } from '../system';
import { AppListState } from './subStates/AppListState';
import { ClipboardState } from './subStates/ClipboardState';
import { ContextMenuState } from './subStates/ContextMenuState';
import { ErrorState } from './subStates/ErrorState';
import { NavigatorState } from './subStates/NavigatorState';
import { NotifyState } from './subStates/NotifyState';
import { OptionsState } from './subStates/OptionsState';
import { PowerState } from './subStates/PowerState';
import { RectState } from './subStates/RectState';
import { SettingState } from './subStates/SettingState';
import { TrayState } from './subStates/TrayState';
import { WindowMapState } from './subStates/WindowMapState';
import { WindowTreeState } from './subStates/WindowTreeState';

export class StateManager {
  private system: System;

  windowMap = new WindowMapState();
  appList = new AppListState();
  settings = new SettingState();
  powerState = new PowerState();
  windowTree = new WindowTreeState();
  trayState = new TrayState();
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
    [
      ...(options.desktop || []),
      ...(options.magnet || []),
      ...(options.menulist || []),
    ].forEach((item) => {
      if (item.type !== 'group') {
        if (typeof item.window.content !== 'string') {
          item.window.content = markRaw(item.window.content);
        }
      } else {
        item.group.forEach((item) => {
          if (item.type !== 'group') {
            if (typeof item.window.content !== 'string') {
              item.window.content = markRaw(item.window.content);
            }
          }
        });
      }
    });
    this.options = new OptionsState(options);
  }
}

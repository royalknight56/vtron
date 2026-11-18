import { System } from '@/packages/kernel/system';

export interface NotifyConstructorOptions {
  title: string;
  content: string;
  source?: string;
  alarm?: boolean;
  type?: 'message' | 'system';
  timeout?: number;
  onClick?: () => void;
}

export class Notify {
  public static idcount = 0;
  public static system: System;
  id = Notify.idcount++;
  createdAt = Date.now();
  alarm: boolean;
  title: string;
  content: string;
  source: string;
  type: 'message' | 'system';
  /** @internal */
  _onClickFn: (() => void) | undefined;
  private state = Notify.system.stateManager.notify;

  constructor(option: NotifyConstructorOptions) {
    this.title = option.title;
    this.content = option.content;
    this.alarm = option.alarm === true;
    this.source = option.source || 'Vtron';
    this.type = option.type ?? 'message';
    this._onClickFn = option.onClick;
    this.state.push(this, Notify.system._options.builtinFeature?.includes('MessageCenter') === true);
    setTimeout(() => this.state.hideBanner(this), option.timeout || 5000);
  }
  close() {
    this.state.remove(this);
  }
}

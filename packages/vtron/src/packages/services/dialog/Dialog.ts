import { ref, toRaw } from 'vue';
import { System } from '../../kernel/system';
import DialogProcessVue from './DialogProcess.vue';
import DialogVue from './DialogTemp.vue';
import DialogInputVue from './DialogInput.vue';

class Dialog {
  public static system: System;
  constructor() {
    // static class
  }
  /**
   * @internal
   * @param option
   * @returns
   */
  public static createDialogBase<T>(
    option: {
      message?: string;
      type?: 'info' | 'error' | 'question' | 'warning';
      title?: string;
      buttons?: string[];
    },
    slot: any
  ) {
    const opt = Object.assign(
      {
        message: '',
        type: 'info',
        title: '提示',
        buttons: ['OK'],
      },
      option
    );

    let promres: (value: { response: T }) => void = () => {
      // do nothing
    };

    const porm = new Promise<{
      response: T;
    }>((resolve) => {
      promres = resolve;
    });

    const dialogwin = Dialog.system.createWindow({
      width: 300,
      height: 150,
      content: slot,
      title: opt.title,
      resizable: false,
      minimizable: false,
      center: true,
      skipTaskbar: true,
      config: {
        res: promres,
        option: opt,
      },
      alwaysOnTop: true,
    });
    dialogwin.show();
    Dialog.system.stateManager.windowTree.windowOrder.forEach((win) => {
      if (!(toRaw(win) === dialogwin)) {
        win.setDisable(true);
      }
    });
    dialogwin.on('close', () => {
      Dialog.system.stateManager.windowTree.windowOrder.forEach((win) => {
        if (!(toRaw(win) === dialogwin)) {
          win.setDisable(false);
        }
      });
      promres({
        response: -1 as T,
      });
    });

    return porm;
  }
  public static showProcessDialog(option: {
    message?: string;
    type?: 'info' | 'error' | 'question' | 'warning';
    title?: string;
    buttons?: string[];
  }) {
    const opt = Object.assign(
      {
        message: '',
        type: 'info',
        title: '提示',
        buttons: ['OK'],
      },
      option
    );

    const process = ref(0);

    const dialogwin = this.system.createWindow({
      width: 300,
      height: 150,
      content: DialogProcessVue,
      title: opt.title,
      resizable: false,
      minimizable: false,
      center: true,
      skipTaskbar: true,
      config: {
        res: process,
        option: opt,
      },
      alwaysOnTop: true,
    });
    dialogwin.show();

    function setProgress(value: number) {
      process.value = value;
      if (value >= 100) {
        dialogwin.close();
      }
    }

    return {
      setProgress,
    };
  }
  public static showMessageBox(option: {
    message?: string;
    type?: 'info' | 'error' | 'question' | 'warning';
    title?: string;
    buttons?: string[];
  }): Promise<{
    response: number;
  }> {
    return this.createDialogBase(option, DialogVue);
  }
  public static showInput(option: {
    message?: string;
    title?: string;
    buttons?: string[];
    placeholder?: string;
  }): Promise<{
    response: string;
  }> {
    return this.createDialogBase<string>(option, DialogInputVue);
  }
}

export { Dialog };

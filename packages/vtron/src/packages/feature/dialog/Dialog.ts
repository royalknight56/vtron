import { toRaw } from 'vue';
import { useRootState } from '../state/Root';
import { BrowserWindow } from '../window/BrowserWindow';
import DialogVue from './DialogTemp.vue';
class Dialog {
  constructor() {
    // static class
  }
  public static showMessageBox(option: {
    message?: string;
    type?: 'info' | 'error' | 'question' | 'warning';
    title?: string;
    buttons?: string[];
  }): Promise<{
    response: number;
  }> {
    const opt = Object.assign(
      {
        message: '',
        type: 'info',
        title: '提示',
        buttons: ['OK'],
      },
      option
    );

    let promres: (value: { response: number }) => void = () => {
      // do nothing
    };

    const porm = new Promise<{
      response: number;
    }>((resolve) => {
      promres = resolve;
    });

    const dialogwin = new BrowserWindow({
      width: 300,
      height: 150,
      content: DialogVue,
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
    useRootState().system.windowOrder.forEach((win) => {
      if (!(toRaw(win) === dialogwin)) {
        win.setDisable(true);
      }
    });
    dialogwin.on('close', () => {
      useRootState().system.windowOrder.forEach((win) => {
        if (!(toRaw(win) === dialogwin)) {
          win.setDisable(false);
        }
      });
      promres({
        response: -1,
      });
    });

    return porm;
  }
}

export { Dialog };

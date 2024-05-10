import { System } from '@/packages/plug';
import { SystemStateEnum } from '@/packages/type/enum';

export class PowerOperations {
  system: System;
  constructor(system: System) {
    this.system = system;
  }
  /**
   * @description: 判断是否登录
   */
  isLogin() {
    if (!this.system._options.login) {
      this.system._rootState.systemState = SystemStateEnum.open;
      return;
    } else {
      if (this.system._options.login.init?.()) {
        this.system._rootState.systemState = SystemStateEnum.open;
        return;
      }

      this.system._rootState.systemState = SystemStateEnum.lock;
      const tempCallBack = this.system._options.loginCallback;
      if (!tempCallBack) {
        throw new Error('没有设置登录回调函数');
      }
      this.system._options.loginCallback = async (username: string, password: string) => {
        const res = await tempCallBack(username, password);
        if (res) {
          this.system._rootState.systemState = SystemStateEnum.open;
          return true;
        }
        return false;
      };
    }
  }

  shutdown() {
    this.system._rootState.systemState = SystemStateEnum.close;
  }
  reboot() {
    this.system._rootState.systemState = SystemStateEnum.close;
    window.location.reload();
  }
  recover() {
    this.system.fs.removeFileSystem();
    localStorage.removeItem('vtronFirstRun');
    localStorage.removeItem('vtron-username');
    localStorage.removeItem('vtron-password');
    localStorage.removeItem('vtronCommandHistory');

    this.system._rootState.systemState = SystemStateEnum.close;
    window.location.reload();
  }
}

import { join, Notify } from '@/packages/plug';
import { Saveablekey, SystemOptionsCertainly } from '@/packages/type/type';
import { System } from '../System';

export class ConfigOperations {
  system: System;
  constructor(system: System) {
    this.system = system;
  }

  /**
   * @description: 初始化保存的配置
   */
  async initSavedConfig() {
    const config = await this.system.fs.readFile(
      join(this.system._options.systemLocation || '', 'Vtron/config.json')
    );
    if (config) {
      try {
        this.system.stateManager.options.assignOptions(JSON.parse(config));
      } catch {
        new Notify({
          title: 'Vtron',
          content: '配置文件格式错误',
        });
      }
    }

    this.initBackground();
    this.initCheckVersion();
  }

  async initBackground() {
    // 初始化背景设置
    const back = await this.system.fs.readFile(`${this.system._options.systemLocation}Vtron/background.txt`);
    if (back) {
      this.system.stateManager.options.setOptions('background', back);
    }
  }

  // 检查版本
  async initCheckVersion() {
    const programVersion = this.system.version;
    const systemVersion = await this.system.fs.readFile(
      join(this.system._options.systemLocation || '', 'Vtron/version.txt')
    );
    if (systemVersion && programVersion) {
      if (programVersion !== systemVersion) {
        // this.system.createNotify({
        //   title: 'Vtron',
        //   content: '本地程序和文件版本不一致，请恢复出厂设置',
        // });
        // 不一致，弹出升级弹窗
        this.system.createDialog().showMessageBox({
          message: '本地程序和文件版本不一致，是否运行升级程序',
          buttons: ['是', '否'],
        }).then(async (res) => {
          if (res.response === 0) {
            // 运行升级程序
            let { setProgress } = this.system.createDialog().showProcessDialog({
              message: '升级程序正在运行',
              buttons: ['确定'],
            });
            setProgress(20);
            // 获取对应版本的升级程序
            if(this.system.upgradeProgram[systemVersion]){
              // 运行对应版本的升级程序
             await this.system.upgradeProgram[systemVersion]();
             setProgress(80);
            }
            setProgress(100);

          }
        });
      }
    }
  }

  setConfig<T extends keyof SystemOptionsCertainly>(key: T, value: SystemOptionsCertainly[T]): Promise<void>;
  setConfig<T extends string>(
    key: T,
    value: T extends keyof SystemOptionsCertainly ? SystemOptionsCertainly[T] : unknown
  ): Promise<void>;
  setConfig<T extends keyof SystemOptionsCertainly>(key: string, value: SystemOptionsCertainly[T]) {
    this.system.stateManager.options.setOptions(key, value);
    if (Saveablekey.includes(key as any)) {
      return this.system.fs.writeFile(
        join(this.system._options.systemLocation || '', 'Vtron/config.json'),

        JSON.stringify(this.system.stateManager.options.pickOptions(Saveablekey))
      );
    } else {
      return Promise.resolve();
    }
  }

  getConfig<T extends keyof SystemOptionsCertainly>(key: T): SystemOptionsCertainly[T];
  getConfig<T extends string>(key: T): unknown;
  getConfig(key: string) {
    return this.system.stateManager.options.getOptions(key);
  }
}

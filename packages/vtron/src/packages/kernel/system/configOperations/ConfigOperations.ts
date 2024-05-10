import { join, Notify } from '@/packages/plug';
import { System } from '../System';
import { Saveablekey, SystemOptionsCertainly } from '@/packages/type/type';
import { pick } from '@/packages/util/modash';

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
        this.system._rootState.options = Object.assign(this.system._rootState.options, JSON.parse(config));
      } catch {
        new Notify({
          title: 'Vtron',
          content: '配置文件格式错误',
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
    this.system._rootState.options[key] = value;
    if (Saveablekey.includes(key as any)) {
      return this.system.fs.writeFile(
        join(this.system._options.systemLocation || '', 'Vtron/config.json'),

        JSON.stringify(pick(this.system._rootState.options, ...Saveablekey))
      );
    } else {
      return Promise.resolve();
    }
  }

  getConfig<T extends keyof SystemOptionsCertainly>(key: T): SystemOptionsCertainly[T];
  getConfig<T extends string>(key: T): unknown;
  getConfig(key: string) {
    return this.system._rootState.options[key];
  }
}

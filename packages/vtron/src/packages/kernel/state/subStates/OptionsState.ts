import { SystemOptions, SystemOptionsCertainly } from '@/packages/type/type';
import { pick } from '@/packages/util/modash';
import { reactive } from 'vue';

export class OptionsState {
  options: SystemOptions;
  constructor(options: SystemOptions) {
    this.options = reactive(options);
  }

  getOptions<T extends keyof SystemOptionsCertainly>(key: T): SystemOptionsCertainly[T];
  getOptions<T extends string>(key: T): unknown;
  getOptions(key: string) {
    return this.options[key];
  }

  setOptions<T extends keyof SystemOptionsCertainly>(key: T, value: SystemOptionsCertainly[T]): void;
  setOptions<T extends string>(
    key: T,
    value: T extends keyof SystemOptionsCertainly ? SystemOptionsCertainly[T] : unknown
  ): void;
  setOptions<T extends keyof SystemOptionsCertainly>(key: string, value: SystemOptionsCertainly[T]) {
    this.options[key] = value;
  }

  assignOptions(options: SystemOptions) {
    Object.assign(this.options, options);
  }
  pickOptions<T extends keyof SystemOptionsCertainly>(keys: T[]): Pick<SystemOptionsCertainly, T> {
    return pick(this.options, ...keys);
  }
}

import { SystemStateEnum } from '@/packages/type/enum';
import { ref } from 'vue';

export class PowerState {
  current = ref<SystemStateEnum>(SystemStateEnum.close);
  constructor() {}
  setPowerState(state: SystemStateEnum) {
    this.current.value = state;
  }
  getPowerState() {
    console.log(this.current);
    return this.current.value;
  }
  getPowerStateValue() {
    return this.current.value;
  }
}

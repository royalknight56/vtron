import { ref } from 'vue';

export enum PowerStateEnum {
  close = 0,
  opening = 1,
  open = 2,
  lock = 3,
}

export class PowerState {
  current = ref<PowerStateEnum>(PowerStateEnum.close);
  constructor() {}
  setPowerState(state: PowerStateEnum) {
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

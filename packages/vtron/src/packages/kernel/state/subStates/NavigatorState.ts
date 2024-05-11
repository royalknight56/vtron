import { reactive } from 'vue';

export class NavigatorState {
  battery = reactive({
    isCharging: false,
    chargeLevel: 0,
  });
  connection = reactive({
    effectiveType: '4g',
    rtt: 0,
    downlink: 0,
    saveData: false,
  });

  constructor() {}

  setBattery(isCharging: boolean, chargeLevel: number) {
    this.battery.isCharging = isCharging;
    this.battery.chargeLevel = chargeLevel;
  }
  setConnection({
    effectiveType,
    rtt,
    downlink,
    saveData,
  }: {
    effectiveType: string;
    rtt: number;
    downlink: number;
    saveData: boolean;
  }) {
    this.connection.effectiveType = effectiveType;
    this.connection.rtt = rtt;
    this.connection.downlink = downlink;
    this.connection.saveData = saveData;
  }
}

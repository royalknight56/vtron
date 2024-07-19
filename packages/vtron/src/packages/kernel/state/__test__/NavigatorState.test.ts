import { beforeEach, describe, expect, it } from 'vitest';
import { NavigatorState } from "../subStates/NavigatorState";
describe('NavigatorState', () => {
  let navigatorState: NavigatorState;

  beforeEach(() => {
    navigatorState = new NavigatorState();
  });

  describe('NavigatorState Base', () => {
    it('init', async () => {
        expect(navigatorState.battery).toEqual({
            chargeLevel: 0,
            isCharging: false
        })
        expect(navigatorState.connection).toEqual({
            effectiveType: '4g',
            rtt: 0,
            downlink: 0,
            saveData: false,
          })
    });
    it('setBattery', async () => {
        navigatorState.setBattery(true, 1);
        expect(navigatorState.battery).toEqual({
            chargeLevel: 1,
            isCharging: true
        })
    });

    it('setConnection', async () => {
        navigatorState.setConnection({
            effectiveType: '5g',
            rtt: 1,
            downlink: 1,
            saveData: true,
        });
        expect(navigatorState.connection).toEqual({
            effectiveType: '5g',
            rtt: 1,
            downlink: 1,
            saveData: true,
          })
    })


  });
});
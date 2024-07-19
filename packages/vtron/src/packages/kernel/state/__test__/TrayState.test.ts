import { beforeEach, describe, expect, it } from 'vitest';
import { TrayState } from "../subStates/TrayState";
describe('TrayState', () => {
  let trayState: TrayState;

  beforeEach(() => {
    trayState = new TrayState();
  });

  describe('TrayState Base', () => {
    it('init', async () => {
        expect(trayState.current).toEqual([]);
    });
    it('push', async () => {
        trayState.push({} as any);
        expect(trayState.current).toEqual([{}]);
    });
    it('push 2', async () => {
        trayState.push({} as any);
        trayState.push({} as any);
        expect(trayState.current).toEqual([{}, {}]);
    })
  });
});

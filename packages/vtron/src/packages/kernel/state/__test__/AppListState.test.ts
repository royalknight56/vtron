import { beforeEach, describe, expect, it } from 'vitest';
import { AppListState } from "../subStates/AppListState";
describe('AppListState', () => {
  let appListState: AppListState;

  beforeEach(() => {
    appListState = new AppListState();
  });

  describe('AppListState Base', () => {
    it('init', async () => {
        expect(appListState.apps).toEqual([]);
        expect(appListState.magnet).toEqual([]);
        expect(appListState.menulist).toEqual([]);
    });
    it('getAppList', async () => {
        expect(appListState.getAppList('apps')).toEqual([]);
        expect(appListState.getAppList('magnet')).toEqual([]);
        expect(appListState.getAppList('menulist')).toEqual([]);
    });
    it('refreshAppList', async () => {
        appListState.refreshAppList('apps', []);
        expect(appListState.apps).toEqual([]);
        appListState.refreshAppList('magnet', []);
        expect(appListState.magnet).toEqual([]);
        appListState.refreshAppList('menulist', []);
        expect(appListState.menulist).toEqual([]);
    })

  });
});
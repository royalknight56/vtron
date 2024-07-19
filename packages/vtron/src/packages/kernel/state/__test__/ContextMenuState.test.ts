import { beforeEach, describe, expect, it } from 'vitest';
import { ContextMenuState } from "../subStates/ContextMenuState";
import { Menu } from '@/packages/services';
describe('ContextMenuState', () => {
  let contextMenuState: ContextMenuState;

  beforeEach(() => {
    contextMenuState = new ContextMenuState();
  });

  describe('ContextMenuState Base', () => {
    it('init', async () => {
        expect(contextMenuState.current.value).toEqual(null);
    });
    it('setContextMenu', async () => {
        expect(contextMenuState.current.value).toEqual(null);
        contextMenuState.setContextMenu(null);
        expect(contextMenuState.current.value).toEqual(null);
        contextMenuState.setContextMenu(Menu.buildFromTemplate([
            { label: 'test' }
        ]));
        expect(contextMenuState.current.value?.items[0]).toEqual({ label: 'test' });
    });

  });
});
import { beforeEach, describe, expect, it } from 'vitest';
import { ClipboardState } from "../subStates/ClipboardState";
describe('ClipboardState', () => {
  let clipboardState: ClipboardState;

  beforeEach(() => {
    clipboardState = new ClipboardState();
  });

  describe('ClipboardState Base', () => {
    it('init', async () => {
        expect(clipboardState.current.value).toEqual(null);
    });
    it('setClipboard', async () => {
        clipboardState.setClipboard({});
        expect(clipboardState.current.value).toEqual({});
    });
    it('getClipboard', async () => {
        clipboardState.setClipboard({});
        expect(clipboardState.getClipboard()).toEqual({});
        clipboardState.setClipboard('test');
        expect(clipboardState.getClipboard()).toEqual('test');
    })

  });
});
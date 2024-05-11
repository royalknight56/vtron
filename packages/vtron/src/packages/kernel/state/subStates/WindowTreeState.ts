import { BrowserWindow } from '@/packages/ui/window/BrowserWindow';
import { Tree } from '@packages/util/Tree';
import { reactive } from 'vue';
export class WindowTreeState {
  windowTree = reactive(new Tree<BrowserWindow>());
  windowOrder = reactive(new Array<BrowserWindow>());
  topWindow: BrowserWindow | undefined;
  winnum = 0;
  constructor() {}
  findNode(node: BrowserWindow) {
    return this.windowTree.findNode(node);
  }
  removeChild(node: BrowserWindow) {
    this.windowTree.removeChild(node);
  }
  addChild(node: BrowserWindow) {
    this.windowTree.addChild(node);
  }
  removeNode(node: BrowserWindow) {
    this.windowTree.removeNode(node);
  }
  findIndex(node: BrowserWindow, callback: (val: Tree<BrowserWindow>) => boolean) {
    return this.windowTree.findIndex(node, callback);
  }
  traverseBFS(callback: (val: Tree<BrowserWindow>) => void) {
    this.windowTree.traverseBFS(callback);
  }
}

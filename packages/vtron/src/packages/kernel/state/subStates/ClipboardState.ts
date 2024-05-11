import { ref } from 'vue';

export class ClipboardState {
  current = ref<any>(null);
  constructor() {}
  setClipboard(clipboard: any) {
    this.current.value = clipboard;
  }
  getClipboard() {
    return this.current.value;
  }
}

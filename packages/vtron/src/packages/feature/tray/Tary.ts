import { Ref, defineComponent, markRaw, ref } from 'vue';

export interface TrayOptions {
  image: string;
}
export class Tray {
  image: string;
  _id: string;
  _contextMenu: ReturnType<typeof defineComponent>;
  _contextMenuShow = false;
  _contextMenuWidth = 100;
  _contextMenuHeight = 100;
  public static trayList: Ref<Tray[]> = ref<Tray[]>([]);
  constructor(options: TrayOptions) {
    this.image = options.image;
    Tray.trayList.value.push(this);
    this._id = Tray.trayList.value.length.toString();
  }
  setContextMenu(content: ReturnType<typeof defineComponent>, width = 100, height = 100) {
    this._contextMenu = markRaw(content);
    this._contextMenuWidth = width;
    this._contextMenuHeight = height;
  }
  setImage(image: string) {
    this.image = image;
    Tray.trayList.value = Tray.trayList.value.slice();
  }
}

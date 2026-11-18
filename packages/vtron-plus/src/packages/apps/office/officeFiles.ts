import { inject, type InjectionKey } from 'vue';
import type { BrowserWindow, Dialog, System, join, vDragable } from 'vtron';

// Only the desktop entry imports these runtime dependencies.
export const desktopOffice: InjectionKey<{ join: typeof join; dragable: typeof vDragable }> = Symbol('desktopOffice');
export const standaloneOffice: InjectionKey<typeof Dialog.showMessageBox> = Symbol('standaloneOffice');

export function useOfficeFiles() {
  const desktopTools = inject(desktopOffice, null);
  const ask = inject(standaloneOffice, null);
  const system = inject<System | null>('system', null);
  const win = inject<BrowserWindow | null>('browserWindow', null);
  return {
    standalone: !!ask,
    win,
    initialPath: win?.config?.path || '',
    get fs() { return system!.fs; },
    get drafts() { return ask ? null : localStorage; },
    desktop: (...parts: string[]) => desktopTools!.join(system!._options.userLocation || '/C/Users', 'Desktop', ...parts),
    showMessageBox: (options: Parameters<typeof Dialog.showMessageBox>[0]) =>
      ask ? ask(options) : system!.createDialog().showMessageBox(options),
    notifySaveError(message: string) {
      system?.createNotify({ title: '保存失败', content: message });
    },
  };
}

export async function saveOfficeDownload(
  name: string, extension: string, saveAs: boolean, makeBlob: (name: string) => Promise<Blob>
) {
  const input = saveAs ? window.prompt('另存为', name + '.' + extension) : name;
  if (!input?.trim()) return null;
  const clean = input.trim().replace(/[\\/:*?"<>|]/g, '');
  const base = clean.toLowerCase().endsWith('.' + extension) ? clean.slice(0, -extension.length - 1) : clean;
  if (!base.trim()) throw new Error('请输入有效的文件名');
  const blob = await makeBlob(base);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = base + '.' + extension;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return base;
}

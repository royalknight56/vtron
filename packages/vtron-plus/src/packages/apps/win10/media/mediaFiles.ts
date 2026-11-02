import { onUnmounted, ref } from 'vue';
import { Dialog, System, basename, dirname, join, normalize } from 'vtron';

export type PathPrompt = { title: string; value: string; action: string };
export function usePathPrompt() {
  const prompt = ref<PathPrompt | null>(null);
  let resolve: ((value: string | null) => void) | undefined;
  function finish(value: string | null) {
    const done = resolve;
    resolve = undefined;
    prompt.value = null;
    done?.(value);
  }
  function ask(title: string, value: string, action = '打开'): Promise<string | null> {
    if (resolve) return Promise.resolve(null);
    prompt.value = { title, value, action };
    return new Promise((done) => {
      resolve = done;
    });
  }
  onUnmounted(() => finish(null));
  return { prompt, ask, finish };
}
export function desktopPath(sys: System, name: string) {
  return join(sys._options.userLocation || '/C/Users', 'Desktop', name);
}
export function virtualPath(sys: System, value: string) {
  const converted = value
    .trim()
    .replace(/^([a-z]):/i, (_, drive: string) => '/' + drive.toUpperCase())
    .replaceAll('\\', '/');
  return normalize(converted.startsWith('/') ? converted : desktopPath(sys, converted));
}
export async function canWrite(sys: System, path: string, current: string, title: string) {
  if (dirname(path) === '/' || !basename(path) || /[\\/:*?"<>|]/.test(basename(path)))
    throw new Error('请在磁盘中的文件夹内保存，并使用有效文件名。');
  if (!(await sys.fs.stat(dirname(path)))?.isDirectory) throw new Error('指定的文件夹不存在。');
  const info = await sys.fs.stat(path);
  if (info?.isDirectory) throw new Error('目标是文件夹，请输入文件名。');
  if (info && path !== current) {
    const answer = await Dialog.showMessageBox({
      title,
      message: `${basename(path)} 已存在。是否替换？`,
      type: 'warning',
      buttons: ['替换', '取消'],
    });
    return answer.response === 0;
  }
  return true;
}
export async function message(title: string, error: unknown) {
  await Dialog.showMessageBox({
    title,
    type: 'error',
    message: error instanceof Error ? error.message : String(error),
    buttons: ['确定'],
  });
}
export function textContent(value: string) {
  if (!value.startsWith('data:')) return value;
  const comma = value.indexOf(',');
  if (comma < 0) throw new Error('文件内容无效。');
  return /;base64/i.test(value.slice(0, comma))
    ? new TextDecoder().decode(Uint8Array.from(atob(value.slice(comma + 1)), (c) => c.charCodeAt(0)))
    : decodeURIComponent(value.slice(comma + 1));
}
export const imagePattern = /\.(png|jpe?g|gif|webp|bmp|vtimg)$/i;
export const mediaPattern = /\.(mp3|wav|ogg|m4a|aac|flac|mp4|webm|m4v|ogv|mov)$/i;
const mimeTypes: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  vtimg: 'image/png',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  mp4: 'video/mp4',
  webm: 'video/webm',
  m4v: 'video/mp4',
  ogv: 'video/ogg',
  mov: 'video/quicktime',
};
export type MediaSource = { url: string; release: () => void };
export async function virtualMedia(sys: System, path: string, kind: 'image' | 'media'): Promise<MediaSource> {
  if (!(kind === 'image' ? imagePattern : mediaPattern).test(path)) throw new Error('不支持此文件格式。');
  const info = await sys.fs.stat(path);
  if (!info || info.isDirectory) throw new Error('找不到指定的文件。');
  let text: string | null = null;
  try {
    text = await sys.fs.readFile(path);
  } catch {
    /* Binary files are read below. */
  }
  const dataPattern =
    kind === 'image'
      ? /^data:image\/(png|jpe?g|gif|webp|bmp);base64,[a-z\d+/=\s]+$/i
      : /^data:(audio|video)\/[\w.+-]+;base64,[a-z\d+/=\s]+$/i;
  if (text && dataPattern.test(text)) return { url: text, release: () => {} };
  let bytes: Uint8Array | null = null;
  if (text && /^[a-z\d+/=\s]+$/i.test(text) && text.replace(/\s/g, '').length % 4 === 0) {
    try {
      bytes = Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
    } catch {
      /* Try binary storage. */
    }
  }
  if (!bytes && sys.fs.readBinaryFile) bytes = await sys.fs.readBinaryFile(path);
  if (!bytes?.length) throw new Error('文件内容为空或格式无效。');
  const type = mimeTypes[path.split('.').pop()!.toLowerCase()] || 'application/octet-stream';
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer], { type }));
  return { url, release: () => URL.revokeObjectURL(url) };
}

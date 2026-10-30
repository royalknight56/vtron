import type { System } from 'vtron';
import { getVirtualNetwork } from './virtualNet';
import { requestVirtualHTTP } from './virtualHTTP';

export interface VirtualPreviewOptions {
  /** Dedicated same-site preview origin, different from the desktop origin. */
  previewOrigin?: string;
  /** Directory containing the static bridge.html and worker.js, relative to the host page by default. */
  scope?: string;
}
export interface VirtualPreview {
  ready: Promise<void>;
  url(port: number, path?: string): string;
  dispose(): void;
}
const previews = new WeakMap<object, VirtualPreview>();

/** Bridge this System's virtual HTTP ports to a separate browser origin. */
export function enableVirtualPreview(system: System, options: VirtualPreviewOptions = {}): VirtualPreview {
  const existing = previews.get(system);
  if (existing) return existing;
  const hostBase = new URL(options.scope || '__vtron_preview__/', document.baseURI);
  const origin = options.previewOrigin || '';
  const base = new URL(hostBase.pathname.endsWith('/') ? hostBase.pathname : hostBase.pathname + '/', origin || location.origin);
  const session = crypto.randomUUID();
  const requests = new Set<AbortController>();
  const frame = document.createElement('iframe');
  frame.hidden = true;
  frame.setAttribute('aria-hidden', 'true');
  frame.title = 'Vtron virtual HTTP bridge';
  let disposed = false;
  let settleReady: () => void = () => {};
  let failReady: (error: Error) => void = () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ready = new Promise<void>((resolve, reject) => { settleReady = resolve; failReady = reject; });
  // Consumers can await ready for diagnostics; a failed preview must not break the desktop.
  void ready.catch(error => console.warn('Vtron virtual preview:', error));
  const receive = (event: MessageEvent) => {
    if (disposed || event.source !== frame.contentWindow || event.origin !== base.origin || event.data?.session !== session) return;
    if (event.data.type === 'vtron:preview:ready') { clearTimeout(timer); settleReady(); return; }
    if (event.data.type === 'vtron:preview:error') { clearTimeout(timer); failReady(new Error(event.data.error)); return; }
    if (event.data.type !== 'vtron:preview:request' || !event.ports[0]) return;
    const channel = event.ports[0];
    const controller = new AbortController();
    requests.add(controller);
    channel.onmessage = message => { if (message.data?.type === 'cancel') controller.abort(); };
    const { port, method, path, headers, body } = event.data;
    void requestVirtualHTTP(getVirtualNetwork(system), { port, method, path, headers, body: new Uint8Array(body) }, controller.signal).then(
      response => channel.postMessage({ response: { ...response, body: response.body.buffer.slice(response.body.byteOffset, response.body.byteOffset + response.body.byteLength) } }),
      error => channel.postMessage({ error: error instanceof Error ? error.message : String(error) })
    ).finally(() => { requests.delete(controller); channel.close(); });
  };
  const preview: VirtualPreview = {
    ready,
    url(port, path = '/') {
      if (!Number.isInteger(port) || port < 1 || port > 65535) throw new RangeError('Virtual preview port must be between 1 and 65535');
      return new URL(`${session}/${port}/${path.replace(/^\/+/, '')}`, base).href;
    },
    dispose() {
      if (disposed) return;
      disposed = true; previews.delete(system);
      clearTimeout(timer); failReady(new Error('Virtual preview disposed'));
      window.removeEventListener('message', receive);
      frame.remove();
      for (const request of requests) request.abort();
      requests.clear();
    },
  };
  previews.set(system, preview);
  if (!isSecureContext || !('serviceWorker' in navigator)) failReady(new Error('Virtual preview requires HTTPS or localhost with Service Worker support'));
  else if (!origin || base.origin === location.origin || !['http:', 'https:'].includes(base.protocol)) failReady(new Error('Configure a separate previewOrigin to isolate preview scripts from the desktop'));
  else {
    const bridge = new URL('bridge.html', base);
    bridge.hash = new URLSearchParams({ session, owner: location.origin }).toString();
    frame.addEventListener('load', () => frame.contentWindow?.postMessage({ type: 'vtron:preview:init', session }, base.origin));
    frame.src = bridge.href;
    window.addEventListener('message', receive);
    timer = setTimeout(() => failReady(new Error('Virtual preview bridge did not start within 15 seconds; check previewOrigin and its static bridge files')), 15000);
    (document.body || document.documentElement).appendChild(frame);
  }
  return preview;
}

/** Map only loopback URLs with an explicit virtual port; leave ordinary URLs alone. */
export function virtualPreviewUrl(system: System, input: string): string | null {
  const preview = previews.get(system);
  if (!preview) return null;
  try {
    const url = new URL(input);
    if (url.protocol !== 'http:' || !url.port || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return null;
    return preview.url(Number(url.port), url.pathname + url.search + url.hash);
  } catch { return null; }
}

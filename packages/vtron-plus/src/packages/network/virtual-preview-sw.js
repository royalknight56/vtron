// @ts-nocheck
/* Static worker for enableVirtualPreview(). It handles only registered preview sessions. */
const sessions = new Map();
const scope = new URL(self.registration.scope);
const prefix = scope.pathname;
const maximumBody = 8 * 1024 * 1024;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  const { type, session } = event.data || {};
  const client = event.source;
  if (!client?.url || typeof session !== 'string' || !/^[\w-]{20,80}$/.test(session)) return;
  const url = new URL(client.url);
  // A preview cannot replace the host that owns a session.
  if (url.origin !== scope.origin || url.pathname !== prefix + 'bridge.html' || new URLSearchParams(url.hash.slice(1)).get('session') !== session) return;
  if (type === 'vtron:preview:register') { sessions.set(session, client.id); client.postMessage({ type: 'vtron:preview:registered', session }); }
  if (type === 'vtron:preview:unregister' && sessions.get(session) === client.id) sessions.delete(session);
});
function route(url) {
  if (url.origin !== scope.origin || !url.pathname.startsWith(prefix)) return null;
  const match = url.pathname.slice(prefix.length).match(/^([\w-]{20,80})\/(\d+)(\/.*)?$/);
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 65535) return null;
  return { session: match[1], port: Number(match[2]), path: (match[3] || '/') + url.search };
}
function problem(status, text) {
  return new Response(text, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
}
async function forward(event, target) {
  let owner = await self.clients.get(sessions.get(target.session) || '');
  if (!owner) {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    owner = clients.find(client => { const url = new URL(client.url); return url.pathname === prefix + 'bridge.html' && new URLSearchParams(url.hash.slice(1)).get('session') === target.session; });
    if (owner) sessions.set(target.session, owner.id);
  }
  if (!owner) { sessions.delete(target.session); return problem(503, 'Vtron preview unavailable: keep the desktop tab and HTTP server running.'); }
  const request = event.request;
  if (Number(request.headers.get('content-length')) > maximumBody) return problem(413, 'Preview request exceeds 8 MiB');
  const body = ['GET', 'HEAD'].includes(request.method) ? new ArrayBuffer(0) : await request.arrayBuffer();
  if (body.byteLength > maximumBody) return problem(413, 'Preview request exceeds 8 MiB');
  const headers = [...request.headers].filter(([key]) => !['cookie', 'authorization', 'proxy-authorization', 'host'].includes(key.toLowerCase()));
  headers.push(['host', `localhost:${target.port}`]);
  return new Promise(resolve => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => {
      channel.port1.postMessage({ type: 'cancel' }); channel.port1.close();
      resolve(problem(504, 'Vtron preview request timed out after 30 seconds'));
    }, 30000);
    channel.port1.onmessage = message => {
      clearTimeout(timer); channel.port1.close();
      if (message.data.error) { resolve(problem(502, 'Vtron preview: ' + message.data.error)); return; }
      const response = message.data.response;
      try {
        const resultHeaders = new Headers(response.headers);
        for (const key of ['set-cookie', 'set-cookie2', 'content-length', 'transfer-encoding', 'connection', 'content-encoding', 'clear-site-data', 'service-worker-allowed', 'content-security-policy', 'content-security-policy-report-only', 'location']) resultHeaders.delete(key);
        const location = new Headers(response.headers).get('location');
        if (location) {
          const redirected = new URL(location, 'http://localhost:' + target.port + target.path);
          if (redirected.origin === 'http://localhost:' + target.port) resultHeaders.set('location', prefix + target.session + '/' + target.port + redirected.pathname + redirected.search + redirected.hash);
        }
        resultHeaders.set('cache-control', 'no-store');
        resultHeaders.set('access-control-allow-origin', '*');
        resultHeaders.set('cross-origin-resource-policy', 'cross-origin');
        // A dedicated preview origin isolates desktop storage and DOM; previews cannot install workers.
        resultHeaders.set('content-security-policy', `default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' ${scope.origin}; style-src 'unsafe-inline' ${scope.origin}; img-src data: blob: ${scope.origin}; font-src data: ${scope.origin}; connect-src ${scope.origin}; worker-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`);
        const empty = request.method === 'HEAD' || [204, 205, 304].includes(response.status);
        resolve(new Response(empty ? null : response.body, { status: response.status, statusText: response.statusText, headers: resultHeaders }));
      } catch (error) { resolve(problem(502, 'Invalid virtual HTTP response: ' + error.message)); }
    };
    owner.postMessage({ type: 'vtron:preview:request', session: target.session, port: target.port, path: target.path, method: request.method, headers, body }, [channel.port2, body]);
  });
}
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const direct = route(url);
  if (direct) { event.respondWith(forward(event, direct)); return; }
  // A controlled preview's /app.js and /style.css belong to its virtual server.
  if (url.origin !== scope.origin || !event.clientId) return;
  event.respondWith((async () => {
    const client = await self.clients.get(event.clientId);
    const source = client && route(new URL(client.url));
    if (!source) return fetch(event.request);
    if (event.request.mode === 'navigate') return Response.redirect(scope.origin + prefix + source.session + '/' + source.port + url.pathname + url.search, 302);
    return forward(event, { ...source, path: url.pathname + url.search });
  })());
});

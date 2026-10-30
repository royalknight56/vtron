import { executeScript } from './scriptRuntime';
import { createSyncExistsClient } from './syncFsBridge';
import { createNodeWorkerContext, type NodeWorkerInit } from './workerTransport';
import { createWorkerNetwork } from '../network/workerNetwork';

type Start = { port: MessagePort; syncPort: MessagePort; networkPort: MessagePort; init: NodeWorkerInit; code: string; filename: string; args: string[]; thread?: { parentPort: MessagePort; workerData: unknown; name?: string }; target?: { platform: 'linux'; arch: 'x64'; nodeVersion?: '22.14.0' } };

self.addEventListener('message', (event: MessageEvent<Start>) => {
  const { port, syncPort, networkPort, init, code, filename, args, target, thread } = event.data;
  void (async () => {
    const context = createNodeWorkerContext(port, init);
    const sync = createSyncExistsClient(syncPort);
    const network = createWorkerNetwork(networkPort);
    try {
      context.online();
      const exitCode = await Promise.race([executeScript(code, context.shell, context.output, filename, args, undefined, { worker: true, execArgv: init.execArgv, env: thread ? init.env : undefined, startWorker: context.startWorker, thread: thread && { ...thread, threadId: init.processId! }, processId: init.processId, existsSync: sync.existsSync, readFileSync: sync.readFileSync, readdirSync: sync.readdirSync, writeBytesSync: sync.writeBytesSync, mkdirSync: sync.mkdirSync, writeFileSync: sync.writeFileSync, renameSync: sync.renameSync, statSync: sync.statSync, realpathSync: sync.realpathSync, watch: context.watch, target, network: network.network }), network.failure]);
      context.finish({ exitCode });
    } catch (error) { context.finish({ error }); }
    finally { network.dispose(); sync.dispose(); context.dispose(); }
  })().catch(error => { throw error; });
}, { once: true });

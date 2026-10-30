/** Main-thread metadata only. This adapter does not create browser or Node workers. */
export function createScriptWorkerThreads() {
  return {
    isMainThread: true,
    isInternalThread: false,
    threadId: 0,
    threadName: '',
    parentPort: null,
    workerData: null,
    resourceLimits: {},
    MessageChannel: class MessageChannel {
      constructor(..._args: unknown[]) {
        throw Object.assign(new Error('worker_threads.MessageChannel Node message ports are not supported by the Vtron browser runtime'), { code: 'ERR_NOT_SUPPORTED' });
      }
    },
    Worker: class Worker {
      constructor(..._args: unknown[]) {
        throw Object.assign(new Error('worker_threads.Worker is not supported by the Vtron browser runtime; only main-thread metadata is available'), { code: 'ERR_NOT_SUPPORTED' });
      }
    },
  };
}

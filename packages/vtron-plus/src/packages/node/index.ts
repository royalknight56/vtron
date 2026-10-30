import type { System } from 'vtron';
import { node } from './node';

const installations = new WeakMap<System, () => void>();

/** Register the browser Node runtime for one desktop instance. */
export function installNodeSupport(system: System): () => void {
  const existing = installations.get(system);
  if (existing) return existing;
  const unregisterCommand = system.registerShellCommand({
    name: 'node',
    description: 'run JavaScript with Vtron fs/process',
    usage: 'node <FILE> [args] | node -e "code"',
    callback: node,
  });
  const dispose = () => {
    if (installations.get(system) !== dispose) return;
    unregisterCommand();
    installations.delete(system);
  };
  installations.set(system, dispose);
  return dispose;
}

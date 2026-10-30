import { resolve, exists, type VtronFileInterface } from 'vtron';
import type { SyncExistsQuery } from './syncFsBridge';

/** Query the actual Vtron backend; symbolic-link traversal is not yet supported. */
export function createVtronSyncExistsQuery(fs: Pick<VtronFileInterface, 'stat'>): SyncExistsQuery {
  return async (path, signal) => {
    if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\0') || resolve(path) !== path) {
      throw Object.assign(new Error('Expected a normalized absolute Vtron path'), { code: 'ERR_SYNC_FS_INVALID_PATH' });
    }
    return exists(fs, path, signal);
  };
}

// DOM-free exports used when bundling runtime consumers into a Worker.
export * from './util/Path';
export * from './kernel/file/operations';

export { watch, type VtronWatchEvent, type VtronWatchOptions, type VtronWatchHandle } from './kernel/file/watch';

export { readFileBytes, writeFileBytes } from './kernel/file/binary';

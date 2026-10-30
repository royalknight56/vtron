import { Gunzip } from 'fflate';

export const MAX_ARCHIVE_BYTES = 8 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 32 * 1024 * 1024;
const MAX_FILES = 6000;
const textDecoder = new TextDecoder('utf-8', { fatal: true });
const headerDecoder = new TextDecoder();

export type PackageArchive = { files: Map<string, string>; bytes: number; skipped: number };

function headerText(bytes: Uint8Array) { return headerDecoder.decode(bytes).replace(/\0.*$/s, ''); }

function tarNumber(bytes: Uint8Array) {
  const text = headerText(bytes).trim();
  if (!/^[0-7]*$/.test(text)) throw new Error('不支持此 npm 压缩包的 tar 数字格式');
  const value = parseInt(text || '0', 8);
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('npm 压缩包包含无效文件大小');
  return value;
}

function packagePath(path: string) {
  if (path.includes('\\') || path.includes('\0') || path.startsWith('/') || /^[A-Za-z]:/.test(path)) throw new Error('npm 压缩包包含不安全路径');
  const parts = path.replace(/^\.\//, '').replace(/\/$/, '').split('/');
  if (parts[0] !== 'package' || parts.some(part => part === '..' || part === '.')) throw new Error('npm 压缩包包含包目录之外的路径');
  parts.shift();
  if (parts.some(part => !part || part === 'node_modules')) throw new Error('npm 压缩包包含无效路径或内嵌 node_modules');
  return parts.join('/');
}

function paxValues(bytes: Uint8Array) {
  const values: Record<string, string> = {};
  let offset = 0;
  while (offset < bytes.length) {
    let space = offset;
    while (space < bytes.length && bytes[space] !== 32) space++;
    const lengthText = headerDecoder.decode(bytes.subarray(offset, space));
    if (!/^\d+$/.test(lengthText)) throw new Error('无效的 npm tar PAX 头');
    const length = Number(lengthText);
    if (length <= space - offset + 1 || offset + length > bytes.length) throw new Error('无效的 npm tar PAX 长度');
    const record = headerDecoder.decode(bytes.subarray(space + 1, offset + length)).replace(/\n$/, '');
    const equal = record.indexOf('=');
    if (equal > 0) Object.defineProperty(values, record.slice(0, equal), { value: record.slice(equal + 1), enumerable: true, configurable: true });
    offset += length;
  }
  return values;
}

export function unpackPackage(compressed: Uint8Array): PackageArchive {
  if (compressed.length > MAX_ARCHIVE_BYTES) throw new Error('npm 包压缩文件超过 8 MB 限制');
  const chunks: Uint8Array[] = [];
  let length = 0;
  const gunzip = new Gunzip(chunk => {
    length += chunk.length;
    if (length > MAX_EXPANDED_BYTES) throw new Error('npm 包解压后超过 32 MB 限制');
    chunks.push(chunk);
  });
  for (let offset = 0; offset < compressed.length; offset += 16 * 1024) gunzip.push(compressed.subarray(offset, offset + 16 * 1024), offset + 16 * 1024 >= compressed.length);
  const tar = new Uint8Array(length);
  let position = 0;
  for (const chunk of chunks) { tar.set(chunk, position); position += chunk.length; }
  const files = new Map<string, string>();
  let pendingPath: string | undefined;
  let pendingPax: Record<string, string> = {};
  let count = 0;
  let skipped = 0;
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;
    let checksum = 0;
    for (let index = 0; index < 512; index++) checksum += index >= 148 && index < 156 ? 32 : header[index];
    if (checksum !== tarNumber(header.subarray(148, 156))) throw new Error('npm 压缩包 tar 校验失败');
    const size = tarNumber(header.subarray(124, 136));
    if (size > MAX_EXPANDED_BYTES || offset + 512 + size > tar.length) throw new Error('npm 压缩包内容不完整或文件过大');
    const data = tar.subarray(offset + 512, offset + 512 + size);
    const type = header[156];
    const prefix = headerText(header.subarray(345, 500));
    const headerPath = (prefix ? prefix + '/' : '') + headerText(header.subarray(0, 100));
    offset += 512 + Math.ceil(size / 512) * 512;
    if (type === 120) { pendingPax = paxValues(data); continue; }
    if (type === 103) continue;
    if (type === 76) { pendingPath = headerText(data).replace(/\n$/, ''); continue; }
    const path = packagePath(pendingPax.path || pendingPath || headerPath);
    pendingPath = undefined; pendingPax = {};
    if (!path || type === 53) continue;
    if (++count > MAX_FILES) throw new Error('npm 包文件数超过 6000 个限制');
    if (type === 49 || type === 50) { skipped++; continue; }
    if (type !== 0 && type !== 48) throw new Error('npm 包包含不支持的 tar 文件类型');
    if (files.has(path)) throw new Error(`npm 包包含重复文件：${path}`);
    if (/\.(?:node|dll|dylib|so|exe)$/i.test(path) || /(?:^|\/)binding\.gyp$/i.test(path) || data[0] === 0x7f && data[1] === 69 && data[2] === 76 && data[3] === 70) throw new Error(`暂不支持原生模块或可执行二进制：${path}`);
    try {
      const text = textDecoder.decode(data);
      if (text.includes('\0')) throw new Error('binary');
      files.set(path, text);
    } catch {
      if (/\.(?:[cm]?js|json)$/i.test(path)) throw new Error(`代码文件不是有效的 UTF-8 文本：${path}`);
      skipped++;
    }
  }
  if (!files.has('package.json')) throw new Error('npm 压缩包缺少 package.json');
  return { files, bytes: length, skipped };
}

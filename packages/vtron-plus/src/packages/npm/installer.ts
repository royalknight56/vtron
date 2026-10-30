import { writeFileBytes } from 'vtron';
import { maxSatisfying, satisfies, valid, validRange } from 'semver';
import { dirname, join, normalize, type System } from 'vtron';
import { MAX_ARCHIVE_BYTES, unpackPackage, type PackageArchive } from './archive';

export type NpmInstallOptions = {
  registry?: string;
  save?: boolean;
  signal?: AbortSignal;
  output: (text: string) => void;
};
export type PackageManifest = {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  type?: string;
  bin?: string | Record<string, string>;
  main?: string;
  exports?: unknown;
  dist?: { tarball?: string; integrity?: string; shasum?: string };
};
type RegistryDocument = { versions: Record<string, PackageManifest>; 'dist-tags'?: Record<string, string> };
type ResolvedPackage = { manifest: PackageManifest; archive: PackageArchive };
type Commit = { target: string; backup?: string; installed: boolean };
const installing = new WeakMap<System, Set<string>>();
const MAX_PACKAGES = 128;
const MAX_TOTAL_BYTES = 64 * 1024 * 1024;

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) throw Object.assign(new Error('npm 安装已取消'), { name: 'AbortError' });
}
function packageName(name: string) {
  if (!/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i.test(name) || name.length > 214 || name === 'node_modules') throw new Error(`不支持的 npm 包名：${name}`);
  return name;
}
export function parsePackageSpec(spec: string) {
  const match = spec.match(/^(@[^/]+\/[^@]+|[^@/]+)(?:@(.+))?$/);
  if (!match) throw new Error(`不支持的包参数：${spec}；请使用包名、包名@版本或 @scope/包名@版本`);
  const name = packageName(match[1]);
  const range = match[2] || 'latest';
  if (!validRange(range) && !/^[A-Za-z][A-Za-z0-9._-]*$/.test(range)) throw new Error(`暂不支持依赖来源：${range}（仅支持 npm registry 版本、tag 和 semver 范围）`);
  return { name, range };
}
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function readManifest(text: string, label: string): Record<string, unknown> {
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error(`${label} 不是有效的 JSON`); }
  if (!object(value)) throw new Error(`${label} 必须是 JSON 对象`);
  return value;
}
function httpURL(input: string, label: string) {
  let url: URL;
  try { url = new URL(input); } catch { throw new Error(`${label} 必须是完整的 HTTP(S) 地址`); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(`${label} 只支持不含用户名密码的 HTTP(S) 地址`);
  return url;
}
async function responseBytes(response: Response, limit: number, signal?: AbortSignal) {
  if (!response.ok) throw new Error(`npm 下载失败：HTTP ${response.status}`);
  if (Number(response.headers.get('content-length')) > limit) throw new Error('npm 下载内容超过大小限制');
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > limit) throw new Error('npm 下载内容超过大小限制');
    return bytes;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      abortIfNeeded(signal);
      const chunk = await reader.read(); if (chunk.done) break;
      length += chunk.value.length;
      if (length > limit) throw new Error('npm 下载内容超过大小限制');
      chunks.push(chunk.value);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}
async function verifyArchive(bytes: Uint8Array, dist: NonNullable<PackageManifest['dist']>) {
  if (!globalThis.crypto?.subtle) throw new Error('npm 完整性校验需要 HTTPS 或 localhost 的 Web Crypto 环境');
  const entries = (dist.integrity || '').split(/\s+/).map(value => value.match(/^(sha512|sha256|sha1)-([A-Za-z0-9+/]+={0,2})(?:\?.*)?$/)).filter(Boolean) as RegExpMatchArray[];
  for (const algorithm of ['sha512', 'sha256', 'sha1']) {
    const expected = entries.filter(entry => entry[1] === algorithm);
    if (!expected.length) continue;
    const digest = new Uint8Array(await crypto.subtle.digest(algorithm.replace('sha', 'SHA-'), new Uint8Array(bytes).buffer));
    const encoded = btoa(String.fromCharCode(...digest));
    if (!expected.some(entry => entry[2] === encoded)) throw new Error('npm 压缩包完整性校验失败');
    return;
  }
  if (dist.shasum && /^[a-f0-9]{40}$/i.test(dist.shasum)) {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-1', new Uint8Array(bytes).buffer));
    if (Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('') !== dist.shasum.toLowerCase()) throw new Error('npm 压缩包 SHA-1 校验失败');
    return;
  }
  throw new Error('npm 包没有受支持的完整性校验值');
}

export async function installPackages(system: System, currentDirectory: string, specs: string[], options: NpmInstallOptions): Promise<void> {
  const cwd = normalize(currentDirectory);
  let projects = installing.get(system);
  if (!projects) { projects = new Set(); installing.set(system, projects); }
  if (projects.has(cwd)) throw new Error('当前目录已有 npm 安装正在运行');
  projects.add(cwd);
  try { await install(system, cwd, specs, options); }
  finally { projects.delete(cwd); }
}

async function install(system: System, cwd: string, specs: string[], options: NpmInstallOptions) {
  const signal = options.signal;
  const fs = system.fs;
  const output = options.output;
  abortIfNeeded(signal);
  if (!(await fs.stat(cwd))?.isDirectory) throw new Error('npm 当前工作目录不存在');
  if (!specs.length) { output('没有需要安装的依赖\r\n'); return; }
  const requested = specs.map(parsePackageSpec);
  if (new Set(requested.map(item => item.name)).size !== requested.length) throw new Error('一次安装不能重复指定同一个包');
  const registry = httpURL(options.registry || 'https://registry.npmjs.org/', 'registry');
  if (registry.search || registry.hash) throw new Error('registry 地址不能包含查询参数或片段');
  if (!registry.pathname.endsWith('/')) registry.pathname += '/';
  const manifestPath = join(cwd, 'package.json');
  const oldManifest = await fs.readFile(manifestPath);
  const project = oldManifest === null ? { private: true } : readManifest(oldManifest, '项目 package.json');
  if (project.dependencies !== undefined && !object(project.dependencies)) throw new Error('项目 dependencies 必须是对象');
  const stage = join(cwd, '.vtron-npm-stage-' + crypto.randomUUID());
  const stageModules = join(stage, 'node_modules');
  const commits: Commit[] = [];
  const createdParents: string[] = [];
  const metadata = new Map<string, Promise<RegistryDocument>>();
  const packages = new Map<string, Promise<ResolvedPackage>>();
  const roots = new Map<string, string>();
  let packageCount = 0;
  let totalBytes = 0;
  let nextManifest: string | undefined;
  let manifestWritten = false;

  async function mkdirp(path: string, record = false) {
    const existing = await fs.stat(path);
    if (existing) { if (!existing.isDirectory) throw new Error(`目标不是文件夹：${path}`); return; }
    const parent = dirname(path);
    if (parent === path) throw new Error(`无法创建文件夹：${path}`);
    await mkdirp(parent, record);
    await fs.mkdir(path);
    if (record) createdParents.push(path);
  }
  function registryDocument(name: string) {
    let pending = metadata.get(name);
    if (!pending) {
      pending = (async () => {
        const response = await system.scriptRuntime.fetch(new URL(encodeURIComponent(name), registry), { signal, headers: { accept: 'application/vnd.npm.install-v1+json' } });
        const raw = new TextDecoder().decode(await responseBytes(response, 12 * 1024 * 1024, signal));
        const document = readManifest(raw, `${name} registry 元数据`);
        if (!object(document.versions)) throw new Error(`registry 未返回 ${name} 的版本信息`);
        return document as RegistryDocument;
      })();
      metadata.set(name, pending);
    }
    return pending;
  }
  async function resolvePackage(name: string, range: string) {
    abortIfNeeded(signal);
    const document = await registryDocument(name);
    const tagged = document['dist-tags']?.[range];
    const version = tagged || (valid(range) ? range : maxSatisfying(Object.keys(document.versions), range));
    if (!version || !document.versions[version]) throw new Error(`找不到满足 ${name}@${range} 的版本`);
    const key = `${name}@${version}`;
    let pending = packages.get(key);
    if (!pending) {
      pending = (async () => {
        const manifest = document.versions[version];
        if (manifest.name !== name || manifest.version !== version || !manifest.dist?.tarball) throw new Error(`无效的 npm 包元数据：${key}`);
        output(`下载 ${key}\r\n`);
        const url = httpURL(manifest.dist.tarball, 'tarball');
        const response = await system.scriptRuntime.fetch(url, { signal });
        const bytes = await responseBytes(response, MAX_ARCHIVE_BYTES, signal);
        await verifyArchive(bytes, manifest.dist);
        abortIfNeeded(signal);
        const archive = unpackPackage(bytes);
        const manifestText = archive.files.get('package.json');
        if (typeof manifestText !== 'string') throw new Error('package.json must be UTF-8 text');
        const packaged = readManifest(manifestText, `${key} package.json`);
        if (packaged.name !== name || packaged.version !== version) throw new Error(`npm 包内容与元数据不一致：${key}`);
        if (archive.skipped) output(`${key}：跳过 ${archive.skipped} 个链接\r\n`);
        if (manifest.scripts?.preinstall || manifest.scripts?.install || manifest.scripts?.postinstall) output(`${key}：跳过安装脚本\r\n`);
        return { manifest, archive };
      })();
      packages.set(key, pending);
    }
    return pending;
  }
  async function writePackage(name: string, range: string, destination: string, ancestors: { name: string; version: string }[]) {
    abortIfNeeded(signal);
    if (ancestors.some(item => item.name === name && validRange(range) && satisfies(item.version, range))) return;
    const resolved = await resolvePackage(name, range);
    if (ancestors.some(item => item.name === name && item.version === resolved.manifest.version)) return;
    if (++packageCount > MAX_PACKAGES || ancestors.length > 32) throw new Error('npm 安装超过 128 个包或 32 层依赖限制');
    totalBytes += resolved.archive.bytes;
    if (totalBytes > MAX_TOTAL_BYTES) throw new Error('本次 npm 安装解压总量超过 64 MB 限制');
    await mkdirp(destination);
    for (const [path, value] of resolved.archive.files) {
      abortIfNeeded(signal);
      const target = join(destination, path);
      await mkdirp(dirname(target));
      if (typeof value === 'string') await fs.writeFile(target, value, { flag: 'wx' });
      else await writeFileBytes(fs, target, value, { flag: 'wx' });
    }
    const dependencies = resolved.manifest.dependencies || {};
    if (!object(dependencies)) throw new Error(`无效 dependencies：${name}`);
    const nextAncestors = [...ancestors, { name, version: resolved.manifest.version }];
    for (const [dependency, version] of Object.entries(dependencies)) {
      packageName(dependency);
      if (typeof version !== 'string') throw new Error(`无效依赖版本：${dependency}`);
      parsePackageSpec(`${dependency}@${version}`);
      await writePackage(dependency, version, join(destination, 'node_modules', dependency), nextAncestors);
    }
    return resolved.manifest.version;
  }

  async function rollback() {
    const errors: string[] = [];
    if (manifestWritten || nextManifest && await fs.readFile(manifestPath).catch(() => null) === nextManifest) {
      try { if (oldManifest === null) await fs.unlink(manifestPath); else await fs.writeFile(manifestPath, oldManifest); }
      catch (error) { errors.push(`恢复 package.json 失败：${String(error)}`); }
    }
    for (const commit of [...commits].reverse()) {
      try {
        if (commit.installed && await fs.stat(commit.target)) await fs.rm(commit.target);
        if (commit.backup) await fs.rename(commit.backup, commit.target, { overwrite: false });
      } catch (error) { errors.push(`恢复 ${commit.target} 失败：${String(error)}`); }
    }
    for (const path of [...createdParents].reverse()) {
      try { if ((await fs.readdir(path)).length === 0) await fs.rmdir(path); } catch { /* Keep concurrent/user-created content. */ }
    }
    return errors;
  }
  try {
    await mkdirp(stageModules);
    for (const item of requested) {
      const version = await writePackage(item.name, item.range, join(stageModules, item.name), []);
      if (!version) throw new Error(`无法安装 ${item.name}`);
      roots.set(item.name, version);
    }
    abortIfNeeded(signal);
    if (options.save !== false) nextManifest = JSON.stringify({ ...project, dependencies: { ...(project.dependencies || {}), ...Object.fromEntries(roots) } }, null, 2) + '\n';
    for (const [name] of roots) {
      abortIfNeeded(signal);
      const target = join(cwd, 'node_modules', name);
      await mkdirp(dirname(target), true);
      const commit: Commit = { target, installed: false };
      commits.push(commit);
      if (await fs.stat(target)) {
        const backup = join(stage, 'backup', name);
        await mkdirp(dirname(backup));
        await fs.rename(target, backup, { overwrite: false });
        commit.backup = backup;
      }
      await fs.rename(join(stageModules, name), target, { overwrite: false });
      commit.installed = true;
    }
    if (nextManifest !== undefined) {
      abortIfNeeded(signal);
      if (await fs.readFile(manifestPath) !== oldManifest) throw new Error('安装期间 package.json 已被修改，请重试');
      await fs.writeFile(manifestPath, nextManifest, { flag: oldManifest === null ? 'wx' : 'w' });
      manifestWritten = true;
    }
    output(`已安装 ${packageCount} 个包到 ${join(cwd, 'node_modules')}\r\n`);
    output('轻量模式：不执行安装脚本、不生成 bin 命令，仅支持可在 Vtron 中运行的纯 JavaScript 包。\r\n');
    system.emitEvent('file.props.edit');
  } catch (error) {
    const errors = await rollback();
    if (errors.length) throw new Error(`${String(error)}\n${errors.join('\n')}\n安装备份保留在 ${stage}`);
    try { if (await fs.stat(stage)) await fs.rm(stage); } catch { output(`临时目录清理失败：${stage}\r\n`); }
    throw error;
  }
  try { if (await fs.stat(stage)) await fs.rm(stage); } catch { output(`临时目录清理失败：${stage}\r\n`); }
}

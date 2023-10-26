/**
 * 感谢 Deno 的开源项目 deno std,所有权利归 deno std 所有
 * Thanks to the open source project deno std of Deno, all rights belong to deno std
 * https://github.com/denoland/deno_std
 */
export const CHAR_UPPERCASE_A = 65; /* A */
export const CHAR_LOWERCASE_A = 97; /* a */
export const CHAR_UPPERCASE_Z = 90; /* Z */
export const CHAR_LOWERCASE_Z = 122; /* z */
export const CHAR_DOT = 46; /* . */
export const CHAR_COLON = 58; /* : */
export const CHAR_FORWARD_SLASH = 47; /* / */
export const CHAR_BACKWARD_SLASH = 92; /* \ */
/** Make an assertion, if not `true`, then throw. */
export function assert(expr: unknown, msg = ''): asserts expr {
  if (!expr) {
    throw new Error(msg);
  }
}
export function isPosixPathSeparator(code: number): boolean {
  return code === CHAR_FORWARD_SLASH;
}

export function isPathSeparator(code: number): boolean {
  return isPosixPathSeparator(code) || code === CHAR_BACKWARD_SLASH;
}
export function assertPath(path: string) {
  if (typeof path !== 'string') {
    throw new TypeError(`Path must be a string. Received ${JSON.stringify(path)}`);
  }
}
export function isWindowsDeviceRoot(code: number): boolean {
  return (
    (code >= CHAR_LOWERCASE_A && code <= CHAR_LOWERCASE_Z) ||
    (code >= CHAR_UPPERCASE_A && code <= CHAR_UPPERCASE_Z)
  );
}

export function lastPathSegment(path: string, isSep: (char: number) => boolean, start = 0): string {
  let matchedNonSeparator = false;
  let end = path.length;

  for (let i = path.length - 1; i >= start; --i) {
    if (isSep(path.charCodeAt(i))) {
      if (matchedNonSeparator) {
        start = i + 1;
        break;
      }
    } else if (!matchedNonSeparator) {
      matchedNonSeparator = true;
      end = i + 1;
    }
  }

  return path.slice(start, end);
}

export function stripTrailingSeparators(segment: string, isSep: (char: number) => boolean): string {
  if (segment.length <= 1) {
    return segment;
  }

  let end = segment.length;

  for (let i = segment.length - 1; i > 0; i--) {
    if (isSep(segment.charCodeAt(i))) {
      end = i;
    } else {
      break;
    }
  }

  return segment.slice(0, end);
}

export function stripSuffix(name: string, suffix: string): string {
  if (suffix.length >= name.length) {
    return name;
  }

  const lenDiff = name.length - suffix.length;

  for (let i = suffix.length - 1; i >= 0; --i) {
    if (name.charCodeAt(lenDiff + i) !== suffix.charCodeAt(i)) {
      return name;
    }
  }

  return name.slice(0, -suffix.length);
}

// Resolves . and .. elements in a path with directory names
export function normalizeString(
  path: string,
  allowAboveRoot: boolean,
  separator: string,
  isPathSeparator: (code: number) => boolean
): string {
  let res = '';
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code: number | undefined;
  for (let i = 0, len = path.length; i <= len; ++i) {
    if (i < len) code = path.charCodeAt(i);
    else if (isPathSeparator(code!)) break;
    else code = CHAR_FORWARD_SLASH;

    if (isPathSeparator(code!)) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (
          res.length < 2 ||
          lastSegmentLength !== 2 ||
          res.charCodeAt(res.length - 1) !== CHAR_DOT ||
          res.charCodeAt(res.length - 2) !== CHAR_DOT
        ) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex === -1) {
              res = '';
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
            }
            lastSlash = i;
            dots = 0;
            continue;
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0) res += `${separator}..`;
          else res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) res += separator + path.slice(lastSlash + 1, i);
        else res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === CHAR_DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
/**
 * Normalize the `path`, resolving `'..'` and `'.'` segments.
 * Note that resolving these segments does not necessarily mean that all will be eliminated.
 * A `'..'` at the top-level will be preserved, and an empty path is canonically `'.'`.
 * @param path to be normalized
 */
export function normalize(path: string): string {
  assertPath(path);

  if (path.length === 0) return '.';

  const isAbsolute = isPosixPathSeparator(path.charCodeAt(0));
  const trailingSeparator = isPosixPathSeparator(path.charCodeAt(path.length - 1));

  // Normalize the path
  path = normalizeString(path, !isAbsolute, '/', isPosixPathSeparator);

  if (path.length === 0 && !isAbsolute) path = '.';
  if (path.length > 0 && trailingSeparator) path += '/';

  if (isAbsolute) return `/${path}`;
  return path;
}

/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 * @param paths to be joined and normalized
 */
export function join(...paths: string[]): string {
  if (paths.length === 0) return '.';
  let joined: string | undefined;
  for (let i = 0, len = paths.length; i < len; ++i) {
    const path = paths[i];
    assertPath(path);
    if (path.length > 0) {
      if (!joined) joined = path;
      else joined += `/${path}`;
    }
  }
  if (!joined) return '.';
  return normalize(joined);
}

/**
 * Return the last portion of a `path`.
 * Trailing directory separators are ignored, and optional suffix is removed.
 *
 * @param path - path to extract the name from.
 * @param [suffix] - suffix to remove from extracted name.
 */
export function basename(path: string, suffix = ''): string {
  assertPath(path);

  if (path.length === 0) return path;

  if (typeof suffix !== 'string') {
    throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
  }

  const lastSegment = lastPathSegment(path, isPosixPathSeparator);
  const strippedSegment = stripTrailingSeparators(lastSegment, isPosixPathSeparator);
  return suffix ? stripSuffix(strippedSegment, suffix) : strippedSegment;
}

/**
 * Return the directory path of a `path`.
 * @param path - path to extract the directory from.
 */
export function dirname(path: string): string {
  if (path.length === 0) return '.';

  let end = -1;
  let matchedNonSeparator = false;

  for (let i = path.length - 1; i >= 1; --i) {
    if (isPosixPathSeparator(path.charCodeAt(i))) {
      if (matchedNonSeparator) {
        end = i;
        break;
      }
    } else {
      matchedNonSeparator = true;
    }
  }

  // No matches. Fallback based on provided path:
  //
  // - leading slashes paths
  //     "/foo" => "/"
  //     "///foo" => "/"
  // - no slash path
  //     "foo" => "."
  if (end === -1) {
    return isPosixPathSeparator(path.charCodeAt(0)) ? '/' : '.';
  }

  return stripTrailingSeparators(path.slice(0, end), isPosixPathSeparator);
}

/**
 * Return the extension of the `path` with leading period.
 * @param path with extension
 * @returns extension (ex. for `file.ts` returns `.ts`)
 */
export function extname(path: string): string {
  assertPath(path);
  let startDot = -1;
  let startPart = 0;
  let end = -1;
  let matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  let preDotState = 0;
  for (let i = path.length - 1; i >= 0; --i) {
    const code = path.charCodeAt(i);
    if (isPosixPathSeparator(code)) {
      // If we reached a path separator that was not part of a set of path
      // separators at the end of the string, stop now
      if (!matchedSlash) {
        startPart = i + 1;
        break;
      }
      continue;
    }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === CHAR_DOT) {
      // If this is our first dot, mark it as the start of our extension
      if (startDot === -1) startDot = i;
      else if (preDotState !== 1) preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (
    startDot === -1 ||
    end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
  ) {
    return '';
  }
  return path.slice(startDot, end);
}

export function filename(path: string): string {
  const base = basename(path);
  const ext = extname(path);
  return base.slice(0, base.length - ext.length);
}

export function transformPath(path: string): string {
  if (path === '/') {
    return path;
  } else if (path.endsWith('/')) {
    return path.slice(0, path.length - 1);
  } else {
    return path;
  }
}

// import { assertPath } from "./assert_path.ts";

export function assertArgs(from: string, to: string) {
  assertPath(from);
  assertPath(to);
  if (from === to) return '';
}

// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

// import { normalizeString } from "../_common/normalize_string.ts";
// import { assertPath } from "../_common/assert_path.ts";

/**
 * Resolves path segments into a `path`
 * @param pathSegments to process to path
 */
export function resolve(...pathSegments: string[]): string {
  let resolvedPath = '';
  let resolvedAbsolute = false;

  for (let i = pathSegments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    let path: string;

    if (i >= 0) path = pathSegments[i];
    else {
      // deno-lint-ignore no-explicit-any
      const { Deno } = globalThis as any;
      if (typeof Deno?.cwd !== 'function') {
        throw new TypeError('Resolved a relative path without a CWD.');
      }
      path = Deno.cwd();
    }

    assertPath(path);

    // Skip empty entries
    if (path.length === 0) {
      continue;
    }

    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = isPosixPathSeparator(path.charCodeAt(0));
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when Deno.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, '/', isPosixPathSeparator);

  if (resolvedAbsolute) {
    if (resolvedPath.length > 0) return `/${resolvedPath}`;
    else return '/';
  } else if (resolvedPath.length > 0) return resolvedPath;
  else return '.';
}

// import { isPosixPathSeparator } from "./_util.ts";
// import { resolve } from "./resolve.ts";
// import { assertArgs } from "../_common/relative.ts";

/**
 * Return the relative path from `from` to `to` based on current working directory.
 *
 * @param from path in current working directory
 * @param to path in current working directory
 */
export function relative(from: string, to: string): string {
  assertArgs(from, to);

  from = resolve(from);
  to = resolve(to);

  if (from === to) return '';

  // Trim any leading backslashes
  let fromStart = 1;
  const fromEnd = from.length;
  for (; fromStart < fromEnd; ++fromStart) {
    if (!isPosixPathSeparator(from.charCodeAt(fromStart))) break;
  }
  const fromLen = fromEnd - fromStart;

  // Trim any leading backslashes
  let toStart = 1;
  const toEnd = to.length;
  for (; toStart < toEnd; ++toStart) {
    if (!isPosixPathSeparator(to.charCodeAt(toStart))) break;
  }
  const toLen = toEnd - toStart;

  // Compare paths to find the longest common path from root
  const length = fromLen < toLen ? fromLen : toLen;
  let lastCommonSep = -1;
  let i = 0;
  for (; i <= length; ++i) {
    if (i === length) {
      if (toLen > length) {
        if (isPosixPathSeparator(to.charCodeAt(toStart + i))) {
          // We get here if `from` is the exact base path for `to`.
          // For example: from='/foo/bar'; to='/foo/bar/baz'
          return to.slice(toStart + i + 1);
        } else if (i === 0) {
          // We get here if `from` is the root
          // For example: from='/'; to='/foo'
          return to.slice(toStart + i);
        }
      } else if (fromLen > length) {
        if (isPosixPathSeparator(from.charCodeAt(fromStart + i))) {
          // We get here if `to` is the exact base path for `from`.
          // For example: from='/foo/bar/baz'; to='/foo/bar'
          lastCommonSep = i;
        } else if (i === 0) {
          // We get here if `to` is the root.
          // For example: from='/foo'; to='/'
          lastCommonSep = 0;
        }
      }
      break;
    }
    const fromCode = from.charCodeAt(fromStart + i);
    const toCode = to.charCodeAt(toStart + i);
    if (fromCode !== toCode) break;
    else if (isPosixPathSeparator(fromCode)) lastCommonSep = i;
  }

  let out = '';
  // Generate the relative path based on the path difference between `to`
  // and `from`
  for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
    if (i === fromEnd || isPosixPathSeparator(from.charCodeAt(i))) {
      if (out.length === 0) out += '..';
      else out += '/..';
    }
  }

  // Lastly, append the rest of the destination (`to`) path that comes after
  // the common path parts
  if (out.length > 0) return out + to.slice(toStart + lastCommonSep);
  else {
    toStart += lastCommonSep;
    if (isPosixPathSeparator(to.charCodeAt(toStart))) ++toStart;
    return to.slice(toStart);
  }
}

/**
 * Verifies whether provided path is absolute
 * @param path to be verified as absolute
 */
export function isAbsolute(path: string): boolean {
  assertPath(path);
  return path.length > 0 && isPosixPathSeparator(path.charCodeAt(0));
}

/**
 *
 * @param parent
 * @param dir
 * @returns
 * @description 判断 dir 是否是 parent 的子目录
 * // [/foo, /foo] => false ()
 * // [/foo, /bar] => false (..\bar)
 * // [/foo, /foobar] => false (..\foobar)
 * // [/foo, /foo/bar] => true (bar)
 * // [/foo, /foo/../bar] => false (..\bar)
 * // [/foo, /foo/./bar] => true (bar)
 * // [/bar/../foo, /foo/bar] => true (bar)
 * // [/foo, ./bar] => false (..\Users\kozhevnikov\Desktop\bar)
 */
export function isChildPath(parent: string, dir: string) {
  const relativeRes = relative(parent, dir);
  return relativeRes && !relativeRes.startsWith('..') && !isAbsolute(relativeRes);
}

type TextOperand = string | number | boolean | undefined;

export const textArity = new Map<string, [number, number]>([
  ['LEN', [1, 1]], ['UPPER', [1, 1]], ['LOWER', [1, 1]], ['TRIM', [1, 1]], ['CLEAN', [1, 1]],
  ['EXACT', [2, 2]], ['LEFT', [1, 2]], ['RIGHT', [1, 2]], ['MID', [3, 3]],
  ['FIND', [2, 3]], ['SEARCH', [2, 3]], ['REPLACE', [4, 4]], ['SUBSTITUTE', [3, 4]],
]);

export function asText(value: TextOperand) {
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return String(value ?? '');
}

export function joinText(values: TextOperand[]) {
  let result = '';
  for (const value of values) {
    const part = asText(value);
    if (result.length + part.length > 32767) return null;
    result += part;
  }
  return result;
}

// Each star separates fixed-width segments. Their earliest matches leave the most room for later segments.
function searchOffset(pattern: string, text: string, unicode: boolean): number {
  const segments = [''];
  for (const token of pattern.match(/~[?*~]|[\s\S]/gu) || []) {
    if (token === '*') segments.push('');
    else {
      const literal = token.startsWith('~') && token.length === 2 ? token[1] : token;
      segments[segments.length - 1] += token === '?' ? '[\\s\\S]' : literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  let first = 0, next = 0;
  for (const [index, segment] of segments.entries()) {
    if (!segment) continue;
    const expression = new RegExp(segment, unicode ? 'giu' : 'gi');
    expression.lastIndex = next;
    const match = expression.exec(text);
    if (!match) return -1;
    if (index === 0) first = match.index;
    next = expression.lastIndex;
  }
  return first;
}

function substitute(source: string, oldText: string, replacement: string, occurrence?: number) {
  if (!oldText) return source;
  if (occurrence === undefined) {
    const parts = source.split(oldText);
    const length = source.length + (replacement.length - oldText.length) * (parts.length - 1);
    return length <= 32767 ? parts.join(replacement) : null;
  }
  let start = 0;
  for (let i = 1; i <= occurrence; i++) {
    const index = source.indexOf(oldText, start);
    if (index < 0) return source;
    start = index + oldText.length;
    if (i === occurrence) return joinText([source.slice(0, index), replacement, source.slice(start)]);
  }
  return source;
}

// null denotes an invalid text-function result (#VALUE!); a valid empty string stays distinct.
export function calculateText(name: string, args: TextOperand[], unicode: boolean) {
  const source = asText(args[0]);
  const chars = (text: string) => unicode ? Array.from(text) : text.split('');
  const integer = (index: number, fallback = 0) => {
    if (index >= args.length) return fallback;
    const value = Number(args[index] ?? 0);
    return Number.isFinite(value) ? Math.trunc(value) : NaN;
  };
  switch (name) {
    case 'LEN': return unicode ? Array.from(source).length : source.length;
    case 'UPPER': return joinText([source.toUpperCase()]);
    case 'LOWER': return joinText([source.toLowerCase()]);
    case 'TRIM': return source.replace(/ +/g, ' ').replace(/^ | $/g, '');
    case 'CLEAN': return source.replace(/[\x00-\x1f]/g, '');
    case 'EXACT': return source === asText(args[1]);
    case 'SUBSTITUTE': {
      const occurrence = integer(3, 1);
      return occurrence > 0 ? substitute(source, asText(args[1]), asText(args[2]), args.length === 4 ? occurrence : undefined) : null;
    }
    case 'LEFT':
    case 'RIGHT': {
      const count = integer(1, 1);
      if (!(count >= 0)) return null;
      const letters = chars(source);
      return (name === 'LEFT' ? letters.slice(0, count) : letters.slice(Math.max(0, letters.length - count))).join('');
    }
    case 'MID':
    case 'REPLACE': {
      const start = integer(1) - 1, count = integer(2);
      if (!(start >= 0 && count >= 0)) return null;
      const letters = chars(source);
      if (name === 'MID') return letters.slice(start, start + count).join('');
      return joinText([letters.slice(0, start).join(''), args[3], letters.slice(start + count).join('')]);
    }
    case 'FIND':
    case 'SEARCH': {
      const letters = chars(asText(args[1]));
      const start = integer(2, 1) - 1;
      if (!(start >= 0 && start < Math.max(1, letters.length))) return null;
      const remaining = letters.slice(start).join('');
      const offset = name === 'FIND' ? remaining.indexOf(source) : searchOffset(source, remaining, unicode);
      if (offset < 0) return null;
      return start + chars(remaining.slice(0, offset)).length + 1;
    }
    default: return null;
  }
}

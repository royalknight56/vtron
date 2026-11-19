export const numericInput = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

// Match Excel wildcards without treating user-supplied criteria as regular expressions.
export function wildcardMatch(tokens: string[], text: string) {
  let i = 0,
    j = 0,
    star = -1,
    restart = 0;
  while (i < text.length) {
    const token = tokens[j];
    if (token === '*') {
      star = j++;
      restart = i;
    } else if (
      token === '?' ||
      (token !== undefined && (token.length === 2 ? token[1] : token) === text[i])
    ) {
      i++;
      j++;
    } else if (star >= 0) {
      j = star + 1;
      i = ++restart;
    } else return false;
  }
  return tokens.slice(j).every((token) => token === '*');
}
export function criterionMatcher(criterion: string | number | boolean) {
  const [, op = '=', operand] = /^(<=|>=|<>|<|>|=)?([\s\S]*)$/.exec(String(criterion))!;
  const text = operand.toLowerCase();
  const numeric = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text);
  const wildcard = (op === '=' || op === '<>') && /[?*~]/.test(text);
  const tokens = wildcard ? text.match(/~[?*~]|[\s\S]/g) || [] : [];
  return (value: string | number | boolean) => {
    if (wildcard) {
      const match = typeof value === 'string' && value !== '' && wildcardMatch(tokens, value.toLowerCase());
      return op === '<>' ? !match : match;
    }
    let comparison: number;
    if (numeric) {
      if (value === '' || typeof value === 'boolean' || !Number.isFinite(Number(value))) return op === '<>';
      comparison = Number(value) - Number(text);
    } else if (typeof criterion === 'boolean') {
      return value === criterion;
    } else {
      if (typeof value !== 'string') return op === '<>';
      const actual = value.toLowerCase();
      comparison = actual === text ? 0 : actual < text ? -1 : 1;
    }
    switch (op) {
      case '<>':
        return comparison !== 0;
      case '<':
        return comparison < 0;
      case '<=':
        return comparison <= 0;
      case '>':
        return comparison > 0;
      case '>=':
        return comparison >= 0;
      default:
        return comparison === 0;
    }
  };
}

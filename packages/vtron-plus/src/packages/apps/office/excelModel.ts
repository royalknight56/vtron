export interface CellData {
  v: string;
  b?: boolean;
  i?: boolean;
  u?: boolean;
  a?: 'left' | 'center' | 'right';
  bg?: string;
  fc?: string;
  ff?: string;
  fs?: number;
  wrap?: boolean;
  border?: boolean;
  fmt?: 'general' | 'number' | 'currency' | 'percent' | 'date';
}
export interface Merge {
  r: number;
  c: number;
  er: number;
  ec: number;
}
export interface Sheet {
  name: string;
  cells: Record<string, CellData>;
  widths?: Record<number, number>;
  heights?: Record<number, number>;
  merges?: Merge[];
  frozenRows?: number;
  frozenCols?: number;
  showGridLines?: boolean;
  showFormulas?: boolean;
  zoom?: number;
}
export interface Workbook {
  sheets: Sheet[];
}
export const cellKey = (r: number, c: number) => `${r},${c}`;
export function colName(idx: number): string {
  let name = '';
  for (let n = idx; n >= 0; n = Math.floor(n / 26) - 1) name = String.fromCharCode(65 + (n % 26)) + name;
  return name;
}
export function address(r: number, c: number) {
  return `${colName(c)}${r + 1}`;
}
export function parseAddress(value: string): { r: number; c: number } | null {
  const match = /^\$?([A-Z]{1,3})\$?([1-9]\d*)$/i.exec(value.trim());
  if (!match) return null;
  let col = 0;
  for (const ch of match[1].toUpperCase()) col = col * 26 + ch.charCodeAt(0) - 64;
  const r = Number(match[2]) - 1;
  return r < 10000 && col <= 256 ? { r, c: col - 1 } : null;
}
interface FormulaRef {
  qualifier: string;
  address: string;
}
const sheetPrefix = /(?:'(?:[^']|'')+'|(?:\[[^\]]+\])?[A-Za-z_\u0080-\uFFFF][\w.\u0080-\uFFFF]*)!/.source;
const formulaErrorToken = new RegExp(`^(?:${sheetPrefix})?(#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!)`, 'i');
const a1Token = `(${sheetPrefix})?(\\$?[A-Za-z]{1,3}\\$?[1-9]\\d*)(?![\\w.\\u0080-\\uFFFF(])`;
// Skip quoted text and structured-reference labels, and keep both ends of an A1 range together.
const formulaAreas = new RegExp(
  `"(?:[^"]|"")*"|(?<![\\w.\\u0080-\\uFFFF])${a1Token}(?:(\\s*:\\s*)${a1Token})?|\\[[^\\]]*\\]`, 'g'
);
export function mapFormulaAreas(
  formula: string,
  map: (first: FormulaRef, last: FormulaRef | undefined, separator: string) => string | undefined
) {
  return formula.replace(formulaAreas, (token, sheet1, a1, separator, sheet2, a2) => {
    if (!a1) return token;
    const last = a2 ? { qualifier: sheet2 || '', address: a2 } : undefined;
    return map({ qualifier: sheet1 || '', address: a1 }, last, separator || '') ?? token;
  });
}
export function shiftFormula(value: string, dr: number, dc: number) {
  if (!value.startsWith('=')) return value;
  function shift(ref: FormulaRef) {
    const coord = parseAddress(ref.address);
    if (!coord) return ref.qualifier + ref.address;
    const fixedCol = ref.address.startsWith('$'), fixedRow = /\$\d+$/.test(ref.address);
    const r = coord.r + (fixedRow ? 0 : dr), c = coord.c + (fixedCol ? 0 : dc);
    if (r < 0 || c < 0 || r > 9999 || c > 255) return '#REF!';
    return ref.qualifier + (fixedCol ? '$' : '') + colName(c) + (fixedRow ? '$' : '') + (r + 1);
  }
  return mapFormulaAreas(value, (first, last, separator) =>
    shift(first) + (last ? separator + shift(last) : '')
  );
}
export function parseDelimited(source: string, delimiter = ','): string[][] {
  const rows: string[][] = [[]];
  let text = '',
    quoted = false;
  const data = source.replace(/^\uFEFF/, '');
  for (let i = 0; i < data.length; i++) {
    const ch = data[i];
    if (ch === '"') {
      if (quoted && data[i + 1] === '"') {
        text += '"';
        i++;
      } else if (quoted || text === '') quoted = !quoted;
      else text += ch;
    } else if (!quoted && ch === delimiter) {
      rows[rows.length - 1].push(text);
      text = '';
    } else if (!quoted && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && data[i + 1] === '\n') i++;
      rows[rows.length - 1].push(text);
      rows.push([]);
      text = '';
    } else text += ch;
  }
  rows[rows.length - 1].push(text);
  if (rows.length > 1 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop();
  return rows;
}
export function toDelimited(rows: string[][], delimiter = ',') {
  return rows
    .map((row) =>
      row
        .map((value) => (/["\r\n,\t]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value))
        .join(delimiter)
    )
    .join('\r\n');
}
export function validateWorkbook(input: unknown): Workbook {
  const data = input as Workbook;
  if (!Array.isArray(data?.sheets) || !data.sheets.length || data.sheets.length > 100)
    throw new Error('工作簿格式不正确');
  let count = 0;
  const names = new Set<string>();
  const sheets = data.sheets.map((sheet, index): Sheet => {
    if (!sheet || typeof sheet !== 'object' || !sheet.cells || typeof sheet.cells !== 'object')
      throw new Error('工作表格式不正确');
    let name =
      typeof sheet.name === 'string'
        ? sheet.name
            .replace(/[\\/?*\[\]:]/g, '')
            .slice(0, 31)
            .trim()
        : '';
    name ||= `Sheet${index + 1}`;
    const baseName = name;
    let suffix = 2;
    while (names.has(name.toLowerCase())) name = `${baseName.slice(0, 26)}_${suffix++}`;
    names.add(name.toLowerCase());
    const cells: Record<string, CellData> = {};
    for (const [key, raw] of Object.entries(sheet.cells)) {
      if (!/^\d+,\d+$/.test(key)) continue;
      const [r, c] = key.split(',').map(Number);
      if (r > 9999 || c > 255) throw new Error('支持最多 10000 行、256 列');
      if (++count > 100000) throw new Error('工作簿最多支持 100000 个非空单元格');
      if (!raw || typeof raw !== 'object') continue;
      const cell: CellData = { v: String(raw.v ?? '').slice(0, 32767) };
      for (const prop of ['b', 'i', 'u', 'wrap', 'border'] as const) if (raw[prop]) cell[prop] = true;
      for (const prop of ['bg', 'fc'] as const)
        if (typeof raw[prop] === 'string' && /^#[0-9a-f]{6}$/i.test(raw[prop]!)) cell[prop] = raw[prop];
      if (['left', 'center', 'right'].includes(raw.a || '')) cell.a = raw.a;
      if (typeof raw.ff === 'string') cell.ff = raw.ff.slice(0, 80);
      if (typeof raw.fs === 'number') cell.fs = Math.min(72, Math.max(8, raw.fs));
      if (['general', 'number', 'currency', 'percent', 'date'].includes(raw.fmt || '')) cell.fmt = raw.fmt;
      cells[key] = cell;
    }
    const widths: Record<number, number> = {},
      heights: Record<number, number> = {};
    for (const [key, val] of Object.entries(sheet.widths || {}))
      if (+key >= 0 && +key < 256 && Number.isFinite(+val)) widths[+key] = Math.min(500, Math.max(40, +val));
    for (const [key, val] of Object.entries(sheet.heights || {}))
      if (+key >= 0 && +key < 10000 && Number.isFinite(+val))
        heights[+key] = Math.min(400, Math.max(22, +val));
    const merges: Merge[] = [];
    for (const item of (Array.isArray(sheet.merges) ? sheet.merges : []).slice(0, 1000)) {
      if (
        ![item.r, item.c, item.er, item.ec].every(Number.isInteger) ||
        item.r < 0 ||
        item.c < 0 ||
        item.er < item.r ||
        item.ec < item.c ||
        item.er > 9999 ||
        item.ec > 255
      )
        continue;
      if (!merges.some((m) => item.r <= m.er && item.er >= m.r && item.c <= m.ec && item.ec >= m.c))
        merges.push({ ...item });
    }
    const result: Sheet = { name, cells, widths, heights, merges };
    if (Number.isInteger(sheet.frozenRows) && sheet.frozenRows! > 0 && sheet.frozenRows! < 10000)
      result.frozenRows = sheet.frozenRows;
    if (Number.isInteger(sheet.frozenCols) && sheet.frozenCols! > 0 && sheet.frozenCols! < 256)
      result.frozenCols = sheet.frozenCols;
    if (sheet.showGridLines === false) result.showGridLines = false;
    if (sheet.showFormulas === true) result.showFormulas = true;
    if (Number.isInteger(sheet.zoom) && sheet.zoom! >= 10 && sheet.zoom! <= 400 && sheet.zoom !== 100)
      result.zoom = sheet.zoom;
    return result;
  });
  return { sheets };
}

export const numericInput = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
type Scalar = string | number | boolean;
type Value = Scalar | Scalar[];
type Token = { kind: 'number' | 'string' | 'ref' | 'name' | 'op' | 'error'; value: string };
type Node =
  | { kind: 'literal'; value: Scalar }
  | { kind: 'error'; value: string }
  | { kind: 'ref'; value: string }
  | { kind: 'range'; left: Node; right: Node }
  | { kind: 'unary'; op: string; value: Node }
  | { kind: 'binary'; op: string; left: Node; right: Node }
  | { kind: 'call'; name: string; args: Node[] };
class FormulaError extends Error {}
function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let input = text,
    count = 0;
  while (input.length) {
    if (++count > 2000) throw new FormulaError('#VALUE!');
    const space = /^\s+/.exec(input);
    if (space) {
      input = input.slice(space[0].length);
      continue;
    }
    const str = /^"(?:[^"]|"")*"/.exec(input);
    if (str) {
      tokens.push({ kind: 'string', value: str[0].slice(1, -1).replace(/""/g, '"') });
      input = input.slice(str[0].length);
      continue;
    }
    const error = formulaErrorToken.exec(input);
    if (error) {
      tokens.push({ kind: 'error', value: error[1].toUpperCase() });
      input = input.slice(error[0].length);
      continue;
    }
    const reference =
      /^(?:(?:'(?:[^']|'')+'|[A-Za-z_\u4e00-\u9fff][\w.\u4e00-\u9fff]*)!)?\$?[A-Za-z]{1,3}\$?[1-9]\d*(?![\w.])/i.exec(
        input
      );
    if (reference) {
      tokens.push({ kind: 'ref', value: reference[0] });
      input = input.slice(reference[0].length);
      continue;
    }
    const num = /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i.exec(input);
    if (num) {
      tokens.push({ kind: 'number', value: num[0] });
      input = input.slice(num[0].length);
      continue;
    }
    const name = /^[A-Za-z_][A-Za-z_0-9.]*/.exec(input);
    if (name) {
      tokens.push({ kind: 'name', value: name[0].toUpperCase() });
      input = input.slice(name[0].length);
      continue;
    }
    const op = /^(?:<=|>=|<>|[+\-*/^&=<>():,;%])/.exec(input);
    if (!op) throw new FormulaError('#NAME?');
    tokens.push({ kind: 'op', value: op[0] });
    input = input.slice(op[0].length);
  }
  return tokens;
}
function parseFormula(text: string): Node {
  const tokens = tokenize(text);
  let pos = 0,
    depth = 0;
  const peek = () => tokens[pos]?.kind === 'op' ? tokens[pos].value : '';
  function primary(withSuffix = true): Node {
    if (++depth > 80) throw new FormulaError('#VALUE!');
    const token = tokens[pos++];
    let node: Node;
    if (!token) throw new FormulaError('#VALUE!');
    if (token.kind === 'op' && (token.value === '+' || token.value === '-'))
      node = { kind: 'unary', op: token.value, value: primary() };
    else if (token.kind === 'number') node = { kind: 'literal', value: Number(token.value) };
    else if (token.kind === 'string') node = { kind: 'literal', value: token.value };
    else if (token.kind === 'error') node = { kind: 'error', value: token.value };
    else if (token.kind === 'ref') node = { kind: 'ref', value: token.value };
    else if (token.value === '(') {
      node = expression(0);
      if (tokens[pos++]?.value !== ')') throw new FormulaError('#VALUE!');
    } else if (token.kind === 'name' && (token.value === 'TRUE' || token.value === 'FALSE') && peek() !== '(')
      node = { kind: 'literal', value: token.value === 'TRUE' };
    else if (token.kind === 'name' && peek() === '(') {
      pos++;
      const args: Node[] = [];
      if (peek() !== ')')
        do {
          const omitted = peek() === ',' || peek() === ';' || peek() === ')';
          args.push(omitted ? { kind: 'literal', value: 0 } : expression(0));
          if (peek() !== ',' && peek() !== ';') break;
          pos++;
        } while (true);
      if (tokens[pos++]?.value !== ')') throw new FormulaError('#VALUE!');
      node = { kind: 'call', name: token.value, args };
    } else throw new FormulaError('#NAME?');
    if (withSuffix && peek() === ':') {
      pos++;
      node = { kind: 'range', left: node, right: primary(false) };
    }
    while (withSuffix && peek() === '%') {
      pos++;
      node = { kind: 'unary', op: '%', value: node };
    }
    depth--;
    return node;
  }
  const priority: Record<string, number> = {
    '=': 1,
    '<>': 1,
    '<': 1,
    '>': 1,
    '<=': 1,
    '>=': 1,
    '&': 2,
    '+': 3,
    '-': 3,
    '*': 4,
    '/': 4,
    '^': 5,
  };
  function expression(min: number): Node {
    let left = primary();
    while (peek() && priority[peek()] >= min) {
      const op = tokens[pos++].value,
        right = expression(priority[op] + (op === '^' ? 0 : 1));
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }
  const result = expression(0);
  if (pos < tokens.length) throw new FormulaError('#VALUE!');
  return result;
}
export const cellErrorCode = /^#(?:REF!|VALUE!|DIV\/0!|N\/A|NAME\?|NUM!|NULL!|CYCLE!)$/i;
// Match Excel wildcards without treating user-supplied criteria as regular expressions.
function wildcardMatch(tokens: string[], text: string) {
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
function criterionMatcher(criterion: Scalar) {
  const [, op = '=', operand] = /^(<=|>=|<>|<|>|=)?([\s\S]*)$/.exec(String(criterion))!;
  const text = operand.toLowerCase();
  const numeric = /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text);
  const wildcard = (op === '=' || op === '<>') && /[?*~]/.test(text);
  const tokens = wildcard ? text.match(/~[?*~]|[\s\S]/g) || [] : [];
  return (value: Scalar) => {
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
export function makeEvaluator(workbook: Workbook) {
  const cache = new Map<string, Scalar | FormulaError>(),
    visiting = new Set<string>();
  let budget = 100000;
  function refParts(ref: string, sheet: number) {
    const split = ref.lastIndexOf('!');
    let name = '';
    if (split >= 0) {
      name = ref.slice(0, split).replace(/^'|'$/g, '').replace(/''/g, "'");
      sheet = workbook.sheets.findIndex((s) => s.name.toLowerCase() === name.toLowerCase());
    }
    const coord = parseAddress(ref.slice(split + 1));
    if (!coord || sheet < 0) throw new FormulaError('#REF!');
    return { sheet, ...coord };
  }
  function rangeBounds(node: Node, sheet: number): Merge & { sheet: number } {
    if (node.kind === 'error') throw new FormulaError(node.value);
    if (node.kind === 'ref') {
      const ref = refParts(node.value, sheet);
      return { ...ref, er: ref.r, ec: ref.c };
    }
    if (node.kind === 'range') {
      const start = rangeBounds(node.left, sheet);
      const end = rangeBounds(node.right, node.right.kind === 'ref' ? start.sheet : sheet);
      if (start.sheet !== end.sheet) throw new FormulaError('#REF!');
      return {
        sheet: start.sheet,
        r: Math.min(start.r, end.r),
        c: Math.min(start.c, end.c),
        er: Math.max(start.er, end.er),
        ec: Math.max(start.ec, end.ec),
      };
    }
    if (node.kind !== 'call' || node.name !== 'INDEX') throw new FormulaError('#VALUE!');
    const args = node.args;
    if (args.length < 2 || args.length > 4) throw new FormulaError('#VALUE!');
    const area = rangeBounds(args[0], sheet);
    if (args[3] && number(evaluate(args[3], sheet)) !== 1) throw new FormulaError('#REF!');
    let row = Math.trunc(number(evaluate(args[1], sheet)));
    let col = args[2] ? Math.trunc(number(evaluate(args[2], sheet))) : 0;
    if (!args[2] && area.r === area.er) {
      col = row;
      row = 1;
    }
    if (row < 0 || col < 0) throw new FormulaError('#VALUE!');
    if (area.r + row - 1 > area.er || area.c + col - 1 > area.ec) throw new FormulaError('#REF!');
    if (row) area.r = area.er = area.r + row - 1;
    if (col) area.c = area.ec = area.c + col - 1;
    return area;
  }
  function rangeValues(area: ReturnType<typeof rangeBounds>): Scalar[] {
    const values: Scalar[] = [];
    for (let r = area.r; r <= area.er; r++)
      for (let c = area.c; c <= area.ec; c++) {
        if (--budget < 0) throw new FormulaError('#NUM!');
        values.push(read(area.sheet, r, c));
      }
    return values;
  }
  const scalar = (value: Value): Scalar => (Array.isArray(value) ? value[0] ?? 0 : value);
  function number(value: Value): number {
    const raw = scalar(value);
    const result = Number(raw);
    if (!Number.isFinite(result)) throw new FormulaError('#VALUE!');
    return result;
  }
  function evaluate(node: Node, sheet: number): Value {
    if (--budget < 0) throw new FormulaError('#NUM!');
    switch (node.kind) {
      case 'error':
        throw new FormulaError(node.value);
      case 'literal':
        return node.value;
      case 'ref': {
        const ref = refParts(node.value, sheet);
        return read(ref.sheet, ref.r, ref.c);
      }
      case 'range':
        return rangeValues(rangeBounds(node, sheet));
      case 'unary': {
        const val = number(evaluate(node.value, sheet));
        return node.op === '-' ? -val : node.op === '%' ? val / 100 : val;
      }
      case 'binary': {
        const l = evaluate(node.left, sheet),
          r = evaluate(node.right, sheet);
        const sl = scalar(l),
          sr = scalar(r);
        if (node.op === '&') return String(sl) + String(sr);
        if (['=', '<>', '<', '>', '<=', '>='].includes(node.op)) {
          const a = typeof sl === 'string' ? sl.toLowerCase() : sl,
            b = typeof sr === 'string' ? sr.toLowerCase() : sr;
          switch (node.op) {
            case '=':
              return a === b;
            case '<>':
              return a !== b;
            case '<':
              return a < b;
            case '>':
              return a > b;
            case '<=':
              return a <= b;
            default:
              return a >= b;
          }
        }
        const a = number(l),
          b = number(r);
        switch (node.op) {
          case '+':
            return a + b;
          case '-':
            return a - b;
          case '*':
            return a * b;
          case '/':
            if (b === 0) throw new FormulaError('#DIV/0!');
            return a / b;
          case '^':
            return a ** b;
        }
        throw new FormulaError('#VALUE!');
      }
      case 'call': {
        if (node.name === 'INDEX') {
          const area = rangeBounds(node, sheet);
          if (area.r === area.er && area.c === area.ec && !workbook.sheets[area.sheet].cells[cellKey(area.r, area.c)]?.v)
            return 0;
          return rangeValues(area);
        }
        if (node.name === 'IF') {
          if (node.args.length < 2 || node.args.length > 3) throw new FormulaError('#VALUE!');
          const condition = scalar(evaluate(node.args[0], sheet));
          return condition
            ? evaluate(node.args[1], sheet)
            : node.args[2]
              ? evaluate(node.args[2], sheet)
              : false;
        }
        if (node.name === 'IFERROR') {
          if (node.args.length !== 2) throw new FormulaError('#VALUE!');
          try {
            return evaluate(node.args[0], sheet);
          } catch {
            return evaluate(node.args[1], sheet);
          }
        }
        if (['COUNTIF', 'SUMIF', 'AVERAGEIF', 'COUNTIFS', 'SUMIFS', 'AVERAGEIFS'].includes(node.name))
          return aggregateIf(node, sheet);
        if (node.name === 'MATCH' || node.name === 'VLOOKUP' || node.name === 'HLOOKUP')
          return lookup(node, sheet);
        const values = node.args.map((arg) => evaluate(arg, sheet)).flat();
        const nums = values.filter((v) => typeof v === 'number') as number[];
        switch (node.name) {
          case 'SUM':
            return nums.reduce((a, b) => a + b, 0);
          case 'AVERAGE':
            if (!nums.length) throw new FormulaError('#DIV/0!');
            return nums.reduce((a, b) => a + b, 0) / nums.length;
          case 'MIN':
            return nums.length ? Math.min(...nums) : 0;
          case 'MAX':
            return nums.length ? Math.max(...nums) : 0;
          case 'COUNT':
            return nums.length;
          case 'COUNTA':
            return values.filter((v) => v !== '').length;
          case 'ABS':
            return Math.abs(number(values[0] ?? 0));
          case 'ROUND': {
            const precision = Math.min(15, Math.max(-15, number(values[1] ?? 0)));
            return Math.round(number(values[0] ?? 0) * 10 ** precision) / 10 ** precision;
          }
          case 'AND':
            return values.every(Boolean);
          case 'OR':
            return values.some(Boolean);
          case 'NOT':
            return !values[0];
          case 'CONCAT':
          case 'CONCATENATE':
            return values.join('');
          case 'LEN':
            return String(values[0] ?? '').length;
          case 'UPPER':
            return String(values[0] ?? '').toUpperCase();
          case 'LOWER':
            return String(values[0] ?? '').toLowerCase();
          default:
            throw new FormulaError('#NAME?');
        }
      }
    }
  }
  function lookup(node: Extract<Node, { kind: 'call' }>, sheet: number): Scalar {
    const { name, args } = node;
    const positionOnly = name === 'MATCH';
    const required = positionOnly ? 2 : 3;
    if (args.length < required || args.length > required + 1) throw new FormulaError('#VALUE!');

    const key = scalar(evaluate(args[0], sheet));
    const area = rangeBounds(args[1], sheet);
    if (positionOnly && area.er > area.r && area.ec > area.c) throw new FormulaError('#N/A');
    const horizontal = name === 'HLOOKUP' || (positionOnly && area.er === area.r);
    const length = horizontal ? area.ec - area.c + 1 : area.er - area.r + 1;
    let mode = 1, offset = 0;
    if (positionOnly) {
      if (args[2]) mode = Math.sign(number(evaluate(args[2], sheet)));
    } else {
      offset = Math.trunc(number(evaluate(args[2], sheet))) - 1;
      if (offset < 0) throw new FormulaError('#VALUE!');
      if (offset > (horizontal ? area.er - area.r : area.ec - area.c)) throw new FormulaError('#REF!');
      if (args[3]) mode = number(evaluate(args[3], sheet)) === 0 ? 0 : 1;
    }

    const needle = typeof key === 'string' ? key.toLowerCase() : key;
    const pattern = mode === 0 && typeof needle === 'string' && /[?*~]/.test(needle)
      ? needle.match(/~[?*~]|[\s\S]/g) : null;
    let found = -1;
    for (let i = 0; i < length; i++) {
      if (--budget < 0) throw new FormulaError('#NUM!');
      const row = area.r + (horizontal ? 0 : i);
      const col = area.c + (horizontal ? i : 0);
      if (!workbook.sheets[area.sheet].cells[cellKey(row, col)]?.v) continue;
      const value = read(area.sheet, row, col);
      if (typeof value !== typeof key) continue;
      const candidate = typeof value === 'string' ? value.toLowerCase() : value;
      if (mode === 0) {
        const matches = pattern && typeof candidate === 'string'
          ? wildcardMatch(pattern, candidate)
          : candidate === needle;
        if (matches) {
          found = i;
          break;
        }
      } else {
        // Approximate lookup uses an ordered axis and takes the last qualifying position.
        if (mode > 0 ? candidate > needle : candidate < needle) break;
        found = i;
      }
    }
    if (found < 0) throw new FormulaError('#N/A');
    if (positionOnly) return found + 1;
    const row = area.r + (horizontal ? offset : found);
    const col = area.c + (horizontal ? found : offset);
    return workbook.sheets[area.sheet].cells[cellKey(row, col)]?.v ? read(area.sheet, row, col) : 0;
  }
  function aggregateIf(node: Extract<Node, { kind: 'call' }>, sheet: number) {
    const { name, args } = node;
    const multiple = name.endsWith('IFS');
    const countOnly = name.startsWith('COUNT');
    const average = name.startsWith('AVERAGE');
    // SUMIF/AVERAGEIF put their optional result range last. Their plural forms put it first.
    const pairs = multiple ? args.slice(countOnly ? 0 : 1) : args.slice(0, 2);
    if (pairs.length < 2 || pairs.length % 2 || pairs.length > 254 ||
        (!multiple && args.length > (countOnly ? 2 : 3))) throw new FormulaError('#VALUE!');
    const area = rangeBounds(pairs[0], sheet);
    const rows = area.er - area.r + 1, cols = area.ec - area.c + 1;
    const result = countOnly ? area : rangeBounds((multiple ? args[0] : args[2]) ?? pairs[0], sheet);
    const sameSize = (range: typeof area) => range.er - range.r + 1 === rows && range.ec - range.c + 1 === cols;
    if (multiple && !sameSize(result)) throw new FormulaError('#VALUE!');
    if (result.r + rows > 10000 || result.c + cols > 256) throw new FormulaError('#REF!');
    const conditions = [];
    for (let i = 0; i < pairs.length; i += 2) {
      const range = i === 0 ? area : rangeBounds(pairs[i], sheet);
      if (!sameSize(range)) throw new FormulaError('#VALUE!');
      const criterionNode = pairs[i + 1];
      let criterion = scalar(evaluate(criterionNode, sheet));
      if (criterionNode.kind === 'ref' && criterion === '') criterion = 0;
      conditions.push({ range, matches: criterionMatcher(criterion) });
    }
    let sum = 0, count = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const match = conditions.every(({ range, matches }) => {
          if (--budget < 0) throw new FormulaError('#NUM!');
          return matches(display(range.sheet, range.r + r, range.c + c));
        });
        if (!match) continue;
        if (countOnly) {
          count++;
          continue;
        }
        const value = read(result.sheet, result.r + r, result.c + c);
        if (typeof value === 'number' || (multiple && typeof value === 'boolean')) {
          sum += Number(value);
          count++;
        }
      }
    }
    if (countOnly) return count;
    if (!average) return sum;
    if (!count) throw new FormulaError('#DIV/0!');
    return sum / count;
  }
  function resultAt(sheet: number, r: number, c: number): Scalar | FormulaError {
    const key = `${sheet}!${r},${c}`;
    if (cache.has(key)) return cache.get(key)!;
    if (!visiting.size) budget = 100000;
    if (visiting.has(key) || visiting.size > 100) return new FormulaError('#CYCLE!');
    const value = workbook.sheets[sheet]?.cells[cellKey(r, c)]?.v ?? '';
    let result: Scalar | FormulaError = value;
    if (value.startsWith('=')) {
      visiting.add(key);
      try {
        result = scalar(evaluate(parseFormula(value.slice(1)), sheet));
        if (typeof result === 'number' && !Number.isFinite(result)) result = new FormulaError('#NUM!');
      } catch (error) {
        result = error instanceof FormulaError ? error : new FormulaError('#VALUE!');
      }
      visiting.delete(key);
    } else if (cellErrorCode.test(value)) result = new FormulaError(value.toUpperCase());
    else if (value !== '' && numericInput.test(value))
      result = Number(value);
    else if (value.startsWith("'")) result = value.slice(1);
    cache.set(key, result);
    return result;
  }
  function read(sheet: number, r: number, c: number): Scalar {
    const value = resultAt(sheet, r, c);
    if (value instanceof FormulaError) throw value;
    return value;
  }
  function display(sheet: number, r: number, c: number): Scalar {
    const value = resultAt(sheet, r, c);
    return value instanceof FormulaError ? value.message : value;
  }
  return Object.assign(display, {
    isError: (sheet: number, r: number, c: number) => resultAt(sheet, r, c) instanceof FormulaError,
  });
}
export function formatValue(value: Scalar, format?: CellData['fmt']): string {
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value !== 'number') return value;
  if (format === 'number')
    return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (format === 'currency') return value.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' });
  if (format === 'percent') return `${+(value * 100).toFixed(2)}%`;
  if (format === 'date') {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return Number.isNaN(date.getTime()) ? '#VALUE!' : date.toISOString().slice(0, 10);
  }
  return String(Number(value.toPrecision(12)));
}

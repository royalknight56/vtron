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
    return { name, cells, widths, heights, merges };
  });
  return { sheets };
}

type Scalar = string | number | boolean;
type Value = Scalar | Scalar[];
type Token = { kind: 'number' | 'string' | 'ref' | 'name' | 'op'; value: string };
type Node =
  | { kind: 'literal'; value: Scalar }
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
  const peek = () => tokens[pos]?.value;
  function primary(): Node {
    if (++depth > 80) throw new FormulaError('#VALUE!');
    const token = tokens[pos++];
    let node: Node;
    if (!token) throw new FormulaError('#VALUE!');
    if (token.value === '+' || token.value === '-')
      node = { kind: 'unary', op: token.value, value: primary() };
    else if (token.kind === 'number') node = { kind: 'literal', value: Number(token.value) };
    else if (token.kind === 'string') node = { kind: 'literal', value: token.value };
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
          args.push(expression(0));
          if (peek() !== ',' && peek() !== ';') break;
          pos++;
        } while (true);
      if (tokens[pos++]?.value !== ')') throw new FormulaError('#VALUE!');
      node = { kind: 'call', name: token.value, args };
    } else throw new FormulaError('#NAME?');
    if (peek() === ':') {
      pos++;
      const right = tokens[pos++];
      if (!right || right.kind !== 'ref' || node.kind !== 'ref') throw new FormulaError('#REF!');
      node = { kind: 'range', left: node, right: { kind: 'ref', value: right.value } };
    }
    while (peek() === '%') {
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
export function makeEvaluator(workbook: Workbook) {
  const cache = new Map<string, Scalar>(),
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
  const scalar = (value: Value): Scalar => (Array.isArray(value) ? value[0] ?? 0 : value);
  function number(value: Value): number {
    const raw = scalar(value);
    if (typeof raw === 'string' && raw.startsWith('#')) throw new FormulaError(raw);
    const result = Number(raw);
    if (!Number.isFinite(result)) throw new FormulaError('#VALUE!');
    return result;
  }
  function evaluate(node: Node, sheet: number): Value {
    if (--budget < 0) throw new FormulaError('#NUM!');
    switch (node.kind) {
      case 'literal':
        return node.value;
      case 'ref': {
        const ref = refParts(node.value, sheet);
        return read(ref.sheet, ref.r, ref.c);
      }
      case 'range': {
        if (node.left.kind !== 'ref' || node.right.kind !== 'ref') throw new FormulaError('#REF!');
        const start = refParts(node.left.value, sheet),
          end = refParts(node.right.value, start.sheet);
        if (start.sheet !== end.sheet) throw new FormulaError('#REF!');
        const values: Scalar[] = [];
        for (let r = Math.min(start.r, end.r); r <= Math.max(start.r, end.r); r++)
          for (let c = Math.min(start.c, end.c); c <= Math.max(start.c, end.c); c++) {
            if (--budget < 0) throw new FormulaError('#NUM!');
            values.push(read(start.sheet, r, c));
          }
        return values;
      }
      case 'unary': {
        const val = number(evaluate(node.value, sheet));
        return node.op === '-' ? -val : node.op === '%' ? val / 100 : val;
      }
      case 'binary': {
        const l = evaluate(node.left, sheet),
          r = evaluate(node.right, sheet);
        const sl = scalar(l),
          sr = scalar(r);
        if (typeof sl === 'string' && sl.startsWith('#')) throw new FormulaError(sl);
        if (typeof sr === 'string' && sr.startsWith('#')) throw new FormulaError(sr);
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
        if (node.name === 'IF') {
          if (node.args.length < 2 || node.args.length > 3) throw new FormulaError('#VALUE!');
          const condition = scalar(evaluate(node.args[0], sheet));
          if (typeof condition === 'string' && condition.startsWith('#')) throw new FormulaError(condition);
          return condition
            ? evaluate(node.args[1], sheet)
            : node.args[2]
              ? evaluate(node.args[2], sheet)
              : false;
        }
        if (node.name === 'IFERROR') {
          if (node.args.length !== 2) throw new FormulaError('#VALUE!');
          try {
            const value = evaluate(node.args[0], sheet);
            if (String(scalar(value)).startsWith('#')) throw new FormulaError();
            return value;
          } catch {
            return evaluate(node.args[1], sheet);
          }
        }
        const values = node.args.map((arg) => evaluate(arg, sheet)).flat();
        const error = values.find((v) => typeof v === 'string' && v.startsWith('#'));
        if (error) throw new FormulaError(String(error));
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
  function read(sheet: number, r: number, c: number): Scalar {
    const key = `${sheet}!${r},${c}`;
    if (cache.has(key)) return cache.get(key)!;
    if (visiting.has(key) || visiting.size > 100) return '#CYCLE!';
    const value = workbook.sheets[sheet]?.cells[cellKey(r, c)]?.v ?? '';
    let result: Scalar = value;
    if (value.startsWith('=')) {
      visiting.add(key);
      try {
        if (value.includes('#REF!')) throw new FormulaError('#REF!');
        result = scalar(evaluate(parseFormula(value.slice(1)), sheet));
        if (typeof result === 'number' && !Number.isFinite(result)) result = '#NUM!';
      } catch (error) {
        result = error instanceof FormulaError ? error.message || '#VALUE!' : '#VALUE!';
      }
      visiting.delete(key);
    } else if (value !== '' && /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value))
      result = Number(value);
    else if (value.startsWith("'")) result = value.slice(1);
    cache.set(key, result);
    return result;
  }
  return read;
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

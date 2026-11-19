import { criterionMatcher, numericInput, wildcardMatch } from './excelCriteria';
export { numericInput } from './excelCriteria';
import { validFilter, type AutoFilter } from './excelFilter';
import { calculateText, joinText, textArity } from './excelText';
import { decimalPlaces, displayClock, displayNumber, maxDecimals, renderFormatCode, scaleDecimal } from './excelNumberFormats';
import { calendarSerial, dateParts, parseCalendarInput, parseClockInput, type ClockFormat } from './excelDates';

export interface CellLink {
  target?: string;
  location?: string;
  tooltip?: string;
  display?: string;
}
export function linkAddress(link: CellLink) {
  return (link.target || '') + (link.location ? '#' + link.location : '');
}
export function externalLink(address: string) {
  try {
    const url = new URL(address);
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : undefined;
  } catch { return; }
}

export interface CellData {
  link?: CellLink;
  v: string;
  type?: 'text' | 'boolean';
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
  xlsxFormat?: string | number;
  decimals?: number;
  grouping?: boolean;
  fmt?: 'general' | 'number' | 'currency' | 'percent' | 'date' | 'text' | ClockFormat;
}
export function isFormulaCell(cell: CellData) {
  return !cell.type && cell.v.startsWith('=');
}
export function isBlankCell(cell?: CellData) {
  return !cell || (cell.v === '' && !cell.type);
}
export function copyCell(cell: CellData, dr: number, dc: number): CellData {
  return { ...cell, v: isFormulaCell(cell) ? shiftFormula(cell.v, dr, dc) : cell.v };
}
export interface Merge {
  r: number;
  c: number;
  er: number;
  ec: number;
}
export interface SheetSelection {
  activeCell: string;
  sqref: string;
}
export interface Sheet {
  autoFilter?: AutoFilter;
  hiddenRows?: number[];
  state?: 'hidden' | 'veryHidden';
  selection?: SheetSelection;
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
  compatibility?: { setVersion: number; warnBelowVersion?: number };
  activeTab?: number;
  date1904?: boolean;
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
export function sheetSelection(activeCell: string, sqref: string): SheetSelection | undefined {
  const active = parseAddress(activeCell);
  const refs = sqref.split(':');
  const first = parseAddress(refs[0]);
  const last = refs.length === 2 ? parseAddress(refs[1]) : first;
  if (!active && !first) return;
  const cell = active || first!;
  const label = address(cell.r, cell.c);
  if (!first || !last || refs.length > 2) return { activeCell: label, sqref: label };
  const r = Math.min(first.r, last.r), c = Math.min(first.c, last.c);
  const er = Math.max(first.r, last.r), ec = Math.max(first.c, last.c);
  if (cell.r < r || cell.r > er || cell.c < c || cell.c > ec) return { activeCell: label, sqref: label };
  return { activeCell: label, sqref: address(r, c) + (r === er && c === ec ? '' : ':' + address(er, ec)) };
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
const sheetQualifiers = new RegExp(
  `"(?:[^"]|"")*"|(?<![\\w.\\u0080-\\uFFFF])(${sheetPrefix})|\\[[^\\]]*\\]`, 'g'
);

export function updateSheetReferences(sheets: Sheet[], previous: string, replacement?: string) {
  const oldName = previous.toLowerCase();
  const matches = (qualifier: string) =>
    qualifier.slice(0, -1).replace(/^'|'$/g, '').replace(/''/g, "'").toLowerCase() === oldName;
  const prefix = replacement === undefined ? '#REF!' : `'${replacement.replace(/'/g, "''")}'!`;
  for (const sheet of sheets) {
    for (const cell of Object.values(sheet.cells)) {
      const link = cell.link;
      if (link?.location && !link.target) {
        const split = link.location.lastIndexOf('!') + 1;
        if (split && matches(link.location.slice(0, split))) {
          cell.link = { ...link, location: replacement === undefined ? '#REF!' : prefix + link.location.slice(split) };
        }
      }
      if (!isFormulaCell(cell) || !cell.v.includes('!')) continue;
      let formula = cell.v;
      if (replacement === undefined) {
        formula = mapFormulaAreas(formula, (first, last) =>
          matches(first.qualifier) || (last && matches(last.qualifier)) ? '#REF!' : undefined
        );
      }
      // Keep references to names and whole rows/columns in step with ordinary A1 references.
      cell.v = formula.replace(sheetQualifiers, (token, qualifier) =>
        qualifier && matches(qualifier) ? prefix : token
      );
    }
  }
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
export function normalizeCell(input: unknown): CellData | undefined {
  if (!input || typeof input !== 'object') return;
  const raw = input as Partial<CellData>;
  const cell: CellData = { v: String(raw.v ?? '').slice(0, 32767) };
  if (raw.link && typeof raw.link === 'object') {
    const link: CellLink = {};
    for (const key of ['target', 'location', 'tooltip', 'display'] as const)
      if (typeof raw.link[key] === 'string' && raw.link[key]) link[key] = raw.link[key];
    if (link.target || link.location) cell.link = link;
  }
  if (raw.type === 'text' || (raw.type === 'boolean' && /^(TRUE|FALSE)$/.test(cell.v))) cell.type = raw.type;
  for (const prop of ['b', 'i', 'u', 'wrap', 'border'] as const) if (raw[prop]) cell[prop] = true;
  for (const prop of ['bg', 'fc'] as const)
    if (typeof raw[prop] === 'string' && /^#[0-9a-f]{6}$/i.test(raw[prop]!)) cell[prop] = raw[prop];
  if (['left', 'center', 'right'].includes(raw.a || '')) cell.a = raw.a;
  if (typeof raw.ff === 'string') cell.ff = raw.ff.slice(0, 80);
  if (typeof raw.fs === 'number') cell.fs = Math.min(72, Math.max(8, raw.fs));
  if (['general', 'number', 'currency', 'percent', 'date', 'time', 'duration', 'datetime', 'text'].includes(raw.fmt || '')) cell.fmt = raw.fmt;
  if (Number.isInteger(raw.decimals) && raw.decimals! >= 0 && raw.decimals! <= maxDecimals)
    cell.decimals = raw.decimals;
  if (typeof raw.xlsxFormat === 'string' || (typeof raw.xlsxFormat === 'number' &&
      Number.isInteger(raw.xlsxFormat) && raw.xlsxFormat >= 0 && raw.xlsxFormat < 164)) cell.xlsxFormat = raw.xlsxFormat;
  if (typeof raw.grouping === 'boolean') cell.grouping = raw.grouping;
  return cell;
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
      const cell = normalizeCell(raw);
      if (cell) cells[key] = cell;
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
    const filter = validFilter(sheet.autoFilter);
    if (filter) result.autoFilter = filter;
    if (Array.isArray(sheet.hiddenRows) && sheet.hiddenRows.length)
      result.hiddenRows = [...new Set(sheet.hiddenRows.filter(r => Number.isInteger(r) && r >= 0 && r < 10000))];
    if (sheet.state === 'hidden' || sheet.state === 'veryHidden') result.state = sheet.state;
    if (Number.isInteger(sheet.frozenRows) && sheet.frozenRows! > 0 && sheet.frozenRows! < 10000)
      result.frozenRows = sheet.frozenRows;
    if (Number.isInteger(sheet.frozenCols) && sheet.frozenCols! > 0 && sheet.frozenCols! < 256)
      result.frozenCols = sheet.frozenCols;
    if (sheet.showGridLines === false) result.showGridLines = false;
    if (sheet.showFormulas === true) result.showFormulas = true;
    if (Number.isInteger(sheet.zoom) && sheet.zoom! >= 10 && sheet.zoom! <= 400 && sheet.zoom !== 100)
      result.zoom = sheet.zoom;
    if (typeof sheet.selection?.activeCell === 'string' && typeof sheet.selection.sqref === 'string')
      result.selection = sheetSelection(sheet.selection.activeCell, sheet.selection.sqref);
    return result;
  });
  const book: Workbook = { sheets };
  if (data.compatibility) {
    const { setVersion, warnBelowVersion } = data.compatibility;
    if (Number.isInteger(setVersion) && setVersion >= 1 && setVersion <= 0xffffffff) {
      book.compatibility = { setVersion };
      if (warnBelowVersion && Number.isInteger(warnBelowVersion) && warnBelowVersion > 0 && warnBelowVersion <= setVersion)
        book.compatibility.warnBelowVersion = warnBelowVersion;
    }
  }
  if (data.date1904 === true) book.date1904 = true;
  const firstVisible = sheets.findIndex(sheet => !sheet.state);
  if (firstVisible < 0) throw new Error('工作簿至少需要一张可见工作表');
  const requested = data.activeTab ?? 0;
  const active = Number.isInteger(requested) && sheets[requested] && !sheets[requested].state ? requested : firstVisible;
  if (active > 0) book.activeTab = active;
  return book;
}

type Scalar = string | number | boolean;
// An empty reference is distinct from a formula or text cell containing an empty string.
type CellValue = Scalar | undefined;
type Value = CellValue | CellValue[];
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
function isReference(node: Node) {
  return node.kind === 'ref' || node.kind === 'range' || (node.kind === 'call' && node.name === 'INDEX');
}
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
export function cellFromInput(previous: CellData | undefined, input: string, date1904 = false): CellData {
  const cell: CellData = { ...previous, v: input };
  delete cell.type;
  if (!input || input.startsWith("'")) return cell;
  if (cell.fmt === 'text') return { ...cell, type: 'text' };
  if (/^(true|false)$/i.test(input)) return { ...cell, v: input.toUpperCase(), type: 'boolean' };
  const trimmed = input.trim();
  const explicitPercent = /[%％]$/.test(trimmed);
  const amount = explicitPercent ? trimmed.slice(0, -1).trim() : trimmed;
  if ((explicitPercent || cell.fmt === 'percent') && numericInput.test(amount)) {
    const value = explicitPercent || Math.abs(Number(amount)) >= 1 ? scaleDecimal(amount, -2) : Number(amount);
    if (Number.isFinite(value)) {
      if (cell.fmt !== 'percent' && cell.xlsxFormat === undefined) {
        cell.fmt = 'percent';
        cell.decimals = decimalPlaces(amount);
        delete cell.grouping;
        delete cell.xlsxFormat;
      }
      cell.v = String(value);
      return cell;
    }
  }
  const clock = parseClockInput(input, date1904);
  if (clock) {
    const temporal = cell.fmt === 'date' || cell.fmt === 'time' || cell.fmt === 'duration' || cell.fmt === 'datetime';
    if (!temporal && cell.xlsxFormat === undefined) {
      cell.fmt = clock.fmt;
      cell.xlsxFormat = clock.code;
    }
    cell.v = String(clock.serial);
    return cell;
  }
  const serial = parseCalendarInput(input, date1904);
  if (serial !== null) {
    if (cell.fmt !== 'date' && cell.fmt !== 'datetime' && cell.xlsxFormat === undefined) {
      cell.fmt = 'date';
      delete cell.xlsxFormat;
    }
    cell.v = String(serial);
    return cell;
  }
  if (cell.xlsxFormat === undefined && (!previous?.fmt || previous.fmt === 'general') && /^=\s*(DATE|EDATE|EOMONTH|TIME)\s*\(/i.test(input)) {
    try {
      const formula = parseFormula(input.slice(1));
      if (formula.kind === 'call' && formula.name === 'TIME') return { ...cell, fmt: 'time', xlsxFormat: undefined };
      if (formula.kind === 'call' && ['DATE', 'EDATE', 'EOMONTH'].includes(formula.name))
        return { ...cell, fmt: 'date', xlsxFormat: undefined };
    } catch { /* Incomplete formulas are displayed by the evaluator. */ }
  }
  return cell;
}

export const cellErrorCode = /^#(?:REF!|VALUE!|DIV\/0!|N\/A|NAME\?|NUM!|NULL!|CYCLE!)$/i;
export function makeEvaluator(workbook: Workbook) {
  const cache = new Map<string, Scalar | FormulaError>(),
    visiting = new Set<string>();
  const formulaLinks = new Map<string, CellLink>();
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
  function referenceValue(sheet: number, r: number, c: number): CellValue {
    return isBlankCell(workbook.sheets[sheet].cells[cellKey(r, c)]) ? undefined : read(sheet, r, c);
  }
  function rangeValues(area: ReturnType<typeof rangeBounds>): CellValue[] {
    const values: CellValue[] = [];
    for (let r = area.r; r <= area.er; r++)
      for (let c = area.c; c <= area.ec; c++) {
        if (--budget < 0) throw new FormulaError('#NUM!');
        values.push(referenceValue(area.sheet, r, c));
      }
    return values;
  }
  const firstValue = (value: Value): CellValue => Array.isArray(value) ? value[0] : value;
  const scalar = (value: Value): Scalar => firstValue(value) ?? 0;
  function number(value: Value): number {
    const raw = scalar(value);
    const result = Number(raw);
    if (!Number.isFinite(result)) throw new FormulaError('#VALUE!');
    return result;
  }
  function checkedText<T>(value: T | null): T {
    if (value === null) throw new FormulaError('#VALUE!');
    return value;
  }
  function evaluate(node: Node, sheet: number, linkCell?: string): Value {
    if (--budget < 0) throw new FormulaError('#NUM!');
    switch (node.kind) {
      case 'error':
        throw new FormulaError(node.value);
      case 'literal':
        return node.value;
      case 'ref': {
        const ref = refParts(node.value, sheet);
        return referenceValue(ref.sheet, ref.r, ref.c);
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
        if (node.op === '&') return checkedText(joinText([firstValue(l), firstValue(r)]));
        if (['=', '<>', '<', '>', '<=', '>='].includes(node.op)) {
          const left = firstValue(l) ?? (typeof sr === 'string' ? '' : typeof sr === 'boolean' ? false : 0);
          const right = firstValue(r) ?? (typeof sl === 'string' ? '' : typeof sl === 'boolean' ? false : 0);
          const a = typeof left === 'string' ? left.toLowerCase() : left;
          const b = typeof right === 'string' ? right.toLowerCase() : right;
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
        if (['ISBLANK', 'ISNUMBER', 'ISTEXT', 'ISNONTEXT', 'ISLOGICAL', 'ISERROR', 'ISERR', 'ISNA'].includes(node.name))
          return checkType(node, sheet);
        if (node.name === 'HYPERLINK') {
          if (!node.args.length || node.args.length > 2) throw new FormulaError('#VALUE!');
          const target = String(scalar(evaluate(node.args[0], sheet)));
          const label = node.args[1] ? scalar(evaluate(node.args[1], sheet)) : target;
          if (linkCell && target) formulaLinks.set(linkCell, target.startsWith('#') ? { location: target.slice(1) } : { target });
          return label;
        }
        const arity = textArity.get(node.name);
        if (arity) {
          if (node.args.length < arity[0] || node.args.length > arity[1]) throw new FormulaError('#VALUE!');
          const args = node.args.map(arg => firstValue(evaluate(arg, sheet)));
          return checkedText(calculateText(node.name, args, (workbook.compatibility?.setVersion ?? 1) >= 2));
        }
        if (node.name === 'TEXT') {
          if (node.args.length !== 2) throw new FormulaError('#VALUE!');
          const value = scalar(evaluate(node.args[0], sheet));
          const code = scalar(evaluate(node.args[1], sheet));
          if (typeof code !== 'string') throw new FormulaError('#VALUE!');
          const input = typeof value === 'string' && numericInput.test(value.trim()) ? Number(value) : value;
          if (typeof input === 'boolean') return input ? 'TRUE' : 'FALSE';
          try { return renderFormatCode(code, input, workbook.date1904); }
          catch { throw new FormulaError('#VALUE!'); }
        }
        if (node.name === 'TRUE' || node.name === 'FALSE') {
          if (node.args.length) throw new FormulaError('#VALUE!');
          return node.name === 'TRUE';
        }
        if (node.name === 'INDEX') return rangeValues(rangeBounds(node, sheet));
        if (node.name === 'COUNT' || node.name === 'COUNTA' || node.name === 'COUNTBLANK')
          return countValues(node, sheet);
        if (['TIME', 'TIMEVALUE', 'HOUR', 'MINUTE', 'SECOND'].includes(node.name))
          return evaluateTime(node, sheet);
        if (['DATE', 'DATEVALUE', 'YEAR', 'MONTH', 'DAY', 'EDATE', 'EOMONTH'].includes(node.name))
          return evaluateDate(node, sheet);
        if (node.name === 'IF') {
          if (node.args.length < 2 || node.args.length > 3) throw new FormulaError('#VALUE!');
          const condition = scalar(evaluate(node.args[0], sheet));
          return condition
            ? evaluate(node.args[1], sheet, linkCell)
            : node.args[2]
              ? evaluate(node.args[2], sheet, linkCell)
              : false;
        }
        if (node.name === 'IFERROR') {
          if (node.args.length !== 2) throw new FormulaError('#VALUE!');
          try {
            return evaluate(node.args[0], sheet, linkCell);
          } catch {
            return evaluate(node.args[1], sheet, linkCell);
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
            return checkedText(joinText(values));
          default:
            throw new FormulaError('#NAME?');
        }
      }
    }
  }
  function evaluateTime(node: Extract<Node, { kind: 'call' }>, sheet: number): number {
    const { args, name } = node;
    if (args.length !== (name === 'TIME' ? 3 : 1)) throw new FormulaError('#VALUE!');
    if (name === 'TIME') {
      const parts = args.map(arg => Math.trunc(number(evaluate(arg, sheet))));
      const total = parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (total < 0 || parts.some(n => Math.abs(n) > 32767)) throw new FormulaError('#NUM!');
      return (total % 86400) / 86400;
    }
    const input = scalar(evaluate(args[0], sheet));
    const parsed = typeof input === 'string' ? parseClockInput(input, workbook.date1904) : null;
    if (name === 'TIMEVALUE') {
      if (!parsed) throw new FormulaError('#VALUE!');
      return parsed.time;
    }
    const serial = parsed?.serial ?? number(input);
    if (!dateParts(serial, workbook.date1904)) throw new FormulaError('#NUM!');
    const seconds = Math.floor(Math.round(serial * 86400000) / 1000);
    return name === 'HOUR' ? Math.floor(seconds / 3600) % 24 : name === 'MINUTE' ? Math.floor(seconds / 60) % 60 : seconds % 60;
  }
  function evaluateDate(node: Extract<Node, { kind: 'call' }>, sheet: number): number {
    const { name, args } = node;
    const shiftMonth = name === 'EDATE' || name === 'EOMONTH';
    if (args.length !== (name === 'DATE' ? 3 : shiftMonth ? 2 : 1)) throw new FormulaError('#VALUE!');
    const system = workbook.date1904;
    const arg = (i: number) => scalar(evaluate(args[i], sheet));
    const integer = (i: number) => Math.trunc(number(arg(i)));
    let serial: number;
    if (name === 'DATE') {
      const year = integer(0);
      if (year < 0 || year > 9999) throw new FormulaError('#NUM!');
      serial = calendarSerial(year < 1900 ? year + 1900 : year, integer(1), integer(2), system);
    } else {
      const input = arg(0);
      const clock = typeof input === 'string' ? parseClockInput(input, system) : null;
      const text = typeof input === 'string'
        ? parseCalendarInput(input, system) ?? (clock?.fmt === 'datetime' ? Math.floor(clock.serial) : null)
        : null;
      if (name === 'DATEVALUE') {
        if (text === null) throw new FormulaError('#VALUE!');
        return text;
      }
      const parts = dateParts(text ?? number(input), system);
      if (!parts) throw new FormulaError('#NUM!');
      if (name === 'YEAR') return parts.year;
      if (name === 'MONTH') return parts.month;
      if (name === 'DAY') return parts.day;
      const month = parts.month + integer(1);
      const end = calendarSerial(parts.year, month + 1, 0, system);
      serial = name === 'EOMONTH' ? end : Math.min(end, calendarSerial(parts.year, month, parts.day, system));
    }
    if (!dateParts(serial, system)) throw new FormulaError('#NUM!');
    return serial;
  }
  function countValues(node: Extract<Node, { kind: 'call' }>, sheet: number) {
    const { name, args } = node;
    if (args.length > 255 || (name === 'COUNTBLANK' && args.length !== 1)) throw new FormulaError('#VALUE!');
    let count = 0;
    function visitArea(area: ReturnType<typeof rangeBounds>) {
      const cells = workbook.sheets[area.sheet].cells;
      const size = (area.er - area.r + 1) * (area.ec - area.c + 1);
      if (name === 'COUNTBLANK') count += size;
      function visit(r: number, c: number) {
        if (--budget < 0) throw new FormulaError('#NUM!');
        if (isBlankCell(cells[cellKey(r, c)])) return;
        const value = resultAt(area.sheet, r, c);
        if (value instanceof FormulaError && value.message === '#CYCLE!') throw value;
        if (name === 'COUNTBLANK') {
          if (value !== '') count--;
        } else if (name === 'COUNTA' || typeof value === 'number') count++;
      }
      // For large areas the empty cells are already accounted for in the area size.
      if (size > 10000) {
        for (const key of Object.keys(cells)) {
          const [r, c] = key.split(',').map(Number);
          if (r >= area.r && r <= area.er && c >= area.c && c <= area.ec) visit(r, c);
        }
      } else {
        for (let r = area.r; r <= area.er; r++)
          for (let c = area.c; c <= area.ec; c++) visit(r, c);
      }
    }
    for (const arg of args) {
      try {
        if (isReference(arg)) {
          visitArea(rangeBounds(arg, sheet));
        } else if (name === 'COUNTBLANK') {
          throw new FormulaError(arg.kind === 'error' ? arg.value : '#VALUE!');
        } else {
          const result = evaluate(arg, sheet);
          if (Array.isArray(result)) {
            count += result.filter(value => name === 'COUNTA' ? value !== undefined : typeof value === 'number').length;
          } else if (name === 'COUNTA' || typeof result === 'number' || typeof result === 'boolean' ||
              (typeof result === 'string' && numericInput.test(result.trim()))) count++;
        }
      } catch (error) {
        if (!(error instanceof FormulaError) || name === 'COUNTBLANK' || error.message === '#CYCLE!') throw error;
        if (name === 'COUNTA') count++;
      }
      if (budget < 0) throw new FormulaError('#NUM!');
    }
    return count;
  }
  function checkType(node: Extract<Node, { kind: 'call' }>, sheet: number): boolean {
    if (node.args.length !== 1) throw new FormulaError('#VALUE!');
    const arg = node.args[0];
    let value: Scalar | undefined;
    try {
      if (isReference(arg)) {
        const area = rangeBounds(arg, sheet);
        if (!isBlankCell(workbook.sheets[area.sheet].cells[cellKey(area.r, area.c)]))
          value = read(area.sheet, area.r, area.c);
      } else value = scalar(evaluate(arg, sheet));
    } catch (error) {
      if (!(error instanceof FormulaError)) throw error;
      return node.name === 'ISERROR' || node.name === 'ISNONTEXT' ||
        (node.name === 'ISNA' && error.message === '#N/A') ||
        (node.name === 'ISERR' && error.message !== '#N/A');
    }
    switch (node.name) {
      case 'ISBLANK': return value === undefined;
      case 'ISNUMBER': return typeof value === 'number';
      case 'ISTEXT': return typeof value === 'string';
      case 'ISNONTEXT': return typeof value !== 'string';
      case 'ISLOGICAL': return typeof value === 'boolean';
      default: return false;
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
      if (isBlankCell(workbook.sheets[area.sheet].cells[cellKey(row, col)])) continue;
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
    return isBlankCell(workbook.sheets[area.sheet].cells[cellKey(row, col)]) ? 0 : read(area.sheet, row, col);
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
      const criterion = scalar(evaluate(criterionNode, sheet));
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
    const cell = workbook.sheets[sheet]?.cells[cellKey(r, c)];
    const value = cell?.v ?? '';
    let result: Scalar | FormulaError = value;
    if (cell?.type === 'boolean') result = value === 'TRUE';
    else if (cell && isFormulaCell(cell)) {
      visiting.add(key);
      try {
        result = scalar(evaluate(parseFormula(value.slice(1)), sheet, key));
        if (typeof result === 'number' && !Number.isFinite(result)) result = new FormulaError('#NUM!');
      } catch (error) {
        result = error instanceof FormulaError ? error : new FormulaError('#VALUE!');
      }
      visiting.delete(key);
    } else if (cell?.type === 'text') result = value;
    else if (cellErrorCode.test(value)) result = new FormulaError(value.toUpperCase());
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
    hyperlink(sheet: number, r: number, c: number) {
      const cell = workbook.sheets[sheet].cells[cellKey(r, c)];
      if (!cell || cell.link || !isFormulaCell(cell)) return cell?.link;
      resultAt(sheet, r, c);
      return formulaLinks.get(`${sheet}!${r},${c}`);
    },
    formatted(sheet: number, r: number, c: number) {
      const value = resultAt(sheet, r, c);
      if (value instanceof FormulaError) return value.message;
      const cell = workbook.sheets[sheet].cells[cellKey(r, c)];
      if (cell?.link && isBlankCell(cell)) return cell.link.display || linkAddress(cell.link);
      return formatValue(value, cell, workbook.date1904);
    },
    isError: (sheet: number, r: number, c: number) => resultAt(sheet, r, c) instanceof FormulaError,
  });
}
export function formatValue(value: Scalar, style?: Pick<CellData, 'fmt' | 'decimals' | 'grouping' | 'xlsxFormat'>, date1904 = false): string {
  const format = style?.fmt;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (style?.xlsxFormat !== undefined) {
    try {
      const rendered = renderFormatCode(style.xlsxFormat, value, date1904);
      if (!rendered && typeof value === 'number' && value < 0 &&
          (format === 'date' || format === 'time' || format === 'datetime' || format === 'duration')) return '########';
      return rendered;
    } catch { /* Use the format category when SSF cannot render an imported code. */ }
  }
  if (typeof value !== 'number') return value;
  if (style && (format === 'number' || format === 'currency' || format === 'percent'))
    return displayNumber(value, style);
  if (style && (format === 'time' || format === 'duration' || format === 'datetime'))
    return displayClock(value, style, date1904);
  if (format === 'date') {
    const date = dateParts(value, date1904);
    return date ? `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}` : '########';
  }
  return String(Number(value.toPrecision(12)));
}

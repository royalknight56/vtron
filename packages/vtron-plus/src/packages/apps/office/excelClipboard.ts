import { cellKey, isFormulaCell, normalizeCell, toDelimited } from './excelModel';
import type { CellData, makeEvaluator, Merge, Sheet } from './excelModel';

interface CopiedCell {
  source: CellData;
  result?: CellData;
}
interface CopiedRange {
  r: number;
  c: number;
  height: number;
  width: number;
  cut: boolean;
  sourceRows?: number[];
  cells: Record<string, CopiedCell>;
}
const escapeHtml = (value: string) => value.replace(/[&<>"]/g, ch =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);

export function copyRange(sheet: Sheet, index: number, bounds: Merge, evaluate: ReturnType<typeof makeEvaluator>, cut = false, hidden?: ReadonlySet<number>) {
  const { r, c, er, ec } = bounds;
  const block: CopiedRange = { r, c, height: er - r + 1, width: ec - c + 1, cut, cells: {} };
  const sourceRows: number[] = [];
  const textRows: string[][] = [];
  const htmlRows: string[] = [];
  for (let row = r; row <= er; row++) {
    if (hidden?.has(row)) continue;
    sourceRows.push(row);
    const texts: string[] = [];
    for (let col = c; col <= ec; col++) {
      const source = sheet.cells[cellKey(row, col)];
      if (!source) { texts.push(''); continue; }
      const value = evaluate(index, row, col);
      texts.push(evaluate.formatted(index, row, col));
      const entry: CopiedCell = { source };
      if (isFormulaCell(source)) {
        if (typeof value === 'boolean') entry.result = { v: value ? 'TRUE' : 'FALSE', type: 'boolean' };
        else if (typeof value === 'string' && !evaluate.isError(index, row, col)) entry.result = { v: value, type: 'text' };
        else entry.result = { v: String(value) };
      }
      block.cells[cellKey(textRows.length, col - c)] = entry;
    }
    textRows.push(texts);
    htmlRows.push('<tr>' + texts.map(t => '<td>' + escapeHtml(t) + '</td>').join('') + '</tr>');
  }
  if (sourceRows.length !== block.height) {
    block.height = sourceRows.length;
    block.sourceRows = sourceRows;
  }
  // Other applications get an ordinary table; our editors can also restore formulas and cell formats.
  const html = '<table data-office-range="' + escapeHtml(JSON.stringify(block)) + '"><tbody>' + htmlRows.join('') + '</tbody></table>';
  return { text: toDelimited(textRows, '\t'), html };
}

export function readCopiedRange(html: string): CopiedRange | undefined {
  if (!html.includes('data-office-range=')) return;
  const template = document.createElement('template');
  template.innerHTML = html;
  const raw = template.content.querySelector('table[data-office-range]')?.getAttribute('data-office-range');
  if (!raw) return;
  try {
    const block = JSON.parse(raw) as CopiedRange;
    const { r, c, height, width } = block;
    if (![r, c, height, width].every(Number.isInteger) || r < 0 || c < 0 || height < 1 || width < 1 ||
        r + height > 10000 || c + width > 256 || !block.cells || typeof block.cells !== 'object') return;
    const { sourceRows } = block;
    if (sourceRows !== undefined && (!Array.isArray(sourceRows) || sourceRows.length !== height ||
        sourceRows.some((n, i) => !Number.isInteger(n) || n < r || n >= 10000 || (i > 0 && n <= sourceRows[i - 1])))) return;
    const cells: Record<string, CopiedCell> = {};
    for (const [key, entry] of Object.entries(block.cells)) {
      const [row, col] = key.split(',').map(Number);
      if (key !== cellKey(row, col) || !Number.isInteger(row) || !Number.isInteger(col) ||
          row < 0 || col < 0 || row >= height || col >= width) return;
      const source = normalizeCell(entry.source);
      if (!source) return;
      const result = normalizeCell(entry.result);
      if (isFormulaCell(source) && (!result || isFormulaCell(result))) return;
      cells[key] = { source, result };
    }
    return { r, c, height, width, sourceRows, cut: block.cut === true, cells };
  } catch {
    return;
  }
}

import { colName, mapFormulaAreas, parseAddress } from './excelModel';

export interface DimensionEdit {
  axis: 'row' | 'col';
  start: number;
  end: number;
  remove: boolean;
}

// Inclusive coordinates. A deleted interval has no image in the edited sheet.
export function resizeSpan(lo: number, hi: number, edit: DimensionEdit): [number, number] | null {
  const { start, end, remove } = edit;
  const count = end - start + 1;
  if (hi < start) return [lo, hi];
  if (!remove) return [lo >= start ? lo + count : lo, hi + count];
  if (lo > end) return [lo - count, hi - count];
  if (lo >= start && hi <= end) return null;
  return [Math.min(lo, start), hi > end ? hi - count : start - 1];
}

function sheetName(qualifier: string, fallback: string) {
  return qualifier ? qualifier.slice(0, -1).replace(/^'|'$/g, '').replace(/''/g, "'") : fallback;
}

export function adjustFormulaForEdit(formula: string, owner: string, editedSheet: string, edit: DimensionEdit) {
  const row = edit.axis === 'row';
  function replaceCoordinate(address: string, index: number) {
    return row ? address.replace(/\d+$/, String(index + 1)) : address.replace(/[A-Z]+/i, colName(index));
  }
  return mapFormulaAreas(formula, (first, last, separator) => {
    const sheet = sheetName(first.qualifier, owner).toLowerCase();
    if (sheet !== editedSheet.toLowerCase() || (last && sheetName(last.qualifier, sheet).toLowerCase() !== sheet))
      return;
    const a = parseAddress(first.address);
    const b = last ? parseAddress(last.address) : a;
    if (!a || !b) return;
    const from = row ? a.r : a.c, to = row ? b.r : b.c;
    const span = resizeSpan(Math.min(from, to), Math.max(from, to), edit);
    if (!span || span[1] >= (row ? 10000 : 256)) return '#REF!';
    const [lo, hi] = span;
    const start = from <= to ? lo : hi, end = from <= to ? hi : lo;
    if (from === start && to === end) return;
    const left = first.qualifier + replaceCoordinate(first.address, start);
    return last ? left + separator + last.qualifier + replaceCoordinate(last.address, end) : left;
  });
}

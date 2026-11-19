import { numericInput, wildcardMatch } from './excelCriteria';
import type { makeEvaluator, Merge, Sheet } from './excelModel';

export const filterOperators = {
  equal: '等于', notEqual: '不等于', greaterThan: '大于', greaterThanOrEqual: '大于或等于',
  lessThan: '小于', lessThanOrEqual: '小于或等于',
} as const;
export type FilterOperator = keyof typeof filterOperators;
export interface FilterRule { operator: FilterOperator; value: string }
export interface CustomFilter { and: boolean; rules: FilterRule[] }
export type ColumnFilter = string[] | CustomFilter;

export function isFilterOperator(value: string): value is FilterOperator {
  return Object.prototype.hasOwnProperty.call(filterOperators, value);
}

export interface AutoFilter extends Merge {
  // Absolute column indexes, with an empty string representing the blank checkbox.
  columns: Record<number, ColumnFilter>;
}

export function validFilter(input?: AutoFilter): AutoFilter | undefined {
  if (!input) return;
  const { r, c, er, ec } = input;
  if (![r, c, er, ec].every(Number.isInteger) || r < 0 || c < 0 || er < r || ec < c || er >= 10000 || ec >= 256) return;
  const columns: Record<number, ColumnFilter> = {};
  for (const [key, list] of Object.entries(input.columns || {})) {
    const col = Number(key);
    if (!Number.isInteger(col) || col < c || col > ec) continue;
    if (Array.isArray(list)) columns[col] = [...new Set(list.filter(v => typeof v === 'string'))];
    else if (list && Array.isArray(list.rules) && list.rules.length >= 1 && list.rules.length <= 2 &&
        list.rules.every(rule => rule && isFilterOperator(rule.operator) && typeof rule.value === 'string'))
      columns[col] = { and: list.and === true, rules: list.rules.map(({ operator, value }) => ({ operator, value })) };
  }
  return { r, c, er, ec, columns };
}

const errors = ['#NULL!', '#DIV/0!', '#VALUE!', '#REF!', '#NAME?', '#NUM!', '#N/A'];
type CellResult = string | number | boolean;
function matchRule({ operator, value }: FilterRule) {
  const text = value.toLowerCase();
  const equality = operator === 'equal' || operator === 'notEqual';
  const tokens = equality && /[?*~]/.test(text) ? text.match(/~[?*~]|[\s\S]/g) : null;
  const error = errors.indexOf(value.toUpperCase());
  const number = numericInput.test(value.trim()) ? Number(value) : undefined;
  const logical = /^(true|false)$/i.test(value);
  const collator = new Intl.Collator(undefined, { sensitivity: 'accent' });
  return (actual: CellResult, isError: boolean) => {
    // Excel stores its nonblanks filter as "notEqual" with one space.
    if (value === ' ' && operator === 'notEqual') return actual !== '';
    if (actual === '') return false;
    let diff: number;
    if (error !== -1) {
      if (!isError) return false;
      diff = errors.indexOf(String(actual)) - error;
    } else if (isError) return false;
    else if (number !== undefined) {
      if (typeof actual !== 'number') return false;
      diff = actual - number;
    } else if (logical) {
      if (typeof actual !== 'boolean') return false;
      diff = Number(actual) - Number(text === 'true');
    } else {
      if (typeof actual !== 'string') return false;
      diff = tokens ? Number(!wildcardMatch(tokens, actual.toLowerCase())) : collator.compare(actual, value);
    }
    switch (operator) {
      case 'equal': return diff === 0;
      case 'notEqual': return diff !== 0;
      case 'greaterThan': return diff > 0;
      case 'greaterThanOrEqual': return diff >= 0;
      case 'lessThan': return diff < 0;
      case 'lessThanOrEqual': return diff <= 0;
    }
  };
}

export function filterRows(filter: AutoFilter | undefined, read: ReturnType<typeof makeEvaluator>, sheet: number, except?: number) {
  const hidden = new Set<number>();
  if (!filter) return hidden;
  const criteria = Object.entries(filter.columns).filter(([col]) => +col !== except).map(([key, condition]) => {
    const col = Number(key);
    if (Array.isArray(condition)) {
      const allowed = new Set(condition.map(v => v.toLowerCase()));
      return (row: number) => allowed.has(read.formatted(sheet, row, col).toLowerCase());
    }
    const rules = condition.rules.map(matchRule);
    return (row: number) => {
      const value = read(sheet, row, col), error = typeof value === 'string' && read.isError(sheet, row, col);
      return condition.and ? rules.every(rule => rule(value, error)) : rules.some(rule => rule(value, error));
    };
  });
  if (criteria.length) {
    for (let r = filter.r + 1; r <= filter.er; r++)
      if (!criteria.every(matches => matches(r))) hidden.add(r);
  }
  return hidden;
}

// A single-cell selection expands up to the surrounding empty rows and columns.
export function filterArea(sheet: Sheet, selection: Merge): Merge {
  if (selection.r !== selection.er || selection.c !== selection.ec) return { ...selection };
  const area = { ...selection };
  const occupied = (r: number, c: number) => !!sheet.cells[r + ',' + c]?.v;
  const rowTouches = (r: number) => {
    for (let c = Math.max(0, area.c - 1); c <= Math.min(255, area.ec + 1); c++) if (occupied(r, c)) return true;
    return false;
  };
  const colTouches = (c: number) => {
    for (let r = area.r; r <= area.er; r++) if (occupied(r, c)) return true;
    return false;
  };
  let changed: boolean;
  do {
    changed = false;
    while (area.r > 0 && rowTouches(area.r - 1)) { area.r--; changed = true; }
    while (area.er < 9999 && rowTouches(area.er + 1)) { area.er++; changed = true; }
    while (area.c > 0 && colTouches(area.c - 1)) { area.c--; changed = true; }
    while (area.ec < 255 && colTouches(area.ec + 1)) { area.ec++; changed = true; }
  } while (changed);
  return area;
}

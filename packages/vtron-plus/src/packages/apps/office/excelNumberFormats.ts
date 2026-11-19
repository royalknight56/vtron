import { format as renderXlsxFormat, get_table } from 'ssf';
import type { CellData } from './excelModel';

type NumberStyle = Pick<CellData, 'fmt' | 'decimals' | 'grouping' | 'xlsxFormat'>;
export const maxDecimals = 30;
export function decimalPlaces(text: string) {
  const [mantissa, exponent = '0'] = text.split(/e/i);
  const digits = (mantissa.split('.')[1] || '').length - Number(exponent);
  return Math.max(0, Math.min(maxDecimals, digits));
}

// Move the decimal point before converting to binary, e.g. 7.9% is the same number as 0.079.
export function scaleDecimal(text: string, power: number) {
  const [mantissa, exponent = '0'] = text.split(/e/i);
  return Number(mantissa + 'e' + (Number(exponent) + power));
}

function classifyNumberStyle(id: number, code: string): NumberStyle {
  if (id === 49 || code === '@') return { fmt: 'text' };
  const pattern = code.split(';')[0].replace(/"[^"]*"|\\.|\[[^\]]*\]|[_*]./g, '');
  const decimal = /[0#]\.([0]+)/.exec(pattern);
  const digits = Math.min(maxDecimals, decimal?.[1].length ?? 0);
  if (id === 9 || id === 10 || pattern.includes('%'))
    return { fmt: 'percent', decimals: id === 9 ? 0 : id === 10 ? 2 : digits };
  const calendar = (code || get_table()[id] || '').split(';')[0].replace(/"[^"]*"|\\.|[_*]./g, '');
  if (/\[(?:h+|m+|s+)\]/i.test(calendar)) return { fmt: 'duration' };
  const tokens = calendar.replace(/\[[^\]]*\]/g, '');
  if (/[hs]/i.test(tokens)) return { fmt: /[yd]/i.test(tokens) ? 'datetime' : 'time' };
  if ((id >= 14 && id <= 17) || /[ymd]/i.test(pattern)) return { fmt: 'date' };
  if ((id >= 5 && id <= 8) || /[¥￥$]/.test(code))
    return { fmt: 'currency', decimals: code ? digits : id <= 6 ? 0 : 2 };
  if ((id >= 1 && id <= 4) || /^(#,##)?0(\.0+)?$/.test(pattern)) {
    return { fmt: 'number', decimals: code ? digits : id % 2 === 0 ? 2 : 0, grouping: code ? pattern.includes(',') : id >= 3 };
  }
  return { fmt: 'general' };
}

// Keep the original Excel format for sections, literals, and other syntax outside our display subset.
export function readNumberStyle(id: number, code: string): NumberStyle {
  const style = classifyNumberStyle(id, code);
  const original = code || id;
  if (writeNumberStyle(style) !== original && (code || id < 164)) style.xlsxFormat = original;
  return style;
}

export function writeNumberStyle(style: NumberStyle): number | string {
  if (style.xlsxFormat !== undefined) return style.xlsxFormat;
  const { fmt, decimals = 2 } = style;
  const fraction = decimals ? '.' + '0'.repeat(decimals) : '';
  if (fmt === 'percent') return decimals === 0 ? 9 : decimals === 2 ? 10 : '0' + fraction + '%';
  if (fmt === 'currency') return '"¥"#,##0' + fraction;
  if (fmt === 'number') {
    const grouped = style.grouping !== false;
    if (decimals === 0) return grouped ? 3 : 1;
    if (decimals === 2) return grouped ? 4 : 2;
    return (grouped ? '#,##0' : '0') + fraction;
  }
  if (fmt === 'time') return 21;
  if (fmt === 'duration') return 46;
  if (fmt === 'datetime') return 'yyyy-mm-dd hh:mm:ss';
  return fmt === 'date' ? 14 : fmt === 'text' ? 49 : 0;
}
export function numberFormatCode(style: NumberStyle) {
  const format = writeNumberStyle(style);
  return typeof format === 'string' ? format : get_table()[format] ?? 'General';
}

export function renderFormatCode(code: string | number, value: string | number, date1904 = false) {
  // SSF splits even quoted semicolons. An escaped literal has the same meaning in Excel.
  const format = typeof code === 'string' && code.includes(';') ? code.replace(/"[^"]*"/g, literal =>
    literal.includes(';') ? literal.slice(1, -1).split(';').map(part => part ? '"' + part + '"' : '').join('\\;') : literal
  ) : code;
  return renderXlsxFormat(format, value, { date1904 });
}

export function adjustFormatDecimals(code: string, delta: number) {
  // Leave literal digits, conditions, scientific exponents and fraction masks intact.
  return code.replace(/"[^"]*"|\[[^\]]*\]|[\\_*].|[0#?,]+(?:\.[0#?]+)?(?:E[+-]?[0#]+|[ /]+[0#?]+\/[0#?]+|\/[0#?]+)?/gi, token => {
    if (!/^[0#,]+(?:\.[0#]+)?$/.test(token) || !/[0#]/.test(token)) return token;
    const [integer, fraction = ''] = token.split('.');
    const digits = delta > 0 && fraction.length < maxDecimals ? fraction + '0'
      : delta < 0 ? fraction.slice(0, -1) : fraction;
    return integer + (digits ? '.' + digits : '');
  });
}

const formatColors: Record<string, string> = {
  black: '#000000', blue: '#0000ff', cyan: '#00ffff', green: '#008000',
  magenta: '#ff00ff', red: '#ff0000', white: '#ffffff', yellow: '#ffff00',
};
export function numberFormatColor(style: NumberStyle, value: string | number | boolean) {
  if (style.xlsxFormat === undefined || typeof value === 'boolean') return;
  const code = numberFormatCode(style);
  if (!/\[(black|blue|cyan|green|magenta|red|white|yellow)\]/i.test(code)) return;
  // Keep the conditions and text placeholders so SSF selects the same section for its color.
  const sections = code.match(/(?:"[^"]*"|[\\_*].|[^;"\\_*])*(?:;|$)/g) || [];
  sections.pop(); // final empty regexp match
  const colorMask = sections.map(section => {
    const syntax = section.replace(/"[^"]*"|[\\_*]./g, '');
    const color = /\[(black|blue|cyan|green|magenta|red|white|yellow)\]/i.exec(syntax)?.[1] || '';
    const condition = /\[(?:<>|<=|>=|[<>=])[^\]]+\]/.exec(syntax)?.[0] || '';
    return condition + '"' + color.toLowerCase() + '"' + (syntax.includes('@') ? '@' : '');
  }).join(';');
  try {
    const marker = renderXlsxFormat(colorMask, typeof value === 'number' ? value : '~');
    return formatColors[marker.replace('~', '')];
  } catch { return; }
}
export function displayClock(value: number, style: NumberStyle, date1904: boolean) {
  if (value < 0 || !Number.isFinite(value)) return '########';
  try {
    return renderXlsxFormat(writeNumberStyle(style), value, { date1904 });
  } catch {
    return renderXlsxFormat(writeNumberStyle({ fmt: style.fmt }), value, { date1904 });
  }
}
const numberFormats = new Map<string, Intl.NumberFormat>();
export function displayNumber(value: number, style: NumberStyle) {
  const { fmt, decimals = 2, grouping = fmt !== 'percent' } = style;
  const key = [fmt, decimals, grouping].join(':');
  let formatter = numberFormats.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('zh-CN', {
      style: fmt === 'currency' || fmt === 'percent' ? fmt : 'decimal',
      currency: 'CNY',
      useGrouping: grouping,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    numberFormats.set(key, formatter);
  }
  return formatter.format(value);
}

import JSZip from 'jszip';
import {
  address,
  cellKey,
  CellData,
  makeEvaluator,
  parseAddress,
  Sheet,
  validateWorkbook,
  Workbook,
} from './excelModel';

const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const xml = (value: unknown) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(
      /[<>&"']/g,
      (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[ch]!
    );
const header = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const tags = (root: Document | Element, name: string) => Array.from(root.getElementsByTagNameNS('*', name));
const first = (root: Document | Element, name: string) => tags(root, name)[0];
function parseXML(value: string) {
  const doc = new DOMParser().parseFromString(value, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('工作簿 XML 损坏');
  return doc;
}
export function decodeDataText(raw: string) {
  if (!raw.startsWith('data:')) return raw;
  const comma = raw.indexOf(',');
  if (comma < 0) throw new Error('文件内容不正确');
  const payload = raw.slice(comma + 1);
  return /;base64/i.test(raw.slice(0, comma))
    ? new TextDecoder().decode(Uint8Array.from(atob(payload), (c) => c.charCodeAt(0)))
    : decodeURIComponent(payload);
}
export async function importXlsx(input: ArrayBuffer | string): Promise<Workbook> {
  const raw = typeof input === 'string' ? input.replace(/^data:[^,]*,/, '') : input;
  const zip = await JSZip.loadAsync(raw, { base64: typeof raw === 'string' });
  let size = 0;
  for (const entry of Object.values(zip.files)) {
    size += (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 0;
    if (size > 40 * 1024 * 1024) throw new Error('工作簿解压后过大');
  }
  const read = async (path: string) => {
    const file = zip.file(path);
    if (!file) throw new Error(`缺少工作簿文件：${path}`);
    return parseXML(await file.async('string'));
  };
  const workbook = await read('xl/workbook.xml');
  const relations = await read('xl/_rels/workbook.xml.rels');
  const rels = new Map(
    tags(relations, 'Relationship')
      .filter((el) => el.getAttribute('TargetMode') !== 'External')
      .map((el) => [el.getAttribute('Id'), el.getAttribute('Target') || ''])
  );
  const strings: string[] = [];
  if (zip.file('xl/sharedStrings.xml'))
    for (const item of tags(await read('xl/sharedStrings.xml'), 'si'))
      strings.push(
        tags(item, 't')
          .map((el) => el.textContent || '')
          .join('')
      );
  const styles: Partial<CellData>[] = [];
  if (zip.file('xl/styles.xml')) {
    const doc = await read('xl/styles.xml');
    const fonts = first(doc, 'fonts')?.children || [];
    const fills = first(doc, 'fills')?.children || [];
    const borders = first(doc, 'borders')?.children || [];
    const custom = new Map(
      tags(doc, 'numFmt').map((el) => [+el.getAttribute('numFmtId')!, el.getAttribute('formatCode') || ''])
    );
    const color = (el?: Element) => {
      const value = el?.getAttribute('rgb');
      return value && /^[0-9A-F]{8}$/i.test(value) ? `#${value.slice(-6)}` : undefined;
    };
    for (const xf of Array.from(first(doc, 'cellXfs')?.children || [])) {
      const font = fonts[+(xf.getAttribute('fontId') || 0)],
        fill = fills[+(xf.getAttribute('fillId') || 0)],
        border = borders[+(xf.getAttribute('borderId') || 0)],
        align = first(xf, 'alignment');
      const fmt = +(xf.getAttribute('numFmtId') || 0),
        code = custom.get(fmt) || '';
      const fontColor = font ? color(first(font, 'color')) : undefined;
      const bg = fill ? color(first(fill, 'fgColor')) : undefined;
      const style: Partial<CellData> = {
        b: !!font && !!first(font, 'b'),
        i: !!font && !!first(font, 'i'),
        u: !!font && !!first(font, 'u'),
        ff: font ? first(font, 'name')?.getAttribute('val') || undefined : undefined,
        fs: font ? +(first(font, 'sz')?.getAttribute('val') || 11) : 11,
        fc: fontColor,
        bg,
        a: ['left', 'center', 'right'].includes(align?.getAttribute('horizontal') || '')
          ? (align!.getAttribute('horizontal') as CellData['a'])
          : undefined,
        wrap: align?.getAttribute('wrapText') === '1',
        border: !!border && Array.from(border.children).some((el) => el.hasAttribute('style')),
        fmt:
          fmt === 9 || fmt === 10 || code.includes('%')
            ? 'percent'
            : (fmt >= 14 && fmt <= 22) || /[ymd]/i.test(code.replace(/"[^"]*"/g, ''))
              ? 'date'
              : /[¥￥$]/.test(code) || (fmt >= 5 && fmt <= 8)
                ? 'currency'
                : fmt === 2 || fmt === 4
                  ? 'number'
                  : 'general',
      };
      styles.push(style);
    }
  }
  const sheets: Sheet[] = [];
  for (const [index, info] of tags(workbook, 'sheet').entries()) {
    if (index >= 100) throw new Error('最多支持 100 张工作表');
    const target = rels.get(info.getAttributeNS(REL, 'id') || info.getAttribute('r:id'));
    if (!target) throw new Error('工作表引用不正确');
    const parts = (target.startsWith('/') ? target.slice(1) : `xl/${target}`).split('/');
    const normalized: string[] = [];
    for (const part of parts) {
      if (part === '..') normalized.pop();
      else if (part && part !== '.') normalized.push(part);
    }
    const doc = await read(normalized.join('/'));
    const sheet: Sheet = {
      name: info.getAttribute('name') || `Sheet${index + 1}`,
      cells: {},
      widths: {},
      heights: {},
      merges: [],
    };
    for (const item of tags(doc, 'c')) {
      const coord = parseAddress(item.getAttribute('r') || '');
      if (!coord) continue;
      const t = item.getAttribute('t'),
        value = first(item, 'v')?.textContent || '',
        formula = first(item, 'f')?.textContent;
      let text = value;
      if (formula) text = `=${formula}`;
      else if (t === 's') text = strings[+value] || '';
      else if (t === 'inlineStr')
        text = tags(item, 't')
          .map((el) => el.textContent || '')
          .join('');
      else if (t === 'b') text = value === '1' ? '=TRUE' : '=FALSE';
      else if (t === 'd') text = String((new Date(value).getTime() - Date.UTC(1899, 11, 30)) / 86400000);
      sheet.cells[cellKey(coord.r, coord.c)] = { v: text, ...styles[+(item.getAttribute('s') || 0)] };
    }
    for (const item of tags(doc, 'col'))
      for (
        let c = +(item.getAttribute('min') || 1) - 1;
        c < Math.min(256, +(item.getAttribute('max') || 1));
        c++
      )
        sheet.widths![c] = +(item.getAttribute('width') || 12) * 7 + 5;
    for (const item of tags(doc, 'row'))
      if (item.hasAttribute('ht'))
        sheet.heights![+(item.getAttribute('r') || 1) - 1] = (+(item.getAttribute('ht') || 18) * 4) / 3;
    for (const item of tags(doc, 'mergeCell')) {
      const [a, b] = (item.getAttribute('ref') || '').split(':').map(parseAddress);
      if (a && b) sheet.merges!.push({ ...a, er: b.r, ec: b.c });
    }
    sheets.push(sheet);
  }
  return validateWorkbook({ sheets });
}
export async function exportXlsx(workbook: Workbook): Promise<Blob> {
  const zip = new JSZip(),
    read = makeEvaluator(workbook);
  const styles: Partial<CellData>[] = [{}],
    styleMap = new Map<string, number>([['{}', 0]]);
  const styleId = (cell: CellData) => {
    const style: Partial<CellData> = {};
    for (const key of ['b', 'i', 'u', 'a', 'bg', 'fc', 'ff', 'fs', 'wrap', 'border', 'fmt'] as const)
      if (cell[key] !== undefined) Object.assign(style, { [key]: cell[key] });
    const key = JSON.stringify(style);
    if (!styleMap.has(key)) {
      styleMap.set(key, styles.length);
      styles.push(style);
    }
    return styleMap.get(key)!;
  };
  const types = `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${workbook.sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;
  zip.file('[Content_Types].xml', header + types);
  zip.file(
    '_rels/.rels',
    header +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`
  );
  zip.file(
    'xl/workbook.xml',
    header +
      `<workbook xmlns="${NS}" xmlns:r="${REL}"><bookViews><workbookView/></bookViews><sheets>${workbook.sheets.map((s, i) => `<sheet name="${xml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`
  );
  zip.file(
    'xl/_rels/workbook.xml.rels',
    header +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${workbook.sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rStyles" Type="${REL}/styles" Target="styles.xml"/></Relationships>`
  );
  workbook.sheets.forEach((sheet, index) => {
    const rows = new Map<number, string[]>();
    let maxR = 0,
      maxC = 0;
    for (const [key, cell] of Object.entries(sheet.cells).sort(([a], [b]) => {
      const [ar, ac] = a.split(',').map(Number),
        [br, bc] = b.split(',').map(Number);
      return ar - br || ac - bc;
    })) {
      const [r, c] = key.split(',').map(Number),
        s = styleId(cell);
      maxR = Math.max(maxR, r);
      maxC = Math.max(maxC, c);
      let content = '',
        type = '';
      if (cell.v.startsWith('=')) {
        const result = read(index, r, c);
        const value = result === '#CYCLE!' ? '#REF!' : result;
        type =
          typeof value === 'boolean'
            ? ' t="b"'
            : typeof value === 'string'
              ? value.startsWith('#')
                ? ' t="e"'
                : ' t="str"'
              : '';
        content = `<f>${xml(cell.v.slice(1))}</f><v>${xml(typeof value === 'boolean' ? +value : value)}</v>`;
      } else if (cell.v !== '' && /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(cell.v))
        content = `<v>${xml(cell.v)}</v>`;
      else {
        type = ' t="inlineStr"';
        content = `<is><t xml:space="preserve">${xml(cell.v.startsWith("'") ? cell.v.slice(1) : cell.v)}</t></is>`;
      }
      if (!rows.has(r)) rows.set(r, []);
      rows.get(r)!.push(`<c r="${address(r, c)}" s="${s}"${type}>${content}</c>`);
    }
    const cols = Object.entries(sheet.widths || {})
      .map(
        ([c, width]) =>
          `<col min="${+c + 1}" max="${+c + 1}" width="${Math.max(1, (width - 5) / 7).toFixed(2)}" customWidth="1"/>`
      )
      .join('');
    const merges = (sheet.merges || [])
      .map((m) => `<mergeCell ref="${address(m.r, m.c)}:${address(m.er, m.ec)}"/>`)
      .join('');
    zip.file(
      `xl/worksheets/sheet${index + 1}.xml`,
      header +
        `<worksheet xmlns="${NS}"><dimension ref="A1:${address(maxR, maxC)}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="18"/>${cols ? `<cols>${cols}</cols>` : ''}<sheetData>${[...rows].map(([r, cells]) => `<row r="${r + 1}"${sheet.heights?.[r] ? ` ht="${sheet.heights[r] * 0.75}" customHeight="1"` : ''}>${cells.join('')}</row>`).join('')}</sheetData>${merges ? `<mergeCells count="${sheet.merges!.length}">${merges}</mergeCells>` : ''}<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`
    );
  });
  const formats: Record<string, number> = { general: 0, number: 4, currency: 164, percent: 10, date: 14 };
  const fonts = styles
    .map(
      (s) =>
        `<font>${s.b ? '<b/>' : ''}${s.i ? '<i/>' : ''}${s.u ? '<u/>' : ''}<sz val="${s.fs || 11}"/><color rgb="FF${(s.fc || '#202020').slice(1).toUpperCase()}"/><name val="${xml(s.ff || 'Calibri')}"/></font>`
    )
    .join('');
  const fills =
    '<fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    styles
      .map(
        (s) =>
          `<fill><patternFill patternType="solid"><fgColor rgb="FF${(s.bg || '#FFFFFF').slice(1).toUpperCase()}"/><bgColor indexed="64"/></patternFill></fill>`
      )
      .join('');
  const borders =
    '<border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF808080"/></left><right style="thin"><color rgb="FF808080"/></right><top style="thin"><color rgb="FF808080"/></top><bottom style="thin"><color rgb="FF808080"/></bottom><diagonal/></border>';
  const xfs = styles
    .map(
      (s, i) =>
        `<xf numFmtId="${formats[s.fmt || 'general']}" fontId="${i}" fillId="${s.bg ? i + 2 : 0}" borderId="${s.border ? 1 : 0}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment vertical="center"${s.a ? ` horizontal="${s.a}"` : ''}${s.wrap ? ' wrapText="1"' : ''}/></xf>`
    )
    .join('');
  zip.file(
    'xl/styles.xml',
    header +
      `<styleSheet xmlns="${NS}"><numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;¥&quot;#,##0.00"/></numFmts><fonts count="${styles.length}">${fonts}</fonts><fills count="${styles.length + 2}">${fills}</fills><borders count="2">${borders}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${styles.length}">${xfs}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
  );
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compression: 'DEFLATE',
  });
}

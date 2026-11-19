import { filterRows, isFilterOperator, type AutoFilter, type FilterRule } from './excelFilter';
import { readNumberStyle, writeNumberStyle } from './excelNumberFormats';
import JSZip from 'jszip';
import { parseCalendarInput, parseClockInput, serialFromTimestamp } from './excelDates';
import {
  address,
  colName,
  cellKey,
  cellErrorCode,
  CellData,
  CellLink,
  makeEvaluator,
  isFormulaCell,
  parseAddress,
  numericInput,
  shiftFormula,
  sheetSelection,
  Sheet,
  validateWorkbook,
  Workbook,
} from './excelModel';

const rowVisibilityNamespace = 'urn:vtron:spreadsheet:row-visibility:1';
const compatibilityNamespace = 'http://schemas.microsoft.com/office/spreadsheetml/2024/workbookCompatibilityVersion';
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
function decodeCellText(value: string) {
  return value.replace(/_x([0-9a-f]{4})_/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}
function readCellText(item: Element) {
  return tags(item, 't').filter(el => el.parentElement?.localName !== 'rPh')
    .map(el => decodeCellText(el.textContent || '')).join('');
}
function encodeCellText(value: string) {
  const escaped = value.replace(/_(?=x[0-9a-f]{4}_)|[\x00-\x08\x0b-\x1f\ud800-\udfff\ufffe\uffff]/giu,
    ch => '_x' + ch.charCodeAt(0).toString(16).padStart(4, '0') + '_');
  return xml(escaped);
}
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
  const version = workbook.getElementsByTagNameNS(compatibilityNamespace, 'version')[0];
  const compatibility = version && {
    setVersion: Number(version.getAttribute('setVersion')),
    warnBelowVersion: Number(version.getAttribute('warnBelowVersion')) || undefined,
  };
  const date1904 = ['1', 'true'].includes(first(workbook, 'workbookPr')?.getAttribute('date1904') || '');
  const relations = await read('xl/_rels/workbook.xml.rels');
  const rels = new Map(
    tags(relations, 'Relationship')
      .filter((el) => el.getAttribute('TargetMode') !== 'External')
      .map((el) => [el.getAttribute('Id'), el.getAttribute('Target') || ''])
  );
  const strings: string[] = [];
  if (zip.file('xl/sharedStrings.xml'))
    for (const item of tags(await read('xl/sharedStrings.xml'), 'si'))
      strings.push(readCellText(item));
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
        ...readNumberStyle(fmt, code),
      };
      styles.push(style);
    }
  }
  const manualHidden = new Map<number, Set<number>>();
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
    const state = info.getAttribute('state');
    if (state === 'hidden' || state === 'veryHidden') sheet.state = state;
    const views = tags(doc, 'sheetView');
    const view = views.find(v => v.getAttribute('workbookViewId') === '0') || views[0];
    if (view) {
      sheet.showGridLines = !['false', '0'].includes(view.getAttribute('showGridLines') || '');
      sheet.showFormulas = ['true', '1'].includes(view.getAttribute('showFormulas') || '');
      sheet.zoom = Number(view.getAttribute('zoomScale') || 100);
      const pane = first(view, 'pane');
      if (pane && ['frozen', 'frozenSplit'].includes(pane.getAttribute('state') || '')) {
        sheet.frozenRows = Number(pane.getAttribute('ySplit'));
        sheet.frozenCols = Number(pane.getAttribute('xSplit'));
      }
      const activePane = pane?.getAttribute('activePane') || 'topLeft';
      const selection = tags(view, 'selection').find(s => (s.getAttribute('pane') || 'topLeft') === activePane);
      if (selection) {
        const ranges = (selection.getAttribute('sqref') || '').trim().split(/\s+/);
        const current = Number(selection.getAttribute('activeCellId') || 0);
        sheet.selection = sheetSelection(selection.getAttribute('activeCell') || '', ranges[current] || '');
      }
    }
    const shared = new Map<string, { r: number; c: number; formula: string }>();
    const followers: { r: number; c: number; id: string }[] = [];
    for (const item of tags(doc, 'c')) {
      const coord = parseAddress(item.getAttribute('r') || '');
      if (!coord) continue;
      const t = item.getAttribute('t'),
        value = first(item, 'v')?.textContent || '',
        formula = first(item, 'f');
      let text = value;
      if (formula && (formula.textContent || formula.getAttribute('t') === 'shared')) {
        text = '=' + (formula.textContent || '');
        if (formula.getAttribute('t') === 'shared') {
          const id = formula.getAttribute('si');
          if (id === null) throw new Error('共享公式缺少编号');
          if (formula.textContent) shared.set(id, { ...coord, formula: text });
          else followers.push({ ...coord, id });
        }
      } else if (t === 's') text = strings[+value] || '';
      else if (t === 'inlineStr') text = readCellText(item);
      else if (t === 'str') text = decodeCellText(value);
      else if (t === 'b') text = value === '1' || value === 'true' ? 'TRUE' : 'FALSE';
      else if (t === 'd') {
        // A timezone-free XLSX datetime is a calendar value; do not apply the browser's timezone.
        const zoned = value.includes('T') && !/(Z|[+-]\d\d:\d\d)$/i.test(value) ? value + 'Z' : value;
        const serial = parseCalendarInput(value, date1904) ?? parseClockInput(value, date1904)?.serial ??
          serialFromTimestamp(Date.parse(zoned), date1904);
        if (!Number.isFinite(serial)) throw new Error(`单元格 ${address(coord.r, coord.c)} 的日期无效`);
        text = String(serial);
      }
      const cell: CellData = { v: text, ...styles[+(item.getAttribute('s') || 0)] };
      if (!formula && (t === 's' || t === 'inlineStr' || t === 'str')) cell.type = 'text';
      if (!formula && t === 'b') cell.type = 'boolean';
      if (t === 'd' && (!cell.fmt || cell.fmt === 'general')) {
        cell.fmt = parseClockInput(value, date1904)?.fmt ?? (value.includes('T') ? 'datetime' : 'date');
        delete cell.xlsxFormat;
      }
      sheet.cells[cellKey(coord.r, coord.c)] = cell;
    }
    for (const { r, c, id } of followers) {
      const master = shared.get(id);
      if (!master) throw new Error(`单元格 ${address(r, c)} 缺少共享公式的主单元格`);
      sheet.cells[cellKey(r, c)].v = shiftFormula(master.formula, r - master.r, c - master.c);
    }
    for (const item of tags(doc, 'col'))
      for (
        let c = +(item.getAttribute('min') || 1) - 1;
        c < Math.min(256, +(item.getAttribute('max') || 1));
        c++
      )
        sheet.widths![c] = +(item.getAttribute('width') || 12) * 7 + 5;
    for (const item of tags(doc, 'row')) {
      const row = Number(item.getAttribute('r')) - 1;
      if (['1', 'true'].includes(item.getAttribute('hidden') || '')) (sheet.hiddenRows ??= []).push(row);
      if (item.hasAttribute('ht'))
        sheet.heights![row] = (Number(item.getAttribute('ht')) * 4) / 3;
    }
    const manualRows = doc.getElementsByTagNameNS(rowVisibilityNamespace, 'manualRows')[0];
    if (manualRows?.textContent)
      manualHidden.set(index, new Set(manualRows.textContent.trim().split(/\s+/).map(n => Number(n) - 1)));
    const auto = Array.from(doc.documentElement.children).find(el => el.localName === 'autoFilter');
    if (auto) {
      const [start, end = start] = (auto.getAttribute('ref') || '').split(':').map(parseAddress);
      if (start && end) {
        const columns: AutoFilter['columns'] = {};
        for (const field of tags(auto, 'filterColumn')) {
          const col = start.c + Number(field.getAttribute('colId'));
          const custom = first(field, 'customFilters');
          if (custom) {
            const rules: FilterRule[] = [];
            for (const item of tags(custom, 'customFilter')) {
              const operator = item.getAttribute('operator') || 'equal';
              if (isFilterOperator(operator) && item.hasAttribute('val'))
                rules.push({ operator, value: decodeCellText(item.getAttribute('val')!) });
            }
            columns[col] = { and: ['true', '1'].includes(custom.getAttribute('and') || ''), rules };
            continue;
          }
          const filters = first(field, 'filters');
          if (!filters || tags(filters, 'dateGroupItem').length) continue;
          const values = tags(filters, 'filter').map(el => decodeCellText(el.getAttribute('val') || ''));
          if (['1', 'true'].includes(filters.getAttribute('blank') || '')) values.push('');
          columns[col] = values;
        }
        sheet.autoFilter = { ...start, er: end.r, ec: end.c, columns };
      }
    }
    for (const item of tags(doc, 'mergeCell')) {
      const [a, b] = (item.getAttribute('ref') || '').split(':').map(parseAddress);
      if (a && b) sheet.merges!.push({ ...a, er: b.r, ec: b.c });
    }
    const hyperlinks = tags(doc, 'hyperlink');
    if (hyperlinks.length) {
      const filename = normalized.pop()!;
      const relPath = [...normalized, '_rels', filename + '.rels'].join('/');
      const targets = new Map<string | null, string | null>();
      if (zip.file(relPath)) {
        for (const rel of tags(await read(relPath), 'Relationship'))
          if (rel.getAttribute('Type')?.endsWith('/hyperlink') && rel.getAttribute('TargetMode') === 'External')
            targets.set(rel.getAttribute('Id'), rel.getAttribute('Target'));
      }
      let linkedCells = 0;
      for (const element of hyperlinks) {
        const [start, end = start] = (element.getAttribute('ref') || '').split(':').map(parseAddress);
        if (!start || !end || end.r < start.r || end.c < start.c) continue;
        const id = element.getAttributeNS(REL, 'id') || element.getAttribute('r:id');
        const target = id ? targets.get(id) : undefined;
        const location = element.getAttribute('location');
        if ((id && !target) || (!target && !location)) continue;
        const link: CellLink = { target: target || undefined, location: location || undefined,
          tooltip: element.getAttribute('tooltip') || undefined, display: element.getAttribute('display') || undefined };
        linkedCells += (end.r - start.r + 1) * (end.c - start.c + 1);
        if (linkedCells > 100000) throw new Error('工作表中的超链接区域过大');
        for (let r = start.r; r <= end.r; r++) for (let c = start.c; c <= end.c; c++) {
          const cell = sheet.cells[cellKey(r, c)] ??= { v: '' };
          cell.link = link;
        }
      }
    }
    sheets.push(sheet);
  }
  const activeTab = Number(first(workbook, 'workbookView')?.getAttribute('activeTab') || 0);
  const book = validateWorkbook({ sheets, date1904, activeTab, compatibility });
  const evaluator = makeEvaluator(book);
  book.sheets.forEach((sheet, index) => {
    if (!sheet.hiddenRows || !sheet.autoFilter) return;
    const filtered = filterRows(sheet.autoFilter, evaluator, index);
    sheet.hiddenRows = sheet.hiddenRows.filter(row => !filtered.has(row) || manualHidden.get(index)?.has(row));
    if (!sheet.hiddenRows.length) delete sheet.hiddenRows;
  });
  return book;
}
function sheetViewXml(sheet: Sheet, selected: boolean) {
  const rows = sheet.frozenRows || 0, cols = sheet.frozenCols || 0;
  const attributes = ['workbookViewId="0"'];
  if (selected) attributes.push('tabSelected="1"');
  if (sheet.showGridLines === false) attributes.push('showGridLines="0"');
  if (sheet.showFormulas) attributes.push('showFormulas="1"');
  if (sheet.zoom && sheet.zoom !== 100) attributes.push(`zoomScale="${sheet.zoom}"`);
  const selection = sheet.selection || { activeCell: 'A1', sqref: 'A1' };
  const active = parseAddress(selection.activeCell)!;
  let pane = '', paneAttribute = '';
  if (rows || cols) {
    const right = cols > 0 && active.c >= cols;
    const bottom = rows > 0 && active.r >= rows;
    const activePane = bottom ? (right ? 'bottomRight' : 'bottomLeft') : (right ? 'topRight' : 'topLeft');
    paneAttribute = ` pane="${activePane}"`;
    pane = `<pane${cols ? ` xSplit="${cols}"` : ''}${rows ? ` ySplit="${rows}"` : ''} topLeftCell="${address(rows, cols)}" activePane="${activePane}" state="frozen"/>`;
  }
  return `<sheetViews><sheetView ${attributes.join(' ')}>${pane}<selection${paneAttribute} activeCell="${xml(selection.activeCell)}" sqref="${xml(selection.sqref)}"/></sheetView></sheetViews>`;
}

function filterRef(filter: AutoFilter, absolute = false) {
  const cell = (r: number, c: number) => absolute ? '$' + colName(c) + '$' + (r + 1) : address(r, c);
  return cell(filter.r, filter.c) + ':' + cell(filter.er, filter.ec);
}
function filterXml(filter?: AutoFilter) {
  if (!filter) return '';
  const attribute = (value: string) => encodeCellText(value).replace(/\n/g, '_x000a_').replace(/\t/g, '_x0009_');
  const columns = Object.entries(filter.columns).map(([col, condition]) => {
    let content: string;
    if (Array.isArray(condition)) {
      const items = condition.filter(v => v !== '').map(v => `<filter val="${attribute(v)}"/>`).join('');
      content = `<filters${condition.includes('') ? ' blank="1"' : ''}>${items}</filters>`;
    } else {
      const rules = condition.rules.map(rule => `<customFilter operator="${rule.operator}" val="${attribute(rule.value)}"/>`).join('');
      content = `<customFilters${condition.and && condition.rules.length === 2 ? ' and="1"' : ''}>${rules}</customFilters>`;
    }
    return `<filterColumn colId="${+col - filter.c}">${content}</filterColumn>`;
  });
  return `<autoFilter ref="${filterRef(filter)}">${columns.join('')}</autoFilter>`;
}

export async function exportXlsx(workbook: Workbook): Promise<Blob> {
  const zip = new JSZip(),
    read = makeEvaluator(workbook);
  const styles: Partial<CellData>[] = [{}],
    styleMap = new Map<string, number>([['{}', 0]]);
  const styleId = (cell: CellData) => {
    const style: Partial<CellData> = {};
    for (const key of ['b', 'i', 'u', 'a', 'bg', 'fc', 'ff', 'fs', 'wrap', 'border', 'fmt', 'decimals', 'grouping', 'xlsxFormat'] as const)
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
  const filterNames = workbook.sheets.map((sheet, index) => sheet.autoFilter
    ? `<definedName name="_xlnm._FilterDatabase" localSheetId="${index}" hidden="1">${xml("'" + sheet.name.replace(/'/g, "''") + "'!" + filterRef(sheet.autoFilter, true))}</definedName>`
    : '').join('');
  const version = workbook.compatibility;
  const extension = version
    ? `<extLst><ext uri="{D14903EA-33C4-47F7-8F05-3474C54BE107}" xmlns:xlwcv="${compatibilityNamespace}"><xlwcv:version setVersion="${version.setVersion}"${version.warnBelowVersion ? ` warnBelowVersion="${version.warnBelowVersion}"` : ''}/></ext></extLst>`
    : '';
  zip.file(
    'xl/workbook.xml',
    header +
      `<workbook xmlns="${NS}" xmlns:r="${REL}">${workbook.date1904 ? '<workbookPr date1904="1"/>' : ''}<bookViews><workbookView activeTab="${workbook.activeTab ?? 0}"/></bookViews><sheets>${workbook.sheets.map((s, i) => `<sheet name="${xml(s.name)}" sheetId="${i + 1}"${s.state ? ` state="${s.state}"` : ''} r:id="rId${i + 1}"/>`).join('')}</sheets>${filterNames ? `<definedNames>${filterNames}</definedNames>` : ''}<calcPr calcId="191029" fullCalcOnLoad="1"/>${extension}</workbook>`
  );
  zip.file(
    'xl/_rels/workbook.xml.rels',
    header +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${workbook.sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rStyles" Type="${REL}/styles" Target="styles.xml"/></Relationships>`
  );
  workbook.sheets.forEach((sheet, index) => {
    const rows = new Map<number, string[]>();
    const hidden = filterRows(sheet.autoFilter, read, index);
    // SpreadsheetML uses the same hidden flag for both causes. Keep the overlap so clearing a filter
    // after reopening our workbook can restore the original manual row visibility.
    const overlap = sheet.hiddenRows?.filter(row => hidden.has(row)).map(row => row + 1);
    const visibilityExtension = overlap?.length
      ? `<extLst><ext uri="{82C50885-2BC0-43F8-A662-226BD1A54C70}"><manualRows xmlns="${rowVisibilityNamespace}">${overlap.join(' ')}</manualRows></ext></extLst>`
      : '';
    for (const row of sheet.hiddenRows || []) hidden.add(row);
    const hyperlinks: string[] = [], linkRels: string[] = [];
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
      if (cell.link) {
        const { target, location, tooltip, display } = cell.link;
        let rel = '';
        if (target) {
          const id = 'rId' + (linkRels.length + 1);
          linkRels.push(`<Relationship Id="${id}" Type="${REL}/hyperlink" Target="${xml(target)}" TargetMode="External"/>`);
          rel = ` r:id="${id}"`;
        }
        hyperlinks.push(`<hyperlink ref="${address(r, c)}"${rel}${location ? ` location="${xml(location)}"` : ''}${tooltip ? ` tooltip="${xml(tooltip)}"` : ''}${display ? ` display="${xml(display)}"` : ''}/>`);
      }
      let content = '',
        type = '';
      if (cell.type === 'boolean') {
        type = ' t="b"';
        content = `<v>${cell.v === 'TRUE' ? 1 : 0}</v>`;
      } else if (isFormulaCell(cell)) {
        const result = read(index, r, c);
        const error = read.isError(index, r, c);
        const value = error && result === '#CYCLE!' ? '#REF!' : result;
        type =
          typeof value === 'boolean'
            ? ' t="b"'
            : typeof value === 'string'
              ? error
                ? ' t="e"'
                : ' t="str"'
              : '';
        content = `<f>${xml(cell.v.slice(1))}</f><v>${typeof value === 'string' ? encodeCellText(value) : xml(typeof value === 'boolean' ? +value : value)}</v>`;
      } else if (!cell.type && cellErrorCode.test(cell.v)) {
        type = ' t="e"';
        content = `<v>${xml(cell.v.toUpperCase() === '#CYCLE!' ? '#REF!' : cell.v.toUpperCase())}</v>`;
      } else if (!cell.type && numericInput.test(cell.v))
        content = `<v>${xml(cell.v)}</v>`;
      else if (cell.v !== '' || cell.type === 'text') {
        const value = !cell.type && cell.v.startsWith("'") ? cell.v.slice(1) : cell.v;
        type = ' t="inlineStr"';
        content = `<is><t xml:space="preserve">${encodeCellText(value)}</t></is>`;
      }
      if (!rows.has(r)) rows.set(r, []);
      rows.get(r)!.push(`<c r="${address(r, c)}" s="${s}"${type}>${content}</c>`);
    }
    for (const row of [...Object.keys(sheet.heights || {}).map(Number), ...hidden]) {
      if (!rows.has(row)) rows.set(row, []);
      maxR = Math.max(maxR, row);
    }
    for (const merge of sheet.merges || []) {
      maxR = Math.max(maxR, merge.er);
      maxC = Math.max(maxC, merge.ec);
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
    if (linkRels.length) zip.file(`xl/worksheets/_rels/sheet${index + 1}.xml.rels`, header +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${linkRels.join('')}</Relationships>`);
    zip.file(
      `xl/worksheets/sheet${index + 1}.xml`,
      header +
        `<worksheet xmlns="${NS}" xmlns:r="${REL}">${Object.keys(sheet.autoFilter?.columns || {}).length ? '<sheetPr filterMode="1"/>' : ''}<dimension ref="A1:${address(maxR, maxC)}"/>${sheetViewXml(sheet, index === (workbook.activeTab ?? 0))}<sheetFormatPr defaultRowHeight="18"/>${cols ? `<cols>${cols}</cols>` : ''}<sheetData>${[...rows].sort(([a], [b]) => a - b).map(([r, cells]) => `<row r="${r + 1}"${hidden.has(r) ? ' hidden="1"' : ''}${sheet.heights?.[r] ? ` ht="${sheet.heights[r] * 0.75}" customHeight="1"` : ''}>${cells.join('')}</row>`).join('')}</sheetData>${filterXml(sheet.autoFilter)}${merges ? `<mergeCells count="${sheet.merges!.length}">${merges}</mergeCells>` : ''}${hyperlinks.length ? `<hyperlinks>${hyperlinks.join('')}</hyperlinks>` : ''}<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>${visibilityExtension}</worksheet>`
    );
  });
  const customFormats = new Map<string, number>();
  function numberFormatId(style: Partial<CellData>) {
    const format = writeNumberStyle(style);
    if (typeof format === 'number') return format;
    if (!customFormats.has(format)) customFormats.set(format, 164 + customFormats.size);
    return customFormats.get(format)!;
  }
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
        `<xf numFmtId="${numberFormatId(s)}" fontId="${i}" fillId="${s.bg ? i + 2 : 0}" borderId="${s.border ? 1 : 0}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment vertical="center"${s.a ? ` horizontal="${s.a}"` : ''}${s.wrap ? ' wrapText="1"' : ''}/></xf>`
    )
    .join('');
  zip.file(
    'xl/styles.xml',
    header +
      `<styleSheet xmlns="${NS}"><numFmts count="${customFormats.size}">${[...customFormats].map(([code, id]) => `<numFmt numFmtId="${id}" formatCode="${xml(code)}"/>`).join('')}</numFmts><fonts count="${styles.length}">${fonts}</fonts><fills count="${styles.length + 2}">${fills}</fills><borders count="2">${borders}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${styles.length}">${xfs}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
  );
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compression: 'DEFLATE',
  });
}

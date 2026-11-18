import JSZip from 'jszip';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
export const wordPageBreak = '<span data-word-page-break="" contenteditable="false"></span>';
export const wordMarginSides = ['top', 'right', 'bottom', 'left'] as const;
export type WordMargins = Record<(typeof wordMarginSides)[number], number>;
export interface WordPageLayout {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  margins: WordMargins;
}
export interface WordDocument {
  html: string;
  layout: WordPageLayout;
}

// Store page dimensions and margins in twips, the units used by DOCX.
export const wordDefaultLayout: WordPageLayout = {
  width: 11906,
  height: 16838,
  orientation: 'portrait',
  margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
};
export const wordMmToTwips = (mm: number) => Math.round((mm * 1440) / 25.4);
export const wordTwipsToMm = (twips: number) => Math.round((twips * 25.4 * 1000) / 1440) / 1000;

export function wordPageLayout(value: Partial<WordPageLayout> = {}): WordPageLayout {
  const orientation = value.orientation === 'landscape' ? 'landscape' : 'portrait';
  const landscape = orientation === 'landscape';
  const dimension = (size: number | undefined, fallback: number) =>
    size !== undefined && Number.isInteger(size) && size > 0 && size <= 31680 ? size : fallback;
  const margins = { ...wordDefaultLayout.margins };
  for (const side of wordMarginSides) {
    const size = value.margins?.[side];
    if (
      size !== undefined && Number.isInteger(size) && Math.abs(size) <= 31680 &&
      (size >= 0 || side === 'top' || side === 'bottom')
    ) margins[side] = size;
  }
  return {
    width: dimension(value.width, landscape ? wordDefaultLayout.height : wordDefaultLayout.width),
    height: dimension(value.height, landscape ? wordDefaultLayout.width : wordDefaultLayout.height),
    orientation,
    margins,
  };
}

export const wordEscape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[s]!
  );
export function wordSafeUrl(value: string, image = false) {
  if (image) return /^data:image\/(png|jpe?g|gif|webp);base64,[a-z\d+/=\s]+$/i.test(value);
  try {
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function wordSanitize(html: string) {
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  const allowed = new Set(
    'P DIV SPAN BR B STRONG I EM U S STRIKE SUB SUP H1 H2 H3 H4 H5 H6 UL OL LI BLOCKQUOTE PRE CODE TABLE THEAD TBODY TFOOT TR TD TH HR IMG A FONT'.split(
      ' '
    )
  );
  const styles = new Set(
    'color background-color font-family font-size font-weight font-style text-decoration text-align line-height margin-left margin-right margin-bottom padding-left padding-right border border-collapse width height max-width vertical-align page-break-before break-before'.split(
      ' '
    )
  );
  body
    .querySelectorAll('script,style,iframe,object,embed,form,input,button,svg,math,link,meta')
    .forEach((el) => el.remove());
  for (const el of Array.from(body.querySelectorAll('*')).reverse()) {
    if (!allowed.has(el.tagName)) {
      el.replaceWith(...Array.from(el.childNodes));
      continue;
    }
    const kept: Record<string, string> = {};
    if (el.tagName === 'SPAN' && el.hasAttribute('data-word-page-break')) {
      el.outerHTML = wordPageBreak;
      continue;
    }
    if (el instanceof HTMLElement) {
      const declarations: string[] = [];
      for (let i = 0; i < el.style.length; i++) {
        const prop = el.style.item(i);
        const value = el.style.getPropertyValue(prop);
        if (styles.has(prop) && !/url\s*\(|expression|javascript|@import|var\s*\(/i.test(value))
          declarations.push(`${prop}:${value}`);
      }
      if (declarations.length) kept.style = declarations.join(';');
    }
    if (el.tagName === 'A' && wordSafeUrl(el.getAttribute('href') || '')) {
      kept.href = el.getAttribute('href')!;
      kept.target = '_blank';
      kept.rel = 'noopener noreferrer';
    }
    if (el.tagName === 'IMG') {
      const src = el.getAttribute('src') || '';
      if (!wordSafeUrl(src, true)) {
        el.remove();
        continue;
      }
      kept.src = src;
      kept.alt = el.getAttribute('alt') || '图片';
      kept.style = `${kept.style || ''};max-width:100%`;
    }
    if (el.tagName === 'FONT')
      for (const attr of ['color', 'face', 'size']) {
        const value = el.getAttribute(attr);
        if (value && !/[<>]/.test(value)) kept[attr] = value;
      }
    if (['TD', 'TH'].includes(el.tagName))
      for (const attr of ['rowspan', 'colspan']) {
        const value = Number(el.getAttribute(attr));
        if (Number.isInteger(value) && value > 0 && value <= (attr === 'rowspan' ? 65534 : 100))
          kept[attr] = String(value);
      }
    Array.from(el.attributes).forEach((attr) => el.removeAttribute(attr.name));
    Object.entries(kept).forEach(([name, value]) => el.setAttribute(name, value));
  }
  return body.innerHTML;
}

export async function wordReadDocx(data: ArrayBuffer | string): Promise<WordDocument> {
  const zip = await JSZip.loadAsync(data, typeof data === 'string' ? { base64: true } : undefined);
  const entry = zip.file('word/document.xml');
  if (!entry) throw new Error('不是有效的 DOCX 文件');
  if (Object.keys(zip.files).length > 5000) throw new Error('文件包含过多资源');
  const xml = await entry.async('string');
  if (xml.length > 15_000_000) throw new Error('文档过大');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const relEntry = zip.file('word/_rels/document.xml.rels');
  const rels = relEntry
    ? new DOMParser().parseFromString(await relEntry.async('string'), 'application/xml')
    : null;
  const map = new Map<string, string>();
  Array.from(rels?.getElementsByTagName('Relationship') || []).forEach((el) =>
    map.set(el.getAttribute('Id') || '', el.getAttribute('Target') || '')
  );
  const attr = (el: Element | undefined | null, name: string) =>
    el?.getAttributeNS(W, name) || el?.getAttribute(`w:${name}`) || '';
  const get = (el: Element, name: string) => el.getElementsByTagNameNS(W, name)[0];
  const direct = (el: Element | undefined, name: string) => Array.from(el?.children || [])
    .find(child => child.namespaceURI === W && child.localName === name);
  const styleRel = Array.from(rels?.getElementsByTagName('Relationship') || [])
    .find(rel => rel.getAttribute('Type') === R + '/styles');
  const stylePath = styleRel?.getAttribute('Target') || 'styles.xml';
  const stylesXml = await zip.file(stylePath.startsWith('/') ? stylePath.slice(1) : 'word/' + stylePath)?.async('string');
  const stylesDoc = stylesXml ? new DOMParser().parseFromString(stylesXml, 'application/xml') : null;
  const styles = new Map(Array.from(stylesDoc?.getElementsByTagNameNS(W, 'style') || [])
    .filter(style => attr(style, 'type') === 'paragraph').map(style => [attr(style, 'styleId'), style]));
  function headingTag(paragraph: Element) {
    const props = Array.from(paragraph.children).find(child => child.localName === 'pPr');
    const styleId = props && attr(get(props, 'pStyle'), 'val');
    let level = props && attr(get(props, 'outlineLvl'), 'val');
    let id = styleId || '';
    const visited = new Set<string>();
    while (!level && id && !visited.has(id)) {
      visited.add(id);
      const style = styles.get(id);
      level = style && attr(get(style, 'outlineLvl'), 'val');
      if (level) break;
      const name = style && attr(get(style, 'name'), 'val');
      const heading = /^(?:heading|标题)\s*([1-6])$/i.exec(name || '') || /^Heading([1-6])$/i.exec(id);
      if (heading) return 'h' + heading[1];
      id = style ? attr(get(style, 'basedOn'), 'val') : '';
    }
    return level && /^[0-5]$/.test(level) ? 'h' + (Number(level) + 1) : 'p';
  }
  async function paragraph(el: Element): Promise<string> {
    const parts: string[] = [];
    for (const child of Array.from(el.children)) {
      if (child.localName === 'hyperlink') {
        const href = map.get(child.getAttributeNS(R, 'id') || '') || '';
        const text = wordEscape(child.textContent || '');
        parts.push(wordSafeUrl(href) ? `<a href="${wordEscape(href)}">${text}</a>` : text);
        continue;
      }
      if (child.localName !== 'r') continue;
      let text = '';
      for (const node of Array.from(child.children)) {
        if (node.localName === 't') text += wordEscape(node.textContent || '');
        if (node.localName === 'br' || node.localName === 'cr')
          text += attr(node, 'type') === 'page' ? wordPageBreak : '<br>';
        if (node.localName === 'tab') text += '&emsp;';
        if (node.localName === 'drawing') {
          const blip = node.getElementsByTagNameNS(
            'http://schemas.openxmlformats.org/drawingml/2006/main',
            'blip'
          )[0];
          const target = map.get(blip?.getAttributeNS(R, 'embed') || '');
          if (target && !target.includes('..') && !target.includes(':')) {
            const img = zip.file(`word/${target.replace(/^\//, '')}`);
            const ext = target.split('.').pop()?.toLowerCase();
            if (img && ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || ''))
              text += `<img src="data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${await img.async('base64')}" alt="图片">`;
          }
        }
      }
      const props = get(child, 'rPr');
      const style: string[] = [];
      if (props) {
        if (get(props, 'b') && attr(get(props, 'b'), 'val') !== '0') style.push('font-weight:bold');
        if (get(props, 'i') && attr(get(props, 'i'), 'val') !== '0') style.push('font-style:italic');
        if (get(props, 'u') && attr(get(props, 'u'), 'val') !== 'none')
          style.push('text-decoration:underline');
        const color = attr(get(props, 'color'), 'val');
        if (/^[a-f\d]{6}$/i.test(color)) style.push(`color:#${color}`);
        const size = Number(attr(get(props, 'sz'), 'val'));
        if (size > 0 && size < 1000) style.push(`font-size:${size / 2}pt`);
      }
      parts.push(style.length ? `<span style="${style.join(';')}">${text}</span>` : text);
    }
    const align = attr(get(el, 'jc'), 'val');
    const tag = headingTag(el);
    const pStyleValues: string[] = [];
    if (['left', 'right', 'center', 'both'].includes(align))
      pStyleValues.push(`text-align:${align === 'both' ? 'justify' : align}`);
    const breakBefore = direct(direct(el, 'pPr'), 'pageBreakBefore');
    if (breakBefore && !['0', 'false', 'off'].includes(attr(breakBefore, 'val')))
      pStyleValues.push('break-before:page');
    const spacing = get(el, 'spacing');
    const after = Number(attr(spacing, 'after'));
    if (attr(spacing, 'after') && after >= 0) pStyleValues.push(`margin-bottom:${after / 20}pt`);
    const line = Number(attr(spacing, 'line'));
    if (attr(spacing, 'line') && line > 0 && attr(spacing, 'lineRule') === 'auto')
      pStyleValues.push(`line-height:${line / 240}`);
    return `<${tag}${pStyleValues.length ? ` style="${pStyleValues.join(';')}"` : ''}>${parts.join('') || '<br>'}</${tag}>`;
  }
  async function readBlocks(parent: Element): Promise<string> {
    const blocks: string[] = [];
    for (const child of Array.from(parent.children)) {
      if (child.localName === 'p') blocks.push(await paragraph(child));
      if (child.localName === 'tbl') blocks.push(await readTable(child));
    }
    return blocks.join('');
  }
  async function readTable(source: Element): Promise<string> {
    const table = document.createElement('table');
    table.style.cssText = 'border-collapse:collapse;width:100%';
    const body = table.createTBody();
    let previous = new Map<number, HTMLTableCellElement>();
    for (const row of Array.from(source.children).filter((node) => node.localName === 'tr')) {
      const tr = body.insertRow();
      const continuing = new Map<number, HTMLTableCellElement>();
      const rowProps = Array.from(row.children).find((node) => node.localName === 'trPr');
      let column = rowProps ? Math.max(0, Number(attr(get(rowProps, 'gridBefore'), 'val')) || 0) : 0;
      if (column) tr.insertCell().colSpan = column;
      for (const cell of Array.from(row.children).filter((node) => node.localName === 'tc')) {
        const props = Array.from(cell.children).find((node) => node.localName === 'tcPr');
        const span = Math.max(1, Number(props && attr(get(props, 'gridSpan'), 'val')) || 1);
        const merge = props && get(props, 'vMerge');
        const origin = previous.get(column);
        if (merge && attr(merge, 'val') !== 'restart' && origin && origin.colSpan === span) {
          origin.rowSpan++;
          continuing.set(column, origin);
        } else {
          const td = tr.insertCell();
          if (span > 1) td.colSpan = span;
          td.innerHTML = await readBlocks(cell);
          if (merge) continuing.set(column, td);
        }
        column += span;
      }
      previous = continuing;
    }
    return table.outerHTML;
  }
  const body = doc.getElementsByTagNameNS(W, 'body')[0];
  if (!body) throw new Error('无法读取文档内容');
  const section = direct(body, 'sectPr');
  const size = direct(section, 'pgSz');
  const pgMar = direct(section, 'pgMar');
  const width = Number(attr(size, 'w'));
  const height = Number(attr(size, 'h'));
  const orient = attr(size, 'orient');
  const layout = wordPageLayout({
    width,
    height,
    orientation: orient === 'landscape' || (!orient && width > height && height > 0) ? 'landscape' : 'portrait',
    margins: Object.fromEntries(wordMarginSides.map(side => [side, Number(attr(pgMar, side) || NaN)])) as WordMargins,
  });
  return { html: wordSanitize(await readBlocks(body)), layout };
}

export async function wordWriteDocx(html: string, layout: WordPageLayout) {
  const zip = new JSZip();
  const body = new DOMParser().parseFromString(wordSanitize(html), 'text/html').body;
  const relationships: string[] = [];
  const types = new Set<string>();
  let counter = 0;
  function runs(node: Node, inherited = ''): string {
    if (node.nodeType === Node.TEXT_NODE)
      return `<w:r><w:rPr>${inherited}</w:rPr><w:t xml:space="preserve">${wordEscape(node.textContent || '')}</w:t></w:r>`;
    if (!(node instanceof HTMLElement)) return '';
    if (node.hasAttribute('data-word-page-break')) return '<w:r><w:br w:type="page"/></w:r>';
    if (node.tagName === 'BR') return '<w:r><w:br/></w:r>';
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || '';
      const match = /^data:image\/(png|jpeg|jpg|gif|webp);base64,([\s\S]+)$/i.exec(src);
      if (!match) return '';
      const id = ++counter;
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const target = `media/image${id}.${ext}`;
      zip.file(`word/${target}`, match[2], { base64: true });
      types.add(ext);
      relationships.push(`<Relationship Id="rId${id}" Type="${R}/image" Target="${target}"/>`);
      const width = Math.min(node.getBoundingClientRect().width || 400, 580);
      const height = node.getBoundingClientRect().height || width * 0.65;
      return `<w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="${Math.round(width * 9525)}" cy="${Math.round(height * 9525)}"/><wp:docPr id="${id}" name="图片 ${id}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="图片"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${Math.round(width * 9525)}" cy="${Math.round(height * 9525)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
    }
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      if (wordSafeUrl(href)) {
        const id = ++counter;
        relationships.push(
          `<Relationship Id="rId${id}" Type="${R}/hyperlink" Target="${wordEscape(href)}" TargetMode="External"/>`
        );
        return `<w:hyperlink r:id="rId${id}">${Array.from(node.childNodes)
          .map((n) => runs(n, inherited))
          .join('')}</w:hyperlink>`;
      }
    }
    let props = inherited;
    if (['B', 'STRONG'].includes(node.tagName) || ['bold', '700'].includes(node.style.fontWeight))
      props += '<w:b/>';
    if (['I', 'EM'].includes(node.tagName) || node.style.fontStyle === 'italic') props += '<w:i/>';
    if (node.tagName === 'U' || node.style.textDecoration.includes('underline'))
      props += '<w:u w:val="single"/>';
    if (['S', 'STRIKE'].includes(node.tagName) || node.style.textDecoration.includes('line-through'))
      props += '<w:strike/>';
    const color = node.style.color || node.getAttribute('color') || '';
    const rgb = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(color);
    const hex = rgb
      ? rgb
          .slice(1)
          .map((x) => Number(x).toString(16).padStart(2, '0'))
          .join('')
      : color.replace('#', '');
    if (/^[a-f\d]{6}$/i.test(hex)) props += `<w:color w:val="${hex}"/>`;
    const size = parseFloat(node.style.fontSize);
    if (size) props += `<w:sz w:val="${Math.round(size * (node.style.fontSize.endsWith('px') ? 1.5 : 2))}"/>`;
    const font = node.style.fontFamily || node.getAttribute('face');
    if (font) props += `<w:rFonts w:ascii="${wordEscape(font)}" w:eastAsia="${wordEscape(font)}"/>`;
    return Array.from(node.childNodes)
      .map((n) => runs(n, props))
      .join('');
  }
  function paragraph(node: HTMLElement): string {
    const align = node.style.textAlign;
    const heading = /^H[1-6]$/.test(node.tagName) ? `<w:pStyle w:val="Heading${node.tagName[1]}"/>` : '';
    const alignment = align ? `<w:jc w:val="${align === 'justify' ? 'both' : wordEscape(align)}"/>` : '';
    const indent = node.tagName === 'LI' ? '<w:ind w:left="360"/>' : '';
    const headingSizes = [52, 40, 32, 28, 24, 22];
    const headingRun = /^H[1-6]$/.test(node.tagName)
      ? `<w:b/><w:color w:val="245D9B"/><w:sz w:val="${headingSizes[Number(node.tagName[1]) - 1]}"/>`
      : '';
    const after = node.style.marginBottom
      ? Math.round(parseFloat(node.style.marginBottom) * (node.style.marginBottom.endsWith('px') ? 15 : 20))
      : 160;
    const line = node.style.lineHeight
      ? ` w:line="${Math.round(parseFloat(node.style.lineHeight) * 240)}" w:lineRule="auto"`
      : '';
    const pageBreak =
      node.style.breakBefore === 'page' || node.style.pageBreakBefore === 'always'
        ? '<w:pageBreakBefore/>'
        : '';
    return `<w:p><w:pPr>${heading}${pageBreak}<w:spacing w:after="${after}"${line}/>${indent}${alignment}</w:pPr>${node.tagName === 'LI' ? '<w:r><w:t>• </w:t></w:r>' : ''}${runs(node, headingRun)}</w:p>`;
  }
  const { width, height, orientation, margins } = layout;
  const pageContentWidth = Math.max(1440, width - margins.left - margins.right);
  function table(node: HTMLElement, availableWidth: number): string {
    type Cell = { element?: HTMLElement; span: number; merge?: 'restart' | 'continue' };
    const rows = Array.from(node.querySelectorAll<HTMLTableRowElement>('tr')).filter(
      (row) => row.closest('table') === node
    );
    if (!rows.length) return '<w:p/>';
    const grid: (Cell | null | undefined)[][] = rows.map(() => []);
    rows.forEach((row, rowIndex) => {
      let column = 0;
      Array.from(row.children)
        .filter((cell) => ['TD', 'TH'].includes(cell.tagName))
        .forEach((cell) => {
          const span = Math.max(1, Math.min(100, Number(cell.getAttribute('colspan')) || 1));
          const rowSpan = Math.max(
            1,
            Math.min(rows.length - rowIndex, Number(cell.getAttribute('rowspan')) || 1)
          );
          // Find enough consecutive columns after any preceding vertically merged cells.
          while (
            Array.from({ length: span }, (_, offset) => grid[rowIndex][column + offset] !== undefined).some(
              Boolean
            )
          )
            column++;
          grid[rowIndex][column] = {
            element: cell as HTMLElement,
            span,
            merge: rowSpan > 1 ? 'restart' : undefined,
          };
          for (let offset = 1; offset < span; offset++) grid[rowIndex][column + offset] = null;
          for (let next = 1; next < rowSpan; next++) {
            grid[rowIndex + next][column] = { span, merge: 'continue' };
            for (let offset = 1; offset < span; offset++) grid[rowIndex + next][column + offset] = null;
          }
          column += span;
        });
    });
    const columnCount = Math.max(1, ...grid.map((row) => row.length));
    const tableWidth = Math.max(1, Math.round(availableWidth));
    // Use a fixed, complete grid, with rounding assigned to the last column.
    const widths = Array.from({ length: columnCount }, (_, index) =>
      index === columnCount - 1
        ? tableWidth - Math.floor(tableWidth / columnCount) * index
        : Math.floor(tableWidth / columnCount)
    );
    const gridXml = `<w:tblGrid>${widths.map((width) => `<w:gridCol w:w="${width}"/>`).join('')}</w:tblGrid>`;
    const rowsXml = grid
      .map((row) => {
        const cells: string[] = [];
        for (let column = 0; column < columnCount; ) {
          const placement = row[column];
          if (placement === null) {
            column++;
            continue;
          }
          const span = placement?.span || 1;
          const width = widths.slice(column, column + span).reduce((sum, value) => sum + value, 0);
          const merge = placement?.merge ? `<w:vMerge w:val="${placement.merge}"/>` : '';
          const cellContent = placement?.element ? blocks(placement.element, width) : '';
          // OOXML requires each cell to end in a paragraph, including cells ending in a nested table.
          const content = cellContent
            ? cellContent + (cellContent.endsWith('</w:tbl>') ? '<w:p/>' : '')
            : '<w:p/>';
          cells.push(
            `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ''}${merge}</w:tcPr>${content}</w:tc>`
          );
          column += span;
        }
        return `<w:tr>${cells.join('')}</w:tr>`;
      })
      .join('');
    return `<w:tbl><w:tblPr><w:tblW w:w="${tableWidth}" w:type="dxa"/><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map((side) => `<w:${side} w:val="single" w:sz="4" w:color="B7C9E2"/>`).join('')}</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr>${gridXml}${rowsXml}</w:tbl>`;
  }
  function blocks(parent: HTMLElement, availableWidth = pageContentWidth): string {
    return Array.from(parent.childNodes)
      .map((node) => {
        if (node instanceof HTMLElement) {
          if (node.tagName === 'TABLE') return table(node, availableWidth);
          if (['UL', 'OL'].includes(node.tagName)) return blocks(node, availableWidth);
          if (node.tagName === 'DIV' && node.querySelector('p,div,h1,h2,h3,h4,h5,h6,table')) {
            const pageBreak =
              node.style.breakBefore === 'page' || node.style.pageBreakBefore === 'always'
                ? '<w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>'
                : '';
            return pageBreak + blocks(node, availableWidth);
          }
          return paragraph(node);
        }
        return node.textContent?.trim() ? `<w:p>${runs(node)}</w:p>` : '';
      })
      .join('');
  }
  const content = blocks(body);
  const pgMargins = wordMarginSides.map(side => `w:${side}="${margins[side]}"`).join(' ');
  zip.file(
    'word/document.xml',
    `${XML}<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${content}<w:sectPr><w:pgSz w:w="${width}" w:h="${height}" w:orient="${orientation}"/><w:pgMar ${pgMargins} w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`
  );
  const headingStyles = Array.from(new Set(Array.from(body.querySelectorAll('h1,h2,h3,h4,h5,h6'), el => Number(el.tagName[1]))));
  if (headingStyles.length) {
    relationships.push(`<Relationship Id="rIdStyles" Type="${R}/styles" Target="styles.xml"/>`);
    zip.file('word/styles.xml', `${XML}<w:styles xmlns:w="${W}"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>${headingStyles.map(level =>
      `<w:style w:type="paragraph" w:styleId="Heading${level}"><w:name w:val="heading ${level}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:outlineLvl w:val="${level - 1}"/></w:pPr></w:style>`
    ).join('')}</w:styles>`);
  }
  zip.file(
    'word/_rels/document.xml.rels',
    `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships.join('')}</Relationships>`
  );
  zip.file(
    '_rels/.rels',
    `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`
  );
  zip.file(
    '[Content_Types].xml',
    `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${Array.from(
      types
    )
      .map((ext) => `<Default Extension="${ext}" ContentType="image/${ext === 'jpg' ? 'jpeg' : ext}"/>`)
      .join(
        ''
      )}${headingStyles.length ? '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' : ''}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
  );
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
}

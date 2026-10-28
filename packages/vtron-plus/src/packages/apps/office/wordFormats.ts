import JSZip from 'jszip';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
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
        if (value > 0 && value < 100) kept[attr] = String(value);
      }
    Array.from(el.attributes).forEach((attr) => el.removeAttribute(attr.name));
    Object.entries(kept).forEach(([name, value]) => el.setAttribute(name, value));
  }
  return body.innerHTML;
}

export async function wordReadDocx(data: ArrayBuffer | string) {
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
        if (node.localName === 'br') text += '<br>';
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
    const pStyle = attr(get(el, 'pStyle'), 'val');
    const tag = /^Heading[1-6]$/i.test(pStyle)
      ? `h${pStyle.slice(-1)}`
      : /^Title$/i.test(pStyle)
        ? 'h1'
        : 'p';
    const pStyleValues: string[] = [];
    if (['left', 'right', 'center', 'both'].includes(align))
      pStyleValues.push(`text-align:${align === 'both' ? 'justify' : align}`);
    if (get(el, 'pageBreakBefore')) pStyleValues.push('break-before:page;page-break-before:always');
    const spacing = get(el, 'spacing');
    const after = Number(attr(spacing, 'after'));
    if (attr(spacing, 'after') && after >= 0) pStyleValues.push(`margin-bottom:${after / 20}pt`);
    const line = Number(attr(spacing, 'line'));
    if (attr(spacing, 'line') && line > 0 && attr(spacing, 'lineRule') === 'auto')
      pStyleValues.push(`line-height:${line / 240}`);
    return `<${tag}${pStyleValues.length ? ` style="${pStyleValues.join(';')}"` : ''}>${parts.join('') || '<br>'}</${tag}>`;
  }
  const result: string[] = [];
  const body = doc.getElementsByTagNameNS(W, 'body')[0];
  if (!body) throw new Error('无法读取文档内容');
  for (const child of Array.from(body.children)) {
    if (child.localName === 'p') result.push(await paragraph(child));
    if (child.localName === 'tbl') {
      const rows: string[] = [];
      for (const row of Array.from(child.children).filter((n) => n.localName === 'tr')) {
        const cells: string[] = [];
        for (const cell of Array.from(row.children).filter((n) => n.localName === 'tc'))
          cells.push(
            `<td>${(
              await Promise.all(
                Array.from(cell.children)
                  .filter((n) => n.localName === 'p')
                  .map(paragraph)
              )
            ).join('')}</td>`
          );
        rows.push(`<tr>${cells.join('')}</tr>`);
      }
      result.push(
        `<table style="border-collapse:collapse;width:100%"><tbody>${rows.join('')}</tbody></table>`
      );
    }
  }
  return wordSanitize(result.join(''));
}

export async function wordWriteDocx(html: string, landscape: boolean, margin: number) {
  const zip = new JSZip();
  const body = new DOMParser().parseFromString(wordSanitize(html), 'text/html').body;
  const relationships: string[] = [];
  const types = new Set<string>();
  let counter = 0;
  function runs(node: Node, inherited = ''): string {
    if (node.nodeType === Node.TEXT_NODE)
      return `<w:r><w:rPr>${inherited}</w:rPr><w:t xml:space="preserve">${wordEscape(node.textContent || '')}</w:t></w:r>`;
    if (!(node instanceof HTMLElement)) return '';
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
    return `<w:p><w:pPr>${heading}${alignment}${indent}${pageBreak}<w:spacing w:after="${after}"${line}/></w:pPr>${node.tagName === 'LI' ? '<w:r><w:t>• </w:t></w:r>' : ''}${runs(node, headingRun)}</w:p>`;
  }
  const pageContentWidth = Math.max(1440, (landscape ? 16838 : 11906) - Math.round(margin * 56.7) * 2);
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
  const pgMargin = Math.round(margin * 56.7);
  zip.file(
    'word/document.xml',
    `${XML}<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${content}<w:sectPr><w:pgSz w:w="${landscape ? 16838 : 11906}" w:h="${landscape ? 11906 : 16838}"${landscape ? ' w:orient="landscape"' : ''}/><w:pgMar w:top="${pgMargin}" w:right="${pgMargin}" w:bottom="${pgMargin}" w:left="${pgMargin}"/></w:sectPr></w:body></w:document>`
  );
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
      )}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
  );
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
}

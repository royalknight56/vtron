import { commentMarker, commentSelector, commentText, commentsXml, readComments, rekeyComments } from './wordComments';
import { collectWordNotes, noteKinds, noteMarker, notePartXml, readNotePart } from './wordNotes';
import { refreshWordToc, tocMarker, tocXml, wordHeadings } from './wordToc';
import { pageText, pageTextXml, readPageText, type PageText } from './wordPageText';
import JSZip from 'jszip';
import { createListWriter, readNumbering } from './wordNumbering';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
export const wordPageBreak = '<span data-word-page-break="" contenteditable="false"></span>';
export const wordMarginSides = ['top', 'right', 'bottom', 'left'] as const;
export type WordMargins = Record<(typeof wordMarginSides)[number], number>;
export const sectionStarts = ['nextPage', 'continuous', 'oddPage', 'evenPage', 'nextColumn'] as const;
export interface WordPageLayout {
  sectionStart: (typeof sectionStarts)[number];
  linked: { header: boolean; footer: boolean };
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  margins: WordMargins;
  header: PageText;
  footer: PageText;
}
export interface WordDocument {
  tracking?: boolean;
  html: string;
  layout: WordPageLayout;
}

// Store page dimensions and margins in twips, the units used by DOCX.
export const wordDefaultLayout: WordPageLayout = {
  sectionStart: 'nextPage',
  linked: { header: false, footer: false },
  header: pageText(),
  footer: pageText(undefined, 'center'),
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
    sectionStart: value.sectionStart && sectionStarts.includes(value.sectionStart) ? value.sectionStart : 'nextPage',
    linked: { header: value.linked?.header === true, footer: value.linked?.footer === true },
    width: dimension(value.width, landscape ? wordDefaultLayout.height : wordDefaultLayout.width),
    height: dimension(value.height, landscape ? wordDefaultLayout.width : wordDefaultLayout.height),
    orientation,
    margins,
    header: pageText(value.header),
    footer: pageText(value.footer, 'center'),
  };
}

export function sectionLayout(section: HTMLElement) {
  try {
    return wordPageLayout(JSON.parse(section.dataset.wordSection || '{}') || {});
  } catch {
    return wordPageLayout();
  }
}
export function documentSections(editor: HTMLElement) {
  return Array.from(editor.children).filter((node): node is HTMLElement =>
    node instanceof HTMLElement && node.matches('div[data-word-section]'));
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
  body.querySelectorAll('aside[data-word-note-list]').forEach(el => el.remove());
  const allowed = new Set(
    'P DIV SPAN BR B STRONG I EM U S STRIKE SUB SUP INS DEL H1 H2 H3 H4 H5 H6 UL OL LI BLOCKQUOTE PRE CODE TABLE THEAD TBODY TFOOT TR TD TH HR IMG A FONT'.split(
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
    if (el instanceof HTMLElement && el.matches(commentSelector)) {
      const id = el.dataset.wordComment ?? el.dataset.wordCommentEnd!;
      if (/^[a-zA-Z0-9_-]{1,100}$/.test(id))
        el.outerHTML = commentMarker(id, el.dataset.wordComment !== undefined ? commentText(el) : undefined);
      else el.remove();
      continue;
    }
    if (el.matches('ins[data-word-change],del[data-word-change]')) {
      kept['data-word-change'] = '';
      kept.contenteditable = 'false';
      kept['data-author'] = el.getAttribute('data-author') || '';
      const date = el.getAttribute('datetime');
      if (date && Number.isFinite(Date.parse(date))) kept.datetime = date;
    }
    const kind = el.getAttribute('data-word-note');
    if (el.tagName === 'SUP' && (kind === 'footnote' || kind === 'endnote')) {
      el.outerHTML = noteMarker(kind, el.getAttribute('title') || '');
      continue;
    }
    if (el.tagName === 'DIV' && el.hasAttribute('data-word-toc')) {
      el.outerHTML = tocMarker;
      continue;
    }
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
    if (el.matches('ol,ul') && /^\d{1,10}$/.test(el.getAttribute('data-word-num') || ''))
      kept['data-word-num'] = el.getAttribute('data-word-num')!;
    if (el.matches('ol,ul') && /^[1-8]$/.test(el.getAttribute('data-word-level-gap') || ''))
      kept['data-word-level-gap'] = el.getAttribute('data-word-level-gap')!;
    if (el.matches('ol[type]') && /^[1aAiI]$/.test(el.getAttribute('type') || ''))
      kept.type = el.getAttribute('type')!;
    for (const [tag, attribute] of [['OL', 'start'], ['LI', 'value']]) {
      const number = el.getAttribute(attribute);
      if (el.tagName === tag && number && /^-?\d{1,9}$/.test(number)) kept[attribute] = number;
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
    if (el instanceof HTMLElement && el.matches('div[data-word-section]')) {
      kept['data-word-section'] = JSON.stringify(sectionLayout(el));
      delete kept.style;
    }
    Array.from(el.attributes).forEach((attr) => el.removeAttribute(attr.name));
    Object.entries(kept).forEach(([name, value]) => el.setAttribute(name, value));
  }
  collectWordNotes(body);
  refreshWordToc(body);
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
  async function relatedXml(kind: string) {
    const rel = Array.from(rels?.getElementsByTagName('Relationship') || [])
      .find(item => item.getAttribute('Type') === R + '/' + kind);
    const path = rel?.getAttribute('Target') || kind + '.xml';
    return zip.file(path.startsWith('/') ? path.slice(1) : 'word/' + path)?.async('string');
  }
  const settingsXml = await relatedXml('settings');
  const settings = settingsXml && new DOMParser().parseFromString(settingsXml, 'application/xml');
  const flag = settings && settings.getElementsByTagNameNS(W, 'trackRevisions')[0];
  const tracking = !!flag && !['0', 'false', 'off'].includes(attr(flag, 'val'));
  const stylesXml = await relatedXml('styles');
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
  const noteParts = { footnote: new Map<string, string>(), endnote: new Map<string, string>() };
  for (const kind of noteKinds) {
    const rel = Array.from(rels?.getElementsByTagName('Relationship') || [])
      .find(item => item.getAttribute('Type') === R + '/' + kind + 's');
    const target = rel?.getAttribute('Target') || kind + 's.xml';
    const part = zip.file(target.startsWith('/') ? target.slice(1) : 'word/' + target);
    if (part) noteParts[kind] = readNotePart(await part.async('string'), kind, W);
  }
  const commentsRel = Array.from(rels?.getElementsByTagName('Relationship') || [])
    .find(item => item.getAttribute('Type') === R + '/comments');
  const commentTarget = commentsRel?.getAttribute('Target') || 'comments.xml';
  const commentPart = zip.file(commentTarget.startsWith('/') ? commentTarget.slice(1) : 'word/' + commentTarget);
  const comments = commentPart ? readComments(await commentPart.async('string'), W) : new Map();
  const anchorIds = (name: string) => new Set(Array.from(doc.getElementsByTagNameNS(W, name), el => attr(el, 'id')));
  const startIds = anchorIds('commentRangeStart'), endIds = anchorIds('commentRangeEnd');
  function annotation(node: Element) {
    const id = attr(node, 'id');
    const entry = comments.get(id);
    if (!entry) return '';
    if (node.localName === 'commentRangeStart') return commentMarker(id, entry);
    if (node.localName === 'commentRangeEnd') return commentMarker(id, startIds.has(id) ? undefined : entry);
    return startIds.has(id) || endIds.has(id) ? '' : commentMarker(id, entry);
  }
  async function readRun(child: Element): Promise<string> {
    let text = '';
    for (const node of Array.from(child.children)) {
      if (node.localName === 'footnoteReference' || node.localName === 'endnoteReference') {
        const kind = node.localName === 'footnoteReference' ? 'footnote' : 'endnote';
        text += noteMarker(kind, noteParts[kind].get(attr(node, 'id')) || '');
      }
      if (node.localName === 'commentReference') text += annotation(node);
      if (node.localName === 't' || node.localName === 'delText') text += wordEscape(node.textContent || '');
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
    return style.length ? `<span style="${style.join(';')}">${text}</span>` : text;
  }
  async function inlineContent(parent: Element): Promise<string> {
    const parts: string[] = [];
    for (const child of Array.from(parent.children)) {
      if (child.localName === 'commentRangeStart' || child.localName === 'commentRangeEnd')
        parts.push(annotation(child));
      else if (child.localName === 'r') parts.push(await readRun(child));
      else if (child.localName === 'hyperlink') {
        const href = map.get(child.getAttributeNS(R, 'id') || '') || '';
        const content = await inlineContent(child);
        parts.push(wordSafeUrl(href) ? `<a href="${wordEscape(href)}">${content}</a>` : content);
      } else if (child.localName === 'ins' || child.localName === 'del') {
        const tag = child.localName;
        const author = wordEscape(attr(child, 'author'));
        const date = wordEscape(attr(child, 'date'));
        parts.push(`<${tag} data-word-change="" data-author="${author}" datetime="${date}" contenteditable="false">${await inlineContent(child)}</${tag}>`);
      }
    }
    return parts.join('');
  }
  async function paragraph(el: Element): Promise<string> {
    const content = await inlineContent(el);
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
    return `<${tag}${pStyleValues.length ? ` style="${pStyleValues.join(';')}"` : ''}>${content || '<br>'}</${tag}>`;
  }
  const numRel = Array.from(rels?.getElementsByTagName('Relationship') || [])
    .find(rel => rel.getAttribute('Type') === R + '/numbering');
  const numPath = numRel?.getAttribute('Target') || 'numbering.xml';
  const numXml = await zip.file(numPath.startsWith('/') ? numPath.slice(1) : 'word/' + numPath)?.async('string');
  const numbering = numXml ? readNumbering(numXml, styles) : undefined;
  async function readBlocks(parent: Element, nodes = Array.from(parent.children)): Promise<string> {
    const container = document.createElement('div');
    const stack: { level: number; id: string; list: HTMLElement }[] = [];
    for (const child of nodes) {
      if (child.localName === 'commentRangeStart' || child.localName === 'commentRangeEnd') {
        container.insertAdjacentHTML('beforeend', annotation(child));
      } else if (child.localName === 'p') {
        const html = await paragraph(child);
        const num = numbering?.(child);
        if (num) {
          while (stack.length && stack[stack.length - 1].level > num.level) stack.pop();
          let top = stack[stack.length - 1];
          if (top?.level === num.level && top.id !== num.id) {
            stack.pop();
            top = stack[stack.length - 1];
          }
          if (!top || top.level !== num.level) {
            const list = document.createElement(num.type ? 'ol' : 'ul');
            list.dataset.wordNum = num.id;
            const gap = num.level - (top ? top.level + 1 : 0);
            if (gap > 0) list.dataset.wordLevelGap = String(gap);
            if (num.type && num.type !== '1') list.setAttribute('type', num.type);
            if (num.type && num.index !== 1) list.setAttribute('start', String(num.index));
            (top?.list.lastElementChild || container).append(list);
            top = { level: num.level, id: num.id, list };
            stack.push(top);
          }
          const item = document.createElement('li');
          item.innerHTML = html;
          top.list.append(item);
          continue;
        }
        stack.length = 0;
        container.insertAdjacentHTML('beforeend', html);
      } else if (child.localName === 'sdt') {
        stack.length = 0;
        const content = direct(child, 'sdtContent');
        if (attr(get(child, 'docPartGallery'), 'val') === 'Table of Contents') {
          container.insertAdjacentHTML('beforeend', tocMarker);
        } else if (content) container.insertAdjacentHTML('beforeend', await readBlocks(content));
      } else if (child.localName === 'tbl') {
        stack.length = 0;
        container.insertAdjacentHTML('beforeend', await readTable(child));
      }
    }
    return container.innerHTML;
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
  async function readLayout(section?: Element, previous?: WordPageLayout) {
    const size = direct(section, 'pgSz');
    const pgMar = direct(section, 'pgMar');
    const width = Number(attr(size, 'w'));
    const height = Number(attr(size, 'h'));
    const orient = attr(size, 'orient');
    const layout = wordPageLayout({
      sectionStart: attr(direct(section, 'type'), 'val') as WordPageLayout['sectionStart'],
      width,
      height,
      orientation: orient === 'landscape' || (!orient && width > height && height > 0) ? 'landscape' : 'portrait',
      margins: Object.fromEntries(wordMarginSides.map(side => [side, Number(attr(pgMar, side) || NaN)])) as WordMargins,
    });
    for (const kind of ['header', 'footer'] as const) {
      const ref = Array.from(section?.children || []).find(node =>
        node.localName === kind + 'Reference' && attr(node, 'type') === 'default');
      const target = map.get(ref?.getAttributeNS(R, 'id') || '');
      const distance = Number(attr(pgMar, kind) || 720);
      if (!target) {
        if (previous) {
          layout.linked[kind] = true;
          layout[kind] = pageText({ ...previous[kind], distance });
        }
        continue;
      }
      const part = await zip.file(target.startsWith('/') ? target.slice(1) : 'word/' + target)?.async('string');
      if (part) layout[kind] = readPageText(new DOMParser().parseFromString(part, 'application/xml'), W,
        distance, layout[kind].align);
    }
    return layout;
  }
  const groups: { nodes: Element[]; layout: WordPageLayout }[] = [];
  let nodes: Element[] = [];
  for (const node of Array.from(body.children)) {
    if (node.localName === 'sectPr') continue;
    nodes.push(node);
    const end = node.localName === 'p' ? direct(direct(node, 'pPr'), 'sectPr') : undefined;
    if (end) {
      groups.push({ nodes, layout: await readLayout(end, groups[groups.length - 1]?.layout) });
      nodes = [];
    }
  }
  const layout = await readLayout(direct(body, 'sectPr'), groups[groups.length - 1]?.layout);
  if (!groups.length) return { html: wordSanitize(await readBlocks(body, nodes)), layout, tracking };
  groups.push({ nodes, layout });
  const container = document.createElement('div');
  for (const group of groups) {
    const wrapper = document.createElement('div');
    wrapper.dataset.wordSection = JSON.stringify(group.layout);
    wrapper.innerHTML = await readBlocks(body, group.nodes) || '<p><br></p>';
    container.append(wrapper);
  }
  return { html: wordSanitize(container.innerHTML), layout, tracking };
}

export async function wordWriteDocx(html: string, layout: WordPageLayout, tracking = false) {
  const zip = new JSZip();
  const body = new DOMParser().parseFromString(wordSanitize(html), 'text/html').body;
  const comments = rekeyComments(body, String);
  const relationships: string[] = [];
  const types = new Set<string>();
  const notes: Record<'footnote' | 'endnote', string[]> = { footnote: [], endnote: [] };
  let counter = 0;
  let changeId = 0;
  function runs(node: Node, inherited = '', deleted = false): string {
    if (node.nodeType === Node.TEXT_NODE) {
      const tag = deleted ? 'delText' : 't';
      return `<w:r><w:rPr>${inherited}</w:rPr><w:${tag} xml:space="preserve">${wordEscape(node.textContent || '')}</w:${tag}></w:r>`;
    }
    if (!(node instanceof HTMLElement)) return '';
    if (node.matches(commentSelector)) {
      const id = node.dataset.wordComment ?? node.dataset.wordCommentEnd!;
      const ref = `<w:r><w:commentReference w:id="${id}"/></w:r>`;
      if (node.dataset.wordComment === undefined) return `<w:commentRangeEnd w:id="${id}"/>${ref}`;
      return comments[Number(id)]?.end ? `<w:commentRangeStart w:id="${id}"/>` : ref;
    }
    if (node.matches('ins[data-word-change],del[data-word-change]')) {
      const tag = node.localName;
      const author = wordEscape(node.dataset.author || '');
      const date = node.getAttribute('datetime');
      const content = Array.from(node.childNodes).map(n => runs(n, inherited, deleted || tag === 'del')).join('');
      return `<w:${tag} w:id="${changeId++}" w:author="${author}"${date ? ' w:date="' + wordEscape(date) + '"' : ''}>${content}</w:${tag}>`;
    }
    const noteKind = node.dataset.wordNote;
    if (node.tagName === 'SUP' && (noteKind === 'footnote' || noteKind === 'endnote')) {
      const id = notes[noteKind].push(node.title);
      return `<w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:${noteKind}Reference w:id="${id}"/></w:r>`;
    }
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
          .map((n) => runs(n, inherited, deleted))
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
      .map((n) => runs(n, props, deleted))
      .join('');
  }
  const lists = createListWriter();
  const headings = body.querySelector('[data-word-toc]') ? wordHeadings(body, 3) : [];
  const bookmarkIds = new Map(headings.map((heading, i) => [heading, i]));
  function paragraph(node: HTMLElement, numbering = ''): string {
    const align = node.style.textAlign;
    const heading = /^H[1-6]$/.test(node.tagName) ? `<w:pStyle w:val="Heading${node.tagName[1]}"/>` : '';
    const alignment = align ? `<w:jc w:val="${align === 'justify' ? 'both' : wordEscape(align)}"/>` : '';
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
    const id = bookmarkIds.get(node);
    const start = id === undefined ? '' : `<w:bookmarkStart w:id="${id}" w:name="_VtronHeading${id}"/>`;
    const end = id === undefined ? '' : `<w:bookmarkEnd w:id="${id}"/>`;
    return `<w:p><w:pPr>${heading}${pageBreak}${numbering}<w:spacing w:after="${after}"${line}/>${alignment}</w:pPr>${start}${runs(node, headingRun)}${end}</w:p>`;
  }

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
  function writeList(list: HTMLElement, depth: number, width: number): string {
    const level = Math.min(depth + Number(list.dataset.wordLevelGap || 0), 8);
    let id = lists.register(list, level, Number(list.getAttribute('start') || 1));
    const output: string[] = [];
    for (const item of Array.from(list.children)) {
      if (item.matches('ol,ul')) {
        output.push(writeList(item as HTMLElement, level + 1, width));
        continue;
      }
      if (!(item instanceof HTMLElement) || item.tagName !== 'LI') continue;
      if (item.hasAttribute('value'))
        id = lists.register(list, level, Number(item.getAttribute('value')), true);
      let numbering = `<w:numPr><w:ilvl w:val="${level}"/><w:numId w:val="${id}"/></w:numPr>`;
      const inline = item.cloneNode(false) as HTMLElement;
      function emitParagraph(block: HTMLElement) {
        output.push(paragraph(block, numbering));
        numbering = '';
      }
      for (const child of Array.from(item.childNodes)) {
        if (child instanceof HTMLElement && child.matches('ol,ul,table,p,div,h1,h2,h3,h4,h5,h6')) {
          if (inline.hasChildNodes()) {
            emitParagraph(inline);
            inline.replaceChildren();
          }
          if (child.matches('ol,ul,table')) {
            if (numbering) emitParagraph(inline);
            output.push(child.tagName === 'TABLE' ? table(child, width) : writeList(child, level + 1, width));
          } else emitParagraph(child);
        } else if (child.nodeType !== Node.TEXT_NODE || child.textContent?.trim() || inline.hasChildNodes()) {
          inline.append(child.cloneNode(true));
        }
      }
      if (inline.hasChildNodes() || numbering) emitParagraph(inline);
    }
    return output.join('');
  }
  function blocks(parent: HTMLElement, availableWidth: number): string {
    return Array.from(parent.childNodes)
      .map((node) => {
        if (node instanceof HTMLElement) {
          if (node.hasAttribute('data-word-toc')) return tocXml(headings, wordEscape);
          if (node.tagName === 'TABLE') return table(node, availableWidth);
          if (['UL', 'OL'].includes(node.tagName)) return writeList(node, 0, availableWidth);
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
  const wrappers = documentSections(body);
  // Keep loose content from pasted HTML or a browser edit at a section boundary.
  const sections: { content: string; layout: WordPageLayout }[] = [];
  let loose = document.createElement('div');
  function addSection(element: HTMLElement, page: WordPageLayout) {
    const width = Math.max(1, page.width - page.margins.left - page.margins.right);
    sections.push({ content: blocks(element, width), layout: page });
  }
  if (wrappers.length) {
    for (const node of Array.from(body.childNodes)) {
      if (node instanceof HTMLElement && node.matches('div[data-word-section]')) {
        if (loose.hasChildNodes()) { addSection(loose, layout); loose = document.createElement('div'); }
        addSection(node, sectionLayout(node));
      } else if (node instanceof Element || node.textContent?.trim()) loose.append(node);
    }
    if (loose.hasChildNodes()) addSection(loose, layout);
  } else addSection(body, layout);
  const numberingXml = lists.xml();
  if (numberingXml) {
    zip.file('word/numbering.xml', XML + numberingXml);
    relationships.push(`<Relationship Id="rIdNumbering" Type="${R}/numbering" Target="numbering.xml"/>`);
  }
  let pageOverrides = '';
  if (tracking) {
    zip.file('word/settings.xml', XML + `<w:settings xmlns:w="${W}"><w:trackRevisions/></w:settings>`);
    relationships.push(`<Relationship Id="rIdSettings" Type="${R}/settings" Target="settings.xml"/>`);
    pageOverrides += '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>';
  }
  if (comments.length) {
    zip.file('word/comments.xml', XML + commentsXml(comments, W, wordEscape));
    relationships.push(`<Relationship Id="rIdComments" Type="${R}/comments" Target="comments.xml"/>`);
    pageOverrides += '<Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/>';
  }
  let noteProperties = '';
  for (const kind of noteKinds) {
    if (!notes[kind].length) continue;
    const part = kind + 's';
    zip.file('word/' + part + '.xml', XML + notePartXml(kind, notes[kind], W, wordEscape));
    relationships.push(`<Relationship Id="rId${part}" Type="${R}/${part}" Target="${part}.xml"/>`);
    pageOverrides += `<Override PartName="/word/${part}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.${part}+xml"/>`;
    noteProperties += `<w:${kind}Pr><w:numFmt w:val="decimal"/></w:${kind}Pr>`;
  }
  const documentXml = sections.map(({ content, layout: page }, index) => {
    let refs = '';
    for (const kind of ['header', 'footer'] as const) {
      if (index && page.linked[kind]) continue;
      if (!page[kind].text && !sections[index - 1]?.layout[kind].text) continue;
      const part = kind + (index + 1);
      const tag = kind === 'header' ? 'hdr' : 'ftr';
      zip.file(`word/${part}.xml`, `${XML}<w:${tag} xmlns:w="${W}">${pageTextXml(page[kind], wordEscape)}</w:${tag}>`);
      relationships.push(`<Relationship Id="rId${part}" Type="${R}/${kind}" Target="${part}.xml"/>`);
      refs += `<w:${kind}Reference w:type="default" r:id="rId${part}"/>`;
      pageOverrides += `<Override PartName="/word/${part}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.${kind}+xml"/>`;
    }
    const margins = wordMarginSides.map(side => `w:${side}="${page.margins[side]}"`).join(' ');
    const section = `<w:sectPr>${refs}${noteProperties}<w:type w:val="${page.sectionStart}"/><w:pgSz w:w="${page.width}" w:h="${page.height}" w:orient="${page.orientation}"/><w:pgMar ${margins} w:header="${page.header.distance}" w:footer="${page.footer.distance}" w:gutter="0"/></w:sectPr>`;
    if (index === sections.length - 1) return content + section;
    if (content.endsWith('</w:p>')) {
      const i = content.lastIndexOf('<w:p>');
      const last = content.slice(i);
      return content.slice(0, i) + (last.startsWith('<w:p><w:pPr>') ?
        last.replace('</w:pPr>', section + '</w:pPr>') : '<w:p><w:pPr>' + section + '</w:pPr>' + last.slice(5));
    }
    return content + '<w:p><w:pPr>' + section + '</w:pPr></w:p>';
  }).join('');
  zip.file('word/document.xml', `${XML}<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${documentXml}</w:body></w:document>`);
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
      )}${pageOverrides}${numberingXml ? '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' : ''}${headingStyles.length ? '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' : ''}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
  );
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
}

import { sectionLayout, wordMarginSides, type WordPageLayout } from './wordFormats';
import { pageTextCss } from './wordPageText';

export function splitWordSection(editor: HTMLElement, range: Range, page: WordPageLayout) {
  let node = range.startContainer;
  const offset = range.startOffset;
  const parent = node instanceof Element ? node : node.parentElement;
  if (parent?.closest('table,[contenteditable="false"]')) throw new Error('请将光标放在表格外的正文中');
  let current = parent?.closest<HTMLElement>('div[data-word-section]');
  if (!current || current.parentElement !== editor) {
    current = document.createElement('div');
    current.dataset.wordSection = JSON.stringify(page);
    if (node === editor) node = current;
    current.append(...Array.from(editor.childNodes));
    editor.append(current);
  }
  const tail = document.createRange();
  tail.selectNodeContents(current);
  tail.setStart(node, offset);
  const next = document.createElement('div');
  next.dataset.wordSection = JSON.stringify({
    ...page,
    sectionStart: 'nextPage',
    linked: { header: true, footer: true },
  });
  next.append(tail.extractContents());
  if (!current.hasChildNodes()) current.innerHTML = '<p><br></p>';
  if (!next.hasChildNodes()) next.innerHTML = '<p><br></p>';
  current.after(next);
  return next;
}

export function styleWordSections(sections: HTMLElement[]) {
  let previous: WordPageLayout | undefined;
  for (const section of sections) {
    const page = sectionLayout(section);
    for (const kind of ['header', 'footer'] as const) {
      if (previous && page.linked[kind]) page[kind] = { ...previous[kind], distance: page[kind].distance };
      if (!previous) page.linked[kind] = false;
      section.dataset[kind] = page[kind].text;
      section.style.setProperty('--' + kind + '-align', page[kind].align);
      section.style.setProperty('--' + kind + '-distance', page[kind].distance / 15 + 'px');
    }
    section.dataset.wordSection = JSON.stringify(page);
    section.style.width = page.width / 15 + 'px';
    section.style.minHeight = page.height / 15 + 'px';
    section.style.padding = wordMarginSides.map((side) => Math.abs(page.margins[side]) / 15 + 'px').join(' ');
    section.style.setProperty('--section-left', page.margins.left / 15 + 'px');
    section.style.setProperty('--section-right', page.margins.right / 15 + 'px');
    previous = page;
  }
}

export function sectionPrintCss(sections: HTMLElement[], fallback: WordPageLayout) {
  function rule(name: string, page: WordPageLayout) {
    const margins = wordMarginSides.map((side) => Math.abs(page.margins[side]) / 20 + 'pt').join(' ');
    return `@page ${name}{size:${page.width / 20}pt ${page.height / 20}pt;margin:${margins};${pageTextCss('header', page.header)}${pageTextCss('footer', page.footer)}}`;
  }
  if (!sections.length) return rule('', fallback);
  let previousRule = '',
    name = '';
  const rules = sections
    .map((section, i) => {
      const page = sectionLayout(section);
      const geometry = rule('', page);
      const continuous = i > 0 && page.sectionStart === 'continuous' && previousRule === geometry;
      if (!continuous) name = 'wordSection' + i;
      const before =
        i === 0 || continuous
          ? 'auto'
          : page.sectionStart === 'oddPage'
            ? 'right'
            : page.sectionStart === 'evenPage'
              ? 'left'
              : 'page';
      previousRule = geometry;
      return (
        (continuous ? '' : rule(name, page)) +
        `@media print{body>div[data-word-section]:nth-of-type(${i + 1}){page:${name};break-before:${before}}}`
      );
    })
    .join('');
  // Keep trailing notes and the final page-break sentinel on the last section's paper.
  return rules + `@media print{body>aside[data-word-note-list],body::after{page:${name}}}`;
}

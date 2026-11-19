// HTML lists and OOXML paragraphs use different structures. The number ID links
// paragraphs across interruptions, while the level determines nesting.
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const formatTypes: Record<string, string> = {
  decimal: '1',
  upperLetter: 'A',
  lowerLetter: 'a',
  upperRoman: 'I',
  lowerRoman: 'i',
};
const attr = (node: Element | undefined, name: string) => node?.getAttributeNS(W, name) ?? '';
const children = (node: Element | undefined, name: string) =>
  Array.from(node?.children || []).filter((el) => el.namespaceURI === W && el.localName === name);
const val = (node: Element | undefined, name: string) => attr(children(node, name)[0], 'val');

export function readNumbering(xml: string, styles: Map<string, Element>) {
  const root = new DOMParser().parseFromString(xml, 'application/xml').documentElement;
  const abstracts = new Map(children(root, 'abstractNum').map((el) => [attr(el, 'abstractNumId'), el]));
  const instances = new Map(children(root, 'num').map((el) => [attr(el, 'numId'), el]));
  const counts = new Map<string, number[]>();
  return (paragraph: Element) => {
    let props = children(paragraph, 'pPr')[0];
    let id = '',
      depth = '';
    const seen = new Set<string>();
    let style = val(props, 'pStyle');
    while (props || style) {
      const numbering = children(props, 'numPr')[0];
      id ||= val(numbering, 'numId');
      depth ||= val(numbering, 'ilvl');
      if (!style || seen.has(style)) break;
      seen.add(style);
      const definition = styles.get(style);
      props = children(definition, 'pPr')[0];
      style = val(definition, 'basedOn');
    }
    const instance = instances.get(id);
    if (!instance || id === '0') return;
    const level = Number(depth || 0);
    if (!Number.isInteger(level) || level < 0 || level > 8) return;
    const byLevel = (el: Element) => Number(attr(el, 'ilvl')) === level;
    const abstract = abstracts.get(val(instance, 'abstractNumId'));
    const override = children(instance, 'lvlOverride').find(byLevel);
    const definition = children(override, 'lvl')[0] || children(abstract, 'lvl').find(byLevel);
    if (!definition) return;
    const format = val(definition, 'numFmt');
    const start = Number(val(override, 'startOverride') || val(definition, 'start') || 1);
    const counters = counts.get(id) || [];
    counters.length = level + 1;
    counters[level] = counters[level] === undefined ? start : counters[level] + 1;
    counts.set(id, counters);
    return { id, level, type: format === 'bullet' ? '' : formatTypes[format] || '1', index: counters[level] };
  };
}

// A Word numbering instance can continue after ordinary paragraphs or tables.
// HTML starts a new list there, so keep its displayed start in sync after edits.
export function refreshWordListStarts(root: HTMLElement) {
  const counts = new Map<string, number[]>();
  for (const item of Array.from(root.querySelectorAll<HTMLLIElement>('[data-word-num] > li'))) {
    const list = item.parentElement!;
    const id = list.dataset.wordNum!;
    let level = Number(list.dataset.wordLevelGap || 0);
    let parent = list.parentElement?.closest<HTMLElement>('ol,ul');
    while (parent) {
      level += 1 + Number(parent.dataset.wordLevelGap || 0);
      parent = parent.parentElement?.closest<HTMLElement>('ol,ul');
    }
    const counters = counts.get(id) || [];
    counters.length = level + 1;
    const index = item.hasAttribute('value')
      ? item.value
      : counters[level] === undefined
        ? Number(list.getAttribute('start') || 1)
        : counters[level] + 1;
    if (list instanceof HTMLOListElement && item === list.firstElementChild && list.start !== index)
      list.start = index;
    counters[level] = index;
    counts.set(id, counters);
  }
}

export function createListWriter() {
  const definitions: Map<number, { format: string; start: number }>[] = [];
  const imported = new Map<string, number>();
  function register(list: HTMLElement, level: number, start: number, restart = false) {
    const key = list.dataset.wordNum;
    let id = !restart && key ? imported.get(key) : undefined;
    if (!id) {
      id = definitions.push(new Map());
      if (key) imported.set(key, id);
    }
    const levels = definitions[id - 1];
    const type = list.getAttribute('type') || '1';
    const format =
      list.tagName === 'UL'
        ? 'bullet'
        : Object.keys(formatTypes).find((name) => formatTypes[name] === type) || 'decimal';
    if (!levels.has(level)) levels.set(level, { format, start });
    return id;
  }
  function xml() {
    if (!definitions.length) return '';
    const abstracts = definitions.map((levels, i) => {
      const body = Array.from({ length: 9 }, (_, level) => {
        const { format, start } = levels.get(level) || { format: 'decimal', start: 1 };
        const marker = format === 'bullet' ? '•' : '%' + (level + 1) + '.';
        return `<w:lvl w:ilvl="${level}"><w:start w:val="${start}"/><w:numFmt w:val="${format}"/><w:lvlText w:val="${marker}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${(level + 1) * 720}" w:hanging="360"/></w:pPr></w:lvl>`;
      }).join('');
      return `<w:abstractNum w:abstractNumId="${i}"><w:multiLevelType w:val="multilevel"/>${body}</w:abstractNum>`;
    });
    const nums = definitions.map(
      (_, i) => `<w:num w:numId="${i + 1}"><w:abstractNumId w:val="${i}"/></w:num>`
    );
    return `<w:numbering xmlns:w="${W}">${abstracts.join('')}${nums.join('')}</w:numbering>`;
  }
  return { register, xml };
}

export type PageTextKind = 'header' | 'footer';
export interface PageText {
  text: string;
  align: 'left' | 'center' | 'right';
  distance: number;
}
export function pageText(value?: Partial<PageText>, defaultAlign: PageText['align'] = 'left'): PageText {
  const distance = value?.distance;
  return {
    text: typeof value?.text === 'string' ? value.text : '',
    align:
      value?.align === 'center' || value?.align === 'right' || value?.align === 'left'
        ? value.align
        : defaultAlign,
    distance: Number.isInteger(distance) && distance! >= 0 && distance! <= 31680 ? distance! : 720,
  };
}

const tokens = /(\{页码\}|\{总页数\})/g;
const field = (text: string) => (text === '{页码}' ? 'PAGE' : text === '{总页数}' ? 'NUMPAGES' : '');
export function pageTextXml(value: PageText, escape: (text: string) => string) {
  return value.text
    .split('\n')
    .map((line) => {
      const runs = line
        .split(tokens)
        .filter(Boolean)
        .map((part) => {
          const code = field(part);
          if (code)
            return `<w:fldSimple w:instr=" ${code} " w:dirty="true"><w:r><w:t>1</w:t></w:r></w:fldSimple>`;
          return `<w:r><w:t xml:space="preserve">${escape(part)}</w:t></w:r>`;
        })
        .join('');
      return `<w:p><w:pPr><w:jc w:val="${value.align}"/></w:pPr>${runs}</w:p>`;
    })
    .join('');
}

export function pageTextCss(kind: PageTextKind, value: PageText) {
  if (!value.text) return '';
  const content = value.text
    .split(tokens)
    .filter(Boolean)
    .map((part) => {
      const code = field(part);
      if (code) return code === 'PAGE' ? 'counter(page)' : 'counter(pages)';
      // Escape CSS string delimiters, control characters and HTML style-end tags.
      return (
        '"' + part.replace(/["\\<>\x00-\x1f]/g, (char) => '\\' + char.charCodeAt(0).toString(16) + ' ') + '"'
      );
    })
    .join(' ');
  const side = kind === 'header' ? 'top' : 'bottom';
  return `@${side}-${value.align}{content:${content};vertical-align:${side};padding-${side}:${value.distance / 20}pt;white-space:pre-wrap;font:10pt/1.2 sans-serif}`;
}

export function readPageText(doc: Document, ns: string, distance: number, fallback: PageText['align']) {
  const paragraphs = Array.from(doc.getElementsByTagNameNS(ns, 'p'));
  const firstAlignment = paragraphs[0]?.getElementsByTagNameNS(ns, 'jc')[0]?.getAttributeNS(ns, 'val');
  const value = pageText({ align: firstAlignment as PageText['align'], distance }, fallback);
  const asToken = (instruction: string) => {
    const name = instruction.trim().split(/\s+/)[0]?.toUpperCase();
    return name === 'PAGE' ? '{页码}' : name === 'NUMPAGES' ? '{总页数}' : '';
  };
  value.text = paragraphs
    .map((p) => {
      let result = '',
        instruction = '',
        readingField = false,
        skipCached = false;
      function visit(node: Element) {
        if (node.localName === 'fldSimple') {
          const token = asToken(node.getAttributeNS(ns, 'instr') || '');
          if (token) {
            result += token;
            return;
          }
        }
        if (node.localName === 'fldChar') {
          const type = node.getAttributeNS(ns, 'fldCharType');
          if (type === 'begin') {
            instruction = '';
            readingField = true;
            skipCached = false;
          }
          if (type === 'separate' || (type === 'end' && readingField)) {
            const token = asToken(instruction);
            result += token;
            skipCached = !!token;
            readingField = false;
          }
          if (type === 'end') skipCached = false;
          return;
        }
        if (node.localName === 'instrText') {
          instruction += node.textContent || '';
          return;
        }
        if (!skipCached && !readingField) {
          if (node.localName === 't') result += node.textContent || '';
          if (node.localName === 'br') result += '\n';
          if (node.localName === 'tab') result += '\t';
        }
        Array.from(node.children).forEach(visit);
      }
      visit(p);
      return result;
    })
    .join('\n');
  return value;
}

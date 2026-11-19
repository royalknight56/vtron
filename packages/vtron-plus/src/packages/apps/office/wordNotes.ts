export const noteKinds = ['footnote', 'endnote'] as const;
export type NoteKind = (typeof noteKinds)[number];
export const noteLabels = { footnote: '脚注', endnote: '尾注' };
export interface WordNote {
  element: HTMLElement;
  kind: NoteKind;
  number: number;
  text: string;
}

export function noteMarker(kind: NoteKind, text: string, number = 1) {
  const marker = document.createElement('sup');
  marker.dataset.wordNote = kind;
  marker.contentEditable = 'false';
  marker.title = text;
  marker.textContent = String(number);
  return marker.outerHTML;
}

export function collectWordNotes(root: HTMLElement) {
  const counts = { footnote: 0, endnote: 0 };
  const notes: WordNote[] = [];
  for (const element of Array.from(root.querySelectorAll<HTMLElement>('sup[data-word-note]'))) {
    const kind = element.dataset.wordNote;
    if (kind !== 'footnote' && kind !== 'endnote') continue;
    const number = ++counts[kind];
    if (element.textContent !== String(number)) element.textContent = String(number);
    notes.push({ element, kind, text: element.title, number });
  }
  return notes;
}

export function noteListHtml(notes: WordNote[]) {
  const aside = document.createElement('aside');
  aside.dataset.wordNoteList = '';
  for (const kind of noteKinds) {
    const group = notes.filter((note) => note.kind === kind);
    if (!group.length) continue;
    const heading = document.createElement('h3');
    heading.textContent = noteLabels[kind];
    const list = document.createElement('ol');
    for (const note of group) {
      const item = document.createElement('li');
      item.style.whiteSpace = 'pre-wrap';
      item.textContent = note.text;
      list.append(item);
    }
    aside.append(heading, list);
  }
  return aside.childElementCount ? aside.outerHTML : '';
}

export function readNotePart(xml: string, kind: NoteKind, ns: string) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const records = new Map<string, string>();
  for (const node of Array.from(doc.getElementsByTagNameNS(ns, kind))) {
    const type = node.getAttributeNS(ns, 'type');
    if (type && type !== 'normal') continue;
    const id = node.getAttributeNS(ns, 'id');
    if (id === null) continue;
    const paragraphs = Array.from(node.getElementsByTagNameNS(ns, 'p')).map((p) =>
      Array.from(p.getElementsByTagNameNS(ns, '*'))
        .map((el) => {
          if (el.localName === 't') return el.textContent || '';
          if (el.localName === 'tab') return '\t';
          if (el.localName === 'br' || el.localName === 'cr') return '\n';
          return '';
        })
        .join('')
    );
    // Word commonly puts a space or tab between the reference and the first word.
    if (paragraphs.length && node.getElementsByTagNameNS(ns, kind + 'Ref').length)
      paragraphs[0] = paragraphs[0].replace(/^[ \t]/, '');
    records.set(id, paragraphs.join('\n'));
  }
  return records;
}

export function notePartXml(kind: NoteKind, texts: string[], ns: string, escape: (text: string) => string) {
  const marker = `<w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:${kind}Ref/></w:r>`;
  const records = texts.map((text, index) => {
    const paragraphs = text
      .split('\n')
      .map(
        (line, i) =>
          `<w:p>${i === 0 ? marker : ''}<w:r><w:t xml:space="preserve">${i === 0 ? ' ' : ''}${escape(line)}</w:t></w:r></w:p>`
      );
    return `<w:${kind} w:id="${index + 1}">${paragraphs.join('')}</w:${kind}>`;
  });
  const separator = (id: number, name: string) =>
    `<w:${kind} w:type="${name}" w:id="${id}"><w:p><w:r><w:${name}/></w:r></w:p></w:${kind}>`;
  return `<w:${kind}s xmlns:w="${ns}">${separator(-1, 'separator')}${separator(0, 'continuationSeparator')}${records.join('')}</w:${kind}s>`;
}

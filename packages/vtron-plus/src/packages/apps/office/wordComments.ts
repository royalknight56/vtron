export interface CommentText {
  text: string;
  author: string;
  date: string;
  initials: string;
}
export interface WordComment extends CommentText {
  start: HTMLElement;
  end?: HTMLElement;
}
export const commentSelector = 'span[data-word-comment],span[data-word-comment-end]';

export function commentMarker(id: string, data?: CommentText) {
  const marker = document.createElement('span');
  marker.contentEditable = 'false';
  if (data) {
    marker.dataset.wordComment = id;
    marker.dataset.author = data.author;
    marker.dataset.date = data.date;
    marker.dataset.initials = data.initials;
    marker.title = data.text;
    marker.tabIndex = 0;
    marker.setAttribute('role', 'button');
    marker.setAttribute('aria-label', '批注：' + data.text);
  } else {
    marker.dataset.wordCommentEnd = id;
    marker.setAttribute('aria-hidden', 'true');
  }
  return marker.outerHTML;
}
export function commentText(node: HTMLElement): CommentText {
  return {
    text: node.title,
    author: node.dataset.author || '',
    date: node.dataset.date || '',
    initials: node.dataset.initials || '',
  };
}
export function wordComments(root: HTMLElement) {
  const all: WordComment[] = [];
  const pending = new Map<string, WordComment>();
  for (const marker of Array.from(root.querySelectorAll<HTMLElement>(commentSelector))) {
    if (marker.dataset.wordComment !== undefined) {
      const entry = { ...commentText(marker), start: marker };
      all.push(entry);
      pending.set(marker.dataset.wordComment, entry);
    } else {
      const key = marker.dataset.wordCommentEnd!;
      const entry = pending.get(key);
      if (entry) entry.end = marker;
      pending.delete(key);
    }
  }
  return all;
}

// Pair markers before reassigning IDs. A copied point or a partial range is
// independent of the original comment when pasted back into the same document.
export function rekeyComments(root: HTMLElement, makeId: (index: number) => string) {
  const records = wordComments(root);
  const ends = new Set<HTMLElement>();
  records.forEach((entry, i) => {
    const id = makeId(i);
    entry.start.dataset.wordComment = id;
    if (entry.end) {
      entry.end.dataset.wordCommentEnd = id;
      ends.add(entry.end);
    }
  });
  for (const end of Array.from(root.querySelectorAll<HTMLElement>('span[data-word-comment-end]')))
    if (!ends.has(end)) end.remove();
  return records;
}

export function readComments(xml: string, ns: string) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const result = new Map<string, CommentText>();
  for (const node of Array.from(doc.getElementsByTagNameNS(ns, 'comment'))) {
    const get = (key: string) => node.getAttributeNS(ns, key) || '';
    const paragraphs = Array.from(node.getElementsByTagNameNS(ns, 'p'));
    const text = paragraphs
      .map((p) =>
        Array.from(p.getElementsByTagNameNS(ns, '*'))
          .map((el) => {
            if (el.localName === 't') return el.textContent || '';
            if (el.localName === 'br' || el.localName === 'cr') return '\n';
            if (el.localName === 'tab') return '\t';
            return '';
          })
          .join('')
      )
      .join('\n');
    result.set(get('id'), { text, author: get('author'), date: get('date'), initials: get('initials') });
  }
  return result;
}

export function commentsXml(records: WordComment[], ns: string, escape: (text: string) => string) {
  const xml = records
    .map((entry, i) => {
      const paragraphs = entry.text
        .split('\n')
        .map((line) => `<w:p><w:r><w:t xml:space="preserve">${escape(line)}</w:t></w:r></w:p>`);
      const date =
        entry.date && Number.isFinite(Date.parse(entry.date)) ? ` w:date="${escape(entry.date)}"` : '';
      return `<w:comment w:id="${i}" w:author="${escape(entry.author)}" w:initials="${escape(entry.initials)}"${date}>${paragraphs.join('')}</w:comment>`;
    })
    .join('');
  return `<w:comments xmlns:w="${ns}">${xml}</w:comments>`;
}

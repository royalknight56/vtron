const blockSelector = 'p,li,h1,h2,h3,h4,h5,h6,blockquote,td,th,div';
const parent = (node: Node) => node instanceof Element ? node : node.parentElement;

export function editRange(editor: HTMLElement, event?: InputEvent) {
  const target = event?.getTargetRanges?.()[0];
  const selection = window.getSelection();
  const range = document.createRange();
  if (target) {
    range.setStart(target.startContainer, target.startOffset);
    range.setEnd(target.endContainer, target.endOffset);
  } else if (selection?.rangeCount) {
    const selected = selection.getRangeAt(0);
    range.setStart(selected.startContainer, selected.startOffset);
    range.setEnd(selected.endContainer, selected.endOffset);
  } else return;
  if (editor.contains(range.commonAncestorContainer)) return range;
}

export function ownInsertion(range: Range, author: string) {
  const insertion = parent(range.commonAncestorContainer)?.closest<HTMLElement>('ins[data-word-change]');
  return insertion?.dataset.author === author ? insertion : undefined;
}

export function revisionNode(tag: 'ins' | 'del', content: Node, author: string, date: string) {
  const node = document.createElement(tag);
  node.dataset.wordChange = '';
  node.dataset.author = author;
  node.dateTime = date;
  node.contentEditable = 'false';
  node.append(content);
  return node;
}

export function textFragment(text: string) {
  const fragment = document.createDocumentFragment();
  text.split(/\r\n?|\n/).forEach((line, i) => {
    if (i) fragment.append(document.createElement('br'));
    fragment.append(document.createTextNode(line));
  });
  return fragment;
}

export function inlineEdit(range: Range) {
  return parent(range.startContainer)?.closest(blockSelector) === parent(range.endContainer)?.closest(blockSelector)
    && !parent(range.commonAncestorContainer)?.closest('[contenteditable="false"]')
    && !range.cloneContents().querySelector('p,div,table,li,h1,h2,h3,h4,h5,h6,blockquote,[data-word-change],[data-word-toc],[data-word-comment],[data-word-comment-end]');
}

// Use the browser's edit history for the replacement, then put the caret at the
// editable side of the revision. This also keeps repeated Backspace moving left.
export function recordTextChange(editor: HTMLElement, range: Range, removed: DocumentFragment,
  inserted: DocumentFragment, author: string, backward = false) {
  const box = document.createElement('div');
  const date = new Date().toISOString();
  if (removed.hasChildNodes()) box.append(revisionNode('del', removed, author, date));
  if (inserted.hasChildNodes()) box.append(revisionNode('ins', inserted, author, date));
  if (!box.lastElementChild) return;
  const id = 'r' + (++editId);
  (box.lastElementChild as HTMLElement).dataset.editCaret = id;
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand('insertHTML', false, box.innerHTML);
  const last = editor.querySelector<HTMLElement>('[data-edit-caret="' + id + '"]');
  if (!last) return;
  delete last.dataset.editCaret;
  const caret = document.createRange();
  if (last.tagName === 'INS') {
    last.removeAttribute('contenteditable');
    caret.selectNodeContents(last);
    caret.collapse(false);
  } else {
    if (backward) caret.setStartBefore(last);
    else caret.setStartAfter(last);
    caret.collapse(true);
  }
  selection.removeAllRanges();
  selection.addRange(caret);
}
let editId = 0;

// IMEs update their preedit text in place. Only the text actually committed by
// the IME belongs in the document's revision history.
export function compositionRange(editor: HTMLElement, text: string) {
  const caret = editRange(editor);
  if (!caret || !text) return;
  const block = parent(caret.endContainer)?.closest(blockSelector);
  if (!block || !editor.contains(block)) return;
  const prefix = document.createRange();
  prefix.selectNodeContents(block);
  prefix.setEnd(caret.endContainer, caret.endOffset);
  const before = prefix.toString();
  if (!before.endsWith(text)) return;
  let offset = before.length - text.length;
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = node.textContent?.length || 0;
    if (offset < length) {
      prefix.setStart(node, offset);
      return prefix;
    }
    offset -= length;
  }
}

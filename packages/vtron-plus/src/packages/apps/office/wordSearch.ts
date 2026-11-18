// A result may span inline formatting, but never a paragraph, table cell or explicit line break.
export function searchDocument(editor: HTMLElement, query: string) {
  const matches: { range: Range; before: string; text: string; after: string }[] = [];
  if (!query) return matches;
  const literal = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu');
  const block = /^(P|DIV|H[1-6]|LI|UL|OL|TD|TH|BLOCKQUOTE|PRE|BR|HR|IMG)$/;
  let nodes: Text[] = [];
  function flush() {
    if (!nodes.length) return;
    const text = nodes.map((node) => node.data).join('');
    let index = 0;
    let offset = 0;
    for (const match of text.matchAll(literal)) {
      const start = match.index!;
      const end = start + match[0].length;
      while (offset + nodes[index].length <= start) offset += nodes[index++].length;
      const range = document.createRange();
      range.setStart(nodes[index], start - offset);
      while (offset + nodes[index].length < end) offset += nodes[index++].length;
      range.setEnd(nodes[index], end - offset);
      matches.push({ range, before: text.slice(Math.max(0, start - 24), start), text: match[0], after: text.slice(end, end + 38) });
    }
    nodes = [];
  }
  function visit(node: Node) {
    if (node instanceof Text) {
      if (node.length) nodes.push(node);
      return;
    }
    const boundary = block.test(node.nodeName) ||
      (node instanceof HTMLElement && node.hasAttribute('data-word-page-break'));
    if (boundary) flush();
    node.childNodes.forEach(visit);
    if (boundary) flush();
  }
  visit(editor);
  flush();
  return matches;
}

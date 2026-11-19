export const tocMarker = '<div data-word-toc="" contenteditable="false">目录</div>';

export function wordHeadings(root: HTMLElement, maxLevel = 6) {
  return Array.from(root.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6')).filter(
    (el) =>
      Number(el.tagName[1]) <= maxLevel && !el.closest('table,[data-word-toc]') && el.textContent?.trim()
  );
}

export function refreshWordToc(root: HTMLElement) {
  const contents = root.querySelectorAll<HTMLElement>('div[data-word-toc]');
  if (!contents.length) return;
  const headings = wordHeadings(root, 3);
  const prefix = root.id || 'vtron-word';
  headings.forEach((heading, i) => {
    heading.id = prefix + '-heading-' + i;
  });
  for (const toc of Array.from(contents)) {
    const nodes = document.createDocumentFragment();
    const label = document.createElement('strong');
    label.textContent = '目录';
    nodes.append(label);
    headings.forEach((heading, i) => {
      const line = document.createElement('p');
      const link = document.createElement('a');
      link.href = '#' + heading.id;
      link.textContent = heading.textContent!.trim();
      link.dataset.tocEntry = String(i);
      line.append(link);
      line.style.marginLeft = (Number(heading.tagName[1]) - 1) * 12 + 'pt';
      nodes.append(line);
    });
    // Avoid disturbing selection and undo when edits do not affect this directory.
    if (
      toc.childNodes.length !== nodes.childNodes.length ||
      Array.from(toc.childNodes).some((child, i) => !child.isEqualNode(nodes.childNodes[i]))
    ) {
      toc.replaceChildren(nodes);
    }
  }
}

export function tocXml(headings: HTMLElement[], escape: (text: string) => string) {
  const begin =
    '<w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>' +
    '<w:r><w:instrText xml:space="preserve"> TOC \\o "1-3" \\h \\n </w:instrText></w:r>' +
    '<w:r><w:fldChar w:fldCharType="separate"/></w:r>';
  const end = '<w:r><w:fldChar w:fldCharType="end"/></w:r>';
  const entries = headings.map((heading, i) => {
    const indent = (Number(heading.tagName[1]) - 1) * 240;
    const link = `<w:hyperlink w:anchor="_VtronHeading${i}"><w:r><w:t>${escape(heading.textContent!.trim())}</w:t></w:r></w:hyperlink>`;
    return `<w:p><w:pPr><w:ind w:left="${indent}"/></w:pPr>${i === 0 ? begin : ''}${link}${i === headings.length - 1 ? end : ''}</w:p>`;
  });
  return (
    '<w:sdt><w:sdtPr><w:docPartObj><w:docPartGallery w:val="Table of Contents"/><w:docPartUnique/></w:docPartObj></w:sdtPr>' +
    '<w:sdtContent><w:p><w:r><w:t>目录</w:t></w:r></w:p>' +
    (entries.join('') || '<w:p>' + begin + end + '</w:p>') +
    '</w:sdtContent></w:sdt>'
  );
}

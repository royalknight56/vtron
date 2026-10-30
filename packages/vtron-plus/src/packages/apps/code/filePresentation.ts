import type { VtronFileWithoutContent } from 'vtron';

export function languageName(name: string) {
  const names: Record<string, string> = { js: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript', jsx: 'JavaScript React', ts: 'TypeScript', tsx: 'TypeScript React', json: 'JSON', html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'SCSS', vue: 'Vue', md: 'Markdown', py: 'Python', rs: 'Rust', go: 'Go', sh: 'Shell', yml: 'YAML', yaml: 'YAML', sql: 'SQL', xml: 'XML' };
  return names[name.split('.').pop()?.toLowerCase() || ''] || '纯文本';
}

export function fileLabel(name: string) { return ({ JavaScript: 'JS', TypeScript: 'TS', JSON: '{}', HTML: '◇', CSS: '#', Vue: 'V', Python: 'Py', Markdown: 'M' } as Record<string, string>)[languageName(name)] || '≡'; }
export function fileColor(name: string) { return ({ JavaScript: 'yellow', TypeScript: 'blue', JSON: 'yellow', HTML: 'orange', CSS: 'purple', Vue: 'green', Python: 'blue', Markdown: 'blue' } as Record<string, string>)[languageName(name)] || ''; }

export function sortedFiles(list: VtronFileWithoutContent[]) {
  return list.filter(file => !/^(\.git|\.DS_Store)$/.test(file.name) && !file.name.startsWith('.vtron-npm-') && !(file.isFile && /\.(exe|group)$/i.test(file.name)))
    .sort((a, b) => Number(b.isDirectory) - Number(a.isDirectory) || a.name.localeCompare(b.name, 'zh-CN', { numeric: true }));
}

export function isTextFile(file: { name: string; size?: number }, content?: string) {
  return (file.size || 0) <= 2 * 1024 * 1024 && !/\.(exe|group|png|jpe?g|gif|webp|bmp|ico|svgz|vtimg|pdf|zip|gz|7z|woff2?|ttf|mp[34]|wav|ogg|docx?|xlsx?|pptx?|vtdoc|vtxls|vtppt)$/i.test(file.name) && !content?.includes('\0');
}

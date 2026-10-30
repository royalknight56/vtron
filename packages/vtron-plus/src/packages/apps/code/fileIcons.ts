import javascriptIcon from '../../assets/file-javascript.svg';
import jsonIcon from '../../assets/file-json.svg';
import typescriptIcon from '../../assets/file-typescript.svg';
import htmlIcon from '../../assets/file-html.svg';
import cssIcon from '../../assets/file-css.svg';
import vueIcon from '../../assets/file-vue.svg';

export function codeFileIcon(name: string): string | undefined {
  const extension = name.split('.').pop()?.toLowerCase();
  if (extension && ['js', 'mjs', 'cjs', 'jsx'].includes(extension)) return javascriptIcon;
  if (extension && ['json', 'jsonc'].includes(extension)) return jsonIcon;
  if (extension && ['ts', 'mts', 'cts', 'tsx'].includes(extension)) return typescriptIcon;
  if (extension && ['html', 'htm'].includes(extension)) return htmlIcon;
  if (extension && ['css', 'scss', 'sass', 'less'].includes(extension)) return cssIcon;
  if (extension === 'vue') return vueIcon;
  return undefined;
}

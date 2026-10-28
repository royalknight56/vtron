import JSZip from 'jszip';

export interface SlideElement {
  id: string;
  type?: 'text' | 'shape' | 'image';
  shape?: 'rect' | 'roundRect' | 'ellipse' | 'triangle' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize: number;
  fontFamily?: string;
  bold: boolean;
  italic: boolean;
  underline?: boolean;
  color: string;
  textAlign: string;
  backgroundColor: string;
  borderColor?: string;
  borderWidth?: number;
  rotation?: number;
}
export interface Slide {
  id: string;
  backgroundColor: string;
  elements: SlideElement[];
  notes?: string;
  transition?: 'none' | 'fade' | 'push';
}
export interface Presentation {
  title: string;
  width: number;
  height: number;
  slides: Slide[];
}
let seq = 0;
export const pptId = () => `ppt-${Date.now().toString(36)}-${seq++}`;
export const safeColor = (v: unknown, fallback = '#333333') =>
  typeof v === 'string' && /^#[\da-f]{6}$/i.test(v) ? v : fallback;
const finite = (v: unknown, d: number, min = -10000, max = 10000) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d;
export function normalizePresentation(value: unknown): Presentation {
  const input = value as Partial<Presentation>;
  if (!input || !Array.isArray(input.slides) || !input.slides.length || input.slides.length > 500)
    throw new Error('文件中需要有 1–500 张幻灯片');
  return {
    title: typeof input.title === 'string' ? input.title.slice(0, 120) : '演示文稿',
    width: finite(input.width, 960, 320, 3840),
    height: finite(input.height, 540, 240, 2160),
    slides: input.slides.map((s) => {
      if (!s || !Array.isArray(s.elements) || s.elements.length > 500) throw new Error('幻灯片内容无效');
      return {
        id: pptId(),
        backgroundColor: safeColor(s.backgroundColor, '#ffffff'),
        notes: typeof s.notes === 'string' ? s.notes.slice(0, 50000) : '',
        transition: s.transition === 'fade' || s.transition === 'push' ? s.transition : 'none',
        elements: s.elements.map((e) => {
          if (!e || typeof e !== 'object') throw new Error('对象内容无效');
          const type = e.type === 'image' || e.type === 'shape' ? e.type : 'text';
          const content = typeof e.content === 'string' ? e.content : '';
          if (type === 'image' && content.length > 16000000) throw new Error('单张图片超过支持的大小');
          if (type === 'image' && !/^data:image\/(png|jpeg|gif);base64,[A-Za-z0-9+/=\s]+$/i.test(content))
            throw new Error('图片需要为嵌入的 PNG、JPEG 或 GIF');
          return {
            id: pptId(),
            type,
            shape: ['rect', 'roundRect', 'ellipse', 'triangle', 'line'].includes(e.shape || '')
              ? e.shape
              : 'rect',
            x: finite(e.x, 100),
            y: finite(e.y, 100),
            width: finite(e.width, 300, 8, 5000),
            height: finite(e.height, 80, 4, 5000),
            content: type === 'image' ? content : content.slice(0, 100000),
            fontSize: finite(e.fontSize, 24, 8, 240),
            fontFamily: typeof e.fontFamily === 'string' ? e.fontFamily.slice(0, 100) : 'Arial',
            bold: Boolean(e.bold),
            italic: Boolean(e.italic),
            underline: Boolean(e.underline),
            color: safeColor(e.color),
            textAlign: ['left', 'center', 'right'].includes(e.textAlign) ? e.textAlign : 'left',
            backgroundColor: safeColor(e.backgroundColor, 'transparent'),
            borderColor: safeColor(e.borderColor, 'transparent'),
            borderWidth: finite(e.borderWidth, 0, 0, 24),
            rotation: finite(e.rotation, 0, -360, 360),
          };
        }),
      };
    }),
  };
}
const xml = (value: unknown) =>
  String(value ?? '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(
      /[<>&"']/g,
      (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!
    );
const prefix = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const pns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const ans = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const rns = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const rels = (entries: [string, string, string][]) =>
  prefix +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${entries.map(([id, type, target]) => `<Relationship Id="${id}" Type="${rns}/${type}" Target="${xml(target)}"/>`).join('')}</Relationships>`;
const group =
  '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
const color = (v: string) => v.replace('#', '').toUpperCase();
const fill = (v: string) =>
  v === 'transparent' ? '<a:noFill/>' : `<a:solidFill><a:srgbClr val="${color(v)}"/></a:solidFill>`;
const emu = (v: number) => Math.round(v * 9525);
function textBody(el: SlideElement) {
  const align = el.textAlign === 'center' ? 'ctr' : el.textAlign === 'right' ? 'r' : 'l';
  const props = `lang="zh-CN" sz="${Math.round(el.fontSize * 75)}" b="${el.bold ? 1 : 0}" i="${el.italic ? 1 : 0}"${el.underline ? ' u="sng"' : ''}`;
  return `<p:txBody><a:bodyPr wrap="square" lIns="76200" rIns="76200" tIns="57150" bIns="57150"/><a:lstStyle/>${el.content
    .split('\n')
    .map(
      (line) =>
        `<a:p><a:pPr algn="${align}"/><a:r><a:rPr ${props}>${fill(el.color)}<a:latin typeface="${xml(el.fontFamily || 'Arial')}"/><a:ea typeface="${xml(el.fontFamily || 'Arial')}"/></a:rPr><a:t xml:space="preserve">${xml(line)}</a:t></a:r><a:endParaRPr ${props}/></a:p>`
    )
    .join('')}</p:txBody>`;
}
function transform(el: SlideElement) {
  return `<a:xfrm rot="${Math.round((el.rotation || 0) * 60000)}"><a:off x="${emu(el.x)}" y="${emu(el.y)}"/><a:ext cx="${emu(el.width)}" cy="${emu(el.height)}"/></a:xfrm>`;
}
const theme =
  prefix +
  `<a:theme xmlns:a="${ans}" name="Office"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F2937"/></a:dk2><a:lt2><a:srgbClr val="F4F4F5"/></a:lt2>${['D35230', '4472C4', '70AD47', 'FFC000', '5B9BD5', 'A5A5A5'].map((v, i) => `<a:accent${i + 1}><a:srgbClr val="${v}"/></a:accent${i + 1}>`).join('')}<a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Arial"/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst>${[1, 2, 3].map(() => '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>').join('')}</a:fillStyleLst><a:lnStyleLst>${[6350, 12700, 19050].map((w) => `<a:ln w="${w}"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>`).join('')}</a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst>${[1, 2, 3].map(() => '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>').join('')}</a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;

export async function exportPptx(data: Presentation): Promise<Blob> {
  const zip = new JSZip();
  const overrides: string[] = [];
  const override = (part: string, kind: string) =>
    overrides.push(
      `<Override PartName="/${part}" ContentType="application/vnd.openxmlformats-officedocument.${kind}+xml"/>`
    );
  override('ppt/presentation.xml', 'presentationml.presentation.main');
  override('ppt/slideMasters/slideMaster1.xml', 'presentationml.slideMaster');
  override('ppt/slideLayouts/slideLayout1.xml', 'presentationml.slideLayout');
  override('ppt/theme/theme1.xml', 'theme');
  override('ppt/notesMasters/notesMaster1.xml', 'presentationml.notesMaster');
  zip.file('_rels/.rels', rels([['rId1', 'officeDocument', 'ppt/presentation.xml']]));
  zip.file('ppt/theme/theme1.xml', theme);
  const colorMap =
    '<p:clrMap accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" bg1="lt1" bg2="lt2" folHlink="folHlink" hlink="hlink" tx1="dk1" tx2="dk2"/>';
  zip.file(
    'ppt/slideMasters/slideMaster1.xml',
    prefix +
      `<p:sldMaster xmlns:p="${pns}" xmlns:a="${ans}" xmlns:r="${rns}"><p:cSld><p:spTree>${group}</p:spTree></p:cSld>${colorMap}<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`
  );
  zip.file(
    'ppt/slideMasters/_rels/slideMaster1.xml.rels',
    rels([
      ['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'],
      ['rId2', 'theme', '../theme/theme1.xml'],
    ])
  );
  zip.file(
    'ppt/slideLayouts/slideLayout1.xml',
    prefix +
      `<p:sldLayout xmlns:p="${pns}" xmlns:a="${ans}" xmlns:r="${rns}" type="blank" preserve="1"><p:cSld name="空白"><p:spTree>${group}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`
  );
  zip.file(
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
    rels([['rId1', 'slideMaster', '../slideMasters/slideMaster1.xml']])
  );
  zip.file(
    'ppt/notesMasters/notesMaster1.xml',
    prefix +
      `<p:notesMaster xmlns:p="${pns}" xmlns:a="${ans}" xmlns:r="${rns}"><p:cSld><p:spTree>${group}</p:spTree></p:cSld>${colorMap}<p:notesStyle/></p:notesMaster>`
  );
  zip.file('ppt/notesMasters/_rels/notesMaster1.xml.rels', rels([['rId1', 'theme', '../theme/theme1.xml']]));
  for (let i = 0; i < data.slides.length; i++) {
    const slide = data.slides[i];
    const n = i + 1;
    override(`ppt/slides/slide${n}.xml`, 'presentationml.slide');
    override(`ppt/notesSlides/notesSlide${n}.xml`, 'presentationml.notesSlide');
    const relationships: [string, string, string][] = [
      ['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'],
      ['rId2', 'notesSlide', `../notesSlides/notesSlide${n}.xml`],
    ];
    let shapes = '';
    for (let j = 0; j < slide.elements.length; j++) {
      const el = slide.elements[j];
      const id = j + 2;
      if (el.type === 'image') {
        const match = el.content.match(/^data:image\/(png|jpeg|gif);base64,(.+)$/s);
        if (!match) continue;
        const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
        const imagePath = `image${n}_${j}.${extension}`;
        zip.file(`ppt/media/${imagePath}`, match[2], { base64: true });
        const rid = `rId${j + 3}`;
        relationships.push([rid, 'image', `../media/${imagePath}`]);
        shapes += `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="图片 ${id}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${transform(el)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
      } else {
        shapes += `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${el.type === 'shape' ? '形状' : '文本框'} ${id}"/><p:cNvSpPr${el.type !== 'shape' ? ' txBox="1"' : ''}/><p:nvPr/></p:nvSpPr><p:spPr>${transform(el)}<a:prstGeom prst="${el.type === 'shape' ? el.shape || 'rect' : 'rect'}"><a:avLst/></a:prstGeom>${fill(el.backgroundColor)}<a:ln w="${emu(el.borderWidth || 0)}">${fill(el.borderColor || 'transparent')}</a:ln></p:spPr>${textBody(el)}</p:sp>`;
      }
    }
    const transition =
      slide.transition === 'fade'
        ? '<p:transition spd="med"><p:fade/></p:transition>'
        : slide.transition === 'push'
          ? '<p:transition spd="med"><p:push dir="l"/></p:transition>'
          : '';
    zip.file(
      `ppt/slides/slide${n}.xml`,
      prefix +
        `<p:sld xmlns:p="${pns}" xmlns:a="${ans}" xmlns:r="${rns}"><p:cSld><p:bg><p:bgPr>${fill(slide.backgroundColor)}<a:effectLst/></p:bgPr></p:bg><p:spTree>${group}${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${transition}</p:sld>`
    );
    zip.file(`ppt/slides/_rels/slide${n}.xml.rels`, rels(relationships));
    const note: SlideElement = {
      id: 'notes',
      x: 80,
      y: 300,
      width: 560,
      height: 400,
      content: slide.notes || '',
      fontSize: 16,
      bold: false,
      italic: false,
      color: '#333333',
      textAlign: 'left',
      backgroundColor: 'transparent',
    };
    zip.file(
      `ppt/notesSlides/notesSlide${n}.xml`,
      prefix +
        `<p:notes xmlns:p="${pns}" xmlns:a="${ans}" xmlns:r="${rns}"><p:cSld><p:spTree>${group}<p:sp><p:nvSpPr><p:cNvPr id="2" name="备注"/><p:cNvSpPr/><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr>${transform(note)}</p:spPr>${textBody(note)}</p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`
    );
    zip.file(
      `ppt/notesSlides/_rels/notesSlide${n}.xml.rels`,
      rels([
        ['rId1', 'notesMaster', '../notesMasters/notesMaster1.xml'],
        ['rId2', 'slide', `../slides/slide${n}.xml`],
      ])
    );
  }
  zip.file(
    'ppt/presentation.xml',
    prefix +
      `<p:presentation xmlns:p="${pns}" xmlns:a="${ans}" xmlns:r="${rns}"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rIdMaster"/></p:sldMasterIdLst><p:notesMasterIdLst><p:notesMasterId r:id="rIdNotes"/></p:notesMasterIdLst><p:sldIdLst>${data.slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${emu(data.width)}" cy="${emu(data.height)}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`
  );
  zip.file(
    'ppt/_rels/presentation.xml.rels',
    rels([
      ['rIdMaster', 'slideMaster', 'slideMasters/slideMaster1.xml'],
      ['rIdNotes', 'notesMaster', 'notesMasters/notesMaster1.xml'],
      ...data.slides.map((_, i): [string, string, string] => [
        `rId${i + 1}`,
        'slide',
        `slides/slide${i + 1}.xml`,
      ]),
    ])
  );
  zip.file(
    '[Content_Types].xml',
    prefix +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/>${overrides.join('')}</Types>`
  );
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    compression: 'DEFLATE',
  });
}

const descendants = (el: Element | Document, tag: string) => Array.from(el.getElementsByTagNameNS('*', tag));
const first = (el: Element | Document, tag: string) => descendants(el, tag)[0];
function parseXml(source: string) {
  const doc = new DOMParser().parseFromString(source, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('PPTX XML 文件损坏');
  return doc;
}
function resolvePart(base: string, target: string) {
  if (target.startsWith('/')) return target.slice(1);
  const parts = base.split('/').slice(0, -1);
  for (const part of target.split('/')) {
    if (part === '..') parts.pop();
    else if (part !== '.') parts.push(part);
  }
  return parts.join('/');
}
async function relationships(zip: JSZip, path: string) {
  const slash = path.lastIndexOf('/');
  const source = await zip
    .file(`${path.slice(0, slash)}/_rels/${path.slice(slash + 1)}.rels`)
    ?.async('string');
  const map = new Map<string, { path: string; type: string }>();
  if (source)
    descendants(parseXml(source), 'Relationship').forEach((r) => {
      if (r.getAttribute('TargetMode') === 'External') return;
      map.set(r.getAttribute('Id') || '', {
        path: resolvePart(path, r.getAttribute('Target') || ''),
        type: r.getAttribute('Type') || '',
      });
    });
  return map;
}
export async function importPptx(input: ArrayBuffer): Promise<{ data: Presentation; simplified: boolean }> {
  const zip = await JSZip.loadAsync(input);
  const size = Object.values(zip.files).reduce(
    (total, file) =>
      total + ((file as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 0),
    0
  );
  if (size > 100 * 1024 * 1024) throw new Error('解压后的演示文稿超过 100 MB');
  const source = await zip.file('ppt/presentation.xml')?.async('string');
  if (!source) throw new Error('请选择有效的 PPTX 文件');
  const document = parseXml(source);
  const relationMap = await relationships(zip, 'ppt/presentation.xml');
  const dimensions = first(document, 'sldSz');
  const width = Number(dimensions?.getAttribute('cx')) / 9525 || 960;
  const height = Number(dimensions?.getAttribute('cy')) / 9525 || 540;
  const slides: Slide[] = [];
  let simplified = false;
  const slideRefs = descendants(document, 'sldId');
  if (!slideRefs.length || slideRefs.length > 500) throw new Error('文件中需要有 1–500 张幻灯片');
  for (const ref of slideRefs) {
    const slidePath = relationMap.get(ref.getAttributeNS(rns, 'id') || '')?.path;
    const slideSource = slidePath && (await zip.file(slidePath)?.async('string'));
    if (!slidePath || !slideSource) continue;
    const slideDoc = parseXml(slideSource);
    const slideRelations = await relationships(zip, slidePath);
    const bg = first(slideDoc, 'bgPr');
    const slide: Slide = {
      id: pptId(),
      backgroundColor: safeColor('#' + (bg && first(bg, 'srgbClr')?.getAttribute('val')), '#ffffff'),
      elements: [],
      notes: '',
      transition: first(slideDoc, 'fade') ? 'fade' : first(slideDoc, 'push') ? 'push' : 'none',
    };
    const tree = first(slideDoc, 'spTree');
    if (!tree) continue;
    for (const node of Array.from(tree.children)) {
      if (node.localName !== 'sp' && node.localName !== 'pic') {
        if (!['nvGrpSpPr', 'grpSpPr'].includes(node.localName)) simplified = true;
        continue;
      }
      const tx = first(node, 'xfrm');
      const off = tx && first(tx, 'off');
      const ext = tx && first(tx, 'ext');
      const rPr = first(node, 'rPr') || first(node, 'defRPr');
      const spPr = first(node, 'spPr');
      const directFill = spPr && Array.from(spPr.children).find((c) => c.localName === 'solidFill');
      const runFill = rPr && first(rPr, 'srgbClr');
      const geometry = first(node, 'prstGeom')?.getAttribute('prst') || 'rect';
      const type =
        node.localName === 'pic'
          ? 'image'
          : first(node, 'cNvSpPr')?.getAttribute('txBox') === '1'
            ? 'text'
            : 'shape';
      const paragraphs = descendants(node, 'p').filter((p) => p.namespaceURI === ans);
      let content = paragraphs
        .map((p) =>
          descendants(p, 't')
            .map((t) => t.textContent || '')
            .join('')
        )
        .join('\n');
      if (!tx) simplified = true;
      if (type === 'image') {
        const blip = first(node, 'blip');
        const image = slideRelations.get(blip?.getAttributeNS(rns, 'embed') || '');
        const imageFile = image && zip.file(image.path);
        const extension = image?.path.split('.').pop()?.toLowerCase();
        if (!imageFile || !['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) {
          simplified = true;
          continue;
        }
        content = `data:image/${extension === 'jpg' ? 'jpeg' : extension};base64,${await imageFile.async('base64')}`;
      }
      const line = spPr && Array.from(spPr.children).find((c) => c.localName === 'ln');
      const align = first(node, 'pPr')?.getAttribute('algn');
      slide.elements.push({
        id: pptId(),
        type,
        shape: ['rect', 'roundRect', 'ellipse', 'triangle', 'line'].includes(geometry)
          ? (geometry as SlideElement['shape'])
          : 'rect',
        x: off?.hasAttribute('x') ? Number(off.getAttribute('x')) / 9525 : 80,
        y: off?.hasAttribute('y') ? Number(off.getAttribute('y')) / 9525 : 80,
        width: Number(ext?.getAttribute('cx')) / 9525 || 600,
        height: Number(ext?.getAttribute('cy')) / 9525 || 100,
        content,
        fontSize: Number(rPr?.getAttribute('sz')) / 75 || 24,
        fontFamily: (rPr && first(rPr, 'latin')?.getAttribute('typeface')) || 'Arial',
        bold: rPr?.getAttribute('b') === '1',
        italic: rPr?.getAttribute('i') === '1',
        underline: rPr?.getAttribute('u') === 'sng',
        color: safeColor('#' + runFill?.getAttribute('val')),
        textAlign: align === 'ctr' ? 'center' : align === 'r' ? 'right' : 'left',
        backgroundColor: safeColor(
          '#' + (directFill && first(directFill, 'srgbClr')?.getAttribute('val')),
          'transparent'
        ),
        borderColor: safeColor('#' + (line && first(line, 'srgbClr')?.getAttribute('val')), 'transparent'),
        borderWidth: Number(line?.getAttribute('w')) / 9525 || 0,
        rotation: Number(tx?.getAttribute('rot')) / 60000 || 0,
      });
    }
    const notesPart = Array.from(slideRelations.values()).find((r) => r.type.endsWith('/notesSlide'));
    const notesSource = notesPart && (await zip.file(notesPart.path)?.async('string'));
    if (notesSource) {
      const noteDoc = parseXml(notesSource);
      slide.notes = descendants(noteDoc, 'sp')
        .filter((sp) => first(sp, 'ph')?.getAttribute('type') === 'body')
        .flatMap((sp) => descendants(sp, 't').map((t) => t.textContent || ''))
        .join('\n');
    }
    if (first(slideDoc, 'timing') || first(slideDoc, 'graphicFrame')) simplified = true;
    slides.push(slide);
  }
  if (!slides.length) throw new Error('无法读取幻灯片');
  return { data: normalizePresentation({ title: '导入的演示文稿', width, height, slides }), simplified };
}

export function downloadPptFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

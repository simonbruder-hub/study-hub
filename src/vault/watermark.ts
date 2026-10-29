/**
 * Wasserzeichen mit pdf-lib, im Browser der Moderation bei der Freigabe: eine kleine graue
 * Fusszeile mit der Quelle auf jeder Seite, dazu Titel, Autor und Schlagwörter in den
 * Metadaten. Gedrehte Seiten und Seiten mit Rand (CropBox) sind berücksichtigt.
 */
import {
  PDFDocument, StandardFonts, degrees, popGraphicsState, pushGraphicsState, rgb, type PDFFont, type PDFPage,
} from 'pdf-lib';

export interface WatermarkInfo { footer: string; title: string; author: string; subject: string; keywords: string[] }
export interface Box { x: number; y: number; width: number; height: number }
export interface Placement { x: number; y: number; rotate: number; maxWidth: number }

const MARGIN = 10;
const SIZE = 7;
const MIN_SIZE = 5;

/** Die Standardschrift kennt nur Zeichen aus WinAnsi (Latin-1 und ein paar mehr); der Rest wird ersetzt */
export function toWinAnsi(text: string): string {
  const map: Record<string, string> = {
    '\u2013': '-', '\u2014': '-', '\u2018': "'", '\u2019': "'", '\u201c': '"', '\u201d': '"', '\u201e': '"', '\u2026': '...',
  };
  let out = '';
  for (const ch of text.normalize('NFC')) {
    const c = ch.codePointAt(0)!;
    if (map[ch] !== undefined) out += map[ch];
    else if ((c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || c === 0x20ac) out += ch;
    else if (/\s/.test(ch)) out += ' ';
    else out += '?';
  }
  return out;
}

/**
 * Anfang der Fusszeile, unten links so, wie die Seite angezeigt wird. Ein PDF-Betrachter dreht
 * eine Seite mit /Rotate im Uhrzeigersinn; die Schrift wird darum entgegen gedreht.
 */
export function footerPlacement(box: Box, rotation: number, margin = MARGIN): Placement {
  const r = (((Math.round(rotation / 90) * 90) % 360) + 360) % 360;
  switch (r) {
    case 90: return { x: box.x + box.width - margin, y: box.y + margin, rotate: 90, maxWidth: box.height - 2 * margin };
    case 180: return { x: box.x + box.width - margin, y: box.y + box.height - margin, rotate: 180, maxWidth: box.width - 2 * margin };
    case 270: return { x: box.x + margin, y: box.y + box.height - margin, rotate: 270, maxWidth: box.height - 2 * margin };
    default: return { x: box.x + margin, y: box.y + margin, rotate: 0, maxWidth: box.width - 2 * margin };
  }
}

/** Vektor (u, v) im gedrehten System in Seitenkoordinaten */
export function turn(angle: number, u: number, v: number): [number, number] {
  const t = (angle * Math.PI) / 180;
  const c = Math.round(Math.cos(t) * 1e9) / 1e9;
  const s = Math.round(Math.sin(t) * 1e9) / 1e9;
  return [u * c - v * s, u * s + v * c];
}

/** Schrift verkleinern, bis der Text passt; sonst kürzen */
export function fitText(width: (text: string, size: number) => number, text: string, maxWidth: number) {
  let size = SIZE;
  const full = width(text, SIZE);
  if (full > maxWidth) size = Math.max(MIN_SIZE, (SIZE * maxWidth) / full);
  let t = text;
  while (t.length > 1 && width(t, size) > maxWidth) t = `${t.slice(0, Math.max(1, t.length - 4)).trimEnd()}...`;
  return { text: t, size };
}

/** Bisherigen Inhalt in q ... Q kapseln, damit eine offene Transformation die Fusszeile nicht verschiebt */
function isolate(pdf: PDFDocument, page: PDFPage) {
  page.node.normalize();
  const start = pdf.context.register(pdf.context.contentStream([pushGraphicsState()]));
  const end = pdf.context.register(pdf.context.contentStream([popGraphicsState()]));
  page.node.wrapContentStreams(start, end);
}

function drawFooter(page: PDFPage, font: PDFFont, text: string) {
  const p = footerPlacement(page.getCropBox(), page.getRotation().angle);
  const fit = fitText((t, s) => font.widthOfTextAtSize(t, s), text, p.maxWidth);
  const width = font.widthOfTextAtSize(fit.text, fit.size);
  const [dx, dy] = turn(p.rotate, -3, -2.5);
  page.drawRectangle({
    x: p.x + dx, y: p.y + dy, width: width + 6, height: fit.size + 4.5,
    rotate: degrees(p.rotate), color: rgb(1, 1, 1), opacity: 0.8,
  });
  page.drawText(fit.text, { x: p.x, y: p.y, size: fit.size, font, color: rgb(0.3, 0.3, 0.3), rotate: degrees(p.rotate) });
}

export async function watermark(bytes: Uint8Array, info: WatermarkInfo): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const text = toWinAnsi(info.footer);
  for (const page of pdf.getPages()) {
    isolate(pdf, page);
    drawFooter(page, font, text);
  }
  pdf.setTitle(info.title);
  pdf.setAuthor(info.author);
  pdf.setSubject(info.subject);
  pdf.setKeywords(info.keywords);
  pdf.setCreator('Study Hub');
  pdf.setProducer('Study Hub mit pdf-lib');
  pdf.setModificationDate(new Date());
  return pdf.save();
}

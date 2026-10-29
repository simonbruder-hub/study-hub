import { PDFDocument, StandardFonts, degrees, pushGraphicsState, translate } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { beforeAll, describe, expect, it } from 'vitest';
import { fitText, footerPlacement, toWinAnsi, turn, watermark } from './watermark';

beforeAll(async () => {
  // PDF.js ohne eigenen Worker (Node)
  await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
});

const box = { x: 10, y: 20, width: 400, height: 600 };

describe('footerPlacement', () => {
  it('beginnt unten links, so wie die Seite angezeigt wird', () => {
    expect(footerPlacement(box, 0)).toEqual({ x: 20, y: 30, rotate: 0, maxWidth: 380 });
    // 90 Grad im Uhrzeigersinn: der rechte Rand ist unten
    expect(footerPlacement(box, 90)).toEqual({ x: 400, y: 30, rotate: 90, maxWidth: 580 });
    // 180 Grad: der obere Rand ist unten
    expect(footerPlacement(box, 180)).toEqual({ x: 400, y: 610, rotate: 180, maxWidth: 380 });
    // 270 Grad: der linke Rand ist unten
    expect(footerPlacement(box, 270)).toEqual({ x: 20, y: 610, rotate: 270, maxWidth: 580 });
    expect(footerPlacement(box, -90)).toEqual(footerPlacement(box, 270));
    expect(footerPlacement(box, 450)).toEqual(footerPlacement(box, 90));
  });

  it.each([0, 90, 180, 270])('Text und Schrifthöhe bleiben bei %i Grad in der Seite', (rotation) => {
    const p = footerPlacement(box, rotation);
    const corners = [[0, 0], [p.maxWidth, 0], [0, 8], [p.maxWidth, 8]].map(([u, v]) => {
      const [dx, dy] = turn(p.rotate, u!, v!);
      return [p.x + dx, p.y + dy];
    });
    for (const [x, y] of corners) {
      expect(x).toBeGreaterThanOrEqual(box.x);
      expect(x).toBeLessThanOrEqual(box.x + box.width);
      expect(y).toBeGreaterThanOrEqual(box.y);
      expect(y).toBeLessThanOrEqual(box.y + box.height);
    }
  });
});

describe('toWinAnsi und fitText', () => {
  it('ersetzt Zeichen, die die Standardschrift nicht kennt', () => {
    expect(toWinAnsi('Grösse \u2013 Spannung «U» in µV, \u03b1')).toBe('Grösse - Spannung «U» in µV, ?');
    expect(toWinAnsi('Zeile\nzwei')).toBe('Zeile zwei');
  });

  it('verkleinert die Schrift und kürzt, wenn nötig', () => {
    const width = (t: string, s: number) => t.length * s * 0.5;
    expect(fitText(width, 'kurz', 100)).toEqual({ text: 'kurz', size: 7 });
    const mid = fitText(width, 'x'.repeat(30), 90);
    expect(mid.size).toBeCloseTo(6, 5);
    const long = fitText(width, 'x'.repeat(200), 100);
    expect(long.size).toBe(5);
    expect(long.text.endsWith('...')).toBe(true);
    expect(width(long.text, long.size)).toBeLessThanOrEqual(100);
  });
});

/** Text und Position (in Seitenkoordinaten) jeder Seite, gelesen mit PDF.js */
async function textOf(bytes: Uint8Array) {
  const doc = await getDocument({ data: bytes.slice(), verbosity: 0 }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    pages.push(content.items.filter((i) => 'str' in i).map((i) => ({ str: i.str, x: i.transform[4], y: i.transform[5] })));
  }
  return pages;
}

describe('watermark', () => {
  it('setzt die Fusszeile auf jede Seite, auch gedreht, mit Rand und verschobenem Inhalt', async () => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    pdf.addPage([595, 842]).drawText('Aufgabe 1', { x: 50, y: 700, size: 12, font });
    pdf.addPage([595, 842]).setRotation(degrees(90));
    const cropped = pdf.addPage([595, 842]);
    cropped.setCropBox(50, 60, 400, 500);
    // Inhalt, der eine Transformation offen lässt (q ohne Q); die Fusszeile darf nicht mitwandern
    pdf.addPage([595, 842]).pushOperators(pushGraphicsState(), translate(200, 300));
    const out = await watermark(await pdf.save(), {
      footer: 'Quelle: Prüfung HS24, Prof. M. Muster | ETG1 Grundlagen \u2013 Elektrotechnik | Study Hub',
      title: 'Prüfung HS24', author: 'Prof. M. Muster', subject: 'ETG1', keywords: ['Study Hub', 'ETG1'],
    });

    const pages = await textOf(out);
    expect(pages).toHaveLength(4);
    for (const items of pages) {
      expect(items.map((i) => i.str).join(' ')).toContain('Quelle: Prüfung HS24, Prof. M. Muster | ETG1 Grundlagen - Elektrotechnik');
    }
    const footer = (n: number) => pages[n]!.find((i) => i.str.startsWith('Quelle'))!;
    expect(footer(0)).toMatchObject({ x: 10, y: 10 });
    expect(footer(1)).toMatchObject({ x: 585, y: 10 });
    expect(footer(2)).toMatchObject({ x: 60, y: 70 });
    expect(footer(3)).toMatchObject({ x: 10, y: 10 });

    const meta = await PDFDocument.load(out, { updateMetadata: false });
    expect(meta.getTitle()).toBe('Prüfung HS24');
    expect(meta.getAuthor()).toBe('Prof. M. Muster');
    expect(meta.getCreator()).toBe('Study Hub');
  });
});

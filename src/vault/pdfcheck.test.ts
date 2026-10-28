import { createHash } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { VaultError } from './api';
import { MAX_BYTES, checkPdf, looksLikePdf } from './pdfcheck';

async function makePdf(pages = 2, useObjectStreams = true) {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pages; i++) pdf.addPage([595, 842]);
  return pdf.save({ useObjectStreams });
}

async function code(p: Promise<unknown>) {
  try { await p; } catch (e) { return e instanceof VaultError ? e.code : String(e); }
  return 'kein Fehler';
}

describe('checkPdf', () => {
  it('liefert Seitenzahl und Prüfsumme', async () => {
    const bytes = await makePdf(3);
    const info = await checkPdf(bytes);
    expect(info.pageCount).toBe(3);
    expect(info.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
  });

  it('lehnt Dateien ab, die kein PDF sind', async () => {
    expect(looksLikePdf(new TextEncoder().encode('Hallo'))).toBe(false);
    expect(await code(checkPdf(new TextEncoder().encode('Hallo, kein PDF')))).toBe('not_pdf');
    expect(await code(checkPdf(new TextEncoder().encode('%PDF-1.7 kaputt')))).toBe('not_pdf');
  });

  it('lehnt zu grosse Dateien ab', async () => {
    const big = new Uint8Array(MAX_BYTES + 1);
    big.set(new TextEncoder().encode('%PDF-1.7'));
    expect(await code(checkPdf(big))).toBe('too_large');
  });

  it('erkennt geschützte PDFs (pdf-lib kann sie nicht ändern)', async () => {
    const text = new TextDecoder('latin1').decode(await makePdf(1, false));
    const locked = text.replace('/Root', '/Encrypt << /Filter /Standard /V 1 /R 2 >>\n/Root');
    expect(locked).not.toBe(text);
    const bytes = Uint8Array.from(locked, (c) => c.charCodeAt(0));
    expect(await code(checkPdf(bytes))).toBe('encrypted');
  });
});

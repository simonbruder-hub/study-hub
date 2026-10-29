/** Prüft ein PDF vor dem Hochladen: Grösse, Format, Schutz, Seitenzahl, Prüfsumme */
import { EncryptedPDFError, PDFDocument } from 'pdf-lib';
import { VaultError } from './api';

export const MAX_BYTES = 20 * 1024 * 1024;

export interface PdfInfo { pageCount: number; sha256: string }

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Ein PDF beginnt mit %PDF- (manche Programme setzen ein paar Bytes davor) */
export function looksLikePdf(bytes: Uint8Array): boolean {
  return new TextDecoder('latin1').decode(bytes.subarray(0, 1024)).includes('%PDF-');
}

export async function checkPdf(bytes: Uint8Array): Promise<PdfInfo> {
  if (bytes.byteLength > MAX_BYTES) throw new VaultError('too_large');
  if (!looksLikePdf(bytes)) throw new VaultError('not_pdf');
  let pageCount: number;
  try {
    // Verschlüsselte PDFs kann pdf-lib nicht mit dem Wasserzeichen versehen
    pageCount = (await PDFDocument.load(bytes, { updateMetadata: false })).getPageCount();
  } catch (e) {
    // pdf-lib ist nach ES5 übersetzt, instanceof greift darum nicht immer
    if (e instanceof EncryptedPDFError || /is encrypted/i.test(String((e as Error)?.message))) {
      throw new VaultError('encrypted', String(e), { cause: e });
    }
    throw new VaultError('not_pdf', String(e), { cause: e });
  }
  if (pageCount < 1) throw new VaultError('not_pdf');
  return { pageCount, sha256: await sha256Hex(bytes) };
}

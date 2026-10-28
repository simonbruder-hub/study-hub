import { describe, expect, it } from 'vitest';
import { VaultError } from './api';
import { errorText, footerText, formatBytes, provenanceLabel, suggestTitle, termLabel } from './labels';
import { CODE_RE, byDate, emptyFields, lastSemester, missing, ratingText, semesterValue } from './logic';
import { dbError, storageError } from './supabaseApi';
import type { DocMeta } from './types';
import { fileName } from './ui';

const doc = (patch: Partial<DocMeta>): DocMeta => ({
  ...emptyFields('ETG1', new Date('2026-10-28')), id: 'x', title: 'Prüfung', author: 'Prof. M. Muster', page_count: 1,
  size_bytes: 1, status: 'approved', reviewed_at: null, created_at: '2026-10-28T10:00:00Z', ...patch,
});

describe('Texte', () => {
  it('Semester kurz', () => {
    expect(termLabel(2024, 'HS')).toBe('HS24');
    expect(termLabel(2005, 'FS')).toBe('FS05');
    expect(termLabel(2024, null)).toBe('2024');
  });

  it('Titelvorschlag', () => {
    expect(suggestTitle({ doc_type: 'probepruefung', year: 2025, term: 'FS' })).toBe('Probeprüfung FS25');
    expect(suggestTitle({ doc_type: 'loesung', year: 2025, term: 'FS' }, 'Prüfung HS24')).toBe('Lösung zu Prüfung HS24');
  });

  it('Fusszeile mit Quelle, Modul und Herkunft', () => {
    const f = doc({ doc_type: 'pruefung', year: 2024, term: 'HS', provenance: 'alumni', alumni_year: 2023 });
    const text = footerText(f, 'Grundlagen der Elektrotechnik 1');
    expect(text).toContain('Quelle: Prüfung HS24, Prof. M. Muster');
    expect(text).toContain('ETG1 Grundlagen der Elektrotechnik 1');
    expect(text).toContain('Alumni, Abschluss 2023');
    expect(footerText(doc({ doc_type: 'loesung', solution_kind: 'offiziell' }), 'X')).toContain('offizielle Lösung');
    expect(provenanceLabel('studierende', null)).toBe('Studierende');
  });

  it('Dateiname nur mit ASCII-Zeichen', () => {
    expect(fileName('ETG1', 'Prüfung HS24')).toBe('ETG1 Pruefung HS24.pdf');
    expect(fileName('MAT1', 'Lösung: Teil a/b «neu»')).toBe('MAT1 Loesung Teil a b neu.pdf');
  });

  it('Grössen und Fehlermeldungen', () => {
    expect(formatBytes(500)).toBe('1 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3 MB');
    expect(errorText(new VaultError('rate_limit'))).toContain('Grenze erreicht');
    expect(errorText(new Error('was auch immer'))).toContain('schiefgelaufen');
  });
});

describe('Hilfsfunktionen', () => {
  it('letztes abgeschlossenes Semester', () => {
    expect(lastSemester(new Date('2026-10-28'))).toEqual({ year: 2026, term: 'FS' });
    expect(lastSemester(new Date('2027-02-01'))).toEqual({ year: 2026, term: 'HS' });
  });

  it('meldet fehlende Angaben', () => {
    const f = emptyFields('');
    expect(missing(f)).toEqual(['Modul wählen', 'angeben, wer es verfasst hat', 'Titel angeben']);
    expect(missing({ ...f, module_id: 'ETG1', author: 'X', title: 'T', doc_type: 'loesung' }))
      .toEqual(['Prüfung zur Lösung wählen', 'angeben, von wem die Lösung stammt']);
    expect(missing({ ...f, module_id: 'ETG1', author: 'X', title: 'T', provenance: 'alumni', old_plan_module: ' ' }))
      .toEqual(['Abschlussjahr der Alumni angeben', 'Modul im alten Studienplan angeben']);
  });

  it('sortiert neuere zuerst, HS nach FS', () => {
    const list = [doc({ title: 'a', year: 2024, term: 'FS' }), doc({ title: 'b', year: 2024, term: 'HS' }),
      doc({ title: 'c', year: 2025, term: null }), doc({ title: 'd', year: 2023, term: 'HS' })];
    expect(list.sort(byDate).map((d) => d.title)).toEqual(['c', 'b', 'a', 'd']);
  });

  it('fasst Einschätzungen zusammen', () => {
    expect(ratingText(undefined)).toBe('noch keine Einschätzung');
    expect(ratingText({ document_id: 'x', counts: [2, 2, 1, 0, 0], mine: null })).toBe('leichter als die echte Prüfung (5 Stimmen)');
    expect(ratingText({ document_id: 'x', counts: [0, 0, 0, 0, 1], mine: 2 })).toBe('viel schwerer als die echte Prüfung (1 Stimme)');
  });

  it('Kürzel und Semester wie in der Datenbank', () => {
    expect(CODE_RE.test('ETG1')).toBe(true);
    expect(CODE_RE.test('E-T_G.1')).toBe(true);
    expect(CODE_RE.test('E T')).toBe(false);
    expect(CODE_RE.test('-ET')).toBe(false);
    expect(semesterValue('')).toBe(null);
    expect(semesterValue('3')).toBe(3);
    expect(semesterValue('20')).toBe(12);
  });
});

describe('Fehler von Supabase', () => {
  it('Schlüssel aus den Funktionen der Datenbank', () => {
    expect(dbError({ code: 'P0001', message: 'rate_limit' }).code).toBe('rate_limit');
    expect(dbError({ code: '42501', message: 'not_member' }).code).toBe('not_member');
  });

  it('Regeln der Datenbank', () => {
    expect(dbError({ code: '23505', message: 'duplicate key value violates unique constraint "documents_sha256_uidx"' }).code)
      .toBe('duplicate_file');
    expect(dbError({ code: '23505', message: 'duplicate key value violates unique constraint "modules_id_uidx"' }).code)
      .toBe('duplicate_id');
    expect(dbError({ code: '23503', message: 'violates foreign key constraint' }).code).toBe('in_use');
    expect(dbError({ code: '42501', message: 'new row violates row-level security policy' }).code).toBe('not_allowed');
    expect(dbError({ code: '', message: 'TypeError: Failed to fetch' }).code).toBe('network');
  });

  it('Speicher', () => {
    expect(storageError({ statusCode: '413', message: 'Payload too large' }).code).toBe('too_large');
    expect(storageError({ statusCode: '400', message: 'mime type application/zip is not supported' }).code).toBe('not_pdf');
    expect(storageError({ statusCode: '403', message: 'new row violates row-level security policy' }).code).toBe('not_allowed');
    expect(storageError({ statusCode: '404', message: 'Object not found' }).code).toBe('not_found');
  });
});

/** Texte der Ablage: Bezeichnungen, Quelle, Titelvorschlag, Fehlermeldungen */
import { VaultError } from './api';
import type { DocFields, DocStatus, DocType, Provenance, ReportReason, SolutionKind, Term } from './types';

export const TYPE_LABEL: Record<DocType, string> = {
  pruefung: 'Prüfung', probepruefung: 'Probeprüfung', formelsammlung: 'Formelsammlung', loesung: 'Lösung',
};
export const TYPE_PLURAL: Record<DocType, string> = {
  pruefung: 'Prüfungen', probepruefung: 'Probeprüfungen', formelsammlung: 'Formelsammlungen', loesung: 'Lösungen',
};
export const STATUS_LABEL: Record<DocStatus, string> = {
  pending: 'wartet auf Prüfung', approved: 'freigegeben', rejected: 'abgelehnt', removed: 'entfernt',
};
export const SOLUTION_KIND_LABEL: Record<SolutionKind, string> = {
  offiziell: 'offizielle Lösung', studierende: 'Lösung von Studierenden',
};
export const REASON_LABEL: Record<ReportReason, string> = {
  urheberrecht: 'Urheberrecht: Die Dozentin oder der Dozent will es nicht in der Ablage',
  unterrichtsunterlage: 'Unterrichtsunterlage (Skript, Folien, Übungsblatt): gehört nicht hierher',
  'falsche-angaben': 'Falsche Angaben (Modul, Semester, Art)',
  qualitaet: 'Schlecht lesbar oder unvollständig',
  anderes: 'Anderes',
};
/** Einschätzung einer Probeprüfung, Index 0 entspricht -2 */
export const RATING_LABEL = ['viel leichter', 'leichter', 'gleich schwer', 'schwerer', 'viel schwerer'];

/** HS24, FS25 oder nur das Jahr */
export function termLabel(year: number, term: Term | null): string {
  return term ? `${term}${String(year % 100).padStart(2, '0')}` : String(year);
}

export function provenanceLabel(p: Provenance, alumniYear: number | null): string {
  return p === 'alumni' ? `Alumni${alumniYear ? `, Abschluss ${alumniYear}` : ''}` : 'Studierende';
}

/** Titelvorschlag beim Hochladen: «Prüfung HS24», «Lösung zu Prüfung HS24» */
export function suggestTitle(f: Pick<DocFields, 'doc_type' | 'year' | 'term'>, examTitle?: string): string {
  if (f.doc_type === 'loesung') return examTitle ? `Lösung zu ${examTitle}` : 'Lösung';
  return `${TYPE_LABEL[f.doc_type]} ${termLabel(f.year, f.term)}`;
}

/** Fusszeile auf jeder Seite der freigegebenen Fassung */
export function footerText(f: DocFields, moduleName: string): string {
  const what = f.doc_type === 'loesung' && f.solution_kind ? SOLUTION_KIND_LABEL[f.solution_kind] : TYPE_LABEL[f.doc_type];
  const by = f.provenance === 'alumni' ? `bereitgestellt von ${provenanceLabel(f.provenance, f.alumni_year)}` : 'bereitgestellt von Studierenden';
  return `Quelle: ${what} ${termLabel(f.year, f.term)}, ${f.author} | ${f.module_id} ${moduleName} | ${by} `
    + 'über Study Hub, nur zum Lernen, nicht weitergeben';
}

export function formatBytes(n: number): string {
  const fmt = (v: number) => new Intl.NumberFormat('de-CH', { maximumFractionDigits: 1 }).format(v);
  if (n < 1024 * 1024) return `${fmt(Math.max(1, Math.round(n / 1024)))} KB`;
  return `${fmt(n / 1024 / 1024)} MB`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

const ERRORS: Record<string, string> = {
  not_authenticated: 'Bitte zuerst anmelden.',
  email_not_allowed: 'Diese Mail-Adresse ist nicht zugelassen. Die Ablage ist nur für Studierende mit der Mail-Adresse der Hochschule.',
  not_member: 'Kein Zugang: Bitte die Nutzungsregeln annehmen und mit der Adresse der Hochschule anmelden.',
  not_allowed: 'Dafür fehlen die Rechte.',
  not_found: 'Dieses Dokument gibt es nicht oder nicht mehr.',
  invalid_state: 'Das geht in diesem Zustand nicht. Bitte die Seite neu laden.',
  missing_file: 'Die Fassung mit Wasserzeichen fehlt. Bitte nochmals freigeben.',
  note_required: 'Bitte eine Begründung angeben.',
  rate_limit: 'Grenze erreicht: In kurzer Zeit wurden sehr viele Dokumente geöffnet. Bereits geöffnete gehen weiter, neue wieder in einer Stunde.',
  solution_of_invalid: 'Eine Lösung gehört zu einer freigegebenen Prüfung oder Probeprüfung.',
  has_solutions: 'Zu diesem Dokument gibt es Lösungen, es bleibt eine Prüfung.',
  duplicate_file: 'Diese Datei ist schon in der Ablage (oder wurde auf Wunsch entfernt).',
  duplicate_id: 'Dieses Kürzel gibt es schon.',
  in_use: 'Wird noch verwendet (zum Beispiel ein Modul mit Dokumenten) und lässt sich darum nicht löschen.',
  invalid_value: 'Eine Angabe ist ungültig. Bitte prüfen.',
  too_large: 'Die Datei ist zu gross, höchstens 20 MB.',
  not_pdf: 'Das ist kein lesbares PDF.',
  encrypted: 'Das PDF ist geschützt (Passwort oder Sperre). Bitte ungeschützt speichern, zum Beispiel über Drucken und «Als PDF speichern».',
  too_many_requests: 'Zu viele Versuche. Bitte einen Moment warten.',
  code_invalid: 'Der Code stimmt nicht oder ist abgelaufen. Bitte einen neuen Code anfordern.',
  network: 'Keine Verbindung zum Server. Bitte später nochmals versuchen.',
  unknown: 'Etwas ist schiefgelaufen. Bitte nochmals versuchen.',
};

export function errorText(e: unknown): string {
  const code = e instanceof VaultError ? e.code : 'unknown';
  return ERRORS[code] ?? ERRORS.unknown!;
}

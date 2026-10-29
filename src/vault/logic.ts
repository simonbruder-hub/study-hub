/** Reine Hilfsfunktionen der Ablage (ohne Browser, darum gut testbar) */
import { RATING_LABEL } from './labels';
import type { DocFields, DocMeta, RatingSummary, Term } from './types';

/** Sortierung: neuere zuerst; im selben Jahr ist HS später als FS */
export function byDate(a: DocMeta, b: DocMeta): number {
  const key = (d: DocMeta) => d.year * 3 + (d.term === 'HS' ? 2 : d.term === 'FS' ? 1 : 0);
  return key(b) - key(a) || a.title.localeCompare(b.title, 'de');
}

/** Kurzfassung der Einschätzungen: Mittelwert von -2 (viel leichter) bis +2 (viel schwerer) */
export function ratingText(r: RatingSummary | undefined): string {
  const n = r?.counts.reduce((a, b) => a + b, 0) ?? 0;
  if (!r || !n) return 'noch keine Einschätzung';
  const mean = r.counts.reduce((sum, c, i) => sum + c * (i - 2), 0) / n;
  const label = mean <= -1.25 ? RATING_LABEL[0] : mean <= -0.4 ? RATING_LABEL[1] : mean < 0.4 ? RATING_LABEL[2]
    : mean < 1.25 ? RATING_LABEL[3] : RATING_LABEL[4];
  return `${label} als die echte Prüfung (${n} ${n === 1 ? 'Stimme' : 'Stimmen'})`;
}

/** Letztes abgeschlossenes Semester: im Herbst das Frühlingssemester, im Frühling das Herbstsemester davor */
export function lastSemester(now = new Date()): { year: number; term: Term } {
  return now.getMonth() >= 6 ? { year: now.getFullYear(), term: 'FS' } : { year: now.getFullYear() - 1, term: 'HS' };
}

export function emptyFields(moduleId = '', now = new Date()): DocFields {
  const { year, term } = lastSemester(now);
  return {
    title: '', doc_type: 'pruefung', module_id: moduleId, solution_of: null, solution_kind: null, includes_solution: false,
    year, term, author: '', provenance: 'studierende', alumni_year: null, old_plan_module: null, description: '',
  };
}

/** Was noch fehlt, als Liste kurzer Hinweise */
export function missing(f: DocFields): string[] {
  const out: string[] = [];
  if (!f.module_id) out.push('Modul wählen');
  if (f.doc_type === 'loesung' && !f.solution_of) out.push('Prüfung zur Lösung wählen');
  if (f.doc_type === 'loesung' && !f.solution_kind) out.push('angeben, von wem die Lösung stammt');
  if (!Number.isInteger(f.year) || f.year < 1990 || f.year > 2100) out.push('Jahr prüfen');
  if (!f.author.trim()) out.push('angeben, wer es verfasst hat');
  if (f.provenance === 'alumni' && !f.alumni_year) out.push('Abschlussjahr der Alumni angeben');
  if (f.old_plan_module !== null && !f.old_plan_module.trim()) out.push('Modul im alten Studienplan angeben');
  if (!f.title.trim()) out.push('Titel angeben');
  return out;
}

/** Nur die Felder, die man beim Hochladen angibt */
export function fieldsOf(d: DocMeta): DocFields {
  const {
    title, doc_type, module_id, solution_of, solution_kind, includes_solution, year, term, author, provenance,
    alumni_year, old_plan_module, description,
  } = d;
  return {
    title, doc_type, module_id, solution_of, solution_kind, includes_solution, year, term, author, provenance,
    alumni_year, old_plan_module, description,
  };
}

/** Kürzel von Studiengängen und Modulen, wie in supabase/schema.sql */
export const CODE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/;

/** Semester aus einem Eingabefeld: leer heisst frei wählbar, sonst 1 bis 12 */
export function semesterValue(v: string): number | null {
  return v.trim() ? Math.min(12, Math.max(1, Math.round(Number(v)) || 1)) : null;
}

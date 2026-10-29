/** Angaben zu einem Dokument; beim Hochladen und in der Moderation (Korrektur) */
import { useEffect, useState, type Dispatch, type StateUpdater } from 'preact/hooks';
import { SOLUTION_KIND_LABEL, TYPE_LABEL, suggestTitle } from './labels';
import { activePrograms, api } from './state';
import { DOC_TYPES, EXAM_TYPES, type DocFields, type Plan, type SolutionKind, type Term } from './types';
import { useLoad } from './ui';
import { byDate } from './logic';

const AUTHOR_HINT: Record<string, string> = {
  pruefung: 'Dozentin oder Dozent der Prüfung, sonst «unbekannt».',
  probepruefung: 'Dozentin oder Dozent, die die Probeprüfung abgegeben haben.',
  formelsammlung: 'Name oder Kürzel; erscheint als Quelle.',
  loesung: 'Offiziell: Dozentin oder Dozent; sonst Name oder Kürzel.',
};

interface Props {
  value: DocFields;
  /** wie ein setState: Änderungen gehen immer vom aktuellen Stand aus */
  onChange: Dispatch<StateUpdater<DocFields>>;
  plan: Plan;
  programId?: string;
  /** Titel automatisch vorschlagen, bis jemand ihn selbst ändert */
  autoTitle?: boolean;
}

export function DocForm({ value: f, onChange, plan: p, programId, autoTitle }: Props) {
  const programs = activePrograms(p);
  const firstProgram = programId && programs.some((x) => x.id === programId) ? programId
    : p.links.find((l) => l.module_id === f.module_id)?.program_id ?? programs[0]?.id ?? '';
  const [program, setProgram] = useState(firstProgram);
  const [titleTouched, setTitleTouched] = useState(!autoTitle);
  // Eindeutige Namen der Auswahlgruppen, falls mehrere Formulare offen sind
  const [uid] = useState(() => `f${Math.random().toString(36).slice(2, 8)}`);
  const exams = useLoad(async () => (f.doc_type === 'loesung' && f.module_id
    ? (await api.value!.listDocuments(f.module_id)).filter((d) => EXAM_TYPES.includes(d.doc_type)).sort(byDate)
    : []), [f.doc_type, f.module_id]);
  const examTitle = exams.data?.find((d) => d.id === f.solution_of)?.title;

  function set(patch: Partial<DocFields>) {
    onChange((prev) => {
      const next = { ...prev, ...patch };
      if (next.doc_type !== 'loesung') { next.solution_of = null; next.solution_kind = null; }
      if (!EXAM_TYPES.includes(next.doc_type)) next.includes_solution = false;
      if (next.provenance !== 'alumni') next.alumni_year = null;
      return next;
    });
  }
  // Titelvorschlag nachführen; vom aktuellen Stand aus, sonst gingen schnelle Eingaben verloren
  useEffect(() => {
    if (titleTouched) return;
    onChange((prev) => {
      const t = suggestTitle(prev, examTitle);
      return t === prev.title ? prev : { ...prev, title: t };
    });
  }, [titleTouched, f.doc_type, f.year, f.term, examTitle]);

  const links = p.links.filter((l) => l.program_id === program)
    .map((l) => ({ l, m: p.modules.find((m) => m.id === l.module_id) }))
    .filter((x) => x.m?.active || x.m?.id === f.module_id)
    .sort((a, b) => (a.l.semester ?? 99) - (b.l.semester ?? 99) || a.m!.id.localeCompare(b.m!.id));
  const semesters = [...new Set(links.map((x) => x.l.semester))];

  return (
    <div class="form">
      <div class="field-row">
        <label class="field">
          <span>Studiengang</span>
          <select value={program} onChange={(e) => setProgram(e.currentTarget.value)}>
            {programs.map((x) => <option key={x.id} value={x.id}>{x.id} {x.name}</option>)}
          </select>
        </label>
        <label class="field">
          <span>Modul</span>
          <select value={f.module_id} required onChange={(e) => set({ module_id: e.currentTarget.value, solution_of: null })}>
            <option value="">Bitte wählen</option>
            {semesters.map((sem) => (
              <optgroup key={String(sem)} label={sem ? `${sem}. Semester` : 'Ohne festes Semester'}>
                {links.filter((x) => x.l.semester === sem).map(({ m }) => <option key={m!.id} value={m!.id}>{m!.id} {m!.name}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      <fieldset class="field">
        <legend>Art</legend>
        <div class="choices">
          {DOC_TYPES.map((t) => (
            <label class="choice" key={t}>
              <input type="radio" name={`${uid}-doc_type`} checked={f.doc_type === t} onChange={() => set({ doc_type: t })} />
              <span>{TYPE_LABEL[t]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {f.doc_type === 'loesung' && (
        <div class="field-row">
          <label class="field">
            <span>Lösung zu</span>
            <select value={f.solution_of ?? ''} onChange={(e) => set({ solution_of: e.currentTarget.value || null })}>
              <option value="">{exams.loading ? 'Lädt …' : exams.data?.length ? 'Prüfung wählen' : 'Noch keine Prüfung in diesem Modul'}</option>
              {(exams.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.title} ({TYPE_LABEL[d.doc_type]})</option>)}
            </select>
          </label>
          <fieldset class="field">
            <legend>Von wem?</legend>
            <div class="choices">
              {(['offiziell', 'studierende'] as SolutionKind[]).map((k) => (
                <label class="choice" key={k}>
                  <input type="radio" name={`${uid}-solution_kind`} checked={f.solution_kind === k} onChange={() => set({ solution_kind: k })} />
                  <span>{SOLUTION_KIND_LABEL[k]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}
      {f.doc_type === 'loesung' && !exams.loading && !exams.data?.length && f.module_id && (
        <p class="hint">Eine Lösung hängt immer an einer Prüfung. Lade zuerst die Prüfung hoch, oder lade sie mit der Lösung in einem
          PDF als «Prüfung» hoch (Häkchen «Lösung im selben PDF»).</p>
      )}

      <div class="field-row">
        <label class="field">
          <span>Semester</span>
          <select value={f.term ?? ''} onChange={(e) => set({ term: (e.currentTarget.value || null) as Term | null })}>
            <option value="HS">Herbstsemester (HS)</option>
            <option value="FS">Frühlingssemester (FS)</option>
            <option value="">unbekannt, nur das Jahr</option>
          </select>
        </label>
        <label class="field">
          <span>Jahr</span>
          <input type="number" min={1990} max={2100} value={f.year} onInput={(e) => set({ year: Number(e.currentTarget.value) })} />
        </label>
      </div>

      <label class="field">
        <span>Verfasst von</span>
        <input type="text" maxLength={160} value={f.author} placeholder="z. B. Prof. M. Muster"
          onInput={(e) => set({ author: e.currentTarget.value })} />
        <span class="hint">{AUTHOR_HINT[f.doc_type]}</span>
      </label>

      {EXAM_TYPES.includes(f.doc_type) && (
        <label class="check">
          <input type="checkbox" checked={f.includes_solution} onChange={(e) => set({ includes_solution: e.currentTarget.checked })} />
          <span>Lösung im selben PDF</span>
        </label>
      )}

      <fieldset class="field">
        <legend>Bereitgestellt von</legend>
        <div class="choices">
          <label class="choice">
            <input type="radio" name={`${uid}-provenance`} checked={f.provenance === 'studierende'} onChange={() => set({ provenance: 'studierende' })} />
            <span>Studierenden</span>
          </label>
          <label class="choice">
            <input type="radio" name={`${uid}-provenance`} checked={f.provenance === 'alumni'} onChange={() => set({ provenance: 'alumni' })} />
            <span>Alumni</span>
          </label>
        </div>
      </fieldset>
      {f.provenance === 'alumni' && (
        <label class="field">
          <span>Abschlussjahr der Alumni</span>
          <input type="number" min={1990} max={2100} value={f.alumni_year ?? ''}
            onInput={(e) => set({ alumni_year: e.currentTarget.value ? Number(e.currentTarget.value) : null })} />
        </label>
      )}

      <label class="check">
        <input type="checkbox" checked={f.old_plan_module !== null}
          onChange={(e) => set({ old_plan_module: e.currentTarget.checked ? '' : null })} />
        <span>Aus dem alten Studienplan</span>
      </label>
      {f.old_plan_module !== null && (
        <label class="field">
          <span>Modul im alten Studienplan</span>
          <input type="text" maxLength={160} value={f.old_plan_module} placeholder="Kürzel und Name, z. B. ET1 Elektrotechnik 1"
            onInput={(e) => set({ old_plan_module: e.currentTarget.value })} />
        </label>
      )}

      <label class="field">
        <span>Bemerkung (freiwillig)</span>
        <textarea maxLength={1000} value={f.description} placeholder="z. B. nur Teil A, Aufgabe 3 fehlt"
          onInput={(e) => set({ description: e.currentTarget.value })} />
      </label>

      <label class="field">
        <span>Titel</span>
        <input type="text" maxLength={160} value={f.title}
          onInput={(e) => { const title = e.currentTarget.value; setTitleTouched(true); onChange((prev) => ({ ...prev, title })); }} />
      </label>
    </div>
  );
}

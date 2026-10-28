/** Studienplan pflegen: Studiengänge, Module mit Semester, zugelassene Mail-Domains (Admin) */
import { useState } from 'preact/hooks';
import { href, route } from '../router';
import { CODE_RE, semesterValue } from './logic';
import { api, me, plan, refreshPlan } from './state';
import type { Module, Plan, Program } from './types';
import { ErrorNote, Loading, useAction, useLoad } from './ui';

const CODE_HINT = 'Kürzel: Buchstaben, Ziffern, Punkt, Strich, ohne Leerzeichen';

export function PlanEditor() {
  const p = plan.value;
  if (!p) return <Loading />;
  const programId = route.value.query.get('sg') ?? p.programs[0]?.id;
  return (
    <section class="stack">
      <h1>Studienplan</h1>
      <p class="muted">Studiengänge, Module und Semester. Ein Modul kann zu mehreren Studiengängen gehören, jeweils mit eigenem Semester.
        Leeres Semester heisst frei wählbar.</p>
      <Programs plan={p} current={programId} />
      {programId && <ProgramModules key={programId} plan={p} programId={programId} />}
      {me.value?.admin && <Logins />}
    </section>
  );
}

function Programs({ plan: p, current }: { plan: Plan; current?: string }) {
  const admin = me.value?.admin ?? false;
  return (
    <section class="card stack">
      <h2>Studiengänge</h2>
      <div class="table-wrap">
        <table class="table table-stack">
          <thead><tr><th>Kürzel</th><th>Name</th><th>Reihenfolge</th><th>aktiv</th><th /></tr></thead>
          <tbody>
            {p.programs.map((x) => <ProgramRow key={x.id} program={x} current={x.id === current} admin={admin} />)}
            {admin && <ProgramRow key={`neu-${p.programs.length}`} admin />}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProgramRow({ program, current, admin }: { program?: Program; current?: boolean; admin: boolean }) {
  const [row, setRow] = useState<Program>(program ?? { id: '', name: '', sort_order: 0, active: true });
  const act = useAction();
  const a = api.value!;
  const valid = CODE_RE.test(row.id) && row.name.trim().length > 0;
  const dirty = !program || JSON.stringify(row) !== JSON.stringify(program);
  const save = () => act.run(async () => {
    const clean = { ...row, name: row.name.trim() };
    if (program) await a.updateProgram(program.id, clean); else await a.createProgram(clean);
    await refreshPlan();
  });
  return (
    <tr>
      <td data-label="Kürzel">
        {program && !dirty
          ? <a href={href('/ablage/plan', { sg: program.id })} aria-current={current ? 'true' : undefined}><strong>{program.id}</strong></a>
          : <input type="text" aria-label="Kürzel des Studiengangs" title={CODE_HINT} value={row.id} placeholder="z. B. EIT"
            onInput={(e) => setRow({ ...row, id: e.currentTarget.value.trim() })} />}
      </td>
      <td data-label="Name"><input type="text" aria-label="Name des Studiengangs" value={row.name} placeholder={program ? '' : 'Neuer Studiengang'}
        onInput={(e) => setRow({ ...row, name: e.currentTarget.value })} /></td>
      <td data-label="Reihenfolge"><input type="number" aria-label="Reihenfolge" style={{ width: '80px' }} value={row.sort_order}
        onInput={(e) => setRow({ ...row, sort_order: Number(e.currentTarget.value) || 0 })} /></td>
      <td data-label="aktiv"><input type="checkbox" aria-label="aktiv" checked={row.active} onChange={(e) => setRow({ ...row, active: e.currentTarget.checked })} /></td>
      <td>
        <div class="row">
          {dirty && <button class="btn btn-small btn-primary" disabled={!valid || act.busy} onClick={() => void save()}>
            {program ? 'Speichern' : 'Anlegen'}</button>}
          {program && admin && !dirty && (
            <button class="btn btn-small btn-danger" disabled={act.busy} onClick={() => {
              if (confirm(`Studiengang ${program.id} löschen? Die Module und Dokumente bleiben.`)) {
                void act.run(async () => { await a.deleteProgram(program.id); await refreshPlan(); });
              }
            }}>Löschen</button>
          )}
        </div>
        <ErrorNote error={act.error} />
      </td>
    </tr>
  );
}

function ProgramModules({ plan: p, programId }: { plan: Plan; programId: string }) {
  const program = p.programs.find((x) => x.id === programId);
  const rows = p.links.filter((l) => l.program_id === programId)
    .map((l) => ({ link: l, module: p.modules.find((m) => m.id === l.module_id)! }))
    .filter((x) => x.module)
    .sort((a, b) => (a.link.semester ?? 99) - (b.link.semester ?? 99) || a.module.id.localeCompare(b.module.id));
  return (
    <section class="card stack">
      <h2>Module in {program?.name ?? programId}</h2>
      <div class="table-wrap">
        <table class="table table-stack">
          <thead><tr><th>Semester</th><th>Kürzel</th><th>Name</th><th>aktiv</th><th /></tr></thead>
          <tbody>
            {rows.map(({ link, module }) => (
              <ModuleRow key={`${module.id}-${link.semester}`} programId={programId} module={module} semester={link.semester} />
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p class="empty">Noch keine Module.</p>}
      <AddModule plan={p} programId={programId} />
    </section>
  );
}

function ModuleRow({ programId, module, semester }: { programId: string; module: Module; semester: number | null }) {
  const [row, setRow] = useState<Module>(module);
  const [sem, setSem] = useState(semester === null ? '' : String(semester));
  const act = useAction();
  const a = api.value!;
  const dirty = JSON.stringify(row) !== JSON.stringify(module) || semesterValue(sem) !== semester;
  const valid = CODE_RE.test(row.id) && row.name.trim().length > 0;
  return (
    <tr>
      <td data-label="Semester"><input type="number" min={1} max={12} aria-label={`Semester von ${module.id}`} style={{ width: '70px' }} value={sem}
        onInput={(e) => setSem(e.currentTarget.value)} /></td>
      <td data-label="Kürzel"><input type="text" aria-label="Kürzel des Moduls" title={CODE_HINT} style={{ width: '110px' }} value={row.id}
        onInput={(e) => setRow({ ...row, id: e.currentTarget.value.trim() })} /></td>
      <td data-label="Name"><input type="text" aria-label={`Name von ${module.id}`} value={row.name} onInput={(e) => setRow({ ...row, name: e.currentTarget.value })} /></td>
      <td data-label="aktiv"><input type="checkbox" aria-label="aktiv" checked={row.active} onChange={(e) => setRow({ ...row, active: e.currentTarget.checked })} /></td>
      <td>
        <div class="row">
          {dirty && <button class="btn btn-small btn-primary" disabled={!valid || act.busy} onClick={() => void act.run(async () => {
            if (JSON.stringify(row) !== JSON.stringify(module)) await a.updateModule(module.id, { ...row, name: row.name.trim() });
            await a.linkModule({ program_id: programId, module_id: row.id, semester: semesterValue(sem) });
            await refreshPlan();
          })}>Speichern</button>}
          {!dirty && <button class="btn btn-small" disabled={act.busy} title="Nur aus diesem Studiengang, das Modul bleibt"
            onClick={() => void act.run(async () => { await a.unlinkModule(programId, module.id); await refreshPlan(); })}>Entfernen</button>}
        </div>
        <ErrorNote error={act.error} />
      </td>
    </tr>
  );
}

function AddModule({ plan: p, programId }: { plan: Plan; programId: string }) {
  const [pick, setPick] = useState('');
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [sem, setSem] = useState('');
  const act = useAction();
  const a = api.value!;
  const linked = new Set(p.links.filter((l) => l.program_id === programId).map((l) => l.module_id));
  const others = p.modules.filter((m) => !linked.has(m.id));
  const isNew = pick === '';
  const valid = isNew ? CODE_RE.test(id) && name.trim().length > 0 : true;
  return (
    <form class="panel" onSubmit={(e) => {
      e.preventDefault();
      void act.run(async () => {
        const moduleId = isNew ? id : pick;
        if (isNew) await a.createModule({ id, name: name.trim(), active: true });
        await a.linkModule({ program_id: programId, module_id: moduleId, semester: semesterValue(sem) });
        await refreshPlan();
        setPick(''); setId(''); setName(''); setSem('');
      });
    }}>
      <h3>Modul hinzufügen</h3>
      <div class="field-row">
        <label class="field">
          <span>Modul</span>
          <select value={pick} onChange={(e) => setPick(e.currentTarget.value)}>
            <option value="">Neues Modul anlegen</option>
            {others.map((m) => <option key={m.id} value={m.id}>{m.id} {m.name} (schon in einem anderen Studiengang)</option>)}
          </select>
        </label>
        <label class="field">
          <span>Semester</span>
          <input type="number" min={1} max={12} value={sem} placeholder="frei wählbar" onInput={(e) => setSem(e.currentTarget.value)} />
        </label>
      </div>
      {isNew && (
        <div class="field-row">
          <label class="field">
            <span>Kürzel</span>
            <input type="text" title={CODE_HINT} value={id} placeholder="z. B. ETG1" onInput={(e) => setId(e.currentTarget.value.trim())} />
          </label>
          <label class="field">
            <span>Name</span>
            <input type="text" value={name} placeholder="z. B. Grundlagen der Elektrotechnik 1" onInput={(e) => setName(e.currentTarget.value)} />
          </label>
        </div>
      )}
      {isNew && id && !CODE_RE.test(id) && <p class="hint">{CODE_HINT}.</p>}
      <div class="row"><button class="btn btn-primary" disabled={!valid || act.busy}>Hinzufügen</button></div>
      <ErrorNote error={act.error} />
    </form>
  );
}

function Logins() {
  const a = api.value!;
  const list = useLoad(() => a.allowedLogins(), []);
  const [entry, setEntry] = useState('');
  const [note, setNote] = useState('');
  const act = useAction();
  return (
    <section class="card stack">
      <h2>Zugelassene Mail-Adressen</h2>
      <p class="muted small">Eine Domain (z. B. students.hochschule.ch) lässt alle Adressen dieser Domain zu, Unterdomains nicht. Einzelne
        Adressen sind für Ausnahmen, etwa die Moderation, und erscheinen nicht auf der Anmeldeseite.</p>
      <ErrorNote error={list.error} />
      <ul class="doc-list">
        {(list.data ?? []).map((l) => (
          <li class="doc-row" key={l.entry}>
            <div class="spread">
              <span><strong>{l.entry}</strong>{l.note ? ` · ${l.note}` : ''}</span>
              <button class="btn btn-small btn-danger" disabled={act.busy}
                onClick={() => void act.run(async () => { await a.removeAllowedLogin(l.entry); list.reload(); })}>Entfernen</button>
            </div>
          </li>
        ))}
      </ul>
      <form class="field-row" onSubmit={(e) => {
        e.preventDefault();
        void act.run(async () => { await a.addAllowedLogin(entry, note.trim()); setEntry(''); setNote(''); list.reload(); });
      }}>
        <label class="field"><span>Domain oder Adresse</span>
          <input type="text" value={entry} placeholder="students.hochschule.ch" onInput={(e) => setEntry(e.currentTarget.value.trim().toLowerCase())} /></label>
        <label class="field"><span>Notiz</span>
          <input type="text" value={note} placeholder="z. B. Studierende" onInput={(e) => setNote(e.currentTarget.value)} /></label>
        <div class="field" style={{ alignSelf: 'end', flex: '0 0 auto' }}>
          <button class="btn btn-primary" disabled={!entry.includes('.') || act.busy}>Zulassen</button>
        </div>
      </form>
      <ErrorNote error={act.error} />
    </section>
  );
}

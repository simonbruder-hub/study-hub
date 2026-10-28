/** Stöbern: Studiengang, Semester, Modul, Dokumente */
import { useState } from 'preact/hooks';
import { href, route } from '../router';
import { SOLUTION_KIND_LABEL, TYPE_LABEL, TYPE_PLURAL, provenanceLabel, termLabel } from './labels';
import { byDate, ratingText } from './logic';
import { activePrograms, api, isModerator, plan, rememberProgram, rememberedProgram } from './state';
import type { DocMeta, DocType, Plan, RatingSummary } from './types';
import { ErrorNote, Loading, useLoad } from './ui';

const LIST_TYPES: DocType[] = ['pruefung', 'probepruefung', 'formelsammlung'];

export function Browse() {
  const p = plan.value;
  const q = route.value.query;
  const docs = useLoad(() => api.value!.listDocuments(), []);
  if (!p) return <Loading />;
  const programs = activePrograms(p);
  if (!programs.length) {
    return (
      <p class="note">Noch keine Studiengänge. {isModerator.value
        ? <a href={href('/ablage/plan')}>Im Studienplan anlegen</a> : 'Die Moderation legt sie bald an.'}</p>
    );
  }
  const saved = rememberedProgram();
  const programId = q.get('sg') ?? (programs.some((x) => x.id === saved) ? saved! : programs[0]!.id);
  const moduleId = q.get('m');
  if (moduleId) return <ModuleView plan={p} moduleId={moduleId} programId={programId} docs={docs.data} error={docs.error} />;
  return <Overview plan={p} programId={programId} docs={docs.data} error={docs.error} />;
}

function countText(docs: DocMeta[]): string {
  const parts: string[] = [];
  for (const t of [...LIST_TYPES, 'loesung'] as DocType[]) {
    const n = docs.filter((d) => d.doc_type === t).length;
    if (n) parts.push(`${n} ${n === 1 ? TYPE_LABEL[t] : TYPE_PLURAL[t]}`);
  }
  return parts.join(' · ') || 'noch leer';
}

function Overview({ plan: p, programId, docs, error }: { plan: Plan; programId: string; docs?: DocMeta[]; error: unknown }) {
  const [search, setSearch] = useState('');
  const programs = activePrograms(p);
  const program = p.programs.find((x) => x.id === programId);
  const s = search.trim().toLowerCase();
  const links = p.links
    .filter((l) => l.program_id === programId)
    .map((l) => ({ link: l, module: p.modules.find((m) => m.id === l.module_id) }))
    .filter((x) => x.module?.active && (!s || `${x.module.id} ${x.module.name}`.toLowerCase().includes(s)));
  const semesters = [...new Set(links.map((x) => x.link.semester))].sort((a, b) => (a ?? 99) - (b ?? 99));
  return (
    <>
      <div class="spread">
        <div class="programs" role="list" aria-label="Studiengang">
          {programs.map((x) => (
            <a role="listitem" key={x.id} class={`chip ${x.id === programId ? 'chip-accent' : ''}`} href={href('/ablage', { sg: x.id })}
              onClick={() => rememberProgram(x.id)} title={x.name}>{x.id}</a>
          ))}
        </div>
        <a class="btn btn-primary" href={href('/ablage/neu', { sg: programId })}>Hochladen</a>
      </div>
      <h1>{program?.name ?? programId}</h1>
      <input type="search" placeholder="Modul suchen (Kürzel oder Name)" aria-label="Modul suchen" value={search}
        onInput={(e) => setSearch(e.currentTarget.value)} />
      <ErrorNote error={error} />
      {!links.length && <p class="empty">{s ? 'Kein Modul gefunden.' : 'Diesem Studiengang sind noch keine Module zugeordnet.'}</p>}
      {semesters.map((sem) => (
        <section class="semester" key={String(sem)}>
          <h2>{sem ? `${sem}. Semester` : 'Ohne festes Semester'}</h2>
          <div class="module-grid">
            {links.filter((x) => x.link.semester === sem).map(({ module: m }) => (
              <a key={m!.id} class="module-card" href={href('/ablage', { sg: programId, m: m!.id })}>
                <span class="code">{m!.id}</span>
                <span class="name">{m!.name}</span>
                <span class="counts">{docs ? countText(docs.filter((d) => d.module_id === m!.id)) : '…'}</span>
              </a>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function ModuleView({ plan: p, moduleId, programId, docs, error }:
  { plan: Plan; moduleId: string; programId: string; docs?: DocMeta[]; error: unknown }) {
  const module = p.modules.find((m) => m.id === moduleId);
  const ratings = useLoad(() => api.value!.ratings(moduleId), [moduleId]);
  const mine = (docs ?? []).filter((d) => d.module_id === moduleId).sort(byDate);
  const where = p.links.filter((l) => l.module_id === moduleId)
    .map((l) => `${l.program_id}${l.semester ? `, ${l.semester}. Semester` : ''}`).join(' · ');
  return (
    <>
      <p class="crumbs"><a href={href('/ablage', { sg: programId })}>‹ Alle Module {programId}</a></p>
      <div class="spread">
        <div>
          <h1>{moduleId} {module?.name}</h1>
          {where && <p class="muted small">{where}</p>}
        </div>
        <a class="btn btn-primary" href={href('/ablage/neu', { sg: programId, m: moduleId })}>Hochladen in dieses Modul</a>
      </div>
      <ErrorNote error={error} />
      {!docs && !error && <Loading />}
      {docs && !mine.length && <p class="empty">Noch keine Dokumente. Lade das erste hoch.</p>}
      {LIST_TYPES.map((t) => {
        const list = mine.filter((d) => d.doc_type === t);
        if (!list.length) return null;
        return (
          <section class="doc-group" key={t}>
            <h2>{TYPE_PLURAL[t]}</h2>
            <ul class="doc-list">
              {list.map((d) => (
                <DocRow key={d.id} d={d} solutions={mine.filter((s) => s.solution_of === d.id)}
                  rating={t === 'probepruefung' ? ratingText(ratings.data?.find((r) => r.document_id === d.id)) : undefined} />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

function DocRow({ d, solutions, rating }: { d: DocMeta; solutions: DocMeta[]; rating?: string }) {
  const meta = [
    termLabel(d.year, d.term), d.author, `${d.page_count} ${d.page_count === 1 ? 'Seite' : 'Seiten'}`,
    d.includes_solution ? 'mit Lösung im PDF' : '',
    d.provenance === 'alumni' ? provenanceLabel(d.provenance, d.alumni_year) : '',
    d.old_plan_module ? `alter Studienplan, Modul ${d.old_plan_module}` : '',
  ].filter(Boolean).join(' · ');
  return (
    <li class="doc-row">
      <a href={href(`/ablage/d/${d.id}`)}>{d.title}</a>
      <span class="meta">{meta}</span>
      {rating && <span class="meta">Einschätzung: {rating}</span>}
      {solutions.length > 0 && (
        <span class="doc-sub">
          {solutions.map((s) => (
            <a key={s.id} href={href(`/ablage/d/${s.id}`)}>{s.solution_kind ? SOLUTION_KIND_LABEL[s.solution_kind] : 'Lösung'}</a>
          ))}
        </span>
      )}
    </li>
  );
}

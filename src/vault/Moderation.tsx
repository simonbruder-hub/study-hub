/** Moderation: offene Uploads prüfen und freigeben, Meldungen bearbeiten, Dokumente entfernen */
import { useState } from 'preact/hooks';
import { lazyComponent } from '../lazy';
import { href, route } from '../router';
import { DocForm } from './DocForm';
import { fieldsOf, missing } from './logic';
import { REASON_LABEL, TYPE_LABEL, footerText, formatBytes, formatDate, termLabel } from './labels';
import { api, moduleName, plan, refreshModCount } from './state';
import type { DocFields, DocStatus, ModDoc, OpenReport } from './types';
import { ErrorNote, Loading, StatusChip, TypeChip, useAction, useLoad } from './ui';

const PdfViewer = lazyComponent(() => import('./PdfViewer').then((m) => m.PdfViewer));

const TABS = [['offen', 'Offene Uploads'], ['meldungen', 'Meldungen'], ['freigegeben', 'Freigegeben']] as const;

export function Moderation() {
  const tab = route.value.query.get('tab') ?? 'offen';
  return (
    <section class="stack">
      <h1>Moderation</h1>
      <div class="programs" role="tablist" aria-label="Moderation">
        {TABS.map(([key, label]) => (
          <a key={key} role="tab" aria-selected={tab === key} class={`chip ${tab === key ? 'chip-accent' : ''}`}
            href={href('/ablage/moderation', { tab: key })}>{label}</a>
        ))}
      </div>
      {tab === 'meldungen' ? <Reports /> : <Queue status={tab === 'freigegeben' ? 'approved' : 'pending'} />}
    </section>
  );
}

/** Fassung mit Wasserzeichen aus dem Original erzeugen und freigeben */
async function publish(d: ModDoc, f: DocFields) {
  const a = api.value!;
  const name = moduleName(plan.value, f.module_id);
  const [{ watermark }, original] = await Promise.all([import('./watermark'), a.fetchOriginal(d)]);
  const bytes = await watermark(original, {
    footer: footerText(f, name),
    title: f.title,
    author: f.author,
    subject: `${f.module_id} ${name}`,
    keywords: ['Study Hub', TYPE_LABEL[f.doc_type], f.module_id, termLabel(f.year, f.term)],
  });
  await a.publish(d.id, bytes);
}

function Queue({ status }: { status: DocStatus }) {
  const list = useLoad(() => api.value!.moderationQueue(status), [status]);
  const [search, setSearch] = useState('');
  const s = search.trim().toLowerCase();
  const items = (list.data ?? []).filter((d) => !s || `${d.title} ${d.module_id} ${d.author}`.toLowerCase().includes(s));
  return (
    <>
      {status === 'approved' && (
        <input type="search" placeholder="Suchen (Titel, Modul, Verfasser)" aria-label="Freigegebene suchen" value={search}
          onInput={(e) => setSearch(e.currentTarget.value)} />
      )}
      {list.loading && <Loading />}
      <ErrorNote error={list.error} />
      {list.data && !items.length && <p class="empty">{status === 'pending' ? 'Keine offenen Uploads.' : 'Nichts gefunden.'}</p>}
      {items.map((d) => <ModItem key={d.id} d={d} onDone={() => { list.reload(); void refreshModCount(); }} />)}
    </>
  );
}

type Mode = 'none' | 'view' | 'edit' | 'reject' | 'remove';

function ModItem({ d, onDone }: { d: ModDoc; onDone: () => void }) {
  const a = api.value!;
  const p = plan.value!;
  const [mode, setMode] = useState<Mode>('none');
  const [fields, setFields] = useState<DocFields>(() => fieldsOf(d));
  const [note, setNote] = useState('');
  const act = useAction();
  const pending = d.status === 'pending';
  const toggle = (m: Mode) => { act.clear(); setMode(mode === m ? 'none' : m); };

  return (
    <article class="card mod-card" aria-label={d.title}>
      <div class="spread">
        <div class="row"><TypeChip type={d.doc_type} /><StatusChip status={d.status} />
          {d.open_reports > 0 && <span class="chip chip-bad">{d.open_reports} {d.open_reports === 1 ? 'Meldung' : 'Meldungen'}</span>}</div>
        <span class="small muted">hochgeladen am {formatDate(d.created_at)}</span>
      </div>
      <h2>{d.status === 'approved' ? <a href={href(`/ablage/d/${d.id}`)}>{d.title}</a> : d.title}</h2>
      <p class="small">
        {d.module_id} {moduleName(p, d.module_id)} · {termLabel(d.year, d.term)} · {d.author} · {d.page_count} Seiten,
        {' '}{formatBytes(d.size_bytes)}<br />
        Von: {d.uploader_email || 'unbekannt'}{d.provenance === 'alumni' ? ` · Alumni, Abschluss ${d.alumni_year}` : ''}
        {d.old_plan_module ? ` · alter Studienplan, Modul ${d.old_plan_module}` : ''}
      </p>
      {d.description && <p class="small">Bemerkung: {d.description}</p>}
      <div class="row">
        <button class="btn btn-small" aria-expanded={mode === 'view'} onClick={() => toggle('view')}>Original ansehen</button>
        <button class="btn btn-small" aria-expanded={mode === 'edit'} onClick={() => toggle('edit')}>Angaben korrigieren</button>
        {pending ? (
          <>
            <button class="btn btn-small btn-primary" disabled={act.busy}
              onClick={() => void act.run(async () => { await publish(d, fieldsOf(d)); onDone(); })}>
              {act.busy ? 'Wasserzeichen …' : 'Freigeben'}</button>
            <button class="btn btn-small btn-danger" aria-expanded={mode === 'reject'} onClick={() => toggle('reject')}>Ablehnen</button>
          </>
        ) : (
          <>
            <button class="btn btn-small" disabled={act.busy}
              onClick={() => void act.run(async () => { await publish(d, fieldsOf(d)); onDone(); })}>Wasserzeichen neu</button>
            <button class="btn btn-small btn-danger" aria-expanded={mode === 'remove'} onClick={() => toggle('remove')}>Entfernen</button>
          </>
        )}
      </div>
      <ErrorNote error={act.error} />
      {mode === 'view' && <Original d={d} />}
      {mode === 'edit' && (
        <form class="panel" onSubmit={(e) => {
          e.preventDefault();
          void act.run(async () => {
            await a.updateDocument(d.id, fields);
            // Freigegebene bekommen gleich die neue Fusszeile
            if (!pending) await publish(d, fields);
            setMode('none');
            onDone();
          });
        }}>
          <DocForm value={fields} onChange={setFields} plan={p} />
          {missing(fields).length > 0 && <p class="hint">Noch offen: {missing(fields).join(', ')}.</p>}
          <div class="row"><button class="btn btn-primary" disabled={act.busy || missing(fields).length > 0}>Speichern</button></div>
        </form>
      )}
      {(mode === 'reject' || mode === 'remove') && (
        <form class="panel" onSubmit={(e) => {
          e.preventDefault();
          void act.run(async () => {
            if (mode === 'reject') await a.reject(d.id, note.trim());
            else await a.remove(d.id, note.trim());
            onDone();
          });
        }}>
          <label class="field">
            <span>{mode === 'reject' ? 'Begründung (sieht die Person, die hochgeladen hat)' : 'Grund für das Entfernen'}</span>
            <textarea required maxLength={1000} value={note} onInput={(e) => setNote(e.currentTarget.value)}
              placeholder={mode === 'reject' ? 'z. B. Unterrichtsunterlage, gehört nicht in die Ablage' : 'z. B. auf Wunsch des Dozenten'} />
          </label>
          {mode === 'remove' && <p class="hint">Entfernt auch die Lösungen zu diesem Dokument. Dieselbe Datei kann danach nicht wieder hochgeladen werden.</p>}
          <div class="row">
            <button class="btn btn-danger" disabled={!note.trim() || act.busy}>{mode === 'reject' ? 'Ablehnen' : 'Entfernen'}</button>
          </div>
        </form>
      )}
    </article>
  );
}

function Original({ d }: { d: ModDoc }) {
  const bytes = useLoad(() => api.value!.fetchOriginal(d), [d.id]);
  if (bytes.loading) return <Loading what="Original lädt" />;
  if (bytes.error) return <ErrorNote error={bytes.error} />;
  return <PdfViewer data={bytes.data!} label={`Original: ${d.title}`} />;
}

function Reports() {
  const list = useLoad(() => api.value!.moderationReports(), []);
  return (
    <>
      {list.loading && <Loading />}
      <ErrorNote error={list.error} />
      {list.data && !list.data.length && <p class="empty">Keine offenen Meldungen.</p>}
      {(list.data ?? []).map((r) => <ReportItem key={r.id} r={r} onDone={() => { list.reload(); void refreshModCount(); }} />)}
    </>
  );
}

function ReportItem({ r, onDone }: { r: OpenReport; onDone: () => void }) {
  const a = api.value!;
  const [note, setNote] = useState('');
  const act = useAction();
  return (
    <article class="card mod-card" aria-label={`Meldung zu ${r.title}`}>
      <div class="spread">
        <div class="row"><TypeChip type={r.doc_type} /><StatusChip status={r.status} /></div>
        <span class="small muted">gemeldet am {formatDate(r.created_at)}</span>
      </div>
      <h2><a href={href(`/ablage/d/${r.document_id}`)}>{r.title}</a> <span class="small muted">{r.module_id}</span></h2>
      <p><strong>{REASON_LABEL[r.reason]}</strong>{r.message ? `: ${r.message}` : ''}</p>
      <label class="field">
        <span>Notiz (beim Entfernen Pflicht)</span>
        <input type="text" maxLength={1000} value={note} onInput={(e) => setNote(e.currentTarget.value)} />
      </label>
      <div class="row">
        <button class="btn btn-small" disabled={act.busy}
          onClick={() => void act.run(async () => { await a.resolveReport(r.id, note.trim()); onDone(); })}>Erledigt</button>
        {r.status === 'approved' && (
          <button class="btn btn-small btn-danger" disabled={act.busy || !note.trim()}
            onClick={() => void act.run(async () => { await a.remove(r.document_id, note.trim()); onDone(); })}>Dokument entfernen</button>
        )}
      </div>
      <ErrorNote error={act.error} />
    </article>
  );
}

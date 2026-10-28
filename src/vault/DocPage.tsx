/** Ein Dokument: Quelle, Lösungen, Einschätzung, Melden, Herunterladen und Ansicht */
import { useState } from 'preact/hooks';
import { lazyComponent } from '../lazy';
import { href } from '../router';
import { byDate, ratingText } from './logic';
import {
  RATING_LABEL, REASON_LABEL, SOLUTION_KIND_LABEL, TYPE_LABEL, formatBytes, formatDate, provenanceLabel, termLabel,
} from './labels';
import { api, isModerator, moduleName, plan } from './state';
import type { DocMeta, ReportReason } from './types';
import { ErrorNote, Loading, StatusChip, TypeChip, fileName, saveFile, useAction, useLoad } from './ui';

const PdfViewer = lazyComponent(() => import('./PdfViewer').then((m) => m.PdfViewer));

export function DocPage({ id }: { id: string }) {
  const doc = useLoad(() => api.value!.getDocument(id), [id]);
  if (doc.loading) return <Loading />;
  if (doc.error) return <ErrorNote error={doc.error} />;
  const d = doc.data;
  if (!d) return <p class="note">Dieses Dokument gibt es nicht oder nicht mehr. <a href={href('/ablage')}>Zur Ablage</a></p>;
  const approved = d.status === 'approved';
  return (
    <article class="page">
      <p class="crumbs"><a href={href('/ablage', { m: d.module_id })}>‹ {d.module_id} {moduleName(plan.value, d.module_id)}</a></p>
      <div>
        <div class="row"><TypeChip type={d.doc_type} />{!approved && <StatusChip status={d.status} />}</div>
        <h1>{d.title}</h1>
      </div>
      <Source d={d} />
      {d.description && <p>{d.description}</p>}
      <Related d={d} />
      {approved && d.doc_type === 'probepruefung' && <Rating d={d} />}
      {approved && <Actions d={d} />}
      {approved ? <Viewer d={d} /> : <p class="note">Das Dokument ist {d.status === 'pending' ? 'noch nicht freigegeben' : 'nicht mehr verfügbar'}.</p>}
    </article>
  );
}

function Source({ d }: { d: DocMeta }) {
  const kind = d.doc_type === 'loesung' && d.solution_kind ? SOLUTION_KIND_LABEL[d.solution_kind] : TYPE_LABEL[d.doc_type];
  return (
    <dl class="source">
      <dt>Art</dt><dd>{kind}{d.includes_solution ? ', mit Lösung im PDF' : ''}</dd>
      <dt>Semester</dt><dd>{termLabel(d.year, d.term)}</dd>
      <dt>Verfasst von</dt><dd>{d.author}</dd>
      <dt>Bereitgestellt von</dt><dd>{provenanceLabel(d.provenance, d.alumni_year)}</dd>
      <dt>Modul</dt><dd>{d.module_id} {moduleName(plan.value, d.module_id)}</dd>
      {d.old_plan_module && <><dt>Alter Studienplan</dt><dd>Modul {d.old_plan_module}</dd></>}
      <dt>Umfang</dt><dd>{d.page_count} {d.page_count === 1 ? 'Seite' : 'Seiten'}, {formatBytes(d.size_bytes)}</dd>
      {d.reviewed_at && <><dt>Freigegeben</dt><dd>{formatDate(d.reviewed_at)}</dd></>}
    </dl>
  );
}

/** Zu einer Prüfung ihre Lösungen, zu einer Lösung die Prüfung */
function Related({ d }: { d: DocMeta }) {
  const list = useLoad(() => api.value!.listDocuments(d.module_id), [d.id]);
  const docs = list.data ?? [];
  if (d.solution_of) {
    const exam = docs.find((x) => x.id === d.solution_of);
    return exam ? <p>Lösung zu: <a href={href(`/ablage/d/${exam.id}`)}>{exam.title}</a></p> : null;
  }
  const solutions = docs.filter((x) => x.solution_of === d.id).sort(byDate);
  if (!solutions.length) return null;
  return (
    <section class="doc-group">
      <h2>Lösungen</h2>
      <ul class="doc-list">
        {solutions.map((s) => (
          <li class="doc-row" key={s.id}>
            <a href={href(`/ablage/d/${s.id}`)}>{s.title}</a>
            <span class="meta">{s.solution_kind ? SOLUTION_KIND_LABEL[s.solution_kind] : 'Lösung'} · {s.author}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Rating({ d }: { d: DocMeta }) {
  const summary = useLoad(() => api.value!.ratings(d.module_id), [d.id]);
  const act = useAction();
  const r = summary.data?.find((x) => x.document_id === d.id);
  const total = r?.counts.reduce((a, b) => a + b, 0) ?? 0;
  const mine = r?.mine ?? null;
  return (
    <section class="card rating">
      <h2>Wie schwer war die echte Prüfung?</h2>
      <p class="muted small">Hast du die echte Prüfung geschrieben? Dann schätze ein, wie diese Probeprüfung im Vergleich war.</p>
      <div class="choices" role="radiogroup" aria-label="Diese Probeprüfung war">
        {RATING_LABEL.map((label, i) => (
          <label class="choice" key={label}>
            <input type="radio" name={`rating-${d.id}`} checked={mine === i - 2} disabled={act.busy}
              onClick={() => void act.run(async () => {
                await api.value!.rate(d.id, mine === i - 2 ? null : i - 2);
                summary.reload();
              })} />
            <span>{label}</span>
          </label>
        ))}
      </div>
      {total > 0 && (
        <div class="rating-bars" aria-label={`Einschätzung: ${ratingText(r)}`}>
          {RATING_LABEL.map((label, i) => (
            <div class="rating-bar" key={label}>
              <span>{label}</span>
              <span class="bar"><i style={{ width: `${(100 * (r!.counts[i] ?? 0)) / total}%` }} /></span>
              <span>{r!.counts[i]}</span>
            </div>
          ))}
        </div>
      )}
      <p class="small">{ratingText(r)}</p>
      <ErrorNote error={act.error} />
    </section>
  );
}

function Actions({ d }: { d: DocMeta }) {
  const download = useAction();
  const [reporting, setReporting] = useState(false);
  return (
    <section class="stack">
      <div class="row">
        <button class="btn" disabled={download.busy} onClick={() => void download.run(async () => {
          saveFile(await api.value!.fetchDocument(d.id, 'download'), fileName(d.module_id, d.title));
        })}>{download.busy ? 'Lädt …' : 'Herunterladen (zum Drucken)'}</button>
        <button class="btn btn-danger" aria-expanded={reporting} onClick={() => setReporting(!reporting)}>Melden</button>
        {isModerator.value && <a class="btn" href={href('/ablage/moderation', { tab: 'freigegeben' })}>Moderation</a>}
      </div>
      <ErrorNote error={download.error} />
      {reporting && <ReportForm d={d} onDone={() => setReporting(false)} />}
    </section>
  );
}

function ReportForm({ d, onDone }: { d: DocMeta; onDone: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const act = useAction();
  if (sent) {
    return (
      <p class="note note-good" role="status">Danke, die Moderation schaut es an.{' '}
        <button class="btn-link" onClick={onDone}>Schliessen</button></p>
    );
  }
  return (
    <form class="panel" onSubmit={(e) => {
      e.preventDefault();
      if (reason) void act.run(async () => { await api.value!.report(d.id, reason, message.trim()); setSent(true); });
    }}>
      <fieldset class="field">
        <legend>Was stimmt nicht?</legend>
        {(Object.keys(REASON_LABEL) as ReportReason[]).map((k) => (
          <label class="check" key={k}>
            <input type="radio" name="reason" checked={reason === k} onChange={() => setReason(k)} />
            <span>{REASON_LABEL[k]}</span>
          </label>
        ))}
      </fieldset>
      <label class="field">
        <span>Bemerkung (freiwillig)</span>
        <textarea maxLength={1000} value={message} onInput={(e) => setMessage(e.currentTarget.value)} />
      </label>
      <div class="row">
        <button class="btn btn-primary" disabled={!reason || act.busy}>Meldung senden</button>
        <button type="button" class="btn" onClick={onDone}>Abbrechen</button>
      </div>
      <ErrorNote error={act.error} />
    </form>
  );
}

function Viewer({ d }: { d: DocMeta }) {
  const bytes = useLoad(() => api.value!.fetchDocument(d.id, 'view'), [d.id]);
  if (bytes.loading) return <Loading what="Dokument lädt" />;
  if (bytes.error) return <ErrorNote error={bytes.error} />;
  return <PdfViewer data={bytes.data!} label={d.title} />;
}

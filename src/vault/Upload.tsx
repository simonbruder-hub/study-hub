/** Hochladen: Angaben, PDF prüfen, bestätigen */
import { useState } from 'preact/hooks';
import { href, route } from '../router';
import { DocForm } from './DocForm';
import { emptyFields, missing } from './logic';
import { formatBytes } from './labels';
import type { PdfInfo } from './pdfcheck';
import { api, plan, refreshModCount } from './state';
import type { DocFields } from './types';
import { ErrorNote, Loading, useAction } from './ui';

interface Picked { bytes: Uint8Array; name: string; info?: PdfInfo; error?: unknown }

export function Upload() {
  const q = route.value.query;
  const [fields, setFields] = useState<DocFields>(() => emptyFields(q.get('m') ?? ''));
  const [file, setFile] = useState<Picked | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const act = useAction();
  const p = plan.value;
  if (!p) return <Loading />;

  async function pick(f: File | undefined) {
    act.clear();
    if (!f) { setFile(null); return; }
    setChecking(true);
    const bytes = new Uint8Array(await f.arrayBuffer());
    try {
      const { checkPdf } = await import('./pdfcheck');
      setFile({ bytes, name: f.name, info: await checkPdf(bytes) });
    } catch (error) {
      setFile({ bytes, name: f.name, error });
    } finally {
      setChecking(false);
    }
  }

  if (done) {
    return (
      <section class="card stack">
        <h1>Danke!</h1>
        <p class="note note-good" role="status">«{done}» ist hochgeladen. Die Moderation prüft es, danach ist es für alle sichtbar.</p>
        <div class="row">
          <button class="btn btn-primary" onClick={() => {
            setDone(null); setFile(null); setConfirmed(false); setRound(round + 1);
            setFields({ ...emptyFields(fields.module_id), doc_type: fields.doc_type });
          }}>Noch eines hochladen</button>
          <a class="btn" href={href('/ablage/meine')}>Meine Uploads</a>
        </div>
      </section>
    );
  }

  const problems = missing(fields);
  const ready = !problems.length && !!file?.info && confirmed;
  return (
    <section class="stack">
      <h1>Hochladen</h1>
      <p class="note">Hinein gehören Formelsammlungen, Probeprüfungen, alte Prüfungen und Lösungen. Unterrichtsunterlagen (Skripte, Folien,
        Übungsblätter) gehören nicht hinein. Wer hochlädt, sieht nur die Moderation.</p>
      <form class="stack" onSubmit={(e) => {
        e.preventDefault();
        if (!ready || !file?.info) return;
        void act.run(async () => {
          await api.value!.upload({ fields, file: file.bytes, pageCount: file.info!.pageCount, sha256: file.info!.sha256 });
          setDone(fields.title);
          void refreshModCount();
        });
      }}>
        <DocForm key={round} value={fields} onChange={setFields} plan={p} programId={q.get('sg') ?? undefined} autoTitle />
        <label class="field" style={{ maxWidth: '640px' }}>
          <span>PDF (höchstens 20 MB)</span>
          <input type="file" accept="application/pdf,.pdf" onChange={(e) => void pick(e.currentTarget.files?.[0])} />
        </label>
        {checking && <p class="muted">PDF wird geprüft …</p>}
        {file?.info && <p class="small muted">{file.name}: {file.info.pageCount} {file.info.pageCount === 1 ? 'Seite' : 'Seiten'},
          {' '}{formatBytes(file.bytes.byteLength)}</p>}
        <ErrorNote error={file?.error} />
        <label class="check">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.currentTarget.checked)} />
          <span>Ich halte mich an die <a href={href('/ablage/regeln')}>Nutzungsregeln</a>: keine Unterrichtsunterlage, die Angaben stimmen.</span>
        </label>
        {problems.length > 0 && <p class="hint">Noch offen: {problems.join(', ')}.</p>}
        <div class="row"><button class="btn btn-primary" disabled={!ready || act.busy}>{act.busy ? 'Lädt hoch …' : 'Hochladen'}</button></div>
        <ErrorNote error={act.error} />
      </form>
    </section>
  );
}

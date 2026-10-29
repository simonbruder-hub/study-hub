/** Eigene Uploads mit Status; offene lassen sich zurückziehen */
import { href } from '../router';
import { TYPE_LABEL, formatDate } from './labels';
import { api, refreshModCount } from './state';
import type { MyUpload } from './types';
import { ErrorNote, Loading, StatusChip, useAction, useLoad } from './ui';

export function MyUploads() {
  const list = useLoad(() => api.value!.myUploads(), []);
  return (
    <section class="stack">
      <div class="spread">
        <h1>Meine Uploads</h1>
        <a class="btn btn-primary" href={href('/ablage/neu')}>Hochladen</a>
      </div>
      {list.loading && <Loading />}
      <ErrorNote error={list.error} />
      {list.data && !list.data.length && <p class="empty">Noch nichts hochgeladen.</p>}
      <ul class="doc-list">
        {(list.data ?? []).map((u) => <Row key={u.id} u={u} onChange={list.reload} />)}
      </ul>
    </section>
  );
}

function Row({ u, onChange }: { u: MyUpload; onChange: () => void }) {
  const act = useAction();
  return (
    <li class="doc-row">
      <div class="spread">
        {u.status === 'approved' ? <a href={href(`/ablage/d/${u.id}`)}><strong>{u.title}</strong></a> : <strong>{u.title}</strong>}
        <StatusChip status={u.status} />
      </div>
      <span class="meta">{TYPE_LABEL[u.doc_type]} · {u.module_id} · hochgeladen am {formatDate(u.created_at)}</span>
      {u.review_note && <span class="meta">Moderation: {u.review_note}</span>}
      {u.status === 'pending' && (
        <div class="row">
          <button class="btn btn-small btn-danger" disabled={act.busy} onClick={() => void act.run(async () => {
            await api.value!.withdraw(u);
            onChange();
            void refreshModCount();
          })}>Zurückziehen</button>
        </div>
      )}
      <ErrorNote error={act.error} />
    </li>
  );
}

/** Einstieg in die Ablage: Anmeldung, Regeln, dann Navigation und Ansichten */
import { useEffect } from 'preact/hooks';
import { href, route } from '../router';
import { Browse } from './Browse';
import { DocPage } from './DocPage';
import { Login } from './Login';
import { Moderation } from './Moderation';
import { MyUploads } from './MyUploads';
import { PlanEditor } from './PlanEditor';
import { Rules } from './Rules';
import { api, isModerator, loadAccount, me, meError, modCount, session, startVault } from './state';
import { ErrorNote, Loading, useAction } from './ui';
import { Upload } from './Upload';

export function Vault() {
  useEffect(() => { void startVault(); }, []);
  const a = api.value;
  if (a === undefined || session.value === undefined) return <Loading />;
  if (a === null) return <NotConfigured />;
  if (!session.value) return <Login />;
  if (meError.value) {
    return (
      <div class="page">
        <ErrorNote error={meError.value} />
        <div class="row"><button class="btn" onClick={() => void loadAccount()}>Nochmals versuchen</button><SignOut /></div>
      </div>
    );
  }
  const m = me.value;
  if (!m) return <Loading />;
  if (!m.email_allowed && !m.admin) {
    return (
      <Stop title="Diese Adresse ist nicht zugelassen">
        Die Ablage ist nur für Studierende mit der Mail-Adresse der Hochschule. Angemeldet ist <strong>{m.email}</strong>.
      </Stop>
    );
  }
  if (m.blocked) return <Stop title="Zugang gesperrt">Dein Zugang zur Ablage ist gesperrt. Bei Fragen hilft die Moderation.</Stop>;
  if (!m.rules_accepted) return <Rules />;
  return <Shell />;
}

function Shell() {
  const seg = route.value.path.split('/').filter(Boolean);
  const sub = seg[1];
  const mod = isModerator.value;
  const tab = (key: string | undefined, path: string, label: string, extra?: preact.ComponentChildren) => (
    <a href={href(path)} class={sub === key ? 'is-on' : ''}>{label}{extra}</a>
  );
  let view;
  if (!sub) view = <Browse />;
  else if (sub === 'd' && seg[2]) view = <DocPage id={seg[2]} />;
  else if (sub === 'neu') view = <Upload />;
  else if (sub === 'meine') view = <MyUploads />;
  else if (sub === 'regeln') view = <Rules />;
  else if (sub === 'moderation' && mod) view = <Moderation />;
  else if (sub === 'plan' && mod) view = <PlanEditor />;
  else view = <p class="note">Diese Seite gibt es nicht. <a href={href('/ablage')}>Zur Ablage</a></p>;
  return (
    <div class="page">
      <nav class="subnav" aria-label="Ablage">
        {tab(undefined, '/ablage', 'Stöbern')}
        {tab('neu', '/ablage/neu', 'Hochladen')}
        {tab('meine', '/ablage/meine', 'Meine Uploads')}
        {mod && tab('moderation', '/ablage/moderation', 'Moderation',
          modCount.value > 0 ? <span class="badge" aria-label={`${modCount.value} offen`}>{modCount.value}</span> : null)}
        {mod && tab('plan', '/ablage/plan', 'Studienplan')}
        {tab('regeln', '/ablage/regeln', 'Regeln')}
        <span class="account"><span>{me.value?.email}</span><SignOut small /></span>
      </nav>
      {view}
    </div>
  );
}

function SignOut({ small }: { small?: boolean }) {
  const act = useAction();
  return (
    <button type="button" class={`btn ${small ? 'btn-small' : ''}`} disabled={act.busy}
      onClick={() => void act.run(async () => { await api.value!.signOut(); session.value = null; me.value = null; })}>
      Abmelden
    </button>
  );
}

function Stop({ title, children }: { title: string; children: preact.ComponentChildren }) {
  return (
    <div class="page">
      <h1>{title}</h1>
      <p class="note">{children}</p>
      <div class="row"><SignOut /></div>
    </div>
  );
}

function NotConfigured() {
  return (
    <div class="page">
      <h1>Ablage</h1>
      <p class="note">Die Ablage ist noch nicht mit ihrem Server verbunden. Sie kommt bald.</p>
      <p class="muted small">Für die Einrichtung: Supabase-Projekt anlegen und die Werte als GitHub-Variablen
        VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY eintragen (supabase/README.md im Repo).</p>
    </div>
  );
}

import { useState } from 'preact/hooks';
import { api } from './state';
import { ErrorNote, useAction, useLoad } from './ui';

/** Anmelden mit einem Code per Mail (kein Link: geht auch in der installierten App) */
export function Login() {
  const a = api.value!;
  const domains = useLoad(() => a.loginDomains(), [a]);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const act = useAction();
  const list = domains.data ?? [];
  const mail = email.trim().toLowerCase();
  const looksForeign = list.length > 0 && mail.includes('@') && !list.some((d) => mail.endsWith(`@${d}`));

  return (
    <div class="page">
      <h1>Ablage</h1>
      <p class="lead">Formelsammlungen, Probeprüfungen und alte Prüfungen. Nur für Studierende der Hochschule.</p>
      <section class="card stack">
        <h2>Anmelden</h2>
        {!sent ? (
          <form class="form" onSubmit={(e) => { e.preventDefault(); void act.run(async () => { await a.sendCode(mail); setSent(true); }); }}>
            <label class="field">
              <span>Mail-Adresse für Studierende</span>
              <input type="email" autoComplete="email" required value={email} placeholder={list[0] ? `vorname.name@${list[0]}` : 'vorname.name@…'}
                onInput={(e) => setEmail(e.currentTarget.value)} />
            </label>
            {list.length > 0 && <p class="hint">Zugelassen: {list.map((d) => `@${d}`).join(', ')}</p>}
            {looksForeign && <p class="note note-warn">Diese Adresse gehört nicht zur Hochschule. Die Anmeldung klappt nur mit der Adresse für Studierende.</p>}
            <div class="row"><button class="btn btn-primary" disabled={act.busy || !mail}>{act.busy ? 'Sendet …' : 'Code senden'}</button></div>
            <ErrorNote error={act.error} />
          </form>
        ) : (
          <form class="form" onSubmit={(e) => { e.preventDefault(); void act.run(() => a.verifyCode(mail, code)); }}>
            <p>Wir haben einen Code an <strong>{mail}</strong> geschickt. Er ist eine Stunde gültig. Auch im Spam-Ordner nachsehen.</p>
            <label class="field">
              <span>Code aus der Mail</span>
              <input class="code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={10} required value={code}
                onInput={(e) => setCode(e.currentTarget.value.replace(/\D/g, ''))} />
            </label>
            <div class="row">
              <button class="btn btn-primary" disabled={act.busy || code.length < 6}>{act.busy ? 'Prüft …' : 'Anmelden'}</button>
              <button type="button" class="btn" onClick={() => { setSent(false); setCode(''); act.clear(); }}>Andere Adresse</button>
            </div>
            <ErrorNote error={act.error} />
          </form>
        )}
        {a.demo && <p class="note small">Demo ohne Server: Adresse mit @students.example.ch, Code 123456. Mit admin@students.example.ch
          bist du Admin. Alles bleibt nur bis zum Neuladen.</p>}
      </section>
    </div>
  );
}

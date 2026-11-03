/** Formelsammlung zum Drucken: pro Modul (?modul=ETG1) oder eigene Auswahl (?k=a,b); die Adresse lässt sich teilen */
import './print.css';
import { useEffect, useState } from 'preact/hooks';
import { byTopic, findModule, inhalt, loadInhalt, moduleNodes, selection, setSelection } from '../../data/content';
import type { FormulaNode, Inhalt } from '../../data/types';
import { href, route } from '../../router';
import { InhaltState, Tex } from '../../ui/formel';

export function Exam() {
  useEffect(loadInhalt, []);
  const [cols, setCols] = useState(3);
  const [vars, setVars] = useState(true);
  const [picking, setPicking] = useState(route.value.query.get('k') === '');
  const d = inhalt.value;
  if (!d) return <InhaltState />;
  const q = route.value.query;
  const k = q.get('k');
  const modul = q.get('modul');
  const m = modul ? findModule(d, modul) : undefined;
  let nodes: FormulaNode[];
  let title: string;
  if (k !== null) {
    const ids = new Set(k.split(',').filter(Boolean));
    nodes = Object.values(d.nodes).filter((n) => ids.has(n.id));
    title = 'Eigene Formelsammlung';
  } else if (modul) {
    nodes = moduleNodes(d, modul);
    title = m ? `Formelsammlung ${m} ${d.modules[m]?.title ?? ''}` : `Formelsammlung ${modul}`;
  } else {
    return <Chooser d={d} />;
  }
  const pick = (ids: string[]) => {
    setSelection(ids);
    location.hash = `/pruefung?k=${ids.join(',')}`; // auch leer: dann bleibt die Auswahl offen
  };
  return (
    <div class={`page exam cols-${cols}`}>
      <div class="exam-tools no-print">
        <p class="crumbs"><a href={href('/explorer')}>Formelbuch</a> › <a href={href('/pruefung')}>Formelsammlungen</a></p>
        <div class="link-row">
          <div class="seg" role="group" aria-label="Spalten beim Drucken">
            {[2, 3].map((c) => (
              <button key={c} type="button" class={cols === c ? 'is-on' : ''} aria-pressed={cols === c} onClick={() => setCols(c)}>
                {c} Spalten
              </button>
            ))}
          </div>
          <label class="check"><input type="checkbox" checked={vars} onChange={(e) => setVars(e.currentTarget.checked)} /> Variablen</label>
          <button type="button" class="btn btn-small" aria-expanded={picking} onClick={() => setPicking(!picking)}>Auswahl ändern</button>
          <button type="button" class="btn btn-primary" onClick={() => window.print()}>Drucken</button>
        </div>
        {m && <p class="small"><a href={href('/ablage', { m })}>Prüfungen und Formelsammlungen zu {m} in der Ablage</a></p>}
        {picking && <Picker d={d} chosen={nodes.map((n) => n.id)} onChange={pick} />}
      </div>

      <header class="exam-head">
        <h1>{title}</h1>
        <p class="muted small">Study Hub · {nodes.length} Formeln · Stand {new Date().toLocaleDateString('de-CH')}</p>
      </header>
      {!nodes.length && <p class="empty no-print">Noch keine Formeln. Mit «Auswahl ändern» welche hinzufügen.</p>}
      {byTopic(nodes).map(([t, list]) => (
        <section key={t} class="exam-topic">
          <h2>{d.topics[t]?.title}</h2>
          <div class="exam-grid">{list.map((n) => <ExamCard key={n.id} d={d} n={n} vars={vars} />)}</div>
        </section>
      ))}
    </div>
  );
}

function ExamCard({ d, n, vars }: { d: Inhalt; n: FormulaNode; vars: boolean }) {
  return (
    <article class="exam-card">
      <h3><a href={href(`/k/${n.id}`)}>{n.title}</a></h3>
      <Tex html={n.latex_html} />
      {n.forms_html.map((h, k) => <Tex key={k} html={h} />)}
      {vars && (
        <ul class="exam-vars">
          {n.variables.map((v, k) => {
            const q = d.quantities[v.quantity];
            return <li key={k}><Tex html={v.symbol_html} /> {v.meaning ?? q?.name}{q && <> (<Tex html={q.unit_html} />)</>}</li>;
          })}
        </ul>
      )}
    </article>
  );
}

function Picker({ d, chosen, onChange }: { d: Inhalt; chosen: string[]; onChange: (ids: string[]) => void }) {
  const set = new Set(chosen);
  const toggle = (id: string) => onChange(Object.keys(d.nodes).filter((x) => (x === id ? !set.has(x) : set.has(x))));
  return (
    <fieldset class="picker">
      <legend>Formeln auswählen</legend>
      {byTopic(Object.values(d.nodes)).map(([t, list]) => (
        <div key={t} class="picker-topic">
          <strong>{d.topics[t]?.title}</strong>
          {list.map((n) => (
            <label key={n.id} class="check">
              <input type="checkbox" checked={set.has(n.id)} onChange={() => toggle(n.id)} /> {n.title}
            </label>
          ))}
        </div>
      ))}
    </fieldset>
  );
}

function Chooser({ d }: { d: Inhalt }) {
  const own = selection.value;
  const modules = Object.entries(d.modules)
    .map(([id, m]) => ({ id, title: m.title, count: moduleNodes(d, id).length }))
    .filter((x) => x.count > 0);
  return (
    <div class="page">
      <p class="crumbs"><a href={href('/explorer')}>Formelbuch</a></p>
      <h1>Formelsammlungen</h1>
      <p class="lead">Nur Formeln und Variablen, zum Drucken auf A4. Was an der Prüfung erlaubt ist, steht in den Vorgaben des Moduls.</p>
      <div class="module-grid">
        {modules.map((x) => (
          <a key={x.id} class="module-card" href={href('/pruefung', { modul: x.id })}>
            <span class="code">{x.id}</span><span class="name">{x.title}</span><span class="counts">{x.count} Formeln</span>
          </a>
        ))}
        <a class="module-card" href={own.length ? href('/pruefung', { k: own.join(',') }) : '#/pruefung?k='}>
          <span class="code">Eigene</span><span class="name">Eigene Auswahl</span><span class="counts">{own.length} Formeln</span>
        </a>
      </div>
    </div>
  );
}

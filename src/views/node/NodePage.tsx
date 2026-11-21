/** Knotenseite: Formel, Variablen, Text, Verbindungen und Analogien, Formelsammlungen, Lernhilfen, Quellen */
import { useEffect } from 'preact/hooks';
import { inhalt, loadInhalt, selection, toggleSelection } from '../../data/content';
import type { FormulaNode, Inhalt } from '../../data/types';
import { href } from '../../router';
import { InhaltState, LevelBadge, NodeLink, NodeList, Tex, VariableTable } from '../../ui/formel';

const TOOL: Record<string, string> = { lernlabor: 'Lernlabor', python: 'Python', falstad: 'Falstad', plecs: 'PLECS', simulink: 'Simulink' };

export function NodePage({ id }: { id: string }) {
  useEffect(loadInhalt, []);
  const d = inhalt.value;
  if (!d) return <InhaltState />;
  const n = d.nodes[id];
  if (!n) {
    return (
      <div class="page">
        <h1>Formel nicht gefunden</h1>
        <p><a href={href('/explorer')}>Zum Formelbuch</a></p>
      </div>
    );
  }
  const siblings = Object.values(d.nodes).filter((x) => x.topic === n.topic);
  const i = siblings.indexOf(n);
  const prev = siblings[i - 1];
  const next = siblings[i + 1];
  const own = selection.value;
  const chosen = own.includes(n.id);
  const lr = n.learning_resources;
  return (
    <article class="page node-page">
      <p class="crumbs">
        <a href={href('/explorer')}>Formelbuch</a> › {d.disciplines[n.discipline]?.title} ›{' '}
        <a href={href('/explorer', { thema: n.topic })}>{d.topics[n.topic]?.title}</a>
      </p>
      <header class="node-head">
        <h1>{n.title}</h1>
        <LevelBadge level={n.level} />
      </header>
      {n.prerequisites.length > 0 && <p class="muted small">Baut auf: <NodeList d={d} ids={n.prerequisites} /></p>}

      <section class="formula-box" aria-label="Formel">
        <Tex html={n.latex_html} class="main" />
        {n.forms_html.map((h, k) => <Tex key={k} html={h} />)}
      </section>
      <VariableTable d={d} node={n} />

      <div class="prose" dangerouslySetInnerHTML={{ __html: n.html }} />

      <Connections d={d} n={n} />
      {Boolean(lr.simulations?.length || lr.videos?.length || lr.links?.length) && <Resources n={n} />}

      <section class="node-meta">
        <h2>Formelsammlung</h2>
        <p class="link-row">
          {n.modules.map((m) => (
            <a key={m} class="btn btn-small" href={href('/pruefung', { modul: m })}>{m} {d.modules[m]?.title}</a>
          ))}
          <button type="button" class={`btn btn-small${chosen ? ' btn-primary' : ''}`} aria-pressed={chosen}
            onClick={() => toggleSelection(n.id)}>{chosen ? 'In der eigenen Auswahl' : 'Zur eigenen Auswahl'}</button>
          {own.length > 0 && <a href={href('/pruefung', { k: own.join(',') })}>Eigene Auswahl ansehen ({own.length})</a>}
        </p>
        {n.sources.length > 0 && (
          <>
            <h2>Quellen</h2>
            <ul class="sources">
              {n.sources.map((s, k) => (
                <li key={k}>
                  {s.url ? <a href={s.url} target="_blank" rel="noopener">{s.title}</a> : s.title}
                  {s.author ? `, ${s.author}` : ''}{s.year ? ` (${s.year})` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <nav class="pager" aria-label="Im Thema blättern">
        {prev ? <a href={href(`/k/${prev.id}`)}>‹ {prev.title}</a> : <span />}
        {next ? <a href={href(`/k/${next.id}`)}>{next.title} ›</a> : <span />}
      </nav>
    </article>
  );
}

function Connections({ d, n }: { d: Inhalt; n: FormulaNode }) {
  if (!n.prerequisites.length && !n.required_by.length && !n.analogies.length) return null;
  return (
    <section class="connections">
      <h2>Verbindungen</h2>
      <dl class="conn">
        {n.prerequisites.length > 0 && <><dt>Voraussetzungen</dt><dd><NodeList d={d} ids={n.prerequisites} /></dd></>}
        {n.required_by.length > 0 && <><dt>Baut darauf auf</dt><dd><NodeList d={d} ids={n.required_by} /></dd></>}
      </dl>
      {n.analogies.map((aid) => <AnalogyTable key={aid} d={d} id={aid} />)}
    </section>
  );
}

/** Analogie als Tabelle: pro Zeile die Grössen, die sich entsprechen, mit dem Zeichen im jeweiligen Knoten */
function AnalogyTable({ d, id }: { d: Inhalt; id: string }) {
  const a = d.analogies[id];
  if (!a) return null;
  const nodes = a.nodes.map((nid) => d.nodes[nid]);
  return (
    <div class="analogy">
      <h3>Analogie: {a.title}</h3>
      <div class="table-wrap">
        <table class="var-table">
          <thead>
            <tr>{nodes.map((x, k) => <th key={k} scope="col">{x ? <NodeLink node={x} /> : a.nodes[k]}</th>)}</tr>
          </thead>
          <tbody>
            {a.mapping.map((row, r) => (
              <tr key={r}>
                {row.map((qid, k) => {
                  const v = nodes[k]?.variables.find((x) => x.quantity === qid);
                  return <td key={k}>{v && <Tex html={v.symbol_html} />} {d.quantities[qid]?.name}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {a.note && <p class="muted">{a.note}</p>}
    </div>
  );
}

function Resources({ n }: { n: FormulaNode }) {
  const lr = n.learning_resources;
  return (
    <section>
      <h2>Lernhilfen</h2>
      <ul>
        {lr.simulations?.map((s, k) => (
          <li key={`s${k}`}>Simulation mit {TOOL[s.tool] ?? s.tool}: {s.title ?? s.example ?? s.file} <span class="chip">folgt</span></li>
        ))}
        {[...(lr.videos ?? []), ...(lr.links ?? [])].map((l, k) => (
          <li key={`l${k}`}><a href={l.url} target="_blank" rel="noopener">{l.title}</a></li>
        ))}
      </ul>
    </section>
  );
}

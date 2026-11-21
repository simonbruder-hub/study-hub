/** Explorer: Fachgebiete, Themen und Knoten, mit Suche und Filter nach Stufe und Thema */
import { useEffect, useState } from 'preact/hooks';
import { byTopic, inhalt, loadInhalt, search, selection } from '../../data/content';
import { href, route } from '../../router';
import { InhaltState, NodeCard } from '../../ui/formel';

const LEVEL_FILTER = [{ v: '1', label: 'Grundlagen' }, { v: '2', label: 'bis Vertiefung' }, { v: '', label: 'Alle Stufen' }];

export function Explorer() {
  useEffect(loadInhalt, []);
  const [query, setQuery] = useState('');
  const d = inhalt.value;
  if (!d) return <InhaltState />;
  const q = route.value.query;
  const topic = q.get('thema') ?? '';
  const level = q.get('stufe') ?? '';
  const max = Number(level) || 3;
  const groups = byTopic(search(d, query).filter((n) => n.level <= max && (!topic || n.topic === topic)));
  const nodes = Object.values(d.nodes);
  const modules = Object.entries(d.modules).filter(([id]) => nodes.some((n) => n.modules.includes(id)));
  const own = selection.value;
  return (
    <div class="page">
      <section class="hero">
        <h1>Formelbuch</h1>
        <p class="lead">
          Formeln mit Erklärung, Gültigkeit und Beispiel. Jede Formel zeigt, worauf sie aufbaut und was darauf aufbaut.
        </p>
      </section>

      <div class="explorer-tools">
        <input type="search" class="search" placeholder="Suchen: Titel, Grösse oder Zeichen" aria-label="Formeln suchen"
          value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
        <nav class="seg" aria-label="Stufe">
          {LEVEL_FILTER.map((s) => (
            <a key={s.v} href={href('/explorer', { thema: topic, stufe: s.v })} class={level === s.v ? 'is-on' : ''}
              aria-current={level === s.v ? 'true' : undefined}>{s.label}</a>
          ))}
        </nav>
      </div>
      <nav class="topic-chips" aria-label="Themen">
        <a href={href('/explorer', { stufe: level })} class={!topic ? 'is-on' : ''}>Alle Themen</a>
        {Object.entries(d.topics).map(([id, t]) => (
          <a key={id} href={href('/explorer', { thema: id, stufe: level })} class={topic === id ? 'is-on' : ''}>{t.title}</a>
        ))}
      </nav>

      {!groups.length && <p class="empty">Keine Formel gefunden.</p>}
      {Object.entries(d.disciplines).map(([did, disc]) => {
        const mine = groups.filter(([t]) => d.topics[t]?.discipline === did);
        if (!mine.length) return null;
        return (
          <section key={did} class="discipline">
            <h2>{disc.title}</h2>
            {mine.map(([t, list]) => (
              <section key={t} class="topic">
                <h3>{d.topics[t]?.title} <span class="muted small">{list.length}</span></h3>
                <div class="node-grid">{list.map((n) => <NodeCard key={n.id} node={n} />)}</div>
              </section>
            ))}
          </section>
        );
      })}

      <section class="card">
        <h2>Formelsammlung zum Drucken</h2>
        <p>Nur Formeln und Variablen, auf A4 in zwei oder drei Spalten. Pro Modul oder mit eigener Auswahl.</p>
        <p class="link-row">
          {modules.map(([id, m]) => <a key={id} class="btn btn-small" href={href('/pruefung', { modul: id })}>{id} {m.title}</a>)}
          <a class="btn btn-small" href={own.length ? href('/pruefung', { k: own.join(',') }) : '#/pruefung?k='}>
            Eigene Auswahl{own.length ? ` (${own.length})` : ''}
          </a>
        </p>
      </section>
    </div>
  );
}

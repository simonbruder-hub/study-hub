/** Bausteine des Formelbuchs: Formeln (schon als HTML von KaTeX), Stufe, Links, Karten, Variablen */
import '../styles/formelbuch.css';
import { Fragment } from 'preact';
import { LEVELS, inhaltFailed } from '../data/content';
import type { FormulaNode, Inhalt } from '../data/types';
import { href } from '../router';

/** HTML von KaTeX aus den Daten. Es entsteht beim Build aus dem Repo, nie aus Eingaben im Browser. */
export function Tex({ html, class: cls }: { html: string; class?: string }) {
  return <span class={cls ? `tex ${cls}` : 'tex'} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function LevelBadge({ level }: { level: number }) {
  return <span class={`chip level-${level}`} title={`Stufe ${level}`}>{LEVELS[level]}</span>;
}

export function NodeLink({ node }: { node: FormulaNode }) {
  return <a href={href(`/k/${node.id}`)}>{node.title}</a>;
}

/** Knoten als Liste von Links, durch Kommas getrennt */
export function NodeList({ d, ids }: { d: Inhalt; ids: string[] }) {
  return (
    <>
      {ids.map((id, k) => {
        const n = d.nodes[id];
        return <Fragment key={id}>{k > 0 && ', '}{n ? <NodeLink node={n} /> : id}</Fragment>;
      })}
    </>
  );
}

export function NodeCard({ node }: { node: FormulaNode }) {
  return (
    <a class="node-card" href={href(`/k/${node.id}`)}>
      <span class="node-card-head">
        <span class="node-card-title">{node.title}</span>
        <LevelBadge level={node.level} />
      </span>
      <Tex html={node.latex_html} />
    </a>
  );
}

/** Zeichen, Bedeutung und Einheit; ohne eigene Bedeutung steht der Name der Grösse */
export function VariableTable({ d, node }: { d: Inhalt; node: FormulaNode }) {
  return (
    <div class="table-wrap">
      <table class="var-table">
        <thead><tr><th scope="col">Zeichen</th><th scope="col">Bedeutung</th><th scope="col">Einheit</th></tr></thead>
        <tbody>
          {node.variables.map((v, k) => {
            const q = d.quantities[v.quantity];
            return (
              <tr key={k}>
                <td><Tex html={v.symbol_html} /></td>
                <td>{v.meaning ?? q?.name}</td>
                <td>{q && <Tex html={q.unit_html} />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Solange die Daten laden, oder wenn das nicht ging */
export function InhaltState() {
  return inhaltFailed.value
    ? <p class="note note-bad">Das Formelbuch konnte nicht geladen werden. Verbindung prüfen und die Seite neu laden.</p>
    : <p class="boot">Lädt …</p>;
}

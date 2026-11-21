/** Formelbuch: Daten laden, suchen, nach Modul oder Thema ordnen, eigene Auswahl merken */
import { signal } from '@preact/signals';
import type { FormulaNode, Inhalt } from './types';

export const inhalt = signal<Inhalt | null>(null);
export const inhaltFailed = signal(false);
let pending: Promise<void> | null = null;

/** Lädt die Daten einmal (eigenes Paket, die PWA speichert es für offline) */
export function loadInhalt(): void {
  pending ??= import('./inhalt').then(
    (m) => { inhalt.value = m.default; },
    () => { pending = null; inhaltFailed.value = true; },
  );
}

export const LEVELS: Record<number, string> = { 1: 'Grundlagen', 2: 'Vertiefung', 3: 'Spezialisierung' };

/** Für die Suche: klein, Umlaute als ae, oe, ue, ohne Akzente. «Wärme» findet «waerme» und umgekehrt. */
export function fold(s: string): string {
  return s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').normalize('NFD').replace(/\p{M}/gu, '');
}

/** Knoten, die alle Suchwörter enthalten: Titel, Thema, Grössen, Bedeutungen und Formeln in LaTeX */
export function search(d: Inhalt, query: string): FormulaNode[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  const nodes = Object.values(d.nodes);
  if (!words.length) return nodes;
  return nodes.filter((n) => {
    const text = fold([
      n.title, d.topics[n.topic]?.title ?? '', n.latex_expression, ...n.forms,
      ...n.variables.flatMap((v) => [v.symbol, v.meaning ?? '', d.quantities[v.quantity]?.name ?? '']),
    ].join(' '));
    return words.every((w) => text.includes(w));
  });
}

/** Kürzel eines Moduls im Formelbuch; Gross und klein zählen nicht, wie in der Ablage */
export function findModule(d: Inhalt, id: string): string | undefined {
  const k = id.toLowerCase();
  return Object.keys(d.modules).find((m) => m.toLowerCase() === k);
}

export function moduleNodes(d: Inhalt, id: string): FormulaNode[] {
  const m = findModule(d, id);
  return m ? Object.values(d.nodes).filter((n) => n.modules.includes(m)) : [];
}

/** Nach Thema gruppiert, Reihenfolge wie in den Daten */
export function byTopic(nodes: FormulaNode[]): [string, FormulaNode[]][] {
  const groups = new Map<string, FormulaNode[]>();
  for (const n of nodes) {
    const list = groups.get(n.topic);
    if (list) list.push(n);
    else groups.set(n.topic, [n]);
  }
  return [...groups];
}

// Eigene Formelsammlung: Auswahl im Browser gespeichert, teilen geht über die Adresse (?k=a,b)
const KEY = 'studyhub.auswahl';

function readSelection(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export const selection = signal<string[]>(readSelection());

export function setSelection(ids: string[]): void {
  selection.value = ids;
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ohne Speicher */ }
}

export function toggleSelection(id: string): void {
  const s = selection.value;
  setSelection(s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
}

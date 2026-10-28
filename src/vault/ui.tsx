/** Kleine Bausteine der Ablage */
import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { errorText, STATUS_LABEL, TYPE_LABEL } from './labels';
import type { DocStatus, DocType } from './types';

export interface Loaded<T> { data: T | undefined; error: unknown; loading: boolean; reload: () => void }

/** Lädt Daten und lädt neu, wenn sich deps ändern oder reload() kommt */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]): Loaded<T> {
  const [state, setState] = useState<{ data: T | undefined; error: unknown; loading: boolean }>(
    { data: undefined, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    load().then(
      (data) => { if (alive) setState({ data, error: null, loading: false }); },
      (error: unknown) => { if (alive) setState({ data: undefined, error, loading: false }); },
    );
    return () => { alive = false; };
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

/** Für Knöpfe: führt eine Aktion aus, merkt sich «läuft» und den Fehler */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try { await action(); } catch (e) { setError(e); } finally { setBusy(false); }
  }
  return { busy, error, run, clear: () => setError(null) };
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  return <p class="note note-bad" role="alert">{errorText(error)}</p>;
}

export function Loading({ what = 'Lädt' }: { what?: string }) {
  return <p class="boot" aria-live="polite">{what} …</p>;
}

export function TypeChip({ type }: { type: DocType }) {
  return <span class="chip chip-accent">{TYPE_LABEL[type]}</span>;
}

export function StatusChip({ status }: { status: DocStatus }) {
  const cls = status === 'approved' ? 'chip-good' : status === 'pending' ? 'chip-warn' : 'chip-bad';
  return <span class={`chip ${cls}`}>{STATUS_LABEL[status]}</span>;
}

export function Panel({ children }: { children: ComponentChildren }) {
  return <div class="panel">{children}</div>;
}

/** PDF als Datei speichern */
export function saveFile(bytes: Uint8Array, name: string) {
  const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Dateiname nur aus ASCII-Zeichen (Umlaute ausgeschrieben); sonst ersetzen manche Systeme ihn durch «download» */
export function fileName(moduleId: string, title: string): string {
  const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue' };
  const ascii = `${moduleId} ${title}`.replace(/[äöüÄÖÜ]/g, (c) => map[c]!)
    .normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^ -~]/g, '');
  return `${ascii.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Dokument'}.pdf`;
}

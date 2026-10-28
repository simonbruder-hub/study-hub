/** Lädt einen Teil der App erst bei Bedarf (eigenes Paket, z. B. die Ablage mit Supabase und PDF.js) */
import type { ComponentType, FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';

export function lazyComponent<P extends object>(load: () => Promise<ComponentType<P>>): FunctionComponent<P> {
  let loaded: ComponentType<P> | null = null;
  let pending: Promise<ComponentType<P>> | null = null;
  return function Lazy(props: P) {
    const [, setTick] = useState(0);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
      if (loaded) return;
      let alive = true;
      pending ??= load();
      pending.then(
        (c) => { loaded = c; if (alive) setTick((t) => t + 1); },
        () => { pending = null; if (alive) setFailed(true); },
      );
      return () => { alive = false; };
    }, []);
    if (failed) return <p class="note note-bad">Dieser Teil konnte nicht geladen werden. Verbindung prüfen und die Seite neu laden.</p>;
    if (!loaded) return <p class="boot">Lädt …</p>;
    const C = loaded;
    return <C {...props} />;
  };
}

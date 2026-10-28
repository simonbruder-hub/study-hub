/** Einfaches Hash-Routing: #/pfad?schluessel=wert (läuft auf GitHub Pages ohne Server) */
import { signal } from '@preact/signals';

export interface Route { path: string; query: URLSearchParams }

function parse(): Route {
  const h = location.hash.replace(/^#/, '') || '/';
  const [path = '/', q = ''] = h.split('?');
  return { path: path.replace(/\/+$/, '') || '/', query: new URLSearchParams(q) };
}

export const route = signal<Route>(parse());

window.addEventListener('hashchange', () => {
  const before = route.value.path;
  route.value = parse();
  if (route.value.path !== before) window.scrollTo({ top: 0 });
});

export const href = (path: string, query: Record<string, string | undefined> = {}) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v) q.set(k, v);
  const s = q.toString();
  return `#${path}${s ? `?${s}` : ''}`;
};
export const go = (path: string, query: Record<string, string | undefined> = {}) => {
  location.hash = href(path, query).slice(1);
};

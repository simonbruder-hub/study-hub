import { signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { lazyComponent } from './lazy';
import { href, route } from './router';
import { Home } from './views/Home';

// Die Ablage (Supabase, PDF.js, pdf-lib) lädt erst, wenn sie jemand öffnet
const Vault = lazyComponent(() => import('./vault/Vault').then((m) => m.Vault));

type Theme = 'auto' | 'light' | 'dark';
const THEME_KEY = 'studyhub.theme';

function readTheme(): Theme {
  try { const t = localStorage.getItem(THEME_KEY); return t === 'light' || t === 'dark' ? t : 'auto'; } catch { return 'auto'; }
}
const theme = signal<Theme>(readTheme());

function applyTheme(t: Theme) {
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(THEME_KEY, t); } catch { /* ohne Speicher */ }
}

const THEME_NEXT: Record<Theme, Theme> = { auto: 'light', light: 'dark', dark: 'auto' };
const THEME_LABEL: Record<Theme, string> = { auto: 'Hell/Dunkel: automatisch', light: 'Hell', dark: 'Dunkel' };

function Header() {
  const path = route.value.path;
  return (
    <header class="top">
      <a class="brand" href={href('/')}>
        <img src="./icon.svg" alt="" class="brand-logo" width="30" height="30" />
        <span>Study Hub</span>
      </a>
      <nav aria-label="Hauptnavigation">
        <a href={href('/')} class={path === '/' ? 'is-on' : ''}>Start</a>
        <a href={href('/ablage')} class={path.startsWith('/ablage') ? 'is-on' : ''}>Ablage</a>
      </nav>
      <button type="button" class="btn-icon theme-btn" title={THEME_LABEL[theme.value]} aria-label={THEME_LABEL[theme.value]}
        onClick={() => (theme.value = THEME_NEXT[theme.value])}>
        <svg viewBox="0 0 24 24" class="theme-ico" aria-hidden="true">
          {theme.value === 'dark' ? <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />
            : theme.value === 'light' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></>
              : <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" class="fill" /></>}
        </svg>
      </button>
    </header>
  );
}

function Page() {
  const { path } = route.value;
  if (path === '/') return <Home />;
  if (path === '/ablage' || path.startsWith('/ablage/')) return <Vault />;
  return (
    <div class="page">
      <h1>Seite nicht gefunden</h1>
      <p><a href={href('/')}>Zur Startseite</a></p>
    </div>
  );
}

export function App() {
  useEffect(() => applyTheme(theme.value), [theme.value]);
  return (
    <>
      <Header />
      <main><Page /></main>
      <footer class="site-foot">
        Study Hub, ein Studentenprojekt (Prototyp). Von Studierenden für Studierende, unabhängig von der Hochschule.
      </footer>
    </>
  );
}

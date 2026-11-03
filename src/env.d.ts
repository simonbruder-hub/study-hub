/** Demo-Build (npm run dev:demo, build:demo): Ablage ohne Supabase mit Beispieldaten */
declare const __DEMO__: boolean;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

/** PDF.js-Worker ohne eigene Typen; die Tests in Node laden ihn direkt */
declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs';

/** Daten des Formelbuchs, beim Build aus inhalt/ erzeugt (Plugin in vite.config.ts) */
declare module 'virtual:inhalt' {
  const data: import('./data/types').Inhalt;
  export default data;
}

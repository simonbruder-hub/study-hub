/** Demo-Build (npm run dev:demo, build:demo): Ablage ohne Supabase mit Beispieldaten */
declare const __DEMO__: boolean;

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

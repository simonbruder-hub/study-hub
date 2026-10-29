/**
 * Build des Study Hub (Preact + TypeScript).
 *   npm run dev          Entwicklungsserver (http://localhost:5175)
 *   npm run build        PWA nach dist/app (GitHub Pages: https://simonbruder-hub.github.io/study-hub/)
 *   npm run dev:demo     Ablage ohne Supabase mit Beispieldaten im Speicher des Browsers
 *   npm run build:demo   dasselbe als Build nach dist/demo (für die End-to-End-Tests)
 * Die Verbindung zu Supabase kommt aus VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY
 * (GitHub-Variablen beim Build oder .env.local beim Entwickeln).
 */
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

const root = fileURLToPath(new URL('./web', import.meta.url));

export default defineConfig(({ mode }) => {
  const demo = mode === 'demo';
  return {
    root,
    base: './',
    envDir: fileURLToPath(new URL('.', import.meta.url)),
    define: { __DEMO__: JSON.stringify(demo) },
    plugins: [
      preact(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: ['icon.svg', 'icon-192.png'],
        manifest: {
          name: 'Study Hub',
          short_name: 'Study Hub',
          description: 'Formelsammlungen, Probeprüfungen und alte Prüfungen, von Studierenden für Studierende.',
          lang: 'de-CH',
          id: './',
          start_url: './',
          scope: './',
          display: 'standalone',
          background_color: '#eef2f1',
          theme_color: '#eef2f1',
          categories: ['education'],
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          ],
          shortcuts: [
            { name: 'Ablage', url: './#/ablage', icons: [{ src: 'icon-192.png', sizes: '192x192' }] },
          ],
        },
        workbox: {
          // Vorab nur die Hülle der App. Die Ablage (Supabase, PDF.js, pdf-lib) braucht ohnehin Netz;
          // ihre Teile kommen beim ersten Öffnen in den Cache (siehe unten).
          globPatterns: ['index.html', '*.{svg,png}', 'assets/index-*.{js,css}', 'assets/{virtual_pwa-register,workbox-window}*.js'],
          navigateFallback: 'index.html',
          runtimeCaching: [{
            urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          }, {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.includes('/assets/'),
            handler: 'CacheFirst',
            options: { cacheName: 'assets', expiration: { maxEntries: 40 } },
          }],
        },
      }),
    ],
    build: {
      outDir: fileURLToPath(new URL(demo ? './dist/demo' : './dist/app', import.meta.url)),
      emptyOutDir: true,
      target: 'es2022',
      chunkSizeWarningLimit: 1200,
    },
    preview: { port: demo ? 4176 : 4175 },
    server: { port: 5175, fs: { allow: [fileURLToPath(new URL('.', import.meta.url))] } },
  };
});

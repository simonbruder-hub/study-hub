/**
 * End-to-End-Tests gegen den Demo-Build (dist/demo, Ablage mit Beispieldaten ohne Supabase) und den
 * Produktions-Build (dist/app, ohne Supabase-Variablen gebaut).
 *   npm run build && npm run build:demo && npm run test:e2e
 * Mit vorinstalliertem Chromium: PW_CHROMIUM=/pfad/zu/chrome npm run test:e2e
 */
import { defineConfig, devices } from '@playwright/test';

const launchOptions = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:4176/',
    locale: 'de-CH',
    timezoneId: 'Europe/Zurich',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    launchOptions,
  },
  projects: [
    { name: 'desktop', testIgnore: /ohne-server/, use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 }, launchOptions } },
    { name: 'mobile', testIgnore: /ohne-server/, use: { ...devices['Pixel 7'], launchOptions } },
    // Produktions-Build ohne Supabase-Variablen (wie in der CI): Hülle, PWA und Hinweis der Ablage
    { name: 'ohne-server', testMatch: /ohne-server/, use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4175/', launchOptions } },
  ],
  webServer: [{
    command: 'npx vite preview --mode demo --port 4176 --strictPort',
    url: 'http://localhost:4176/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  }, {
    command: 'npx vite preview --port 4175 --strictPort',
    url: 'http://localhost:4175/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  }],
});

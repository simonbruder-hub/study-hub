/**
 * Produktions-Build ohne Supabase-Variablen, so wie die Website vor der Einrichtung aussieht.
 * Erwartet einen Build ohne VITE_SUPABASE_URL (wie in der CI; lokal ohne .env.local bauen).
 */
import { expect, test } from '@playwright/test';

test('Ohne Supabase: Startseite läuft, die Ablage meldet «noch nicht verbunden»', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Study Hub', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Zur Ablage' }).click();
  await expect(page.getByText('Die Ablage ist noch nicht mit ihrem Server verbunden.')).toBeVisible();
});

test('PWA: Manifest und Icons sind erreichbar', async ({ request }) => {
  const res = await request.get('manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest.name).toBe('Study Hub');
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok(), icon.src).toBe(true);
});

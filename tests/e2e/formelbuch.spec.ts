/**
 * Formelbuch im Browser (Demo-Build): Explorer, Knotenseite, eigene Auswahl, Formelsammlung mit Druckansicht und
 * die Verbindung zur Ablage über das Modul-Kürzel.
 */
import { expect, test } from '@playwright/test';

test('Explorer, Knotenseite und eigene Formelsammlung mit Druckansicht', async ({ page }) => {
  await page.goto('/#/explorer');
  await expect(page.getByRole('heading', { name: 'Formelbuch', level: 1 })).toBeVisible();
  expect(await page.locator('.node-card').count()).toBeGreaterThan(10);
  await page.getByRole('searchbox', { name: 'Formeln suchen' }).fill('ohmsches');
  await expect(page.locator('.node-card')).toHaveCount(1);
  await page.locator('.node-card').click();

  await expect(page.getByRole('heading', { name: 'Ohmsches Gesetz', level: 1 })).toBeVisible();
  await expect(page.locator('.formula-box .katex').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Gültigkeit' })).toBeVisible();
  const solution = page.locator('details.dropdown').first();
  await expect(solution.locator('.katex').first()).toBeHidden();
  await solution.locator('summary').click();
  await expect(solution.locator('.katex').first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Reihenschaltung von Widerständen' }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Zur eigenen Auswahl' }).click();
  await page.getByRole('link', { name: 'Eigene Auswahl ansehen (1)' }).click();
  await expect(page.getByRole('heading', { name: 'Eigene Formelsammlung', level: 1 })).toBeVisible();
  await expect(page.locator('.exam-card')).toHaveCount(1);

  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('header.top')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Drucken' })).toBeHidden();
  await expect(page.locator('.exam-card .katex').first()).toBeVisible();
});

test('Formelsammlung eines Moduls: Kürzel ohne Rücksicht auf Gross/klein, Auswahl ändern', async ({ page }) => {
  await page.goto('/#/pruefung?modul=etg1');
  await expect(page.getByRole('heading', { name: /^Formelsammlung ETG1/, level: 1 })).toBeVisible();
  const cards = await page.locator('.exam-card').count();
  expect(cards).toBeGreaterThan(10);
  await page.getByRole('button', { name: 'Auswahl ändern' }).click();
  await page.getByRole('checkbox', { name: 'Ohmsches Gesetz' }).uncheck();
  await expect(page).toHaveURL(/#\/pruefung\?k=/);
  await expect(page.locator('.exam-card')).toHaveCount(cards - 1);
  await expect(page.getByRole('heading', { name: 'Eigene Formelsammlung', level: 1 })).toBeVisible();
});

test('Ablage und Formelbuch sind über das Modul-Kürzel verbunden', async ({ page }) => {
  await page.goto('/#/ablage');
  await page.getByLabel('Mail-Adresse für Studierende').fill('anna@students.example.ch');
  await page.getByRole('button', { name: 'Code senden' }).click();
  await page.getByLabel('Code aus der Mail').fill('123456');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await page.getByText('Ich halte mich an diese Regeln.').click();
  await page.getByRole('button', { name: 'Annehmen und weiter' }).click();
  await page.evaluate(() => { location.hash = '/ablage?sg=EIT&m=ETG1'; });
  await page.getByRole('link', { name: 'Formelsammlung im Formelbuch' }).click();
  await expect(page.getByRole('heading', { name: /^Formelsammlung ETG1/, level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Prüfungen und Formelsammlungen zu ETG1 in der Ablage' })).toBeVisible();
});

test('Druck: jede Formel passt in drei Spalten auf A4', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Breite des Drucks, einmal reicht');
  await page.setViewportSize({ width: 718, height: 1000 }); // A4 ohne 2 x 10 mm Rand, wie @page in print.css
  await page.goto('/#/explorer');
  const ids = await page.locator('.node-card').evaluateAll((as) => as.map((a) => a.getAttribute('href')!.replace('#/k/', '')));
  await page.goto(`/#/pruefung?k=${ids.join(',')}`);
  await expect(page.locator('.exam-card')).toHaveCount(ids.length);
  await page.emulateMedia({ media: 'print' });
  const wide = await page.locator('.exam-card').evaluateAll((cards) => cards.flatMap((c) => [...c.querySelectorAll('.katex-display')]
    .filter((k) => k.scrollWidth > k.clientWidth + 1)
    .map((k) => `${c.querySelector('h3')?.textContent}: ${k.scrollWidth} px statt ${k.clientWidth} px`)));
  expect(wide, 'zu breite Formeln kürzer schreiben oder auf zwei Formen aufteilen').toEqual([]);
});

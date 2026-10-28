/**
 * Abläufe der Ablage im Demo-Build (Beispieldaten im Browser, ohne Supabase).
 * Die Regeln der Datenbank prüft supabase/test/tests.sql.
 */
import { expect, test, type Page } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';

async function login(page: Page, email: string, first = true) {
  await page.goto('/#/ablage');
  await page.getByLabel('Mail-Adresse für Studierende').fill(email);
  await page.getByRole('button', { name: 'Code senden' }).click();
  await page.getByLabel('Code aus der Mail').fill('123456');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  if (first) {
    await page.getByText('Ich halte mich an diese Regeln.').click();
    await page.getByRole('button', { name: 'Annehmen und weiter' }).click();
  }
  await expect(page.getByRole('link', { name: 'Stöbern' })).toBeVisible();
}

async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Abmelden' }).click();
  await expect(page.getByRole('button', { name: 'Code senden' })).toBeVisible();
}

/** Wechsel innerhalb der App ohne Neuladen (die Demo hält ihre Daten nur im Speicher) */
async function goHash(page: Page, hash: string) {
  await page.evaluate((h) => { location.hash = h; }, hash);
}

async function pdf(title: string, pages = 2): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) doc.addPage([595, 842]).drawText(`${title}, Seite ${i}`, { x: 50, y: 780, size: 18, font });
  return Buffer.from(await doc.save());
}

async function upload(page: Page, opts: { module: string; type: string; author: string; file: Buffer; name: string }) {
  await page.getByRole('link', { name: 'Hochladen', exact: true }).first().click();
  await page.getByLabel('Modul').selectOption({ label: opts.module });
  await page.getByRole('radio', { name: opts.type, exact: true }).check();
  await page.getByLabel('Verfasst von').fill(opts.author);
  await page.getByLabel('PDF (höchstens 20 MB)').setInputFiles({ name: opts.name, mimeType: 'application/pdf', buffer: opts.file });
  await expect(page.getByText(/Seiten?,/)).toBeVisible();
  await page.getByText('Ich halte mich an die').click();
  await page.getByRole('button', { name: 'Hochladen', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Danke!' })).toBeVisible();
}

test('Startseite führt zur Ablage', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Study Hub', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Zur Ablage' }).click();
  await expect(page.getByRole('button', { name: 'Code senden' })).toBeVisible();
});

test('Anmeldung nur mit Adresse der Hochschule und richtigem Code', async ({ page }) => {
  await page.goto('/#/ablage');
  await page.getByLabel('Mail-Adresse für Studierende').fill('carla@gmail.com');
  await expect(page.getByText('Diese Adresse gehört nicht zur Hochschule.')).toBeVisible();
  await page.getByRole('button', { name: 'Code senden' }).click();
  await expect(page.getByRole('alert')).toContainText('nicht zugelassen');

  await page.getByLabel('Mail-Adresse für Studierende').fill('anna@students.example.ch');
  await page.getByRole('button', { name: 'Code senden' }).click();
  await page.getByLabel('Code aus der Mail').fill('000000');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByRole('alert')).toContainText('Code stimmt nicht');
  await page.getByLabel('Code aus der Mail').fill('123456');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByRole('heading', { name: 'Nutzungsregeln' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Annehmen und weiter' })).toBeDisabled();
});

test('Stöbern, Dokument ansehen, einschätzen, melden, herunterladen', async ({ page }) => {
  await login(page, 'anna@students.example.ch');
  await expect(page.getByRole('heading', { name: 'Elektrotechnik und Informationstechnik' })).toBeVisible();
  await expect(page.getByRole('link', { name: /ETG1.*2 Prüfungen · 1 Probeprüfung · 1 Formelsammlung · 1 Lösung/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ohne festes Semester' })).toBeVisible();
  await page.getByPlaceholder('Modul suchen').fill('mathe');
  await expect(page.locator('.module-card')).toHaveCount(1);
  await page.getByPlaceholder('Modul suchen').fill('');

  await page.getByRole('link', { name: /ETG1/ }).first().click();
  await expect(page.getByRole('heading', { name: 'ETG1 Grundlagen der Elektrotechnik 1' })).toBeVisible();
  await expect(page.getByText('alter Studienplan, Modul ET1 Elektrotechnik 1')).toBeVisible();
  await page.getByRole('link', { name: 'Prüfung HS24', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Prüfung HS24' })).toBeVisible();
  await expect(page.locator('.source')).toContainText('Prof. A. Beispiel');
  await expect(page.locator('.pdf-page canvas').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('.pdf-page')).toHaveCount(3);
  await expect(page.getByRole('link', { name: 'Lösung zu Prüfung HS24' })).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Herunterladen (zum Drucken)' }).click();
  expect((await download).suggestedFilename()).toBe('ETG1 Pruefung HS24.pdf');

  await page.getByRole('button', { name: 'Melden', exact: true }).click();
  await page.getByText('Schlecht lesbar oder unvollständig').click();
  await page.getByRole('button', { name: 'Meldung senden' }).click();
  await expect(page.getByRole('status')).toContainText('Danke');

  await goHash(page, '/ablage?m=ETG1');
  await page.getByRole('link', { name: 'Probeprüfung HS24' }).click();
  await expect(page.getByText('leichter als die echte Prüfung (5 Stimmen)')).toBeVisible();
  await page.getByRole('radio', { name: 'viel schwerer' }).click();
  await expect(page.getByText('6 Stimmen')).toBeVisible();
});

test('Hochladen, in «Meine Uploads» sehen und zurückziehen', async ({ page }) => {
  await login(page, 'anna@students.example.ch');
  await page.getByRole('link', { name: 'Hochladen', exact: true }).first().click();
  await page.getByLabel('PDF (höchstens 20 MB)').setInputFiles({ name: 'notiz.txt', mimeType: 'text/plain', buffer: Buffer.from('kein PDF') });
  await expect(page.getByRole('alert')).toContainText('kein lesbares PDF');

  await upload(page, { module: 'MAT1 Mathematik 1', type: 'Formelsammlung', author: 'A. Muster', file: await pdf('Formeln'), name: 'formeln.pdf' });
  await page.getByRole('link', { name: 'Meine Uploads' }).last().click();
  const row = page.locator('.doc-row', { hasText: 'Formelsammlung FS26' });
  await expect(row).toContainText('wartet auf Prüfung');
  await row.getByRole('button', { name: 'Zurückziehen' }).click();
  await expect(page.getByText('Noch nichts hochgeladen.')).toBeVisible();
});

test('Moderation: freigeben mit Wasserzeichen, Meldung erledigen, entfernen', async ({ page }) => {
  await login(page, 'admin@students.example.ch');
  await expect(page.getByRole('link', { name: /Moderation/ })).toContainText('2');
  await page.getByRole('link', { name: /Moderation/ }).click();

  const card = page.getByRole('article', { name: 'Prüfung HS23' });
  await expect(card).toContainText('noah@students.example.ch');
  await card.getByRole('button', { name: 'Original ansehen' }).click();
  await expect(card.locator('.pdf-page canvas').first()).toBeVisible({ timeout: 15_000 });
  await card.getByRole('button', { name: 'Freigeben' }).click();
  await expect(page.getByText('Keine offenen Uploads.')).toBeVisible();

  await goHash(page, '/ablage?m=MAT1');
  await page.getByRole('link', { name: 'Prüfung HS23' }).click();
  await expect(page.locator('.pdf-page canvas').first()).toBeVisible({ timeout: 15_000 });

  await goHash(page, '/ablage/moderation?tab=meldungen');
  const report = page.getByRole('article', { name: 'Meldung zu Formelsammlung ETG1' });
  await expect(report).toContainText('Seite 2 ist abgeschnitten.');
  await report.getByRole('button', { name: 'Erledigt' }).click();
  await expect(page.getByText('Keine offenen Meldungen.')).toBeVisible();

  await goHash(page, '/ablage/moderation?tab=freigegeben');
  await page.getByPlaceholder('Suchen').fill('FS23');
  const exam = page.getByRole('article', { name: 'Prüfung FS23' });
  await exam.getByRole('button', { name: 'Entfernen' }).click();
  await exam.getByPlaceholder('z. B. auf Wunsch des Dozenten').fill('Auf Wunsch des Dozenten');
  await exam.getByRole('button', { name: 'Entfernen' }).last().click();
  await expect(page.getByText('Nichts gefunden.')).toBeVisible();
  await goHash(page, '/ablage?m=ETG1');
  await expect(page.getByRole('link', { name: 'Prüfung HS24', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Prüfung FS23' })).toHaveCount(0);
});

test('Ablehnen mit Begründung, die Person sieht sie bei ihren Uploads', async ({ page }) => {
  await login(page, 'anna@students.example.ch');
  await upload(page, { module: 'PHY1 Physik 1', type: 'Prüfung', author: 'Dr. P. Muster', file: await pdf('Physik'), name: 'physik.pdf' });
  await signOut(page);

  await login(page, 'admin@students.example.ch');
  await page.getByRole('link', { name: /Moderation/ }).click();
  const card = page.getByRole('article', { name: 'Prüfung FS26' });
  await card.getByRole('button', { name: 'Ablehnen' }).click();
  await card.getByRole('textbox').fill('Unterrichtsunterlage, gehört nicht in die Ablage');
  await card.getByRole('button', { name: 'Ablehnen' }).last().click();
  await expect(page.getByRole('article', { name: 'Prüfung FS26' })).toHaveCount(0);
  await signOut(page);

  await login(page, 'anna@students.example.ch', false);
  await page.getByRole('link', { name: 'Meine Uploads' }).last().click();
  const row = page.locator('.doc-row', { hasText: 'Prüfung FS26' });
  await expect(row).toContainText('abgelehnt');
  await expect(row).toContainText('Moderation: Unterrichtsunterlage, gehört nicht in die Ablage');
});

test('Studienplan pflegen: Studiengang, Modul mit Semester, Mail-Domain', async ({ page }) => {
  await login(page, 'admin@students.example.ch');
  await page.getByRole('link', { name: 'Studienplan' }).click();
  await page.getByPlaceholder('z. B. EIT').fill('MT');
  await page.getByPlaceholder('Neuer Studiengang').fill('Mechatronik');
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await page.getByRole('link', { name: 'MT', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Module in Mechatronik' })).toBeVisible();

  await page.getByPlaceholder('z. B. ETG1').fill('ROB1');
  await page.getByPlaceholder('z. B. Grundlagen der Elektrotechnik 1').fill('Robotik 1');
  await page.getByPlaceholder('frei wählbar').fill('2');
  await page.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(page.getByLabel('Name von ROB1')).toHaveValue('Robotik 1');

  await page.getByPlaceholder('students.hochschule.ch').fill('mail.example.org');
  await page.getByRole('button', { name: 'Zulassen' }).click();
  await expect(page.locator('.doc-row', { hasText: 'mail.example.org' })).toBeVisible();

  await goHash(page, '/ablage?sg=MT');
  await expect(page.getByRole('heading', { name: 'Mechatronik' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '2. Semester' })).toBeVisible();
  await expect(page.getByRole('link', { name: /ROB1.*Robotik 1/ })).toBeVisible();
});

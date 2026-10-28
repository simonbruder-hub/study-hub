# Supabase einrichten: Ablage

Die Ablage (Formelsammlungen, Probeprüfungen, alte Prüfungen) speichert Dokumente, Studienplan und Konten in einem
eigenen, kostenlosen Supabase-Projekt. Das Formelbuch braucht kein Supabase.

Einmaliger Aufwand: etwa 30 Minuten.

| Datei | Zweck |
|---|---|
| [`schema.sql`](schema.sql) | Tabellen, Regeln, Funktionen, Speicher und Auth Hook; im SQL-Editor ausführen |
| [`test/run.sh`](test/run.sh) | prüft das Schema lokal gegen eine Wegwerf-Datenbank (`npm run db:test`) |

> Die Bezeichnungen im Supabase-Dashboard ändern sich gelegentlich. Wenn ein Menüpunkt anders heisst, hilft die Suche
> im Dashboard (`Ctrl+K`).

---

## 1. Projekt anlegen (Free)

1. Auf [supabase.com](https://supabase.com) anmelden, **New project**.
2. **Name** `study-hub`, **Database Password** generieren und im Passwort-Manager speichern (die App braucht es nicht),
   **Region** *Central EU (Zurich)*, **Plan** *Free*.
3. Nach ein bis zwei Minuten ist die Datenbank bereit.

## 2. Schema einspielen

1. **SQL Editor**, **New query**, den ganzen Inhalt von [`schema.sql`](schema.sql) einfügen, **Run**. Eine Warnung zu
   «destructive operations» bestätigen: Das Skript löscht keine Daten, es ersetzt nur Regeln durch dieselbe Fassung.
2. Erwartet: *Success. No rows returned.*

Das Skript darf jederzeit wieder laufen, zum Beispiel nach einem Update. Daten bleiben erhalten.

## 3. Mail-Domain der Studierenden zulassen

Nur Adressen aus `allowed_logins` können ein Konto anlegen und etwas sehen. Im SQL-Editor (Domain anpassen):

```sql
insert into public.allowed_logins (entry, note) values ('students.hochschule.ch', 'Studierende');
```

Nur die Domain der Studierenden eintragen, nicht die der Mitarbeitenden: Die Ablage ist von Studierenden für
Studierende. Unterdomains zählen nicht automatisch. Einzelne Adressen gehen auch (etwa für die Moderation mit einer
privaten Adresse); sie erscheinen nicht auf der Anmeldeseite. Später lässt sich die Liste in der App unter
«Studienplan» pflegen.

## 4. Anmeldung mit Code per Mail

**Authentication, Sign In / Providers, Email:**

- **Enable Email provider** an, **Confirm email** an
- **Email OTP Length** `6`, **Email OTP Expiration** `3600`
- **Allow new users to sign up** an (sonst kommen keine neuen Studierenden hinein; wer hinein darf, regelt Abschnitt 5)

Unter **Sign In / Providers** sicherstellen, dass **Anonymous sign-ins** aus ist.

**Authentication, Emails, Templates:** beide Vorlagen **Confirm signup** und **Magic Link** auf einen Code umstellen.
Entscheidend ist `{{ .Token }}`:

*Subject:* `Dein Code für die Ablage im Study Hub`

```html
<h2>Dein Anmeldecode</h2>
<p>Gib diesen Code in der Ablage ein:</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:6px;font-family:monospace">{{ .Token }}</p>
<p>Der Code ist eine Stunde gültig. Falls du dich nicht anmelden wolltest, kannst du diese Mail ignorieren.</p>
```

Ein Code statt eines Links, weil Links in der installierten App im falschen Fenster landen und manche Mail-Dienste
Links vorab öffnen und damit verbrauchen.

## 5. Auth Hook: nur zugelassene Adressen

**Authentication, Hooks, Before User Created**, **Add hook**: Typ *Postgres*, Schema `public`, Funktion
`hook_before_user_created`, speichern.

Damit legt Supabase für fremde Adressen gar kein Konto an. Ohne Hook entstünde zwar ein Konto, es sähe aber nichts:
Jede Regel prüft die Adresse ebenfalls.

## 6. Mail-Versand für alle Studierenden (SMTP)

Der eingebaute Mail-Versand von Supabase schickt nur wenige Mails pro Stunde und je nach Stand nur an Adressen von
Mitgliedern des eigenen Supabase-Teams. Für andere Studierende braucht es einen eigenen Versand:
**Authentication, Emails, SMTP Settings**, zum Beispiel mit Brevo (gratis bis 300 Mails pro Tag, Absender-Adresse
bestätigen) oder Resend (braucht eine eigene Domain). Danach unter **Authentication, Rate Limits** die Grenze für
Mails pro Stunde passend setzen (z. B. 30).

Codes landen bei Hochschul-Adressen gerne im Spam. Hinweis in der App: «Auch im Spam-Ordner nachsehen».

## 7. Adressen der Website

**Authentication, URL Configuration:**

- **Site URL:** `https://simonbruder-hub.github.io/study-hub/`
- **Redirect URLs:** `https://simonbruder-hub.github.io/study-hub/**`, für die Entwicklung `http://localhost:5175/**`

## 8. Verbindung in die App

**Project Settings, API Keys** (oder **Data API**) zeigt die zwei Werte für die App:

| Wert | Beispiel |
|---|---|
| Project URL | `https://abcdefghijkl.supabase.co` |
| Publishable key | `sb_publishable_...` (oder der ältere *anon public key*) |

In GitHub: **Settings, Secrets and variables, Actions, Variables**, zwei Variablen anlegen:
`VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`. Für GitHub Pages zusätzlich **Settings, Pages, Source:
GitHub Actions**. Nach dem nächsten Merge auf `main` baut der Workflow «GitHub Pages» die App mit diesen Werten.

Zum Entwickeln die Werte in `.env.local` im Hauptordner eintragen (steht in `.gitignore`):

```text
VITE_SUPABASE_URL=https://abcdefghijkl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

**Niemals** den *Secret key* (`sb_secret_...`, früher `service_role`) oder das Datenbank-Passwort in die App, ins Repo
oder in einen Chat geben. Sie umgehen jede Regel.

## 9. Erster Login und Admin

1. Die App öffnen, unter «Ablage» mit der eigenen Adresse anmelden und die Nutzungsregeln annehmen.
2. Im SQL-Editor sich selbst zum Admin machen:

   ```sql
   update public.profiles set role = 'admin' where email = 'vorname.name@students.hochschule.ch';
   ```

3. App neu laden: Jetzt gibt es «Moderation» und «Studienplan».
4. Unter «Studienplan» die Studiengänge anlegen, dann pro Studiengang die Module mit Semester. Ein Modul, das es schon
   gibt, lässt sich einem weiteren Studiengang zuordnen, mit eigenem Semester.

## 10. Moderation pro Studiengang

Vorerst moderiert nur der Admin. Eine weitere Person moderiert einen Studiengang so (sie muss sich einmal angemeldet
und die Regeln angenommen haben):

```sql
insert into public.program_moderators (program_id, user_id)
select 'EIT', user_id from public.profiles where email = 'vorname.name@students.hochschule.ch';
```

Sie sieht und bearbeitet dann die Uploads und Meldungen der Module dieses Studiengangs und kann dessen Module pflegen.

## 11. Alltag

- **Freigeben:** «Moderation», «Offene Uploads»: Original ansehen, Angaben korrigieren, «Freigeben». Der Browser
  erzeugt dabei die Fassung mit Wasserzeichen und legt sie in den Speicher `freigegeben`.
- **Alumni:** Prüfungen von Alumni selbst hochladen, mit «Bereitgestellt von: Alumni» und dem Abschlussjahr.
- **Entfernen auf Anfrage** (z. B. eine Dozentin will eine Prüfung nicht in der Ablage): «Moderation», «Freigegeben»,
  suchen, «Entfernen» mit Grund. Lösungen dazu verschwinden mit, die Dateien werden gelöscht, dieselbe Datei kann nicht
  wieder hochgeladen werden.
- **Sperren:** `update public.profiles set blocked = true where email = '...';`
- **Konto löschen:** **Authentication, Users**, Person löschen. Profil, Einschätzungen und Abrufe verschwinden mit; ihre
  Uploads bleiben, ohne Absender.

## 12. Free-Plan

Stand Oktober 2026, Details auf [supabase.com/pricing](https://supabase.com/pricing): 500 MB Datenbank, 1 GB Speicher,
höchstens 50 MB pro Datei (die Ablage begrenzt auf 20 MB), 5 GB Datenverkehr pro Monat. Ein Projekt ohne Anfragen wird
nach rund einer Woche pausiert; dann im Dashboard **Restore project**. Automatische Sicherungen zum Herunterladen gibt
es im Free-Plan nicht: ab und zu den Speicher `eingang` (Originale) sichern.

## 13. Warum der Publishable key öffentlich sein darf

Der Schlüssel steckt in jeder ausgelieferten Web-App. Er sagt nur, zu welchem Projekt eine Anfrage gehört. Geschützt
sind die Daten durch die Datenbank selbst: Row Level Security auf allen Tabellen, Rechte pro Spalte, Funktionen für
Status und Abrufe, private Speicher mit eigenen Regeln. Ohne Login lassen sich nur Studiengänge und Module lesen.

## 14. Lokal testen

Mit PostgreSQL 16 (`sudo apt install postgresql-16`), im Hauptordner:

```bash
npm run db:test
```

Das Skript startet eine Wegwerf-Datenbank, bildet die nötigen Teile von Supabase nach (`test/stubs.sql`, mit
Speicher), lädt `schema.sql` zweimal und prüft mit `test/tests.sql` alle Regeln: Rechte der Rollen, Hook, Hochladen,
Speicher, Freigabe, Rate-Limit, Lösungen, Einschätzungen, Meldungen, Ablehnen, Entfernen, Moderation pro Studiengang,
Sperren und Umbenennen. Die Oberfläche lässt sich ohne Supabase ausprobieren: `npm run dev:demo`.

## 15. Fehlerbehebung

| Meldung oder Symptom | Ursache und Lösung |
|---|---|
| App: «noch nicht mit ihrem Server verbunden» | GitHub-Variablen fehlen (Abschnitt 8) oder der Build lief vorher; Workflow «GitHub Pages» neu starten |
| «Diese Mail-Adresse ist nicht zugelassen» | Domain fehlt in `allowed_logins` (Abschnitt 3) oder Tippfehler |
| Es kommt kein Code | Spam-Ordner; eigener Mail-Versand fehlt (Abschnitt 6); Grenze für Mails pro Stunde |
| Mail mit Link statt Code | Vorlage ohne `{{ .Token }}`; beide Vorlagen anpassen (Abschnitt 4) |
| «Dafür fehlen die Rechte» | Rolle oder Moderation fehlt (Abschnitte 9 und 10), oder die Sitzung ist abgelaufen: ab- und wieder anmelden |
| «Grenze erreicht» | Rate-Limit: höchstens 60 verschiedene Dokumente pro Stunde und 200 pro Tag ansehen, 10 pro Stunde und 30 pro Tag herunterladen. Werte stehen in `request_document` in `schema.sql` |
| Freigeben meldet «Fassung mit Wasserzeichen fehlt» | Hochladen in den Speicher `freigegeben` ging schief; nochmals freigeben |
| App meldet dauerhaft keine Verbindung | Projekt pausiert: Dashboard, **Restore project** |

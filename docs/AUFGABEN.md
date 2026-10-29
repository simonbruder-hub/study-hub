# Aufgaben und Entscheide (Übergabe zwischen Chats)

Neuer Chat: «Mach Aufgabe N aus docs/AUFGABEN.md.» Ein Chat pro Aufgabe. Arbeitsweise, Befehle und Stolpersteine
stehen in `CLAUDE.md` (lädt automatisch).

## Stand

Die Ablage (Aufgabe 2) ist gebaut; PR `simonbruder-hub/study-hub#3` wartet auf das Mergen, die Website ist noch nicht
eingeschaltet. Als Nächstes die Punkte unter «Offen», dann Aufgabe 3.

## Entscheide

- 28.10.2026: Eigenständiges Projekt, unabhängig von den Apps im Repo `simonbruder-hub/apps`. Arbeitsname
  **study-hub**. Repo und Website öffentlich (GitHub Pages); ein Studentenprojekt, vorerst für Simon selbst und als
  Erfahrungssammlung. Bei Weiterführung eventuell privat.
- 28.10.2026: Das **Lernlabor** (heute `apps/lernlabor/`, Schaltungsbaukasten mit eigenem Simulator, Theorie und
  Aufgaben) zieht in den Study Hub um und ersetzt dort Falstad.
- 28.10.2026: Vorlagen der Dozenten sind die Grundlage für die Theorie, werden aber in eigenen Worten und im eigenen
  Standard neu geschrieben. Originale, Altklausuren und fremde PDFs kommen nicht ins öffentliche Repo.
- 28.10.2026: Vorgehen: zuerst ein paar Themen, dann Experten vorlegen und anpassen.
- 28.10.2026 (Aufgabe 1): Formel-Knoten als Markdown-Dateien mit YAML-Kopf, eine Datei pro Knoten unter
  `inhalt/knoten/<thema>/<id>.md`. Grössen, Themen, Module und Analogien je einmal in einer YAML-Datei. Die CI prüft
  alles (`npm run inhalt`). Datenmodell, Tresor und Frontend: `docs/ARCHITEKTUR.md`.
- 28.10.2026 (Aufgabe 1): Druck im Browser mit KaTeX und CSS `@media print`, später ein Export als `.tex` für
  Overleaf.
- 28.10.2026 (Aufgabe 1): Erste Themen Gleichstrom, Wechselstrom und Schaltvorgänge, für die Analogien die
  Wärmelehre (Wärmewiderstand wie Ohm, Erwärmung wie RC-Laden).
- 28.10.2026 (Aufgabe 1): Tresor mit Login über die Hochschul-Mail und Freischaltung durch Simon, eigenes
  Supabase-Projekt. Formelbuch und Prüfungs-Modus bleiben ohne Login offen. (Die Freischaltung pro Person ist durch
  die Neuplanung unten ersetzt.)
- 28.10.2026 (Aufgabe 1): Simulationen mit Werkzeug-Feld (`lernlabor`, `python`, `falstad`, `plecs`, `simulink`),
  die Werkzeuge pro Modul stehen in `inhalt/module.yaml`.
- 28.10.2026 (Neuplanung nach Aufgabe 1): Projekt vorerst eingeschränkt. Zuerst die **Ablage** für
  Formelsammlungen, Probeprüfungen und alte Prüfungen von Alumni, danach das Formelbuch. Den bisherigen Ordner führt
  seit mehreren Semestern niemand mehr, und er passt nicht zum neuen Studienplan, darum ein Neustart.
- 28.10.2026 (Neuplanung): Eine Ablage für mehrere Studiengänge, geordnet nach Studiengang, Semester, Modul und
  Dokument. Ein Modul kann zu mehreren Studiengängen gehören. Unterrichtsunterlagen gehören nicht in die Ablage.
- 28.10.2026 (Neuplanung): Die Ablage ist von Studierenden für Studierende, unabhängig von der Studiengangleitung. Sie
  soll helfen, Wissen weiterzugeben: Die Probeprüfungen der Dozenten sind oft zu einfach, mit alten Prüfungen lernt
  man auf dem richtigen Niveau.
- 28.10.2026 (Neuplanung): Sehen und Hochladen mit Login über die Mail-Adresse für Studierende der Hochschule, ohne
  Freischaltung pro Person. Moderiert werden die Dokumente: Freigabe vorerst nur durch Simon, eine Moderation pro
  Studiengang ist im Datenmodell vorgesehen.
- 28.10.2026 (Neuplanung): Alumni ohne Hochschul-Mail schicken ihre Prüfungen an Simon, Simon lädt sie mit der Quelle
  «Alumni, Abschlussjahr» hoch.
- 28.10.2026 (Neuplanung): Prüfungen aus dem alten Studienplan hängen am passenden Modul des neuen Plans, mit dem
  Vermerk «alter Studienplan, Modul X».
- 28.10.2026 (Neuplanung): Die Vorlagen der Dozenten will Simon stark anpassen. Sie kommen erst mit dem Formelbuch
  (Aufgabe 3).
- 28.10.2026 (Aufgabe 2): Studiengänge und Module als Tabellen in Supabase, gepflegt in der App unter «Studienplan»,
  auch von der Moderation eines Studiengangs. `inhalt/module.yaml` bleibt vorerst für das Formelbuch (Abgleich in
  Aufgabe 3).
- 28.10.2026 (Aufgabe 2): Studierende schätzen Probeprüfungen ein: viel leichter bis viel schwerer als die echte
  Prüfung, eine Stimme pro Person, die Ablage zeigt die Verteilung.
- 28.10.2026 (Aufgabe 2): Lösungen sind eigene Dokumente (Typ «Lösung», «offiziell» oder «von Studierenden»), an eine
  Prüfung oder Probeprüfung gehängt, auch später und von jemand anderem. Dazu das Häkchen «Lösung im selben PDF».
- 28.10.2026 (Aufgabe 2): Wer hochgeladen hat, sieht nur die Moderation. Alle sehen die Quelle: Verfasser, Semester,
  bereitgestellt von Studierenden oder Alumni (mit Abschlussjahr).
- 28.10.2026 (Aufgabe 2): Rate-Limit pro Person, gezählt in verschiedenen Dokumenten: ansehen 60 pro Stunde und 200 pro
  Tag, herunterladen 10 pro Stunde und 30 pro Tag; schon geöffnete gehen immer. Entfernte Dateien können nicht wieder
  hochgeladen werden.
- 28.10.2026 (Aufgabe 2): PDF.js 6 statt 5 (Sicherheitslücke in 5.x beim Öffnen präparierter PDFs). Geschützte PDFs
  lehnt das Hochladen ab, weil pdf-lib sie nicht mit dem Wasserzeichen versehen kann.
- 29.10.2026: Projektpflege: `CLAUDE.md` mit Arbeitsweise, Befehlen und Stolpersteinen, damit ein neuer Chat nicht die
  ganze Doku lesen muss; kürzerer Startsatz; erledigte Aufgaben nur noch als eine Zeile. Dependabot öffnet einmal im
  Monat einen PR mit Updates (mergen, wenn die CI grün ist).

## Offen

1. PR #3 mergen. In GitHub: Settings, Pages, Source «GitHub Actions»; Settings, Branches: Schutz für `main` (mergen nur
   mit grüner CI).
2. Supabase einrichten (`supabase/README.md`): Projekt, Schema, Mail-Domain der Studierenden in `allowed_logins`,
   Code-Mails, Auth Hook, eigener Mail-Versand (SMTP), GitHub-Variablen `VITE_SUPABASE_URL` und
   `VITE_SUPABASE_ANON_KEY`. Danach mit echten Konten testen: Login, Hochladen, Freigabe, Ansicht, Melden. Die
   Anbindung an Supabase ist bisher nur gegen die Datenbank-Regeln geprüft.
3. Studiengänge und Module des neuen Studienplans: nach der Einrichtung in der App unter «Studienplan» eintragen.
4. Welche Module brauchen welches Simulationswerkzeug? (Aufgabe 5)

## Aufgaben

1. **Architektur und Datenmodell** (erledigt, PR `simonbruder-hub/study-hub#1`).
2. **Ablage für Formelsammlungen und Prüfungen** (erledigt, PR `simonbruder-hub/study-hub#3`; Doku in
   `docs/ARCHITEKTUR.md`, Abschnitt 3, und `supabase/README.md`).
3. **Formelbuch: Grundgerüst und erste Themen** (früher Aufgabe 2): einige Themen als Formel-Knoten (Vorlagen der
   Dozenten als Grundlage, stark angepasst, eigener Standard), Explorer und Prüfungs-Formelsammlung zum Drucken.
   Danach Experten zeigen. Aufbau nach `docs/ARCHITEKTUR.md`, Abschnitt 4. Die Daten liefert
   `npm run inhalt -- --json`, der Text wird dabei zu HTML. Die vier Beispielknoten nach dem eigenen Standard
   überarbeiten.
   Vorlage aus dem Modul «Effiziente Leistungselektronik» (28.10.2026 im Chat geteilt, Originale bleiben lokal):
   ein Jupyter Book, Kapitel als `.ipynb` mit MyST-Markdown und ohne Code (Lernziele, Theorie mit nummerierten
   Formeln, Übungen in Tabs, Lernkontrolle, Hinweise, Videos, Widgets, PLECS-Simulationen). Prüfen, ob der Text der
   Knoten MyST-Markdown verwenden soll, damit sich die Vorlagen leichter übernehmen lassen. Module aus Supabase mit
   `inhalt/module.yaml` abgleichen.
4. **Lernlabor umziehen** (das Lernlabor ist vorerst stillgelegt; vor dem Start klären, ob der Umzug noch gewünscht
   ist): Simulator, Theorie und Aufgaben aus `apps/lernlabor/` übernehmen, die Theorie in
   Formel-Knoten überführen, Schaltungen an die Knoten hängen. Im Repo `apps` Startseite, Taktwerk-Links und eine
   Weiterleitung auf die neue Adresse anpassen.
5. **Simulations-Standard:** Format für Simulationen pro Modul festlegen und an zwei Beispielen umsetzen
   (Lernlabor im Browser, PLECS oder Simulink als Datei mit Bild und Ergebnis).
6. **Lernhilfen:** KI-Prompt-Knopf, Regler mit Graphen, Videos und Links pro Knoten.

7. **Datenschutz und Impressum:** Seite in der App mit Datenschutzerklärung (was die Ablage speichert: Mail-Adresse,
   Uploads, Abrufe, Einschätzungen, Meldungen; wie lange; Rechte; Kontakt) und Impressum, verlinkt im Fuss und beim
   Login. Vor der Einladung weiterer Studierender. Mitbringen: Kontaktadresse für die Website.
8. **Datenbank mit der Supabase CLI:** `supabase/schema.sql` in Migrationen überführen, TypeScript-Typen erzeugen
   (`supabase gen types`) und in `src/vault/supabaseApi.ts` nutzen, damit Tippfehler bei Tabellen und Spalten beim
   Build auffallen. Die Tests der Regeln bleiben.
9. **Code-Stil:** ESLint und Prettier, Prüfung in der CI. Das einmalige Formatieren des ganzen Codes als eigener PR,
   damit der Diff nur Formatierung zeigt.
10. **Backups der Ablage:** regelmässige Sicherung der Datenbank und der Originale im Speicher `eingang`, z. B. mit einer
    GitHub Action. Vorher klären, wo die Sicherung liegen darf (nicht im öffentlichen Repo).
11. **Barrierefreiheit:** axe in den End-to-End-Tests, gefundene Probleme beheben.

## Technische Hinweise

Die meisten stehen in `CLAUDE.md`. Hier nur, was für spätere Aufgaben zählt:

- Vorbild ist das Repo `simonbruder-hub/apps` (gleicher Stack, gleiche Arbeitsweise).
- KaTeX 0.18, weil 0.16 eine Sicherheitswarnung hat. Das Lernlabor nutzt noch 0.16, beim Umzug beachten.
- pdf-lib ist nach ES5 übersetzt: `instanceof EncryptedPDFError` greift nicht, geschützte PDFs erkennt
  `src/vault/pdfcheck.ts` darum auch am Text der Meldung.

# Aufgaben und Entscheide (Übergabe zwischen Chats)

Startsatz für einen neuen Chat:
«Lies README.md, docs/BRIEFING.md und docs/AUFGABEN.md und mach Aufgabe N.»

## Arbeitsweise

- Deutsch, kein scharfes S, keine Gedankenstriche. Kurz und verständlich erklären (Elektrotechnik-Student,
  kennt Python und LaTeX, wenig Webentwicklung).
- Erst gezielte Fragen zu Unklarem, dann ein kurzer Plan, dann umsetzen.
- Eigener Branch und PR, CI grün machen. Mergen erst nach OK.
- Ein Chat pro Aufgabe. Sparsam mit Tokens. Am Ende diese Datei nachführen.

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
- 28.10.2026 (Neuplanung): Sehen und Hochladen mit Login über die Mail-Adresse für Studierende der Hochschule, ohne
  Freischaltung pro Person. Moderiert werden die Dokumente: Freigabe vorerst nur durch Simon, eine Moderation pro
  Studiengang ist im Datenmodell vorgesehen.
- 28.10.2026 (Neuplanung): Alumni ohne Hochschul-Mail schicken ihre Prüfungen an Simon, Simon lädt sie mit der Quelle
  «Alumni, Abschlussjahr» hoch.
- 28.10.2026 (Neuplanung): Prüfungen aus dem alten Studienplan hängen am passenden Modul des neuen Plans, mit dem
  Vermerk «alter Studienplan, Modul X».
- 28.10.2026 (Neuplanung): Die Vorlagen der Dozenten will Simon stark anpassen. Sie kommen erst mit dem Formelbuch
  (Aufgabe 3).

## Offen

1. Rechtliches vor dem Start der Ablage: mit der Studiengangleitung klären, ob alte Prüfungen und Probeprüfungen in
   einer geschlossenen Ablage geteilt werden dürfen (Prüfungsreglement, Rechte der Dozenten).
2. Studiengänge und Module des neuen Studienplans mit Kürzel, Name und Semester (Aufgabe 2).
3. Domain der Mail-Adressen für Studierende (Aufgabe 2).
4. Welche Module brauchen welches Simulationswerkzeug? (Aufgabe 5)

## Aufgaben

1. **Schritt 1 aus dem Briefing** (erledigt: PR `simonbruder-hub/study-hub#1`, siehe `docs/ARCHITEKTUR.md`).
   Ursprünglicher Auftrag: Datenschema (`FormulaNode`, `DocumentNode`, Relationen), Architektur für Datei-Speicher
   und Wasserzeichen mit `pdf-lib`, Komponenten-Struktur im Frontend. Noch kein UI-Code. Vorher die offenen Punkte
   klären.
2. **Ablage für Formelsammlungen und Prüfungen** (vorgezogen, früher Aufgabe 6 «Dokumenten-Tresor»):
   Formelsammlungen, Probeprüfungen und alte Prüfungen hochladen, nach Studiengang, Semester und Modul ordnen,
   freigeben und ansehen. Login mit Hochschul-Mail, Wasserzeichen, Rate-Limit. Dazu das Grundgerüst der App (Vite,
   Preact, TypeScript, PWA, GitHub Pages), auf dem das Formelbuch später aufbaut. Grundlage: die Entscheide oben und
   `docs/ARCHITEKTUR.md`, Abschnitt 3; den Abschnitt dabei anpassen.
   Vorschlag, zu Beginn bestätigen: Studiengänge und Module als Tabellen in Supabase, gepflegt in der App, statt in
   `inhalt/module.yaml`. So braucht die Moderation anderer Studiengänge kein Git.
   Mitbringen: Studiengänge und Module des neuen Studienplans (z. B. den offiziellen Modulplan), Mail-Domain der
   Studierenden, zwei bis drei Testdateien, ein neues Supabase-Projekt mit Project URL und Publishable key (den
   geheimen Schlüssel nie in den Chat). In GitHub: Settings, Pages, Source «GitHub Actions».
3. **Formelbuch: Grundgerüst und erste Themen** (früher Aufgabe 2): einige Themen als Formel-Knoten (Vorlagen der
   Dozenten als Grundlage, stark angepasst, eigener Standard), Explorer und Prüfungs-Formelsammlung zum Drucken.
   Danach Experten zeigen. Aufbau nach `docs/ARCHITEKTUR.md`, Abschnitt 4. Die Daten liefert
   `npm run inhalt -- --json`, der Text wird dabei zu HTML. Die vier Beispielknoten nach dem eigenen Standard
   überarbeiten.
4. **Lernlabor umziehen** (das Lernlabor ist vorerst stillgelegt; vor dem Start klären, ob der Umzug noch gewünscht
   ist): Simulator, Theorie und Aufgaben aus `apps/lernlabor/` übernehmen, die Theorie in
   Formel-Knoten überführen, Schaltungen an die Knoten hängen. Im Repo `apps` Startseite, Taktwerk-Links und eine
   Weiterleitung auf die neue Adresse anpassen.
5. **Simulations-Standard:** Format für Simulationen pro Modul festlegen und an zwei Beispielen umsetzen
   (Lernlabor im Browser, PLECS oder Simulink als Datei mit Bild und Ergebnis).
6. **Lernhilfen:** KI-Prompt-Knopf, Regler mit Graphen, Videos und Links pro Knoten.

## Technische Hinweise

- Vorbild ist das Repo `simonbruder-hub/apps` (gleicher Stack, gleiche Arbeitsweise, dort `docs/AUFGABEN.md`).
- Inhalte: `npm ci`, `npm run inhalt` (Prüfung), `npm test` (Tests der Prüfung). `.npmrc` mit
  `legacy-peer-deps=true` wie bei Taktwerk, sonst bricht npm 10 beim Auflösen von Vitest 5 ab.
- KaTeX 0.18, weil 0.16 eine Sicherheitswarnung hat. Das Lernlabor nutzt noch 0.16, beim Umzug beachten.
- Playwright in der Cloud: Chromium unter `/opt/pw-browsers/chromium`.
- PRs in der Cloud über `gh api repos/simonbruder-hub/study-hub/pulls` (`gh pr create` geht nicht).
- Repo-Einstellungen (umbenennen, Pages einschalten, Sichtbarkeit) kann Claude nicht ändern, das macht Simon in GitHub.
  Für GitHub Pages: Settings, Pages, Source «GitHub Actions».

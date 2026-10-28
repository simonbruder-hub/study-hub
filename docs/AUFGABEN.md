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
  Supabase-Projekt. Formelbuch und Prüfungs-Modus bleiben ohne Login offen.
- 28.10.2026 (Aufgabe 1): Simulationen mit Werkzeug-Feld (`lernlabor`, `python`, `falstad`, `plecs`, `simulink`),
  die Werkzeuge pro Modul stehen in `inhalt/module.yaml`.

## Offen

1. Welche Module brauchen welches Werkzeug? (Aufgabe 4, Feld `tools` in `inhalt/module.yaml`)
2. Echte Module mit Kürzel, Name und Semester (Aufgabe 2; `inhalt/module.yaml` hat bisher nur ein Beispiel).
3. Domain der Hochschul-Mail für den Login (Aufgabe 6).

## Aufgaben

1. **Schritt 1 aus dem Briefing** (erledigt, siehe `docs/ARCHITEKTUR.md`).
   Ursprünglicher Auftrag: Datenschema (`FormulaNode`, `DocumentNode`, Relationen), Architektur für Datei-Speicher
   und Wasserzeichen mit `pdf-lib`, Komponenten-Struktur im Frontend. Noch kein UI-Code. Vorher die offenen Punkte
   klären.
2. **Grundgerüst und erste Themen:** App wie im Repo `apps` (Vite, Preact, TypeScript, PWA, KaTeX, GitHub Pages),
   einige Themen als Formel-Knoten (Vorlagen der Dozenten als Grundlage, eigener Standard), Explorer und
   Prüfungs-Formelsammlung zum Drucken. Danach Experten zeigen.
   Aufbau nach `docs/ARCHITEKTUR.md`, Abschnitt 4. Die Daten liefert `npm run inhalt -- --json`, der Text wird dabei
   zu HTML. Die vier Beispielknoten nach dem eigenen Standard überarbeiten, `inhalt/module.yaml` mit echten Modulen.
3. **Lernlabor umziehen:** Simulator, Theorie und Aufgaben aus `apps/lernlabor/` übernehmen, die Theorie in
   Formel-Knoten überführen, Schaltungen an die Knoten hängen. Im Repo `apps` Startseite, Taktwerk-Links und eine
   Weiterleitung auf die neue Adresse anpassen.
4. **Simulations-Standard:** Format für Simulationen pro Modul festlegen und an zwei Beispielen umsetzen
   (Lernlabor im Browser, PLECS oder Simulink als Datei mit Bild und Ergebnis).
5. **Lernhilfen:** KI-Prompt-Knopf, Regler mit Graphen, Videos und Links pro Knoten.
6. **Dokumenten-Tresor (später):** Login, Upload mit Pflicht-Quellen, Freigabe, Wasserzeichen, Rate-Limit.

## Technische Hinweise

- Vorbild ist das Repo `simonbruder-hub/apps` (gleicher Stack, gleiche Arbeitsweise, dort `docs/AUFGABEN.md`).
- Inhalte: `npm ci`, `npm run inhalt` (Prüfung), `npm test` (Tests der Prüfung). `.npmrc` mit
  `legacy-peer-deps=true` wie bei Taktwerk, sonst bricht npm 10 beim Auflösen von Vitest 5 ab.
- KaTeX 0.18, weil 0.16 eine Sicherheitswarnung hat. Das Lernlabor nutzt noch 0.16, beim Umzug beachten.
- Playwright in der Cloud: Chromium unter `/opt/pw-browsers/chromium`.
- PRs in der Cloud über `gh api repos/simonbruder-hub/study-hub/pulls` (`gh pr create` geht nicht).
- Repo-Einstellungen (umbenennen, Pages einschalten, Sichtbarkeit) kann Claude nicht ändern, das macht Simon in GitHub.
  Für GitHub Pages: Settings, Pages, Source «GitHub Actions».

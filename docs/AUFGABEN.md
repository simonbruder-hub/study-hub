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

## Offen (im ersten Chat klären, Vorschläge in `BRIEFING.md`, Abschnitt «Antworten und Vorschläge»)

1. Druck: Browser-Druck mit KaTeX (Vorschlag), dazu später ein Export als `.tex`?
2. Formel-Knoten als Dateien im Repo (Vorschlag: YAML pro Knoten, Prüfung in der CI) oder in einer Datenbank?
3. Simulationen: gemeinsames Format mit Werkzeug-Feld (`lernlabor`, `python`, `plecs`, `simulink`, `falstad`).
   Welche Module brauchen welches Werkzeug?
4. Welche ersten Themen? Naheliegend: Gleichstrom, Wechselstrom, Schaltvorgänge (gibt es schon im Lernlabor) und
   ein Thema aus einem anderen Modul, um Analogien zu zeigen (z. B. thermisch oder mechanisch).
5. Dokumenten-Tresor: Zugang (Login mit Hochschul-Mail?) und Backend (eigenes Supabase-Projekt). Kommt zuletzt.

## Aufgaben

1. **Schritt 1 aus dem Briefing:** Datenschema (`FormulaNode`, `DocumentNode`, Relationen), Architektur für
   Datei-Speicher und Wasserzeichen mit `pdf-lib`, Komponenten-Struktur im Frontend. Noch kein UI-Code.
   Vorher die offenen Punkte oben klären.
2. **Grundgerüst und erste Themen:** App wie im Repo `apps` (Vite, Preact, TypeScript, PWA, KaTeX, GitHub Pages),
   einige Themen als Formel-Knoten (Vorlagen der Dozenten als Grundlage, eigener Standard), Explorer und
   Prüfungs-Formelsammlung zum Drucken. Danach Experten zeigen.
3. **Lernlabor umziehen:** Simulator, Theorie und Aufgaben aus `apps/lernlabor/` übernehmen, die Theorie in
   Formel-Knoten überführen, Schaltungen an die Knoten hängen. Im Repo `apps` Startseite, Taktwerk-Links und eine
   Weiterleitung auf die neue Adresse anpassen.
4. **Simulations-Standard:** Format für Simulationen pro Modul festlegen und an zwei Beispielen umsetzen
   (Lernlabor im Browser, PLECS oder Simulink als Datei mit Bild und Ergebnis).
5. **Lernhilfen:** KI-Prompt-Knopf, Regler mit Graphen, Videos und Links pro Knoten.
6. **Dokumenten-Tresor (später):** Login, Upload mit Pflicht-Quellen, Freigabe, Wasserzeichen, Rate-Limit.

## Technische Hinweise

- Vorbild ist das Repo `simonbruder-hub/apps` (gleicher Stack, gleiche Arbeitsweise, dort `docs/AUFGABEN.md`).
- Playwright in der Cloud: Chromium unter `/opt/pw-browsers/chromium`.
- PRs in der Cloud über `gh api repos/simonbruder-hub/study-hub/pulls` (`gh pr create` geht nicht).
- Repo-Einstellungen (umbenennen, Pages einschalten, Sichtbarkeit) kann Claude nicht ändern, das macht Simon in GitHub.
  Für GitHub Pages: Settings, Pages, Source «GitHub Actions».

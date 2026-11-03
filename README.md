# study-hub

Vernetztes Formelbuch und Ablage für Formelsammlungen, Probeprüfungen und alte Prüfungen, später mit Simulationen
und Lernhilfen. Für das Studium, mit Fokus Elektrotechnik. Studentenprojekt, Arbeitsname.

Stand: Das Formelbuch ist gebaut (Aufgabe 3): 24 Formeln zu Gleichstrom, Schaltvorgängen, Wechselstrom und
Wärmelehre, je mit Erklärung, Gültigkeit und Beispiel, dazu Explorer, Analogien und Formelsammlungen zum Drucken,
ohne Login und offline. Die Ablage ist ebenfalls gebaut (Aufgabe 2): Login mit der Mail-Adresse für Studierende,
Stöbern nach Studiengang, Semester und Modul, Ansicht im Browser, Hochladen, Moderation mit Wasserzeichen, Melden und
Einschätzung von Probeprüfungen. Sie wartet auf die Einrichtung von Supabase ([`supabase/README.md`](supabase/README.md)).

Website: <https://simonbruder-hub.github.io/study-hub/>, sobald GitHub Pages eingeschaltet ist.

| Datei | Inhalt |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Kurzanleitung für Claude: Arbeitsweise, Befehle, Stolpersteine |
| [`docs/BRIEFING.md`](docs/BRIEFING.md) | Master-Briefing, Ergänzungen und Vorschläge |
| [`docs/AUFGABEN.md`](docs/AUFGABEN.md) | Arbeitsweise, Entscheide, offene Fragen, Aufgaben |
| [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md) | Datenmodell, Relationen, Ablage mit Wasserzeichen, Aufbau des Frontends |
| [`docs/INHALTE.md`](docs/INHALTE.md) | Formel-Knoten schreiben: Gliederung, Formeln, MyST-Teilmenge, Vorlage |
| [`src/`](src), [`web/`](web) | App (Vite, Preact, TypeScript, PWA); das Formelbuch in `src/data/`, `src/ui/` und `src/views/`, die Ablage in `src/vault/` |
| [`supabase/`](supabase) | Schema der Ablage, Einrichtung, Tests der Regeln |
| [`inhalt/`](inhalt) | Formel-Knoten (Markdown mit YAML-Kopf), Grössen, Themen, Module, Analogien |
| [`schema/`](schema) | JSON-Schemas zu den Inhalten |
| [`scripts/inhalt.mjs`](scripts/inhalt.mjs) | Prüfung der Inhalte, erzeugt die Daten für das Formelbuch (Text und Formeln mit [`scripts/myst.mjs`](scripts/myst.mjs) als HTML) |
| [`tests/e2e/`](tests/e2e) | Abläufe von Formelbuch und Ablage im Browser (Playwright, Demo ohne Server) |

Neuer Chat mit Claude: «Mach Aufgabe N aus docs/AUFGABEN.md.» Claude liest dazu `CLAUDE.md` automatisch.

## Entwickeln

```bash
npm ci
npm run dev        # App unter http://localhost:5175, lädt bei Änderungen in inhalt/ neu; Ablage mit .env.local
npm run dev:demo   # Ablage ohne Server, mit Beispieldaten (Code 123456)
```

## Prüfen

```bash
npm run inhalt     # Inhalte: Schema, Verweise, Kreise, Analogien, LaTeX, Gliederung, MyST, Schreibregeln
npm run typecheck  # TypeScript
npm test           # Unit-Tests, Schreibregeln für das ganze Repo
npm run db:test    # Regeln der Ablage gegen PostgreSQL 16
npm run build && npm run build:demo && npm run test:e2e   # Abläufe im Browser
npm run inhalt -- --json dist/inhalt.json   # zusätzlich die Daten für das Formelbuch schreiben
```

Verwandt: [`simonbruder-hub/apps`](https://github.com/simonbruder-hub/apps) mit Taktwerk, Kochbuch und dem
Lernlabor, das in dieses Projekt umzieht.

Inhalte von Dritten (Vorlagen der Dozenten, Altklausuren, fremde PDFs) kommen nicht in dieses öffentliche Repo. Prüfungen
liegen nur in der geschlossenen Ablage (Supabase, mit Login).

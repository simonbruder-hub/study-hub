# study-hub

Ablage für Formelsammlungen, Probeprüfungen und alte Prüfungen, dazu später ein vernetztes Formelbuch mit Simulationen
und Lernhilfen. Für das Studium, mit Fokus Elektrotechnik. Studentenprojekt, Arbeitsname.

Stand: Die Ablage ist gebaut (Aufgabe 2): Login mit der Mail-Adresse für Studierende, Stöbern nach Studiengang,
Semester und Modul, Ansicht im Browser, Hochladen, Moderation mit Wasserzeichen, Melden und Einschätzung von
Probeprüfungen. Sie wartet auf die Einrichtung von Supabase ([`supabase/README.md`](supabase/README.md)). Als
Nächstes das Formelbuch (Aufgabe 3).

Website: <https://simonbruder-hub.github.io/study-hub/>, sobald GitHub Pages eingeschaltet ist.

| Datei | Inhalt |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Kurzanleitung für Claude: Arbeitsweise, Befehle, Stolpersteine |
| [`docs/BRIEFING.md`](docs/BRIEFING.md) | Master-Briefing, Ergänzungen und Vorschläge |
| [`docs/AUFGABEN.md`](docs/AUFGABEN.md) | Arbeitsweise, Entscheide, offene Fragen, Aufgaben |
| [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md) | Datenmodell, Relationen, Ablage mit Wasserzeichen, Aufbau des Frontends |
| [`src/`](src), [`web/`](web) | App (Vite, Preact, TypeScript, PWA); die Ablage liegt in `src/vault/` |
| [`supabase/`](supabase) | Schema der Ablage, Einrichtung, Tests der Regeln |
| [`inhalt/`](inhalt) | Formel-Knoten (Markdown mit YAML-Kopf), Grössen, Themen, Module, Analogien |
| [`schema/`](schema) | JSON-Schemas zu den Inhalten |
| [`scripts/inhalt.mjs`](scripts/inhalt.mjs) | Prüfung der Inhalte, erzeugt die Daten für das Formelbuch |
| [`tests/e2e/`](tests/e2e) | Abläufe der Ablage im Browser (Playwright, Demo ohne Server) |

Neuer Chat mit Claude: «Mach Aufgabe N aus docs/AUFGABEN.md.» Claude liest dazu `CLAUDE.md` automatisch.

## Entwickeln

```bash
npm ci
npm run dev        # App unter http://localhost:5175; Ablage mit .env.local, siehe supabase/README.md
npm run dev:demo   # Ablage ohne Server, mit Beispieldaten (Code 123456)
```

## Prüfen

```bash
npm run inhalt     # Inhalte: Schema, Verweise, Kreise, Analogien, LaTeX, Schreibregeln
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

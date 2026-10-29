# Study Hub: Hinweise für Claude

Diese Datei lädt in jedem Chat automatisch. Kurz halten, nur Orientierung; Details stehen in `docs/`.

**Projekt:** Ablage für Formelsammlungen, Probeprüfungen und alte Prüfungen (Supabase, mit Login), danach ein
vernetztes Formelbuch (statisch, offline). Studentenprojekt von Simon, öffentliches Repo, Website auf GitHub Pages.
Stack: Vite, Preact mit Signals, TypeScript, PWA, Hash-Routing; Supabase (Postgres, Auth mit Code, Storage);
pdf-lib, PDF.js 6, KaTeX 0.18.

**Neuer Chat:** «Mach Aufgabe N aus docs/AUFGABEN.md.» Dort stehen Stand, Entscheide und Aufgaben. Es gilt zuerst
`docs/AUFGABEN.md`, dann `docs/ARCHITEKTUR.md`, dann `docs/BRIEFING.md` (nur bei Bedarf lesen, ist Vorgeschichte).

## Arbeitsweise

- Deutsch, kein scharfes S, keine Gedankenstriche, auch in Code, Commits und PRs (`src/schreibregeln.test.ts` prüft
  das Repo). Kurz erklären: Simon studiert Elektrotechnik, kennt Python und LaTeX, wenig Webentwicklung.
- Erst gezielte Fragen zu Unklarem, dann ein kurzer Plan, dann umsetzen. Eigener Branch und PR, CI grün machen,
  mergen erst nach Simons OK. Simon mergt mit Merge-Commit.
- Tokens sparen: nur lesen, was die Aufgabe braucht (Tabelle unten), grosse Dateien abschnittsweise. Lokal die
  betroffenen Tests, die volle Prüfung macht die CI.
- Am Ende: in `docs/AUFGABEN.md` die erledigte Aufgabe auf eine Zeile mit PR kürzen, neue Entscheide eintragen; diese
  Datei nachführen, wenn sich Befehle, Ordner oder Stolpersteine ändern.
- Inhalte von Dritten (Vorlagen der Dozenten, Prüfungen, fremde PDFs) nie ins Repo.

## Wo was steht

| Pfad | Inhalt |
|---|---|
| `src/vault/` | Ablage: `api.ts` (Schnittstelle), `supabaseApi.ts`, `demoApi.ts` (Beispieldaten), Ansichten, `watermark.ts` |
| `supabase/schema.sql` | Tabellen, Regeln, Funktionen, Speicher; `supabase/test/` prüft alles; `supabase/README.md` Einrichtung |
| `inhalt/`, `schema/`, `scripts/inhalt.mjs` | Formelbuch: Knoten und Register, JSON-Schemas, Prüfung |
| `docs/ARCHITEKTUR.md` | 1 Inhalte, 2 Relationen, 3 Ablage, 4 Frontend, 5 nächste Aufgaben |
| `tests/e2e/` | Playwright gegen Demo-Build (`dist/demo`) und Produktions-Build ohne Supabase (`dist/app`) |

## Befehle

```bash
npm ci
npm run dev             # http://localhost:5175; Ablage braucht .env.local (supabase/README.md)
npm run dev:demo        # Ablage ohne Server: Code 123456, admin@students.example.ch ist Admin
npm run typecheck && npm test        # TypeScript, Unit-Tests, Schreibregeln
npm run inhalt          # Inhalte des Formelbuchs prüfen
npm run db:test         # Regeln der Ablage gegen PostgreSQL 16
npm run build && npm run build:demo && PW_CHROMIUM=/opt/pw-browsers/chromium npm run test:e2e
```

## Stolpersteine in der Cloud

- PR erstellen: `gh api repos/simonbruder-hub/study-hub/pulls -f title=... -f head=... -f base=main -F body=@datei`
  (`gh pr create` geht nicht). CI-Logs sind gesperrt; Fehler stehen in den Annotations:
  `gh api repos/simonbruder-hub/study-hub/check-runs/<id>/annotations`.
- Neuer Branch: zusätzlich `git config --add remote.origin.fetch +refs/heads/<branch>:refs/remotes/origin/<branch>`,
  sonst meldet der Stop-Hook ihn als nicht gepusht.
- `pkill` nur in einem eigenen Aufruf und mit Klammer im Muster: `pkill -f "vite previe[w]"`.
- Unicode-Escapes (Backslash, u, vier Hexziffern) nicht mit dem Write-Werkzeug schreiben, es macht echte Zeichen
  daraus; solche Stellen per Skript schreiben.
- Supabase ist aus der Cloud nicht erreichbar, heruntergeladene Programme (z. B. PostgREST) dürfen nicht laufen: die
  Anbindung ist erst mit dem echten Projekt testbar.
- Chromium der Cloud verwirft Dateinamen mit Umlauten beim Herunterladen (die App schreibt sie darum aus).
- `.npmrc` mit `legacy-peer-deps=true`, sonst bricht npm beim Auflösen von Vitest 5 ab.
- Repo-Einstellungen (Pages, Variablen, Branch-Schutz) macht Simon in GitHub.

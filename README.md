# study-hub

Vernetztes Formelbuch, Prüfungs-Formelsammlungen, Simulationen und Lernhilfen für das Studium, mit Fokus
Elektrotechnik. Studentenprojekt, Arbeitsname.

Stand: Architektur und Datenmodell stehen (Aufgabe 1), dazu vier Beispielknoten mit Prüfung in der CI. Noch keine
App. Als Nächstes die Ablage für Formelsammlungen und Prüfungen (Aufgabe 2).

| Datei | Inhalt |
|---|---|
| [`docs/BRIEFING.md`](docs/BRIEFING.md) | Master-Briefing, Ergänzungen und Vorschläge |
| [`docs/AUFGABEN.md`](docs/AUFGABEN.md) | Arbeitsweise, Entscheide, offene Fragen, Aufgaben |
| [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md) | Datenmodell, Relationen, Tresor mit Wasserzeichen, Aufbau des Frontends |
| [`inhalt/`](inhalt) | Formel-Knoten (Markdown mit YAML-Kopf), Grössen, Themen, Module, Analogien |
| [`schema/`](schema) | JSON-Schemas zu den Inhalten |
| [`scripts/inhalt.mjs`](scripts/inhalt.mjs) | Prüfung der Inhalte, erzeugt die Daten für die App |

Startsatz für einen neuen Chat: «Lies README.md, docs/BRIEFING.md und docs/AUFGABEN.md und mach Aufgabe N.»

## Inhalte prüfen

```bash
npm ci
npm run inhalt     # Schema, Verweise, Kreise, Analogien, LaTeX, Schreibregeln
npm test           # Tests der Prüfung
npm run inhalt -- --json dist/inhalt.json   # zusätzlich die Daten für die App schreiben
```

Verwandt: [`simonbruder-hub/apps`](https://github.com/simonbruder-hub/apps) mit Taktwerk, Kochbuch und dem
Lernlabor, das in dieses Projekt umzieht.

Inhalte von Dritten (Vorlagen der Dozenten, Altklausuren, fremde PDFs) kommen nicht in dieses öffentliche Repo.

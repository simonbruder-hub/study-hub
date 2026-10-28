# Master-Briefing: Vernetzte Formel-, Simulations- und Dokumenten-App (Study Hub)

> Originaltext von Simon vom 27.10.2026, nur als Markdown formatiert. Ergänzungen, Entscheide und Vorschläge
> stehen weiter unten. Was gilt, wenn sich etwas widerspricht: zuerst die Entscheide in `AUFGABEN.md`.

## 1. Kontext & Zielsetzung

Ich erweitere meine bestehende Web-Plattform um eine Web-App für Studierende (Fokus Ingenieurwissenschaften /
Elektrotechnik). Die App kombiniert vier Bereiche:

1. Ein interaktives, themenübergreifendes Formelbuch (Knowledge Graph).
2. Einen Generator für massgeschneiderte Prüfungs-Formelsammlungen.
3. Interaktive Lernhilfen (eingebettete Schaltungssimulationen, KI-Prompts, Videos).
4. Einen Community-Dokumenten-Tresor für alte Prüfungen und Unterrichtsmaterial inklusive Kopierschutz.

## 2. Kernprinzip: Single Source of Truth (Keine Redundanz)

Im Studium wiederholen sich Formeln über verschiedene Semester, Schwierigkeitsgrade und Disziplinen hinweg (oft wird
in verschiedenen Fächern mit derselben Mathematik gerechnet, nur mit anderen Variablennamen, z. B. elektrisch vs.
thermisch vs. mechanisch).

- Jede Formel bzw. jedes Konzept wird als atomarer Knoten (`FormulaNode`) nur ein einziges Mal in der Datenbank
  gespeichert.
- Über Relationen und Tags wird dieser Knoten verschiedenen Fächern, Niveaustufen (Grundlagen, Vertiefung,
  Spezialisierung) und interdisziplinären Analogien zugeordnet.

## 3. Die vier Hauptmodule (Views & Features)

### A) Explorer-Modus (Das vernetzte Formelbuch)

- Hierarchische und vernetzte Ansicht. Nutzer starten bei den Grundlagen und können schrittweise in die Vertiefung
  und Spezialisierung aufklappen.
- Querverweise zeigen sofort auf, welche Grundlagen-Formeln als Vorwissen nötig sind (`prerequisites`) und wo exakt
  dieselbe mathematische Struktur in anderen Disziplinen auftaucht (`analogies`).
- Schnelles Rendering der mathematischen Ausdrücke im Browser über `KaTeX`.

### B) Prüfungs-Modus (Formelsammlungs-Generator)

- Filterung nach einem spezifischen Modul/Fach oder einer eigenen Auswahl.
- Die App zieht alle relevanten `FormulaNodes` zusammen und präsentiert sie extrem kompakt in einem druckbereiten
  Grid-Layout (optimiert für CSS `@media print`), komplett ohne den Lern-Ballast.

### C) Simulations- & Lern-Modus

Jeder Formel-Knoten kann optionale interaktive Erweiterungen enthalten:

- Schaltungssimulation: Einbettung von CircuitJS (Falstad) per `iframe`. Der Schaltungsaufbau wird als Text-String in
  der Datenbank beim jeweiligen Knoten gespeichert und per URL-Parameter live geladen.
- Visuelle Regler: Platzhalter für interaktive Graphen (z. B. `JSXGraph` oder `Plotly.js`), um Parameter per Slider
  zu verändern.
- One-Click KI-Prompt: Ein Button kopiert einen dynamisch zusammengesetzten Lern-Prompt (inkl. der aktuellen
  LaTeX-Formel und des Niveaus) in die Zwischenablage, damit der Nutzer sich von einer KI abfragen lassen kann.
- Externe Links: Verweise auf YouTube-Videos, Skript-Seiten oder NotebookLM-Notizbücher.

### D) Dokumenten-Tresor & Community-Uploads (Alte Prüfungen & Skripte)

- Nutzer können PDF-Dokumente (Altklausuren, eigene Zusammenfassungen, Übungsblätter) im Browser ansehen, gezielt
  ausdrucken und eigene Dateien hochladen.
- Vernetzungs-Clou: Hochgeladene Prüfungen werden nicht nur einem Modul zugeordnet, sondern direkt mit den
  `FormulaNodes` verknüpft, die zur Lösung dieser Prüfung benötigt werden.

## 4. Sicherheit, Quellen-Pflicht & Kopierschutz für Dokumente

Damit niemand die Sammlung automatisiert kopiert und Quellen immer sichtbar bleiben, müssen folgende Mechanismen in
die Architektur integriert werden:

- Pflicht-Metadaten beim Upload: Upload nur möglich mit vollständiger Quellenangabe (Autor/Ersteller, Semester/Jahr,
  Modul, Dokumententyp/Lizenz).
- Automatisches PDF-Watermarking (`pdf-lib`): Beim Upload oder beim Generieren der Druckversion brennt das System
  automatisch eine Fusszeile / ein dezentes Wasserzeichen auf jede PDF-Seite (z. B. "Quelle: [Autor/Modul] |
  Bereitgestellt über [Plattform-Name]").
- In-Browser-Viewing & Anti-Scraping: Standardmässige Anzeige über einen eingebetteten Viewer (`PDF.js`), ohne dass
  die Rohdatei sofort heruntergeladen werden muss.
- Rate-Limiting: Begrenzung der Downloads/Druck-Aktionen pro Nutzer und Stunde im Backend, um Massen-Downloads durch
  Skripte zu verhindern.
- Moderations-Workflow: Uploads von Studierenden erhalten zuerst den Status `pending` und werden erst nach Freigabe
  durch den Admin (`approved`) öffentlich sichtbar.

## 5. Anforderungen an das Datenmodell (Entwurf)

Bitte entwirf ein sauberes Datenbankschema (relational oder dokumentenbasiert, passend zu meinem Stack) für mindestens
diese zwei Haupt-Entitäten und deren Verknüpfungen:

- `FormulaNode`: `id`, `title`, `latex_expression`, `variables` (Symbol, Einheit, Bedeutung), `level`
  (1=Grundlagen, 2=Vertiefung, 3=Spezialisierung), `disciplines`, `modules`, `prerequisites` (Array von Node-IDs),
  `analogies` (Array von Node-IDs), `learning_resources` (Falstad-String, Video-URLs, Prompt-Template).
- `DocumentNode`: `id`, `title`, `file_url`, `document_type` (Altklausur, Skript, Zusammenfassung),
  `source_metadata` (Autor, Jahr, Hochschule/Dozent), `module_id`, `linked_formula_ids` (Array von
  `FormulaNode`-IDs), `status` (`pending`, `approved`), `upload_date`.

## 6. Arbeitsauftrag (Schritt 1)

Bitte schreibe noch keinen kompletten UI-Code. Liefere mir zuerst:

1. Das ausgearbeitete Datenbankschema inklusive der Relationen.
2. Einen Architektur-Vorschlag für den File-Storage und die `pdf-lib` Watermarking-Pipeline.
3. Eine saubere Komponenten-Struktur für das Frontend.

### Drei Fragen zum Schärfen vor dem Start (aus dem Briefing)

1. Druck-Engine für Formelsammlungen: Browser-Druck mit `KaTeX` und CSS oder ein echter LaTeX-Compiler im
   Hintergrund? (Empfehlung im Briefing: Browser-Print mit KaTeX spart enorm viel Server-Aufwand.)
2. Backend & Speicher: Gibt es schon eine Datenbank mit Datei-Speicher (z. B. Supabase, Firebase, eigener Server mit
   PostgreSQL/S3) oder läuft alles lokal im Browser? Für die PDF-Uploads anderer braucht es zwingend Cloud-Speicher.
3. Zugangsschutz: Alte Prüfungen für alle offen sichtbar oder ein einfacher Login (Einladungscode,
   Hochschul-Mailadresse), um bei Dozenten-Unterlagen urheberrechtlich auf der sicheren Seite zu bleiben?

---

## Ergänzungen von Simon (27. und 28.10.2026)

- Die bestehende Simulations-App (Lernlabor im Repo `apps`) kann angepasst oder mit dem neuen Projekt verschmolzen
  werden, je nachdem, was sinnvoller ist.
- Für den Theorie-Teil dienen Vorlagen der Dozenten als Ausgangspunkt. Sie sollen auf weitere Module ausgeweitet und
  auf einen einheitlichen, höheren Standard gebracht werden. Die Dozenten haben einen Standard, aber noch nicht auf
  dem gewünschten Niveau.
- Die Dozenten simulieren oft mit PLECS oder Simulink. Das gefällt, braucht aber klare Planung und eine gemeinsame
  Sprache, einen Standard. Nicht jedes Modul braucht dieselben Programme, das muss die Struktur abbilden.
- Zuerst ein paar Themen als Grundlage nehmen und schauen, was geht. Danach das Ganze Experten vorlegen: Was ist noch
  anzupassen, sind wir auf dem richtigen Weg?
- Vorerst für Simon selbst und als Erfahrungssammlung, ein Studentenprojekt.
- Eigenständiges Projekt mit eigener Website, unabhängig von den bisherigen Apps.

## Antworten und Vorschläge (Claude, 28.10.2026)

Die Entscheide stehen in `AUFGABEN.md`. Hier die Vorschläge zu den offenen Fragen. In Aufgabe 1 bestätigt, Punkt 2
als Markdown mit YAML-Kopf statt reinem YAML; ausgearbeitet in `ARCHITEKTUR.md`:

1. **Druck:** Browser-Druck mit KaTeX und CSS `@media print`, wie im Briefing empfohlen. KaTeX nutzt das Lernlabor
   schon. Später optional ein Export als `.tex` für Overleaf, die Formeln sind ja ohnehin LaTeX.
2. **Formel-Knoten als Dateien im Repo** statt in einer Datenbank: eine Datei pro Knoten (z. B. YAML mit LaTeX).
   Das ist die Single Source of Truth mit Git-Verlauf und Review per PR. Die CI prüft, dass jede Formel mit KaTeX
   rendert, jeder Verweis existiert und die `prerequisites` keine Kreise bilden. Die App läuft so statisch und
   offline auf GitHub Pages. Gleiches Muster wie beim Kochbuch: eine Quelle, daraus die Daten der App.
3. **Simulationen:** ein gemeinsames Format pro Knoten mit einem Werkzeug-Feld, z. B. `lernlabor`, `falstad`,
   `python`, `plecs`, `simulink`. Im Browser laufen das Lernlabor und Python (Pyodide). PLECS- und Simulink-Modelle
   (kommerzielle Programme) liegen als Datei bei, dazu Bild der Schaltung, Parameter und Ergebnis-Plot. So wählt jedes
   Modul sein Werkzeug, die Beschreibung bleibt gleich.
4. **Lernlabor statt Falstad:** Der eigene Simulator (MNA, Oszilloskop, Zeiger, Frequenzgang, IEC-Zeichen) ersetzt
   das Falstad-`iframe`. Falstad höchstens für Bauteile, die noch fehlen (Diode, Transistor, Operationsverstärker).
5. **Backend:** Bis und mit Explorer, Prüfungs-Modus und Lernhilfen braucht es keinen Server. Erst der
   Dokumenten-Tresor braucht Speicher, Login und Freigabe, dafür ein eigenes Supabase-Projekt (Supabase ist bei
   Taktwerk schon im Einsatz).
6. **Urheberrecht:** Repo und Website sind öffentlich. Darum kommen Vorlagen der Dozenten, Altklausuren und fremde
   PDFs nicht ins Repo. Die Vorlagen dienen als Grundlage und werden in eigenen Worten und im eigenen Standard neu
   geschrieben, mit Quellenangabe. Die Originale bleiben lokal.
7. **Kopierschutz ehrlich:** Was der Browser anzeigt, lässt sich immer kopieren. Login, Wasserzeichen, Rate-Limit und
   Freigabe schrecken ab und machen Quellen sichtbar, verhindern aber nichts ganz.

# Inhalte schreiben

Anleitung für Formel-Knoten im Formelbuch: Ablauf, Gliederung, Formeln und die unterstützte Teilmenge von MyST.
Das Datenmodell (Felder im Kopf, Register) steht in `ARCHITEKTUR.md`, Abschnitt 1.

## Ablauf

1. Datei anlegen: `inhalt/knoten/<thema>/<id>.md`, am einfachsten mit der Vorlage unten. Das Thema muss in
   `inhalt/themen.yaml` stehen, die ID besteht nur aus `a-z`, `0-9` und `-`.
2. Mit `npm run dev` arbeiten: Die Seite lädt nach jedem Speichern neu, Fehler zeigt sie mit Datei und Zeile.
3. Vor dem Commit `npm run inhalt`. Die CI prüft dasselbe und dazu im Browser, dass jede Formel im Druck in drei
   Spalten passt.

Vorlagen der Dozenten sind die Grundlage, aber nur in eigenen Worten und mit eigenen Beispielen. Beruht ein Knoten
auf einer Vorlage, gehört sie unter `sources` (Titel, Dozentin oder Dozent, Jahr). Die Vorlage selbst kommt nie ins
Repo.

## Gliederung (eigener Standard)

| Teil | Pflicht | Inhalt |
|---|---|---|
| Einleitung | ja | 1 bis 3 Sätze ohne Überschrift: was die Formel sagt |
| `## Herleitung` | | kurz, gern mit nummerierten Formeln |
| `## Gültigkeit` | ja | wann die Formel gilt und wann nicht, Zählpfeile, Grenzen |
| `## Beispiel` | ja | Aufgabe mit Zahlen, Lösung in `:::{dropdown} Lösung` |
| `## Typische Fehler` | | was beim Rechnen oft schiefgeht |
| `## Übungen` | | Aufgaben, jede Lösung aufklappbar; mehrere gern als Tabs |

Die Prüfung meldet fehlende Pflichtteile, unbekannte Abschnitte, eine falsche Reihenfolge, ein Beispiel oder Übungen
ohne aufklappbare Lösung und Überschriften mit `#` (der Titel steht im Kopf). Unterabschnitte mit `###` sind frei,
Hinweise wie `:::{note}` dürfen in jedem Teil stehen.

## Formeln

- Im Kopf ohne Dollarzeichen und in einfachen Anführungszeichen: `latex_expression: 'U = R \cdot I'`.
- Im Text `$...$`, abgesetzt `$$` auf eigenen Zeilen. Mit Marke nummeriert: `$$ ... $$ (marke)`, Verweis darauf mit
  `` {eq}`marke` ``. Ein Dollarzeichen als Text schreibt man `\$`.
- Einheiten aufrecht mit dünnem Abstand: `12\,\mathrm{V}`, `4{,}7\,\mathrm{k\Omega}`, `100\,\mu\mathrm{F}`.
- Dezimalkomma als `{,}`, sonst setzt LaTeX nach dem Komma einen Abstand.
- Indizes, die Wörter oder Abkürzungen sind, aufrecht: `R_\mathrm{ges}`. Keine Umlaute in Formeln.
- Imaginäre Einheit `\mathrm{j}`, komplexe Grössen unterstrichen (`\underline{U}`). Zeiger sind Effektivwertzeiger,
  Bezug ist der Cosinus.
- Hauptformel und `forms` kommen in die Formelsammlung. Ist eine zu breit für drei Spalten, meldet das der Test im
  Browser: kürzer schreiben oder auf zwei Formen aufteilen.

## MyST-Teilmenge

| Schreibweise | Ergebnis |
|---|---|
| `:::{note}` Text `:::` | Hinweis; ebenso `tip`, `hint`, `important`, `seealso`, `attention`, `caution`, `warning`, `danger`, `error` |
| `:::{note} Eigener Titel` | Hinweis mit eigenem Titel; `:::{admonition} Titel` für einen neutralen Kasten |
| `:class: dropdown` (Zeile nach dem Kopf) | Hinweis zum Aufklappen |
| `:::{dropdown} Lösung` | aufklappbar; mit `:open:` zu Beginn offen |
| `::::{tab-set}` mit `:::{tab-item} Titel` | Tabs; `:selected:` wählt den offenen Tab |
| `:::{math}` mit `:label: marke` | abgesetzte Formel mit Nummer |
| `` {eq}`marke` `` | Nummer einer Formel, z. B. (1) |
| `` {k}`ohmsches-gesetz` `` | Link auf einen Knoten mit seinem Titel; eigener Text: `` {k}`dem Ohmschen Gesetz <ohmsches-gesetz>` `` |
| `` {math}`x^2` ``, `` {sub}`2` ``, `` {sup}`2` `` | Formel im Text, tief- und hochgestellt |
| `[Text](https://...)` | Link, öffnet in einem neuen Tab; erlaubt sind `https://` und Seiten der App (`#/...`) |
| Listen, Tabellen, **fett**, *kursiv* | wie in Markdown |

Statt `:::` gehen auch Backticks wie in Jupyter Book (```` ```{note} ````). Verschachtelt braucht die äussere
Direktive mehr Zeichen als die innere, zum Beispiel `:::::{tab-set}`, darin `::::{tab-item}`, darin
`:::{dropdown}`.

Noch nicht unterstützt, die Prüfung meldet es: Bilder und `{figure}` (eigene Schaltbilder folgen), Videos
(Aufgabe 6), Code-Zellen und Widgets aus Jupyter Book, eigenes HTML. Blöcke aus einer Vorlage also anpassen statt
nur einfügen.

## Vorlage

```markdown
---
title: Spannungsteiler
latex_expression: '\frac{U_2}{U} = \frac{R_2}{R_1 + R_2}'
forms:
  - '\frac{U_1}{U_2} = \frac{R_1}{R_2}'
level: 1
variables:
  - { symbol: U, quantity: spannung, meaning: Spannung am ganzen Teiler }
  - { symbol: 'U_2', quantity: spannung, meaning: Spannung an R2 }
  - { symbol: 'R_1', quantity: widerstand }
  - { symbol: 'R_2', quantity: widerstand }
modules: [ETG1]
prerequisites: [reihenschaltung]
sources:
  - { title: 'Vorlage ETG1, Kapitel 2', author: 'Name der Dozentin', year: 2026 }
---
Zwei Widerstände in Reihe teilen die Spannung im Verhältnis ihrer Widerstände.

## Gültigkeit

- Nur unbelastet. Mit einer Last $R_L$ gilt $R_2 \parallel R_L$ statt $R_2$.

## Beispiel

Aus $12\,\mathrm{V}$ sollen $3{,}3\,\mathrm{V}$ werden, mit $R_2 = 10\,\mathrm{k\Omega}$. Wie gross ist $R_1$?

:::{dropdown} Lösung
$$
R_1 = R_2 \cdot \frac{U_1}{U_2} = 26{,}4\,\mathrm{k\Omega}
$$
:::
```

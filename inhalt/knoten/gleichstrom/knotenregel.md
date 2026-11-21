---
title: Knotenregel (1. Kirchhoffsches Gesetz)
latex_expression: '\sum_{k=1}^{n} I_k = 0'
forms:
  - '\sum I_\mathrm{zu} = \sum I_\mathrm{ab}'
level: 1
variables:
  - { symbol: 'I_k', quantity: strom, meaning: 'Ströme am Knoten: zufliessend positiv, abfliessend negativ' }
modules: [ETG1]
---
In einem Knoten geht keine Ladung verloren, und es kommt keine dazu. Darum ist die Summe aller Ströme an einem
Knoten null, wenn man zufliessende positiv und abfliessende negativ zählt.

## Gültigkeit

- Für jeden Knoten und auch für jede geschlossene Hülle um einen Teil der Schaltung.
- Für Augenblickswerte immer, also auch bei Wechselstrom: $\sum i_k(t) = 0$, mit Zeigern $\sum \underline{I}_k = 0$.
- Nicht für eine einzelne Platte eines Kondensators, dort sammelt sich Ladung. Für eine Hülle um den ganzen
  Kondensator gilt die Regel wieder.

## Beispiel

In einen Knoten fliessen $I_1 = 3\,\mathrm{A}$ und $I_2 = 1{,}5\,\mathrm{A}$, heraus fliesst $I_3 = 2\,\mathrm{A}$.
Wie gross ist der vierte Strom $I_4$, dessen Zählpfeil vom Knoten weg zeigt?

:::{dropdown} Lösung
$$
I_1 + I_2 - I_3 - I_4 = 0 \quad\Rightarrow\quad I_4 = 3\,\mathrm{A} + 1{,}5\,\mathrm{A} - 2\,\mathrm{A} = 2{,}5\,\mathrm{A}
$$

$I_4 > 0$: Der Strom fliesst wirklich in Pfeilrichtung, also aus dem Knoten heraus.
:::

## Typische Fehler

- Vorzeichen nach Gefühl statt nach Zählpfeil vergeben. Zuerst alle Pfeile einzeichnen, dann die Gleichung
  aufstellen.
- Ein negatives Ergebnis für falsch halten: Es heisst nur, dass der Strom gegen den Pfeil fliesst.

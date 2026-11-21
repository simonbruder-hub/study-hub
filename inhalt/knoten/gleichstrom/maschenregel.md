---
title: Maschenregel (2. Kirchhoffsches Gesetz)
latex_expression: '\sum_{k=1}^{n} U_k = 0'
level: 1
variables:
  - { symbol: 'U_k', quantity: spannung, meaning: 'Spannungen einer Masche: in Umlaufrichtung positiv' }
modules: [ETG1]
---
Geht man in einer Schaltung einmal im Kreis herum (eine Masche) und kommt zum Ausgangspunkt zurück, ist die
Summe aller Spannungen null. Spannungen in Umlaufrichtung zählen positiv, Spannungen dagegen negativ.

## Gültigkeit

- Für jede geschlossene Masche, auch über offene Klemmen: Die Spannung zwischen den Klemmen gehört dann mit
  in die Summe.
- Für Augenblickswerte immer, auch bei Wechselstrom: $\sum u_k(t) = 0$, mit Zeigern $\sum \underline{U}_k = 0$.
- Nicht, wenn ein sich ändernder Magnetfluss die Masche selbst durchsetzt. In Schaltplänen steckt diese
  Wirkung in den Spulen, mit ihrer Spannung gilt die Regel wieder.

## Beispiel

Eine Quelle mit $U_q = 12\,\mathrm{V}$ speist zwei Widerstände in Reihe. Am ersten misst man
$U_1 = 4{,}5\,\mathrm{V}$. Wie gross ist $U_2$?

:::{dropdown} Lösung
Alle Spannungspfeile zeigen von Plus nach Minus. Beim Umlauf zeigen die Pfeile von $U_1$ und $U_2$ in
Umlaufrichtung, der Pfeil der Quelle dagegen:

$$
-U_q + U_1 + U_2 = 0 \quad\Rightarrow\quad U_2 = U_q - U_1 = 7{,}5\,\mathrm{V}
$$
:::

## Typische Fehler

- Das Vorzeichen aus dem Bauteil ablesen statt aus der Umlaufrichtung. Quelle oder Verbraucher spielt
  keine Rolle: Es zählt nur, ob der Pfeil mit oder gegen den Umlauf zeigt.

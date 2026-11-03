---
title: Ersatzspannungsquelle
latex_expression: 'U = U_q - R_i \cdot I'
forms:
  - 'R_i = \frac{U_q}{I_k}'
  - 'I = \frac{U_q}{R_i + R_L}'
level: 2
variables:
  - { symbol: U, quantity: spannung, meaning: Klemmenspannung }
  - { symbol: 'U_q', quantity: spannung, meaning: Quellenspannung (gleich der Leerlaufspannung) }
  - { symbol: 'R_i', quantity: widerstand, meaning: Innenwiderstand }
  - { symbol: I, quantity: strom, meaning: Laststrom }
  - { symbol: 'I_k', quantity: strom, meaning: Kurzschlussstrom }
  - { symbol: 'R_L', quantity: widerstand, meaning: Lastwiderstand }
modules: [ETG1]
prerequisites: [spannungsteiler, maschenregel]
---
Jede lineare Schaltung aus Quellen und Widerständen verhält sich an zwei Klemmen wie eine ideale Spannungsquelle
$U_q$ mit einem Innenwiderstand $R_i$ in Reihe. Je mehr Strom fliesst, desto mehr Spannung fällt an $R_i$ ab.

## Herleitung

Die beiden Kennwerte folgen aus zwei Messungen oder Rechnungen an den Klemmen:

1. Leerlauf ($I = 0$): Die Klemmenspannung ist die Quellenspannung, $U_0 = U_q$.
2. Kurzschluss ($U = 0$): Es fliesst der Kurzschlussstrom $I_k = U_q/R_i$.

Rechnerisch geht $R_i$ auch so: alle Spannungsquellen durch einen Kurzschluss ersetzen, alle Stromquellen
entfernen und den Widerstand zwischen den Klemmen bestimmen.

## Gültigkeit

- Nur für lineare Schaltungen (Widerstände und ideale Quellen). Mit Dioden oder Transistoren gilt sie nur in
  der Nähe eines Arbeitspunkts.
- Nur für das Verhalten an den Klemmen. Über die Verluste im Innern sagt das Ersatzbild nichts.

:::{note}
Gleichwertig ist die Ersatzstromquelle: der Kurzschlussstrom $I_k$ parallel zu $R_i$. Je nach Aufgabe ist das
eine oder das andere Bild bequemer.
:::

## Beispiel

Eine Batterie hat im Leerlauf $U_0 = 12{,}6\,\mathrm{V}$. Mit $I = 20\,\mathrm{A}$ belastet sinkt die
Klemmenspannung auf $U = 11{,}8\,\mathrm{V}$. Wie gross sind $R_i$ und der Kurzschlussstrom?

:::{dropdown} Lösung
$$
R_i = \frac{U_0 - U}{I} = \frac{0{,}8\,\mathrm{V}}{20\,\mathrm{A}} = 40\,\mathrm{m\Omega},
\qquad
I_k = \frac{U_0}{R_i} = 315\,\mathrm{A}
$$
:::

## Typische Fehler

- Den Kurzschlussstrom einer echten Quelle messen wollen: Das kann sie zerstören. Besser zwei Lastfälle messen
  und $R_i$ aus der Differenz rechnen.

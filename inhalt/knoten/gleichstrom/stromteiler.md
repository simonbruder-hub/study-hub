---
title: Stromteiler
latex_expression: '\frac{I_1}{I} = \frac{R_2}{R_1 + R_2} = \frac{G_1}{G_1 + G_2}'
forms:
  - '\frac{I_1}{I_2} = \frac{R_2}{R_1} = \frac{G_1}{G_2}'
level: 1
variables:
  - { symbol: I, quantity: strom, meaning: Gesamtstrom }
  - { symbol: 'I_1', quantity: strom, meaning: Strom durch R1 }
  - { symbol: 'I_2', quantity: strom, meaning: Strom durch R2 }
  - { symbol: 'R_1', quantity: widerstand }
  - { symbol: 'R_2', quantity: widerstand }
  - { symbol: 'G_1', quantity: leitwert, meaning: Leitwert von R1 }
  - { symbol: 'G_2', quantity: leitwert, meaning: Leitwert von R2 }
modules: [ETG1]
prerequisites: [parallelschaltung]
---
Zwei parallele Widerstände teilen den Strom umgekehrt zum Verhältnis ihrer Widerstände: Durch den kleineren
Widerstand fliesst der grössere Strom. Mit Leitwerten sieht die Formel aus wie beim {k}`spannungsteiler`.

## Gültigkeit

- Die Form mit $R_1$ und $R_2$ gilt für genau zwei Zweige. Bei mehr Zweigen: $I_k = I \cdot G_k/G_\mathrm{ges}$.
- Im Zähler steht der Widerstand des anderen Zweigs, aber der Leitwert des eigenen.

## Beispiel

Ein Messwerk mit $R_M = 50\,\Omega$ verträgt höchstens $1\,\mathrm{mA}$. Mit einem Widerstand $R_P$ parallel soll
es Ströme bis $I = 100\,\mathrm{mA}$ messen. Wie gross ist $R_P$?

:::{dropdown} Lösung
Durch $R_P$ fliessen $99\,\mathrm{mA}$, durch das Messwerk $1\,\mathrm{mA}$. Die Ströme verhalten sich
umgekehrt wie die Widerstände:

$$
R_P = R_M \cdot \frac{I_M}{I_P} = 50\,\Omega \cdot \frac{1\,\mathrm{mA}}{99\,\mathrm{mA}} = 0{,}505\,\Omega
$$
:::

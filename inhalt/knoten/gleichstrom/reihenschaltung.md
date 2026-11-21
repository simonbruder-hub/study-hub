---
title: Reihenschaltung von Widerständen
latex_expression: 'R_\mathrm{ges} = R_1 + R_2 + \dots + R_n'
forms:
  - 'U = U_1 + U_2 + \dots + U_n'
level: 1
variables:
  - { symbol: 'R_\mathrm{ges}', quantity: widerstand, meaning: Gesamtwiderstand }
  - { symbol: 'R_k', quantity: widerstand, meaning: Einzelwiderstände }
  - { symbol: U, quantity: spannung, meaning: Gesamtspannung }
  - { symbol: 'U_k', quantity: spannung, meaning: Teilspannungen }
modules: [ETG1]
prerequisites: [ohmsches-gesetz, maschenregel]
---
In einer Reihenschaltung fliesst durch alle Widerstände derselbe Strom. Die Teilspannungen addieren sich, darum
addieren sich auch die Widerstände.

## Herleitung

Mit der {k}`Maschenregel <maschenregel>` und dem {k}`Ohmschen Gesetz <ohmsches-gesetz>` für jeden Widerstand:

$$
U = U_1 + U_2 + \dots + U_n = (R_1 + R_2 + \dots + R_n)\, I = R_\mathrm{ges}\, I
$$

## Gültigkeit

- Nur, wenn wirklich derselbe Strom durch alle fliesst. Zweigt dazwischen Strom ab (Last, Messgerät), ist es
  keine reine Reihenschaltung mehr.
- Sinngemäss auch für Impedanzen: $\underline{Z}_\mathrm{ges} = \underline{Z}_1 + \underline{Z}_2 + \dots$

## Beispiel

$R_1 = 220\,\Omega$, $R_2 = 330\,\Omega$ und $R_3 = 1\,\mathrm{k\Omega}$ liegen in Reihe an $U = 12\,\mathrm{V}$.
Wie gross sind $R_\mathrm{ges}$, der Strom und die Spannung an $R_3$?

:::{dropdown} Lösung
$$
R_\mathrm{ges} = 1550\,\Omega, \qquad I = \frac{U}{R_\mathrm{ges}} = 7{,}74\,\mathrm{mA}, \qquad U_3 = R_3 \cdot I = 7{,}74\,\mathrm{V}
$$
:::

## Typische Fehler

- Der Gesamtwiderstand ist immer grösser als der grösste Einzelwiderstand. Ein kleineres Ergebnis zeigt einen
  Rechenfehler.

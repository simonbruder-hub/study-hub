---
title: Impedanz
latex_expression: '\underline{Z} = \frac{\underline{U}}{\underline{I}} = R + \mathrm{j}X'
forms:
  - '\underline{Z}_R = R'
  - '\underline{Z}_L = \mathrm{j}\omega L'
  - '\underline{Z}_C = \frac{1}{\mathrm{j}\omega C} = -\mathrm{j}\,\frac{1}{\omega C}'
level: 2
variables:
  - { symbol: '\underline{Z}', quantity: impedanz }
  - { symbol: '\underline{U}', quantity: spannung, meaning: Spannungszeiger }
  - { symbol: '\underline{I}', quantity: strom, meaning: Stromzeiger }
  - { symbol: R, quantity: widerstand, meaning: Wirkwiderstand (Realteil) }
  - { symbol: X, quantity: blindwiderstand, meaning: Blindwiderstand (Imaginärteil) }
  - { symbol: '\omega', quantity: kreisfrequenz }
  - { symbol: L, quantity: induktivitaet }
  - { symbol: C, quantity: kapazitaet }
modules: [ETG2]
prerequisites: [komplexe-zeiger, ohmsches-gesetz, kondensator, spule]
---
Die Impedanz ist das Ohmsche Gesetz für Wechselstrom: das Verhältnis von Spannungs- zu Stromzeiger. Ihr Betrag
sagt, wie stark der Strom begrenzt wird, ihr Winkel, um wie viel der Strom gegenüber der Spannung verschoben ist.

## Herleitung

Mit {k}`komplexen Zeigern <komplexe-zeiger>` wird aus $u = L\,\mathrm{d}i/\mathrm{d}t$ einfach
$\underline{U} = \mathrm{j}\omega L\,\underline{I}$, aus $i = C\,\mathrm{d}u/\mathrm{d}t$ wird
$\underline{I} = \mathrm{j}\omega C\,\underline{U}$. Das ergibt die Impedanzen von {k}`Spule <spule>` und
{k}`Kondensator <kondensator>`.

## Gültigkeit

- Nur für Sinusgrössen im eingeschwungenen Zustand.
- Impedanzen in Reihe addieren sich, parallel addieren sich die Admittanzen $\underline{Y} = 1/\underline{Z}$, genau
  wie bei Widerständen.
- $X > 0$: induktiv, der Strom eilt der Spannung nach. $X < 0$: kapazitiv, der Strom eilt vor.

## Beispiel

$R = 100\,\Omega$ und $L = 0{,}5\,\mathrm{H}$ liegen in Reihe an $230\,\mathrm{V}$, $50\,\mathrm{Hz}$. Wie gross
sind $\underline{Z}$, der Strom und die Phasenverschiebung?

:::{dropdown} Lösung
Mit $X_L = \omega L = 314\,\mathrm{s^{-1}} \cdot 0{,}5\,\mathrm{H} = 157\,\Omega$:

$$
\underline{Z} = (100 + \mathrm{j}\,157)\,\Omega = 186\,\Omega \cdot e^{\mathrm{j}57{,}5^\circ},
\qquad
I = \frac{U}{|\underline{Z}|} = \frac{230\,\mathrm{V}}{186\,\Omega} = 1{,}24\,\mathrm{A}
$$

Der Strom eilt der Spannung um $57{,}5^\circ$ nach.
:::

## Typische Fehler

- Beträge addieren: $|\underline{Z}_1 + \underline{Z}_2|$ ist nicht $|\underline{Z}_1| + |\underline{Z}_2|$.
- Vergessen, dass $1/\mathrm{j} = -\mathrm{j}$ ist.

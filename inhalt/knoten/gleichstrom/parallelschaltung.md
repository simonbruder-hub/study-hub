---
title: Parallelschaltung von Widerständen
latex_expression: 'G_\mathrm{ges} = G_1 + G_2 + \dots + G_n'
forms:
  - '\frac{1}{R_\mathrm{ges}} = \frac{1}{R_1} + \frac{1}{R_2} + \dots + \frac{1}{R_n}'
  - 'R_\mathrm{ges} = R_1 \parallel R_2 = \frac{R_1 R_2}{R_1 + R_2}'
level: 1
variables:
  - { symbol: 'G_\mathrm{ges}', quantity: leitwert, meaning: Gesamtleitwert }
  - { symbol: 'G_k', quantity: leitwert, meaning: Einzelleitwerte }
  - { symbol: 'R_\mathrm{ges}', quantity: widerstand, meaning: Gesamtwiderstand }
  - { symbol: 'R_k', quantity: widerstand, meaning: Einzelwiderstände }
modules: [ETG1]
prerequisites: [ohmsches-gesetz, knotenregel]
---
In einer Parallelschaltung liegt an allen Widerständen dieselbe Spannung. Die Ströme addieren sich, darum
addieren sich die Leitwerte. Der Gesamtwiderstand ist kleiner als der kleinste Einzelwiderstand.

## Herleitung

Mit der {k}`Knotenregel <knotenregel>` und $I_k = G_k \cdot U$ für jeden Zweig:

$$
I = I_1 + I_2 + \dots + I_n = (G_1 + G_2 + \dots + G_n)\, U = G_\mathrm{ges}\, U
$$

## Gültigkeit

- Nur, wenn alle Widerstände an denselben zwei Knoten hängen. Ein Widerstand in einer Zuleitung gehört nicht dazu.
- Produkt durch Summe gilt nur für zwei Widerstände. Bei drei und mehr über die Leitwerte rechnen.

## Beispiel

$R_1 = 100\,\Omega$ und $R_2 = 150\,\Omega$ liegen parallel an $U = 6\,\mathrm{V}$. Wie gross sind
$R_\mathrm{ges}$ und der Gesamtstrom?

:::{dropdown} Lösung
$$
R_\mathrm{ges} = \frac{100 \cdot 150}{100 + 150}\,\Omega = 60\,\Omega,
\qquad
I = \frac{U}{R_\mathrm{ges}} = 100\,\mathrm{mA}
$$

Kontrolle mit den Teilströmen: $60\,\mathrm{mA} + 40\,\mathrm{mA} = 100\,\mathrm{mA}$.
:::

## Übungen

:::::{tab-set}
::::{tab-item} Gleiche Widerstände
Drei gleiche Widerstände mit $R = 3\,\mathrm{k\Omega}$ liegen parallel. Wie gross ist $R_\mathrm{ges}$?

:::{dropdown} Lösung
$R_\mathrm{ges} = R/3 = 1\,\mathrm{k\Omega}$. Allgemein ergeben $n$ gleiche Widerstände parallel $R/n$.
:::
::::
::::{tab-item} Sehr ungleiche Widerstände
$R_1 = 10\,\Omega$ liegt parallel zu $R_2 = 10\,\mathrm{k\Omega}$. Schätze $R_\mathrm{ges}$ ohne Rechner.

:::{dropdown} Lösung
Knapp unter $10\,\Omega$ (genau $9{,}99\,\Omega$): Der grosse Widerstand führt kaum Strom und ändert fast nichts.
:::
::::
:::::

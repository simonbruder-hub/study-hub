---
title: Wärmewiderstand
latex_expression: '\Delta T = R_{th} \cdot \Phi'
forms:
  - 'R_{th} = \frac{d}{\lambda \cdot A}'
level: 1
variables:
  - { symbol: '\Delta T', quantity: temperaturdifferenz }
  - { symbol: 'R_{th}', quantity: waermewiderstand }
  - { symbol: '\Phi', quantity: waermestrom, meaning: 'Wärmestrom, z. B. die Verlustleistung eines Bauteils' }
  - { symbol: d, quantity: laenge, meaning: Dicke der Schicht }
  - { symbol: '\lambda', quantity: waermeleitfaehigkeit }
  - { symbol: A, quantity: flaeche, meaning: Fläche quer zum Wärmestrom }
modules: [LEL]
---
Wärme fliesst von warm nach kalt. Welche Temperaturdifferenz es für einen bestimmten Wärmestrom braucht, sagt
der Wärmewiderstand $R_{th}$. Gerechnet wird wie mit dem {k}`Ohmschen Gesetz <ohmsches-gesetz>`.

## Gültigkeit

- Im stationären Zustand, wenn sich die Temperaturen nicht mehr ändern. Für das Aufheizen siehe {k}`erwaermung`.
- Die Form mit $d$, $\lambda$ und $A$ gilt für eine ebene Schicht mit reiner Wärmeleitung. Für einen Kühlkörper
  an Luft gibt der Hersteller $R_{th}$ direkt an.
- Wärmewiderstände in Reihe addieren sich, zum Beispiel vom Chip über das Gehäuse und den Kühlkörper zur Luft.

## Beispiel

Ein Transistor setzt $P_V = 15\,\mathrm{W}$ in Wärme um. Von der Sperrschicht bis zur Luft liegen
$R_{th,JC} = 1{,}2\,\mathrm{K/W}$ (Gehäuse), $R_{th,CS} = 0{,}5\,\mathrm{K/W}$ (Wärmeleitpaste) und
$R_{th,SA} = 2{,}5\,\mathrm{K/W}$ (Kühlkörper) in Reihe. Die Luft hat $40\,^\circ\mathrm{C}$. Wie warm wird die
Sperrschicht?

:::{dropdown} Lösung
$$
\Delta T = (1{,}2 + 0{,}5 + 2{,}5)\,\mathrm{K/W} \cdot 15\,\mathrm{W} = 63\,\mathrm{K}
\quad\Rightarrow\quad
\vartheta_J = 40\,^\circ\mathrm{C} + 63\,\mathrm{K} = 103\,^\circ\mathrm{C}
$$

Das liegt unter den üblichen $150\,^\circ\mathrm{C}$ für Silizium, aber mit wenig Reserve, wenn die Umgebung
heisser wird.
:::

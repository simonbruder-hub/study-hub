---
title: Kondensator
latex_expression: 'i_C = C \cdot \frac{\mathrm{d}u_C}{\mathrm{d}t}'
forms:
  - 'Q = C \cdot U'
  - 'W = \tfrac{1}{2}\, C\, U^2'
level: 1
variables:
  - { symbol: 'i_C', quantity: strom, meaning: Strom in den Kondensator }
  - { symbol: 'u_C', quantity: spannung, meaning: Spannung am Kondensator }
  - { symbol: C, quantity: kapazitaet }
  - { symbol: t, quantity: zeit }
  - { symbol: Q, quantity: ladung, meaning: gespeicherte Ladung }
  - { symbol: U, quantity: spannung, meaning: Spannung am Kondensator (konstant) }
  - { symbol: W, quantity: energie, meaning: im elektrischen Feld gespeicherte Energie }
modules: [ETG1]
---
Ein Kondensator speichert Ladung, und zwar proportional zur Spannung. Strom fliesst nur, solange sich die
Spannung ändert: Je schneller sie sich ändert, desto grösser ist der Strom.

## Gültigkeit

- Für ideale Kondensatoren mit konstanter Kapazität. Echte haben Verluste (Leckstrom, Serienwiderstand), und
  Elektrolytkondensatoren sind gepolt.
- Verbraucher-Zählpfeilsystem: $i_C$ zeigt in die gleiche Richtung wie $u_C$.

:::{important}
Die Spannung an einem Kondensator kann nicht springen, dafür wäre ein unendlich grosser Strom nötig. Das ist der
Schlüssel zu allen {k}`Schaltvorgängen mit RC-Gliedern <rc-laden>`.
:::

## Beispiel

Ein Kondensator mit $C = 470\,\mu\mathrm{F}$ wird mit dem konstanten Strom $I = 10\,\mathrm{mA}$ geladen. Wie
schnell steigt die Spannung, und wie viel Energie ist bei $24\,\mathrm{V}$ gespeichert?

:::{dropdown} Lösung
$$
\frac{\mathrm{d}u_C}{\mathrm{d}t} = \frac{I}{C} = \frac{10\,\mathrm{mA}}{470\,\mu\mathrm{F}} = 21{,}3\,\frac{\mathrm{V}}{\mathrm{s}},
\qquad
W = \tfrac{1}{2} \cdot 470\,\mu\mathrm{F} \cdot (24\,\mathrm{V})^2 = 0{,}135\,\mathrm{J}
$$
:::

## Typische Fehler

- $Q = C \cdot U$ und $i = C\,\mathrm{d}u/\mathrm{d}t$ verwechseln: Das erste verbindet Ladung und Spannung, das
  zweite Strom und Spannungsänderung.

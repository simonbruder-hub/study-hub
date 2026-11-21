---
title: Spule
latex_expression: 'u_L = L \cdot \frac{\mathrm{d}i_L}{\mathrm{d}t}'
forms:
  - 'W = \tfrac{1}{2}\, L\, I^2'
level: 1
variables:
  - { symbol: 'u_L', quantity: spannung, meaning: Spannung an der Spule }
  - { symbol: 'i_L', quantity: strom, meaning: Strom durch die Spule }
  - { symbol: L, quantity: induktivitaet }
  - { symbol: t, quantity: zeit }
  - { symbol: I, quantity: strom, meaning: Strom durch die Spule (konstant) }
  - { symbol: W, quantity: energie, meaning: im Magnetfeld gespeicherte Energie }
modules: [ETG1]
---
Eine Spule speichert Energie im Magnetfeld und wehrt sich gegen jede Änderung des Stroms: Je schneller sich der
Strom ändert, desto grösser ist die Spannung an der Spule.

## Gültigkeit

- Für ideale Spulen mit konstanter Induktivität. Echte Spulen haben einen Drahtwiderstand, und mit Eisenkern
  hängt $L$ vom Strom ab (Sättigung).
- Verbraucher-Zählpfeilsystem: $u_L$ zeigt in die gleiche Richtung wie $i_L$.

:::{warning}
Der Strom durch eine Spule kann nicht springen. Unterbricht ein Schalter ihn trotzdem, wird
$\mathrm{d}i/\mathrm{d}t$ riesig und mit ihm die Spannung: Am Schalter entstehen Funken. Abhilfe schafft eine
Freilaufdiode parallel zur Spule.
:::

## Beispiel

Durch eine Spule mit $L = 20\,\mathrm{mH}$ steigt der Strom in $50\,\mu\mathrm{s}$ gleichmässig von null auf
$2\,\mathrm{A}$. Wie gross ist die Spannung dabei, und wie viel Energie ist danach gespeichert?

:::{dropdown} Lösung
$$
u_L = L\,\frac{\Delta i}{\Delta t} = 20\,\mathrm{mH} \cdot \frac{2\,\mathrm{A}}{50\,\mu\mathrm{s}} = 800\,\mathrm{V},
\qquad
W = \tfrac{1}{2} \cdot 20\,\mathrm{mH} \cdot (2\,\mathrm{A})^2 = 40\,\mathrm{mJ}
$$
:::

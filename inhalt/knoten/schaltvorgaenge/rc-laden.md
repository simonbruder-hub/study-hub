---
title: Laden eines Kondensators (RC)
latex_expression: 'u_C(t) = U_0 \left(1 - e^{-t/\tau}\right)'
forms:
  - '\tau = R \cdot C'
  - 'i(t) = \frac{U_0}{R}\, e^{-t/\tau}'
level: 2
variables:
  - { symbol: 'u_C', quantity: spannung, meaning: Spannung am Kondensator }
  - { symbol: 'U_0', quantity: spannung, meaning: Quellenspannung }
  - { symbol: i, quantity: strom, meaning: Ladestrom }
  - { symbol: R, quantity: widerstand }
  - { symbol: C, quantity: kapazitaet }
  - { symbol: t, quantity: zeit, meaning: Zeit ab dem Schalten }
  - { symbol: '\tau', quantity: zeit, meaning: Zeitkonstante }
modules: [et-grundlagen]
prerequisites: [ohmsches-gesetz]
learning_resources:
  simulations:
    - { tool: lernlabor, example: rc, title: 'RC: Laden und Entladen' }
---
Beim Einschalten ist der Kondensator leer ($u_C = 0$), der Strom springt auf $U_0/R$. Mit wachsender
Ladung steigt $u_C$ und der Strom nimmt ab.

Nach einer Zeitkonstante $\tau$ sind 63 % der Endspannung erreicht, nach $5\tau$ über 99 %. Die
Spannung am Kondensator springt nie, der Strom schon.

---
title: Wärmewiderstand
latex_expression: '\Delta T = R_{th} \cdot \Phi'
forms:
  - 'R_{th} = \frac{d}{\lambda \cdot A}'
level: 1
variables:
  - { symbol: '\Delta T', quantity: temperaturdifferenz }
  - { symbol: 'R_{th}', quantity: waermewiderstand }
  - { symbol: '\Phi', quantity: waermestrom }
  - { symbol: d, quantity: laenge, meaning: Dicke der Schicht }
  - { symbol: '\lambda', quantity: waermeleitfaehigkeit }
  - { symbol: A, quantity: flaeche, meaning: Fläche quer zum Wärmestrom }
---
Wärme fliesst vom warmen zum kalten Ende. Der Wärmestrom $\Phi$ ist proportional zur
Temperaturdifferenz, der Wärmewiderstand $R_{th}$ beschreibt, wie stark eine Schicht den Fluss bremst.

In der Leistungselektronik rechnet man so die Temperatur eines Halbleiters: Die Verlustleistung fliesst
über Gehäuse und Kühlkörper an die Luft, die Wärmewiderstände in Reihe addieren sich.

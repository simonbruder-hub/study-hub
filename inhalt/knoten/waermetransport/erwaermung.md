---
title: Erwärmung eines Körpers
latex_expression: '\Delta T(t) = R_{th} P_V \left(1 - e^{-t/\tau_{th}}\right)'
forms:
  - '\tau_{th} = R_{th} \cdot C_{th}'
level: 2
variables:
  - { symbol: '\Delta T', quantity: temperaturdifferenz, meaning: Übertemperatur gegenüber der Umgebung }
  - { symbol: 'P_V', quantity: waermestrom, meaning: zugeführte Verlustleistung }
  - { symbol: 'R_{th}', quantity: waermewiderstand, meaning: Wärmewiderstand zur Umgebung }
  - { symbol: 'C_{th}', quantity: waermekapazitaet }
  - { symbol: t, quantity: zeit, meaning: Zeit ab dem Einschalten }
  - { symbol: '\tau_{th}', quantity: zeit, meaning: thermische Zeitkonstante }
prerequisites: [waermewiderstand]
---
Ein Körper mit der Wärmekapazität $C_{th}$ bekommt ab $t = 0$ die Leistung $P_V$. Am Anfang geht fast
alles in die Erwärmung, später fliesst immer mehr über $R_{th}$ an die Umgebung ab.

Im Endzustand fliesst die ganze Leistung ab: $\Delta T_\infty = R_{th} P_V$. Wie beim RC-Glied ist nach
$5\tau_{th}$ der Endwert praktisch erreicht.

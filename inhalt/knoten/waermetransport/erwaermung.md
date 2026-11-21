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
modules: [LEL]
prerequisites: [waermewiderstand]
---
Bekommt ein Körper ab einem Zeitpunkt die konstante Verlustleistung $P_V$, steigt seine Temperatur nicht sofort
auf den Endwert. Zuerst geht fast alles in die Erwärmung der Masse, später fliesst immer mehr über $R_{th}$ an die
Umgebung ab.

## Gültigkeit

- Für einen Körper mit überall gleicher Temperatur und konstanten $R_{th}$, $C_{th}$ und $P_V$ (Einkörpermodell).
  Halbleiter bestehen aus mehreren Schichten, dafür geben Datenblätter eine Kurve $Z_{th}(t)$ an.
- Im Endzustand gilt der {k}`stationäre Wärmewiderstand <waermewiderstand>`: $\Delta T_\infty = R_{th} P_V$.
- Gleiche Mathematik wie beim {k}`Laden eines Kondensators <rc-laden>`: Nach etwa $5\tau_{th}$ ist der Endwert
  erreicht.

## Beispiel

Ein Kühlkörper mit $R_{th} = 1{,}5\,\mathrm{K/W}$ und $C_{th} = 120\,\mathrm{J/K}$ bekommt $P_V = 20\,\mathrm{W}$.
Wie warm wird er gegenüber der Umgebung, und wie lange dauert das?

:::{dropdown} Lösung
$$
\Delta T_\infty = R_{th} P_V = 30\,\mathrm{K}, \qquad \tau_{th} = R_{th} C_{th} = 180\,\mathrm{s}
$$

Nach $5\tau_{th} = 15\,\mathrm{min}$ ist die Endtemperatur praktisch erreicht. Nach 3 Minuten sind es erst 63 %
davon, also $19\,\mathrm{K}$.
:::

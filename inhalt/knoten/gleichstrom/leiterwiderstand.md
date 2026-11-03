---
title: Widerstand eines Leiters
latex_expression: 'R = \rho \cdot \frac{l}{A}'
forms:
  - 'R = \frac{l}{\kappa \cdot A}'
  - '\kappa = \frac{1}{\rho}'
level: 1
variables:
  - { symbol: R, quantity: widerstand }
  - { symbol: '\rho', quantity: spezifischer-widerstand }
  - { symbol: '\kappa', quantity: leitfaehigkeit }
  - { symbol: l, quantity: laenge, meaning: Länge des Leiters }
  - { symbol: A, quantity: flaeche, meaning: Querschnitt }
modules: [ETG1]
prerequisites: [ohmsches-gesetz]
---
Der Widerstand eines Drahts wächst mit seiner Länge und sinkt mit dem Querschnitt. Wie gut das Material
leitet, sagt der spezifische Widerstand $\rho$ oder sein Kehrwert, die Leitfähigkeit $\kappa$.

## Gültigkeit

- Für Leiter mit konstantem Querschnitt und gleichmässig verteiltem Strom, also bei Gleichstrom und tiefen
  Frequenzen. Bei hohen Frequenzen drängt der Strom an den Rand (Skineffekt), $R$ wird grösser.
- $\rho$ gilt für eine bestimmte Temperatur, meist $20\,^\circ\mathrm{C}$. Bei anderen Temperaturen siehe
  {k}`widerstand-temperatur`.

:::{tip}
Tabellen geben $\rho$ oft in $\Omega\,\mathrm{mm^2/m}$ an. Dann $l$ in Metern und $A$ in Quadratmillimetern
einsetzen. Kupfer: $\rho = 0{,}0178\,\Omega\,\mathrm{mm^2/m}$.
:::

## Beispiel

Eine Kupferleitung zu einem Verbraucher ist $l = 25\,\mathrm{m}$ lang, ihre Adern haben den Querschnitt
$A = 1{,}5\,\mathrm{mm^2}$. Wie gross ist der Widerstand von Hin- und Rückleiter zusammen?

:::{dropdown} Lösung
Hin und zurück sind es $2l = 50\,\mathrm{m}$:

$$
R = \rho \cdot \frac{2l}{A} = 0{,}0178\,\frac{\Omega\,\mathrm{mm^2}}{\mathrm{m}} \cdot \frac{50\,\mathrm{m}}{1{,}5\,\mathrm{mm^2}} = 0{,}59\,\Omega
$$
:::

## Typische Fehler

- Den Rückleiter vergessen: Der Strom fliesst durch zwei Adern, die Länge zählt doppelt.
- Den Durchmesser statt des Querschnitts einsetzen. Für einen runden Draht ist $A = \pi d^2/4$.

---
title: Einschalten einer Spule (RL)
latex_expression: 'i_L(t) = \frac{U_0}{R} \left(1 - e^{-t/\tau}\right)'
forms:
  - '\tau = \frac{L}{R}'
  - 'u_L(t) = U_0\, e^{-t/\tau}'
level: 2
variables:
  - { symbol: 'i_L', quantity: strom, meaning: Strom durch die Spule }
  - { symbol: 'u_L', quantity: spannung, meaning: Spannung an der Spule }
  - { symbol: 'U_0', quantity: spannung, meaning: Quellenspannung }
  - { symbol: R, quantity: widerstand, meaning: Widerstand im Kreis (mit dem Drahtwiderstand der Spule) }
  - { symbol: L, quantity: induktivitaet }
  - { symbol: t, quantity: zeit, meaning: Zeit ab dem Schalten }
  - { symbol: '\tau', quantity: zeit, meaning: Zeitkonstante }
modules: [ETG1]
prerequisites: [spule, ohmsches-gesetz]
---
Wird eine Spule über einen Widerstand an eine Gleichspannung geschaltet, steigt der Strom nicht sofort, sondern
exponentiell gegen den Endwert $U_0/R$. Die Spannung an der Spule springt auf $U_0$ und klingt ab.

## Herleitung

Die Maschenregel mit $u_L = L\,\mathrm{d}i_L/\mathrm{d}t$ ergibt

$$
U_0 = R\, i_L + L\,\frac{\mathrm{d}i_L}{\mathrm{d}t}
$$

Das ist dieselbe Gleichung wie beim {k}`Laden eines Kondensators <rc-laden>`, mit dem Strom an Stelle der
Spannung und $\tau = L/R$ an Stelle von $RC$.

## Gültigkeit

- Für eine anfangs stromlose Spule mit konstantem $L$, also ohne Sättigung des Kerns.
- Beim Ausschalten braucht der Strom einen Weg, sonst entsteht eine hohe Spannung (siehe {k}`spule`). Mit einer
  Freilaufdiode klingt er mit $i_L(t) = \frac{U_0}{R}\,e^{-t/\tau}$ ab.

## Beispiel

Ein Relais hat $L = 0{,}2\,\mathrm{H}$ und $R = 400\,\Omega$ und zieht bei $15\,\mathrm{mA}$ an. Wie lange nach dem
Einschalten an $U_0 = 12\,\mathrm{V}$ zieht es an?

:::{dropdown} Lösung
Der Endstrom ist $U_0/R = 30\,\mathrm{mA}$ und $\tau = L/R = 0{,}5\,\mathrm{ms}$. Die Hälfte des Endwerts ist
erreicht nach

$$
t = \tau \ln 2 = 0{,}35\,\mathrm{ms}
$$
:::

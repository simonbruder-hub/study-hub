---
title: Entladen eines Kondensators (RC)
latex_expression: 'u_C(t) = U_0\, e^{-t/\tau}'
forms:
  - '\tau = R \cdot C'
  - 'i(t) = -\frac{U_0}{R}\, e^{-t/\tau}'
level: 2
variables:
  - { symbol: 'u_C', quantity: spannung, meaning: Spannung am Kondensator }
  - { symbol: 'U_0', quantity: spannung, meaning: Spannung beim Schalten }
  - { symbol: i, quantity: strom, meaning: Strom in den Kondensator (beim Entladen negativ) }
  - { symbol: R, quantity: widerstand }
  - { symbol: C, quantity: kapazitaet }
  - { symbol: t, quantity: zeit, meaning: Zeit ab dem Schalten }
  - { symbol: '\tau', quantity: zeit, meaning: Zeitkonstante }
modules: [ETG1]
prerequisites: [rc-laden]
---
Ein auf $U_0$ geladener Kondensator entlädt sich über einen Widerstand. Spannung und Strom klingen mit derselben
Zeitkonstante $\tau = RC$ exponentiell ab.

## Gültigkeit

- Für die Entladung über einen festen Widerstand ohne Quelle. Mit Quelle siehe {k}`rc-laden`.
- Das Minuszeichen beim Strom gilt im Verbraucher-Zählpfeilsystem am Kondensator: Beim Entladen fliesst der
  Strom aus ihm heraus.

## Beispiel

Ein Netzteil hat am Ausgang $C = 2200\,\mu\mathrm{F}$, geladen auf $U_0 = 48\,\mathrm{V}$. Ein Widerstand
$R = 22\,\mathrm{k\Omega}$ entlädt ihn nach dem Ausschalten. Wie lange dauert es, bis die Spannung unter
$12\,\mathrm{V}$ liegt?

:::{dropdown} Lösung
Mit $\tau = RC = 48{,}4\,\mathrm{s}$ folgt aus $u_C(t) = U_0\,e^{-t/\tau}$:

$$
t = \tau \ln\frac{U_0}{u_C} = 48{,}4\,\mathrm{s} \cdot \ln 4 = 67\,\mathrm{s}
$$
:::

## Übungen

Nach welcher Zeit ist die Spannung auf die Hälfte gefallen?

:::{dropdown} Lösung
$t_{1/2} = \tau \ln 2 \approx 0{,}69\,\tau$, unabhängig von $U_0$.
:::

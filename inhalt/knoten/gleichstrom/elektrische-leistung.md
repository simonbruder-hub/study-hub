---
title: Elektrische Leistung
latex_expression: 'P = U \cdot I'
forms:
  - 'P = I^2 \cdot R = \frac{U^2}{R}'
  - 'W = P \cdot t'
level: 1
variables:
  - { symbol: P, quantity: leistung }
  - { symbol: U, quantity: spannung }
  - { symbol: I, quantity: strom }
  - { symbol: R, quantity: widerstand }
  - { symbol: W, quantity: energie, meaning: umgesetzte Energie }
  - { symbol: t, quantity: zeit, meaning: Dauer }
modules: [ETG1]
prerequisites: [ohmsches-gesetz]
---
Die Leistung sagt, wie viel Energie pro Zeit umgesetzt wird. In einem Zweipol ist sie das Produkt aus Spannung
und Strom. Bleibt sie über die Dauer $t$ konstant, ist die umgesetzte Energie $W = P \cdot t$.

## Gültigkeit

- $P = U \cdot I$ gilt für jeden Zweipol mit Gleichgrössen, die Formen mit $R$ nur für ohmsche Widerstände.
- Im Verbraucher-Zählpfeilsystem heisst $P > 0$: Der Zweipol nimmt Leistung auf. Bei $P < 0$ gibt er
  Leistung ab, er arbeitet als Quelle.
- Bei zeitlich veränderlichen Grössen gilt der Augenblickswert $p(t) = u(t) \cdot i(t)$ und $W = \int p\,\mathrm{d}t$.
  Für Wechselstrom siehe {k}`wechselstromleistung`.

## Beispiel

Ein Heizwiderstand nimmt an $24\,\mathrm{V}$ den Strom $5\,\mathrm{A}$ auf und heizt 10 Minuten lang. Wie
gross sind Leistung, Widerstand und Energie?

:::{dropdown} Lösung
$$
P = U I = 24\,\mathrm{V} \cdot 5\,\mathrm{A} = 120\,\mathrm{W},
\qquad
R = \frac{U}{I} = 4{,}8\,\Omega
$$

$$
W = P t = 120\,\mathrm{W} \cdot 600\,\mathrm{s} = 72\,\mathrm{kJ} = 0{,}02\,\mathrm{kWh}
$$
:::

## Typische Fehler

- $\mathrm{kW}$ und $\mathrm{kWh}$ verwechseln: Das eine ist eine Leistung, das andere eine Energie,
  $1\,\mathrm{kWh} = 3{,}6\,\mathrm{MJ}$.
- In $P = U^2/R$ die Spannung der Quelle einsetzen statt der Spannung am Widerstand.

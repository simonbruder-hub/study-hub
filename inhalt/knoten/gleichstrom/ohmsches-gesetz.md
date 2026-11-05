---
title: Ohmsches Gesetz
latex_expression: 'U = R \cdot I'
forms:
  - 'I = \frac{U}{R} = G \cdot U'
  - 'G = \frac{1}{R}'
level: 1
variables:
  - { symbol: U, quantity: spannung }
  - { symbol: R, quantity: widerstand }
  - { symbol: I, quantity: strom }
  - { symbol: G, quantity: leitwert }
modules: [ETG1]
sources:
  - { title: 'Lernlabor, Theorie Gleichstrom', url: 'https://simonbruder-hub.github.io/apps/lernlabor/app/' }
---
An einem linearen Widerstand ist der Strom proportional zur Spannung. Der Faktor dazwischen ist der
Widerstand $R$, sein Kehrwert heisst Leitwert $G$.

## Gültigkeit

- Nur für lineare Bauteile: $R$ hängt nicht von Strom, Spannung oder Temperatur ab. Die Kennlinie $I(U)$
  ist dann eine Gerade durch den Ursprung mit der Steigung $G$.
- Im Verbraucher-Zählpfeilsystem: Spannungs- und Strompfeil zeigen in die gleiche Richtung. Zeigen sie
  gegeneinander, gilt $U = -R \cdot I$.
- Glühlampe, Diode oder Varistor sind nichtlinear. Dort beschreibt $R = U/I$ nur einen einzelnen Arbeitspunkt.

:::{note}
Das Gesetz gilt auch für Augenblickswerte, $u(t) = R \cdot i(t)$. Für Spulen und Kondensatoren bei
Wechselstrom wird daraus die {k}`impedanz`.
:::

## Beispiel

An einem Widerstand $R = 470\,\Omega$ liegt $U = 12\,\mathrm{V}$. Wie gross sind Strom und Leitwert?

:::{dropdown} Lösung
$$
I = \frac{U}{R} = \frac{12\,\mathrm{V}}{470\,\Omega} = 25{,}5\,\mathrm{mA},
\qquad
G = \frac{1}{R} = 2{,}13\,\mathrm{mS}
$$
:::

## Typische Fehler

- Vorsilben falsch verrechnen: $\mathrm{k\Omega} \cdot \mathrm{mA}$ ergibt $\mathrm{V}$, aber
  $\mathrm{k\Omega} \cdot \mathrm{A}$ ergibt $\mathrm{kV}$.
- Den Zählpfeil vergessen: Das Vorzeichen von $I$ hängt von der gewählten Richtung ab.

## Übungen

Ein Widerstand nimmt bei $U = 5\,\mathrm{V}$ den Strom $I = 2\,\mathrm{mA}$ auf. Wie gross ist $R$?

:::{dropdown} Lösung
$R = U/I = 5\,\mathrm{V} / 2\,\mathrm{mA} = 2{,}5\,\mathrm{k\Omega}$
:::

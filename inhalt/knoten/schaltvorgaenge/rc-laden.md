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
modules: [ETG1]
prerequisites: [ohmsches-gesetz, kondensator]
learning_resources:
  simulations:
    - { tool: lernlabor, example: rc, title: 'RC: Laden und Entladen' }
---
Ein leerer Kondensator wird über einen Widerstand an die Gleichspannung $U_0$ geschaltet. Seine Spannung steigt
zuerst schnell, dann immer langsamer gegen $U_0$. Der Strom springt auf $U_0/R$ und klingt dann ab.

## Herleitung

Die Maschenregel mit $i = C\,\mathrm{d}u_C/\mathrm{d}t$ ergibt eine Differentialgleichung erster Ordnung:

$$
U_0 = R C\,\frac{\mathrm{d}u_C}{\mathrm{d}t} + u_C
$$ (dgl)

Mit dem Anfangswert $u_C(0) = 0$ ist die Lösung von {eq}`dgl` die Formel oben. Die Zeitkonstante $\tau = RC$
ist die Zeit, nach der $u_C$ den Endwert erreichen würde, wenn die Spannung mit der Anfangssteigung weiterstiege.

## Gültigkeit

- Für einen anfangs leeren Kondensator. Ist er schon auf $U_A$ geladen, gilt
  $u_C(t) = U_0 + (U_A - U_0)\,e^{-t/\tau}$.
- Für eine ideale Quelle. Ihr Innenwiderstand gehört mit zu $R$.

:::{tip}
Merkwerte: Nach $\tau$ sind 63 % erreicht, nach $3\tau$ 95 %, nach $5\tau$ über 99 %. Nach $5\tau$ gilt der
Vorgang als abgeschlossen.
:::

## Beispiel

$R = 10\,\mathrm{k\Omega}$, $C = 100\,\mu\mathrm{F}$, $U_0 = 5\,\mathrm{V}$. Wie gross ist $u_C$ nach
$0{,}5\,\mathrm{s}$, und wann ist der Kondensator praktisch voll?

:::{dropdown} Lösung
Mit $\tau = RC = 1\,\mathrm{s}$:

$$
u_C(0{,}5\,\mathrm{s}) = 5\,\mathrm{V} \cdot \left(1 - e^{-0{,}5}\right) = 1{,}97\,\mathrm{V}
$$

Praktisch voll ist er nach $5\tau = 5\,\mathrm{s}$.
:::

## Typische Fehler

- $\tau$ in Millisekunden ausrechnen und $t$ in Sekunden einsetzen. Zuerst alles in Grundeinheiten umrechnen.
- $e^{-t/\tau}$ und $1 - e^{-t/\tau}$ verwechseln: Beim Laden startet $u_C$ bei null, also mit $1 - e^{-t/\tau}$.

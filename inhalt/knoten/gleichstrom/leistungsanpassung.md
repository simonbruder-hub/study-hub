---
title: Leistungsanpassung
latex_expression: 'P_\mathrm{max} = \frac{U_q^2}{4 R_i} \quad \text{bei} \quad R_L = R_i'
forms:
  - 'P_L = U_q^2 \cdot \frac{R_L}{(R_i + R_L)^2}'
  - '\eta = \frac{R_L}{R_i + R_L}'
level: 2
variables:
  - { symbol: 'P_\mathrm{max}', quantity: leistung, meaning: grösste Leistung an der Last }
  - { symbol: 'P_L', quantity: leistung, meaning: Leistung an der Last }
  - { symbol: 'U_q', quantity: spannung, meaning: Quellenspannung }
  - { symbol: 'R_i', quantity: widerstand, meaning: Innenwiderstand }
  - { symbol: 'R_L', quantity: widerstand, meaning: Lastwiderstand }
  - { symbol: '\eta', quantity: wirkungsgrad }
modules: [ETG1]
prerequisites: [ersatzspannungsquelle, elektrische-leistung]
---
Eine Quelle mit Innenwiderstand gibt die grösste Leistung ab, wenn der Lastwiderstand gleich gross ist wie der
Innenwiderstand. Der Wirkungsgrad ist dann aber nur 50 %: Die Hälfte der Leistung bleibt in der Quelle.

## Herleitung

Leistung an der Last mit dem Strom $I = U_q/(R_i + R_L)$:

$$
P_L = I^2 R_L = U_q^2\,\frac{R_L}{(R_i + R_L)^2}
$$ (pl)

Ableiten nach $R_L$ und null setzen:
$\dfrac{\mathrm{d}P_L}{\mathrm{d}R_L} = U_q^2\,\dfrac{R_i - R_L}{(R_i + R_L)^3} = 0$, also $R_L = R_i$.
Eingesetzt in {eq}`pl` folgt $P_\mathrm{max} = U_q^2/(4R_i)$.

## Gültigkeit

- Wenn $R_i$ gegeben ist und $R_L$ frei gewählt wird. Ist umgekehrt $R_L$ fest, ist ein möglichst kleines $R_i$
  immer am besten.
- Sinnvoll in der Nachrichtentechnik, wo kleine Signale möglichst viel Leistung übertragen sollen. In der
  Energietechnik nie: Dort zählt der Wirkungsgrad, also $R_L \gg R_i$.

## Beispiel

Eine Quelle hat $U_q = 10\,\mathrm{V}$ und $R_i = 50\,\Omega$. Wie gross ist die grösste Leistung an einer Last,
und wie viel bekommt eine Last mit $R_L = 200\,\Omega$?

:::{dropdown} Lösung
$$
P_\mathrm{max} = \frac{(10\,\mathrm{V})^2}{4 \cdot 50\,\Omega} = 0{,}5\,\mathrm{W},
\qquad
P_L = 100\,\mathrm{V^2} \cdot \frac{200\,\Omega}{(250\,\Omega)^2} = 0{,}32\,\mathrm{W}
$$

Dafür steigt der Wirkungsgrad von 50 % auf $\eta = 200/250 = 80\,\%$.
:::

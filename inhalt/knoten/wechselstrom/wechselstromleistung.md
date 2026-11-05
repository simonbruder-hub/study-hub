---
title: Leistung bei Wechselstrom
latex_expression: '\underline{S} = \underline{U}\, \underline{I}^{*} = P + \mathrm{j}Q'
forms:
  - 'P = U I \cos\varphi'
  - 'Q = U I \sin\varphi'
  - 'S = U I = \sqrt{P^2 + Q^2}'
  - '\lambda = \frac{P}{S}'
level: 2
variables:
  - { symbol: '\underline{S}', quantity: scheinleistung, meaning: komplexe Leistung }
  - { symbol: S, quantity: scheinleistung }
  - { symbol: P, quantity: leistung, meaning: Wirkleistung }
  - { symbol: Q, quantity: blindleistung }
  - { symbol: '\underline{U}', quantity: spannung, meaning: Spannungszeiger }
  - { symbol: '\underline{I}^{*}', quantity: strom, meaning: konjugiert komplexer Stromzeiger }
  - { symbol: U, quantity: spannung, meaning: Effektivwert der Spannung }
  - { symbol: I, quantity: strom, meaning: Effektivwert des Stroms }
  - { symbol: '\varphi', quantity: phasenwinkel, meaning: Phasenverschiebung zwischen Spannung und Strom }
  - { symbol: '\lambda', quantity: leistungsfaktor }
modules: [ETG2]
prerequisites: [impedanz, effektivwert, elektrische-leistung]
---
Bei Wechselstrom pendelt ein Teil der Energie zwischen der Quelle und den Spulen oder Kondensatoren hin und her.
Nur die Wirkleistung $P$ wird umgesetzt, zum Beispiel in Wärme. Die Blindleistung $Q$ belastet trotzdem die
Leitungen, und auf die Scheinleistung $S$ müssen Leitungen und Transformatoren ausgelegt sein.

## Gültigkeit

- Für sinusförmige Spannung und sinusförmigen Strom, mit Effektivwerten und $\varphi = \varphi_u - \varphi_i$.
- Verbraucher-Zählpfeilsystem: $Q > 0$ heisst induktiv, $Q < 0$ kapazitiv.
- Bei verzerrten Strömen (Gleichrichter, Netzteile) kommt die Verzerrungsleistung $D$ dazu,
  $S^2 = P^2 + Q^2 + D^2$. Der Leistungsfaktor $\lambda = P/S$ ist dann kleiner als $\cos\varphi$.

## Beispiel

Ein Motor nimmt an $230\,\mathrm{V}$ den Strom $6\,\mathrm{A}$ bei $\cos\varphi = 0{,}8$ (induktiv) auf. Wie gross
sind $S$, $P$ und $Q$?

:::{dropdown} Lösung
Mit $\sin\varphi = \sqrt{1 - 0{,}8^2} = 0{,}6$:

$$
S = U I = 1380\,\mathrm{VA}, \qquad P = S \cos\varphi = 1104\,\mathrm{W}, \qquad Q = S \sin\varphi = 828\,\mathrm{var}
$$
:::

## Typische Fehler

- In $\underline{S} = \underline{U}\,\underline{I}^{*}$ die Konjugation vergessen: Dann stimmt das Vorzeichen von
  $Q$ nicht.
- Die Einheiten zur Kontrolle nutzen: $\mathrm{W}$ für $P$, $\mathrm{var}$ für $Q$, $\mathrm{VA}$ für $S$.

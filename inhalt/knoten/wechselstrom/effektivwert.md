---
title: Effektivwert
latex_expression: 'U = \sqrt{\frac{1}{T} \int_0^T u^2(t)\, \mathrm{d}t}'
forms:
  - 'U = \frac{\hat{u}}{\sqrt{2}} \quad \text{(Sinus)}'
level: 1
variables:
  - { symbol: U, quantity: spannung, meaning: Effektivwert }
  - { symbol: u, quantity: spannung, meaning: Augenblickswert }
  - { symbol: '\hat{u}', quantity: spannung, meaning: Amplitude }
  - { symbol: T, quantity: zeit, meaning: Periodendauer }
  - { symbol: t, quantity: zeit }
modules: [ETG2]
prerequisites: [sinusgroesse, elektrische-leistung]
---
Der Effektivwert einer Wechselspannung ist die Gleichspannung, die in einem Widerstand dieselbe mittlere Leistung
umsetzt. Darum rechnet man mit Effektivwerten wie mit Gleichgrössen, zum Beispiel $P = U^2/R$.

## Herleitung

Die mittlere Leistung im Widerstand ist $\overline{p} = \frac{1}{T}\int_0^T \frac{u^2}{R}\,\mathrm{d}t$.
Gleichgesetzt mit $U^2/R$ ergibt das die Formel oben. Für $u = \hat{u}\cos\omega t$ ist der Mittelwert von
$\cos^2$ genau $\tfrac{1}{2}$, also $U = \hat{u}/\sqrt{2}$.

## Gültigkeit

- Die Definition mit dem Integral gilt für jede periodische Kurve, der Faktor $\sqrt{2}$ nur für Sinus. Rechteck
  mit $\pm\hat{u}$: $U = \hat{u}$; Dreieck: $U = \hat{u}/\sqrt{3}$.
- Für den Strom gilt alles genauso: $I = \hat{\imath}/\sqrt{2}$.
- Einfache Messgeräte zeigen nur bei Sinus den richtigen Effektivwert. Für andere Kurven braucht es ein Gerät
  mit «True RMS».

## Beispiel

An der Steckdose liegen $230\,\mathrm{V}$ (Effektivwert). Wie gross ist der Scheitelwert, und welche Leistung
nimmt ein Heizwiderstand mit $52{,}9\,\Omega$ auf?

:::{dropdown} Lösung
$$
\hat{u} = \sqrt{2} \cdot 230\,\mathrm{V} = 325\,\mathrm{V},
\qquad
P = \frac{U^2}{R} = \frac{(230\,\mathrm{V})^2}{52{,}9\,\Omega} = 1{,}0\,\mathrm{kW}
$$
:::

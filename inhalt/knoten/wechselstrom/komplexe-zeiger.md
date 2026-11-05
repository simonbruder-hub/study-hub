---
title: Komplexe Zeiger
latex_expression: '\underline{U} = U\, e^{\mathrm{j}\varphi_u}'
forms:
  - 'u(t) = \sqrt{2}\, U \cos(\omega t + \varphi_u)'
  - 'u(t) = \mathrm{Re}\left\{\sqrt{2}\, \underline{U}\, e^{\mathrm{j}\omega t}\right\}'
  - '\underline{U} = U \cos\varphi_u + \mathrm{j}\, U \sin\varphi_u'
level: 2
variables:
  - { symbol: u, quantity: spannung, meaning: Augenblickswert }
  - { symbol: U, quantity: spannung, meaning: Effektivwert (Betrag des Zeigers) }
  - { symbol: '\underline{U}', quantity: spannung, meaning: komplexer Effektivwertzeiger }
  - { symbol: '\omega', quantity: kreisfrequenz }
  - { symbol: t, quantity: zeit }
  - { symbol: '\varphi_u', quantity: phasenwinkel, meaning: Nullphasenwinkel }
modules: [ETG2]
prerequisites: [sinusgroesse, effektivwert]
---
Sinusgrössen gleicher Frequenz lassen sich als komplexe Zahlen darstellen: Der Betrag ist der Effektivwert, der
Winkel der Nullphasenwinkel. Aus Ableiten und Integrieren werden so Multiplizieren und Dividieren mit
$\mathrm{j}\omega$.

## Herleitung

Nach Euler ist $\cos x = \mathrm{Re}\{e^{\mathrm{j}x}\}$. Der Faktor $e^{\mathrm{j}\omega t}$ ist für alle Grössen
der Schaltung gleich und fällt aus der Rechnung heraus, übrig bleibt der ruhende Zeiger $\underline{U}$. Ableiten
nach der Zeit wird zur Multiplikation mit $\mathrm{j}\omega$:

$$
\frac{\mathrm{d}u}{\mathrm{d}t} \;\Longleftrightarrow\; \mathrm{j}\omega\, \underline{U}
$$

## Gültigkeit

- Nur für Sinusgrössen derselben Frequenz im eingeschwungenen Zustand. Für Schaltvorgänge braucht es die
  Differentialgleichung.
- Hier mit Effektivwertzeigern und dem Cosinus als Bezug. Manche Unterlagen nehmen Amplitudenzeiger
  $\hat{\underline{u}}$ (ohne $\sqrt{2}$) oder den Sinus. Nicht mischen.
- In der Elektrotechnik heisst die imaginäre Einheit $\mathrm{j}$, weil $i$ schon für den Strom steht.

## Beispiel

$u(t) = 325\,\mathrm{V} \cdot \cos(\omega t + 30^\circ)$. Wie lautet der Zeiger in Polar- und in Komponentenform?

:::{dropdown} Lösung
Mit $U = 325\,\mathrm{V}/\sqrt{2} = 230\,\mathrm{V}$:

$$
\underline{U} = 230\,\mathrm{V} \cdot e^{\mathrm{j}30^\circ} = (199 + \mathrm{j}\,115)\,\mathrm{V}
$$
:::

## Typische Fehler

- Den Scheitelwert als Betrag nehmen, obwohl mit Effektivwertzeigern gerechnet wird.
- Zeiger verschiedener Frequenzen addieren: Das geht nur im Zeitbereich.

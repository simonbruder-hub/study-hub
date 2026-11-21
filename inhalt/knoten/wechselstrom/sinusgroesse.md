---
title: Sinusförmige Wechselgrössen
latex_expression: 'u(t) = \hat{u} \cos(\omega t + \varphi_u)'
forms:
  - '\omega = 2\pi f = \frac{2\pi}{T}'
level: 1
variables:
  - { symbol: u, quantity: spannung, meaning: Augenblickswert }
  - { symbol: '\hat{u}', quantity: spannung, meaning: Amplitude (Scheitelwert) }
  - { symbol: '\omega', quantity: kreisfrequenz }
  - { symbol: t, quantity: zeit }
  - { symbol: '\varphi_u', quantity: phasenwinkel, meaning: Nullphasenwinkel }
  - { symbol: f, quantity: frequenz }
  - { symbol: T, quantity: zeit, meaning: Periodendauer }
modules: [ETG2]
---
Im Wechselstromnetz ändern Spannung und Strom ihren Wert periodisch wie eine Cosinusfunktion. Drei Kennwerte
beschreiben eine solche Grösse vollständig: Amplitude $\hat{u}$, Kreisfrequenz $\omega$ und Nullphasenwinkel
$\varphi_u$.

## Gültigkeit

- Nur für rein sinusförmige Grössen. Verzerrte Kurven, zum Beispiel der Strom eines Netzteils, sind eine Summe
  vieler Sinusschwingungen (Fourier-Reihe).
- Hier ist der Cosinus die Bezugsfunktion. Manche Unterlagen nehmen den Sinus, dann verschieben sich alle Winkel
  um $90^\circ$. Im Kurs nachsehen und nicht mischen.

## Beispiel

Die Netzspannung hat $f = 50\,\mathrm{Hz}$ und den Scheitelwert $\hat{u} = 325\,\mathrm{V}$. Wie gross sind $T$ und
$\omega$, und welchen Wert hat $u$ bei $t = 2\,\mathrm{ms}$, wenn $\varphi_u = 0$ ist?

:::{dropdown} Lösung
$$
T = \frac{1}{f} = 20\,\mathrm{ms}, \qquad \omega = 2\pi f = 314\,\mathrm{s^{-1}}
$$

$$
u(2\,\mathrm{ms}) = 325\,\mathrm{V} \cdot \cos\left(314\,\mathrm{s^{-1}} \cdot 2\,\mathrm{ms}\right) = 325\,\mathrm{V} \cdot \cos 36^\circ = 263\,\mathrm{V}
$$
:::

## Typische Fehler

- Den Taschenrechner im Gradmass lassen, obwohl $\omega t$ im Bogenmass steht.
- $f$ und $\omega$ verwechseln: $\omega$ ist $2\pi$-mal grösser.

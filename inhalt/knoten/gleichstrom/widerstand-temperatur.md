---
title: Widerstand und Temperatur
latex_expression: 'R_\vartheta = R_{20} \left(1 + \alpha_{20}\, \Delta\vartheta\right)'
forms:
  - '\Delta\vartheta = \vartheta - 20\,^\circ\mathrm{C}'
level: 2
variables:
  - { symbol: 'R_\vartheta', quantity: widerstand, meaning: Widerstand bei der Betriebstemperatur }
  - { symbol: 'R_{20}', quantity: widerstand, meaning: Widerstand bei 20 °C }
  - { symbol: '\alpha_{20}', quantity: temperaturkoeffizient, meaning: Temperaturkoeffizient bei 20 °C }
  - { symbol: '\Delta\vartheta', quantity: temperaturdifferenz, meaning: Erwärmung gegenüber 20 °C }
modules: [ETG1]
prerequisites: [leiterwiderstand]
---
Bei Metallen steigt der Widerstand mit der Temperatur, in einem begrenzten Bereich fast linear. Der
Temperaturkoeffizient $\alpha_{20}$ sagt, um welchen Anteil der Widerstand pro Kelvin Erwärmung zunimmt.

## Gültigkeit

- Linear nur in einem begrenzten Bereich, bei Kupfer etwa von $-50$ bis $+200\,^\circ\mathrm{C}$. Für grössere
  Bereiche kommt ein quadratisches Glied dazu: $R_\vartheta = R_{20}\left(1 + \alpha_{20}\Delta\vartheta + \beta_{20}\Delta\vartheta^2\right)$.
- Metalle haben $\alpha > 0$ (Kaltleiter). Kohle und viele Halbleiter haben $\alpha < 0$ (Heissleiter, NTC),
  dort ist der Verlauf stark nichtlinear.

## Beispiel

Eine Kupferwicklung hat bei $20\,^\circ\mathrm{C}$ den Widerstand $R_{20} = 12{,}0\,\Omega$. Wie gross ist er
im Betrieb bei $80\,^\circ\mathrm{C}$? Für Kupfer gilt $\alpha_{20} = 3{,}93 \cdot 10^{-3}\,\mathrm{K^{-1}}$.

:::{dropdown} Lösung
$$
R_{80} = 12{,}0\,\Omega \cdot \left(1 + 3{,}93 \cdot 10^{-3}\,\mathrm{K^{-1}} \cdot 60\,\mathrm{K}\right) = 14{,}8\,\Omega
$$

Der Widerstand steigt um rund 24 %.
:::

:::{note}
Umgekehrt misst man so die Temperatur einer Wicklung: Widerstand kalt und warm messen, dann nach
$\Delta\vartheta$ auflösen.
:::

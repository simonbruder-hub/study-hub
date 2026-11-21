---
title: Spannungsteiler
latex_expression: '\frac{U_2}{U} = \frac{R_2}{R_1 + R_2}'
forms:
  - '\frac{U_1}{U_2} = \frac{R_1}{R_2}'
level: 1
variables:
  - { symbol: U, quantity: spannung, meaning: Spannung am ganzen Teiler }
  - { symbol: 'U_1', quantity: spannung, meaning: Spannung an R1 }
  - { symbol: 'U_2', quantity: spannung, meaning: Spannung an R2 (Ausgang) }
  - { symbol: 'R_1', quantity: widerstand }
  - { symbol: 'R_2', quantity: widerstand }
modules: [ETG1]
prerequisites: [reihenschaltung]
---
Zwei Widerstände in Reihe teilen die Spannung im Verhältnis ihrer Widerstände. Die Spannung an einem Widerstand
ist sein Anteil am Gesamtwiderstand mal die Gesamtspannung.

## Herleitung

Durch beide Widerstände fliesst derselbe Strom $I = U/(R_1 + R_2)$, also ist
$U_2 = R_2 \cdot I = U \cdot R_2/(R_1 + R_2)$.

## Gültigkeit

- Nur unbelastet: Am Ausgang fliesst kein nennenswerter Strom ab. Eine Last $R_L$ liegt parallel zu $R_2$ und
  senkt $U_2$. Dann $R_2 \parallel R_L$ statt $R_2$ einsetzen.
- Faustregel: Ist die Last mindestens zehnmal grösser als $R_2$, ändert sie $U_2$ um weniger als 10 %.

## Beispiel

Aus $U = 12\,\mathrm{V}$ sollen $U_2 = 3{,}3\,\mathrm{V}$ werden, mit $R_2 = 10\,\mathrm{k\Omega}$. Wie gross muss
$R_1$ sein?

:::{dropdown} Lösung
Mit $U_1 = U - U_2 = 8{,}7\,\mathrm{V}$ und dem Verhältnis $U_1/U_2 = R_1/R_2$:

$$
R_1 = R_2 \cdot \frac{U_1}{U_2} = 10\,\mathrm{k\Omega} \cdot \frac{8{,}7\,\mathrm{V}}{3{,}3\,\mathrm{V}} = 26{,}4\,\mathrm{k\Omega}
$$

In der Normreihe E24 liegt $27\,\mathrm{k\Omega}$ am nächsten, das ergibt $U_2 = 3{,}24\,\mathrm{V}$.
:::

## Typische Fehler

- Den Teiler belasten und trotzdem mit der Formel für den unbelasteten Teiler rechnen.
- Das Verhältnis umdrehen: Am grösseren Widerstand liegt die grössere Spannung.

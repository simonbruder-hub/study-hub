import { describe, expect, it } from 'vitest';
import { renderMyst } from './myst.mjs';

const TITLES = { 'ohmsches-gesetz': 'Ohmsches Gesetz' };
const render = (src) => renderMyst(src, { id: 'test', title: (id) => TITLES[id] });

describe('MyST-Teilmenge', () => {
  it('Hinweise, aufklappbare Lösungen und Backticks wie in Jupyter Book', () => {
    const { html, errors } = render([
      ':::{note}', 'Text', ':::', '',
      ':::{warning} Eigener Titel', 'X', ':::', '',
      '```{dropdown}', 'Lösung', '```', '',
      ':::{tip}', ':class: dropdown', 'Y', ':::',
    ].join('\n'));
    expect(errors).toEqual([]);
    expect(html).toContain('<aside class="adm adm-note"><p class="adm-title">Hinweis</p>');
    expect(html).toContain('<p class="adm-title">Eigener Titel</p>');
    expect(html).toContain('<details class="dropdown"><summary>Lösung</summary>');
    expect(html).toContain('<details class="adm adm-tip"><summary class="adm-title">Tipp</summary>');
  });

  it('Tabs: offen ist das mit :selected:, sonst das erste; aussen mehr Doppelpunkte', () => {
    const { html, errors } = render([
      '::::{tab-set}', ':::{tab-item} A', 'eins', ':::', ':::{tab-item} B', ':selected:', 'zwei', ':::', '::::',
      '', '::::{tab-set}', ':::{tab-item} C', 'drei', ':::', '::::',
    ].join('\n'));
    expect(errors).toEqual([]);
    expect(html).toContain('id="tab-test-1-1"><label');
    expect(html).toContain('id="tab-test-1-2" checked><label class="tab-label" for="tab-test-1-2">B</label>');
    expect(html).toContain('name="tab-test-2" id="tab-test-2-1" checked>');
  });

  it('Formeln: mit Marke nummeriert, Verweis mit {eq}, auch als {math}-Direktive', () => {
    const { html, errors } = render([
      '$$', 'a = b', '$$ (eins)', '',
      ':::{math}', ':label: zwei', 'c = d', ':::', '',
      'Aus {eq}`zwei` und {eq}`eins`, im Text $x^2$ und {math}`y`, aber nicht \\$5.',
    ].join('\n'));
    expect(errors).toEqual([]);
    expect(html.match(/class="eq-no">\(\d\)/g)).toEqual(['class="eq-no">(1)', 'class="eq-no">(2)']);
    expect(html).toContain('<span class="eq-ref">(2)</span> und <span class="eq-ref">(1)</span>');
    expect(html.match(/<span class="katex">/g)).toHaveLength(4); // 2 im Text, 2 abgesetzt
    expect(html.match(/<span class="katex-display">/g)).toHaveLength(2);
    expect(html).toContain('aber nicht $5.');
  });

  it('Links auf Knoten mit {k}, Tiefstellen, Tabellen, externe Links in neuem Tab', () => {
    const { html, errors } = render('{k}`ohmsches-gesetz` und {k}`dem Gesetz <ohmsches-gesetz>`, H{sub}`2`O, [Quelle](https://example.org)\n\n| a |\n|---|\n| b |\n');
    expect(errors).toEqual([]);
    expect(html).toContain('<a href="#/k/ohmsches-gesetz">Ohmsches Gesetz</a> und <a href="#/k/ohmsches-gesetz">dem Gesetz</a>');
    expect(html).toContain('H<sub>2</sub>O');
    expect(html).toContain('<a href="https://example.org" target="_blank" rel="noopener">Quelle</a>');
    expect(html).toContain('<div class="table-wrap"><table>');
  });

  it('meldet Unbekanntes und Fehler mit der Zeile im Text', () => {
    const { errors, warnings } = render([
      ':::{foo}', 'x', ':::', // 0
      '{bar}`y` und [Link](http://x.ch) und ![Bild](a.png)', // 3
      'Preis 5 $ und $\\frac{1$', // 4, gleicher Absatz
      '', '{eq}`fehlt` und {k}`gibt-es-nicht`', // 6
      '', ':::{tab-item} A', 'x', ':::', // 8
      '', ':::{dropdown} L', ':offen:', 'Text', ':::', // 12
      '', ':::{note}', 'nie geschlossen', // 17
    ].join('\n'));
    const found = errors.map((e) => `${e.line}: ${e.msg}`);
    const expected = [
      [0, /^Direktive \{foo\} wird nicht unterstützt/], [3, /^Rolle \{bar\}/], [3, /^Link «http:\/\/x\.ch»/],
      [3, /^Bilder/], [4, /^Einzelnes \$/], [4, /^LaTeX rendert nicht/], [6, /^\{eq\}: Marke «fehlt»/],
      [6, /^\{k\}: Knoten «gibt-es-nicht»/], [8, /^\{tab-item\} gehört in ein \{tab-set\}/], [17, /^\{note\} ohne Abschluss/],
    ];
    for (const [line, re] of expected) expect(errors.some((e) => e.line === line && re.test(e.msg)), `${line} ${re}\n${found.join('\n')}`).toBe(true);
    expect(errors).toHaveLength(expected.length);
    expect(warnings.map((w) => `${w.line}: ${w.msg}`)).toEqual(['12: {dropdown}: Option :offen: wird nicht unterstützt']);
  });

  it('liefert die Gliederung für die Prüfung des Standards', () => {
    const { outline } = render('Einleitung.\n\n## Gültigkeit\n\nText\n\n## Beispiel\n\n:::{dropdown} Lösung\nx\n:::\n');
    expect(outline.map(({ heading, first, dropdowns }) => [heading, first, dropdowns])).toEqual([
      [null, 'paragraph_open', 0], ['Gültigkeit', 'paragraph_open', 0], ['Beispiel', 'directive_open', 1],
    ]);
  });
});

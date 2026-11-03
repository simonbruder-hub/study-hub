import { describe, expect, it } from 'vitest';
import { checkContent, readContent, splitFrontMatter } from './inhalt.mjs';

const base = readContent();
const OHM = 'knoten/gleichstrom/ohmsches-gesetz.md';
const RC = 'knoten/schaltvorgaenge/rc-laden.md';
const ANALOGIEN = 'analogien.yaml';

/** Ersetzt a durch b in einer Datei der echten Inhalte (a muss vorkommen) */
function edit(file, a, b) {
  const text = base.get(file);
  if (!text.includes(a)) throw new Error(`«${a}» steht nicht in ${file}`);
  return text.replace(a, b);
}
/** Behält den YAML-Kopf einer Datei und ersetzt den Text */
function withBody(file, body) {
  const text = base.get(file);
  return text.slice(0, text.indexOf('\n---\n', 4) + 5) + body;
}
/** Prüft die echten Inhalte mit geänderten Dateien (null löscht eine Datei) und gibt die Fehlertexte zurück */
function errorsWith(changes) {
  const files = new Map(base);
  for (const [file, text] of Object.entries(changes)) {
    if (text === null) files.delete(file);
    else files.set(file, text);
  }
  return checkContent(files).errors.map((e) => `${e.file}${e.line ? `:${e.line}` : ''}: ${e.msg}`);
}

describe('echte Inhalte', () => {
  const { errors, warnings, data } = checkContent(base);

  it('sind fehlerfrei und ohne Warnungen', () => {
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
    expect(Object.keys(data.nodes).length).toBeGreaterThan(0);
  });

  it('bekommen Thema, Fachgebiet, Rückverweise und Analogien abgeleitet', () => {
    const ohm = data.nodes['ohmsches-gesetz'];
    expect(ohm).toMatchObject({ topic: 'gleichstrom', discipline: 'elektrotechnik', file: `inhalt/${OHM}` });
    expect(ohm.required_by).toContain('rc-laden');
    expect(ohm.analogies).toContain('ohm-thermisch');
  });

  it('bringen Text und Formeln schon als HTML mit', () => {
    const ohm = data.nodes['ohmsches-gesetz'];
    expect(ohm.latex_html).toContain('class="katex"');
    expect(ohm.forms_html).toHaveLength(ohm.forms.length);
    expect(ohm.variables[0].symbol_html).toContain('class="katex"');
    expect(ohm.html).toContain('<h2>Gültigkeit</h2>');
    expect(ohm.html).toContain('<details class="dropdown"><summary>Lösung</summary>');
    expect(data.quantities.widerstand.unit_html).toContain('Ω');
    for (const n of Object.values(data.nodes)) expect(n.html, n.id).toMatch(/^<p>/);
  });
});

describe('Prüfung findet', () => {
  it('fehlende Module und Voraussetzungen', () => {
    const e = errorsWith({ [OHM]: edit(OHM, 'modules: [ETG1]', 'modules: [gibt-es-nicht]\nprerequisites: [fehlt-auch]') });
    expect(e.join('\n')).toMatch(/Modul «gibt-es-nicht» fehlt/);
    expect(e.join('\n')).toMatch(/Voraussetzung «fehlt-auch» gibt es nicht/);
  });

  it('Kreise in den Voraussetzungen', () => {
    const e = errorsWith({ [OHM]: edit(OHM, 'modules: [ETG1]', 'modules: [ETG1]\nprerequisites: [rc-laden]') });
    expect(e).toHaveLength(1);
    expect(e[0]).toMatch(/Kreis in den Voraussetzungen: (ohmsches-gesetz → rc-laden → ohmsches-gesetz|rc-laden → ohmsches-gesetz → rc-laden)/);
  });

  it('LaTeX, das nicht rendert, auch im Text mit Zeilennummer', () => {
    const text = edit(OHM, "'U = R \\cdot I'", "'U = \\frac{R'") + '\nFalsch: $\\sqrt{x$\n';
    const e = errorsWith({ [OHM]: text });
    expect(e).toHaveLength(2);
    expect(e[0]).toMatch(/latex_expression: LaTeX rendert nicht/);
    expect(e[1]).toMatch(new RegExp(`:${text.split('\n').length - 1}: Text: LaTeX rendert nicht`));
  });

  it('Verstösse gegen das Schema, mit deutschen Meldungen', () => {
    const e = errorsWith({ [OHM]: edit(OHM, 'level: 1', 'level: 4\nprerequisite: []') }).join('\n');
    expect(e).toMatch(/level: erlaubt sind nur: 1, 2, 3/);
    expect(e).toMatch(/unbekanntes Feld «prerequisite»/);
  });

  it('Modul-Kürzel wie in der Ablage', () => {
    const e = errorsWith({
      [OHM]: edit(OHM, 'modules: [ETG1]', 'modules: [ETG 1]'),
      [RC]: edit(RC, 'modules: [ETG1]', 'modules: [etg1]'),
    }).join('\n');
    expect(e).toMatch(/ohmsches-gesetz\.md: modules\.0: hat nicht die erwartete Form/);
    expect(e).toMatch(/rc-laden\.md: Modul «etg1» fehlt in module\.yaml/);
  });

  it('Verstösse gegen die Gliederung', () => {
    const body = '## Beispiel\n\nAufgabe ohne Lösung.\n\n## Gültigkeit\n\nText.\n\n## Grenzen\n\nText.\n\n# Titel\n';
    const e = errorsWith({ [OHM]: withBody(OHM, body) }).join('\n');
    expect(e).toMatch(/Gliederung: Einleitung fehlt/);
    expect(e).toMatch(/Beispiel: Lösung aufklappbar/);
    expect(e).toMatch(/«Gültigkeit» an falscher Stelle/);
    expect(e).toMatch(/Abschnitt «Grenzen» gibt es nicht/);
    expect(e).toMatch(/Überschrift mit # gibt es nicht/);
    const missing = errorsWith({ [OHM]: withBody(OHM, 'Nur eine Einleitung.\n') }).join('\n');
    expect(missing).toMatch(/Abschnitt «## Gültigkeit» fehlt/);
    expect(missing).toMatch(/Abschnitt «## Beispiel» fehlt/);
  });

  it('Fehler im Text mit der Zeile in der Datei', () => {
    const text = withBody(OHM, 'Einleitung mit {k}`gibt-es-nicht`.\n\n## Gültigkeit\n\n:::{foo}\nx\n:::\n');
    const first = text.split('\n').indexOf('Einleitung mit {k}`gibt-es-nicht`.') + 1;
    const e = errorsWith({ [OHM]: text });
    expect(e).toContain(`inhalt/${OHM}:${first}: Text: {k}: Knoten «gibt-es-nicht» gibt es nicht`);
    expect(e.some((x) => x.startsWith(`inhalt/${OHM}:${first + 4}: Text: Direktive {foo}`))).toBe(true);
  });

  it('Simulationen ohne Pflichtfeld des Werkzeugs', () => {
    const e = errorsWith({ [RC]: edit(RC, 'tool: lernlabor, example: rc,', 'tool: plecs,') }).join('\n');
    expect(e).toMatch(/simulations\.0: Feld «file» fehlt/);
  });

  it('falsche Zuordnung der Grössen in Analogien', () => {
    const e = errorsWith({ [ANALOGIEN]: edit(ANALOGIEN, '- [strom, waermestrom]', '- [strom, waermekapazitaet]') });
    expect(e.join('\n')).toMatch(/«waermewiderstand» hat keine Variable mit der Grösse «waermekapazitaet»/);
  });

  it('ungültige und doppelte IDs, falsche Ablage, fehlende Register', () => {
    const e = errorsWith({
      'knoten/gleichstrom/Gross.md': base.get(OHM),
      'knoten/waermetransport/ohmsches-gesetz.md': base.get(OHM),
      'knoten/ohne-thema.md': base.get(OHM),
      'module.yaml': null,
    }).join('\n');
    expect(e).toMatch(/ungültige ID «Gross»/);
    expect(e).toMatch(/ID «ohmsches-gesetz» gibt es schon/);
    expect(e).toMatch(/Knoten gehören nach knoten\/<thema>\/<id>\.md/);
    expect(e).toMatch(/module\.yaml: Datei fehlt/);
  });

  it('scharfes S und Gedankenstriche', () => {
    const e = errorsWith({ [OHM]: `${base.get(OHM)}Gro\u00dfe Ströme \u2013 kleine Spannung\n` }).join('\n');
    expect(e).toMatch(/scharfes S/);
    expect(e).toMatch(/Gedankenstrich/);
  });
});

describe('Hilfsfunktionen', () => {
  it('trennen YAML-Kopf und Text', () => {
    expect(splitFrontMatter('---\na: 1\n---\nText')).toEqual({ head: 'a: 1', body: 'Text' });
    expect(splitFrontMatter('kein Kopf')).toBeNull();
  });
});

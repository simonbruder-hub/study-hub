import { describe, expect, it } from 'vitest';
import { checkContent, mathInMarkdown, readContent, splitFrontMatter } from './inhalt.mjs';

const base = readContent();
const OHM = 'knoten/gleichstrom/ohmsches-gesetz.md';
const ANALOGIEN = 'analogien.yaml';

/** Ersetzt a durch b in einer Datei der echten Inhalte (a muss vorkommen) */
function edit(file, a, b) {
  const text = base.get(file);
  if (!text.includes(a)) throw new Error(`«${a}» steht nicht in ${file}`);
  return text.replace(a, b);
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
});

describe('Prüfung findet', () => {
  it('fehlende Module und Voraussetzungen', () => {
    const e = errorsWith({ [OHM]: edit(OHM, 'modules: [et-grundlagen]', 'modules: [gibt-es-nicht]\nprerequisites: [fehlt-auch]') });
    expect(e.join('\n')).toMatch(/Modul «gibt-es-nicht» fehlt/);
    expect(e.join('\n')).toMatch(/Voraussetzung «fehlt-auch» gibt es nicht/);
  });

  it('Kreise in den Voraussetzungen', () => {
    const e = errorsWith({ [OHM]: edit(OHM, 'modules: [et-grundlagen]', 'modules: [et-grundlagen]\nprerequisites: [rc-laden]') });
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

  it('Simulationen ohne Pflichtfeld des Werkzeugs', () => {
    const RC = 'knoten/schaltvorgaenge/rc-laden.md';
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

  it('finden $...$ und $$...$$, aber nicht in Code oder bei Beträgen in Franken', () => {
    const found = mathInMarkdown('a $x$ b $$y$$ `$z$` 5 $ und 6 $').map(([tex, display]) => [tex, display]);
    expect(found).toEqual([['y', true], ['x', false]]);
  });
});

import { describe, expect, it } from 'vitest';
import { byTopic, findModule, fold, moduleNodes, search } from './content';
import type { FormulaNode, Inhalt } from './types';

const node = (id: string, topic: string, title: string, extra: Partial<FormulaNode> = {}): FormulaNode => ({
  id, file: '', topic, discipline: 'et', title, level: 1, latex_expression: '', latex_html: '', forms: [], forms_html: [],
  variables: [], modules: [], prerequisites: [], required_by: [], analogies: [], learning_resources: {}, sources: [], html: '',
  ...extra,
});

const d: Inhalt = {
  disciplines: { et: { title: 'Elektrotechnik', topics: ['gs', 'wl'] } },
  topics: { gs: { title: 'Gleichstrom', discipline: 'et' }, wl: { title: 'Wärmelehre', discipline: 'et' } },
  quantities: { r: { name: 'Widerstand', symbol: 'R', unit: '\\Omega', symbol_html: '', unit_html: '' } },
  modules: { ETG1: { title: 'Grundlagen' } },
  analogies: {},
  nodes: {
    ohm: node('ohm', 'gs', 'Ohmsches Gesetz', { modules: ['ETG1'], variables: [{ symbol: 'R', quantity: 'r', symbol_html: '' }] }),
    rth: node('rth', 'wl', 'Wärmewiderstand', { latex_expression: '\\Delta T = R_{th} \\Phi' }),
  },
};

describe('Formelbuch-Daten', () => {
  it('suchen ohne Rücksicht auf Gross/klein und Umlaute, über Titel, Grössen und LaTeX', () => {
    expect(fold('Wärme ÖL Ampère')).toBe('waerme oel ampere');
    const ids = (q: string) => search(d, q).map((n) => n.id);
    expect(ids('')).toEqual(['ohm', 'rth']);
    expect(ids('waerme')).toEqual(['rth']);
    expect(ids('WIDERSTAND')).toEqual(['ohm', 'rth']);
    expect(ids('phi')).toEqual(['rth']);
    expect(ids('gleichstrom ohm')).toEqual(['ohm']);
  });

  it('finden Module wie die Ablage, ohne Rücksicht auf Gross/klein', () => {
    expect(findModule(d, 'etg1')).toBe('ETG1');
    expect(moduleNodes(d, 'etg1').map((n) => n.id)).toEqual(['ohm']);
    expect(moduleNodes(d, 'XYZ')).toEqual([]);
  });

  it('gruppieren nach Thema in der Reihenfolge der Daten', () => {
    expect(byTopic(Object.values(d.nodes)).map(([t, list]) => [t, list.length])).toEqual([['gs', 1], ['wl', 1]]);
  });
});

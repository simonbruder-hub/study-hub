/**
 * Inhalte prüfen und zusammenführen. Liest inhalt/ (Knoten als Markdown mit YAML-Kopf, dazu themen.yaml,
 * groessen.yaml, module.yaml und analogien.yaml), prüft Schema, Verweise, Kreise, Analogien, LaTeX und
 * Schreibregeln und erzeugt daraus die Daten für die App.
 *
 *   npm run inhalt                      nur prüfen
 *   npm run inhalt -- --json out.json   prüfen und die Daten schreiben
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import katex from 'katex';
import { parse as parseYaml } from 'yaml';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const REGISTRIES = ['themen', 'groessen', 'module', 'analogien'];

/** Alle Dateien unter inhalt/: Pfad mit «/» → Text (.md, .yaml) oder null (Bilder, Modelle) */
export function readContent(dir = join(ROOT, 'inhalt')) {
  const files = new Map();
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else files.set(relative(dir, p).split(sep).join('/'), /\.(md|yaml)$/.test(e.name) ? readFileSync(p, 'utf8') : null);
    }
  };
  walk(dir);
  return files;
}

/** YAML-Kopf zwischen zwei Zeilen «---» und der Markdown-Text danach */
export function splitFrontMatter(text) {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/.exec(text);
  return m && { head: m[1], body: m[2] };
}

/** Formeln im Markdown: $$...$$ (abgesetzt) und $...$ (im Text), nicht in Code. [tex, abgesetzt, Position] */
export function mathInMarkdown(md) {
  const blank = (s) => s.replace(/[^\n]/g, ' ');
  const found = [];
  const text = md
    .replace(/```[\s\S]*?```/g, blank)
    .replace(/`[^`\n]*`/g, blank)
    .replace(/\$\$([\s\S]+?)\$\$/g, (m, tex, at) => (found.push([tex.trim(), true, at]), blank(m)));
  for (const m of text.matchAll(/(?<![\\$])\$(?!\s)([^$\n]+?)(?<![\s\\])\$/g)) found.push([m[1], false, m.index]);
  return found;
}

let validators;
/** Ajv mit allen Schemas aus schema/, einmal übersetzt */
function getValidators() {
  if (validators) return validators;
  const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true });
  const dir = join(ROOT, 'schema');
  for (const f of readdirSync(dir)) ajv.addSchema(JSON.parse(readFileSync(join(dir, f), 'utf8')));
  validators = Object.fromEntries(['knoten', ...REGISTRIES].map((n) => [n, ajv.getSchema(`${n}.schema.json`)]));
  return validators;
}

const TYPES = { object: 'Objekt', array: 'Liste', string: 'Text', integer: 'ganze Zahl', number: 'Zahl' };

/** Meldungen von Ajv auf Deutsch, die häufigen Fälle */
function german(e) {
  const p = e.params;
  switch (e.keyword) {
    case 'required': return `Feld «${p.missingProperty}» fehlt`;
    case 'additionalProperties': return `unbekanntes Feld «${p.additionalProperty}»`;
    case 'propertyNames': return `ungültige ID «${p.propertyName}» (nur a-z, 0-9 und -)`;
    case 'enum': return `erlaubt sind nur: ${p.allowedValues.join(', ')}`;
    case 'type': return `muss ${String(p.type).split(',').map((t) => TYPES[t] ?? t).join(' oder ')} sein`;
    case 'pattern': return 'hat nicht die erwartete Form';
    case 'minLength': return 'darf nicht leer sein';
    case 'minItems': return `braucht mindestens ${p.limit} Einträge`;
    case 'uniqueItems': return 'enthält einen Eintrag doppelt';
    case 'minimum': return `muss mindestens ${p.limit} sein`;
    case 'maximum': return `darf höchstens ${p.limit} sein`;
    default: return e.message;
  }
}

/** Prüft value gegen das Schema und meldet die Fehler; true, wenn alles passt */
function schemaOk(validate, value, file, error) {
  if (validate(value)) return true;
  for (const e of validate.errors) {
    if (e.keyword === 'if' || e.propertyName !== undefined) continue; // doppelt zu then bzw. propertyNames
    error(file, (e.instancePath ? `${e.instancePath.slice(1).replaceAll('/', '.')}: ` : '') + german(e));
  }
  return false;
}

/** YAML lesen; bei Syntaxfehlern null und eine Meldung mit Zeile */
function readYaml(text, file, error, lineOffset = 0) {
  try {
    return { value: parseYaml(text) };
  } catch (e) {
    const line = e.linePos?.[0]?.line;
    const msg = e.message.split('\n')[0].replace(/ at line \d+, column \d+:?$/, '');
    error(file, `YAML: ${msg}`, line && line + lineOffset);
    return null;
  }
}

/**
 * Prüft alle Inhalte. files: Map wie von readContent (Pfade relativ zu inhalt/).
 * Gibt Fehler und Warnungen ({ file, line, msg }) und die Daten für die App zurück.
 */
export function checkContent(files) {
  const errors = [];
  const warnings = [];
  const to = (list) => (file, msg, line) => list.push({ file: `inhalt/${file}`, line, msg });
  const error = to(errors);
  const warn = to(warnings);
  const v = getValidators();
  const paths = [...files.keys()].sort();

  const tex = (src, file, where, displayMode = false, line = undefined) => {
    try {
      katex.renderToString(src, {
        displayMode,
        throwOnError: true,
        strict: (code, msg) => (warn(file, `${where}: KaTeX: ${msg}`, line), 'ignore'),
      });
    } catch (e) {
      error(file, `${where}: LaTeX rendert nicht: ${e.message.replace(/^KaTeX parse error: /, '')}`, line);
    }
  };

  // Schreibregeln: kein scharfes S, keine Gedankenstriche
  for (const file of paths) {
    files.get(file)?.split('\n').forEach((line, i) => {
      if (/\u00df/.test(line)) error(file, 'scharfes S: «ss» schreiben', i + 1);
      if (/[\u2013\u2014]/.test(line)) error(file, 'Gedankenstrich: Komma, Doppelpunkt oder Klammer verwenden', i + 1);
    });
  }

  // Register; ein fehlerhaftes Register bleibt leer, Verweise darauf werden dann nicht gemeldet
  const reg = {};
  const failed = new Set();
  for (const name of REGISTRIES) {
    const file = `${name}.yaml`;
    reg[name] = {};
    if (!files.has(file)) {
      error(file, 'Datei fehlt');
      failed.add(name);
      continue;
    }
    const y = readYaml(files.get(file), file, error);
    if (y && schemaOk(v[name], y.value ?? {}, file, error)) reg[name] = y.value ?? {};
    else failed.add(name);
  }
  const missing = (name, id) => !failed.has(name) && !Object.hasOwn(reg[name], id);

  const topics = new Map(); // Thema → Fachgebiet, in der Reihenfolge von themen.yaml
  for (const [discipline, d] of Object.entries(reg.themen)) {
    for (const topic of Object.keys(d.topics)) {
      if (topics.has(topic)) error('themen.yaml', `Thema «${topic}» steht in zwei Fachgebieten`);
      else topics.set(topic, discipline);
    }
  }
  for (const [id, q] of Object.entries(reg.groessen)) {
    tex(q.symbol, 'groessen.yaml', `${id}.symbol`);
    tex(`\\mathrm{${q.unit}}`, 'groessen.yaml', `${id}.unit`);
  }

  // Knoten: knoten/<thema>/<id>.md, ID = Dateiname, Thema = Ordner
  const fileOf = new Map(); // ID → Datei, auch für Knoten mit Fehlern
  const nodes = {};
  for (const file of paths) {
    if (!file.startsWith('knoten/') || !file.endsWith('.md')) continue;
    const [, topic, name, ...deeper] = file.split('/');
    if (!name || deeper.length) {
      error(file, 'Knoten gehören nach knoten/<thema>/<id>.md');
      continue;
    }
    const id = name.slice(0, -3);
    if (!ID.test(id)) {
      error(file, `ungültige ID «${id}» (nur a-z, 0-9 und -)`);
      continue;
    }
    if (fileOf.has(id)) {
      error(file, `ID «${id}» gibt es schon: inhalt/${fileOf.get(id)}`);
      continue;
    }
    fileOf.set(id, file);
    if (!failed.has('themen') && !topics.has(topic)) error(file, `Thema «${topic}» fehlt in themen.yaml`);
    const parts = splitFrontMatter(files.get(file));
    if (!parts) {
      error(file, 'YAML-Kopf zwischen zwei Zeilen «---» fehlt');
      continue;
    }
    const y = readYaml(parts.head, file, error, 1);
    if (!y || !schemaOk(v.knoten, y.value, file, error)) continue;
    const bodyLine = parts.head.split('\n').length + 3; // erste Zeile nach dem Kopf
    nodes[id] = { id, file: `inhalt/${file}`, topic, discipline: topics.get(topic) ?? null, ...y.value, body: parts.body };

    const n = nodes[id];
    for (const m of n.modules ?? []) if (missing('module', m)) error(file, `Modul «${m}» fehlt in module.yaml`);
    n.variables.forEach((va, i) => {
      if (missing('groessen', va.quantity)) error(file, `variables.${i}: Grösse «${va.quantity}» fehlt in groessen.yaml`);
      tex(va.symbol, file, `variables.${i}.symbol`);
    });
    tex(n.latex_expression, file, 'latex_expression', true);
    (n.forms ?? []).forEach((t, i) => tex(t, file, `forms.${i}`, true));
    for (const [t, display, at] of mathInMarkdown(parts.body)) {
      tex(t, file, 'Text', display, bodyLine + (parts.body.slice(0, at).match(/\n/g)?.length ?? 0));
    }
    (n.learning_resources?.simulations ?? []).forEach((s, i) => {
      for (const key of ['file', 'image', 'result']) {
        if (s[key] && !files.has(posix.join(posix.dirname(file), s[key]))) {
          error(file, `simulations.${i}.${key}: Datei «${s[key]}» fehlt`);
        }
      }
    });
  }

  // Voraussetzungen: vorhanden, nicht höher als der Knoten selbst, ohne Kreis
  for (const n of Object.values(nodes)) {
    const file = fileOf.get(n.id);
    for (const p of n.prerequisites ?? []) {
      if (p === n.id) error(file, 'Knoten setzt sich selbst voraus');
      else if (!fileOf.has(p)) error(file, `Voraussetzung «${p}» gibt es nicht`);
      else if (nodes[p]?.level > n.level) warn(file, `Voraussetzung «${p}» hat eine höhere Stufe (${nodes[p].level} statt höchstens ${n.level})`);
    }
  }
  const state = new Map(); // 1 = wird besucht, 2 = fertig
  const visit = (id, path) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) {
      const cycle = [...path.slice(path.indexOf(id)), id];
      error(fileOf.get(id), `Kreis in den Voraussetzungen: ${cycle.join(' → ')}`);
      return;
    }
    state.set(id, 1);
    for (const p of nodes[id].prerequisites ?? []) if (nodes[p] && p !== id) visit(p, [...path, id]);
    state.set(id, 2);
  };
  for (const id of Object.keys(nodes)) visit(id, []);

  // Analogien: Knoten vorhanden, eine Grösse pro Knoten und Zeile, der Knoten hat diese Grösse
  for (const [aid, a] of Object.entries(reg.analogien)) {
    const file = 'analogien.yaml';
    for (const nid of a.nodes) if (!fileOf.has(nid)) error(file, `${aid}: Knoten «${nid}» gibt es nicht`);
    a.mapping.forEach((row, i) => {
      if (row.length !== a.nodes.length) {
        error(file, `${aid}.mapping.${i}: braucht ${a.nodes.length} Grössen, eine pro Knoten`);
        return;
      }
      row.forEach((q, k) => {
        const node = nodes[a.nodes[k]];
        if (missing('groessen', q)) error(file, `${aid}.mapping.${i}: Grösse «${q}» fehlt in groessen.yaml`);
        else if (node && !node.variables.some((va) => va.quantity === q)) {
          error(file, `${aid}.mapping.${i}: «${node.id}» hat keine Variable mit der Grösse «${q}»`);
        }
      });
    });
  }

  const used = new Set(Object.values(nodes).flatMap((n) => n.variables.map((va) => va.quantity)));
  for (const q of Object.keys(reg.groessen)) if (!used.has(q)) warn('groessen.yaml', `Grösse «${q}» wird nirgends verwendet`);

  // Abgeleitet: wer baut auf einem Knoten auf, in welchen Analogien steht er
  const requiredBy = {};
  const analogiesOf = {};
  for (const n of Object.values(nodes)) for (const p of n.prerequisites ?? []) (requiredBy[p] ??= []).push(n.id);
  for (const [aid, a] of Object.entries(reg.analogien)) for (const nid of a.nodes) (analogiesOf[nid] ??= []).push(aid);

  // Reihenfolge: Thema wie in themen.yaml, dann Stufe, dann Titel
  const topicOrder = [...topics.keys()];
  const sorted = Object.values(nodes).sort((a, b) =>
    topicOrder.indexOf(a.topic) - topicOrder.indexOf(b.topic) || a.level - b.level || a.title.localeCompare(b.title, 'de'));

  const data = {
    disciplines: Object.fromEntries(Object.entries(reg.themen).map(([id, d]) => [id, { title: d.title, topics: Object.keys(d.topics) }])),
    topics: Object.fromEntries([...topics].map(([t, d]) => [t, { title: reg.themen[d].topics[t], discipline: d }])),
    quantities: reg.groessen,
    modules: reg.module,
    analogies: reg.analogien,
    nodes: Object.fromEntries(sorted.map((n) => [n.id, {
      ...n,
      forms: n.forms ?? [],
      modules: n.modules ?? [],
      prerequisites: n.prerequisites ?? [],
      required_by: requiredBy[n.id] ?? [],
      analogies: analogiesOf[n.id] ?? [],
      learning_resources: n.learning_resources ?? {},
      sources: n.sources ?? [],
      body: n.body.trim(),
    }])),
  };
  return { errors, warnings, data };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { errors, warnings, data } = checkContent(readContent());
  const github = process.env.GITHUB_ACTIONS === 'true';
  const show = (kind, label) => (e) => {
    if (github) {
      const msg = e.msg.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
      console.log(`::${kind} file=${e.file}${e.line ? `,line=${e.line}` : ''}::${msg}`);
    } else {
      console.log(`${label} ${e.file}${e.line ? `:${e.line}` : ''}: ${e.msg}`);
    }
  };
  warnings.forEach(show('warning', 'Warnung'));
  errors.forEach(show('error', 'Fehler'));
  const count = (o) => Object.keys(o).length;
  console.log(`Knoten: ${count(data.nodes)}, Grössen: ${count(data.quantities)}, Analogien: ${count(data.analogies)}, `
    + `Module: ${count(data.modules)}. Fehler: ${errors.length}, Warnungen: ${warnings.length}`);
  const i = process.argv.indexOf('--json');
  if (i > 0 && !errors.length) {
    const out = resolve(process.argv[i + 1] ?? 'dist/inhalt.json');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`Daten geschrieben: ${relative(process.cwd(), out)}`);
  }
  process.exitCode = errors.length ? 1 : 0;
}

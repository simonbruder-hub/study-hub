/**
 * Inhalte prüfen und zusammenführen. Liest inhalt/ (Knoten als Markdown mit YAML-Kopf, dazu themen.yaml,
 * groessen.yaml, module.yaml und analogien.yaml), prüft Schema, Verweise, Kreise, Analogien, LaTeX, Gliederung
 * und Schreibregeln und erzeugt daraus die Daten für die App: Text und Formeln schon als HTML (scripts/myst.mjs).
 * Die App holt die Daten beim Build über das Plugin in vite.config.ts, Fehler brechen den Build ab.
 *
 *   npm run inhalt                      nur prüfen
 *   npm run inhalt -- --json out.json   prüfen und die Daten schreiben
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { parse as parseYaml } from 'yaml';
import { renderMyst, renderTex } from './myst.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const REGISTRIES = ['themen', 'groessen', 'module', 'analogien'];
/** Eigener Standard für den Text eines Knotens (docs/INHALTE.md): Einleitung, dann diese Abschnitte in dieser Reihenfolge */
export const SECTIONS = ['Herleitung', 'Gültigkeit', 'Beispiel', 'Typische Fehler', 'Übungen'];
const REQUIRED = ['Gültigkeit', 'Beispiel'];
const WITH_SOLUTION = ['Beispiel', 'Übungen'];

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
  const t = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // BOM von Windows-Editoren
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/.exec(t);
  return m && { head: m[1], body: m[2] };
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
function german(e, file) {
  const p = e.params;
  switch (e.keyword) {
    case 'required': return `Feld «${p.missingProperty}» fehlt`;
    case 'additionalProperties': return `unbekanntes Feld «${p.additionalProperty}»`;
    case 'propertyNames': return `ungültige ID «${p.propertyName}» (${file === 'module.yaml' ? 'Kürzel wie in der Ablage: Buchstaben, Ziffern, Punkt, Strich' : 'nur a-z, 0-9 und -'})`;
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
    error(file, (e.instancePath ? `${e.instancePath.slice(1).replaceAll('/', '.')}: ` : '') + german(e, file));
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

  /** LaTeX zu HTML; Fehler und Hinweise von KaTeX mit Ort und Zeile */
  const tex = (src, file, where, displayMode = false, line = undefined) =>
    renderTex(src, displayMode, (kind, msg) => (kind === 'error' ? error : warn)(file, `${where}: ${msg}`, line));

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
  const quantities = {};
  for (const [id, q] of Object.entries(reg.groessen)) {
    quantities[id] = {
      ...q,
      symbol_html: tex(q.symbol, 'groessen.yaml', `${id}.symbol`),
      unit_html: tex(`\\mathrm{${q.unit}}`, 'groessen.yaml', `${id}.unit`),
    };
  }

  // Knoten: knoten/<thema>/<id>.md, ID = Dateiname, Thema = Ordner
  const fileOf = new Map(); // ID → Datei, auch für Knoten mit Fehlern
  const nodes = {};
  const texts = new Map(); // ID → Text und seine erste Zeile in der Datei
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
    nodes[id] = { id, file: `inhalt/${file}`, topic, discipline: topics.get(topic) ?? null, ...y.value };
    texts.set(id, { body: parts.body, line: parts.head.split('\n').length + 3 });

    const n = nodes[id];
    for (const m of n.modules ?? []) if (missing('module', m)) error(file, `Modul «${m}» fehlt in module.yaml`);
    n.variables = n.variables.map((va, i) => {
      if (missing('groessen', va.quantity)) error(file, `variables.${i}: Grösse «${va.quantity}» fehlt in groessen.yaml`);
      return { ...va, symbol_html: tex(va.symbol, file, `variables.${i}.symbol`) };
    });
    n.latex_html = tex(n.latex_expression, file, 'latex_expression', true);
    n.forms_html = (n.forms ?? []).map((t, i) => tex(t, file, `forms.${i}`, true));
    (n.learning_resources?.simulations ?? []).forEach((s, i) => {
      for (const key of ['file', 'image', 'result']) {
        if (s[key] && !files.has(posix.join(posix.dirname(file), s[key]))) {
          error(file, `simulations.${i}.${key}: Datei «${s[key]}» fehlt`);
        }
      }
    });
  }

  // Text: MyST zu HTML, Gliederung nach dem Standard; {k} braucht dazu alle Knoten
  const titleOf = (k) => nodes[k]?.title ?? (fileOf.has(k) ? k : undefined);
  for (const [id, { body, line }] of texts) {
    const file = fileOf.get(id);
    const r = renderMyst(body, { id, title: titleOf });
    for (const e of r.errors) error(file, `Text: ${e.msg}`, line + e.line);
    for (const w of r.warnings) warn(file, `Text: ${w.msg}`, line + w.line);
    checkOutline(r.outline, (l, msg) => error(file, `Gliederung: ${msg}`, line + l));
    nodes[id].html = r.html;
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
    quantities,
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
    }])),
  };
  return { errors, warnings, data };
}

/** Gliederung nach dem eigenen Standard; report(zeile, meldung), Zeile ab 0 im Text */
function checkOutline([intro, ...sections], report) {
  if (intro.first !== 'paragraph_open') report(0, 'Einleitung fehlt: zuerst 1 bis 3 Sätze ohne Überschrift');
  let last = -1;
  for (const s of sections) {
    if (s.depth === 1) {
      report(s.line, 'eine Überschrift mit # gibt es nicht: der Titel steht im Kopf, Abschnitte beginnen mit ##');
      continue;
    }
    const k = SECTIONS.indexOf(s.heading);
    if (k < 0) report(s.line, `Abschnitt «${s.heading}» gibt es nicht (erlaubt: ${SECTIONS.join(', ')})`);
    else if (k <= last) report(s.line, `«${s.heading}» an falscher Stelle (Reihenfolge: ${SECTIONS.join(', ')})`);
    else last = k;
    if (WITH_SOLUTION.includes(s.heading) && !s.dropdowns) report(s.line, `${s.heading}: Lösung aufklappbar in :::{dropdown} Lösung`);
  }
  for (const r of REQUIRED) if (!sections.some((s) => s.heading === r)) report(0, `Abschnitt «## ${r}» fehlt`);
}

/** Meldung als eine Zeile: Datei:Zeile: Text */
export const formatProblem = (e) => `${e.file}${e.line ? `:${e.line}` : ''}: ${e.msg}`;

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

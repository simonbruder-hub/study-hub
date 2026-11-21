/**
 * Text der Formel-Knoten: Markdown mit einer Teilmenge von MyST (wie in Jupyter Book), beim Build zu HTML.
 * KaTeX rendert die Formeln schon hier, die App zeigt nur noch HTML an. Was nicht unterstützt ist, meldet
 * die Prüfung mit Zeile, statt es still falsch anzuzeigen. Übersicht für Autoren: docs/INHALTE.md.
 */
import katex from 'katex';
import MarkdownIt from 'markdown-it';

/** Hinweis-Kästen mit deutschem Standardtitel; admonition braucht einen eigenen Titel */
const ADMONITIONS = {
  note: 'Hinweis', hint: 'Tipp', tip: 'Tipp', important: 'Wichtig', seealso: 'Siehe auch',
  attention: 'Achtung', caution: 'Vorsicht', warning: 'Achtung', danger: 'Gefahr', error: 'Fehler', admonition: '',
};
export const DIRECTIVES = [...Object.keys(ADMONITIONS), 'dropdown', 'tab-set', 'tab-item', 'math'];
export const ROLES = ['eq', 'math', 'k', 'sub', 'sup'];
/** Optionen pro Direktive; class und name gehen überall (class: dropdown macht einen Hinweis aufklappbar) */
const OPTIONS = { dropdown: ['open'], 'tab-set': ['sync-group'], 'tab-item': ['selected', 'sync'], math: ['label'] };

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c]);
const list = (names) => names.map((x) => `{${x}}`).join(', ');

/** LaTeX mit KaTeX zu HTML; report(kind, msg) meldet Fehler ('error') und Hinweise ('warning') */
export function renderTex(src, displayMode, report) {
  try {
    return katex.renderToString(src, {
      displayMode,
      throwOnError: true,
      strict: (code, msg) => (report('warning', `KaTeX: ${msg}`), 'ignore'),
    });
  } catch (e) {
    report('error', `LaTeX rendert nicht: ${String(e.message).replace(/^KaTeX parse error: /, '')}`);
    return `<code class="tex-error">${esc(src)}</code>`;
  }
}

const lineAt = (state, l) => state.src.slice(state.bMarks[l] + state.tShift[l], state.eMarks[l]);
const DIRECTIVE_LINE = /^(:{3,}|`{3,})\{([A-Za-z][\w-]*)\}[ \t]*(.*?)[ \t]*$/;
const OPTION_LINE = /^:([\w-]+):(?:[ \t]+(.*?))?[ \t]*$/;
const CLOSE_LINE = /^(:{3,}|`{3,})[ \t]*$/;
const MATH_END = /^(.*?)\$\$[ \t]*(?:\(([\w-]+)\))?[ \t]*$/;

/**
 * :::{name} Argument, danach :option: Wert, Inhalt, Ende mit mindestens so vielen Doppelpunkten. Dasselbe mit
 * Backticks (```{name}) wie in Jupyter Book. Verschachtelt: aussen mehr Zeichen als innen.
 */
function directiveRule(state, startLine, endLine, silent) {
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  const m = DIRECTIVE_LINE.exec(lineAt(state, startLine));
  if (!m) return false;
  if (silent) return true;
  const [, colons, name, arg] = m;
  const options = {};
  let line = startLine + 1;
  for (let o; line < endLine && (o = OPTION_LINE.exec(lineAt(state, line))); line++) options[o[1]] = o[2] ?? '';
  const start = line;
  let closed = false;
  for (; line < endLine; line++) {
    const c = CLOSE_LINE.exec(lineAt(state, line));
    if (c && c[1][0] === colons[0] && c[1].length >= colons.length && state.sCount[line] - state.blkIndent < 4) {
      closed = true;
      break;
    }
  }
  const meta = { name, arg, options, closed };
  const open = state.push('directive_open', 'div', 1);
  Object.assign(open, { map: [startLine, line], markup: colons, meta });
  if (name === 'math') {
    const t = state.push('math_block', 'math', 0);
    Object.assign(t, { map: [start, line], content: state.getLines(start, line, state.blkIndent, false).trim(), info: options.label ?? '', meta: { closed: true } });
  } else {
    const parent = state.parentType;
    const max = state.lineMax;
    state.parentType = 'directive';
    state.lineMax = line;
    state.md.block.tokenize(state, start, line);
    state.parentType = parent;
    state.lineMax = max;
  }
  Object.assign(state.push('directive_close', 'div', -1), { markup: colons, meta });
  state.line = closed ? line + 1 : line;
  return true;
}

/** $$ ... $$ auf eigenen Zeilen, mit Marke: $$ ... $$ (marke) */
function mathBlockRule(state, startLine, endLine, silent) {
  if (state.sCount[startLine] - state.blkIndent >= 4) return false;
  const first = lineAt(state, startLine);
  if (!first.startsWith('$$')) return false;
  if (silent) return true;
  let line = startLine;
  let m = MATH_END.exec(first.slice(2));
  const parts = [m ? m[1] : first.slice(2)];
  while (!m && line + 1 < endLine) {
    line++;
    const text = lineAt(state, line);
    m = MATH_END.exec(text);
    parts.push(m ? m[1] : text);
  }
  const t = state.push('math_block', 'math', 0);
  Object.assign(t, { map: [startLine, line + 1], content: parts.join('\n').trim(), info: m?.[2] ?? '', meta: { closed: Boolean(m) } });
  state.line = line + 1;
  return true;
}

/** $...$ im Text: kein Leerzeichen innen am Rand, keine Ziffer direkt nach dem Ende; sonst Fehler */
function mathInlineRule(state, silent) {
  const { src, pos: start, posMax } = state;
  if (src.charCodeAt(start) !== 0x24) return false;
  const double = src.charCodeAt(start + 1) === 0x24;
  let end = -1;
  if (!double && !/\s/.test(src[start + 1] ?? ' ')) {
    for (let p = start + 1; p < posMax; p++) {
      if (src[p] === '\\') p++;
      else if (src[p] === '$') {
        end = p;
        break;
      }
    }
    if (end > 0 && (/\s/.test(src[end - 1]) || /\d/.test(src[end + 1] ?? ''))) end = -1;
  }
  const skip = double ? 2 : 1;
  if (!silent) {
    if (end > 0) state.push('math_inline', 'math', 0).content = src.slice(start + 1, end);
    else {
      const t = state.push('myst_error', '', 0);
      t.content = src.slice(start, start + skip);
      t.meta = { msg: double ? 'Formel mit $$ gehört auf eigene Zeilen' : 'Einzelnes $: Formel schliessen oder \\$ schreiben' };
    }
  }
  state.pos = end > 0 ? end + 1 : start + skip;
  return true;
}

/** {name}`inhalt` */
function roleRule(state, silent) {
  if (state.src.charCodeAt(state.pos) !== 0x7b) return false;
  const m = /^\{([a-z][\w-]*)\}`([^`\n]*)`/.exec(state.src.slice(state.pos, state.posMax));
  if (!m) return false;
  if (!silent) {
    const t = state.push('myst_role', '', 0);
    t.meta = { name: m[1] };
    t.content = m[2];
  }
  state.pos += m[0].length;
  return true;
}

function checkDirective(t, parent, report) {
  const { name, arg, options, closed } = t.meta;
  const err = (msg) => report('error', msg);
  if (!DIRECTIVES.includes(name)) return err(`Direktive {${name}} wird nicht unterstützt (erlaubt: ${list(DIRECTIVES)})`);
  if (!closed) err(`{${name}} ohne Abschluss: Zeile ${t.markup} fehlt`);
  if (name === 'admonition' && !arg) err('{admonition} braucht einen Titel');
  if (name === 'tab-item' && parent?.meta.name !== 'tab-set') err('{tab-item} gehört in ein {tab-set}');
  for (const o of Object.keys(options)) {
    if (!['class', 'name', ...(OPTIONS[name] ?? [])].includes(o)) report('warning', `{${name}}: Option :${o}: wird nicht unterstützt`);
  }
}

function prepareRole(c, labels, ctx, report) {
  const { name } = c.meta;
  const text = c.content;
  if (name === 'eq') {
    const no = labels.get(text.trim());
    if (!no) report('error', `{eq}: Marke «${text}» gibt es in diesem Knoten nicht`);
    c.meta.html = `<span class="eq-ref">(${no ?? '?'})</span>`;
  } else if (name === 'math') {
    c.meta.html = renderTex(text, false, report);
  } else if (name === 'k') {
    const m = /^(.*?)\s*<([^<>]+)>$/.exec(text); // «Text <id>» oder nur «id»
    const id = (m ? m[2] : text).trim();
    const title = ctx.title?.(id);
    if (title === undefined) report('error', `{k}: Knoten «${id}» gibt es nicht`);
    c.meta.html = `<a href="#/k/${esc(id)}">${esc(m?.[1] || title || id)}</a>`;
  } else if (name === 'sub' || name === 'sup') {
    c.meta.html = `<${name}>${esc(text)}</${name}>`;
  } else {
    report('error', `Rolle {${name}} wird nicht unterstützt (erlaubt: ${list(ROLES)})`);
    c.meta.html = esc(text);
  }
}

function checkInline(t, firstLine, labels, ctx, report) {
  let line = firstLine;
  for (const c of t.children ?? []) {
    if (c.type === 'softbreak' || c.type === 'hardbreak') line++;
    const r = (kind, msg) => report(kind, line, msg);
    if (c.type === 'math_inline') c.meta = { html: renderTex(c.content, false, r) };
    else if (c.type === 'myst_role') prepareRole(c, labels, ctx, r);
    else if (c.type === 'myst_error') r('error', c.meta.msg);
    else if (c.type === 'image') r('error', 'Bilder werden noch nicht unterstützt');
    else if (c.type === 'link_open') {
      const h = c.attrGet('href') ?? '';
      if (/^https:\/\//.test(h)) {
        c.attrSet('target', '_blank');
        c.attrSet('rel', 'noopener');
      } else if (!h.startsWith('#/')) r('error', `Link «${h}»: nur https://... oder eine Seite der App (#/...)`);
    }
  }
  if (/^:{3,}$/.test(t.content.trim())) report('error', firstLine, `${t.content.trim()} schliesst nichts: keine Direktive offen`);
}

/** Nach dem Parsen: Formeln rendern und nummerieren, Rollen auflösen, Aufbau der Direktiven prüfen */
function mystCore(state) {
  const { tokens, env } = state;
  const report = (kind, line, msg) => env[kind === 'error' ? 'errors' : 'warnings'].push({ line, msg });
  const labels = new Map(); // Marke → Nummer, in der Reihenfolge im Text
  for (const t of tokens) {
    if (t.type !== 'math_block' || !t.info) continue;
    if (labels.has(t.info)) report('error', t.map[0], `Marke «${t.info}» gibt es zweimal`);
    else labels.set(t.info, labels.size + 1);
  }
  const stack = [];
  let group = 0;
  let line = 0;
  tokens.forEach((t, i) => {
    if (t.map) line = t.map[0];
    const r = (kind, msg) => report(kind, line, msg);
    const parent = stack.at(-1);
    const isItem = t.meta?.name === 'tab-item' && t.type.startsWith('directive_');
    if (parent?.meta.name === 'tab-set' && t.level === parent.level + 1 && t.nesting !== -1 && !isItem) {
      r('error', 'In {tab-set} stehen nur {tab-item}');
    }
    if (t.type === 'directive_open') {
      checkDirective(t, parent, (kind, msg) => r(kind, msg));
      if (t.meta.name === 'tab-set') {
        // Kinder: tab-item direkt darin; offen ist das mit :selected:, sonst das erste
        const items = [];
        for (let j = i + 1; j < tokens.length && tokens[j].level > t.level; j++) {
          const x = tokens[j];
          if (x.type === 'directive_open' && x.level === t.level + 1 && x.meta.name === 'tab-item') items.push(x);
        }
        const selected = items.find((x) => 'selected' in x.meta.options) ?? items[0];
        group++;
        items.forEach((x, k) => Object.assign(x.meta, { group, index: k + 1, checked: x === selected }));
      }
      stack.push(t);
    } else if (t.type === 'directive_close') {
      stack.pop();
    } else if (t.type === 'math_block') {
      if (!t.meta.closed) r('error', 'Formel ohne schliessendes $$');
      else if (!t.content) r('error', 'Formel ist leer');
      Object.assign(t.meta, { no: labels.get(t.info), html: renderTex(t.content, true, r) });
    } else if (t.type === 'inline') {
      checkInline(t, line, labels, env.ctx, report);
    }
  });
}

const RENDER = {
  directive_open(tokens, i, options, env) {
    const { name, arg, options: opt, group, index, checked } = tokens[i].meta;
    if (Object.hasOwn(ADMONITIONS, name)) {
      const kind = name === 'admonition' ? 'note' : name;
      const title = esc(arg || ADMONITIONS[name]);
      return /\bdropdown\b/.test(opt.class ?? '')
        ? `<details class="adm adm-${kind}"><summary class="adm-title">${title}</summary>\n`
        : `<aside class="adm adm-${kind}"><p class="adm-title">${title}</p>\n`;
    }
    if (name === 'dropdown') return `<details class="dropdown"${'open' in opt ? ' open' : ''}><summary>${esc(arg || 'Lösung')}</summary>\n`;
    if (name === 'tab-set') return '<div class="tabs">\n';
    if (name === 'tab-item') {
      const set = `tab-${esc(env.ctx.id ?? 'x')}-${group}`;
      return `<input type="radio" class="tab-radio" name="${set}" id="${set}-${index}"${checked ? ' checked' : ''}>`
        + `<label class="tab-label" for="${set}-${index}">${esc(arg || `Teil ${index}`)}</label>\n<div class="tab-panel">\n`;
    }
    return name === 'math' ? '' : '<div>\n';
  },
  directive_close(tokens, i) {
    const { name, options: opt } = tokens[i].meta;
    if (Object.hasOwn(ADMONITIONS, name)) return /\bdropdown\b/.test(opt.class ?? '') ? '</details>\n' : '</aside>\n';
    if (name === 'dropdown') return '</details>\n';
    return name === 'math' ? '' : '</div>\n';
  },
  math_block(tokens, i) {
    const { html, no } = tokens[i].meta;
    return `<div class="math-block">${html}${no ? `<span class="eq-no">(${no})</span>` : ''}</div>\n`;
  },
  math_inline: (tokens, i) => tokens[i].meta.html,
  myst_role: (tokens, i) => tokens[i].meta.html,
  myst_error: (tokens, i) => esc(tokens[i].content),
  table_open: () => '<div class="table-wrap"><table>\n',
  table_close: () => '</table></div>\n',
};

let parser;
function getParser() {
  if (parser) return parser;
  const md = new MarkdownIt();
  const alt = { alt: ['paragraph', 'reference', 'blockquote', 'list'] };
  md.block.ruler.before('fence', 'myst_directive', directiveRule, alt);
  md.block.ruler.before('fence', 'math_block', mathBlockRule, alt);
  md.inline.ruler.after('escape', 'math_inline', mathInlineRule);
  md.inline.ruler.before('backticks', 'myst_role', roleRule);
  md.core.ruler.push('myst', mystCore);
  Object.assign(md.renderer.rules, RENDER);
  parser = md;
  return md;
}

/** Gliederung: Einleitung und Abschnitte (## und #) mit Zeile, Anzahl Blöcke und aufklappbaren Lösungen */
function outline(tokens) {
  const sections = [{ heading: null, depth: 0, line: 0, first: null, dropdowns: 0 }];
  tokens.forEach((t, i) => {
    const cur = sections.at(-1);
    if (t.type === 'heading_open' && t.level === 0 && (t.tag === 'h1' || t.tag === 'h2')) {
      sections.push({ heading: tokens[i + 1].content.trim(), depth: t.tag === 'h1' ? 1 : 2, line: t.map[0], first: null, dropdowns: 0 });
      return;
    }
    if (t.level === 0 && t.nesting !== -1 && t.type !== 'inline') cur.first ??= t.type;
    if (t.type === 'directive_open' && t.meta.name === 'dropdown') cur.dropdowns++;
  });
  return sections;
}

/**
 * Text eines Knotens zu HTML. ctx: { id (für eindeutige IDs im HTML), title(id) → Titel eines Knotens oder
 * undefined }. Zeilen der Meldungen zählen ab 0 (erste Zeile des Texts).
 */
export function renderMyst(src, ctx = {}) {
  const md = getParser();
  const env = { ctx, errors: [], warnings: [] };
  const tokens = md.parse(src, env);
  const html = md.renderer.render(tokens, md.options, env);
  return { html, errors: env.errors, warnings: env.warnings, outline: outline(tokens) };
}

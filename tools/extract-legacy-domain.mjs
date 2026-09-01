#!/usr/bin/env node
/**
 * Reads index.html (the legacy source of truth) and extracts the domain
 * constants that apps/mobile/src/domain ports, writing them to
 * docs/migration/fixtures/legacy-domain.json.
 *
 * This is the differential-testing anchor for Phase 2: the mobile port's
 * vitest suite deep-equals this fixture rather than hand-written
 * expectations, because a hand-written expectation only tests what the
 * author *believes* index.html contains, and the entire risk of a content
 * migration is that the belief is wrong (e.g. a dropped niqqud mark).
 *
 * Route taken: PREFERRED. Each constant is extracted by locating its
 * `const NAME = ` (or `let settings = `) declaration and finding the
 * matching closing bracket with a string-aware scanner (so a brace that
 * appears *inside* a quoted string, such as the carrier-phrase placeholder
 * `'הִנֵּה {w}'` or the escaped apostrophe in `'גִּ\'ירָפָה'`, is never
 * mistaken for a structural bracket). Each isolated slice is evaluated as a
 * standalone expression in a node:vm sandbox seeded with the *real* `art()`
 * implementation, copied verbatim from index.html 1476-1479. The whole
 * inline <script> is never evaluated, and no HTML/DOM stub is needed.
 *
 * The game id/title list (used by the games menu, index.html 2355-2377) is
 * not a top-level `const` — it lives inside three literals nested in
 * `renderGamesMenu()` (a plain grid array, a template-literal "wide" button,
 * and an "extras" array). Those three are extracted with the same
 * string-aware bracket scanner plus one small targeted regex for the
 * template-literal button, and merged into one 11-entry {id, title} list.
 *
 * Re-runnable: run it again and the output is byte-identical, because the
 * serializer recursively sorts object keys and always terminates with a
 * single trailing newline. Array order is left exactly as authored — only
 * object *key* order is normalised, which is what makes two runs byte-equal
 * without reordering data that has real sequence meaning (e.g. CARRIERS).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const INDEX_HTML_PATH = resolve(REPO_ROOT, 'index.html');
const OUT_PATH = resolve(REPO_ROOT, 'docs/migration/fixtures/legacy-domain.json');

const src = readFileSync(INDEX_HTML_PATH, 'utf8');

/* ---- the real art() implementation, copied verbatim from index.html 1476-1479 */
function art(cat, slug) {
  const file =
    cat === 'colors' ? `talki-colors-shapes-${slug}.png` : `talki-${cat}-${slug}.png`;
  return `assets/words/${cat}/${file}`;
}

/**
 * String-aware bracket matcher. Starting at `openIdx` (which must point at
 * `{` or `[`), scans forward tracking single/double/backtick string state
 * (respecting backslash escapes, e.g. the escaped apostrophe in
 * `'גִּ\'ירָפָה'`) and `//` / `\/* *\/` comments, and returns the index of
 * the matching close bracket. Braces/brackets inside a string never affect
 * depth, which is essential: several of the extracted literals contain
 * placeholder text like `{w}` inside single-quoted strings (CARRIERS,
 * MODIFIERS).
 */
function findMatchingClose(text, openIdx) {
  const openCh = text[openIdx];
  const closeCh = openCh === '{' ? '}' : ']';
  if (openCh !== '{' && openCh !== '[') {
    throw new Error(`findMatchingClose: index ${openIdx} is not an open bracket`);
  }
  let depth = 0;
  let inStr = null; // one of "'", '"', '`', or null
  let i = openIdx;
  while (i < text.length) {
    const ch = text[i];
    if (inStr) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === inStr) inStr = null;
      i++;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inStr = ch;
      i++;
      continue;
    }
    if (ch === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (ch === openCh) depth++;
    else if (ch === closeCh) {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  throw new Error(`findMatchingClose: no matching ${closeCh} found for index ${openIdx}`);
}

/** Finds `const NAME = ` (or `let NAME = `) and returns the index of the
 *  `{` or `[` that opens its value. */
function findDeclarationOpenBracket(text, name, kind = 'const') {
  const marker = `${kind} ${name} = `;
  const declIdx = text.indexOf(marker);
  if (declIdx === -1) throw new Error(`declaration not found: ${marker.trim()}`);
  const valueStart = declIdx + marker.length;
  const ch = text[valueStart];
  if (ch !== '{' && ch !== '[') {
    throw new Error(`unexpected token after ${marker.trim()}: ${JSON.stringify(ch)}`);
  }
  return valueStart;
}

/** Extracts a top-level `const NAME = <literal>;` (or `let NAME = <literal>`)
 *  and evaluates the literal in a sandbox that has the real `art()` in scope. */
function extractLiteral(name, { kind = 'const' } = {}) {
  const openIdx = findDeclarationOpenBracket(src, name, kind);
  const closeIdx = findMatchingClose(src, openIdx);
  const literalSource = src.slice(openIdx, closeIdx + 1);
  const sandbox = { art };
  vm.createContext(sandbox);
  const value = vm.runInContext(`(${literalSource})`, sandbox, {
    filename: `<extracted:${name}>`,
  });
  return value;
}

/* ---- 1. CATEGORIES (index.html 1480-1592) -------------------------------- */
const CATEGORIES = extractLiteral('CATEGORIES');

/* ---- 2. CARRIERS / CLOZE / PAIRS / MODIFIERS (index.html 1597-1628) ------ */
const CARRIERS = extractLiteral('CARRIERS');
const CLOZE = extractLiteral('CLOZE');
const PAIRS = extractLiteral('PAIRS');
const MODIFIERS = extractLiteral('MODIFIERS');

/* ---- 3. K storage key patterns (index.html 1633-1637) --------------------
 * Two of the six keys are functions (`custom: id => ...`, `rec: key => ...`).
 * A function value cannot round-trip through JSON, so each is resolved to
 * its literal string pattern by invoking it once with a `{id}` / `{key}`
 * placeholder — which is exactly the template the mobile port's own
 * `K.custom()` / `K.rec()` functions must reproduce for the parity test. */
const K_raw = extractLiteral('K');
const K = {
  progress: K_raw.progress,
  settings: K_raw.settings,
  stats: K_raw.stats,
  customIndex: K_raw.customIndex,
  custom: K_raw.custom('{id}'),
  rec: K_raw.rec('{key}'),
  lastcat: K_raw.lastcat,
};

/* ---- 4. settings defaults (index.html 1647) ------------------------------ */
const SETTINGS_DEFAULTS = extractLiteral('settings', { kind: 'let' });

/* ---- 5. HOME_PRACTICE_HOME (index.html 1383-1387) ------------------------ */
const HOME_PRACTICE_HOME = extractLiteral('HOME_PRACTICE_HOME');

/* ---- 6. PRACTICE_LIST (index.html 2218-2225) ------------------------------ */
const PRACTICE_LIST = extractLiteral('PRACTICE_LIST');

/* ---- 7. MIN_ITEMS (index.html 2489-2490) ---------------------------------- */
const MIN_ITEMS = extractLiteral('MIN_ITEMS');

/* ---- 8. STICKERS (index.html 2417-2442) ----------------------------------- */
const STICKERS = extractLiteral('STICKERS');

/* ---- 9. Game id / title list (index.html 2355-2377) -----------------------
 * Not a top-level const: lives inside renderGamesMenu() as a plain grid
 * array (7 games), a template-literal "wide" button (1 game: match), and an
 * "extras" array (3 games) = 11 total. Extracted from the function body
 * directly out of index.html, not retyped. */
function extractGameIdsAndTitles() {
  const fnMarker = 'function renderGamesMenu(){';
  const fnStart = src.indexOf(fnMarker);
  if (fnStart === -1) throw new Error('renderGamesMenu() not found');
  // Bound the search to a generous window after the function start so the
  // bracket scanner below only ever looks at this function's own literals.
  const window = src.slice(fnStart, fnStart + 4000);

  const gridOpen = window.indexOf('const grid = [') + 'const grid = '.length;
  const gridClose = findMatchingClose(window, gridOpen);
  const gridSandbox = {};
  vm.createContext(gridSandbox);
  const grid = vm.runInContext(`(${window.slice(gridOpen, gridClose + 1)})`, gridSandbox, {
    filename: '<extracted:renderGamesMenu.grid>',
  });

  const wideMatch = window.match(
    /data-game="match">[\s\S]*?<b>([^<]+)<\/b>/,
  );
  if (!wideMatch) throw new Error('wide (match) game button not found');

  const extrasOpen = window.indexOf('const extras = [') + 'const extras = '.length;
  const extrasClose = findMatchingClose(window, extrasOpen);
  const extrasSandbox = {};
  vm.createContext(extrasSandbox);
  const extras = vm.runInContext(`(${window.slice(extrasOpen, extrasClose + 1)})`, extrasSandbox, {
    filename: '<extracted:renderGamesMenu.extras>',
  });

  const games = [
    ...grid.map(([id, , title]) => ({ id, title })),
    { id: 'match', title: wideMatch[1] },
    ...extras.map(([id, , title]) => ({ id, title })),
  ];
  return games;
}
const GAMES = extractGameIdsAndTitles();

/* ---- assembly -------------------------------------------------------------- */
const fixture = {
  CATEGORIES,
  CARRIERS,
  CLOZE,
  PAIRS,
  MODIFIERS,
  K,
  SETTINGS_DEFAULTS,
  HOME_PRACTICE_HOME,
  PRACTICE_LIST,
  MIN_ITEMS,
  STICKERS,
  GAMES,
};

/* ---- deterministic serialization -------------------------------------------
 * Object keys are sorted recursively so two runs are byte-identical even if
 * V8's own key enumeration order were ever to change. Array element order is
 * preserved untouched — several arrays (CARRIERS, PAIRS, GAMES-from-menu)
 * carry real sequence meaning that must not be reordered. */
function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = sortKeysDeep(value[k]);
    return out;
  }
  return value;
}

const json = JSON.stringify(sortKeysDeep(fixture), null, 2) + '\n';

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, json, 'utf8');

// eslint-disable-next-line no-console
console.log(`wrote ${OUT_PATH} (${json.length} bytes)`);
console.log(
  `CATEGORIES: ${Object.keys(CATEGORIES).length} categories, ` +
    `${Object.values(CATEGORIES).reduce((s, c) => s + c.items.length, 0)} words`,
);
console.log(`GAMES: ${GAMES.length} entries`);
console.log(`STICKERS: ${STICKERS.length} entries`);
console.log(`MIN_ITEMS: ${Object.keys(MIN_ITEMS).length} entries`);

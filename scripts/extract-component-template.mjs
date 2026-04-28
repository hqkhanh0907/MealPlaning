#!/usr/bin/env node
/**
 * extract-component-template.mjs
 *
 * Refactor an Angular standalone component file by extracting inline
 * `template:` (backtick literal) and `styles:` / `styles[]` into external
 * `templateUrl` + `styleUrl` files next to the component.
 *
 * Usage: node scripts/extract-component-template.mjs <path/to/foo.component.ts>
 *
 * Behavior:
 *  - Locates the @Component({ ... }) decorator block.
 *  - Extracts the `template: \`...\`` backtick literal.
 *      ABORT if literal contains `${` (TS interpolation, must be migrated manually).
 *  - Extracts `styles: \`...\`` or `styles: [\`...\`]` first element.
 *      Skip if missing or empty.
 *  - Writes <basename>.html and <basename>.scss next to the component.
 *      <basename> = filename without `.ts` (preserves `.component` if present).
 *  - Replaces `template: \`...\`` with `templateUrl: './<basename>.html'`.
 *  - Replaces `styles: ...` with `styleUrl: './<basename>.scss'`.
 *  - Writes the modified .ts back.
 *
 * Exit codes:
 *  0 = success
 *  1 = abort (interpolation, parse failure, file not found)
 *  2 = no inline template/styles found (idempotent skip)
 */

import fs from 'node:fs';
import path from 'node:path';

const file = process.argv[2];
if (!file) {
  console.error('usage: extract-component-template.mjs <file.ts>');
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error(`file not found: ${file}`);
  process.exit(1);
}

const src = fs.readFileSync(file, 'utf8');
const dir = path.dirname(file);
const baseTs = path.basename(file, '.ts');

/**
 * Find a backtick template literal starting at index i (the opening backtick).
 * Returns { start, end, body } where body is content WITHOUT the surrounding backticks.
 * Returns null if unterminated.
 */
function readBacktickLiteral(text, start) {
  if (text[start] !== '`') return null;
  let i = start + 1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') {
      return { start, end: i, body: text.slice(start + 1, i) };
    }
    i += 1;
  }
  return null;
}

// Find @Component({ ... }) block
const compIdx = src.indexOf('@Component(');
if (compIdx === -1) {
  console.error('no @Component decorator found');
  process.exit(1);
}

// --- Extract template ---
const tplKeyRe = /template\s*:\s*`/g;
tplKeyRe.lastIndex = compIdx;
const tplMatch = tplKeyRe.exec(src);

let tplBody = null;
let tplReplaceRange = null;
if (tplMatch) {
  const btIdx = tplMatch.index + tplMatch[0].length - 1;
  const lit = readBacktickLiteral(src, btIdx);
  if (!lit) {
    console.error('unterminated template literal');
    process.exit(1);
  }
  if (lit.body.includes('${')) {
    console.error(
      'ABORT: template literal contains ${...} interpolation — manual extraction required',
    );
    process.exit(1);
  }
  tplBody = lit.body;
  tplReplaceRange = [tplMatch.index, lit.end + 1];
}

// --- Extract styles ---
// Pattern A: styles: `...`
// Pattern B: styles: [`...`]  (first element only — keep simple; assert single)
let styleBody = null;
let styleReplaceRange = null;

const stylesKeyRe = /styles\s*:\s*/g;
stylesKeyRe.lastIndex = compIdx;
const stylesMatch = stylesKeyRe.exec(src);
if (stylesMatch) {
  const after = stylesMatch.index + stylesMatch[0].length;
  if (src[after] === '`') {
    const lit = readBacktickLiteral(src, after);
    if (!lit) {
      console.error('unterminated styles literal');
      process.exit(1);
    }
    if (lit.body.trim().length > 0) {
      styleBody = lit.body;
    }
    styleReplaceRange = [stylesMatch.index, lit.end + 1];
  } else if (src[after] === '[') {
    // styles: [`...`, `...`?]
    let i = after + 1;
    // skip whitespace
    while (/\s/.test(src[i])) i += 1;
    if (src[i] === ']') {
      // empty array
      // find ']' end
      styleReplaceRange = [stylesMatch.index, i + 1];
    } else if (src[i] === '`') {
      const lit = readBacktickLiteral(src, i);
      if (!lit) {
        console.error('unterminated styles[0] literal');
        process.exit(1);
      }
      if (lit.body.trim().length > 0) styleBody = lit.body;
      // find closing ]; allow ONE trailing comma after the literal
      let j = lit.end + 1;
      while (j < src.length && /\s/.test(src[j])) j += 1;
      if (src[j] === ',') {
        j += 1;
        while (j < src.length && /\s/.test(src[j])) j += 1;
      }
      if (src[j] !== ']') {
        // Another element follows — multi-element styles array, abort
        console.error(
          'ABORT: styles array has multiple elements — manual extraction required',
        );
        process.exit(1);
      }
      styleReplaceRange = [stylesMatch.index, j + 1];
    } else {
      console.error('unexpected token in styles array');
      process.exit(1);
    }
  } else {
    // Not a backtick or array — skip (could be variable ref, leave alone)
  }
}

if (!tplBody && !styleBody && !tplReplaceRange && !styleReplaceRange) {
  console.error('no inline template or styles found — nothing to do');
  process.exit(2);
}

// --- Compute output filenames ---
const htmlPath = path.join(dir, `${baseTs}.html`);
const scssPath = path.join(dir, `${baseTs}.scss`);

// --- Helper: trim leading/trailing blank lines, dedent shared indent ---
function dedent(body) {
  // Strip leading newline + trailing whitespace
  let s = body.replace(/^\n/, '').replace(/\s+$/, '');
  const lines = s.split('\n');
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length === 0) return s;
  const minIndent = Math.min(
    ...nonEmpty.map((l) => l.match(/^[ \t]*/)[0].length),
  );
  if (minIndent > 0) {
    return lines.map((l) => l.slice(minIndent)).join('\n');
  }
  return s;
}

// --- Apply edits (back-to-front to preserve indices) ---
const edits = [];
if (tplReplaceRange) {
  edits.push({
    start: tplReplaceRange[0],
    end: tplReplaceRange[1],
    replacement: `templateUrl: './${baseTs}.html'`,
  });
}
if (styleReplaceRange) {
  edits.push({
    start: styleReplaceRange[0],
    end: styleReplaceRange[1],
    replacement: styleBody
      ? `styleUrl: './${baseTs}.scss'`
      : null /* drop entirely */,
  });
}
edits.sort((a, b) => b.start - a.start);

let out = src;
for (const e of edits) {
  if (e.replacement === null) {
    // Drop the styles entry entirely. Also remove a trailing comma+whitespace
    // or leading comma+whitespace so the @Component object stays valid.
    let s = e.start;
    let f = e.end;
    // consume trailing comma + newlines
    while (f < out.length && /[,\s]/.test(out[f])) {
      if (out[f] === ',') {
        f += 1;
        break;
      }
      f += 1;
    }
    // also strip leading whitespace on that line
    while (s > 0 && out[s - 1] === ' ') s -= 1;
    out = out.slice(0, s) + out.slice(f);
  } else {
    out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
  }
}

// --- Write external files ---
if (tplBody !== null) {
  fs.writeFileSync(htmlPath, dedent(tplBody) + '\n');
  console.log(`wrote ${htmlPath} (${tplBody.length} chars)`);
}
if (styleBody !== null) {
  // If a .scss already exists (e.g. bottom-sheet-picker), abort to avoid clobber.
  if (fs.existsSync(scssPath)) {
    console.error(
      `ABORT: ${scssPath} already exists — manual merge required`,
    );
    process.exit(1);
  }
  fs.writeFileSync(scssPath, dedent(styleBody) + '\n');
  console.log(`wrote ${scssPath} (${styleBody.length} chars)`);
}

fs.writeFileSync(file, out);
console.log(`patched ${file}`);

#!/usr/bin/env node
/**
 * Repository column guard (T-03 from docs/audit/fitness/tests-needed.md).
 *
 * Parses every `src/app/core/repositories/*.repository.ts` for SQL strings,
 * extracts column references in the high-risk write forms, and asserts each
 * referenced column exists in the schema DDL (CREATE TABLE + ALTER ADD COLUMN
 * blocks in `src/app/core/services/database/schema.ts`).
 *
 * Motivation: F-012 — `WorkoutRepository.updateSet` wrote a non-existent
 * `workout_set.updated_at` column and silently SQL-errored on every "Sửa set"
 * tap. A schema check at build time would have flagged it before the bug
 * shipped. Reference: docs/audit/fitness/F-012-update-set-missing-column.md,
 * docs/audit/fitness/tests-needed.md §P0.
 *
 * Forms checked (pragmatic, not a full SQL parser):
 *   - `UPDATE <table> SET <col> = ?, <col> = ? [WHERE ...]`   ← F-012 pattern
 *   - `INSERT INTO <table> (<col>, <col>, ...) VALUES (...)`
 *   - `SELECT <col-list> FROM <table>` when select-list is not `*` and uses
 *     bare identifiers (not function calls, aliases, or qualified names).
 *
 * False-positive escape hatch: place
 *   `// allow-repo-columns: <reason>`
 * on the same line or the line immediately above the SQL string.
 *
 * Run manually: `npm run check:repo-columns`
 * Will be wired into `npm run build` once stable.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const REPO_DIR = join(ROOT, 'src', 'app', 'core', 'repositories');
const SCHEMA_FILE = join(ROOT, 'src', 'app', 'core', 'services', 'database', 'schema.ts');

// ─── 1. Build schema column map ────────────────────────────────────────────
const schemaSrc = readFileSync(SCHEMA_FILE, 'utf8');

/** @type {Map<string, Set<string>>} */
const schemaCols = new Map();

// CREATE TABLE (with or without IF NOT EXISTS) — paren-aware body capture.
// Non-greedy regex broke on inline `CHECK (col IN (...))` and `DEFAULT (datetime('now'))`
// because it terminates at the first `)`. We scan paren depth manually instead.
const headRe = /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)\s*\(/g;
let m;
while ((m = headRe.exec(schemaSrc)) !== null) {
  const table = m[1];
  let depth = 1;
  let i = m.index + m[0].length;
  const bodyStart = i;
  while (i < schemaSrc.length && depth > 0) {
    const ch = schemaSrc[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    i++;
  }
  const body = schemaSrc.slice(bodyStart, i - 1);
  const cols = new Set();
  // Each line in body: indent + colname + type + ...
  // Stop at lines that start with CHECK/FOREIGN/UNIQUE/PRIMARY KEY/constraint keywords.
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('--')) continue;
    // Skip table-level constraints
    if (/^(CHECK|FOREIGN|UNIQUE|PRIMARY|CONSTRAINT)\b/i.test(line)) continue;
    const colMatch = line.match(/^(\w+)\s+/);
    if (colMatch) cols.add(colMatch[1]);
  }
  // Merge if multiple CREATE TABLE statements target the same name (e.g. v3 migration recreate)
  if (schemaCols.has(table)) {
    for (const c of cols) schemaCols.get(table).add(c);
  } else {
    schemaCols.set(table, cols);
  }
}

// ALTER TABLE <name> ADD COLUMN <col> <type>
const alterRe = /ALTER TABLE\s+(\w+)\s+ADD COLUMN\s+(\w+)\s+/g;
while ((m = alterRe.exec(schemaSrc)) !== null) {
  const table = m[1];
  const col = m[2];
  if (!schemaCols.has(table)) schemaCols.set(table, new Set());
  schemaCols.get(table).add(col);
}

if (schemaCols.size === 0) {
  console.error('✖ repo-columns guard: no tables parsed from schema.ts — aborting (parser broken?).');
  process.exit(1);
}

// ─── 2. Walk repo files ────────────────────────────────────────────────────
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else if (p.endsWith('.repository.ts')) acc.push(p);
  }
  return acc;
}
const repoFiles = walk(REPO_DIR);

const violations = [];
const ALLOW_RE = /\/\/\s*allow-repo-columns:/;

// ─── 3. Per repo file, extract SQL strings and check columns ───────────────
for (const file of repoFiles) {
  const src = readFileSync(file, 'utf8');
  // Map line-number → has allow-comment on or above (for fast lookup)
  const lines = src.split('\n');
  /** @param {number} lineIdx (0-based) */
  const isAllowed = (lineIdx) => {
    for (let i = Math.max(0, lineIdx - 1); i <= lineIdx; i++) {
      if (ALLOW_RE.test(lines[i] || '')) return true;
    }
    return false;
  };

  // Find every backtick-delimited string
  const tickRe = /`([^`]*)`/gs;
  let bt;
  while ((bt = tickRe.exec(src)) !== null) {
    const sqlRaw = bt[1];
    if (!/\b(SELECT|UPDATE|INSERT|DELETE)\b/i.test(sqlRaw)) continue;

    // Compute the 0-based line of the opening backtick
    const lineIdx = src.slice(0, bt.index).split('\n').length - 1;
    if (isAllowed(lineIdx)) continue;

    // Normalize: collapse whitespace
    const sql = sqlRaw.replace(/\s+/g, ' ').trim();

    // 3a. UPDATE <table> SET col = ?, col = ? [WHERE ...]
    const updMatch = /UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\b|$)/i.exec(sql);
    if (updMatch) {
      const [, table, setClause] = updMatch;
      const cols = [];
      for (const part of setClause.split(',')) {
        const c = part.trim().match(/^(\w+)\s*=/);
        if (c) cols.push(c[1]);
      }
      checkCols(file, lineIdx, table, cols, 'UPDATE SET');
    }

    // 3b. INSERT INTO <table> (col, col, ...) VALUES (...)
    const insMatch = /INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES/i.exec(sql);
    if (insMatch) {
      const [, table, colList] = insMatch;
      const cols = colList.split(',').map((c) => c.trim()).filter((c) => /^\w+$/.test(c));
      checkCols(file, lineIdx, table, cols, 'INSERT INTO');
    }

    // 3c. SELECT <bare-col-list> FROM <table> (only if no JOIN, no alias)
    const selMatch = /SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\b|\s+ORDER\b|\s+LIMIT\b|\s*$)/i.exec(sql);
    if (selMatch && !/\bJOIN\b/i.test(sql)) {
      const [, selectList, table] = selMatch;
      if (selectList.trim() === '*') continue;
      // Skip if any part is a function call, alias, dotted reference, or expression
      const parts = selectList.split(',').map((p) => p.trim());
      const colsClean = [];
      let bail = false;
      for (const p of parts) {
        if (!/^\w+$/.test(p)) {
          bail = true;
          break;
        }
        colsClean.push(p);
      }
      if (!bail) {
        checkCols(file, lineIdx, table, colsClean, 'SELECT FROM');
      }
    }
  }
}

function checkCols(file, lineIdx, table, cols, kind) {
  const schema = schemaCols.get(table);
  if (!schema) {
    // Unknown table — silent skip (could be virtual table / temp table / typo
    // worth flagging, but high false-positive rate). Allow-listable via comment.
    return;
  }
  for (const col of cols) {
    if (!schema.has(col)) {
      violations.push({
        file,
        line: lineIdx + 1,
        kind,
        table,
        col,
      });
    }
  }
}

// ─── 4. Report ─────────────────────────────────────────────────────────────
if (violations.length > 0) {
  console.error('\n✖ repo-columns guard FAILED — repository SQL references columns missing from schema.ts');
  console.error('  Reference: docs/audit/fitness/F-012-update-set-missing-column.md');
  console.error('  Escape hatch: add `// allow-repo-columns: <reason>` on or above the SQL line.');
  console.error();
  for (const v of violations) {
    console.error(`  - ${v.kind} ${v.table}.${v.col} — column not in schema`);
    console.error(`    ${v.file}:${v.line}`);
  }
  console.error();
  process.exit(1);
}

console.log(
  `✓ repo-columns guard: scanned ${repoFiles.length} repos against ${schemaCols.size} tables, no missing columns.`,
);

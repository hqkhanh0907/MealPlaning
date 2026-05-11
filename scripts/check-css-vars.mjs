#!/usr/bin/env node
/**
 * CSS variable integrity guard.
 *
 * Complements check-design-tokens:
 * - check-design-tokens verifies declarations use var(--*) tokens.
 * - this guard verifies those var(--*) references actually resolve.
 *
 * It also catches unterminated block comments in SCSS/CSS, which can silently
 * comment out an entire stylesheet while Angular build still passes.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const CWD = process.cwd();
const ROOT = join(CWD, 'src');
const ALLOWED_EXTERNAL_PREFIXES = ['--ion-', '--swiper-'];
const CHECK_EXTENSIONS = new Set(['.scss', '.css', '.html']);

/** @param {string} file */
function extensionOf(file) {
  const idx = file.lastIndexOf('.');
  return idx >= 0 ? file.slice(idx) : '';
}

/** @param {string} dir @param {string[]} acc */
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      walk(p, acc);
    } else if (CHECK_EXTENSIONS.has(extensionOf(p))) {
      acc.push(p);
    }
  }
  return acc;
}

/** @param {string} source */
function hasUnbalancedBlockComment(source) {
  let depth = 0;
  for (let i = 0; i < source.length - 1; i++) {
    const pair = source.slice(i, i + 2);
    if (pair === '/*') {
      depth++;
      i++;
    } else if (pair === '*/') {
      depth--;
      if (depth < 0) return true;
      i++;
    }
  }
  return depth !== 0;
}

const files = walk(ROOT);
const definedVars = new Set();
const undefinedRefs = [];
const commentFailures = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  if ((file.endsWith('.scss') || file.endsWith('.css')) && hasUnbalancedBlockComment(source)) {
    commentFailures.push(relative(CWD, file));
  }

  for (const match of source.matchAll(/(?:^|[;{\s])(--[a-zA-Z0-9_-]+)\s*:/g)) {
    definedVars.add(match[1]);
  }

  for (const match of source.matchAll(/\[style\.(--[a-zA-Z0-9_-]+)(?:\.[^\]]+)?\]/g)) {
    definedVars.add(match[1]);
  }
}

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const lines = source.split('\n');
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    for (const match of lines[lineIndex].matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g)) {
      const varName = match[1];
      const isExternal = ALLOWED_EXTERNAL_PREFIXES.some((prefix) => varName.startsWith(prefix));
      if (!definedVars.has(varName) && !isExternal) {
        undefinedRefs.push({
          file: relative(CWD, file),
          line: lineIndex + 1,
          varName,
        });
      }
    }
  }
}

if (commentFailures.length > 0 || undefinedRefs.length > 0) {
  if (commentFailures.length > 0) {
    console.error(`\n✖ CSS variable guard FAILED — ${commentFailures.length} unbalanced block comment(s)`);
    for (const file of commentFailures) {
      console.error(`  ${file}`);
    }
  }

  if (undefinedRefs.length > 0) {
    console.error(`\n✖ CSS variable guard FAILED — ${undefinedRefs.length} undefined var(--*) reference(s)`);
    for (const ref of undefinedRefs) {
      console.error(`  ${ref.file}:${ref.line}  ${ref.varName}`);
    }
  }

  console.error('\nFix: use an existing token from src/theme/variables.scss or define a local custom property.');
  process.exit(1);
}

console.log('✓ CSS variable guard: all app var(--*) references resolve and block comments are balanced.');

#!/usr/bin/env node
/**
 * scripts/check-story-scope-stability.mjs
 *
 * Story scope stability guard (per investigation 2026-05-08 §G3).
 *
 * Enforces:
 *   1. Every story listed in `_bmad-output/implementation-artifacts/sprint-status.yaml`
 *      has a matching story file under `_bmad-output/implementation-artifacts/<key>-*.md`.
 *   2. Every story file in `_bmad-output/implementation-artifacts/<digit>-*.md` is
 *      registered in sprint-status.yaml (no orphan story files).
 *   3. Story files marked `Status: done` must reference at least one commit SHA
 *      (anything matching `[a-f0-9]{7,40}`) — this catches "claimed done with no
 *      evidence" drift.
 *
 * Exits 0 on PASS, 1 on FAIL.
 */
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const SSOT = path.join(REPO_ROOT, '_bmad-output/implementation-artifacts/sprint-status.yaml');
const ART_DIR = path.join(REPO_ROOT, '_bmad-output/implementation-artifacts');

function readSsotKeys() {
  const text = fs.readFileSync(SSOT, 'utf8');
  // development_status entries look like:  2-6-remove-dark-mode...: done
  // Extract the leading `<digit>-<digit>` then convert to "X.Y".
  const keys = [];
  let inBlock = false;
  for (const line of text.split('\n')) {
    if (/^development_status:\s*$/.test(line)) {
      inBlock = true;
      continue;
    }
    if (inBlock) {
      if (/^\S/.test(line)) break; // dedented → end of block
      const m = line.match(/^\s+([0-9]+)-([0-9]+)-[a-z0-9-]+:\s*\S/);
      if (m) keys.push(`${m[1]}.${m[2]}`);
    }
  }
  return keys;
}

function readSsotEntries() {
  // returns Map<key, statusValue>
  const text = fs.readFileSync(SSOT, 'utf8');
  const out = new Map();
  let inBlock = false;
  for (const line of text.split('\n')) {
    if (/^development_status:\s*$/.test(line)) {
      inBlock = true;
      continue;
    }
    if (inBlock) {
      if (/^\S/.test(line)) break;
      const m = line.match(/^\s+([0-9]+)-([0-9]+)-[a-z0-9-]+:\s*(\S.*?)\s*$/);
      if (m) out.set(`${m[1]}.${m[2]}`, m[3]);
    }
  }
  return out;
}

function isTerminalStatus(status) {
  // Treat both `done` and `superseded*` as final → require commit evidence.
  return status === 'done' || /^superseded/.test(status);
}

function findStoryFile(key) {
  // key "2.6" -> file "2-6-*.md"
  const prefix = key.replace('.', '-') + '-';
  const entries = fs.readdirSync(ART_DIR);
  return entries.find(f => f.startsWith(prefix) && f.endsWith('.md')) ?? null;
}

function listStoryFiles() {
  return fs
    .readdirSync(ART_DIR)
    .filter(f => /^[0-9]+-[0-9]+-.+\.md$/.test(f));
}

function fileKey(filename) {
  const m = filename.match(/^([0-9]+)-([0-9]+)-/);
  return m ? `${m[1]}.${m[2]}` : null;
}

const violations = [];

const ssotKeys = readSsotKeys();
const storyFiles = listStoryFiles();
const fileKeys = new Set(storyFiles.map(fileKey).filter(Boolean));
const ssotKeySet = new Set(ssotKeys);

// Rule 1: every SSOT key has a story file.
for (const key of ssotKeys) {
  const f = findStoryFile(key);
  if (!f) {
    violations.push(
      `sprint-status.yaml lists key=${key} but no _bmad-output/implementation-artifacts/${key.replace('.', '-')}-*.md file exists`,
    );
  }
}

// Rule 2: every story file is registered in SSOT.
for (const f of storyFiles) {
  const k = fileKey(f);
  if (!k) continue;
  if (!ssotKeySet.has(k)) {
    violations.push(
      `story file ${f} (key=${k}) is not registered in sprint-status.yaml story_log`,
    );
  }
}

// Rule 3: every story file with development_status=done must reference a commit SHA.
const ssotEntries = readSsotEntries();
for (const f of storyFiles) {
  const k = fileKey(f);
  if (!k) continue;
  const status = ssotEntries.get(k);
  if (!isTerminalStatus(status)) continue;
  const fp = path.join(ART_DIR, f);
  const text = fs.readFileSync(fp, 'utf8');
  if (!/\b[a-f0-9]{7,40}\b/.test(text)) {
    violations.push(
      `story file ${f} has development_status=${status} in SSOT but contains no commit SHA evidence`,
    );
  }
}

if (violations.length === 0) {
  console.log('✓ check-story-scope-stability: PASS — SSOT and story files are in sync.');
  process.exit(0);
}

console.error(`✗ check-story-scope-stability: FAIL — ${violations.length} violation(s):\n`);
for (const v of violations) console.error(`  ${v}`);
console.error('\nRule reference: investigation 2026-05-08 §G3.');
process.exit(1);

/**
 * Vietnamese-aware fuzzy matching utilities for F-02 AI auto-fill (Q5-C).
 *
 * Pure functions, no Angular DI. Reference: phase-1.5b §2-bis Q5-C.
 *
 * IMPORTANT: This is a SEPARATE utility from `nutrition-ai.normalizeIngredientName`
 * (F-01 ingredient lookup). F-01 keeps Vietnamese diacritics; F-02 strips them
 * for fuzzy matching. Per audit finding A6, do NOT consolidate.
 *
 * THRESHOLD POLICY (revised 2026-05-01 after E2E false-positive review):
 * Distance threshold scales with the shorter of the two normalized strings.
 * A flat threshold of 2 was matching short Vietnamese words across totally
 * different ingredients ("bún" vs "bơ" dist=2, "tôm" vs "tỏi" dist=1, "hẹ"
 * vs "bơ" dist=2). For 2-3 char words, even a 1-edit difference flips the
 * meaning, so we require an exact match. Empirically validated across 4 real
 * Gemini calls (Bun bo Hue / Sinh to bo / Goi cuon / Banh xeo).
 *
 *   minLen ≤ 3   → threshold 0  (exact match only after normalize)
 *   minLen 4-9   → threshold 1  (single typo / trailing-letter tolerance)
 *   minLen ≥ 10  → threshold 2  (multi-edit tolerance for long phrases)
 *
 * The 7-9 bucket was tightened from threshold 2 → 1 after a second-pass
 * E2E review surfaced "Sữa tươi" ↔ "bún tươi" matching at dist=2 (shared
 * " tươi" suffix masking 2 substitutions in the head). Same logic also
 * blocks "Thịt heo" ↔ "Thịt bò" (dist 2, minLen 7) — same-category but
 * different protein causes a real ~30% protein/fat shift, so erring
 * on "Tạo mới" is the safe default.
 */

/**
 * Normalize a Vietnamese ingredient/dish name for fuzzy matching.
 *
 * Steps: NFD-decompose → strip combining diacritics → đ/Đ → d/d →
 * lowercase → trim → collapse multi-space.
 */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replaceAll(/\s+/g, ' ');
}

/**
 * Maximum allowed Levenshtein distance for two normalized strings whose
 * shorter length is `minLen`. See THRESHOLD POLICY in the file header.
 */
export function thresholdForLength(minLen: number): 0 | 1 | 2 {
  if (minLen <= 3) return 0;
  if (minLen <= 9) return 1;
  return 2;
}

/** Hard upper bound on the dynamic threshold — used to size the DP buffer. */
const MAX_THRESHOLD = 2;

/**
 * Levenshtein edit distance with early-exit.
 *
 * Returns the exact distance if ≤ `threshold`; otherwise returns
 * `threshold + 1` as a sentinel for "out of fuzzy-match range".
 *
 * `threshold` defaults to 2 (the historical contract). Implementation uses
 * a single-row DP buffer (Uint8Array) for O(min(m,n)) memory; max useful
 * length for ingredient names is well under 256 chars.
 *
 * Performance: < 100µs per call for short strings (typical ingredient name).
 */
export function levenshtein(a: string, b: string, threshold: number = MAX_THRESHOLD): number {
  const t = Math.max(threshold, 0);
  const sentinel = t + 1;

  if (a === b) return 0;

  const m = a.length;
  const n = b.length;

  // Length difference alone exceeds threshold → early-exit.
  if (Math.abs(m - n) > t) return sentinel;

  if (m === 0 || n === 0) {
    return emptyDistance(m, n, t, sentinel);
  }

  // Defensive: if either string is unexpectedly long, still bound memory.
  if (m > 255 || n > 255) {
    return a === b ? 0 : sentinel;
  }

  // prev[j] = distance(a[..i-1], b[..j-1]) for previous row i-1
  // curr[j] = distance(a[..i],   b[..j-1]) for current  row i
  let prev = new Uint8Array(n + 1);
  let curr = new Uint8Array(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    const rowMin = fillLevenshteinRow(a, b, i, prev, curr);
    // Early-exit: if every cell of this row > threshold, the final answer
    // can only grow → return sentinel.
    if (rowMin > t) return sentinel;

    // Swap rows.
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  const dist = prev[n];
  return dist > t ? sentinel : dist;
}

function emptyDistance(m: number, n: number, threshold: number, sentinel: number): number {
  const distance = Math.max(m, n);
  return distance > threshold ? sentinel : distance;
}

function fillLevenshteinRow(
  a: string,
  b: string,
  rowIndex: number,
  prev: Uint8Array,
  curr: Uint8Array,
): number {
  curr[0] = rowIndex;
  let rowMin = curr[0];
  const aChar = a.codePointAt(rowIndex - 1);

  for (let j = 1; j <= b.length; j++) {
    const cost = aChar === b.codePointAt(j - 1) ? 0 : 1;
    const v = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    curr[j] = v;
    rowMin = Math.min(rowMin, v);
  }

  return rowMin;
}

/** Read-only candidate shape consumed by `findFuzzyMatches`. */
export interface FuzzyCandidate {
  readonly id: string;
  readonly name: string;
}

/** Read-only result entry returned by `findFuzzyMatches`. */
export interface FuzzyMatchResult {
  readonly match: FuzzyCandidate;
  readonly distance: number;
}

/**
 * Find all candidates whose normalized name is within the dynamic Levenshtein
 * threshold (see `thresholdForLength`) of the normalized target. Results are
 * sorted by distance ascending; ties preserve original candidate order.
 *
 * Pre-normalizes target and every candidate exactly once. Per-candidate
 * threshold is computed from `min(target.length, candidate.length)` AFTER
 * normalization, so short Vietnamese words ("bơ", "tôm", "hẹ") require an
 * exact match and do not collide with unrelated ingredients.
 *
 * Reference: phase-1.5b §2-bis Q5-C ("local fuzzy match post-process") +
 * 2026-05-01 false-positive review.
 */
export function findFuzzyMatches(
  target: string,
  candidates: readonly FuzzyCandidate[],
): readonly FuzzyMatchResult[] {
  const normalizedTarget = normalize(target);
  const targetLen = normalizedTarget.length;
  const out: FuzzyMatchResult[] = [];

  for (const c of candidates) {
    const normalizedName = normalize(c.name);
    const minLen = Math.min(targetLen, normalizedName.length);
    const threshold = thresholdForLength(minLen);
    const d = levenshtein(normalizedTarget, normalizedName, threshold);
    if (d <= threshold) {
      out.push({ match: c, distance: d });
    }
  }

  // Stable sort by distance ascending. Array.prototype.sort is stable in
  // ES2019+, which is fine for our Angular 21 / TS 5+ target.
  out.sort((a, b) => a.distance - b.distance);
  return out;
}

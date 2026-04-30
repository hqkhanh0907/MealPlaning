/**
 * Vietnamese-aware fuzzy matching utilities for F-02 AI auto-fill (Q5-C).
 *
 * Pure functions, no Angular DI. Reference: phase-1.5b §2-bis Q5-C.
 *
 * IMPORTANT: This is a SEPARATE utility from `nutrition-ai.normalizeIngredientName`
 * (F-01 ingredient lookup). F-01 keeps Vietnamese diacritics; F-02 strips them
 * for fuzzy matching. Per audit finding A6, do NOT consolidate.
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
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Levenshtein edit distance with early-exit at threshold 2.
 *
 * Returns the exact distance if ≤ 2; otherwise returns 3 (sentinel for
 * "out of fuzzy-match range" per phase-1.5b §2-bis Q5-C). Implementation
 * uses a single-row DP buffer (Uint8Array) for O(min(m,n)) memory; max
 * useful length for ingredient names is well under 256 chars.
 *
 * Performance: < 100µs per call for short strings (typical ingredient name).
 */
export function levenshtein(a: string, b: string): number {
  const THRESHOLD = 2;
  const SENTINEL = 3;

  if (a === b) return 0;

  const m = a.length;
  const n = b.length;

  // Length difference alone exceeds threshold → early-exit.
  if (Math.abs(m - n) > THRESHOLD) return SENTINEL;

  if (m === 0) return n > THRESHOLD ? SENTINEL : n;
  if (n === 0) return m > THRESHOLD ? SENTINEL : m;

  // Defensive: if either string is unexpectedly long, still bound memory.
  if (m > 255 || n > 255) {
    // Fall back to plain string compare without DP allocation.
    return a === b ? 0 : SENTINEL;
  }

  // prev[j] = distance(a[..i-1], b[..j-1]) for previous row i-1
  // curr[j] = distance(a[..i],   b[..j-1]) for current  row i
  let prev = new Uint8Array(n + 1);
  let curr = new Uint8Array(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    const aChar = a.charCodeAt(i - 1);

    for (let j = 1; j <= n; j++) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      const del = prev[j] + 1;
      const ins = curr[j - 1] + 1;
      const sub = prev[j - 1] + cost;
      let v = del < ins ? del : ins;
      if (sub < v) v = sub;
      curr[j] = v;
      if (v < rowMin) rowMin = v;
    }

    // Early-exit: if every cell of this row > THRESHOLD, the final answer
    // can only grow → return sentinel.
    if (rowMin > THRESHOLD) return SENTINEL;

    // Swap rows.
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  const dist = prev[n];
  return dist > THRESHOLD ? SENTINEL : dist;
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
 * Find all candidates whose normalized name is within Levenshtein distance 2
 * of the normalized target. Results are sorted by distance ascending; ties
 * preserve original candidate order.
 *
 * Pre-normalizes target and every candidate exactly once. Candidates with
 * distance > 2 (sentinel 3) are filtered out.
 *
 * Reference: phase-1.5b §2-bis Q5-C ("local fuzzy match post-process").
 */
export function findFuzzyMatches(
  target: string,
  candidates: readonly FuzzyCandidate[],
): readonly FuzzyMatchResult[] {
  const normalizedTarget = normalize(target);
  const out: FuzzyMatchResult[] = [];

  for (const c of candidates) {
    const d = levenshtein(normalizedTarget, normalize(c.name));
    if (d <= 2) {
      out.push({ match: c, distance: d });
    }
  }

  // Stable sort by distance ascending. Array.prototype.sort is stable in
  // ES2019+, which is fine for our Angular 21 / TS 5+ target.
  out.sort((a, b) => a.distance - b.distance);
  return out;
}

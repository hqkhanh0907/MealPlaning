# Test Coverage Baseline Report — 2026-05-09

**Status:** Baseline (B8 deliverable)
**Toolchain:** Karma 6 + Jasmine 5 + karma-coverage (Istanbul) + ChromeHeadless 147
**Command:** `npx ng test --watch=false --browsers=ChromeHeadless --code-coverage`
**Tests:** 418/418 passing in ~1.0s
**Reports:** `coverage/app/index.html` (browse), `coverage/app/coverage-summary.json` (machine), `coverage/app/lcov.info` (CI tools)

---

## 1. Headline numbers

| Metric      | Covered  | Total | %      |
|-------------|----------|-------|--------|
| Statements  | 1427     | 1922  | 74.24% |
| Branches    | 390      | 650   | 60.00% |
| Functions   | 345      | 493   | 69.97% |
| Lines       | 1310     | 1763  | 74.30% |

**Verdict:** healthy for an offline mobile app with a UI-heavy management
surface. Core domain (services, stores, forms, utils) is well-covered;
the gap is concentrated in feature pages and the platform-bridge layer.

---

## 2. By area (sorted worst → best statement coverage)

| Bucket                       | Stmts        | Branch | Fn   |
|------------------------------|--------------|--------|------|
| features/management          | 308/613 (50%)| 39%    | 42%  |
| core/repositories            |  76/119 (64%)| 39%    | 66%  |
| core/stores                  |  86/111 (78%)| 36%    | 74%  |
| core/services                | 356/433 (82%)| 68%    | 81%  |
| features/settings            | 182/201 (91%)| 83%    | 95%  |
| shared/components            | 208/229 (91%)| 70%    | 87%  |
| core/utils                   |  60/63  (95%)| 61%    | 100% |
| shared/forms                 | 125/127 (98%)| 96%    | 100% |
| features/onboarding          |  22/22 (100%)| 100%   | 100% |

Notes:
- `features/onboarding` shows 100% but the bucket only contains the
  validation/calculation helpers. The page component itself is not in
  this bucket (it is a heavy page covered by the new E2E `onboarding-persist`).
- `core/models` (1/1, 100%) is a placeholder — type-only files contribute
  near-zero executable code.

---

## 3. Top 15 files by uncovered statements (highest ROI for new tests)

| Uncov | Pct  | File                                                          |
|-------|------|---------------------------------------------------------------|
| 123   | 55%  | features/management/dish-edit/dish-edit.page.ts               |
|  92   | 49%  | features/management/management.page.ts                        |
|  90   | 45%  | features/management/ingredient-edit/ingredient-edit.page.ts   |
|  39   | 44%  | core/services/database/native-database.ts                     |
|  26   | 59%  | core/services/database/web-database.ts                        |
|  18   | 70%  | features/settings/settings.page.ts                            |
|  18   | 65%  | core/repositories/ingredient.repository.ts                    |
|  16   | 57%  | core/repositories/dish.repository.ts                          |
|  15   | 65%  | core/stores/dish.store.ts                                     |
|  10   | 72%  | core/stores/ingredient.store.ts                               |
|   9   | 55%  | core/repositories/user-profile.repository.ts                  |
|   6   | 93%  | core/services/ai/gemini-client.ts                             |
|   5   | 89%  | shared/components/ai-lookup-sheet/ai-lookup-sheet.ts          |
|   4   | 90%  | shared/components/bottom-sheet-picker/bottom-sheet-picker.ts  |
|   4   | 88%  | shared/components/dishes-using-sheet/dishes-using-sheet.ts    |

Adding tests for just the top 3 files would lift overall statement
coverage from 74.24% to roughly 90% (305 of the 495 currently uncovered
statements live in those files alone).

---

## 4. Risk-weighted gap analysis

Coverage % alone is misleading. Weight gap by *blast radius*:

### Critical (block Phase 3 ship)
- **`core/services/database/native-database.ts` (44%)** — the Capacitor
  SQLite driver. Phase 3 will add a `planned_dish` migration; uncovered
  branches here are the same code path that produced two prior real
  regressions. Tests added here have the highest defect-prevention value.
- **`core/services/database/web-database.ts` (59%)** — sql.js fallback.
  Symmetrical surface to native-database. Migration runner already at
  `migration-runner.spec` but the driver itself is thin.

### High (UX-visible regressions on Phase 3 dish-picker work)
- **`features/management/dish-edit/dish-edit.page.ts` (55%)** — F-02 dish
  picker is reused by F-03 in Phase 3. Big page, lots of state.
- **`features/management/ingredient-edit/ingredient-edit.page.ts` (45%)**
  — same family.
- **`features/management/management.page.ts` (49%)** — list/filter screen.

### Medium (silent data corruption potential)
- `core/repositories/*` cluster sits at 39-65% branch coverage. These are
  the SQL boundary; missing branches usually = missing error-path tests.

### Low (cosmetic / well-isolated)
- `shared/components/*` files in the 88-93% range — adding tests is cheap
  but ROI is low.

---

## 5. Recommendation: thresholds (not enforced yet)

Proposed minimums to enforce in CI **after** addressing the critical bucket:

| Metric      | Current | Phase 3 entry | Phase 3 ship |
|-------------|---------|---------------|--------------|
| Statements  | 74%     | 75% (no regression) | 80% |
| Branches    | 60%     | 60% (no regression) | 70% |
| Functions   | 70%     | 70% (no regression) | 78% |
| Lines       | 74%     | 75% (no regression) | 80% |

Per-file watchlist (do NOT let these drop further):
- `core/services/database/native-database.ts` — current 44%, target 70%
- `features/management/dish-edit/dish-edit.page.ts` — current 55%, target 75%

Implementation: enable Karma's
[`check`](https://karma-runner.github.io/6.4/config/coverage.html)
thresholds on `karma.conf.js` once we hit the "Phase 3 entry" row.

---

## 6. What this report does NOT cover

- **E2E coverage.** The Appium spec `e2e/specs/onboarding-persist.e2e.ts`
  exercises the full onboarding stack but is not measured by Istanbul
  (it runs against the production APK, not the instrumented bundle).
  Treat E2E and unit coverage as orthogonal; both must move forward.
- **Branch quality.** A branch can be "covered" by a single happy-path
  test. The branch % above is a lower bound on test depth, not an upper
  bound on test quality.
- **Generated/vendored code.** Nothing in `node_modules`, `www/`,
  `.angular/`, `coverage/` is included; this is intentional.

---

## 7. How to reproduce locally

```bash
# JDK 21 needed for Capacitor build steps; harmless for ng test.
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage

# Browse the HTML drill-down:
open coverage/app/index.html
```

CI (when added):
```bash
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage
# Fail the build if a threshold regresses (gate added in a follow-up).
```

---

## 8. Change log

- 2026-05-09 — Initial baseline. 418 tests, 74.24% stmts.
  Karma reporters extended to include `json-summary` + `lcovonly`
  (commit landed alongside this report).

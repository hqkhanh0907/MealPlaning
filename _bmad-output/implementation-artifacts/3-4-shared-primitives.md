# Story 3.4: Shared primitives — CalorieRing + ServingsStepper + StatusPill + ConfirmEatModal + band-color util

Status: ready-for-review

<!-- Source: _bmad-output/planning-artifacts/epic-3-calendar.md (rev 1, 2026-05-10) lines 265-316 -->

## Story

As a **dev**,
I want **4 shared components (`CalorieRing`, `ServingsStepper`, `StatusPill`, `ConfirmEatModal`) + 1 pure util `band-color`** under `src/app/shared/components/` and `src/app/core/utils/`,
so that **F-03 pages (Story 3.5/3.6/3.7) and Epic 4 surfaces consume the same visual primitives — no design drift**.

## Acceptance Criteria

1. **AC-1 — CalorieRing.** Inputs: `value`, `target`, `size: 32|48|64`, `strokeWidth=8`, `showCenterLabel=true`, `variant: 'calories'|'protein'|'carbs'|'fat'`. Computed `pct` clamped [0, 200]. SVG-based (no canvas). 600ms ease-out animation when `value` changes. `aria-label` Vietnamese: `"{Variant} {value} trên {target}, {pct} phần trăm"`. Color class derived from `bandColor(pct, variant)`.

2. **AC-2 — ServingsStepper.** `value = model.required<number>()` 2-way. Inputs: `min=0.1`, `max=20`, `step=0.1`, `disabled=false`. Output `committed = output<number>()` on blur. [─]/[+] tap-and-hold accelerate (50ms interval after 500ms hold). Direct numeric input uses `.input-wrapper` floating-label pattern (CI guard `check:form-pattern` PASS). Clamp `[min, max]` on both stepper + direct input. Use `pointerdown`/`pointerup` events (NOT `mousedown`).

3. **AC-3 — StatusPill.** Inputs: `status: 'planned'|'logged'`, `completedAt: string|null`. `planned` → 📌 + `"Kế hoạch"` + bg `var(--sage-50)` opacity 0.6. `logged` → 🔒 + `"Đã ăn lúc {HH:mm}"` (parse `completedAt` via `Intl.DateTimeFormat('vi-VN', {hour:'2-digit', minute:'2-digit'})`) + bg `var(--sage-200)`.

4. **AC-4 — ConfirmEatModal.** Inputs: `dishName`, `mode: 'mark'|'unmark'`. mode=mark: title `"Đánh dấu '{dishName}' đã ăn?"`, body `"Số liệu sẽ được lưu cố định."` + microcopy explaining Hybrid policy. mode=unmark: title `"Bỏ đánh dấu '{dishName}'?"`, body `"Số liệu hiện tại sẽ bị xoá và quay về realtime theo recipe."`. Output `confirmed = output<boolean>()`. Touch target ≥44dp on [Hủy] / [Xác nhận]. Wrap `IonModal` per existing pattern.

5. **AC-5 — `bandColor` util** at `src/app/core/utils/band-color.ts`. Pure: `bandColor(pct: number, variant: KeyMetric): 'low'|'medium'|'good'|'high'` per arch §10.1 5-band table. Spec: 5 boundary cases + 1 null/NaN guard.

6. **AC-6 — PC-1 binary + Style 2025.** Each component = 3 files (`.ts` + `.html` + `.scss`). NO inline template/style. NO `.component.ts` suffix. NO class `Component` suffix. CI guards `check:pc1` + `check:style-2025` PASS.

7. **AC-7 — Design tokens.** All color/font-size use `var(--*)` (no hard-coded hex/px). CI guard `check:design-tokens` PASS.

8. **AC-8 — Spec coverage.** ≥4 specs per component covering input validation, computed/derived state, output emissions, accessibility hooks. ≥6 specs for `bandColor` util.

## Tasks

- [x] **T1**: `band-color.ts` util + spec (15 specs PASS).
- [x] **T2**: `CalorieRing` 3-file component + spec (16 specs PASS).
- [x] **T3**: `ServingsStepper` 3-file component + spec (15 specs PASS).
- [x] **T4**: `StatusPill` 3-file component + spec (9 specs PASS).
- [x] **T5**: `ConfirmEatModal` 3-file component + spec (11 specs PASS).
- [x] **T6**: `ng test` 558/558 PASS; `check:guards` 9/9 PASS; web build PASS; APK debug BUILD SUCCESSFUL.
- [x] **T7**: Sprint status rev bump + commit.

## Dev Notes

- **Pattern reference**: `nutrition-badge` (3-file, `@Component({ standalone, OnPush, templateUrl, styleUrl })`, class WITHOUT `Component` suffix).
- **5-band table** (arch §10.1): low <50%, medium 50–79%, good 80–110%, high 111–149%, over ≥150%. Util returns 4-band collapse: `low`/`medium`/`good`/`high` (over folds into high per AC-5 signature).
- **Input signals vs decorators**: existing codebase uses `@Input` decorator (see `nutrition-badge`); for `ServingsStepper.value` use `model()` per AC-2 (Angular 21 idiom). KHÔNG mix `@Input` + `model()` trên cùng class.
- **CI guard `check:guards`** = 9 guards all-in-one. Run `npm run check:guards` thay vì 5 lệnh riêng.
- **Tap-and-hold pattern**: use `setInterval` after `setTimeout(500)`, clear both on `pointerup`/`pointerleave`/`pointercancel`. Do NOT leak timers if component destroyed → unregister in `ngOnDestroy`.
- **Pitfall — `bandColor` boundary**: `pct = 50` → `medium` (inclusive lower); `pct = 80` → `good`; `pct = 111` → `high`. Document boundaries in spec.
- **Pitfall — `Intl.DateTimeFormat` SSR**: not used here (Capacitor app, no SSR), but parse must guard `null`/invalid → return `"Đã ăn"` fallback.

## DoD

- 4 components + 1 util implemented per AC.
- ≥22 specs (4×4 component + 6 util + buffer).
- ≥510 tests pass; `check:guards` 9/9 PASS; build + APK pass.
- Sprint status updated; conventional commit.

## Change Log

| Date | Change |
|------|--------|
| 2026-05-10 | Story created (`ready-for-dev`). |
| 2026-05-10 | Dev complete: 5 artifacts (`band-color` util + `CalorieRing` + `ServingsStepper` + `StatusPill` + `ConfirmEatModal`); 66 new specs added (558/558 total PASS); `check:guards` 9/9 PASS; web build + APK debug BUILD SUCCESSFUL. Status → `ready-for-review`. |

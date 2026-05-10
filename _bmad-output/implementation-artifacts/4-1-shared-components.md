# Story 4.1: Shared components — MacroRow + RecipeChangedBanner + TrendBarChart

Status: done

<!-- Source: _bmad-output/planning-artifacts/epic-4-nutrition-tracking.md (rev 1) lines 204-264 -->

## Story Goal

Hoàn thiện 3 shared component còn thiếu (sau Story 3.4) theo DEC-09 §10.2/10.4 + new TrendBarChart. Sau story này, S1/S2/S4 surfaces (4.2-4.4) chỉ ráp building block — không component logic mới ở feature layer.

## Tasks

- [ ] **T1**: `MacroRow` (`src/app/shared/components/macro-row/macro-row.{ts,html,scss,spec.ts}`) — standalone, OnPush, signal `input()` API per AC-1. Compact = 3 column ngang (mini ring 32px); expanded = 3 row bar full-width. Order Protein → Carbs → Fat fixed.
- [ ] **T2**: `RecipeChangedBanner` (`src/app/shared/components/recipe-changed-banner/`) — banner dạng warning với snapshot vs current + diffPct + faqLinkClicked output.
- [ ] **T3**: `TrendBarChart` (`src/app/shared/components/trend-bar-chart/`) — SVG bars, target line dashed, animation 400ms, optional `compareWith` overlay (opacity 0.5).
- [ ] **T4**: Spec basic mỗi component: render variant + emit output (banner) + ariaLabel cover empty/full state.
- [ ] **T5**: Run guards + ng test + ng build prod + APK install emulator-5554.

## ACs

- **AC-1 MacroRow**: API đúng spec (mode `compact` | `expanded`, 3 macro inputs required, fiber optional, highlightedMetric border highlight). Order P→C→F fixed. Color qua `bandColor()`.
- **AC-2 RecipeChangedBanner**: Visual warning bg, ⚠️ icon, BOLD snapshot value, italic recipe-current, delta line. "ℹ️ Tại sao?" link → emit `faqLinkClicked`. Caller responsibility cho threshold (component không compute).
- **AC-3 TrendBarChart**: SVG (NOT canvas), bar color = `bandColor(value/target × 100, metric)`, target line dashed `var(--ion-color-medium)`, X-axis T2..CN cho week / 1,5,10,15,20,25,30 cho month. Empty bar = height 0 + "─" label. compareWith overlay sau bars chính, opacity 0.5.
- **AC-4 Guards**: PC-1 (page-component-1 file ↔ multiple shared), Style 2025 (no `.component.` suffix, no `Component` class suffix), design-tokens, form-pattern. Tất cả guards PASS.
- **AC-5 Spec**: Tối thiểu 4 spec/component (render compact/expanded + output emit + aria-label + edge case zero/empty).

## Deferred

- Animation tween framework — chỉ dùng CSS transition, no GSAP/anime.js (Phase 4).
- Per-macro band tweak (fat tolerance wider) — Phase 4 fine-tune.
- Trend month view 30/31 day handling — chỉ render up to range của data; chart không tự fill missing days (caller responsibility).

## Verification

- ≥12 new specs (4 mỗi component × 3).
- `npm run check:guards` PASS.
- `npx ng test` 100%; `ng build production` OK.
- APK install emulator-5554; smoke launch only (surfaces wire ở Story 4.2+).

## Pitfalls

- **PC-1 violation:** mỗi component PHẢI là 4 file riêng (.ts/.html/.scss/.spec.ts). Inline template/styleUrl='...' không hợp lệ.
- **Style 2025 class name:** dùng `MacroRow` / `RecipeChangedBanner` / `TrendBarChart` (không suffix `Component`).
- **SVG viewBox:** TrendBarChart bars phải scale đúng theo `height` input — dùng viewBox + preserveAspectRatio chứ không hard-code SVG dimensions.
- **bandColor pct args:** truyền `(value/target) * 100` (NOT raw ratio). Lib clamp 0-200 trong CalorieRing là caller responsibility — TrendBarChart caller pre-clamp.
- **highlightedMetric border-highlight:** chỉ render với `var(--ion-color-primary)` border, KHÔNG đổi background — tránh nhiễu visual hierarchy.

## Changelog

| Date | Change |
|------|--------|
| 2026-05-10 | Story created (`ready-for-dev`) — drafted from epic-4-nutrition-tracking.md §Story 4.1 sau khi Story 4.0 đóng @ a5df46a. |
| 2026-05-10 | Story complete @ `c2118d9` — 3 components + 27 specs (723/723 PASS). Guards PASS, prod build OK, APK installed emulator-5554. Status `done`. |

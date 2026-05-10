# Story 4.0: NutritionStore + NutritionQueryService + KeyMetricRouter foundation

Status: ready-for-dev

<!-- Source: _bmad-output/planning-artifacts/epic-4-nutrition-tracking.md (rev 1) lines 132-200 -->

## Story Goal

Cung cấp foundation Phase-3 layer 1 cho F-04: aggregate query service (`NutritionQueryService`), reactive store (`NutritionStore`) listen `CalendarStore.invalidationTick`, và pure-function Smart Key Metric router. Sau story này, các surface S1..S4 (Story 4.2-4.4) chỉ cần consume signal — không inline SQL ở component.

## Tasks

- [ ] **T1**: `NutritionQueryService` (file `src/app/core/services/nutrition/nutrition-query.ts`, class `NutritionQueryService`) với 3 method `dailyTotals(date)` / `weekTotals(weekStart)` / `trend(start, end, metric)` + spec ≥6 case (3 method × 2 case with-data/empty).
- [ ] **T2**: EXPLAIN QUERY PLAN spec assertions (3) chứng minh 3 query dùng partial index (`idx_planned_dish_completed`, `idx_planned_dish_completed_at`, `idx_day_plan_date`).
- [ ] **T3**: `KeyMetricRouter` pure functions (`src/app/core/utils/key-metric-router.ts`): `routeKeyMetric(level, goal)`, `visibleMetrics(variant)`, `pickKeyMetric(profile)` + spec 5 variant × 4 goal matrix + null-profile fallback `'beginner'`.
- [ ] **T4**: `NutritionStore` (`src/app/core/stores/nutrition.store.ts`, `providedIn: 'root'`) — signals `today`, computed targets, computed `keyMetric`. `effect()` listen `CalendarStore.invalidationTick + currentDate` → reload `today`. `loadTrend()` với in-memory cache TTL 5 phút keyed `${start}_${end}_${metric}`, cleared trên `invalidationTick`.
- [ ] **T5**: Spec `nutrition.store.spec.ts` — invalidationTick listen reload today; trend cache hit / miss / clear-on-tick.
- [ ] **T6**: Style 2025 / PC-1 / design-tokens / form-pattern / story-scope guards PASS; `ng test` 100%; `ng build production` OK; APK debug build + install emulator-5554 (smoke launch only — no UI surface yet).

## ACs

- **AC-1** `NutritionQueryService` API + SQL pattern đúng arch §10.2 / DEC-06: `dailyTotals` SUM effective_* INCLUDE planned + logged; `weekTotals` GROUP BY date CHỈ logged; `trend` CTE pattern, `[{date, value}]`.
- **AC-2** EXPLAIN spec PASS (3 index).
- **AC-3** `NutritionStore` listen one-way `CalendarStore.invalidationTick + currentDate` → reload `today`. Cache trend TTL 5 phút, cleared on `invalidationTick` change.
- **AC-4** `KeyMetricRouter` mapping đúng F-04 §2.5 (beginner / lose / gain / maintain / advanced). Performance fallback ['protein','calories'] (defer dual-equal Phase 4). Null profile → `'beginner'`.
- **AC-5** Spec coverage: query-service ≥6, store ≥4, router ≥21.
- **AC-6** Style 2025 file `nutrition-query.ts` (no `.service.` suffix), class `NutritionQueryService` allowed (domain term per existing convention `Repository`/`Store`/etc); nếu `check:style-2025` flag class name → fallback class `NutritionQuery`. Decision recorded sau khi guard chạy.

## Deferred

- Performance variant dual-equal (Phase 4).
- Aggregate snapshot table (Phase 4 if R-A4 trend slow trên Android low-tier).
- Manual QA UI (no surface this story — covered Story 4.2+).

## Verification

- ≥31 new specs (6 query + 4 store + 21 router).
- `npm run check:guards` PASS (style-2025 final decision recorded above).
- `npm run build` PASS (no new TS errors above pre-existing baseline).
- APK debug build + install emulator-5554 OK (app launches; no nutrition surface to verify yet).

## Pitfalls

- **Disaster C — schema field naming:** target fields là `target_calories/target_protein/target_carbs/target_fat` (NO `_g` suffix). Verify `profile` schema TRƯỚC khi viết store computed.
- **Cache invalidation race:** clear cache TRƯỚC khi resolve fetch promise — không sau (effect order matters).
- **Style 2025 + Service class:** nếu CI guard reject class name `NutritionQueryService`, rename → `NutritionQuery` và update tất cả import (story dev sẽ chốt sau khi run guard 1 lần).
- **One-way wire:** `NutritionStore` chỉ listen `CalendarStore`, KHÔNG ngược lại (DEC-04). Tránh circular dep.

## Changelog

| Date | Change |
|------|--------|
| 2026-05-10 | Story created (`ready-for-dev`) — drafted from epic-4-nutrition-tracking.md §Story 4.0 sau khi Story 3.7 đóng (epic-3 complete). |

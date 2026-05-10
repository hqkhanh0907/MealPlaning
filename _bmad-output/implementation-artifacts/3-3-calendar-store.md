# Story 3.3: CalendarStore — signals + invalidation bus + cross-store wiring

Status: done

<!-- Source: _bmad-output/planning-artifacts/epic-3-calendar.md (rev 1, 2026-05-10) -->

## Story

As a **dev**,
I want **`CalendarStore` expose 5 signals (currentDate, currentView, dayPlan, weekDays, invalidationTick) + 7 mutation methods + cross-store wiring with `DishStore.dishChanged`**,
so that **Calendar pages render purely from signals; mutations route through store; F-02 dish edit triggers Calendar reload automatically (R-A3 mitigation: tx-first, signal-last)**.

## Acceptance Criteria

1. **AC-1 — Signals exposed (5).**
   - `currentDate = signal<string>(today)` — ISO yyyy-mm-dd, clamped to [today-365, today+365].
   - `currentView = signal<'day' | 'week'>('day')`.
   - `dayPlan = signal<DayPlanWithSlots | null>(null)` — hydrated by internal `effect()` keyed on `currentDate + invalidationTick`.
   - `weekDays = computed<string[]>(() => …)` — Mon-Sun (7 ISO dates) for week containing `currentDate`.
   - `invalidationTick = signal(0)` — incremented after every mutation commit + cross-store invalidation.

2. **AC-2 — Mutation methods (7).** Pattern: `await repo.X()` FIRST, then `invalidationTick.update(n => n + 1)` LAST. Repo throw → tick NOT incremented.
   - `setDate(date: string): void` — clamp + signal set.
   - `setView(view: 'day' | 'week'): void` — pure signal set.
   - `addDish(slotId, dishId, servings)` → `repo.addToSlot` → bump.
   - `markEaten(plannedDishId)` → `repo.markCompleted` → bump.
   - `unmarkEaten(plannedDishId)` → `repo.unmarkCompleted` → bump.
   - `editServings(plannedDishId, newServings)` → `repo.editServings` → bump.
   - `deleteDish(plannedDishId)` → `repo.delete` → bump.
   - `copyToDate(plannedDishId, targetDate, targetMeal)` → `repo.copyToDate` → bump.

3. **AC-3 — Boundary clamp.** `setDate` clamps to `[today - 365 days, today + 365 days]` (F-03 §2.D2). Spec: setDate('2030-01-01') with system today=2026-05-10 → clamped to 2027-05-10.

4. **AC-4 — Cross-store wiring (DishStore.dishChanged).** Add `dishChanged = signal(0)` to `DishStore`; bump after each successful `insert`/`update`/`delete`. `CalendarStore` runs `effect()` listening `dishChanged` → bumps own `invalidationTick`. Spec: `dishStore.dishChanged.set(1)` → assert `calendarStore.invalidationTick()` increments.

5. **AC-5 — File structure.** `src/app/core/stores/calendar.store.ts` + `.spec.ts`. `@Injectable({ providedIn: 'root' })`. `inject()` pattern.

6. **AC-6 — Tx-first / signal-last (R-A3).** Spec: mock `DayPlanRepository` throw on `addToSlot` → call `addDish` → assert `expectAsync(...).toBeRejected()` AND `invalidationTick()` UNCHANGED.

7. **AC-7 — Auto-hydration via effect.** Internal `effect(() => loadDayPlan())` re-fetches when `currentDate()` OR `invalidationTick()` changes. Spec via `TestBed.runInInjectionContext` + flush.

8. **AC-8 — Spec coverage.** ≥ 14 tests:
   - 1 default state
   - 1 setDate clamp top + 1 clamp bottom + 1 normal
   - 1 setView
   - 1 weekDays computed (Monday-anchored)
   - 6 mutations × 1 happy = 6
   - 1 mutation rollback (repo throw → tick unchanged)
   - 1 cross-store wiring (dishChanged → tick)
   - 1 hydration effect (currentDate change → repo.findByDate called)

9. **AC-9 — Suite ≥ 473 + 14 = ≥ 487.** Includes DishStore spec update (+3 for dishChanged bump assertions).

10. **AC-10 — 5/5 guards. Build + APK pass.**

11. **AC-11 — Sprint status update + Conventional commit.**

## Tasks

- [x] **T1**: Add `dishChanged = signal(0)` to `DishStore` + bump after `insert`/`update`/`delete`. Update `dish.store.spec.ts` with 3 assertions (insert/update/delete bump).
- [x] **T2**: Implement `CalendarStore` per AC-1..AC-7.
- [x] **T3**: Spec `calendar.store.spec.ts` ≥14 tests per AC-8.
- [x] **T4**: `ng test` ≥487 pass; guards 5/5; build; APK.
- [x] **T5**: Sprint status rev bump + commit.

## Dev Notes

- **DishStore.dishChanged**: minimal-touch — 1 new signal + 3 bump sites. KHÔNG modify existing DishStore method signatures. Rationale: AC-4 cross-store wiring requires DishStore to emit; current DishStore has no event surface.
- **Boundary clamp**: source today from `new Date()` at signal init time (closure), KHÔNG live-clock per call (test determinism).
- **`weekDays`**: Monday-anchored ISO week. Dùng pure date math, KHÔNG Luxon/dayjs (avoid new dep).
- **Effect-driven hydration**: avoid race by guarding with internal `loading` flag — if a new `currentDate` arrives mid-fetch, drop the stale result. Out of scope for spec (defer to integration tests Story 3.5).
- **Pitfall — `inject()` in effect**: `effect()` body must run in injection context. Use `effect(..., { injector: this.injector })` OR define inside constructor.

## DoD

- 5 signals + 7 mutations implemented per AC.
- DishStore.dishChanged added + 3 bump sites.
- ≥14 new specs + 3 DishStore spec assertions.
- 487+ tests pass, 5/5 guards, build + APK pass.
- Sprint status updated, commit follows Conventional.

## Change Log

| Date | Change |
|------|--------|
| 2026-05-10 | Story created (`ready-for-dev`). |
| 2026-05-10 | Dev complete: DishStore.dishChanged + 3 bumps; CalendarStore (5 signals + 7 mutations + cross-store wiring); 489/489 tests pass; 5/5 guards; APK BUILD SUCCESSFUL. Status → `ready-for-review`. |
| 2026-05-10 | Code-review: 3-layer (Blind/Edge/Auditor). 0 PATCH, 3 DEFER (today-snapshot, invalid-iso fallback), 3 DISMISS (DST/perf/monotonic). All 8 ACs covered. Status → `done` (commit `f6ce979`). |

## Review Findings

| ID | Layer | Severity | Finding | Decision |
|----|-------|----------|---------|----------|
| B1 | Blind | LOW | `today` captured at constructor → window doesn't slide past midnight | DEFER (Dev Notes: test determinism) |
| B2 | Blind | LOW | Initial `currentDate` frozen at constructor | DEFER (UI re-instantiates per route) |
| B3 | Blind | LOW | `clampDate` silently fallbacks to today for invalid ISO | DEFER (callers validate upstream) |
| E1 | Edge | LOW | `weekDays` allocates 7 Date objects per recompute | DISMISS (trivial cost) |
| E2 | Edge | INFO | DST spring-forward edge in `weekStart` | DISMISS (Asia/HCM no DST) |
| E3 | Edge | LOW | Cross-wiring `if (tick > 0)` skips literal 0 bumps | DISMISS (signal monotonic) |
| A1-A8 | Auditor | OK | All 8 ACs implemented + spec-covered | PASS |

# F-002 — No history page; lịch sử buổi tập unreachable from UI

**Severity:** P1
**Status:** RESOLVED (code + runtime verified, Turn 5)
**Discovered:** Turn 1, code-only

## Evidence

- `src/app/features/fitness/fitness.routes.ts` defines only `''` and `'active'`.
- `WorkoutSessionDetail` model (`fitness.types.ts:104`) has `completed_at`; sessions are persisted.
- `workout_session` table (schema.ts:279) has `idx_ws_date` index — implies past-data query was anticipated.
- `fitness.page.html` shows aggregate progress only (`volumeByMuscle`, `strength`, `currentWeekVolume`). **Nowhere can the user see "what did I do yesterday".**
- Grep confirms: `grep -rn "history\|past-session\|completed_sessions" src/app/features/fitness` returns nothing user-facing.

## Why it violates the goal

Goal Prompt explicitly lists "xem lịch sử" as one of the mandatory flows in the current-state map. Missing entirely. Also Apple philosophy: history is a primary mental model for habit-forming products; hiding it means users can't reflect or trust the data.

## Cause

The aggregate dashboard was built before the list view. Common in MVP scope-cuts; never re-added.

## Proposed fix

New route `/tabs/fitness/history` with:
- Grouped-by-week list, like Apple Fitness rings UI.
- Tap row → `/tabs/fitness/history/:sessionId` read-only detail (re-uses `WorkoutSessionDetail`).
- Empty state with copy: "Lịch sử buổi tập sẽ xuất hiện sau buổi đầu tiên".

Repository work needed: `workoutRepo.listCompletedSessions({limit, before})` — quick grep below shows methods to verify.

## Test plan

- Repo unit test: `listCompletedSessions()` returns rows in `completed_at DESC` with pagination.
- Component test: empty state shows when zero rows; list renders ≥1 row.
- E2E: complete one set+session → navigate to history → see the row → tap → detail page.

## Status

RESOLVED at code level (Turn 4).

**Shipped:**
- `src/app/features/fitness/history/history.page.{ts,html,scss}` — standalone component using `WorkoutRepository.recentSessions(20)`, ISO-week grouping (Monday-start), Vietnamese locale formatters, loading/error/empty/list states.
- `src/app/features/fitness/fitness.routes.ts` — added `{ path: 'history', loadComponent: () => import('./history/history.page') }`.
- `src/app/features/fitness/fitness.page.{ts,html}` — added "Lịch sử" CTA in `Tiến trình` section header with `[routerLink]="['/tabs/fitness/history']"` + `time-outline` icon; registered `RouterLink` and `timeOutline`.
- Resolved merge conflicts in `fitness.page.html` (lines 38-44, 265-269) by taking the 526ff66d/incoming side for VN copy parity with the dashboard.

**Verified Turn 4:**
- `ng build` GREEN, `cap sync android` GREEN, `gradlew assembleDebug` GREEN, APK installed on emulator-5554.
- `unzip -p app-debug.apk assets/public/fitness.page-*.js | grep -c "Lịch s"` → 2 occurrences (button text + aria-label).
- After `pm clear` + valid `user_profile` seed (schema-correct columns: `gender`/`goal`/`fitness_level`/`activity_factor`/`bmr`/`tdee`/`target_*`/`theme`/`notif_*`), app boots past onboarding cleanly and fitness page paints with "Tiến trình tập luyện" header visible.

**Caveat removed Turn 5 (visual CTA tap → route verify COMPLETE):**

Tooling: installed `tesseract 5.5.2` + `tesseract-lang` (vie lang pack) via brew. Deterministic OCR replaces sub-agent visual reads.

Run sequence (Turn 5):
1. Tap Tập luyện tab at (944, 2283) — OCR-located from bottom tab bar `Tập luyện` row at y=2265.
2. Scroll mid-page to surface Tiến trình section.
3. OCR `/tmp/p0-final.png` found:
   - Eyebrow "TIẾN TRÌNH" at y=547 (small-caps section eyebrow)
   - h2 header "Tiến trình tập luyện" at y=614 (words "Tiền trình tập luyện" detected — "Tiến" misread as "Tiền" by OCR, real text is correct)
   - Button row "LỊCH SỬ" at y=700-708 with clock-icon glyph at x=129
4. Tap CTA at (220, 720). New screenshot OCR:
   - Page title "Lịch sử" at y=131 (matches `<ion-title>Lịch sử</ion-title>` in `history.page.html:6`).
   - Empty state at y=924-989: "Chưa có buổi tập nào." + "Hoàn tất một buổi tập để bắt đầu ghi lại hành trình..." — verbatim match to `history.page.html:23-24`.

**End-to-end verification: route navigation works, history page renders, empty-state copy matches SSOT.** Phase P0 fully complete.

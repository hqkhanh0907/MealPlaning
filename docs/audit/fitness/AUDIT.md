# AUDIT TẬP LUYỆN — HealthMate AI / MealPlaning

**Phiên bản:** Turn 12 (Pha 1 ship — history reachable + footer Hoàn thành restored)
**Phạm vi:** Toàn bộ feature `src/app/features/fitness` + dependencies `core/stores/fitness.store`, `core/repositories/{exercise,training-plan,workout}.repository`, `core/services/database`, schema `workout_session/workout_exercise/workout_set/training_plan*/exercise`.
**Phương pháp:** code-read + runtime emulator (emulator-5554, APK debug fresh build) + DB-truth (run-as cat databases/healthmateSQLite.db + WAL) + uiautomator dump + vision QA. Mọi nhận định CODE phải có evidence runtime hoặc DB; KHÔNG dùng `read_file` cache (đã xảy ra mismatch nghiêm trọng turn 11→12).

---

## 1) Executive Summary

Tập luyện hiện là MỘT page kitchen-sink (`fitness.page.{ts,html,scss}` ~5.8 KB TS + 19.7 KB HTML + 9.5 KB SCSS) gánh đồng thời 6 trách nhiệm: chọn giáo án, lịch tuần, hôm nay/empty-rest, free-mode picker, active session inline logger, progress dashboard. Hệ quả Apple-spirit: hierarchy mờ, cognitive load cao, set logger nằm trên cùng scroll với progress khiến input bị tab bar che. Codebase ĐÃ tách 3 route nhưng 2 route con không reachable từ UI (F-014) — di sản merge `origin/main` chưa hoàn tất. `active-workout/*.{ts,html,scss}` (229 dòng TS) là dead code runtime, song song với inline logger trong hub.

Persistence chín: `workout_session/exercise/set` schema chuẩn, FK + index hợp lý, `syncTotals()` đảm bảo `total_volume` không phân kỳ với SUM(set), `updateSet` đầy đủ 5 col (F-004 ship), mutations đều `withTransaction` + idempotent. Tuy nhiên thiếu: `workout_session.status` (F-005 — cancel = hard DELETE), `workout_set.status/completed_at` (F-007 — không phân biệt completed/skipped), `set_type/duration_seconds/distance_m` (F-003 — cardio dead-end), autosave draft (F-006).

UI logger runtime OK cho strength. Nhưng:
- **F-015 P1 NEW Turn 12:** sau `GHI SET` trong cùng session, exercise-tab pill + total_volume **không refresh** đến khi navigate đi-về hoặc cold restart → data-fidelity perception bug, user có thể log lại lần 2 = double-insert.
- **F-008 redux Turn 12:** footer Hoàn thành biến mất sau merge → đã restore.
- **F-002 regress Turn 12:** entry Lịch sử biến mất → đã restore.
- **F-016 P2 NEW:** history grouping sai cho ngày Chủ Nhật.
- **F-017 P2 NEW:** picker 2 entry cùng wording.
- **F-018 P3 NEW:** mọi button uppercase, không Apple.

Đề xuất Pha 2: rewrite IA theo blueprint 5 page riêng (Home / Plans / Active / History / Insights) + extract `<exercise-picker-sheet>` modal. Khả thi vì store + repo đã đủ chín; chi phí chính ở HTML/SCSS + route wiring.

---

## 2) Bản đồ tính năng hiện có

| # | Tính năng | Surface | Code path | Persistence | Runtime |
|---|---|---|---|---|---|
| 2.1 | Chọn giáo án preset | hub "GIÁO ÁN" | `training-plan.repository.activatePlan` | `training_plan*` | OK |
| 2.2 | Tạo giáo án AI | hub AI banner | `fitness-ai.ts` Gemini | `training_plan` + `ai_*` | UI OK; net chưa test |
| 2.3 | Lịch tuần | hub | template | derived | OK read-only (UX yếu) |
| 2.4 | Hôm nay / rest | hub card | `fitness.store.todayDay` | derived | OK |
| 2.5 | Start guided | "Hôm nay" CTA | `workoutRepo.startGuidedSession` | INSERT session+exercises | OK (CN rest day hidden) |
| 2.6 | Start free | hub CTA | `workoutRepo.startFreeSession` | INSERT session | OK |
| 2.7 | Picker free-mode | hub toggle | `addExerciseToActive` | INSERT exercise | OK; F-017 double-entry |
| 2.8 | Active logger | hub inline | `fitness.store.logSet` | INSERT set + syncTotals tx | OK persist; F-015 stale |
| 2.9 | Exercise tab strip | inline | `selectWorkoutExercise` | derived | OK |
| 2.10 | Repeat last set | logger | `repeatLastSet` Turn 11 | INSERT clone | Code OK; runtime untested |
| 2.11 | Sửa set (5 fields) | tap row | `updateSet` → `workoutRepo.updateSet` | UPDATE 5 col + syncTotals | OK; alert UX yếu |
| 2.12 | Xóa set | trash | `deleteSet` | DELETE + re-number + syncTotals | OK |
| 2.13 | Xóa bài | per-ex trash | `removeExerciseFromActive` | DELETE cascade | OK |
| 2.14 | Hủy buổi | header ✕ | `cancelSession` | **DELETE cascade** (F-005) | OK; hard delete |
| 2.15 | Hoàn thành | footer (Turn 12 restore) | `completeSession` | UPDATE completed_at/duration | OK ✓ |
| 2.16 | Rest timer | `<rest-timer>` + effect | signal + interval | volatile | OK manual+auto |
| 2.17 | Lịch sử | route `/history` (Turn 12 CTA) | `recentSessions(20)` | SELECT completed | OK; F-016 group sai CN |
| 2.18 | Tiến trình | hub section | `progressSummary` | aggregate | OK |
| 2.19 | Resume workout | refresh | `getActiveSession` | SELECT WHERE completed_at NULL | OK |
| 2.20 | Autosave draft | KHÔNG | — | — | F-006 OPEN |

5 mismatch nghiêm trọng (F-014, F-008-redux, F-002-regress, F-015, F-016). 4 pre-existing (F-003/F-005/F-007/F-009). 3 mới (F-014/F-015/F-016/F-017/F-018).

---

## 3) Review từng tính năng — quyết định giữ-sửa-xóa-thêm

Định dạng: tên · hiện trạng · runtime · code · UX · severity · quyết định.

### 3.1 Chọn giáo án preset
- **Hiện có:** 3 preset cards, button "CHỌN" / chip "ĐANG DÙNG", auto-pick Full Body lần đầu.
- **Runtime:** OK; tap CHỌN không hoạt động nếu đang có active session → tooltip "Đang có buổi tập, hoàn thành trước khi đổi giáo án".
- **Code:** `training-plan.repository.ts:ensurePresetPlans` idempotent INSERT OR IGNORE; `activatePlan` set một plan `is_active=1`.
- **UX:** OK; mô tả ngắn gọn, có chip count "3 buổi/tuần · 12 bài". Khoảng cách giữa card lớn — đẹp.
- **Quyết định:** GIỮ NGUYÊN cho Pha 1. Pha 2 tách sang page `Plans` riêng.

### 3.2 Tạo giáo án AI custom
- **Hiện có:** Banner gradient + nút "✨ TẠO".
- **Runtime Turn 12:** chưa test (cần network + emulator có internet).
- **Code:** `fitness-ai.ts` gọi Gemini, parse JSON, persist như preset plan với `is_ai_generated=1`.
- **UX:** OK affordance; copy "Giáo án AI riêng cho bạn" rõ.
- **Quyết định:** GIỮ; Pha 2 di sang page Plans.

### 3.3 Lịch tuần
- **Hiện có:** Pills T2..CN với mỗi day name + count bài.
- **Runtime:** OK render; không có CTA tap-into-day.
- **UX yếu:** read-only; user không thể tap T3 để xem chi tiết hoặc swap với hôm nay. Là "decoration" hơn là "tool". Apple HIG: mọi visible affordance nên tappable.
- **Quyết định:** SỬA — Pha 2 tap day → bottom sheet xem chi tiết bài + button "Tập ngay" (hoán đổi today).

### 3.4 Hôm nay (planned hoặc rest)
- **Hiện có:** Card lớn "Buổi tập hôm nay" eyebrow ngày · title day-name hoặc "Ngày nghỉ" · description · CTA "BẮT ĐẦU".
- **Runtime:** CN Full Body = rest day → CTA secondary "Bắt đầu buổi tự do".
- **UX:** Hierarchy rõ. Tuy nhiên trong rest day em đề xuất show progress hôm nay (steps, weight log) thay vì just empty.
- **Quyết định:** GIỮ; Pha 2 enrich rest-day content.

### 3.5 + 3.6 Bắt đầu buổi (guided/free)
- **Code:** transaction-safe, idempotent.
- **UX:** OK; sau tap, session render inline → confusing vì user expect "đi vào trang ghi set". Mental model break.
- **Quyết định:** SỬA Pha 2 — `startGuided/startFree` phải `router.navigate(['/tabs/fitness/active'])` (xem F-014).

### 3.7 Picker free-mode
- F-009 + F-017 cover. Quyết định: TÁCH thành `<exercise-picker-sheet>` modal Pha 2.

### 3.8–3.13 Active logger
- DB-correctness: OK 100%.
- F-015 signal stale: CẦN FIX Pha 2 (redesign repo API).
- F-004 edit-set widened đã ship turn 9 ✓.
- F-012 updated_at column đã ship turn 3 ✓.
- F-013 fresh-install migration đã ship turn 3 ✓.
- **UX yếu hiện nay:**
  - Logger nằm trong cùng scroll với progress, dashboard, picker → khi user log set, scroll-position khiến input bị tab bar che (Turn 12 quan sát).
  - 5 input flat layout (weight/reps/rest/effort/notes) — Apple style sẽ: weight + reps prominent inline (1 row), rest + effort là secondary, notes optional expandable.
  - Effort chip group lành; "Vừa" được pre-select default → tạo bias khảo sát RPE. Đề xuất: default null, user phải chọn.
- **Quyết định:** GIỮ logic, REWRITE UI layout sang dedicated page Pha 2.

### 3.14 Cancel
- F-005 OPEN. Hard DELETE CASCADE — không Apple.
- **Quyết định Pha 2:** soft-delete với `status='cancelled'`, undo toast 5s, cancelled sessions vẫn render trong history dimmed.

### 3.15 Hoàn thành
- F-008-redux đã restore Turn 12 ✓.

### 3.16 Rest timer
- Effect cleanup logic OK.
- UX: label "REST TIMER" raw caps, mã hóa câu "0:00 BẮT ĐẦU" không có guide. Pha 2 redesign component: ring progress + speakable copy.

### 3.17 History
- F-002-regress restore Turn 12 ✓.
- F-016 grouping sai cho CN (P2 OPEN).
- UX: hiện chỉ list flat-grouped-by-week. Mỗi row hiển thị mode/sets/volume/duration. Không tap-detail.
- **Quyết định Pha 2:** tap row → `/tabs/fitness/history/:id` read-only WorkoutDetail page (re-use `WorkoutSessionDetail` từ store).

### 3.18 Tiến trình
- 3 KPI card + 2 chart (volume by muscle, 1RM Epley). Render OK Turn 12.
- UX: chart bar đơn giản, không filter range, không compare period.
- **Quyết định Pha 2:** tách sang page `Insights` với range selector (1W/4W/12W), thêm metric "Hôm nay vs Đỉnh".

### 3.19 Resume
- Code OK: `getActiveSession` SELECT `completed_at IS NULL` → store hydrate trên refresh.
- **Test gap:** không có test cho path "session created → kill app → relaunch → session phải resume". Cần spec.

### 3.20 Autosave / draft / offline (F-006)
- KHÔNG có draft persist. `setDraft` signal in-memory.
- Hệ quả: user gõ weight=60, đột nhiên app bị OS kill → mất.
- **Quyết định Pha 2:** thêm `workout_set_draft` table (1 row, key=workout_exercise_id) hoặc đơn giản hơn — `localStorage` save mỗi 500ms debounce. Tradeoff giữa data-integrity và simplicity. Offline-only app → localStorage OK.

---

## 4) Set logging deep dive

### 4.1 Dữ liệu hiện có vs còn thiếu

| Trường | Có? | Persist? | Validate? | Editable? | UI? |
|---|---|---|---|---|---|
| weight_kg | ✓ | ✓ | 0..500 | ✓ (F-004 ship) | input number |
| reps | ✓ | ✓ | int 1..100 | ✓ | input number |
| rest_seconds | ✓ | ✓ | int 0..600 | ✓ | input number |
| effort (easy/just_right/hard/maxed) | ✓ | ✓ | CHECK enum | ✓ (alert index UX yếu) | chip group, default "Vừa" |
| notes | ✓ | ✓ | trim → null | ✓ | textarea |
| set_number | ✓ | ✓ (auto-incr trong workout_exercise scope) | derived | re-numbered on delete | — |
| created_at | ✓ | ✓ default datetime('now') | — | — | — |
| updated_at | ✓ (F-012 ship) | ✓ | — | auto on update | — |
| **status** (completed/skipped) | ✗ | ✗ | — | ✗ | F-007 OPEN |
| **completed_at** | ✗ | ✗ | — | ✗ | F-007 OPEN |
| **set_type** (strength/cardio) | ✗ | ✗ | — | ✗ | F-003 OPEN |
| **duration_seconds** (cardio) | ✗ | ✗ | — | ✗ | F-003 OPEN |
| **distance_m** (cardio) | ✗ | ✗ | — | ✗ | F-003 OPEN |
| **RPE 1-10** | ✗ (chỉ có 4-tier effort) | partial qua effort | — | — | — |

### 4.2 Persistence behavior

- `addSet` wraps trong `withTransaction`: INSERT row + syncTotals (UPDATE workout_exercise.total_volume + workout_session.total_volume). DB-verified Turn 12: 60 kg × 10 → total_volume=600. Atomic.
- `updateSet` (F-004): UPDATE 5 col + updated_at trong tx + syncTotals. Atomic.
- `deleteSet`: DELETE + re-number set_number của các row sau trong cùng workout_exercise + syncTotals trong tx. Atomic.
- `cancelSession`: DELETE workout_session → cascade workout_exercise → cascade workout_set. **Không tx wrap, không undo** (F-005).

### 4.3 Stale signal bug (F-015)

Đã trình bày chi tiết F-015. Tóm tắt: sau `addSet → getSession → activeSession.set(new)`, UI **không** re-render exercise-tab pill / total_volume trong cùng session lifecycle. Reproducer + hypothesis + fix proposal trong F-015.md.

### 4.4 Autosave / draft / offline (F-006 OPEN)

- `setDraft` là `signal<WorkoutSetDraft>` in-memory. Mất khi OS kill app process trước khi user tap GHI SET.
- Default values `'20'/'10'/'90'/null/''` — tạo prefilled bias (xem 4.5).
- KHÔNG có resume cho draft.
- **Fix proposal (Pha 2):** localStorage `'fitness:setDraft'` debounced 500ms, key = `selectedWorkoutExerciseId`. Reset on logSet success.

### 4.5 Default draft bias

`DEFAULT_SET_DRAFT = { weightKg: '20', reps: '10', restSeconds: '90' }`. Khi user thêm bài mới, weight=20 hiển thị → user typing thường append vào "20" thành "2050" hoặc "200" — turn 12 reproduce thực tế (typed "50" lên field weight="20" → ra "208" do interleave keyevent del). Đây là real production bug cho user trên IME chậm: nếu user clear không hết và type weight chính xác sẽ ra số khác.

**Fix Pha 1 follow-up:** Sau khi user select exercise lần đầu, prefill weight từ **last set của cùng exercise đã log gần nhất** (cross-session), không hardcode 20. Nếu không có history → empty placeholder thay vì "20".

### 4.6 Optimistic update / rollback

KHÔNG có. Mọi mutation `await` repo trả về rồi mới signal write. Trên DB local (sqlite) thì OK; nếu sau này có sync remote sẽ cần re-design.

### 4.7 Validation

- weight: 0..500 (`parseDraft` trong store + `validateSetInput` trong repo). Double-validated.
- reps: int 1..100.
- rest: int 0..600.
- Vi phạm → `errorMessage` signal → red banner UI.
- Edit alert (F-004) reuse validation. OK.

### 4.8 Hardcode / TODO / dead code

- `DEFAULT_SET_DRAFT` literal 20/10/90 (xem 4.5).
- `active-workout/active-workout.page.{ts,html,scss}` — 100% dead code runtime (F-014). 229 dòng TS không bao giờ chạy. Inflate bundle bằng chunk-ZZ22POSI.js (19.01 kB / 4.78 kB transfer).
- `EFFORT_LABELS` const duplicate trong fitness.page.ts VÀ active-workout.page.ts — single source of truth nên là `fitness.types.ts`.
- Empty `if (!session)` early-return có thể là smell trong `addExerciseToActive` (line 247-253).

---

## 5) Danh sách issue theo severity

| # | Severity | Status | File |
|---|---|---|---|
| F-013 | P0 | RESOLVED (turn 3) | F-013-fresh-install-skips-migrations.md |
| F-012 | P0 | RESOLVED (turn 3) | F-012-update-set-missing-column.md |
| F-015 | P1 | OPEN (Pha 2) | F-015-stale-signal-logset.md |
| F-014 | P1 | PARTIAL (history fixed Turn 12; active deferred Pha 2) | F-014-ghost-routes.md |
| F-008-redux | P1 | RESOLVED Turn 12 | F-008-redux-footer-regress.md |
| F-002 | P1 | RESOLVED Turn 12 (re-restored) | F-002-no-history-page.md |
| F-003 | P1 | OPEN (Pha 2, cần migration v7) | F-003-cardio-unloggable.md |
| F-005 | P2 | OPEN (Pha 2, migration v5) | F-005-cancel-no-undo.md |
| F-007 | P2 | OPEN (Pha 2, migration v6) | F-007-no-set-state-machine.md |
| F-008 | P2 | RESOLVED (turn 7-8; redux re-resolved Turn 12) | F-008-complete-action-demoted.md |
| F-009 | P2 | OPEN (Pha 2, picker-sheet) | F-009-picker-wrong-page.md |
| F-004 | P2 | RESOLVED (turn 9) | F-004-edit-set-incomplete.md |
| F-016 | P2 | OPEN (Pha 1 follow-up) | F-016-history-week-grouping-sunday.md |
| F-017 | P2 | OPEN (Pha 2 đồng bộ F-009) | F-017-picker-double-entry.md |
| F-006 | P2 | OPEN (autosave draft) | (chưa có file riêng; ghi trong §4.4) |
| F-018 | P3 | OPEN (Pha 1 follow-up) | F-018-button-uppercase-non-apple.md |

---

## 6) IA mới đề xuất (Pha 2)

```
/tabs/fitness                    → FitnessHome
  hero          "Hôm nay" + 1 CTA primary (Tập / Tự do / Đã xong)
  stats strip   "Tuần này 600kg · Streak 1 tuần · 60 kg"
  shortcut      "Lịch sử →" "Giáo án →" "Insights →"
  resume bar    (hiện khi có active session)

/tabs/fitness/plans              → Plans
  3 preset + AI banner; tap → detail page

/tabs/fitness/plans/:id          → PlanDetail
  Lịch tuần T2..CN; tap day → bottom sheet

/tabs/fitness/active             → ActiveWorkout (DEDICATED page)
  header: Hủy (link, icon-only) · title day-name · timer running
  exercise tabs strip
  logger: weight+reps cùng row, rest+effort row 2, notes row 3 expandable
  set history list
  footer: Hoàn thành buổi tập (primary, full-width)
  trigger sheet: "Thêm bài tập"

/tabs/fitness/active/finish      → FinishSummary
  modal page (Apple-style sheet, swipe-to-dismiss)
  hero: total volume + duration + set count
  exercises summary
  CTA: "Xong"

/tabs/fitness/history            → History
  grouped by week (ISO Mon-start, F-016 fix)
  tap row → /history/:id

/tabs/fitness/history/:id        → WorkoutDetail (read-only)

/tabs/fitness/insights           → Insights
  range selector 1W/4W/12W
  volume chart, 1RM chart, muscle-group split
```

**Lý do tách**: 1 page 1 trách nhiệm; mỗi page có 1 primary affordance; logger sống riêng → input không bị tab bar che; finish summary là moment để celebrate (Apple Activity ring closing), không lẫn với hub.

**Modal/sheet vs page:**
- Page: Home, Plans, PlanDetail, Active, History, HistoryDetail, Insights.
- Sheet: ExercisePickerSheet (Active page trigger), EditSetSheet (replace AlertController 5-input), FinishSummary (modal page).
- AlertController: chỉ giữ cho destructive confirm (Hủy buổi, Xóa set, Xóa bài).

---

## 7) Nguyên tắc UI/UX Apple cho app này

1. **One page, one job.** Mỗi route có duy nhất 1 primary action. Hub primary = "Tập hôm nay"; Active primary = "Hoàn thành"; History primary = "Tap row xem chi tiết".
2. **Hierarchy = role spatial.** Destructive ở header (subtle), destination ở footer (filled primary). Cấm trộn trong cùng region.
3. **Show progress, hide setup.** Default state phải celebrate streak / volume / rings, không show empty form.
4. **Input ở nơi nhập.** Set logger LUÔN nằm ở dedicated page với input visible bằng safe area, không bao giờ bị tab bar / footer che. iOS keyboard handling: `<ion-content>` adjust auto.
5. **Modal sheets cho transient task.** Picker, edit-set, finish summary → modal, swipe-dismiss. Không nhồi vào scroll page chính.
6. **Sentence-case mọi button.** F-018 fix.
7. **Status minh bạch.** Mỗi tap có feedback < 100ms (toast / haptic / animation). Stale signal F-015 vi phạm → critical.
8. **Soft delete + undo cho mọi destructive.** F-005 fix.
9. **Default empty, không bias.** Effort chip không pre-select; weight prefill từ history thay vì 20.
10. **History và Insights là first-class, không footnote.** Hub phải có shortcut visible — không ẩn dưới scroll.

---

## 8) Wireframe chữ (Pha 2 IA)

### 8.1 FitnessHome (`/tabs/fitness`)

```
┌─────────────────────────────────┐
│ Tập luyện              ⚙        │  header
├─────────────────────────────────┤
│                                 │
│  HÔM NAY · CN 17/5              │  eyebrow
│  Ngày nghỉ                      │  H1
│  Hồi phục nhẹ; nếu muốn tập     │  body
│  thì dùng chế độ tự do          │
│  ┌───────────────────────────┐  │
│  │   Bắt đầu buổi tự do      │  │  primary filled
│  └───────────────────────────┘  │
│                                 │
│ ───────────────────────────     │
│  TUẦN NÀY                       │
│   600 kg     1 tuần    60 kg    │
│   khối lượng streak    cân nặng │
│                                 │
│ ───────────────────────────     │
│  GIÁO ÁN: Full Body 3 buổi      │  card
│  T2 A  T3 nghỉ  T4 B  T5 nghỉ  │  pills
│  T6 C  T7 nghỉ  CN nghỉ        │
│  Đổi giáo án →                  │  text link
│                                 │
│  Lịch sử →     Insights →       │  shortcut row
│                                 │
└─────────────────────────────────┘
  Tổng quan  Lịch ăn  Quản lý  TẬP
```

### 8.2 ActiveWorkout (`/tabs/fitness/active`)

```
┌─────────────────────────────────┐
│ ✕ Hủy    Buổi A · 12:34       │  header timer running
│         Full Body Ngày 1        │
├─────────────────────────────────┤
│  ━━━━━━━━ ▲ ━━━━━━━━━━━━        │
│  Squat   Bench   Deadlift  + │  exercise tab strip
│   3/4     0/4      0/4         │
├─────────────────────────────────┤
│                                 │
│  SQUAT · Set 4 of 4             │  H2
│                                 │
│  ┌─────────┐  ┌─────────┐       │
│  │  60 kg  │  │  10  ×  │       │  weight + reps row
│  └─────────┘  └─────────┘       │
│                                 │
│  Rest 90s   Effort: Dễ Vừa Nặng│  row 2
│             [chip] [chip] [chip]│
│                                 │
│  + Ghi chú (optional)           │  expandable
│                                 │
│  ┌───────────────────────────┐  │
│  │      + Ghi set            │  │  primary
│  └───────────────────────────┘  │
│                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│  Set 1  60kg × 10  Vừa   🗑     │
│  Set 2  65kg × 8   Nặng  🗑     │
│  Set 3  65kg × 8   Nặng  🗑     │
│                                 │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │   Hoàn thành buổi tập     │  │  footer
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### 8.3 ExercisePickerSheet (modal, swipe-dismiss)

```
       ┌─────────────────────┐
       │ ▬▬                  │  grab handle
       │                     │
       │ Thêm bài tập    ✕   │
       │                     │
       │ 🔍 Tìm bài tập      │
       │                     │
       │ [Chân] [Ngực] [Tay]│  muscle filter chips
       │ [Lưng] [Vai]  [Bụng]│
       │                     │
       │ ─── KHUYẾN NGHỊ ──  │
       │ Deadlift Romania →  │  recent / progressive
       │ Squat              →│
       │ ─── TẤT CẢ ─────── │
       │ Bench Press        →│
       │ Bent-over Row      →│
       │ ...                 │
       └─────────────────────┘
```

### 8.4 FinishSummary (modal page, swipe-dismiss)

```
       ┌─────────────────────┐
       │ ▬▬             ✕    │
       │                     │
       │      🎉             │  illustration
       │                     │
       │   Hoàn thành!       │
       │   Buổi A · 45 phút  │
       │                     │
       │   2080 kg           │  hero stat
       │   khối lượng        │
       │                     │
       │   12 set · 3 bài    │  secondary
       │                     │
       │ ─── BÀI TẬP ────── │
       │ Squat       4 set  │
       │ Bench       4 set  │
       │ Deadlift    4 set  │
       │                     │
       │ ┌─────────────────┐ │
       │ │     Xong        │ │
       │ └─────────────────┘ │
       └─────────────────────┘
```

### 8.5 History (`/tabs/fitness/history`)

```
┌─────────────────────────────────┐
│ ←  Lịch sử                      │
├─────────────────────────────────┤
│                                 │
│ TUẦN 11–17/5 · 1 buổi          │
│ ┌───────────────────────────┐   │
│ │ CN 17/5                    │   │
│ │ Free Workout · 1 bài      │   │
│ │ 600 kg · 7 phút        →   │   │
│ └───────────────────────────┘   │
│                                 │
│ TUẦN 4–10/5 · 0 buổi           │
│ (empty)                         │
│                                 │
└─────────────────────────────────┘
```

---

## 9) Vấn đề code theo file/path

| File | Vấn đề | Severity |
|---|---|---|
| `src/app/features/fitness/fitness.page.html` | 531 dòng, 6 trách nhiệm; cần split Pha 2 | P1 |
| `src/app/features/fitness/fitness.page.ts` | Một số duplicate icon registration; OK structure | P3 |
| `src/app/features/fitness/fitness.page.scss` | 596 dòng, exceeded budget 8KB → 9.5KB (warning); split khi tách page | P3 |
| `src/app/features/fitness/fitness.routes.ts` | 2 trong 3 routes là ghost (F-014) | P1 |
| `src/app/features/fitness/active-workout/active-workout.page.{ts,html,scss}` | 100% dead code runtime (F-014) | P2 |
| `src/app/features/fitness/history/history.page.ts` | Week grouping off-by-one cho CN (F-016) | P2 |
| `src/app/core/stores/fitness.store.ts` | `DEFAULT_SET_DRAFT` hardcode 20/10/90 (§4.5); stale signal F-015 chain (logSet) | P1 |
| `src/app/core/repositories/workout.repository.ts` | `cancelSession` hard DELETE (F-005); `getSession` không return totals trong cùng tx (F-015 root) | P1 |
| `src/app/core/services/database/schema.ts` | Thiếu `workout_session.status`, `workout_set.status/completed_at/set_type/duration_seconds/distance_m` (F-005, F-007, F-003) | P1 |
| `src/app/core/models/fitness.types.ts` | `ExerciseCategory='cardio'` declared nhưng no field cardio (F-003) | P1 |
| `src/theme/variables.scss` | Button uppercase default chưa override (F-018) | P3 |

---

## 10) Audit test hiện có + gap

### Test hiện có
- `fitness.store.spec.ts` — covers initialize/refresh/activate/start/logSet/cancel/complete/edit/delete/repeat (verified pass Turn 12: 814 total tests GREEN, in đó ~30 spec là fitness).
- `fitness.repositories.spec.ts` — repo unit: round-trip set, syncTotals, transaction safety, F-004 widened.
- `schema.spec.ts` — DDL assertion.
- `migrations.spec.ts` — registry replay.

### Gap chính
1. **F-015 stale signal** — no test reproduce. CẦN: spec assert sau `addSet`, `selectedWorkoutExercise().sets.length` phải === N+1 trong cùng microtask.
2. **F-014 ghost routes** — no test assert routes reachable từ entry-point. CẦN: route smoke test trên `fitness.page` template scan grep `routerLink`.
3. **F-006 autosave** — no test (chưa có feature).
4. **F-016 history grouping** — no test cho boundary case CN. CẦN: parameterized spec với date set spanning các weekday.
5. **F-008 footer visibility gate** — no spec. CẦN: 3 spec cho `activeSession=null`, `canCompleteWorkout=false`, both truthy.
6. **Resume cold-start** — no test reproduce kill-app-and-relaunch.
7. **Cancel undo (F-005)** — no test (chưa có feature).
8. **Cardio (F-003)** — no test (chưa có feature).
9. **Skipped set (F-007)** — no test (chưa có feature).

### Priority
P1 (Pha 1 follow-up): F-015 repro test, F-016 grouping test, F-008 footer spec, F-014 route smoke.
P2 (Pha 2): F-005/F-007/F-003 specs ship cùng migration.
P3: F-018 visual diff (Storybook/Chromatic optional).

---

## 11) Roadmap triển khai theo pha nhỏ

### Pha 1 — Ship Turn 12 (DONE)
- F-002 restore Lịch sử CTA ✓
- F-008-redux restore footer Hoàn thành ✓
- 5 issue file mới (F-014..F-018) ✓
- AUDIT.md ✓
- ng test 814 GREEN ✓
- APK install + emulator verify ✓

### Pha 1.5 — Quick wins (1-2 turn, không migration)
1. F-016 history week grouping fix (helper + tests). ~30 phút.
2. F-018 button uppercase global override + visual sweep. ~20 phút.
3. F-017 Pha 1 mitigation: rename toggle "Thêm bài tập tự do" → "Chọn nhanh bài tập". ~10 phút.
4. F-005 default draft bias: prefill từ last-set của exercise thay vì 20/10/90. ~1h.
5. F-008 spec gate test. ~30 phút.
6. F-006 autosave draft localStorage. ~1h.

### Pha 2 — IA rewrite (3-5 turn, không migration core)
1. Extract `<app-exercise-picker-sheet>` modal component.
2. Wire `router.navigate(['/tabs/fitness/active'])` vào `startGuided/startFree`.
3. Re-purpose `active-workout.page` để thay inline logger trong hub (move HTML/SCSS từ fitness.page → active-workout.page).
4. Strip hub xuống còn hero "Hôm nay" + stats strip + shortcuts. Drop inline picker + inline logger.
5. Tạo `finish-summary.page` modal route `/tabs/fitness/active/finish`.
6. Tạo `plans.page` route `/tabs/fitness/plans` + `plan-detail.page`.
7. Tạo `insights.page` route `/tabs/fitness/insights`.
8. F-015 redesign: `addSet` return full session detail trong cùng tx, store update partial signals.

### Pha 3 — Schema migrations (2-3 turn)
1. v5: `workout_session.status` (F-005). Soft delete + undo toast UI.
2. v6: `workout_set.status/completed_at` (F-007). Skip set UI + goal-vs-actual progress rings.
3. v7: `workout_set.set_type/duration_seconds/distance_m` (F-003). Cardio logger branch UI.

### Pha 4 — Polish + analytics
- F-018 final pass.
- Haptic + animation polish (Lottie ring close).
- Local analytics: count log-set events, average rest, max effort frequency.
- Onboarding cho fitness section (1-3 step intro).

---

## 12) Self-audit từng giải pháp lớn

### A. Restore Lịch sử CTA (Turn 12)
- Đúng Apple? ✓ History là first-class trong Apple Fitness, Activity, Apple Watch. App nói "Apple spirit" mà ẩn history = vô lý.
- Giảm cognitive load? ✓ Thêm 1 button rõ, không tăng noise.
- Tách bạch? — đây là Pha 1, chưa tách page; Pha 2 sẽ tách Tiến trình + Lịch sử thành 2 page riêng.
- Khả thi codebase? ✓ Reuse `history.page` đã có; chỉ thêm `RouterLink` import + 1 button + 1 icon.

### B. Restore bottom-anchored Hoàn thành footer (Turn 12)
- Đúng Apple? ✓ HIG: destination action ở thumb-reach, filled primary, full-width.
- Giảm cognitive load? ✓ Pre-first-set silent; post-first-set 1 affordance duy nhất.
- Tách bạch? ✓ Destructive (header) vs destination (footer) — 2 region khác nhau.
- Khả thi? ✓ 10 dòng HTML + 14 dòng SCSS; reuse pattern đã có ở `active-workout.page.scss`.

### C. Defer xóa `active-workout/*` (F-014)
- Đúng Apple? — n/a (housekeeping).
- Giảm cognitive load (cho dev)? Tăng tạm thời (dead code), nhưng tránh throw-away công sức turn 7-8.
- Tách bạch? Ghi rõ trong F-014 + AUDIT để Pha 2 IA refactor reactivate.
- Khả thi? ✓ Zero runtime impact; chỉ ảnh hưởng bundle size 4.78 KB transfer (acceptable).

### D. IA rewrite 5+ page Pha 2 (đề xuất)
- Đúng Apple? ✓ "One page one job" là core Apple HIG principle.
- Giảm cognitive load? ✓ Hub xuống 3 section thay vì 6.
- Tách bạch? ✓ Logger có dedicated page; finish có moment riêng; history + insights tách.
- Khả thi? ✓ Store + repo đã đủ chín; chi phí chính là HTML/SCSS + route wiring + 1 modal component. ETA: 3-5 turn.

### E. Hoãn fix F-015 stale signal sang Pha 2
- Đúng Apple? ✗ Data-fidelity perception bug là critical; user thấy log không hiện = mất tin tưởng. Lý tưởng fix Pha 1.
- Lý do hoãn: hypothesis chính (capacitor sqlite WAL visibility) cần verify trên emulator với log instrumentation; fix proper (repo API redesign) đụng vào nhiều spec. Pha 1.5 có thể ship workaround (force re-fetch sau 100ms timeout).
- **Quyết định em đề xuất:** ship workaround Pha 1.5 (100ms timeout sau addSet trước getSession), bài bản fix Pha 2.

### F. Hoãn F-003 cardio sang Pha 3
- Đúng Apple? Vì cardio entry visible (4 exercise seeded) nhưng dead-end → vi phạm "đừng invite tap nếu không có outcome". Severity P1.
- Lý do hoãn: cần migration v7 + UI branch. Pha 3.
- Mitigation Pha 1.5: hide cardio exercise khỏi picker filter (1 line). Nếu không hide, ít nhất show toast "Cardio đang phát triển" khi chọn.

---

**Kết luận:** Tập luyện đã có persistence layer chín, có 4 issue P0/P1 đã ship turn 3-12. Vẫn còn 8 issue OPEN (1 P0/P1 mới — F-015; 3 P1 deferred — F-014/F-003/F-016; 4 P2/P3). Nếu user duyệt roadmap, Pha 1.5 (1-2 turn) + Pha 2 (3-5 turn) sẽ đưa Tập luyện về chuẩn Apple HIG. Pha 3 (migration) là điều kiện cần để fitness app trưởng thành thực sự (skipped set + cardio + cancel-undo).

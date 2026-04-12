# Kịch Bản Kiểm Thử (Test Cases Index) — MealPlaning V1.0

> **Version:** 1.0  
> **Ngày tạo:** 2026-07-28  
> **Trạng thái:** Draft  
> **Test Plan:** [test-plan.md](./test-plan.md)

---

## 1. Cấu Trúc Tài Liệu

Mỗi feature module có file scenario riêng tại `docs/04-testing/scenarios/SC*.md`. File này là **bảng tổng hợp** (index) liên kết tất cả test cases, kèm **Critical Path test cases** cho E2E validation.

### Quy Ước Mã Test Case

```
TC_[MODULE]_[SỐ]: Mô tả ngắn
├── Pre-conditions: Trạng thái ban đầu
├── Steps: Các bước thực hiện (đánh số)
├── Expected: Kết quả mong đợi (CÓ SỐ CỤ THỂ)
├── Type: Positive | Negative | Edge | Boundary
└── Priority: P0 (Blocker) | P1 (High) | P2 (Medium) | P3 (Low)
```

---

## 2. Ma Trận Test Cases Theo Module

### 2.1 M1 — Onboarding (SC25)

| TC ID     | Mô tả                                                 | Type     | Priority |
| --------- | ----------------------------------------------------- | -------- | -------- |
| TC_FOB_01 | Hiển thị welcome screen khi first launch              | Positive | P0       |
| TC_FOB_02 | Thu thập health profile (gender, DOB, height, weight) | Positive | P0       |
| TC_FOB_03 | Chọn activity level (5 options)                       | Positive | P1       |
| TC_FOB_04 | Chọn goal (cut/maintain/bulk) + rate                  | Positive | P1       |
| TC_FOB_05 | Xác nhận BMR/TDEE tính đúng                           | Positive | P0       |
| TC_FOB_06 | Training profile collection (goal/exp/days/duration)  | Positive | P1       |
| TC_FOB_07 | Auto-generate training plan từ profile                | Positive | P1       |
| TC_FOB_08 | Strategy selection (auto/manual)                      | Positive | P1       |
| TC_FOB_09 | Plan preview hiển thị 7 ngày                          | Positive | P1       |
| TC_FOB_10 | Complete → navigate to main app                       | Positive | P0       |
| TC_FOB_11 | Validation: DOB phải ≤ ngày hiện tại                  | Negative | P1       |
| TC_FOB_12 | Validation: weight 30–300 kg                          | Boundary | P1       |
| TC_FOB_13 | Validation: height 100–250 cm                         | Boundary | P1       |
| TC_FOB_14 | Back button ở mỗi step                                | Edge     | P2       |
| TC_FOB_15 | Skip training profile → vẫn vào app                   | Edge     | P2       |

> **Chi tiết đầy đủ**: [SC25-fitness-tab-onboarding.md](./scenarios/SC25-fitness-tab-onboarding.md) (210 TCs)

---

### 2.2 M2 — Meal Planning (SC01, SC02, SC10, SC11, SC42)

| TC ID     | Mô tả                                     | Scenario | Priority |
| --------- | ----------------------------------------- | -------- | -------- |
| TC_CAL_01 | Hiển thị ngày hiện tại khi mở app         | SC01     | P0       |
| TC_CAL_02 | Navigate tuần bằng swipe/arrow            | SC01     | P0       |
| TC_CAL_03 | 3 slot bữa ăn (Sáng/Trưa/Tối) hiển thị    | SC01     | P0       |
| TC_CAL_04 | Thêm món vào slot → nutrition update      | SC01     | P0       |
| TC_CAL_05 | Xóa món khỏi slot → nutrition update      | SC01     | P1       |
| TC_MPM_01 | Mở meal planner modal                     | SC02     | P0       |
| TC_MPM_02 | Tìm kiếm món (case-insensitive, VI + EN)  | SC02     | P1       |
| TC_MPM_03 | Pre-select món đã có trong plan           | SC02     | P1       |
| TC_MPM_04 | Real-time nutrition preview khi chọn/bỏ   | SC02     | P0       |
| TC_COP_01 | Copy plan ngày → ngày khác                | SC10     | P1       |
| TC_COP_02 | Copy plan tuần → tuần khác                | SC10     | P1       |
| TC_COP_03 | Overwrite confirmation khi target có data | SC10     | P1       |
| TC_CLR_01 | Clear plan ngày                           | SC11     | P1       |
| TC_CLR_02 | Clear plan tuần                           | SC11     | P1       |
| TC_CLR_03 | Clear plan tháng                          | SC11     | P2       |
| TC_PDE_01 | Reorder exercises trong training day      | SC42     | P1       |
| TC_PDE_02 | Add exercise từ selector                  | SC42     | P1       |
| TC_PDE_03 | Delete exercise                           | SC42     | P1       |
| TC_PDE_04 | Unsaved changes dialog khi back           | SC42     | P1       |
| TC_PDE_05 | Restore original exercises                | SC42     | P2       |
| TC_CAL_32 | XSS prevention: tên món có `<script>`     | SC01     | **P0**   |

> **Chi tiết đầy đủ**: [SC01](./scenarios/SC01-calendar-meal-planning.md), [SC02](./scenarios/SC02-meal-planner-modal.md), [SC10](./scenarios/SC10-copy-plan.md), [SC11](./scenarios/SC11-clear-plan.md), [SC42](./scenarios/SC42-plan-day-editor.md)

---

### 2.3 M3 — Ingredient Library (SC06, SC07, SC20)

| TC ID     | Mô tả                                            | Scenario | Priority |
| --------- | ------------------------------------------------ | -------- | -------- |
| TC_ING_01 | Tạo nguyên liệu mới (name, cal, pro, carbs, fat) | SC06     | P0       |
| TC_ING_02 | Validation: name unique (case-insensitive)       | SC06     | P0       |
| TC_ING_03 | Validation: nutrition values ≥ 0                 | SC06     | P1       |
| TC_ING_04 | Edit nguyên liệu → cascade update dishes         | SC06     | P0       |
| TC_ING_05 | Delete nguyên liệu → cascade remove from dishes  | SC06     | P0       |
| TC_ING_06 | Warning khi delete nguyên liệu đang dùng         | SC06     | P1       |
| TC_DSH_01 | Tạo món ăn mới (name, ≥1 nguyên liệu)            | SC07     | P0       |
| TC_DSH_02 | Nutrition auto-calc từ nguyên liệu               | SC07     | P0       |
| TC_DSH_03 | Edit món → update trong tất cả plan entries      | SC07     | P0       |
| TC_DSH_04 | Delete món đang trong plan → warning             | SC07     | P1       |
| TC_FIL_01 | Sort theo name/cal/protein (asc/desc)            | SC20     | P2       |
| TC_FIL_02 | Filter theo tags (breakfast/lunch/dinner)        | SC20     | P2       |
| TC_FIL_03 | View switcher (grid/list)                        | SC20     | P3       |

> **Chi tiết đầy đủ**: [SC06](./scenarios/SC06-ingredient-crud.md), [SC07](./scenarios/SC07-dish-crud.md), [SC20](./scenarios/SC20-filter-sort.md)

---

### 2.4 M4 — Nutrition Tracking (SC03, SC34)

| TC ID     | Mô tả                                            | Scenario | Priority |
| --------- | ------------------------------------------------ | -------- | -------- |
| TC_NUT_01 | Tự động tính calories từ dish ingredients        | SC03     | P0       |
| TC_NUT_02 | Progress bar calories: eaten / target            | SC03     | P0       |
| TC_NUT_03 | Progress bar protein: eaten / target             | SC03     | P0       |
| TC_NUT_04 | Cascade: edit ingredient → dish nutrition update | SC03     | P0       |
| TC_NUT_05 | Cascade: add dish to plan → daily total update   | SC03     | P0       |
| TC_EBP_01 | BMR hiển thị đúng (Mifflin-St Jeor)              | SC34     | P0       |
| TC_EBP_02 | TDEE = BMR × activity multiplier                 | SC34     | P0       |
| TC_EBP_03 | Target = TDEE + goal offset                      | SC34     | P0       |
| TC_EBP_04 | Macros breakdown (protein, fat, carbs)           | SC34     | P0       |
| TC_EBP_05 | Change weight → BMR/TDEE/Target all update       | SC34     | P0       |
| TC_EBP_06 | Change goal (cut→maintain) → Target update       | SC34     | P1       |
| TC_EBP_07 | Energy balance: eaten vs target display          | SC34     | P0       |
| TC_EBP_08 | Macro overflow khi aggressive cut                | SC34     | P2       |

> **Chi tiết đầy đủ**: [SC03](./scenarios/SC03-nutrition-tracking.md), [SC34](./scenarios/SC34-energy-balance-protein.md)

---

### 2.5 M5 — Workout Logging (SC26, SC27, SC28, SC29, SC42, SC43)

| TC ID     | Mô tả                                              | Scenario | Priority |
| --------- | -------------------------------------------------- | -------- | -------- |
| TC_TPV_01 | 7-day calendar strip hiển thị đúng                 | SC26     | P1       |
| TC_TPV_02 | Color-coded pills (strength/cardio/rest)           | SC26     | P2       |
| TC_TPV_03 | Workout card với exercises parsed từ JSON          | SC26     | P1       |
| TC_TPV_04 | Rest day card với recovery tips                    | SC26     | P2       |
| TC_WLS_01 | Ghi set: weight × reps                             | SC27     | P0       |
| TC_WLS_02 | Add/remove set                                     | SC27     | P0       |
| TC_WLS_03 | RPE selector (6–10)                                | SC27     | P2       |
| TC_WLS_04 | Rest timer countdown                               | SC27     | P1       |
| TC_WLS_05 | PR detection (new max weight/volume)               | SC27     | P1       |
| TC_WLS_06 | Workout summary screen                             | SC27     | P1       |
| TC_CRD_01 | Chọn loại cardio (7 types)                         | SC28     | P1       |
| TC_CRD_02 | Stopwatch mode (real-time)                         | SC28     | P1       |
| TC_CRD_03 | Manual time entry                                  | SC28     | P1       |
| TC_CRD_04 | Calorie estimation (duration × intensity × weight) | SC28     | P1       |
| TC_WKH_01 | History grouped by week                            | SC29     | P1       |
| TC_WKH_02 | Filter: All / Strength / Cardio                    | SC29     | P2       |
| TC_WKH_03 | Expand card → view sets detail                     | SC29     | P2       |
| TC_FRS_01 | Freestyle workout entry (no plan)                  | SC43     | P1       |
| TC_FRS_02 | Freestyle KHÔNG ảnh hưởng training state           | SC43     | P1       |
| TC_FRS_03 | Freestyle KHÔNG count toward streak                | SC43     | P2       |

> **Chi tiết đầy đủ**: [SC26](./scenarios/SC26-training-plan-view.md), [SC27](./scenarios/SC27-workout-logging-strength.md), [SC28](./scenarios/SC28-cardio-logging.md), [SC29](./scenarios/SC29-workout-history.md), [SC42](./scenarios/SC42-plan-day-editor.md), [SC43](./scenarios/SC43-freestyle-workout.md)

---

### 2.6 M6 — Settings (SC08, SC09, SC22)

| TC ID     | Mô tả                                           | Scenario | Priority |
| --------- | ----------------------------------------------- | -------- | -------- |
| TC_SET_01 | Edit health profile (name, weight, height, DOB) | SC08     | P0       |
| TC_SET_02 | Edit goal (targetCalories, proteinRatio)        | SC08     | P0       |
| TC_SET_03 | Theme toggle (light/dark)                       | SC08     | P2       |
| TC_SET_04 | API key management (masked display)             | SC08     | P1       |
| TC_SET_05 | Data export (SQLite → file)                     | SC08     | P1       |
| TC_SET_06 | Data import (file → SQLite + validation)        | SC08     | P1       |
| TC_SET_07 | Data clear (with confirmation)                  | SC08     | P0       |
| TC_GOL_01 | targetCalories > 0, default 2000                | SC09     | P0       |
| TC_GOL_02 | proteinRatio > 0, default 1.5 g/kg              | SC09     | P1       |
| TC_GOL_03 | Goal change → immediate UI update               | SC09     | P0       |
| TC_DRK_01 | 4 theme modes (light/dark/system/schedule)      | SC22     | P2       |
| TC_DRK_02 | Schedule mode: 18:00–06:00 auto-dark            | SC22     | P3       |
| TC_DRK_03 | System mode respects OS preference              | SC22     | P2       |
| TC_DRK_04 | No flash on page reload                         | SC22     | P2       |

> **Chi tiết đầy đủ**: [SC08](./scenarios/SC08-settings-config.md), [SC09](./scenarios/SC09-goal-settings.md), [SC22](./scenarios/SC22-dark-mode.md)

---

### 2.7 M7 — AI Photo Analysis (SC05)

| TC ID     | Mô tả                                                 | Scenario | Priority |
| --------- | ----------------------------------------------------- | -------- | -------- |
| TC_AIA_01 | Chụp ảnh từ camera                                    | SC05     | P0       |
| TC_AIA_02 | Upload ảnh từ gallery                                 | SC05     | P0       |
| TC_AIA_03 | Image validation (max 10MB, JPEG/PNG/WebP)            | SC05     | P1       |
| TC_AIA_04 | Image compression (quality 0.8) trước khi gửi API     | SC05     | P2       |
| TC_AIA_05 | Gemini API trả về dish name + ingredients + nutrition | SC05     | P0       |
| TC_AIA_06 | User edit AI result trước khi save                    | SC05     | P1       |
| TC_AIA_07 | Save → tạo dish + new ingredients                     | SC05     | P0       |
| TC_AIA_08 | Match existing ingredients (case-insensitive)         | SC05     | P1       |
| TC_AIA_09 | Error handling: network fail                          | SC05     | P1       |
| TC_AIA_10 | Error handling: invalid API response                  | SC05     | P1       |
| TC_AIA_11 | Rate limiting display                                 | SC05     | P2       |

> **Chi tiết đầy đủ**: [SC05](./scenarios/SC05-ai-image-analysis.md) (210 TCs)

---

### 2.8 M8 — Google Drive Sync (SC17)

| TC ID     | Mô tả                                         | Scenario | Priority |
| --------- | --------------------------------------------- | -------- | -------- |
| TC_GDS_01 | OAuth 2.0 authentication flow                 | SC17     | P0       |
| TC_GDS_02 | Manual sync trigger                           | SC17     | P0       |
| TC_GDS_03 | Auto-sync (3s debounce after data change)     | SC17     | P1       |
| TC_GDS_04 | Export: SQLite → JSON → GDrive                | SC17     | P0       |
| TC_GDS_05 | Import: GDrive → JSON → SQLite                | SC17     | P0       |
| TC_GDS_06 | Conflict detection (timestamp comparison)     | SC17     | P0       |
| TC_GDS_07 | SyncConflictModal (user chooses local/remote) | SC17     | P0       |
| TC_GDS_08 | Offline queue + retry logic                   | SC17     | P1       |
| TC_GDS_09 | Token management (memory, not localStorage)   | SC17     | P1       |
| TC_GDS_10 | Error handling: GDrive quota exceeded         | SC17     | P2       |

> **Chi tiết đầy đủ**: [SC17](./scenarios/SC17-google-drive-sync.md) (210 TCs)

---

### 2.9 M9 — Dashboard (SC19, SC30, SC31, SC33, SC34, SC35, SC36)

| TC ID     | Mô tả                                      | Scenario | Priority |
| --------- | ------------------------------------------ | -------- | -------- |
| TC_QPV_01 | Quick preview: 3 meal slots                | SC19     | P1       |
| TC_QPV_02 | Nutrition progress bars per slot           | SC19     | P1       |
| TC_PRG_01 | Volume % change vs last week               | SC30     | P1       |
| TC_PRG_02 | 1RM estimation (Brzycki formula)           | SC30     | P2       |
| TC_PRG_03 | Adherence % calculation                    | SC30     | P1       |
| TC_PRG_04 | Time range filter (1W/1M/3M/All)           | SC30     | P2       |
| TC_DWI_01 | Log weight (30–300 kg, step 0.1)           | SC31     | P0       |
| TC_DWI_02 | Recent chips (5 unique, exclude today)     | SC31     | P2       |
| TC_DWI_03 | 7-day moving average                       | SC31     | P1       |
| TC_DWI_04 | Trend indicator (↑/↓/→)                    | SC31     | P2       |
| TC_DWI_05 | Undo on save (5s countdown)                | SC31     | P2       |
| TC_DSL_01 | 5-tier staggered layout                    | SC33     | P1       |
| TC_DSL_02 | DailyScoreHero (0–100, gradient)           | SC33     | P1       |
| TC_DSL_03 | Lazy load tiers 4–5                        | SC33     | P3       |
| TC_DSL_04 | ErrorBoundary per tier                     | SC33     | P2       |
| TC_TPC_01 | Training-pending state → Start CTA         | SC35     | P0       |
| TC_TPC_02 | Training-completed state → PR highlight    | SC35     | P1       |
| TC_TPC_03 | Rest-day state → recovery tips             | SC35     | P2       |
| TC_TPC_04 | No-plan state → Create plan CTA            | SC35     | P1       |
| TC_QAW_01 | 3 context-aware quick action buttons       | SC36     | P1       |
| TC_QAW_02 | Weight log bottom sheet (stepper ±0.1)     | SC36     | P0       |
| TC_QAW_03 | Long-press acceleration (500ms→150ms→50ms) | SC36     | P2       |

> **Chi tiết đầy đủ**: [SC19](./scenarios/SC19-quick-preview.md), [SC30](./scenarios/SC30-progress-dashboard.md), [SC31](./scenarios/SC31-daily-weight-input.md), [SC33](./scenarios/SC33-dashboard-score-layout.md), [SC35](./scenarios/SC35-todays-plan-card.md), [SC36](./scenarios/SC36-quick-actions-weight-log.md)

---

## 3. Critical Path Test Cases (E2E)

Các test case dưới đây là **luồng end-to-end** xuyên suốt nhiều module, dùng cho manual testing trên emulator.

---

### CP_01: Fresh Install → Onboarding → Dashboard

```
Pre-conditions: App vừa cài đặt (fresh install), chưa có data
Steps:
  1. Launch app
  2. Welcome screen → "Tiếp tục" × 2 → "Bắt đầu"
  3. Health Basic: Nam, "QA Tester", 1996-05-15, 175cm, 75kg → "Tiếp tục"
  4. Activity: Chọn "Hoạt động vừa phải" → "Tiếp tục"
  5. Goal: Chọn "Giảm cân" → rate "Vừa phải" → "Tiếp tục"
  6. Confirm: Verify BMR/TDEE → "Xác nhận"
  7. Training Profile: Complete hoặc "Bỏ qua"
  8. Strategy: "Tự động" → chờ computing (13s) → Plan Preview → "Bắt đầu"
  9. Verify: 5 navigation tabs hiển thị
Expected:
  - BMR = 10×75 + 6.25×175 - 5×Age + 5 (tính dynamic)
  - TDEE = BMR × 1.55
  - Target = TDEE - 550
  - Dashboard hiển thị "Mục tiêu: [Target] kcal"
  - 5 tabs: Calendar, Library, AI, Fitness, Dashboard
Priority: P0
```

---

### CP_02: Add Meal → Nutrition Update → Dashboard Verify

```
Pre-conditions: Onboarding hoàn tất, seed data có sẵn (5 dishes)
Steps:
  1. Navigate Calendar tab → today
  2. Mở meal planner → chọn Bữa Sáng
  3. Add "Trứng ốp la" (155 cal, 13g pro) + "Yến mạch sữa chua" (332 cal, 25g pro)
  4. Xác nhận plan
  5. Verify Calendar: Bữa Sáng hiển thị 2 món, total = 487 cal
  6. Mở meal planner → chọn Bữa Trưa
  7. Add "Ức gà áp chảo" (330 cal, 62g) + "Bông cải xanh luộc" (51 cal, 5g) + "Khoai lang luộc" (129 cal, 3g)
  8. Xác nhận plan
  9. Navigate Dashboard → verify total eaten
Expected:
  - Bữa Sáng: 487 kcal, 38g protein
  - Bữa Trưa: 510 kcal, 70g protein
  - Total eaten: 997 kcal, 108g protein
  - Remaining: Target - 997 kcal
  - Progress bars cập nhật real-time
Priority: P0
```

---

### CP_03: Settings Change → Propagation Verify

```
Pre-conditions: Onboarding hoàn tất, có meals trong plan
Steps:
  1. Navigate Settings → Health Profile → Edit
  2. Change weight: 75 → 80 kg → Save
  3. Verify Settings: BMR, TDEE, Target đã update
  4. Navigate Dashboard → verify energy balance update
  5. Navigate Calendar → Nutrition tab → verify target update
  6. Navigate Settings → Goal → Change "Giảm cân" → "Duy trì" → Save
  7. Verify: Target = TDEE (offset = 0)
  8. Navigate Dashboard → verify
  9. Revert: Settings → Weight 80 → 75, Goal → "Giảm cân" → Save
  10. Verify: tất cả giá trị trở về baseline
Expected:
  Weight 80kg: BMR = 10×80+6.25×175-5×Age+5, TDEE = BMR×1.55, Target = TDEE-550
  Maintain: Target = TDEE (no offset)
  Revert: tất cả giá trị khớp với baseline ban đầu
  Propagation phải đúng ở TẤT CẢ locations (Dashboard, Calendar, Fitness)
Priority: P0
```

---

### CP_04: Workout Logging → History → Dashboard

```
Pre-conditions: Training plan active, today = workout day
Steps:
  1. Navigate Fitness tab → Today's plan card
  2. Click "Start" → WorkoutLogger opens
  3. Exercise 1: Bench Press → Add set: 60kg × 10 reps
  4. Add set: 65kg × 8 reps
  5. Complete exercise → next exercise
  6. Complete workout → Summary screen
  7. Verify: total volume, duration, PR detection
  8. Navigate History → verify workout appears
  9. Navigate Dashboard → verify streak, workout count
Expected:
  - Volume = 60×10 + 65×8 = 1120 kg
  - Workout appears in history, grouped by this week
  - Dashboard streak increments
  - Progress dashboard metrics update
Priority: P0
```

---

### CP_05: AI Photo → Save Dish → Use in Plan

```
Pre-conditions: API key configured, camera permission granted
Steps:
  1. Navigate AI Analysis tab
  2. Capture/upload food photo
  3. Wait for Gemini API response
  4. Verify: dish name, ingredients list, nutrition estimate
  5. Edit dish name if needed → Save
  6. Navigate Library → verify new dish appears
  7. Navigate Calendar → add new dish to meal slot
  8. Verify: nutrition calculated correctly
Expected:
  - AI returns dish with ingredients and nutrition
  - Dish saved to dishStore + new ingredients to ingredientStore
  - Dish usable in meal planning
  - Nutrition cascade works for AI-created dishes
Priority: P0
```

---

### CP_06: Google Drive Backup → Restore → Verify

```
Pre-conditions: Google account authenticated, app has data
Steps:
  1. Navigate Settings → Data → Export to Google Drive
  2. Verify: upload progress, success confirmation
  3. Clear all app data (Settings → Clear Data → Confirm)
  4. Verify: app returns to onboarding/empty state
  5. Import from Google Drive
  6. Verify: all data restored (ingredients, dishes, plans, health profile)
  7. Navigate Calendar → verify meals restored
  8. Navigate Dashboard → verify nutrition data
Expected:
  - Export creates JSON file on GDrive
  - Import restores ALL data including health profile
  - All nutrition calculations correct after restore
  - No data loss between export and import
Priority: P0
```

---

### CP_07: Persistence → Force Stop → Relaunch

```
Pre-conditions: App has data (meals, health profile, workouts)
Steps:
  1. Add meal to today's plan → verify display
  2. Force-stop app (adb shell am force-stop com.mealplaner.app)
  3. Wait 3s → relaunch app
  4. Verify: all data persists (meals, health profile, settings)
  5. Navigate Calendar → verify today's meals
  6. Navigate Dashboard → verify nutrition totals
  7. Navigate Fitness → verify training plan
Expected:
  - SQLite data persists across force-stop (native implementation)
  - localStorage data persists (Zustand persist middleware)
  - No data corruption after force-stop
  - App resumes to correct state
Priority: P0
```

---

## 4. Negative & Edge Case Test Cases

### NEG_01: Input Validation Boundaries

```
TC_NEG_01: Weight = 0 → reject
TC_NEG_02: Weight = -1 → reject
TC_NEG_03: Weight = 301 → reject
TC_NEG_04: Height = 99 → reject
TC_NEG_05: CaloriesPer100 = NaN → display "0" or reject
TC_NEG_06: Dish name = "" → reject
TC_NEG_07: Ingredient name = duplicate (case-insensitive) → reject
TC_NEG_08: Image > 10MB → reject with message
TC_NEG_09: API key = "" → disable AI features
```

### NEG_02: Security

```
TC_SEC_01: Dish name = "<script>alert('xss')</script>" → escaped, no execution
TC_SEC_02: Ingredient name with HTML entities → rendered as text
TC_SEC_03: API response with malicious JSON → parsed safely
TC_SEC_04: OAuth token → stored in memory only, NOT localStorage
```

### NEG_03: Offline Behavior

```
TC_OFF_01: No network → app functions normally (offline-first)
TC_OFF_02: AI Photo without network → clear error message
TC_OFF_03: GDrive sync without network → queued, retry on reconnect
TC_OFF_04: Restore from GDrive without network → error message
```

---

## 5. Tổng Hợp Theo Priority

| Priority         | Count (Index) | Mô tả                                                    |
| ---------------- | ------------- | -------------------------------------------------------- |
| **P0** (Blocker) | 38            | Core functionality, security, data integrity             |
| **P1** (High)    | 52            | Important features, validation, error handling           |
| **P2** (Medium)  | 31            | UI polish, secondary features, edge cases                |
| **P3** (Low)     | 5             | Accessibility details, performance optimization          |
| **Total Index**  | **126**       | Đại diện cho ~6,744 TCs chi tiết trong 32 scenario files |

---

## 6. Tham Chiếu Scenario Files

| #   | File                                                                             | TCs | Module      |
| --- | -------------------------------------------------------------------------------- | --- | ----------- |
| 1   | [SC01-calendar-meal-planning.md](./scenarios/SC01-calendar-meal-planning.md)     | 210 | M2          |
| 2   | [SC02-meal-planner-modal.md](./scenarios/SC02-meal-planner-modal.md)             | 210 | M2          |
| 3   | [SC03-nutrition-tracking.md](./scenarios/SC03-nutrition-tracking.md)             | 210 | M4          |
| 4   | [SC04-ai-meal-suggestion.md](./scenarios/SC04-ai-meal-suggestion.md)             | 210 | Should Have |
| 5   | [SC05-ai-image-analysis.md](./scenarios/SC05-ai-image-analysis.md)               | 210 | M7          |
| 6   | [SC06-ingredient-crud.md](./scenarios/SC06-ingredient-crud.md)                   | 210 | M3          |
| 7   | [SC07-dish-crud.md](./scenarios/SC07-dish-crud.md)                               | 210 | M3          |
| 8   | [SC08-settings-config.md](./scenarios/SC08-settings-config.md)                   | 210 | M6          |
| 9   | [SC09-goal-settings.md](./scenarios/SC09-goal-settings.md)                       | 210 | M6          |
| 10  | [SC10-copy-plan.md](./scenarios/SC10-copy-plan.md)                               | 210 | M2          |
| 11  | [SC11-clear-plan.md](./scenarios/SC11-clear-plan.md)                             | 210 | M2          |
| 12  | [SC12-template-manager.md](./scenarios/SC12-template-manager.md)                 | 210 | Should Have |
| 13  | [SC13-save-template.md](./scenarios/SC13-save-template.md)                       | 210 | Should Have |
| 14  | [SC17-google-drive-sync.md](./scenarios/SC17-google-drive-sync.md)               | 210 | M8          |
| 15  | [SC19-quick-preview.md](./scenarios/SC19-quick-preview.md)                       | 210 | M9          |
| 16  | [SC20-filter-sort.md](./scenarios/SC20-filter-sort.md)                           | 210 | M3          |
| 17  | [SC22-dark-mode.md](./scenarios/SC22-dark-mode.md)                               | 210 | M6          |
| 18  | [SC25-fitness-tab-onboarding.md](./scenarios/SC25-fitness-tab-onboarding.md)     | 210 | M1          |
| 19  | [SC26-training-plan-view.md](./scenarios/SC26-training-plan-view.md)             | 210 | M5          |
| 20  | [SC27-workout-logging-strength.md](./scenarios/SC27-workout-logging-strength.md) | 210 | M5          |
| 21  | [SC28-cardio-logging.md](./scenarios/SC28-cardio-logging.md)                     | 210 | M5          |
| 22  | [SC29-workout-history.md](./scenarios/SC29-workout-history.md)                   | 210 | M5          |
| 23  | [SC30-progress-dashboard.md](./scenarios/SC30-progress-dashboard.md)             | 210 | M9          |
| 24  | [SC31-daily-weight-input.md](./scenarios/SC31-daily-weight-input.md)             | 210 | M9          |
| 25  | [SC33-dashboard-score-layout.md](./scenarios/SC33-dashboard-score-layout.md)     | 299 | M9          |
| 26  | [SC34-energy-balance-protein.md](./scenarios/SC34-energy-balance-protein.md)     | 265 | M4          |
| 27  | [SC35-todays-plan-card.md](./scenarios/SC35-todays-plan-card.md)                 | 240 | M9          |
| 28  | [SC36-quick-actions-weight-log.md](./scenarios/SC36-quick-actions-weight-log.md) | 260 | M9          |
| 29  | [SC38-cross-feature-navigation.md](./scenarios/SC38-cross-feature-navigation.md) | 210 | Should Have |
| 30  | [SC39-wcag-accessibility.md](./scenarios/SC39-wcag-accessibility.md)             | 210 | Should Have |
| 31  | [SC42-plan-day-editor.md](./scenarios/SC42-plan-day-editor.md)                   | 55  | M5          |
| 32  | [SC43-freestyle-workout.md](./scenarios/SC43-freestyle-workout.md)               | 45  | M5          |

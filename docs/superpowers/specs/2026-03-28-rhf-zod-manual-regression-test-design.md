# Manual Regression Test — RHF+Zod Migration

## Overview

Kiểm thử thủ công (manual testing) toàn bộ 6 complex forms đã migrate từ native `useState` sang React Hook Form + Zod. Mục tiêu: xác nhận migration không gây regression trên thiết bị Android thật.

## Scope

- **6 forms**: CardioLogger, HealthProfileForm, FitnessOnboarding, SaveAnalyzedDishModal, WorkoutLogger, DishEditModal + QuickAddIngredientForm
- **156 test cases** across 5 categories: FIELD, VALID, SUBMIT, MOBILE, STATE
- **Target**: Android Chrome mobile (real device)
- **Bug handling**: Log + đề xuất 3 giải pháp cho mỗi bug

## Environment

| Item | Value |
|------|-------|
| Dev server | `npm run dev` → `http://<mac-ip>:3000` |
| Android device | Chrome mobile, cùng WiFi |
| Remote debug | Desktop Chrome `chrome://inspect` |
| Monitoring | Console, Network, Application tabs |

## Bug Report Template

```
BUG-RHF-XXX
Form: <form name>
TC: <test case ID>
Severity: Critical | Major | Minor
Description: <what's wrong>
Steps to reproduce:
  1. ...
  2. ...
Expected: <expected behavior>
Actual: <actual behavior>
Evidence: <DevTools console log / screenshot>

Solution 1: <approach + trade-off>
Solution 2: <approach + trade-off>
Solution 3: <approach + trade-off>
Recommended: Solution X because <reasoning>
```

---

## Test Execution Order

1. CardioLogger (19 TCs)
2. HealthProfileForm (27 TCs)
3. FitnessOnboarding (30 TCs)
4. SaveAnalyzedDishModal (23 TCs)
5. WorkoutLogger (23 TCs)
6. DishEditModal + QuickAdd (34 TCs)

---

## Form 1: CardioLogger (19 TCs)

**Navigation**: Fitness tab → Workout → Select "Cardio" mode

### FIELD (6)

| ID | Test Case | Pre-conditions | Steps | Expected Result |
|----|-----------|----------------|-------|-----------------|
| TC_CL_F01 | Chọn 7 loại cardio | CardioLogger open | Tap lần lượt: running, cycling, swimming, hiit, walking, elliptical, rowing | Mỗi type highlight đúng, icon thay đổi tương ứng |
| TC_CL_F02 | Toggle stopwatch/manual mode | CardioLogger open | Tap toggle switch | Switch giữa stopwatch (timer hiện) và manual (input hiện) |
| TC_CL_F03 | Nhập manual duration | Manual mode active | Tap duration input, nhập "45" | Numeric keyboard hiện, value = 45, estimated calories update |
| TC_CL_F04 | Nhập distance (conditional) | Type = running | Tap distance input, nhập "5.5" | Distance field hiện, value = 5.5 km |
| TC_CL_F05 | Nhập heart rate | CardioLogger open | Tap HR input, nhập "140" | Value = 140, estimated calories adjust |
| TC_CL_F06 | Chọn intensity | CardioLogger open | Tap low → moderate → high | RadioPills highlight tương ứng, calories update |

### VALID (4)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_CL_V01 | Duration không nhận số âm | Nhập "-10" vào duration | Giá trị = 0 hoặc không nhận ký tự "-" |
| TC_CL_V02 | HR validate min/max | Nhập "10" (dưới min 30), rồi "300" (trên max 250) | Error message hoặc clamp giá trị |
| TC_CL_V03 | Distance ẩn khi type không phù hợp | Chọn type = hiit | Distance field ẩn hoàn toàn |
| TC_CL_V04 | Estimated calories tính đúng | Nhập duration=30, type=running, intensity=moderate | Calories hiển thị số hợp lý (>0) |

### SUBMIT (3)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_CL_S01 | Happy path submit | Chọn running, duration=30, intensity=moderate → Save | Toast/notification thành công, dữ liệu lưu |
| TC_CL_S02 | Submit với stopwatch | Toggle stopwatch, đợi 5s, Save | Duration = elapsed time, data save đúng |
| TC_CL_S03 | Submit thiếu required | Không chọn type, nhấn Save | Không submit, hiện validation error |

### MOBILE (4)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_CL_M01 | Numeric keyboard | Tap duration/distance/HR input | Keyboard numeric (không QWERTY) |
| TC_CL_M02 | Snap-back prevention | Xóa hết duration input → blur | Input giữ empty hoặc fallback 0, KHÔNG snap-back giá trị cũ |
| TC_CL_M03 | RadioPills touch ≥44px | Tap intensity options | Dễ tap chính xác, không bị miss-tap |
| TC_CL_M04 | Scroll với keyboard mở | Focus input, scroll form | Form scroll smooth, keyboard không block content |

### STATE (2)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_CL_ST01 | Default values | Mở CardioLogger mới | Intensity = moderate, mode = manual, duration = 0 |
| TC_CL_ST02 | Reset sau submit | Submit thành công, mở lại | Form reset về defaults |

---

## Form 2: HealthProfileForm (27 TCs)

**Navigation**: Settings → Health Profile

### FIELD (9)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_HP_F01 | Chọn gender | Tap male/female RadioPills | Highlight đúng selection |
| TC_HP_F02 | Nhập age | Tap age input, nhập "25" | Value = 25, BMR recalculate |
| TC_HP_F03 | Nhập heightCm | Nhập "175" | Value = 175 |
| TC_HP_F04 | Nhập weightKg | Nhập "70" | Value = 70, macros recalculate |
| TC_HP_F05 | Nhập bodyFatPct (optional) | Nhập "15" | Value = 15, field optional nên có thể bỏ trống |
| TC_HP_F06 | Chọn activityLevel | Tap qua 5 levels | Highlight đúng, TDEE recalculate |
| TC_HP_F07 | Nhập proteinRatio | Nhập "2.2" | Value = 2.2, macros recalculate |
| TC_HP_F08 | Toggle bmrOverride | Tap enable | BMR override input hiện ra |
| TC_HP_F09 | Nhập bmrOverride | Enable override, nhập "1800" | BMR = 1800 thay vì auto-calculated |

### VALID (6)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_HP_V01 | Age min/max | Nhập "5" (< 10), rồi "110" (> 100) | Clamp hoặc error |
| TC_HP_V02 | Height min/max | Nhập "50" (< 100), rồi "300" (> 250) | Clamp hoặc error |
| TC_HP_V03 | Weight min/max | Nhập "10" (< 30), rồi "400" (> 300) | Clamp hoặc error |
| TC_HP_V04 | BodyFat min/max | Nhập "1" (< 3), rồi "70" (> 60) | Clamp hoặc error |
| TC_HP_V05 | ProteinRatio min/max | Nhập "0.5" (< 0.8), rồi "5" (> 4) | Clamp hoặc error |
| TC_HP_V06 | bmrOverride required khi enabled | Enable override, để trống, Save | Error: BMR override phải > 0 |

### SUBMIT (3)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_HP_S01 | Save profile | Fill valid data → Save | Toast thành công, data persist |
| TC_HP_S02 | Computed values hiển thị | Fill data | BMR/TDEE/Macros (protein/fat/carbs) hiển thị đúng |
| TC_HP_S03 | Data persist reload | Save → reload page | Dữ liệu vẫn đúng |

### MOBILE (6)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_HP_M01 | Age input snap-back | Xóa hết age → blur | Không snap-back, fallback 0 hoặc empty |
| TC_HP_M02 | Height input snap-back | Xóa hết height → blur | Không snap-back |
| TC_HP_M03 | Weight input snap-back | Xóa hết weight → blur | Không snap-back |
| TC_HP_M04 | BodyFat input snap-back | Xóa hết → blur | Không snap-back |
| TC_HP_M05 | ProteinRatio decimal input | Nhập "2.2" | Decimal keyboard, value chính xác |
| TC_HP_M06 | BMR override snap-back | Enable, nhập "1800", xóa hết → blur | Không snap-back |

### STATE (3)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_HP_ST01 | Load existing profile | Đã save profile, mở lại | Tất cả fields load đúng giá trị cũ |
| TC_HP_ST02 | isDirty detection | Thay đổi bất kỳ field, nhấn back | UnsavedChangesDialog hiện (nếu có) |
| TC_HP_ST03 | Auto-recalculate | Thay đổi weight 70→80 | BMR, TDEE, macros update real-time |

---

## Form 3: FitnessOnboarding (30 TCs)

**Navigation**: Fitness tab (auto-shows nếu chưa onboarded)

### FIELD (10)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_FO_F01 | Chọn trainingGoal | Tap strength/hypertrophy/endurance/general | RadioPills highlight đúng |
| TC_FO_F02 | Chọn experience | Tap beginner/intermediate/advanced | Highlight + steps update |
| TC_FO_F03 | Chọn daysPerWeek | Tap 2/3/4/5/6 | Button highlight, chỉ 1 active |
| TC_FO_F04 | Chọn sessionDuration | Tap 30/45/60/90 | Duration highlight |
| TC_FO_F05 | Equipment ChipSelect | Tap barbell, dumbbell, bodyweight | Multi-select, chips highlighted |
| TC_FO_F06 | Injuries ChipSelect | Tap shoulders, knees | Multi-select injuries |
| TC_FO_F07 | CardioSessions | Tap 0-5 | Single select |
| TC_FO_F08 | Periodization (intermediate+) | Chọn experience=intermediate, navigate to step | RadioPills: linear/undulating/block |
| TC_FO_F09 | PriorityMuscles | Tap chest, back, legs | Multi-select, max 3 |
| TC_FO_F10 | Known1RM inputs | Enable checkbox, nhập squat=100, bench=80 | Numeric inputs accept values |

### VALID (8)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_FO_V01 | Step validation | Chưa chọn goal, nhấn Next | Không chuyển step, hiện error |
| TC_FO_V02 | PriorityMuscles max 3 | Chọn 3 muscles, try chọn thêm | Chip thứ 4 không active |
| TC_FO_V03 | Known1RM min 0 | Nhập "-5" cho squat | Không nhận hoặc clamp 0 |
| TC_FO_V04 | AvgSleepHours range | Nhập "2" (< 3), rồi "15" (> 12) | Clamp hoặc error |
| TC_FO_V05 | Beginner steps | Chọn beginner | Ẩn periodization, cycleWeeks, priorityMuscles, sleep |
| TC_FO_V06 | Intermediate steps | Chọn intermediate | Hiện periodization, cycleWeeks, priorityMuscles |
| TC_FO_V07 | Advanced steps | Chọn advanced | Hiện tất cả steps kể cả avgSleepHours |
| TC_FO_V08 | Progress bar | Navigate qua các steps | Progress bar width tăng đúng % |

### SUBMIT (4)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_FO_S01 | Complete beginner | Chọn beginner, fill required, submit | Onboarding hoàn tất, Fitness UI hiện |
| TC_FO_S02 | Complete advanced | Chọn advanced, fill ALL steps, submit | Tất cả data saved đúng |
| TC_FO_S03 | Back button | Navigate forward 3 steps, nhấn Back 2 lần | Quay đúng steps, data retained |
| TC_FO_S04 | Post-onboarding | Complete onboarding | Fitness tab hiện workout UI, không hiện lại onboarding |

### MOBILE (5)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_FO_M01 | ChipSelect touch ≥44px | Tap equipment chips | Dễ tap, không miss |
| TC_FO_M02 | Scroll giữa steps | Swipe up/down | Smooth scroll |
| TC_FO_M03 | 1RM keyboard | Focus 1RM input | Numeric keyboard |
| TC_FO_M04 | Progress bar responsive | Rotate device (nếu có) | Bar width adapts |
| TC_FO_M05 | RadioPills mobile | Tap training goals | Responsive touch |

### STATE (3)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_FO_ST01 | Data retained across steps | Fill step 1, go to step 3, back to step 1 | Step 1 data still there |
| TC_FO_ST02 | Experience change updates steps | Chọn advanced → switch to beginner | Step list giảm, periodization etc. hidden |
| TC_FO_ST03 | Onboarded state persist | Complete onboarding, reload | Fitness UI hiện, không onboarding lại |

---

## Form 4: SaveAnalyzedDishModal (23 TCs)

**Navigation**: AI Analysis tab → Upload image → Save Dish button

### FIELD (8)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_SA_F01 | Dish name input | Nhập "Cơm gà Hải Nam" | Value hiển thị đúng |
| TC_SA_F02 | Description input | Nhập mô tả dish | Optional field accepts text |
| TC_SA_F03 | Toggle saveDish | Tap checkbox | dishTags section hiện/ẩn theo toggle |
| TC_SA_F04 | DishTags selection | saveDish=true, tap breakfast, lunch | Multi-select tags |
| TC_SA_F05 | Ingredient checkboxes | Tap select/deselect từng ingredient | Checkbox toggle, opacity change |
| TC_SA_F06 | Select All / Deselect All | Tap toggle button | Tất cả checked/unchecked |
| TC_SA_F07 | Edit ingredient amount | Tap amount field, nhập "150" | StringNumberController accepts value |
| TC_SA_F08 | Edit nutrition values | Thay đổi calories/protein/carbs/fat/fiber | Values update, totals recalculate |

### VALID (5)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_SA_V01 | Name required | Để trống name, submit | Error message hiện |
| TC_SA_V02 | DishTags required khi saveDish | saveDish=true, không chọn tag, submit | Error: chọn ít nhất 1 tag |
| TC_SA_V03 | Amount min 0 | Nhập "-5" cho amount | Không nhận hoặc error |
| TC_SA_V04 | Nutrition min 0 | Nhập "-10" cho calories | Không nhận hoặc error |
| TC_SA_V05 | Ít nhất 1 ingredient selected | Deselect tất cả, submit | Error: chọn ít nhất 1 nguyên liệu |

### SUBMIT (3)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_SA_S01 | Happy path | Fill name + tags + ingredients, save | Modal đóng, data saved |
| TC_SA_S02 | Save ingredients only | saveDish=false, save | Chỉ ingredients saved, không tạo dish |
| TC_SA_S03 | Deselected excluded | Deselect 2 ingredients, save | Chỉ selected ingredients trong data |

### MOBILE (5)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_SA_M01 | Amount snap-back | Xóa hết amount → blur | Không snap-back |
| TC_SA_M02 | Nutrition scroll | Nhiều nutrition fields | Scroll ngang smooth |
| TC_SA_M03 | Modal scroll | 10+ ingredients | Modal body scrollable |
| TC_SA_M04 | Checkbox touch | Tap checkboxes | Touch target đủ lớn |
| TC_SA_M05 | AI Research tap | Tap Sparkles icon | Button responsive, loading state hiện |

### STATE (2)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_SA_ST01 | Load AI data | Modal opens từ analysis | Tất cả ingredients + nutrition load đúng |
| TC_SA_ST02 | Totals recalculate | Edit amount ingredient 1 | Tổng nutrition update real-time |

---

## Form 5: WorkoutLogger (23 TCs)

**Navigation**: Fitness tab → Workout → Strength mode (default)

### FIELD (7)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_WL_F01 | Weight input | Tap weight field, nhập "60" | Value = 60, numeric keyboard |
| TC_WL_F02 | Reps input | Nhập "10" | Value = 10, integer only |
| TC_WL_F03 | RPE select | Tap RPE 7 | RPE 7 highlighted |
| TC_WL_F04 | ±weight buttons | Tap +10kg → +10kg | Weight = initial + 20 |
| TC_WL_F05 | Timer display | Bắt đầu workout | Timer counting up |
| TC_WL_F06 | Rest timer | Log 1 set | Rest timer hiện sau log |
| TC_WL_F07 | Log set | Fill weight+reps, tap Log Set | Set appears in history list |

### VALID (4)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_WL_V01 | Weight min 0 | Nhập "-5" | Không nhận negative |
| TC_WL_V02 | Reps integer | Nhập "5.5" | Round hoặc reject decimal |
| TC_WL_V03 | RPE range 1-10 | Tap giá trị | Chỉ 1-10 selectable |
| TC_WL_V04 | RPE deselect | Tap RPE 7, tap lại RPE 7 | RPE deselected (optional) |

### SUBMIT (3)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_WL_S01 | Log set | Weight=60, reps=10, RPE=7, Log Set | Set record created, counters update |
| TC_WL_S02 | Finish workout | Log several sets, Finish | Workout saved, summary shown |
| TC_WL_S03 | Progressive overload | Previous session weight=60, current shows suggestion | Suggestion chip hiện đúng (e.g., "+2.5kg") |

### MOBILE (5)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_WL_M01 | Weight snap-back | Xóa hết weight → blur | Không snap-back, fallback 0 |
| TC_WL_M02 | ±buttons touch | Tap +/- buttons nhanh | Touch target ≥44px, responsive |
| TC_WL_M03 | RPE buttons scroll | Screen nhỏ, 10 RPE buttons | Scrollable hoặc wrap properly |
| TC_WL_M04 | Timer không lag | Workout đang chạy, interact với form | Form responsive, timer chạy smooth |
| TC_WL_M05 | Haptic feedback | Log set | Vibration feedback (nếu enabled) |

### STATE (4)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_WL_ST01 | Draft auto-save | Log 2 sets, navigate away | Draft saved tự động |
| TC_WL_ST02 | Draft restore | Navigate back to WorkoutLogger | Sets + timer restored từ draft |
| TC_WL_ST03 | Draft clear on finish | Finish workout, check | Draft cleared, fresh start next time |
| TC_WL_ST04 | Exercise tab retention | Log set exercise A, switch to B, back to A | Exercise A sets still visible |

---

## Form 6: DishEditModal + QuickAdd (34 TCs)

**Navigation**: Library tab → Dishes → "+" (create) hoặc Edit icon (edit)

### FIELD (12)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_DE_F01 | Dish name | Nhập "Bún bò Huế" | Value hiển thị đúng tiếng Việt |
| TC_DE_F02 | Meal tags | Tap breakfast, tap lunch | Multi-select, cả 2 highlighted |
| TC_DE_F03 | Star rating | Tap star 4 | 4 stars filled, rating = 4 |
| TC_DE_F04 | Notes textarea | Nhập "Nấu theo công thức mẹ" | Text hiển thị đúng |
| TC_DE_F05 | Add ingredient | Tap ingredient từ library list | Ingredient added với default amount |
| TC_DE_F06 | Remove ingredient | Tap X trên ingredient đã chọn | Ingredient removed từ list |
| TC_DE_F07 | Edit amount | Tap amount input, nhập "200" | StringNumberController hiển thị 200 |
| TC_DE_F08 | ±amount buttons | Tap +/- buttons | Amount tăng/giảm theo step (1/5/10) |
| TC_DE_F09 | Search ingredients | Nhập "gà" vào search | Filter chỉ hiện ingredients có "gà" |
| TC_DE_F10 | QuickAdd name | Mở QuickAdd, nhập "Bột mì" | Name field accepts value |
| TC_DE_F11 | QuickAdd nutrition | Nhập cal=364, protein=10, carbs=76, fat=1, fiber=3 | All fields accept values |
| TC_DE_F12 | QuickAdd unit | Chọn unit (g/ml/...) | UnitSelector works |

### VALID (8)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_DE_V01 | Name required | Để trống name, Save | "Vui lòng nhập tên món ăn" |
| TC_DE_V02 | Tags required | Chọn name, không chọn tag, Save | "Vui lòng chọn ít nhất một meal tag" |
| TC_DE_V03 | Ingredients required | Chọn name + tag, không add ingredient, Save | "Vui lòng chọn ít nhất một nguyên liệu" |
| TC_DE_V04 | Amount negative | Add ingredient, nhập "-5", Save | "Số lượng không được âm" |
| TC_DE_V05 | Amount empty | Clear amount, Save | "Vui lòng nhập số lượng" |
| TC_DE_V06 | Amount NaN | Nhập "abc" (nếu được), Save | "Vui lòng nhập số lượng" |
| TC_DE_V07 | Error clear | TC_DE_V04 trigger, rồi nhập "150" | Error biến mất |
| TC_DE_V08 | QuickAdd name required | Mở QuickAdd, để trống name, Submit | Error hoặc không submit |

### SUBMIT (4)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_DE_S01 | Create new dish | Fill name + tags + ingredients, Save | Dish tạo mới, modal đóng |
| TC_DE_S02 | Edit existing dish | Mở edit, change name, Save | ID preserved, name updated |
| TC_DE_S03 | Prevent double submit | Tap Save nhanh 2 lần | Chỉ submit 1 lần |
| TC_DE_S04 | QuickAdd submit | Fill QuickAdd, Submit | Ingredient added to list, QuickAdd form resets |

### MOBILE (6)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_DE_M01 | Amount snap-back | Xóa hết amount → blur | Không snap-back (BUG-002 regression) |
| TC_DE_M02 | Modal full-height | Mở modal trên mobile | Modal full screen, scrollable |
| TC_DE_M03 | Ingredient list scroll | Add 10+ ingredients | List scrollable |
| TC_DE_M04 | Star rating touch | Tap stars | Dễ tap chính xác |
| TC_DE_M05 | QuickAdd keyboard | Focus nutrition inputs | Numeric keyboard |
| TC_DE_M06 | AI suggest tap | Tap Sparkles icon | Loading state, suggestions appear |

### STATE (4)

| ID | Test Case | Steps | Expected |
|----|-----------|-------|----------|
| TC_DE_ST01 | Edit load data | Mở edit existing dish | All fields pre-populated đúng |
| TC_DE_ST02 | Unsaved changes | Change name, tap Close | "Thay đổi chưa lưu" dialog hiện |
| TC_DE_ST03 | Save & go back | Từ unsaved dialog, tap "Lưu & quay lại" | Data saved + modal đóng |
| TC_DE_ST04 | Recently used | allDishes provided | Recently used ingredients section hiện |

---

## Success Criteria

- **100% TCs Passed**: Tất cả 156 test cases pass (TCs marked "conditional" không block pass criteria)
- **0 Console Errors**: DevTools Console sạch
- **0 Network Errors**: Không có failed API calls
- **0 Snap-back Bugs**: BUG-002 regression = 0 trên tất cả StringNumberController inputs
- **Touch Targets**: Tất cả interactive elements ≥44px trên Android

### Accepted Warnings (không tính là lỗi)

- `react-hooks/incompatible-library` — React Compiler warning về RHF `watch()`, known issue, non-actionable
- `i18next is maintained with support from Locize` — i18next promo message in dev mode
- `Not implemented: Window's scrollTo()` — jsdom limitation, chỉ xuất hiện trong test environment

### Conditional TCs

- TC_WL_M05 (Haptic feedback): Conditional — chỉ test nếu device hỗ trợ vibration API

## Post-Test Actions

Nếu phát hiện bugs:
1. Log bug theo template (BUG-RHF-XXX)
2. Phân tích root cause (Frontend/Backend/API)
3. Đề xuất 3 giải pháp với trade-offs
4. Fix + rerun affected TCs
5. Run `npx eslint` — no eslint-disable
6. Run `npx vitest run` — no test regressions
7. Run coverage — maintain ≥ current level
8. Commit with Co-authored-by trailer

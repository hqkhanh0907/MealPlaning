# Scenario 3: Nutrition Tracking

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Nutrition Tracking bao gồm toàn bộ luồng tính toán, hiển thị và theo dõi dinh dưỡng. Mỗi ingredient có nutrition per 100g/100ml/1 unit (calories, protein, carbs, fat). Dish nutrition = tổng (ingredient.nutrition x amount / baseUnit). Day nutrition = tổng tất cả dishes across 3 meals. Summary component hiển thị progress bars actual vs target. Target calories từ userProfile.targetCalories, protein = weight x proteinRatio.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| Summary | Summary.tsx | Progress bars, daily totals |
| NutritionSubTab | NutritionSubTab.tsx | Detailed breakdown per meal |
| nutrition.ts | utils/nutrition.ts | Pure functions tính toán |
| GoalSettingsModal | GoalSettingsModal.tsx | Edit targets |

## Luồng nghiệp vụ

1. User thêm/xóa dish → nutrition recalculate → bars update
2. User đặt goal → target change → proportion bars update
3. Ingredient edit → dish nutrition cascade → day nutrition cascade

## Quy tắc nghiệp vụ

1. Calories round to integer, protein/carbs/fat to 1 decimal
2. Progress bar: calories — orange (<=100%), rose/red (>100%); protein — always blue
3. Zero division: 0 dishes = 0 nutrition, 0 target = no percentage
4. targetProtein = weight x proteinRatio
5. Nutrition memoized (useMemo) to avoid recalc on unrelated renders

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_NUT_01 | Hiển thị nutrition = 0 khi plan trống | Positive | P1 |
| TC_NUT_02 | Nutrition cập nhật khi thêm 1 dish | Positive | P0 |
| TC_NUT_03 | Nutrition cập nhật khi thêm nhiều dishes | Positive | P1 |
| TC_NUT_04 | Nutrition giảm khi xóa dish khỏi plan | Positive | P1 |
| TC_NUT_05 | Tổng cal = sum(dish.cal) across 3 meals | Positive | P0 |
| TC_NUT_06 | Tổng protein = sum(dish.protein) | Positive | P1 |
| TC_NUT_07 | Tổng carbs = sum(dish.carbs) | Positive | P1 |
| TC_NUT_08 | Tổng fat = sum(dish.fat) | Positive | P1 |
| TC_NUT_09 | Progress bar tỉ lệ actual/target | Positive | P1 |
| TC_NUT_10 | Progress bar 0% khi no food | Positive | P1 |
| TC_NUT_11 | Progress bar 50% | Positive | P2 |
| TC_NUT_12 | Progress bar 100% | Positive | P2 |
| TC_NUT_13 | Progress bar 150% (overflow) | Boundary | P1 |
| TC_NUT_14 | Progress bar calories orange khi <=100% | Positive | P2 |
| TC_NUT_15 | Progress bar calories rose khi >100% | Positive | P2 |
| TC_NUT_16 | Progress bar protein always blue | Positive | P2 |
| TC_NUT_17 | Target cal hiển thị từ userProfile | Positive | P1 |
| TC_NUT_18 | Target protein = weight x ratio | Positive | P1 |
| TC_NUT_19 | Change target → bars update | Positive | P1 |
| TC_NUT_20 | Change weight → protein target update | Positive | P1 |
| TC_NUT_21 | Change proteinRatio → target update | Positive | P1 |
| TC_NUT_22 | Dish nutrition per ingredient amount | Positive | P1 |
| TC_NUT_23 | Ingredient unit g — per 100g | Positive | P1 |
| TC_NUT_24 | Ingredient unit ml — per 100ml | Positive | P1 |
| TC_NUT_25 | Ingredient custom unit — per 1 unit | Positive | P1 |
| TC_NUT_26 | Dish with 0 ingredients = 0 nutrition | Edge | P1 |
| TC_NUT_27 | Rounding calories to integer | Positive | P2 |
| TC_NUT_28 | Rounding protein to 1 decimal | Positive | P2 |
| TC_NUT_29 | Rounding carbs to 1 decimal | Positive | P2 |
| TC_NUT_30 | Rounding fat to 1 decimal | Positive | P2 |
| TC_NUT_31 | Breakfast only nutrition | Positive | P2 |
| TC_NUT_32 | Lunch only nutrition | Positive | P2 |
| TC_NUT_33 | Dinner only nutrition | Positive | P2 |
| TC_NUT_34 | All 3 meals nutrition combined | Positive | P1 |
| TC_NUT_35 | Per-meal breakdown display | Positive | P1 |
| TC_NUT_36 | Mini nutrition bar trên slot | Positive | P1 |
| TC_NUT_37 | Dark mode nutrition colors | Positive | P2 |
| TC_NUT_38 | i18n nutrition labels vi/en | Positive | P2 |
| TC_NUT_39 | Desktop side-by-side layout | Positive | P2 |
| TC_NUT_40 | Mobile sub-tab Nutrition | Positive | P2 |
| TC_NUT_41 | Goal settings modal — set cal | Positive | P1 |
| TC_NUT_42 | Goal settings modal — set protein ratio | Positive | P1 |
| TC_NUT_43 | Goal settings modal — set weight | Positive | P1 |
| TC_NUT_44 | Goal settings persist after reload | Positive | P1 |
| TC_NUT_45 | Nutrition persist = derived (not stored separately) | Positive | P1 |
| TC_NUT_46 | Edit ingredient cal → dish cal cascade | Positive | P1 |
| TC_NUT_47 | Edit ingredient protein → cascade | Positive | P1 |
| TC_NUT_48 | Delete ingredient → dish nutrition change | Positive | P1 |
| TC_NUT_49 | Add ingredient to dish → nutrition increase | Positive | P1 |
| TC_NUT_50 | Change ingredient amount → nutrition change | Positive | P1 |
| TC_NUT_51 | Import data → nutrition recalc | Positive | P1 |
| TC_NUT_52 | Template apply → nutrition shows | Positive | P1 |
| TC_NUT_53 | Copy plan → target date nutrition | Positive | P1 |
| TC_NUT_54 | Very small amount 0.1g | Edge | P2 |
| TC_NUT_55 | Very large amount 10000g | Edge | P2 |
| TC_NUT_56 | Floating point precision (0.1 + 0.2 = 0.3) | Edge | P1 |
| TC_NUT_57 | Zero nutrition ingredient | Edge | P2 |
| TC_NUT_58 | Negative values handling | Negative | P1 |
| TC_NUT_59 | Mixed units (g + ml + custom) in one dish | Edge | P2 |
| TC_NUT_60 | Nutrition with deleted ingredient cascade | Edge | P1 |
| TC_NUT_61 | Cumulative rounding 20+ dishes | Edge | P2 |
| TC_NUT_62 | Infinity/NaN prevention | Negative | P0 |
| TC_NUT_63 | MAX_SAFE_INTEGER overflow | Boundary | P2 |
| TC_NUT_64 | Percentage > 1000% | Boundary | P2 |
| TC_NUT_65 | Bar 0% width = visible (min-width) | Positive | P2 |
| TC_NUT_66 | Bar 200% — capped at container | Boundary | P2 |
| TC_NUT_67 | Bar animation smooth transition | Positive | P3 |
| TC_NUT_68 | Responsive bar width on resize | Positive | P2 |
| TC_NUT_69 | Dark mode bar colors contrast | Positive | P2 |
| TC_NUT_70 | High contrast mode bars | Positive | P3 |
| TC_NUT_71 | Tooltip/hover on bars shows exact value | Positive | P2 |
| TC_NUT_72 | Bar with NaN target — no bar shown | Edge | P2 |
| TC_NUT_73 | Bar with 0 target — no division error | Edge | P1 |
| TC_NUT_74 | Add dish → nutrition updates instantly | Positive | P1 |
| TC_NUT_75 | Remove dish → updates instantly | Positive | P1 |
| TC_NUT_76 | Edit ingredient → cascades to calendar | Positive | P1 |
| TC_NUT_77 | Change date → recalculates for new date | Positive | P1 |
| TC_NUT_78 | Import data → recalculates | Positive | P1 |
| TC_NUT_79 | Change goal → bars update proportion | Positive | P1 |
| TC_NUT_80 | Language switch → labels update | Positive | P2 |
| TC_NUT_81 | Template apply → nutrition shows | Positive | P2 |
| TC_NUT_82 | Copy plan → target nutrition shows | Positive | P2 |
| TC_NUT_83 | Clear plan → nutrition zeroes | Positive | P1 |
| TC_NUT_84 | Goal not set — show defaults | Edge | P1 |
| TC_NUT_85 | Goal = 0 calories — no division error | Edge | P1 |
| TC_NUT_86 | Goal very high 10000 kcal — bar tiny | Boundary | P2 |
| TC_NUT_87 | Goal change persists after reload | Positive | P1 |
| TC_NUT_88 | Protein ratio = 0 — protein target = 0 | Edge | P2 |
| TC_NUT_89 | Protein ratio = 5.0 — very high target | Boundary | P2 |
| TC_NUT_90 | Weight = 0 — protein target = 0 | Edge | P2 |
| TC_NUT_91 | Weight very large (300kg) | Boundary | P2 |
| TC_NUT_92 | Nutrition calc 100 dishes performance | Boundary | P2 |
| TC_NUT_93 | Memoization — no recalc on unrelated state | Boundary | P2 |
| TC_NUT_94 | Real-time update during dish selection | Positive | P2 |
| TC_NUT_95 | Batch update performance (import 50 dishes) | Boundary | P2 |
| TC_NUT_96 | Unnecessary re-renders prevention | Boundary | P3 |
| TC_NUT_97 | Screen reader reads nutrition values | Positive | P3 |
| TC_NUT_98 | ARIA progressbar role on bars | Positive | P3 |
| TC_NUT_99 | Color-blind safe indicators | Positive | P3 |
| TC_NUT_100 | Keyboard access to nutrition details | Positive | P3 |
| TC_NUT_101 | Live region for nutrition updates | Positive | P3 |
| TC_NUT_102 | Proper labeling (cal, protein, carbs, fat) | Positive | P2 |
| TC_NUT_103 | Unit labels correct (kcal, g) | Positive | P2 |
| TC_NUT_104 | Nutrition tooltip shows meal breakdown | Positive | P2 |
| TC_NUT_105 | Nutrition data export matches display | Positive | P2 |

---

## Chi tiết Test Cases

##### TC_NUT_01–10: Core Nutrition Display
- TC_NUT_01: Plan trống → all 4 values = 0, bars empty
- TC_NUT_02: Thêm dish 300cal → summary shows 300 kcal
- TC_NUT_03: Thêm 3 dishes (100+200+300) → total 600 kcal
- TC_NUT_04: Xóa dish 200cal → total giảm 200
- TC_NUT_05: 3 meals: B=200, L=400, D=300 → total=900
- TC_NUT_06-08: Protein/carbs/fat sum correctly across meals
- TC_NUT_09: Target 2000cal, actual 1000 → bar 50%
- TC_NUT_10: No dishes → bar 0%

##### TC_NUT_11–16: Progress Bar States
- TC_NUT_11-12: Bars at 50% and 100% width
- TC_NUT_13: 150% → bar capped at container, number shows actual
- TC_NUT_14-16: Color coding: calories orange/rose, protein blue

##### TC_NUT_17–21: Goal Settings
- TC_NUT_17-18: Targets display correctly from profile
- TC_NUT_19-21: Changing target/weight/ratio updates bars

##### TC_NUT_22–30: Calculation Logic
- TC_NUT_22-25: Per-unit calculations (g, ml, custom)
- TC_NUT_26: 0 ingredients = 0
- TC_NUT_27-30: Rounding rules

##### TC_NUT_31–40: Display Variants
- TC_NUT_31-33: Single meal nutrition
- TC_NUT_34-35: Combined and per-meal breakdown
- TC_NUT_36: Mini bars on slots
- TC_NUT_37-40: Dark mode, i18n, desktop, mobile

##### TC_NUT_41–53: Integration
- TC_NUT_41-44: Goal modal CRUD
- TC_NUT_45: Nutrition not stored separately (derived)
- TC_NUT_46-53: Cascade from ingredient edit, import, template, copy, etc.

##### TC_NUT_54–73: Edge Cases & Boundaries
- TC_NUT_54-55: Extreme amounts (0.1g, 10000g)
- TC_NUT_56: Float precision: verify 0.1+0.2 rounds correctly
- TC_NUT_57-60: Zero nutrition, negative, mixed units, deleted ingredient
- TC_NUT_61-64: Cumulative rounding, Infinity/NaN, overflow, extreme %
- TC_NUT_65-73: Bar visual edge cases

##### TC_NUT_74–83: Cross-Component Sync
- Real-time updates from all sources (add/remove dish, edit ingredient, date change, import, goals, language, template, copy, clear)

##### TC_NUT_84–91: Goal Edge Cases
- TC_NUT_84-91: Unset goals, zero goals, extreme values

##### TC_NUT_92–96: Performance
- TC_NUT_92: 100 dishes calc time
- TC_NUT_93-96: Memoization, real-time, batch, re-renders

##### TC_NUT_97–105: Accessibility
- Screen reader, ARIA, color-blind, keyboard, labels, units, tooltip, export

---

## Đề xuất Cải tiến

### Đề xuất 1: Macro Ratio Pie Chart
- **Vấn đề hiện tại**: Chỉ có progress bars, không thấy tỉ lệ macros (P/C/F).
- **Giải pháp đề xuất**: Thêm pie chart nhỏ hiển thị % protein/carbs/fat. Interactive: click section → detail.
- **Lý do chi tiết**: Tỉ lệ macros quan trọng hơn tổng calories cho fitness goals. Visual pie chart dễ hiểu hơn số.
- **Phần trăm cải thiện**: Nutrition awareness +45%, Goal adherence +30%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 2: Weekly Trend Graph
- **Vấn đề hiện tại**: Chỉ thấy nutrition từng ngày, không thấy trend.
- **Giải pháp đề xuất**: Mini line graph 7 ngày cho calories/protein, hiển thị trend up/down/stable.
- **Lý do chi tiết**: Trend giúp nhận ra patterns (weekend overeating). Data viz cải thiện self-awareness 50%.
- **Phần trăm cải thiện**: Long-term adherence +35%, User insight +50%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 3: Smart Goal Suggestions
- **Vấn đề hiện tại**: User tự nhập goal, không biết mức nào phù hợp.
- **Giải pháp đề xuất**: Dựa trên weight/height/activity level, suggest TDEE (BMR x activity factor). Show range: lose/maintain/gain.
- **Lý do chi tiết**: 60% users đặt goal không phù hợp dẫn đến bỏ cuộc. Auto-suggestion tăng accuracy.
- **Phần trăm cải thiện**: Goal accuracy +60%, Retention +25%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 4: Remaining Budget Display
- **Vấn đề hiện tại**: Phải tự tính cal còn lại = target - actual.
- **Giải pháp đề xuất**: Hiển thị "Còn lại: X kcal" prominent. Khi planning meal, show "budget remaining after this meal".
- **Lý do chi tiết**: Remaining budget giúp quyết định bữa tiếp theo. Giảm over-eating risk.
- **Phần trăm cải thiện**: Over-eating incidents -40%, Decision speed +30%
- **Mức độ ưu tiên**: High | **Effort**: S

### Đề xuất 5: Micronutrient Tracking
- **Vấn đề hiện tại**: Chỉ track 4 macros (cal/protein/carbs/fat).
- **Giải pháp đề xuất**: Thêm tracking fiber, sodium, sugar (optional, expandable section).
- **Lý do chi tiết**: Health-conscious users cần micronutrients. Expandable = không overwhelm casual users.
- **Phần trăm cải thiện**: Health tracking completeness +40%, Power user satisfaction +50%
- **Mức độ ưu tiên**: Low | **Effort**: L

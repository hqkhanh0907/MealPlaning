# Scenario 3: Nutrition Tracking

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

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

## Test Cases (210 TCs)

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
| TC_NUT_106 | MacroChart render khi có data | Positive | P1 |
| TC_NUT_107 | MacroChart tỉ lệ protein/carbs/fat | Positive | P1 |
| TC_NUT_108 | MacroChart 100% protein 0% others | Edge | P2 |
| TC_NUT_109 | MacroChart 0% protein 100% carbs | Edge | P2 |
| TC_NUT_110 | MacroChart 0%/0%/100% fat | Edge | P2 |
| TC_NUT_111 | MacroChart equal thirds 33/33/34 | Positive | P2 |
| TC_NUT_112 | MacroChart all zeros no chart | Edge | P1 |
| TC_NUT_113 | MacroChart rất nhỏ 0.1g each | Edge | P2 |
| TC_NUT_114 | MacroChart rất lớn 1000g each | Boundary | P2 |
| TC_NUT_115 | MacroChart dark mode colors | Positive | P2 |
| TC_NUT_116 | MacroChart responsive sizing | Positive | P2 |
| TC_NUT_117 | MacroChart hover hiển thị values | Positive | P2 |
| TC_NUT_118 | MacroChart animation data change | Positive | P3 |
| TC_NUT_119 | MacroChart accessibility labels | Positive | P3 |
| TC_NUT_120 | MacroChart cập nhật thêm dish | Positive | P1 |
| TC_NUT_121 | MacroChart cập nhật xóa dish | Positive | P1 |
| TC_NUT_122 | MacroChart 1 macro dominant 95/3/2 | Edge | P2 |
| TC_NUT_123 | MacroChart negative values graceful | Negative | P1 |
| TC_NUT_124 | MacroChart NaN values no crash | Negative | P1 |
| TC_NUT_125 | MacroChart legend labels localized | Positive | P2 |
| TC_NUT_126 | RecommendationPanel hiển thị targets | Positive | P1 |
| TC_NUT_127 | getDynamicTips success tip gần target | Positive | P1 |
| TC_NUT_128 | getDynamicTips warning tip vượt target | Positive | P1 |
| TC_NUT_129 | getDynamicTips info tip thiếu hụt | Positive | P1 |
| TC_NUT_130 | Tip success emerald styling | Positive | P2 |
| TC_NUT_131 | Tip warning amber styling | Positive | P2 |
| TC_NUT_132 | Tip info blue styling | Positive | P2 |
| TC_NUT_133 | Tips memoized useMemo | Boundary | P2 |
| TC_NUT_134 | isComplete true 3 bữa có dishes | Positive | P1 |
| TC_NUT_135 | isComplete false thiếu 1 bữa | Positive | P1 |
| TC_NUT_136 | hasAnyPlan true ít nhất 1 bữa | Positive | P1 |
| TC_NUT_137 | hasAnyPlan false plan trống | Positive | P1 |
| TC_NUT_138 | getMissingSlots đúng bữa thiếu | Positive | P1 |
| TC_NUT_139 | Missing 1 slot hiển thị 1 tên | Positive | P2 |
| TC_NUT_140 | Missing 2 slots hiển thị 2 tên | Positive | P2 |
| TC_NUT_141 | Missing 3 slots hiển thị 3 tên | Positive | P2 |
| TC_NUT_142 | Plan complete CheckCircle message | Positive | P1 |
| TC_NUT_143 | Plan incomplete AlertCircle missing | Positive | P1 |
| TC_NUT_144 | No plan Switch to Meals button | Positive | P1 |
| TC_NUT_145 | Click Switch to Meals callback | Positive | P1 |
| TC_NUT_146 | No plan no onSwitchToMeals no button | Edge | P2 |
| TC_NUT_147 | Tip emoji đúng cho mỗi loại | Positive | P2 |
| TC_NUT_148 | Tips dark mode styling | Positive | P2 |
| TC_NUT_149 | Multiple tips stacked display | Positive | P2 |
| TC_NUT_150 | Tips i18n localized | Positive | P2 |
| TC_NUT_151 | Summary calories progress bar | Positive | P0 |
| TC_NUT_152 | Summary protein progress bar | Positive | P0 |
| TC_NUT_153 | Summary carbs value display | Positive | P1 |
| TC_NUT_154 | Summary fat value display | Positive | P1 |
| TC_NUT_155 | Summary Edit Goals trigger | Positive | P1 |
| TC_NUT_156 | Summary per-meal breakdown | Positive | P1 |
| TC_NUT_157 | Summary breakfast nutrition | Positive | P2 |
| TC_NUT_158 | Summary lunch nutrition | Positive | P2 |
| TC_NUT_159 | Summary dinner nutrition | Positive | P2 |
| TC_NUT_160 | Summary actual > target warning | Positive | P1 |
| TC_NUT_161 | Summary target not set default | Edge | P1 |
| TC_NUT_162 | Summary dark mode bar colors | Positive | P2 |
| TC_NUT_163 | Summary responsive mobile | Positive | P2 |
| TC_NUT_164 | Summary responsive desktop | Positive | P2 |
| TC_NUT_165 | Summary bar animation | Positive | P3 |
| TC_NUT_166 | Summary bar label X/Y kcal | Positive | P2 |
| TC_NUT_167 | Summary bar percentage label | Positive | P2 |
| TC_NUT_168 | Summary empty 0/Y kcal | Positive | P2 |
| TC_NUT_169 | Summary over-budget vượt Z | Positive | P2 |
| TC_NUT_170 | Summary data-testid attributes | Positive | P2 |
| TC_NUT_171 | calculateIngredientNutrition g | Positive | P1 |
| TC_NUT_172 | calculateIngredientNutrition ml | Positive | P1 |
| TC_NUT_173 | calculateIngredientNutrition piece | Positive | P1 |
| TC_NUT_174 | normalizeUnit gram → g | Positive | P2 |
| TC_NUT_175 | normalizeUnit kilogram → kg | Positive | P2 |
| TC_NUT_176 | normalizeUnit liter → l | Positive | P2 |
| TC_NUT_177 | normalizeUnit unknown giữ nguyên | Edge | P2 |
| TC_NUT_178 | getConversionFactor kg=1000 | Positive | P2 |
| TC_NUT_179 | getConversionFactor mg=0.001 | Positive | P2 |
| TC_NUT_180 | getConversionFactor g=1 | Positive | P2 |
| TC_NUT_181 | isWeightOrVolume g true | Positive | P2 |
| TC_NUT_182 | isWeightOrVolume ml true | Positive | P2 |
| TC_NUT_183 | isWeightOrVolume piece false | Positive | P2 |
| TC_NUT_184 | ZERO_NUTRITION constant zeros | Positive | P2 |
| TC_NUT_185 | calculateDishesNutrition servings | Positive | P1 |
| TC_NUT_186 | Servings=2 double nutrition | Positive | P1 |
| TC_NUT_187 | Servings=0.5 half nutrition | Positive | P2 |
| TC_NUT_188 | Missing dish ID skip graceful | Negative | P1 |
| TC_NUT_189 | Empty dish IDs ZERO nutrition | Edge | P2 |
| TC_NUT_190 | toTempIngredient AI convert | Positive | P1 |
| TC_NUT_191 | toTempIngredient missing fields | Edge | P2 |
| TC_NUT_192 | 250g ingredient calc đúng | Positive | P1 |
| TC_NUT_193 | 500ml ingredient calc đúng | Positive | P1 |
| TC_NUT_194 | 2 pieces ingredient calc đúng | Positive | P1 |
| TC_NUT_195 | 1.5kg ingredient conversion | Edge | P2 |
| TC_NUT_196 | NutritionSubTab render 3 components | Positive | P0 |
| TC_NUT_197 | NutritionSubTab React.memo | Boundary | P2 |
| TC_NUT_198 | NutritionSubTab data-testid | Positive | P2 |
| TC_NUT_199 | NutritionSubTab space-y-6 layout | Positive | P2 |
| TC_NUT_200 | NutritionSubTab onEditGoals pass | Positive | P1 |
| TC_NUT_201 | NutritionSubTab onSwitchToMeals | Positive | P2 |
| TC_NUT_202 | NutritionSubTab displayName set | Positive | P3 |
| TC_NUT_203 | Multiple dishes same ingredient tổng | Positive | P1 |
| TC_NUT_204 | Dish 10+ ingredients total đúng | Boundary | P2 |
| TC_NUT_205 | Cross-tab sync Calendar↔Nutrition | Positive | P1 |
| TC_NUT_206 | Nutrition format locale vi-VN | Positive | P2 |
| TC_NUT_207 | Nutrition format locale en-US | Positive | P2 |
| TC_NUT_208 | Nutrition derived not stored | Positive | P1 |
| TC_NUT_209 | Rapid meal changes consistent | Edge | P1 |
| TC_NUT_210 | Mixed unit ingredients 1 dish | Edge | P2 |

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
- **Kết quả test thực tế**: | — |


##### TC_NUT_11–16: Progress Bar States
- TC_NUT_11-12: Bars at 50% and 100% width
- TC_NUT_13: 150% → bar capped at container, number shows actual
- TC_NUT_14-16: Color coding: calories orange/rose, protein blue
- **Kết quả test thực tế**: | — |


##### TC_NUT_17–21: Goal Settings
- TC_NUT_17-18: Targets display correctly from profile
- TC_NUT_19-21: Changing target/weight/ratio updates bars
- **Kết quả test thực tế**: | — |


##### TC_NUT_22–30: Calculation Logic
- TC_NUT_22-25: Per-unit calculations (g, ml, custom)
- TC_NUT_26: 0 ingredients = 0
- TC_NUT_27-30: Rounding rules
- **Kết quả test thực tế**: | — |


##### TC_NUT_31–40: Display Variants
- TC_NUT_31-33: Single meal nutrition
- TC_NUT_34-35: Combined and per-meal breakdown
- TC_NUT_36: Mini bars on slots
- TC_NUT_37-40: Dark mode, i18n, desktop, mobile
- **Kết quả test thực tế**: | — |


##### TC_NUT_41–53: Integration
- TC_NUT_41-44: Goal modal CRUD
- TC_NUT_45: Nutrition not stored separately (derived)
- TC_NUT_46-53: Cascade from ingredient edit, import, template, copy, etc.
- **Kết quả test thực tế**: | — |


##### TC_NUT_54–73: Edge Cases & Boundaries
- TC_NUT_54-55: Extreme amounts (0.1g, 10000g)
- TC_NUT_56: Float precision: verify 0.1+0.2 rounds correctly
- TC_NUT_57-60: Zero nutrition, negative, mixed units, deleted ingredient
- TC_NUT_61-64: Cumulative rounding, Infinity/NaN, overflow, extreme %
- TC_NUT_65-73: Bar visual edge cases
- **Kết quả test thực tế**: | — |


##### TC_NUT_74–83: Cross-Component Sync
- Real-time updates from all sources (add/remove dish, edit ingredient, date change, import, goals, language, template, copy, clear)
- **Kết quả test thực tế**: | — |


##### TC_NUT_84–91: Goal Edge Cases
- TC_NUT_84-91: Unset goals, zero goals, extreme values
- **Kết quả test thực tế**: | — |


##### TC_NUT_92–96: Performance
- TC_NUT_92: 100 dishes calc time
- TC_NUT_93-96: Memoization, real-time, batch, re-renders
- **Kết quả test thực tế**: | — |


##### TC_NUT_97–105: Accessibility
- Screen reader, ARIA, color-blind, keyboard, labels, units, tooltip, export

---
- **Kết quả test thực tế**: | — |


##### TC_NUT_106–125: MacroChart Component

##### TC_NUT_106: MacroChart render khi có data
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: MacroChart render khi có data
  3. Verify element visible và nội dung đúng
- **Expected Result**: MacroChart render khi có data — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_107: MacroChart tỉ lệ protein/carbs/fat
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: MacroChart tỉ lệ protein/carbs/fat
  3. Verify kết quả đúng như expected
- **Expected Result**: MacroChart tỉ lệ protein/carbs/fat — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_108: MacroChart 100% protein 0% others
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: MacroChart 100% protein 0% others
  3. Verify kết quả đúng như expected
- **Expected Result**: MacroChart 100% protein 0% others — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_NUT_109: MacroChart 0% protein 100% carbs
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: MacroChart 0% protein 100% carbs
  3. Verify kết quả đúng như expected
- **Expected Result**: MacroChart 0% protein 100% carbs — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_NUT_110: MacroChart 0%/0%/100% fat
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: MacroChart 0%/0%/100% fat
  3. Verify kết quả đúng như expected
- **Expected Result**: MacroChart 0%/0%/100% fat — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_NUT_111: MacroChart equal thirds 33/33/34
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: MacroChart equal thirds 33/33/34
  3. Verify kết quả đúng như expected
- **Expected Result**: MacroChart equal thirds 33/33/34 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_112: MacroChart all zeros no chart
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: MacroChart all zeros no chart
  3. Verify kết quả đúng như expected
- **Expected Result**: MacroChart all zeros no chart — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_NUT_113: MacroChart rất nhỏ 0.1g each
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: MacroChart rất nhỏ 0.1g each
  3. Verify kết quả đúng như expected
- **Expected Result**: MacroChart rất nhỏ 0.1g each — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_NUT_114: MacroChart rất lớn 1000g each
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: MacroChart rất lớn 1000g each
  3. Verify kết quả đúng như expected
- **Expected Result**: MacroChart rất lớn 1000g each — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_NUT_115: MacroChart dark mode colors
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Bật chế độ dark mode (nếu applicable)
  2. Quan sát colors và contrast
  3. Verify styling đúng theo design spec
- **Expected Result**: MacroChart dark mode colors — colors/contrast đúng trong dark mode, đọc được rõ ràng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_116: MacroChart responsive sizing
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Điều chỉnh viewport/device cho phù hợp
  2. Quan sát layout và styling
  3. Verify layout đúng theo breakpoint
- **Expected Result**: MacroChart responsive sizing — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_117: MacroChart hover hiển thị values
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: MacroChart hover hiển thị values
  3. Verify element visible và nội dung đúng
- **Expected Result**: MacroChart hover hiển thị values — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_118: MacroChart animation data change
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: MacroChart animation data change
  3. Verify kết quả đúng như expected
- **Expected Result**: MacroChart animation data change — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_119: MacroChart accessibility labels
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: MacroChart accessibility labels
  3. Verify kết quả đúng như expected
- **Expected Result**: MacroChart accessibility labels — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_120: MacroChart cập nhật thêm dish
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Ghi nhận giá trị hiện tại
  2. Thực hiện thay đổi trigger update
  3. Verify giá trị mới đúng sau update
- **Expected Result**: MacroChart cập nhật thêm dish — data/UI cập nhật ngay lập tức, đồng bộ chính xác
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_121: MacroChart cập nhật xóa dish
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Ghi nhận giá trị hiện tại
  2. Thực hiện thay đổi trigger update
  3. Verify giá trị mới đúng sau update
- **Expected Result**: MacroChart cập nhật xóa dish — data/UI cập nhật ngay lập tức, đồng bộ chính xác
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_122: MacroChart 1 macro dominant 95/3/2
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: MacroChart 1 macro dominant 95/3/2
  3. Verify kết quả đúng như expected
- **Expected Result**: MacroChart 1 macro dominant 95/3/2 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_NUT_123: MacroChart negative values graceful
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: MacroChart negative values graceful — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_NUT_124: MacroChart NaN values no crash
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: MacroChart NaN values no crash — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_NUT_125: MacroChart legend labels localized
- **Pre-conditions**: NutritionSubTab active, plan có dishes với nutrition data đầy đủ
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: MacroChart legend labels localized
  3. Verify kết quả đúng như expected
- **Expected Result**: MacroChart legend labels localized — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |


##### TC_NUT_126–150: RecommendationPanel & Tips

##### TC_NUT_126: RecommendationPanel hiển thị targets
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: RecommendationPanel hiển thị targets
  3. Verify element visible và nội dung đúng
- **Expected Result**: RecommendationPanel hiển thị targets — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_127: getDynamicTips success tip gần target
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: getDynamicTips success tip gần target
  3. Verify kết quả đúng như expected
- **Expected Result**: getDynamicTips success tip gần target — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_128: getDynamicTips warning tip vượt target
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: getDynamicTips warning tip vượt target
  3. Verify kết quả đúng như expected
- **Expected Result**: getDynamicTips warning tip vượt target — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_129: getDynamicTips info tip thiếu hụt
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: getDynamicTips info tip thiếu hụt
  3. Verify kết quả đúng như expected
- **Expected Result**: getDynamicTips info tip thiếu hụt — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_130: Tip success emerald styling
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Bật chế độ dark mode (nếu applicable)
  2. Quan sát colors và contrast
  3. Verify styling đúng theo design spec
- **Expected Result**: Tip success emerald styling — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_131: Tip warning amber styling
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Bật chế độ dark mode (nếu applicable)
  2. Quan sát colors và contrast
  3. Verify styling đúng theo design spec
- **Expected Result**: Tip warning amber styling — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_132: Tip info blue styling
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Bật chế độ dark mode (nếu applicable)
  2. Quan sát colors và contrast
  3. Verify styling đúng theo design spec
- **Expected Result**: Tip info blue styling — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_133: Tips memoized useMemo
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Mount component với initial props
  2. Trigger re-render với props không thay đổi
  3. Verify component không re-render không cần thiết
- **Expected Result**: Tips memoized useMemo — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_NUT_134: isComplete true 3 bữa có dishes
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: isComplete true 3 bữa có dishes
  3. Verify kết quả đúng như expected
- **Expected Result**: isComplete true 3 bữa có dishes — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_135: isComplete false thiếu 1 bữa
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: isComplete false thiếu 1 bữa
  3. Verify kết quả đúng như expected
- **Expected Result**: isComplete false thiếu 1 bữa — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_136: hasAnyPlan true ít nhất 1 bữa
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: hasAnyPlan true ít nhất 1 bữa
  3. Verify kết quả đúng như expected
- **Expected Result**: hasAnyPlan true ít nhất 1 bữa — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_137: hasAnyPlan false plan trống
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: hasAnyPlan false plan trống
  3. Verify kết quả đúng như expected
- **Expected Result**: hasAnyPlan false plan trống — empty state hiển thị đúng, không crash, UI thân thiện
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_138: getMissingSlots đúng bữa thiếu
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: getMissingSlots đúng bữa thiếu
  3. Verify kết quả đúng như expected
- **Expected Result**: getMissingSlots đúng bữa thiếu — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_139: Missing 1 slot hiển thị 1 tên
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Missing 1 slot hiển thị 1 tên
  3. Verify element visible và nội dung đúng
- **Expected Result**: Missing 1 slot hiển thị 1 tên — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_140: Missing 2 slots hiển thị 2 tên
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Missing 2 slots hiển thị 2 tên
  3. Verify element visible và nội dung đúng
- **Expected Result**: Missing 2 slots hiển thị 2 tên — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_141: Missing 3 slots hiển thị 3 tên
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Missing 3 slots hiển thị 3 tên
  3. Verify element visible và nội dung đúng
- **Expected Result**: Missing 3 slots hiển thị 3 tên — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_142: Plan complete CheckCircle message
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Plan complete CheckCircle message
  3. Verify kết quả đúng như expected
- **Expected Result**: Plan complete CheckCircle message — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_143: Plan incomplete AlertCircle missing
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Plan incomplete AlertCircle missing
  3. Verify kết quả đúng như expected
- **Expected Result**: Plan incomplete AlertCircle missing — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_144: No plan Switch to Meals button
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: No plan Switch to Meals button — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_145: Click Switch to Meals callback
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: Click Switch to Meals callback
  3. Verify action được thực thi đúng
- **Expected Result**: Click Switch to Meals callback — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_146: No plan no onSwitchToMeals no button
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: No plan no onSwitchToMeals no button — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_NUT_147: Tip emoji đúng cho mỗi loại
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Tip emoji đúng cho mỗi loại
  3. Verify kết quả đúng như expected
- **Expected Result**: Tip emoji đúng cho mỗi loại — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_148: Tips dark mode styling
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Bật chế độ dark mode (nếu applicable)
  2. Quan sát colors và contrast
  3. Verify styling đúng theo design spec
- **Expected Result**: Tips dark mode styling — colors/contrast đúng trong dark mode, đọc được rõ ràng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_149: Multiple tips stacked display
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Multiple tips stacked display
  3. Verify element visible và nội dung đúng
- **Expected Result**: Multiple tips stacked display — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_150: Tips i18n localized
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Tips i18n localized
  3. Verify kết quả đúng như expected
- **Expected Result**: Tips i18n localized — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |


##### TC_NUT_151–170: Summary Component Deep Tests

##### TC_NUT_151: Summary calories progress bar
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Summary calories progress bar
  3. Verify kết quả đúng như expected
- **Expected Result**: Summary calories progress bar — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_152: Summary protein progress bar
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Summary protein progress bar
  3. Verify kết quả đúng như expected
- **Expected Result**: Summary protein progress bar — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_153: Summary carbs value display
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Summary carbs value display
  3. Verify element visible và nội dung đúng
- **Expected Result**: Summary carbs value display — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_154: Summary fat value display
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Summary fat value display
  3. Verify element visible và nội dung đúng
- **Expected Result**: Summary fat value display — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_155: Summary Edit Goals trigger
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: Summary Edit Goals trigger
  3. Verify action được thực thi đúng
- **Expected Result**: Summary Edit Goals trigger — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_156: Summary per-meal breakdown
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Summary per-meal breakdown
  3. Verify kết quả đúng như expected
- **Expected Result**: Summary per-meal breakdown — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_157: Summary breakfast nutrition
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Summary breakfast nutrition
  3. Verify kết quả đúng như expected
- **Expected Result**: Summary breakfast nutrition — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_158: Summary lunch nutrition
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Summary lunch nutrition
  3. Verify kết quả đúng như expected
- **Expected Result**: Summary lunch nutrition — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_159: Summary dinner nutrition
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Summary dinner nutrition
  3. Verify kết quả đúng như expected
- **Expected Result**: Summary dinner nutrition — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_160: Summary actual > target warning
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Summary actual > target warning
  3. Verify kết quả đúng như expected
- **Expected Result**: Summary actual > target warning — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_161: Summary target not set default
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Thiết lập điều kiện: Summary target not set default
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: Summary target not set default — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_NUT_162: Summary dark mode bar colors
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Bật chế độ dark mode (nếu applicable)
  2. Quan sát colors và contrast
  3. Verify styling đúng theo design spec
- **Expected Result**: Summary dark mode bar colors — colors/contrast đúng trong dark mode, đọc được rõ ràng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_163: Summary responsive mobile
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Điều chỉnh viewport/device cho phù hợp
  2. Quan sát layout và styling
  3. Verify layout đúng theo breakpoint
- **Expected Result**: Summary responsive mobile — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_164: Summary responsive desktop
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Điều chỉnh viewport/device cho phù hợp
  2. Quan sát layout và styling
  3. Verify layout đúng theo breakpoint
- **Expected Result**: Summary responsive desktop — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_165: Summary bar animation
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Summary bar animation
  3. Verify kết quả đúng như expected
- **Expected Result**: Summary bar animation — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_166: Summary bar label X/Y kcal
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Summary bar label X/Y kcal
  3. Verify kết quả đúng như expected
- **Expected Result**: Summary bar label X/Y kcal — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_167: Summary bar percentage label
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Summary bar percentage label
  3. Verify kết quả đúng như expected
- **Expected Result**: Summary bar percentage label — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_168: Summary empty 0/Y kcal
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Summary empty 0/Y kcal
  3. Verify kết quả đúng như expected
- **Expected Result**: Summary empty 0/Y kcal — empty state hiển thị đúng, không crash, UI thân thiện
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_169: Summary over-budget vượt Z
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Summary over-budget vượt Z
  3. Verify kết quả đúng như expected
- **Expected Result**: Summary over-budget vượt Z — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_170: Summary data-testid attributes
- **Pre-conditions**: NutritionSubTab active, Summary component render với nutrition data
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Summary data-testid attributes
  3. Verify kết quả đúng như expected
- **Expected Result**: Summary data-testid attributes — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |


##### TC_NUT_171–195: Nutrition Calculation Deep Tests

##### TC_NUT_171: calculateIngredientNutrition g
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: calculateIngredientNutrition g — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_172: calculateIngredientNutrition ml
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: calculateIngredientNutrition ml — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_173: calculateIngredientNutrition piece
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: calculateIngredientNutrition piece — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_174: normalizeUnit gram → g
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: normalizeUnit gram → g — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_175: normalizeUnit kilogram → kg
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: normalizeUnit kilogram → kg — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_176: normalizeUnit liter → l
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: normalizeUnit liter → l — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_177: normalizeUnit unknown giữ nguyên
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: normalizeUnit unknown giữ nguyên — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_NUT_178: getConversionFactor kg=1000
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: getConversionFactor kg=1000 — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_179: getConversionFactor mg=0.001
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: getConversionFactor mg=0.001 — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_180: getConversionFactor g=1
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: getConversionFactor g=1 — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_181: isWeightOrVolume g true
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: isWeightOrVolume g true
  3. Verify kết quả đúng như expected
- **Expected Result**: isWeightOrVolume g true — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_182: isWeightOrVolume ml true
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: isWeightOrVolume ml true
  3. Verify kết quả đúng như expected
- **Expected Result**: isWeightOrVolume ml true — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_183: isWeightOrVolume piece false
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: isWeightOrVolume piece false
  3. Verify kết quả đúng như expected
- **Expected Result**: isWeightOrVolume piece false — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_184: ZERO_NUTRITION constant zeros
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: ZERO_NUTRITION constant zeros
  3. Verify kết quả đúng như expected
- **Expected Result**: ZERO_NUTRITION constant zeros — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_185: calculateDishesNutrition servings
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: calculateDishesNutrition servings — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_186: Servings=2 double nutrition
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Servings=2 double nutrition
  3. Verify kết quả đúng như expected
- **Expected Result**: Servings=2 double nutrition — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_187: Servings=0.5 half nutrition
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Servings=0.5 half nutrition
  3. Verify kết quả đúng như expected
- **Expected Result**: Servings=0.5 half nutrition — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_188: Missing dish ID skip graceful
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: Missing dish ID skip graceful — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_NUT_189: Empty dish IDs ZERO nutrition
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Empty dish IDs ZERO nutrition
  3. Verify kết quả đúng như expected
- **Expected Result**: Empty dish IDs ZERO nutrition — empty state hiển thị đúng, không crash, UI thân thiện
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_NUT_190: toTempIngredient AI convert
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: toTempIngredient AI convert
  3. Verify kết quả đúng như expected
- **Expected Result**: toTempIngredient AI convert — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_191: toTempIngredient missing fields
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: toTempIngredient missing fields
  3. Verify kết quả đúng như expected
- **Expected Result**: toTempIngredient missing fields — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_NUT_192: 250g ingredient calc đúng
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: 250g ingredient calc đúng
  3. Verify kết quả đúng như expected
- **Expected Result**: 250g ingredient calc đúng — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_193: 500ml ingredient calc đúng
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: 500ml ingredient calc đúng
  3. Verify kết quả đúng như expected
- **Expected Result**: 500ml ingredient calc đúng — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_194: 2 pieces ingredient calc đúng
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: 2 pieces ingredient calc đúng
  3. Verify kết quả đúng như expected
- **Expected Result**: 2 pieces ingredient calc đúng — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_195: 1.5kg ingredient conversion
- **Pre-conditions**: Test unit cho các pure functions trong utils/nutrition.ts
- **Steps**:
  1. Chuẩn bị input data cho calculation
  2. Gọi function/trigger calculation
  3. Verify kết quả tính toán chính xác
- **Expected Result**: 1.5kg ingredient conversion — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |


##### TC_NUT_196–210: NutritionSubTab Integration

##### TC_NUT_196: NutritionSubTab render 3 components
- **Pre-conditions**: NutritionSubTab component mounted với đầy đủ props
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: NutritionSubTab render 3 components
  3. Verify element visible và nội dung đúng
- **Expected Result**: NutritionSubTab render 3 components — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_197: NutritionSubTab React.memo
- **Pre-conditions**: NutritionSubTab component mounted với đầy đủ props
- **Steps**:
  1. Mount component với initial props
  2. Trigger re-render với props không thay đổi
  3. Verify component không re-render không cần thiết
- **Expected Result**: NutritionSubTab React.memo — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_NUT_198: NutritionSubTab data-testid
- **Pre-conditions**: NutritionSubTab component mounted với đầy đủ props
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: NutritionSubTab data-testid
  3. Verify kết quả đúng như expected
- **Expected Result**: NutritionSubTab data-testid — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_199: NutritionSubTab space-y-6 layout
- **Pre-conditions**: NutritionSubTab component mounted với đầy đủ props
- **Steps**:
  1. Điều chỉnh viewport/device cho phù hợp
  2. Quan sát layout và styling
  3. Verify layout đúng theo breakpoint
- **Expected Result**: NutritionSubTab space-y-6 layout — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_200: NutritionSubTab onEditGoals pass
- **Pre-conditions**: NutritionSubTab component mounted với đầy đủ props
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: NutritionSubTab onEditGoals pass
  3. Verify kết quả đúng như expected
- **Expected Result**: NutritionSubTab onEditGoals pass — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_201: NutritionSubTab onSwitchToMeals
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: NutritionSubTab onSwitchToMeals — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_202: NutritionSubTab displayName set
- **Pre-conditions**: NutritionSubTab component mounted với đầy đủ props
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: NutritionSubTab displayName set
  3. Verify element visible và nội dung đúng
- **Expected Result**: NutritionSubTab displayName set — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_203: Multiple dishes same ingredient tổng
- **Pre-conditions**: NutritionSubTab active, RecommendationPanel render với dayNutrition và targets
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Multiple dishes same ingredient tổng
  3. Verify kết quả đúng như expected
- **Expected Result**: Multiple dishes same ingredient tổng — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_204: Dish 10+ ingredients total đúng
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Dish 10+ ingredients total đúng
  3. Verify kết quả đúng như expected
- **Expected Result**: Dish 10+ ingredients total đúng — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_NUT_205: Cross-tab sync Calendar↔Nutrition
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Cross-tab sync Calendar↔Nutrition
  3. Verify kết quả đúng như expected
- **Expected Result**: Cross-tab sync Calendar↔Nutrition — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_206: Nutrition format locale vi-VN
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Nutrition format locale vi-VN
  3. Verify kết quả đúng như expected
- **Expected Result**: Nutrition format locale vi-VN — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_207: Nutrition format locale en-US
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Nutrition format locale en-US
  3. Verify kết quả đúng như expected
- **Expected Result**: Nutrition format locale en-US — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_208: Nutrition derived not stored
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Thiết lập điều kiện: Nutrition derived not stored
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: Nutrition derived not stored — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_NUT_209: Rapid meal changes consistent
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Rapid meal changes consistent
  3. Verify kết quả đúng như expected
- **Expected Result**: Rapid meal changes consistent — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_NUT_210: Mixed unit ingredients 1 dish
- **Pre-conditions**: NutritionSubTab active với plan có dishes
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Mixed unit ingredients 1 dish
  3. Verify kết quả đúng như expected
- **Expected Result**: Mixed unit ingredients 1 dish — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

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

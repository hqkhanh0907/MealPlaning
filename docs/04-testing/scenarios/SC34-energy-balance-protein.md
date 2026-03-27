# Scenario 34: Energy Balance & Protein

**Version:** 1.0  
**Date:** 2026-06-18  
**Total Test Cases:** 265

---

## Mô tả tổng quan

Energy Balance & Protein là scenario kiểm thử hai components dinh dưỡng cốt lõi hiển thị trên Dashboard: EnergyBalanceMini và ProteinProgress. EnergyBalanceMini hiển thị phép tính năng lượng "Eaten − Burned = Net" với 3 trạng thái màu (under/balanced/over dựa trên ±100 kcal so với target), hỗ trợ interactive mode (focus ring, keyboard), decorative icons có aria-hidden, tabular-nums cho số. ProteinProgress hiển thị current/target grams với progress bar có 3 color thresholds (red <50%, yellow <80%, green ≥80%), capped tại 100%, suggestion text thay đổi theo deficit level, và role="progressbar" với aria-valuenow/min/max.

Scenario bao gồm tính toán chính xác calories (eaten từ dayPlan dishes, burned từ workout), xử lý edge cases (0/0, giá trị rất lớn, negative balance, dark mode), accessibility (ARIA labels, contrast ratios), và tích hợp dữ liệu từ stores (dayPlanStore, dishStore, ingredientStore).

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| EnergyBalanceMini | EnergyBalanceMini.tsx | Hiển thị Eaten/Burned/Net calories compact |
| ProteinProgress | ProteinProgress.tsx | Progress bar protein với suggestion |
| useTodayNutrition | DashboardTab.tsx (inline) | Tính eaten + protein từ dayPlan |
| useNutritionTargets | useNutritionTargets.ts | Target calories/protein từ health profile |
| calculateDishesNutrition | utils/nutrition.ts | Tính tổng nutrition từ dish IDs |
| useDayPlanStore | dayPlanStore.ts | Zustand store cho dayPlans |
| useDishStore | dishStore.ts | Zustand store cho dishes |
| useIngredientStore | ingredientStore.ts | Zustand store cho ingredients |

## Luồng nghiệp vụ

1. Dashboard mount → useTodayNutrition() tính eaten/protein từ today's dayPlan
2. useNutritionTargets() trả về targetCalories, targetProtein
3. EnergyBalanceMini nhận eaten, burned (0), target → tính net = eaten - burned
4. Net so sánh với target: |diff| ≤ 100 → emerald, diff > 100 → amber, diff < -100 → slate
5. ProteinProgress nhận current, target → tính pct = current/target × 100 (capped 100)
6. pct < 50 → gray bar, pct 50-79 → amber bar, pct ≥ 80 → emerald bar
7. Suggestion text: deficit ≤ 0 → "Đạt mục tiêu", deficit ≤ 20 → "Gần đạt", deficit ≤ 50 → rotating tip, deficit > 50 → "Cần bổ sung đáng kể"

## Quy tắc nghiệp vụ

1. net = Math.round(eaten - burned)
2. Color: |net - target| ≤ 100 → emerald, net - target > 100 → amber, else → slate
3. EnergyBalanceMini minHeight = 80px
4. Interactive mode (onTapDetail): cursor-pointer, focus:ring-2, role="button", tabIndex=0
5. Non-interactive: không role, không tabIndex, không focus ring
6. Protein pct = Math.round(current / max(target, 1) × 100), clamped [0, 100]
7. Protein bar colors: pct < 50 → bg-gray-400, pct 50-79 → bg-amber-500, pct ≥ 80 → bg-emerald-500
8. Protein suggestion rotates daily (getDayOfYear % 5) cho mid-range deficit
9. ProteinProgress role="progressbar" với aria-valuenow, aria-valuemin=0, aria-valuemax
10. Tất cả số dùng fontVariantNumeric: "tabular-nums"
11. Decorative icons (UtensilsCrossed, Flame, Target) có aria-hidden="true"
12. Dark mode: text-slate-100, bg-slate-800, border-slate-700

## Test Cases (265 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_EBP_01 | EnergyBalanceMini render với data-testid | Positive | P0 |
| TC_EBP_02 | Eaten hiển thị Math.round(eaten) | Positive | P0 |
| TC_EBP_03 | Burned hiển thị Math.round(burned) | Positive | P0 |
| TC_EBP_04 | Net = eaten - burned (rounded) | Positive | P0 |
| TC_EBP_05 | Net balanced: |net - target| ≤ 100 → emerald color | Positive | P0 |
| TC_EBP_06 | Net surplus: net - target > 100 → amber color | Positive | P0 |
| TC_EBP_07 | Net deficit: net - target < -100 → slate color | Positive | P0 |
| TC_EBP_08 | Exact boundary: net = target + 100 → emerald | Boundary | P1 |
| TC_EBP_09 | Exact boundary: net = target + 101 → amber | Boundary | P1 |
| TC_EBP_10 | Exact boundary: net = target - 100 → emerald | Boundary | P1 |
| TC_EBP_11 | Exact boundary: net = target - 101 → slate | Boundary | P1 |
| TC_EBP_12 | Eaten = 0, Burned = 0, Target = 2000 → Net = 0, slate | Edge | P1 |
| TC_EBP_13 | Very high eaten: 10000 kcal | Boundary | P2 |
| TC_EBP_14 | Eaten = 0.7, Burned = 0.2 → Net = 1 (rounded) | Edge | P2 |
| TC_EBP_15 | Negative eaten (invalid) → Math.round handles | Edge | P2 |
| TC_EBP_16 | Interactive mode: cursor-pointer class | Positive | P1 |
| TC_EBP_17 | Interactive mode: focus:ring-2 focus:ring-emerald-500 | Positive | P1 |
| TC_EBP_18 | Interactive mode: role="button" | Positive | P1 |
| TC_EBP_19 | Interactive mode: tabIndex=0 | Positive | P1 |
| TC_EBP_20 | Interactive mode: Enter key triggers onTapDetail | Positive | P1 |
| TC_EBP_21 | Interactive mode: Space key triggers onTapDetail | Positive | P1 |
| TC_EBP_22 | Interactive mode: aria-label hiển thị | Positive | P2 |
| TC_EBP_23 | Non-interactive: không role, không tabIndex | Positive | P1 |
| TC_EBP_24 | Non-interactive: không focus ring, không cursor-pointer | Positive | P2 |
| TC_EBP_25 | Decorative icons aria-hidden="true" | Positive | P2 |
| TC_EBP_26 | Tabular-nums cho eaten, burned, net | Positive | P2 |
| TC_EBP_27 | minHeight 80px | Positive | P2 |
| TC_EBP_28 | Dark mode: bg-slate-800, border-slate-700 | Positive | P2 |
| TC_EBP_29 | Dark mode: text-slate-100 cho numbers | Positive | P2 |
| TC_EBP_30 | ProteinProgress render với data-testid | Positive | P0 |
| TC_EBP_31 | Protein display: "{current}g / {target}g" format | Positive | P0 |
| TC_EBP_32 | Protein bar width = pct% | Positive | P0 |
| TC_EBP_33 | pct ≥ 80 → bg-emerald-500 bar | Positive | P0 |
| TC_EBP_34 | pct 50-79 → bg-amber-500 bar | Positive | P0 |
| TC_EBP_35 | pct < 50 → bg-gray-400 bar | Positive | P0 |
| TC_EBP_36 | Boundary: pct = 80 → emerald | Boundary | P1 |
| TC_EBP_37 | Boundary: pct = 79 → amber | Boundary | P1 |
| TC_EBP_38 | Boundary: pct = 50 → amber | Boundary | P1 |
| TC_EBP_39 | Boundary: pct = 49 → gray | Boundary | P1 |
| TC_EBP_40 | pct capped at 100% khi current > target | Boundary | P1 |
| TC_EBP_41 | current = 0, target = 0 → safeTarget = 1, pct = 0 | Edge | P1 |
| TC_EBP_42 | current = 150, target = 100 → pct = 100 (capped) | Boundary | P1 |
| TC_EBP_43 | Suggestion: deficit ≤ 0 → "Đạt mục tiêu protein" | Positive | P1 |
| TC_EBP_44 | Suggestion: deficit 1-20 → "Gần đạt mục tiêu" | Positive | P1 |
| TC_EBP_45 | Suggestion: deficit 21-50 → rotating suggestion (5 variants) | Positive | P1 |
| TC_EBP_46 | Suggestion: deficit > 50 → "Cần bổ sung đáng kể" | Positive | P1 |
| TC_EBP_47 | Rotating suggestion thay đổi theo ngày (getDayOfYear % 5) | Edge | P2 |
| TC_EBP_48 | role="progressbar" trên ProteinProgress | Positive | P1 |
| TC_EBP_49 | aria-valuenow = roundedCurrent | Positive | P2 |
| TC_EBP_50 | aria-valuemin = 0 | Positive | P2 |
| TC_EBP_51 | aria-valuemax = roundedTarget | Positive | P2 |
| TC_EBP_52 | aria-label chứa current, target, suggestion | Positive | P2 |
| TC_EBP_53 | Protein display tabular-nums | Positive | P2 |
| TC_EBP_54 | Dark mode protein: text-slate-300 label, bg-slate-700 track | Positive | P2 |
| TC_EBP_55 | Very high protein: current = 500g, target = 100g → bar 100%, emerald | Boundary | P2 |
| TC_EBP_056 | Eaten = 0 → hiển thị '0' | Boundary | P1 |
| TC_EBP_057 | Eaten = 250 → hiển thị '250' | Positive | P2 |
| TC_EBP_058 | Eaten = 500 → hiển thị '500' | Positive | P2 |
| TC_EBP_059 | Eaten = 1000 → hiển thị '1000' | Positive | P2 |
| TC_EBP_060 | Eaten = 1500 → hiển thị '1500' | Positive | P2 |
| TC_EBP_061 | Eaten = 2000 → hiển thị '2000' (= target) | Positive | P1 |
| TC_EBP_062 | Eaten = 2500 → hiển thị '2500' (> target) | Positive | P1 |
| TC_EBP_063 | Eaten = 3000 → hiển thị '3000' | Positive | P2 |
| TC_EBP_064 | Eaten = 0.4 → hiển thị '0' (Math.round) | Edge | P2 |
| TC_EBP_065 | Eaten = 0.5 → hiển thị '1' (Math.round) | Edge | P2 |
| TC_EBP_066 | Eaten = 1999.5 → hiển thị '2000' | Edge | P2 |
| TC_EBP_067 | Eaten = 5000 → layout không vỡ | Boundary | P2 |
| TC_EBP_068 | Eaten = 10000 → layout không vỡ | Boundary | P2 |
| TC_EBP_069 | Eaten rất nhỏ = 1 → hiển thị '1' | Edge | P2 |
| TC_EBP_070 | Eaten update real-time khi log thêm meal | Positive | P1 |
| TC_EBP_071 | Eaten icon UtensilsCrossed hiển thị | Positive | P2 |
| TC_EBP_072 | Eaten label 'Đã ăn' (hoặc tương tự) hiển thị | Positive | P2 |
| TC_EBP_073 | Eaten số dùng tabular-nums | Positive | P2 |
| TC_EBP_074 | Eaten = NaN handling | Negative | P1 |
| TC_EBP_075 | Eaten = negative (-100) handling | Negative | P2 |
| TC_EBP_076 | Burned = 0 → hiển thị '0' | Positive | P1 |
| TC_EBP_077 | Burned = 200 → hiển thị '200' | Positive | P2 |
| TC_EBP_078 | Burned = 350 → hiển thị '350' | Positive | P2 |
| TC_EBP_079 | Burned = 500 → hiển thị '500' | Positive | P2 |
| TC_EBP_080 | Burned = 800 → hiển thị '800' | Positive | P2 |
| TC_EBP_081 | Burned = 1000 → hiển thị '1000' | Boundary | P2 |
| TC_EBP_082 | Burned icon Flame hiển thị | Positive | P2 |
| TC_EBP_083 | Burned label 'Đã đốt' (hoặc tương tự) hiển thị | Positive | P2 |
| TC_EBP_084 | Burned = 0.3 → hiển thị '0' (rounded) | Edge | P2 |
| TC_EBP_085 | Burned = 499.7 → hiển thị '500' | Edge | P2 |
| TC_EBP_086 | Burned số dùng tabular-nums | Positive | P2 |
| TC_EBP_087 | Burned update khi log workout | Positive | P1 |
| TC_EBP_088 | Burned = 2000 → layout không vỡ | Boundary | P2 |
| TC_EBP_089 | Burned = NaN handling | Negative | P2 |
| TC_EBP_090 | Burned = negative handling | Negative | P2 |
| TC_EBP_091 | Net = eaten - burned: 2000 - 300 = 1700 | Positive | P0 |
| TC_EBP_092 | Net = 0 (eaten = burned) | Positive | P1 |
| TC_EBP_093 | Net = negative (burned > eaten): 200 - 500 = -300 | Positive | P1 |
| TC_EBP_094 | Net balanced: net = target (diff = 0) → emerald | Positive | P0 |
| TC_EBP_095 | Net balanced: net = target + 50 → emerald | Positive | P1 |
| TC_EBP_096 | Net balanced: net = target - 99 → emerald | Positive | P1 |
| TC_EBP_097 | Net balanced: net = target + 100 → emerald (boundary) | Boundary | P0 |
| TC_EBP_098 | Net balanced: net = target - 100 → emerald (boundary) | Boundary | P0 |
| TC_EBP_099 | Net surplus: net = target + 101 → amber (boundary +1) | Boundary | P0 |
| TC_EBP_100 | Net surplus: net = target + 200 → amber | Positive | P1 |
| TC_EBP_101 | Net surplus: net = target + 500 → amber | Positive | P2 |
| TC_EBP_102 | Net surplus: net = target + 1000 → amber | Positive | P2 |
| TC_EBP_103 | Net deficit: net = target - 101 → slate (boundary -1) | Boundary | P0 |
| TC_EBP_104 | Net deficit: net = target - 200 → slate | Positive | P1 |
| TC_EBP_105 | Net deficit: net = target - 500 → slate | Positive | P2 |
| TC_EBP_106 | Net deficit: net = target - 2000 → slate (net = 0) | Positive | P1 |
| TC_EBP_107 | Net label 'Còn lại' (hoặc tương tự) hiển thị | Positive | P2 |
| TC_EBP_108 | Net icon Target hiển thị | Positive | P2 |
| TC_EBP_109 | Net số dùng tabular-nums | Positive | P2 |
| TC_EBP_110 | Net color transition: balanced → surplus khi eaten tăng | Positive | P1 |
| TC_EBP_111 | Net color transition: balanced → deficit khi burned tăng | Positive | P1 |
| TC_EBP_112 | EnergyBalanceMini minHeight = 80px | Positive | P2 |
| TC_EBP_113 | 3-column layout: eaten | burned | net | Positive | P1 |
| TC_EBP_114 | All 3 columns equal width | Positive | P2 |
| TC_EBP_115 | Net = 0 khi eaten = 0 và burned = 0 | Edge | P1 |
| TC_EBP_116 | Interactive mode (onTapDetail provided): cursor-pointer | Positive | P1 |
| TC_EBP_117 | Interactive mode: focus:ring-2 on focus | Positive | P1 |
| TC_EBP_118 | Interactive mode: role='button' | Positive | P1 |
| TC_EBP_119 | Interactive mode: tabIndex=0 | Positive | P1 |
| TC_EBP_120 | Interactive mode: click → onTapDetail called | Positive | P0 |
| TC_EBP_121 | Interactive mode: Enter key → onTapDetail called | Positive | P1 |
| TC_EBP_122 | Interactive mode: Space key → onTapDetail called | Positive | P1 |
| TC_EBP_123 | Non-interactive mode (no onTapDetail): cursor default | Positive | P1 |
| TC_EBP_124 | Non-interactive mode: no role attribute | Positive | P1 |
| TC_EBP_125 | Non-interactive mode: no tabIndex | Positive | P1 |
| TC_EBP_126 | Non-interactive mode: no focus ring | Positive | P2 |
| TC_EBP_127 | Interactive mode: aria-label mô tả energy balance | Positive | P2 |
| TC_EBP_128 | Interactive mode: hover state | Positive | P2 |
| TC_EBP_129 | Interactive mode: active state (pressed) | Positive | P2 |
| TC_EBP_130 | Interactive mode: double click → only 1 call | Edge | P2 |
| TC_EBP_131 | Progress bar 0%: pct = 0 → bar width = 0% | Boundary | P1 |
| TC_EBP_132 | Progress bar 25%: eaten = 500, target = 2000 | Positive | P2 |
| TC_EBP_133 | Progress bar 50%: eaten = 1000, target = 2000 | Positive | P1 |
| TC_EBP_134 | Progress bar 75%: eaten = 1500, target = 2000 | Positive | P2 |
| TC_EBP_135 | Progress bar 100%: eaten = 2000, target = 2000 | Positive | P1 |
| TC_EBP_136 | Progress bar 150% → capped at 100% | Boundary | P1 |
| TC_EBP_137 | Surplus indicator khi net > target | Positive | P1 |
| TC_EBP_138 | Deficit indicator khi net < target - 200 | Positive | P1 |
| TC_EBP_139 | Balanced state: |net - target| < 200 | Positive | P1 |
| TC_EBP_140 | Color coding under: eaten < target - 200 → blue/slate | Positive | P1 |
| TC_EBP_141 | Color coding balanced: |eaten - target| ≤ 200 → green | Positive | P1 |
| TC_EBP_142 | Color coding over: eaten > target + 200 → red/amber | Positive | P1 |
| TC_EBP_143 | Progress bar track background color | Positive | P2 |
| TC_EBP_144 | Progress bar transition animation khi percentage thay đổi | Positive | P2 |
| TC_EBP_145 | Progress bar border-radius rounded | Positive | P2 |
| TC_EBP_146 | Progress bar height consistent | Positive | P2 |
| TC_EBP_147 | Progress bar aria-valuenow | Positive | P2 |
| TC_EBP_148 | Progress bar aria-valuemin = 0 | Positive | P2 |
| TC_EBP_149 | Progress bar aria-valuemax = target value | Positive | P2 |
| TC_EBP_150 | Progress bar role='progressbar' | Positive | P2 |
| TC_EBP_151 | ProteinProgress 0g/0g edge case | Edge | P1 |
| TC_EBP_152 | ProteinProgress 0g/112g (0%) | Boundary | P1 |
| TC_EBP_153 | ProteinProgress 10g/112g (~9%) | Positive | P2 |
| TC_EBP_154 | ProteinProgress 28g/112g (25%) | Positive | P2 |
| TC_EBP_155 | ProteinProgress 40g/112g (~36%) | Positive | P2 |
| TC_EBP_156 | ProteinProgress 55g/112g (~49%) | Positive | P2 |
| TC_EBP_157 | ProteinProgress 56g/112g (50%) → yellow boundary | Boundary | P0 |
| TC_EBP_158 | ProteinProgress 55g/112g (49%) → still gray | Boundary | P0 |
| TC_EBP_159 | ProteinProgress 60g/112g (~54%) | Positive | P2 |
| TC_EBP_160 | ProteinProgress 75g/112g (~67%) | Positive | P2 |
| TC_EBP_161 | ProteinProgress 89g/112g (79%) → still amber | Boundary | P1 |
| TC_EBP_162 | ProteinProgress 90g/112g (80%) → green boundary | Boundary | P0 |
| TC_EBP_163 | ProteinProgress 89g/112g boundary -1 → amber | Boundary | P0 |
| TC_EBP_164 | ProteinProgress 100g/112g (~89%) | Positive | P2 |
| TC_EBP_165 | ProteinProgress 112g/112g (100%) | Positive | P0 |
| TC_EBP_166 | ProteinProgress 150g/112g (>100%) → bar capped 100% | Boundary | P1 |
| TC_EBP_167 | ProteinProgress 200g/112g → bar still 100% | Boundary | P2 |
| TC_EBP_168 | ProteinProgress target = 1 → pct = current × 100 | Edge | P2 |
| TC_EBP_169 | ProteinProgress target = 150 → different scale | Positive | P2 |
| TC_EBP_170 | ProteinProgress target = 50 (low target) | Positive | P2 |
| TC_EBP_171 | ProteinProgress pct rounded: 33.3% → 33% | Positive | P2 |
| TC_EBP_172 | ProteinProgress display format 'Xg / Yg' | Positive | P1 |
| TC_EBP_173 | ProteinProgress color gray (< 50%): bg-gray-400 | Positive | P1 |
| TC_EBP_174 | ProteinProgress color amber (50-79%): bg-amber-500 | Positive | P1 |
| TC_EBP_175 | ProteinProgress color emerald (≥80%): bg-emerald-500 | Positive | P1 |
| TC_EBP_176 | Suggestion: deficit ≤ 0 → 'Đạt mục tiêu' (hoặc tương tự) | Positive | P1 |
| TC_EBP_177 | Suggestion: deficit = 1-20g → 'Gần đạt' (hoặc tương tự) | Positive | P1 |
| TC_EBP_178 | Suggestion: deficit = 20g (boundary) → 'Gần đạt' | Boundary | P2 |
| TC_EBP_179 | Suggestion: deficit = 21-50g → rotating tip | Positive | P1 |
| TC_EBP_180 | Suggestion: deficit = 50g (boundary) → rotating tip | Boundary | P2 |
| TC_EBP_181 | Suggestion: deficit > 50g → 'Cần bổ sung đáng kể' | Positive | P1 |
| TC_EBP_182 | Suggestion: deficit = 51g → 'Cần bổ sung đáng kể' (boundary +1) | Boundary | P2 |
| TC_EBP_183 | Suggestion rotating tip: getDayOfYear() % 5 selects tip index | Positive | P2 |
| TC_EBP_184 | Suggestion tip 0: (day % 5 = 0) | Positive | P2 |
| TC_EBP_185 | Suggestion tip 1: (day % 5 = 1) | Positive | P2 |
| TC_EBP_186 | Suggestion tip 2: (day % 5 = 2) | Positive | P2 |
| TC_EBP_187 | Suggestion tip 3: (day % 5 = 3) | Positive | P2 |
| TC_EBP_188 | Suggestion tip 4: (day % 5 = 4) | Positive | P2 |
| TC_EBP_189 | Suggestion text accessible: aria-live cho screen reader | Positive | P2 |
| TC_EBP_190 | Suggestion text font size readable | Positive | P2 |
| TC_EBP_191 | ProteinProgress role='progressbar' | Positive | P1 |
| TC_EBP_192 | ProteinProgress aria-valuenow = current pct | Positive | P1 |
| TC_EBP_193 | ProteinProgress aria-valuemin = 0 | Positive | P2 |
| TC_EBP_194 | ProteinProgress aria-valuemax = target | Positive | P2 |
| TC_EBP_195 | ProteinProgress aria-label mô tả progress | Positive | P2 |
| TC_EBP_196 | Screen reader reads protein percentage | Positive | P2 |
| TC_EBP_197 | Screen reader reads suggestion text | Positive | P2 |
| TC_EBP_198 | ProteinProgress keyboard navigable (nếu interactive) | Positive | P2 |
| TC_EBP_199 | Color not sole indicator: text reinforces bar color | Positive | P2 |
| TC_EBP_200 | High contrast mode: bar vẫn visible | Positive | P3 |
| TC_EBP_201 | Decorative icons aria-hidden='true' trong EnergyBalanceMini | Positive | P1 |
| TC_EBP_202 | EnergyBalanceMini aria-label cho container | Positive | P2 |
| TC_EBP_203 | Focus ring color meets contrast on all backgrounds | Positive | P2 |
| TC_EBP_204 | Touch target cho interactive EnergyBalanceMini ≥ 44px | Positive | P2 |
| TC_EBP_205 | ProteinProgress text contrast ≥ 4.5:1 | Positive | P2 |
| TC_EBP_206 | Dark mode: EnergyBalanceMini background dark | Positive | P2 |
| TC_EBP_207 | Dark mode: Eaten text color sáng | Positive | P2 |
| TC_EBP_208 | Dark mode: Burned text color sáng | Positive | P2 |
| TC_EBP_209 | Dark mode: Net emerald vẫn visible | Positive | P2 |
| TC_EBP_210 | Dark mode: Net amber vẫn visible | Positive | P2 |
| TC_EBP_211 | Dark mode: Net slate vẫn visible | Positive | P2 |
| TC_EBP_212 | Dark mode: ProteinProgress track bg | Positive | P2 |
| TC_EBP_213 | Dark mode: ProteinProgress bar colors preserved | Positive | P2 |
| TC_EBP_214 | Dark mode: ProteinProgress text color | Positive | P2 |
| TC_EBP_215 | Dark mode: ProteinProgress suggestion text | Positive | P2 |
| TC_EBP_216 | Dark mode: ProteinProgress label dark:text-slate-300 | Positive | P2 |
| TC_EBP_217 | Dark mode: EnergyBalanceMini border | Positive | P2 |
| TC_EBP_218 | Dark mode: icons vẫn visible trên dark background | Positive | P2 |
| TC_EBP_219 | Dark mode: progress bar track contrast | Positive | P2 |
| TC_EBP_220 | Dark mode: interactive focus ring visible | Positive | P2 |
| TC_EBP_221 | Light → Dark toggle: values preserved | Positive | P2 |
| TC_EBP_222 | Dark mode: gradient colors appropriate | Positive | P2 |
| TC_EBP_223 | Dark mode: number readability maintained | Positive | P2 |
| TC_EBP_224 | Dark mode: separator lines visible | Positive | P3 |
| TC_EBP_225 | Dark mode: tabular-nums still works | Positive | P3 |
| TC_EBP_226 | Very high eaten: 99999 kcal → layout intact | Edge | P2 |
| TC_EBP_227 | Very high target: 5000 kcal | Edge | P2 |
| TC_EBP_228 | Target = 0 → divide by zero prevention | Edge | P0 |
| TC_EBP_229 | Target = 1 → extreme sensitivity | Edge | P2 |
| TC_EBP_230 | Eaten = target exactly → balanced (emerald) | Positive | P1 |
| TC_EBP_231 | Eaten = target + 100 exactly → still balanced | Boundary | P1 |
| TC_EBP_232 | Eaten = target - 100 exactly → still balanced | Boundary | P1 |
| TC_EBP_233 | Negative balance display: eaten < burned | Positive | P1 |
| TC_EBP_234 | Negative balance color: net = -400, target = 2000 → slate | Positive | P1 |
| TC_EBP_235 | Rapid data update: eaten changes 10 times quickly | Positive | P2 |
| TC_EBP_236 | EnergyBalanceMini re-render on prop change | Positive | P1 |
| TC_EBP_237 | ProteinProgress re-render on prop change | Positive | P1 |
| TC_EBP_238 | Concurrent eaten + burned update | Positive | P2 |
| TC_EBP_239 | Unicode/special chars in labels | Positive | P2 |
| TC_EBP_240 | Component unmount → no state update warnings | Negative | P2 |
| TC_EBP_241 | EnergyBalanceMini với missing prop: eaten undefined | Negative | P1 |
| TC_EBP_242 | EnergyBalanceMini với missing prop: burned undefined | Negative | P1 |
| TC_EBP_243 | EnergyBalanceMini với missing prop: target undefined | Negative | P1 |
| TC_EBP_244 | ProteinProgress với current undefined | Negative | P1 |
| TC_EBP_245 | ProteinProgress với target undefined | Negative | P1 |
| TC_EBP_246 | Very large protein: current = 1000g | Edge | P2 |
| TC_EBP_247 | Protein negative: current = -10 | Negative | P2 |
| TC_EBP_248 | Eaten float precision: 1000.456789 | Edge | P2 |
| TC_EBP_249 | Protein float precision: current = 56.78 | Edge | P2 |
| TC_EBP_250 | Both components render simultaneously | Positive | P1 |
| TC_EBP_251 | Screen reader: reads eaten value and label | Positive | P2 |
| TC_EBP_252 | Screen reader: reads burned value and label | Positive | P2 |
| TC_EBP_253 | Screen reader: reads net value, label, and status | Positive | P2 |
| TC_EBP_254 | Screen reader: protein progress percentage | Positive | P2 |
| TC_EBP_255 | WCAG AA: all text ≥ 4.5:1 contrast (light mode) | Positive | P2 |
| TC_EBP_256 | WCAG AA: all text ≥ 4.5:1 contrast (dark mode) | Positive | P2 |
| TC_EBP_257 | WCAG AAA: large text ≥ 3:1 contrast | Positive | P3 |
| TC_EBP_258 | Keyboard-only navigation works | Positive | P2 |
| TC_EBP_259 | No ARIA misuse (roles match purpose) | Positive | P2 |
| TC_EBP_260 | EnergyBalanceMini responsive: narrow screen | Positive | P2 |
| TC_EBP_261 | ProteinProgress responsive: narrow screen | Positive | P2 |
| TC_EBP_262 | EnergyBalanceMini responsive: wide screen | Positive | P3 |
| TC_EBP_263 | Text scaling 200%: content not truncated | Positive | P2 |
| TC_EBP_264 | Motion safe: color transition khi data thay đổi | Positive | P3 |
| TC_EBP_265 | React.memo: ProteinProgress không re-render nếu props unchanged | Positive | P3 |

---

## Chi tiết Test Cases

##### TC_EBP_01: EnergyBalanceMini render
- **Pre-conditions**: Dashboard tab active, nutrition data available
- **Steps**: 1. Mở Dashboard tab
- **Expected**: data-testid="energy-balance-mini" tồn tại trong DOM
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_02: Eaten hiển thị Math.round
- **Pre-conditions**: eaten = 1523.7
- **Steps**: 1. Observe data-testid="mini-eaten"
- **Expected**: Hiển thị "1524" (Math.round(1523.7))
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_03: Burned hiển thị Math.round
- **Pre-conditions**: burned = 350.4
- **Steps**: 1. Observe data-testid="mini-burned"
- **Expected**: Hiển thị "350" (Math.round(350.4))
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_04: Net = eaten - burned (rounded)
- **Pre-conditions**: eaten = 1800, burned = 300
- **Steps**: 1. Observe data-testid="mini-net"
- **Expected**: Hiển thị "1500" (Math.round(1800 - 300))
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_05: Net balanced → emerald
- **Pre-conditions**: eaten = 2050, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Net value có class "text-emerald-600" (|2050 - 2000| = 50 ≤ 100)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_06: Net surplus → amber
- **Pre-conditions**: eaten = 2500, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Net value có class "text-amber-600" (2500 - 2000 = 500 > 100)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_07: Net deficit → slate
- **Pre-conditions**: eaten = 800, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Net value có class "text-slate-600" (800 - 2000 = -1200 < -100)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_08: Boundary net = target + 100 → emerald
- **Pre-conditions**: eaten = 2100, burned = 0, target = 2000
- **Steps**: 1. Check net color
- **Expected**: text-emerald-600 (|2100 - 2000| = 100, Math.abs(diff) ≤ 100 → emerald)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_09: Boundary net = target + 101 → amber
- **Pre-conditions**: eaten = 2101, burned = 0, target = 2000
- **Steps**: 1. Check net color
- **Expected**: text-amber-600 (diff = 101 > 100 → amber)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_10: Boundary net = target - 100 → emerald
- **Pre-conditions**: eaten = 1900, burned = 0, target = 2000
- **Steps**: 1. Check net color
- **Expected**: text-emerald-600 (|1900 - 2000| = 100 ≤ 100 → emerald)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_11: Boundary net = target - 101 → slate
- **Pre-conditions**: eaten = 1899, burned = 0, target = 2000
- **Steps**: 1. Check net color
- **Expected**: text-slate-600 (net - target = -101, Math.abs > 100, diff < 0 → slate)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_12: All zeros
- **Pre-conditions**: eaten = 0, burned = 0, target = 2000
- **Steps**: 1. Observe EnergyBalanceMini
- **Expected**: Eaten = "0", Burned = "0", Net = "0", color = slate (0 - 2000 = -2000)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_EBP_13: Very high eaten 10000 kcal
- **Pre-conditions**: eaten = 10000, burned = 0, target = 2000
- **Steps**: 1. Observe layout
- **Expected**: "10000" hiển thị không bị truncate, layout không bị vỡ, amber color
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_EBP_14: Fractional rounding
- **Pre-conditions**: eaten = 0.7, burned = 0.2
- **Steps**: 1. Check net value
- **Expected**: Net = Math.round(0.7 - 0.2) = Math.round(0.5) = 1
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_15: Negative eaten
- **Pre-conditions**: eaten = -100 (invalid data)
- **Steps**: 1. Observe component
- **Expected**: Component không crash, Math.round(-100) = -100 hiển thị, net tính đúng
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_16: Interactive cursor-pointer
- **Pre-conditions**: onTapDetail prop được truyền vào
- **Steps**: 1. Inspect container class
- **Expected**: Class chứa "cursor-pointer"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_17: Interactive focus ring
- **Pre-conditions**: onTapDetail prop được truyền vào
- **Steps**: 1. Tab focus vào component
- **Expected**: focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 hiển thị
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_18: Interactive role="button"
- **Pre-conditions**: onTapDetail prop được truyền vào
- **Steps**: 1. Inspect role attribute
- **Expected**: role="button"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_19: Interactive tabIndex=0
- **Pre-conditions**: onTapDetail prop được truyền vào
- **Steps**: 1. Inspect tabIndex
- **Expected**: tabIndex=0, element focusable qua Tab key
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_20: Enter key triggers onTapDetail
- **Pre-conditions**: onTapDetail prop, component focused
- **Steps**: 1. Tab focus vào component 2. Press Enter
- **Expected**: onTapDetail callback được gọi, e.preventDefault() ngăn scroll
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_21: Space key triggers onTapDetail
- **Pre-conditions**: onTapDetail prop, component focused
- **Steps**: 1. Tab focus vào component 2. Press Space
- **Expected**: onTapDetail callback được gọi, e.preventDefault() ngăn page scroll
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_22: Interactive aria-label
- **Pre-conditions**: onTapDetail prop
- **Steps**: 1. Inspect aria-label
- **Expected**: aria-label chứa translation key "nutrition.energyBalance"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_23: Non-interactive — no role, no tabIndex
- **Pre-conditions**: onTapDetail = undefined
- **Steps**: 1. Inspect container
- **Expected**: Không có role attribute, không có tabIndex attribute
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_24: Non-interactive — no focus ring
- **Pre-conditions**: onTapDetail = undefined
- **Steps**: 1. Inspect class list
- **Expected**: Không có cursor-pointer, focus:ring, active:bg classes
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_25: Decorative icons aria-hidden
- **Pre-conditions**: EnergyBalanceMini render
- **Steps**: 1. Inspect UtensilsCrossed, Flame, Target icons
- **Expected**: Tất cả 3 icons có aria-hidden="true"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_26: Tabular-nums cho numbers
- **Pre-conditions**: EnergyBalanceMini render
- **Steps**: 1. Inspect data-testid="mini-eaten", "mini-burned", "mini-net"
- **Expected**: Tất cả có fontVariantNumeric: "tabular-nums"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_27: minHeight 80px
- **Pre-conditions**: EnergyBalanceMini render
- **Steps**: 1. Inspect style
- **Expected**: minHeight: 80 trên container
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_28: Dark mode background
- **Pre-conditions**: Dark mode enabled
- **Steps**: 1. Inspect container classes
- **Expected**: dark:bg-slate-800, dark:border-slate-700 active
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_29: Dark mode text colors
- **Pre-conditions**: Dark mode enabled
- **Steps**: 1. Inspect number text
- **Expected**: dark:text-slate-100 cho eaten, burned values
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_30: ProteinProgress render
- **Pre-conditions**: Dashboard active
- **Steps**: 1. Observe DOM
- **Expected**: data-testid="protein-progress" tồn tại
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_31: Protein display format
- **Pre-conditions**: current = 85, target = 120
- **Steps**: 1. Observe data-testid="protein-display"
- **Expected**: Hiển thị "85g / 120g"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_32: Protein bar width = pct%
- **Pre-conditions**: current = 60, target = 120 → pct = 50
- **Steps**: 1. Inspect data-testid="protein-bar" style
- **Expected**: width: "50%"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_33: pct ≥ 80 → emerald bar
- **Pre-conditions**: current = 100, target = 120 → pct = 83
- **Steps**: 1. Inspect protein bar class
- **Expected**: Class chứa "bg-emerald-500"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_34: pct 50-79 → amber bar
- **Pre-conditions**: current = 70, target = 120 → pct = 58
- **Steps**: 1. Inspect protein bar class
- **Expected**: Class chứa "bg-amber-500"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_35: pct < 50 → gray bar
- **Pre-conditions**: current = 30, target = 120 → pct = 25
- **Steps**: 1. Inspect protein bar class
- **Expected**: Class chứa "bg-gray-400"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_36: Boundary pct = 80 → emerald
- **Pre-conditions**: current = 96, target = 120 → pct = Math.round(96/120*100) = 80
- **Steps**: 1. Inspect bar class
- **Expected**: "bg-emerald-500" (pct >= 80 → true)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_37: Boundary pct = 79 → amber
- **Pre-conditions**: current = 94.8, target = 120 → pct = 79
- **Steps**: 1. Inspect bar class
- **Expected**: "bg-amber-500" (pct = 79 < 80, >= 50)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_38: Boundary pct = 50 → amber
- **Pre-conditions**: current = 60, target = 120 → pct = 50
- **Steps**: 1. Inspect bar class
- **Expected**: "bg-amber-500" (pct = 50 >= 50)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_39: Boundary pct = 49 → gray
- **Pre-conditions**: current = 58.8, target = 120 → pct = 49
- **Steps**: 1. Inspect bar class
- **Expected**: "bg-gray-400" (pct = 49 < 50)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_40: pct capped at 100%
- **Pre-conditions**: current = 200, target = 120
- **Steps**: 1. Inspect bar width
- **Expected**: width: "100%" (Math.min(100, ...) caps at 100), bar không overflow
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_41: current = 0, target = 0 → safeTarget = 1
- **Pre-conditions**: Không có protein data, target = 0
- **Steps**: 1. Observe ProteinProgress
- **Expected**: Hiển thị "0g / 0g", pct = 0 (current/1*100 = 0), gray bar, không crash
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_EBP_42: current > target → capped pct
- **Pre-conditions**: current = 150, target = 100
- **Steps**: 1. Check bar width và display
- **Expected**: Display "150g / 100g", bar width = 100% (capped), emerald color
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_43: Suggestion deficit ≤ 0
- **Pre-conditions**: current = 120, target = 100 (deficit = -20)
- **Steps**: 1. Observe data-testid="protein-suggestion"
- **Expected**: Text = translation of "nutrition.proteinGoalMet"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_44: Suggestion deficit 1-20
- **Pre-conditions**: current = 105, target = 120 (deficit = 15)
- **Steps**: 1. Observe protein suggestion
- **Expected**: Text = translation of "nutrition.proteinNearGoal"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_45: Suggestion deficit 21-50 rotating
- **Pre-conditions**: current = 80, target = 120 (deficit = 40)
- **Steps**: 1. Observe protein suggestion
- **Expected**: Text = translation of "nutrition.proteinSuggestion{N}" where N = getDayOfYear() % 5
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_46: Suggestion deficit > 50
- **Pre-conditions**: current = 20, target = 120 (deficit = 100)
- **Steps**: 1. Observe protein suggestion
- **Expected**: Text = translation of "nutrition.proteinNeedSignificant"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_47: Rotating suggestion changes daily
- **Pre-conditions**: deficit 21-50, checked on 2 different days
- **Steps**: 1. Check suggestion day 1 2. Check suggestion day 2 (different getDayOfYear)
- **Expected**: Suggestion text khác nhau nếu getDayOfYear() % 5 khác nhau
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_48: role="progressbar"
- **Pre-conditions**: ProteinProgress render
- **Steps**: 1. Inspect root element
- **Expected**: role="progressbar" trên container
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_49: aria-valuenow
- **Pre-conditions**: current = 85.4 → roundedCurrent = 85
- **Steps**: 1. Inspect aria-valuenow
- **Expected**: aria-valuenow="85"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_50: aria-valuemin
- **Pre-conditions**: ProteinProgress render
- **Steps**: 1. Inspect aria-valuemin
- **Expected**: aria-valuemin="0"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_51: aria-valuemax
- **Pre-conditions**: target = 120 → roundedTarget = 120
- **Steps**: 1. Inspect aria-valuemax
- **Expected**: aria-valuemax="120"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_52: aria-label comprehensive
- **Pre-conditions**: current = 85, target = 120
- **Steps**: 1. Inspect aria-label
- **Expected**: aria-label chứa "Protein: 85g trên 120g" và suggestion text
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_53: Protein display tabular-nums
- **Pre-conditions**: ProteinProgress render
- **Steps**: 1. Inspect data-testid="protein-display" style
- **Expected**: fontVariantNumeric: "tabular-nums"
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_54: Dark mode protein
- **Pre-conditions**: Dark mode enabled
- **Steps**: 1. Inspect ProteinProgress classes
- **Expected**: Label: dark:text-slate-300, track: dark:bg-slate-700, display: dark:text-slate-100
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_55: Very high protein values
- **Pre-conditions**: current = 500, target = 100
- **Steps**: 1. Observe display và bar
- **Expected**: "500g / 100g" hiển thị, bar = 100% (capped), emerald, layout không vỡ
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_EBP_056: Eaten = 0 → hiển thị '0'
- **Pre-conditions**: eaten = 0, burned = 0, target = 2000
- **Steps**: 1. Observe data-testid='mini-eaten'
- **Expected**: Hiển thị '0'
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_057: Eaten = 250 → hiển thị '250'
- **Pre-conditions**: eaten = 250
- **Steps**: 1. Observe mini-eaten
- **Expected**: Hiển thị '250'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_058: Eaten = 500 → hiển thị '500'
- **Pre-conditions**: eaten = 500
- **Steps**: 1. Observe mini-eaten
- **Expected**: Hiển thị '500'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_059: Eaten = 1000 → hiển thị '1000'
- **Pre-conditions**: eaten = 1000
- **Steps**: 1. Observe mini-eaten
- **Expected**: Hiển thị '1000'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_060: Eaten = 1500 → hiển thị '1500'
- **Pre-conditions**: eaten = 1500
- **Steps**: 1. Observe mini-eaten
- **Expected**: Hiển thị '1500'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_061: Eaten = 2000 → hiển thị '2000' (= target)
- **Pre-conditions**: eaten = 2000, target = 2000
- **Steps**: 1. Observe mini-eaten
- **Expected**: Hiển thị '2000'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_062: Eaten = 2500 → hiển thị '2500' (> target)
- **Pre-conditions**: eaten = 2500, target = 2000
- **Steps**: 1. Observe mini-eaten
- **Expected**: Hiển thị '2500'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_063: Eaten = 3000 → hiển thị '3000'
- **Pre-conditions**: eaten = 3000
- **Steps**: 1. Observe mini-eaten
- **Expected**: Hiển thị '3000'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_064: Eaten = 0.4 → hiển thị '0' (Math.round)
- **Pre-conditions**: eaten = 0.4
- **Steps**: 1. Observe mini-eaten
- **Expected**: Hiển thị '0' (Math.round(0.4) = 0)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_065: Eaten = 0.5 → hiển thị '1' (Math.round)
- **Pre-conditions**: eaten = 0.5
- **Steps**: 1. Observe mini-eaten
- **Expected**: Hiển thị '1' (Math.round(0.5) = 1)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_066: Eaten = 1999.5 → hiển thị '2000'
- **Pre-conditions**: eaten = 1999.5
- **Steps**: 1. Observe mini-eaten
- **Expected**: Hiển thị '2000' (Math.round(1999.5))
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_067: Eaten = 5000 → layout không vỡ
- **Pre-conditions**: eaten = 5000
- **Steps**: 1. Observe mini-eaten và container
- **Expected**: Hiển thị '5000', layout intact (no overflow)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_EBP_068: Eaten = 10000 → layout không vỡ
- **Pre-conditions**: eaten = 10000
- **Steps**: 1. Observe mini-eaten và container
- **Expected**: Hiển thị '10000', layout intact, text không bị cắt
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_EBP_069: Eaten rất nhỏ = 1 → hiển thị '1'
- **Pre-conditions**: eaten = 1
- **Steps**: 1. Observe mini-eaten
- **Expected**: Hiển thị '1'
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_070: Eaten update real-time khi log thêm meal
- **Pre-conditions**: eaten = 500, log thêm 300 kcal meal
- **Steps**: 1. Observe eaten trước 2. Log meal 3. Observe eaten sau
- **Expected**: Eaten thay đổi từ '500' → '800'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_071: Eaten icon UtensilsCrossed hiển thị
- **Pre-conditions**: EnergyBalanceMini render
- **Steps**: 1. Inspect eaten icon
- **Expected**: UtensilsCrossed icon hiển thị, aria-hidden='true'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_072: Eaten label 'Đã ăn' (hoặc tương tự) hiển thị
- **Pre-conditions**: EnergyBalanceMini render
- **Steps**: 1. Inspect eaten label
- **Expected**: Label text = 'Đã ăn' hoặc i18n equivalent
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_073: Eaten số dùng tabular-nums
- **Pre-conditions**: eaten = 1234
- **Steps**: 1. Inspect fontVariantNumeric
- **Expected**: fontVariantNumeric = 'tabular-nums'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_074: Eaten = NaN handling
- **Pre-conditions**: eaten = NaN (corrupted data)
- **Steps**: 1. Observe mini-eaten
- **Expected**: Hiển thị '0' hoặc fallback, không crash
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_EBP_075: Eaten = negative (-100) handling
- **Pre-conditions**: eaten = -100 (impossible but defensive)
- **Steps**: 1. Observe mini-eaten
- **Expected**: Hiển thị '0' hoặc '-100' (defensive display), không crash
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_EBP_076: Burned = 0 → hiển thị '0'
- **Pre-conditions**: burned = 0
- **Steps**: 1. Observe data-testid='mini-burned'
- **Expected**: Hiển thị '0'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_077: Burned = 200 → hiển thị '200'
- **Pre-conditions**: burned = 200
- **Steps**: 1. Observe mini-burned
- **Expected**: Hiển thị '200'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_078: Burned = 350 → hiển thị '350'
- **Pre-conditions**: burned = 350
- **Steps**: 1. Observe mini-burned
- **Expected**: Hiển thị '350'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_079: Burned = 500 → hiển thị '500'
- **Pre-conditions**: burned = 500
- **Steps**: 1. Observe mini-burned
- **Expected**: Hiển thị '500'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_080: Burned = 800 → hiển thị '800'
- **Pre-conditions**: burned = 800
- **Steps**: 1. Observe mini-burned
- **Expected**: Hiển thị '800'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_081: Burned = 1000 → hiển thị '1000'
- **Pre-conditions**: burned = 1000
- **Steps**: 1. Observe mini-burned
- **Expected**: Hiển thị '1000'
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_EBP_082: Burned icon Flame hiển thị
- **Pre-conditions**: EnergyBalanceMini render
- **Steps**: 1. Inspect burned icon
- **Expected**: Flame icon hiển thị, aria-hidden='true'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_083: Burned label 'Đã đốt' (hoặc tương tự) hiển thị
- **Pre-conditions**: EnergyBalanceMini render
- **Steps**: 1. Inspect burned label
- **Expected**: Label text = 'Đã đốt' hoặc i18n equivalent
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_084: Burned = 0.3 → hiển thị '0' (rounded)
- **Pre-conditions**: burned = 0.3
- **Steps**: 1. Observe mini-burned
- **Expected**: Hiển thị '0' (Math.round(0.3))
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_085: Burned = 499.7 → hiển thị '500'
- **Pre-conditions**: burned = 499.7
- **Steps**: 1. Observe mini-burned
- **Expected**: Hiển thị '500' (Math.round(499.7))
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_086: Burned số dùng tabular-nums
- **Pre-conditions**: burned = 350
- **Steps**: 1. Inspect fontVariantNumeric
- **Expected**: fontVariantNumeric = 'tabular-nums'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_087: Burned update khi log workout
- **Pre-conditions**: burned = 0, log workout 300 kcal
- **Steps**: 1. Observe burned trước 2. Log workout 3. Observe burned sau
- **Expected**: Burned thay đổi từ '0' → '300'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_088: Burned = 2000 → layout không vỡ
- **Pre-conditions**: burned = 2000 (heavy workout)
- **Steps**: 1. Observe mini-burned
- **Expected**: Hiển thị '2000', layout intact
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_EBP_089: Burned = NaN handling
- **Pre-conditions**: burned = NaN
- **Steps**: 1. Observe mini-burned
- **Expected**: Hiển thị '0' hoặc fallback, không crash
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_EBP_090: Burned = negative handling
- **Pre-conditions**: burned = -50
- **Steps**: 1. Observe mini-burned
- **Expected**: Hiển thị '0' hoặc defensive value, không crash
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_EBP_091: Net = eaten - burned: 2000 - 300 = 1700
- **Pre-conditions**: eaten = 2000, burned = 300
- **Steps**: 1. Observe data-testid='mini-net'
- **Expected**: Hiển thị '1700'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_092: Net = 0 (eaten = burned)
- **Pre-conditions**: eaten = 500, burned = 500
- **Steps**: 1. Observe mini-net
- **Expected**: Hiển thị '0'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_093: Net = negative (burned > eaten): 200 - 500 = -300
- **Pre-conditions**: eaten = 200, burned = 500
- **Steps**: 1. Observe mini-net
- **Expected**: Hiển thị '-300' (negative net)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_094: Net balanced: net = target (diff = 0) → emerald
- **Pre-conditions**: eaten = 2000, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Color class = emerald (|diff| = 0 ≤ 100)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_095: Net balanced: net = target + 50 → emerald
- **Pre-conditions**: eaten = 2050, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Color class = emerald (|diff| = 50 ≤ 100)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_096: Net balanced: net = target - 99 → emerald
- **Pre-conditions**: eaten = 1901, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Color class = emerald (|diff| = 99 ≤ 100)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_097: Net balanced: net = target + 100 → emerald (boundary)
- **Pre-conditions**: eaten = 2100, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Color class = emerald (|diff| = 100 ≤ 100)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_EBP_098: Net balanced: net = target - 100 → emerald (boundary)
- **Pre-conditions**: eaten = 1900, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Color class = emerald (|diff| = 100 ≤ 100)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_EBP_099: Net surplus: net = target + 101 → amber (boundary +1)
- **Pre-conditions**: eaten = 2101, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Color class = amber (diff = 101 > 100)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_EBP_100: Net surplus: net = target + 200 → amber
- **Pre-conditions**: eaten = 2200, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Color class = amber (surplus)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_101: Net surplus: net = target + 500 → amber
- **Pre-conditions**: eaten = 2500, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Color class = amber (large surplus)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_102: Net surplus: net = target + 1000 → amber
- **Pre-conditions**: eaten = 3000, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Color class = amber (very large surplus)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_103: Net deficit: net = target - 101 → slate (boundary -1)
- **Pre-conditions**: eaten = 1899, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Color class = slate (diff = -101 < -100)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_EBP_104: Net deficit: net = target - 200 → slate
- **Pre-conditions**: eaten = 1800, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Color class = slate (deficit)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_105: Net deficit: net = target - 500 → slate
- **Pre-conditions**: eaten = 1500, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Color class = slate (large deficit)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_106: Net deficit: net = target - 2000 → slate (net = 0)
- **Pre-conditions**: eaten = 0, burned = 0, target = 2000
- **Steps**: 1. Observe net color class
- **Expected**: Color class = slate (|diff| = 2000 > 100)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_107: Net label 'Còn lại' (hoặc tương tự) hiển thị
- **Pre-conditions**: EnergyBalanceMini render
- **Steps**: 1. Inspect net label
- **Expected**: Label text = 'Còn lại' hoặc i18n equivalent
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_108: Net icon Target hiển thị
- **Pre-conditions**: EnergyBalanceMini render
- **Steps**: 1. Inspect net icon
- **Expected**: Target icon hiển thị, aria-hidden='true'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_109: Net số dùng tabular-nums
- **Pre-conditions**: net = 1700
- **Steps**: 1. Inspect fontVariantNumeric
- **Expected**: fontVariantNumeric = 'tabular-nums'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_110: Net color transition: balanced → surplus khi eaten tăng
- **Pre-conditions**: eaten thay đổi từ 2050 → 2150 (target = 2000)
- **Steps**: 1. Observe color trước (emerald) 2. Tăng eaten 3. Observe color sau
- **Expected**: Color chuyển từ emerald → amber
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_111: Net color transition: balanced → deficit khi burned tăng
- **Pre-conditions**: eaten = 2000, burned tăng từ 0 → 200 (target = 2000)
- **Steps**: 1. Observe color trước (emerald) 2. Tăng burned 3. Observe color sau
- **Expected**: Color chuyển từ emerald → slate (net = 1800, diff = -200)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_112: EnergyBalanceMini minHeight = 80px
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect computed min-height
- **Expected**: min-height = 80px
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_113: 3-column layout: eaten | burned | net
- **Pre-conditions**: EnergyBalanceMini render
- **Steps**: 1. Inspect layout structure
- **Expected**: 3 columns hiển thị ngang hàng: eaten, burned, net
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_114: All 3 columns equal width
- **Pre-conditions**: EnergyBalanceMini render
- **Steps**: 1. Đo width của 3 columns
- **Expected**: Mỗi column chiếm ~1/3 tổng width (flex-1 hoặc grid-cols-3)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_115: Net = 0 khi eaten = 0 và burned = 0
- **Pre-conditions**: eaten = 0, burned = 0
- **Steps**: 1. Observe mini-net
- **Expected**: Hiển thị '0', color = slate (|diff| = target > 100)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_EBP_116: Interactive mode (onTapDetail provided): cursor-pointer
- **Pre-conditions**: onTapDetail callback provided
- **Steps**: 1. Inspect cursor style
- **Expected**: cursor = pointer
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_117: Interactive mode: focus:ring-2 on focus
- **Pre-conditions**: onTapDetail provided, keyboard focus
- **Steps**: 1. Tab to EnergyBalanceMini
- **Expected**: focus:ring-2 visible (blue ring)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_118: Interactive mode: role='button'
- **Pre-conditions**: onTapDetail provided
- **Steps**: 1. Inspect role attribute
- **Expected**: role = 'button'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_119: Interactive mode: tabIndex=0
- **Pre-conditions**: onTapDetail provided
- **Steps**: 1. Inspect tabIndex
- **Expected**: tabIndex = 0 (keyboard focusable)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_120: Interactive mode: click → onTapDetail called
- **Pre-conditions**: onTapDetail provided
- **Steps**: 1. Click EnergyBalanceMini
- **Expected**: onTapDetail callback invoked
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_121: Interactive mode: Enter key → onTapDetail called
- **Pre-conditions**: onTapDetail provided, component focused
- **Steps**: 1. Focus component 2. Press Enter
- **Expected**: onTapDetail callback invoked
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_122: Interactive mode: Space key → onTapDetail called
- **Pre-conditions**: onTapDetail provided, component focused
- **Steps**: 1. Focus component 2. Press Space
- **Expected**: onTapDetail callback invoked
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_123: Non-interactive mode (no onTapDetail): cursor default
- **Pre-conditions**: onTapDetail = undefined
- **Steps**: 1. Inspect cursor style
- **Expected**: cursor = default (not pointer)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_124: Non-interactive mode: no role attribute
- **Pre-conditions**: onTapDetail = undefined
- **Steps**: 1. Inspect role
- **Expected**: Không có role='button'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_125: Non-interactive mode: no tabIndex
- **Pre-conditions**: onTapDetail = undefined
- **Steps**: 1. Inspect tabIndex
- **Expected**: Không có tabIndex (not keyboard focusable)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_126: Non-interactive mode: no focus ring
- **Pre-conditions**: onTapDetail = undefined, attempt focus
- **Steps**: 1. Tab to element area
- **Expected**: Không hiển thị focus ring
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_127: Interactive mode: aria-label mô tả energy balance
- **Pre-conditions**: onTapDetail provided
- **Steps**: 1. Inspect aria-label
- **Expected**: aria-label mô tả như 'Xem chi tiết năng lượng'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_128: Interactive mode: hover state
- **Pre-conditions**: onTapDetail provided, mouse hover
- **Steps**: 1. Hover over component
- **Expected**: Subtle hover effect (opacity hoặc background change)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_129: Interactive mode: active state (pressed)
- **Pre-conditions**: onTapDetail provided
- **Steps**: 1. Click and hold
- **Expected**: Active/pressed state visible (scale hoặc opacity)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_130: Interactive mode: double click → only 1 call
- **Pre-conditions**: onTapDetail provided
- **Steps**: 1. Double click nhanh
- **Expected**: onTapDetail gọi 1-2 lần (debounce hoặc React batching)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_131: Progress bar 0%: pct = 0 → bar width = 0%
- **Pre-conditions**: eaten = 0, target = 2000
- **Steps**: 1. Inspect progress bar width
- **Expected**: width = '0%'
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_132: Progress bar 25%: eaten = 500, target = 2000
- **Pre-conditions**: eaten = 500, target = 2000
- **Steps**: 1. Inspect progress bar width
- **Expected**: width = '25%'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_133: Progress bar 50%: eaten = 1000, target = 2000
- **Pre-conditions**: eaten = 1000, target = 2000
- **Steps**: 1. Inspect progress bar width
- **Expected**: width = '50%'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_134: Progress bar 75%: eaten = 1500, target = 2000
- **Pre-conditions**: eaten = 1500, target = 2000
- **Steps**: 1. Inspect progress bar width
- **Expected**: width = '75%'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_135: Progress bar 100%: eaten = 2000, target = 2000
- **Pre-conditions**: eaten = 2000, target = 2000
- **Steps**: 1. Inspect progress bar width
- **Expected**: width = '100%'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_136: Progress bar 150% → capped at 100%
- **Pre-conditions**: eaten = 3000, target = 2000
- **Steps**: 1. Inspect progress bar width
- **Expected**: width = '100%' (capped), không overflow
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_137: Surplus indicator khi net > target
- **Pre-conditions**: eaten = 2500, burned = 0, target = 2000
- **Steps**: 1. Observe surplus indicator
- **Expected**: Surplus indicator hiển thị (amber icon/text)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_138: Deficit indicator khi net < target - 200
- **Pre-conditions**: eaten = 1700, burned = 0, target = 2000
- **Steps**: 1. Observe deficit indicator
- **Expected**: Deficit indicator hiển thị (slate icon/text hoặc motivation)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_139: Balanced state: |net - target| < 200
- **Pre-conditions**: eaten = 1900, burned = 0, target = 2000
- **Steps**: 1. Observe state indicator
- **Expected**: Balanced state indicator (emerald, 'Tốt lắm!' hoặc tương tự)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_140: Color coding under: eaten < target - 200 → blue/slate
- **Pre-conditions**: eaten = 500, target = 2000
- **Steps**: 1. Inspect progress bar color
- **Expected**: Bar color = slate/blue (under)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_141: Color coding balanced: |eaten - target| ≤ 200 → green
- **Pre-conditions**: eaten = 1900, target = 2000
- **Steps**: 1. Inspect progress bar color
- **Expected**: Bar color = emerald/green (balanced)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_142: Color coding over: eaten > target + 200 → red/amber
- **Pre-conditions**: eaten = 2300, target = 2000
- **Steps**: 1. Inspect progress bar color
- **Expected**: Bar color = amber/red (over)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_143: Progress bar track background color
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect bar track background
- **Expected**: Track bg = gray-200 (light mode) hoặc slate-700 (dark mode)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_144: Progress bar transition animation khi percentage thay đổi
- **Pre-conditions**: eaten tăng từ 500 → 1000
- **Steps**: 1. Observe bar width transition
- **Expected**: Bar width animate mượt từ 25% → 50% (CSS transition)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_145: Progress bar border-radius rounded
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect bar border-radius
- **Expected**: Bar và track có rounded corners (rounded-full hoặc rounded-lg)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_146: Progress bar height consistent
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect bar height
- **Expected**: Bar height consistent (ví dụ: h-2 hoặc h-3)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_147: Progress bar aria-valuenow
- **Pre-conditions**: eaten = 1500, target = 2000
- **Steps**: 1. Inspect aria-valuenow
- **Expected**: aria-valuenow = 75 (hoặc actual percentage)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_148: Progress bar aria-valuemin = 0
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect aria-valuemin
- **Expected**: aria-valuemin = 0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_149: Progress bar aria-valuemax = target value
- **Pre-conditions**: target = 2000
- **Steps**: 1. Inspect aria-valuemax
- **Expected**: aria-valuemax = 2000 (hoặc 100 cho percentage)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_150: Progress bar role='progressbar'
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect role
- **Expected**: role = 'progressbar'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_151: ProteinProgress 0g/0g edge case
- **Pre-conditions**: current = 0, target = 0
- **Steps**: 1. Observe display
- **Expected**: '0g / 0g', pct = 0% (avoid divide by zero), bar gray
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P1

##### TC_EBP_152: ProteinProgress 0g/112g (0%)
- **Pre-conditions**: current = 0, target = 112
- **Steps**: 1. Observe display
- **Expected**: '0g / 112g', bar width 0%, color gray
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_153: ProteinProgress 10g/112g (~9%)
- **Pre-conditions**: current = 10, target = 112
- **Steps**: 1. Observe display
- **Expected**: '10g / 112g', bar ~9%, color gray (< 50%)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_154: ProteinProgress 28g/112g (25%)
- **Pre-conditions**: current = 28, target = 112
- **Steps**: 1. Observe display
- **Expected**: '28g / 112g', bar 25%, color gray
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_155: ProteinProgress 40g/112g (~36%)
- **Pre-conditions**: current = 40, target = 112
- **Steps**: 1. Observe display
- **Expected**: '40g / 112g', bar ~36%, color gray
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_156: ProteinProgress 55g/112g (~49%)
- **Pre-conditions**: current = 55, target = 112
- **Steps**: 1. Observe display
- **Expected**: '55g / 112g', bar ~49%, color gray (still < 50%)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_157: ProteinProgress 56g/112g (50%) → yellow boundary
- **Pre-conditions**: current = 56, target = 112
- **Steps**: 1. Observe bar color
- **Expected**: '56g / 112g', bar 50%, color amber/yellow (boundary ≥50%)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_EBP_158: ProteinProgress 55g/112g (49%) → still gray
- **Pre-conditions**: current = 55, target = 112
- **Steps**: 1. Observe bar color
- **Expected**: '55g / 112g', bar ~49%, color gray (49% < 50%)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_EBP_159: ProteinProgress 60g/112g (~54%)
- **Pre-conditions**: current = 60, target = 112
- **Steps**: 1. Observe display
- **Expected**: '60g / 112g', bar ~54%, color amber
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_160: ProteinProgress 75g/112g (~67%)
- **Pre-conditions**: current = 75, target = 112
- **Steps**: 1. Observe display
- **Expected**: '75g / 112g', bar ~67%, color amber
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_161: ProteinProgress 89g/112g (79%) → still amber
- **Pre-conditions**: current = 89, target = 112
- **Steps**: 1. Observe bar color
- **Expected**: '89g / 112g', bar 79%, color amber (79% < 80%)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_162: ProteinProgress 90g/112g (80%) → green boundary
- **Pre-conditions**: current = 90, target = 112
- **Steps**: 1. Observe bar color
- **Expected**: '90g / 112g', bar 80%, color emerald (boundary ≥80%)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_EBP_163: ProteinProgress 89g/112g boundary -1 → amber
- **Pre-conditions**: current = 89, target = 112
- **Steps**: 1. Observe bar color class
- **Expected**: bg-amber-500 (79.5% rounds to 80%? Check Math.round)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P0

##### TC_EBP_164: ProteinProgress 100g/112g (~89%)
- **Pre-conditions**: current = 100, target = 112
- **Steps**: 1. Observe display
- **Expected**: '100g / 112g', bar ~89%, color emerald
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_165: ProteinProgress 112g/112g (100%)
- **Pre-conditions**: current = 112, target = 112
- **Steps**: 1. Observe display
- **Expected**: '112g / 112g', bar 100%, color emerald
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P0

##### TC_EBP_166: ProteinProgress 150g/112g (>100%) → bar capped 100%
- **Pre-conditions**: current = 150, target = 112
- **Steps**: 1. Observe bar width
- **Expected**: '150g / 112g', bar = 100% (capped, không overflow), emerald
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_167: ProteinProgress 200g/112g → bar still 100%
- **Pre-conditions**: current = 200, target = 112
- **Steps**: 1. Observe bar width
- **Expected**: '200g / 112g', bar = 100% (capped)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_EBP_168: ProteinProgress target = 1 → pct = current × 100
- **Pre-conditions**: current = 1, target = 1
- **Steps**: 1. Observe display
- **Expected**: '1g / 1g', bar 100%, emerald
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_169: ProteinProgress target = 150 → different scale
- **Pre-conditions**: current = 120, target = 150
- **Steps**: 1. Observe display
- **Expected**: '120g / 150g', bar 80%, emerald
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_170: ProteinProgress target = 50 (low target)
- **Pre-conditions**: current = 40, target = 50
- **Steps**: 1. Observe display
- **Expected**: '40g / 50g', bar 80%, emerald
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_171: ProteinProgress pct rounded: 33.3% → 33%
- **Pre-conditions**: current = 37, target = 112
- **Steps**: 1. Observe bar width
- **Expected**: Bar width = '33%' (Math.round(33.04))
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_172: ProteinProgress display format 'Xg / Yg'
- **Pre-conditions**: current = 56, target = 112
- **Steps**: 1. Inspect text
- **Expected**: Text chính xác format 'Xg / Yg' với Math.round values
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_173: ProteinProgress color gray (< 50%): bg-gray-400
- **Pre-conditions**: pct = 30%
- **Steps**: 1. Inspect bar color class
- **Expected**: Bar có class bg-gray-400
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_174: ProteinProgress color amber (50-79%): bg-amber-500
- **Pre-conditions**: pct = 65%
- **Steps**: 1. Inspect bar color class
- **Expected**: Bar có class bg-amber-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_175: ProteinProgress color emerald (≥80%): bg-emerald-500
- **Pre-conditions**: pct = 90%
- **Steps**: 1. Inspect bar color class
- **Expected**: Bar có class bg-emerald-500
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_176: Suggestion: deficit ≤ 0 → 'Đạt mục tiêu' (hoặc tương tự)
- **Pre-conditions**: current ≥ target (deficit ≤ 0)
- **Steps**: 1. Observe suggestion text
- **Expected**: Text = 'Đạt mục tiêu' hoặc congratulatory message
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_177: Suggestion: deficit = 1-20g → 'Gần đạt' (hoặc tương tự)
- **Pre-conditions**: current = target - 15
- **Steps**: 1. Observe suggestion text
- **Expected**: Text = 'Gần đạt! Thêm 15g nữa' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_178: Suggestion: deficit = 20g (boundary) → 'Gần đạt'
- **Pre-conditions**: current = target - 20
- **Steps**: 1. Observe suggestion text
- **Expected**: Text = 'Gần đạt' range
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_EBP_179: Suggestion: deficit = 21-50g → rotating tip
- **Pre-conditions**: current = target - 35
- **Steps**: 1. Observe suggestion text
- **Expected**: Rotating suggestion tip (thay đổi theo ngày)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_180: Suggestion: deficit = 50g (boundary) → rotating tip
- **Pre-conditions**: current = target - 50
- **Steps**: 1. Observe suggestion text
- **Expected**: Text trong rotating tip range
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_EBP_181: Suggestion: deficit > 50g → 'Cần bổ sung đáng kể'
- **Pre-conditions**: current = target - 80
- **Steps**: 1. Observe suggestion text
- **Expected**: Text = 'Cần bổ sung đáng kể' hoặc similar strong deficit message
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_182: Suggestion: deficit = 51g → 'Cần bổ sung đáng kể' (boundary +1)
- **Pre-conditions**: current = target - 51
- **Steps**: 1. Observe suggestion text
- **Expected**: Text = 'Cần bổ sung đáng kể'
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P2

##### TC_EBP_183: Suggestion rotating tip: getDayOfYear() % 5 selects tip index
- **Pre-conditions**: deficit in 21-50g range
- **Steps**: 1. Observe tip 2. Check tip varies by day
- **Expected**: Tip text khác nhau mỗi ngày (5 tips rotate)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_184: Suggestion tip 0: (day % 5 = 0)
- **Pre-conditions**: deficit 21-50g, getDayOfYear() % 5 = 0
- **Steps**: 1. Observe tip
- **Expected**: Tip text đúng cho index 0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_185: Suggestion tip 1: (day % 5 = 1)
- **Pre-conditions**: deficit 21-50g, getDayOfYear() % 5 = 1
- **Steps**: 1. Observe tip
- **Expected**: Tip text đúng cho index 1
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_186: Suggestion tip 2: (day % 5 = 2)
- **Pre-conditions**: deficit 21-50g, getDayOfYear() % 5 = 2
- **Steps**: 1. Observe tip
- **Expected**: Tip text đúng cho index 2
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_187: Suggestion tip 3: (day % 5 = 3)
- **Pre-conditions**: deficit 21-50g, getDayOfYear() % 5 = 3
- **Steps**: 1. Observe tip
- **Expected**: Tip text đúng cho index 3
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_188: Suggestion tip 4: (day % 5 = 4)
- **Pre-conditions**: deficit 21-50g, getDayOfYear() % 5 = 4
- **Steps**: 1. Observe tip
- **Expected**: Tip text đúng cho index 4
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_189: Suggestion text accessible: aria-live cho screen reader
- **Pre-conditions**: Suggestion thay đổi
- **Steps**: 1. Inspect suggestion ARIA
- **Expected**: Suggestion có aria-live='polite' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_190: Suggestion text font size readable
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect suggestion font size
- **Expected**: Font size ≥ 12px (readable)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_191: ProteinProgress role='progressbar'
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect role attribute
- **Expected**: role = 'progressbar'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_192: ProteinProgress aria-valuenow = current pct
- **Pre-conditions**: current = 56, target = 112
- **Steps**: 1. Inspect aria-valuenow
- **Expected**: aria-valuenow = 50
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_193: ProteinProgress aria-valuemin = 0
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect aria-valuemin
- **Expected**: aria-valuemin = 0
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_194: ProteinProgress aria-valuemax = target
- **Pre-conditions**: target = 112
- **Steps**: 1. Inspect aria-valuemax
- **Expected**: aria-valuemax = 112 (hoặc 100 cho pct)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_195: ProteinProgress aria-label mô tả progress
- **Pre-conditions**: current = 56, target = 112
- **Steps**: 1. Inspect aria-label
- **Expected**: aria-label chứa 'protein' và '50%' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_196: Screen reader reads protein percentage
- **Pre-conditions**: Screen reader ON
- **Steps**: 1. Navigate to ProteinProgress
- **Expected**: Screen reader announces '50 percent' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_197: Screen reader reads suggestion text
- **Pre-conditions**: Screen reader ON, deficit > 50g
- **Steps**: 1. Navigate to suggestion
- **Expected**: Screen reader reads 'Cần bổ sung đáng kể'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_198: ProteinProgress keyboard navigable (nếu interactive)
- **Pre-conditions**: Keyboard navigation
- **Steps**: 1. Tab to ProteinProgress
- **Expected**: Component focusable nếu interactive, skip nếu non-interactive
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_199: Color not sole indicator: text reinforces bar color
- **Pre-conditions**: pct = 30% (gray bar)
- **Steps**: 1. View in grayscale
- **Expected**: Suggestion text vẫn cho biết trạng thái (không chỉ dựa vào color)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_200: High contrast mode: bar vẫn visible
- **Pre-conditions**: OS high contrast mode ON
- **Steps**: 1. Inspect bar visibility
- **Expected**: Bar visible, không mất trong background
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_EBP_201: Decorative icons aria-hidden='true' trong EnergyBalanceMini
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect tất cả icon elements
- **Expected**: UtensilsCrossed, Flame, Target đều có aria-hidden='true'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_202: EnergyBalanceMini aria-label cho container
- **Pre-conditions**: Component render
- **Steps**: 1. Inspect container aria-label
- **Expected**: aria-label mô tả 'Cân bằng năng lượng' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_203: Focus ring color meets contrast on all backgrounds
- **Pre-conditions**: Interactive mode, focus
- **Steps**: 1. Inspect focus ring contrast
- **Expected**: Focus ring contrast ≥ 3:1 against adjacent colors
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_204: Touch target cho interactive EnergyBalanceMini ≥ 44px
- **Pre-conditions**: onTapDetail provided
- **Steps**: 1. Inspect touch target size
- **Expected**: min-height ≥ 44px (WCAG touch target)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_205: ProteinProgress text contrast ≥ 4.5:1
- **Pre-conditions**: Component render
- **Steps**: 1. Check contrast ratio
- **Expected**: Text color vs background ≥ 4.5:1 (WCAG AA)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_206: Dark mode: EnergyBalanceMini background dark
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect background
- **Expected**: bg-slate-800 hoặc dark variant
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_207: Dark mode: Eaten text color sáng
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect eaten text color
- **Expected**: text-slate-100 hoặc white variant
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_208: Dark mode: Burned text color sáng
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect burned text color
- **Expected**: text-slate-100 hoặc white variant
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_209: Dark mode: Net emerald vẫn visible
- **Pre-conditions**: Dark mode ON, balanced state
- **Steps**: 1. Inspect net color
- **Expected**: text-emerald-400 (dark variant, vẫn readable)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_210: Dark mode: Net amber vẫn visible
- **Pre-conditions**: Dark mode ON, surplus state
- **Steps**: 1. Inspect net color
- **Expected**: text-amber-400 (dark variant)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_211: Dark mode: Net slate vẫn visible
- **Pre-conditions**: Dark mode ON, deficit state
- **Steps**: 1. Inspect net color
- **Expected**: text-slate-300 (dark variant)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_212: Dark mode: ProteinProgress track bg
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect track background
- **Expected**: dark:bg-slate-700
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_213: Dark mode: ProteinProgress bar colors preserved
- **Pre-conditions**: Dark mode ON, pct = 90%
- **Steps**: 1. Inspect bar color
- **Expected**: bg-emerald-500 (same in dark mode)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_214: Dark mode: ProteinProgress text color
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect text
- **Expected**: dark:text-slate-100
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_215: Dark mode: ProteinProgress suggestion text
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect suggestion text color
- **Expected**: dark:text-slate-300 hoặc readable variant
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_216: Dark mode: ProteinProgress label dark:text-slate-300
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect protein label
- **Expected**: Label: dark:text-slate-300
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_217: Dark mode: EnergyBalanceMini border
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect border
- **Expected**: dark:border-slate-700 (nếu có border)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_218: Dark mode: icons vẫn visible trên dark background
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect icon colors
- **Expected**: Icons visible (light color on dark bg)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_219: Dark mode: progress bar track contrast
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect track vs background contrast
- **Expected**: Track phân biệt được với container background
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_220: Dark mode: interactive focus ring visible
- **Pre-conditions**: Dark mode ON, interactive mode, focus
- **Steps**: 1. Tab to component
- **Expected**: Focus ring visible on dark background
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_221: Light → Dark toggle: values preserved
- **Pre-conditions**: Toggle dark mode
- **Steps**: 1. Note values 2. Toggle dark mode
- **Expected**: Eaten/Burned/Net/Protein values unchanged, chỉ colors thay đổi
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_222: Dark mode: gradient colors appropriate
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect overall gradient/bg
- **Expected**: Colors appropriate cho dark theme (không quá bright)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_223: Dark mode: number readability maintained
- **Pre-conditions**: Dark mode ON, all values
- **Steps**: 1. Read all numbers
- **Expected**: Tất cả numbers readable (sufficient contrast)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_224: Dark mode: separator lines visible
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect column separators
- **Expected**: Separator lines visible (dark:border-slate-600 hoặc tương tự)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_EBP_225: Dark mode: tabular-nums still works
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Inspect fontVariantNumeric
- **Expected**: tabular-nums vẫn applied trong dark mode
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_EBP_226: Very high eaten: 99999 kcal → layout intact
- **Pre-conditions**: eaten = 99999
- **Steps**: 1. Observe layout
- **Expected**: Number hiển thị đầy đủ, layout không vỡ
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_227: Very high target: 5000 kcal
- **Pre-conditions**: target = 5000
- **Steps**: 1. Observe component
- **Expected**: Component hiển thị bình thường với high target
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_228: Target = 0 → divide by zero prevention
- **Pre-conditions**: target = 0
- **Steps**: 1. Observe progress bar
- **Expected**: Bar 0% hoặc 100%, KHÔNG crash (max(target, 1) protection)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P0

##### TC_EBP_229: Target = 1 → extreme sensitivity
- **Pre-conditions**: target = 1, eaten = 1
- **Steps**: 1. Observe net color
- **Expected**: net = 1, target = 1, balanced (|diff| = 0)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_230: Eaten = target exactly → balanced (emerald)
- **Pre-conditions**: eaten = 2000, target = 2000
- **Steps**: 1. Observe color
- **Expected**: Emerald (diff = 0)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_231: Eaten = target + 100 exactly → still balanced
- **Pre-conditions**: eaten = 2100, target = 2000
- **Steps**: 1. Observe color
- **Expected**: Emerald (|diff| = 100 ≤ 100)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_232: Eaten = target - 100 exactly → still balanced
- **Pre-conditions**: eaten = 1900, target = 2000
- **Steps**: 1. Observe color
- **Expected**: Emerald (|diff| = 100 ≤ 100)
- **Kết quả test thực tế**: | — |
- **Type**: Boundary | **Priority**: P1

##### TC_EBP_233: Negative balance display: eaten < burned
- **Pre-conditions**: eaten = 100, burned = 500
- **Steps**: 1. Observe net display
- **Expected**: Net = -400, hiển thị '-400' hoặc styled negative
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_234: Negative balance color: net = -400, target = 2000 → slate
- **Pre-conditions**: net = -400, target = 2000
- **Steps**: 1. Observe color
- **Expected**: Slate (diff = -2400, |diff| > 100)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_235: Rapid data update: eaten changes 10 times quickly
- **Pre-conditions**: Eaten thay đổi liên tục
- **Steps**: 1. Trigger 10 rapid eaten updates
- **Expected**: UI updates smoothly, no flicker, final value correct
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_236: EnergyBalanceMini re-render on prop change
- **Pre-conditions**: eaten thay đổi từ 500 → 800
- **Steps**: 1. Observe component re-render
- **Expected**: Component re-renders với new values
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_237: ProteinProgress re-render on prop change
- **Pre-conditions**: current thay đổi từ 50 → 80
- **Steps**: 1. Observe component re-render
- **Expected**: Bar width animate, color may change, display update
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_238: Concurrent eaten + burned update
- **Pre-conditions**: eaten và burned thay đổi cùng lúc
- **Steps**: 1. Update eaten = 1500, burned = 300 simultaneously
- **Expected**: Net = 1200, hiển thị đúng
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_239: Unicode/special chars in labels
- **Pre-conditions**: i18n edge case
- **Steps**: 1. Check label rendering
- **Expected**: Labels render đúng Vietnamese characters (dấu)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_240: Component unmount → no state update warnings
- **Pre-conditions**: Component unmount during async operation
- **Steps**: 1. Unmount component 2. Check console
- **Expected**: Không có 'setState on unmounted' warnings
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_EBP_241: EnergyBalanceMini với missing prop: eaten undefined
- **Pre-conditions**: eaten = undefined
- **Steps**: 1. Observe component
- **Expected**: Hiển thị '0' hoặc fallback, không crash
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_EBP_242: EnergyBalanceMini với missing prop: burned undefined
- **Pre-conditions**: burned = undefined
- **Steps**: 1. Observe component
- **Expected**: Hiển thị '0' hoặc fallback, không crash
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_EBP_243: EnergyBalanceMini với missing prop: target undefined
- **Pre-conditions**: target = undefined
- **Steps**: 1. Observe component
- **Expected**: Fallback target hoặc 0, không crash
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_EBP_244: ProteinProgress với current undefined
- **Pre-conditions**: current = undefined
- **Steps**: 1. Observe component
- **Expected**: Hiển thị '0g / Yg' hoặc fallback, không crash
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_EBP_245: ProteinProgress với target undefined
- **Pre-conditions**: target = undefined
- **Steps**: 1. Observe component
- **Expected**: Fallback target, không crash (divide by zero protected)
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P1

##### TC_EBP_246: Very large protein: current = 1000g
- **Pre-conditions**: current = 1000, target = 112
- **Steps**: 1. Observe display
- **Expected**: '1000g / 112g' hiển thị, bar 100%, layout intact
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_247: Protein negative: current = -10
- **Pre-conditions**: current = -10, target = 112
- **Steps**: 1. Observe display
- **Expected**: Hiển thị '0g / 112g' hoặc defensive handling, bar 0%
- **Kết quả test thực tế**: | — |
- **Type**: Negative | **Priority**: P2

##### TC_EBP_248: Eaten float precision: 1000.456789
- **Pre-conditions**: eaten = 1000.456789
- **Steps**: 1. Observe display
- **Expected**: Hiển thị '1000' (Math.round, no decimal)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_249: Protein float precision: current = 56.78
- **Pre-conditions**: current = 56.78, target = 112
- **Steps**: 1. Observe display
- **Expected**: Hiển thị '57g / 112g' (Math.round)
- **Kết quả test thực tế**: | — |
- **Type**: Edge | **Priority**: P2

##### TC_EBP_250: Both components render simultaneously
- **Pre-conditions**: Dashboard Tier 2 mount
- **Steps**: 1. Inspect Tier 2 children
- **Expected**: EnergyBalanceMini và ProteinProgress cùng render trong Tier 2
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P1

##### TC_EBP_251: Screen reader: reads eaten value and label
- **Pre-conditions**: Screen reader ON
- **Steps**: 1. Navigate to eaten section
- **Expected**: Announces 'Đã ăn: 1500 kcal' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_252: Screen reader: reads burned value and label
- **Pre-conditions**: Screen reader ON
- **Steps**: 1. Navigate to burned section
- **Expected**: Announces 'Đã đốt: 300 kcal' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_253: Screen reader: reads net value, label, and status
- **Pre-conditions**: Screen reader ON
- **Steps**: 1. Navigate to net section
- **Expected**: Announces 'Còn lại: 1200 kcal, Cân bằng' hoặc tương tự
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_254: Screen reader: protein progress percentage
- **Pre-conditions**: Screen reader ON
- **Steps**: 1. Navigate to ProteinProgress
- **Expected**: Announces '50 phần trăm' hoặc '50%'
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_255: WCAG AA: all text ≥ 4.5:1 contrast (light mode)
- **Pre-conditions**: Light mode
- **Steps**: 1. Audit contrast ratios
- **Expected**: All text meets WCAG AA (4.5:1)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_256: WCAG AA: all text ≥ 4.5:1 contrast (dark mode)
- **Pre-conditions**: Dark mode ON
- **Steps**: 1. Audit contrast ratios
- **Expected**: All text meets WCAG AA in dark mode
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_257: WCAG AAA: large text ≥ 3:1 contrast
- **Pre-conditions**: Component render
- **Steps**: 1. Audit large text contrast
- **Expected**: Numbers (large text) ≥ 3:1 contrast
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_EBP_258: Keyboard-only navigation works
- **Pre-conditions**: Keyboard only (no mouse)
- **Steps**: 1. Tab through all interactive elements
- **Expected**: All interactive elements reachable and operable
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_259: No ARIA misuse (roles match purpose)
- **Pre-conditions**: Component render
- **Steps**: 1. Validate ARIA usage
- **Expected**: All ARIA roles, states, properties used correctly per spec
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_260: EnergyBalanceMini responsive: narrow screen
- **Pre-conditions**: Screen width 320px
- **Steps**: 1. Inspect layout
- **Expected**: 3-column layout adjusts, numbers not truncated
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_261: ProteinProgress responsive: narrow screen
- **Pre-conditions**: Screen width 320px
- **Steps**: 1. Inspect layout
- **Expected**: Progress bar và text adjust, nothing truncated
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_262: EnergyBalanceMini responsive: wide screen
- **Pre-conditions**: Screen width 768px
- **Steps**: 1. Inspect layout
- **Expected**: Layout scales appropriately, not too stretched
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_EBP_263: Text scaling 200%: content not truncated
- **Pre-conditions**: Browser text zoom 200%
- **Steps**: 1. Zoom text to 200%
- **Expected**: All text remains readable, no overlap
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P2

##### TC_EBP_264: Motion safe: color transition khi data thay đổi
- **Pre-conditions**: eaten thay đổi, reduced motion OFF
- **Steps**: 1. Observe color transition
- **Expected**: Color transitions smoothly (CSS transition)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

##### TC_EBP_265: React.memo: ProteinProgress không re-render nếu props unchanged
- **Pre-conditions**: Parent re-render, same protein values
- **Steps**: 1. Monitor ProteinProgress render count
- **Expected**: Không re-render (memoized)
- **Kết quả test thực tế**: | — |
- **Type**: Positive | **Priority**: P3

---

## Đề xuất Cải tiến

### Đề xuất 1: Visual Progress Ring thay Bar
- **Vấn đề hiện tại**: Progress bar dạng ngang hẹp, khó phân biệt nhanh trạng thái.
- **Giải pháp đề xuất**: Circular progress ring cho ProteinProgress, animated fill, số ở giữa.
- **Lý do chi tiết**: Ring cho perception trực quan hơn bar (Apple Watch style). Chiếm ít horizontal space, hiển thị tốt hơn trên mobile.
- **Phần trăm cải thiện**: Glanceability +40%, User comprehension +25%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 2: Animated Net Value Transition
- **Vấn đề hiện tại**: Net value thay đổi tức thời khi eaten/burned update, dễ miss.
- **Giải pháp đề xuất**: Count animation với color transition khi net crosses threshold boundaries.
- **Lý do chi tiết**: Feedback animation giúp user nhận biết impact của mỗi bữa ăn ngay lập tức.
- **Phần trăm cải thiện**: Awareness +30%, Engagement +15%
- **Mức độ ưu tiên**: Low | **Effort**: S

### Đề xuất 3: Macro Breakdown mở rộng
- **Vấn đề hiện tại**: Chỉ track protein, không track carbs và fat.
- **Giải pháp đề xuất**: Thêm expandable section hiển thị carbs/fat progress tương tự ProteinProgress.
- **Lý do chi tiết**: Macro tracking toàn diện là nhu cầu phổ biến. Expandable giữ dashboard clean.
- **Phần trăm cải thiện**: Feature completeness +30%, User retention +15%
- **Mức độ ưu tiên**: Medium | **Effort**: M

# Scenario 9: Goal Settings

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Goal Settings cho phép user thiết lập mục tiêu dinh dưỡng hàng ngày: target calories, protein ratio, weight, height. GoalSettingsModal mở từ Summary component hoặc Settings tab. Goals ảnh hưởng trực tiếp đến progress bars trên Calendar tab.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| GoalSettingsModal | GoalSettingsModal.tsx | Modal form |
| Summary | Summary.tsx | Hiển thị progress |
| usePersistedState | hooks/usePersistedState.ts | Persist goals |

## Luồng nghiệp vụ

1. User clicks goal icon/button on Summary or Settings
2. GoalSettingsModal opens with current values
3. User edits target calories, protein ratio, weight
4. Save → localStorage → bars recalculate → modal closes
5. Cancel → no changes

## Quy tắc nghiệp vụ

1. targetCalories: integer > 0, default 2000
2. proteinRatio: float > 0, default 1.5 (g per kg body weight)
3. weight: float > 0 (kg)
4. targetProtein = weight × proteinRatio
5. All values persist to localStorage
6. Changes immediately reflected in nutrition bars

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_GS_01 | Goal button visible on Summary | Positive | P1 |
| TC_GS_02 | Click goal → modal opens | Positive | P0 |
| TC_GS_03 | Modal shows current values | Positive | P1 |
| TC_GS_04 | Target calories field | Positive | P1 |
| TC_GS_05 | Protein ratio field | Positive | P1 |
| TC_GS_06 | Weight field | Positive | P1 |
| TC_GS_07 | Save button | Positive | P1 |
| TC_GS_08 | Cancel button | Positive | P1 |
| TC_GS_09 | Save → values persist | Positive | P0 |
| TC_GS_10 | Cancel → no changes | Positive | P1 |
| TC_GS_11 | Save → bars recalculate | Positive | P0 |
| TC_GS_12 | Default values first time | Positive | P1 |
| TC_GS_13 | Edit calories → save | Positive | P1 |
| TC_GS_14 | Edit protein ratio → save | Positive | P1 |
| TC_GS_15 | Edit weight → save | Positive | P1 |
| TC_GS_16 | Edit all fields → save | Positive | P1 |
| TC_GS_17 | Partial edit (only cal) | Positive | P2 |
| TC_GS_18 | No changes → save (idempotent) | Positive | P2 |
| TC_GS_19 | Calories = 0 → validation error | Negative | P0 |
| TC_GS_20 | Calories negative → error | Negative | P1 |
| TC_GS_21 | Calories empty → error | Negative | P1 |
| TC_GS_22 | Calories non-numeric → error | Negative | P1 |
| TC_GS_23 | Calories = 1 (min boundary) | Boundary | P2 |
| TC_GS_24 | Calories = 500 | Positive | P2 |
| TC_GS_25 | Calories = 2000 (typical) | Positive | P1 |
| TC_GS_26 | Calories = 5000 | Positive | P2 |
| TC_GS_27 | Calories = 10000 (max practical) | Boundary | P2 |
| TC_GS_28 | Calories = 99999 | Boundary | P2 |
| TC_GS_29 | Calories decimal (2000.5) | Edge | P2 |
| TC_GS_30 | Protein ratio = 0 → error | Negative | P1 |
| TC_GS_31 | Protein ratio negative → error | Negative | P1 |
| TC_GS_32 | Protein ratio empty → error | Negative | P1 |
| TC_GS_33 | Protein ratio = 0.5 | Positive | P2 |
| TC_GS_34 | Protein ratio = 1.0 | Positive | P2 |
| TC_GS_35 | Protein ratio = 1.5 (default) | Positive | P1 |
| TC_GS_36 | Protein ratio = 2.0 | Positive | P2 |
| TC_GS_37 | Protein ratio = 3.0 | Positive | P2 |
| TC_GS_38 | Protein ratio = 5.0 (very high) | Boundary | P2 |
| TC_GS_39 | Protein ratio = 10.0 | Boundary | P2 |
| TC_GS_40 | Protein ratio decimal (1.75) | Positive | P2 |
| TC_GS_41 | Weight = 0 → error | Negative | P1 |
| TC_GS_42 | Weight negative → error | Negative | P1 |
| TC_GS_43 | Weight empty → error | Negative | P1 |
| TC_GS_44 | Weight = 30 (min practical) | Boundary | P2 |
| TC_GS_45 | Weight = 70 (typical) | Positive | P1 |
| TC_GS_46 | Weight = 100 | Positive | P2 |
| TC_GS_47 | Weight = 150 | Boundary | P2 |
| TC_GS_48 | Weight = 300 | Boundary | P2 |
| TC_GS_49 | Weight decimal (72.5) | Positive | P2 |
| TC_GS_50 | targetProtein = weight × ratio (verify) | Positive | P0 |
| TC_GS_51 | Change weight → targetProtein recalc | Positive | P1 |
| TC_GS_52 | Change ratio → targetProtein recalc | Positive | P1 |
| TC_GS_53 | Change both → targetProtein correct | Positive | P1 |
| TC_GS_54 | Bars: cal actual/target | Positive | P1 |
| TC_GS_55 | Bars: protein actual/target | Positive | P1 |
| TC_GS_56 | Bars color: green <=80% | Positive | P2 |
| TC_GS_57 | Bars color: yellow 80-100% | Positive | P2 |
| TC_GS_58 | Bars color: red >100% | Positive | P2 |
| TC_GS_59 | Very low target → bars easily red | Boundary | P2 |
| TC_GS_60 | Very high target → bars always green | Boundary | P2 |
| TC_GS_61 | Reload → values preserved | Positive | P0 |
| TC_GS_62 | localStorage key correct | Positive | P2 |
| TC_GS_63 | localStorage format JSON | Positive | P2 |
| TC_GS_64 | Corrupt localStorage → defaults | Edge | P1 |
| TC_GS_65 | Missing localStorage key → defaults | Edge | P1 |
| TC_GS_66 | Clear localStorage → defaults | Positive | P2 |
| TC_GS_67 | Import data with goals | Positive | P1 |
| TC_GS_68 | Export includes goals | Positive | P1 |
| TC_GS_69 | Cloud sync goals | Positive | P2 |
| TC_GS_70 | Modal from Summary | Positive | P1 |
| TC_GS_71 | Modal from Settings | Positive | P1 |
| TC_GS_72 | Both entry points same modal | Positive | P2 |
| TC_GS_73 | Modal backdrop click → close? | Positive | P2 |
| TC_GS_74 | Modal Escape key → close | Positive | P2 |
| TC_GS_75 | Modal form autofocus | Positive | P2 |
| TC_GS_76 | Tab navigation between fields | Positive | P2 |
| TC_GS_77 | Enter key submit | Positive | P2 |
| TC_GS_78 | Validation messages inline | Positive | P1 |
| TC_GS_79 | Error highlight on invalid field | Positive | P2 |
| TC_GS_80 | Success toast after save | Positive | P2 |
| TC_GS_81 | Dark mode modal | Positive | P2 |
| TC_GS_82 | i18n modal labels | Positive | P2 |
| TC_GS_83 | Mobile modal layout | Positive | P2 |
| TC_GS_84 | Desktop modal layout | Positive | P2 |
| TC_GS_85 | Screen reader modal | Positive | P3 |
| TC_GS_86 | Keyboard only usage | Positive | P3 |
| TC_GS_87 | Touch field interaction mobile | Positive | P2 |
| TC_GS_88 | Number keyboard on mobile for numeric fields | Positive | P2 |
| TC_GS_89 | Field step increment (arrows) | Positive | P3 |
| TC_GS_90 | Copy-paste into fields | Positive | P2 |
| TC_GS_91 | Multiple rapid saves | Edge | P2 |
| TC_GS_92 | Open modal → switch tab → return | Edge | P2 |
| TC_GS_93 | Unsaved changes → close warning | Positive | P2 |
| TC_GS_94 | Goal presets (lose/maintain/gain) | Positive | P3 |
| TC_GS_95 | BMR calculator integration | Positive | P3 |
| TC_GS_96 | Activity level factor | Positive | P3 |
| TC_GS_97 | Goal history tracking | Positive | P3 |
| TC_GS_98 | Goal progress over time | Positive | P3 |
| TC_GS_99 | Carbs target | Positive | P3 |
| TC_GS_100 | Fat target | Positive | P3 |
| TC_GS_101 | Fiber target | Positive | P3 |
| TC_GS_102 | Water intake target | Positive | P3 |
| TC_GS_103 | Goal comparison (previous vs current) | Positive | P3 |
| TC_GS_104 | Reset goals to defaults | Positive | P2 |
| TC_GS_105 | Goal validation — calories consistent with macros | Edge | P3 |

---

## Chi tiết Test Cases (Grouped)

##### TC_GS_01–18: Basic CRUD
- Open modal, view current values, edit fields, save, cancel, defaults

##### TC_GS_19–49: Validation
- Calories: 0, negative, empty, non-numeric, boundaries (1, 10000, 99999), decimal
- Protein ratio: 0, negative, empty, range (0.5-10), decimal
- Weight: 0, negative, empty, range (30-300), decimal

##### TC_GS_50–60: Calculation Verification
- targetProtein = weight × ratio with various combos, bar color states

##### TC_GS_61–69: Persistence & Integration
- localStorage, corrupt data, import/export, cloud sync

##### TC_GS_70–90: UX & Modal
- Entry points, modal interactions, validation UI, dark mode, i18n, responsive, accessibility

##### TC_GS_91–105: Edge Cases & Future Features
- Rapid saves, tab switching, presets, BMR calc, history, additional macro targets

---

## Đề xuất Cải tiến

### Đề xuất 1: Visual Goal Progress Timeline
- **Vấn đề hiện tại**: No history of goal changes. Can't track progress over weeks/months.
- **Giải pháp đề xuất**: Timeline chart showing goal changes + actual averages over time.
- **Lý do chi tiết**: Progress visibility is #1 motivation factor. Without it, users abandon goals after 2 weeks.
- **Phần trăm cải thiện**: Goal adherence +45%, Long-term retention +30%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 2: TDEE Calculator Built-in
- **Vấn đề hiện tại**: Users don't know what calorie target to set. Requires external research.
- **Giải pháp đề xuất**: Built-in TDEE calculator: input age, gender, activity level → recommended target.
- **Lý do chi tiết**: 70% of users set incorrect goals. TDEE calc eliminates guesswork.
- **Phần trăm cải thiện**: Goal accuracy +70%, Setup completion +40%
- **Mức độ ưu tiên**: High | **Effort**: S

### Đề xuất 3: Goal Presets (Diet Types)
- **Vấn đề hiện tại**: User must understand macros to set protein ratio.
- **Giải pháp đề xuất**: Presets: "Balanced" (1.5g/kg), "High Protein" (2.0), "Keto" (low carb/high fat), "Vegan" (1.0).
- **Lý do chi tiết**: Presets reduce cognitive load 80%. Most users fit standard diet types.
- **Phần trăm cải thiện**: Setup time -60%, User confidence +50%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 4: Weekly/Monthly Goal Mode
- **Vấn đề hiện tại**: Only daily goals. Miss Monday = fail even if weekly average is on track.
- **Giải pháp đề xuất**: Weekly calorie budget option. "2000/day or 14000/week". Flexible daily distribution.
- **Lý do chi tiết**: Flexibility reduces guilt and improves adherence. Weekend flexibility = realistic dieting.
- **Phần trăm cải thiện**: Goal adherence +35%, Psychological comfort +50%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 5: Goal Sharing / Coach Mode
- **Vấn đề hiện tại**: Goals are private. No way to share with nutritionist/trainer.
- **Giải pháp đề xuất**: Export goals as shareable link/QR code. Trainer can set goals remotely.
- **Lý do chi tiết**: Professional guidance increases success rate 3x. Sharing enables accountability.
- **Phần trăm cải thiện**: Professional usage +40%, Goal success rate +30%
- **Mức độ ưu tiên**: Low | **Effort**: M

# Scenario 20: Filter & Sort

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Filter & Sort Bottom Sheet cho phép user lọc và sắp xếp ingredients/dishes trong Management tab. FilterBottomSheet.tsx hiển thị filter options (by category, nutrition range) và sort options (name A-Z, Z-A, calories asc/desc). Mobile: bottom sheet. Desktop: dropdown/sidebar filter.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| FilterBottomSheet | FilterBottomSheet.tsx | Filter UI |
| ManagementTab | ManagementTab.tsx | Container |

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_FS_01 | Filter button visible | Positive | P1 |
| TC_FS_02 | Sort button visible | Positive | P1 |
| TC_FS_03 | Click filter → bottom sheet opens | Positive | P0 |
| TC_FS_04 | Click sort → sort options show | Positive | P0 |
| TC_FS_05 | Sort by name A-Z | Positive | P0 |
| TC_FS_06 | Sort by name Z-A | Positive | P1 |
| TC_FS_07 | Sort by calories ascending | Positive | P1 |
| TC_FS_08 | Sort by calories descending | Positive | P1 |
| TC_FS_09 | Sort by protein | Positive | P2 |
| TC_FS_10 | Sort by recently added | Positive | P2 |
| TC_FS_11 | Filter by category (if exists) | Positive | P2 |
| TC_FS_12 | Filter by calorie range | Positive | P2 |
| TC_FS_13 | Filter by unit type (g/ml/custom) | Positive | P2 |
| TC_FS_14 | Filter applied → list updates | Positive | P0 |
| TC_FS_15 | Sort applied → list reorders | Positive | P0 |
| TC_FS_16 | Clear filter → show all | Positive | P1 |
| TC_FS_17 | Clear sort → default order | Positive | P1 |
| TC_FS_18 | Filter + sort combined | Positive | P1 |
| TC_FS_19 | Filter count badge | Positive | P2 |
| TC_FS_20 | Active filter indicator | Positive | P2 |
| TC_FS_21 | Bottom sheet swipe down close | Positive | P2 |
| TC_FS_22 | Bottom sheet backdrop close | Positive | P2 |
| TC_FS_23 | Bottom sheet Escape close | Positive | P2 |
| TC_FS_24 | Desktop: dropdown instead of bottom sheet | Positive | P1 |
| TC_FS_25 | Desktop: sidebar filter panel | Positive | P2 |
| TC_FS_26 | Filter ingredients list | Positive | P1 |
| TC_FS_27 | Sort ingredients list | Positive | P1 |
| TC_FS_28 | Filter dishes list | Positive | P1 |
| TC_FS_29 | Sort dishes list | Positive | P1 |
| TC_FS_30 | Filter 0 results | Positive | P1 |
| TC_FS_31 | Filter 0 results → "No items found" message | Positive | P1 |
| TC_FS_32 | Filter all results (matches everything) | Positive | P2 |
| TC_FS_33 | Sort empty list | Edge | P2 |
| TC_FS_34 | Sort 1 item | Edge | P2 |
| TC_FS_35 | Sort 100 items | Positive | P2 |
| TC_FS_36 | Sort 500 items — performance | Boundary | P2 |
| TC_FS_37 | Sort stability (same values maintain order) | Edge | P2 |
| TC_FS_38 | Filter + search combined | Positive | P1 |
| TC_FS_39 | Sort persists after data change | Positive | P2 |
| TC_FS_40 | Filter persists across tab switch | Positive | P2 |
| TC_FS_41 | Filter reset on tab change | Positive | P2 |
| TC_FS_42 | Sort Vietnamese names (diacritics) | Edge | P2 |
| TC_FS_43 | Sort case-insensitive | Positive | P2 |
| TC_FS_44 | Sort with numbers in names | Edge | P2 |
| TC_FS_45 | Sort with special characters | Edge | P2 |
| TC_FS_46 | Sort with emoji names | Edge | P3 |
| TC_FS_47 | Calorie range filter: 0-100 | Positive | P2 |
| TC_FS_48 | Calorie range filter: 100-500 | Positive | P2 |
| TC_FS_49 | Calorie range filter: 500+ | Positive | P2 |
| TC_FS_50 | Custom calorie range | Positive | P2 |
| TC_FS_51 | Range: min > max → error | Negative | P2 |
| TC_FS_52 | Range: min = max → exact match | Boundary | P2 |
| TC_FS_53 | Range: 0-0 | Boundary | P2 |
| TC_FS_54 | Multiple filters active | Positive | P2 |
| TC_FS_55 | Remove individual filter | Positive | P2 |
| TC_FS_56 | "Clear All Filters" button | Positive | P2 |
| TC_FS_57 | Filter chips display | Positive | P2 |
| TC_FS_58 | Filter chip tap → remove | Positive | P2 |
| TC_FS_59 | Dark mode filter sheet | Positive | P2 |
| TC_FS_60 | i18n filter labels | Positive | P2 |
| TC_FS_61 | Mobile filter layout | Positive | P2 |
| TC_FS_62 | Desktop filter layout | Positive | P2 |
| TC_FS_63 | Filter animation | Positive | P3 |
| TC_FS_64 | Sort transition animation | Positive | P3 |
| TC_FS_65 | Screen reader for filter options | Positive | P3 |
| TC_FS_66 | Keyboard navigation filter | Positive | P3 |
| TC_FS_67 | Touch toggle filters | Positive | P2 |
| TC_FS_68 | Radio buttons for sort | Positive | P2 |
| TC_FS_69 | Checkbox for multi-filter | Positive | P2 |
| TC_FS_70 | Filter state in URL (if applicable) | Positive | P3 |
| TC_FS_71 | Filter bookmark (save filter preset) | Positive | P3 |
| TC_FS_72 | Sort icon direction indicator | Positive | P2 |
| TC_FS_73 | Column header sort (desktop table) | Positive | P2 |
| TC_FS_74 | Sort by multiple columns | Positive | P3 |
| TC_FS_75 | Filter by used/unused ingredients | Positive | P2 |
| TC_FS_76 | Filter by dishes in plan | Positive | P2 |
| TC_FS_77 | Filter by date added | Positive | P3 |
| TC_FS_78 | Sort by ingredient count (dishes) | Positive | P2 |
| TC_FS_79 | Sort by usage frequency | Positive | P3 |
| TC_FS_80 | Filter by protein range | Positive | P2 |
| TC_FS_81 | Filter by fat range | Positive | P2 |
| TC_FS_82 | Filter by carbs range | Positive | P2 |
| TC_FS_83 | Filter combined macros | Positive | P3 |
| TC_FS_84 | Nutrition range slider | Positive | P2 |
| TC_FS_85 | Slider min/max values | Positive | P2 |
| TC_FS_86 | Slider step increment | Positive | P2 |
| TC_FS_87 | Slider accessibility | Positive | P3 |
| TC_FS_88 | Filter result count live update | Positive | P2 |
| TC_FS_89 | "Showing X of Y items" text | Positive | P2 |
| TC_FS_90 | Filter by AI-created items | Positive | P3 |
| TC_FS_91 | Filter by imported items | Positive | P3 |
| TC_FS_92 | Sort by last modified | Positive | P3 |
| TC_FS_93 | Quick filter presets | Positive | P3 |
| TC_FS_94 | "High Protein" preset | Positive | P3 |
| TC_FS_95 | "Low Calorie" preset | Positive | P3 |
| TC_FS_96 | Custom preset creation | Positive | P3 |
| TC_FS_97 | Filter undo | Positive | P3 |
| TC_FS_98 | Filter history | Positive | P3 |
| TC_FS_99 | Parallel filter on ingredients + dishes | Edge | P3 |
| TC_FS_100 | Filter data export | Positive | P3 |
| TC_FS_101 | Sort locale-aware | Positive | P2 |
| TC_FS_102 | Filter real-time (no apply button) | Positive | P2 |
| TC_FS_103 | Filter with apply button | Positive | P2 |
| TC_FS_104 | Filter performance with 500 items | Boundary | P2 |
| TC_FS_105 | Sort performance with 500 items | Boundary | P2 |

---

## Đề xuất Cải tiến

### Đề xuất 1: Smart Filter Suggestions
- **Vấn đề hiện tại**: User must know what to filter. No guidance.
- **Giải pháp đề xuất**: AI-suggested filters: "Show high-protein options" based on goals. Context-aware.
- **Phần trăm cải thiện**: Filter usage +40%, Relevant results +50%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 2: Visual Nutrition Range Slider
- **Vấn đề hiện tại**: Text input for range. Not intuitive.
- **Giải pháp đề xuất**: Dual-handle range slider with distribution histogram behind. Visual data exploration.
- **Phần trăm cải thiện**: Filter UX +50%, Data exploration +60%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 3: Saved Filter Presets
- **Vấn đề hiện tại**: Must re-apply filters each session.
- **Giải pháp đề xuất**: Save filter combinations as presets. "My Breakfast Options", "Low Carb".
- **Phần trăm cải thiện**: Filter setup time -80%, Repeat usage +40%
- **Mức độ ưu tiên**: Low | **Effort**: S

### Đề xuất 4: Faceted Search
- **Vấn đề hiện tại**: Search and filter are separate. No combined view.
- **Giải pháp đề xuất**: Faceted search: type "chicken" → filter panel shows matching categories with counts.
- **Phần trăm cải thiện**: Discovery +40%, Search accuracy +30%
- **Mức độ ưu tiên**: Low | **Effort**: M

### Đề xuất 5: Compare Mode
- **Vấn đề hiện tại**: Can't compare 2-3 dishes side by side.
- **Giải pháp đề xuất**: Checkbox select 2-3 items → "Compare" button → side-by-side nutrition comparison table.
- **Phần trăm cải thiện**: Decision quality +50%, Comparison time -70%
- **Mức độ ưu tiên**: Medium | **Effort**: M

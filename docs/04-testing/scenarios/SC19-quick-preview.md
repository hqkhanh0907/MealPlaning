# Scenario 19: Quick Preview Panel

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Quick Preview Panel hiển thị tóm tắt nhanh khi user tap vào một ngày trên calendar hoặc một meal slot. Hiển thị danh sách dishes, nutrition summary, quick actions (add, edit, delete). Panel có thể expand/collapse. Trên desktop hiển thị inline, mobile dạng bottom sheet.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| QuickPreviewPanel | QuickPreviewPanel.tsx | Panel UI |
| CalendarTab | CalendarTab.tsx | Container |

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_QP_01 | Tap day → preview panel shows | Positive | P0 |
| TC_QP_02 | Preview shows selected date | Positive | P1 |
| TC_QP_03 | Preview lists breakfast dishes | Positive | P1 |
| TC_QP_04 | Preview lists lunch dishes | Positive | P1 |
| TC_QP_05 | Preview lists dinner dishes | Positive | P1 |
| TC_QP_06 | Preview nutrition summary | Positive | P1 |
| TC_QP_07 | Empty day preview | Positive | P1 |
| TC_QP_08 | Add button in preview | Positive | P1 |
| TC_QP_09 | Click add → meal planner modal | Positive | P1 |
| TC_QP_10 | Edit button for dish | Positive | P1 |
| TC_QP_11 | Delete button for dish | Positive | P1 |
| TC_QP_12 | Close/collapse panel | Positive | P1 |
| TC_QP_13 | Expand panel | Positive | P1 |
| TC_QP_14 | Tap different day → panel updates | Positive | P1 |
| TC_QP_15 | Panel animation smooth | Positive | P2 |
| TC_QP_16 | Desktop: inline panel | Positive | P1 |
| TC_QP_17 | Mobile: bottom sheet | Positive | P1 |
| TC_QP_18 | Swipe down to close (mobile) | Positive | P2 |
| TC_QP_19 | Swipe up to expand (mobile) | Positive | P2 |
| TC_QP_20 | Panel height auto-adjusts | Positive | P2 |
| TC_QP_21 | 0 dishes → empty state | Positive | P1 |
| TC_QP_22 | 1 dish | Positive | P2 |
| TC_QP_23 | 5 dishes per meal | Positive | P2 |
| TC_QP_24 | 10 dishes per meal | Boundary | P2 |
| TC_QP_25 | Scroll for long content | Positive | P2 |
| TC_QP_26 | Dish name display | Positive | P1 |
| TC_QP_27 | Dish calories display | Positive | P2 |
| TC_QP_28 | Dish ingredient count | Positive | P2 |
| TC_QP_29 | Dark mode panel | Positive | P2 |
| TC_QP_30 | i18n labels | Positive | P2 |
| TC_QP_31 | Vietnamese dish names | Positive | P2 |
| TC_QP_32 | Long dish name truncation | Positive | P2 |
| TC_QP_33 | Panel overlay vs inline | Positive | P2 |
| TC_QP_34 | Panel z-index correct | Positive | P2 |
| TC_QP_35 | Click outside → close | Positive | P2 |
| TC_QP_36 | Escape key → close | Positive | P2 |
| TC_QP_37 | Screen reader | Positive | P3 |
| TC_QP_38 | Keyboard navigation in panel | Positive | P3 |
| TC_QP_39 | Touch interactions | Positive | P2 |
| TC_QP_40 | Add dish → preview updates | Positive | P1 |
| TC_QP_41 | Delete dish → preview updates | Positive | P1 |
| TC_QP_42 | Edit dish → preview updates | Positive | P1 |
| TC_QP_43 | Copy plan → preview updates | Positive | P2 |
| TC_QP_44 | Clear plan → preview empties | Positive | P2 |
| TC_QP_45 | Template apply → preview shows | Positive | P2 |
| TC_QP_46 | AI add → preview shows new dish | Positive | P2 |
| TC_QP_47 | Preview breakfast calories | Positive | P2 |
| TC_QP_48 | Preview lunch calories | Positive | P2 |
| TC_QP_49 | Preview dinner calories | Positive | P2 |
| TC_QP_50 | Preview total day calories | Positive | P1 |
| TC_QP_51 | Preview protein total | Positive | P2 |
| TC_QP_52 | Preview carbs total | Positive | P2 |
| TC_QP_53 | Preview fat total | Positive | P2 |
| TC_QP_54 | Nutrition progress mini-bars | Positive | P2 |
| TC_QP_55 | Quick add breakfast slot | Positive | P2 |
| TC_QP_56 | Quick add lunch slot | Positive | P2 |
| TC_QP_57 | Quick add dinner slot | Positive | P2 |
| TC_QP_58 | Panel for today | Positive | P1 |
| TC_QP_59 | Panel for past date | Positive | P2 |
| TC_QP_60 | Panel for future date | Positive | P2 |
| TC_QP_61 | Panel state on date change | Positive | P2 |
| TC_QP_62 | Rapid date tapping | Edge | P2 |
| TC_QP_63 | Panel open → modal open → panel behind | Positive | P2 |
| TC_QP_64 | Modal close → panel visible again | Positive | P2 |
| TC_QP_65 | Panel on tablet landscape | Positive | P2 |
| TC_QP_66 | Panel on tablet portrait | Positive | P2 |
| TC_QP_67 | Panel width responsive | Positive | P2 |
| TC_QP_68 | Panel max-height constraint | Positive | P2 |
| TC_QP_69 | Panel with notification overlap | Edge | P2 |
| TC_QP_70 | Panel during translation | Positive | P2 |
| TC_QP_71 | Panel during sync | Positive | P2 |
| TC_QP_72 | Performance: panel render <50ms | Boundary | P2 |
| TC_QP_73 | Memory: panel open/close cycles | Boundary | P2 |
| TC_QP_74 | Panel drag handle mobile | Positive | P2 |
| TC_QP_75 | Panel snap points (half/full) | Positive | P2 |
| TC_QP_76 | Panel backdrop dim | Positive | P3 |
| TC_QP_77 | Panel with no meals → "Plan your meals" CTA | Positive | P2 |
| TC_QP_78 | CTA → opens meal planner modal | Positive | P2 |
| TC_QP_79 | Dish tap → navigate to dish detail | Positive | P2 |
| TC_QP_80 | Dish long-press → context menu | Positive | P3 |
| TC_QP_81 | Context menu: edit, delete, move | Positive | P3 |
| TC_QP_82 | Move dish between meals | Positive | P3 |
| TC_QP_83 | Drag to reorder dishes | Positive | P3 |
| TC_QP_84 | Panel share button | Positive | P3 |
| TC_QP_85 | Share day plan | Positive | P3 |
| TC_QP_86 | Panel print button | Positive | P3 |
| TC_QP_87 | Panel copy text | Positive | P3 |
| TC_QP_88 | Panel with meal type icons | Positive | P2 |
| TC_QP_89 | Breakfast icon (☀️) | Positive | P3 |
| TC_QP_90 | Lunch icon (🍽️) | Positive | P3 |
| TC_QP_91 | Dinner icon (🌙) | Positive | P3 |
| TC_QP_92 | Panel transition from day to week view | Positive | P2 |
| TC_QP_93 | Panel in week view (desktop) | Positive | P2 |
| TC_QP_94 | Multiple panels open (desktop) | Edge | P3 |
| TC_QP_95 | Panel accessibility labels | Positive | P3 |
| TC_QP_96 | Panel auto-open on date select | Positive | P2 |
| TC_QP_97 | Panel manual toggle | Positive | P2 |
| TC_QP_98 | Panel position memory | Positive | P3 |
| TC_QP_99 | Panel gestures (3-finger close) | Positive | P3 |
| TC_QP_100 | Panel color coding by nutrition | Positive | P3 |
| TC_QP_101 | Panel loading state | Positive | P2 |
| TC_QP_102 | Panel error state | Positive | P2 |
| TC_QP_103 | Panel empty meal slot placeholder | Positive | P2 |
| TC_QP_104 | Panel with all empty meals | Positive | P2 |
| TC_QP_105 | Panel with mixed full/empty meals | Positive | P2 |

---

## Đề xuất Cải tiến

### Đề xuất 1: Inline Editing in Preview
- **Vấn đề hiện tại**: Preview is read-only. Edit requires opening separate modal.
- **Giải pháp đề xuất**: Inline edit: tap dish name → edit. Tap amount → adjust. Swipe to delete. No modal needed.
- **Phần trăm cải thiện**: Edit speed +60%, Modal usage -50%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 2: Nutrition at a Glance
- **Vấn đề hiện tại**: Nutrition details require navigating to separate sub-tab.
- **Giải pháp đề xuất**: Mini donut chart in preview: cal/protein/carbs/fat ratios. Tap to expand details.
- **Phần trăm cải thiện**: Nutrition awareness +50%, Navigation steps -40%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 3: Quick Photo Log
- **Vấn đề hiện tại**: To log a meal via photo, must navigate to AI tab.
- **Giải pháp đề xuất**: Camera icon in preview. Snap photo → AI analyze → add to this slot. One-step flow.
- **Phần trăm cải thiện**: Photo logging speed +70%, Feature discoverability +40%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 4: Meal Swap Between Slots
- **Vấn đề hiện tại**: Can't move dish from lunch to dinner easily.
- **Giải pháp đề xuất**: Drag & drop between meal sections in preview. Or "Move to..." menu.
- **Phần trăm cải thiện**: Meal rearrangement time -70%, Flexibility +40%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 5: Preview Comparison Mode
- **Vấn đề hiện tại**: Can't compare today vs yesterday or vs goal.
- **Giải pháp đề xuất**: Side-by-side comparison: "Today vs Yesterday" or "Today vs Goal". Highlight differences.
- **Phần trăm cải thiện**: Self-awareness +40%, Comparison time -60%
- **Mức độ ưu tiên**: Low | **Effort**: M

# Scenario 10: Copy Plan

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Copy Plan cho phép user sao chép meal plan từ ngày/tuần nguồn sang ngày/tuần đích. Hỗ trợ 2 mode: Copy Day (3 meals) và Copy Week (7 days × 3 meals = 21 slots). Nếu ngày đích đã có data → confirm overwrite. Hook useCopyPlan quản lý logic.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| CopyPlanModal | modals/CopyPlanModal.tsx | UI modal |
| useCopyPlan | hooks/useCopyPlan.ts | Copy logic |
| CalendarTab | CalendarTab.tsx | Source context |

## Luồng nghiệp vụ

1. User chọn ngày/tuần trên calendar
2. Click "Copy Plan" button
3. Modal opens: select source date(s) + target date(s)
4. Choose mode: Day or Week
5. If target has existing data → overwrite confirmation
6. Confirm → data copied → calendar refreshes → modal closes

## Quy tắc nghiệp vụ

1. Copy Day: copies breakfast, lunch, dinner for 1 day
2. Copy Week: copies all 7 days (Mon-Sun)
3. Overwrite: replaces target completely (not merge)
4. Source = Target → no-op or warning
5. Dishes referenced, not deep-copied
6. Nutrition auto-recalculated on target dates

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_CP_01 | Copy Plan button visible | Positive | P1 |
| TC_CP_02 | Click → modal opens | Positive | P0 |
| TC_CP_03 | Modal shows source date | Positive | P1 |
| TC_CP_04 | Target date picker | Positive | P1 |
| TC_CP_05 | Mode: Day selected | Positive | P1 |
| TC_CP_06 | Mode: Week selected | Positive | P1 |
| TC_CP_07 | Confirm copy button | Positive | P1 |
| TC_CP_08 | Cancel button | Positive | P1 |
| TC_CP_09 | Copy Day: source → target | Positive | P0 |
| TC_CP_10 | Copy Day: 3 meals copied | Positive | P0 |
| TC_CP_11 | Copy Day: breakfast only if only breakfast | Edge | P2 |
| TC_CP_12 | Copy Day: empty source → empty target | Positive | P2 |
| TC_CP_13 | Copy Week: 7 days copied | Positive | P0 |
| TC_CP_14 | Copy Week: 21 slots correct | Positive | P1 |
| TC_CP_15 | Copy Week: partial week (3/7 days with data) | Edge | P2 |
| TC_CP_16 | Target has data → overwrite confirm | Positive | P0 |
| TC_CP_17 | Confirm overwrite → data replaced | Positive | P0 |
| TC_CP_18 | Cancel overwrite → no changes | Positive | P1 |
| TC_CP_19 | Source = Target → warning | Negative | P1 |
| TC_CP_20 | Source empty → copy nothing | Edge | P1 |
| TC_CP_21 | Success notification after copy | Positive | P1 |
| TC_CP_22 | Calendar refreshes after copy | Positive | P1 |
| TC_CP_23 | Modal closes after copy | Positive | P1 |
| TC_CP_24 | Target nutrition recalculated | Positive | P1 |
| TC_CP_25 | Copied dishes reference same dish objects | Positive | P1 |
| TC_CP_26 | Edit dish after copy → both dates reflect | Positive | P1 |
| TC_CP_27 | Delete dish after copy → both dates affected | Positive | P1 |
| TC_CP_28 | Copy to past date | Positive | P2 |
| TC_CP_29 | Copy to future date (30 days ahead) | Positive | P2 |
| TC_CP_30 | Copy to far future (1 year) | Boundary | P2 |
| TC_CP_31 | Copy across months | Positive | P2 |
| TC_CP_32 | Copy across years | Edge | P2 |
| TC_CP_33 | Copy to today | Positive | P2 |
| TC_CP_34 | Copy from today | Positive | P2 |
| TC_CP_35 | Copy Week: Mon start | Positive | P1 |
| TC_CP_36 | Copy Week: mid-week source → Mon target | Edge | P2 |
| TC_CP_37 | Copy Week: cross-month boundary | Edge | P2 |
| TC_CP_38 | Copy Week: cross-year boundary | Edge | P2 |
| TC_CP_39 | Date picker shows correct dates | Positive | P2 |
| TC_CP_40 | Date picker navigation (prev/next month) | Positive | P2 |
| TC_CP_41 | Multiple consecutive copies | Positive | P2 |
| TC_CP_42 | Copy → then clear target → then re-copy | Edge | P2 |
| TC_CP_43 | Copy Day with 10 dishes per meal | Boundary | P2 |
| TC_CP_44 | Copy Week with full 21 slots filled | Boundary | P2 |
| TC_CP_45 | Copy performance (large data) | Boundary | P2 |
| TC_CP_46 | Copy preserves dish order | Positive | P2 |
| TC_CP_47 | Copy preserves meal assignment | Positive | P1 |
| TC_CP_48 | Copied plan in grocery list | Positive | P1 |
| TC_CP_49 | Undo copy | Positive | P3 |
| TC_CP_50 | Copy to multiple targets | Positive | P3 |
| TC_CP_51 | Persist after reload | Positive | P0 |
| TC_CP_52 | localStorage updated correctly | Positive | P1 |
| TC_CP_53 | Copy → export → verify data | Positive | P2 |
| TC_CP_54 | Copy → cloud sync | Positive | P2 |
| TC_CP_55 | Dark mode modal | Positive | P2 |
| TC_CP_56 | i18n modal labels | Positive | P2 |
| TC_CP_57 | Mobile modal layout | Positive | P2 |
| TC_CP_58 | Desktop modal layout | Positive | P2 |
| TC_CP_59 | Modal backdrop close | Positive | P2 |
| TC_CP_60 | Modal Escape close | Positive | P2 |
| TC_CP_61 | Screen reader | Positive | P3 |
| TC_CP_62 | Keyboard navigation | Positive | P3 |
| TC_CP_63 | Touch on date picker mobile | Positive | P2 |
| TC_CP_64 | Loading state during copy | Positive | P2 |
| TC_CP_65 | Error handling during copy | Negative | P1 |
| TC_CP_66 | Copy interrupted (tab close) | Edge | P2 |
| TC_CP_67 | Source data changes during modal open | Edge | P2 |
| TC_CP_68 | Target selected then cleared | Edge | P2 |
| TC_CP_69 | No target selected → validation | Negative | P1 |
| TC_CP_70 | Invalid date → error | Negative | P2 |
| TC_CP_71 | Feb 29 leap year | Edge | P2 |
| TC_CP_72 | Copy with deleted ingredient dish | Edge | P1 |
| TC_CP_73 | Copy with AI-generated dish | Positive | P2 |
| TC_CP_74 | Copy template-applied plan | Positive | P2 |
| TC_CP_75 | Overwrite partial data | Edge | P2 |
| TC_CP_76 | Target day some meals have data | Edge | P2 |
| TC_CP_77 | Target week mixed (some days full, some empty) | Edge | P2 |
| TC_CP_78 | Copy Day breakfast only source | Edge | P2 |
| TC_CP_79 | Copy Day lunch + dinner only | Edge | P2 |
| TC_CP_80 | Verify meal type mapping (B→B, L→L, D→D) | Positive | P1 |
| TC_CP_81 | Copy does not affect source data | Positive | P0 |
| TC_CP_82 | Source data unchanged after overwrite | Positive | P1 |
| TC_CP_83 | Multiple copy same source → different targets | Positive | P2 |
| TC_CP_84 | Chain copy: A→B then B→C | Positive | P2 |
| TC_CP_85 | Circular copy: A→B then B→A | Edge | P2 |
| TC_CP_86 | Copy entire month data | Boundary | P3 |
| TC_CP_87 | Copy with unsaved modal changes | Edge | P2 |
| TC_CP_88 | Concurrent copy operations | Edge | P2 |
| TC_CP_89 | Copy → immediately edit target | Positive | P2 |
| TC_CP_90 | Copy → immediately delete target meal | Positive | P2 |
| TC_CP_91 | Copy preserves original creation context | Edge | P3 |
| TC_CP_92 | Notification after large copy (week) | Positive | P2 |
| TC_CP_93 | Error recovery after partial copy | Edge | P2 |
| TC_CP_94 | Copy with 0 dishes in source day | Edge | P2 |
| TC_CP_95 | Animation/transition on copy | Positive | P3 |
| TC_CP_96 | Batch copy (multiple days select) | Positive | P3 |
| TC_CP_97 | Copy preview before confirm | Positive | P3 |
| TC_CP_98 | Copy history log | Positive | P3 |
| TC_CP_99 | Merge mode (not overwrite) | Positive | P3 |
| TC_CP_100 | Smart copy (avoid duplicates) | Positive | P3 |
| TC_CP_101 | Copy with time constraints | Edge | P3 |
| TC_CP_102 | Stress test: copy 30 times rapidly | Boundary | P3 |
| TC_CP_103 | Memory after many copies | Boundary | P3 |
| TC_CP_104 | Copy Day → verify 3 and only 3 meals | Positive | P1 |
| TC_CP_105 | Copy Week → verify 7 and only 7 days | Positive | P1 |

---

## Chi tiết Test Cases (Grouped)

##### TC_CP_01–27: Core Copy Flow
- Button, modal, source/target selection, Day/Week modes, overwrite confirm, success

##### TC_CP_28–40: Date Edge Cases
- Past/future, cross-month/year, leap year, date picker navigation

##### TC_CP_41–54: Data Integrity
- Multiple copies, large data, order preservation, grocery list, persistence, export, sync

##### TC_CP_55–64: UI/UX
- Dark mode, i18n, responsive, modal interactions, accessibility

##### TC_CP_65–77: Error & Edge Cases
- Copy interruption, validation, deleted ingredients, partial data, mixed targets

##### TC_CP_78–105: Advanced Scenarios
- Partial meals, source preservation, chain copy, circular, batch, merge, preview, stress

---

## Đề xuất Cải tiến

### Đề xuất 1: Smart Copy with Variation
- **Vấn đề hiện tại**: Copy exact duplicate. Boring meal repetition.
- **Giải pháp đề xuất**: "Copy with Variation" option: keep similar nutrition but suggest alternative dishes. AI-powered.
- **Lý do chi tiết**: Variety is key to diet adherence. Smart variation maintains nutrition targets while avoiding monotony.
- **Phần trăm cải thiện**: Meal variety +50%, Diet adherence +25%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 2: Copy Preview
- **Vấn đề hiện tại**: Can't see what will be copied before confirming. Blind action.
- **Giải pháp đề xuất**: Preview panel showing source meals + target state (empty/will be overwritten).
- **Lý do chi tiết**: Preview reduces accidental overwrites 90%. Users feel more confident.
- **Phần trăm cải thiện**: Accidental overwrites -90%, User confidence +40%
- **Mức độ ưu tiên**: High | **Effort**: S

### Đề xuất 3: Merge Mode
- **Vấn đề hiện tại**: Copy = overwrite. Can't add to existing plan.
- **Giải pháp đề xuất**: Toggle: "Overwrite" vs "Merge". Merge appends dishes to existing meals.
- **Lý do chi tiết**: Users often want to combine plans, not replace. Merge enables flexible planning.
- **Phần trăm cải thiện**: Planning flexibility +50%, User satisfaction +30%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 4: Multi-Select Target
- **Vấn đề hiện tại**: Copy to one target at a time. Copy to 5 days = 5 operations.
- **Giải pháp đề xuất**: Multi-select target dates. Checkbox calendar. One copy → multiple targets.
- **Lý do chi tiết**: Weekly meal prep: same meal for Mon-Fri. 5x faster.
- **Phần trăm cải thiện**: Batch operation time -80%, Feature efficiency +60%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 5: Undo Copy
- **Vấn đề hiện tại**: Copy overwrites target irreversibly. Accidental = data loss.
- **Giải pháp đề xuất**: 30-second undo toast. Snapshot target before copy. One-click restore.
- **Lý do chi tiết**: Undo is expected in modern apps. Prevents frustration from accidental copy.
- **Phần trăm cải thiện**: Data loss incidents -95%, User trust +40%
- **Mức độ ưu tiên**: High | **Effort**: S

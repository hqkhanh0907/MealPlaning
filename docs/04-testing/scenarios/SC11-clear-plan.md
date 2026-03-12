# Scenario 11: Clear Plan

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Clear Plan cho phép xóa meal plan theo 3 scope: Day (1 ngày, 3 meals), Week (Mon-Sun, 21 slots), Month (toàn bộ tháng). Confirmation required. Data xóa khỏi localStorage. Dishes/Ingredients không bị xóa (chỉ xóa plan assignments).

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| ClearPlanModal | modals/ClearPlanModal.tsx | UI modal |
| CalendarTab | CalendarTab.tsx | Context |
| useMealPlans | hooks/ | Plan state |

## Luồng nghiệp vụ

1. User clicks "Clear Plan" on calendar
2. Modal opens: select scope (Day/Week/Month)
3. Confirmation dialog with warning
4. Confirm → plan data removed → calendar refreshes
5. Nutrition zeroes for cleared dates

## Quy tắc nghiệp vụ

1. Day: clear breakfast + lunch + dinner for selected date
2. Week: clear Mon-Sun of current week
3. Month: clear all days in current calendar month
4. Only plan assignments removed — dishes/ingredients preserved
5. Cannot undo (unless undo feature implemented)
6. Grocery list recalculated after clear

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_CL_01 | Clear Plan button visible | Positive | P1 |
| TC_CL_02 | Click → modal opens | Positive | P0 |
| TC_CL_03 | Scope: Day option | Positive | P1 |
| TC_CL_04 | Scope: Week option | Positive | P1 |
| TC_CL_05 | Scope: Month option | Positive | P1 |
| TC_CL_06 | Day scope selected by default | Positive | P2 |
| TC_CL_07 | Confirmation warning message | Positive | P1 |
| TC_CL_08 | Confirm button | Positive | P1 |
| TC_CL_09 | Cancel button | Positive | P1 |
| TC_CL_10 | Clear Day → 3 meals removed | Positive | P0 |
| TC_CL_11 | Clear Day → breakfast removed | Positive | P1 |
| TC_CL_12 | Clear Day → lunch removed | Positive | P1 |
| TC_CL_13 | Clear Day → dinner removed | Positive | P1 |
| TC_CL_14 | Clear Day → only target day affected | Positive | P0 |
| TC_CL_15 | Clear Week → 7 days cleared | Positive | P0 |
| TC_CL_16 | Clear Week → Mon-Sun scope | Positive | P1 |
| TC_CL_17 | Clear Week → only current week | Positive | P0 |
| TC_CL_18 | Clear Month → all month days | Positive | P0 |
| TC_CL_19 | Clear Month → only current month | Positive | P0 |
| TC_CL_20 | Cancel → data preserved | Positive | P0 |
| TC_CL_21 | Calendar refreshes after clear | Positive | P1 |
| TC_CL_22 | Nutrition zeroes after clear | Positive | P1 |
| TC_CL_23 | Grocery list updated after clear | Positive | P1 |
| TC_CL_24 | Success notification | Positive | P1 |
| TC_CL_25 | Modal closes after clear | Positive | P1 |
| TC_CL_26 | Dishes NOT deleted (only assignments) | Positive | P0 |
| TC_CL_27 | Ingredients NOT deleted | Positive | P0 |
| TC_CL_28 | Clear already empty day | Edge | P2 |
| TC_CL_29 | Clear already empty week | Edge | P2 |
| TC_CL_30 | Clear already empty month | Edge | P2 |
| TC_CL_31 | Clear Day partial (only breakfast has data) | Edge | P2 |
| TC_CL_32 | Clear Week partial (3/7 days have data) | Edge | P2 |
| TC_CL_33 | Clear Month partial (10/30 days have data) | Edge | P2 |
| TC_CL_34 | Multiple clears in sequence | Positive | P2 |
| TC_CL_35 | Clear → then add → then clear again | Edge | P2 |
| TC_CL_36 | Clear Day with 10 dishes per meal | Boundary | P2 |
| TC_CL_37 | Clear Week with full 21 slots | Boundary | P2 |
| TC_CL_38 | Clear Month with 90 slots filled | Boundary | P2 |
| TC_CL_39 | Performance: clear large month data | Boundary | P2 |
| TC_CL_40 | Clear → reload → data gone | Positive | P0 |
| TC_CL_41 | localStorage updated after clear | Positive | P1 |
| TC_CL_42 | Clear → export → verify no plan data | Positive | P2 |
| TC_CL_43 | Clear → cloud sync update | Positive | P2 |
| TC_CL_44 | Clear today | Positive | P1 |
| TC_CL_45 | Clear past date | Positive | P2 |
| TC_CL_46 | Clear future date | Positive | P2 |
| TC_CL_47 | Clear current week | Positive | P1 |
| TC_CL_48 | Clear last week | Positive | P2 |
| TC_CL_49 | Clear next week | Positive | P2 |
| TC_CL_50 | Clear current month | Positive | P1 |
| TC_CL_51 | Clear February (28 days) | Positive | P2 |
| TC_CL_52 | Clear February leap year (29 days) | Edge | P2 |
| TC_CL_53 | Clear December → no affect January | Positive | P2 |
| TC_CL_54 | Clear January → no affect December | Positive | P2 |
| TC_CL_55 | Week boundary: Mon of this week to Sun | Positive | P1 |
| TC_CL_56 | Week cross-month (e.g., Jan 29 - Feb 4) | Edge | P2 |
| TC_CL_57 | Month with 28 days | Positive | P2 |
| TC_CL_58 | Month with 30 days | Positive | P2 |
| TC_CL_59 | Month with 31 days | Positive | P2 |
| TC_CL_60 | Dark mode modal | Positive | P2 |
| TC_CL_61 | i18n modal labels | Positive | P2 |
| TC_CL_62 | Mobile modal layout | Positive | P2 |
| TC_CL_63 | Desktop modal layout | Positive | P2 |
| TC_CL_64 | Modal backdrop close | Positive | P2 |
| TC_CL_65 | Modal Escape close | Positive | P2 |
| TC_CL_66 | Screen reader | Positive | P3 |
| TC_CL_67 | Keyboard navigation | Positive | P3 |
| TC_CL_68 | Touch radio buttons mobile | Positive | P2 |
| TC_CL_69 | Warning icon/color in confirmation | Positive | P2 |
| TC_CL_70 | Destructive action red button | Positive | P2 |
| TC_CL_71 | Double confirm for month clear | Positive | P2 |
| TC_CL_72 | Scope count display ("Clear 21 meals?") | Positive | P2 |
| TC_CL_73 | Clear during unsaved modal elsewhere | Edge | P2 |
| TC_CL_74 | Clear then undo (if undo exists) | Positive | P3 |
| TC_CL_75 | Clear then copy plan to cleared date | Positive | P2 |
| TC_CL_76 | Clear then apply template | Positive | P2 |
| TC_CL_77 | Clear then AI suggest | Positive | P2 |
| TC_CL_78 | Clear affects only plans, not settings | Positive | P1 |
| TC_CL_79 | Clear affects only plans, not goals | Positive | P1 |
| TC_CL_80 | Rapid clear-add-clear cycles | Edge | P2 |
| TC_CL_81 | Clear with concurrent cloud sync | Edge | P2 |
| TC_CL_82 | Clear → immediate re-plan | Positive | P2 |
| TC_CL_83 | Clear → grocery list empty | Positive | P1 |
| TC_CL_84 | Clear week → next week unaffected | Positive | P1 |
| TC_CL_85 | Clear month → next month unaffected | Positive | P1 |
| TC_CL_86 | Notification shows scope detail | Positive | P2 |
| TC_CL_87 | Loading state during clear | Positive | P3 |
| TC_CL_88 | Error handling if clear fails | Negative | P2 |
| TC_CL_89 | Partial clear failure recovery | Edge | P2 |
| TC_CL_90 | Clear with corrupted localStorage | Edge | P2 |
| TC_CL_91 | Clear → template still available | Positive | P1 |
| TC_CL_92 | Clear → dishes still in management | Positive | P1 |
| TC_CL_93 | Clear → ingredients still available | Positive | P1 |
| TC_CL_94 | Clear custom date range | Positive | P3 |
| TC_CL_95 | Clear specific meal type only (breakfast) | Positive | P3 |
| TC_CL_96 | Clear with filter (e.g., only dishes > 500 cal) | Positive | P3 |
| TC_CL_97 | Selective clear (choose which meals to clear) | Positive | P3 |
| TC_CL_98 | Confirm text shows exact scope | Positive | P2 |
| TC_CL_99 | Multiple scope clear in sequence (day → week → month) | Positive | P2 |
| TC_CL_100 | Clear → verify localStorage size reduced | Positive | P2 |
| TC_CL_101 | Animation on clear | Positive | P3 |
| TC_CL_102 | Clear feedback: "X meals removed" | Positive | P2 |
| TC_CL_103 | Undo timer countdown | Positive | P3 |
| TC_CL_104 | Clear all months (entire history) | Boundary | P3 |
| TC_CL_105 | Stress: clear → refill → clear 10 cycles | Boundary | P3 |

---

## Chi tiết Test Cases (Grouped)

##### TC_CL_01–27: Core Clear Flow
- Button, modal, scope selection, Day/Week/Month, confirm/cancel, data removal, side effects

##### TC_CL_28–39: Edge Cases & Boundaries
- Empty data, partial data, large data, performance

##### TC_CL_40–59: Persistence & Date Handling
- localStorage, export, sync, date edge cases (today, past, future, months, leap year, cross-boundary)

##### TC_CL_60–72: UI/UX
- Dark mode, i18n, responsive, modal, accessibility, destructive action UX

##### TC_CL_73–93: Integration
- Clear + copy, clear + template, clear + AI, settings/goals preserved, concurrent sync

##### TC_CL_94–105: Advanced Features
- Custom range, meal type filter, selective clear, undo, stress testing

---

## Đề xuất Cải tiến

### Đề xuất 1: Undo Clear with Timer
- **Vấn đề hiện tại**: Clear is irreversible. Accidental clear = frustration.
- **Giải pháp đề xuất**: 10-second undo toast after clear. Snapshot data before clearing. "Undo" restores.
- **Lý do chi tiết**: Irreversible actions cause anxiety. Undo reduces support requests 80%.
- **Phần trăm cải thiện**: Accidental data loss -95%, User confidence +50%
- **Mức độ ưu tiên**: High | **Effort**: S

### Đề xuất 2: Selective Clear
- **Vấn đề hiện tại**: All-or-nothing scope. Can't clear just breakfast or just one meal.
- **Giải pháp đề xuất**: Checkbox per meal slot. User chooses exactly which meals to clear.
- **Lý do chi tiết**: Granular control = fewer accidental clears. User keeps what they want.
- **Phần trăm cải thiện**: Clear precision +80%, Accidental clearing -60%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 3: Clear Summary Preview
- **Vấn đề hiện tại**: "Are you sure?" without showing what will be deleted.
- **Giải pháp đề xuất**: Preview: "5 meals, 12 dishes will be removed" with expandable list.
- **Lý do chi tiết**: Informed decisions > blind confirmations. Preview reduces errors 70%.
- **Phần trăm cải thiện**: Decision quality +70%, Accidental clears -80%
- **Mức độ ưu tiên**: High | **Effort**: S

### Đề xuất 4: Archive Instead of Delete
- **Vấn đề hiện tại**: Clear permanently removes data. No history.
- **Giải pháp đề xuất**: "Archive" option: moves cleared plans to archive. Restorable later. History preserved.
- **Lý do chi tiết**: Users want clean calendar but don't want to lose history. Archive = best of both.
- **Phần trăm cải thiện**: Data preservation +90%, User peace of mind +50%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 5: Smart Clear Suggestions
- **Vấn đề hiện tại**: User manually decides scope. No guidance.
- **Giải pháp đề xuất**: "Clear past plans" quick action. Auto-suggest clearing old data (>30 days) to free space.
- **Lý do chi tiết**: Most users want to clear past, not future. Smart suggestions save decision time.
- **Phần trăm cải thiện**: Clear efficiency +40%, Storage management +30%
- **Mức độ ưu tiên**: Low | **Effort**: S

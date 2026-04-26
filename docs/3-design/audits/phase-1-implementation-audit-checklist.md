# Phase 1 Implementation Audit Checklist

Ngày: 2026-04-26
Trạng thái: In progress
Phạm vi: Implementation thật của Phase 1 Management (F-01, F-02 non-AI)

## 1. Source of truth
1. `docs/4-architecture/business-rules.md`
2. `docs/2-requirements/prd.md`
3. `docs/3-design/data-model.md`
4. `docs/3-design/design-system.md`
5. `docs/3-design/mockups/phase-1-ingredient-list.html`
6. `docs/3-design/mockups/phase-1-ingredient-edit.html`
7. `docs/3-design/mockups/phase-1-dish-list.html`
8. `docs/3-design/mockups/phase-1-dish-edit-ingredient-based.html`
9. `docs/5-development/phase-1-management.md` (planning context only)

## 2. Files/screens in audit scope
- `src/app/features/management/management.page.ts`
- `src/app/shared/components/empty-state/empty-state.component.ts`
- `src/app/shared/components/search-toolbar/search-toolbar.component.ts`
- `src/app/shared/components/nutrition-badge/nutrition-badge.component.ts`
- `src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`
- `src/app/shared/components/ingredient-edit-modal/ingredient-edit-modal.component.ts`
- `src/app/shared/components/dish-edit-modal/dish-edit-modal.component.ts`
- related stores/repos/specs

## 3. Current discrepancies found
- [ ] Empty state đang dùng emoji (`🥗`, `🍽️`, default `📦`) thay vì icon theo design-system/Ionicons.
- [ ] Empty state visual hierarchy lệch mockup Phase 1 list screens.
- [ ] Management page thiếu search ở dish list.
- [ ] Ingredient list card/actions/meta/source hierarchy chưa khớp mockup.
- [ ] Dish list card thiếu calories/macros/servings hierarchy theo mockup.
- [ ] Ingredient edit form thiếu unit list, default unit, approximate marker, validation states.
- [ ] Dish edit form chưa đúng flow ingredient-based; còn copy `MVP` nội bộ.
- [ ] Shared/select input patterns có nguy cơ lệch design-system bottom-sheet/select spec.
- [ ] Copy section description còn technical/planning-oriented, không giống UI thực.
- [ ] FAB/icon/action hierarchy chưa khớp mockup.

## 4. Emoji/icon audit
- [ ] Audit toàn bộ implementation Phase 1 để tìm emoji trong UI text / empty state / buttons / labels.
- [ ] Map từng emoji sang Ionicon/design rule tương ứng.
- [ ] Ghi rõ vị trí nào chưa thể thay thế do thiếu rule.

## 5. Coverage checklist
- [ ] Ingredient list: default/search/no-result/empty/delete dialog
- [ ] Ingredient edit: create/edit/validation/unit rows/default/approximate/density/error
- [ ] Dish list: default/search/no-result/empty/delete dialog/card hierarchy
- [ ] Dish edit: create/edit/ingredient rows/derived total/validation/reject/approximate state
- [ ] Dark mode
- [ ] Build APK
- [ ] Install emulator-5554
- [ ] Emulator walkthrough with real interactions
- [ ] 20+ review loops with RCA log

## 6. Open questions / assumptions
- Nếu design rule chưa define icon cụ thể cho một empty state management screen, ưu tiên Ionicons cùng semantic với tab/action và ghi rõ đây là mapping theo design system + mockup context.
- Nếu implementation hiện chưa có full bottom-sheet picker abstraction cho toàn bộ modal selects, chỉ patch trong phạm vi khả thi mà không phá flow hiện có; mọi gap còn lại phải nêu rõ.

# Phase 1 Management Audit + Implementation Execution Plan

> For Hermes: execute document-first, verify against emulator, and keep a loop log with root-cause analysis.

## Goal
Đồng bộ implementation Phase 1 Management với business rules, PRD, data model, design system và mockup; build APK; cài lên emulator-5554; kiểm thử trực tiếp bằng thao tác người dùng; lặp sửa đến khi không còn issue có thể xử lý bằng code hoặc đạt mức khớp cao nhất có thể.

## Source of truth
1. docs/4-architecture/business-rules.md
2. docs/2-requirements/prd.md
3. docs/3-design/data-model.md
4. docs/3-design/design-system.md
5. docs/3-design/mockups/phase-1-ingredient-list.html
6. docs/3-design/mockups/phase-1-ingredient-edit.html
7. docs/3-design/mockups/phase-1-dish-list.html
8. docs/3-design/mockups/phase-1-dish-edit-ingredient-based.html
9. docs/5-development/phase-1-management.md (planning context only)

## Working assumptions
- Phase 1 mockups đã được audit và là nguồn tham chiếu trực quan hợp lệ sau business-rules/PRD/data-model/design-system.
- Mọi giả định mới phát sinh phải được ghi rõ trong báo cáo cuối.
- Chỉ sửa trong phạm vi Phase 1 Management, trừ khi blocker nằm ở shared component/service bắt buộc để đạt đúng behavior/UI.

## High-risk discrepancies already observed
- Management page đang dùng emoji trong empty state thay vì icon theo design system.
- Empty-state/shared modal/list UI còn lệch mạnh so với mockup và design tokens.
- Ingredient form chưa support unit list/default unit/approximate marker như PRD + mockup.
- Dish form hiện mới là MVP 1 ingredient, chưa phản ánh đúng flow ingredient-based Phase 1.
- Copy nhiều chỗ còn kỹ thuật/MVP placeholder, chưa user-facing.
- Cần xác thực lại repository/store/UI integration trước khi vào vòng build + emulator QA.

## Execution steps
1. Audit implementation hiện tại của repositories, stores, shared components, management page, edit modals.
2. Tạo checklist discrepancy + coverage + emoji/icon audit log.
3. Sửa theo lát cắt mỏng:
   - shared tokens/components
   - ingredient list + empty/search/actions
   - ingredient edit modal
   - dish list
   - dish edit modal
   - delete/validation/error states
4. Chạy test/lint/build cho từng lát cắt đủ nghĩa.
5. Build APK chính thức.
6. Install APK lên emulator-5554.
7. Chạy walkthrough thực trên emulator bằng thao tác user-like.
8. Với mỗi mismatch: ghi issue -> RCA -> sửa code -> rebuild -> reinstall -> verify lại.
9. Ghi ít nhất 20 vòng kiểm tra/tinh chỉnh hoặc hơn nếu còn issue.
10. Chạy review độc lập cuối, rồi tổng hợp báo cáo tiếng Việt có evidence.

## Files likely to change
- src/app/features/management/management.page.ts
- src/app/shared/components/empty-state/empty-state.component.ts
- src/app/shared/components/search-toolbar/search-toolbar.component.ts
- src/app/shared/components/nutrition-badge/nutrition-badge.component.ts
- src/app/shared/components/confirm-dialog/confirm-dialog.component.ts
- src/app/shared/components/ingredient-edit-modal/ingredient-edit-modal.component.ts
- src/app/shared/components/dish-edit-modal/dish-edit-modal.component.ts
- src/theme/variables.scss
- related spec files under src/app/**
- docs/6-testing/ or docs/3-design/audits/ for audit log if needed

## Verification requirements
- Relevant unit tests pass.
- npm run lint passes or only pre-existing issues remain and are called out.
- npm run build passes.
- Android APK build passes.
- APK installed on emulator-5554.
- Manual emulator walkthrough performed with user-like actions only.
- Final report includes 20+ loops, emoji/icon audit, RCA, remaining gaps, and readiness verdict.

## Risks
- Existing repo has many uncommitted changes; avoid overwriting unrelated work.
- Emulator input method may interfere with text input; use visual/uiautomator evidence before blaming validation logic.
- Native schema compatibility issues may block launch; if encountered, debug root cause before patching.

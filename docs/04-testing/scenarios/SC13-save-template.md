# Scenario 13: Save Template

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Save Template cho phép user lưu meal plan hiện tại thành template để tái sử dụng. User chọn ngày/tuần → đặt tên → save. Template = immutable snapshot. Saved templates quản lý qua Template Manager (SC12).

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| SaveTemplateModal | modals/SaveTemplateModal.tsx | Save UI |
| useMealTemplate | hooks/useMealTemplate.ts | Template logic |

## Luồng nghiệp vụ

1. User has meals planned on calendar
2. Click "Save as Template"
3. Modal: enter name, select scope (day/week)
4. Save → template snapshot created → stored localStorage
5. Template available in Template Manager

## Quy tắc nghiệp vụ

1. Name required, unique among templates
2. Snapshot: deep copy of meal data at save time
3. Day template: 3 meals; Week template: up to 21 meals
4. Empty plan → cannot save (or save empty template with warning)
5. Template includes dish references at snapshot time

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_ST_01 | Save Template button visible | Positive | P1 |
| TC_ST_02 | Click → modal opens | Positive | P0 |
| TC_ST_03 | Name input field | Positive | P1 |
| TC_ST_04 | Scope: Day option | Positive | P1 |
| TC_ST_05 | Scope: Week option | Positive | P1 |
| TC_ST_06 | Save button | Positive | P1 |
| TC_ST_07 | Cancel button | Positive | P1 |
| TC_ST_08 | Enter name → save → success | Positive | P0 |
| TC_ST_09 | Template appears in manager | Positive | P0 |
| TC_ST_10 | Cancel → no template created | Positive | P1 |
| TC_ST_11 | Day scope: saves 3 meals | Positive | P0 |
| TC_ST_12 | Week scope: saves 7 days | Positive | P0 |
| TC_ST_13 | Template is snapshot (immutable) | Positive | P0 |
| TC_ST_14 | Edit plan after save → template unchanged | Positive | P0 |
| TC_ST_15 | Success notification | Positive | P1 |
| TC_ST_16 | Modal closes after save | Positive | P1 |
| TC_ST_17 | Name empty → validation error | Negative | P0 |
| TC_ST_18 | Name whitespace only → error | Negative | P1 |
| TC_ST_19 | Name duplicate → error | Negative | P0 |
| TC_ST_20 | Name case-insensitive duplicate | Negative | P1 |
| TC_ST_21 | Name max length (100) | Boundary | P1 |
| TC_ST_22 | Name 101 chars → error/truncate | Boundary | P1 |
| TC_ST_23 | Name special characters | Edge | P2 |
| TC_ST_24 | Name Vietnamese diacritics | Positive | P2 |
| TC_ST_25 | Name emoji | Edge | P2 |
| TC_ST_26 | Name HTML injection | Security | P1 |
| TC_ST_27 | Save empty day plan | Edge | P1 |
| TC_ST_28 | Save day with only breakfast | Edge | P2 |
| TC_ST_29 | Save day with all 3 meals full | Positive | P1 |
| TC_ST_30 | Save week with partial data (3/7 days) | Edge | P2 |
| TC_ST_31 | Save week with full data (21 meals) | Positive | P1 |
| TC_ST_32 | Save week with 0 data | Edge | P2 |
| TC_ST_33 | Template contains correct dish IDs | Positive | P1 |
| TC_ST_34 | Template nutrition snapshot accurate | Positive | P1 |
| TC_ST_35 | Multiple saves from same plan | Positive | P2 |
| TC_ST_36 | Save → delete dish → template still has reference | Edge | P1 |
| TC_ST_37 | Save → edit dish → template original data | Positive | P1 |
| TC_ST_38 | Save → delete ingredient → template handles | Edge | P1 |
| TC_ST_39 | 1 template total in storage | Positive | P2 |
| TC_ST_40 | 10 templates saved | Positive | P2 |
| TC_ST_41 | 50 templates — storage limit check | Boundary | P2 |
| TC_ST_42 | Template storage format in localStorage | Positive | P1 |
| TC_ST_43 | Persist after reload | Positive | P0 |
| TC_ST_44 | Export includes saved templates | Positive | P1 |
| TC_ST_45 | Import includes templates | Positive | P1 |
| TC_ST_46 | Cloud sync templates | Positive | P2 |
| TC_ST_47 | Save from today | Positive | P1 |
| TC_ST_48 | Save from past date | Positive | P2 |
| TC_ST_49 | Save from future date | Positive | P2 |
| TC_ST_50 | Save from current week | Positive | P1 |
| TC_ST_51 | Dark mode modal | Positive | P2 |
| TC_ST_52 | i18n labels | Positive | P2 |
| TC_ST_53 | Mobile layout | Positive | P2 |
| TC_ST_54 | Desktop layout | Positive | P2 |
| TC_ST_55 | Modal backdrop close | Positive | P2 |
| TC_ST_56 | Modal Escape close | Positive | P2 |
| TC_ST_57 | Screen reader | Positive | P3 |
| TC_ST_58 | Keyboard navigation | Positive | P3 |
| TC_ST_59 | Autofocus on name field | Positive | P2 |
| TC_ST_60 | Enter key submit | Positive | P2 |
| TC_ST_61 | Tab navigation | Positive | P2 |
| TC_ST_62 | Validation message inline | Positive | P1 |
| TC_ST_63 | Error highlight on name | Positive | P2 |
| TC_ST_64 | Touch interactions mobile | Positive | P2 |
| TC_ST_65 | Template preview before save | Positive | P2 |
| TC_ST_66 | Preview shows meals & nutrition | Positive | P2 |
| TC_ST_67 | Rapid saves (double click) | Edge | P2 |
| TC_ST_68 | Save during sync | Edge | P2 |
| TC_ST_69 | Save with concurrent plan edit | Edge | P2 |
| TC_ST_70 | Template size calculation | Positive | P3 |
| TC_ST_71 | LocalStorage quota warning | Boundary | P2 |
| TC_ST_72 | Save 10 dishes per meal template | Boundary | P2 |
| TC_ST_73 | Save 100 dish references template | Boundary | P2 |
| TC_ST_74 | Template compression (if implemented) | Positive | P3 |
| TC_ST_75 | Save → immediately apply same template | Positive | P2 |
| TC_ST_76 | Save → rename in manager | Positive | P2 |
| TC_ST_77 | Save → delete in manager | Positive | P2 |
| TC_ST_78 | Template metadata (creation date) | Positive | P2 |
| TC_ST_79 | Template metadata (source date range) | Positive | P3 |
| TC_ST_80 | Template description field (optional) | Positive | P3 |
| TC_ST_81 | Template tags/categories | Positive | P3 |
| TC_ST_82 | Template photo/thumbnail | Positive | P3 |
| TC_ST_83 | Template auto-name suggestion | Positive | P3 |
| TC_ST_84 | Save confirmation summary | Positive | P2 |
| TC_ST_85 | Save from AI-planned meals | Positive | P2 |
| TC_ST_86 | Save from copied plan | Positive | P2 |
| TC_ST_87 | Save from template-applied plan | Edge | P2 |
| TC_ST_88 | Save partial day (missing meals) | Edge | P2 |
| TC_ST_89 | Overwrite existing template option | Positive | P3 |
| TC_ST_90 | Version existing template | Positive | P3 |
| TC_ST_91 | Template list update after save | Positive | P1 |
| TC_ST_92 | Save animation/transition | Positive | P3 |
| TC_ST_93 | Loading state during save | Positive | P2 |
| TC_ST_94 | Error handling save failure | Negative | P1 |
| TC_ST_95 | Retry after save failure | Positive | P2 |
| TC_ST_96 | Save with disconnected sync | Edge | P2 |
| TC_ST_97 | Template format backward compatibility | Edge | P3 |
| TC_ST_98 | Template migration on app update | Edge | P3 |
| TC_ST_99 | Save from different calendar views | Positive | P2 |
| TC_ST_100 | Save scope defaults to current context | Positive | P2 |
| TC_ST_101 | Week scope → Monday alignment | Positive | P1 |
| TC_ST_102 | Day scope → current selected date | Positive | P1 |
| TC_ST_103 | Template name suggestion based on content | Positive | P3 |
| TC_ST_104 | Duplicate name → suggest alternative | Positive | P3 |
| TC_ST_105 | Template save count display | Positive | P3 |

---

## Chi tiết Test Cases (Grouped)

##### TC_ST_01–16: Core Save Flow
- Button, modal, name, scope, save, success, template appears in manager

##### TC_ST_17–26: Name Validation
- Empty, whitespace, duplicate, length, special chars, Vietnamese, emoji, injection

##### TC_ST_27–38: Content Variations
- Empty plan, partial meals, full day, partial/full week, immutability after save

##### TC_ST_39–50: Storage & Persistence
- Multiple templates, limits, localStorage format, reload, import/export, sync, dates

##### TC_ST_51–66: UI/UX
- Dark mode, i18n, responsive, modal interactions, accessibility, preview

##### TC_ST_67–105: Edge Cases & Advanced
- Race conditions, storage limits, large templates, integration with other features, metadata, error handling

---

## Đề xuất Cải tiến

### Đề xuất 1: Auto-Save Templates
- **Vấn đề hiện tại**: Manual save only. Good plans may be lost if not explicitly saved.
- **Giải pháp đề xuất**: Auto-save current week as draft template every Sunday. User can promote draft to saved.
- **Lý do chi tiết**: Users often realize later they want a template. Auto-draft captures everything.
- **Phần trăm cải thiện**: Template creation +50%, Plan preservation +40%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 2: Template from Photo
- **Vấn đề hiện tại**: Template creation requires manual planning first.
- **Giải pháp đề xuất**: Take photo of handwritten meal plan → AI converts to template. OCR + AI parsing.
- **Lý do chi tiết**: Many people start with paper planning. Photo-to-template bridges analog to digital.
- **Phần trăm cải thiện**: Template creation accessibility +60%, New user onboarding +30%
- **Mức độ ưu tiên**: Low | **Effort**: L

### Đề xuất 3: Template Tags & Search
- **Vấn đề hiện tại**: Flat list of templates. Hard to find with 10+ templates.
- **Giải pháp đề xuất**: Tags: "High Protein", "Quick Meals", "Weekend". Search + filter by tag.
- **Lý do chi tiết**: Organization improves as template collection grows. Tags = O(1) lookup vs O(n) scroll.
- **Phần trăm cải thiện**: Template discovery -60% time, Organization +50%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 4: Template Nutrition Preview Before Save
- **Vấn đề hiện tại**: Save without seeing overall nutrition summary. Blind save.
- **Giải pháp đề xuất**: Pre-save preview: "This template averages 1800 cal/day, 120g protein". Highlight if off-goal.
- **Lý do chi tiết**: Preview ensures quality templates. Off-goal warning prevents saving bad plans.
- **Phần trăm cải thiện**: Template quality +30%, Off-goal templates -50%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 5: Template Versioning
- **Vấn đề hiện tại**: Save new replaces conceptually. Can't iterate on same template name.
- **Giải pháp đề xuất**: Version history: v1, v2, v3 of "Work Week Plan". Compare versions. Rollback.
- **Lý do chi tiết**: Templates evolve over time. Versioning enables continuous improvement without losing history.
- **Phần trăm cải thiện**: Template evolution +40%, History preservation +60%
- **Mức độ ưu tiên**: Low | **Effort**: M

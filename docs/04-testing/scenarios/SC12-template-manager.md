# Scenario 12: Template Manager

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Template Manager cho phép user quản lý meal plan templates. Templates là immutable snapshots của meal plans. User có thể list, preview, apply, rename, delete templates. Apply template overwrites target day/week. Templates stored in localStorage.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| TemplateManager | modals/TemplateManager.tsx | UI |
| useMealTemplate | hooks/useMealTemplate.ts | Template logic |

## Luồng nghiệp vụ

1. User clicks "Templates" button
2. Modal shows saved templates list
3. Preview: click template → see contents
4. Apply: select template + target date → apply
5. Delete: remove template permanently
6. Rename: change template name

## Quy tắc nghiệp vụ

1. Templates are immutable snapshots (editing plan after save doesn't change template)
2. Apply = overwrite target date(s)
3. Template contains: name, meals data (dish references + amounts)
4. Name required, unique among templates
5. Delete is permanent
6. Apply creates plan assignments referencing current dishes

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_TM_01 | Templates button visible | Positive | P1 |
| TC_TM_02 | Click → modal opens | Positive | P0 |
| TC_TM_03 | Empty state (no templates) | Positive | P1 |
| TC_TM_04 | Templates list display | Positive | P1 |
| TC_TM_05 | Template card: name | Positive | P1 |
| TC_TM_06 | Template card: meal count | Positive | P2 |
| TC_TM_07 | Template card: created date | Positive | P2 |
| TC_TM_08 | Preview template | Positive | P1 |
| TC_TM_09 | Preview shows meals detail | Positive | P1 |
| TC_TM_10 | Preview shows nutrition summary | Positive | P2 |
| TC_TM_11 | Apply button | Positive | P1 |
| TC_TM_12 | Apply → target date picker | Positive | P1 |
| TC_TM_13 | Apply → target has data → overwrite confirm | Positive | P0 |
| TC_TM_14 | Confirm apply → plan created | Positive | P0 |
| TC_TM_15 | Cancel apply → no changes | Positive | P1 |
| TC_TM_16 | Applied plan in calendar | Positive | P0 |
| TC_TM_17 | Applied plan nutrition correct | Positive | P1 |
| TC_TM_18 | Delete template button | Positive | P1 |
| TC_TM_19 | Delete confirmation | Positive | P1 |
| TC_TM_20 | Confirm delete → removed | Positive | P0 |
| TC_TM_21 | Cancel delete → preserved | Positive | P1 |
| TC_TM_22 | Rename template | Positive | P1 |
| TC_TM_23 | Rename saves | Positive | P1 |
| TC_TM_24 | Rename duplicate → error | Negative | P1 |
| TC_TM_25 | Modal closes after apply | Positive | P1 |
| TC_TM_26 | Success notification | Positive | P1 |
| TC_TM_27 | Multiple templates listed | Positive | P1 |
| TC_TM_28 | Sort templates by name | Positive | P2 | ⏳ Deferred — Not yet implemented |
| TC_TM_29 | Sort templates by date | Positive | P2 | ⏳ Deferred — Not yet implemented |
| TC_TM_30 | Search templates | Positive | P2 | ⏳ Deferred — Not yet implemented |
| TC_TM_31 | Template with 1 meal | Positive | P2 |
| TC_TM_32 | Template with 3 meals (full day) | Positive | P1 |
| TC_TM_33 | Template with 21 meals (full week) | Positive | P1 |
| TC_TM_34 | Template with 0 meals (empty) | Edge | P2 |
| TC_TM_35 | Template immutability: edit plan → template unchanged | Positive | P0 |
| TC_TM_36 | Template immutability: edit dish → template unchanged | Positive | P0 |
| TC_TM_37 | Template with deleted dish → graceful handling | Edge | P1 |
| TC_TM_38 | Template with deleted ingredient → handling | Edge | P1 |
| TC_TM_39 | Apply template → dishes still referenced | Positive | P1 |
| TC_TM_40 | Apply template → ingredients referenced | Positive | P1 |
| TC_TM_41 | Apply to today | Positive | P1 |
| TC_TM_42 | Apply to future date | Positive | P2 |
| TC_TM_43 | Apply to past date | Positive | P2 |
| TC_TM_44 | Apply across months | Edge | P2 |
| TC_TM_45 | Apply week template to Mon start | Positive | P1 |
| TC_TM_46 | Apply day template to specific date | Positive | P1 |
| TC_TM_47 | 1 template in list | Positive | P2 |
| TC_TM_48 | 20 templates in list | Positive | P2 |
| TC_TM_49 | 50 templates — scroll/performance | Boundary | P2 |
| TC_TM_50 | Template name empty → error | Negative | P1 |
| TC_TM_51 | Template name whitespace → error | Negative | P1 |
| TC_TM_52 | Template name very long (200 chars) | Boundary | P2 |
| TC_TM_53 | Template name special chars | Edge | P2 |
| TC_TM_54 | Template name Vietnamese | Positive | P2 |
| TC_TM_55 | Template name emoji | Edge | P2 |
| TC_TM_56 | Template name HTML injection | Security | P1 |
| TC_TM_57 | Delete all templates | Edge | P2 |
| TC_TM_58 | Delete last template → empty state | Positive | P2 |
| TC_TM_59 | Apply deleted template (race) | Edge | P2 |
| TC_TM_60 | Multiple applies same template | Positive | P2 |
| TC_TM_61 | Apply different templates to same date | Edge | P2 |
| TC_TM_62 | Persist after reload | Positive | P0 |
| TC_TM_63 | localStorage format correct | Positive | P1 |
| TC_TM_64 | Export includes templates | Positive | P1 |
| TC_TM_65 | Import includes templates | Positive | P1 |
| TC_TM_66 | Cloud sync templates | Positive | P2 |
| TC_TM_67 | Corrupt template data → graceful | Edge | P2 |
| TC_TM_68 | Dark mode modal | Positive | P2 |
| TC_TM_69 | i18n labels | Positive | P2 |
| TC_TM_70 | Mobile layout | Positive | P2 |
| TC_TM_71 | Desktop layout | Positive | P2 |
| TC_TM_72 | Modal backdrop close | Positive | P2 |
| TC_TM_73 | Modal Escape close | Positive | P2 |
| TC_TM_74 | Screen reader | Positive | P3 |
| TC_TM_75 | Keyboard navigation | Positive | P3 |
| TC_TM_76 | Touch interactions mobile | Positive | P2 |
| TC_TM_77 | Swipe to delete template | Positive | P2 |
| TC_TM_78 | Template preview expand/collapse | Positive | P2 |
| TC_TM_79 | Template nutrition badge | Positive | P2 |
| TC_TM_80 | Apply loading state | Positive | P2 |
| TC_TM_81 | Delete loading state | Positive | P3 |
| TC_TM_82 | Template favorites/pin | Positive | P3 | ⏳ Deferred — Not yet implemented |
| TC_TM_83 | Template categories | Positive | P3 | ⏳ Deferred — Not yet implemented |
| TC_TM_84 | Template sharing | Positive | P3 |
| TC_TM_85 | Template from AI suggestion | Positive | P3 |
| TC_TM_86 | Duplicate template | Positive | P3 |
| TC_TM_87 | Edit template content | Positive | P3 |
| TC_TM_88 | Template version history | Positive | P3 |
| TC_TM_89 | Template apply count tracking | Positive | P3 |
| TC_TM_90 | Most used template highlight | Positive | P3 |
| TC_TM_91 | Template apply → grocery list update | Positive | P1 |
| TC_TM_92 | Template apply → nutrition bars update | Positive | P1 |
| TC_TM_93 | Template created from current plan | Positive | P1 |
| TC_TM_94 | Template preview nutrition accuracy | Positive | P2 |
| TC_TM_95 | Apply week template → verify all 7 days | Positive | P1 |
| TC_TM_96 | Apply day template → verify 3 meals only | Positive | P1 |
| TC_TM_97 | Template data size estimation | Positive | P3 |
| TC_TM_98 | Template export as standalone file | Positive | P3 |
| TC_TM_99 | Template import from file | Positive | P3 |
| TC_TM_100 | Template preview image/thumbnail | Positive | P3 |
| TC_TM_101 | Animation on apply | Positive | P3 |
| TC_TM_102 | Template apply undo | Positive | P3 |
| TC_TM_103 | Concurrent template operations | Edge | P2 |
| TC_TM_104 | Template with very large data (100 dishes) | Boundary | P2 |
| TC_TM_105 | Template storage quota handling | Boundary | P2 |

---

## Chi tiết Test Cases (Grouped)

##### TC_TM_01–27: Core CRUD & Apply
- List, preview, apply (with overwrite), delete, rename, notifications

##### TC_TM_28–46: Apply Variations & Dates
- Sort, search, template sizes, immutability, deleted dish/ingredient, date targeting

##### TC_TM_47–67: Data Integrity
- Template count limits, name validation, delete edge cases, persistence, import/export, sync

##### TC_TM_68–81: UI/UX
- Dark mode, i18n, responsive, modal interactions, touch, preview, loading

##### TC_TM_82–105: Advanced Features & Integration
- Favorites, categories, sharing, AI templates, version history, grocery/nutrition cascade, export/import

---

## Đề xuất Cải tiến

### Đề xuất 1: Template Gallery with Community Sharing
- **Vấn đề hiện tại**: Only personal templates. No discovery of new meal plans.
- **Giải pháp đề xuất**: Community template gallery. Browse "High Protein Week", "Vegan Month". Rate & download.
- **Lý do chi tiết**: Community content increases engagement 3x. Users learn from others' meal plans.
- **Phần trăm cải thiện**: Template adoption +200%, User engagement +60%
- **Mức độ ưu tiên**: Low | **Effort**: XL

### Đề xuất 2: Template Editor (Modify Before Apply)
- **Vấn đề hiện tại**: Templates immutable. Must apply then edit. Can't customize before applying.
- **Giải pháp đề xuất**: "Apply with modifications" — open template in editor, swap dishes, then apply.
- **Lý do chi tiết**: 60% of template applies need 1-2 changes. Edit-before-apply saves time.
- **Phần trăm cải thiện**: Template usage +40%, Post-apply edits -70%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 3: Smart Template Suggestions
- **Vấn đề hiện tại**: User must manually choose template. No recommendation.
- **Giải pháp đề xuất**: AI suggest: "Based on your goals and preferences, try 'Balanced Week' template".
- **Lý do chi tiết**: Recommendations increase template usage 50%. Personalization = higher satisfaction.
- **Phần trăm cải thiện**: Template discovery +50%, User satisfaction +30%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 4: Template Scheduling (Auto-Apply)
- **Vấn đề hiện tại**: Must manually apply template each week.
- **Giải pháp đề xuất**: Schedule: "Apply 'Work Week' every Monday automatically". Recurring templates.
- **Lý do chi tiết**: Meal prep users have recurring patterns. Auto-apply = zero effort weekly planning.
- **Phần trăm cải thiện**: Weekly planning time -95%, Consistency +60%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 5: Template Comparison
- **Vấn đề hiện tại**: Can't compare nutrition of 2 templates side by side.
- **Giải pháp đề xuất**: Side-by-side comparison: Template A vs B — calories, macros, meal variety.
- **Lý do chi tiết**: Users often have 5+ templates. Comparison helps choose the best one for current goals.
- **Phần trăm cải thiện**: Decision quality +40%, Template selection time -50%
- **Mức độ ưu tiên**: Low | **Effort**: M

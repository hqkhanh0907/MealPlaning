# Scenario 6: Ingredient CRUD

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Quản lý nguyên liệu (Ingredients) là core data của ứng dụng. Ingredient = { id, name, unit, caloriesPer100, proteinPer100, carbsPer100, fatPer100 }. Management Tab → Ingredients sub-tab cho phép Add/Edit/Delete ingredients. Delete ingredient cascade vào dish (remove từ dish.ingredients). Ingredient dùng trong dish → hiện cảnh báo khi xóa.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| ManagementTab | ManagementTab.tsx | Container tab |
| IngredientList | components/ | List ingredients |
| IngredientForm | components/ | Add/Edit form |
| AddIngredientModal | modals/ | Modal wrapper |
| EditIngredientModal | modals/ | Modal for edit |

## Luồng nghiệp vụ

1. User navigates to Management → Ingredients
2. List shows all ingredients (searchable, filterable)
3. Add: click "+" → modal → fill form → save
4. Edit: click ingredient → modal pre-filled → edit → save
5. Delete: swipe or button → confirm dialog → delete
6. Cascade: deleting ingredient removes it from all dishes

## Quy tắc nghiệp vụ

1. Name required, unique (case-insensitive)
2. Unit required: g | ml | custom string
3. Nutrition values ≥ 0
4. Delete cascade: remove from all dishes' ingredient lists
5. Used ingredient: show warning "Used in X dishes"
6. Validation: name min 1 char, max 100 chars
7. Search: filter by name substring (case-insensitive)

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_ING_01 | Ingredients list hiển thị | Positive | P0 |
| TC_ING_02 | List shows all ingredients | Positive | P1 |
| TC_ING_03 | Empty state khi chưa có ingredient | Positive | P1 |
| TC_ING_04 | Add button visible | Positive | P1 |
| TC_ING_05 | Click add → modal opens | Positive | P0 |
| TC_ING_06 | Modal form fields hiển thị | Positive | P1 |
| TC_ING_07 | Fill name field | Positive | P1 |
| TC_ING_08 | Fill unit field | Positive | P1 |
| TC_ING_09 | Fill calories field | Positive | P1 |
| TC_ING_10 | Fill protein field | Positive | P1 |
| TC_ING_11 | Fill carbs field | Positive | P1 |
| TC_ING_12 | Fill fat field | Positive | P1 |
| TC_ING_13 | Save new ingredient | Positive | P0 |
| TC_ING_14 | Success notification | Positive | P1 |
| TC_ING_15 | New ingredient appears in list | Positive | P0 |
| TC_ING_16 | Modal closes after save | Positive | P1 |
| TC_ING_17 | Cancel modal — no changes | Positive | P1 |
| TC_ING_18 | Edit ingredient click | Positive | P0 |
| TC_ING_19 | Edit modal pre-filled | Positive | P1 |
| TC_ING_20 | Edit name | Positive | P1 |
| TC_ING_21 | Edit unit | Positive | P1 |
| TC_ING_22 | Edit nutrition values | Positive | P1 |
| TC_ING_23 | Save edited ingredient | Positive | P0 |
| TC_ING_24 | Edit reflected in list | Positive | P1 |
| TC_ING_25 | Edit cascades to dishes | Positive | P0 |
| TC_ING_26 | Delete ingredient button | Positive | P1 |
| TC_ING_27 | Delete confirmation dialog | Positive | P1 |
| TC_ING_28 | Confirm delete → removed | Positive | P0 |
| TC_ING_29 | Cancel delete → preserved | Positive | P1 |
| TC_ING_30 | Delete cascade — removed from dishes | Positive | P0 |
| TC_ING_31 | Delete warning — used in dishes | Positive | P1 |
| TC_ING_32 | Delete unused ingredient — no warning | Positive | P2 |
| TC_ING_33 | Name empty → validation error | Negative | P0 |
| TC_ING_34 | Name whitespace only → error | Negative | P1 |
| TC_ING_35 | Name duplicate → error | Negative | P0 |
| TC_ING_36 | Name case-insensitive duplicate | Negative | P1 |
| TC_ING_37 | Name max 100 chars | Boundary | P1 |
| TC_ING_38 | Name 101 chars → truncate/error | Boundary | P1 |
| TC_ING_39 | Name special characters | Edge | P2 |
| TC_ING_40 | Name Vietnamese with diacritics | Positive | P1 |
| TC_ING_41 | Name emoji | Edge | P2 |
| TC_ING_42 | Name HTML injection | Security | P1 |
| TC_ING_43 | Unit empty → validation | Negative | P1 |
| TC_ING_44 | Unit = g | Positive | P1 |
| TC_ING_45 | Unit = ml | Positive | P1 |
| TC_ING_46 | Unit = custom string | Positive | P1 |
| TC_ING_47 | Calories = 0 | Boundary | P2 |
| TC_ING_48 | Calories negative → error | Negative | P1 |
| TC_ING_49 | Calories decimal (2.5) | Positive | P2 |
| TC_ING_50 | Calories very large (10000) | Boundary | P2 |
| TC_ING_51 | Protein = 0 | Boundary | P2 |
| TC_ING_52 | Protein negative → error | Negative | P1 |
| TC_ING_53 | Carbs = 0 | Boundary | P2 |
| TC_ING_54 | Fat = 0 | Boundary | P2 |
| TC_ING_55 | All nutrition = 0 | Boundary | P2 |
| TC_ING_56 | Non-numeric nutrition → error | Negative | P1 |
| TC_ING_57 | Search ingredient by name | Positive | P1 |
| TC_ING_58 | Search case-insensitive | Positive | P2 |
| TC_ING_59 | Search partial match | Positive | P2 |
| TC_ING_60 | Search no results | Positive | P2 |
| TC_ING_61 | Search Vietnamese diacritics | Positive | P2 |
| TC_ING_62 | Clear search → show all | Positive | P2 |
| TC_ING_63 | Sort ingredients by name | Positive | P2 |
| TC_ING_64 | Sort by calories | Positive | P2 |
| TC_ING_65 | Ingredient count display | Positive | P2 |
| TC_ING_66 | Scroll for large list (100+) | Positive | P2 |
| TC_ING_67 | Ingredient card layout | Positive | P2 |
| TC_ING_68 | Ingredient nutrition display | Positive | P2 |
| TC_ING_69 | Dark mode ingredient list | Positive | P2 |
| TC_ING_70 | i18n labels | Positive | P2 |
| TC_ING_71 | Desktop layout | Positive | P2 |
| TC_ING_72 | Mobile layout | Positive | P2 |
| TC_ING_73 | Persist after reload | Positive | P0 |
| TC_ING_74 | LocalStorage format correct | Positive | P1 |
| TC_ING_75 | Data integrity after edit | Positive | P1 |
| TC_ING_76 | Rapid add 10 ingredients | Boundary | P2 |
| TC_ING_77 | 500 ingredients performance | Boundary | P2 |
| TC_ING_78 | Delete all ingredients | Edge | P2 |
| TC_ING_79 | Import ingredients from backup | Positive | P1 |
| TC_ING_80 | Export ingredients | Positive | P1 |
| TC_ING_81 | Cloud sync ingredients | Positive | P2 |
| TC_ING_82 | Add from AI image analysis | Positive | P1 |
| TC_ING_83 | Add from AI suggestion | Positive | P1 |
| TC_ING_84 | Ingredient used in grocery list | Positive | P1 |
| TC_ING_85 | Delete ingredient → grocery list update | Positive | P1 |
| TC_ING_86 | Edit ingredient → dish nutrition cascade | Positive | P1 |
| TC_ING_87 | Edit ingredient → calendar nutrition update | Positive | P1 |
| TC_ING_88 | Undo delete (if supported) | Positive | P3 |
| TC_ING_89 | Batch delete ingredients | Positive | P3 |
| TC_ING_90 | Ingredient category/tag | Positive | P3 |
| TC_ING_91 | Ingredient photo | Positive | P3 |
| TC_ING_92 | Keyboard shortcuts desktop | Positive | P3 |
| TC_ING_93 | Form tab navigation | Positive | P3 |
| TC_ING_94 | Screen reader for list | Positive | P3 |
| TC_ING_95 | Touch hold for actions | Positive | P3 |
| TC_ING_96 | Swipe to delete mobile | Positive | P2 |
| TC_ING_97 | Modal backdrop click close | Positive | P2 |
| TC_ING_98 | Modal escape key close | Positive | P2 |
| TC_ING_99 | Form autofocus on open | Positive | P2 |
| TC_ING_100 | Unsaved changes warning | Positive | P2 |
| TC_ING_101 | Empty fields default to 0 | Edge | P2 |
| TC_ING_102 | Paste text into fields | Positive | P2 |
| TC_ING_103 | Copy ingredient (duplicate) | Positive | P3 |
| TC_ING_104 | Ingredient creation timestamp | Positive | P3 |
| TC_ING_105 | Ingredient usage count display | Positive | P3 |

---

## Chi tiết Test Cases

##### TC_ING_01–17: Add Flow
- Full add ingredient flow from click button → fill form → save → verify in list

##### TC_ING_18–25: Edit Flow
- Click → pre-filled modal → edit fields → save → verify cascade to dishes

##### TC_ING_26–32: Delete Flow
- Delete button → confirmation → cascade → warnings for used ingredients

##### TC_ING_33–56: Validation
- Name: empty, whitespace, duplicate, case-insensitive, length, special chars, Vietnamese, emoji, injection
- Unit: empty, g/ml/custom
- Nutrition: zero, negative, decimal, large, non-numeric

##### TC_ING_57–72: Search, Sort & Display
- Search: case, partial, no results, diacritics, clear
- Sort, count, scroll, card, dark mode, i18n, responsive

##### TC_ING_73–87: Persistence & Integration
- LocalStorage, import/export, sync, AI creation, grocery list, cascade

##### TC_ING_88–105: Advanced & Accessibility
- Undo, batch, category, photo, keyboard, screen reader, touch, modal, form UX

---

## Đề xuất Cải tiến

### Đề xuất 1: Ingredient Database with Auto-Complete
- **Vấn đề hiện tại**: User phải nhập manual nutrition data cho mỗi ingredient — tedious và error-prone.
- **Giải pháp đề xuất**: Built-in database 500+ common ingredients với nutrition data. Auto-complete search khi user gõ tên.
- **Lý do chi tiết**: Manual entry sai nutrition 40% cases. Pre-populated data tăng accuracy + giảm effort 80%.
- **Phần trăm cải thiện**: Data accuracy +60%, Entry time -80%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 2: Barcode Scanner for Ingredients
- **Vấn đề hiện tại**: Packaged food ingredients require manual lookup.
- **Giải pháp đề xuất**: Scan barcode → auto-fill name, unit, nutrition from OpenFoodFacts API.
- **Lý do chi tiết**: 40% of ingredients are packaged. Scan = 100% accurate, 2 seconds vs 2 minutes.
- **Phần trăm cải thiện**: Entry speed +95%, Accuracy +30%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 3: Ingredient Categories/Tags
- **Vấn đề hiện tại**: Flat list of ingredients, hard to find in large collections.
- **Giải pháp đề xuất**: Categorize: Proteins, Vegetables, Grains, Dairy, etc. Color-coded tags. Filter by category.
- **Lý do chi tiết**: Users with 50+ ingredients spend 30s searching. Categories reduce to 5s.
- **Phần trăm cải thiện**: Search time -80%, Organization +60%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 4: Bulk Import from Spreadsheet
- **Vấn đề hiện tại**: Adding 20 ingredients = 20 individual forms. Very slow.
- **Giải pháp đề xuất**: CSV/Excel import. Paste from spreadsheet. Template download.
- **Lý do chi tiết**: New users need 30-50 ingredients to start. Bulk import reduces setup from 1 hour to 2 minutes.
- **Phần trăm cải thiện**: Onboarding time -90%, User activation +40%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 5: Recently Used / Favorites
- **Vấn đề hiện tại**: When adding ingredients to dishes, user scrolls through all. No recency bias.
- **Giải pháp đề xuất**: "Recently Used" section at top. Star favorite ingredients. Sorted by frequency.
- **Lý do chi tiết**: 80% of daily cooking uses 20 ingredients. Quick access to favorites = 60% faster dish creation.
- **Phần trăm cải thiện**: Dish creation time -40%, User satisfaction +30%
- **Mức độ ưu tiên**: Medium | **Effort**: S

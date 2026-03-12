# Scenario 7: Dish CRUD

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Dish management cho phép tạo, sửa, xóa dishes. Dish = { id, name, ingredients: [{ingredientId, amount}] }. Nutrition tính từ ingredients. Dish dùng trong meal plan → không thể xóa (hoặc cảnh báo cascade). Management Tab → Dishes sub-tab.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| ManagementTab | ManagementTab.tsx | Container |
| DishList | components/ | List dishes |
| DishForm | components/ | Add/Edit form |
| AddDishModal | modals/ | Add modal |
| EditDishModal | modals/ | Edit modal |
| DishIngredientSelector | components/ | Pick ingredients |

## Luồng nghiệp vụ

1. User goes to Management → Dishes
2. List shows all dishes with name and nutrition summary
3. Add: click "+" → modal → name + select ingredients + set amounts → save
4. Edit: click dish → edit name/ingredients/amounts → save
5. Delete: click delete → confirm → remove (cascade from plans or block)

## Quy tắc nghiệp vụ

1. Name required, unique
2. At least 1 ingredient required
3. Amount > 0 for each ingredient
4. Nutrition = sum(ingredient.nutritionPer100 × amount / 100) for g/ml, nutritionPerUnit × amount for custom
5. Dish used in plan → warning on delete
6. Edit dish → all plan entries update (reference, not copy)

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_DSH_01 | Dishes tab hiển thị | Positive | P0 |
| TC_DSH_02 | List shows all dishes | Positive | P1 |
| TC_DSH_03 | Empty state | Positive | P1 |
| TC_DSH_04 | Add button visible | Positive | P1 |
| TC_DSH_05 | Click add → modal opens | Positive | P0 |
| TC_DSH_06 | Modal form: name field | Positive | P1 |
| TC_DSH_07 | Modal form: ingredient selector | Positive | P1 |
| TC_DSH_08 | Select ingredient from list | Positive | P1 |
| TC_DSH_09 | Set ingredient amount | Positive | P1 |
| TC_DSH_10 | Add multiple ingredients | Positive | P1 |
| TC_DSH_11 | Remove ingredient from dish | Positive | P1 |
| TC_DSH_12 | Nutrition preview while adding | Positive | P1 |
| TC_DSH_13 | Save new dish | Positive | P0 |
| TC_DSH_14 | Success notification | Positive | P1 |
| TC_DSH_15 | New dish in list | Positive | P0 |
| TC_DSH_16 | Modal closes after save | Positive | P1 |
| TC_DSH_17 | Cancel → no changes | Positive | P1 |
| TC_DSH_18 | Edit dish click | Positive | P0 |
| TC_DSH_19 | Edit modal pre-filled | Positive | P1 |
| TC_DSH_20 | Edit dish name | Positive | P1 |
| TC_DSH_21 | Add ingredient to existing dish | Positive | P1 |
| TC_DSH_22 | Remove ingredient from dish | Positive | P1 |
| TC_DSH_23 | Change ingredient amount | Positive | P1 |
| TC_DSH_24 | Save edited dish | Positive | P0 |
| TC_DSH_25 | Edit reflected in list | Positive | P1 |
| TC_DSH_26 | Edit cascades to plan entries | Positive | P0 |
| TC_DSH_27 | Delete dish button | Positive | P1 |
| TC_DSH_28 | Delete confirmation | Positive | P1 |
| TC_DSH_29 | Confirm delete → removed | Positive | P0 |
| TC_DSH_30 | Cancel delete → preserved | Positive | P1 |
| TC_DSH_31 | Delete used dish → warning | Positive | P0 |
| TC_DSH_32 | Delete unused dish → no warning | Positive | P2 |
| TC_DSH_33 | Delete cascade from plans | Positive | P1 |
| TC_DSH_34 | Name empty → error | Negative | P0 |
| TC_DSH_35 | Name whitespace only → error | Negative | P1 |
| TC_DSH_36 | Name duplicate → error | Negative | P0 |
| TC_DSH_37 | Name case-insensitive duplicate | Negative | P1 |
| TC_DSH_38 | Name max length (100) | Boundary | P1 |
| TC_DSH_39 | Name 101 chars → error | Boundary | P1 |
| TC_DSH_40 | Name special characters | Edge | P2 |
| TC_DSH_41 | Name Vietnamese diacritics | Positive | P1 |
| TC_DSH_42 | Name emoji | Edge | P2 |
| TC_DSH_43 | Name HTML injection | Security | P1 |
| TC_DSH_44 | No ingredients → validation error | Negative | P0 |
| TC_DSH_45 | Amount = 0 → error | Negative | P1 |
| TC_DSH_46 | Amount negative → error | Negative | P1 |
| TC_DSH_47 | Amount decimal (0.5) | Positive | P2 |
| TC_DSH_48 | Amount very large (10000g) | Boundary | P2 |
| TC_DSH_49 | Amount non-numeric → error | Negative | P1 |
| TC_DSH_50 | Duplicate ingredient in dish → prevent | Negative | P1 |
| TC_DSH_51 | Nutrition calc: g unit ingredient | Positive | P1 |
| TC_DSH_52 | Nutrition calc: ml unit ingredient | Positive | P1 |
| TC_DSH_53 | Nutrition calc: custom unit | Positive | P1 |
| TC_DSH_54 | Nutrition updates on amount change | Positive | P1 |
| TC_DSH_55 | Nutrition updates on ingredient add/remove | Positive | P1 |
| TC_DSH_56 | Mixed units in one dish | Positive | P2 |
| TC_DSH_57 | Search dish by name | Positive | P1 |
| TC_DSH_58 | Search case-insensitive | Positive | P2 |
| TC_DSH_59 | Search partial match | Positive | P2 |
| TC_DSH_60 | Search no results | Positive | P2 |
| TC_DSH_61 | Search Vietnamese diacritics | Positive | P2 |
| TC_DSH_62 | Clear search | Positive | P2 |
| TC_DSH_63 | Sort by name | Positive | P2 |
| TC_DSH_64 | Sort by calories | Positive | P2 |
| TC_DSH_65 | Dish count display | Positive | P2 |
| TC_DSH_66 | Scroll large list (100+) | Positive | P2 |
| TC_DSH_67 | Dish card: name + nutrition summary | Positive | P1 |
| TC_DSH_68 | Dish card: ingredient count | Positive | P2 |
| TC_DSH_69 | Dark mode | Positive | P2 |
| TC_DSH_70 | i18n labels | Positive | P2 |
| TC_DSH_71 | Desktop layout | Positive | P2 |
| TC_DSH_72 | Mobile layout | Positive | P2 |
| TC_DSH_73 | Persist after reload | Positive | P0 |
| TC_DSH_74 | LocalStorage format | Positive | P1 |
| TC_DSH_75 | Data integrity after edit | Positive | P1 |
| TC_DSH_76 | Rapid add 10 dishes | Boundary | P2 |
| TC_DSH_77 | 200 dishes performance | Boundary | P2 |
| TC_DSH_78 | Delete all dishes | Edge | P2 |
| TC_DSH_79 | Import dishes from backup | Positive | P1 |
| TC_DSH_80 | Export dishes | Positive | P1 |
| TC_DSH_81 | Cloud sync dishes | Positive | P2 |
| TC_DSH_82 | AI-created dish editable | Positive | P1 |
| TC_DSH_83 | AI image → saved dish editable | Positive | P1 |
| TC_DSH_84 | Dish in grocery list | Positive | P1 |
| TC_DSH_85 | Delete dish → grocery update | Positive | P1 |
| TC_DSH_86 | Edit dish → plan nutrition cascade | Positive | P1 |
| TC_DSH_87 | Ingredient deleted → dish updates | Positive | P1 |
| TC_DSH_88 | Undo delete | Positive | P3 |
| TC_DSH_89 | Batch delete | Positive | P3 |
| TC_DSH_90 | Dish category/tag | Positive | P3 |
| TC_DSH_91 | Dish photo | Positive | P3 |
| TC_DSH_92 | Copy dish (duplicate) | Positive | P3 |
| TC_DSH_93 | Keyboard shortcuts | Positive | P3 |
| TC_DSH_94 | Form tab navigation | Positive | P3 |
| TC_DSH_95 | Screen reader | Positive | P3 |
| TC_DSH_96 | Swipe to delete mobile | Positive | P2 |
| TC_DSH_97 | Modal backdrop close | Positive | P2 |
| TC_DSH_98 | Modal escape close | Positive | P2 |
| TC_DSH_99 | Autofocus on modal open | Positive | P2 |
| TC_DSH_100 | Unsaved changes warning | Positive | P2 |
| TC_DSH_101 | Ingredient search in selector | Positive | P1 |
| TC_DSH_102 | Recently used ingredients first | Positive | P3 |
| TC_DSH_103 | Ingredient amount unit label | Positive | P2 |
| TC_DSH_104 | Dish creation from template | Positive | P2 |
| TC_DSH_105 | Dish version/edit history | Positive | P3 |

---

## Chi tiết Test Cases

##### TC_DSH_01–17: Add Flow
- Navigate → add button → modal → fill form → select ingredients → set amounts → save → verify

##### TC_DSH_18–26: Edit Flow
- Click dish → pre-filled → edit name/ingredients/amounts → save → cascade to plans

##### TC_DSH_27–33: Delete Flow
- Delete → confirm → cascade/warning → verify removal

##### TC_DSH_34–56: Validation & Calculation
- Name validation (empty, duplicate, length, special chars, injection)
- Ingredient validation (none, amount 0/negative/non-numeric, duplicate)
- Nutrition calculation (g, ml, custom, mixed, updates)

##### TC_DSH_57–72: Search, Sort & Display
- Search (case, partial, diacritics), sort, card layout, dark mode, responsive

##### TC_DSH_73–87: Persistence & Integration
- LocalStorage, import/export, sync, AI dishes, grocery, cascade

##### TC_DSH_88–105: Advanced & Accessibility
- Undo, batch, category, photo, copy, keyboard, screen reader, ingredient selector UX

---

## Đề xuất Cải tiến

### Đề xuất 1: Dish Recipe/Instructions Field
- **Vấn đề hiện tại**: Dish chỉ có name + ingredients. No cooking instructions.
- **Giải pháp đề xuất**: Optional rich text field cho recipe steps. Markdown support. Photo per step.
- **Lý do chi tiết**: Users want complete meal planning including cooking. Recipe field makes app self-contained.
- **Phần trăm cải thiện**: App completeness +40%, External app dependency -50%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 2: Dish Templates (Quick Variations)
- **Vấn đề hiện tại**: Similar dishes (Phở gà, Phở bò) require full re-creation.
- **Giải pháp đề xuất**: "Clone & Modify" button. Clone dish, rename, adjust ingredients. Link to parent.
- **Lý do chi tiết**: 30% dishes are variations of others. Clone saves 70% creation time per variation.
- **Phần trăm cải thiện**: Dish creation time -50%, Variation management +60%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 3: Portion Size Adjuster
- **Vấn đề hiện tại**: Dish serves fixed portion. No scaling for 2, 4 people.
- **Giải pháp đề xuất**: Serving size slider (1-10). Ingredients & nutrition auto-scale. Default serving stored.
- **Lý do chi tiết**: Family cooking needs scaling. Manual multiplication error-prone. Auto-scale = accurate portions.
- **Phần trăm cải thiện**: Cooking accuracy +40%, Family planning +60%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 4: Dish Rating & Notes
- **Vấn đề hiện tại**: No way to rate dishes or add cooking notes.
- **Giải pháp đề xuất**: Star rating (1-5) + notes field. Sort by rating. "Favorites" filter.
- **Lý do chi tiết**: Helps plan better meals over time. Avoid repeating poorly-rated dishes.
- **Phần trăm cải thiện**: Meal satisfaction +25%, Planning quality +30%
- **Mức độ ưu tiên**: Low | **Effort**: S

### Đề xuất 5: Smart Ingredient Amount Suggestions
- **Vấn đề hiện tại**: User guesses ingredient amounts. No guidance.
- **Giải pháp đề xuất**: When adding ingredient, suggest typical amount based on dish type. "Typical: 150g chicken for 1 serving".
- **Lý do chi tiết**: New cooks don't know typical amounts. Suggestions reduce nutrition tracking errors 40%.
- **Phần trăm cải thiện**: Amount accuracy +40%, New user confidence +50%
- **Mức độ ưu tiên**: Medium | **Effort**: M

# Scenario 21: AI Suggest Ingredients

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

AI Suggest Ingredients cho phép user nhập tên món ăn → AI (Gemini) gợi ý danh sách nguyên liệu cần thiết kèm lượng ước tính. User review → chọn ingredients → thêm vào dish. Component AISuggestIngredientsPreview.tsx handles UI.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| AISuggestIngredientsPreview | AISuggestIngredientsPreview.tsx | UI |
| geminiService | services/geminiService.ts | AI API |

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_ASI_01 | AI Suggest Ingredients button visible | Positive | P1 |
| TC_ASI_02 | Click → input for dish name | Positive | P0 |
| TC_ASI_03 | Enter dish name → submit | Positive | P0 |
| TC_ASI_04 | Loading state | Positive | P1 |
| TC_ASI_05 | AI returns ingredient list | Positive | P0 |
| TC_ASI_06 | Ingredient: name | Positive | P1 |
| TC_ASI_07 | Ingredient: amount | Positive | P1 |
| TC_ASI_08 | Ingredient: unit | Positive | P1 |
| TC_ASI_09 | Ingredient: nutrition estimate | Positive | P2 |
| TC_ASI_10 | Select ingredient | Positive | P1 |
| TC_ASI_11 | Deselect ingredient | Positive | P1 |
| TC_ASI_12 | Select all | Positive | P1 |
| TC_ASI_13 | Add selected to dish | Positive | P0 |
| TC_ASI_14 | Cancel → no changes | Positive | P1 |
| TC_ASI_15 | Success notification | Positive | P1 |
| TC_ASI_16 | No API key → disabled | Negative | P0 |
| TC_ASI_17 | Empty dish name → error | Negative | P1 |
| TC_ASI_18 | Network error | Negative | P0 |
| TC_ASI_19 | API timeout | Negative | P1 |
| TC_ASI_20 | Invalid response | Negative | P1 |
| TC_ASI_21 | Empty response (0 ingredients) | Edge | P1 |
| TC_ASI_22 | 1 ingredient returned | Positive | P2 |
| TC_ASI_23 | 20 ingredients returned | Positive | P1 |
| TC_ASI_24 | 50 ingredients — scroll | Boundary | P2 |
| TC_ASI_25 | Vietnamese dish name | Positive | P1 |
| TC_ASI_26 | English dish name | Positive | P1 |
| TC_ASI_27 | Mixed language | Edge | P2 |
| TC_ASI_28 | Special characters in name | Edge | P2 |
| TC_ASI_29 | Very long dish name | Boundary | P2 |
| TC_ASI_30 | Dish name XSS attempt | Security | P1 |
| TC_ASI_31 | Response XSS sanitization | Security | P0 |
| TC_ASI_32 | Existing ingredient matching | Positive | P1 |
| TC_ASI_33 | New ingredient auto-creation | Positive | P1 |
| TC_ASI_34 | Case-insensitive matching | Edge | P2 |
| TC_ASI_35 | Edit suggested amount before add | Positive | P1 |
| TC_ASI_36 | Edit suggested unit before add | Positive | P2 |
| TC_ASI_37 | Edit suggested name before add | Positive | P2 |
| TC_ASI_38 | Add → ingredients in dish | Positive | P0 |
| TC_ASI_39 | Add → dish nutrition recalculated | Positive | P1 |
| TC_ASI_40 | Add → ingredient in ingredient list | Positive | P1 |
| TC_ASI_41 | Retry after error | Positive | P1 |
| TC_ASI_42 | Different dish → different suggestions | Positive | P1 |
| TC_ASI_43 | Same dish → consistent suggestions | Positive | P2 |
| TC_ASI_44 | Dark mode | Positive | P2 |
| TC_ASI_45 | i18n labels | Positive | P2 |
| TC_ASI_46 | Mobile layout | Positive | P2 |
| TC_ASI_47 | Desktop layout | Positive | P2 |
| TC_ASI_48 | Screen reader | Positive | P3 |
| TC_ASI_49 | Keyboard navigation | Positive | P3 |
| TC_ASI_50 | Touch select/deselect | Positive | P2 |
| TC_ASI_51 | Checkbox for each ingredient | Positive | P2 |
| TC_ASI_52 | Select count display | Positive | P2 |
| TC_ASI_53 | Ingredient card layout | Positive | P2 |
| TC_ASI_54 | Ingredient nutrition badge | Positive | P2 |
| TC_ASI_55 | Rate limit handling | Negative | P1 |
| TC_ASI_56 | Rapid submit prevention | Edge | P1 |
| TC_ASI_57 | Submit during loading | Edge | P1 |
| TC_ASI_58 | Tab switch during loading | Edge | P2 |
| TC_ASI_59 | Network disconnect during call | Negative | P1 |
| TC_ASI_60 | Partial response handling | Edge | P2 |
| TC_ASI_61 | Response in wrong language | Edge | P2 |
| TC_ASI_62 | Response with unknown units | Edge | P2 |
| TC_ASI_63 | Response with 0 amount | Edge | P2 |
| TC_ASI_64 | Response with negative values | Edge | P2 |
| TC_ASI_65 | Ingredient already in dish → warning | Edge | P1 |
| TC_ASI_66 | Multiple calls for same dish | Edge | P2 |
| TC_ASI_67 | Context-aware (considers existing ingredients) | Positive | P2 |
| TC_ASI_68 | Dietary restriction awareness | Positive | P2 |
| TC_ASI_69 | Portion size context | Positive | P2 |
| TC_ASI_70 | Common Vietnamese dishes accuracy | Positive | P1 |
| TC_ASI_71 | Common Western dishes accuracy | Positive | P2 |
| TC_ASI_72 | Exotic dishes handling | Edge | P2 |
| TC_ASI_73 | Dessert dish | Positive | P2 |
| TC_ASI_74 | Beverage dish | Positive | P2 |
| TC_ASI_75 | Multi-component dish (soup + rice) | Edge | P2 |
| TC_ASI_76 | Add from AI → grocery list update | Positive | P1 |
| TC_ASI_77 | Add from AI → plan nutrition update | Positive | P1 |
| TC_ASI_78 | Undo add (if supported) | Positive | P3 |
| TC_ASI_79 | Suggest while creating new dish | Positive | P1 |
| TC_ASI_80 | Suggest while editing existing dish | Positive | P1 |
| TC_ASI_81 | Integration with dish form | Positive | P1 |
| TC_ASI_82 | Prompt includes existing ingredients context | Positive | P2 |
| TC_ASI_83 | Avoid suggesting duplicates of existing | Positive | P2 |
| TC_ASI_84 | Suggest substitutes option | Positive | P3 |
| TC_ASI_85 | "More suggestions" button | Positive | P3 |
| TC_ASI_86 | Suggestion history | Positive | P3 |
| TC_ASI_87 | Favorite suggestions | Positive | P3 |
| TC_ASI_88 | Cost estimate per ingredient | Positive | P3 |
| TC_ASI_89 | Seasonal availability note | Positive | P3 |
| TC_ASI_90 | Allergen warning | Positive | P2 |
| TC_ASI_91 | Confidence score per suggestion | Positive | P3 |
| TC_ASI_92 | Low confidence highlight | Positive | P3 |
| TC_ASI_93 | Feedback: good/bad suggestion | Positive | P3 |
| TC_ASI_94 | Learn from feedback | Positive | P3 |
| TC_ASI_95 | Offline → show cached suggestions | Edge | P2 |
| TC_ASI_96 | Offline → show disabled message | Negative | P1 |
| TC_ASI_97 | Memory cleanup after response | Boundary | P2 |
| TC_ASI_98 | Large response handling (100 ingredients) | Boundary | P2 |
| TC_ASI_99 | Animation on suggestion arrival | Positive | P3 |
| TC_ASI_100 | Stagger animation for items | Positive | P3 |
| TC_ASI_101 | Loading skeleton | Positive | P2 |
| TC_ASI_102 | Error retry with exponential backoff | Positive | P2 |
| TC_ASI_103 | API key validation before call | Positive | P1 |
| TC_ASI_104 | Concurrent suggestion requests | Edge | P2 |
| TC_ASI_105 | Suggestion cache (same dish → cached) | Positive | P2 |

---

## Đề xuất Cải tiến

### Đề xuất 1: Smart Auto-Complete
- **Vấn đề hiện tại**: User types full dish name. No auto-suggest while typing.
- **Giải pháp đề xuất**: Auto-complete dropdown as user types: recent dishes, popular Vietnamese dishes, AI suggestions.
- **Phần trăm cải thiện**: Input speed +50%, Dish name accuracy +30%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 2: Photo-Based Ingredient Suggestion
- **Vấn đề hiện tại**: Text input only for dish name. 
- **Giải pháp đề xuất**: Take photo → AI identifies dish → suggests ingredients. Visual input faster than text.
- **Phần trăm cải thiện**: Input effort -60%, Suggestion accuracy +20%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 3: Ingredient Substitution
- **Vấn đề hiện tại**: Fixed ingredient list. No alternatives.
- **Giải pháp đề xuất**: For each ingredient, show substitutes: "Instead of cream → coconut milk (lower fat)".
- **Phần trăm cải thiện**: Dietary flexibility +50%, Allergy accommodation +60%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 4: Portion Scaling
- **Vấn đề hiện tại**: Suggestions for 1 serving. No scaling.
- **Giải pháp đề xuất**: Serving selector (1-10). All amounts auto-scale.
- **Phần trăm cải thiện**: Cooking accuracy +40%, Family meal planning +50%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 5: Nutrition-Optimized Suggestions
- **Vấn đề hiện tại**: Suggestions based on taste/tradition only.
- **Giải pháp đề xuất**: Option: "Optimize for protein" → AI adjusts ingredient proportions to meet nutrition goals.
- **Phần trăm cải thiện**: Nutrition goal adherence +40%, Meal optimization +50%
- **Mức độ ưu tiên**: High | **Effort**: M

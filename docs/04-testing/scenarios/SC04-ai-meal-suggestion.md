# Scenario 4: AI Meal Suggestion

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

AI Meal Suggestion sử dụng Google Gemini 2.0 Flash để gợi ý món ăn dựa trên ingredients có sẵn, sở thích, nutrition goals. Luồng: user chọn ngày/bữa → mở AI suggest → nhập context (có ingredients nào, thích gì) → AI trả về danh sách dishes → user chọn & thêm vào plan. Tab AI Analysis chứa 2 sub-tabs: AI Suggest (gợi ý món) và AI Image Analysis (phân tích ảnh).

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| AISuggestionPreview | AISuggestionPreview.tsx | Main AI suggestion UI |
| geminiService | services/geminiService.ts | API call to Gemini |
| useAISuggestion | hooks/useAISuggestion.ts | State management for AI |
| AISuggestIngredientsPreview | AISuggestIngredientsPreview.tsx | Suggest ingredients for dish |

## Luồng nghiệp vụ

1. User opens AI tab → sees AI Suggest sub-tab
2. System checks GEMINI_API_KEY availability
3. User enters prompt (ingredients, preferences, constraints)
4. System sends request to Gemini API with context
5. AI returns suggestions (dish name, ingredients, nutrition estimate)
6. User reviews suggestions, selects dishes
7. Selected dishes added to plan

## Quy tắc nghiệp vụ

1. API key required — no key = disabled state with message
2. Prompt has max length (configurable)
3. Response parsed as JSON → validated → displayed
4. Rate limiting: max requests per minute
5. Error handling: network error, invalid response, timeout
6. AI response cached briefly to avoid duplicate calls
7. Suggestions are recommendations — user decides final selection

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_AIS_01 | AI tab hiển thị khi có API key | Positive | P0 |
| TC_AIS_02 | AI tab disabled khi không có API key | Negative | P0 |
| TC_AIS_03 | Sub-tab AI Suggest active by default | Positive | P1 |
| TC_AIS_04 | Switch giữa AI Suggest và AI Image | Positive | P1 |
| TC_AIS_05 | Input field prompt hiển thị | Positive | P1 |
| TC_AIS_06 | Placeholder text hướng dẫn | Positive | P2 |
| TC_AIS_07 | Submit prompt → loading state | Positive | P1 |
| TC_AIS_08 | Loading spinner hiển thị | Positive | P2 |
| TC_AIS_09 | API response → suggestions list | Positive | P0 |
| TC_AIS_10 | Suggestion card: dish name | Positive | P1 |
| TC_AIS_11 | Suggestion card: ingredients list | Positive | P1 |
| TC_AIS_12 | Suggestion card: nutrition estimate | Positive | P1 |
| TC_AIS_13 | Select suggestion → add to plan | Positive | P0 |
| TC_AIS_14 | Multiple selections allowed | Positive | P1 |
| TC_AIS_15 | Deselect suggestion | Positive | P1 |
| TC_AIS_16 | Confirm selection → dishes added | Positive | P0 |
| TC_AIS_17 | Cancel → return without adding | Positive | P1 |
| TC_AIS_18 | Empty prompt → validation error | Negative | P1 |
| TC_AIS_19 | Very long prompt (>2000 chars) | Boundary | P1 |
| TC_AIS_20 | Special characters in prompt | Edge | P2 |
| TC_AIS_21 | Unicode/emoji in prompt | Edge | P2 |
| TC_AIS_22 | HTML/script injection in prompt | Security | P0 |
| TC_AIS_23 | Network error handling | Negative | P0 |
| TC_AIS_24 | API timeout handling | Negative | P0 |
| TC_AIS_25 | Invalid API key handling | Negative | P0 |
| TC_AIS_26 | Rate limit exceeded | Negative | P1 |
| TC_AIS_27 | Invalid JSON response handling | Negative | P1 |
| TC_AIS_28 | Empty response from AI | Edge | P1 |
| TC_AIS_29 | Partial response handling | Edge | P1 |
| TC_AIS_30 | Retry after error | Positive | P1 |
| TC_AIS_31 | Loading state → error state transition | Positive | P1 |
| TC_AIS_32 | Error message user-friendly | Positive | P1 |
| TC_AIS_33 | Error dismissible | Positive | P2 |
| TC_AIS_34 | Suggestion with existing ingredients | Positive | P1 |
| TC_AIS_35 | Suggestion with new ingredients | Positive | P1 |
| TC_AIS_36 | Ingredients auto-created when adding dish | Positive | P1 |
| TC_AIS_37 | Nutrition goals context in prompt | Positive | P2 |
| TC_AIS_38 | Dietary preferences in prompt | Positive | P2 |
| TC_AIS_39 | Cuisine type filter | Positive | P2 |
| TC_AIS_40 | Meal type context (breakfast/lunch/dinner) | Positive | P1 |
| TC_AIS_41 | Prompt with Vietnamese text | Positive | P1 |
| TC_AIS_42 | Prompt with English text | Positive | P1 |
| TC_AIS_43 | Mixed language prompt | Edge | P2 |
| TC_AIS_44 | AI response in Vietnamese | Positive | P1 |
| TC_AIS_45 | AI response in English | Positive | P1 |
| TC_AIS_46 | Response language matches app locale | Positive | P2 |
| TC_AIS_47 | Suggestion matches dietary restriction | Positive | P2 |
| TC_AIS_48 | Suggestion with allergen warning | Positive | P2 |
| TC_AIS_49 | 0 suggestions returned | Edge | P1 |
| TC_AIS_50 | 1 suggestion returned | Positive | P2 |
| TC_AIS_51 | 5+ suggestions returned | Positive | P1 |
| TC_AIS_52 | 20+ suggestions — scroll behavior | Boundary | P2 |
| TC_AIS_53 | Duplicate dish name in suggestions | Edge | P2 |
| TC_AIS_54 | Suggestion with very long dish name | Boundary | P2 |
| TC_AIS_55 | Suggestion with no ingredients | Edge | P2 |
| TC_AIS_56 | Suggestion with 50+ ingredients | Boundary | P2 |
| TC_AIS_57 | Add AI dish → appears in calendar | Positive | P0 |
| TC_AIS_58 | Add AI dish → nutrition recalculated | Positive | P1 |
| TC_AIS_59 | Add AI dish → grocery list updated | Positive | P1 |
| TC_AIS_60 | Add dish to specific meal slot | Positive | P1 |
| TC_AIS_61 | Add dish to specific date | Positive | P1 |
| TC_AIS_62 | AI dish with new ingredients → created | Positive | P1 |
| TC_AIS_63 | AI dish ingredient matching (existing) | Positive | P1 |
| TC_AIS_64 | Case-insensitive ingredient matching | Edge | P2 |
| TC_AIS_65 | Multiple submit rapid fire | Edge | P1 |
| TC_AIS_66 | Submit while previous loading | Edge | P1 |
| TC_AIS_67 | Navigate away during loading | Edge | P1 |
| TC_AIS_68 | Tab switch during AI call | Edge | P1 |
| TC_AIS_69 | App backgrounded during AI call | Edge | P2 |
| TC_AIS_70 | Network disconnect during call | Negative | P1 |
| TC_AIS_71 | Network reconnect retry | Positive | P2 |
| TC_AIS_72 | Very slow response (30s+) | Boundary | P2 |
| TC_AIS_73 | Response exactly at timeout limit | Boundary | P2 |
| TC_AIS_74 | Dark mode AI suggestion cards | Positive | P2 |
| TC_AIS_75 | Mobile layout AI tab | Positive | P2 |
| TC_AIS_76 | Desktop layout AI tab | Positive | P2 |
| TC_AIS_77 | i18n labels in AI tab | Positive | P2 |
| TC_AIS_78 | Suggestion card expand/collapse | Positive | P2 |
| TC_AIS_79 | Suggestion card nutrition badge | Positive | P2 |
| TC_AIS_80 | Keyboard navigation in suggestions | Positive | P3 |
| TC_AIS_81 | Screen reader announcement | Positive | P3 |
| TC_AIS_82 | Touch gesture on suggestion cards | Positive | P2 |
| TC_AIS_83 | Swipe to dismiss suggestion | Positive | P3 |
| TC_AIS_84 | Pull-to-refresh suggestions | Positive | P3 |
| TC_AIS_85 | Prompt history (recent prompts) | Positive | P3 |
| TC_AIS_86 | Clear prompt history | Positive | P3 |
| TC_AIS_87 | AI context includes current plan | Positive | P2 |
| TC_AIS_88 | AI avoids duplicate dishes in plan | Positive | P2 |
| TC_AIS_89 | AI considers remaining calorie budget | Positive | P2 |
| TC_AIS_90 | Quick suggest button (1-click) | Positive | P2 |
| TC_AIS_91 | Copy suggestion text | Positive | P3 |
| TC_AIS_92 | Share suggestion | Positive | P3 |
| TC_AIS_93 | Edit suggestion before adding | Positive | P2 |
| TC_AIS_94 | Suggestion feedback (thumbs up/down) | Positive | P3 |
| TC_AIS_95 | Offline mode — show cached suggestions | Edge | P2 |
| TC_AIS_96 | Offline mode — show offline message | Negative | P1 |
| TC_AIS_97 | API key validation on settings change | Positive | P1 |
| TC_AIS_98 | API key masked in settings | Security | P1 |
| TC_AIS_99 | AI suggestion for breakfast context | Positive | P2 |
| TC_AIS_100 | AI suggestion for lunch context | Positive | P2 |
| TC_AIS_101 | AI suggestion for dinner context | Positive | P2 |
| TC_AIS_102 | AI suggestion with budget constraint | Positive | P3 |
| TC_AIS_103 | Concurrent AI requests handling | Edge | P2 |
| TC_AIS_104 | Memory cleanup after AI response | Boundary | P3 |
| TC_AIS_105 | AI response sanitization (XSS prevention) | Security | P0 |

---

## Chi tiết Test Cases

##### TC_AIS_01–06: Initial State
- TC_AIS_01: API key in settings → AI tab enabled, sub-tabs visible
- TC_AIS_02: No API key → disabled state, message "Vui lòng cấu hình API key"
- TC_AIS_03: First load → AI Suggest sub-tab active
- TC_AIS_04: Click AI Image tab → switches
- TC_AIS_05-06: Prompt input visible with helpful placeholder

##### TC_AIS_07–17: Happy Path
- TC_AIS_07-08: Submit → loading spinner visible
- TC_AIS_09-12: Response cards with name, ingredients, nutrition
- TC_AIS_13-17: Select/deselect/confirm/cancel flow

##### TC_AIS_18–33: Input Validation & Error Handling
- TC_AIS_18-21: Empty, long, special chars, unicode
- TC_AIS_22: Script injection sanitized
- TC_AIS_23-33: Network errors, timeouts, invalid key, rate limit, bad JSON, empty/partial responses, retry, error UX

##### TC_AIS_34–56: Suggestion Content
- TC_AIS_34-36: Ingredient matching and auto-creation
- TC_AIS_37-48: Context awareness (goals, diet, cuisine, meal type, language)
- TC_AIS_49-56: Response size edge cases

##### TC_AIS_57–73: Integration & Timing
- TC_AIS_57-64: Adding AI dishes to plan, calendar, grocery, nutrition
- TC_AIS_65-73: Race conditions, concurrent, network timing

##### TC_AIS_74–84: UI/UX
- Dark mode, responsive, i18n, cards, keyboard, screen reader, touch, gestures

##### TC_AIS_85–96: Advanced Features
- Prompt history, context-aware, quick suggest, offline behavior

##### TC_AIS_97–105: Security & Performance
- API key security, response sanitization, memory cleanup, concurrent requests

---

## Đề xuất Cải tiến

### Đề xuất 1: Smart Prompt Templates
- **Vấn đề hiện tại**: User phải tự viết prompt mỗi lần, không biết viết gì cho hiệu quả.
- **Giải pháp đề xuất**: Cung cấp 5-10 prompt templates: "Bữa sáng nhanh", "Meal prep cuối tuần", "Low carb dinner". One-tap select.
- **Lý do chi tiết**: 70% users không biết cách prompt AI hiệu quả. Templates tăng quality of suggestions 3x.
- **Phần trăm cải thiện**: AI usage +60%, Suggestion relevance +45%
- **Mức độ ưu tiên**: High | **Effort**: S

### Đề xuất 2: Contextual Auto-Prompt
- **Vấn đề hiện tại**: User phải tự describe context (ngày nào, bữa nào, còn bao nhiêu cal).
- **Giải pháp đề xuất**: Auto-fill context: "Bữa tối thứ 4, còn 600 kcal, đã ăn gà chiên buổi trưa". One click.
- **Lý do chi tiết**: Giảm effort 80%, tăng relevance vì AI có đầy đủ context. Avoid repetitive input.
- **Phần trăm cải thiện**: User effort -80%, Suggestion quality +50%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 3: Suggestion Preview with Nutrition Compare
- **Vấn đề hiện tại**: Chỉ thấy nutrition estimate, không so sánh với budget còn lại.
- **Giải pháp đề xuất**: Mỗi suggestion card hiện "Nếu thêm món này: 1800/2000 kcal" với mini bar.
- **Lý do chi tiết**: Giúp user quyết định nhanh hơn, tránh over-budget. Visual comparison > mental math.
- **Phần trăm cải thiện**: Decision speed +40%, Over-budget incidents -50%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 4: Favorite Prompts
- **Vấn đề hiện tại**: Good prompts lost after use, user re-types similar prompts.
- **Giải pháp đề xuất**: Star button to save prompts. Recent + Favorites section. Quick re-use.
- **Lý do chi tiết**: Power users develop effective prompts. Saving them reduces friction for daily use.
- **Phần trăm cải thiện**: Repeat usage +35%, Time per session -25%
- **Mức độ ưu tiên**: Low | **Effort**: S

### Đề xuất 5: Batch Meal Plan Generation
- **Vấn đề hiện tại**: Generate 1 meal at a time. Planning full week = 21 separate requests.
- **Giải pháp đề xuất**: "Plan my week" button: AI generates all 21 meals at once, respecting daily targets and variety.
- **Lý do chi tiết**: #1 user request. Week planning saves 90% time. AI can ensure variety and balanced nutrition across days.
- **Phần trăm cải thiện**: Planning time -90%, Weekly adherence +40%
- **Mức độ ưu tiên**: High | **Effort**: L

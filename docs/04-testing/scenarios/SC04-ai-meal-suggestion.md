# Scenario 4: AI Meal Suggestion

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

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

## Test Cases (210 TCs)

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
| TC_AIS_106 | startSuggestion mở modal + fetch | Positive | P0 |
| TC_AIS_107 | regenerate fetch mới không mở modal | Positive | P1 |
| TC_AIS_108 | apply selectedMeals cập nhật dayPlans | Positive | P0 |
| TC_AIS_109 | editMeal type trả về meal type | Positive | P1 |
| TC_AIS_110 | close đóng modal cleanup abort | Positive | P1 |
| TC_AIS_111 | AbortController cancel khi close | Positive | P1 |
| TC_AIS_112 | AbortController cancel khi regenerate | Positive | P1 |
| TC_AIS_113 | Abort signal không gây error | Edge | P1 |
| TC_AIS_114 | buildAvailableDishes format đúng | Positive | P2 |
| TC_AIS_115 | fetchSuggestion openModal=true mở | Positive | P1 |
| TC_AIS_116 | fetchSuggestion openModal=false không mở | Positive | P2 |
| TC_AIS_117 | isLoading true trong khi fetching | Positive | P1 |
| TC_AIS_118 | isLoading false sau fetch | Positive | P1 |
| TC_AIS_119 | error state khi fetch fails | Positive | P1 |
| TC_AIS_120 | suggestion state sau success | Positive | P1 |
| TC_AIS_121 | Notification success sau apply | Positive | P1 |
| TC_AIS_122 | Notification error khi fails | Positive | P1 |
| TC_AIS_123 | Hook dependencies dishes change | Positive | P2 |
| TC_AIS_124 | Hook dependencies ingredients change | Positive | P2 |
| TC_AIS_125 | Hook cleanup component unmount | Positive | P1 |
| TC_AIS_126 | Modal render isOpen=true | Positive | P0 |
| TC_AIS_127 | Modal không render isOpen=false | Positive | P1 |
| TC_AIS_128 | Modal loading spinner state | Positive | P1 |
| TC_AIS_129 | Modal error message state | Positive | P1 |
| TC_AIS_130 | Modal success meal cards | Positive | P1 |
| TC_AIS_131 | Meal card breakfast amber color | Positive | P2 |
| TC_AIS_132 | Meal card lunch blue color | Positive | P2 |
| TC_AIS_133 | Meal card dinner indigo color | Positive | P2 |
| TC_AIS_134 | toggleMeal breakfast selection | Positive | P1 |
| TC_AIS_135 | toggleMeal lunch selection | Positive | P1 |
| TC_AIS_136 | toggleMeal dinner selection | Positive | P1 |
| TC_AIS_137 | Select all 3 meals apply all | Positive | P1 |
| TC_AIS_138 | Select 1 meal apply only that | Positive | P1 |
| TC_AIS_139 | Select 0 meals apply disabled | Edge | P1 |
| TC_AIS_140 | nutritionSummary memoized | Positive | P2 |
| TC_AIS_141 | getMealNutrition specific IDs | Positive | P2 |
| TC_AIS_142 | getDishNames localized | Positive | P2 |
| TC_AIS_143 | Regenerate button trigger | Positive | P1 |
| TC_AIS_144 | Edit meal button trigger | Positive | P1 |
| TC_AIS_145 | Apply button trigger onApply | Positive | P0 |
| TC_AIS_146 | Close button trigger onClose | Positive | P1 |
| TC_AIS_147 | AI reasoning text hiển thị | Positive | P2 |
| TC_AIS_148 | Empty suggestion message | Edge | P1 |
| TC_AIS_149 | Modal dark mode styling | Positive | P2 |
| TC_AIS_150 | Modal responsive layout | Positive | P2 |
| TC_AIS_151 | suggestMealPlan targetCalories | Positive | P1 |
| TC_AIS_152 | suggestMealPlan targetProtein | Positive | P1 |
| TC_AIS_153 | suggestMealPlan availableDishes | Positive | P1 |
| TC_AIS_154 | callWithTimeout 30s default | Positive | P1 |
| TC_AIS_155 | callWithTimeout clear sau response | Positive | P2 |
| TC_AIS_156 | callWithTimeout timeout reject | Negative | P1 |
| TC_AIS_157 | withRetry max 2 retries | Positive | P1 |
| TC_AIS_158 | withRetry exponential backoff | Positive | P2 |
| TC_AIS_159 | isRetryableError network true | Positive | P1 |
| TC_AIS_160 | isRetryableError config false | Positive | P1 |
| TC_AIS_161 | parseJSON valid → parsed | Positive | P1 |
| TC_AIS_162 | parseJSON invalid → error | Negative | P1 |
| TC_AIS_163 | isMealPlanSuggestion validator | Positive | P1 |
| TC_AIS_164 | isMealPlanSuggestion missing field | Negative | P1 |
| TC_AIS_165 | Nutrition cache hit skip API | Positive | P1 |
| TC_AIS_166 | Nutrition cache miss API call | Positive | P1 |
| TC_AIS_167 | Nutrition cache TTL 1h expiry | Boundary | P2 |
| TC_AIS_168 | resetAISingleton testing | Positive | P2 |
| TC_AIS_169 | clearNutritionCache testing | Positive | P2 |
| TC_AIS_170 | Smart sampling MAX_PER_SLOT=20 | Positive | P2 |
| TC_AIS_171 | Input sanitization prompt injection | Negative | P0 |
| TC_AIS_172 | logAICall warns slow >10s | Positive | P2 |
| TC_AIS_173 | logAICall logs failed calls | Positive | P2 |
| TC_AIS_174 | suggestMealPlan signal cancel | Positive | P1 |
| TC_AIS_175 | Response validation incomplete | Negative | P1 |
| TC_AIS_176 | Ingredients list từ suggestions | Positive | P1 |
| TC_AIS_177 | Checkbox toggle ingredient | Positive | P1 |
| TC_AIS_178 | Amount input mỗi ingredient | Positive | P1 |
| TC_AIS_179 | handleAmountChange cập nhật | Positive | P1 |
| TC_AIS_180 | handleConfirm validate return | Positive | P0 |
| TC_AIS_181 | fuzzyMatch ingredient tên giống | Positive | P1 |
| TC_AIS_182 | Badge Có sẵn existing ingredient | Positive | P2 |
| TC_AIS_183 | Badge Mới new ingredient | Positive | P2 |
| TC_AIS_184 | Nutrition display per ingredient | Positive | P2 |
| TC_AIS_185 | Empty suggestions empty state | Edge | P1 |
| TC_AIS_186 | selectedCount memo đúng | Positive | P2 |
| TC_AIS_187 | Stable unique keys items | Positive | P2 |
| TC_AIS_188 | Amount input unit display | Positive | P2 |
| TC_AIS_189 | Confirm 0 selected validation | Negative | P1 |
| TC_AIS_190 | All selected confirm all | Positive | P1 |
| TC_AIS_191 | Mix selected confirm only sel | Positive | P1 |
| TC_AIS_192 | Amount=0 validation warning | Edge | P2 |
| TC_AIS_193 | Amount negative không cho phép | Negative | P2 |
| TC_AIS_194 | Very long ingredient name | Boundary | P2 |
| TC_AIS_195 | 50+ ingredients scroll perf | Boundary | P2 |
| TC_AIS_196 | XSS prevention AI response | Negative | P0 |
| TC_AIS_197 | Prompt injection prevention | Negative | P0 |
| TC_AIS_198 | API key not in client logs | Negative | P1 |
| TC_AIS_199 | Large response 100KB handling | Boundary | P2 |
| TC_AIS_200 | Concurrent calls abort previous | Edge | P1 |
| TC_AIS_201 | Memory cleanup modal close | Boundary | P2 |
| TC_AIS_202 | Response parse timeout | Boundary | P2 |
| TC_AIS_203 | AI response undefined fields | Negative | P1 |
| TC_AIS_204 | AI response null values no crash | Negative | P1 |
| TC_AIS_205 | Hook re-render optimization | Boundary | P2 |
| TC_AIS_206 | Modal focus trap | Positive | P2 |
| TC_AIS_207 | Modal Escape close | Positive | P2 |
| TC_AIS_208 | ARIA roles suggestion modal | Positive | P3 |
| TC_AIS_209 | Screen reader loading/error | Positive | P3 |
| TC_AIS_210 | Touch gesture meal cards | Positive | P3 |

---

## Chi tiết Test Cases

##### TC_AIS_01–06: Initial State
- TC_AIS_01: API key in settings → AI tab enabled, sub-tabs visible
- TC_AIS_02: No API key → disabled state, message "Vui lòng cấu hình API key"
- TC_AIS_03: First load → AI Suggest sub-tab active
- TC_AIS_04: Click AI Image tab → switches
- TC_AIS_05-06: Prompt input visible with helpful placeholder
- **Kết quả test thực tế**: | — |


##### TC_AIS_07–17: Happy Path
- TC_AIS_07-08: Submit → loading spinner visible
- TC_AIS_09-12: Response cards with name, ingredients, nutrition
- TC_AIS_13-17: Select/deselect/confirm/cancel flow
- **Kết quả test thực tế**: | — |


##### TC_AIS_18–33: Input Validation & Error Handling
- TC_AIS_18-21: Empty, long, special chars, unicode
- TC_AIS_22: Script injection sanitized
- TC_AIS_23-33: Network errors, timeouts, invalid key, rate limit, bad JSON, empty/partial responses, retry, error UX
- **Kết quả test thực tế**: | — |


##### TC_AIS_34–56: Suggestion Content
- TC_AIS_34-36: Ingredient matching and auto-creation
- TC_AIS_37-48: Context awareness (goals, diet, cuisine, meal type, language)
- TC_AIS_49-56: Response size edge cases
- **Kết quả test thực tế**: | — |


##### TC_AIS_57–73: Integration & Timing
- TC_AIS_57-64: Adding AI dishes to plan, calendar, grocery, nutrition
- TC_AIS_65-73: Race conditions, concurrent, network timing
- **Kết quả test thực tế**: | — |


##### TC_AIS_74–84: UI/UX
- Dark mode, responsive, i18n, cards, keyboard, screen reader, touch, gestures
- **Kết quả test thực tế**: | — |


##### TC_AIS_85–96: Advanced Features
- Prompt history, context-aware, quick suggest, offline behavior
- **Kết quả test thực tế**: | — |


##### TC_AIS_97–105: Security & Performance
- API key security, response sanitization, memory cleanup, concurrent requests

---
- **Kết quả test thực tế**: | — |


##### TC_AIS_106–125: useAISuggestion Hook

##### TC_AIS_106: startSuggestion mở modal + fetch
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: startSuggestion mở modal + fetch
  3. Verify action được thực thi đúng
- **Expected Result**: startSuggestion mở modal + fetch — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_107: regenerate fetch mới không mở modal
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: regenerate fetch mới không mở modal
  3. Verify action được thực thi đúng
- **Expected Result**: regenerate fetch mới không mở modal — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_108: apply selectedMeals cập nhật dayPlans
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Ghi nhận giá trị hiện tại
  2. Thực hiện thay đổi trigger update
  3. Verify giá trị mới đúng sau update
- **Expected Result**: apply selectedMeals cập nhật dayPlans — data/UI cập nhật ngay lập tức, đồng bộ chính xác
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_109: editMeal type trả về meal type
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: editMeal type trả về meal type
  3. Verify kết quả đúng như expected
- **Expected Result**: editMeal type trả về meal type — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_110: close đóng modal cleanup abort
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: close đóng modal cleanup abort
  3. Verify kết quả đúng như expected
- **Expected Result**: close đóng modal cleanup abort — component đóng đúng, state cleanup, không memory leak
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_111: AbortController cancel khi close
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: AbortController cancel khi close
  3. Verify kết quả đúng như expected
- **Expected Result**: AbortController cancel khi close — component đóng đúng, state cleanup, không memory leak
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_112: AbortController cancel khi regenerate
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: AbortController cancel khi regenerate
  3. Verify kết quả đúng như expected
- **Expected Result**: AbortController cancel khi regenerate — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_113: Abort signal không gây error
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: Abort signal không gây error — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_AIS_114: buildAvailableDishes format đúng
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: buildAvailableDishes format đúng
  3. Verify kết quả đúng như expected
- **Expected Result**: buildAvailableDishes format đúng — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_115: fetchSuggestion openModal=true mở
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: fetchSuggestion openModal=true mở
  3. Verify action được thực thi đúng
- **Expected Result**: fetchSuggestion openModal=true mở — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_116: fetchSuggestion openModal=false không mở
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: fetchSuggestion openModal=false không mở
  3. Verify action được thực thi đúng
- **Expected Result**: fetchSuggestion openModal=false không mở — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_117: isLoading true trong khi fetching
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: isLoading true trong khi fetching
  3. Verify kết quả đúng như expected
- **Expected Result**: isLoading true trong khi fetching — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_118: isLoading false sau fetch
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: isLoading false sau fetch
  3. Verify kết quả đúng như expected
- **Expected Result**: isLoading false sau fetch — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_119: error state khi fetch fails
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: error state khi fetch fails — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_120: suggestion state sau success
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: suggestion state sau success
  3. Verify kết quả đúng như expected
- **Expected Result**: suggestion state sau success — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_121: Notification success sau apply
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Thiết lập điều kiện: Notification success sau apply
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: Notification success sau apply — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_122: Notification error khi fails
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Thiết lập điều kiện: Notification error khi fails
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: Notification error khi fails — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_123: Hook dependencies dishes change
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Hook dependencies dishes change
  3. Verify kết quả đúng như expected
- **Expected Result**: Hook dependencies dishes change — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_124: Hook dependencies ingredients change
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Hook dependencies ingredients change
  3. Verify kết quả đúng như expected
- **Expected Result**: Hook dependencies ingredients change — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_125: Hook cleanup component unmount
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Hook cleanup component unmount
  3. Verify kết quả đúng như expected
- **Expected Result**: Hook cleanup component unmount — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |


##### TC_AIS_126–150: AISuggestionPreviewModal

##### TC_AIS_126: Modal render isOpen=true
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Modal render isOpen=true
  3. Verify element visible và nội dung đúng
- **Expected Result**: Modal render isOpen=true — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_127: Modal không render isOpen=false
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Modal không render isOpen=false
  3. Verify element visible và nội dung đúng
- **Expected Result**: Modal không render isOpen=false — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_128: Modal loading spinner state
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Modal loading spinner state
  3. Verify kết quả đúng như expected
- **Expected Result**: Modal loading spinner state — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_129: Modal error message state
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: Modal error message state — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_130: Modal success meal cards
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Modal success meal cards
  3. Verify kết quả đúng như expected
- **Expected Result**: Modal success meal cards — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_131: Meal card breakfast amber color
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Bật chế độ dark mode (nếu applicable)
  2. Quan sát colors và contrast
  3. Verify styling đúng theo design spec
- **Expected Result**: Meal card breakfast amber color — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_132: Meal card lunch blue color
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Bật chế độ dark mode (nếu applicable)
  2. Quan sát colors và contrast
  3. Verify styling đúng theo design spec
- **Expected Result**: Meal card lunch blue color — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_133: Meal card dinner indigo color
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Bật chế độ dark mode (nếu applicable)
  2. Quan sát colors và contrast
  3. Verify styling đúng theo design spec
- **Expected Result**: Meal card dinner indigo color — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_134: toggleMeal breakfast selection
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: toggleMeal breakfast selection — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_135: toggleMeal lunch selection
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: toggleMeal lunch selection — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_136: toggleMeal dinner selection
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: toggleMeal dinner selection — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_137: Select all 3 meals apply all
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Select all 3 meals apply all
  3. Verify kết quả đúng như expected
- **Expected Result**: Select all 3 meals apply all — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_138: Select 1 meal apply only that
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Select 1 meal apply only that
  3. Verify kết quả đúng như expected
- **Expected Result**: Select 1 meal apply only that — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_139: Select 0 meals apply disabled
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Thiết lập điều kiện: Select 0 meals apply disabled
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: Select 0 meals apply disabled — element bị disabled, user không thể tương tác, UI feedback rõ ràng
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_AIS_140: nutritionSummary memoized
- **Pre-conditions**: AI Suggest tab active, API key configured
- **Steps**:
  1. Mount component với initial props
  2. Trigger re-render với props không thay đổi
  3. Verify component không re-render không cần thiết
- **Expected Result**: nutritionSummary memoized — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_141: getMealNutrition specific IDs
- **Pre-conditions**: AI Suggest tab active, API key configured
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: getMealNutrition specific IDs
  3. Verify kết quả đúng như expected
- **Expected Result**: getMealNutrition specific IDs — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_142: getDishNames localized
- **Pre-conditions**: AI Suggest tab active, API key configured
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: getDishNames localized
  3. Verify kết quả đúng như expected
- **Expected Result**: getDishNames localized — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_143: Regenerate button trigger
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: Regenerate button trigger
  3. Verify action được thực thi đúng
- **Expected Result**: Regenerate button trigger — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_144: Edit meal button trigger
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: Edit meal button trigger
  3. Verify action được thực thi đúng
- **Expected Result**: Edit meal button trigger — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_145: Apply button trigger onApply
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: Apply button trigger onApply
  3. Verify action được thực thi đúng
- **Expected Result**: Apply button trigger onApply — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_146: Close button trigger onClose
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến component chứa element cần test
  2. Click/tap vào element: Close button trigger onClose
  3. Verify action được thực thi đúng
- **Expected Result**: Close button trigger onClose — component đóng đúng, state cleanup, không memory leak
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_147: AI reasoning text hiển thị
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: AI reasoning text hiển thị
  3. Verify element visible và nội dung đúng
- **Expected Result**: AI reasoning text hiển thị — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_148: Empty suggestion message
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Empty suggestion message
  3. Verify kết quả đúng như expected
- **Expected Result**: Empty suggestion message — empty state hiển thị đúng, không crash, UI thân thiện
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_AIS_149: Modal dark mode styling
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Bật chế độ dark mode (nếu applicable)
  2. Quan sát colors và contrast
  3. Verify styling đúng theo design spec
- **Expected Result**: Modal dark mode styling — colors/contrast đúng trong dark mode, đọc được rõ ràng
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_150: Modal responsive layout
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Điều chỉnh viewport/device cho phù hợp
  2. Quan sát layout và styling
  3. Verify layout đúng theo breakpoint
- **Expected Result**: Modal responsive layout — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |


##### TC_AIS_151–175: geminiService Deep Tests

##### TC_AIS_151: suggestMealPlan targetCalories
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: suggestMealPlan targetCalories
  3. Verify kết quả đúng như expected
- **Expected Result**: suggestMealPlan targetCalories — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_152: suggestMealPlan targetProtein
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: suggestMealPlan targetProtein
  3. Verify kết quả đúng như expected
- **Expected Result**: suggestMealPlan targetProtein — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_153: suggestMealPlan availableDishes
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: suggestMealPlan availableDishes
  3. Verify kết quả đúng như expected
- **Expected Result**: suggestMealPlan availableDishes — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_154: callWithTimeout 30s default
- **Pre-conditions**: AI Suggest tab active, API key configured
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: callWithTimeout 30s default
  3. Verify kết quả đúng như expected
- **Expected Result**: callWithTimeout 30s default — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_155: callWithTimeout clear sau response
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: callWithTimeout clear sau response
  3. Verify kết quả đúng như expected
- **Expected Result**: callWithTimeout clear sau response — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_156: callWithTimeout timeout reject
- **Pre-conditions**: AI Suggest tab active, API key configured
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: callWithTimeout timeout reject
  3. Verify kết quả đúng như expected
- **Expected Result**: callWithTimeout timeout reject — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIS_157: withRetry max 2 retries
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: withRetry max 2 retries
  3. Verify kết quả đúng như expected
- **Expected Result**: withRetry max 2 retries — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_158: withRetry exponential backoff
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: withRetry exponential backoff
  3. Verify kết quả đúng như expected
- **Expected Result**: withRetry exponential backoff — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_159: isRetryableError network true
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: isRetryableError network true — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_160: isRetryableError config false
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: isRetryableError config false — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_161: parseJSON valid → parsed
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: parseJSON valid → parsed
  3. Verify kết quả đúng như expected
- **Expected Result**: parseJSON valid → parsed — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_162: parseJSON invalid → error
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: parseJSON invalid → error — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIS_163: isMealPlanSuggestion validator
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: isMealPlanSuggestion validator
  3. Verify kết quả đúng như expected
- **Expected Result**: isMealPlanSuggestion validator — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_164: isMealPlanSuggestion missing field
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: isMealPlanSuggestion missing field
  3. Verify kết quả đúng như expected
- **Expected Result**: isMealPlanSuggestion missing field — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIS_165: Nutrition cache hit skip API
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Nutrition cache hit skip API
  3. Verify kết quả đúng như expected
- **Expected Result**: Nutrition cache hit skip API — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_166: Nutrition cache miss API call
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Nutrition cache miss API call
  3. Verify kết quả đúng như expected
- **Expected Result**: Nutrition cache miss API call — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_167: Nutrition cache TTL 1h expiry
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Nutrition cache TTL 1h expiry
  3. Verify kết quả đúng như expected
- **Expected Result**: Nutrition cache TTL 1h expiry — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_AIS_168: resetAISingleton testing
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: resetAISingleton testing
  3. Verify kết quả đúng như expected
- **Expected Result**: resetAISingleton testing — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_169: clearNutritionCache testing
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: clearNutritionCache testing
  3. Verify kết quả đúng như expected
- **Expected Result**: clearNutritionCache testing — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_170: Smart sampling MAX_PER_SLOT=20
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Smart sampling MAX_PER_SLOT=20
  3. Verify kết quả đúng như expected
- **Expected Result**: Smart sampling MAX_PER_SLOT=20 — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_171: Input sanitization prompt injection
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Input sanitization prompt injection
  3. Verify kết quả đúng như expected
- **Expected Result**: Input sanitization prompt injection — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIS_172: logAICall warns slow >10s
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: logAICall warns slow >10s
  3. Verify kết quả đúng như expected
- **Expected Result**: logAICall warns slow >10s — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_173: logAICall logs failed calls
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: logAICall logs failed calls
  3. Verify kết quả đúng như expected
- **Expected Result**: logAICall logs failed calls — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_174: suggestMealPlan signal cancel
- **Pre-conditions**: Test unit cho geminiService functions, mock API responses
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: suggestMealPlan signal cancel
  3. Verify kết quả đúng như expected
- **Expected Result**: suggestMealPlan signal cancel — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_175: Response validation incomplete
- **Pre-conditions**: AI Suggest tab active, API key configured
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Response validation incomplete
  3. Verify kết quả đúng như expected
- **Expected Result**: Response validation incomplete — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |


##### TC_AIS_176–195: AISuggestIngredientsPreview

##### TC_AIS_176: Ingredients list từ suggestions
- **Pre-conditions**: AISuggestIngredientsPreview mở với danh sách suggestions từ AI
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Ingredients list từ suggestions
  3. Verify kết quả đúng như expected
- **Expected Result**: Ingredients list từ suggestions — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_177: Checkbox toggle ingredient
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Quan sát trạng thái ban đầu
  2. Thực hiện toggle/switch action
  3. Verify trạng thái đã thay đổi đúng
- **Expected Result**: Checkbox toggle ingredient — trạng thái chuyển đổi đúng, UI phản ánh state mới
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_178: Amount input mỗi ingredient
- **Pre-conditions**: AISuggestIngredientsPreview mở với danh sách suggestions từ AI
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Amount input mỗi ingredient
  3. Verify kết quả đúng như expected
- **Expected Result**: Amount input mỗi ingredient — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_179: handleAmountChange cập nhật
- **Pre-conditions**: AISuggestIngredientsPreview mở với danh sách suggestions từ AI
- **Steps**:
  1. Ghi nhận giá trị hiện tại
  2. Thực hiện thay đổi trigger update
  3. Verify giá trị mới đúng sau update
- **Expected Result**: handleAmountChange cập nhật — data/UI cập nhật ngay lập tức, đồng bộ chính xác
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_180: handleConfirm validate return
- **Pre-conditions**: AI Suggest tab active, API key configured
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: handleConfirm validate return
  3. Verify kết quả đúng như expected
- **Expected Result**: handleConfirm validate return — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_181: fuzzyMatch ingredient tên giống
- **Pre-conditions**: AISuggestIngredientsPreview mở với danh sách suggestions từ AI
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: fuzzyMatch ingredient tên giống
  3. Verify kết quả đúng như expected
- **Expected Result**: fuzzyMatch ingredient tên giống — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_182: Badge Có sẵn existing ingredient
- **Pre-conditions**: AISuggestIngredientsPreview mở với danh sách suggestions từ AI
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Badge Có sẵn existing ingredient
  3. Verify kết quả đúng như expected
- **Expected Result**: Badge Có sẵn existing ingredient — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_183: Badge Mới new ingredient
- **Pre-conditions**: AISuggestIngredientsPreview mở với danh sách suggestions từ AI
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Badge Mới new ingredient
  3. Verify kết quả đúng như expected
- **Expected Result**: Badge Mới new ingredient — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_184: Nutrition display per ingredient
- **Pre-conditions**: AISuggestIngredientsPreview mở với danh sách suggestions từ AI
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Nutrition display per ingredient
  3. Verify element visible và nội dung đúng
- **Expected Result**: Nutrition display per ingredient — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_185: Empty suggestions empty state
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Empty suggestions empty state
  3. Verify kết quả đúng như expected
- **Expected Result**: Empty suggestions empty state — empty state hiển thị đúng, không crash, UI thân thiện
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_AIS_186: selectedCount memo đúng
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Mount component với initial props
  2. Trigger re-render với props không thay đổi
  3. Verify component không re-render không cần thiết
- **Expected Result**: selectedCount memo đúng — kết quả tính toán chính xác, không lỗi precision
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_187: Stable unique keys items
- **Pre-conditions**: AISuggestIngredientsPreview mở với danh sách suggestions từ AI
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Stable unique keys items
  3. Verify kết quả đúng như expected
- **Expected Result**: Stable unique keys items — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_188: Amount input unit display
- **Pre-conditions**: AISuggestIngredientsPreview mở với danh sách suggestions từ AI
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Amount input unit display
  3. Verify element visible và nội dung đúng
- **Expected Result**: Amount input unit display — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_189: Confirm 0 selected validation
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Confirm 0 selected validation
  3. Verify kết quả đúng như expected
- **Expected Result**: Confirm 0 selected validation — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIS_190: All selected confirm all
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: All selected confirm all
  3. Verify kết quả đúng như expected
- **Expected Result**: All selected confirm all — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_191: Mix selected confirm only sel
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Mix selected confirm only sel
  3. Verify kết quả đúng như expected
- **Expected Result**: Mix selected confirm only sel — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_192: Amount=0 validation warning
- **Pre-conditions**: AISuggestIngredientsPreview mở với danh sách suggestions từ AI
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Amount=0 validation warning
  3. Verify kết quả đúng như expected
- **Expected Result**: Amount=0 validation warning — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_AIS_193: Amount negative không cho phép
- **Pre-conditions**: AISuggestIngredientsPreview mở với danh sách suggestions từ AI
- **Steps**:
  1. Thiết lập điều kiện: Amount negative không cho phép
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: Amount negative không cho phép — element bị disabled, user không thể tương tác, UI feedback rõ ràng
- **Priority**: P2 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIS_194: Very long ingredient name
- **Pre-conditions**: AISuggestIngredientsPreview mở với danh sách suggestions từ AI
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Very long ingredient name
  3. Verify kết quả đúng như expected
- **Expected Result**: Very long ingredient name — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_AIS_195: 50+ ingredients scroll perf
- **Pre-conditions**: AISuggestIngredientsPreview mở với danh sách suggestions từ AI
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: 50+ ingredients scroll perf
  3. Verify kết quả đúng như expected
- **Expected Result**: 50+ ingredients scroll perf — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |


##### TC_AIS_196–210: Security & Performance

##### TC_AIS_196: XSS prevention AI response
- **Pre-conditions**: AI suggestion flow active, testing security/performance/accessibility
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: XSS prevention AI response
  3. Verify kết quả đúng như expected
- **Expected Result**: XSS prevention AI response — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIS_197: Prompt injection prevention
- **Pre-conditions**: AI suggestion flow active, testing security/performance/accessibility
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Prompt injection prevention
  3. Verify kết quả đúng như expected
- **Expected Result**: Prompt injection prevention — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P0 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIS_198: API key not in client logs
- **Pre-conditions**: AI suggestion flow active, testing security/performance/accessibility
- **Steps**:
  1. Thiết lập điều kiện: API key not in client logs
  2. Thử thực hiện action bị restrict
  3. Verify action bị chặn/disabled đúng
- **Expected Result**: API key not in client logs — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIS_199: Large response 100KB handling
- **Pre-conditions**: AI Suggest tab active, API key configured
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Large response 100KB handling
  3. Verify kết quả đúng như expected
- **Expected Result**: Large response 100KB handling — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_AIS_200: Concurrent calls abort previous
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Concurrent calls abort previous
  3. Verify kết quả đúng như expected
- **Expected Result**: Concurrent calls abort previous — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Edge
- **Kết quả test thực tế**: | — |

##### TC_AIS_201: Memory cleanup modal close
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Mount component với initial props
  2. Trigger re-render với props không thay đổi
  3. Verify component không re-render không cần thiết
- **Expected Result**: Memory cleanup modal close — component đóng đúng, state cleanup, không memory leak
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_AIS_202: Response parse timeout
- **Pre-conditions**: AI suggestion flow active, testing security/performance/accessibility
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Response parse timeout
  3. Verify kết quả đúng như expected
- **Expected Result**: Response parse timeout — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_AIS_203: AI response undefined fields
- **Pre-conditions**: AI suggestion flow active, testing security/performance/accessibility
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: AI response undefined fields
  3. Verify kết quả đúng như expected
- **Expected Result**: AI response undefined fields — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIS_204: AI response null values no crash
- **Pre-conditions**: AI suggestion flow active, testing security/performance/accessibility
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: AI response null values no crash — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P1 | **Type**: Negative
- **Kết quả test thực tế**: | — |

##### TC_AIS_205: Hook re-render optimization
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Mở component/feature liên quan
  2. Quan sát UI element: Hook re-render optimization
  3. Verify element visible và nội dung đúng
- **Expected Result**: Hook re-render optimization — UI element hiển thị đúng, đầy đủ thông tin, không lỗi visual
- **Priority**: P2 | **Type**: Boundary
- **Kết quả test thực tế**: | — |

##### TC_AIS_206: Modal focus trap
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Modal focus trap
  3. Verify kết quả đúng như expected
- **Expected Result**: Modal focus trap — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_207: Modal Escape close
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Modal Escape close
  3. Verify kết quả đúng như expected
- **Expected Result**: Modal Escape close — component đóng đúng, state cleanup, không memory leak
- **Priority**: P2 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_208: ARIA roles suggestion modal
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: ARIA roles suggestion modal
  3. Verify kết quả đúng như expected
- **Expected Result**: ARIA roles suggestion modal — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_209: Screen reader loading/error
- **Pre-conditions**: useAISuggestion hook initialized, GEMINI_API_KEY configured, dishes/ingredients available
- **Steps**:
  1. Thiết lập điều kiện lỗi/edge case
  2. Trigger action gây lỗi
  3. Verify app xử lý gracefully, không crash
- **Expected Result**: Screen reader loading/error — app xử lý gracefully, hiển thị error message phù hợp, không crash
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

##### TC_AIS_210: Touch gesture meal cards
- **Pre-conditions**: AISuggestionPreviewModal mở với suggestion data từ AI, isOpen=true
- **Steps**:
  1. Navigate đến feature/component cần test
  2. Thực hiện action: Touch gesture meal cards
  3. Verify kết quả đúng như expected
- **Expected Result**: Touch gesture meal cards — hoạt động chính xác như mô tả, không lỗi, UI/data consistent
- **Priority**: P3 | **Type**: Positive
- **Kết quả test thực tế**: | — |

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

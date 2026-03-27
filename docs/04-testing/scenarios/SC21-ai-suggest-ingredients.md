# Scenario 21: AI Suggest Ingredients

**Version:** 2.0  
**Date:** 2026-03-15  
**Total Test Cases:** 210

---

## Mô tả tổng quan

AI Suggest Ingredients cho phép sử dụng AI (Gemini API) để gợi ý nguyên liệu cho món ăn. Component AISuggestIngredientsPreview hiển thị danh sách gợi ý với checkbox selection. useAISuggestion hook quản lý logic gọi API. geminiService xử lý: analyzeDishImage() phân tích ảnh, suggestMealPlan() gợi ý kế hoạch bữa ăn. Trả về SuggestedDishIngredient[]: name, amount, unit, calories, protein, carbs, fat, fiber. Hỗ trợ fuzzy matching với ingredients hiện có, edit trước accept, retry logic với exponential backoff (max 2 retries), timeout 30s, AbortController cancellation.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|--------|
| AISuggestIngredientsPreview | components/modals/AISuggestIngredientsPreview.tsx | Modal UI: suggestion list, checkbox, edit, accept/reject |
| useAISuggestion | hooks/useAISuggestion.ts | Suggestion logic: API call, retry, abort, state |
| geminiService | services/geminiService.ts | Gemini API: analyzeDishImage(), suggestMealPlan() |
| AISuggestionPreviewModal | components/modals/AISuggestionPreviewModal.tsx | Meal plan suggestion preview |

## Luồng nghiệp vụ

1. User mở form thêm/sửa dish → nút AI Suggest hiển thị
2. User nhập tên dish hoặc upload ảnh
3. Click AI Suggest → geminiService gọi API
4. Loading state hiển thị (spinner, 'Đang phân tích...')
5. Response → AISuggestIngredientsPreview modal hiển thị danh sách
6. User select/deselect, edit amounts/nutrition
7. Accept → onConfirm(ConfirmedSuggestion[]) → thêm vào form
8. Error → retry up to 2 times → error message

## Quy tắc nghiệp vụ

1. API key Gemini required (nếu không có → nút disabled)
2. Timeout: 30s → AbortController abort
3. Retry: exponential backoff (1s, 2s), max 2 retries
4. NotFoodImageError khi ảnh không phải thức ăn
5. Fuzzy match: so sánh suggestion name với existing ingredients
6. SuggestedDishIngredient: name, amount, unit, calories, protein, carbs, fat, fiber
7. MealPlanSuggestion: breakfastDishIds, lunchDishIds, dinnerDishIds, reasoning
8. User có thể edit amount, unit, nutrition trước khi accept
9. Accept button enabled khi ≥1 suggestion selected

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|---|---|---|---|
| TC_AI_001 | Nút AI Suggest hiển thị trong form thêm dish | Positive | P0 |
| TC_AI_002 | Nút AI Suggest trong form sửa dish | Positive | P1 |
| TC_AI_003 | Nút AI Suggest trong form thêm ingredient | Positive | P1 |
| TC_AI_004 | Nút AI enabled khi có API key | Positive | P0 |
| TC_AI_005 | Nút AI disabled khi không có API key | Negative | P1 |
| TC_AI_006 | Click nút AI trigger API call | Positive | P0 |
| TC_AI_007 | Nút AI loading state (disabled khi đang gọi) | Positive | P1 |
| TC_AI_008 | Nút AI tooltip text | Positive | P2 |
| TC_AI_009 | Nút AI trên mobile layout | Positive | P2 |
| TC_AI_010 | Nút AI trên desktop layout | Positive | P2 |
| TC_AI_011 | Nút AI dark mode | Positive | P2 |
| TC_AI_012 | Nút AI i18n label tiếng Việt | Positive | P2 |
| TC_AI_013 | Click AI khi form rỗng (không có dish name) | Edge | P2 |
| TC_AI_014 | Click AI khi đã có dish name | Positive | P1 |
| TC_AI_015 | Click AI khi đã có ảnh dish | Positive | P0 |
| TC_AI_016 | Nút AI accessible bằng keyboard | Positive | P3 |
| TC_AI_017 | Nút AI trong ingredient form: gợi ý nutrition | Positive | P1 |
| TC_AI_018 | Multiple clicks AI → chỉ 1 request | Positive | P1 |
| TC_AI_019 | Nút AI icon (✨ hoặc 🤖) | Positive | P2 |
| TC_AI_020 | Nút AI position trong form layout | Positive | P2 |
| TC_AI_021 | AI suggest cho dish 'Cơm tấm' | Positive | P1 |
| TC_AI_022 | AI suggest cho dish 'Bún chả Hà Nội' | Positive | P1 |
| TC_AI_023 | AI suggest cho dish 'Salad Caesar' | Positive | P2 |
| TC_AI_024 | AI suggest khi dish name tiếng Anh | Positive | P2 |
| TC_AI_025 | AI suggest khi dish name mơ hồ | Edge | P2 |
| TC_AI_026 | Loading spinner hiển thị khi gọi API | Positive | P0 |
| TC_AI_027 | Loading text 'Đang phân tích...' | Positive | P1 |
| TC_AI_028 | Loading skeleton cho suggestion list | Positive | P2 |
| TC_AI_029 | Cancel button hiển thị khi loading | Positive | P1 |
| TC_AI_030 | Click Cancel → abort request | Positive | P1 |
| TC_AI_031 | Loading 1 giây | Positive | P2 |
| TC_AI_032 | Loading 5 giây | Positive | P2 |
| TC_AI_033 | Loading 10 giây | Positive | P2 |
| TC_AI_034 | Loading 25 giây (gần timeout) | Boundary | P2 |
| TC_AI_035 | Loading > 30 giây → timeout | Negative | P0 |
| TC_AI_036 | Loading accessibility: aria-busy | Positive | P3 |
| TC_AI_037 | Loading dark mode | Positive | P2 |
| TC_AI_038 | Loading trên slow network | Boundary | P2 |
| TC_AI_039 | Loading progress percentage (nếu có) | Positive | P3 |
| TC_AI_040 | Loading không block form interactions | Positive | P2 |
| TC_AI_041 | Suggestion list hiển thị sau API response | Positive | P0 |
| TC_AI_042 | Mỗi suggestion hiển thị tên ingredient | Positive | P0 |
| TC_AI_043 | Suggestion hiển thị amount | Positive | P1 |
| TC_AI_044 | Suggestion hiển thị unit | Positive | P1 |
| TC_AI_045 | Suggestion hiển thị calories | Positive | P1 |
| TC_AI_046 | Suggestion hiển thị protein | Positive | P1 |
| TC_AI_047 | Suggestion hiển thị carbs | Positive | P2 |
| TC_AI_048 | Suggestion hiển thị fat | Positive | P2 |
| TC_AI_049 | Suggestion hiển thị fiber | Positive | P2 |
| TC_AI_050 | Suggestion count = 1 | Positive | P2 |
| TC_AI_051 | Suggestion count = 3 | Positive | P1 |
| TC_AI_052 | Suggestion count = 5 | Positive | P1 |
| TC_AI_053 | Suggestion count = 10 | Positive | P2 |
| TC_AI_054 | Suggestion cho 'Phở bò' | Positive | P0 |
| TC_AI_055 | Suggestion cho 'Bún bò Huế' | Positive | P1 |
| TC_AI_056 | Suggestion cho 'Cơm chiên dương châu' | Positive | P1 |
| TC_AI_057 | Suggestion cho 'Gỏi cuốn' | Positive | P1 |
| TC_AI_058 | Suggestion cho 'Bánh mì thịt' | Positive | P1 |
| TC_AI_059 | Suggestion cho ingredient hiếm | Edge | P2 |
| TC_AI_060 | Suggestion layout mobile | Positive | P2 |
| TC_AI_061 | Suggestion layout desktop | Positive | P2 |
| TC_AI_062 | Suggestion dark mode | Positive | P2 |
| TC_AI_063 | Suggestion Vietnamese ingredient names | Positive | P0 |
| TC_AI_064 | Long ingredient name display | Positive | P2 |
| TC_AI_065 | Suggestion total nutrition calculated | Positive | P1 |
| TC_AI_066 | Select all suggestions | Positive | P1 |
| TC_AI_067 | Deselect all suggestions | Positive | P1 |
| TC_AI_068 | Select individual suggestion | Positive | P0 |
| TC_AI_069 | Deselect individual suggestion | Positive | P1 |
| TC_AI_070 | Accept button enabled khi ≥1 selected | Positive | P0 |
| TC_AI_071 | Accept button disabled khi 0 selected | Positive | P1 |
| TC_AI_072 | Accept → gọi onConfirm callback | Positive | P0 |
| TC_AI_073 | Reject/Cancel → modal đóng | Positive | P0 |
| TC_AI_074 | Partial accept: chọn 2/5 | Positive | P1 |
| TC_AI_075 | Accept count badge hiển thị | Positive | P2 |
| TC_AI_076 | Checkbox UI cho selection | Positive | P1 |
| TC_AI_077 | Select/deselect animation | Positive | P3 |
| TC_AI_078 | Selected items highlighted | Positive | P2 |
| TC_AI_079 | Accept → form ingredients updated | Positive | P0 |
| TC_AI_080 | Accept → modal đóng | Positive | P1 |
| TC_AI_081 | Cancel khi có selections → confirm discard | Positive | P2 |
| TC_AI_082 | Select keyboard: Space toggle | Positive | P3 |
| TC_AI_083 | Select accessibility: aria-checked | Positive | P3 |
| TC_AI_084 | Accept dark mode UI | Positive | P2 |
| TC_AI_085 | Accept responsive mobile | Positive | P2 |
| TC_AI_086 | Edit amount trước accept | Positive | P1 |
| TC_AI_087 | Edit unit trước accept | Positive | P1 |
| TC_AI_088 | Edit calories trước accept | Positive | P2 |
| TC_AI_089 | Edit protein trước accept | Positive | P2 |
| TC_AI_090 | Edit carbs trước accept | Positive | P2 |
| TC_AI_091 | Edit fat trước accept | Positive | P2 |
| TC_AI_092 | Edit name trước accept | Positive | P2 |
| TC_AI_093 | Edit clears original AI value | Positive | P2 |
| TC_AI_094 | Validation: amount > 0 | Positive | P1 |
| TC_AI_095 | Validation: amount không âm | Positive | P1 |
| TC_AI_096 | Validation: calories ≥ 0 | Positive | P2 |
| TC_AI_097 | Edit trên mobile (small screen) | Positive | P2 |
| TC_AI_098 | Inline edit vs modal edit | Positive | P2 |
| TC_AI_099 | Edit multiple suggestions trước accept | Positive | P1 |
| TC_AI_100 | Edit undo (revert to AI value) | Positive | P2 |
| TC_AI_101 | Edit dark mode UI | Positive | P2 |
| TC_AI_102 | Edited suggestion highlight | Positive | P2 |
| TC_AI_103 | Edit không ảnh hưởng selection state | Positive | P2 |
| TC_AI_104 | Tab qua edit fields | Positive | P3 |
| TC_AI_105 | Edit validation real-time | Positive | P2 |
| TC_AI_106 | Fuzzy match: 'Thịt bò' match existing ingredient | Positive | P1 |
| TC_AI_107 | Fuzzy match: partial name 'Thịt' match 'Thịt gà' | Positive | P2 |
| TC_AI_108 | Fuzzy match Vietnamese diacritics: 'thit bo' match 'Thịt bò' | Positive | P2 |
| TC_AI_109 | No match → new ingredient flag | Positive | P1 |
| TC_AI_110 | Match → pre-fill nutrition từ existing | Positive | P1 |
| TC_AI_111 | Match → user override pre-filled values | Positive | P2 |
| TC_AI_112 | Multiple matches → show options | Positive | P2 |
| TC_AI_113 | Match confidence display | Positive | P2 |
| TC_AI_114 | Auto-fill accuracy: known ingredients | Positive | P1 |
| TC_AI_115 | Auto-fill cho 'Cá hồi' | Positive | P1 |
| TC_AI_116 | Auto-fill cho 'Trứng gà' | Positive | P1 |
| TC_AI_117 | Auto-fill cho 'Rau muống' | Positive | P2 |
| TC_AI_118 | Auto-fill cho 'Đường' | Positive | P2 |
| TC_AI_119 | Auto-fill cho 'Dầu ăn' | Positive | P2 |
| TC_AI_120 | Auto-fill unit đúng cho liquid: 'ml' | Positive | P2 |
| TC_AI_121 | Network error → toast message | Negative | P0 |
| TC_AI_122 | API error 500 → retry | Negative | P1 |
| TC_AI_123 | API error 429 rate limit → cooldown | Negative | P1 |
| TC_AI_124 | Timeout 30s → abort + message | Negative | P0 |
| TC_AI_125 | NotFoodImageError → specific message | Negative | P1 |
| TC_AI_126 | Invalid API key | Negative | P1 |
| TC_AI_127 | Empty response từ AI | Negative | P1 |
| TC_AI_128 | Partial response: thiếu calories | Edge | P2 |
| TC_AI_129 | Partial response: thiếu protein | Edge | P2 |
| TC_AI_130 | Retry exponential backoff: 1s, 2s, 4s | Positive | P2 |
| TC_AI_131 | Max 2 retries then fail | Positive | P1 |
| TC_AI_132 | AbortController cancellation works | Positive | P1 |
| TC_AI_133 | Error recovery → retry button | Positive | P1 |
| TC_AI_134 | Click retry → new request | Positive | P1 |
| TC_AI_135 | Error dark mode UI | Positive | P2 |
| TC_AI_136 | Error i18n Vietnamese | Positive | P2 |
| TC_AI_137 | Error không crash app | Positive | P0 |
| TC_AI_138 | Error logging trong Console | Positive | P2 |
| TC_AI_139 | CORS error handling | Negative | P2 |
| TC_AI_140 | Error khi response không phải JSON | Edge | P2 |
| TC_AI_141 | Upload food image → analyze thành công | Positive | P0 |
| TC_AI_142 | Clear photo result | Positive | P1 |
| TC_AI_143 | Multiple images upload | Edge | P2 |
| TC_AI_144 | Low quality image | Edge | P2 |
| TC_AI_145 | Non-food image rejected | Negative | P0 |
| TC_AI_146 | Image với nhiều dishes | Edge | P2 |
| TC_AI_147 | Image format JPG | Positive | P1 |
| TC_AI_148 | Image format PNG | Positive | P1 |
| TC_AI_149 | Image format HEIC (iOS) | Positive | P2 |
| TC_AI_150 | Large image file (10MB) | Boundary | P2 |
| TC_AI_151 | Camera capture trực tiếp | Positive | P1 |
| TC_AI_152 | Gallery selection | Positive | P1 |
| TC_AI_153 | Image preview trước analysis | Positive | P2 |
| TC_AI_154 | Analyze button sau upload | Positive | P1 |
| TC_AI_155 | Image analysis dark mode | Positive | P2 |
| TC_AI_156 | MealPlanSuggestion: breakfast dishes | Positive | P1 |
| TC_AI_157 | MealPlanSuggestion: lunch dishes | Positive | P1 |
| TC_AI_158 | MealPlanSuggestion: dinner dishes | Positive | P1 |
| TC_AI_159 | MealPlanSuggestion: reasoning display | Positive | P2 |
| TC_AI_160 | MealPlanSuggestion preview modal | Positive | P1 |
| TC_AI_161 | Rate limiting: request count tracking | Positive | P2 |
| TC_AI_162 | Rate limiting: cooldown message | Positive | P1 |
| TC_AI_163 | Rate limiting: countdown timer | Positive | P2 |
| TC_AI_164 | Rate limiting: auto-enable sau cooldown | Positive | P2 |
| TC_AI_165 | Rate limiting: per-session tracking | Positive | P2 |
| TC_AI_166 | API response time < 5s typical | Boundary | P1 |
| TC_AI_167 | Modal render performance | Boundary | P2 |
| TC_AI_168 | Screen reader cho suggestions | Positive | P3 |
| TC_AI_169 | Keyboard navigation trong list | Positive | P3 |
| TC_AI_170 | Memory cleanup khi modal close | Positive | P2 |
| TC_AI_171 | Suggestion cho 'Canh chua cá lóc' | Positive | P1 |
| TC_AI_172 | Suggestion cho 'Bò kho' | Positive | P1 |
| TC_AI_173 | Suggestion cho 'Chè đậu xanh' | Positive | P2 |
| TC_AI_174 | Suggestion cho 'Bánh xèo' | Positive | P1 |
| TC_AI_175 | Suggestion cho ingredient 'Nước mắm' | Positive | P2 |
| TC_AI_176 | AI suggest khi offline → queue hoặc error | Negative | P1 |
| TC_AI_177 | AI suggest khi API key expire | Negative | P2 |
| TC_AI_178 | AI response với HTML injection attempt | Security | P2 |
| TC_AI_179 | AI response rất lớn (50 ingredients) | Boundary | P2 |
| TC_AI_180 | AI suggest khi form đã có ingredients | Positive | P2 |
| TC_AI_181 | Suggestion modal responsive tablet | Positive | P2 |
| TC_AI_182 | Suggestion nutrition labels i18n | Positive | P2 |
| TC_AI_183 | AI suggest cho dish English name | Positive | P2 |
| TC_AI_184 | AI suggest accuracy check: tổng calories hợp lý | Positive | P1 |
| TC_AI_185 | Fuzzy match: 'Ca hoi' → 'Cá hồi' | Positive | P2 |
| TC_AI_186 | AI suggestion history (nếu có) | Positive | P3 |
| TC_AI_187 | AI suggest khi dish đang sync | Edge | P2 |
| TC_AI_188 | AI suggest response cache (nếu có) | Positive | P3 |
| TC_AI_189 | Suggestion modal close khi click outside | Positive | P2 |
| TC_AI_190 | Suggestion modal ESC close | Positive | P2 |
| TC_AI_191 | SuggestedDishIngredient type validation | Positive | P1 |
| TC_AI_192 | ConfirmedSuggestion output format | Positive | P1 |
| TC_AI_193 | AI response sanitization | Security | P1 |
| TC_AI_194 | useAISuggestion hook state management | Positive | P2 |
| TC_AI_195 | geminiService.analyzeDishImage() called correctly | Positive | P1 |
| TC_AI_196 | AI suggest khi app vừa khởi động | Positive | P2 |
| TC_AI_197 | AI suggest sau khi import data | Positive | P2 |
| TC_AI_198 | Suggestion cho dish có tên rất ngắn: 'Cá' | Edge | P2 |
| TC_AI_199 | Suggestion cho dish tên rất dài | Edge | P2 |
| TC_AI_200 | Concurrent AI requests prevention | Positive | P1 |
| TC_AI_201 | AI suggest cho 'Chả giò' | Positive | P1 |
| TC_AI_202 | AI suggest cho 'Hủ tiếu Nam Vang' | Positive | P2 |
| TC_AI_203 | AI suggest cho 'Smoothie trái cây' | Positive | P2 |
| TC_AI_204 | AI nutrition auto-fill cho 'Muối' | Positive | P2 |
| TC_AI_205 | AI nutrition auto-fill cho 'Đường' | Positive | P2 |
| TC_AI_206 | Suggestion performance: 10 items render | Boundary | P2 |
| TC_AI_207 | AI API call includes dish context | Positive | P2 |
| TC_AI_208 | Multiple suggest sessions: state isolated | Positive | P2 |
| TC_AI_209 | AI suggest integration test end-to-end | Positive | P0 |
| TC_AI_210 | geminiService error wrapped correctly | Positive | P2 |

---

## Chi tiết Test Cases

### Nhóm 1: AI Button & Trigger (Nút AI & Kích hoạt) (TC_AI_001 – TC_AI_025)

### TC_AI_001: Nút AI Suggest hiển thị trong form thêm dish

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_001 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Mở form thêm dish mới |
| **Các bước thực hiện** | 1. Kiểm tra form |
| **Kết quả mong đợi** | Nút 'AI Gợi ý nguyên liệu' hiển thị |
| **Kết quả test thực tế** | — |

### TC_AI_002: Nút AI Suggest trong form sửa dish

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_002 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Mở form sửa dish |
| **Các bước thực hiện** | 1. Kiểm tra form |
| **Kết quả mong đợi** | Nút AI Suggest hiển thị |
| **Kết quả test thực tế** | — |

### TC_AI_003: Nút AI Suggest trong form thêm ingredient

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_003 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Mở form thêm ingredient |
| **Các bước thực hiện** | 1. Kiểm tra form |
| **Kết quả mong đợi** | Nút AI gợi ý dinh dưỡng hiển thị |
| **Kết quả test thực tế** | — |

### TC_AI_004: Nút AI enabled khi có API key

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_004 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | API key Gemini đã cấu hình |
| **Các bước thực hiện** | 1. Kiểm tra nút AI |
| **Kết quả mong đợi** | Nút enabled, có thể click |
| **Kết quả test thực tế** | — |

### TC_AI_005: Nút AI disabled khi không có API key

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_005 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Không có API key |
| **Các bước thực hiện** | 1. Kiểm tra nút AI |
| **Kết quả mong đợi** | Nút disabled hoặc ẩn, tooltip giải thích |
| **Kết quả test thực tế** | — |

### TC_AI_006: Click nút AI trigger API call

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_006 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | API key có, form dish mở |
| **Các bước thực hiện** | 1. Click nút 'AI Gợi ý' |
| **Kết quả mong đợi** | Loading state hiển thị, API call được gửi |
| **Kết quả test thực tế** | — |

### TC_AI_007: Nút AI loading state (disabled khi đang gọi)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_007 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | AI đang gọi API |
| **Các bước thực hiện** | 1. Kiểm tra nút |
| **Kết quả mong đợi** | Nút disabled, spinner hiển thị |
| **Kết quả test thực tế** | — |

### TC_AI_008: Nút AI tooltip text

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_008 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Hover/long-press nút AI |
| **Các bước thực hiện** | 1. Kiểm tra tooltip |
| **Kết quả mong đợi** | Tooltip: 'Gợi ý nguyên liệu bằng AI' |
| **Kết quả test thực tế** | — |

### TC_AI_009: Nút AI trên mobile layout

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_009 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra nút AI trong form |
| **Kết quả mong đợi** | Nút hiển thị đúng, đủ lớn (≥44px) |
| **Kết quả test thực tế** | — |

### TC_AI_010: Nút AI trên desktop layout

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_010 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra nút |
| **Kết quả mong đợi** | Nút inline trong form, kích thước phù hợp |
| **Kết quả test thực tế** | — |

### TC_AI_011: Nút AI dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_011 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra nút |
| **Kết quả mong đợi** | Nút visible trong dark mode |
| **Kết quả test thực tế** | — |

### TC_AI_012: Nút AI i18n label tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_012 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngôn ngữ Việt |
| **Các bước thực hiện** | 1. Kiểm tra text nút |
| **Kết quả mong đợi** | 'AI Gợi ý' hoặc tương tự bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_AI_013: Click AI khi form rỗng (không có dish name)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_013 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form dish mới, chưa nhập tên |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | Yêu cầu nhập tên dish trước hoặc suggest dựa trên ảnh |
| **Kết quả test thực tế** | — |

### TC_AI_014: Click AI khi đã có dish name

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_014 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form dish, tên = 'Phở bò' |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | AI analyze based on dish name 'Phở bò' |
| **Kết quả test thực tế** | — |

### TC_AI_015: Click AI khi đã có ảnh dish

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_015 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Form dish có ảnh đã upload |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | AI analyze ảnh → gợi ý ingredients |
| **Kết quả test thực tế** | — |

### TC_AI_016: Nút AI accessible bằng keyboard

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_016 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Desktop, focus trong form |
| **Các bước thực hiện** | 1. Tab đến nút AI<br>2. Enter |
| **Kết quả mong đợi** | AI trigger bằng keyboard |
| **Kết quả test thực tế** | — |

### TC_AI_017: Nút AI trong ingredient form: gợi ý nutrition

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_017 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form thêm ingredient, tên = 'Thịt bò' |
| **Các bước thực hiện** | 1. Click 'AI gợi ý dinh dưỡng' |
| **Kết quả mong đợi** | AI trả về calories, protein, carbs, fat cho 'Thịt bò' |
| **Kết quả test thực tế** | — |

### TC_AI_018: Multiple clicks AI → chỉ 1 request

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_018 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form dish mở |
| **Các bước thực hiện** | 1. Double-click nút AI |
| **Kết quả mong đợi** | Chỉ 1 API request (nút disabled sau click đầu) |
| **Kết quả test thực tế** | — |

### TC_AI_019: Nút AI icon (✨ hoặc 🤖)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_019 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra nút icon |
| **Kết quả mong đợi** | Có icon AI (sparkle, robot, hoặc brain) |
| **Kết quả test thực tế** | — |

### TC_AI_020: Nút AI position trong form layout

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_020 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form dish mở |
| **Các bước thực hiện** | 1. Kiểm tra vị trí nút |
| **Kết quả mong đợi** | Nút ở vị trí dễ tìm (gần ingredients section) |
| **Kết quả test thực tế** | — |

### TC_AI_021: AI suggest cho dish 'Cơm tấm'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_021 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form dish, tên = 'Cơm tấm' |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | Gợi ý: cơm, sườn nướng, trứng ốp la, bì, chả, đồ chua |
| **Kết quả test thực tế** | — |

### TC_AI_022: AI suggest cho dish 'Bún chả Hà Nội'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_022 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Form dish, tên = 'Bún chả Hà Nội' |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | Gợi ý: bún, thịt nướng, chả viên, rau sống, nước mắm |
| **Kết quả test thực tế** | — |

### TC_AI_023: AI suggest cho dish 'Salad Caesar'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_023 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form dish, tên = 'Salad Caesar' |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | Gợi ý: xà lách romaine, parmesan, croutons, sốt Caesar |
| **Kết quả test thực tế** | — |

### TC_AI_024: AI suggest khi dish name tiếng Anh

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_024 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Tên = 'Chicken Fried Rice' |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | Gợi ý ingredients phù hợp (rice, chicken, vegetables) |
| **Kết quả test thực tế** | — |

### TC_AI_025: AI suggest khi dish name mơ hồ

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_025 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Tên = 'Món ăn' |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | AI trả về gợi ý chung hoặc yêu cầu chi tiết hơn |
| **Kết quả test thực tế** | — |

### Nhóm 2: Loading & Suggestion Display (Loading & Hiển thị gợi ý) (TC_AI_026 – TC_AI_050)

### TC_AI_026: Loading spinner hiển thị khi gọi API

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_026 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Click AI Suggest |
| **Các bước thực hiện** | 1. Kiểm tra UI ngay sau click |
| **Kết quả mong đợi** | Spinner/loading indicator hiển thị |
| **Kết quả test thực tế** | — |

### TC_AI_027: Loading text 'Đang phân tích...'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_027 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | AI đang gọi |
| **Các bước thực hiện** | 1. Kiểm tra text |
| **Kết quả mong đợi** | Text 'Đang phân tích...' hoặc 'AI đang xử lý...' |
| **Kết quả test thực tế** | — |

### TC_AI_028: Loading skeleton cho suggestion list

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_028 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | AI đang gọi |
| **Các bước thực hiện** | 1. Kiểm tra preview area |
| **Kết quả mong đợi** | Skeleton items hiển thị (placeholder cho results) |
| **Kết quả test thực tế** | — |

### TC_AI_029: Cancel button hiển thị khi loading

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_029 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | AI đang gọi |
| **Các bước thực hiện** | 1. Kiểm tra UI |
| **Kết quả mong đợi** | Nút 'Hủy' hiển thị để cancel request |
| **Kết quả test thực tế** | — |

### TC_AI_030: Click Cancel → abort request

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_030 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | AI loading, click Cancel |
| **Các bước thực hiện** | 1. Click Hủy |
| **Kết quả mong đợi** | AbortController abort request, loading dừng, quay về trạng thái ban đầu |
| **Kết quả test thực tế** | — |

### TC_AI_031: Loading 1 giây

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_031 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | API response nhanh |
| **Các bước thực hiện** | 1. Đo thời gian loading |
| **Kết quả mong đợi** | Loading hiển thị ngắn, results appear nhanh |
| **Kết quả test thực tế** | — |

### TC_AI_032: Loading 5 giây

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_032 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | API response trung bình |
| **Các bước thực hiện** | 1. Đo thời gian |
| **Kết quả mong đợi** | Loading vẫn hiển thị, user thấy AI đang xử lý |
| **Kết quả test thực tế** | — |

### TC_AI_033: Loading 10 giây

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_033 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | API response chậm |
| **Các bước thực hiện** | 1. Đo thời gian |
| **Kết quả mong đợi** | Loading indicator vẫn active, có thể hiện progress |
| **Kết quả test thực tế** | — |

### TC_AI_034: Loading 25 giây (gần timeout)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_034 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | API rất chậm |
| **Các bước thực hiện** | 1. Chờ 25s |
| **Kết quả mong đợi** | Loading vẫn hiển thị, sắp timeout |
| **Kết quả test thực tế** | — |

### TC_AI_035: Loading > 30 giây → timeout

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_035 |
| **Loại** | Negative |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | API không phản hồi |
| **Các bước thực hiện** | 1. Chờ 30s |
| **Kết quả mong đợi** | Timeout error: 'AI không phản hồi, vui lòng thử lại' |
| **Kết quả test thực tế** | — |

### TC_AI_036: Loading accessibility: aria-busy

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_036 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | AI loading |
| **Các bước thực hiện** | 1. Kiểm tra aria attributes |
| **Kết quả mong đợi** | Container có aria-busy='true' khi loading |
| **Kết quả test thực tế** | — |

### TC_AI_037: Loading dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_037 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, AI loading |
| **Các bước thực hiện** | 1. Kiểm tra spinner/skeleton |
| **Kết quả mong đợi** | Loading indicators visible trong dark mode |
| **Kết quả test thực tế** | — |

### TC_AI_038: Loading trên slow network

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_038 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Network throttle 3G |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | Loading kéo dài hơn, nhưng hoàn thành eventually |
| **Kết quả test thực tế** | — |

### TC_AI_039: Loading progress percentage (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_039 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | AI loading |
| **Các bước thực hiện** | 1. Kiểm tra progress |
| **Kết quả mong đợi** | Progress bar hoặc percentage hiển thị (nếu API hỗ trợ) |
| **Kết quả test thực tế** | — |

### TC_AI_040: Loading không block form interactions

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_040 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | AI loading trong form |
| **Các bước thực hiện** | 1. Thử nhập text vào các fields khác |
| **Kết quả mong đợi** | User vẫn có thể edit form fields khác trong lúc AI loading |
| **Kết quả test thực tế** | — |

### TC_AI_041: Suggestion list hiển thị sau API response

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_041 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | AI trả về 5 ingredients |
| **Các bước thực hiện** | 1. Kiểm tra AISuggestIngredientsPreview |
| **Kết quả mong đợi** | Modal/panel hiển thị danh sách 5 suggestions |
| **Kết quả test thực tế** | — |

### TC_AI_042: Mỗi suggestion hiển thị tên ingredient

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_042 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Suggestions hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra từng item |
| **Kết quả mong đợi** | Tên ingredient hiển thị rõ ràng |
| **Kết quả test thực tế** | — |

### TC_AI_043: Suggestion hiển thị amount

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_043 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Suggestions hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Amount hiển thị (ví dụ '200') |
| **Kết quả test thực tế** | — |

### TC_AI_044: Suggestion hiển thị unit

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_044 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Suggestions hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Unit hiển thị (ví dụ 'g', 'ml') |
| **Kết quả test thực tế** | — |

### TC_AI_045: Suggestion hiển thị calories

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_045 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Suggestions hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Calories per ingredient hiển thị |
| **Kết quả test thực tế** | — |

### TC_AI_046: Suggestion hiển thị protein

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_046 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Suggestions hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Protein per ingredient hiển thị |
| **Kết quả test thực tế** | — |

### TC_AI_047: Suggestion hiển thị carbs

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_047 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Suggestions hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Carbs hiển thị |
| **Kết quả test thực tế** | — |

### TC_AI_048: Suggestion hiển thị fat

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_048 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Suggestions hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Fat hiển thị |
| **Kết quả test thực tế** | — |

### TC_AI_049: Suggestion hiển thị fiber

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_049 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Suggestions hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Fiber hiển thị (nếu có) |
| **Kết quả test thực tế** | — |

### TC_AI_050: Suggestion count = 1

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_050 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | AI trả về 1 suggestion |
| **Các bước thực hiện** | 1. Kiểm tra list |
| **Kết quả mong đợi** | 1 item hiển thị |
| **Kết quả test thực tế** | — |

### Nhóm 3: Suggestion Details (Chi tiết gợi ý) (TC_AI_051 – TC_AI_065)

### TC_AI_051: Suggestion count = 3

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_051 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | AI trả về 3 suggestions |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | 3 items hiển thị |
| **Kết quả test thực tế** | — |

### TC_AI_052: Suggestion count = 5

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_052 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | AI trả về 5 |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | 5 items |
| **Kết quả test thực tế** | — |

### TC_AI_053: Suggestion count = 10

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_053 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | AI trả về 10 |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | 10 items, scrollable nếu cần |
| **Kết quả test thực tế** | — |

### TC_AI_054: Suggestion cho 'Phở bò'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_054 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Dish = Phở bò |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Gợi ý: bánh phở, thịt bò, hành, giá đỗ, rau thơm, nước dùng |
| **Kết quả test thực tế** | — |

### TC_AI_055: Suggestion cho 'Bún bò Huế'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_055 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dish = Bún bò Huế |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Gợi ý: bún, thịt bò, chả Huế, rau muống, sả, mắm ruốc |
| **Kết quả test thực tế** | — |

### TC_AI_056: Suggestion cho 'Cơm chiên dương châu'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_056 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dish = Cơm chiên dương châu |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Gợi ý: cơm, trứng, tôm, lạp xưởng, đậu hà lan, cà rốt |
| **Kết quả test thực tế** | — |

### TC_AI_057: Suggestion cho 'Gỏi cuốn'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_057 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dish = Gỏi cuốn |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Gợi ý: bánh tráng, tôm, thịt heo, bún, rau sống, húng quế |
| **Kết quả test thực tế** | — |

### TC_AI_058: Suggestion cho 'Bánh mì thịt'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_058 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dish = Bánh mì thịt |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Gợi ý: bánh mì, thịt nguội, pate, rau mùi, đồ chua, ớt |
| **Kết quả test thực tế** | — |

### TC_AI_059: Suggestion cho ingredient hiếm

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_059 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish với ingredient lạ |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | AI vẫn trả về gợi ý hợp lý hoặc thông báo không biết |
| **Kết quả test thực tế** | — |

### TC_AI_060: Suggestion layout mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_060 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra suggestion list |
| **Kết quả mong đợi** | List full-width, mỗi item hiển thị compact |
| **Kết quả test thực tế** | — |

### TC_AI_061: Suggestion layout desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_061 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | List rộng hơn, có thể grid hoặc table |
| **Kết quả test thực tế** | — |

### TC_AI_062: Suggestion dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_062 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra suggestions |
| **Kết quả mong đợi** | Items hiển thị rõ dark mode |
| **Kết quả test thực tế** | — |

### TC_AI_063: Suggestion Vietnamese ingredient names

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_063 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | AI trả về tên tiếng Việt |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Tên hiển thị đúng dấu tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_AI_064: Long ingredient name display

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_064 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Suggestion tên: 'Nước mắm pha chua ngọt đặc biệt' |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Tên wrap hoặc truncate phù hợp |
| **Kết quả test thực tế** | — |

### TC_AI_065: Suggestion total nutrition calculated

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_065 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | 5 suggestions hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra tổng |
| **Kết quả mong đợi** | Tổng calories/protein từ tất cả suggestions hiển thị |
| **Kết quả test thực tế** | — |

### Nhóm 4: Accept/Reject (Chấp nhận/Từ chối) (TC_AI_066 – TC_AI_085)

### TC_AI_066: Select all suggestions

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_066 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | 5 suggestions hiển thị |
| **Các bước thực hiện** | 1. Click 'Chọn tất cả' |
| **Kết quả mong đợi** | Tất cả 5 items được checked |
| **Kết quả test thực tế** | — |

### TC_AI_067: Deselect all suggestions

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_067 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Tất cả đang selected |
| **Các bước thực hiện** | 1. Click 'Bỏ chọn tất cả' |
| **Kết quả mong đợi** | Tất cả items unchecked |
| **Kết quả test thực tế** | — |

### TC_AI_068: Select individual suggestion

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_068 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Suggestion list hiển thị |
| **Các bước thực hiện** | 1. Click checkbox item 'Thịt bò' |
| **Kết quả mong đợi** | Item 'Thịt bò' checked, others unchanged |
| **Kết quả test thực tế** | — |

### TC_AI_069: Deselect individual suggestion

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_069 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Item đang selected |
| **Các bước thực hiện** | 1. Click checkbox lần nữa |
| **Kết quả mong đợi** | Item unchecked |
| **Kết quả test thực tế** | — |

### TC_AI_070: Accept button enabled khi ≥1 selected

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_070 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | 1 item selected |
| **Các bước thực hiện** | 1. Kiểm tra nút Xác nhận |
| **Kết quả mong đợi** | Nút enabled, có thể click |
| **Kết quả test thực tế** | — |

### TC_AI_071: Accept button disabled khi 0 selected

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_071 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | 0 items selected |
| **Các bước thực hiện** | 1. Kiểm tra nút |
| **Kết quả mong đợi** | Nút disabled |
| **Kết quả test thực tế** | — |

### TC_AI_072: Accept → gọi onConfirm callback

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_072 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | 2 items selected |
| **Các bước thực hiện** | 1. Click Xác nhận |
| **Kết quả mong đợi** | onConfirm gọi với 2 ConfirmedSuggestion items |
| **Kết quả test thực tế** | — |

### TC_AI_073: Reject/Cancel → modal đóng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_073 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Suggestion modal mở |
| **Các bước thực hiện** | 1. Click Hủy |
| **Kết quả mong đợi** | Modal đóng, không thêm gì vào form |
| **Kết quả test thực tế** | — |

### TC_AI_074: Partial accept: chọn 2/5

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_074 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | 5 suggestions, chọn 2 |
| **Các bước thực hiện** | 1. Click Xác nhận |
| **Kết quả mong đợi** | Chỉ 2 items được thêm vào dish ingredients |
| **Kết quả test thực tế** | — |

### TC_AI_075: Accept count badge hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_075 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 3/5 selected |
| **Các bước thực hiện** | 1. Kiểm tra Accept button |
| **Kết quả mong đợi** | Nút hiển thị 'Xác nhận (3)' hoặc badge '3' |
| **Kết quả test thực tế** | — |

### TC_AI_076: Checkbox UI cho selection

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_076 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Suggestion list |
| **Các bước thực hiện** | 1. Kiểm tra UI |
| **Kết quả mong đợi** | Mỗi item có checkbox bên trái |
| **Kết quả test thực tế** | — |

### TC_AI_077: Select/deselect animation

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_077 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Click checkbox |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Checkbox animation smooth (check mark appear) |
| **Kết quả test thực tế** | — |

### TC_AI_078: Selected items highlighted

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_078 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Items selected |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Selected items có background highlight |
| **Kết quả test thực tế** | — |

### TC_AI_079: Accept → form ingredients updated

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_079 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Accept 3 suggestions |
| **Các bước thực hiện** | 1. Kiểm tra form |
| **Kết quả mong đợi** | 3 ingredients thêm vào form dish với name, amount, unit, nutrition |
| **Kết quả test thực tế** | — |

### TC_AI_080: Accept → modal đóng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_080 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Accept click |
| **Các bước thực hiện** | 1. Kiểm tra modal |
| **Kết quả mong đợi** | Modal đóng sau accept |
| **Kết quả test thực tế** | — |

### TC_AI_081: Cancel khi có selections → confirm discard

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_081 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 3 items selected |
| **Các bước thực hiện** | 1. Click Cancel |
| **Kết quả mong đợi** | Hỏi xác nhận 'Bạn có chắc muốn hủy gợi ý?' hoặc đóng trực tiếp |
| **Kết quả test thực tế** | — |

### TC_AI_082: Select keyboard: Space toggle

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_082 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Focus trên checkbox |
| **Các bước thực hiện** | 1. Nhấn Space |
| **Kết quả mong đợi** | Checkbox toggle |
| **Kết quả test thực tế** | — |

### TC_AI_083: Select accessibility: aria-checked

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_083 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Items với checkbox |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | aria-checked = true/false đúng |
| **Kết quả test thực tế** | — |

### TC_AI_084: Accept dark mode UI

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_084 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, suggestions mở |
| **Các bước thực hiện** | 1. Kiểm tra Accept/Cancel buttons |
| **Kết quả mong đợi** | Buttons visible và đúng style |
| **Kết quả test thực tế** | — |

### TC_AI_085: Accept responsive mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_085 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra buttons |
| **Kết quả mong đợi** | Buttons full-width hoặc dễ bấm |
| **Kết quả test thực tế** | — |

### Nhóm 5: Edit Suggestions (Sửa gợi ý) (TC_AI_086 – TC_AI_105)

### TC_AI_086: Edit amount trước accept

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_086 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Suggestion: Thịt bò 200g |
| **Các bước thực hiện** | 1. Sửa amount thành 300g |
| **Kết quả mong đợi** | Amount cập nhật thành 300g |
| **Kết quả test thực tế** | — |

### TC_AI_087: Edit unit trước accept

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_087 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Suggestion unit = 'g' |
| **Các bước thực hiện** | 1. Đổi unit sang 'ml' |
| **Kết quả mong đợi** | Unit cập nhật thành 'ml' |
| **Kết quả test thực tế** | — |

### TC_AI_088: Edit calories trước accept

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_088 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Suggestion calories = 250 |
| **Các bước thực hiện** | 1. Sửa thành 300 |
| **Kết quả mong đợi** | Calories cập nhật |
| **Kết quả test thực tế** | — |

### TC_AI_089: Edit protein trước accept

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_089 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Suggestion protein = 20g |
| **Các bước thực hiện** | 1. Sửa thành 25g |
| **Kết quả mong đợi** | Protein cập nhật |
| **Kết quả test thực tế** | — |

### TC_AI_090: Edit carbs trước accept

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_090 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Suggestion carbs = 30g |
| **Các bước thực hiện** | 1. Sửa thành 35g |
| **Kết quả mong đợi** | Carbs cập nhật |
| **Kết quả test thực tế** | — |

### TC_AI_091: Edit fat trước accept

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_091 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Suggestion fat = 10g |
| **Các bước thực hiện** | 1. Sửa thành 15g |
| **Kết quả mong đợi** | Fat cập nhật |
| **Kết quả test thực tế** | — |

### TC_AI_092: Edit name trước accept

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_092 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Suggestion name = 'Thịt bò' |
| **Các bước thực hiện** | 1. Sửa thành 'Thịt bò Úc' |
| **Kết quả mong đợi** | Name cập nhật |
| **Kết quả test thực tế** | — |

### TC_AI_093: Edit clears original AI value

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_093 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Edit amount |
| **Các bước thực hiện** | 1. Sửa amount<br>2. Kiểm tra value |
| **Kết quả mong đợi** | Value mới replace hoàn toàn, không giữ AI value |
| **Kết quả test thực tế** | — |

### TC_AI_094: Validation: amount > 0

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_094 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Edit amount = 0 |
| **Các bước thực hiện** | 1. Kiểm tra validation |
| **Kết quả mong đợi** | Error: 'Số lượng phải > 0' |
| **Kết quả test thực tế** | — |

### TC_AI_095: Validation: amount không âm

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_095 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Edit amount = -10 |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Error: 'Số lượng không hợp lệ' |
| **Kết quả test thực tế** | — |

### TC_AI_096: Validation: calories ≥ 0

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_096 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Edit calories = -5 |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Error validation |
| **Kết quả test thực tế** | — |

### TC_AI_097: Edit trên mobile (small screen)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_097 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Edit amount |
| **Kết quả mong đợi** | Input field đủ lớn, keyboard mở đúng type (number) |
| **Kết quả test thực tế** | — |

### TC_AI_098: Inline edit vs modal edit

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_098 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Click edit trên suggestion |
| **Các bước thực hiện** | 1. Kiểm tra edit mode |
| **Kết quả mong đợi** | Edit inline (trong row) hoặc expand row |
| **Kết quả test thực tế** | — |

### TC_AI_099: Edit multiple suggestions trước accept

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_099 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Edit 3/5 suggestions |
| **Các bước thực hiện** | 1. Accept |
| **Kết quả mong đợi** | 3 edited values + 2 original values applied |
| **Kết quả test thực tế** | — |

### TC_AI_100: Edit undo (revert to AI value)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_100 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Đã edit amount |
| **Các bước thực hiện** | 1. Click undo/revert |
| **Kết quả mong đợi** | Amount quay về giá trị AI gốc |
| **Kết quả test thực tế** | — |

### TC_AI_101: Edit dark mode UI

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_101 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, edit mode |
| **Các bước thực hiện** | 1. Kiểm tra input fields |
| **Kết quả mong đợi** | Inputs visible dark mode |
| **Kết quả test thực tế** | — |

### TC_AI_102: Edited suggestion highlight

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_102 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Suggestion đã bị edit |
| **Các bước thực hiện** | 1. Kiểm tra visual |
| **Kết quả mong đợi** | Item edited có indicator (icon hoặc border khác) |
| **Kết quả test thực tế** | — |

### TC_AI_103: Edit không ảnh hưởng selection state

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_103 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Item selected + edited |
| **Các bước thực hiện** | 1. Kiểm tra checkbox |
| **Kết quả mong đợi** | Checkbox vẫn checked sau edit |
| **Kết quả test thực tế** | — |

### TC_AI_104: Tab qua edit fields

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_104 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Desktop, edit mode |
| **Các bước thực hiện** | 1. Tab key qua fields |
| **Kết quả mong đợi** | Focus di chuyển đúng: amount → unit → calories → protein |
| **Kết quả test thực tế** | — |

### TC_AI_105: Edit validation real-time

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_105 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Nhập giá trị invalid |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Validation message hiển thị real-time |
| **Kết quả test thực tế** | — |

### Nhóm 6: Fuzzy Matching & Auto-fill (Matching & Tự điền) (TC_AI_106 – TC_AI_120)

### TC_AI_106: Fuzzy match: 'Thịt bò' match existing ingredient

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_106 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | DB có ingredient 'Thịt bò' |
| **Các bước thực hiện** | 1. AI suggest 'Thịt bò'<br>2. Kiểm tra match indicator |
| **Kết quả mong đợi** | Suggestion hiển thị 'Match: Thịt bò (đã có)' |
| **Kết quả test thực tế** | — |

### TC_AI_107: Fuzzy match: partial name 'Thịt' match 'Thịt gà'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_107 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | DB có 'Thịt gà' |
| **Các bước thực hiện** | 1. AI suggest 'Thịt gà' |
| **Kết quả mong đợi** | Match found cho 'Thịt gà' |
| **Kết quả test thực tế** | — |

### TC_AI_108: Fuzzy match Vietnamese diacritics: 'thit bo' match 'Thịt bò'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_108 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | DB có 'Thịt bò' |
| **Các bước thực hiện** | 1. AI suggest 'thit bo' (không dấu) |
| **Kết quả mong đợi** | Fuzzy match tìm thấy 'Thịt bò' |
| **Kết quả test thực tế** | — |

### TC_AI_109: No match → new ingredient flag

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_109 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | DB không có ingredient tên 'Sả' |
| **Các bước thực hiện** | 1. AI suggest 'Sả' |
| **Kết quả mong đợi** | Item hiển thị '[Mới]' indicator |
| **Kết quả test thực tế** | — |

### TC_AI_110: Match → pre-fill nutrition từ existing

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_110 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | DB 'Thịt bò' có nutrition data |
| **Các bước thực hiện** | 1. AI suggest 'Thịt bò' match DB |
| **Kết quả mong đợi** | Nutrition pre-fill từ DB thay vì AI values |
| **Kết quả test thực tế** | — |

### TC_AI_111: Match → user override pre-filled values

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_111 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Nutrition pre-filled từ DB |
| **Các bước thực hiện** | 1. Sửa calories |
| **Kết quả mong đợi** | User có thể override giá trị pre-filled |
| **Kết quả test thực tế** | — |

### TC_AI_112: Multiple matches → show options

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_112 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | DB: 'Thịt bò', 'Thịt bò Mỹ', 'Thịt bò Úc' |
| **Các bước thực hiện** | 1. AI suggest 'Thịt bò' |
| **Kết quả mong đợi** | Dropdown hoặc list các match options |
| **Kết quả test thực tế** | — |

### TC_AI_113: Match confidence display

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_113 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Fuzzy match 80% confidence |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Hiển thị confidence level hoặc match quality |
| **Kết quả test thực tế** | — |

### TC_AI_114: Auto-fill accuracy: known ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_114 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | AI suggest 'Gạo' |
| **Các bước thực hiện** | 1. Kiểm tra nutrition |
| **Kết quả mong đợi** | Calories ~130/100g, Protein ~2.7g/100g (reasonable range) |
| **Kết quả test thực tế** | — |

### TC_AI_115: Auto-fill cho 'Cá hồi'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_115 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | AI suggest |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Calories ~208/100g, Protein ~20g, Fat ~13g (reasonable) |
| **Kết quả test thực tế** | — |

### TC_AI_116: Auto-fill cho 'Trứng gà'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_116 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | AI suggest |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Calories ~155/100g, Protein ~13g (reasonable) |
| **Kết quả test thực tế** | — |

### TC_AI_117: Auto-fill cho 'Rau muống'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_117 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | AI suggest |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Calories ~19/100g, Protein ~2.6g (reasonable) |
| **Kết quả test thực tế** | — |

### TC_AI_118: Auto-fill cho 'Đường'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_118 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | AI suggest |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Calories ~387/100g, Carbs ~100g (reasonable) |
| **Kết quả test thực tế** | — |

### TC_AI_119: Auto-fill cho 'Dầu ăn'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_119 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | AI suggest |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Calories ~884/100g, Fat ~100g (reasonable) |
| **Kết quả test thực tế** | — |

### TC_AI_120: Auto-fill unit đúng cho liquid: 'ml'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_120 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | AI suggest 'Nước mắm' |
| **Các bước thực hiện** | 1. Kiểm tra unit |
| **Kết quả mong đợi** | Unit = 'ml' (không phải 'g') |
| **Kết quả test thực tế** | — |

### Nhóm 7: Error Handling (Xử lý lỗi) (TC_AI_121 – TC_AI_140)

### TC_AI_121: Network error → toast message

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_121 |
| **Loại** | Negative |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Mạng bị ngắt |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | Toast: 'Không có kết nối mạng' |
| **Kết quả test thực tế** | — |

### TC_AI_122: API error 500 → retry

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_122 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | API trả về 500 |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | Auto-retry 1 lần, nếu fail → error message |
| **Kết quả test thực tế** | — |

### TC_AI_123: API error 429 rate limit → cooldown

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_123 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Gọi API quá nhiều |
| **Các bước thực hiện** | 1. Click AI Suggest nhiều lần |
| **Kết quả mong đợi** | 'Đã vượt giới hạn, vui lòng thử lại sau 1 phút' |
| **Kết quả test thực tế** | — |

### TC_AI_124: Timeout 30s → abort + message

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_124 |
| **Loại** | Negative |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | API không phản hồi 30s |
| **Các bước thực hiện** | 1. Click AI Suggest, chờ 30s |
| **Kết quả mong đợi** | Request abort, 'AI không phản hồi, thử lại' |
| **Kết quả test thực tế** | — |

### TC_AI_125: NotFoodImageError → specific message

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_125 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Upload ảnh không phải thức ăn |
| **Các bước thực hiện** | 1. Upload ảnh xe hơi, click AI |
| **Kết quả mong đợi** | 'Ảnh không phải thức ăn, vui lòng chụp ảnh món ăn' |
| **Kết quả test thực tế** | — |

### TC_AI_126: Invalid API key

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_126 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | API key sai |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | Error: 'API key không hợp lệ' |
| **Kết quả test thực tế** | — |

### TC_AI_127: Empty response từ AI

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_127 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | AI trả về mảng rỗng |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Message: 'AI không thể gợi ý, thử với tên rõ hơn' |
| **Kết quả test thực tế** | — |

### TC_AI_128: Partial response: thiếu calories

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_128 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | AI trả về ingredients thiếu calories |
| **Các bước thực hiện** | 1. Kiểm tra suggestions |
| **Kết quả mong đợi** | Items hiển thị với calories = 0 hoặc N/A |
| **Kết quả test thực tế** | — |

### TC_AI_129: Partial response: thiếu protein

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_129 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Thiếu protein data |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Protein = 0 hoặc N/A |
| **Kết quả test thực tế** | — |

### TC_AI_130: Retry exponential backoff: 1s, 2s, 4s

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_130 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | API fail lần 1 |
| **Các bước thực hiện** | 1. Monitor retry timing |
| **Kết quả mong đợi** | Retry sau 1s, lần 2 sau 2s (exponential) |
| **Kết quả test thực tế** | — |

### TC_AI_131: Max 2 retries then fail

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_131 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | API fail liên tục |
| **Các bước thực hiện** | 1. Click AI, API fail 3 lần |
| **Kết quả mong đợi** | Sau 2 retries (total 3 calls), dừng và báo lỗi |
| **Kết quả test thực tế** | — |

### TC_AI_132: AbortController cancellation works

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_132 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | AI loading |
| **Các bước thực hiện** | 1. Click Cancel |
| **Kết quả mong đợi** | AbortController.abort() gọi, request cancelled |
| **Kết quả test thực tế** | — |

### TC_AI_133: Error recovery → retry button

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_133 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | AI error hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra error UI |
| **Kết quả mong đợi** | Nút 'Thử lại' hiển thị |
| **Kết quả test thực tế** | — |

### TC_AI_134: Click retry → new request

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_134 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Error hiển thị, click Retry |
| **Các bước thực hiện** | 1. Click 'Thử lại' |
| **Kết quả mong đợi** | New API request được gửi |
| **Kết quả test thực tế** | — |

### TC_AI_135: Error dark mode UI

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_135 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, error hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Error message visible dark mode |
| **Kết quả test thực tế** | — |

### TC_AI_136: Error i18n Vietnamese

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_136 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngôn ngữ Việt, error |
| **Các bước thực hiện** | 1. Kiểm tra error messages |
| **Kết quả mong đợi** | Tất cả messages bằng tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_AI_137: Error không crash app

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_137 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Bất kỳ AI error |
| **Các bước thực hiện** | 1. Kiểm tra app |
| **Kết quả mong đợi** | App vẫn chạy, ErrorBoundary không trigger |
| **Kết quả test thực tế** | — |

### TC_AI_138: Error logging trong Console

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_138 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | AI error |
| **Các bước thực hiện** | 1. Kiểm tra Console tab |
| **Kết quả mong đợi** | Error details logged: URL, status, message |
| **Kết quả test thực tế** | — |

### TC_AI_139: CORS error handling

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_139 |
| **Loại** | Negative |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | CORS misconfigured |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Error message rõ ràng |
| **Kết quả test thực tế** | — |

### TC_AI_140: Error khi response không phải JSON

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_140 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | API trả HTML |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Parse error handled gracefully |
| **Kết quả test thực tế** | — |

### Nhóm 8: Image Analysis (Phân tích ảnh) (TC_AI_141 – TC_AI_155)

### TC_AI_141: Upload food image → analyze thành công

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_141 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Camera/gallery available |
| **Các bước thực hiện** | 1. Upload ảnh phở bò<br>2. Click AI Analyze |
| **Kết quả mong đợi** | AI nhận diện phở bò, suggest ingredients |
| **Kết quả test thực tế** | — |

### TC_AI_142: Clear photo result

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_142 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Đã upload ảnh và có kết quả |
| **Các bước thực hiện** | 1. Click 'Xóa ảnh' hoặc 'Chụp lại' |
| **Kết quả mong đợi** | Ảnh bị xóa, kết quả cleared |
| **Kết quả test thực tế** | — |

### TC_AI_143: Multiple images upload

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_143 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Upload 2 ảnh |
| **Các bước thực hiện** | 1. Upload ảnh 1, rồi ảnh 2 |
| **Kết quả mong đợi** | Ảnh 2 thay thế ảnh 1 |
| **Kết quả test thực tế** | — |

### TC_AI_144: Low quality image

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_144 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ảnh mờ, tối |
| **Các bước thực hiện** | 1. Upload ảnh low quality |
| **Kết quả mong đợi** | AI cố phân tích, hoặc thông báo 'Ảnh không rõ' |
| **Kết quả test thực tế** | — |

### TC_AI_145: Non-food image rejected

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_145 |
| **Loại** | Negative |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Ảnh xe hơi |
| **Các bước thực hiện** | 1. Upload ảnh xe |
| **Kết quả mong đợi** | NotFoodImageError: 'Không phải ảnh thức ăn' |
| **Kết quả test thực tế** | — |

### TC_AI_146: Image với nhiều dishes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_146 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ảnh có 3 món trên bàn |
| **Các bước thực hiện** | 1. Upload, AI analyze |
| **Kết quả mong đợi** | AI identify dominant dish hoặc list tất cả |
| **Kết quả test thực tế** | — |

### TC_AI_147: Image format JPG

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_147 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Ảnh .jpg |
| **Các bước thực hiện** | 1. Upload |
| **Kết quả mong đợi** | Upload thành công, AI analyze |
| **Kết quả test thực tế** | — |

### TC_AI_148: Image format PNG

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_148 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Ảnh .png |
| **Các bước thực hiện** | 1. Upload |
| **Kết quả mong đợi** | Upload thành công |
| **Kết quả test thực tế** | — |

### TC_AI_149: Image format HEIC (iOS)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_149 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ảnh .heic từ iPhone |
| **Các bước thực hiện** | 1. Upload |
| **Kết quả mong đợi** | Convert và upload thành công |
| **Kết quả test thực tế** | — |

### TC_AI_150: Large image file (10MB)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_150 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ảnh 10MB |
| **Các bước thực hiện** | 1. Upload |
| **Kết quả mong đợi** | Compress hoặc upload, AI analyze |
| **Kết quả test thực tế** | — |

### TC_AI_151: Camera capture trực tiếp

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_151 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Mobile với camera |
| **Các bước thực hiện** | 1. Click capture button<br>2. Chụp ảnh |
| **Kết quả mong đợi** | Ảnh captured và ready cho AI |
| **Kết quả test thực tế** | — |

### TC_AI_152: Gallery selection

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_152 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Photo gallery available |
| **Các bước thực hiện** | 1. Click gallery button<br>2. Chọn ảnh |
| **Kết quả mong đợi** | Ảnh từ gallery loaded |
| **Kết quả test thực tế** | — |

### TC_AI_153: Image preview trước analysis

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_153 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ảnh đã upload |
| **Các bước thực hiện** | 1. Kiểm tra preview |
| **Kết quả mong đợi** | Ảnh preview hiển thị trước khi click Analyze |
| **Kết quả test thực tế** | — |

### TC_AI_154: Analyze button sau upload

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_154 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Ảnh đã upload |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Nút 'Phân tích ảnh' enabled |
| **Kết quả test thực tế** | — |

### TC_AI_155: Image analysis dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_155 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, image uploaded |
| **Các bước thực hiện** | 1. Kiểm tra UI |
| **Kết quả mong đợi** | Image preview và buttons visible dark mode |
| **Kết quả test thực tế** | — |

### Nhóm 9: Advanced & Integration (Nâng cao & Tích hợp) (TC_AI_156 – TC_AI_210)

### TC_AI_156: MealPlanSuggestion: breakfast dishes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_156 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | suggestMealPlan() called |
| **Các bước thực hiện** | 1. Kiểm tra kết quả |
| **Kết quả mong đợi** | breakfastDishIds chứa dish IDs hợp lệ |
| **Kết quả test thực tế** | — |

### TC_AI_157: MealPlanSuggestion: lunch dishes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_157 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | suggestMealPlan() |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | lunchDishIds hợp lệ |
| **Kết quả test thực tế** | — |

### TC_AI_158: MealPlanSuggestion: dinner dishes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_158 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | suggestMealPlan() |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | dinnerDishIds hợp lệ |
| **Kết quả test thực tế** | — |

### TC_AI_159: MealPlanSuggestion: reasoning display

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_159 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Suggestion có reasoning |
| **Các bước thực hiện** | 1. Kiểm tra modal |
| **Kết quả mong đợi** | Reasoning text hiển thị giải thích vì sao chọn |
| **Kết quả test thực tế** | — |

### TC_AI_160: MealPlanSuggestion preview modal

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_160 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | AI suggestion plan ready |
| **Các bước thực hiện** | 1. Kiểm tra modal |
| **Kết quả mong đợi** | AISuggestionPreviewModal hiển thị plan gợi ý |
| **Kết quả test thực tế** | — |

### TC_AI_161: Rate limiting: request count tracking

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_161 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Nhiều requests |
| **Các bước thực hiện** | 1. Gửi 10 requests |
| **Kết quả mong đợi** | App track request count |
| **Kết quả test thực tế** | — |

### TC_AI_162: Rate limiting: cooldown message

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_162 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Hit rate limit |
| **Các bước thực hiện** | 1. Gửi quá nhiều requests |
| **Kết quả mong đợi** | 'Vui lòng chờ 60 giây trước khi thử lại' |
| **Kết quả test thực tế** | — |

### TC_AI_163: Rate limiting: countdown timer

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_163 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Rate limited |
| **Các bước thực hiện** | 1. Kiểm tra cooldown |
| **Kết quả mong đợi** | Timer đếm ngược hiển thị |
| **Kết quả test thực tế** | — |

### TC_AI_164: Rate limiting: auto-enable sau cooldown

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_164 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Cooldown hết |
| **Các bước thực hiện** | 1. Chờ cooldown kết thúc |
| **Kết quả mong đợi** | Nút AI enable lại |
| **Kết quả test thực tế** | — |

### TC_AI_165: Rate limiting: per-session tracking

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_165 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Rate limit |
| **Các bước thực hiện** | 1. Reload page |
| **Kết quả mong đợi** | Rate limit reset hoặc persist |
| **Kết quả test thực tế** | — |

### TC_AI_166: API response time < 5s typical

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_166 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Network bình thường |
| **Các bước thực hiện** | 1. Click AI, đo response time |
| **Kết quả mong đợi** | Response < 5s cho dish name analysis |
| **Kết quả test thực tế** | — |

### TC_AI_167: Modal render performance

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_167 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 5 suggestions |
| **Các bước thực hiện** | 1. Mở suggestion modal, đo render |
| **Kết quả mong đợi** | Modal render < 100ms |
| **Kết quả test thực tế** | — |

### TC_AI_168: Screen reader cho suggestions

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_168 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Screen reader bật |
| **Các bước thực hiện** | 1. Mở suggestions |
| **Kết quả mong đợi** | Screen reader đọc: tên ingredient, nutrition, checkbox state |
| **Kết quả test thực tế** | — |

### TC_AI_169: Keyboard navigation trong list

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_169 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Desktop, suggestions mở |
| **Các bước thực hiện** | 1. Tab, Arrow keys qua items |
| **Kết quả mong đợi** | Navigation hoạt động, Enter/Space toggle selection |
| **Kết quả test thực tế** | — |

### TC_AI_170: Memory cleanup khi modal close

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_170 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal đóng |
| **Các bước thực hiện** | 1. Close modal<br>2. Kiểm tra memory |
| **Kết quả mong đợi** | AbortController, event listeners cleaned up |
| **Kết quả test thực tế** | — |

### TC_AI_171: Suggestion cho 'Canh chua cá lóc'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_171 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dish = Canh chua cá lóc |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Gợi ý: cá lóc, me, cà chua, thơm, bạc hà, đậu bắp, giá |
| **Kết quả test thực tế** | — |

### TC_AI_172: Suggestion cho 'Bò kho'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_172 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dish = Bò kho |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Gợi ý: thịt bò, cà rốt, khoai tây, sả, gừng, quế, hồi |
| **Kết quả test thực tế** | — |

### TC_AI_173: Suggestion cho 'Chè đậu xanh'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_173 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish = Chè đậu xanh |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Gợi ý: đậu xanh, đường, nước cốt dừa, lá dứa |
| **Kết quả test thực tế** | — |

### TC_AI_174: Suggestion cho 'Bánh xèo'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_174 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dish = Bánh xèo |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Gợi ý: bột gạo, nghệ, nước cốt dừa, tôm, thịt, giá |
| **Kết quả test thực tế** | — |

### TC_AI_175: Suggestion cho ingredient 'Nước mắm'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_175 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Form ingredient, name = 'Nước mắm' |
| **Các bước thực hiện** | 1. Click AI nutrition suggest |
| **Kết quả mong đợi** | AI trả về nutrition: ~35kcal/15ml, sodium high |
| **Kết quả test thực tế** | — |

### TC_AI_176: AI suggest khi offline → queue hoặc error

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_176 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Offline |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Error: 'Không có mạng, AI cần kết nối internet' |
| **Kết quả test thực tế** | — |

### TC_AI_177: AI suggest khi API key expire

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_177 |
| **Loại** | Negative |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | API key hết hạn |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Error message + hướng dẫn cập nhật API key |
| **Kết quả test thực tế** | — |

### TC_AI_178: AI response với HTML injection attempt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_178 |
| **Loại** | Security |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | AI trả về '<script>alert(1)</script>' |
| **Các bước thực hiện** | 1. Kiểm tra display |
| **Kết quả mong đợi** | HTML escaped, không execute script |
| **Kết quả test thực tế** | — |

### TC_AI_179: AI response rất lớn (50 ingredients)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_179 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | AI trả về 50 items |
| **Các bước thực hiện** | 1. Kiểm tra modal |
| **Kết quả mong đợi** | Modal scrollable, performance OK |
| **Kết quả test thực tế** | — |

### TC_AI_180: AI suggest khi form đã có ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_180 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish đã có 3 ingredients |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | AI suggestions shown, existing ingredients preserved |
| **Kết quả test thực tế** | — |

### TC_AI_181: Suggestion modal responsive tablet

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_181 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 768px |
| **Các bước thực hiện** | 1. Mở suggestion modal |
| **Kết quả mong đợi** | Modal phù hợp tablet layout |
| **Kết quả test thực tế** | — |

### TC_AI_182: Suggestion nutrition labels i18n

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_182 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ngôn ngữ Việt |
| **Các bước thực hiện** | 1. Kiểm tra labels |
| **Kết quả mong đợi** | 'Calo', 'Đạm', 'Tinh bột', 'Chất béo' tiếng Việt |
| **Kết quả test thực tế** | — |

### TC_AI_183: AI suggest cho dish English name

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_183 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish = 'Grilled Salmon' |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | AI trả về ingredients phù hợp (salmon, olive oil, lemon) |
| **Kết quả test thực tế** | — |

### TC_AI_184: AI suggest accuracy check: tổng calories hợp lý

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_184 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | AI suggest 5 ingredients cho Phở |
| **Các bước thực hiện** | 1. Tính tổng calories |
| **Kết quả mong đợi** | Tổng calories hợp lý cho 1 serving phở (~350-500 kcal) |
| **Kết quả test thực tế** | — |

### TC_AI_185: Fuzzy match: 'Ca hoi' → 'Cá hồi'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_185 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | DB có 'Cá hồi' |
| **Các bước thực hiện** | 1. AI suggest 'Ca hoi' |
| **Kết quả mong đợi** | Fuzzy match tìm thấy 'Cá hồi' dù không có dấu |
| **Kết quả test thực tế** | — |

### TC_AI_186: AI suggestion history (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_186 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Đã dùng AI suggest nhiều lần |
| **Các bước thực hiện** | 1. Kiểm tra history |
| **Kết quả mong đợi** | Lịch sử gợi ý trước đó có thể xem lại |
| **Kết quả test thực tế** | — |

### TC_AI_187: AI suggest khi dish đang sync

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_187 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sync đang chạy |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | AI hoạt động bình thường, sync không ảnh hưởng |
| **Kết quả test thực tế** | — |

### TC_AI_188: AI suggest response cache (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_188 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Suggest 'Phở bò' 2 lần |
| **Các bước thực hiện** | 1. Lần 2 click AI |
| **Kết quả mong đợi** | Response từ cache (nhanh hơn) hoặc fresh request |
| **Kết quả test thực tế** | — |

### TC_AI_189: Suggestion modal close khi click outside

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_189 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal mở |
| **Các bước thực hiện** | 1. Click overlay |
| **Kết quả mong đợi** | Modal đóng |
| **Kết quả test thực tế** | — |

### TC_AI_190: Suggestion modal ESC close

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_190 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Modal mở, desktop |
| **Các bước thực hiện** | 1. Nhấn ESC |
| **Kết quả mong đợi** | Modal đóng |
| **Kết quả test thực tế** | — |

### TC_AI_191: SuggestedDishIngredient type validation

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_191 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | API response |
| **Các bước thực hiện** | 1. Kiểm tra type |
| **Kết quả mong đợi** | Mỗi item có: name(string), amount(number), unit(string), calories(number), protein, carbs, fat, fiber |
| **Kết quả test thực tế** | — |

### TC_AI_192: ConfirmedSuggestion output format

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_192 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Accept suggestions |
| **Các bước thực hiện** | 1. Kiểm tra onConfirm args |
| **Kết quả mong đợi** | ConfirmedSuggestion[] với đúng format |
| **Kết quả test thực tế** | — |

### TC_AI_193: AI response sanitization

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_193 |
| **Loại** | Security |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | API response |
| **Các bước thực hiện** | 1. Kiểm tra data |
| **Kết quả mong đợi** | Data được sanitize, không có XSS vectors |
| **Kết quả test thực tế** | — |

### TC_AI_194: useAISuggestion hook state management

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_194 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Hook usage |
| **Các bước thực hiện** | 1. Kiểm tra hook states |
| **Kết quả mong đợi** | States: idle, loading, success, error quản lý đúng |
| **Kết quả test thực tế** | — |

### TC_AI_195: geminiService.analyzeDishImage() called correctly

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_195 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Upload ảnh, click analyze |
| **Các bước thực hiện** | 1. Kiểm tra Network tab |
| **Kết quả mong đợi** | Request đến Gemini API với image data |
| **Kết quả test thực tế** | — |

### TC_AI_196: AI suggest khi app vừa khởi động

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_196 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Mở app, vào form dish ngay |
| **Các bước thực hiện** | 1. Click AI Suggest |
| **Kết quả mong đợi** | Hoạt động bình thường |
| **Kết quả test thực tế** | — |

### TC_AI_197: AI suggest sau khi import data

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_197 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Vừa import data mới |
| **Các bước thực hiện** | 1. Mở form dish, click AI |
| **Kết quả mong đợi** | AI hoạt động, fuzzy match với imported data |
| **Kết quả test thực tế** | — |

### TC_AI_198: Suggestion cho dish có tên rất ngắn: 'Cá'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_198 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish = 'Cá' |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | AI vẫn suggest (có thể generic: cá, muối, chanh) |
| **Kết quả test thực tế** | — |

### TC_AI_199: Suggestion cho dish tên rất dài

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_199 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish = 'Cơm chiên hải sản thập cẩm với tôm cua mực' |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | AI analyze full name, suggest phù hợp |
| **Kết quả test thực tế** | — |

### TC_AI_200: Concurrent AI requests prevention

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_200 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Click AI, rồi navigate và click AI ở form khác |
| **Các bước thực hiện** | 1. 2 AI requests |
| **Kết quả mong đợi** | Request trước bị abort khi request mới bắt đầu |
| **Kết quả test thực tế** | — |

### TC_AI_201: AI suggest cho 'Chả giò'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_201 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Dish = Chả giò |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Gợi ý: thịt heo, tôm, miến, mộc nhĩ, cà rốt, bánh tráng |
| **Kết quả test thực tế** | — |

### TC_AI_202: AI suggest cho 'Hủ tiếu Nam Vang'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_202 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish = Hủ tiếu Nam Vang |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Gợi ý: hủ tiếu, thịt heo, gan, tôm, giá, hẹ |
| **Kết quả test thực tế** | — |

### TC_AI_203: AI suggest cho 'Smoothie trái cây'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_203 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish = Smoothie trái cây |
| **Các bước thực hiện** | 1. Click AI |
| **Kết quả mong đợi** | Gợi ý: chuối, dâu tây, sữa chua, mật ong, đá |
| **Kết quả test thực tế** | — |

### TC_AI_204: AI nutrition auto-fill cho 'Muối'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_204 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ingredient = 'Muối' |
| **Các bước thực hiện** | 1. Click AI nutrition |
| **Kết quả mong đợi** | Calories ≈ 0, Sodium rất cao |
| **Kết quả test thực tế** | — |

### TC_AI_205: AI nutrition auto-fill cho 'Đường'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_205 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ingredient = 'Đường' |
| **Các bước thực hiện** | 1. Click AI nutrition |
| **Kết quả mong đợi** | Calories ≈ 387/100g, Carbs ≈ 100g |
| **Kết quả test thực tế** | — |

### TC_AI_206: Suggestion performance: 10 items render

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_206 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | AI trả về 10 suggestions |
| **Các bước thực hiện** | 1. Đo render time |
| **Kết quả mong đợi** | Modal render < 200ms |
| **Kết quả test thực tế** | — |

### TC_AI_207: AI API call includes dish context

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_207 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish có tên + existing ingredients |
| **Các bước thực hiện** | 1. Kiểm tra API request |
| **Kết quả mong đợi** | Request body chứa context (dish name, existing ingredients) |
| **Kết quả test thực tế** | — |

### TC_AI_208: Multiple suggest sessions: state isolated

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_208 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Suggest lần 1, cancel, suggest lần 2 |
| **Các bước thực hiện** | 1. 2 suggest sessions |
| **Kết quả mong đợi** | State từ lần 1 không leak sang lần 2 |
| **Kết quả test thực tế** | — |

### TC_AI_209: AI suggest integration test end-to-end

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_209 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Full flow |
| **Các bước thực hiện** | 1. Nhập dish name → Click AI → Select items → Accept → Verify form |
| **Kết quả mong đợi** | Ingredients thêm đúng vào form với nutrition data |
| **Kết quả test thực tế** | — |

### TC_AI_210: geminiService error wrapped correctly

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_AI_210 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | API error |
| **Các bước thực hiện** | 1. Kiểm tra error object |
| **Kết quả mong đợi** | Error có message rõ ràng, stack trace trong console |
| **Kết quả test thực tế** | — |

---

## Đề xuất Cải tiến

### Đề xuất 1: AI Learning from User Preferences
- **Vấn đề hiện tại**: AI suggestions generic, không personalized.
- **Giải pháp đề xuất**: Track user accepted/rejected suggestions. AI learn preferences over time.
- **Phần trăm cải thiện**: Suggestion relevance +50%, Accept rate +40%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 2: Batch Ingredient Suggest
- **Vấn đề hiện tại**: One dish at a time. Tedious for meal prep.
- **Giải pháp đề xuất**: Select 5 dishes → AI suggest ingredients for all at once.
- **Phần trăm cải thiện**: Planning speed +70%, User effort -60%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 3: Nutrition Accuracy Verification
- **Vấn đề hiện tại**: AI nutrition values may be inaccurate.
- **Giải pháp đề xuất**: Cross-reference with USDA/nutrition databases. Show confidence level.
- **Phần trăm cải thiện**: Nutrition accuracy +40%, User trust +50%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 4: Voice Input for Dish Name
- **Vấn đề hiện tại**: Must type dish name manually.
- **Giải pháp đề xuất**: Voice input: speak dish name → AI transcribe → suggest ingredients.
- **Phần trăm cải thiện**: Input speed +60%, Accessibility +40%
- **Mức độ ưu tiên**: Low | **Effort**: M

### Đề xuất 5: AI Substitution Suggestions
- **Vấn đề hiện tại**: No help when ingredient not available.
- **Giải pháp đề xuất**: 'Not available' button → AI suggest substitutes with similar nutrition.
- **Phần trăm cải thiện**: Flexibility +50%, User satisfaction +30%
- **Mức độ ưu tiên**: Medium | **Effort**: S

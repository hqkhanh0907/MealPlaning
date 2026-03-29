# Use Cases — Smart Meal Planner

**Version:** 2.0  
**Date:** 2026-07-20

---

## Actors

| Actor | Mô tả |
|-------|-------|
| **User** | Người dùng cuối — sử dụng app trực tiếp |
| **Gemini AI** | Google Gemini API — xử lý ảnh & sinh gợi ý |
| **SQLite** | Hệ thống lưu trữ chính (27 bảng, sql.js WebAssembly, xem `src/services/schema.ts`) |
| **IndexedDB** | Binary persistence layer cho SQLite database |
| **OPUS Worker** | Web Worker dịch offline |

---

## UC-01: Lập kế hoạch bữa ăn ngày

**Actor:** User  
**Precondition:** Đã có ít nhất 1 món ăn trong thư viện  
**Trigger:** User mở app, chọn tab Calendar

### Main Flow
1. User chọn ngày trên calendar
2. System hiển thị 3 slot (sáng/trưa/tối) với các món hiện có
3. User nhấn nút "+" trên một slot
4. System hiển thị `PlanningModal` với danh sách món lọc theo tag bữa
5. User chọn một hoặc nhiều món
6. System thêm món vào slot, tính toán lại tổng dinh dưỡng
7. System persist vào `localStorage` (`mp-day-plans`)

### Alternative Flows
- **A1: Xoá một món** — User nhấn "×" trên món → System xoá khỏi slot
- **A2: Xoá cả slot** — User nhấn "Xoá cả slot" → System xoá tất cả món trong slot đó
- **A3: Xoá kế hoạch** — User nhấn "Xoá kế hoạch" → Chọn scope (ngày/tuần/tháng) → System xoá
- **A4: AI gợi ý** — User nhấn "AI Gợi ý" → System gọi `useAISuggestion` → Xem UC-08

### Postcondition
Slot được cập nhật, tổng dinh dưỡng ngày tự động tính lại.

---

## UC-02: Xem tổng dinh dưỡng ngày

**Actor:** User  
**Trigger:** User chọn ngày trên Calendar

### Main Flow
1. User chọn ngày
2. System tính `DayNutritionSummary` từ tất cả món trong 3 slots
3. System hiển thị: Tổng calo, Protein, Carbs, Fat
4. System so sánh với `userProfile.targetCalories` và protein target (weight × proteinRatio)
5. System hiển thị thanh tiến trình % đạt mục tiêu

### Business Rule
- Protein target = `userProfile.weight × userProfile.proteinRatio` (g/ngày)
- Dinh dưỡng tính theo: `(ingredient.caloriesPer100 / 100) × dishIngredient.amount`

---

## UC-03: Thêm nguyên liệu mới

**Actor:** User  
**Trigger:** User nhấn "+ Thêm nguyên liệu" trên tab Management

### Main Flow
1. User nhấn nút "+"
2. System mở `IngredientEditModal` với form rỗng
3. User điền: Tên (tiếng Việt), Đơn vị (chọn từ dropdown), Calories/Protein/Carbs/Fat/Fiber per 100g
4. User nhấn "Lưu nguyên liệu"
5. System validate (tên bắt buộc, đơn vị bắt buộc, dinh dưỡng ≥ 0)
6. System tạo `id` mới bằng `generateId()`
7. System lưu vào `localStorage` (`mp-ingredients`)
8. System đóng modal, hiển thị toast success

### Alternative Flows
- **A1: Validation fail** — Hiển thị lỗi inline per-field, không đóng modal
- **A2: AI tra cứu** — User nhấn nút AI → Xem UC-09
- **A3: Ngôn ngữ EN** — User có thể điền cả tên tiếng Anh; nếu để trống, OPUS Worker sẽ dịch tự động

### Postcondition
Nguyên liệu mới xuất hiện trong danh sách, có thể dùng trong món ăn.

---

## UC-04: Thêm món ăn mới

**Actor:** User  
**Trigger:** User nhấn "+ Thêm món ăn" trên tab Management / Dishes

### Main Flow
1. User mở `DishEditModal`
2. User điền: Tên món, chọn Tags (sáng/trưa/tối)
3. User tìm kiếm và thêm nguyên liệu (nhập khối lượng)
4. System tính realtime: tổng calo/protein/carbs/fat
5. User nhấn "Lưu món ăn"
6. System validate và persist

### Alternative Flows
- **A1: Nhập từ AI** — User đã phân tích ảnh trước → Kết quả AI tự điền vào form (xem UC-07/UC-08)
- **A2: Thay đổi khối lượng** — Thay đổi amount → System recalculate realtime

---

## UC-05: Xem & chỉnh sửa Grocery List

**Actor:** User  
**Trigger:** User chuyển sang tab "Mua sắm"

### Main Flow
1. System tổng hợp tất cả nguyên liệu từ tất cả món ăn trong kế hoạch tuần hiện tại
2. System gom nhóm cùng nguyên liệu (cùng ingredient ID), cộng tổng khối lượng
3. System hiển thị danh sách với tên, tổng lượng, đơn vị
4. User check/uncheck từng item khi đã mua
5. State check được giữ trong component state (không persist)

### Business Rule
- Khi kế hoạch bữa ăn thay đổi → các item đã check bị reset nếu nguyên liệu thay đổi

---

## UC-06: Export/Import dữ liệu

**Actor:** User  
**Trigger:** User nhấn "Export" hoặc "Import" trong tab Settings

### Export Flow
1. System tổng hợp toàn bộ: ingredients, dishes, dayPlans, userProfile
2. System serialize thành JSON
3. **Android:** Dùng `Filesystem.writeFile` + `Share.share` → mở Android Share sheet
4. **Web:** Tạo Blob URL → trigger download

### Import Flow
1. User chọn file JSON
2. System đọc file, parse JSON
3. System validate cấu trúc (`validateImportData`)
4. System merge: ưu tiên dữ liệu import, giữ nguyên các items không bị ghi đè
5. System persist toàn bộ
6. System hiển thị toast: "Import thành công: X nguyên liệu, Y món ăn"

### Error Flow
- File không hợp lệ (JSON sai, schema thiếu field) → Toast error, không thay đổi dữ liệu hiện tại

---

## UC-07: Phân tích ảnh thức ăn bằng AI

**Actor:** User, Gemini AI  
**Precondition:** Đã có `GEMINI_API_KEY`  
**Trigger:** User chuyển sang tab "AI Phân tích"

### Main Flow
1. User chụp ảnh hoặc chọn từ thư viện
2. System compress ảnh (`imageCompression.ts`) → tối đa 1MB
3. System gửi ảnh (base64) lên `geminiService.analyzeDishImage()`
4. Gemini API phân tích → trả về: tên món, mô tả, danh sách nguyên liệu kèm dinh dưỡng
5. System hiển thị `AnalysisResultView` với kết quả preview
6. User xem preview, có thể chỉnh sửa tên
7. User nhấn "Lưu" → Xem UC-08

### Alternative Flows
- **A1: Ảnh không phải thức ăn** — Gemini trả về `isFood: false` → System hiển thị cảnh báo, KHÔNG crash
- **A2: Timeout (>30s)** — System hiển thị toast error "Phân tích thất bại"
- **A3: Network error** — System retry 2 lần với exponential backoff, hiển thị error nếu hết retry

---

## UC-08: Lưu kết quả AI thành Nguyên liệu + Món ăn

**Actor:** User  
**Trigger:** User nhấn "Lưu" sau khi xem kết quả AI (tiếp theo UC-07)

### Main Flow
1. System hiển thị `SaveAnalyzedDishModal` với:
   - Tên món (có thể sửa)
   - Checkbox "Tạo món ăn mới"
   - Tags bữa (nếu tạo món ăn)
   - Danh sách nguyên liệu đã phân tích
2. User xác nhận cấu hình, nhấn "Lưu"
3. System chạy `processAnalyzedDish()`:
   - Tạo `Ingredient` mới cho từng nguyên liệu chưa tồn tại
   - Nếu "Tạo món ăn": tạo `Dish` với các nguyên liệu vừa tạo
4. System persist tất cả vào `localStorage`
5. System hiển thị toast thành công

---

## UC-09: AI Gợi ý dinh dưỡng nguyên liệu

**Actor:** User, Gemini AI  
**Trigger:** User nhấn nút "AI" trong `IngredientEditModal`  
**Precondition:** Đã nhập Tên và Đơn vị

### Main Flow
1. System lấy tên + đơn vị nguyên liệu từ form
2. System gọi `geminiService.suggestIngredientInfo(name, unit)`
3. Gemini API dùng Google Search tool → tra cứu dinh dưỡng thực tế
4. System điền tự động: Calories/Protein/Carbs/Fat/Fiber per 100g
5. User xem kết quả, có thể sửa trước khi lưu

### Error Flow
- Not found / network error → Toast warning "Không tìm được nguyên liệu này"
- Timeout → Toast warning

---

## UC-10: AI Gợi ý thực đơn ngày

**Actor:** User, Gemini AI  
**Trigger:** User nhấn nút "AI Gợi ý" trên Calendar tab  
**Precondition:** Đã có ít nhất 3 món ăn

### Main Flow
1. System thu thập: danh sách món ăn (name, tags, calories, protein), mục tiêu calo/protein
2. System gọi `geminiService.suggestMealPlan()`
3. Gemini (với `ThinkingLevel.HIGH`) đề xuất: breakfastDishIds, lunchDishIds, dinnerDishIds, reasoning
4. System hiển thị `AISuggestionPreviewModal` với:
   - Tên các món được gợi ý
   - Tổng dinh dưỡng dự kiến
   - Reasoning (giải thích của AI)
5. User nhấn "Áp dụng" → System cập nhật kế hoạch ngày đang chọn
6. System chỉ ghi đè slots AI đề xuất, giữ nguyên các slot AI để trống

### Response Format

AI trả về `MealPlanSuggestion` type:

```typescript
interface MealPlanSuggestion {
  breakfastDishIds: string[];  // IDs món sáng được gợi ý
  lunchDishIds: string[];      // IDs món trưa được gợi ý
  dinnerDishIds: string[];     // IDs món tối được gợi ý
  reasoning: string;           // Giải thích lý do chọn các món
}
```

### Cross-references
- Test cases: TC_AIS_01–TC_AIS_55 trong [scenario-analysis-and-testcases.md](../04-testing/scenario-analysis-and-testcases.md)

---

## UC-11: Cài đặt mục tiêu dinh dưỡng

**Actor:** User  
**Trigger:** User nhấn icon "Mục tiêu" → `GoalSettingsModal`

### Main Flow
1. User điền: Cân nặng (kg), Calo mục tiêu (kcal/ngày), Tỉ lệ protein (g/kg)
2. System tính: Protein target = weight × proteinRatio
3. System persist `userProfile` vào `localStorage` (`mp-user-profile`)
4. System cập nhật thanh tiến trình dinh dưỡng trên Calendar tab

---

## UC-12: Chuyển đổi ngôn ngữ

**Actor:** User  
**Trigger:** User nhấn nút ngôn ngữ trong Settings tab

### Main Flow
1. User chọn: Tiếng Việt / English
2. System gọi `i18n.changeLanguage(lang)`
3. Toàn bộ UI text cập nhật ngay lập tức
4. System persist ngôn ngữ vào `localStorage` (via i18next browser detector)
5. Các tên nguyên liệu/món ăn hiển thị theo ngôn ngữ đã chọn (LocalizedString)

---

## UC-13: Dịch tự động tên nguyên liệu/món ăn

**Actor:** User (implicit), OPUS Worker  
**Trigger:** User tạo nguyên liệu/món ăn chỉ điền 1 ngôn ngữ

### Main Flow
1. Khi User lưu nguyên liệu/món ăn chỉ có tên VI mà không có EN (hoặc ngược lại)
2. System tra cứu `foodDictionary.ts` (static dictionary 200+ entries) — nếu có kết quả, dùng ngay (O(1) lookup, ~0ms)
3. Nếu dictionary không có kết quả → System enqueue task vào `translateQueueService`
4. Background Web Worker (`translate.worker.ts`) xử lý với OPUS model (offline)
5. Worker dịch xong → `updateTranslatedField()` cập nhật tên ngôn ngữ kia
6. Quá trình dịch diễn ra hoàn toàn trong nền, user không cần theo dõi trạng thái

> **Note:** Bước 2 (dictionary lookup) diễn ra tại save-time, trước khi gọi Worker fallback. Xem [ADR-004](../adr/004-food-dictionary-instant-translation.md) cho chi tiết kiến trúc.

### Cross-references
- Test cases: TC_TRN_01–TC_TRN_52 trong [scenario-analysis-and-testcases.md](../04-testing/scenario-analysis-and-testcases.md)

---

## UC-14: Copy Plan — Sao chép kế hoạch bữa ăn

**Actor:** User  
**Trigger:** User nhấn nút Copy trên Calendar tab  
**Precondition:** Ngày đang chọn có ít nhất 1 món ăn trong bất kỳ slot nào

### Main Flow
1. User nhấn nút "Copy" trên Calendar tab
2. System mở `CopyPlanModal` hiển thị calendar multi-select
3. User chọn một hoặc nhiều ngày đích
4. System hiển thị preview: ngày nguồn → danh sách ngày đích
5. User nhấn "Xác nhận"
6. System gọi `useCopyPlan` hook → sao chép toàn bộ 3 slots (sáng/trưa/tối) từ ngày nguồn sang các ngày đích
7. System persist kế hoạch mới vào `localStorage` (`mp-day-plans`)
8. System hiển thị toast success: "Đã copy kế hoạch sang X ngày"

### Alternative Flows
- **A1: Ngày đích đã có kế hoạch** — System ghi đè (overwrite) toàn bộ slots của ngày đích
- **A2: Không chọn ngày đích** — Nút "Xác nhận" bị disable
- **A3: Copy sang nhiều ngày (tối đa 7)** — Xử lý batch, cùng một lần persist

### Postcondition
Các ngày đích có cùng kế hoạch bữa ăn như ngày nguồn. Tổng dinh dưỡng tự động tính lại cho mỗi ngày đích.

### Cross-references
- Test cases: TC_CPY_01–TC_CPY_52 trong [scenario-analysis-and-testcases.md](../04-testing/scenario-analysis-and-testcases.md)

---

## UC-15: Template Management — Quản lý template bữa ăn

**Actor:** User  
**Trigger:** User nhấn nút Template trên Calendar tab

### Main Flow — Lưu Template
1. User nhấn nút "Lưu Template" khi ngày đang chọn có kế hoạch
2. System mở dialog nhập tên template
3. User nhập tên, nhấn "Lưu"
4. System lưu template gồm: tên, 3 slots (sáng/trưa/tối) với dish IDs
5. System persist vào `localStorage` (`mp-meal-templates`) thông qua `useMealTemplate` hook
6. System hiển thị toast success

### Main Flow — Áp dụng Template
1. User nhấn nút "Template" → System hiển thị danh sách templates đã lưu
2. User chọn một template
3. System hiển thị preview nội dung template
4. User nhấn "Áp dụng"
5. System ghi đè kế hoạch ngày đang chọn bằng nội dung template
6. System persist và tính lại tổng dinh dưỡng

### Alternative Flows
- **A1: Đổi tên template** — User nhấn icon edit → nhập tên mới → System cập nhật
- **A2: Xoá template** — User nhấn icon delete → confirm → System xoá template
- **A3: Danh sách rỗng** — Hiển thị empty state: "Chưa có template nào"

### Postcondition
Template được lưu/áp dụng/xoá thành công. Kế hoạch bữa ăn được cập nhật nếu áp dụng template.

### Cross-references
- Test cases: TC_TMP_01–TC_TMP_52 trong [scenario-analysis-and-testcases.md](../04-testing/scenario-analysis-and-testcases.md)
- Liên quan: TC_SVT_01–TC_SVT_52 (Save Template flow)

---

## UC-16: AI Gợi ý Nguyên liệu cho Món ăn

**Actor:** User, Gemini AI  
**Trigger:** User nhấn nút "AI" trong `DishEditModal`  
**Precondition:** Đã nhập tên món ăn, đã có `GEMINI_API_KEY`

### Main Flow
1. User mở `DishEditModal` và nhập tên món ăn
2. User nhấn nút "AI Gợi ý nguyên liệu"
3. System gọi `suggestIngredientsForDish(dishName)` gửi tên món lên Gemini API
4. Gemini API phân tích → trả về danh sách nguyên liệu kèm khối lượng gợi ý và thông tin dinh dưỡng
5. System hiển thị preview danh sách nguyên liệu với checkbox cho từng item
6. User xem, chỉnh sửa, bỏ chọn nguyên liệu không mong muốn
7. User nhấn "Áp dụng"
8. System kiểm tra từng nguyên liệu: nếu chưa tồn tại → tạo `Ingredient` mới
9. System thêm các nguyên liệu đã chọn vào form `DishEditModal`
10. System tính lại tổng dinh dưỡng món ăn realtime

### Alternative Flows
- **A1: Tên món trống** — Nút AI bị disable, hiển thị tooltip "Nhập tên món trước"
- **A2: Timeout (>30s)** — Toast error "Gợi ý nguyên liệu thất bại — vui lòng thử lại"
- **A3: Network error** — Toast warning với nút retry
- **A4: User bỏ chọn tất cả** — Nút "Áp dụng" bị disable

### Postcondition
Nguyên liệu được gợi ý bởi AI đã được thêm vào form món ăn. Nguyên liệu mới (nếu có) đã được tạo trong hệ thống.

### Cross-references
- Test cases: TC_AIA_01–TC_AIA_55 trong [scenario-analysis-and-testcases.md](../04-testing/scenario-analysis-and-testcases.md)

---

## UC-17: Quản lý Fitness Profile

**Actor:** User  
**Trigger:** User mở tab Fitness hoặc truy cập Fitness Profile từ Settings

### Main Flow
1. User mở `FitnessTab` lần đầu
2. System hiển thị `FitnessOnboarding` flow
3. User điền: experience level, fitness goal, body stats (chiều cao, cân nặng, body fat %)
4. System lưu vào bảng `fitness_profiles`
5. User cấu hình preferences (hệ đơn vị kg/lbs, rest timer duration, thông báo)
6. System lưu vào bảng `fitness_preferences`
7. System hiển thị `ProgressDashboard` với streak, milestones

### Alternative Flows
- **A1: Chỉnh sửa profile** — User mở `TrainingProfileSection` → cập nhật training days, equipment, periodization
- **A2: Xem training plan** — User mở `TrainingPlanView` → xem kế hoạch tập luyện theo tuần

### Postcondition
Fitness profile được lưu, training plan khả dụng, dashboard hiển thị dữ liệu cá nhân.

---

## UC-18: Workout Logging & Drafts

**Actor:** User  
**Trigger:** User nhấn "Bắt đầu tập" trên FitnessTab hoặc tiếp tục workout draft

### Main Flow
1. User chọn buổi tập từ training plan hoặc tạo workout mới
2. System mở `WorkoutLogger` với danh sách exercises
3. User ghi nhận từng set: reps, weight (qua `SetEditor`)
4. System lưu draft liên tục vào bảng `workout_drafts` (auto-save)
5. User hoàn thành buổi tập, nhấn "Kết thúc"
6. System chuyển draft thành workout record (bảng `workouts` + `workout_sets`)
7. System xoá draft, cập nhật streak, kiểm tra milestones/PR

### Alternative Flows
- **A1: Tạm dừng giữa chừng** — Draft được giữ trong `workout_drafts`, user quay lại tiếp tục sau
- **A2: Cardio logging** — User mở `CardioLogger` → ghi nhận thời gian, loại cardio → ước tính calories đốt
- **A3: Rest timer** — `RestTimer` tự động đếm ngược giữa các sets
- **A4: Progressive overload** — `useProgressiveOverload` hook gợi ý tăng weight/reps dựa trên lịch sử

### Postcondition
Workout được ghi nhận đầy đủ. Draft đã xoá. Dashboard cập nhật streak, volume, PRs.

### Cross-references
- Store: `fitnessStore.ts` (Zustand)
- Bridge: `useFitnessNutritionBridge` — đồng bộ calories đốt với mục tiêu dinh dưỡng

---

## UC_ONBOARD: User Onboarding with Plan Strategy Choice

**Actor:** User  
**Precondition:** Lần đầu mở app hoặc chưa hoàn thành onboarding  
**Trigger:** User mở app lần đầu

### Main Flow
1. System hiển thị `UnifiedOnboarding` với 7 sections
2. **Section 1 — Welcome:** 3 slides giới thiệu app, user swipe hoặc nhấn "Tiếp"
3. **Section 2 — Health Basic:** User điền 4 steps:
   - Giới tính (male/female)
   - Ngày sinh → system tính tuổi
   - Chiều cao (cm), Cân nặng (kg)
   - Mức độ hoạt động (sedentary/light/moderate/active/extra_active)
4. **Section 3 — Training Core:** User chọn mục tiêu tập luyện (strength/hypertrophy/endurance/general)
5. **Section 4 — Training Detail:** User điền 4–9 steps adaptive:
   - Experience level (beginner/intermediate/advanced)
   - Số ngày tập/tuần (2–6)
   - Thời lượng session (30/45/60/90 phút)
   - Equipment available, chấn thương (injuries), cardio sessions/tuần
6. **Section 5 — Strategy Choice:** User chọn 1 trong 2 paths:
   - **"Để app lên kế hoạch"** (auto) → tiếp tục Section 6
   - **"Tự lên kế hoạch"** (manual) → nhảy sang Section 7
7. **Section 6 — Plan Computing** (chỉ auto path): Animation computing, system tạo plan tự động dựa trên profile
8. **Section 7 — Plan Preview:** Hiển thị kế hoạch tuần, user xem trước và xác nhận

### Alternative Flows
- **A1: Quay lại bước trước** — User nhấn "Quay lại" → system hiển thị bước trước
- **A2: Skip onboarding** — Nếu đã có profile → system bỏ qua onboarding, vào Dashboard
- **A3: Manual path adjust** — User chọn manual → tự chọn exercises, workout/rest cho từng ngày

### Postcondition
Profile lưu vào bảng `user_profile`, `training_profile`, `health_profile`. Training plan được tạo trong `training_plans` + `training_plan_days`. User vào Dashboard.

---

## UC_PLAN_VIEW: View Weekly Training Plan

**Actor:** User  
**Precondition:** Đã hoàn thành onboarding, có training plan  
**Trigger:** User mở tab "Tập luyện" → xem Training Plan

### Main Flow
1. System hiển thị `TrainingPlanView` với weekly calendar
2. 7 day pills hiển thị: `T2, T3, T4, T5, T6, T7, CN` (Thứ 2 – Chủ Nhật)
3. Mỗi day pill hiển thị label: loại workout (ví dụ: "Push", "Pull", "Legs", "Upper", "Lower") hoặc "Nghỉ"
4. User nhấn vào day pill
5. System hiển thị chi tiết ngày:
   - Danh sách exercises với: tên bài tập, nhóm cơ, sets × reps, weight gợi ý
   - Thời gian ước tính cho buổi tập
   - Session tabs nếu có nhiều buổi

### Alternative Flows
- **A1: Ngày nghỉ** — Day pill hiển thị "Nghỉ", nhấn vào có thể toggle sang workout
- **A2: Chỉnh sửa ngày** — User nhấn "Chỉnh sửa" → mở `PlanDayEditor` (xem UC_PLAN_EDIT)

### Postcondition
User xem được kế hoạch tập luyện tuần đầy đủ.

---

## UC_PLAN_EDIT: Edit Exercises on a Training Day

**Actor:** User  
**Precondition:** Đã có training plan, ngày đang chọn là workout day  
**Trigger:** User nhấn "Chỉnh sửa" trên chi tiết ngày

### Main Flow
1. System mở `PlanDayEditor` với danh sách exercises hiện tại
2. User thực hiện các thao tác chỉnh sửa:
   - **Add:** Nhấn "Thêm bài tập" → chọn từ exercise database → default 3 sets, default reps, 90s rest
   - **Remove:** Nhấn icon xoá → exercise chuyển sang pending removal (undo 5 giây)
   - **Move up/down:** Nhấn arrows → đổi vị trí exercise trong danh sách
   - **Swap:** Nhấn icon swap → chọn exercise thay thế → giữ nguyên sets/reps/rest
   - **Edit parameters:** Expand exercise → chỉnh sets (1–10), reps min/max (1–30), rest (30–300s)
3. User nhấn "Lưu"
4. System persist thay đổi qua `updatePlanDayExercises()`

### Alternative Flows
- **A1: Undo removal** — Trong 5 giây sau khi xoá, user nhấn "Hoàn tác" → exercise khôi phục
- **A2: Restore original** — User nhấn "Khôi phục" → toàn bộ exercises trở về trạng thái ban đầu
- **A3: Thoát khi có unsaved changes** — System hiển thị warning dialog, user chọn Lưu/Bỏ/Huỷ

### Postcondition
Danh sách exercises được cập nhật trong `training_plan_days`. Plan view refresh hiển thị thay đổi.

---

## UC_SESSION: Add/Manage Multiple Workout Sessions

**Actor:** User  
**Precondition:** Đã có training plan, đang xem workout day  
**Trigger:** User nhấn "Thêm buổi tập" hoặc chuyển session tabs

### Main Flow — Thêm Session
1. User nhấn nút "Thêm buổi tập" (nếu < 3 sessions)
2. System mở `AddSessionModal`
3. User chọn loại session:
   - **Strength** → chọn nhóm cơ (chest/back/shoulders/legs/arms/core/glutes)
   - **Cardio** → session cardio mặc định
   - **Freestyle** → workout tuỳ chỉnh
4. System tạo session mới, gắn vào ngày hiện tại
5. System hiển thị session tab mới: "Buổi 2" hoặc "Buổi 3"

### Main Flow — Switch Session
1. `SessionTabs` hiển thị pills: "Buổi 1", "Buổi 2", ... với icons (Sun/Moon/Sunset)
2. User nhấn pill → system switch hiển thị exercises của session đó

### Alternative Flows
- **A1: Xoá session** — Long-press/right-click trên session tab → confirm → system xoá session
- **A2: Đánh dấu hoàn thành** — User toggle completed state trên session
- **A3: Tối đa 3 sessions** — Nếu đã có 3 sessions, nút "Thêm buổi tập" bị disable

### Postcondition
Ngày có nhiều sessions, mỗi session có danh sách exercises riêng.

---

## UC_DAY_TOGGLE: Toggle Day Between Workout/Rest

**Actor:** User  
**Precondition:** Đã có training plan  
**Trigger:** User nhấn toggle trên day detail hoặc long-press day pill

### Main Flow
1. User mở chi tiết ngày (hoặc long-press day pill)
2. User nhấn toggle "Workout ↔ Nghỉ"
3. **Nếu chuyển từ Workout → Rest:**
   - System ẩn danh sách exercises
   - Day pill hiển thị "Nghỉ"
4. **Nếu chuyển từ Rest → Workout:**
   - System hiển thị danh sách exercises (nếu đã có) hoặc form thêm exercises
   - Day pill hiển thị loại workout

### Postcondition
Ngày được toggle giữa workout/rest. Training plan cập nhật trong database.

---

## UC_WORKOUT_LOG: Log a Workout with Weight/Reps

**Actor:** User  
**Precondition:** Đã có training plan hoặc tạo workout mới  
**Trigger:** User nhấn "Bắt đầu tập" hoặc tiếp tục workout draft

### Main Flow
1. User chọn buổi tập từ training plan hoặc tạo workout mới
2. System mở `WorkoutLogger` với danh sách exercises
3. Cho từng exercise, user ghi nhận từng set qua `SetEditor`:
   - Reps completed
   - Weight (kg/lbs tuỳ theo preference)
   - RPE (Rate of Perceived Exertion) — optional
4. System lưu draft liên tục vào bảng `workout_drafts` (auto-save)
5. `RestTimer` tự động đếm ngược giữa các sets (tuỳ chỉnh trong preferences)
6. `useProgressiveOverload` hook gợi ý tăng weight/reps dựa trên lịch sử
7. User hoàn thành tất cả exercises, nhấn "Kết thúc"
8. System chuyển draft thành workout record (bảng `workouts` + `workout_sets`)
9. System xoá draft, cập nhật streak, kiểm tra milestones/PR

### Alternative Flows
- **A1: Tạm dừng** — Draft giữ trong `workout_drafts`, user quay lại tiếp tục sau
- **A2: Skip set** — User bỏ qua set → ghi nhận 0 reps
- **A3: Cancel workout** — User huỷ → system xoá draft

### Postcondition
Workout record được lưu đầy đủ. Dashboard cập nhật streak, volume, PRs.

---

## UC_CARDIO_LOG: Log Cardio Session

**Actor:** User  
**Precondition:** Có session cardio hoặc tạo mới  
**Trigger:** User chọn cardio session hoặc nhấn "Log Cardio"

### Main Flow
1. User mở `CardioLogger`
2. User chọn loại cardio (chạy bộ, đạp xe, bơi, ...)
3. User nhập: thời gian (phút), khoảng cách (km) — optional
4. System ước tính calories đốt dựa trên loại cardio + thời gian + cân nặng user
5. User xác nhận, nhấn "Lưu"
6. System lưu vào bảng `workouts` với type = 'cardio'

### Alternative Flows
- **A1: Chỉ nhập thời gian** — System ước tính calories dựa trên thời gian + MET value
- **A2: Chỉnh sửa calories** — User override calories ước tính trước khi lưu

### Postcondition
Cardio session được ghi nhận. Dashboard cập nhật calories đốt, streak.

---

## UC_WEIGHT_LOG: Log Daily Body Weight

**Actor:** User  
**Precondition:** Đã có user profile  
**Trigger:** User nhấn "Log cân nặng" từ Dashboard QuickActionsBar hoặc WeightMini

### Main Flow
1. System mở `WeightQuickLog` bottom sheet modal
2. User nhập cân nặng (kg hoặc lbs tuỳ preference)
3. User nhấn "Lưu"
4. System lưu vào bảng `weight_log` (1 entry/ngày, overwrite nếu đã có)
5. System cập nhật `WeightMini` trên Dashboard
6. System đóng modal, hiển thị toast success

### Alternative Flows
- **A1: Đã log hôm nay** — System hiện giá trị cũ, user có thể overwrite
- **A2: Biến động lớn** — Nếu chênh > 2kg so với entry trước → hiển thị cảnh báo xác nhận

### Postcondition
Weight log entry được lưu. Dashboard WeightMini cập nhật. Biểu đồ weight trend cập nhật.

---

## UC_DASHBOARD: View Daily Dashboard Summary

**Actor:** User  
**Trigger:** User mở tab "Tổng quan" (tab thứ 5)

### Main Flow
1. System load `DashboardTab` với 5 tier progressive loading
2. **Tier 1 (0ms):** `DailyScoreHero` hiển thị điểm hiệu suất ngày (dựa trên bữa ăn + workout + weight log)
3. **Tier 2 (30ms):** `EnergyBalanceMini` hiển thị calorie intake vs target; `ProteinProgress` hiển thị protein progress bar
4. **Tier 3 (60ms):** `TodaysPlanCard` hiển thị preview bữa ăn & workout hôm nay; `WeightMini` hiển thị cân nặng (tap để log nhanh); `StreakMini` hiển thị workout streak
5. **Tier 4 (lazy):** `AutoAdjustBanner` gợi ý điều chỉnh calo nếu cần; `AiInsightCard` hiển thị AI health tips
6. **Tier 5 (lazy):** `QuickActionsBar` hiển thị quick actions
7. User tương tác: nhấn quick action → navigate đến flow tương ứng (log weight, log meal, start workout)

### Alternative Flows
- **A1: Chưa có data** — Hiển thị empty states với hướng dẫn getting started
- **A2: Error trong 1 tier** — Error boundary bắt lỗi, tier bị lỗi hiển thị fallback, các tiers khác vẫn hoạt động
- **A3: Reduced motion** — Tắt stagger animation, hiển thị tất cả cùng lúc

### Postcondition
User xem được tổng quan đầy đủ: dinh dưỡng, tập luyện, cân nặng, quick actions.

---

## UC_AI_ANALYZE: Use AI to Analyze Food Image

**Actor:** User, Gemini AI  
**Precondition:** Đã có `GEMINI_API_KEY`, tab "AI Phân tích" đang mở  
**Trigger:** User chuyển sang tab "AI Phân tích" (tab thứ 3)

### Main Flow
1. System hiển thị `AIImageAnalyzer` với 3-step progress indicator
2. **Step 1 — Chụp ảnh:**
   - User chụp từ camera hoặc chọn ảnh từ thư viện qua `ImageCapture`
   - System compress ảnh tối đa 1MB
   - Hiển thị preview ảnh, nút "Xoá" để chọn lại
3. **Step 2 — AI phân tích:**
   - User nhấn "Phân tích"
   - System gửi base64 image lên `geminiService.analyzeDishImage()`
   - Loading spinner hiển thị "Đang phân tích..."
   - Gemini trả về: tên món, mô tả, danh sách nguyên liệu kèm dinh dưỡng
4. **Step 3 — Lưu món:**
   - `AnalysisResultView` hiển thị kết quả: calories, protein, carbs, fat
   - Danh sách nguyên liệu với khối lượng chi tiết
   - User có thể chỉnh sửa tên món, bỏ chọn nguyên liệu
   - User nhấn "Lưu" → `SaveAnalyzedDishModal` mở
   - User chọn: chỉ lưu nguyên liệu / lưu cả món ăn + tags
   - System tạo `Ingredient` mới (nếu chưa tồn tại) + optional `Dish`
   - System persist vào SQLite database

### Alternative Flows
- **A1: Ảnh không phải thức ăn** — Gemini trả về `isFood: false` → hiển thị cảnh báo, không crash
- **A2: Timeout >30s** — Toast error "Phân tích thất bại", user retry
- **A3: Network error** — Retry 2 lần exponential backoff, hiển thị error nếu hết retry
- **A4: User chỉnh sửa trước lưu** — Sửa tên, thêm/bớt nguyên liệu, thay đổi khối lượng

### Postcondition
Nguyên liệu + món ăn mới được lưu vào database. Có thể sử dụng ngay trong meal planning.

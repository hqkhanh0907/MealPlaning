# Plan: AI Suggestion Preview Modal

## Tổng quan

Cải thiện flow "AI Gợi ý" để thêm bước Preview & Xác Nhận trước khi apply vào kế hoạch thực tế. Tăng sự kiểm soát và tin tưởng của người dùng.

---

## Kết quả phân tích hiện trạng

| #   | Yêu cầu                          | Trạng thái     | Chi tiết                |
| --- | -------------------------------- | -------------- | ----------------------- |
| 1   | Nút "AI Gợi ý" với loading state | ✅ Có          | Button với spinner      |
| 2   | Full-screen loading overlay      | ❌ Chưa có     | Chỉ có spinner nhỏ      |
| 3   | **Preview Modal**                | ❌ **CHƯA CÓ** | AI apply thẳng vào plan |
| 4   | Badge "AI Suggested"             | ❌ Chưa có     |                         |
| 5   | Chỉnh sửa món trong preview      | ❌ Chưa có     |                         |
| 6   | Regenerate button                | ❌ Chưa có     |                         |
| 7   | Áp dụng từng bữa (toggle)        | ❌ Chưa có     |                         |
| 8   | Reasoning hiển thị               | ⚠️ Chỉ ở toast |                         |
| 9   | Animation khi apply              | ❌ Chưa có     |                         |
| 10  | Xử lý lỗi chi tiết               | ⚠️ Cơ bản      |                         |

---

## Thiết kế UI/UX

### Modal Preview Layout

```
┌─────────────────────────────────────────────────────────┐
│  ✨ Gợi ý bữa ăn hôm nay từ AI              [X Close]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💡 "AI đã phân tích mục tiêu 1800 kcal và 120g        │
│      protein để đề xuất thực đơn cân đối cho bạn"      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [✓] BỮA SÁNG                    [✏️ Thay đổi]  │   │
│  │     🍳 Trứng chiên                              │   │
│  │     🥗 Salad rau củ                             │   │
│  │     ────────────────────                        │   │
│  │     350 kcal · 25g protein                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [✓] BỮA TRƯA                    [✏️ Thay đổi]  │   │
│  │     🍗 Ức gà áp chảo                            │   │
│  │     🍚 Cơm gạo lứt                              │   │
│  │     ────────────────────                        │   │
│  │     580 kcal · 45g protein                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [✓] BỮA TỐI                     [✏️ Thay đổi]  │   │
│  │     🐟 Cá hồi nướng                             │   │
│  │     🥬 Rau xào                                  │   │
│  │     ────────────────────                        │   │
│  │     520 kcal · 40g protein                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  TỔNG: 1450 kcal · 110g protein                        │
│  Mục tiêu: 1800 kcal · 120g protein                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Hủy]        [🔄 Gợi ý lại]        [✅ Áp dụng]       │
└─────────────────────────────────────────────────────────┘
```

### States

1. **Loading State**: Full-screen overlay với animated progress
2. **Preview State**: Modal hiển thị gợi ý với options
3. **Edit State**: Quick picker khi click "Thay đổi"
4. **Error State**: Thông báo lỗi + retry option
5. **Empty State**: Khi AI không tìm được gợi ý phù hợp

---

## Implementation Plan

### Phase 1: Tạo AISuggestionPreviewModal component

**File mới:** `src/components/modals/AISuggestionPreviewModal.tsx`

**Props:**

```typescript
interface AISuggestionPreviewModalProps {
  isOpen: boolean;
  suggestion: MealPlanSuggestion | null;
  dishes: Dish[];
  ingredients: Ingredient[];
  targetCalories: number;
  targetProtein: number;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onApply: (
    suggestion: MealPlanSuggestion,
    selectedMeals: { breakfast: boolean; lunch: boolean; dinner: boolean },
  ) => void;
  onRegenerate: () => void;
  onEditMeal: (type: MealType, dishIds: string[]) => void;
}
```

**Features:**

1. Header với title + close button
2. Reasoning card hiển thị lý do AI gợi ý
3. 3 meal cards với:
   - Checkbox để chọn áp dụng
   - Danh sách món + nutrition
   - Nút "Thay đổi" mở quick picker
4. Summary bar: tổng nutrition vs mục tiêu
5. Footer với 3 buttons: Hủy / Gợi ý lại / Áp dụng

### Phase 2: Cập nhật App.tsx

**Thay đổi:**

1. Thêm state:
   - `aiSuggestion: MealPlanSuggestion | null`
   - `isAISuggestionModalOpen: boolean`
   - `aiSuggestionError: string | null`
2. Refactor `handleSuggestMealPlan`:
   - Không apply thẳng vào dayPlans
   - Set suggestion vào state và mở modal
3. Thêm handler:
   - `handleApplySuggestion`: Apply gợi ý vào dayPlans
   - `handleRegenerateSuggestion`: Gọi AI lại
   - `handleEditSuggestionMeal`: Cập nhật suggestion state

### Phase 3: Loading Overlay

**Thêm vào AISuggestionPreviewModal:**

- Full-screen overlay khi `isLoading=true`
- Animated icon + progress text
- Cancel button (optional)

### Phase 4: Quick Edit trong Preview

**Mini feature:**

- Khi click "Thay đổi" trên 1 bữa → mở simplified picker
- Picker chỉ filter món có tag phù hợp
- Cập nhật `suggestion` state, không ảnh hưởng dayPlans

---

## Phase 5: Cập nhật Test Cases

### Section C4 (AI Suggest) — Thay đổi hoàn toàn:

| ID        | Tên                                   | Mô tả                                                           |
| --------- | ------------------------------------- | --------------------------------------------------------------- | --------- |
| PLAN_A_01 | Nút "Gợi ý AI" — loading state        | Button disabled + spinner, **mở loading overlay**               |
| PLAN_A_02 | Loading overlay                       | Full-screen overlay "AI đang phân tích..." với animation        |
| PLAN_A_03 | Preview Modal mở sau khi AI hoàn tất  | Modal hiển thị gợi ý với 3 meal cards                           |
| PLAN_A_04 | Reasoning card                        | Hiển thị lý do AI chọn thực đơn                                 |
| PLAN_A_05 | Checkbox chọn áp dụng từng bữa        | Mặc định all checked, có thể uncheck                            |
| PLAN_A_06 | Nutrition summary                     | Tổng cal/protein vs mục tiêu                                    |
| PLAN_A_07 | Nút "Thay đổi" mở quick picker        | Cho phép thay món trong preview                                 |
| PLAN_A_08 | Nút "Gợi ý lại" (Regenerate)          | Gọi AI lần nữa, update preview                                  |
| PLAN_A_09 | Nút "Hủy" đóng modal                  | Không thay đổi kế hoạch                                         |
| PLAN_A_10 | Nút "Áp dụng" — chỉ apply bữa đã chọn | Áp dụng + animation + toast success                             |
| PLAN_A_11 | AI không tìm được gợi ý               | Hiển thị empty state + Regenerate option                        |
| PLAN_A_12 | Network lỗi / timeout                 | Error message + Retry button                                    |
| PLAN_A_13 | Regenerate giữ edit của user          | Nếu user đã edit bữa sáng, regenerate chỉ tạo lại bữa chưa edit | Edge case |

---

## Thứ tự thực hiện

| Bước | Task                                   | Độ phức tạp | Ưu tiên    |
| ---- | -------------------------------------- | ----------- | ---------- |
| 1    | Tạo AISuggestionPreviewModal component | Cao         | Cao        |
| 2    | Cập nhật App.tsx state & handlers      | Trung bình  | Cao        |
| 3    | Tích hợp Loading Overlay               | Thấp        | Trung bình |
| 4    | Quick Edit trong Preview               | Trung bình  | Trung bình |
| 5    | Cập nhật test-cases-v2.md              | Thấp        | Sau code   |

---

## Estimated Changes

| File                                  | Thêm mới  | Sửa       |
| ------------------------------------- | --------- | --------- |
| `modals/AISuggestionPreviewModal.tsx` | ~350 LOC  | -         |
| `App.tsx`                             | ~50 LOC   | ~30 LOC   |
| `CalendarTab.tsx`                     | -         | ~5 LOC    |
| `test-cases-v2.md`                    | ~40 lines | ~20 lines |

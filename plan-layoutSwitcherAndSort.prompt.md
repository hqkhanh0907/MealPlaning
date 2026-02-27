# Plan: Layout Switcher & Sort Enhancement

## Tổng quan

Bổ sung tính năng chuyển đổi layout (Grid/List) cho thư viện dữ liệu và phân tích usecase sort cho MealCards.

---

## Kết quả phân tích hiện trạng code

| # | Yêu cầu | Trạng thái | Chi tiết |
|---|---------|-----------|---------|
| 1 | MealCards sort theo calories/protein | ⚠️ Không cần thiết | MealCard chỉ hiển thị 1-3 món đã chọn. Sort đã có trong PlanningModal khi chọn món |
| 2 | Layout Switcher cho DishManager | ❌ Chưa hỗ trợ | Chỉ có Grid view cố định |
| 3 | Layout Switcher cho IngredientManager | ❌ Chưa hỗ trợ | Chỉ có Grid view cố định |
| 4 | Sort cho DishManager | ❌ Chưa hỗ trợ | Chỉ có filter theo tag và search |
| 5 | Sort cho IngredientManager | ❌ Chưa hỗ trợ | Chỉ có search |

---

## Phân tích chi tiết Usecase

### C3. MealCards Sort — KHÔNG CẦN IMPLEMENT

**Lý do:**
1. MealCard trong CalendarTab chỉ hiển thị các món ĐÃ ĐƯỢC CHỌN cho bữa ăn (thường 1-3 món)
2. Việc sort 1-3 món không mang lại giá trị UX
3. Sort đã được implement đầy đủ trong `PlanningModal.tsx` khi user chọn món:
   - Tên (A-Z / Z-A)
   - Calo (Thấp → Cao / Cao → Thấp)
   - Protein (Thấp → Cao / Cao → Thấp)

**Kết luận:** ✅ Đã đủ - không cần thêm code

---

### Layout Switcher — CẦN IMPLEMENT

**Mục tiêu:** Cho phép user chuyển đổi giữa Grid view và List view trong thư viện Món ăn và Nguyên liệu

**Components cần sửa:**
1. `DishManager.tsx`
2. `IngredientManager.tsx`

**UI/UX Design:**

```
┌─────────────────────────────────────────────────────────┐
│  [🔍 Tìm kiếm...]              [⊞ Grid] [≡ List] [+ Add]│
│                                                         │
│  Grid View:                    List View:               │
│  ┌────┐ ┌────┐ ┌────┐         ┌─────────────────────┐  │
│  │    │ │    │ │    │         │ Item 1    Cal  Pro  │  │
│  │Card│ │Card│ │Card│         ├─────────────────────┤  │
│  │  1 │ │  2 │ │  3 │         │ Item 2    Cal  Pro  │  │
│  └────┘ └────┘ └────┘         ├─────────────────────┤  │
│  ┌────┐ ┌────┐                │ Item 3    Cal  Pro  │  │
│  │Card│ │Card│                └─────────────────────┘  │
│  │  4 │ │  5 │                                         │
│  └────┘ └────┘                                         │
└─────────────────────────────────────────────────────────┘
```

**Thành phần:**
- Toggle buttons: Grid icon (LayoutGrid) / List icon (List)
- Active state: `bg-emerald-500 text-white`
- Inactive state: `bg-slate-100 text-slate-500`
- State persist: `useState<'grid' | 'list'>('grid')` — có thể lưu vào localStorage sau

---

## Phase 1: Implement Layout Switcher

### Task 1.1: Tạo shared LayoutSwitcher component

**File mới:** `src/components/LayoutSwitcher.tsx`

```typescript
interface LayoutSwitcherProps {
  layout: 'grid' | 'list';
  onLayoutChange: (layout: 'grid' | 'list') => void;
}
```

**Features:**
- 2 buttons: Grid (LayoutGrid icon) / List (List icon)
- Touch target 44px
- Tooltip on hover

### Task 1.2: DishManager — Add Layout Switcher + List View

**File:** `src/components/DishManager.tsx`

**Thay đổi:**
1. Import `LayoutGrid, List` từ lucide-react
2. Thêm state `viewLayout: 'grid' | 'list'`
3. Thêm toggle buttons vào header (cạnh nút "Thêm món ăn")
4. Render conditionally:
   - `viewLayout === 'grid'`: giữ nguyên grid cards hiện tại
   - `viewLayout === 'list'`: render table/list view mới

**List View Design:**
```
┌──────────────────────────────────────────────────────────┐
│ [Icon] Tên món        Tags      Calo   Pro   [Sửa] [Xóa]│
├──────────────────────────────────────────────────────────┤
│ 🍳 Ức gà áp chảo     🌅🌤️      332    45g    ✏️    🗑️  │
│ 🍳 Salad rau củ      🌅        120    8g     ✏️    🗑️  │
│ 🍳 Cơm gạo lứt       🌤️🌙     215    5g     ✏️    🗑️  │
└──────────────────────────────────────────────────────────┘
```

### Task 1.3: IngredientManager — Add Layout Switcher + List View

**File:** `src/components/IngredientManager.tsx`

**Tương tự DishManager:**
1. Thêm state + toggle
2. List view hiển thị: Tên | Unit | Cal | Pro | Carbs | Fat | [Actions]

**List View Design:**
```
┌────────────────────────────────────────────────────────────────┐
│ [Icon] Tên NL        Unit    Cal    Pro   Carbs  Fat  Actions │
├────────────────────────────────────────────────────────────────┤
│ 🍎 Ức gà            100g    165    31g    0g    3.6g  ✏️ 🗑️  │
│ 🍎 Gạo lứt          100g    111    2.6g   23g   0.9g  ✏️ 🗑️  │
│ 🍎 Trứng gà         1 quả   155    13g    1.1g  11g   ✏️ 🗑️  │
└────────────────────────────────────────────────────────────────┘
```

---

## Phase 2: Add Sort cho DishManager & IngredientManager

### Task 2.1: DishManager — Add Sort dropdown

**Sort options:**
- Tên (A-Z / Z-A)
- Calo (Thấp → Cao / Cao → Thấp)
- Protein (Thấp → Cao / Cao → Thấp)
- Số nguyên liệu (Ít → Nhiều / Nhiều → Ít)

**Thay đổi:**
1. Thêm state `sortBy: SortOption`
2. Thêm `<select>` dropdown cạnh search
3. Apply sort vào `filteredDishes`

### Task 2.2: IngredientManager — Add Sort dropdown

**Sort options:**
- Tên (A-Z / Z-A)
- Calo (Thấp → Cao / Cao → Thấp)
- Protein (Thấp → Cao / Cao → Thấp)

**Tương tự DishManager**

---

## Phase 3: Cập nhật Test Cases Document

### Section E2 (UI/UX Nguyên liệu) — Thêm mới:

| ID | Tên | Mô tả |
|----|------|-------|
| ING_U_09 | Layout Switcher toggle | Click Grid/List icon → layout thay đổi tương ứng |
| ING_U_10 | Grid view layout | Grid: 1 col mobile, 2 col sm, 3 col lg — card view với nutrition details |
| ING_U_11 | List view layout | List: Table với columns Tên/Unit/Cal/Pro/Carbs/Fat/Actions |
| ING_U_12 | Sort dropdown | 6 options: Tên A-Z/Z-A, Calo ↑/↓, Protein ↑/↓ |
| ING_U_13 | Sort + Filter kết hợp | Search "gà" + Sort "Calo ↑" → kết quả filter + sorted |

### Section F2 (UI/UX Món ăn) — Thêm mới:

| ID | Tên | Mô tả |
|----|------|-------|
| DSH_U_07 | Layout Switcher toggle | Click Grid/List icon → layout thay đổi tương ứng |
| DSH_U_08 | Grid view layout | Grid: 1 col mobile, 2 col sm, 3 col lg — card view |
| DSH_U_09 | List view layout | List: Table với columns Tên/Tags/Cal/Pro/Actions |
| DSH_U_10 | Sort dropdown | 8 options: Tên A-Z/Z-A, Calo ↑/↓, Protein ↑/↓, Số NL ↑/↓ |
| DSH_U_11 | Sort + Filter + Tag kết hợp | Tag "Sáng" + Search "gà" + Sort "Protein ↓" |

### Section C3 (MealCards) — Clarification:

| ID | Tên | Mô tả |
|----|------|-------|
| PLAN_M_05 | MealCard không cần sort | MealCard chỉ hiển thị 1-3 món đã chọn, sort có sẵn trong PlanningModal |

---

## Thứ tự thực hiện

| Bước | Task | Ưu tiên | Độ phức tạp |
|------|------|---------|-------------|
| 1 | Task 1.2: DishManager Layout Switcher | Cao | Trung bình |
| 2 | Task 1.3: IngredientManager Layout Switcher | Cao | Trung bình |
| 3 | Task 2.1: DishManager Sort | Trung bình | Thấp |
| 4 | Task 2.2: IngredientManager Sort | Trung bình | Thấp |
| 5 | Phase 3: Update test-cases-v2.md | Sau code | Thấp |

---

## Estimated LOC Changes

| File | Thêm | Sửa |
|------|------|-----|
| DishManager.tsx | ~80 | ~20 |
| IngredientManager.tsx | ~80 | ~20 |
| test-cases-v2.md | ~30 | ~5 |
| **Total** | **~190** | **~45** |


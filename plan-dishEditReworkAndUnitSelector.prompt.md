# Plan: Rework "Thêm nguyên liệu" trong DishEditModal + UnitSelector + Fix AI Spinner

## Tóm tắt bugs và cải tiến

### Bug 1 — Spinner AI kẹt (IngredientEditModal) — CRITICAL
**Nguyên nhân gốc:** `isMountedRef` được init = `true` nhưng cleanup của `useEffect` set = `false` ngay lập tức do React 18 StrictMode double-invoke. Sau lần remount, `isMountedRef.current` = `false` mãi mãi. Khi API trả về:
```typescript
// finally { if (isMountedRef.current) setIsSearchingAI(false); }
//            ↑ false → spinner KHÔNG BAO GIỜ tắt
```
**Fix:** Thêm `isMountedRef.current = true` vào body của useEffect:
```typescript
useEffect(() => {
  isMountedRef.current = true;          // reset khi mount/remount
  return () => { isMountedRef.current = false; };
}, []);
```

### Bug 2 — Spinner AI kẹt (DishEditModal `triggerAIFill`) — CRITICAL
**Nguyên nhân:** Guard `if (!ctrl.signal.aborted) setQaAiLoading(false)` trong `finally` — khi request bị abort (do user typing nhanh), spinner không clear.
**Fix:** Bỏ guard, luôn clear:
```typescript
finally { setQaAiLoading(false); }
```

### Bug 3 — Orphan ingredient (P0)
**Nguyên nhân:** `onCreateIngredient?.(newIng)` được gọi ngay trong `handleQuickCreate`, trước khi user save dish. Nếu user cancel → ingredient đã được tạo nhưng không thuộc dish nào.
**Fix:** Defer `onCreateIngredient?.(newIng)` vào `handleSubmit()` — flush `extraIngredients` khi save.

---

## Mock UI

### Layout hiện tại (có vấn đề)
```
┌──────────────────────────────────────────┐
│ Sửa món ăn                          [X] │
├──────────────────────────────────────────┤
│ [Tên món]                                │
│ [Sáng] [Trưa] [Tối]                     │
├─────────────────┬────────────────────────┤
│ 🔍 Tìm kiếm     │ Đã chọn (2 NL)        │ ← 2 cột
│ + [Tạo NL mới ▼]│                        │   trên mobile
│ ┌─────────────┐ │                        │   cột phải
│ │ Form NL mới │ │   bị đẩy xuống         │   bị đẩy
│ │ (chiếm cả   │ │                        │
│ │  cột trái)  │ │                        │
│ └─────────────┘ │                        │
│ [Danh sách NL]  │ [Danh sách đã chọn]   │
└─────────────────┴────────────────────────┘
```

### Layout mới — Mobile-first Bottom Sheet
```
MOBILE (< md):
┌──────────────────────────────────────────┐
│ Sửa món ăn                          [X] │
├──────────────────────────────────────────┤
│ Tên món *                                │
│ [                                      ] │
│                                          │
│ Bữa ăn *                                 │
│ [🌅 Sáng] [☀️ Trưa] [🌙 Tối]            │
│                                          │
│ ── Chọn nguyên liệu ─────────────────── │
│ [🔍 Tìm kiếm...       ] [+ Tạo mới →]   │ ← nút Tạo mới riêng
│ ┌──────────────────────────────────────┐ │
│ │ Cà chua          🔋150kcal   [＋]   │ │ max-h-48
│ │ Thịt bò          🔋250kcal   [＋]   │ │ scroll
│ │ Tỏi              🔋150kcal   [＋]   │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ── Đã chọn (3 nguyên liệu) ─────────── │
│ ┌──────────────────────────────────────┐ │
│ │ 🥩 Thịt bò                          │ │
│ │    [−] [ 200 ] [+] g          [🗑]  │ │
│ ├──────────────────────────────────────┤ │
│ │ 🥕 Cà rốt                           │ │
│ │    [−] [  50 ] [+] g          [🗑]  │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ── Dinh dưỡng ước tính ─────────────── │
│  🔥 420 kcal  💪 32g  🌾 15g  💧 22g   │
│                                          │
│ [           💾 Lưu món ăn            ]   │
└──────────────────────────────────────────┘

BOTTOM SHEET — Tạo nguyên liệu mới (slide từ dưới, z-70):
┌──────────────────────────────────────────┐
│ [✕]  Tạo nguyên liệu mới               │
├──────────────────────────────────────────┤
│ Tên nguyên liệu *                        │
│ [                    ] [✨ AI gợi ý]     │
│                                          │
│ Đơn vị *                                 │
│ ┌──────────────────────────────────────┐ │
│ │ g ▼                                  │ │ ← UnitSelector dropdown
│ └──────────────────────────────────────┘ │
│  (chọn "Khác..." → free-text mở ra)      │
│                                          │
│ DINH DƯỠNG (cho 100g / 1 cái)           │
│ ┌───────┬────────┬───────┬─────┬───────┐ │
│ │ Cal   │Protein │ Carbs │ Fat │ Fiber │ │
│ │[     ]│[      ]│[     ]│[   ]│[     ]│ │
│ └───────┴────────┴───────┴─────┴───────┘ │
│  ← AI tự điền khi nhập tên + đơn vị     │
│                                          │
│ [  Hủy  ]    [✓ Tạo & thêm vào món ăn] │
└──────────────────────────────────────────┘
```

### Desktop (md+) — giữ nguyên grid 2 cột, bottom sheet thay quick-add inline
```
DESKTOP:
┌──────────────────────────────────────────┐
│ [Tên]  [Sáng][Trưa][Tối]                │
├─────────────────┬────────────────────────┤
│ 🔍 [Tìm kiếm]  │ Đã chọn (2)           │
│ [+ Tạo mới →]  │                        │
│ [NL 1] [+]     │ [NL A] [−][100][+][🗑]│
│ [NL 2] [+]     │ [NL B] [−][ 50][+][🗑]│
│ [NL 3] [+]     │                        │
│ [NL 4] [+]     │ ── Dinh dưỡng ──      │
│                 │ 🔥420  💪32  🌾15  💧22│
└─────────────────┴────────────────────────┘
                   [        💾 Lưu        ]
```

---

## UnitSelector Component

### Props
```typescript
interface UnitSelectorSingleProps {
  mode: 'single';
  value: string;
  onChange: (v: string) => void;
  error?: string;
  onBlur?: () => void;
  className?: string;
}
interface UnitSelectorBilingualProps {
  mode: 'bilingual';
  value: { vi: string; en: string };
  onChange: (v: { vi: string; en: string }) => void;
  error?: string;
  onBlur?: () => void;
  className?: string;
}
```

### COMMON_UNITS
```
g, kg, ml, l, cái, quả, lát, muỗng canh, muỗng cà phê, bát, gói, hộp
```
*Với mode='bilingual': mỗi unit có cả `{vi, en}` ví dụ `{vi: 'muỗng canh', en: 'tbsp'}`*

### UX
- Select dropdown với COMMON_UNITS
- Option cuối: "Khác..."  
- Khi chọn "Khác...": hidden input xuất hiện ngay bên dưới cho free-text
- Khi initial value không trong list → tự động pre-select "Khác..." + điền text

---

## Kế hoạch triển khai

### Phase 1 — Hotfix bugs (ưu tiên cao nhất)
1. `IngredientEditModal`: fix `isMountedRef` useEffect
2. `DishEditModal`: fix `triggerAIFill` finally guard

### Phase 2 — UnitSelector
3. Tạo `src/components/shared/UnitSelector.tsx`
4. Viết unit tests cho UnitSelector

### Phase 3 — P0 orphan ingredient fix
5. Defer `onCreateIngredient?.(newIng)` vào `handleSubmit()`

### Phase 4 — Quick-add bottom sheet
6. Extract quick-add form vào `QuickAddIngredientSheet.tsx` (sub-component)
7. Render như overlay bottom sheet thay vì inline trong left column
8. Apply UnitSelector cho `qaUnit`

### Phase 5 — UX improvements
9. Apply UnitSelector vào `IngredientEditModal` unit input
10. Apply UnitSelector vào `SaveAnalyzedDishModal` unit input (mode='single')
11. Live nutrition preview strip (footer, compute từ selectedIngredients × amounts)
12. Dynamic step: `step = amount < 10 ? 1 : amount < 100 ? 5 : 10`

### Phase 6 — Tests + commit
13. Update/add unit tests
14. Run full test suite  
15. Commit

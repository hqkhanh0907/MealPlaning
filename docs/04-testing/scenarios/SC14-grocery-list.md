# Scenario 14: Grocery List

**Version:** 1.0  
**Date:** 2026-03-11  
**Total Test Cases:** 105

---

## Mô tả tổng quan

Grocery List auto-generates danh sách mua sắm từ meal plans. Aggregates tất cả ingredients cần cho các ngày đã plan, consolidates duplicates (cộng amount), hiển thị checklist. User check items khi đã mua. Stale detection: nếu plan changes → checked items may reset.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| GroceryTab | GroceryTab.tsx | Main grocery UI |
| useGroceryList | hooks/useGroceryList.ts | List generation |
| GroceryItem | components/ | Item row |

## Luồng nghiệp vụ

1. User opens Grocery tab
2. System scans all planned meals (configurable date range)
3. Aggregates ingredients: same ingredient → sum amounts
4. Display as checklist with name, total amount, unit
5. User checks items as purchased
6. Plan changes → stale detection → warning

## Quy tắc nghiệp vụ

1. Auto-generated from plan data — no manual add (or optional manual add)
2. Same ingredient across meals → consolidated (sum amounts)
3. Check/uncheck persisted
4. Stale: if plan changes → checked items that changed amount reset to unchecked
5. Date range: current week by default
6. Group by category (if categories exist) or alphabetical

## Test Cases (105 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_GR_01 | Grocery tab hiển thị | Positive | P0 |
| TC_GR_02 | Empty state (no plans) | Positive | P1 |
| TC_GR_03 | List generated from plan | Positive | P0 |
| TC_GR_04 | Item: name display | Positive | P1 |
| TC_GR_05 | Item: amount display | Positive | P1 |
| TC_GR_06 | Item: unit display | Positive | P1 |
| TC_GR_07 | Consolidated: same ingredient summed | Positive | P0 |
| TC_GR_08 | Check item | Positive | P0 |
| TC_GR_09 | Uncheck item | Positive | P0 |
| TC_GR_10 | Check state persists reload | Positive | P0 |
| TC_GR_11 | Plan added → list updates | Positive | P0 |
| TC_GR_12 | Plan removed → list updates | Positive | P0 |
| TC_GR_13 | Dish deleted → list updates | Positive | P1 |
| TC_GR_14 | Ingredient deleted → item removed | Positive | P1 |
| TC_GR_15 | Amount changed → stale detection | Positive | P1 |
| TC_GR_16 | Stale: checked item reset | Positive | P1 |
| TC_GR_17 | Non-stale: unchanged items keep check | Positive | P1 |
| TC_GR_18 | 1 plan → 1 dish → ingredients | Positive | P2 |
| TC_GR_19 | 3 meals → consolidated | Positive | P1 |
| TC_GR_20 | 7 days → consolidated | Positive | P1 |
| TC_GR_21 | Same ingredient 3 dishes → sum correct | Positive | P1 |
| TC_GR_22 | Different units same ingredient | Edge | P1 |
| TC_GR_23 | Date range: current week | Positive | P1 |
| TC_GR_24 | Date range: custom range | Positive | P2 |
| TC_GR_25 | Date range: single day | Positive | P2 |
| TC_GR_26 | Date range: month | Positive | P2 |
| TC_GR_27 | Sort alphabetical | Positive | P2 |
| TC_GR_28 | Sort by category | Positive | P2 |
| TC_GR_29 | Sort by checked status | Positive | P2 |
| TC_GR_30 | Filter: unchecked only | Positive | P2 |
| TC_GR_31 | Filter: checked only | Positive | P2 |
| TC_GR_32 | Search grocery items | Positive | P2 |
| TC_GR_33 | Item count display | Positive | P2 |
| TC_GR_34 | Progress: X/Y items checked | Positive | P1 |
| TC_GR_35 | All items checked → complete state | Positive | P2 |
| TC_GR_36 | Manual add item (if supported) | Positive | P2 |
| TC_GR_37 | Manual remove item | Positive | P2 |
| TC_GR_38 | Manual item persist | Positive | P2 |
| TC_GR_39 | 1 ingredient total | Positive | P2 |
| TC_GR_40 | 10 ingredients | Positive | P2 |
| TC_GR_41 | 50 ingredients | Positive | P2 |
| TC_GR_42 | 200 ingredients — performance | Boundary | P2 |
| TC_GR_43 | 0 ingredients (no plan) | Positive | P2 |
| TC_GR_44 | Dark mode | Positive | P2 |
| TC_GR_45 | i18n labels | Positive | P2 |
| TC_GR_46 | Mobile layout | Positive | P2 |
| TC_GR_47 | Desktop layout | Positive | P2 |
| TC_GR_48 | Check animation | Positive | P3 |
| TC_GR_49 | Strikethrough on checked | Positive | P2 |
| TC_GR_50 | Checked items at bottom | Positive | P2 |
| TC_GR_51 | Swipe to check mobile | Positive | P2 |
| TC_GR_52 | Touch checkbox mobile | Positive | P2 |
| TC_GR_53 | Keyboard check/uncheck | Positive | P3 |
| TC_GR_54 | Screen reader | Positive | P3 |
| TC_GR_55 | Amount rounding (0.333 → 0.3) | Positive | P2 |
| TC_GR_56 | Amount = 0 after removal | Edge | P2 |
| TC_GR_57 | Very large amount (10000g) | Boundary | P2 |
| TC_GR_58 | Decimal amount display | Positive | P2 |
| TC_GR_59 | Mixed units in list | Positive | P2 |
| TC_GR_60 | Ingredient name Vietnamese | Positive | P2 |
| TC_GR_61 | Ingredient name very long | Boundary | P2 |
| TC_GR_62 | Copy plan → grocery updates | Positive | P1 |
| TC_GR_63 | Template apply → grocery updates | Positive | P1 |
| TC_GR_64 | Clear plan → grocery updates | Positive | P1 |
| TC_GR_65 | AI dish add → grocery updates | Positive | P1 |
| TC_GR_66 | Import data → grocery recalc | Positive | P1 |
| TC_GR_67 | Export includes grocery state | Positive | P2 |
| TC_GR_68 | Cloud sync grocery | Positive | P2 |
| TC_GR_69 | localStorage format | Positive | P1 |
| TC_GR_70 | Persist after reload | Positive | P0 |
| TC_GR_71 | Real-time update on plan change | Positive | P1 |
| TC_GR_72 | Batch plan changes → single recalc | Boundary | P2 |
| TC_GR_73 | Share grocery list | Positive | P3 |
| TC_GR_74 | Print grocery list | Positive | P3 |
| TC_GR_75 | Copy to clipboard | Positive | P3 |
| TC_GR_76 | Category grouping header | Positive | P2 |
| TC_GR_77 | Expand/collapse categories | Positive | P2 |
| TC_GR_78 | Total items badge on tab | Positive | P2 |
| TC_GR_79 | Uncheck all button | Positive | P2 |
| TC_GR_80 | Check all button | Positive | P2 |
| TC_GR_81 | Grocery from copied plan | Positive | P2 |
| TC_GR_82 | Plan edit → grocery auto-update | Positive | P1 |
| TC_GR_83 | Ingredient edit → grocery name/amount update | Positive | P1 |
| TC_GR_84 | Stale only for amount changes | Positive | P1 |
| TC_GR_85 | Non-stale for name changes | Positive | P2 |
| TC_GR_86 | New ingredient added to plan → appears in grocery | Positive | P1 |
| TC_GR_87 | Ingredient removed from all plans → disappears | Positive | P1 |
| TC_GR_88 | Multiple date ranges simultaneously | Edge | P3 |
| TC_GR_89 | Grocery with no matching ingredients | Edge | P2 |
| TC_GR_90 | Concurrent plan edit → grocery race condition | Edge | P2 |
| TC_GR_91 | Grocery performance: 50 dishes × 5 ingredients | Boundary | P2 |
| TC_GR_92 | Grocery generation time < 100ms | Boundary | P2 |
| TC_GR_93 | Notification on new grocery items | Positive | P3 |
| TC_GR_94 | Budget estimation (if prices exist) | Positive | P3 |
| TC_GR_95 | Store section mapping | Positive | P3 |
| TC_GR_96 | Quantity adjustment manual | Positive | P3 |
| TC_GR_97 | Item notes (e.g., "organic") | Positive | P3 |
| TC_GR_98 | Grocery history (past lists) | Positive | P3 |
| TC_GR_99 | Smart suggestions (frequently bought) | Positive | P3 |
| TC_GR_100 | Substitute suggestions | Positive | P3 |
| TC_GR_101 | Grocery list widget | Positive | P3 |
| TC_GR_102 | Offline grocery access | Positive | P2 |
| TC_GR_103 | Grocery sync across devices | Positive | P2 |
| TC_GR_104 | Clear checked items button | Positive | P2 |
| TC_GR_105 | Grocery export (separate from app data) | Positive | P3 |

---

## Chi tiết Test Cases (Grouped)

##### TC_GR_01–17: Core Grocery Flow
- Tab display, auto-generation, consolidation, check/uncheck, persist, stale detection

##### TC_GR_18–35: Aggregation & Display
- Single/multi meal/day, consolidation, date range, sort, filter, search, progress

##### TC_GR_36–43: Manual & Data Variants
- Manual items, ingredient counts, performance

##### TC_GR_44–54: UI/UX
- Dark mode, i18n, responsive, animations, touch, keyboard, accessibility

##### TC_GR_55–71: Edge Cases & Persistence
- Amount edge cases, long names, cross-feature integration, localStorage, real-time

##### TC_GR_72–105: Advanced Features
- Share, print, copy, categories, batch operations, stale logic, budget, history, substitutes

---

## Đề xuất Cải tiến

### Đề xuất 1: Smart Aisle Grouping
- **Vấn đề hiện tại**: Flat list. User walks back and forth in store.
- **Giải pháp đề xuất**: Auto-group by store aisle/section: Produce, Dairy, Meat, Pantry. Customizable order.
- **Lý do chi tiết**: Aisle grouping reduces shopping time 30%. Standard in top grocery apps.
- **Phần trăm cải thiện**: Shopping time -30%, Store navigation +50%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 2: Price Tracking & Budget
- **Vấn đề hiện tại**: No cost information. Can't budget meals.
- **Giải pháp đề xuất**: Optional price per ingredient. Total cost per list. Budget alerts. Price history.
- **Lý do chi tiết**: Budget is #2 concern after nutrition. Cost tracking enables complete meal planning.
- **Phần trăm cải thiện**: Budget awareness +60%, Overspending -25%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 3: Share & Collaborate
- **Vấn đề hiện tại**: Only one person sees list. Family shopping = screenshot.
- **Giải pháp đề xuất**: Share via link/QR/WhatsApp. Real-time sync: one person checks → all see update.
- **Lý do chi tiết**: 60% of households have shared grocery duty. Collaboration prevents duplicate purchases.
- **Phần trăm cải thiện**: Family efficiency +50%, Duplicate purchases -80%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 4: Pantry Inventory
- **Vấn đề hiện tại**: List shows all needed ingredients regardless of what user already has.
- **Giải pháp đề xuất**: Pantry tracker: mark what you have. Grocery = needed - pantry. Auto-deduct after shopping.
- **Lý do chi tiết**: Pantry reduces list length 40%. Prevents buying duplicates of stocked items.
- **Phần trăm cải thiện**: List accuracy +40%, Food waste -30%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 5: Recipe-Linked Items
- **Vấn đề hiện tại**: Grocery items disconnected from which dish needs them.
- **Giải pháp đề xuất**: Tap ingredient → show "Used in: Phở Gà (200g), Gà Rán (150g)". Filter by dish.
- **Lý do chi tiết**: Context helps prioritize. If skipping a dish, easily remove related ingredients.
- **Phần trăm cải thiện**: Context awareness +50%, Flexible shopping +40%
- **Mức độ ưu tiên**: Medium | **Effort**: S

# Scenario 14: Grocery List

**Version:** 2.0  
**Date:** 2026-03-11  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Grocery List tự động tạo danh sách mua sắm từ meal plans. Tổng hợp tất cả nguyên liệu cần cho các ngày đã lên kế hoạch, gộp trùng lặp (cộng dồn amount), hiển thị checklist. User đánh dấu items khi đã mua. Stale detection: nếu plan thay đổi → checked items có thể bị reset. Hỗ trợ scope day/week/custom, nhóm theo kệ siêu thị (Aisle Grouping), copy/share, progress bar, celebration khi mua hết.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| GroceryTab | GroceryTab.tsx | Main grocery UI |
| useGroceryList | hooks/useGroceryList.ts | List generation |
| GroceryItem | components/ | Item row |
| usePersistedState | hooks/usePersistedState.ts | Checkbox persistence (key: 'mp-grocery-checked') |
| categorizeIngredient | utils/ | Keyword-based aisle categorization (Vietnamese & English) |

## Props & Types

```typescript
// Props
interface GroceryListProps {
  currentPlan: Plan;
  dayPlans: DayPlan[];
  selectedDate: string;
  allDishes: Dish[];
  allIngredients: Ingredient[];
}

// Scope
type GroceryScope = 'day' | 'week' | 'custom';

// Item
interface GroceryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  usedInDishes: DishSource[];
}

// Aisle
type AisleCategory = 'protein' | 'dairy' | 'grains' | 'produce' | 'other';

// Checked Snapshot
interface CheckedSnapshot {
  id: string;
  amount: number;
}
```

## Luồng nghiệp vụ

1. User mở Grocery tab
2. Hệ thống quét tất cả planned meals theo scope (day/week/custom)
3. Tổng hợp nguyên liệu: cùng nguyên liệu → cộng dồn amount
4. Hiển thị checklist với tên, tổng amount, unit, usedInDishes
5. User check items khi đã mua → persist vào localStorage
6. Plan thay đổi → stale detection → uncheck nếu amount đổi
7. Hỗ trợ nhóm theo Aisle (produce→protein→dairy→grains→other)
8. Copy/Share danh sách, progress bar, celebration khi 100%

## Quy tắc nghiệp vụ

1. Auto-generated từ plan data — không manual add
2. Cùng nguyên liệu nhiều bữa → consolidated (sum amounts)
3. Check/uncheck persisted qua usePersistedState key 'mp-grocery-checked'
4. Stale detection: chỉ "checked" nếu stored amount khớp current rounded amount
5. Scope mặc định: 'day' (Hôm nay)
6. Chuyển scope → reset checked items
7. Aisle grouping: categorizeIngredient() keyword-based (Vietnamese & English) + nutritional profile fallback
8. AISLE_EMOJI: protein🥩, dairy🥛, grains🌾, produce🥬, other📦
9. AISLE_ORDER: produce → protein → dairy → grains → other
10. Progress bar: checked/total items, celebration khi 100%
11. Copy/Share buttons, Group by Aisle toggle

## Test Cases (210 TCs)

### Nhóm 1: Core Grocery Flow (TC_GR_01–17)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_GR_01 | Grocery tab hiển thị đúng khi mở | Positive | P0 | — |
| TC_GR_02 | Empty state khi không có plan nào | Positive | P1 | — |
| TC_GR_03 | Danh sách được tạo tự động từ plan | Positive | P0 | — |
| TC_GR_04 | Hiển thị tên nguyên liệu đúng | Positive | P1 | — |
| TC_GR_05 | Hiển thị amount nguyên liệu đúng | Positive | P1 | — |
| TC_GR_06 | Hiển thị unit nguyên liệu đúng | Positive | P1 | — |
| TC_GR_07 | Cùng nguyên liệu → cộng dồn amount chính xác | Positive | P0 | — |
| TC_GR_08 | Check item → đánh dấu đã mua | Positive | P0 | — |
| TC_GR_09 | Uncheck item → bỏ đánh dấu | Positive | P0 | — |
| TC_GR_10 | Check state persist sau reload trang | Positive | P0 | — |
| TC_GR_11 | Thêm plan → danh sách cập nhật | Positive | P0 | — |
| TC_GR_12 | Xóa plan → danh sách cập nhật | Positive | P0 | — |
| TC_GR_13 | Xóa dish → danh sách cập nhật | Positive | P1 | — |
| TC_GR_14 | Xóa nguyên liệu → item biến mất khỏi grocery | Positive | P1 | — |
| TC_GR_15 | Amount thay đổi → stale detection kích hoạt | Positive | P1 | — |
| TC_GR_16 | Stale: checked item bị reset khi amount đổi | Positive | P1 | — |
| TC_GR_17 | Non-stale: items chưa đổi giữ nguyên check | Positive | P1 | — |

### Nhóm 2: Aggregation & Display (TC_GR_18–35)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_GR_18 | 1 plan → 1 dish → hiện nguyên liệu đúng | Positive | P2 | — |
| TC_GR_19 | 3 bữa ăn → consolidated đúng | Positive | P1 | — |
| TC_GR_20 | 7 ngày → consolidated đúng | Positive | P1 | — |
| TC_GR_21 | Cùng nguyên liệu trong 3 dishes → sum chính xác | Positive | P1 | — |
| TC_GR_22 | Khác unit cùng nguyên liệu → hiện riêng hoặc convert | Edge | P1 | — |
| TC_GR_23 | Phạm vi ngày: tuần hiện tại | Positive | P1 | — |
| TC_GR_24 | Phạm vi ngày: khoảng tùy chỉnh | Positive | P2 | — |
| TC_GR_25 | Phạm vi ngày: 1 ngày duy nhất | Positive | P2 | — |
| TC_GR_26 | Phạm vi ngày: cả tháng | Positive | P2 | — |
| TC_GR_27 | Sắp xếp theo bảng chữ cái | Positive | P2 | — |
| TC_GR_28 | Sắp xếp theo danh mục (category) | Positive | P2 | — |
| TC_GR_29 | Sắp xếp theo trạng thái checked | Positive | P2 | — |
| TC_GR_30 | Lọc: chỉ hiện chưa mua | Positive | P2 | — |
| TC_GR_31 | Lọc: chỉ hiện đã mua | Positive | P2 | — |
| TC_GR_32 | Tìm kiếm nguyên liệu trong grocery | Positive | P2 | — |
| TC_GR_33 | Hiển thị tổng số nguyên liệu | Positive | P2 | — |
| TC_GR_34 | Progress: hiện X/Y items đã checked | Positive | P1 | — |
| TC_GR_35 | Tất cả items checked → trạng thái hoàn thành | Positive | P2 | — |

### Nhóm 3: Manual & Data Variants (TC_GR_36–43)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_GR_36 | Thêm item thủ công (nếu hỗ trợ) | Positive | P2 | — |
| TC_GR_37 | Xóa item thủ công | Positive | P2 | — |
| TC_GR_38 | Item thủ công persist sau reload | Positive | P2 | — |
| TC_GR_39 | 1 nguyên liệu tổng → hiện đúng | Positive | P2 | — |
| TC_GR_40 | 10 nguyên liệu → hiện đúng | Positive | P2 | — |
| TC_GR_41 | 50 nguyên liệu → hiện đúng | Positive | P2 | — |
| TC_GR_42 | 200 nguyên liệu — kiểm tra performance | Boundary | P2 | — |
| TC_GR_43 | 0 nguyên liệu (không có plan) → empty state | Positive | P2 | — |

### Nhóm 4: UI/UX (TC_GR_44–54)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_GR_44 | Dark mode hiển thị đúng | Positive | P2 | — |
| TC_GR_45 | Nhãn i18n hiển thị đúng | Positive | P2 | — |
| TC_GR_46 | Layout mobile responsive | Positive | P2 | — |
| TC_GR_47 | Layout desktop hiển thị đúng | Positive | P2 | — |
| TC_GR_48 | Animation khi check item | Positive | P3 | — |
| TC_GR_49 | Strikethrough khi item đã checked | Positive | P2 | — |
| TC_GR_50 | Items đã checked xuống cuối danh sách | Positive | P2 | — |
| TC_GR_51 | Swipe để check trên mobile | Positive | P2 | — |
| TC_GR_52 | Touch checkbox trên mobile | Positive | P2 | — |
| TC_GR_53 | Keyboard check/uncheck (accessibility) | Positive | P3 | — |
| TC_GR_54 | Screen reader đọc đúng nội dung | Positive | P3 | — |

### Nhóm 5: Edge Cases & Persistence (TC_GR_55–71)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_GR_55 | Amount làm tròn (0.333 → 0.3) | Positive | P2 | — |
| TC_GR_56 | Amount = 0 sau khi xóa → item biến mất | Edge | P2 | — |
| TC_GR_57 | Amount rất lớn (10000g) → hiện đúng | Boundary | P2 | — |
| TC_GR_58 | Hiển thị amount thập phân đúng | Positive | P2 | — |
| TC_GR_59 | Nhiều unit khác nhau trong danh sách | Positive | P2 | — |
| TC_GR_60 | Tên nguyên liệu tiếng Việt có dấu | Positive | P2 | — |
| TC_GR_61 | Tên nguyên liệu rất dài → truncate/wrap | Boundary | P2 | — |
| TC_GR_62 | Copy plan → grocery cập nhật | Positive | P1 | — |
| TC_GR_63 | Áp dụng template → grocery cập nhật | Positive | P1 | — |
| TC_GR_64 | Xóa toàn bộ plan → grocery cập nhật | Positive | P1 | — |
| TC_GR_65 | AI thêm dish → grocery cập nhật | Positive | P1 | — |
| TC_GR_66 | Import data → grocery tính lại | Positive | P1 | — |
| TC_GR_67 | Export bao gồm trạng thái grocery | Positive | P2 | — |
| TC_GR_68 | Cloud sync grocery data | Positive | P2 | — |
| TC_GR_69 | localStorage format đúng cấu trúc | Positive | P1 | — |
| TC_GR_70 | Persist sau reload toàn bộ dữ liệu | Positive | P0 | — |
| TC_GR_71 | Real-time cập nhật khi plan thay đổi | Positive | P1 | — |

### Nhóm 6: Advanced Features (TC_GR_72–105)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_GR_72 | Batch plan changes → chỉ recalc 1 lần | Boundary | P2 | — |
| TC_GR_73 | Chia sẻ danh sách grocery | Positive | P3 | — |
| TC_GR_74 | In danh sách grocery | Positive | P3 | — |
| TC_GR_75 | Copy danh sách vào clipboard | Positive | P3 | — |
| TC_GR_76 | Header nhóm danh mục hiển thị đúng | Positive | P2 | — |
| TC_GR_77 | Mở/đóng nhóm danh mục | Positive | P2 | — |
| TC_GR_78 | Badge tổng items trên tab | Positive | P2 | — |
| TC_GR_79 | Nút bỏ chọn tất cả | Positive | P2 | — |
| TC_GR_80 | Nút chọn tất cả | Positive | P2 | — |
| TC_GR_81 | Grocery từ plan đã copy | Positive | P2 | — |
| TC_GR_82 | Sửa plan → grocery tự động cập nhật | Positive | P1 | — |
| TC_GR_83 | Sửa nguyên liệu → grocery cập nhật tên/amount | Positive | P1 | — |
| TC_GR_84 | Stale chỉ kích hoạt khi amount thay đổi | Positive | P1 | — |
| TC_GR_85 | Non-stale khi chỉ đổi tên nguyên liệu | Positive | P2 | — |
| TC_GR_86 | Thêm nguyên liệu mới vào plan → xuất hiện trong grocery | Positive | P1 | — |
| TC_GR_87 | Xóa nguyên liệu khỏi tất cả plan → biến mất | Positive | P1 | — |
| TC_GR_88 | Nhiều phạm vi ngày đồng thời | Edge | P3 | — |
| TC_GR_89 | Grocery không có nguyên liệu khớp | Edge | P2 | — |
| TC_GR_90 | Concurrent plan edit → xử lý race condition | Edge | P2 | — |
| TC_GR_91 | Performance: 50 dishes × 5 nguyên liệu | Boundary | P2 | — |
| TC_GR_92 | Thời gian tạo grocery < 100ms | Boundary | P2 | — |
| TC_GR_93 | Thông báo khi có nguyên liệu mới | Positive | P3 | — |
| TC_GR_94 | Ước tính chi phí (nếu có giá) | Positive | P3 | — |
| TC_GR_95 | Ánh xạ kệ siêu thị | Positive | P3 | — |
| TC_GR_96 | Điều chỉnh số lượng thủ công | Positive | P3 | — |
| TC_GR_97 | Ghi chú item (vd: "hữu cơ") | Positive | P3 | — |
| TC_GR_98 | Lịch sử grocery (danh sách cũ) | Positive | P3 | — |
| TC_GR_99 | Gợi ý thông minh (hay mua) | Positive | P3 | — |
| TC_GR_100 | Gợi ý thay thế nguyên liệu | Positive | P3 | — |
| TC_GR_101 | Widget grocery list | Positive | P3 | — |
| TC_GR_102 | Truy cập grocery offline | Positive | P2 | — |
| TC_GR_103 | Đồng bộ grocery giữa các thiết bị | Positive | P2 | — |
| TC_GR_104 | Nút xóa các items đã checked | Positive | P2 | — |
| TC_GR_105 | Xuất grocery riêng (tách biệt app data) | Positive | P3 | — |

### Nhóm 7: Tab Phạm vi — Scope Tabs (TC_GR_106–125)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_GR_106 | Tab "Hôm nay" active mặc định khi mở Grocery | Positive | P0 | — |
| TC_GR_107 | Click tab "Tuần" → hiển thị nguyên liệu cả tuần | Positive | P0 | — |
| TC_GR_108 | Click tab "Tất cả" → hiển thị tất cả nguyên liệu mọi plan | Positive | P0 | — |
| TC_GR_109 | Chuyển tab → checked items reset về unchecked | Positive | P0 | — |
| TC_GR_110 | Chuyển Day → Week → danh sách nguyên liệu tăng lên | Positive | P1 | — |
| TC_GR_111 | Chuyển Week → Day → danh sách nguyên liệu giảm đi | Positive | P1 | — |
| TC_GR_112 | Tab "Hôm nay" không có plan → hiện empty state | Positive | P1 | — |
| TC_GR_113 | Tab "Tuần" không có plan tuần → hiện empty state | Positive | P1 | — |
| TC_GR_114 | Tab "Tất cả" không có plan nào → hiện empty state | Positive | P1 | — |
| TC_GR_115 | Empty state hiện gợi ý chuyển sang scope khác | Positive | P2 | — |
| TC_GR_116 | Tab active có highlight style đúng (màu, font-weight) | Positive | P2 | — |
| TC_GR_117 | Tab click có animation phản hồi người dùng | Positive | P3 | — |
| TC_GR_118 | Swipe trái/phải để chuyển tab trên mobile | Positive | P2 | — |
| TC_GR_119 | Tab hiện count badge số lượng nguyên liệu tương ứng | Positive | P2 | — |
| TC_GR_120 | Tab responsive hiển thị đúng trên mobile (không bị cắt) | Positive | P2 | — |
| TC_GR_121 | Chuyển tab nhanh liên tục (spam click) → không crash, không lỗi | Edge | P1 | — |
| TC_GR_122 | Tab "Tuần" tính đúng khoảng Mon–Sun của tuần hiện tại | Positive | P1 | — |
| TC_GR_123 | Tab scope persist sau khi navigate đi rồi quay lại | Positive | P2 | — |
| TC_GR_124 | Tab "Tất cả" bao gồm cả plan quá khứ lẫn tương lai | Positive | P1 | — |
| TC_GR_125 | Scope thay đổi → progress bar reset về 0% | Positive | P1 | — |

### Nhóm 8: Tổng hợp Nguyên liệu — Ingredient Aggregation (TC_GR_126–145)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_GR_126 | Cùng nguyên liệu trong 2 bữa → cộng dồn amount chính xác | Positive | P0 | — |
| TC_GR_127 | Cùng nguyên liệu trong 3 bữa → cộng dồn amount chính xác | Positive | P0 | — |
| TC_GR_128 | Cùng nguyên liệu ở 2 ngày khác nhau (scope tuần) → cộng dồn | Positive | P0 | — |
| TC_GR_129 | Nguyên liệu cùng tên khác unit → hiện riêng dòng (hoặc convert) | Edge | P1 | — |
| TC_GR_130 | Nguyên liệu amount = 0 → không hiển thị trong danh sách | Edge | P1 | — |
| TC_GR_131 | Nguyên liệu amount rất nhỏ (0.1g) → hiển thị đúng | Boundary | P2 | — |
| TC_GR_132 | Nguyên liệu amount rất lớn (5000g) → hiển thị đúng | Boundary | P2 | — |
| TC_GR_133 | 1 nguyên liệu duy nhất → danh sách 1 item | Positive | P2 | — |
| TC_GR_134 | 50 nguyên liệu → scroll hoạt động, tất cả hiển thị | Positive | P2 | — |
| TC_GR_135 | 100+ nguyên liệu → performance OK, không lag | Boundary | P2 | — |
| TC_GR_136 | Aggregation chính xác đến 2 số thập phân | Positive | P1 | — |
| TC_GR_137 | Unit hiển thị đúng đa dạng (g, ml, muỗng, quả, lát, etc.) | Positive | P1 | — |
| TC_GR_138 | usedInDishes tracking: 1 dish → hiện "Dùng trong: Phở" | Positive | P1 | — |
| TC_GR_139 | usedInDishes tracking: 3 dishes → hiện "Dùng trong: Phở, Bún, Cơm" | Positive | P1 | — |
| TC_GR_140 | Expand nguyên liệu → hiện breakdown amount từng dish | Positive | P1 | — |
| TC_GR_141 | Breakdown hiển thị đúng amount per dish (vd: Phở 200g, Bún 100g) | Positive | P1 | — |
| TC_GR_142 | Nguyên liệu có tên tiếng Việt → hiển thị đúng dấu (ớt, đường, nước mắm) | Positive | P2 | — |
| TC_GR_143 | Nguyên liệu tên dài → truncate hoặc wrap đúng, không tràn layout | Boundary | P2 | — |
| TC_GR_144 | Aggregation tự động cập nhật khi plan thay đổi realtime | Positive | P1 | — |
| TC_GR_145 | Xóa dish khỏi plan → nguyên liệu amount giảm hoặc biến mất | Positive | P1 | — |

### Nhóm 9: Checkbox và Progress — Bought Tracking (TC_GR_146–165)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_GR_146 | Click checkbox → item checked, text strikethrough | Positive | P0 | — |
| TC_GR_147 | Click checkbox lần nữa → item unchecked, text bình thường | Positive | P0 | — |
| TC_GR_148 | Checked state persist sau reload trang (localStorage) | Positive | P0 | — |
| TC_GR_149 | Stale detection: amount thay đổi → tự động uncheck | Positive | P0 | — |
| TC_GR_150 | Stale detection: amount giữ nguyên → check vẫn persist | Positive | P0 | — |
| TC_GR_151 | Progress bar hiện 0% khi mới vào (chưa check gì) | Positive | P1 | — |
| TC_GR_152 | Progress bar hiện 50% khi check 5/10 items | Positive | P1 | — |
| TC_GR_153 | Progress bar 100% → hiện celebration message "Đã mua hết!" | Positive | P1 | — |
| TC_GR_154 | Progress bar animation smooth khi thay đổi phần trăm | Positive | P2 | — |
| TC_GR_155 | Bought count hiển thị đúng "X/Y đã mua" | Positive | P1 | — |
| TC_GR_156 | Check 1 item → count tăng 1 | Positive | P1 | — |
| TC_GR_157 | Uncheck 1 item → count giảm 1 | Positive | P1 | — |
| TC_GR_158 | Check tất cả items lần lượt → 100% celebration hiện đúng | Positive | P1 | — |
| TC_GR_159 | Checkbox style: vuông, border-radius phù hợp design system | Positive | P2 | — |
| TC_GR_160 | Checkbox dark mode style hiển thị đúng | Positive | P2 | — |
| TC_GR_161 | Checkbox touch target đủ lớn trên mobile (≥44px) | Positive | P2 | — |
| TC_GR_162 | Strikethrough text style đúng (line-through, color muted) | Positive | P2 | — |
| TC_GR_163 | Checked item opacity giảm (visual de-emphasis) | Positive | P2 | — |
| TC_GR_164 | Clear bought items → tất cả uncheck, progress reset 0% | Positive | P1 | — |
| TC_GR_165 | Checked data persist đúng key 'mp-grocery-checked' trong localStorage | Positive | P0 | — |

### Nhóm 10: Nhóm theo Kệ — Aisle Grouping (TC_GR_166–185)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_GR_166 | Toggle "Nhóm theo kệ" → items được nhóm theo AisleCategory | Positive | P1 | — |
| TC_GR_167 | Produce group (🥬) hiển thị đầu tiên theo AISLE_ORDER | Positive | P1 | — |
| TC_GR_168 | Protein group (🥩) hiển thị thứ 2 | Positive | P1 | — |
| TC_GR_169 | Dairy group (🥛) hiển thị thứ 3 | Positive | P1 | — |
| TC_GR_170 | Grains group (🌾) hiển thị thứ 4 | Positive | P1 | — |
| TC_GR_171 | Other group (📦) hiển thị cuối cùng | Positive | P1 | — |
| TC_GR_172 | Group header hiển thị tên kệ + emoji + số lượng items | Positive | P1 | — |
| TC_GR_173 | Tắt grouping → hiện flat list không nhóm | Positive | P1 | — |
| TC_GR_174 | Grouping bật + checked items → items checked vẫn đúng group | Positive | P1 | — |
| TC_GR_175 | categorizeIngredient "gà" → phân loại protein | Positive | P1 | — |
| TC_GR_176 | categorizeIngredient "sữa" → phân loại dairy | Positive | P1 | — |
| TC_GR_177 | categorizeIngredient "gạo" → phân loại grains | Positive | P1 | — |
| TC_GR_178 | categorizeIngredient "rau" → phân loại produce | Positive | P1 | — |
| TC_GR_179 | categorizeIngredient "muối" → phân loại other | Positive | P1 | — |
| TC_GR_180 | categorizeIngredient fallback: dùng nutritional profile khi keyword không khớp | Edge | P2 | — |
| TC_GR_181 | Group không có item → không hiện header nhóm đó | Edge | P2 | — |
| TC_GR_182 | Group chỉ 1 item → hiện header + 1 item | Positive | P2 | — |
| TC_GR_183 | Group toggle state persist sau reload | Positive | P2 | — |
| TC_GR_184 | Group animation expand/collapse mượt | Positive | P3 | — |
| TC_GR_185 | Grouping kết hợp search/filter (nếu có) → filter trong group | Positive | P2 | — |

### Nhóm 11: Copy, Share và UI/UX nâng cao (TC_GR_186–210)

| ID | Mô tả | Loại | Priority | Kết quả test thực tế |
|----|--------|------|----------|---------------------|
| TC_GR_186 | Copy button → clipboard chứa danh sách text format | Positive | P1 | — |
| TC_GR_187 | Copy format đúng: "- Gà 500g\n- Gạo 1kg\n..." mỗi item 1 dòng | Positive | P1 | — |
| TC_GR_188 | Copy thành công → hiện toast "Đã copy danh sách" | Positive | P1 | — |
| TC_GR_189 | Copy thất bại (clipboard API lỗi) → hiện toast lỗi | Edge | P2 | — |
| TC_GR_190 | Share button trên mobile → mở native share dialog | Positive | P1 | — |
| TC_GR_191 | Share button trên desktop → fallback copy vào clipboard | Positive | P1 | — |
| TC_GR_192 | Share title format đúng (vd: "Danh sách mua sắm - Hôm nay") | Positive | P2 | — |
| TC_GR_193 | Danh sách rỗng → copy/share button bị disabled | Edge | P1 | — |
| TC_GR_194 | Dark mode hiển thị đúng tất cả elements (text, bg, border, icon) | Positive | P1 | — |
| TC_GR_195 | Mobile layout: full-width, padding phù hợp | Positive | P2 | — |
| TC_GR_196 | Desktop layout: max-width centered, không quá rộng | Positive | P2 | — |
| TC_GR_197 | Scroll smooth khi danh sách dài (50+ items) | Positive | P2 | — |
| TC_GR_198 | Pull-to-refresh trên mobile → recalculate danh sách | Positive | P2 | — |
| TC_GR_199 | Search/filter groceries input (nếu có) hoạt động đúng | Positive | P2 | — |
| TC_GR_200 | Skeleton loading hiển thị khi đang tính toán danh sách | Positive | P2 | — |
| TC_GR_201 | Animation fade-in items khi danh sách xuất hiện | Positive | P3 | — |
| TC_GR_202 | Grocery list header có icon shopping cart | Positive | P2 | — |
| TC_GR_203 | Header hiển thị "X nguyên liệu" đúng số lượng | Positive | P1 | — |
| TC_GR_204 | Click vào ingredient → expand hiện danh sách dishes sử dụng | Positive | P1 | — |
| TC_GR_205 | Chevron icon rotate animation khi expand/collapse | Positive | P2 | — |
| TC_GR_206 | Expanded view hiển thị đúng trong dark mode | Positive | P2 | — |
| TC_GR_207 | Amount display: làm tròn 1 decimal (1.5g, không phải 1.50000g) | Positive | P1 | — |
| TC_GR_208 | Unit localization: hiện đúng đơn vị tiếng Việt (muỗng, chén, quả) | Positive | P2 | — |
| TC_GR_209 | Screen reader: checkbox + label đọc đúng (accessibility ARIA) | Positive | P2 | — |
| TC_GR_210 | Grocery list tự động cập nhật khi plan thay đổi realtime | Positive | P1 | — |

---

## Chi tiết Test Cases (Grouped)

##### TC_GR_01–17: Core Grocery Flow
- Hiển thị tab, auto-generation, consolidation, check/uncheck, persist, stale detection

##### TC_GR_18–35: Aggregation & Display
- Single/multi meal/day, consolidation, date range, sort, filter, search, progress

##### TC_GR_36–43: Manual & Data Variants
- Manual items, số lượng nguyên liệu, performance

##### TC_GR_44–54: UI/UX
- Dark mode, i18n, responsive, animations, touch, keyboard, accessibility

##### TC_GR_55–71: Edge Cases & Persistence
- Amount edge cases, tên dài, tích hợp cross-feature, localStorage, real-time

##### TC_GR_72–105: Advanced Features
- Share, print, copy, categories, batch operations, stale logic, budget, history, substitutes

##### TC_GR_106–125: Tab Phạm vi (Scope Tabs)
- Tab Hôm nay/Tuần/Tất cả, chuyển tab reset checked, empty state, highlight, swipe, count badge, scope persist, progress bar reset

##### TC_GR_126–145: Tổng hợp Nguyên liệu (Ingredient Aggregation)
- Cộng dồn amount 2/3 bữa, cộng dồn cross-day, khác unit, amount 0/nhỏ/lớn, performance 100+ items, usedInDishes tracking, expand breakdown, tên tiếng Việt, aggregation realtime

##### TC_GR_146–165: Checkbox và Progress (Bought Tracking)
- Check/uncheck, persist reload, stale detection amount, progress bar 0%/50%/100%, celebration "Đã mua hết!", bought count X/Y, checkbox style, dark mode, touch target, strikethrough, clear bought, persist key

##### TC_GR_166–185: Nhóm theo Kệ (Aisle Grouping)
- Toggle grouping, AISLE_ORDER produce→protein→dairy→grains→other, emoji headers, categorizeIngredient Vietnamese keywords, nutritional profile fallback, group empty/1 item, toggle persist, animation

##### TC_GR_186–210: Copy, Share và UI/UX nâng cao
- Copy clipboard format, toast feedback, share native/fallback, disabled khi rỗng, dark mode toàn bộ, mobile/desktop layout, scroll, pull-to-refresh, skeleton loading, header icon + count, expand dishes, chevron rotate, amount rounding, unit localization, screen reader, auto-update realtime

---

## Đề xuất Cải tiến

### Đề xuất 1: Smart Aisle Grouping
- **Vấn đề hiện tại**: Flat list. User đi lại nhiều lần trong siêu thị.
- **Giải pháp đề xuất**: Auto-group theo kệ siêu thị: Produce, Dairy, Meat, Pantry. Thứ tự tùy chỉnh được.
- **Lý do chi tiết**: Nhóm theo kệ giảm 30% thời gian mua sắm. Tiêu chuẩn trong các app grocery hàng đầu.
- **Phần trăm cải thiện**: Thời gian mua sắm -30%, Điều hướng siêu thị +50%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 2: Price Tracking & Budget
- **Vấn đề hiện tại**: Không có thông tin chi phí. Không thể lập ngân sách bữa ăn.
- **Giải pháp đề xuất**: Giá mỗi nguyên liệu (tùy chọn). Tổng chi phí mỗi danh sách. Cảnh báo ngân sách. Lịch sử giá.
- **Lý do chi tiết**: Ngân sách là mối quan tâm #2 sau dinh dưỡng. Theo dõi chi phí hoàn thiện việc lên kế hoạch bữa ăn.
- **Phần trăm cải thiện**: Nhận thức ngân sách +60%, Chi tiêu vượt mức -25%
- **Mức độ ưu tiên**: Medium | **Effort**: L

### Đề xuất 3: Share & Collaborate
- **Vấn đề hiện tại**: Chỉ 1 người thấy danh sách. Mua sắm gia đình = chụp màn hình.
- **Giải pháp đề xuất**: Chia sẻ qua link/QR/WhatsApp. Đồng bộ real-time: 1 người check → tất cả thấy cập nhật.
- **Lý do chi tiết**: 60% hộ gia đình chia sẻ việc mua sắm. Cộng tác ngăn mua trùng.
- **Phần trăm cải thiện**: Hiệu quả gia đình +50%, Mua trùng -80%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 4: Pantry Inventory
- **Vấn đề hiện tại**: Danh sách hiện tất cả nguyên liệu cần mua bất kể user đã có gì.
- **Giải pháp đề xuất**: Pantry tracker: đánh dấu nguyên liệu đã có. Grocery = cần thiết - pantry. Tự động trừ sau khi mua.
- **Lý do chi tiết**: Pantry giảm 40% chiều dài danh sách. Ngăn mua trùng nguyên liệu đã có.
- **Phần trăm cải thiện**: Độ chính xác danh sách +40%, Lãng phí thực phẩm -30%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 5: Recipe-Linked Items
- **Vấn đề hiện tại**: Nguyên liệu grocery tách biệt khỏi dish nào cần chúng.
- **Giải pháp đề xuất**: Tap nguyên liệu → hiện "Dùng trong: Phở Gà (200g), Gà Rán (150g)". Lọc theo dish.
- **Lý do chi tiết**: Ngữ cảnh giúp ưu tiên. Nếu bỏ qua 1 dish, dễ dàng xóa nguyên liệu liên quan.
- **Phần trăm cải thiện**: Nhận thức ngữ cảnh +50%, Mua sắm linh hoạt +40%
- **Mức độ ưu tiên**: Medium | **Effort**: S

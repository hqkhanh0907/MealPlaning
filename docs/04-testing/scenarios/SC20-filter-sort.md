# Scenario 20: Filter, Sort & View Switcher

**Version:** 2.0  
**Date:** 2026-03-15  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Filter, Sort & View Switcher cho phép user sắp xếp, lọc và thay đổi cách hiển thị danh sách ingredients/dishes. FilterBottomSheet chứa sort options (name-asc/desc, cal-asc/desc, pro-asc/desc), tag filters (breakfast/lunch/dinner), và nutrition toggles (maxCalories, minProtein). ListToolbar hiển thị sort indicator, filter badge, và view switcher (grid/list). Draft state quản lý thay đổi trước khi Apply. Default sort: name-asc. Tất cả state persist qua reload.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| FilterBottomSheet | components/shared/FilterBottomSheet.tsx | Filter modal: sort, tags, nutrition toggles, Apply/Reset |
| ListToolbar | components/shared/ListToolbar.tsx | Toolbar: sort indicator, filter badge, view switcher |
| FilterConfig | types | Sort options, filter state type definitions |

## Luồng nghiệp vụ

1. User mở tab Quản lý → danh sách hiển thị với sort mặc định (name-asc)
2. User click nút Filter/Sort → FilterBottomSheet mở
3. User chọn sort option, tags, nutrition filters (draft state)
4. User nhấn Áp dụng → filters apply, sheet đóng, list cập nhật
5. User nhấn Đặt lại → tất cả reset về default
6. User click view switcher → chuyển grid/list layout
7. Search bar: nhập text → filter items real-time (debounce)

## Quy tắc nghiệp vụ

1. Default sort: name-asc (tên A-Z)
2. Sort options: name-asc, name-desc, cal-asc, cal-desc, pro-asc, pro-desc
3. Draft state: thay đổi trong sheet chưa apply cho đến khi nhấn Áp dụng
4. Tags filter: OR logic (item match bất kỳ tag nào được chọn)
5. Search + tags: AND logic (match search VÀ match tag)
6. View layouts: grid (cards) | list (rows)
7. Sort, filter, view state persist trong localStorage
8. Empty state khi 0 results: thông báo + nút xóa bộ lọc
9. Filter badge count = số filters active
10. Performance: sort 500 items < 100ms

## Test Cases (210 TCs)

| ID | Mô tả | Loại | Priority |
|---|---|---|---|
| TC_FS_001 | Sort mặc định A-Z theo tên | Positive | P0 |
| TC_FS_002 | Sort Z-A theo tên | Positive | P0 |
| TC_FS_003 | Sort A-Z chọn lại từ Z-A | Positive | P1 |
| TC_FS_004 | Sort tên tiếng Việt với dấu: Ă < B | Positive | P1 |
| TC_FS_005 | Sort tên tiếng Việt: Đ đúng vị trí | Positive | P1 |
| TC_FS_006 | Sort tên có ký tự đặc biệt | Edge | P2 |
| TC_FS_007 | Sort tên có số: '100g thịt' vs 'Abc' | Edge | P2 |
| TC_FS_008 | Sort tên case-insensitive | Positive | P2 |
| TC_FS_009 | Sort danh sách rỗng | Edge | P2 |
| TC_FS_010 | Sort 1 item duy nhất | Edge | P2 |
| TC_FS_011 | Sort 10 items | Positive | P1 |
| TC_FS_012 | Sort 50 items | Positive | P2 |
| TC_FS_013 | Sort 100 items | Boundary | P2 |
| TC_FS_014 | Sort stability: items cùng tên giữ thứ tự gốc | Positive | P2 |
| TC_FS_015 | Sort icon indicator hiện đúng | Positive | P1 |
| TC_FS_016 | Sort icon thay đổi khi đổi sort | Positive | P2 |
| TC_FS_017 | Sort preserve sau khi thêm item mới | Positive | P1 |
| TC_FS_018 | Sort preserve sau khi sửa item | Positive | P1 |
| TC_FS_019 | Sort preserve sau khi xóa item | Positive | P1 |
| TC_FS_020 | Sort re-apply khi data thay đổi | Positive | P1 |
| TC_FS_021 | Sort reset về default | Positive | P1 |
| TC_FS_022 | Sort draft state trước khi Apply | Positive | P2 |
| TC_FS_023 | Sort apply khi nhấn nút Áp dụng | Positive | P1 |
| TC_FS_024 | Sort cancel: đóng sheet không apply | Positive | P2 |
| TC_FS_025 | Sort tên với emoji trong tên | Edge | P2 |
| TC_FS_026 | Sort calories tăng dần (low→high) | Positive | P0 |
| TC_FS_027 | Sort calories giảm dần (high→low) | Positive | P0 |
| TC_FS_028 | Sort protein tăng dần | Positive | P1 |
| TC_FS_029 | Sort protein giảm dần | Positive | P1 |
| TC_FS_030 | Sort calories: items cùng calories | Positive | P2 |
| TC_FS_031 | Sort calories: item calories = 0 | Edge | P2 |
| TC_FS_032 | Sort calories: item calories rất cao (5000) | Edge | P2 |
| TC_FS_033 | Sort protein: item protein = 0 | Edge | P2 |
| TC_FS_034 | Sort protein: item protein rất cao (100g) | Edge | P2 |
| TC_FS_035 | Sort calories dishes vs sort calories ingredients | Positive | P2 |
| TC_FS_036 | Sort indicator cập nhật cho nutrition sort | Positive | P2 |
| TC_FS_037 | Sort by cal → secondary by name | Positive | P2 |
| TC_FS_038 | Sort với nutrition values missing/null | Edge | P2 |
| TC_FS_039 | Sort accuracy: đúng giá trị nutrition | Positive | P0 |
| TC_FS_040 | Sort calories: decimal values | Edge | P2 |
| TC_FS_041 | Sort performance: 500 items by calories | Boundary | P2 |
| TC_FS_042 | Sort chuyển từ name sang calories | Positive | P1 |
| TC_FS_043 | Sort chuyển từ calories sang protein | Positive | P1 |
| TC_FS_044 | Sort options hiển thị đầy đủ 6 options | Positive | P1 |
| TC_FS_045 | Sort option label tiếng Việt | Positive | P2 |
| TC_FS_046 | Sort radio button selection UI | Positive | P2 |
| TC_FS_047 | Sort active option highlighted trong filter | Positive | P2 |
| TC_FS_048 | Sort calories trên grid view | Positive | P2 |
| TC_FS_049 | Sort calories trên list view | Positive | P2 |
| TC_FS_050 | Sort after import data | Positive | P2 |
| TC_FS_051 | Sort after sync download | Positive | P2 |
| TC_FS_052 | Sort chuyển đổi nhanh giữa các options | Edge | P2 |
| TC_FS_053 | Sort kết hợp filter active | Positive | P1 |
| TC_FS_054 | Sort kết hợp search active | Positive | P1 |
| TC_FS_055 | Sort dark mode UI | Positive | P2 |
| TC_FS_056 | Sort persist khi chuyển tab (Ingredients→Dishes) | Positive | P1 |
| TC_FS_057 | Sort persist khi chuyển main tab | Positive | P1 |
| TC_FS_058 | Sort persist sau reload page | Positive | P1 |
| TC_FS_059 | Sort persist sau app restart | Positive | P2 |
| TC_FS_060 | Sort reset khi clear filter | Positive | P1 |
| TC_FS_061 | Draft sort state trong filter sheet | Positive | P2 |
| TC_FS_062 | Apply draft → sort thay đổi | Positive | P1 |
| TC_FS_063 | Cancel draft → sort không đổi | Positive | P2 |
| TC_FS_064 | Sort state sync giữa FilterBottomSheet và ListToolbar | Positive | P1 |
| TC_FS_065 | Sort default = name-asc cho user mới | Positive | P1 |
| TC_FS_066 | Sort localStorage key tồn tại | Positive | P2 |
| TC_FS_067 | Sort state khi data rỗng | Edge | P2 |
| TC_FS_068 | Sort persist khi thêm item đầu tiên | Positive | P2 |
| TC_FS_069 | Sort state independent giữa Ingredients và Dishes | Positive | P2 |
| TC_FS_070 | Sort state survive sync | Positive | P2 |
| TC_FS_071 | Sort state survive dark mode toggle | Positive | P2 |
| TC_FS_072 | Sort state survive language change | Positive | P2 |
| TC_FS_073 | Sort filter sheet mở nhanh | Positive | P2 |
| TC_FS_074 | Sort filter sheet đóng smooth | Positive | P2 |
| TC_FS_075 | Apply button disabled khi chưa thay đổi | Positive | P2 |
| TC_FS_076 | Filter single tag: breakfast | Positive | P1 |
| TC_FS_077 | Filter single tag: lunch | Positive | P1 |
| TC_FS_078 | Filter single tag: dinner | Positive | P1 |
| TC_FS_079 | Filter multiple tags: breakfast + lunch | Positive | P1 |
| TC_FS_080 | Filter all tags = show all | Positive | P2 |
| TC_FS_081 | Clear tag filter | Positive | P1 |
| TC_FS_082 | Tag chip selection UI | Positive | P2 |
| TC_FS_083 | Tag chip selected state visual | Positive | P2 |
| TC_FS_084 | Tag chip deselect | Positive | P2 |
| TC_FS_085 | Filter tag + sort combined | Positive | P0 |
| TC_FS_086 | No items match filter → empty state | Positive | P1 |
| TC_FS_087 | Filter result count hiển thị | Positive | P1 |
| TC_FS_088 | Tag filter with search combined | Positive | P1 |
| TC_FS_089 | Tag filter persistence on reload | Positive | P2 |
| TC_FS_090 | Tag labels tiếng Việt | Positive | P2 |
| TC_FS_091 | Filter với item không có tag | Edge | P2 |
| TC_FS_092 | Filter với item có nhiều tags | Positive | P2 |
| TC_FS_093 | maxCalories filter toggle (nếu có) | Positive | P2 |
| TC_FS_094 | minProtein filter toggle (nếu có) | Positive | P2 |
| TC_FS_095 | Combined: tag + maxCalories + sort | Positive | P2 |
| TC_FS_096 | Reset clears all filters | Positive | P0 |
| TC_FS_097 | Filter badge count trên button | Positive | P2 |
| TC_FS_098 | Filter badge update khi add/remove filter | Positive | P2 |
| TC_FS_099 | Filter items count sau filter | Positive | P1 |
| TC_FS_100 | Filter sheet dark mode | Positive | P2 |
| TC_FS_101 | Filter sheet responsive mobile | Positive | P1 |
| TC_FS_102 | Filter sheet responsive desktop | Positive | P2 |
| TC_FS_103 | Filter sheet close khi apply | Positive | P1 |
| TC_FS_104 | Filter animation open/close | Positive | P2 |
| TC_FS_105 | Filter keyboard accessible | Positive | P3 |
| TC_FS_106 | Search text filter basic | Positive | P0 |
| TC_FS_107 | Search tiếng Việt có dấu | Positive | P1 |
| TC_FS_108 | Search case-insensitive | Positive | P1 |
| TC_FS_109 | Search partial match | Positive | P1 |
| TC_FS_110 | Search + tag filter combined | Positive | P0 |
| TC_FS_111 | Search + sort combined | Positive | P1 |
| TC_FS_112 | Search + tag + sort (triple combined) | Positive | P1 |
| TC_FS_113 | Clear search | Positive | P1 |
| TC_FS_114 | Clear all filters button | Positive | P0 |
| TC_FS_115 | Combined filter summary display | Positive | P2 |
| TC_FS_116 | Combined filter badge count | Positive | P2 |
| TC_FS_117 | Clear individual filter từ chip | Positive | P2 |
| TC_FS_118 | Combined filters: 0 results | Positive | P1 |
| TC_FS_119 | Combined filters: 1 result | Positive | P2 |
| TC_FS_120 | Combined filters: 100 results | Positive | P2 |
| TC_FS_121 | Search debounce (không search mỗi keystroke) | Positive | P2 |
| TC_FS_122 | Search empty string = show all | Positive | P1 |
| TC_FS_123 | Search highlight match text (nếu có) | Positive | P3 |
| TC_FS_124 | Search không match → empty state message | Positive | P1 |
| TC_FS_125 | Search reset khi chuyển sub-tab | Positive | P2 |
| TC_FS_126 | Search with Vietnamese combining chars | Edge | P2 |
| TC_FS_127 | Search icon và clear button | Positive | P2 |
| TC_FS_128 | Search bar focus state | Positive | P2 |
| TC_FS_129 | Search accessibility: aria-label | Positive | P3 |
| TC_FS_130 | Search + filter badge combined count | Positive | P2 |
| TC_FS_131 | Filter summary text truncation | Positive | P2 |
| TC_FS_132 | Search bar dark mode | Positive | P2 |
| TC_FS_133 | Search bar responsive mobile | Positive | P2 |
| TC_FS_134 | Search bar responsive desktop | Positive | P2 |
| TC_FS_135 | Search persist khi scroll list | Positive | P2 |
| TC_FS_136 | View switcher: grid view mặc định | Positive | P1 |
| TC_FS_137 | Switch sang list view | Positive | P0 |
| TC_FS_138 | Switch lại grid view | Positive | P0 |
| TC_FS_139 | View toggle button/icon hiển thị | Positive | P1 |
| TC_FS_140 | Grid view: card layout với image | Positive | P1 |
| TC_FS_141 | List view: row layout compact | Positive | P1 |
| TC_FS_142 | View persistence on reload | Positive | P1 |
| TC_FS_143 | View persistence on tab switch | Positive | P1 |
| TC_FS_144 | Grid 1 column mobile | Positive | P1 |
| TC_FS_145 | Grid 2 columns tablet | Positive | P1 |
| TC_FS_146 | Grid 3 columns desktop | Positive | P1 |
| TC_FS_147 | List view full-width rows | Positive | P1 |
| TC_FS_148 | View transition animation | Positive | P2 |
| TC_FS_149 | View switch preserve scroll position | Positive | P2 |
| TC_FS_150 | View switch preserve filter/sort state | Positive | P1 |
| TC_FS_151 | View switcher dark mode | Positive | P2 |
| TC_FS_152 | View switcher responsive | Positive | P2 |
| TC_FS_153 | View state lưu trong localStorage | Positive | P2 |
| TC_FS_154 | onLayoutChange callback triggered | Positive | P2 |
| TC_FS_155 | Grid view empty state | Positive | P2 |
| TC_FS_156 | List view empty state | Positive | P2 |
| TC_FS_157 | Grid view 1 item | Positive | P2 |
| TC_FS_158 | List view 1 item | Positive | P2 |
| TC_FS_159 | Grid view 50 items performance | Boundary | P2 |
| TC_FS_160 | List view 100 items performance | Boundary | P2 |
| TC_FS_161 | Card hiển thị tên dish | Positive | P1 |
| TC_FS_162 | Card hiển thị calories | Positive | P1 |
| TC_FS_163 | Card hiển thị image (nếu có) | Positive | P2 |
| TC_FS_164 | Card hiển thị tags | Positive | P2 |
| TC_FS_165 | Card click → navigate to detail | Positive | P0 |
| TC_FS_166 | Card layout spacing đều | Positive | P2 |
| TC_FS_167 | Card min/max width | Positive | P2 |
| TC_FS_168 | Card hover effect (desktop) | Positive | P2 |
| TC_FS_169 | Card tap feedback (mobile) | Positive | P2 |
| TC_FS_170 | Card long name truncation | Positive | P2 |
| TC_FS_171 | Card no image placeholder | Positive | P2 |
| TC_FS_172 | Card nutrition info compact | Positive | P2 |
| TC_FS_173 | Card action buttons | Positive | P2 |
| TC_FS_174 | Card dark mode | Positive | P2 |
| TC_FS_175 | Card border visible | Positive | P2 |
| TC_FS_176 | Card grid alignment last row | Positive | P2 |
| TC_FS_177 | Card image aspect ratio | Positive | P2 |
| TC_FS_178 | Card loading skeleton | Positive | P2 |
| TC_FS_179 | Card animation khi filter change | Positive | P3 |
| TC_FS_180 | Card count match filter results | Positive | P1 |
| TC_FS_181 | Row hiển thị tên dish | Positive | P1 |
| TC_FS_182 | Row hiển thị calories | Positive | P1 |
| TC_FS_183 | Row hiển thị protein | Positive | P2 |
| TC_FS_184 | Row hiển thị tags | Positive | P2 |
| TC_FS_185 | Row click → navigate to detail | Positive | P0 |
| TC_FS_186 | Row action buttons | Positive | P2 |
| TC_FS_187 | Row alternate colors (zebra striping) | Positive | P3 |
| TC_FS_188 | Row hover (desktop) | Positive | P2 |
| TC_FS_189 | Row long name handling | Positive | P2 |
| TC_FS_190 | Row compact info display | Positive | P2 |
| TC_FS_191 | Row dark mode | Positive | P2 |
| TC_FS_192 | Row separator lines | Positive | P2 |
| TC_FS_193 | Row loading skeleton | Positive | P2 |
| TC_FS_194 | Row 0 items | Positive | P1 |
| TC_FS_195 | Row 1 item | Positive | P2 |
| TC_FS_196 | Row 50 items | Positive | P2 |
| TC_FS_197 | Row 100 items performance | Boundary | P2 |
| TC_FS_198 | Row image thumbnail (nếu có) | Positive | P2 |
| TC_FS_199 | Row swipe actions mobile (nếu có) | Positive | P3 |
| TC_FS_200 | Row count match filter results | Positive | P1 |
| TC_FS_201 | Dark mode: filter bottom sheet | Positive | P2 |
| TC_FS_202 | Dark mode: sort icons/indicators | Positive | P2 |
| TC_FS_203 | Dark mode: view switcher buttons | Positive | P2 |
| TC_FS_204 | Mobile: filter as bottom sheet | Positive | P1 |
| TC_FS_205 | Desktop: filter as popup/sidebar | Positive | P2 |
| TC_FS_206 | Screen reader: filter labels | Positive | P3 |
| TC_FS_207 | Keyboard: navigate filter options | Positive | P3 |
| TC_FS_208 | Performance: sort 500 items < 100ms | Boundary | P2 |
| TC_FS_209 | FilterBottomSheet animation smooth | Positive | P2 |
| TC_FS_210 | Result count aria-live announcement | Positive | P3 |

---

## Chi tiết Test Cases

### Nhóm 1: Sort by Name (Sắp xếp theo tên) (TC_FS_001 – TC_FS_025)

### TC_FS_001: Sort mặc định A-Z theo tên

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_001 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Tab Quản lý, có ≥3 items |
| **Các bước thực hiện** | 1. Mở tab Quản lý > Nguyên liệu<br>2. Kiểm tra thứ tự danh sách |
| **Kết quả mong đợi** | Items sắp xếp A-Z theo name (mặc định name-asc) |
| **Kết quả test thực tế** | — |

### TC_FS_002: Sort Z-A theo tên

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_002 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Có ≥3 items, sort mặc định |
| **Các bước thực hiện** | 1. Mở Filter/Sort<br>2. Chọn 'Tên Z-A'<br>3. Nhấn Áp dụng |
| **Kết quả mong đợi** | Items sắp xếp Z-A |
| **Kết quả test thực tế** | — |

### TC_FS_003: Sort A-Z chọn lại từ Z-A

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_003 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sort đang là Z-A |
| **Các bước thực hiện** | 1. Mở Filter<br>2. Chọn 'Tên A-Z'<br>3. Áp dụng |
| **Kết quả mong đợi** | Items quay về A-Z |
| **Kết quả test thực tế** | — |

### TC_FS_004: Sort tên tiếng Việt với dấu: Ă < B

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_004 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Items: Ăn, Bún, Cá |
| **Các bước thực hiện** | 1. Sort A-Z |
| **Kết quả mong đợi** | Thứ tự: Ăn → Bún → Cá |
| **Kết quả test thực tế** | — |

### TC_FS_005: Sort tên tiếng Việt: Đ đúng vị trí

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_005 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Items: Cá, Đậu, Em |
| **Các bước thực hiện** | 1. Sort A-Z |
| **Kết quả mong đợi** | Thứ tự: Cá → Đậu → Em (Đ sau D) |
| **Kết quả test thực tế** | — |

### TC_FS_006: Sort tên có ký tự đặc biệt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_006 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Item tên: '#Special', 'Abc' |
| **Các bước thực hiện** | 1. Sort A-Z |
| **Kết quả mong đợi** | # trước chữ cái, hoặc cuối (consistent) |
| **Kết quả test thực tế** | — |

### TC_FS_007: Sort tên có số: '100g thịt' vs 'Abc'

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_007 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Items với tên bắt đầu bằng số |
| **Các bước thực hiện** | 1. Sort A-Z |
| **Kết quả mong đợi** | Số sort trước chữ cái hoặc theo locale |
| **Kết quả test thực tế** | — |

### TC_FS_008: Sort tên case-insensitive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_008 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Items: 'abc', 'ABC', 'Bcd' |
| **Các bước thực hiện** | 1. Sort A-Z |
| **Kết quả mong đợi** | 'abc' và 'ABC' cạnh nhau, không phân biệt hoa/thường |
| **Kết quả test thực tế** | — |

### TC_FS_009: Sort danh sách rỗng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_009 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 0 items |
| **Các bước thực hiện** | 1. Mở Filter<br>2. Chọn sort<br>3. Áp dụng |
| **Kết quả mong đợi** | Không crash, empty state hiển thị |
| **Kết quả test thực tế** | — |

### TC_FS_010: Sort 1 item duy nhất

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_010 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 1 item |
| **Các bước thực hiện** | 1. Sort A-Z hoặc Z-A |
| **Kết quả mong đợi** | 1 item hiển thị đúng |
| **Kết quả test thực tế** | — |

### TC_FS_011: Sort 10 items

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_011 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | 10 items |
| **Các bước thực hiện** | 1. Sort A-Z |
| **Kết quả mong đợi** | 10 items đúng thứ tự |
| **Kết quả test thực tế** | — |

### TC_FS_012: Sort 50 items

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_012 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 50 items |
| **Các bước thực hiện** | 1. Sort A-Z |
| **Kết quả mong đợi** | 50 items đúng thứ tự, performance OK |
| **Kết quả test thực tế** | — |

### TC_FS_013: Sort 100 items

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_013 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 100 items |
| **Các bước thực hiện** | 1. Sort A-Z |
| **Kết quả mong đợi** | 100 items sort đúng, < 100ms |
| **Kết quả test thực tế** | — |

### TC_FS_014: Sort stability: items cùng tên giữ thứ tự gốc

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_014 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 2 items cùng tên 'Thịt bò' |
| **Các bước thực hiện** | 1. Sort A-Z |
| **Kết quả mong đợi** | 2 items cùng tên giữ thứ tự relative ban đầu |
| **Kết quả test thực tế** | — |

### TC_FS_015: Sort icon indicator hiện đúng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_015 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sort đang A-Z |
| **Các bước thực hiện** | 1. Kiểm tra sort button |
| **Kết quả mong đợi** | Icon mũi tên lên (↑) hoặc indicator A-Z |
| **Kết quả test thực tế** | — |

### TC_FS_016: Sort icon thay đổi khi đổi sort

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_016 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Đổi sort sang Z-A |
| **Các bước thực hiện** | 1. Kiểm tra icon |
| **Kết quả mong đợi** | Icon đổi thành mũi tên xuống (↓) hoặc Z-A |
| **Kết quả test thực tế** | — |

### TC_FS_017: Sort preserve sau khi thêm item mới

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_017 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sort Z-A, có 5 items |
| **Các bước thực hiện** | 1. Thêm item mới 'Abc'<br>2. Kiểm tra list |
| **Kết quả mong đợi** | Item mới xuất hiện đúng vị trí trong sort Z-A |
| **Kết quả test thực tế** | — |

### TC_FS_018: Sort preserve sau khi sửa item

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_018 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sort A-Z, sửa tên item |
| **Các bước thực hiện** | 1. Sửa 'Aaa' → 'Zzz'<br>2. Kiểm tra list |
| **Kết quả mong đợi** | 'Zzz' di chuyển xuống cuối (re-sort) |
| **Kết quả test thực tế** | — |

### TC_FS_019: Sort preserve sau khi xóa item

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_019 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sort A-Z, 5 items |
| **Các bước thực hiện** | 1. Xóa item giữa<br>2. Kiểm tra list |
| **Kết quả mong đợi** | 4 items còn lại giữ sort A-Z |
| **Kết quả test thực tế** | — |

### TC_FS_020: Sort re-apply khi data thay đổi

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_020 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sort active |
| **Các bước thực hiện** | 1. Thêm/sửa/xóa item |
| **Kết quả mong đợi** | Sort tự apply lại, list luôn đúng thứ tự |
| **Kết quả test thực tế** | — |

### TC_FS_021: Sort reset về default

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_021 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sort đang Z-A |
| **Các bước thực hiện** | 1. Mở Filter<br>2. Nhấn 'Đặt lại' |
| **Kết quả mong đợi** | Sort quay về name-asc (A-Z) |
| **Kết quả test thực tế** | — |

### TC_FS_022: Sort draft state trước khi Apply

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_022 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Filter sheet mở |
| **Các bước thực hiện** | 1. Chọn sort Z-A nhưng chưa nhấn Áp dụng |
| **Kết quả mong đợi** | List chưa thay đổi (draft state) |
| **Kết quả test thực tế** | — |

### TC_FS_023: Sort apply khi nhấn nút Áp dụng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_023 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Draft sort đã chọn |
| **Các bước thực hiện** | 1. Nhấn 'Áp dụng' |
| **Kết quả mong đợi** | List cập nhật theo sort mới, sheet đóng |
| **Kết quả test thực tế** | — |

### TC_FS_024: Sort cancel: đóng sheet không apply

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_024 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Draft sort đã chọn |
| **Các bước thực hiện** | 1. Đóng filter sheet (swipe/X) |
| **Kết quả mong đợi** | List giữ sort cũ, draft bị discard |
| **Kết quả test thực tế** | — |

### TC_FS_025: Sort tên với emoji trong tên

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_025 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Item: '🍜 Phở', 'Abc' |
| **Các bước thực hiện** | 1. Sort A-Z |
| **Kết quả mong đợi** | Emoji items sort consistent (trước hoặc sau chữ) |
| **Kết quả test thực tế** | — |

### Nhóm 2: Sort by Nutrition (Sắp xếp theo dinh dưỡng) (TC_FS_026 – TC_FS_055)

### TC_FS_026: Sort calories tăng dần (low→high)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_026 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | ≥3 items có calories khác nhau |
| **Các bước thực hiện** | 1. Mở Filter<br>2. Chọn 'Calo tăng dần'<br>3. Áp dụng |
| **Kết quả mong đợi** | Items sort theo calories: 100 → 200 → 500 |
| **Kết quả test thực tế** | — |

### TC_FS_027: Sort calories giảm dần (high→low)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_027 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | ≥3 items |
| **Các bước thực hiện** | 1. Chọn 'Calo giảm dần'<br>2. Áp dụng |
| **Kết quả mong đợi** | Items sort: 500 → 200 → 100 |
| **Kết quả test thực tế** | — |

### TC_FS_028: Sort protein tăng dần

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_028 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | ≥3 items có protein khác nhau |
| **Các bước thực hiện** | 1. Chọn 'Đạm tăng dần'<br>2. Áp dụng |
| **Kết quả mong đợi** | Items sort theo protein ascending |
| **Kết quả test thực tế** | — |

### TC_FS_029: Sort protein giảm dần

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_029 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | ≥3 items |
| **Các bước thực hiện** | 1. Chọn 'Đạm giảm dần'<br>2. Áp dụng |
| **Kết quả mong đợi** | Items sort theo protein descending |
| **Kết quả test thực tế** | — |

### TC_FS_030: Sort calories: items cùng calories

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_030 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 3 items cùng 200 kcal |
| **Các bước thực hiện** | 1. Sort calories ascending |
| **Kết quả mong đợi** | 3 items cùng cal, secondary sort by name hoặc giữ nguyên |
| **Kết quả test thực tế** | — |

### TC_FS_031: Sort calories: item calories = 0

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_031 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Item calories = 0 trong list |
| **Các bước thực hiện** | 1. Sort calories ascending |
| **Kết quả mong đợi** | Item 0 cal ở đầu list |
| **Kết quả test thực tế** | — |

### TC_FS_032: Sort calories: item calories rất cao (5000)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_032 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Item 5000 kcal |
| **Các bước thực hiện** | 1. Sort calories descending |
| **Kết quả mong đợi** | Item 5000 kcal ở đầu list |
| **Kết quả test thực tế** | — |

### TC_FS_033: Sort protein: item protein = 0

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_033 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Item protein = 0 |
| **Các bước thực hiện** | 1. Sort protein ascending |
| **Kết quả mong đợi** | Item 0g protein ở đầu |
| **Kết quả test thực tế** | — |

### TC_FS_034: Sort protein: item protein rất cao (100g)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_034 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Item 100g protein |
| **Các bước thực hiện** | 1. Sort protein descending |
| **Kết quả mong đợi** | Item 100g ở đầu |
| **Kết quả test thực tế** | — |

### TC_FS_035: Sort calories dishes vs sort calories ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_035 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Cả dishes và ingredients có calories |
| **Các bước thực hiện** | 1. Sort calories trên tab Dishes<br>2. Sort calories trên tab Ingredients |
| **Kết quả mong đợi** | Cả 2 tabs sort đúng theo calories |
| **Kết quả test thực tế** | — |

### TC_FS_036: Sort indicator cập nhật cho nutrition sort

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_036 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sort = cal-desc |
| **Các bước thực hiện** | 1. Kiểm tra toolbar indicator |
| **Kết quả mong đợi** | Indicator hiển thị 'Calo ↓' hoặc tương tự |
| **Kết quả test thực tế** | — |

### TC_FS_037: Sort by cal → secondary by name

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_037 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Items: (200cal, 'Zzz'), (200cal, 'Aaa') |
| **Các bước thực hiện** | 1. Sort calories ascending |
| **Kết quả mong đợi** | Cùng cal → sort by name: Aaa trước Zzz |
| **Kết quả test thực tế** | — |

### TC_FS_038: Sort với nutrition values missing/null

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_038 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Item không có calories data |
| **Các bước thực hiện** | 1. Sort calories ascending |
| **Kết quả mong đợi** | Item missing cal ở cuối hoặc đầu (consistent) |
| **Kết quả test thực tế** | — |

### TC_FS_039: Sort accuracy: đúng giá trị nutrition

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_039 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Items: 100kcal, 300kcal, 200kcal |
| **Các bước thực hiện** | 1. Sort cal ascending |
| **Kết quả mong đợi** | Thứ tự: 100 → 200 → 300 (chính xác) |
| **Kết quả test thực tế** | — |

### TC_FS_040: Sort calories: decimal values

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_040 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Items: 100.5kcal, 100.3kcal |
| **Các bước thực hiện** | 1. Sort cal ascending |
| **Kết quả mong đợi** | 100.3 trước 100.5 |
| **Kết quả test thực tế** | — |

### TC_FS_041: Sort performance: 500 items by calories

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_041 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 500 items |
| **Các bước thực hiện** | 1. Sort cal ascending |
| **Kết quả mong đợi** | Sort hoàn thành < 100ms |
| **Kết quả test thực tế** | — |

### TC_FS_042: Sort chuyển từ name sang calories

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_042 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sort đang name-asc |
| **Các bước thực hiện** | 1. Đổi sang cal-asc<br>2. Áp dụng |
| **Kết quả mong đợi** | List re-sort theo calories, indicator update |
| **Kết quả test thực tế** | — |

### TC_FS_043: Sort chuyển từ calories sang protein

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_043 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sort đang cal-asc |
| **Các bước thực hiện** | 1. Đổi sang pro-desc<br>2. Áp dụng |
| **Kết quả mong đợi** | List re-sort theo protein desc |
| **Kết quả test thực tế** | — |

### TC_FS_044: Sort options hiển thị đầy đủ 6 options

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_044 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Mở filter sheet |
| **Các bước thực hiện** | 1. Kiểm tra sort options |
| **Kết quả mong đợi** | 6 options: name-asc, name-desc, cal-asc, cal-desc, pro-asc, pro-desc |
| **Kết quả test thực tế** | — |

### TC_FS_045: Sort option label tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_045 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Mở filter sheet |
| **Các bước thực hiện** | 1. Kiểm tra labels |
| **Kết quả mong đợi** | 'Tên A-Z', 'Tên Z-A', 'Calo tăng', 'Calo giảm', 'Đạm tăng', 'Đạm giảm' |
| **Kết quả test thực tế** | — |

### TC_FS_046: Sort radio button selection UI

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_046 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Filter sheet mở |
| **Các bước thực hiện** | 1. Chọn 1 sort option |
| **Kết quả mong đợi** | Radio button/chip selected, các option khác deselected |
| **Kết quả test thực tế** | — |

### TC_FS_047: Sort active option highlighted trong filter

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_047 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sort = cal-desc, mở filter |
| **Các bước thực hiện** | 1. Kiểm tra filter sheet |
| **Kết quả mong đợi** | Option 'Calo giảm' đang được selected/highlighted |
| **Kết quả test thực tế** | — |

### TC_FS_048: Sort calories trên grid view

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_048 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Grid view active, sort cal-asc |
| **Các bước thực hiện** | 1. Kiểm tra cards order |
| **Kết quả mong đợi** | Cards sắp xếp theo calories đúng |
| **Kết quả test thực tế** | — |

### TC_FS_049: Sort calories trên list view

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_049 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | List view active, sort cal-asc |
| **Các bước thực hiện** | 1. Kiểm tra rows order |
| **Kết quả mong đợi** | Rows sắp xếp theo calories đúng |
| **Kết quả test thực tế** | — |

### TC_FS_050: Sort after import data

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_050 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Import 20 items mới, sort active |
| **Các bước thực hiện** | 1. Import data |
| **Kết quả mong đợi** | Items mới merged và sort apply |
| **Kết quả test thực tế** | — |

### TC_FS_051: Sort after sync download

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_051 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sync download data mới, sort active |
| **Các bước thực hiện** | 1. Sync hoàn thành |
| **Kết quả mong đợi** | Data mới sort đúng |
| **Kết quả test thực tế** | — |

### TC_FS_052: Sort chuyển đổi nhanh giữa các options

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_052 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Filter sheet mở |
| **Các bước thực hiện** | 1. Chọn cal-asc → pro-desc → name-asc nhanh |
| **Kết quả mong đợi** | Mỗi lần áp dụng sort đúng, không crash |
| **Kết quả test thực tế** | — |

### TC_FS_053: Sort kết hợp filter active

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_053 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Filter tag = 'breakfast' + sort cal-asc |
| **Các bước thực hiện** | 1. Kiểm tra list |
| **Kết quả mong đợi** | Chỉ items có tag breakfast, sort theo cal ascending |
| **Kết quả test thực tế** | — |

### TC_FS_054: Sort kết hợp search active

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_054 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Search 'thịt' + sort pro-desc |
| **Các bước thực hiện** | 1. Kiểm tra list |
| **Kết quả mong đợi** | Chỉ items match 'thịt', sort theo protein desc |
| **Kết quả test thực tế** | — |

### TC_FS_055: Sort dark mode UI

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_055 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở filter, chọn sort |
| **Kết quả mong đợi** | Sort UI hiển thị đúng trong dark mode |
| **Kết quả test thực tế** | — |

### Nhóm 3: Sort Persistence & State (Lưu trữ trạng thái sort) (TC_FS_056 – TC_FS_075)

### TC_FS_056: Sort persist khi chuyển tab (Ingredients→Dishes)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_056 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sort = cal-desc trên Ingredients |
| **Các bước thực hiện** | 1. Chuyển sang tab Dishes<br>2. Quay lại Ingredients |
| **Kết quả mong đợi** | Sort vẫn cal-desc trên Ingredients |
| **Kết quả test thực tế** | — |

### TC_FS_057: Sort persist khi chuyển main tab

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_057 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sort active trên Quản lý |
| **Các bước thực hiện** | 1. Chuyển sang tab Lịch<br>2. Quay lại Quản lý |
| **Kết quả mong đợi** | Sort vẫn active |
| **Kết quả test thực tế** | — |

### TC_FS_058: Sort persist sau reload page

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_058 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sort = name-desc |
| **Các bước thực hiện** | 1. Reload page (F5)<br>2. Kiểm tra sort |
| **Kết quả mong đợi** | Sort vẫn name-desc sau reload |
| **Kết quả test thực tế** | — |

### TC_FS_059: Sort persist sau app restart

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_059 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sort = pro-asc |
| **Các bước thực hiện** | 1. Đóng app<br>2. Mở lại |
| **Kết quả mong đợi** | Sort vẫn pro-asc |
| **Kết quả test thực tế** | — |

### TC_FS_060: Sort reset khi clear filter

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_060 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sort = cal-desc, filter active |
| **Các bước thực hiện** | 1. Nhấn 'Đặt lại' trong filter sheet |
| **Kết quả mong đợi** | Sort quay về default (name-asc), filter cleared |
| **Kết quả test thực tế** | — |

### TC_FS_061: Draft sort state trong filter sheet

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_061 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sort = name-asc, mở filter |
| **Các bước thực hiện** | 1. Chọn cal-desc (nhưng chưa Apply) |
| **Kết quả mong đợi** | Ngoài list vẫn name-asc |
| **Kết quả test thực tế** | — |

### TC_FS_062: Apply draft → sort thay đổi

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_062 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Draft cal-desc ready |
| **Các bước thực hiện** | 1. Nhấn Áp dụng |
| **Kết quả mong đợi** | List sort theo cal-desc, sheet đóng |
| **Kết quả test thực tế** | — |

### TC_FS_063: Cancel draft → sort không đổi

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_063 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Draft ready |
| **Các bước thực hiện** | 1. Đóng sheet không Apply |
| **Kết quả mong đợi** | List giữ sort cũ |
| **Kết quả test thực tế** | — |

### TC_FS_064: Sort state sync giữa FilterBottomSheet và ListToolbar

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_064 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Sort = cal-desc |
| **Các bước thực hiện** | 1. Kiểm tra cả filter sheet và toolbar indicator |
| **Kết quả mong đợi** | Cả 2 hiển thị đúng sort đang active |
| **Kết quả test thực tế** | — |

### TC_FS_065: Sort default = name-asc cho user mới

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_065 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | User mới, chưa sort bao giờ |
| **Các bước thực hiện** | 1. Mở tab Quản lý |
| **Kết quả mong đợi** | Sort mặc định name-asc |
| **Kết quả test thực tế** | — |

### TC_FS_066: Sort localStorage key tồn tại

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_066 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Đã chọn sort |
| **Các bước thực hiện** | 1. Kiểm tra localStorage |
| **Kết quả mong đợi** | Sort preference được lưu |
| **Kết quả test thực tế** | — |

### TC_FS_067: Sort state khi data rỗng

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_067 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 0 items, sort = cal-desc |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Sort state preserved dù list rỗng |
| **Kết quả test thực tế** | — |

### TC_FS_068: Sort persist khi thêm item đầu tiên

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_068 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 0 items, sort = cal-desc, thêm 1 item |
| **Các bước thực hiện** | 1. Thêm item |
| **Kết quả mong đợi** | Item hiển thị, sort state vẫn cal-desc |
| **Kết quả test thực tế** | — |

### TC_FS_069: Sort state independent giữa Ingredients và Dishes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_069 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Ingredients sort = name-asc, Dishes sort = cal-desc |
| **Các bước thực hiện** | 1. Kiểm tra cả 2 tabs |
| **Kết quả mong đợi** | Mỗi tab giữ sort riêng |
| **Kết quả test thực tế** | — |

### TC_FS_070: Sort state survive sync

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_070 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sort active, sync chạy |
| **Các bước thực hiện** | 1. Sync hoàn thành |
| **Kết quả mong đợi** | Sort state giữ nguyên sau sync |
| **Kết quả test thực tế** | — |

### TC_FS_071: Sort state survive dark mode toggle

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_071 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sort active |
| **Các bước thực hiện** | 1. Toggle dark mode |
| **Kết quả mong đợi** | Sort không reset |
| **Kết quả test thực tế** | — |

### TC_FS_072: Sort state survive language change

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_072 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sort active |
| **Các bước thực hiện** | 1. Đổi ngôn ngữ |
| **Kết quả mong đợi** | Sort không reset |
| **Kết quả test thực tế** | — |

### TC_FS_073: Sort filter sheet mở nhanh

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_073 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Click sort/filter button |
| **Các bước thực hiện** | 1. Đo thời gian mở sheet |
| **Kết quả mong đợi** | Sheet mở < 200ms |
| **Kết quả test thực tế** | — |

### TC_FS_074: Sort filter sheet đóng smooth

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_074 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Sheet đang mở |
| **Các bước thực hiện** | 1. Đóng sheet |
| **Kết quả mong đợi** | Animation đóng smooth |
| **Kết quả test thực tế** | — |

### TC_FS_075: Apply button disabled khi chưa thay đổi

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_075 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Filter sheet mở, chưa đổi gì |
| **Các bước thực hiện** | 1. Kiểm tra Apply button |
| **Kết quả mong đợi** | Nút Apply disabled hoặc không highlight |
| **Kết quả test thực tế** | — |

### Nhóm 4: Filter by Tags (Lọc theo nhãn) (TC_FS_076 – TC_FS_105)

### TC_FS_076: Filter single tag: breakfast

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_076 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Items có tags: breakfast, lunch, dinner |
| **Các bước thực hiện** | 1. Mở filter<br>2. Chọn tag 'Sáng'<br>3. Áp dụng |
| **Kết quả mong đợi** | Chỉ hiển thị items có tag breakfast |
| **Kết quả test thực tế** | — |

### TC_FS_077: Filter single tag: lunch

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_077 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Items có tags khác nhau |
| **Các bước thực hiện** | 1. Chọn tag 'Trưa'<br>2. Áp dụng |
| **Kết quả mong đợi** | Chỉ hiển thị items tag lunch |
| **Kết quả test thực tế** | — |

### TC_FS_078: Filter single tag: dinner

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_078 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Items có tags |
| **Các bước thực hiện** | 1. Chọn tag 'Tối'<br>2. Áp dụng |
| **Kết quả mong đợi** | Chỉ items tag dinner |
| **Kết quả test thực tế** | — |

### TC_FS_079: Filter multiple tags: breakfast + lunch

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_079 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Items có tags |
| **Các bước thực hiện** | 1. Chọn 'Sáng' + 'Trưa'<br>2. Áp dụng |
| **Kết quả mong đợi** | Items có tag breakfast HOẶC lunch |
| **Kết quả test thực tế** | — |

### TC_FS_080: Filter all tags = show all

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_080 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Chọn tất cả tags |
| **Các bước thực hiện** | 1. Chọn Sáng + Trưa + Tối<br>2. Áp dụng |
| **Kết quả mong đợi** | Hiển thị tất cả items |
| **Kết quả test thực tế** | — |

### TC_FS_081: Clear tag filter

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_081 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Tag filter active |
| **Các bước thực hiện** | 1. Bỏ chọn tất cả tags<br>2. Áp dụng |
| **Kết quả mong đợi** | Tất cả items hiển thị |
| **Kết quả test thực tế** | — |

### TC_FS_082: Tag chip selection UI

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_082 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Filter sheet mở |
| **Các bước thực hiện** | 1. Kiểm tra tag chips |
| **Kết quả mong đợi** | Tags hiển thị dạng chip/pill, click để select/deselect |
| **Kết quả test thực tế** | — |

### TC_FS_083: Tag chip selected state visual

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_083 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Chọn tag chip |
| **Các bước thực hiện** | 1. Kiểm tra chip |
| **Kết quả mong đợi** | Chip selected có background color khác, border hoặc check icon |
| **Kết quả test thực tế** | — |

### TC_FS_084: Tag chip deselect

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_084 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Tag đang selected |
| **Các bước thực hiện** | 1. Click tag chip lần nữa |
| **Kết quả mong đợi** | Chip deselected, quay về style bình thường |
| **Kết quả test thực tế** | — |

### TC_FS_085: Filter tag + sort combined

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_085 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Filter tag = lunch + sort = cal-desc |
| **Các bước thực hiện** | 1. Áp dụng cả 2 |
| **Kết quả mong đợi** | Chỉ items lunch, sort theo cal giảm |
| **Kết quả test thực tế** | — |

### TC_FS_086: No items match filter → empty state

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_086 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Filter tag không match item nào |
| **Các bước thực hiện** | 1. Filter tag 'dinner' khi không có dinner items<br>2. Áp dụng |
| **Kết quả mong đợi** | Empty state 'Không tìm thấy kết quả' |
| **Kết quả test thực tế** | — |

### TC_FS_087: Filter result count hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_087 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Filter active, 5 items match |
| **Các bước thực hiện** | 1. Kiểm tra UI |
| **Kết quả mong đợi** | '5 kết quả' hoặc '5 items' hiển thị |
| **Kết quả test thực tế** | — |

### TC_FS_088: Tag filter with search combined

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_088 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Filter tag + search text |
| **Các bước thực hiện** | 1. Chọn tag 'Sáng'<br>2. Nhập 'phở' trong search |
| **Kết quả mong đợi** | Chỉ items tag breakfast VÀ match 'phở' |
| **Kết quả test thực tế** | — |

### TC_FS_089: Tag filter persistence on reload

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_089 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Tag filter active |
| **Các bước thực hiện** | 1. Reload page |
| **Kết quả mong đợi** | Filter tag vẫn active sau reload |
| **Kết quả test thực tế** | — |

### TC_FS_090: Tag labels tiếng Việt

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_090 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Filter sheet mở |
| **Các bước thực hiện** | 1. Kiểm tra tag labels |
| **Kết quả mong đợi** | 'Sáng', 'Trưa', 'Tối' (tiếng Việt) |
| **Kết quả test thực tế** | — |

### TC_FS_091: Filter với item không có tag

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_091 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Item không được gán tag nào |
| **Các bước thực hiện** | 1. Filter tag = breakfast |
| **Kết quả mong đợi** | Item không có tag bị ẩn |
| **Kết quả test thực tế** | — |

### TC_FS_092: Filter với item có nhiều tags

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_092 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Item có tag: breakfast + lunch |
| **Các bước thực hiện** | 1. Filter tag = breakfast |
| **Kết quả mong đợi** | Item hiển thị (vì có tag breakfast) |
| **Kết quả test thực tế** | — |

### TC_FS_093: maxCalories filter toggle (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_093 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | maxCalories toggle trong filter |
| **Các bước thực hiện** | 1. Bật maxCalories toggle<br>2. Set threshold 300<br>3. Áp dụng |
| **Kết quả mong đợi** | Chỉ items có calories ≤ 300 |
| **Kết quả test thực tế** | — |

### TC_FS_094: minProtein filter toggle (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_094 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | minProtein toggle trong filter |
| **Các bước thực hiện** | 1. Bật minProtein toggle<br>2. Set threshold 20g<br>3. Áp dụng |
| **Kết quả mong đợi** | Chỉ items có protein ≥ 20g |
| **Kết quả test thực tế** | — |

### TC_FS_095: Combined: tag + maxCalories + sort

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_095 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 3 filters active |
| **Các bước thực hiện** | 1. Set tag=lunch, maxCal=500, sort=name-asc<br>2. Áp dụng |
| **Kết quả mong đợi** | Items: tag lunch, cal≤500, sorted A-Z |
| **Kết quả test thực tế** | — |

### TC_FS_096: Reset clears all filters

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_096 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Multiple filters active |
| **Các bước thực hiện** | 1. Nhấn 'Đặt lại' |
| **Kết quả mong đợi** | Tất cả filters cleared, sort = default, view = default |
| **Kết quả test thực tế** | — |

### TC_FS_097: Filter badge count trên button

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_097 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 2 filters active |
| **Các bước thực hiện** | 1. Kiểm tra filter button |
| **Kết quả mong đợi** | Badge '2' hiển thị trên nút filter |
| **Kết quả test thực tế** | — |

### TC_FS_098: Filter badge update khi add/remove filter

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_098 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Thêm/bỏ filters |
| **Các bước thực hiện** | 1. Áp dụng filter |
| **Kết quả mong đợi** | Badge count cập nhật đúng |
| **Kết quả test thực tế** | — |

### TC_FS_099: Filter items count sau filter

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_099 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | 50 items, filter → 10 match |
| **Các bước thực hiện** | 1. Áp dụng filter |
| **Kết quả mong đợi** | Hiển thị 10 items, count = 10 |
| **Kết quả test thực tế** | — |

### TC_FS_100: Filter sheet dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_100 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở filter sheet |
| **Kết quả mong đợi** | Sheet hiển thị đúng dark mode |
| **Kết quả test thực tế** | — |

### TC_FS_101: Filter sheet responsive mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_101 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Mở filter |
| **Kết quả mong đợi** | Bottom sheet slide up, full-width |
| **Kết quả test thực tế** | — |

### TC_FS_102: Filter sheet responsive desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_102 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Mở filter |
| **Kết quả mong đợi** | Popup/sidebar filter, max-width constraint |
| **Kết quả test thực tế** | — |

### TC_FS_103: Filter sheet close khi apply

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_103 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Filter sheet mở, nhấn Apply |
| **Các bước thực hiện** | 1. Nhấn Áp dụng |
| **Kết quả mong đợi** | Sheet đóng, filters apply |
| **Kết quả test thực tế** | — |

### TC_FS_104: Filter animation open/close

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_104 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Click filter button |
| **Các bước thực hiện** | 1. Mở và đóng filter sheet |
| **Kết quả mong đợi** | Animation smooth cả 2 chiều |
| **Kết quả test thực tế** | — |

### TC_FS_105: Filter keyboard accessible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_105 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Desktop, filter mở |
| **Các bước thực hiện** | 1. Tab qua options |
| **Kết quả mong đợi** | Keyboard navigation hoạt động |
| **Kết quả test thực tế** | — |

### Nhóm 5: Search + Filter + Sort Combined (Kết hợp tìm kiếm, lọc, sắp xếp) (TC_FS_106 – TC_FS_135)

### TC_FS_106: Search text filter basic

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_106 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | ≥5 items, search bar visible |
| **Các bước thực hiện** | 1. Nhập 'thịt' trong search bar |
| **Kết quả mong đợi** | Chỉ items có 'thịt' trong tên hiển thị |
| **Kết quả test thực tế** | — |

### TC_FS_107: Search tiếng Việt có dấu

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_107 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Items: Bún bò Huế, Phở bò |
| **Các bước thực hiện** | 1. Search 'bò' |
| **Kết quả mong đợi** | Cả 2 items hiển thị (match 'bò') |
| **Kết quả test thực tế** | — |

### TC_FS_108: Search case-insensitive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_108 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Item: 'Thịt Bò' |
| **Các bước thực hiện** | 1. Search 'thịt bò' (lowercase) |
| **Kết quả mong đợi** | Match tìm thấy (case-insensitive) |
| **Kết quả test thực tế** | — |

### TC_FS_109: Search partial match

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_109 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Item: 'Cá hồi nướng' |
| **Các bước thực hiện** | 1. Search 'hồi' |
| **Kết quả mong đợi** | Item match vì chứa 'hồi' |
| **Kết quả test thực tế** | — |

### TC_FS_110: Search + tag filter combined

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_110 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Tag = lunch, search = 'cơm' |
| **Các bước thực hiện** | 1. Set filter tag lunch<br>2. Nhập 'cơm' |
| **Kết quả mong đợi** | Items: tag lunch AND name contains 'cơm' |
| **Kết quả test thực tế** | — |

### TC_FS_111: Search + sort combined

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_111 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Search = 'thịt', sort = cal-desc |
| **Các bước thực hiện** | 1. Nhập search + set sort |
| **Kết quả mong đợi** | Items match 'thịt' sorted by calories desc |
| **Kết quả test thực tế** | — |

### TC_FS_112: Search + tag + sort (triple combined)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_112 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | 3 criteria active |
| **Các bước thực hiện** | 1. Set search + tag + sort |
| **Kết quả mong đợi** | Results match ALL criteria |
| **Kết quả test thực tế** | — |

### TC_FS_113: Clear search

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_113 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Search active |
| **Các bước thực hiện** | 1. Xóa text search (clear button hoặc backspace) |
| **Kết quả mong đợi** | Tất cả items hiển thị lại (filtered by other active filters) |
| **Kết quả test thực tế** | — |

### TC_FS_114: Clear all filters button

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_114 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Multiple filters active |
| **Các bước thực hiện** | 1. Click 'Xóa bộ lọc' hoặc 'Đặt lại' |
| **Kết quả mong đợi** | ALL filters + search + sort reset |
| **Kết quả test thực tế** | — |

### TC_FS_115: Combined filter summary display

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_115 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Tag + search + sort active |
| **Các bước thực hiện** | 1. Kiểm tra toolbar |
| **Kết quả mong đợi** | Summary text: 'Sáng, Cal ↓, "thịt"' hoặc chips |
| **Kết quả test thực tế** | — |

### TC_FS_116: Combined filter badge count

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_116 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 3 filters active |
| **Các bước thực hiện** | 1. Kiểm tra badge |
| **Kết quả mong đợi** | Badge hiển thị '3' |
| **Kết quả test thực tế** | — |

### TC_FS_117: Clear individual filter từ chip

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_117 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Multiple filter chips visible |
| **Các bước thực hiện** | 1. Click X trên 1 filter chip |
| **Kết quả mong đợi** | Chỉ filter đó bị xóa, others remain |
| **Kết quả test thực tế** | — |

### TC_FS_118: Combined filters: 0 results

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_118 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Search + tag không match gì |
| **Các bước thực hiện** | 1. Set restrictive filters |
| **Kết quả mong đợi** | Empty state 'Không tìm thấy kết quả' + nút xóa bộ lọc |
| **Kết quả test thực tế** | — |

### TC_FS_119: Combined filters: 1 result

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_119 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Filters match 1 item duy nhất |
| **Các bước thực hiện** | 1. Apply filters |
| **Kết quả mong đợi** | 1 item hiển thị, count = 1 |
| **Kết quả test thực tế** | — |

### TC_FS_120: Combined filters: 100 results

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_120 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Loose filters match 100 items |
| **Các bước thực hiện** | 1. Apply filters |
| **Kết quả mong đợi** | 100 items hiển thị, performance OK |
| **Kết quả test thực tế** | — |

### TC_FS_121: Search debounce (không search mỗi keystroke)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_121 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Search bar active |
| **Các bước thực hiện** | 1. Nhập 'thịt bò' nhanh |
| **Kết quả mong đợi** | Search trigger sau debounce ~300ms, không mỗi ký tự |
| **Kết quả test thực tế** | — |

### TC_FS_122: Search empty string = show all

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_122 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Search bar rỗng |
| **Các bước thực hiện** | 1. Kiểm tra list |
| **Kết quả mong đợi** | Tất cả items hiển thị |
| **Kết quả test thực tế** | — |

### TC_FS_123: Search highlight match text (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_123 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Search 'phở' match items |
| **Các bước thực hiện** | 1. Kiểm tra items |
| **Kết quả mong đợi** | 'phở' được highlight trong tên item |
| **Kết quả test thực tế** | — |

### TC_FS_124: Search không match → empty state message

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_124 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Search 'xyz123' |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | 'Không tìm thấy "xyz123"' message |
| **Kết quả test thực tế** | — |

### TC_FS_125: Search reset khi chuyển sub-tab

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_125 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Search active trên Ingredients |
| **Các bước thực hiện** | 1. Chuyển sang Dishes |
| **Kết quả mong đợi** | Search clear hoặc independent per tab |
| **Kết quả test thực tế** | — |

### TC_FS_126: Search with Vietnamese combining chars

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_126 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Search 'ơ' (standalone Vietnamese char) |
| **Các bước thực hiện** | 1. Nhập 'ơ' |
| **Kết quả mong đợi** | Match items có chữ 'ơ' (ví dụ 'bơ') |
| **Kết quả test thực tế** | — |

### TC_FS_127: Search icon và clear button

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_127 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Search bar |
| **Các bước thực hiện** | 1. Kiểm tra UI |
| **Kết quả mong đợi** | Icon 🔍 bên trái, nút X clear bên phải khi có text |
| **Kết quả test thực tế** | — |

### TC_FS_128: Search bar focus state

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_128 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Click search bar |
| **Các bước thực hiện** | 1. Kiểm tra focus |
| **Kết quả mong đợi** | Search bar có focus ring, keyboard mở (mobile) |
| **Kết quả test thực tế** | — |

### TC_FS_129: Search accessibility: aria-label

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_129 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Screen reader |
| **Các bước thực hiện** | 1. Kiểm tra search bar |
| **Kết quả mong đợi** | aria-label = 'Tìm kiếm nguyên liệu' hoặc tương tự |
| **Kết quả test thực tế** | — |

### TC_FS_130: Search + filter badge combined count

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_130 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Search + 1 tag filter |
| **Các bước thực hiện** | 1. Kiểm tra badge |
| **Kết quả mong đợi** | Badge = 2 (1 search + 1 tag) |
| **Kết quả test thực tế** | — |

### TC_FS_131: Filter summary text truncation

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_131 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Nhiều filters active, toolbar nhỏ |
| **Các bước thực hiện** | 1. Kiểm tra summary |
| **Kết quả mong đợi** | Text truncated nếu quá dài |
| **Kết quả test thực tế** | — |

### TC_FS_132: Search bar dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_132 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra search bar |
| **Kết quả mong đợi** | Search bar hiển thị đúng dark mode |
| **Kết quả test thực tế** | — |

### TC_FS_133: Search bar responsive mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_133 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Kiểm tra search bar |
| **Kết quả mong đợi** | Full-width, font ≥16px |
| **Kết quả test thực tế** | — |

### TC_FS_134: Search bar responsive desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_134 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Kiểm tra search bar |
| **Kết quả mong đợi** | Max-width constraint, inline layout |
| **Kết quả test thực tế** | — |

### TC_FS_135: Search persist khi scroll list

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_135 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Search active, scroll list |
| **Các bước thực hiện** | 1. Scroll xuống<br>2. Scroll lên |
| **Kết quả mong đợi** | Search text và results giữ nguyên |
| **Kết quả test thực tế** | — |

### Nhóm 6: View Switcher (Chuyển đổi hiển thị) (TC_FS_136 – TC_FS_160)

### TC_FS_136: View switcher: grid view mặc định

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_136 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Mở tab Quản lý lần đầu |
| **Các bước thực hiện** | 1. Kiểm tra layout |
| **Kết quả mong đợi** | Grid view (cards) là mặc định |
| **Kết quả test thực tế** | — |

### TC_FS_137: Switch sang list view

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_137 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Grid view active |
| **Các bước thực hiện** | 1. Click nút list view trong toolbar |
| **Kết quả mong đợi** | Chuyển sang list view (rows) |
| **Kết quả test thực tế** | — |

### TC_FS_138: Switch lại grid view

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_138 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | List view active |
| **Các bước thực hiện** | 1. Click nút grid view |
| **Kết quả mong đợi** | Chuyển lại grid view (cards) |
| **Kết quả test thực tế** | — |

### TC_FS_139: View toggle button/icon hiển thị

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_139 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | ListToolbar visible |
| **Các bước thực hiện** | 1. Kiểm tra toolbar |
| **Kết quả mong đợi** | 2 icons: grid (≡≡) và list (☰) với active indicator |
| **Kết quả test thực tế** | — |

### TC_FS_140: Grid view: card layout với image

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_140 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Grid view, items có ảnh |
| **Các bước thực hiện** | 1. Kiểm tra cards |
| **Kết quả mong đợi** | Cards hiển thị ảnh thumbnail, tên, calories |
| **Kết quả test thực tế** | — |

### TC_FS_141: List view: row layout compact

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_141 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | List view |
| **Các bước thực hiện** | 1. Kiểm tra rows |
| **Kết quả mong đợi** | Rows compact: tên + calories + protein inline |
| **Kết quả test thực tế** | — |

### TC_FS_142: View persistence on reload

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_142 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Chọn list view |
| **Các bước thực hiện** | 1. Reload page |
| **Kết quả mong đợi** | List view vẫn active sau reload |
| **Kết quả test thực tế** | — |

### TC_FS_143: View persistence on tab switch

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_143 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | List view active |
| **Các bước thực hiện** | 1. Chuyển tab khác<br>2. Quay lại |
| **Kết quả mong đợi** | List view vẫn active |
| **Kết quả test thực tế** | — |

### TC_FS_144: Grid 1 column mobile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_144 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px, grid view |
| **Các bước thực hiện** | 1. Kiểm tra columns |
| **Kết quả mong đợi** | 1 column cards |
| **Kết quả test thực tế** | — |

### TC_FS_145: Grid 2 columns tablet

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_145 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 768px, grid view |
| **Các bước thực hiện** | 1. Kiểm tra columns |
| **Kết quả mong đợi** | 2 columns cards |
| **Kết quả test thực tế** | — |

### TC_FS_146: Grid 3 columns desktop

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_146 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 1440px, grid view |
| **Các bước thực hiện** | 1. Kiểm tra columns |
| **Kết quả mong đợi** | 3 hoặc 4 columns |
| **Kết quả test thực tế** | — |

### TC_FS_147: List view full-width rows

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_147 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | List view, mọi viewport |
| **Các bước thực hiện** | 1. Kiểm tra rows |
| **Kết quả mong đợi** | Rows full-width |
| **Kết quả test thực tế** | — |

### TC_FS_148: View transition animation

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_148 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Switch grid↔list |
| **Các bước thực hiện** | 1. Click toggle |
| **Kết quả mong đợi** | Transition smooth, không flash |
| **Kết quả test thực tế** | — |

### TC_FS_149: View switch preserve scroll position

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_149 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Scrolled xuống, switch view |
| **Các bước thực hiện** | 1. Switch grid→list |
| **Kết quả mong đợi** | Scroll position preserved hoặc scroll to top |
| **Kết quả test thực tế** | — |

### TC_FS_150: View switch preserve filter/sort state

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_150 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Filter + sort active, switch view |
| **Các bước thực hiện** | 1. Switch grid→list |
| **Kết quả mong đợi** | Filters và sort giữ nguyên |
| **Kết quả test thực tế** | — |

### TC_FS_151: View switcher dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_151 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra switcher icons |
| **Kết quả mong đợi** | Icons visible trong dark mode |
| **Kết quả test thực tế** | — |

### TC_FS_152: View switcher responsive

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_152 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra switcher |
| **Kết quả mong đợi** | Switcher hiển thị đúng mọi viewport |
| **Kết quả test thực tế** | — |

### TC_FS_153: View state lưu trong localStorage

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_153 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Chọn list view |
| **Các bước thực hiện** | 1. Kiểm tra localStorage |
| **Kết quả mong đợi** | viewLayout = 'list' được lưu |
| **Kết quả test thực tế** | — |

### TC_FS_154: onLayoutChange callback triggered

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_154 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Switch view |
| **Các bước thực hiện** | 1. Kiểm tra callback |
| **Kết quả mong đợi** | onLayoutChange('list') hoặc onLayoutChange('grid') được gọi |
| **Kết quả test thực tế** | — |

### TC_FS_155: Grid view empty state

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_155 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 0 items, grid view |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Empty state centered trong grid area |
| **Kết quả test thực tế** | — |

### TC_FS_156: List view empty state

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_156 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 0 items, list view |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Empty state centered trong list area |
| **Kết quả test thực tế** | — |

### TC_FS_157: Grid view 1 item

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_157 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 1 item, grid view |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | 1 card hiển thị đúng |
| **Kết quả test thực tế** | — |

### TC_FS_158: List view 1 item

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_158 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 1 item, list view |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | 1 row hiển thị đúng |
| **Kết quả test thực tế** | — |

### TC_FS_159: Grid view 50 items performance

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_159 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 50 items, grid view |
| **Các bước thực hiện** | 1. Scroll qua items |
| **Kết quả mong đợi** | Render smooth, < 100ms |
| **Kết quả test thực tế** | — |

### TC_FS_160: List view 100 items performance

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_160 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 100 items, list view |
| **Các bước thực hiện** | 1. Scroll qua items |
| **Kết quả mong đợi** | Render smooth |
| **Kết quả test thực tế** | — |

### Nhóm 7: Grid View Details (Chi tiết Grid view) (TC_FS_161 – TC_FS_180)

### TC_FS_161: Card hiển thị tên dish

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_161 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Grid view, có dishes |
| **Các bước thực hiện** | 1. Kiểm tra card |
| **Kết quả mong đợi** | Tên dish hiển thị prominently |
| **Kết quả test thực tế** | — |

### TC_FS_162: Card hiển thị calories

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_162 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Grid view |
| **Các bước thực hiện** | 1. Kiểm tra card |
| **Kết quả mong đợi** | Calories hiển thị (ví dụ '500 kcal') |
| **Kết quả test thực tế** | — |

### TC_FS_163: Card hiển thị image (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_163 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish có ảnh |
| **Các bước thực hiện** | 1. Kiểm tra card |
| **Kết quả mong đợi** | Ảnh thumbnail hiển thị |
| **Kết quả test thực tế** | — |

### TC_FS_164: Card hiển thị tags

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_164 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish có tags |
| **Các bước thực hiện** | 1. Kiểm tra card |
| **Kết quả mong đợi** | Tag chips hiển thị dưới tên |
| **Kết quả test thực tế** | — |

### TC_FS_165: Card click → navigate to detail

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_165 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Grid view |
| **Các bước thực hiện** | 1. Click vào card |
| **Kết quả mong đợi** | Navigate đến dish detail page/modal |
| **Kết quả test thực tế** | — |

### TC_FS_166: Card layout spacing đều

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_166 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Multiple cards |
| **Các bước thực hiện** | 1. Kiểm tra spacing |
| **Kết quả mong đợi** | Cards có gap đều giữa các cards |
| **Kết quả test thực tế** | — |

### TC_FS_167: Card min/max width

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_167 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport thay đổi |
| **Các bước thực hiện** | 1. Kiểm tra card width |
| **Kết quả mong đợi** | Cards có min-width và max-width constraint |
| **Kết quả test thực tế** | — |

### TC_FS_168: Card hover effect (desktop)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_168 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Hover chuột lên card |
| **Kết quả mong đợi** | Shadow hoặc elevation tăng khi hover |
| **Kết quả test thực tế** | — |

### TC_FS_169: Card tap feedback (mobile)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_169 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Tap card |
| **Kết quả mong đợi** | Opacity change hoặc scale feedback |
| **Kết quả test thực tế** | — |

### TC_FS_170: Card long name truncation

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_170 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish tên rất dài |
| **Các bước thực hiện** | 1. Kiểm tra card |
| **Kết quả mong đợi** | Tên truncated với ... sau 1-2 dòng |
| **Kết quả test thực tế** | — |

### TC_FS_171: Card no image placeholder

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_171 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish không có ảnh |
| **Các bước thực hiện** | 1. Kiểm tra card |
| **Kết quả mong đợi** | Placeholder icon hoặc color background |
| **Kết quả test thực tế** | — |

### TC_FS_172: Card nutrition info compact

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_172 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Card có nutrition |
| **Các bước thực hiện** | 1. Kiểm tra layout |
| **Kết quả mong đợi** | Calories + protein hiển thị compact |
| **Kết quả test thực tế** | — |

### TC_FS_173: Card action buttons

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_173 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Card với actions |
| **Các bước thực hiện** | 1. Kiểm tra card |
| **Kết quả mong đợi** | Edit/delete buttons hoặc overflow menu |
| **Kết quả test thực tế** | — |

### TC_FS_174: Card dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_174 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, grid view |
| **Các bước thực hiện** | 1. Kiểm tra cards |
| **Kết quả mong đợi** | Cards dark background, text light |
| **Kết quả test thực tế** | — |

### TC_FS_175: Card border visible

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_175 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Cards hiển thị |
| **Các bước thực hiện** | 1. Kiểm tra border |
| **Kết quả mong đợi** | Cards có border hoặc shadow để phân biệt |
| **Kết quả test thực tế** | — |

### TC_FS_176: Card grid alignment last row

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_176 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 7 items, 3 columns = 2 full + 1 item |
| **Các bước thực hiện** | 1. Kiểm tra last row |
| **Kết quả mong đợi** | Item cuối left-aligned, không stretch |
| **Kết quả test thực tế** | — |

### TC_FS_177: Card image aspect ratio

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_177 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Cards có ảnh |
| **Các bước thực hiện** | 1. Kiểm tra ratio |
| **Kết quả mong đợi** | Ảnh consistent aspect ratio (16:9 hoặc 4:3) |
| **Kết quả test thực tế** | — |

### TC_FS_178: Card loading skeleton

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_178 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Items đang load |
| **Các bước thực hiện** | 1. Kiểm tra skeleton |
| **Kết quả mong đợi** | Skeleton cards hiển thị đúng grid layout |
| **Kết quả test thực tế** | — |

### TC_FS_179: Card animation khi filter change

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_179 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Filter change, cards update |
| **Các bước thực hiện** | 1. Apply filter |
| **Kết quả mong đợi** | Cards animate in/out smooth |
| **Kết quả test thực tế** | — |

### TC_FS_180: Card count match filter results

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_180 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Filter active, 5 results |
| **Các bước thực hiện** | 1. Đếm cards |
| **Kết quả mong đợi** | Đúng 5 cards hiển thị |
| **Kết quả test thực tế** | — |

### Nhóm 8: List View Details (Chi tiết List view) (TC_FS_181 – TC_FS_200)

### TC_FS_181: Row hiển thị tên dish

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_181 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | List view |
| **Các bước thực hiện** | 1. Kiểm tra row |
| **Kết quả mong đợi** | Tên dish hiển thị |
| **Kết quả test thực tế** | — |

### TC_FS_182: Row hiển thị calories

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_182 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | List view |
| **Các bước thực hiện** | 1. Kiểm tra row |
| **Kết quả mong đợi** | Calories hiển thị bên phải hoặc inline |
| **Kết quả test thực tế** | — |

### TC_FS_183: Row hiển thị protein

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_183 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | List view |
| **Các bước thực hiện** | 1. Kiểm tra row |
| **Kết quả mong đợi** | Protein hiển thị |
| **Kết quả test thực tế** | — |

### TC_FS_184: Row hiển thị tags

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_184 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | List view, dish có tags |
| **Các bước thực hiện** | 1. Kiểm tra row |
| **Kết quả mong đợi** | Tags hiển thị dạng chips nhỏ |
| **Kết quả test thực tế** | — |

### TC_FS_185: Row click → navigate to detail

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_185 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | List view |
| **Các bước thực hiện** | 1. Click row |
| **Kết quả mong đợi** | Navigate đến detail |
| **Kết quả test thực tế** | — |

### TC_FS_186: Row action buttons

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_186 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | List view |
| **Các bước thực hiện** | 1. Kiểm tra row actions |
| **Kết quả mong đợi** | Edit/delete buttons hoặc swipe actions |
| **Kết quả test thực tế** | — |

### TC_FS_187: Row alternate colors (zebra striping)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_187 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | List view, nhiều rows |
| **Các bước thực hiện** | 1. Kiểm tra màu nền |
| **Kết quả mong đợi** | Rows xen kẽ màu (nếu có) cho readability |
| **Kết quả test thực tế** | — |

### TC_FS_188: Row hover (desktop)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_188 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px, list view |
| **Các bước thực hiện** | 1. Hover row |
| **Kết quả mong đợi** | Row highlight khi hover |
| **Kết quả test thực tế** | — |

### TC_FS_189: Row long name handling

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_189 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dish tên dài |
| **Các bước thực hiện** | 1. Kiểm tra row |
| **Kết quả mong đợi** | Tên truncated hoặc wrap phù hợp |
| **Kết quả test thực tế** | — |

### TC_FS_190: Row compact info display

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_190 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | List view |
| **Các bước thực hiện** | 1. Kiểm tra info density |
| **Kết quả mong đợi** | Thông tin compact: tên, cal, pro trong 1 dòng |
| **Kết quả test thực tế** | — |

### TC_FS_191: Row dark mode

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_191 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode, list view |
| **Các bước thực hiện** | 1. Kiểm tra rows |
| **Kết quả mong đợi** | Rows hiển thị đúng dark mode |
| **Kết quả test thực tế** | — |

### TC_FS_192: Row separator lines

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_192 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | List view |
| **Các bước thực hiện** | 1. Kiểm tra giữa rows |
| **Kết quả mong đợi** | Separator line hoặc gap giữa rows |
| **Kết quả test thực tế** | — |

### TC_FS_193: Row loading skeleton

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_193 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Items đang load, list view |
| **Các bước thực hiện** | 1. Kiểm tra skeleton |
| **Kết quả mong đợi** | Skeleton rows hiển thị |
| **Kết quả test thực tế** | — |

### TC_FS_194: Row 0 items

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_194 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | 0 items, list view |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Empty state hiển thị |
| **Kết quả test thực tế** | — |

### TC_FS_195: Row 1 item

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_195 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 1 item, list view |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | 1 row hiển thị đúng |
| **Kết quả test thực tế** | — |

### TC_FS_196: Row 50 items

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_196 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 50 items, list view |
| **Các bước thực hiện** | 1. Scroll |
| **Kết quả mong đợi** | 50 rows, scroll smooth |
| **Kết quả test thực tế** | — |

### TC_FS_197: Row 100 items performance

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_197 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 100 items |
| **Các bước thực hiện** | 1. Scroll nhanh |
| **Kết quả mong đợi** | Render < 100ms, scroll smooth |
| **Kết quả test thực tế** | — |

### TC_FS_198: Row image thumbnail (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_198 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | List view, items có ảnh |
| **Các bước thực hiện** | 1. Kiểm tra |
| **Kết quả mong đợi** | Small thumbnail bên trái row |
| **Kết quả test thực tế** | — |

### TC_FS_199: Row swipe actions mobile (nếu có)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_199 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Swipe trái trên row |
| **Kết quả mong đợi** | Reveal edit/delete buttons |
| **Kết quả test thực tế** | — |

### TC_FS_200: Row count match filter results

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_200 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Filter active, 8 results, list view |
| **Các bước thực hiện** | 1. Đếm rows |
| **Kết quả mong đợi** | 8 rows hiển thị |
| **Kết quả test thực tế** | — |

### Nhóm 9: Dark Mode, Responsive, Accessibility (TC_FS_201 – TC_FS_210)

### TC_FS_201: Dark mode: filter bottom sheet

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_201 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Mở filter sheet |
| **Kết quả mong đợi** | Sheet dark background, text light |
| **Kết quả test thực tế** | — |

### TC_FS_202: Dark mode: sort icons/indicators

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_202 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra sort UI |
| **Kết quả mong đợi** | Icons visible trong dark mode |
| **Kết quả test thực tế** | — |

### TC_FS_203: Dark mode: view switcher buttons

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_203 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Dark mode bật |
| **Các bước thực hiện** | 1. Kiểm tra view switcher |
| **Kết quả mong đợi** | Buttons và active indicator visible |
| **Kết quả test thực tế** | — |

### TC_FS_204: Mobile: filter as bottom sheet

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_204 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Viewport 375px |
| **Các bước thực hiện** | 1. Mở filter |
| **Kết quả mong đợi** | Filter hiển thị bottom sheet |
| **Kết quả test thực tế** | — |

### TC_FS_205: Desktop: filter as popup/sidebar

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_205 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Viewport 1440px |
| **Các bước thực hiện** | 1. Mở filter |
| **Kết quả mong đợi** | Filter hiển thị popup hoặc sidebar |
| **Kết quả test thực tế** | — |

### TC_FS_206: Screen reader: filter labels

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_206 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Screen reader bật |
| **Các bước thực hiện** | 1. Mở filter |
| **Kết quả mong đợi** | Sort options, tags có aria-labels đúng |
| **Kết quả test thực tế** | — |

### TC_FS_207: Keyboard: navigate filter options

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_207 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Desktop, filter mở |
| **Các bước thực hiện** | 1. Tab qua options |
| **Kết quả mong đợi** | Keyboard navigation hoạt động, Enter chọn |
| **Kết quả test thực tế** | — |

### TC_FS_208: Performance: sort 500 items < 100ms

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_208 |
| **Loại** | Boundary |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | 500 items |
| **Các bước thực hiện** | 1. Sort cal-desc<br>2. Đo thời gian |
| **Kết quả mong đợi** | Sort < 100ms |
| **Kết quả test thực tế** | — |

### TC_FS_209: FilterBottomSheet animation smooth

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_209 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Mobile |
| **Các bước thực hiện** | 1. Mở/đóng filter |
| **Kết quả mong đợi** | Animation slide up/down smooth |
| **Kết quả test thực tế** | — |

### TC_FS_210: Result count aria-live announcement

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_FS_210 |
| **Loại** | Positive |
| **Độ ưu tiên** | P3 |
| **Tiền điều kiện** | Filter applied |
| **Các bước thực hiện** | 1. Screen reader lắng nghe |
| **Kết quả mong đợi** | '5 kết quả' announced bởi screen reader |
| **Kết quả test thực tế** | — |

---

## Đề xuất Cải tiến

### Đề xuất 1: Advanced Filters (Calories Range Slider)
- **Vấn đề hiện tại**: Only toggle-based nutrition filters. No range selection.
- **Giải pháp đề xuất**: Range slider for calories (0-2000), protein (0-100g). Visual preview.
- **Phần trăm cải thiện**: Filter precision +60%, User satisfaction +40%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 2: Saved Filter Presets
- **Vấn đề hiện tại**: Must re-create filters each time.
- **Giải pháp đề xuất**: Save filter combinations as presets. Quick apply from toolbar.
- **Phần trăm cải thiện**: Filter setup time -70%, Reusability +50%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 3: Smart Sort by Usage Frequency
- **Vấn đề hiện tại**: Only name and nutrition sort. No usage-based sort.
- **Giải pháp đề xuất**: Sort by "most used this week", "recently added", "favorites".
- **Phần trăm cải thiện**: Discoverability +40%, Meal planning speed +30%
- **Mức độ ưu tiên**: Medium | **Effort**: S

### Đề xuất 4: Infinite Scroll with Virtualization
- **Vấn đề hiện tại**: All items rendered. Performance degrades with many items.
- **Giải pháp đề xuất**: Virtual scroll: only render visible items. Support 10,000+ items.
- **Phần trăm cải thiện**: Performance +80%, Memory usage -60%
- **Mức độ ưu tiên**: Low | **Effort**: M

### Đề xuất 5: Multi-Select Batch Actions
- **Vấn đề hiện tại**: Can only act on one item at a time.
- **Giải pháp đề xuất**: Checkbox select multiple → batch delete, tag, export.
- **Phần trăm cải thiện**: Batch operation speed +80%, Productivity +50%
- **Mức độ ưu tiên**: Medium | **Effort**: M

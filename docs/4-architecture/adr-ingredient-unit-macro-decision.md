# ADR — Ingredient Unit & Macro Canonical Decision

**Status:** Proposed — decisions aligned with discuss outcomes
**Date:** 2026-04-25
**Owner:** Product/Data Architecture Review
**Context:** Xem xét Phương án C cho hệ unit nguyên liệu và tác động đến macro dinh dưỡng `/100g` / `/100ml`.

---

## 1. Quyết định được đề xuất

Chọn hướng triển khai:

**Phương án C + density tùy chọn**

Nghĩa là:
- Áp dụng **Phương án C** cho layer unit:
  - thêm `unit`
  - thêm `ingredient_unit`
  - đổi `dish_ingredient.amount_unit` → `unit_id`
- **Giữ nguyên nguyên lý macro canonical hiện tại**:
  - mỗi ingredient chỉ có **1 nutrition basis authoritative**
  - basis chỉ là `g` hoặc `ml`
  - `nutrition_basis_quantity` vẫn là `100`
- Thêm **`density_g_per_ml` là optional field**, chỉ dùng làm cầu nối giữa khối lượng và thể tích khi cần và khi đáng tin.

---

## 2. Vì sao chọn hướng này

### 2.1 Phù hợp với engine macro hiện tại

Hiện tại project đang tính total dish theo công thức:

`nutrient_total = nutrient_per_basis × normalized_amount / nutrition_basis_quantity`

Điều này đang đúng và nên giữ nguyên.

Ý nghĩa:
- Unit system thay đổi
- Nhưng macro engine không cần đổi bản chất
- Chỉ cần đảm bảo `normalized_amount` luôn đúng dimension với `nutrition_basis_unit`

### 2.2 Đúng với domain thực tế

App cần hỗ trợ:
- `g`, `kg`
- `ml`, `l`
- `tbsp`, `tsp`, `cup`
- `quả`, `tép`, `củ`, `bó`, `lát`, `nhúm`

Các unit này là unit nhập liệu / hiển thị, không nên trở thành nutrition source of truth.

### 2.3 Cân bằng tốt giữa độ đúng và độ phức tạp

Nếu chỉ dùng C thuần (không density):
- an toàn
- nhưng reject nhiều case cross-dimension

Nếu dùng model quá linh hoạt (dual basis, per-unit nutrient snapshot):
- quá phức tạp
- dễ sinh nhiều source of truth

C + density tùy chọn là điểm cân bằng hợp lý nhất.

---

## 3. Nguyên tắc bắt buộc

### RULE-ARCH-01: Mỗi ingredient chỉ có 1 nutrition basis authoritative

Mỗi ingredient chỉ được có một trong hai:
- `/100g`
- `/100ml`

Không được lưu song song cả hai profile canonical như source of truth trong Phase 1.

### RULE-ARCH-02: Unit chỉ dùng để convert về basis

`unit` và `ingredient_unit` chỉ phục vụ:
- nhập liệu
- hiển thị
- conversion

Chúng **không** phải là nơi lưu dinh dưỡng authoritative.

### RULE-ARCH-03: `normalized_amount` là input duy nhất cho macro engine

Sau khi resolve unit, hệ thống phải tính ra:
- `normalized_amount`

Và chỉ dùng giá trị này để tính:
- calories
- protein
- carbs
- fat
- fiber
- sugar/sodium nếu mở rộng sau này

### RULE-ARCH-04: Không cross-convert g ↔ ml nếu không có bridge rõ ràng

Nếu unit input khác dimension với basis:
- ưu tiên `ingredient_unit.factor_to_basis`
- nếu không có, dùng `density_g_per_ml` (nếu đáng tin)
- nếu vẫn không có → reject

Không được silent convert.

### RULE-ARCH-05: Không duplicate nutrition per unit

Không lưu calories/protein/carbs/fat/fiber tại `ingredient_unit` như source chính.

Nếu cần hiển thị “1 tbsp = 90 kcal” thì đó phải là computed value, không phải authoritative stored value.

---

## 4. Schema nên sửa

### 4.1 Giữ lại trên `ingredient`

Giữ:
- `id`
- `name`
- `category`
- `nutrition_basis_unit`
- `nutrition_basis_quantity`
- `calories`
- `protein`
- `carbs`
- `fat`
- `fiber`
- `source`
- `created_at`
- `updated_at`

Thêm:
- `density_g_per_ml REAL NULL`

Ý nghĩa:
- null = không có density / không đủ tin cậy
- có giá trị = có thể dùng làm bridge volume ↔ mass khi cần

### 4.2 Bỏ khỏi `ingredient`

Bỏ:
- `default_entry_unit`
- `grams_per_unit`
- `ml_per_unit`

Lý do:
- các field này không scale được cho multi-unit
- responsibility sẽ chuyển sang `ingredient_unit`

### 4.3 Thêm table `unit`

Mục đích:
- registry toàn cục cho unit hệ thống biết tới

Nhóm unit:
- mass: `g`, `kg`
- volume: `ml`, `l`, `tbsp`, `tsp`, `cup`
- count/cooking: `piece`, `clove`, `slice`, `bunch`, `pinch`

### 4.4 Thêm table `ingredient_unit`

Mục đích:
- khai báo ingredient nào dùng được unit nào
- factor từ unit đó về basis của ingredient

Field chính:
- `ingredient_id`
- `unit_id`
- `factor_to_basis`
- `is_default`
- `display_label`

### 4.5 Sửa `dish_ingredient`

Đổi:
- `amount_unit` → `unit_id`

Giữ:
- `amount_value`
- `normalized_amount`
- `UNIQUE(dish_id, ingredient_id)` theo quyết định hiện tại của user

---

## 5. Logic resolve unit được chốt

Với input `(ingredient_id, amount_value, unit_id)`:

### Case 1 — Cùng dimension với basis
- basis `g` + unit `g`/`kg` → convert trực tiếp bằng factor global
- basis `ml` + unit `ml`/`l`/`tbsp`/`tsp`/`cup` → convert trực tiếp bằng factor global

### Case 2 — Unit ingredient-specific
Ví dụ:
- `piece`
- `clove`
- `slice`
- `bunch`
- `pinch`

Bắt buộc lookup `ingredient_unit.factor_to_basis`.

### Case 3 — Khác dimension với basis
Ví dụ:
- basis `g`, input `tbsp`
- basis `ml`, input `g`

Thứ tự ưu tiên:
1. `ingredient_unit.factor_to_basis`
2. `density_g_per_ml`
3. reject

---

## 6. Macro /100g và /100ml sẽ vận hành thế nào

### 6.1 Không đổi công thức lõi

Cho mọi nutrient canonical:

`nutrient_total = nutrient_per_100_basis × normalized_amount / 100`

Áp dụng cho:
- calories
- protein
- carbs
- fat
- fiber
- sugar (nếu thêm)
- sodium (nếu thêm)

### 6.2 Điều kiện để công thức đúng

Công thức chỉ đúng khi:
- `normalized_amount` cùng dimension với `nutrition_basis_unit`
- factor conversion đã được resolve đúng
- không có silent conversion sai giữa g và ml

### 6.3 Sugar / sodium về sau

Nếu chỉ mở rộng thêm ít nutrient:
- có thể thêm cột mới vào `ingredient`

Nếu roadmap nutrient mở rộng lớn:
- nên chuyển sang `nutrient_definition` + `ingredient_nutrient`
- nhưng đây **không phải ưu tiên của thay đổi unit Phase 1**

---

## 7. Những gì nên làm ngay

### Làm ngay
1. Chốt `unit` registry tối thiểu cho Phase 1
2. Chốt `ingredient_unit` model
3. Thêm `density_g_per_ml` optional
4. Viết `resolveUnit()` làm single source of truth
5. Viết test matrix cho conversion + macro consistency
6. Thiết kế migration từ schema cũ sang schema mới
7. Giữ VIEW `dish_with_totals` theo nguyên lý hiện tại

### Chưa nên làm ngay
1. Không lưu dual canonical basis (`/100g` và `/100ml`) cho cùng một ingredient
2. Không lưu nutrient snapshot per unit
3. Không redesign toàn bộ nutrition system sang dynamic nutrient tables ngay trong cùng thay đổi này
4. Không tự động cho phép mọi cross-dimension conversion nếu thiếu bridge

---

## 8. Rủi ro chính cần kiểm soát

1. Sai macro vì convert sai giữa volume và mass
2. Dùng density ở nơi không đáng tin
3. Duplicate source of truth nếu nutrition bị lưu ở cả ingredient và ingredient_unit
4. Breaking change DTO/API do `amount_unit` đổi thành `unit_id`
5. UX hiểu nhầm approximate unit là exact

---

## 9. Checklist trước khi release

- [ ] Mỗi ingredient có đúng 1 `nutrition_basis_unit`
- [ ] Mỗi ingredient có ít nhất 1 unit hợp lệ
- [ ] Mỗi ingredient có đúng 1 default unit
- [ ] `factor_to_basis > 0`
- [ ] `normalized_amount` luôn cùng dimension với basis
- [ ] Có rule ưu tiên: curated factor → density → reject
- [ ] Không có silent conversion giữa g và ml
- [ ] Migration giữ nguyên total macro cho dữ liệu cũ
- [ ] VIEW totals cho kết quả giống trước migration với dataset cũ
- [ ] Approximate unit có flag hiển thị rõ
- [ ] Resolver có unit tests đầy đủ

---

## 10. Kết luận ngắn

Chốt đề xuất:

**Triển khai Phương án C, nhưng bổ sung `density_g_per_ml` là optional bridge và giữ chặt canonical nutrition một basis duy nhất cho mỗi ingredient.**

Đây là phương án phù hợp nhất vì:
- giữ được engine macro hiện tại
- hỗ trợ unit thực tế của người dùng
- tránh duplicate nutrition source of truth
- mở rộng được trong tương lai mà không phá kiến trúc hiện có

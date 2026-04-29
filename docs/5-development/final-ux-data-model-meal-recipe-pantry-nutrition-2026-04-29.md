
# Flow UX + Data Model chuẩn cho app quản lý bữa ăn, món ăn, công thức và nguyên liệu hằng ngày

Ngày: 2026-04-29

Mục tiêu tài liệu: tổng hợp pattern UX (User Experience = trải nghiệm người dùng) và data model chuẩn cho một app quản lý:

- Nguyên liệu user đang có hằng ngày.
- Pantry/stock theo số lượng, hạn dùng, vị trí lưu trữ.
- Món ăn/công thức từ nhiều nguyên liệu.
- Bữa ăn và food log thực tế.
- Dinh dưỡng cho nguyên liệu, món ăn, bữa ăn.
- Đơn vị tính và quy đổi theo từng nguyên liệu/sản phẩm/trạng thái.

Tài liệu này là đề xuất target-state, không bị bó vào phase, mockup hoặc logic code hiện tại.

---

## 0. Executive summary

### Kết luận cốt lõi

App nên được thiết kế quanh một lõi chung:

```text
Food Measurement & Nutrition Engine
= hệ thống định danh thực phẩm + trạng thái + đơn vị + quy đổi + dinh dưỡng + snapshot
```

Tất cả flow sau phải dùng chung engine này:

```text
Pantry / Stock
Recipe / Dish
Meal Plan
Food Log
Shopping List
Barcode / Product Import
```

Không nên để từng màn hình tự tính riêng vì sẽ gây drift dữ liệu: cùng một `2 quả cà chua` nhưng Pantry, Recipe và Food Log cho ra gram/kcal khác nhau.

### 10 rule quan trọng nhất

1. Không dùng conversion global cho `piece/quả/trái/củ/tép/cup/serving/pack/bottle`.
2. Chỉ dùng global conversion cho đơn vị vật lý chắc chắn: `kg→g`, `l→ml`, `tbsp→tsp`, `cup→ml` nếu chỉ dùng như volume.
3. Conversion phải gắn với `ingredient/product + variant/state + unit + size option + source/confidence`.
4. Nutrition phải tính trên `normalized edible amount`, không phải raw user input.
5. Phải phân biệt gross weight và edible weight.
6. Phải phân biệt trạng thái: raw/cooked/peeled/chopped/canned/dried/drained/frozen.
7. Mọi usage/history row phải lưu `conversion_snapshot_json` và khi cần lưu `nutrition_snapshot_json`.
8. Missing conversion không phải lỗi chung chung; nó là một UX flow riêng: hỏi một câu cụ thể.
9. User custom conversion không được overwrite dữ liệu verified/imported.
10. Mọi số nutrition derived phải giải thích được: input → conversion → edible amount → nutrition basis → result.

---

## 1. Pattern từ app/web liên quan

### 1.1 Nhóm app/web tham khảo

| Nhóm | Ví dụ | Pattern học được | Confidence |
|---|---|---|---|
| Recipe manager | Paprika, Recipe Keeper, Mela, Crouton, Tandoor, Mealie | Recipe là first-class object: ingredients, instructions, servings, source URL, scaling, grocery export | Medium–High nếu từ official site/docs |
| Meal planning app | Samsung Food, Mealime, SideChef | Meal plan gắn recipe vào ngày/bữa; có missing ingredients/shopping | Medium |
| Pantry / inventory | Grocy, Pantry Check, SuperCook | Pantry là stock/lot, có expiry, location, quantity, barcode/manual add | Medium–High với docs/open-source |
| Grocery list | AnyList/Bring-style pattern, Paprika grocery export | Shopping list nên biết source: manual/recipe/meal plan/low stock | Medium |
| Nutrition tracker | Cronometer, MyFitnessPal-style tracking | Search-first food log, serving size, barcode, per serving/per 100g nutrition, macro preview | Medium |
| Nutrition/product data | USDA FoodData Central, Open Food Facts, Edamam | Data source có serving/portion/nutrients/product/barcode/provenance; nutrition basis không luôn giống unit user nhập | High cho API (Application Programming Interface = giao diện lập trình ứng dụng) docs/data shape |

### 1.2 Source validation nhanh

Kiểm tra URL/status ở mức khả dụng tham khảo:

| Source | Status quan sát | Ghi chú |
|---|---:|---|
| Paprika official site | 200 | Dùng làm evidence recipe manager pattern |
| Samsung Food official site | 200 | Dùng làm evidence meal planning/recipe discovery pattern |
| Open Food Facts data page | 200 | Dùng làm evidence product/barcode/nutrition data |
| Edamam Nutrition API docs | 200 | Dùng làm evidence nutrition analysis data shape |
| Grocy official project | 200 | Dùng làm evidence pantry/inventory model |
| Mealie docs | 200 | Dùng làm evidence open-source recipe manager |
| Tandoor official site | 200 | Dùng làm evidence recipe/meal/shopping ecosystem |
| Cronometer support search | 403 | Không dùng claim chi tiết từ lần fetch này; chỉ dùng pattern nutrition tracker phổ biến ở mức cẩn trọng |
| USDA FoodData Central API guide | timeout ở lần fetch hiện tại | Đã biết là nguồn authoritative, nhưng claim chi tiết cần kiểm tra lại khi implementation |

### 1.3 Pattern tổng hợp

| Pattern | Vì sao tốt | Áp dụng đề xuất |
|---|---|---|
| Search-first, create-if-missing | Giảm duplicate ingredient/product | Mọi flow add nên bắt đầu bằng search ingredient/product/barcode |
| Contextual creation | User tạo ingredient ngay trong recipe/pantry rồi quay lại parent flow | Add ingredient không nên là CRUD (Create, Read, Update, Delete = tạo/đọc/sửa/xóa) tách biệt hoàn toàn |
| Review/preview before save | User thấy quantity resolved và nutrition trước khi lưu | Preview gross/edible/kcal/macro/confidence sau mỗi input quantity/unit |
| Pantry as stock lot | Cùng “sữa” có nhiều chai/hạn/vị trí | `pantry_item` là lot, không phải ingredient master |
| Recipe line snapshot | Recipe không bị thay đổi sai khi conversion master đổi | Save conversion snapshot ở line |
| Food log immutable | Nhật ký ăn uống là lịch sử | Save nutrition snapshot khi log |
| Barcode/product separate from ingredient | Packaged food có brand/serving/net weight riêng | `product` + `barcode` riêng, optional link về generic `ingredient` |
| Missing conversion resolver | Thiếu gram/cup/serving là chuyện thường ngày | Hỏi một câu cụ thể và cho save incomplete nếu user không biết |
| Data confidence badges | User hiểu số nào chắc, số nào ước lượng | Verified / Imported / Estimated / User custom / Incomplete |

---

## 2. Flow UX tổng quan

### 2.1 Information architecture đề xuất

```text
Today
├─ Bữa hôm nay
├─ Nutrition summary
├─ Item cần log / item đã log
└─ Alert: sắp hết, sắp hết hạn, thiếu conversion

Pantry
├─ Expiring soon
├─ Low stock
├─ By location: tủ lạnh / tủ đông / kệ bếp / custom
├─ By category
└─ Conversion issues

Recipes
├─ Recipe list
├─ Recipe detail
├─ Create/edit recipe
└─ Nutrition per recipe / serving / 100g final yield

Meal Plan
├─ Daily/weekly plan
├─ Add recipe/product/ingredient
├─ Missing ingredients
└─ Send to shopping list

Shopping
├─ Manual items
├─ Generated from recipes/meal plan
├─ Low-stock items
└─ Bought → optionally add to pantry

Data/Profile
├─ Ingredient library
├─ Product/barcode library
├─ User custom measurements
├─ Unit preference
└─ Data source/confidence settings
```

### 2.2 Flow quản lý danh sách nguyên liệu cá nhân

```text
Ingredient Library
→ Search/filter by name/category/state/source/confidence
→ Ingredient detail
   ├─ Variants: raw, cooked, peeled, chopped, canned, dried...
   ├─ Nutrition profiles
   ├─ Measurements/conversions
   ├─ User overrides
   ├─ Linked products/barcodes
   └─ Used in pantry/recipes/logs
→ Edit allowed fields
→ Save as new version if conversion/nutrition changes materially
```

UX rule:

- Ingredient library là master data.
- Không hiển thị như “kho đang có bao nhiêu” vì đó là Pantry.
- Cần cảnh báo nếu sửa conversion/nutrition đang được nhiều recipe/log dùng.

### 2.3 Flow nhập nguyên liệu mới

```text
Add Ingredient
→ Search first
   ├─ Found generic ingredient → choose
   ├─ Found product/barcode → choose product
   └─ Not found → create custom ingredient
→ Choose/create category
→ Choose state/form default
→ Add nutrition profile or mark unknown
→ Add common measurements if needed
→ Save ingredient
→ Return to parent context if opened from pantry/recipe/meal
```

Anti-pattern cần tránh:

```text
User bấm Add → form trống dài 30 field → bắt user biết hết nutrition/conversion ngay từ đầu
```

Pattern tốt hơn:

```text
Search/select nhanh trước, advanced fields mở dần khi cần.
```

### 2.4 Flow nhập nguyên liệu bằng search, scan barcode, manual input hoặc database

```text
Entry: Add Food / Add Stock / Add Recipe Ingredient
→ Input method
   ├─ Search database
   │  ├─ Ingredient result
   │  ├─ Product result
   │  └─ Recent/user custom result
   ├─ Scan barcode
   │  ├─ Found product → review label/serving
   │  └─ Not found → create product manually
   ├─ Manual ingredient
   │  ├─ Name/category/state
   │  ├─ Nutrition optional
   │  └─ Measurement optional
   └─ Import from recipe text/URL later
→ Quantity/unit step
→ Measurement resolver
→ Nutrition preview
→ Save to context
```

### 2.5 Flow gắn nguyên liệu vào món ăn/công thức

```text
Recipe Detail
→ Add ingredient line
→ Search ingredient/product/nested recipe
→ Select variant/state/form
→ Enter quantity + unit + size option
→ Resolve conversion
   ├─ Success → show resolved amount + nutrition preview
   └─ Missing → Missing Conversion Resolver
→ Save line with:
   ├─ original input quantity/unit
   ├─ normalized edible mass/volume
   ├─ conversion snapshot
   └─ nutrition snapshot or status incomplete
→ Recipe total recalculates
```

Recipe line display:

```text
Cà chua · raw/whole
2 quả vừa → ≈240g edible
≈43 kcal · P 2.1g · C 9.3g · F 0.5g
Conversion: estimated · Nutrition: verified
```

### 2.6 Flow tạo món ăn và tính dinh dưỡng món ăn

```text
Create Recipe
→ Metadata: name, photo, servings, source URL optional
→ Ingredient lines
→ Instructions optional
→ Final yield optional
→ Nutrition summary:
   ├─ Total recipe
   ├─ Per serving
   └─ Per 100g final cooked weight if final yield exists
→ Save recipe version
```

Nếu recipe chưa đủ conversion:

```text
Recipe nutrition: incomplete
3/5 ingredients resolved
[Fix missing conversions]
```

### 2.7 Flow tạo bữa ăn từ nhiều món ăn

```text
Meal Plan / Food Log
→ Add item
   ├─ Recipe
   ├─ Product
   ├─ Ingredient
   └─ Pantry item
→ Select serving/amount
→ Preview nutrition
→ Optional deduct pantry
→ Save as planned meal or actual food log
```

Phân biệt rõ:

| Concept | Ý nghĩa | Có nên immutable? |
|---|---|---|
| Meal Plan | Dự định ăn | Có thể sửa linh hoạt |
| Food Log | Đã ăn thực tế | Nên immutable bằng snapshot |

### 2.8 Flow preview dinh dưỡng sau khi user nhập số lượng

Preview xuất hiện ở mọi nơi có quantity/unit:

```text
Input: 2 quả cà chua vừa
Resolved: ≈240g edible
Nutrition: ≈43 kcal · Protein 2.1g · Carbs 9.3g · Fat 0.5g
Source: nutrition verified · conversion estimated
```

Nếu gross/edible:

```text
Input: 1 trái dưa hấu vừa ≈5kg cả vỏ
Edible yield: 52%
Resolved edible: ≈2.6kg ruột dưa
Nutrition tính trên phần ăn được
```

Nếu thiếu conversion:

```text
Chưa thể tính chính xác vì thiếu quy đổi “1 pack = ?g/ml”.
Bạn vẫn có thể lưu, nhưng item sẽ được đánh dấu nutrition incomplete.
```

### 2.9 Flow xử lý khi thiếu thông tin quy đổi đơn vị

```text
User nhập quantity/unit
→ Resolver không tìm được conversion
→ App hỏi một câu cụ thể theo context
→ User chọn:
   ├─ Preset: nhỏ/vừa/lớn
   ├─ Tự nhập gram/ml
   ├─ Cân cả vỏ/xương hoặc phần ăn được
   ├─ Chỉ dùng lần này
   ├─ Nhớ cho lần sau
   └─ Bỏ qua và lưu incomplete
→ Save snapshot hoặc user custom measurement
→ Update preview
```

Ví dụ UX:

```text
App cần biết 1 củ khoai tây của bạn khoảng bao nhiêu gram.
[Nhỏ ≈100g] [Vừa ≈170g] [Lớn ≈300g] [Tự nhập]

Bạn đang nhập trọng lượng cả vỏ hay phần ăn được?
[Cả vỏ] [Phần ăn được]

Lưu lựa chọn này?
[Chỉ dùng lần này] [Nhớ cho sau]
```

---

## 3. Wireflow / mô tả màn hình chính

### 3.1 Màn Today

Mục tiêu: trả lời “hôm nay ăn gì, đã ăn gì, còn thiếu gì?”.

Sections:

1. Daily nutrition ring/card: calories, protein, carbs, fat.
2. Planned meals: sáng/trưa/tối/snack.
3. Logged foods.
4. Alerts:
   - nguyên liệu sắp hết hạn,
   - thiếu conversion,
   - low stock,
   - recipe hôm nay thiếu nguyên liệu.

Primary actions:

```text
[Log food] [Plan meal] [Fix conversion]
```

### 3.2 Màn Pantry

Sections:

```text
Expiring soon
Low stock
Needs conversion
By location
By category
```

Item card:

```text
Trứng gà · raw
6 quả lớn · ≈300g edible
Tủ lạnh · hết hạn 2026-05-05
Nutrition resolved · conversion user custom
```

Actions:

```text
[Add stock] [Scan barcode] [Move] [Use in recipe] [Discard]
```

### 3.3 Màn Add Stock

Steps:

1. Identify food/product.
2. Select variant/state.
3. Enter quantity/unit/size.
4. Resolve gross/edible.
5. Add location/expiry/opened date.
6. Preview nutrition/confidence.
7. Save.

### 3.4 Màn Ingredient Detail

Tabs/sections:

```text
Overview
Nutrition profiles
Measurements
User overrides
Linked products
Used in recipes/pantry/logs
```

Không nên nhồi stock quantity vào ingredient detail; chỉ show “currently in pantry” như related data.

### 3.5 Màn Recipe Builder

Layout:

```text
Header: recipe name/photo/servings
Nutrition summary card: total + per serving
Ingredient lines
Instruction steps
Missing conversion warnings
Final yield input optional
```

Ingredient line editor:

```text
Food selector
Variant selector
Quantity + unit
Size option
Resolved amount preview
Nutrition line preview
```

### 3.6 Màn Meal Plan / Food Log

Meal Plan:

```text
Calendar/day view
Meal periods
Add recipe/product/ingredient
Nutrition preview
Missing ingredients
Send to shopping
```

Food Log:

```text
Actual consumed time
Meal period
Items consumed
Immutable nutrition snapshots
Edit creates correction record or explicit update event
```

### 3.7 Màn Shopping

Sections:

```text
Manual
From recipes
From meal plan
Low stock
Expiry replacement
```

Item card:

```text
Sữa tươi · 1 bottle
Source: low stock + needed for breakfast plan
[Mark bought] [Add to pantry]
```

### 3.8 Màn Data Quality / Conversion Center

Purpose: gom các vấn đề measurement/nutrition.

Sections:

```text
Missing conversions
Low confidence estimates
User custom measurements
Reported incorrect nutrition
Duplicate ingredients/products
```

---

## 4. Form nhập nguyên liệu / stock item

### 4.1 Tách 3 loại form

Không nên có một form duy nhất cho mọi thứ. Nên tách:

| Form | Dùng khi nào | Entity chính |
|---|---|---|
| Create Ingredient Master | Thêm thực phẩm generic vào library | `ingredient`, `ingredient_variant`, `nutrition_profile`, `ingredient_measurement` |
| Add Pantry Stock | User mua/có nguyên liệu trong nhà | `pantry_item`, `stock_movement` |
| Add Recipe Ingredient Line | Gắn nguyên liệu vào recipe | `recipe_ingredient_line` |

### 4.2 Form Create Ingredient Master

Core fields:

| Field | Required | Note |
|---|---:|---|
| Tên nguyên liệu | Yes | Display name, ví dụ “Cà chua” |
| Canonical name | Optional | Dùng để dedupe/search |
| Category | Yes | Rau củ, trái cây, dairy, meat, grain... |
| Aliases | Optional | “tomato”, “cà chua bi”... |
| Default state | Yes | raw/cooked/peeled/chopped/canned/dried... |
| Default form | Optional | whole/diced/sliced/minced/powder/liquid |
| Data source | Yes | verified/imported/user custom/estimated |
| Confidence | Yes | verified/estimated/user custom |

Nutrition section:

| Field | Required | Note |
|---|---:|---|
| Nutrition basis | Yes if nutrition known | per 100g / per 100ml / per 1 piece / per serving |
| Calories | Yes if nutrition known | kcal |
| Protein | Recommended | gram |
| Carbs | Recommended | gram |
| Fat | Recommended | gram |
| Fiber | Optional | gram |
| Sugar | Optional | gram |
| Sodium | Optional | mg |
| Micronutrients | Advanced | JSON (JavaScript Object Notation = định dạng dữ liệu key-value) or child table |
| Serving size | Required if per serving | quantity + unit |

Measurement section:

| Field | Required | Note |
|---|---:|---|
| Supported units | Optional | quả/trái/củ/tép/cup/tbsp/tsp/serving... |
| Average weight | Required for count unit if nutrition needs gram | Ví dụ 1 quả vừa = 120g |
| Size option | Recommended | small/medium/large/custom |
| Applies to | Yes | gross/edible |
| Edible yield ratio | Required if applies_to=gross and food has waste | Ví dụ 0.52 for watermelon |
| Density | Optional | Needed for gram↔ml conversion |
| Source/confidence | Yes | verified/estimated/user custom |

### 4.3 Form Add Pantry Stock

| Field | Required | Note |
|---|---:|---|
| Ingredient/Product | Yes | search/scan/manual |
| Variant/state | Yes | raw/cooked/peeled/chopped/canned/dried... |
| Quantity | Yes | user input |
| Unit | Yes | g/kg/ml/l/quả/trái/củ/tép/cup/tbsp/tsp/pack/bottle/serving |
| Size option | Conditional | small/medium/large/custom for count units |
| Gross vs edible | Conditional | hỏi nếu food có phần bỏ đi |
| Average weight override | Optional | per-entry override |
| Location | Yes | tủ lạnh/tủ đông/kệ bếp/custom |
| Expiry date | Recommended | hạn dùng |
| Opened date | Optional | packaged food |
| Nutrition preview | System | derived |
| Conversion status | System | resolved/estimated/missing/user_override |
| Notes/photo | Optional | receipt/label/photo |

### 4.4 Form Add Recipe Ingredient Line

| Field | Required | Note |
|---|---:|---|
| Ingredient/Product/Nested Recipe | Yes | search-first |
| Variant/state/form | Yes | raw/chopped/peeled/cooked... |
| Quantity | Yes | amount used in recipe |
| Unit | Yes | g/ml/quả/cup/tbsp/... |
| Size option | Conditional | count units |
| Optional ingredient | Optional | for recipe variation |
| Line note | Optional | “finely chopped”, “drained” |
| Conversion preview | System | `2 quả → ≈240g edible` |
| Nutrition preview | System | line kcal/macro |
| Snapshot fields | System | conversion/nutrition snapshot |

---

## 5. Quản lý đơn vị tính và quy đổi

### 5.1 Ba loại unit phải tách rõ

| Loại unit | Ví dụ | Ý nghĩa |
|---|---|---|
| Unit gốc của nutrition | per 100g, per 100ml, per piece, per serving | Cách source cung cấp dinh dưỡng |
| Unit người dùng nhập | 2 quả, 1 cup, 500g, 1 bottle | Input tự nhiên của user |
| Unit tính toán normalized | edible_g, edible_ml, count | Unit nội bộ để scale nutrition |

### 5.2 Unit taxonomy

| Unit | Dimension | Global conversion? | Food-specific needed? |
|---|---|---:|---:|
| g | mass | Yes | No |
| kg | mass | Yes | No |
| ml | volume | Yes | No |
| l | volume | Yes | No |
| tsp | volume | Yes to ml | Yes if nutrition basis is gram |
| tbsp | volume | Yes to ml | Yes if nutrition basis is gram |
| cup | volume | Yes to ml by locale | Yes if nutrition basis is gram |
| quả/piece | count | No | Yes |
| trái | count | No | Yes |
| củ | count | No | Yes |
| tép | count | No | Yes |
| pack | package | No | Yes, usually product-specific |
| bottle | package | No | Yes, usually product-specific |
| serving | serving | No | Yes, source/product/recipe-specific |
| dozen | count group | Yes to 12 count | Count-to-gram still food-specific |

### 5.3 Conversion key

Mỗi conversion phải được định danh bằng:

```text
ingredient_id or product_id
+ variant_id
+ unit_id
+ size_option
+ applies_to gross/edible
+ source/confidence/version
```

Ví dụ:

```text
Tomato + raw/whole + piece + medium → 120g edible
Watermelon + raw/whole + piece + medium → 5000g gross, edible_yield=0.52
Flour + dry/powder + cup + not_applicable → 120g edible
Milk product A + bottle → 1000ml edible
```

### 5.4 Size option

Cho count-like unit:

```text
small
medium
large
custom
not_applicable
```

UX:

```text
1 quả cà chua
[Nhỏ ≈80g] [Vừa ≈120g] [Lớn ≈180g] [Tự nhập]
```

### 5.5 Conversion snapshot

Bất cứ khi nào conversion được dùng trong pantry/recipe/meal/log, lưu snapshot:

```json
{
  "input_quantity": 2,
  "input_unit": "piece",
  "size_option": "medium",
  "measurement_id": "meas_tomato_medium_piece",
  "from_quantity": 1,
  "quantity_per_unit": 120,
  "quantity_unit": "g",
  "applies_to": "edible",
  "edible_yield_ratio": null,
  "confidence": "estimated",
  "source": "curated",
  "version": 3
}
```

### 5.6 User override per entry

Khi user nhập override:

```text
1 quả cà chua lần này = 150g
```

System hỏi:

```text
[Chỉ dùng lần này] → lưu snapshot only
[Nhớ cho cà chua sau này] → tạo user_measurement_override
```

Không overwrite measurement verified/global.

---

## 6. Data model/database schema chi tiết

Ghi chú: SQL (Structured Query Language = ngôn ngữ truy vấn có cấu trúc) dưới đây là schema logic. Khi implement thực tế có thể điều chỉnh type/constraint theo database.

### 6.1 Entity relationship summary

```text
user 1--N pantry_item
user 1--N recipe
user 1--N meal_plan
user 1--N food_log
user 1--N user_measurement_override

ingredient_category 1--N ingredient
ingredient 1--N ingredient_variant
ingredient 1--N ingredient_measurement
ingredient 1--N nutrition_profile
ingredient 1--N pantry_item
ingredient 1--N recipe_ingredient_line

ingredient_variant 1--N ingredient_measurement
ingredient_variant 1--N nutrition_profile

product 1--N barcode
product N--1 ingredient nullable
product 1--N nutrition_profile
product 1--N ingredient_measurement

recipe 1--N recipe_ingredient_line
recipe 1--1 recipe_nutrition_summary per version

meal_plan 1--N meal_plan_item
food_log 1--N food_log_item
shopping_list 1--N shopping_list_item
pantry_item 1--N stock_movement
```

### 6.2 Core tables

```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  locale TEXT NOT NULL DEFAULT 'vi-VN',
  preferred_mass_unit_id TEXT,
  preferred_volume_unit_id TEXT,
  nutrition_goals_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE ingredient_category (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES ingredient_category(id),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE ingredient (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category_id TEXT REFERENCES ingredient_category(id),
  is_generic INTEGER NOT NULL DEFAULT 1,
  created_by_user_id TEXT REFERENCES user(id),
  default_variant_id TEXT,
  external_ref_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE ingredient_alias (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT NOT NULL REFERENCES ingredient(id),
  alias TEXT NOT NULL,
  locale TEXT,
  source TEXT NOT NULL,
  confidence TEXT NOT NULL
);

CREATE TABLE ingredient_variant (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT NOT NULL REFERENCES ingredient(id),
  state TEXT NOT NULL,
  form TEXT,
  preparation_note TEXT,
  default_measurement_id TEXT,
  is_default INTEGER NOT NULL DEFAULT 0
);
```

### 6.3 Unit and measurement

```sql
CREATE TABLE unit (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name_vi TEXT NOT NULL,
  name_en TEXT,
  dimension TEXT NOT NULL CHECK (dimension IN ('mass','volume','count','package','serving','recipe_serving')),
  global_to_base_factor REAL,
  global_base_unit_id TEXT REFERENCES unit(id),
  requires_food_specific_conversion INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE data_source (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('verified','imported','curated','user','ai_estimated')),
  url TEXT,
  license TEXT,
  trust_level TEXT NOT NULL CHECK (trust_level IN ('high','medium','low','unknown')),
  created_at TEXT NOT NULL
);

CREATE TABLE ingredient_measurement (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT REFERENCES ingredient(id),
  product_id TEXT,
  variant_id TEXT REFERENCES ingredient_variant(id),
  unit_id TEXT NOT NULL REFERENCES unit(id),
  from_quantity REAL NOT NULL DEFAULT 1,
  size_option TEXT NOT NULL DEFAULT 'not_applicable'
    CHECK (size_option IN ('small','medium','large','custom','not_applicable')),
  display_label TEXT,
  quantity_per_unit REAL NOT NULL,
  quantity_unit_id TEXT NOT NULL REFERENCES unit(id),
  applies_to TEXT NOT NULL CHECK (applies_to IN ('gross','edible')),
  edible_yield_ratio REAL,
  density_g_per_ml REAL,
  is_default INTEGER NOT NULL DEFAULT 0,
  is_approximate INTEGER NOT NULL DEFAULT 1,
  confidence TEXT NOT NULL CHECK (confidence IN ('verified','imported','estimated','ai_estimated','user_custom')),
  data_source_id TEXT REFERENCES data_source(id),
  source_food_id TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  valid_from TEXT,
  valid_to TEXT,
  created_by_user_id TEXT REFERENCES user(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (ingredient_id IS NOT NULL OR product_id IS NOT NULL)
);

CREATE TABLE user_measurement_override (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  base_measurement_id TEXT REFERENCES ingredient_measurement(id),
  ingredient_id TEXT REFERENCES ingredient(id),
  product_id TEXT,
  variant_id TEXT REFERENCES ingredient_variant(id),
  unit_id TEXT NOT NULL REFERENCES unit(id),
  size_option TEXT,
  quantity_per_unit REAL NOT NULL,
  quantity_unit_id TEXT NOT NULL REFERENCES unit(id),
  applies_to TEXT NOT NULL CHECK (applies_to IN ('gross','edible')),
  edible_yield_ratio REAL,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 6.4 Nutrition, product, barcode

```sql
CREATE TABLE nutrition_profile (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT REFERENCES ingredient(id),
  product_id TEXT,
  variant_id TEXT REFERENCES ingredient_variant(id),
  basis_type TEXT NOT NULL CHECK (basis_type IN ('per_100g','per_100ml','per_piece','per_serving')),
  basis_quantity REAL NOT NULL,
  basis_unit_id TEXT NOT NULL REFERENCES unit(id),
  calories_kcal REAL NOT NULL,
  protein_g REAL,
  carbs_g REAL,
  fat_g REAL,
  fiber_g REAL,
  sugar_g REAL,
  sodium_mg REAL,
  micronutrients_json TEXT,
  serving_size_quantity REAL,
  serving_size_unit_id TEXT REFERENCES unit(id),
  serving_measurement_id TEXT REFERENCES ingredient_measurement(id),
  data_source_id TEXT REFERENCES data_source(id),
  source_food_id TEXT,
  confidence TEXT NOT NULL CHECK (confidence IN ('verified','imported','estimated','ai_estimated','user_custom')),
  version INTEGER NOT NULL DEFAULT 1,
  is_authoritative INTEGER NOT NULL DEFAULT 0,
  valid_from TEXT,
  valid_to TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (ingredient_id IS NOT NULL OR product_id IS NOT NULL)
);

CREATE TABLE product (
  id TEXT PRIMARY KEY,
  brand TEXT,
  name TEXT NOT NULL,
  barcode_primary TEXT,
  net_quantity REAL,
  net_unit_id TEXT REFERENCES unit(id),
  serving_size_quantity REAL,
  serving_size_unit_id TEXT REFERENCES unit(id),
  ingredient_id TEXT REFERENCES ingredient(id),
  source_id TEXT REFERENCES data_source(id),
  confidence TEXT NOT NULL,
  label_photo_url TEXT,
  last_verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE barcode (
  id TEXT PRIMARY KEY,
  barcode TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL REFERENCES product(id),
  format TEXT,
  source_id TEXT REFERENCES data_source(id),
  last_seen_at TEXT
);
```

### 6.5 Pantry and stock movement

```sql
CREATE TABLE storage_location (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fridge','freezer','pantry_shelf','counter','custom')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE pantry_item (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  ingredient_id TEXT REFERENCES ingredient(id),
  product_id TEXT REFERENCES product(id),
  variant_id TEXT REFERENCES ingredient_variant(id),
  input_quantity REAL NOT NULL,
  input_unit_id TEXT NOT NULL REFERENCES unit(id),
  size_option TEXT,
  gross_quantity REAL,
  gross_unit_id TEXT REFERENCES unit(id),
  edible_quantity REAL,
  normalized_mass_g REAL,
  normalized_volume_ml REAL,
  count_quantity REAL,
  storage_location_id TEXT REFERENCES storage_location(id),
  expiry_date TEXT,
  opened_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('available','used','expired','discarded')),
  conversion_status TEXT NOT NULL CHECK (conversion_status IN ('resolved','estimated','missing','user_override')),
  nutrition_status TEXT NOT NULL CHECK (nutrition_status IN ('resolved','incomplete','not_applicable')),
  conversion_snapshot_json TEXT,
  nutrition_snapshot_json TEXT,
  confidence TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (ingredient_id IS NOT NULL OR product_id IS NOT NULL)
);

CREATE TABLE stock_movement (
  id TEXT PRIMARY KEY,
  pantry_item_id TEXT NOT NULL REFERENCES pantry_item(id),
  user_id TEXT NOT NULL REFERENCES user(id),
  type TEXT NOT NULL CHECK (type IN ('add','use','discard','adjust','cook','move')),
  input_delta_quantity REAL NOT NULL,
  input_unit_id TEXT NOT NULL REFERENCES unit(id),
  normalized_delta_mass_g REAL,
  normalized_delta_volume_ml REAL,
  reason TEXT,
  linked_recipe_id TEXT,
  linked_meal_item_id TEXT,
  created_at TEXT NOT NULL
);
```

### 6.6 Recipe, meal, food log, shopping

```sql
CREATE TABLE recipe (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  name TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  servings REAL NOT NULL DEFAULT 1,
  final_yield_mass_g REAL,
  source_url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE recipe_ingredient_line (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipe(id),
  ingredient_id TEXT REFERENCES ingredient(id),
  product_id TEXT REFERENCES product(id),
  nested_recipe_id TEXT REFERENCES recipe(id),
  variant_id TEXT REFERENCES ingredient_variant(id),
  line_text TEXT,
  input_quantity REAL NOT NULL,
  input_unit_id TEXT NOT NULL REFERENCES unit(id),
  size_option TEXT,
  normalized_mass_g REAL,
  normalized_volume_ml REAL,
  edible_mass_g REAL,
  edible_volume_ml REAL,
  conversion_status TEXT NOT NULL,
  conversion_snapshot_json TEXT,
  nutrition_snapshot_json TEXT,
  line_order INTEGER NOT NULL DEFAULT 0,
  is_optional INTEGER NOT NULL DEFAULT 0,
  CHECK (ingredient_id IS NOT NULL OR product_id IS NOT NULL OR nested_recipe_id IS NOT NULL)
);

CREATE TABLE recipe_step (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipe(id),
  step_order INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  timer_seconds INTEGER
);

CREATE TABLE recipe_nutrition_summary (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipe(id),
  recipe_version INTEGER NOT NULL,
  total_nutrition_json TEXT NOT NULL,
  per_serving_json TEXT NOT NULL,
  per_100g_json TEXT,
  calculation_status TEXT NOT NULL CHECK (calculation_status IN ('complete','partial','incomplete')),
  source_version_hash TEXT,
  calculated_at TEXT NOT NULL
);

CREATE TABLE meal_plan (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  date TEXT NOT NULL,
  meal_period TEXT NOT NULL CHECK (meal_period IN ('breakfast','lunch','dinner','snack','other')),
  name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE meal_plan_item (
  id TEXT PRIMARY KEY,
  meal_plan_id TEXT NOT NULL REFERENCES meal_plan(id),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('recipe','ingredient','product')),
  reference_id TEXT NOT NULL,
  planned_quantity REAL NOT NULL,
  planned_unit_id TEXT NOT NULL REFERENCES unit(id),
  nutrition_preview_json TEXT
);

CREATE TABLE food_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  logged_at TEXT NOT NULL,
  meal_period TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE food_log_item (
  id TEXT PRIMARY KEY,
  food_log_id TEXT NOT NULL REFERENCES food_log(id),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('recipe','ingredient','product')),
  reference_id TEXT,
  input_quantity REAL NOT NULL,
  input_unit_id TEXT NOT NULL REFERENCES unit(id),
  conversion_snapshot_json TEXT NOT NULL,
  nutrition_snapshot_json TEXT NOT NULL,
  source_snapshot_json TEXT
);

CREATE TABLE shopping_list (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','completed','archived')),
  created_at TEXT NOT NULL
);

CREATE TABLE shopping_list_item (
  id TEXT PRIMARY KEY,
  shopping_list_id TEXT NOT NULL REFERENCES shopping_list(id),
  ingredient_id TEXT REFERENCES ingredient(id),
  product_id TEXT REFERENCES product(id),
  requested_quantity REAL,
  requested_unit_id TEXT REFERENCES unit(id),
  normalized_quantity REAL,
  source TEXT NOT NULL CHECK (source IN ('manual','recipe','meal_plan','low_stock','expiry_suggestion')),
  source_ref_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending','bought','skipped'))
);
```

---

## 7. Quy tắc tính dinh dưỡng

### 7.1 Function tổng quát

```text
calculateNutrition(input_quantity, input_unit, food, variant, size_option)

1. Resolve measurement
2. Normalize amount
3. Apply gross → edible if needed
4. Match nutrition basis
5. Scale nutrients
6. Return result + confidence + snapshots
```

### 7.2 Normalize amount

```text
if input unit is mass:
  normalized_mass_g = input × mass_factor

if input unit is volume:
  normalized_volume_ml = input × volume_factor

if input unit is count/package/serving:
  lookup ingredient_measurement or product measurement

if nutrition needs g but only ml is available:
  need density_g_per_ml or measurement to gram

if nutrition needs ml but only g is available:
  need density_g_per_ml or measurement to ml
```

### 7.3 Gross vs edible

```text
if measurement.applies_to == 'gross':
  edible_amount = gross_amount × edible_yield_ratio
else:
  edible_amount = resolved_amount
```

Rule: không apply edible yield hai lần. Nếu variant là `peeled`, `boneless`, `drained`, measurement thường nên là `applies_to=edible`.

### 7.4 Nutrition per 100g

```text
nutrient = edible_mass_g / 100 × nutrient_per_100g
```

Ví dụ:

```text
Cà chua 240g edible
Calories per 100g = 18 kcal
Calories = 240 / 100 × 18 = 43.2 kcal
```

### 7.5 Nutrition per 100ml

```text
nutrient = edible_volume_ml / 100 × nutrient_per_100ml
```

Ví dụ:

```text
Sữa 240ml
Calories per 100ml = 61 kcal
Calories = 240 / 100 × 61 = 146.4 kcal
```

### 7.6 Nutrition per 1 piece

Nếu input là piece:

```text
nutrient = piece_count × nutrient_per_piece
```

Nếu input là gram nhưng profile per piece:

```text
piece_count = edible_mass_g / average_piece_edible_mass_g
nutrient = piece_count × nutrient_per_piece
```

### 7.7 Nutrition per serving

```text
serving_count = resolved_amount / serving_size
nutrient = serving_count × nutrient_per_serving
```

Serving phải gắn với product/recipe/nutrition profile, không dùng global serving.

### 7.8 Unit khác nutrition basis

| Input | Nutrition basis | Cần gì? |
|---|---|---|
| 2 quả cà chua | per 100g | piece→g measurement |
| 1 cup bột mì | per 100g | cup→g measurement for flour |
| 1 cup sữa | per 100ml | cup→ml global volume okay |
| 1 bottle sữa | per 100ml | bottle→ml product measurement |
| 1 pack cereal | per serving | pack→serving hoặc pack→g + serving size |
| 200ml oil | per 100g | density or ml→g measurement |

---

## 8. Ví dụ dữ liệu mẫu và calculation

Các số dưới đây dùng để minh họa model/logic. Khi đưa vào product thật cần gắn nguồn, version và confidence rõ ràng.

### 8.1 Cà chua

Data:

```text
ingredient: Cà chua
variant: raw/whole
nutrition_profile: per 100g
  calories=18, protein=0.9, carbs=3.9, fat=0.2
measurement:
  1 quả medium → 120g edible, confidence=estimated
```

User nhập:

```text
2 quả medium
```

Calculation:

```text
edible_mass = 2 × 120 = 240g
calories = 240/100 × 18 = 43.2 kcal
protein = 240/100 × 0.9 = 2.16g
carbs = 240/100 × 3.9 = 9.36g
fat = 240/100 × 0.2 = 0.48g
```

UX preview:

```text
2 quả cà chua vừa → ≈240g edible
≈43 kcal · P 2.2g · C 9.4g · F 0.5g
```

### 8.2 Trứng gà

Data option A:

```text
ingredient: Trứng gà
variant: raw/whole
nutrition_profile: per 1 large egg
  calories=72, protein=6.3, carbs=0.4, fat=4.8
measurement:
  1 quả large → 50g edible
  1 dozen → 12 count
```

User nhập:

```text
2 quả large
```

Calculation:

```text
calories = 2 × 72 = 144 kcal
```

Nếu user nhập gram nhưng nutrition per piece:

```text
100g edible / 50g per egg = 2 eggs
calories = 2 × 72 = 144 kcal
```

### 8.3 Dưa hấu

Data:

```text
ingredient: Dưa hấu
variant: raw/whole
nutrition_profile: per 100g edible
  calories=30, protein=0.6, carbs=7.6, fat=0.2
measurement:
  1 trái medium → 5000g gross
  edible_yield_ratio = 0.52
```

User nhập:

```text
1 trái medium, cân cả vỏ
```

Calculation:

```text
gross_mass = 5000g
edible_mass = 5000 × 0.52 = 2600g
calories = 2600/100 × 30 = 780 kcal
```

UX preview:

```text
1 trái dưa hấu vừa ≈5kg cả vỏ
Phần ăn được ≈52% → ≈2.6kg
≈780 kcal cho phần ăn được
```

### 8.4 Khoai tây

Data:

```text
ingredient: Khoai tây
variant raw/whole with skin
nutrition_profile: per 100g edible
measurement:
  1 củ medium → 170g gross
  edible_yield_ratio = 0.85 if peeled
variant peeled/raw:
  1 củ medium → 145g edible
```

User nhập:

```text
3 củ medium, chưa gọt
```

Calculation:

```text
gross_mass = 3 × 170 = 510g
edible_mass = 510 × 0.85 = 433.5g
nutrition = per_100g × 4.335
```

Rule: nếu user chọn variant `peeled`, không apply yield thêm lần nữa.

### 8.5 Bột mì

Data:

```text
ingredient: Bột mì
variant: dry/powder
nutrition_profile: per 100g
measurement:
  1 cup → 120g edible
  1 tbsp → 7.5g edible
```

User nhập:

```text
2 cup
```

Calculation:

```text
edible_mass = 2 × 120 = 240g
nutrition = per_100g × 2.4
```

Rule: `1 cup` ở đây không thể dùng chung cho mọi ingredient.

### 8.6 Sữa

Data:

```text
ingredient: Sữa tươi
variant: liquid
nutrition_profile: per 100ml
measurement:
  1 cup → 240ml
product measurement:
  1 bottle → 1000ml
```

User nhập:

```text
1 cup
```

Calculation:

```text
edible_volume = 240ml
nutrition = per_100ml × 2.4
```

Nếu user nhập:

```text
1 bottle
```

Need product-specific measurement:

```text
1 bottle product A = 1000ml
```

Không dùng global `1 bottle`.

---

## 9. Edge cases và rule tránh sai dữ liệu

### 9.1 Edge cases measurement

| Edge case | Rule |
|---|---|
| `1 piece` không rõ size | Ask small/medium/large/custom |
| `1 cup` với food khô | Need food-specific cup→g |
| `1 cup` với liquid nutrition per 100ml | cup→ml ok, theo locale |
| `1 serving` không có serving size | Missing conversion resolver |
| Product label có serving nhưng không có net weight | Nutrition per serving được, pantry quantity có thể incomplete |
| `1 pack` nhiều serving | Need pack→serving or pack→g/ml |
| g↔ml mismatch | Need density, no silent fallback |
| User nhập gross but variant already edible | Avoid applying edible yield twice |
| Cooked/raw mismatch | Use separate variant/nutrition profile |
| Drained canned food | Variant `canned/drained`, measurement may be edible/drained weight |

### 9.2 Edge cases nutrition

| Edge case | Rule |
|---|---|
| Nutrition source per serving, user nhập gram | Need serving size measurement |
| Multiple nutrition profiles | Choose authoritative by source/confidence/version, let user override |
| User edits nutrition master | Do not change historical food logs; create new version |
| Recipe ingredient incomplete | Recipe summary partial/incomplete, show warning |
| Final cooked yield unknown | Can show total/per serving, but not reliable per 100g final recipe |
| Cooking loss | Base model sums ingredient nutrition; advanced model applies yield/retention |

### 9.3 Edge cases pantry/stock

| Edge case | Rule |
|---|---|
| Same ingredient, different expiry | Separate pantry items/lots |
| Same ingredient, different location | Separate pantry items or location movements |
| Opened package changes expiry | Store `opened_at` and optional opened expiry rule |
| Auto-deduct from recipe | Create stock_movement type `use`/`cook`, do not silently delete item |
| Discard expired item | Create stock_movement type `discard` |
| Bought shopping item | Convert to pantry add flow, not just mark completed if user wants tracking |

### 9.4 Edge cases data quality

| Edge case | Rule |
|---|---|
| Duplicate ingredient | Use alias/merge flow, preserve references |
| Bad barcode data | Allow report/correction, mark confidence lower |
| User custom vs verified conflict | User custom wins for that user only |
| AI (Artificial Intelligence = trí tuệ nhân tạo) estimate | Must carry `ai_estimated`, never pretend verified |
| Imported source license | Store data_source/license/provenance |

---

## 10. MVP nên làm trước và nâng cao làm sau

### 10.1 MVP foundation nên làm trước

MVP (Minimum Viable Product = sản phẩm tối thiểu có thể dùng được) nên tập trung vào correctness của measurement/nutrition trước khi thêm AI/barcode phức tạp.

1. Ingredient library cơ bản:
   - name,
   - category,
   - variant raw/cooked/peeled/chopped/canned/dried,
   - nutrition per 100g/per 100ml/per serving.

2. Unit taxonomy:
   - g, kg, ml, l,
   - quả/trái/củ/tép,
   - cup/tbsp/tsp,
   - serving/pack/bottle.

3. Ingredient-specific measurement:
   - size option small/medium/large/custom,
   - quantity_per_unit + quantity_unit,
   - applies_to gross/edible,
   - edible_yield_ratio.

4. Pantry stock:
   - quantity/unit,
   - normalized quantity,
   - location,
   - expiry,
   - stock movement add/use/discard/adjust.

5. Recipe builder:
   - ingredient lines,
   - conversion resolver,
   - nutrition preview,
   - recipe total/per serving.

6. Food log basic:
   - log recipe/product/ingredient,
   - immutable nutrition snapshot.

7. Missing conversion resolver:
   - hỏi one concrete question,
   - save snapshot only or user custom measurement.

### 10.2 Nên làm sau khi foundation ổn

1. Barcode scan + Open Food Facts import.
2. Product label review/correction.
3. Shopping list generated from meal plan/recipe/pantry.
4. Auto-deduct pantry when cooking/logging.
5. Recipe import from URL/text.
6. User custom aliases and duplicate merge.
7. Nutrition confidence dashboard.

### 10.3 Advanced

1. OCR (Optical Character Recognition = nhận diện chữ trong ảnh) nutrition label.
2. Food photo recognition / pantry photo scan.
3. AI meal planning by macro/allergy/budget.
4. Cooking Yield Factor and nutrient-specific Retention Factor.
5. Full micronutrient analytics.
6. Household member profiles and shared pantry.
7. Price/cost per recipe/meal.
8. Expiry prediction by opened date/storage condition.

---

## 11. Recommended implementation order independent of current code

Nếu bắt đầu từ zero hoặc refactor lớn, thứ tự an toàn:

```text
1. Unit + Data Source
2. Ingredient + Category + Alias
3. Ingredient Variant
4. Nutrition Profile
5. Ingredient Measurement + User Override
6. Measurement Resolver service
7. Pantry Item + Stock Movement
8. Recipe + Recipe Ingredient Line
9. Nutrition calculation + snapshots
10. Meal Plan + Food Log
11. Shopping List
12. Product + Barcode
13. AI/OCR/import advanced
```

Dependency quan trọng:

```text
Không nên build barcode/AI/meal plan nâng cao trước khi Measurement Resolver ổn.
```

---

## 12. Checklist Definition of Done

Một solution đạt chuẩn khi:

- [ ] User nhập `2 quả cà chua` và app giải thích được thành bao nhiêu gram edible.
- [ ] User nhập `1 cup bột mì` và `1 cup sữa` cho ra conversion khác nhau đúng ngữ cảnh.
- [ ] User nhập `1 trái dưa hấu` và app phân biệt gross/edible.
- [ ] User nhập `3 củ khoai tây chưa gọt` và app không apply edible yield hai lần khi chuyển sang peeled variant.
- [ ] Recipe line lưu original input + normalized amount + conversion snapshot.
- [ ] Food log lưu nutrition snapshot immutable.
- [ ] Ingredient master không chứa pantry stock quantity.
- [ ] Pantry stock có location/expiry và movement history.
- [ ] Product/barcode không bị ép thành generic ingredient.
- [ ] Missing conversion có UX resolver rõ ràng.
- [ ] Mọi số estimate có `≈`, confidence và source.
- [ ] User custom conversion không overwrite verified/imported data.

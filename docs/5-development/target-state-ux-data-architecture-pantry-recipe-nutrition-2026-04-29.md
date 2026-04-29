# Target-State UX & Data Architecture — Pantry, Recipe, Meal, Nutrition

Ngày: 2026-04-29  
Mục tiêu: đề xuất **giải pháp sản phẩm/UX và tổ chức cơ sở dữ liệu tốt nhất** cho nền tảng quản lý nguyên liệu, pantry, công thức/món ăn, bữa ăn, shopping list và dinh dưỡng theo đơn vị.

Tài liệu này cố ý **không bị bó buộc** bởi phase hiện tại, mockup hiện tại, runtime code hiện tại, naming hiện tại hoặc logic implementation hiện tại. Đây là target-state architecture để dùng làm chuẩn định hướng sản phẩm và thiết kế dữ liệu dài hạn.

> **Evidence boundary:** Các nguồn/app/web được dùng để rút pattern gồm recipe manager, pantry/inventory, meal planner, nutrition tracker, USDA FoodData Central, Open Food Facts và recipe/nutrition analysis APIs. Một số nguồn marketing/help page chỉ chứng minh pattern UX nhìn thấy, không chứng minh toàn bộ interaction. Các claim định lượng cụ thể cần source/sample riêng trước khi biến thành requirement cứng.

---

## 1. Product thesis

Một app quản lý dinh dưỡng và bếp ăn tốt không nên có các module rời rạc kiểu:

```text
Pantry riêng
Recipe riêng
Meal log riêng
Nutrition riêng
Shopping riêng
```

Giải pháp đúng là:

```text
Pantry + Recipe + Meal + Food Log + Shopping
cùng dùng chung một Food Measurement & Nutrition Engine.
```

Engine này là lõi sản phẩm, không phải helper phụ. Nó quyết định app có tính nutrition đúng khi user nhập các đơn vị đời thường như `2 quả`, `1 cup`, `1 serving`, `1 chai`, `1 gói` hay không.

---

## 2. Core architecture principles

### 2.1 Food không phải một dòng text

Tách ít nhất 6 lớp:

| Lớp | Câu hỏi nó trả lời | Entity đề xuất |
|---|---|---|
| Food identity | Đây là thực phẩm gì? | `ingredient`, `product`, `food_alias`, `barcode` |
| Physical state/form | Nó đang ở trạng thái nào? | `food_variant` / `ingredient_variant` |
| Measurement | User đo bằng gì và quy đổi ra sao? | `unit`, `food_measurement` / `ingredient_measurement` |
| Nutrition source | Dinh dưỡng đến từ đâu, theo basis nào? | `nutrition_profile`, `data_source` |
| User stock | Nhà user đang có gì, bao nhiêu, ở đâu, hạn khi nào? | `pantry_item`, `storage_location`, `stock_movement` |
| Usage/history | Một recipe/meal/log đã dùng bao nhiêu tại thời điểm đó? | `recipe_ingredient_line`, `meal_item`, `food_log_item`, snapshot fields |

### 2.2 Measurement engine là shared service

Mọi nơi user nhập quantity/unit phải gọi cùng một resolver:

```text
resolveFoodAmount(input, food identity, variant, unit, size, source preference)
→ normalized gross amount
→ normalized edible amount
→ confidence
→ conversion snapshot
→ nutrition preview / nutrition snapshot
```

Không để mỗi màn hình tự tính riêng.

### 2.3 Global conversion chỉ dành cho vật lý chắc chắn

Allowed global conversions:

```text
1 kg = 1000 g
1 l = 1000 ml
1 tbsp = 3 tsp
1 cup = 240 ml hoặc theo locale nếu chỉ dùng như volume
```

Not allowed globally:

```text
1 piece = X g
1 quả = X g
1 củ = X g
1 tép = X g
1 serving = X g/ml
1 pack = X g/ml
1 bottle = X ml
1 cup = X g
```

Vì:

```text
1 quả cà chua ≠ 1 quả trứng ≠ 1 trái dưa hấu
1 cup bột mì ≠ 1 cup sữa ≠ 1 cup cà chua chopped
1 serving cereal ≠ 1 serving sữa chua ≠ 1 serving protein bar
```

### 2.4 Nutrition luôn tính trên edible amount

Rule:

```text
nutrition = nutrition_profile × normalized_edible_amount
```

Input có thể là gross:

```text
1 trái dưa hấu 5kg cả vỏ
1 con cá còn xương
500g khoai tây chưa gọt
```

Nhưng nutrition phải tính trên phần ăn được:

```text
edible_amount = gross_amount × edible_yield_ratio
```

### 2.5 Historical data phải immutable hoặc versioned

Bất kỳ record nào đại diện cho việc user đã save/log/consume trong quá khứ đều không được phụ thuộc live vào conversion/nutrition master.

Cần snapshot:

```text
conversion_snapshot_json
nutrition_snapshot_json
source_snapshot_json nếu cần
```

Lý do: nếu hôm nay app sửa `1 quả cà chua medium = 120g` thành `110g`, food log tháng trước không được âm thầm thay đổi.

---

## 3. UX pattern target-state

### 3.1 Navigation target

Khi sản phẩm đủ lớn, navigation nên phản ánh 5 job-to-be-done chính:

| Area | Job-to-be-done | Nội dung chính |
|---|---|---|
| Today | Hôm nay ăn gì, log gì, thiếu/sắp hết gì | food log, meal summary, alerts |
| Pantry | Nhà đang có gì | stock, expiry, location, low stock, conversion issues |
| Recipes | Có thể nấu món gì | recipe builder, nutrition per recipe/serving, nested recipe |
| Meal Plan | Tuần/ngày này ăn gì | planned meals, daily/weekly nutrition, missing ingredients |
| Shopping | Cần mua gì | grocery list từ recipe/meal/pantry/manual |
| Profile/Data | Cấu hình & data quality | unit preference, custom conversions, data sources, goals |

Nếu sản phẩm nhỏ hơn, có thể gom các area này vào ít tab hơn. Nhưng information architecture target vẫn nên giữ 5 job-to-be-done này, tránh trộn `Pantry stock` với `Ingredient master`.

### 3.2 Pantry-first flow

```text
Open Pantry
→ See priority sections:
   1. Expiring soon
   2. Low stock
   3. Missing/incomplete conversion
   4. By location
   5. By category
→ Add stock
→ Search/scan/manual
→ Identify ingredient/product + variant
→ Enter quantity/unit/size
→ Resolve conversion
→ Preview gross/edible/nutrition/confidence
→ Choose location + expiry/opened date
→ Save pantry item + stock movement
```

Pantry card should show:

```text
Tomato · raw/whole
3 quả vừa · ≈360g edible
Tủ lạnh · còn 2 ngày
Estimated conversion · USDA-derived nutrition
```

### 3.3 Recipe-first flow

```text
Create Recipe
→ Add metadata: name, photo, servings, optional final yield
→ Add ingredient line
→ Search ingredient/product/nested recipe
→ Select variant: raw/chopped/peeled/cooked/canned/dried/drained...
→ Enter amount/unit: 2 quả / 200g / 1 cup
→ Resolver checks measurement
   - Resolved → preview line nutrition
   - Missing → ask one conversion question
→ Save line with conversion snapshot
→ Recipe total updates live
→ Show total / per serving / per 100g final yield if available
```

Recipe line UI should be natural:

```text
Cà chua · raw/whole
2 quả vừa → ≈240g edible
≈43 kcal · estimated conversion
```

### 3.4 Meal-first flow

```text
Create/log meal
→ Add recipe / ingredient / product / pantry item
→ Select serving count or amount
→ Preview meal nutrition
→ Compare with daily target
→ Optional actions:
   - Deduct pantry
   - Add missing items to shopping list
   - Save as recurring meal
   - Log actual consumed amount
```

Important distinction:

```text
Meal plan = planned intent
Food log = actual consumed history
```

They should not be the same table if the product wants serious tracking.

### 3.5 Shopping flow

Shopping list should be generated from multiple sources:

| Source | Example |
|---|---|
| Manual | User adds “sữa” |
| Recipe | Missing ingredients for “cơm trứng” |
| Meal plan | Ingredients missing for next 7 days |
| Pantry low stock | Milk below threshold |
| Expiry replacement | Chicken expired/discarded and user wants replacement |

Shopping item should keep source so user understands why it appears:

```text
Trứng gà · 6 quả
Source: thiếu cho 2 recipes tuần này
```

### 3.6 Missing conversion resolver

This is a first-class UX flow, not an error state.

Principle:

```text
Ask one concrete question.
Never guess silently.
Always show confidence if estimated.
```

Examples:

```text
“1 quả cà chua của bạn khoảng bao nhiêu gram?”
[Nhỏ] [Vừa] [Lớn] [Tự nhập]

“1 cup bột mì này khoảng bao nhiêu gram?”
[120g phổ biến] [Tự cân] [Chỉ lưu chưa tính nutrition]

“1 trái dưa hấu này là cân cả vỏ hay phần ăn được?”
[Cả vỏ] [Phần ăn được]
```

Save options:

```text
Chỉ dùng lần này → snapshot only
Nhớ cho sau → user custom measurement
Không biết → save incomplete, nutrition_status=incomplete
```

### 3.7 Nutrition preview pattern

Preview appears anywhere quantity changes.

Minimum:

```text
Input: 2 quả cà chua vừa
Resolved: ≈240g edible
Nutrition: ≈43 kcal · Protein 2.1g · Carbs 9.3g · Fat 0.5g
Data: nutrition verified · conversion estimated
```

If gross/edible:

```text
Input: 1 trái dưa hấu vừa ≈5kg cả vỏ
Edible: khoảng 52% → ≈2.6kg ruột dưa
Nutrition tính trên phần ăn được
```

If incomplete:

```text
Chưa thể tính chính xác vì thiếu net weight/serving size.
Bạn vẫn có thể lưu, nhưng app sẽ đánh dấu “Cần bổ sung quy đổi”.
```

### 3.8 Data quality badges

Every derived value should carry confidence:

```text
Verified
Imported
Estimated
AI estimated
User custom
Incomplete
Reported incorrect
```

User-facing copy:

```text
≈ 240g · ước lượng
Verified by USDA
Label imported from barcode
Custom by you
Needs conversion
```

---

## 4. Target data model

### 4.1 Entity overview

| Domain | Entity | Responsibility |
|---|---|---|
| User | `user` | locale, unit preference, nutrition goals |
| Food | `ingredient` | generic food identity |
| Food | `ingredient_alias` | synonyms/local names/search merge |
| Food | `ingredient_category` | category tree |
| Food | `ingredient_variant` | state/form physical variant |
| Product | `product` | branded/package food |
| Product | `barcode` | barcode mapping |
| Unit | `unit` | dimension and safe global conversion |
| Measurement | `ingredient_measurement` | food-specific conversion |
| Measurement | `user_measurement_override` | personal conversion precedence |
| Nutrition | `nutrition_profile` | source nutrition by basis |
| Source | `data_source` | provenance/license/trust |
| Pantry | `storage_location` | fridge/freezer/shelf/custom |
| Pantry | `pantry_item` | stock lot user owns |
| Pantry | `stock_movement` | add/use/discard/adjust/move audit |
| Recipe | `recipe` | reusable preparation |
| Recipe | `recipe_ingredient_line` | ingredient/product/nested recipe usage |
| Recipe | `recipe_step` | instruction steps |
| Recipe | `recipe_nutrition_summary` | denormalized calculated summary |
| Meal | `meal_plan` | planned meal by date/period |
| Meal | `meal_plan_item` | planned recipe/product/ingredient |
| Log | `food_log` | actual consumed event/group |
| Log | `food_log_item` | consumed item with immutable nutrition snapshot |
| Shopping | `shopping_list` | shopping container |
| Shopping | `shopping_list_item` | item to buy + source |

### 4.2 `ingredient`

```text
id
canonical_name
display_name
category_id
is_generic
created_by_user_id nullable
default_variant_id nullable
external_ref_json nullable
created_at
updated_at
```

Do not put pantry quantity here. Do not put user-specific conversion here.

### 4.3 `ingredient_alias`

```text
id
ingredient_id
alias
locale
source
confidence
```

Purpose:

- Search Vietnamese/local names.
- Merge duplicate entries.
- Support “cà chua bi” vs “tomato cherry” vs “cherry tomato” when appropriate.

### 4.4 `ingredient_variant`

```text
id
ingredient_id
state: raw/cooked/peeled/chopped/canned/dried/frozen/drained/boiled/roasted/fried
form: whole/diced/sliced/minced/powder/liquid/paste/null
preparation_note
default_measurement_id nullable
is_default
```

Use variant whenever state/form changes:

- conversion,
- edible yield,
- nutrition,
- density,
- serving interpretation.

### 4.5 `unit`

```text
id
code
name
locale_label_json
dimension: mass/volume/count/package/serving/recipe_serving
global_to_base_factor nullable
global_base_unit_id nullable
requires_food_specific_conversion boolean
```

Examples:

| Unit | Dimension | Global safe? | Note |
|---|---|---|---|
| g | mass | yes | base mass |
| kg | mass | yes | 1000g |
| ml | volume | yes | base volume |
| l | volume | yes | 1000ml |
| tsp | volume | yes to ml | gram needs food-specific |
| tbsp | volume | yes to ml | gram needs food-specific |
| cup | volume | yes to ml by locale | gram needs food-specific |
| piece/quả | count | no | food-specific |
| clove/tép | count | no | food-specific |
| pack | package | no | product-specific |
| bottle | package | no | product-specific |
| serving | serving | no | nutrition/product/recipe-specific |

### 4.6 `ingredient_measurement`

```text
id
ingredient_id nullable
product_id nullable
variant_id nullable
unit_id
from_quantity default 1
size_option: small/medium/large/custom/not_applicable
display_label
quantity_per_unit
quantity_unit_id: g/ml/count
applies_to: gross/edible
edible_yield_ratio nullable
density_g_per_ml nullable
is_default
is_approximate
confidence: verified/imported/estimated/ai_estimated/user_custom
data_source_id
source_food_id nullable
version
valid_from nullable
valid_to nullable
created_by_user_id nullable
```

Design notes:

- Use `quantity_per_unit + quantity_unit_id`, not `to_mass_g` only.
- `product_id` handles package/bottle/serving for branded foods.
- `variant_id` handles chopped/sifted/drained/cooked differences.
- `applies_to=gross` means edible yield must be applied before nutrition.
- `valid_from/valid_to/version` preserve data lineage.

Examples:

```text
Tomato raw whole medium:
1 piece → 120 g, applies_to=edible

Watermelon raw whole medium:
1 piece → 5000 g, applies_to=gross, edible_yield_ratio=0.52

All-purpose flour dry:
1 cup → 120 g, applies_to=edible, is_approximate=true

Milk liquid:
1 cup → 240 ml, applies_to=edible

Milk bottle product:
1 bottle → 1000 ml, product-specific
```

### 4.7 `user_measurement_override`

```text
id
user_id
base_measurement_id nullable
ingredient_id nullable
product_id nullable
variant_id nullable
unit_id
size_option nullable
quantity_per_unit
quantity_unit_id
applies_to
edible_yield_ratio nullable
note nullable
created_at
updated_at
```

Resolver precedence:

```text
user_measurement_override
→ ingredient_measurement verified/imported/curated
→ product package measurement
→ density-based estimate
→ category estimate
→ missing conversion flow
```

### 4.8 `nutrition_profile`

```text
id
ingredient_id nullable
product_id nullable
variant_id nullable
basis_type: per_100g/per_100ml/per_piece/per_serving
basis_quantity
basis_unit_id
calories_kcal
protein_g
carbs_g
fat_g
fiber_g nullable
sugar_g nullable
sodium_mg nullable
micronutrients_json nullable
serving_size_quantity nullable
serving_size_unit_id nullable
serving_measurement_id nullable
data_source_id
source_food_id nullable
confidence: verified/imported/estimated/ai_estimated/user_custom
version
is_authoritative
valid_from nullable
valid_to nullable
```

Store source nutrition in its original basis. Normalize only during calculation when amount and conversion are trustworthy.

### 4.9 `product` and `barcode`

```text
product:
id
brand
name
barcode_primary nullable
net_quantity
net_unit_id
serving_size_quantity nullable
serving_size_unit_id nullable
ingredient_id nullable
source_id
confidence
label_photo_url nullable
last_verified_at nullable

barcode:
id
barcode
product_id
format
source_id
last_seen_at
```

Product is not always equivalent to ingredient. A bottle of milk maps to a generic ingredient category, but also has brand-specific serving, label and barcode.

### 4.10 `pantry_item`

```text
id
user_id
ingredient_id nullable
product_id nullable
variant_id nullable
input_quantity
input_unit_id
size_option nullable
gross_quantity nullable
gross_unit_id nullable
edible_quantity nullable
normalized_mass_g nullable
normalized_volume_ml nullable
count_quantity nullable
storage_location_id
expiry_date nullable
opened_at nullable
status: available/used/expired/discarded
conversion_status: resolved/estimated/missing/user_override
nutrition_status: resolved/incomplete/not_applicable
conversion_snapshot_json
nutrition_snapshot_json nullable
confidence
created_at
updated_at
```

### 4.11 `stock_movement`

```text
id
pantry_item_id
user_id
type: add/use/discard/adjust/cook/move
input_delta_quantity
input_unit_id
normalized_delta_mass_g nullable
normalized_delta_volume_ml nullable
reason nullable
linked_recipe_id nullable
linked_meal_item_id nullable
created_at
```

Use stock movement for auditability. Quantity adjustment without history makes it hard to explain why pantry changed.

### 4.12 `recipe`

```text
id
user_id
name
description nullable
photo_url nullable
servings
final_yield_mass_g nullable
source_url nullable
version
created_at
updated_at
```

### 4.13 `recipe_ingredient_line`

```text
id
recipe_id
ingredient_id nullable
product_id nullable
nested_recipe_id nullable
variant_id nullable
line_text nullable
input_quantity
input_unit_id
size_option nullable
normalized_mass_g nullable
normalized_volume_ml nullable
edible_mass_g nullable
edible_volume_ml nullable
conversion_status
conversion_snapshot_json
nutrition_snapshot_json nullable
line_order
is_optional
```

If nested recipe is allowed, enforce:

```text
No direct or indirect recipe cycle.
Set maximum nesting depth.
Snapshot or version nested recipe nutrition when used.
```

### 4.14 `recipe_nutrition_summary`

```text
recipe_id
recipe_version
total_nutrition_json
per_serving_json
per_100g_json nullable
calculated_at
source_version_hash
```

This is a denormalized cache. It can be recalculated from recipe lines, but cache improves UX.

### 4.15 `meal_plan`, `meal_plan_item`, `food_log`, `food_log_item`

Planning and logging should be separate.

```text
meal_plan:
id
user_id
date
meal_period
name nullable

meal_plan_item:
id
meal_plan_id
reference_type: recipe/ingredient/product
reference_id
planned_quantity
planned_unit_id
nutrition_preview_json nullable

food_log:
id
user_id
logged_at
meal_period

food_log_item:
id
food_log_id
reference_type: recipe/ingredient/product
reference_id nullable
input_quantity
input_unit_id
conversion_snapshot_json
nutrition_snapshot_json
source_snapshot_json nullable
```

### 4.16 `shopping_list` and `shopping_list_item`

```text
shopping_list:
id
user_id
name
status
created_at

shopping_list_item:
id
shopping_list_id
ingredient_id nullable
product_id nullable
requested_quantity
requested_unit_id
normalized_quantity nullable
source: manual/recipe/meal_plan/low_stock/expiry_suggestion
source_ref_id nullable
status: pending/bought/skipped
```

---

## 5. Calculation rules

### 5.1 Normalize input

```text
Input quantity + input unit
→ if mass: convert to grams
→ if volume: convert to ml
→ if count/package/serving: require food/product-specific measurement
→ if volume-to-mass needed: require density or measurement
→ apply edible yield if input is gross
→ return edible_mass_g or edible_volume_ml
```

### 5.2 Resolve priority

```text
1. User override exact match
2. Product-specific package/serving measurement
3. Ingredient + variant + unit + size measurement
4. Verified/imported portion data
5. Density-based estimate
6. Category estimate with low confidence
7. Missing conversion resolver
```

### 5.3 Scale nutrition

```text
per_100g:
  nutrient = edible_mass_g / 100 * nutrient_per_100g

per_100ml:
  nutrient = edible_volume_ml / 100 * nutrient_per_100ml

per_piece:
  if input is piece/count:
    nutrient = piece_count * nutrient_per_piece
  else:
    piece_count = edible_mass_g / piece_edible_weight_g
    nutrient = piece_count * nutrient_per_piece

per_serving:
  serving_count = resolved_amount / serving_size
  nutrient = serving_count * nutrient_per_serving
```

### 5.4 Dimension mismatch rules

```text
Nutrition per 100g + input only has ml
→ need density/measurement to get g

Nutrition per 100ml + input only has g
→ need density/measurement to get ml

No density/measurement
→ nutrition_status=incomplete, ask resolver
```

No silent fallback:

```text
1 g ≠ 1 ml except explicitly verified for the food/context.
```

### 5.5 Cooking yield and retention

Support in layers:

| Layer | Rule |
|---|---|
| Base | Sum ingredient nutrition by edible amount |
| Recipe yield | If final cooked weight is known, compute per 100g final recipe |
| Advanced | Apply cooking Yield Factor and nutrient-specific Retention Factor by method/source |

Do not require full cooking science model for basic recipe nutrition. But schema should allow final yield and calculation versioning.

---

## 6. UX-to-data mapping

| UX surface | Primary data written | Critical derived data |
|---|---|---|
| Add stock | `pantry_item`, `stock_movement` | normalized mass/volume, conversion snapshot |
| Conversion resolver | `user_measurement_override` or snapshot only | confidence, edible yield |
| Ingredient detail | `ingredient`, `ingredient_variant`, `nutrition_profile`, `ingredient_measurement` | usage refs, source confidence |
| Recipe builder | `recipe`, `recipe_ingredient_line` | line nutrition, recipe summary |
| Meal plan | `meal_plan`, `meal_plan_item` | planned nutrition preview, missing items |
| Food log | `food_log`, `food_log_item` | immutable nutrition snapshot |
| Shopping | `shopping_list_item` | source refs, normalized requested qty |

---

## 7. Target capability roadmap without phase lock

### Foundation capabilities

These are architectural prerequisites, regardless of implementation phase:

1. Food identity + alias + category.
2. Variant/state/form model.
3. Unit taxonomy with `requires_food_specific_conversion`.
4. Food-specific measurement with source/confidence/version.
5. Nutrition profile with source basis and provenance.
6. Pantry stock lot with location/expiry/input/normalized quantity.
7. Recipe lines with conversion snapshot.
8. Food log items with nutrition snapshot.
9. Missing conversion resolver.
10. Data quality badges.

### Workflow capabilities

1. Pantry priority list: expiring/low-stock/incomplete conversion.
2. Recipe builder with real-time nutrition preview.
3. Meal plan with daily/weekly nutrition preview.
4. Shopping list from recipe/meal/pantry/manual sources.
5. Stock movement history.
6. User custom conversions.
7. Product/barcode import with fallback manual label entry.

### Intelligence capabilities

1. OCR nutrition label.
2. Recipe import from URL/text with ingredient parsing.
3. Food photo recognition / pantry photo scan.
4. Smart substitutions.
5. Expiry prediction.
6. AI meal planning by macro/allergy/budget.
7. Cooking yield and retention factors.
8. Full micronutrient analytics.

Roadmap sequencing should be decided by product priority, not by current code constraints. The only hard dependency is that workflow/intelligence features should not bypass the measurement/nutrition engine.

---

## 8. Final target-state rules

1. Store what user entered; never overwrite original input quantity/unit.
2. Calculate nutrition from normalized edible amount.
3. Never use global conversion for contextual units.
4. State/form changes measurement and nutrition.
5. Pantry stock is separate from ingredient master.
6. Product/package is separate from generic ingredient.
7. Recipe line is a usage record, not master data.
8. Planned meal and consumed food log are separate concepts.
9. Historical logs must be immutable through snapshots.
10. User custom data must not overwrite verified/imported source data.
11. Missing conversion is a first-class UX resolver, not a generic error.
12. Approximate values must show `≈`, confidence and source.
13. Barcode/OCR/AI can accelerate input, but must still produce the same normalized measurement/nutrition objects.
14. Cooking yield/retention can improve accuracy, but base nutrition must work without it.
15. Every derived nutrition number should be explainable: input → conversion → edible amount → nutrition basis → result.

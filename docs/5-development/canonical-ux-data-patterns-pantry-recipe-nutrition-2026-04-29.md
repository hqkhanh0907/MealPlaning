# Canonical UX & Data Patterns — Pantry, Recipe, Meal, Nutrition

Ngày: 2026-04-29  
Mục tiêu: chuẩn hóa **pattern trải nghiệm người dùng (UX)** và **tổ chức cơ sở dữ liệu** cho app quản lý nguyên liệu, pantry, công thức/món ăn, bữa ăn, shopping list và tính dinh dưỡng theo đơn vị.

Tài liệu này tổng hợp từ:

- File audit/research hiện có: `docs/5-development/ingredient-add-edit-recipe-pantry-ux-research-2026-04-29.md`.
- Comparison note: `docs/5-development/ingredient-add-edit-recipe-pantry-ux-research-comparison-2026-04-29.md`.
- Research tổng hợp: `docs/5-development/meal-recipe-pantry-nutrition-ux-data-model-research-2026-04-29.md`.
- Source-of-truth Phase 1.5A: PRD F-02.5, `docs/3-design/data-model.md`, `docs/4-architecture/business-rules.md`, ADR Phase 1.5A và `docs/5-development/phase-1.5a-pantry-measurement.md`.
- Nội dung user cung cấp về recipe/pantry/nutrition patterns.

> **Evidence boundary:** Các link user cung cấp đã được kiểm tra nhanh ở mức HTTP status/title cho Paprika, Pantry Check, Cronometer, USDA FoodData Central, Open Food Facts, Edamam và FNDDS. Một số link bị 403 hoặc rate-limit khi kiểm tra tự động (Samsung Food, MyFitnessPal, FDC JSON spec). Vì vậy tài liệu này dùng chúng như pattern/reference input, không coi mọi số liệu cụ thể là fact đã verify độc lập. Các claim định lượng như sai lệch `200–400 calo` cần source/sample riêng trước khi đưa vào requirement chính thức.

---

## 1. Quyết định sản phẩm cốt lõi

### 1.1 System phải là shared measurement engine, không phải nhiều form rời rạc

Thiết kế đúng là:

```text
Pantry + Recipe + Meal + Food Log + Shopping
cùng dùng chung một Measurement Engine.
```

Measurement Engine phải làm 4 việc:

1. Convert input unit sang mass/volume/count bằng conversion theo từng ingredient/product/state/size.
2. Apply gross/edible yield khi input có phần không ăn được.
3. Scale nutrition theo đúng basis: per 100g, per 100ml, per piece, per serving.
4. Lưu conversion snapshot + nutrition snapshot ở các bản ghi transaction/history.

Nếu không có layer này, app có thể có UI đẹp nhưng nutrition sẽ sai khi user nhập `2 quả`, `1 cup`, `1 serving`, `1 chai`.

### 1.2 Ingredient không phải một dòng text

Tách tối thiểu 5 lớp:

| Lớp | Ý nghĩa | Entity canonical |
|---|---|---|
| Food identity | Thực phẩm/product là gì | `ingredient`, `product`, `barcode` |
| State/form | Trạng thái vật lý | `ingredient_variant` |
| Measurement | Cách đo và quy đổi | `unit`, `ingredient_measurement` |
| Nutrition | Dinh dưỡng và nguồn dữ liệu | `nutrition_profile`, `data_source` |
| User-owned stock/usage | User đang có/dùng/log bao nhiêu | `pantry_item`, `recipe_ingredient_line`, `meal_item`, `food_log_item`, `stock_movement` |

### 1.3 Rule không được vi phạm

```text
Không có global conversion cho piece/quả/trái/củ/tép/cup→gram/serving/pack/bottle.
```

Global chỉ an toàn cho:

- `kg → g`, `g → g`.
- `l → ml`, `ml → ml`.
- `tsp/tbsp/cup → ml` khi chỉ xử lý volume.

Nhưng khi nutrition basis là mass (`100g`) mà user nhập cooking volume (`cup/tbsp/tsp`) thì phải có:

- measurement theo ingredient/state/form, hoặc
- density đáng tin, hoặc
- user confirmation/override.

---

## 2. Pattern UX tốt nhất

### 2.1 Information architecture khuyến nghị

Với HealthMate AI hiện tại, không nhất thiết phải thêm 6 bottom tabs ngay. Nên giữ kiến trúc phù hợp app hiện có:

```text
Tổng quan / Today
├─ Nutrition summary hôm nay
├─ Bữa sáng/trưa/tối/phụ
├─ Pantry alert: sắp hết hạn / low stock
└─ Quick actions: thêm món, thêm vào kho, scan/search

Quản lý
├─ Món ăn / Công thức
├─ Kho nguyên liệu
├─ Thư viện nguyên liệu
└─ Product / barcode data (future)

Lịch ăn
├─ Ngày / Tuần
├─ Meal plan
└─ Food log

Shopping (MVP 2 hoặc section trong Quản lý)
├─ Danh sách mua sắm
└─ Missing ingredients từ recipe/meal plan/pantry low stock
```

Nếu app sau này lớn hơn, có thể tách thành tabs:

| Tab | Khi nào nên tách riêng |
|---|---|
| Today | Đã có food log/nutrition summary hằng ngày |
| Pantry | Pantry trở thành workflow hằng ngày, có expiry/low-stock nhiều |
| Recipes | Recipe library đủ lớn |
| Meal Plan | Có weekly planner thật sự |
| Shopping | Có grocery list từ nhiều nguồn |
| Profile/Data | Có custom data source/unit/nutrition goals |

### 2.2 Ba luồng chính

```text
Pantry-first:
Add stock → Resolve unit/conversion → Save pantry item → Suggest recipe / expiry alert

Recipe-first:
Create recipe → Add ingredient lines → Resolve missing conversions → Nutrition preview → Save recipe

Meal-first:
Plan/log meal → Pick recipes/products/ingredients → Nutrition summary → Optional pantry deduct / shopping suggestion
```

### 2.3 Pattern “search/scan trước, create sau”

UX:

```text
Tap + Add
→ Search first
→ Result groups:
   - Generic ingredients
   - Packaged products
   - User custom
→ Nếu không có: Create manually
```

Reason:

- Giảm duplicate.
- Cho user ưu tiên verified generic food cho nguyên liệu thô.
- Cho packaged food đi qua product/barcode flow riêng.

Phase split:

| Entry point | MVP / Phase 1.5A | Future |
|---|---|---|
| Local search | Có | Fuzzy ranking nâng cao |
| Manual input | Có | Smart defaults nâng cao |
| Pick from seed DB | Có | USDA sync/cache |
| Barcode scan | Model chuẩn bị, runtime defer | Phase 2 |
| OCR label | Không | Phase 2+ |
| Visual AI scan | Không | Phase 1.5B/Phase 2 |
| Recipe text import/NLP | Không | Advanced |

### 2.4 Pattern Pantry screen

Pantry không phải ingredient master. Pantry là stock/lot user đang có.

Priority hiển thị:

1. Sắp hết hạn.
2. Low stock.
3. Theo vị trí: Tủ lạnh / Tủ đông / Kệ bếp.
4. Theo category.
5. Theo confidence/problem: missing conversion, estimated, incomplete nutrition.

Card nên có:

```text
Tên + trạng thái/form
Input user thấy: 3 quả / 900ml / 1 gói
Normalized: ≈360g edible / 900ml
Location: Tủ lạnh
Expiry: còn 2 ngày
Confidence: verified / estimated / user custom
Problem badge: thiếu conversion / nutrition incomplete
```

Actions nên explicit trước, gesture sau:

| Action | MVP | Advanced |
|---|---|---|
| Adjust quantity | Có | Swipe shortcut |
| Mark used/discarded | Có | Stock movement reason |
| Move location | Có | Household multi-location |
| Add to recipe | Có | Suggested recipes |
| Add to shopping list | Có | Auto low-stock rule |
| Deduct when cooked | Defer | Lot selection + stock movement |

### 2.5 Pattern Add Stock wizard

```text
Step 1 — Find
Search local DB / choose product / manual fallback

Step 2 — Identify
Ingredient/product + state/form
Example: Tomato · raw/whole

Step 3 — Quantity & measurement
Amount + input unit + size option
Example: 3 quả · medium

Step 4 — Conversion resolver
Known → show resolved amount
Missing → ask one concrete question

Step 5 — Storage
Location + expiry/opened date + photo/note optional

Step 6 — Preview & save
Input, gross, edible, nutrition estimate, confidence, snapshot marker
```

Không nên show toàn bộ data fields trong một form dài. Form nên progressive, chỉ hiện field liên quan đến lựa chọn trước đó.

### 2.6 Pattern Recipe Builder

Recipe Builder phải là nơi ingredient line và nutrition preview gặp nhau.

```text
Create Recipe
→ Name / photo / servings
→ Add ingredient line
→ Search ingredient/product/nested recipe
→ Select state/form
→ Enter amount/unit
→ Resolve conversion
→ Preview line nutrition
→ Save line with conversion snapshot
→ Recipe total / per serving / per 100g if final yield exists
```

Recipe line cần hiển thị human-friendly:

```text
Cà chua · raw/whole
2 quả vừa → ≈240g edible
≈43 kcal · estimated
```

Không hiển thị technical fields như `quantity_per_unit`, `factor_to_basis`, `density_g_per_ml` trên main UI.

### 2.7 Pattern Missing Conversion Resolver

Đây là screen quan trọng nhất cho data quality.

UX rule:

```text
Không silent convert.
Không chặn user bằng lỗi chung chung.
Hỏi một câu cụ thể theo ingredient + unit + state.
```

Ví dụ:

```text
App cần biết 1 củ khoai tây của bạn khoảng bao nhiêu gram.
[Nhỏ] [Vừa] [Lớn] [Tự nhập]

Bạn đang nhập trọng lượng cả vỏ hay phần ăn được?
[Cả vỏ/xương] [Phần ăn được]

Lưu lựa chọn này?
[Chỉ dùng lần này] [Nhớ cho sau]
```

Resolver output:

| Case | Save behavior |
|---|---|
| User chọn preset verified/estimated | Save `measurement_id` + snapshot |
| User tự nhập weight, dùng một lần | Save snapshot only |
| User tự nhập và “nhớ cho sau” | Create/update user custom measurement |
| User bỏ qua | Allow save as incomplete only if context cho phép; nutrition preview marked incomplete |

### 2.8 Pattern Nutrition Preview

Preview nên xuất hiện ở mọi nơi có quantity input.

Minimum preview:

```text
Input: 2 quả cà chua vừa
Resolved: ≈240g edible
Nutrition: ≈43 kcal · P 2.1g · C 9.3g · F 0.5g
Source: USDA-derived · conversion estimated
```

Nếu gross/edible:

```text
Input: 1 trái dưa hấu vừa ≈5kg cả vỏ
Phần ăn được: khoảng 52% → ≈2.6kg ruột dưa
Nutrition tính trên phần ăn được
```

Nếu missing:

```text
Chưa tính chính xác dinh dưỡng vì thiếu quy đổi “1 pack = ?g/ml”.
Bạn có thể lưu item, nhưng app sẽ đánh dấu nutrition incomplete.
```

---

## 3. Database organization chuẩn

### 3.1 Nguyên tắc tổ chức

1. Master data không chứa stock user.
2. Pantry item không chứa nutrition master.
3. Unit global không chứa conversion phụ thuộc ingredient.
4. Usage/history row phải snapshot conversion/nutrition.
5. State/form phải nằm giữa ingredient và measurement/nutrition.
6. Product/barcode là nhánh riêng, không ép mọi packaged food thành generic ingredient.
7. User override không được overwrite verified/source data.

### 3.2 Entity map canonical

| Domain | Entity | Purpose |
|---|---|---|
| User | `user` | Profile, locale, unit preference, nutrition goals |
| Master food | `ingredient` | Generic food identity |
| Master food | `ingredient_category` | Category tree/grouping |
| Variant | `ingredient_variant` | raw/cooked/peeled/chopped/canned/dried/drained/boiled/roasted + form |
| Unit | `unit` | Unit dimension and safe global factors |
| Measurement | `ingredient_measurement` | Ingredient/product/state/size-specific conversion |
| Nutrition | `nutrition_profile` | Nutrition per 100g/100ml/piece/serving + source/confidence/version |
| Source | `data_source` | USDA/Open Food Facts/User/AI/Curated metadata |
| Product | `product` | Packaged/branded food |
| Product | `barcode` | Barcode → product mapping |
| Pantry | `storage_location` | Fridge/freezer/shelf/custom |
| Pantry | `pantry_item` | Stock lot user owns |
| Pantry | `stock_movement` | Add/use/discard/adjust audit trail |
| Recipe | `recipe` / runtime `dish` | Reusable dish/recipe |
| Recipe | `recipe_ingredient_line` / runtime `dish_ingredient` | Ingredient/product/nested recipe usage line |
| Meal | `meal` | Planned meal grouping |
| Meal | `meal_item` | Planned recipe/food entries |
| Log | `food_log` / `food_log_item` | Actual consumed entries |
| Shopping | `shopping_list`, `shopping_list_item` | Missing/low-stock/manual shopping |

### 3.3 Recommended table responsibilities

#### `ingredient`

Stores what the food is, not how much user owns.

Minimum:

```text
id
canonical_name
display_name
category_id
is_generic
created_by_user_id nullable
default_variant_id nullable
created_at
updated_at
```

For current HealthMate Phase 1 compatibility, direct canonical nutrition columns may remain on `ingredient`, but target architecture should treat `nutrition_profile` as source/provenance layer.

#### `ingredient_variant`

```text
id
ingredient_id
state: raw/cooked/peeled/chopped/canned/dried/frozen/drained/boiled/roasted
form: whole/diced/sliced/minced/powder/liquid/null
preparation_note
default_measurement_id
is_default
```

Use it when state/form changes measurement or nutrition.

#### `unit`

```text
id
code
name_vi
name_en
dimension: mass/volume/count/package/serving/recipe_serving
global_to_base_factor nullable
requires_food_specific_conversion boolean
```

Rules:

- `g`, `kg`, `ml`, `l` have safe global factors.
- `cup/tbsp/tsp` can have global volume-to-ml factor.
- `piece/serving/pack/bottle` require food-specific conversion.
- `cup/tbsp/tsp` require food-specific conversion if target basis is gram.

#### `ingredient_measurement`

Canonical replacement for older `ingredient_unit.factor_to_basis` / generic `IngredientUnitConversion`.

```text
id
ingredient_id nullable
product_id nullable
variant_id nullable
unit_id
from_quantity default 1
display_label
size_option: small/medium/large/custom/not_applicable
quantity_per_unit
quantity_unit_id: g/ml/count
applies_to: gross/edible
edible_yield_ratio nullable
is_default
is_approximate
confidence: verified/estimated/user_custom/ai_estimated
data_source_id
version
created_by_user_id nullable
created_at
updated_at
```

Important: `quantity_per_unit` should not be named `to_mass_g` only, because some foods/products resolve to ml.

Examples:

```text
Tomato raw whole medium piece:
1 piece → 120 g, applies_to=edible, confidence=estimated

Watermelon raw whole medium piece:
1 piece → 5000 g, applies_to=gross, edible_yield_ratio=0.52

Milk cup:
1 cup → 240 ml, applies_to=edible

Flour cup:
1 cup → 120 g, applies_to=edible, is_approximate=1
```

#### `nutrition_profile`

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
confidence: verified/estimated/user_custom/imported/ai_estimated
version
is_authoritative
```

Do not force everything to per 100g at source ingestion. Store source basis, then normalize during calculation when conversion is available.

#### `pantry_item`

Pantry item is stock lot.

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
conversion_snapshot_json
nutrition_snapshot_json nullable
confidence
created_at
updated_at
```

#### `stock_movement`

Do not only overwrite pantry quantity. Keep movement history.

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
recipe_id nullable
meal_id nullable
created_at
```

#### `recipe` / `dish`

Runtime may still use `dish`; UI can call it “Món ăn/Công thức”. Avoid runtime rename unless planned.

```text
id
user_id
name
photo_url nullable
servings
final_yield_mass_g nullable
source_url nullable
version
created_at
updated_at
```

#### `recipe_ingredient_line` / `dish_ingredient`

```text
id
recipe_id/dish_id
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
conversion_snapshot_json
nutrition_snapshot_json nullable
line_order
is_optional
conversion_status
```

Recipe nesting is valuable but must guard against cycles:

```text
A recipe cannot include itself directly or indirectly.
Set recursion depth limit and cycle detection before saving nested_recipe_id.
```

#### `meal`, `meal_item`, `food_log_item`

Separate planned meals from actual logs.

```text
meal: planned grouping by date/meal_type
meal_item: planned recipe/product/ingredient with serving multiplier
food_log_item: actual consumed record with immutable nutrition_snapshot_json
```

#### `shopping_list_item`

```text
id
shopping_list_id
ingredient_id nullable
product_id nullable
requested_quantity
requested_unit_id
normalized_quantity nullable
source: manual/recipe/meal_plan/low_stock/expiry_suggestion
status: pending/bought/skipped
```

---

## 4. Calculation rules

### 4.1 Normalize amount

```text
resolve(input_quantity, input_unit, ingredient/product, variant, size_option)
→ measurement candidate
→ normalized gross/edible mass or volume
```

Resolution priority:

1. Exact user custom measurement for ingredient/product + variant + unit + size.
2. Curated/verified ingredient measurement.
3. Product package/serving measurement.
4. Density-based conversion with source/confidence.
5. Category/default estimate only if UI marks low confidence.
6. Missing conversion flow.

### 4.2 Apply gross/edible

```text
if applies_to == 'gross':
  edible_amount = gross_amount * edible_yield_ratio
else:
  edible_amount = amount
```

Do not apply edible yield twice. If user selected already-peeled/boneless/drained variant, measurement should usually be `applies_to='edible'`.

### 4.3 Scale nutrition

```text
per_100g:
  nutrient = edible_mass_g / 100 * nutrient_per_100g

per_100ml:
  nutrient = edible_volume_ml / 100 * nutrient_per_100ml

per_piece:
  nutrient = piece_count * nutrient_per_piece
  or piece_count = edible_mass_g / average_piece_edible_mass_g

per_serving:
  serving_count = normalized_amount / serving_size
  nutrient = serving_count * nutrient_per_serving
```

If nutrition basis and resolved amount dimension mismatch:

```text
per_100g + only ml available → need density/measurement to gram
per_100ml + only gram available → need density/measurement to ml
```

No silent `1g = 1ml` fallback.

### 4.4 Snapshot rules

Snapshot when creating or saving:

| Table | Snapshot requirement |
|---|---|
| `pantry_item` | conversion snapshot required; nutrition snapshot optional depending use |
| `stock_movement` | movement quantity snapshot required |
| `recipe_ingredient_line` | conversion snapshot required; nutrition snapshot recommended if recipe version needs immutability |
| `meal_item` | nutrition snapshot if planned nutrition should not drift |
| `food_log_item` | nutrition snapshot required |
| `shopping_list_item` | normalized quantity optional; source reference useful |

### 4.5 Cooking yield / retention

Yield Factor (hệ số hao hụt khối lượng) và Retention Factor (hệ số bảo lưu dưỡng chất) là scientifically correct but advanced.

Recommendation:

- MVP: support optional `final_yield_mass_g` for recipe to compute per 100g cooked result.
- Advanced: nutrient-specific retention factors by cooking method.
- Do not block Phase 1.5A on full retention model.

---

## 5. UX/Data mapping by screen

| Screen | UX object | Writes/reads |
|---|---|---|
| Pantry List | Stock cards by expiry/location | `pantry_item`, `storage_location`, `stock_movement` |
| Add Stock Wizard | Find → identify → quantity → storage → preview | `ingredient`, `product`, `ingredient_variant`, `ingredient_measurement`, `pantry_item` |
| Conversion Resolver | Missing unit conversion question | snapshot only or `ingredient_measurement` user custom |
| Ingredient Detail | Nutrition, common units, usage | `ingredient`, `ingredient_variant`, `nutrition_profile`, `ingredient_measurement`, usage refs |
| Recipe Builder | Ingredient lines + real-time total | `recipe`, `recipe_ingredient_line`, measurement resolver |
| Meal Plan | Weekly/day planned meals | `meal`, `meal_item`, recipe summary |
| Food Log | Actual consumed record | `food_log_item` with nutrition snapshot |
| Shopping | Missing/low stock list | `shopping_list`, `shopping_list_item` |

---

## 6. MVP roadmap focused on UX + DB quality

### MVP 1 — Measurement-safe pantry + recipe foundation

Must have:

1. Ingredient master + category.
2. Ingredient variant/state/form.
3. Unit table with `requires_food_specific_conversion`.
4. Ingredient measurement per ingredient/product/state/size/unit.
5. Nutrition profile or compatibility canonical nutrition columns.
6. Pantry item with location, expiry, input quantity, normalized amount, conversion snapshot.
7. Recipe builder with ingredient lines, resolver, line preview, recipe total/per serving.
8. Missing conversion resolver.
9. Confidence badges: verified/estimated/user custom/incomplete.
10. Manual custom ingredient/product fallback.

Should defer:

- Runtime barcode scan.
- OCR label.
- Visual AI scan.
- Auto-decrement pantry when cooking.
- Full shopping automation.
- Full cooking retention model.
- Multi-user household pantry.

### MVP 2 — Daily workflow improvement

1. Shopping list from missing recipe/meal plan ingredients.
2. Suggested recipes from expiring pantry items.
3. User default conversions / override table.
4. Stock movement history UI.
5. Basic barcode packaged food import.
6. Recipe nesting with cycle guard.
7. Duplicate ingredient merge/alias management.

### Advanced

1. OCR nutrition label.
2. Recipe import from URL/text with NLP.
3. USDA/Open Food Facts sync/cache strategy.
4. Photo recognition pantry/fridge.
5. Smart substitutions.
6. Cooking yield + retention factor model.
7. Full micronutrients.
8. AI meal planning by macro/allergy/budget.

---

## 7. Final canonical rule set

1. User input is sacred: store input quantity/unit as entered.
2. Calculation uses normalized edible amount.
3. Nutrition uses source basis; normalize only when conversion is trustworthy.
4. No global conversion for contextual units.
5. Ingredient state/form affects both measurement and nutrition.
6. Pantry is stock/lot, not ingredient master.
7. Recipe line is usage, not master data.
8. Food log history must be immutable via nutrition snapshot.
9. User custom data must not overwrite verified source data.
10. Missing conversion must trigger one concrete UX question, not silent fallback.
11. Approximate values must show `≈` and confidence/source.
12. Advanced AI/barcode/cooking-retention features must not distort MVP schema; schema should prepare for them but runtime can defer.

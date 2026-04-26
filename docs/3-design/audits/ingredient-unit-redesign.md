# Ingredient Unit Redesign — Phase 1 Proposal

**Status:** DRAFT — chờ user review
**Date:** 2026-04-25
**Author:** AI audit (Principal Architect role)
**Decisions locked by user:**
1. Giữ `UNIQUE(dish_id, ingredient_id)` constraint
2. Multi-unit support **NGAY trong Phase 1** (không defer Phase 2)
3. Cooking unit (muỗng/nhúm/chén) **full support qua schema** (Phương án C)

---

## 0. Bối cảnh: 6 phương án đã cân nhắc

Trước khi đi vào đề xuất chi tiết, dưới đây là 6 phương án đã được phân tích để bạn có context về **vì sao chọn Phương án C** (full multi-unit) cho Phase 1.

### 0.1 Phương án A — Status Quo (giữ nguyên Phase 1 hiện tại)

**Ý tưởng:** Giữ enum 3 giá trị `{g, ml, piece}`, conversion `grams_per_unit XOR ml_per_unit` per ingredient.

**Data model:** Như schema hiện tại, không đổi gì.

**User nhập:** Dropdown 3 option. Muỗng/nhúm → user tự Google chuyển sang ml.

**User xem:** `{amount_value} {amount_unit}` y nguyên (hiển thị "1 piece" generic).

**Conversion:** Chỉ `piece → basis = amount × grams_per_unit (hoặc ml_per_unit)`.

**9 case test:**
| Case | Kết quả |
|---|---|
| 200g thịt bò | ✅ |
| 500ml sữa | ✅ |
| 2 quả trứng | ✅ (nhưng hiển thị "2 piece") |
| 1 muỗng canh dầu olive | ❌ REJECT |
| 1 muỗng cà phê muối | ❌ REJECT |
| 1 củ hành tây | ✅ |
| 3 tép tỏi | ⚠️ Mơ hồ |
| 1 bó rau | ❌ REJECT |
| 1 nhúm tiêu | ❌ REJECT |

**Ưu:** 0 ngày dev. Đơn giản. Đủ cho 20 món seed.
**Nhược:** 4/9 case reject. "piece" không có label tiếng Việt. Khó scale.
**Performance:** Tối ưu — không thêm JOIN.
**Phù hợp:** MVP cực gấp.

---

### 0.2 Phương án B — Status Quo + `piece_label` (minimal patch)

**Ý tưởng:** Giữ schema chính, chỉ thêm 1 field `piece_label TEXT` để giải quyết "piece" semantic ambiguous.

**Data model:**
```sql
ALTER TABLE ingredient ADD COLUMN piece_label TEXT;
-- Trứng: piece_label='quả', grams_per_unit=50
-- Hành: piece_label='củ', grams_per_unit=110
-- Tỏi:  piece_label='tép', grams_per_unit=3
```

**User nhập:** Dropdown hiển thị `piece_label` thay vì "piece".
**User xem:** "2 quả" thay vì "2 piece".
**Conversion:** Như Phase 1 hiện tại.

**9 case test:** Giống A, "3 tép tỏi" hiển thị đúng "tép". Vẫn không support muỗng/nhúm.

**Ưu:** 1-2 ngày dev. 1 ALTER TABLE. Reversible.
**Nhược:** Không support cooking unit. Vẫn 4/9 case reject.
**Performance:** Như A.
**Phù hợp:** Quick win nếu muốn ship Phase 1 cực nhanh.

---

### 0.3 Phương án C — Multi-Unit Lookup Table (CHỌN CHO PHASE 1) ⭐

**Ý tưởng:** Tách `unit` thành lookup table và `ingredient_unit` thành junction table 1-to-many. Mỗi ingredient có thể có nhiều entry unit, mỗi unit có conversion riêng.

**Data model:** 2 table mới (`unit`, `ingredient_unit`) + ingredient/dish_ingredient simplified. **Chi tiết đầy đủ ở §2 bên dưới.**

**User nhập:** Dropdown động — list unit khả dụng cho từng ingredient. VD chọn "Tỏi" → `[tép, củ, g]`.
**User xem:** "1 muỗng canh bơ", "3 tép tỏi", "1 nhúm tiêu ≈".
**Conversion:** Decision tree 7 case (xem §3.1) — global volume × density curated, count/cooking → ingredient_unit factor.

**9 case test:**
| Case | Kết quả |
|---|---|
| 200g thịt bò | ✅ |
| 500ml sữa | ✅ |
| 2 quả trứng | ✅ (display "quả") |
| 1 muỗng canh dầu olive | ✅ (factor 13.5g curated) |
| 1 muỗng cà phê muối | ✅ (factor 6g curated) |
| 1 củ hành tây | ✅ |
| 3 tép tỏi | ✅ |
| 1 bó rau muống | ✅ |
| 1 nhúm tiêu | ✅ (approximate flag) |

**9/9 case ✅**

**Ưu:** Triệt để. Multi-unit per ingredient. I18n-ready. Centralized unit registry. Type system rõ.
**Nhược:** Schema phức tạp hơn (+2 table). Migration phức tạp. AI prompt phải đổi. Repository thêm JOIN khi insert.
**Performance:** Insert +1 SELECT (negligible). Read VIEW thêm 1 JOIN — fine cho scale Phase 1-3.
**Implementation:** ~14-15 ngày dev.
**Phù hợp:** Long-term. **Đã chọn cho Phase 1 theo quyết định user (Q3 = c).**

---

### 0.4 Phương án D — EAV (Entity-Attribute-Value)

**Ý tưởng:** Mỗi ingredient có thể tạo bất kỳ unit custom nào dưới dạng key-value. Schema cực kỳ flexible.

**Data model:**
```sql
CREATE TABLE ingredient_attribute (
  ingredient_id TEXT,
  attr_key      TEXT,    -- 'unit:hộp', 'unit:ly', 'cost:per_g'
  attr_value    TEXT,    -- '220', '5000'
  PRIMARY KEY(ingredient_id, attr_key)
);
```

**Ưu:** Tối đa flexibility. Không cần migration khi thêm khái niệm mới.
**Nhược:**
- Anti-pattern cho domain ổn định như nutrition
- Mất type safety, mọi field thành string
- Validation phải làm hết ở app layer
- Query phức tạp (cần pivot)
- Performance kém hơn relational
- Khó index

**Phù hợp:** B2B SaaS hyper-customizable. **KHÔNG** khuyến nghị cho HealthMate AI.

---

### 0.5 Phương án E — Pure Density-Based

**Ý tưởng:** Mọi ingredient có `density (g/ml)`. Mọi unit normalize về `g` qua `volume × density`.

**Data model:**
```sql
ALTER TABLE ingredient ADD COLUMN density_g_per_ml REAL;
```

User nhập `1 tbsp` → tra `tbsp = 14.79ml` → `× density` → normalized_g.

**Ưu:** Volume ↔ mass conversion automatic. Đơn giản với liquid.
**Nhược:**
- Density variance lớn cho bột/đường/muối (packed vs sifted) → sai 10-30%
- Count (trứng/củ/quả) không có density → vẫn cần fallback
- USDA không phải lúc nào cũng có density data
- Realworld 1 tbsp muối ≈ 6g (curated) khác với `14.79ml × 2.16 = 31g` (lý thuyết) → density không phải single source of truth cho cooking

**Phù hợp:** Lab/scientific. **KHÔNG** khuyến nghị cho cooking app.

---

### 0.6 Phương án F — Hybrid (Phase 1 = B, Phase 2 = C)

**Ý tưởng:** Phase 1 ship với patch nhỏ (B: thêm `piece_label`). Phase 2 evolve sang C qua migration backward-compatible.

**Migration path:**
```
V1 (Phase 1): + piece_label column
V2 (Phase 2): tạo unit, ingredient_unit; backfill từ old fields;
              dish_ingredient.unit_id (nullable)
V3 (Phase 2.5): drop old fields; unit_id NOT NULL
```

**Ưu:** Best balance giữa speed và long-term. Phase 1 không lock decision sai.
**Nhược:** 2 lần migration → cần discipline test. Cooking unit defer Phase 2.
**Phù hợp:** Solo dev với timeline gấp + muốn cooking unit Phase 2.

---

### 0.7 So sánh tổng hợp

| Tiêu chí | A | B | **C** ⭐ | D | E | F |
|---|---|---|---|---|---|---|
| Domain accuracy | 6/10 | 7/10 | **9/10** | 6/10 | 7/10 | 9/10 |
| User UX (input) | 4/10 | 5/10 | **9/10** | 7/10 | 7/10 | 8→9/10 |
| Scalability | 6/10 | 6/10 | **9/10** | 7/10 | 7/10 | 9/10 |
| Performance | 10/10 | 10/10 | **8/10** | 6/10 | 9/10 | 9/10 |
| Flexibility | 4/10 | 5/10 | **9/10** | 10/10 | 6/10 | 9/10 |
| Implementation cost | 0d | 1-2d | **14-15d** | 3w+ | 1w | 1-2d + 1-2w |
| Long-term maintain | 6/10 | 7/10 | **9/10** | 4/10 | 7/10 | 9/10 |
| Cooking unit support | ❌ | ❌ | **✅** | ✅ | ⚠️ | P2 ✅ |
| 9/9 case pass | 5/9 | 5/9 | **9/9** | 9/9 | 7/9 | 5/9 → 9/9 |

### 0.8 Lý do chốt Phương án C cho Phase 1

User đã quyết định ở turn trước (Q3 = c "Full support qua schema"). Phân tích bổ sung:

1. **Đáp ứng 9/9 use case Việt** — không user nào bị reject khi nhập muỗng/nhúm/tép.
2. **Schema đúng từ đầu** — không phải migration V2/V3 sau (như Phương án F).
3. **Trade-off chấp nhận được** — +5 ngày dev so với A/B nhưng tránh tech debt.
4. **Implementation chưa start** — đây là thời điểm rẻ nhất để chọn schema phức tạp.
5. **20 món seed sẽ hưởng lợi ngay** — recipe Việt thực tế dùng muỗng/nhúm/tép rất nhiều, không bị "pseudo-gram" giả tạo.

---

## 1. Tóm tắt thay đổi

Phase 1 sẽ chuyển từ schema "3-enum cứng" sang schema "lookup table" để hỗ trợ:
- Đa đơn vị per ingredient (bơ có thể nhập gram, ml, hoặc muỗng canh)
- Cooking unit Việt (muỗng canh, muỗng cà phê, chén, nhúm, tép, củ, bó, lát…)
- I18n-ready (mỗi unit có display name VN + EN)
- Approximate flag cho unit mơ hồ (1 nhúm tiêu)

Trade-off chấp nhận:
- Schema phức tạp hơn (+2 table, +1 junction)
- Repository code +1 lookup khi insert/update dish_ingredient
- Seed data lớn hơn (cần seed `unit` + `ingredient_unit`)
- Timeline Phase 1 +1 đến 2 tuần

---

## 2. Schema mới (chi tiết)

### 2.1 Table `unit` — global registry

Đăng ký tất cả unit hệ thống biết đến.

```sql
CREATE TABLE unit (
  id              TEXT PRIMARY KEY,           -- 'g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'cup', 'piece', 'pinch', 'bunch'
  display_name_vi TEXT NOT NULL,              -- 'gram', 'mililit', 'muỗng canh', 'nhúm'
  display_name_en TEXT NOT NULL,              -- 'gram', 'milliliter', 'tablespoon', 'pinch'
  short_name_vi   TEXT NOT NULL,              -- 'g', 'ml', 'muỗng canh', 'muỗng cf', 'nhúm'
  unit_type       TEXT NOT NULL CHECK (unit_type IN ('mass','volume','count','cooking')),
  is_global       INTEGER NOT NULL DEFAULT 1, -- 1 = factor cố định toàn hệ; 0 = factor phụ thuộc ingredient
  base_factor_g   REAL,                       -- factor sang gram (chỉ khi is_global=1 và type='mass')
  base_factor_ml  REAL,                       -- factor sang ml (chỉ khi is_global=1 và type='volume')
  is_approximate  INTEGER NOT NULL DEFAULT 0, -- 1 = unit mơ hồ (nhúm/ít)
  display_order   INTEGER NOT NULL DEFAULT 0  -- thứ tự trong dropdown
);

CREATE INDEX idx_unit_type ON unit(unit_type);
```

**Seed data đề xuất (Phase 1):**

| id | display_name_vi | type | is_global | base_factor_g | base_factor_ml | is_approximate |
|---|---|---|---|---|---|---|
| `g` | gram | mass | 1 | 1 | NULL | 0 |
| `kg` | kilogram | mass | 1 | 1000 | NULL | 0 |
| `ml` | mililit | volume | 1 | NULL | 1 | 0 |
| `l` | lít | volume | 1 | NULL | 1000 | 0 |
| `tbsp` | muỗng canh | volume | 1 | NULL | 15 | 0 |
| `tsp` | muỗng cà phê | volume | 1 | NULL | 5 | 0 |
| `cup` | chén | volume | 1 | NULL | 240 | 0 |
| `piece` | cái | count | 0 | NULL | NULL | 0 |
| `pinch` | nhúm | cooking | 0 | NULL | NULL | 1 |
| `bunch` | bó | cooking | 0 | NULL | NULL | 0 |
| `slice` | lát | cooking | 0 | NULL | NULL | 0 |
| `clove` | tép | cooking | 0 | NULL | NULL | 0 |

> **Lưu ý:** `tbsp/tsp/cup` là volume **toàn cục** (1 tbsp luôn = 15ml bất kể ingredient gì). Nhưng khi cần chuyển sang gram thì phải qua ingredient (vì cần density). Logic conversion sẽ xử lý ở §3.

### 2.2 Table `ingredient_unit` — junction (ingredient × unit)

Khai báo ingredient X có thể nhập theo unit Y, với conversion factor riêng.

```sql
CREATE TABLE ingredient_unit (
  ingredient_id   TEXT NOT NULL REFERENCES ingredient(id) ON DELETE CASCADE,
  unit_id         TEXT NOT NULL REFERENCES unit(id),
  factor_to_basis REAL NOT NULL,              -- 1 unit này = ? basis của ingredient
  is_default      INTEGER NOT NULL DEFAULT 0, -- duy nhất 1 unit có is_default=1 per ingredient
  display_label   TEXT,                       -- override label, vd 'tép' cho clove của tỏi
  PRIMARY KEY (ingredient_id, unit_id)
);

CREATE INDEX idx_ingredient_unit_ingredient ON ingredient_unit(ingredient_id);
CREATE UNIQUE INDEX idx_ingredient_unit_default
  ON ingredient_unit(ingredient_id) WHERE is_default = 1;
```

**Ví dụ seed cho 1 ingredient — Trứng gà** (basis: 100g):

| ingredient_id | unit_id | factor_to_basis | is_default | display_label |
|---|---|---|---|---|
| egg | g | 1 | 0 | NULL |
| egg | piece | 50 | 1 | "quả" |

**Ví dụ — Bơ** (basis: 100g):

| ingredient_id | unit_id | factor_to_basis | is_default | display_label |
|---|---|---|---|---|
| butter | g | 1 | 1 | NULL |
| butter | tbsp | 14 | 0 | NULL |
| butter | tsp | 5 | 0 | NULL |

**Ví dụ — Tỏi** (basis: 100g):

| ingredient_id | unit_id | factor_to_basis | is_default | display_label |
|---|---|---|---|---|
| garlic | g | 1 | 0 | NULL |
| garlic | clove | 3 | 1 | "tép" |
| garlic | piece | 30 | 0 | "củ" |

> Tỏi vừa có `clove` (tép) vừa có `piece` (cả củ) — multi-unit phát huy ở đây.

**Ví dụ — Tiêu** (basis: 100g):

| ingredient_id | unit_id | factor_to_basis | is_default | display_label |
|---|---|---|---|---|
| pepper | g | 1 | 1 | NULL |
| pepper | tsp | 2.3 | 0 | NULL |
| pepper | pinch | 0.3 | 0 | NULL |

### 2.3 Table `ingredient` — đơn giản hoá

GỠ các field unit-related khỏi ingredient (đẩy hết sang `ingredient_unit`):

```sql
CREATE TABLE ingredient (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL CHECK (category IN (...)),
  nutrition_basis_unit     TEXT NOT NULL CHECK (nutrition_basis_unit IN ('g', 'ml')),
  nutrition_basis_quantity REAL NOT NULL DEFAULT 100,
  calories          REAL NOT NULL,
  protein           REAL NOT NULL DEFAULT 0,
  carbs             REAL NOT NULL DEFAULT 0,
  fat               REAL NOT NULL DEFAULT 0,
  fiber             REAL NOT NULL DEFAULT 0,
  -- ❌ default_entry_unit  → moved to ingredient_unit.is_default
  -- ❌ grams_per_unit      → moved to ingredient_unit.factor_to_basis
  -- ❌ ml_per_unit         → moved to ingredient_unit.factor_to_basis
  source            TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai', 'db')),
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT
);
```

### 2.4 Table `dish_ingredient` — thay `amount_unit` bằng `unit_id`

```sql
CREATE TABLE dish_ingredient (
  id                TEXT PRIMARY KEY,
  dish_id           TEXT NOT NULL REFERENCES dish(id) ON DELETE CASCADE,
  ingredient_id     TEXT NOT NULL REFERENCES ingredient(id) ON DELETE RESTRICT,
  amount_value      REAL NOT NULL,
  unit_id           TEXT NOT NULL REFERENCES unit(id),  -- ❗ thay amount_unit
  normalized_amount REAL NOT NULL,                       -- vẫn lưu, đã quy về basis của ingredient
  UNIQUE(dish_id, ingredient_id)                         -- ✅ giữ theo quyết định Q1
);
```

### 2.5 VIEW `dish_with_totals` — không đổi

VIEW vẫn dùng `normalized_amount / nutrition_basis_quantity × macro` như cũ. Vì `normalized_amount` đã được normalize đúng basis trước khi insert.

---

## 3. Logic conversion mới

### 3.1 Decision tree khi insert/update `dish_ingredient`

Cho input `(ingredient_id, amount_value, unit_id)`:

```
1. Lookup unit từ table `unit`:
   unit_type, is_global, base_factor_g, base_factor_ml, is_approximate

2. Lookup ingredient từ table `ingredient`:
   nutrition_basis_unit (g hoặc ml)

3. Compute normalized_amount theo case:

   Case A — unit là 'g' và basis là 'g'  → normalized = amount_value × 1
   Case B — unit là 'ml' và basis là 'ml' → normalized = amount_value × 1

   Case C — unit là global mass (kg) và basis là 'g'
     → normalized = amount_value × base_factor_g
     VD: 0.5 kg thịt → 500g

   Case D — unit là global volume (l, tbsp, tsp, cup) và basis là 'ml'
     → normalized = amount_value × base_factor_ml
     VD: 1 tbsp sữa → 15ml

   Case E — unit là global mass và basis là 'ml' (mismatch type)
     → ❌ REJECT — không có density per ingredient ở Phase 1
     VD: nhập 100g sữa với basis 'ml' → reject

   Case F — unit là global volume và basis là 'g' (vd nhập "1 tbsp bơ", bơ basis = 'g')
     → Lookup ingredient_unit(ingredient_id, unit_id) → lấy factor_to_basis
     → normalized = amount_value × factor_to_basis
     → Nếu không có row trong ingredient_unit → ❌ REJECT
     VD: 1 tbsp bơ → factor 14g → normalized = 14g

   Case G — unit là count/cooking ('piece', 'clove', 'pinch', 'bunch', 'slice')
     → BẮT BUỘC tra ingredient_unit(ingredient_id, unit_id)
     → normalized = amount_value × factor_to_basis
     → Nếu không có → ❌ REJECT với InvalidDishIngredientUnitError
     VD: 3 tép tỏi → factor 3 → normalized = 9g
```

### 3.2 Validation rules

- Insert dish_ingredient: app **PHẢI** gọi resolver function `resolveUnit(ingredientId, unitId, amountValue)` → returns `{ normalized_amount }` hoặc throw error có context.
- AI lookup output: nếu AI trả `unit_id` không có trong table `unit` → reject + log.
- Approximate unit (pinch): vẫn cho lưu, nhưng UI hiển thị icon ≈ và nutrition contribution có disclaimer "ước lượng".

---

## 4. UX — User nhập dữ liệu

### 4.1 Dropdown unit khi thêm ingredient vào dish

Khi user chọn ingredient X trong dish edit form:

1. Query `ingredient_unit WHERE ingredient_id = X` → list của các unit X có thể nhập.
2. Sắp xếp: `is_default = 1` đầu tiên, sau đó theo `unit.display_order`.
3. Hiển thị dropdown với `display_label` (nếu có) hoặc `unit.short_name_vi`.

**Ví dụ chọn "Tỏi":**
```
[ Số lượng: ___ ] [ Đơn vị: ▼ ]
                    ├─ tép  (default)
                    ├─ củ
                    └─ g
```

**Ví dụ chọn "Bơ":**
```
[ Số lượng: ___ ] [ Đơn vị: ▼ ]
                    ├─ g  (default)
                    ├─ muỗng canh
                    └─ muỗng cà phê
```

### 4.2 Quản lý ingredient form

Khi user tạo / sửa ingredient, ngoài form chính (tên, category, macro) có thêm section "Đơn vị nhập":

```
+-- Đơn vị có thể nhập --------------------------+
|  ☑ gram (g)            [default: ●]           |
|  ☑ muỗng canh (tbsp)   1 muỗng = [14] g       |
|  ☑ muỗng cà phê (tsp)  1 muỗng = [5] g        |
|  ☐ muỗng (cup)                                 |
|  [+ Thêm đơn vị khác]                          |
+------------------------------------------------+
```

User có thể bật/tắt unit, chỉnh factor, set default.

### 4.3 AI auto-fill flow

AI trả về:
```json
{
  "ingredients": [
    { "name": "Bơ", "amount_value": 2, "unit_id": "tbsp" },
    { "name": "Trứng", "amount_value": 3, "unit_id": "piece" }
  ]
}
```

App tự lookup `ingredient_unit` để tính normalized. Nếu thiếu → fallback `g/ml`.

---

## 5. UX — User xem dữ liệu

### 5.1 Hiển thị primary

Trong dish detail, recipe card:
```
• Bơ — 2 muỗng canh
• Trứng — 3 quả
• Tỏi — 5 tép
• Tiêu — 1 nhúm ≈
```

Với:
- `display_label` (nếu có) ưu tiên hơn `unit.short_name_vi`
- Icon ≈ nếu `unit.is_approximate = 1`

### 5.2 Hiển thị alternative (tooltip / hover)

Hover vào "2 muỗng canh" → tooltip "≈ 28g".
Hover vào "3 quả trứng" → tooltip "= 150g".

(Phase 1.5 polish, không block ship.)

---

## 6. Migration plan

Vì Phase 1 chưa start coding (memory ghi rõ), không cần data migration runtime. Nhưng cần update các artifact:

1. **schema.ts** — rewrite theo §2
2. **docs/3-design/data-model.md** — update §4.1, §4.2, §4.3 + thêm §4.0a `unit`, §4.0b `ingredient_unit`
3. **docs/4-architecture/business-rules.md** — rewrite RULE-DI-NORM, thêm RULE-UNIT-LOOKUP, RULE-UNIT-RESOLVE
4. **docs/2-requirements/prd.md** — update F-01 (ingredient form có unit list), F-02 (dish form dropdown unit)
5. **docs/5-ai/ai-strategy.md** — đổi prompt: AI trả `unit_id` thay vì `amount_unit`
6. **docs/5-development/phase-1-management.md** — update §4.3 Nutrition Canonical Model + add §4.3a Unit Registry
7. **Seed data scripts** — `scripts/seed/build-vietnamese-core.ts` cần generate 3 file:
   - `units.json` — ~12 unit global
   - `ingredients.json` — không còn grams_per_unit/ml_per_unit
   - `ingredient_units.json` — junction data cho 20 món seed
   - `dishes.json` — dish_ingredient dùng `unit_id`

---

## 7. Test cases (acceptance)

App phải xử lý đúng 9 case sau:

| Input | Expected normalized | Expected display |
|---|---|---|
| 200g thịt bò | 200g | "200g" |
| 500ml sữa | 500ml | "500ml" |
| 2 quả trứng | 100g | "2 quả" |
| 1 muỗng canh dầu olive | 13.5g (curated) | "1 muỗng canh" |
| 1 muỗng cà phê muối | 6g (curated) | "1 muỗng cà phê" |
| 1 củ hành tây | 110g | "1 củ" |
| 3 tép tỏi | 9g | "3 tép" |
| 1 bó rau muống | 200g | "1 bó" |
| 1 nhúm tiêu | 0.3g (approximate) | "1 nhúm ≈" |

Tất cả đều chấp nhận, không reject.

---

## 8. Tasks Phase 1 (chi tiết)

| # | Task | File | Effort |
|---|---|---|---|
| T1 | Cập nhật `data-model.md` với §4.0a unit, §4.0b ingredient_unit, §4.1 ingredient simplified, §4.3 dish_ingredient với unit_id | `docs/3-design/data-model.md` | 0.5d |
| T2 | Cập nhật `business-rules.md` — rewrite RULE-DI-NORM, thêm RULE-UNIT-* | `docs/4-architecture/business-rules.md` | 0.5d |
| T3 | Cập nhật `prd.md` F-01, F-02 | `docs/2-requirements/prd.md` | 0.3d |
| T4 | Cập nhật `ai-strategy.md` prompt schema | `docs/5-ai/ai-strategy.md` | 0.3d |
| T5 | Cập nhật `phase-1-management.md` §4.3 | `docs/5-development/phase-1-management.md` | 0.3d |
| T6 | Rewrite `schema.ts` — thêm 2 table mới, rewrite ingredient + dish_ingredient | `src/app/core/services/database/schema.ts` | 0.5d |
| T7 | TypeScript model — `Unit.ts`, `IngredientUnit.ts`, update `Ingredient.ts`, `DishIngredient.ts` | `src/app/core/models/` | 0.5d |
| T8 | Resolver function `resolveUnit(ingredientId, unitId, amountValue)` | `src/app/core/services/unit-resolver.ts` | 1d |
| T9 | Repository — `IngredientRepository`, `IngredientUnitRepository`, `UnitRepository` | `src/app/core/repositories/` | 2d |
| T10 | `InvalidDishIngredientUnitError` + UI catch | `src/app/core/errors/` + form | 0.5d |
| T11 | `computeDishTotalsPreview` helper | `src/app/core/services/` | 0.5d |
| T12 | Seed scripts — generate units.json, ingredient_units.json | `scripts/seed/` | 1.5d |
| T13 | Curate factor cho 20 món seed (cooking unit values) | `scripts/seed/data/` | 1d |
| T14 | UI — ingredient edit form unit list section | `features/management/ingredient-edit/` | 1.5d |
| T15 | UI — dish edit form dropdown unit | `features/management/dish-edit/` | 1d |
| T16 | UI — list/detail render với display_label | `features/management/` | 1d |
| T17 | Unit tests cho resolver + repos | tests | 1d |
| T18 | E2E happy path 9 cases acceptance | tests | 1d |

**Tổng:** ~14-15 ngày dev (so với schema cũ ~10 ngày).

---

## 9. Rủi ro

| # | Rủi ro | Severity | Mitigation |
|---|---|---|---|
| R1 | Curate factor cooking unit cho 20 món seed → cần research | Medium | Dùng USDA + ChatGPT cross-check; docs ghi rõ approximation |
| R2 | AI prompt quên `unit_id` mới → fallback messy | Medium | Post-processing strict validate, log + warn |
| R3 | UI dropdown rối nếu ingredient có >5 unit | Low | Limit 4 unit hiển thị, "Khác..." mở modal |
| R4 | Seed JSON size lớn hơn (×3) | Low | Chỉ ~50KB tổng, không vấn đề |
| R5 | Unit conversion edge case (kg sang ml ingredient) | Medium | Reject với error rõ ràng + UI guard sớm |
| R6 | Junction table thêm JOIN ở dish_with_totals nếu cần display unit | Low | VIEW chỉ JOIN khi cần; primary VIEW giữ nguyên |

---

## 10. Quyết định cần xác nhận thêm

Trước khi tôi bắt đầu update docs/code, bạn cần chốt thêm:

- **D1.** Approximate unit (nhúm/ít): có cho phép lưu hay reject? *(Đề xuất: cho phép, hiển thị icon ≈)*
- **D2.** User có được tạo unit custom (vd "1 hộp Vinamilk = 220ml") trong Phase 1, hay Phase 2? *(Đề xuất: Phase 1 giới hạn unit list cố định trong table `unit`, Phase 2 mở user-defined)*
- **D3.** `ingredient_unit.factor_to_basis` có cần history tracking không (factor đổi → recipe cũ ảnh hưởng)? *(Đề xuất: không tracking Phase 1, theo cùng triết lý "VIEW reflect latest" của RULE-DISH-TOTAL-04)*
- **D4.** Khi xoá unit trong table `unit`, các `ingredient_unit` reference nó có cascade hay restrict? *(Đề xuất: RESTRICT — không cho xoá unit nếu đang được tham chiếu)*
- **D5.** Pre-seed bao nhiêu cooking unit cho Phase 1? *(Đề xuất: 12 unit như §2.1)*

---

## 11. Câu hỏi cho user (review checkpoint)

1. ✅ Đồng ý với schema 3-table (`unit` + `ingredient_unit` + `ingredient`/`dish_ingredient` updated) ở §2 không?
2. ✅ Đồng ý với 12 unit pre-seed ở §2.1 không? Có muốn thêm/bớt unit nào (vd "lon", "gói", "hộp")?
3. ✅ Đồng ý với UX dropdown ở §4.1 và section "Đơn vị có thể nhập" ở §4.2 không?
4. ✅ Đồng ý với 9 acceptance cases ở §7 không?
5. ✅ Trả lời 5 quyết định D1-D5 ở §10.
6. ✅ Timeline 14-15 ngày ở §8 có acceptable không, hay cần cắt scope?

Sau khi bạn tick xong, tôi sẽ bắt đầu update docs theo thứ tự T1→T5, sau đó mới đụng schema.ts và code.

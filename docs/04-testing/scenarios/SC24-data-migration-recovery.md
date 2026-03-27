# Scenario 24: Data Migration & Recovery

**Version:** 2.0  
**Date:** 2026-03-15  
**Total Test Cases:** 215

---

## Mô tả tổng quan

Data Migration & Recovery xử lý chuyển đổi dữ liệu từ localStorage sang SQLite (sql.js WASM) và phục hồi từ các trạng thái lỗi. migrationService.ts chứa logic migration cho từng loại data: ingredients, dishes, dish_ingredients, dayPlans, userProfile, mealTemplates. databaseService.ts cung cấp abstraction layer cho SQLite. schema.ts định nghĩa table structures. Migration flag 'mp-migrated-to-sqlite' ngăn migration chạy lại. Error recovery xử lý corrupt data, missing keys, invalid types với graceful fallbacks.

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| migrationService | services/migrationService.ts | localStorage→SQLite migration logic |
| databaseService | services/databaseService.ts | SQLite abstraction: init, execute, query, transaction |
| schema | services/schema.ts | Table definitions, constraints |
| ErrorBoundary | components/ErrorBoundary | Error catching & recovery UI |
| usePersistedState | hooks/usePersistedState.ts | Data persistence layer |

## Luồng nghiệp vụ

1. App khởi động → check localStorage mp-migrated-to-sqlite flag
2. Flag absent → isMigrationNeeded() = true → bắt đầu migration
3. databaseService.initialize() → sql.js WASM setup
4. Schema tables created từ schema.ts
5. migrateIngredients, migrateDishes, migrateDayPlans, migrateUserProfile, migrateMealTemplates
6. MigrationResult trả về success/error + migratedCounts
7. Success → set flag mp-migrated-to-sqlite = true
8. Error → rollback transaction → report error → fallback to localStorage

## Quy tắc nghiệp vụ

1. Migration chỉ chạy 1 lần (flag-based idempotency)
2. Transaction: all-or-nothing (rollback on error)
3. localStorage keys: mp-ingredients, mp-dishes, mp-day-plans, mp-user-profile, meal-templates
4. Migration flag: mp-migrated-to-sqlite
5. Null-safe Zustand state parsing
6. Type coercion: string→number for nutrition values
7. Foreign key validation: dish→ingredient references
8. Error wrapping with SQL context logging
9. MigrationResult: { success, error?, migratedCounts? }


## Test Cases (215 TCs)

| ID | Mô tả | Loại | Priority |
|---|---|---|---|
| TC_MIG_001 | Check mp-ingredients key tồn tại | Positive | P0 |
| TC_MIG_002 | Check mp-dishes key tồn tại | Positive | P0 |
| TC_MIG_003 | Check mp-day-plans key tồn tại | Positive | P0 |
| TC_MIG_004 | Check mp-user-profile key tồn tại | Positive | P1 |
| TC_MIG_005 | Check meal-templates key tồn tại | Positive | P1 |
| TC_MIG_006 | Check mp-migrated-to-sqlite flag | Positive | P0 |
| TC_MIG_007 | Validate mp-ingredients JSON format | Positive | P0 |
| TC_MIG_008 | Validate mp-dishes JSON format | Positive | P0 |
| TC_MIG_009 | Validate mp-day-plans JSON format | Positive | P0 |
| TC_MIG_010 | Validate ingredient structure: id, name, calories | Positive | P1 |
| TC_MIG_011 | Validate dish structure: id, name, ingredients[] | Positive | P1 |
| TC_MIG_012 | Validate plan structure: date, meals | Positive | P1 |
| TC_MIG_013 | Validate template structure | Positive | P1 |
| TC_MIG_014 | Validate profile structure | Positive | P1 |
| TC_MIG_015 | Invalid JSON mp-ingredients → detection | Negative | P0 |
| TC_MIG_016 | Invalid JSON mp-dishes → detection | Negative | P0 |
| TC_MIG_017 | Empty string mp-ingredients → detection | Negative | P1 |
| TC_MIG_018 | Null value mp-ingredients → detection | Negative | P1 |
| TC_MIG_019 | Array type validation mp-ingredients | Positive | P1 |
| TC_MIG_020 | Object type validation mp-user-profile | Positive | P1 |
| TC_MIG_021 | Nested array: dish.ingredients validation | Positive | P1 |
| TC_MIG_022 | Numeric fields: calories as number | Positive | P1 |
| TC_MIG_023 | String fields: name as string | Positive | P1 |
| TC_MIG_024 | Date format validation in plans | Positive | P2 |
| TC_MIG_025 | ID uniqueness validation | Positive | P2 |
| TC_MIG_026 | isMigrationNeeded true khi flag absent | Positive | P0 |
| TC_MIG_027 | isMigrationNeeded false khi flag present | Positive | P0 |
| TC_MIG_028 | First app launch → migration needed | Positive | P0 |
| TC_MIG_029 | Second app launch → migration skip | Positive | P0 |
| TC_MIG_030 | Flag = 'true' → skip migration | Positive | P1 |
| TC_MIG_031 | Flag corrupted value → re-migrate | Edge | P1 |
| TC_MIG_032 | localStorage completely empty → handle | Positive | P1 |
| TC_MIG_033 | Only mp-ingredients exists → migrate partial | Positive | P1 |
| TC_MIG_034 | Only mp-dishes exists → migrate partial | Positive | P1 |
| TC_MIG_035 | All keys present → full migration | Positive | P0 |
| TC_MIG_036 | Flag deleted manually → re-migrate | Positive | P2 |
| TC_MIG_037 | Flag = 'false' → migration needed | Positive | P2 |
| TC_MIG_038 | Multiple flags → use mp-migrated-to-sqlite | Positive | P2 |
| TC_MIG_039 | Migration check performance < 10ms | Positive | P2 |
| TC_MIG_040 | Migration check không throw error | Positive | P1 |
| TC_MIG_041 | Migration check async → await result | Positive | P1 |
| TC_MIG_042 | Migration check logging | Positive | P2 |
| TC_MIG_043 | Migration check trên fresh install | Positive | P1 |
| TC_MIG_044 | Migration check sau app update | Positive | P1 |
| TC_MIG_045 | Migration check idempotent | Positive | P1 |
| TC_MIG_046 | Migrate 0 ingredients | Positive | P2 |
| TC_MIG_047 | Migrate 1 ingredient | Positive | P1 |
| TC_MIG_048 | Migrate 10 ingredients | Positive | P0 |
| TC_MIG_049 | Migrate 100 ingredients | Positive | P1 |
| TC_MIG_050 | Migrate 500 ingredients | Positive | P2 |
| TC_MIG_051 | Ingredient đầy đủ fields | Positive | P0 |
| TC_MIG_052 | Ingredient minimal fields (id+name) | Positive | P1 |
| TC_MIG_053 | Ingredient Vietnamese name: Bún bò Huế | Positive | P1 |
| TC_MIG_054 | Ingredient calories = 0 | Positive | P2 |
| TC_MIG_055 | Ingredient calories = 9999 | Positive | P2 |
| TC_MIG_056 | Ingredient protein = null → default 0 | Edge | P1 |
| TC_MIG_057 | Ingredient string calories '100' → number | Positive | P1 |
| TC_MIG_058 | Ingredient negative calories → handle | Edge | P1 |
| TC_MIG_059 | Ingredient duplicate IDs → skip/error | Positive | P1 |
| TC_MIG_060 | Ingredient empty name → skip | Positive | P1 |
| TC_MIG_061 | Ingredient name with emoji | Positive | P2 |
| TC_MIG_062 | Ingredient all nutrition fields | Positive | P0 |
| TC_MIG_063 | migrateIngredients return count | Positive | P1 |
| TC_MIG_064 | Ingredient with custom unit | Positive | P2 |
| TC_MIG_065 | Ingredient with tags | Positive | P2 |
| TC_MIG_066 | Ingredient created_at preserved | Positive | P2 |
| TC_MIG_067 | Ingredient updated_at preserved | Positive | P2 |
| TC_MIG_068 | Ingredient fiber field | Positive | P2 |
| TC_MIG_069 | Ingredient partial nutrition (only calories) | Positive | P1 |
| TC_MIG_070 | Ingredient migration SQL correct | Positive | P1 |
| TC_MIG_071 | Migrate 0 dishes | Positive | P2 |
| TC_MIG_072 | Migrate 1 dish | Positive | P1 |
| TC_MIG_073 | Migrate 10 dishes | Positive | P0 |
| TC_MIG_074 | Migrate 50 dishes | Positive | P1 |
| TC_MIG_075 | Dish với 0 ingredients | Positive | P1 |
| TC_MIG_076 | Dish với 1 ingredient | Positive | P0 |
| TC_MIG_077 | Dish với 15 ingredients | Positive | P1 |
| TC_MIG_078 | dish_ingredients junction table | Positive | P0 |
| TC_MIG_079 | Dish→ingredient foreign key valid | Positive | P0 |
| TC_MIG_080 | Dish refs deleted ingredient → handle | Edge | P1 |
| TC_MIG_081 | Dish Vietnamese name: Phở bò | Positive | P1 |
| TC_MIG_082 | Dish with description | Positive | P2 |
| TC_MIG_083 | Dish with tags array | Positive | P2 |
| TC_MIG_084 | Dish with image path | Positive | P2 |
| TC_MIG_085 | migrateDishes return {dishes, dishIngredients} | Positive | P1 |
| TC_MIG_086 | Dish duplicate ID → handle | Positive | P1 |
| TC_MIG_087 | Dish empty name → skip | Positive | P1 |
| TC_MIG_088 | Dish with serving size | Positive | P2 |
| TC_MIG_089 | Dish calories calculated from ingredients | Positive | P1 |
| TC_MIG_090 | Dish created_at preserved | Positive | P2 |
| TC_MIG_091 | Dish category field | Positive | P2 |
| TC_MIG_092 | Dish migration SQL correct | Positive | P1 |
| TC_MIG_093 | Dish ingredients amount preserved | Positive | P0 |
| TC_MIG_094 | Dish ingredients unit preserved | Positive | P0 |
| TC_MIG_095 | dishIngredients count return accurate | Positive | P1 |
| TC_MIG_096 | Migrate 0 day plans | Positive | P2 |
| TC_MIG_097 | Migrate 1 plan | Positive | P1 |
| TC_MIG_098 | Migrate 30 plans (month) | Positive | P0 |
| TC_MIG_099 | Migrate 365 plans (year) | Positive | P2 |
| TC_MIG_100 | Plan với 3 meals đầy đủ | Positive | P0 |
| TC_MIG_101 | Plan với 1 meal (breakfast only) | Positive | P1 |
| TC_MIG_102 | Plan với empty meals | Positive | P1 |
| TC_MIG_103 | Plan refs valid dishes | Positive | P0 |
| TC_MIG_104 | Plan refs deleted dish → handle | Edge | P1 |
| TC_MIG_105 | Plan date format preserved | Positive | P1 |
| TC_MIG_106 | migrateDay Plans return count | Positive | P1 |
| TC_MIG_107 | Plan nutrition data preserved | Positive | P2 |
| TC_MIG_108 | Migrate 0 templates | Positive | P2 |
| TC_MIG_109 | Migrate 1 template | Positive | P1 |
| TC_MIG_110 | Migrate 5 templates | Positive | P1 |
| TC_MIG_111 | Template with dish refs | Positive | P0 |
| TC_MIG_112 | Template refs deleted dish → handle | Edge | P1 |
| TC_MIG_113 | Template name preserved | Positive | P1 |
| TC_MIG_114 | migrateTemplates return count | Positive | P1 |
| TC_MIG_115 | Template with all meal types | Positive | P1 |
| TC_MIG_116 | Template with empty slots | Positive | P2 |
| TC_MIG_117 | Template migration SQL correct | Positive | P1 |
| TC_MIG_118 | Plan migration SQL correct | Positive | P1 |
| TC_MIG_119 | Plan unique date constraint | Positive | P1 |
| TC_MIG_120 | Template created_at preserved | Positive | P2 |
| TC_MIG_121 | Migrate user profile exists | Positive | P0 |
| TC_MIG_122 | Migrate user profile null → default | Positive | P1 |
| TC_MIG_123 | Profile all fields (name, weight, height, age) | Positive | P1 |
| TC_MIG_124 | Profile partial fields | Positive | P1 |
| TC_MIG_125 | Profile nutrition goals | Positive | P0 |
| TC_MIG_126 | migrateUserProfile return boolean | Positive | P1 |
| TC_MIG_127 | Profile with invalid weight → handle | Edge | P2 |
| TC_MIG_128 | Settings migration: theme | Positive | P2 |
| TC_MIG_129 | Settings migration: language | Positive | P2 |
| TC_MIG_130 | Migration flag set after success | Positive | P0 |
| TC_MIG_131 | Flag NOT set on failure | Positive | P0 |
| TC_MIG_132 | Flag value = 'true' string | Positive | P1 |
| TC_MIG_133 | Flag persist across sessions | Positive | P1 |
| TC_MIG_134 | Multiple settings keys | Positive | P2 |
| TC_MIG_135 | Default values for missing settings | Positive | P1 |
| TC_MIG_136 | Profile goals: calories target | Positive | P1 |
| TC_MIG_137 | Profile goals: protein target | Positive | P1 |
| TC_MIG_138 | Profile goals: carbs target | Positive | P2 |
| TC_MIG_139 | Profile goals: fat target | Positive | P2 |
| TC_MIG_140 | Profile migration idempotent | Positive | P1 |
| TC_MIG_141 | Migration error → transaction rollback | Positive | P0 |
| TC_MIG_142 | Partial migration → rollback all | Positive | P0 |
| TC_MIG_143 | SQLite write error → rollback | Positive | P0 |
| TC_MIG_144 | Transaction safety: all-or-nothing | Positive | P0 |
| TC_MIG_145 | MigrationResult.error message | Positive | P1 |
| TC_MIG_146 | Recovery: corrupt mp-ingredients JSON | Negative | P0 |
| TC_MIG_147 | Recovery: corrupt mp-dishes JSON | Negative | P0 |
| TC_MIG_148 | Recovery: corrupt mp-day-plans JSON | Negative | P1 |
| TC_MIG_149 | Recovery: missing mp-ingredients key | Negative | P1 |
| TC_MIG_150 | Recovery: missing mp-dishes key | Negative | P1 |
| TC_MIG_151 | Recovery: empty array mp-ingredients | Positive | P1 |
| TC_MIG_152 | Recovery: null mp-ingredients | Positive | P1 |
| TC_MIG_153 | Recovery: undefined value | Positive | P1 |
| TC_MIG_154 | JSON parse failure → graceful | Positive | P0 |
| TC_MIG_155 | Auto-fix orphan dish→ingredient refs | Positive | P2 |
| TC_MIG_156 | Auto-fix invalid type (string→number) | Positive | P2 |
| TC_MIG_157 | Auto-fix NaN nutrition values | Positive | P2 |
| TC_MIG_158 | Auto-fix negative amounts → 0 | Positive | P2 |
| TC_MIG_159 | Recovery notification UI | Positive | P2 |
| TC_MIG_160 | Recovery preserves max data | Positive | P1 |
| TC_MIG_161 | Partial recovery (some data saved) | Positive | P1 |
| TC_MIG_162 | Full recovery failure → defaults | Positive | P1 |
| TC_MIG_163 | Error boundary catches migration error | Positive | P1 |
| TC_MIG_164 | Retry migration after error | Positive | P2 |
| TC_MIG_165 | Migration error logging | Positive | P2 |
| TC_MIG_166 | Rollback restores localStorage state | Positive | P1 |
| TC_MIG_167 | Error not propagated to UI (silent fail) | Positive | P2 |
| TC_MIG_168 | Migration timeout handling | Positive | P2 |
| TC_MIG_169 | Concurrent migration prevention | Positive | P2 |
| TC_MIG_170 | Migration abort during app close | Positive | P2 |
| TC_MIG_171 | Post-migration: ingredient count matches | Positive | P0 |
| TC_MIG_172 | Post-migration: dish count matches | Positive | P0 |
| TC_MIG_173 | Post-migration: plan count matches | Positive | P0 |
| TC_MIG_174 | Post-migration: template count matches | Positive | P1 |
| TC_MIG_175 | Post-migration: profile exists | Positive | P1 |
| TC_MIG_176 | All foreign keys valid | Positive | P0 |
| TC_MIG_177 | No orphan dish_ingredients | Positive | P1 |
| TC_MIG_178 | Nutrition values preserved | Positive | P0 |
| TC_MIG_179 | Data round-trip: LS→SQLite→export→compare | Positive | P0 |
| TC_MIG_180 | MigrationResult.migratedCounts accurate | Positive | P1 |
| TC_MIG_181 | Vietnamese chars preserved in SQLite | Positive | P1 |
| TC_MIG_182 | Emoji preserved in SQLite | Positive | P2 |
| TC_MIG_183 | Date format preserved | Positive | P1 |
| TC_MIG_184 | Number precision preserved | Positive | P1 |
| TC_MIG_185 | Boolean values preserved | Positive | P2 |
| TC_MIG_186 | Null values handled | Positive | P1 |
| TC_MIG_187 | Empty strings preserved | Positive | P2 |
| TC_MIG_188 | Large text fields preserved | Positive | P2 |
| TC_MIG_189 | Special chars preserved | Positive | P2 |
| TC_MIG_190 | ID format preserved (UUID/string) | Positive | P1 |
| TC_MIG_191 | Created_at timestamps preserved | Positive | P2 |
| TC_MIG_192 | Updated_at timestamps preserved | Positive | P2 |
| TC_MIG_193 | Ingredient→dish relationship intact | Positive | P0 |
| TC_MIG_194 | Plan→dish relationship intact | Positive | P0 |
| TC_MIG_195 | Template→dish relationship intact | Positive | P1 |
| TC_MIG_196 | SQLite database initializes | Positive | P0 |
| TC_MIG_197 | sql.js WASM loads | Positive | P0 |
| TC_MIG_198 | All tables created from schema | Positive | P0 |
| TC_MIG_199 | Ingredients table correct columns | Positive | P1 |
| TC_MIG_200 | Dishes table correct columns | Positive | P1 |
| TC_MIG_201 | Dish_ingredients table | Positive | P1 |
| TC_MIG_202 | Day_plans table | Positive | P1 |
| TC_MIG_203 | Meal_templates table | Positive | P1 |
| TC_MIG_204 | User_profile table | Positive | P1 |
| TC_MIG_205 | Indexes created | Positive | P2 |
| TC_MIG_206 | NOT NULL constraints | Positive | P2 |
| TC_MIG_207 | PRIMARY KEY constraints | Positive | P1 |
| TC_MIG_208 | execute() works | Positive | P1 |
| TC_MIG_209 | query() returns data | Positive | P1 |
| TC_MIG_210 | queryOne() returns single | Positive | P2 |
| TC_MIG_211 | transaction() commits | Positive | P1 |
| TC_MIG_212 | transaction() rollback | Positive | P1 |
| TC_MIG_213 | exportToJSON() valid | Positive | P1 |
| TC_MIG_214 | importFromJSON() restores | Positive | P1 |
| TC_MIG_215 | Migration performance < 2s for 1000 items | Positive | P2 |

---

## Chi tiết Test Cases

### Nhóm 1: localStorage Validation (Xác thực localStorage) (TC_MIG_001 – TC_MIG_025)

### TC_MIG_001: Check mp-ingredients key tồn tại

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_001 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra check mp-ingredients key tồn tại |
| **Kết quả mong đợi** | Check mp-ingredients key tồn tại xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_002: Check mp-dishes key tồn tại

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_002 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra check mp-dishes key tồn tại |
| **Kết quả mong đợi** | Check mp-dishes key tồn tại xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_003: Check mp-day-plans key tồn tại

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_003 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra check mp-day-plans key tồn tại |
| **Kết quả mong đợi** | Check mp-day-plans key tồn tại xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_004: Check mp-user-profile key tồn tại

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_004 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra check mp-user-profile key tồn tại |
| **Kết quả mong đợi** | Check mp-user-profile key tồn tại xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_005: Check meal-templates key tồn tại

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_005 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra check meal-templates key tồn tại |
| **Kết quả mong đợi** | Check meal-templates key tồn tại xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_006: Check mp-migrated-to-sqlite flag

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_006 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra check mp-migrated-to-sqlite flag |
| **Kết quả mong đợi** | Check mp-migrated-to-sqlite flag xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_007: Validate mp-ingredients JSON format

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_007 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra validate mp-ingredients json format |
| **Kết quả mong đợi** | Validate mp-ingredients JSON format xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_008: Validate mp-dishes JSON format

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_008 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra validate mp-dishes json format |
| **Kết quả mong đợi** | Validate mp-dishes JSON format xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_009: Validate mp-day-plans JSON format

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_009 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra validate mp-day-plans json format |
| **Kết quả mong đợi** | Validate mp-day-plans JSON format xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_010: Validate ingredient structure: id, name, calories

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_010 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra validate ingredient structure: id, name, calories |
| **Kết quả mong đợi** | Validate ingredient structure: id, name, calories xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_011: Validate dish structure: id, name, ingredients[]

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_011 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra validate dish structure: id, name, ingredients[] |
| **Kết quả mong đợi** | Validate dish structure: id, name, ingredients[] xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_012: Validate plan structure: date, meals

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_012 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra validate plan structure: date, meals |
| **Kết quả mong đợi** | Validate plan structure: date, meals xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_013: Validate template structure

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_013 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra validate template structure |
| **Kết quả mong đợi** | Validate template structure xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_014: Validate profile structure

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_014 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra validate profile structure |
| **Kết quả mong đợi** | Validate profile structure xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_015: Invalid JSON mp-ingredients → detection

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_015 |
| **Loại** | Negative |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra invalid json mp-ingredients → detection |
| **Kết quả mong đợi** | Invalid JSON mp-ingredients → detection xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_016: Invalid JSON mp-dishes → detection

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_016 |
| **Loại** | Negative |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra invalid json mp-dishes → detection |
| **Kết quả mong đợi** | Invalid JSON mp-dishes → detection xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_017: Empty string mp-ingredients → detection

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_017 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra empty string mp-ingredients → detection |
| **Kết quả mong đợi** | Empty string mp-ingredients → detection xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_018: Null value mp-ingredients → detection

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_018 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra null value mp-ingredients → detection |
| **Kết quả mong đợi** | Null value mp-ingredients → detection xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_019: Array type validation mp-ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_019 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra array type validation mp-ingredients |
| **Kết quả mong đợi** | Array type validation mp-ingredients xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_020: Object type validation mp-user-profile

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_020 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra object type validation mp-user-profile |
| **Kết quả mong đợi** | Object type validation mp-user-profile xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_021: Nested array: dish.ingredients validation

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_021 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra nested array: dish.ingredients validation |
| **Kết quả mong đợi** | Nested array: dish.ingredients validation xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_022: Numeric fields: calories as number

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_022 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra numeric fields: calories as number |
| **Kết quả mong đợi** | Numeric fields: calories as number xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_023: String fields: name as string

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_023 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra string fields: name as string |
| **Kết quả mong đợi** | String fields: name as string xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_024: Date format validation in plans

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_024 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra date format validation in plans |
| **Kết quả mong đợi** | Date format validation in plans xác nhận đúng |
| **Kết quả test thực tế** | — |

### TC_MIG_025: ID uniqueness validation

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_025 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có data |
| **Các bước thực hiện** | 1. Kiểm tra id uniqueness validation |
| **Kết quả mong đợi** | ID uniqueness validation xác nhận đúng |
| **Kết quả test thực tế** | — |

### Nhóm 2: Migration Detection (Phát hiện migration) (TC_MIG_026 – TC_MIG_045)

### TC_MIG_026: isMigrationNeeded true khi flag absent

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_026 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check ismigrationneeded true khi flag absent |
| **Kết quả mong đợi** | isMigrationNeeded true khi flag absent |
| **Kết quả test thực tế** | — |

### TC_MIG_027: isMigrationNeeded false khi flag present

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_027 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check ismigrationneeded false khi flag present |
| **Kết quả mong đợi** | isMigrationNeeded false khi flag present |
| **Kết quả test thực tế** | — |

### TC_MIG_028: First app launch → migration needed

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_028 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check first app launch → migration needed |
| **Kết quả mong đợi** | First app launch → migration needed |
| **Kết quả test thực tế** | — |

### TC_MIG_029: Second app launch → migration skip

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_029 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check second app launch → migration skip |
| **Kết quả mong đợi** | Second app launch → migration skip |
| **Kết quả test thực tế** | — |

### TC_MIG_030: Flag = 'true' → skip migration

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_030 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check flag = 'true' → skip migration |
| **Kết quả mong đợi** | Flag = 'true' → skip migration |
| **Kết quả test thực tế** | — |

### TC_MIG_031: Flag corrupted value → re-migrate

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_031 |
| **Loại** | Edge |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check flag corrupted value → re-migrate |
| **Kết quả mong đợi** | Flag corrupted value → re-migrate |
| **Kết quả test thực tế** | — |

### TC_MIG_032: localStorage completely empty → handle

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_032 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check localstorage completely empty → handle |
| **Kết quả mong đợi** | localStorage completely empty → handle |
| **Kết quả test thực tế** | — |

### TC_MIG_033: Only mp-ingredients exists → migrate partial

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_033 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check only mp-ingredients exists → migrate partial |
| **Kết quả mong đợi** | Only mp-ingredients exists → migrate partial |
| **Kết quả test thực tế** | — |

### TC_MIG_034: Only mp-dishes exists → migrate partial

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_034 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check only mp-dishes exists → migrate partial |
| **Kết quả mong đợi** | Only mp-dishes exists → migrate partial |
| **Kết quả test thực tế** | — |

### TC_MIG_035: All keys present → full migration

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_035 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check all keys present → full migration |
| **Kết quả mong đợi** | All keys present → full migration |
| **Kết quả test thực tế** | — |

### TC_MIG_036: Flag deleted manually → re-migrate

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_036 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check flag deleted manually → re-migrate |
| **Kết quả mong đợi** | Flag deleted manually → re-migrate |
| **Kết quả test thực tế** | — |

### TC_MIG_037: Flag = 'false' → migration needed

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_037 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check flag = 'false' → migration needed |
| **Kết quả mong đợi** | Flag = 'false' → migration needed |
| **Kết quả test thực tế** | — |

### TC_MIG_038: Multiple flags → use mp-migrated-to-sqlite

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_038 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check multiple flags → use mp-migrated-to-sqlite |
| **Kết quả mong đợi** | Multiple flags → use mp-migrated-to-sqlite |
| **Kết quả test thực tế** | — |

### TC_MIG_039: Migration check performance < 10ms

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_039 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check migration check performance < 10ms |
| **Kết quả mong đợi** | Migration check performance < 10ms |
| **Kết quả test thực tế** | — |

### TC_MIG_040: Migration check không throw error

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_040 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check migration check không throw error |
| **Kết quả mong đợi** | Migration check không throw error |
| **Kết quả test thực tế** | — |

### TC_MIG_041: Migration check async → await result

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_041 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check migration check async → await result |
| **Kết quả mong đợi** | Migration check async → await result |
| **Kết quả test thực tế** | — |

### TC_MIG_042: Migration check logging

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_042 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check migration check logging |
| **Kết quả mong đợi** | Migration check logging |
| **Kết quả test thực tế** | — |

### TC_MIG_043: Migration check trên fresh install

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_043 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check migration check trên fresh install |
| **Kết quả mong đợi** | Migration check trên fresh install |
| **Kết quả test thực tế** | — |

### TC_MIG_044: Migration check sau app update

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_044 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check migration check sau app update |
| **Kết quả mong đợi** | Migration check sau app update |
| **Kết quả test thực tế** | — |

### TC_MIG_045: Migration check idempotent

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_045 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | App khởi động |
| **Các bước thực hiện** | 1. Check migration check idempotent |
| **Kết quả mong đợi** | Migration check idempotent |
| **Kết quả test thực tế** | — |

### Nhóm 3: Ingredients Migration (Migration nguyên liệu) (TC_MIG_046 – TC_MIG_070)

### TC_MIG_046: Migrate 0 ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_046 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: migrate 0 ingredients |
| **Kết quả mong đợi** | Migrate 0 ingredients thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_047: Migrate 1 ingredient

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_047 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: migrate 1 ingredient |
| **Kết quả mong đợi** | Migrate 1 ingredient thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_048: Migrate 10 ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_048 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: migrate 10 ingredients |
| **Kết quả mong đợi** | Migrate 10 ingredients thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_049: Migrate 100 ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_049 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: migrate 100 ingredients |
| **Kết quả mong đợi** | Migrate 100 ingredients thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_050: Migrate 500 ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_050 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: migrate 500 ingredients |
| **Kết quả mong đợi** | Migrate 500 ingredients thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_051: Ingredient đầy đủ fields

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_051 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient đầy đủ fields |
| **Kết quả mong đợi** | Ingredient đầy đủ fields thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_052: Ingredient minimal fields (id+name)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_052 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient minimal fields (id+name) |
| **Kết quả mong đợi** | Ingredient minimal fields (id+name) thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_053: Ingredient Vietnamese name: Bún bò Huế

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_053 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient vietnamese name: bún bò huế |
| **Kết quả mong đợi** | Ingredient Vietnamese name: Bún bò Huế thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_054: Ingredient calories = 0

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_054 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient calories = 0 |
| **Kết quả mong đợi** | Ingredient calories = 0 thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_055: Ingredient calories = 9999

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_055 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient calories = 9999 |
| **Kết quả mong đợi** | Ingredient calories = 9999 thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_056: Ingredient protein = null → default 0

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_056 |
| **Loại** | Edge |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient protein = null → default 0 |
| **Kết quả mong đợi** | Ingredient protein = null → default 0 thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_057: Ingredient string calories '100' → number

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_057 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient string calories '100' → number |
| **Kết quả mong đợi** | Ingredient string calories '100' → number thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_058: Ingredient negative calories → handle

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_058 |
| **Loại** | Edge |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient negative calories → handle |
| **Kết quả mong đợi** | Ingredient negative calories → handle thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_059: Ingredient duplicate IDs → skip/error

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_059 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient duplicate ids → skip/error |
| **Kết quả mong đợi** | Ingredient duplicate IDs → skip/error thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_060: Ingredient empty name → skip

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_060 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient empty name → skip |
| **Kết quả mong đợi** | Ingredient empty name → skip thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_061: Ingredient name with emoji

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_061 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient name with emoji |
| **Kết quả mong đợi** | Ingredient name with emoji thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_062: Ingredient all nutrition fields

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_062 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient all nutrition fields |
| **Kết quả mong đợi** | Ingredient all nutrition fields thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_063: migrateIngredients return count

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_063 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: migrateingredients return count |
| **Kết quả mong đợi** | migrateIngredients return count thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_064: Ingredient with custom unit

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_064 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient with custom unit |
| **Kết quả mong đợi** | Ingredient with custom unit thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_065: Ingredient with tags

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_065 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient with tags |
| **Kết quả mong đợi** | Ingredient with tags thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_066: Ingredient created_at preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_066 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient created_at preserved |
| **Kết quả mong đợi** | Ingredient created_at preserved thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_067: Ingredient updated_at preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_067 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient updated_at preserved |
| **Kết quả mong đợi** | Ingredient updated_at preserved thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_068: Ingredient fiber field

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_068 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient fiber field |
| **Kết quả mong đợi** | Ingredient fiber field thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_069: Ingredient partial nutrition (only calories)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_069 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient partial nutrition (only calories) |
| **Kết quả mong đợi** | Ingredient partial nutrition (only calories) thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_070: Ingredient migration SQL correct

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_070 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có ingredients |
| **Các bước thực hiện** | 1. Migrate: ingredient migration sql correct |
| **Kết quả mong đợi** | Ingredient migration SQL correct thành công |
| **Kết quả test thực tế** | — |

### Nhóm 4: Dishes Migration (Migration món ăn) (TC_MIG_071 – TC_MIG_095)

### TC_MIG_071: Migrate 0 dishes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_071 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: migrate 0 dishes |
| **Kết quả mong đợi** | Migrate 0 dishes thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_072: Migrate 1 dish

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_072 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: migrate 1 dish |
| **Kết quả mong đợi** | Migrate 1 dish thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_073: Migrate 10 dishes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_073 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: migrate 10 dishes |
| **Kết quả mong đợi** | Migrate 10 dishes thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_074: Migrate 50 dishes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_074 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: migrate 50 dishes |
| **Kết quả mong đợi** | Migrate 50 dishes thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_075: Dish với 0 ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_075 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish với 0 ingredients |
| **Kết quả mong đợi** | Dish với 0 ingredients thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_076: Dish với 1 ingredient

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_076 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish với 1 ingredient |
| **Kết quả mong đợi** | Dish với 1 ingredient thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_077: Dish với 15 ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_077 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish với 15 ingredients |
| **Kết quả mong đợi** | Dish với 15 ingredients thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_078: dish_ingredients junction table

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_078 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish_ingredients junction table |
| **Kết quả mong đợi** | dish_ingredients junction table thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_079: Dish→ingredient foreign key valid

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_079 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish→ingredient foreign key valid |
| **Kết quả mong đợi** | Dish→ingredient foreign key valid thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_080: Dish refs deleted ingredient → handle

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_080 |
| **Loại** | Edge |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish refs deleted ingredient → handle |
| **Kết quả mong đợi** | Dish refs deleted ingredient → handle thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_081: Dish Vietnamese name: Phở bò

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_081 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish vietnamese name: phở bò |
| **Kết quả mong đợi** | Dish Vietnamese name: Phở bò thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_082: Dish with description

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_082 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish with description |
| **Kết quả mong đợi** | Dish with description thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_083: Dish with tags array

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_083 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish with tags array |
| **Kết quả mong đợi** | Dish with tags array thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_084: Dish with image path

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_084 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish with image path |
| **Kết quả mong đợi** | Dish with image path thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_085: migrateDishes return {dishes, dishIngredients}

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_085 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: migratedishes return {dishes, dishingredients} |
| **Kết quả mong đợi** | migrateDishes return {dishes, dishIngredients} thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_086: Dish duplicate ID → handle

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_086 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish duplicate id → handle |
| **Kết quả mong đợi** | Dish duplicate ID → handle thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_087: Dish empty name → skip

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_087 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish empty name → skip |
| **Kết quả mong đợi** | Dish empty name → skip thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_088: Dish with serving size

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_088 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish with serving size |
| **Kết quả mong đợi** | Dish with serving size thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_089: Dish calories calculated from ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_089 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish calories calculated from ingredients |
| **Kết quả mong đợi** | Dish calories calculated from ingredients thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_090: Dish created_at preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_090 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish created_at preserved |
| **Kết quả mong đợi** | Dish created_at preserved thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_091: Dish category field

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_091 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish category field |
| **Kết quả mong đợi** | Dish category field thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_092: Dish migration SQL correct

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_092 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish migration sql correct |
| **Kết quả mong đợi** | Dish migration SQL correct thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_093: Dish ingredients amount preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_093 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish ingredients amount preserved |
| **Kết quả mong đợi** | Dish ingredients amount preserved thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_094: Dish ingredients unit preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_094 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dish ingredients unit preserved |
| **Kết quả mong đợi** | Dish ingredients unit preserved thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_095: dishIngredients count return accurate

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_095 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có dishes |
| **Các bước thực hiện** | 1. Migrate: dishingredients count return accurate |
| **Kết quả mong đợi** | dishIngredients count return accurate thành công |
| **Kết quả test thực tế** | — |

### Nhóm 5: Plans & Templates Migration (Migration kế hoạch & mẫu) (TC_MIG_096 – TC_MIG_120)

### TC_MIG_096: Migrate 0 day plans

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_096 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: migrate 0 day plans |
| **Kết quả mong đợi** | Migrate 0 day plans thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_097: Migrate 1 plan

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_097 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: migrate 1 plan |
| **Kết quả mong đợi** | Migrate 1 plan thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_098: Migrate 30 plans (month)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_098 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: migrate 30 plans (month) |
| **Kết quả mong đợi** | Migrate 30 plans (month) thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_099: Migrate 365 plans (year)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_099 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: migrate 365 plans (year) |
| **Kết quả mong đợi** | Migrate 365 plans (year) thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_100: Plan với 3 meals đầy đủ

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_100 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: plan với 3 meals đầy đủ |
| **Kết quả mong đợi** | Plan với 3 meals đầy đủ thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_101: Plan với 1 meal (breakfast only)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_101 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: plan với 1 meal (breakfast only) |
| **Kết quả mong đợi** | Plan với 1 meal (breakfast only) thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_102: Plan với empty meals

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_102 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: plan với empty meals |
| **Kết quả mong đợi** | Plan với empty meals thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_103: Plan refs valid dishes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_103 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: plan refs valid dishes |
| **Kết quả mong đợi** | Plan refs valid dishes thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_104: Plan refs deleted dish → handle

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_104 |
| **Loại** | Edge |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: plan refs deleted dish → handle |
| **Kết quả mong đợi** | Plan refs deleted dish → handle thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_105: Plan date format preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_105 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: plan date format preserved |
| **Kết quả mong đợi** | Plan date format preserved thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_106: migrateDay Plans return count

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_106 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: migrateday plans return count |
| **Kết quả mong đợi** | migrateDay Plans return count thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_107: Plan nutrition data preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_107 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: plan nutrition data preserved |
| **Kết quả mong đợi** | Plan nutrition data preserved thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_108: Migrate 0 templates

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_108 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: migrate 0 templates |
| **Kết quả mong đợi** | Migrate 0 templates thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_109: Migrate 1 template

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_109 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: migrate 1 template |
| **Kết quả mong đợi** | Migrate 1 template thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_110: Migrate 5 templates

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_110 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: migrate 5 templates |
| **Kết quả mong đợi** | Migrate 5 templates thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_111: Template with dish refs

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_111 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: template with dish refs |
| **Kết quả mong đợi** | Template with dish refs thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_112: Template refs deleted dish → handle

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_112 |
| **Loại** | Edge |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: template refs deleted dish → handle |
| **Kết quả mong đợi** | Template refs deleted dish → handle thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_113: Template name preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_113 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: template name preserved |
| **Kết quả mong đợi** | Template name preserved thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_114: migrateTemplates return count

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_114 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: migratetemplates return count |
| **Kết quả mong đợi** | migrateTemplates return count thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_115: Template with all meal types

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_115 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: template with all meal types |
| **Kết quả mong đợi** | Template with all meal types thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_116: Template with empty slots

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_116 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: template with empty slots |
| **Kết quả mong đợi** | Template with empty slots thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_117: Template migration SQL correct

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_117 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: template migration sql correct |
| **Kết quả mong đợi** | Template migration SQL correct thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_118: Plan migration SQL correct

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_118 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: plan migration sql correct |
| **Kết quả mong đợi** | Plan migration SQL correct thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_119: Plan unique date constraint

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_119 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: plan unique date constraint |
| **Kết quả mong đợi** | Plan unique date constraint thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_120: Template created_at preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_120 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có plans/templates |
| **Các bước thực hiện** | 1. Migrate: template created_at preserved |
| **Kết quả mong đợi** | Template created_at preserved thành công |
| **Kết quả test thực tế** | — |

### Nhóm 6: Profile & Settings Migration (Migration hồ sơ) (TC_MIG_121 – TC_MIG_140)

### TC_MIG_121: Migrate user profile exists

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_121 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: migrate user profile exists |
| **Kết quả mong đợi** | Migrate user profile exists thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_122: Migrate user profile null → default

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_122 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: migrate user profile null → default |
| **Kết quả mong đợi** | Migrate user profile null → default thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_123: Profile all fields (name, weight, height, age)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_123 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: profile all fields (name, weight, height, age) |
| **Kết quả mong đợi** | Profile all fields (name, weight, height, age) thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_124: Profile partial fields

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_124 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: profile partial fields |
| **Kết quả mong đợi** | Profile partial fields thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_125: Profile nutrition goals

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_125 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: profile nutrition goals |
| **Kết quả mong đợi** | Profile nutrition goals thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_126: migrateUserProfile return boolean

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_126 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: migrateuserprofile return boolean |
| **Kết quả mong đợi** | migrateUserProfile return boolean thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_127: Profile with invalid weight → handle

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_127 |
| **Loại** | Edge |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: profile with invalid weight → handle |
| **Kết quả mong đợi** | Profile with invalid weight → handle thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_128: Settings migration: theme

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_128 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: settings migration: theme |
| **Kết quả mong đợi** | Settings migration: theme thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_129: Settings migration: language

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_129 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: settings migration: language |
| **Kết quả mong đợi** | Settings migration: language thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_130: Migration flag set after success

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_130 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: migration flag set after success |
| **Kết quả mong đợi** | Migration flag set after success thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_131: Flag NOT set on failure

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_131 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: flag not set on failure |
| **Kết quả mong đợi** | Flag NOT set on failure thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_132: Flag value = 'true' string

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_132 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: flag value = 'true' string |
| **Kết quả mong đợi** | Flag value = 'true' string thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_133: Flag persist across sessions

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_133 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: flag persist across sessions |
| **Kết quả mong đợi** | Flag persist across sessions thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_134: Multiple settings keys

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_134 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: multiple settings keys |
| **Kết quả mong đợi** | Multiple settings keys thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_135: Default values for missing settings

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_135 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: default values for missing settings |
| **Kết quả mong đợi** | Default values for missing settings thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_136: Profile goals: calories target

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_136 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: profile goals: calories target |
| **Kết quả mong đợi** | Profile goals: calories target thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_137: Profile goals: protein target

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_137 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: profile goals: protein target |
| **Kết quả mong đợi** | Profile goals: protein target thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_138: Profile goals: carbs target

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_138 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: profile goals: carbs target |
| **Kết quả mong đợi** | Profile goals: carbs target thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_139: Profile goals: fat target

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_139 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: profile goals: fat target |
| **Kết quả mong đợi** | Profile goals: fat target thành công |
| **Kết quả test thực tế** | — |

### TC_MIG_140: Profile migration idempotent

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_140 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | localStorage có profile |
| **Các bước thực hiện** | 1. Migrate: profile migration idempotent |
| **Kết quả mong đợi** | Profile migration idempotent thành công |
| **Kết quả test thực tế** | — |

### Nhóm 7: Rollback & Error Recovery (Rollback & Phục hồi) (TC_MIG_141 – TC_MIG_170)

### TC_MIG_141: Migration error → transaction rollback

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_141 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Migration error → transaction rollback |
| **Kết quả mong đợi** | Migration error → transaction rollback handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_142: Partial migration → rollback all

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_142 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Partial migration → rollback all |
| **Kết quả mong đợi** | Partial migration → rollback all handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_143: SQLite write error → rollback

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_143 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. SQLite write error → rollback |
| **Kết quả mong đợi** | SQLite write error → rollback handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_144: Transaction safety: all-or-nothing

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_144 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Transaction safety: all-or-nothing |
| **Kết quả mong đợi** | Transaction safety: all-or-nothing handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_145: MigrationResult.error message

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_145 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. MigrationResult.error message |
| **Kết quả mong đợi** | MigrationResult.error message handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_146: Recovery: corrupt mp-ingredients JSON

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_146 |
| **Loại** | Negative |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Recovery: corrupt mp-ingredients JSON |
| **Kết quả mong đợi** | Recovery: corrupt mp-ingredients JSON handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_147: Recovery: corrupt mp-dishes JSON

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_147 |
| **Loại** | Negative |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Recovery: corrupt mp-dishes JSON |
| **Kết quả mong đợi** | Recovery: corrupt mp-dishes JSON handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_148: Recovery: corrupt mp-day-plans JSON

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_148 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Recovery: corrupt mp-day-plans JSON |
| **Kết quả mong đợi** | Recovery: corrupt mp-day-plans JSON handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_149: Recovery: missing mp-ingredients key

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_149 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Recovery: missing mp-ingredients key |
| **Kết quả mong đợi** | Recovery: missing mp-ingredients key handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_150: Recovery: missing mp-dishes key

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_150 |
| **Loại** | Negative |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Recovery: missing mp-dishes key |
| **Kết quả mong đợi** | Recovery: missing mp-dishes key handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_151: Recovery: empty array mp-ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_151 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Recovery: empty array mp-ingredients |
| **Kết quả mong đợi** | Recovery: empty array mp-ingredients handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_152: Recovery: null mp-ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_152 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Recovery: null mp-ingredients |
| **Kết quả mong đợi** | Recovery: null mp-ingredients handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_153: Recovery: undefined value

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_153 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Recovery: undefined value |
| **Kết quả mong đợi** | Recovery: undefined value handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_154: JSON parse failure → graceful

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_154 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. JSON parse failure → graceful |
| **Kết quả mong đợi** | JSON parse failure → graceful handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_155: Auto-fix orphan dish→ingredient refs

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_155 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Auto-fix orphan dish→ingredient refs |
| **Kết quả mong đợi** | Auto-fix orphan dish→ingredient refs handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_156: Auto-fix invalid type (string→number)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_156 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Auto-fix invalid type (string→number) |
| **Kết quả mong đợi** | Auto-fix invalid type (string→number) handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_157: Auto-fix NaN nutrition values

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_157 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Auto-fix NaN nutrition values |
| **Kết quả mong đợi** | Auto-fix NaN nutrition values handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_158: Auto-fix negative amounts → 0

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_158 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Auto-fix negative amounts → 0 |
| **Kết quả mong đợi** | Auto-fix negative amounts → 0 handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_159: Recovery notification UI

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_159 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Recovery notification UI |
| **Kết quả mong đợi** | Recovery notification UI handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_160: Recovery preserves max data

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_160 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Recovery preserves max data |
| **Kết quả mong đợi** | Recovery preserves max data handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_161: Partial recovery (some data saved)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_161 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Partial recovery (some data saved) |
| **Kết quả mong đợi** | Partial recovery (some data saved) handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_162: Full recovery failure → defaults

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_162 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Full recovery failure → defaults |
| **Kết quả mong đợi** | Full recovery failure → defaults handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_163: Error boundary catches migration error

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_163 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Error boundary catches migration error |
| **Kết quả mong đợi** | Error boundary catches migration error handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_164: Retry migration after error

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_164 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Retry migration after error |
| **Kết quả mong đợi** | Retry migration after error handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_165: Migration error logging

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_165 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Migration error logging |
| **Kết quả mong đợi** | Migration error logging handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_166: Rollback restores localStorage state

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_166 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Rollback restores localStorage state |
| **Kết quả mong đợi** | Rollback restores localStorage state handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_167: Error not propagated to UI (silent fail)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_167 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Error not propagated to UI (silent fail) |
| **Kết quả mong đợi** | Error not propagated to UI (silent fail) handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_168: Migration timeout handling

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_168 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Migration timeout handling |
| **Kết quả mong đợi** | Migration timeout handling handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_169: Concurrent migration prevention

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_169 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Concurrent migration prevention |
| **Kết quả mong đợi** | Concurrent migration prevention handled correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_170: Migration abort during app close

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_170 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration scenario |
| **Các bước thực hiện** | 1. Migration abort during app close |
| **Kết quả mong đợi** | Migration abort during app close handled correctly |
| **Kết quả test thực tế** | — |

### Nhóm 8: Data Integrity Verification (Xác minh tính toàn vẹn) (TC_MIG_171 – TC_MIG_195)

### TC_MIG_171: Post-migration: ingredient count matches

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_171 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: post-migration: ingredient count matches |
| **Kết quả mong đợi** | Post-migration: ingredient count matches confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_172: Post-migration: dish count matches

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_172 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: post-migration: dish count matches |
| **Kết quả mong đợi** | Post-migration: dish count matches confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_173: Post-migration: plan count matches

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_173 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: post-migration: plan count matches |
| **Kết quả mong đợi** | Post-migration: plan count matches confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_174: Post-migration: template count matches

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_174 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: post-migration: template count matches |
| **Kết quả mong đợi** | Post-migration: template count matches confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_175: Post-migration: profile exists

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_175 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: post-migration: profile exists |
| **Kết quả mong đợi** | Post-migration: profile exists confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_176: All foreign keys valid

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_176 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: all foreign keys valid |
| **Kết quả mong đợi** | All foreign keys valid confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_177: No orphan dish_ingredients

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_177 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: no orphan dish_ingredients |
| **Kết quả mong đợi** | No orphan dish_ingredients confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_178: Nutrition values preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_178 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: nutrition values preserved |
| **Kết quả mong đợi** | Nutrition values preserved confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_179: Data round-trip: LS→SQLite→export→compare

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_179 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: data round-trip: ls→sqlite→export→compare |
| **Kết quả mong đợi** | Data round-trip: LS→SQLite→export→compare confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_180: MigrationResult.migratedCounts accurate

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_180 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: migrationresult.migratedcounts accurate |
| **Kết quả mong đợi** | MigrationResult.migratedCounts accurate confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_181: Vietnamese chars preserved in SQLite

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_181 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: vietnamese chars preserved in sqlite |
| **Kết quả mong đợi** | Vietnamese chars preserved in SQLite confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_182: Emoji preserved in SQLite

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_182 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: emoji preserved in sqlite |
| **Kết quả mong đợi** | Emoji preserved in SQLite confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_183: Date format preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_183 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: date format preserved |
| **Kết quả mong đợi** | Date format preserved confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_184: Number precision preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_184 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: number precision preserved |
| **Kết quả mong đợi** | Number precision preserved confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_185: Boolean values preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_185 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: boolean values preserved |
| **Kết quả mong đợi** | Boolean values preserved confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_186: Null values handled

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_186 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: null values handled |
| **Kết quả mong đợi** | Null values handled confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_187: Empty strings preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_187 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: empty strings preserved |
| **Kết quả mong đợi** | Empty strings preserved confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_188: Large text fields preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_188 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: large text fields preserved |
| **Kết quả mong đợi** | Large text fields preserved confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_189: Special chars preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_189 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: special chars preserved |
| **Kết quả mong đợi** | Special chars preserved confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_190: ID format preserved (UUID/string)

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_190 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: id format preserved (uuid/string) |
| **Kết quả mong đợi** | ID format preserved (UUID/string) confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_191: Created_at timestamps preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_191 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: created_at timestamps preserved |
| **Kết quả mong đợi** | Created_at timestamps preserved confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_192: Updated_at timestamps preserved

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_192 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: updated_at timestamps preserved |
| **Kết quả mong đợi** | Updated_at timestamps preserved confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_193: Ingredient→dish relationship intact

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_193 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: ingredient→dish relationship intact |
| **Kết quả mong đợi** | Ingredient→dish relationship intact confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_194: Plan→dish relationship intact

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_194 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: plan→dish relationship intact |
| **Kết quả mong đợi** | Plan→dish relationship intact confirmed |
| **Kết quả test thực tế** | — |

### TC_MIG_195: Template→dish relationship intact

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_195 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Migration completed |
| **Các bước thực hiện** | 1. Verify: template→dish relationship intact |
| **Kết quả mong đợi** | Template→dish relationship intact confirmed |
| **Kết quả test thực tế** | — |

### Nhóm 9: Database Schema & Performance (Schema & Hiệu suất) (TC_MIG_196 – TC_MIG_215)

### TC_MIG_196: SQLite database initializes

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_196 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: sqlite database initializes |
| **Kết quả mong đợi** | SQLite database initializes works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_197: sql.js WASM loads

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_197 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: sql.js wasm loads |
| **Kết quả mong đợi** | sql.js WASM loads works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_198: All tables created from schema

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_198 |
| **Loại** | Positive |
| **Độ ưu tiên** | P0 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: all tables created from schema |
| **Kết quả mong đợi** | All tables created from schema works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_199: Ingredients table correct columns

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_199 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: ingredients table correct columns |
| **Kết quả mong đợi** | Ingredients table correct columns works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_200: Dishes table correct columns

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_200 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: dishes table correct columns |
| **Kết quả mong đợi** | Dishes table correct columns works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_201: Dish_ingredients table

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_201 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: dish_ingredients table |
| **Kết quả mong đợi** | Dish_ingredients table works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_202: Day_plans table

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_202 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: day_plans table |
| **Kết quả mong đợi** | Day_plans table works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_203: Meal_templates table

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_203 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: meal_templates table |
| **Kết quả mong đợi** | Meal_templates table works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_204: User_profile table

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_204 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: user_profile table |
| **Kết quả mong đợi** | User_profile table works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_205: Indexes created

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_205 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: indexes created |
| **Kết quả mong đợi** | Indexes created works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_206: NOT NULL constraints

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_206 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: not null constraints |
| **Kết quả mong đợi** | NOT NULL constraints works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_207: PRIMARY KEY constraints

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_207 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: primary key constraints |
| **Kết quả mong đợi** | PRIMARY KEY constraints works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_208: execute() works

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_208 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: execute() works |
| **Kết quả mong đợi** | execute() works works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_209: query() returns data

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_209 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: query() returns data |
| **Kết quả mong đợi** | query() returns data works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_210: queryOne() returns single

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_210 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: queryone() returns single |
| **Kết quả mong đợi** | queryOne() returns single works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_211: transaction() commits

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_211 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: transaction() commits |
| **Kết quả mong đợi** | transaction() commits works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_212: transaction() rollback

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_212 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: transaction() rollback |
| **Kết quả mong đợi** | transaction() rollback works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_213: exportToJSON() valid

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_213 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: exporttojson() valid |
| **Kết quả mong đợi** | exportToJSON() valid works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_214: importFromJSON() restores

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_214 |
| **Loại** | Positive |
| **Độ ưu tiên** | P1 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: importfromjson() restores |
| **Kết quả mong đợi** | importFromJSON() restores works correctly |
| **Kết quả test thực tế** | — |

### TC_MIG_215: Migration performance < 2s for 1000 items

| Thuộc tính | Chi tiết |
|---|---|
| **ID** | TC_MIG_215 |
| **Loại** | Positive |
| **Độ ưu tiên** | P2 |
| **Tiền điều kiện** | Database initialized |
| **Các bước thực hiện** | 1. Test: migration performance < 2s for 1000 items |
| **Kết quả mong đợi** | Migration performance < 2s for 1000 items works correctly |
| **Kết quả test thực tế** | — |

---

## Đề xuất Cải tiến

### Đề xuất 1: Automatic Data Health Check
- **Vấn đề hiện tại**: Corruption discovered only on feature failure.
- **Giải pháp đề xuất**: Periodic integrity scan: check orphans, types, consistency.
- **Phần trăm cải thiện**: Corruption detection +80%, Silent data loss -90%
- **Mức độ ưu tiên**: High | **Effort**: M

### Đề xuất 2: Transaction-Based Writes
- **Vấn đề hiện tại**: localStorage not atomic. Crash mid-write = corrupt.
- **Giải pháp đề xuất**: Write-ahead log: journal → apply → confirm.
- **Phần trăm cải thiện**: Data safety +90%, Crash corruption -95%
- **Mức độ ưu tiên**: High | **Effort**: L

### Đề xuất 3: Storage Upgrade to IndexedDB
- **Vấn đề hiện tại**: localStorage ~5MB limit.
- **Giải pháp đề xuất**: IndexedDB: 50MB+ capacity, structured, async.
- **Phần trăm cải thiện**: Storage +10x, Performance +30%
- **Mức độ ưu tiên**: Medium | **Effort**: XL

### Đề xuất 4: Multi-Tab Sync
- **Vấn đề hiện tại**: Multiple tabs can write simultaneously.
- **Giải pháp đề xuất**: BroadcastChannel API, leader election.
- **Phần trăm cải thiện**: Multi-tab consistency +100%
- **Mức độ ưu tiên**: Medium | **Effort**: M

### Đề xuất 5: Offline Recovery Queue
- **Vấn đề hiện tại**: Offline changes lost on crash before sync.
- **Giải pháp đề xuất**: Persistent operation queue in IndexedDB.
- **Phần trăm cải thiện**: Offline data safety +90%
- **Mức độ ưu tiên**: Medium | **Effort**: L

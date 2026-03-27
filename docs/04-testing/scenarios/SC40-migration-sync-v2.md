# Scenario 40: Migration & Sync V2

**Version:** 1.0  
**Date:** 2026-06-12  
**Total Test Cases:** 210

---

## Mô tả tổng quan

Migration & Sync V2 bao gồm toàn bộ luồng di chuyển dữ liệu từ localStorage (Zustand persisted state, định dạng v1.x) sang SQLite database, cùng với hệ thống xuất/nhập dữ liệu đồng bộ phiên bản 2.0. Scenario này cover hai dịch vụ chính:

1. **migrationService**: Phát hiện nhu cầu migration, đọc dữ liệu từ 5 localStorage keys (mp-ingredients, mp-dishes, mp-day-plans, mp-user-profile, meal-templates), chuyển đổi sang schema SQLite theo thứ tự FK-safe (ingredients → dishes → dish_ingredients → day_plans → user_profile → meal_templates), thực hiện toàn bộ trong một transaction atomic, và đặt flag `mp-migrated-to-sqlite` khi hoàn tất.

2. **syncV2Utils**: Hỗ trợ export toàn bộ 16 bảng SQLite sang định dạng JSON v2.0 (`V2ExportPayload`), import ngược lại (xóa toàn bộ theo thứ tự FK ngược, insert theo thứ tự FK thuận), tự động phát hiện phiên bản dữ liệu (v1.x/v2.0), chuyển đổi legacy sang v2 khi cần, và duy trì backward compatibility qua `buildLegacyFormat`.

Tất cả thao tác write đều sử dụng `db.transaction()` để đảm bảo tính atomic — nếu bất kỳ bước nào thất bại, toàn bộ thay đổi sẽ rollback, dữ liệu giữ nguyên trạng thái trước đó. Đây là yêu cầu bắt buộc để tránh dữ liệu không nhất quán (partial migration/import).

## Components & Services

| Component/Hook | File | Vai trò |
|----------------|------|---------|
| migrationService | src/services/migrationService.ts | Dịch vụ di chuyển dữ liệu từ localStorage sang SQLite |
| syncV2Utils | src/services/syncV2Utils.ts | Tiện ích xuất/nhập đồng bộ dữ liệu phiên bản 2.0 |
| DatabaseService | src/services/databaseService.ts | Lớp trừu tượng truy cập SQLite (transaction, query, insert) |
| isMigrationCompleted() | migrationService.ts | Kiểm tra flag migration đã hoàn tất trong localStorage |
| isMigrationNeeded() | migrationService.ts | Xác định có cần migration hay không (kiểm tra 5 keys) |
| migrateFromLocalStorage(db) | migrationService.ts | Thực hiện migration toàn bộ dữ liệu localStorage → SQLite |
| readZustandState\<T\>(key, prop) | migrationService.ts | Đọc và parse Zustand persisted state từ localStorage |
| detectVersion(data) | syncV2Utils.ts | Phát hiện phiên bản dữ liệu: '1.x' hoặc '2.0' |
| buildLegacyFormat(tables) | syncV2Utils.ts | Tái tạo cấu trúc localStorage v1.x từ flat SQL rows |
| createV2Export(db, legacyData?) | syncV2Utils.ts | Xuất toàn bộ DB sang V2ExportPayload JSON |
| importV2Data(db, data) | syncV2Utils.ts | Nhập dữ liệu v1.x hoặc v2.0 vào DB (auto-detect + transform) |
| transformLegacyToV2Tables() | syncV2Utils.ts | Chuyển đổi dữ liệu v1.x sang cấu trúc bảng v2.0 |
| safeJsonParse() | syncV2Utils.ts | Parse JSON an toàn, trả về giá trị gốc nếu thất bại |

## Luồng nghiệp vụ

1. Khởi động app → gọi `isMigrationCompleted()` kiểm tra flag `mp-migrated-to-sqlite` trong localStorage
2. Nếu flag chưa có → gọi `isMigrationNeeded()` kiểm tra 5 localStorage keys (mp-ingredients, mp-dishes, mp-day-plans, mp-user-profile, meal-templates)
3. Nếu có ít nhất 1 key tồn tại → gọi `migrateFromLocalStorage(db)` bắt đầu migration
4. Migration mở transaction → đọc từng key qua `readZustandState()` → parse Zustand `{ state: { [prop]: T } }` → insert vào SQLite theo thứ tự FK-safe: ingredients → dishes + dish_ingredients → day_plans → user_profile → meal_templates
5. Nếu thành công → commit transaction → set flag `mp-migrated-to-sqlite` = timestamp hiện tại → trả về `MigrationResult` với `success: true` và `migratedCounts`
6. Nếu thất bại → rollback toàn bộ transaction → trả về `{ success: false, error: message }`
7. Export dữ liệu: gọi `createV2Export(db)` → query 16 bảng → build `V2ExportPayload` (kèm `_legacyFormat` cho backward compat)
8. Import dữ liệu: gọi `importV2Data(db, data)` → `detectVersion()` → nếu v1.x: `transformLegacyToV2Tables()` → transaction: DELETE ALL (reverse FK order) → INSERT ALL (forward FK order) → trả về `ImportResult`
9. Round-trip: Export → Import → Export lại phải cho kết quả identical (bảo toàn tính toàn vẹn dữ liệu)

## Quy tắc nghiệp vụ

1. **Atomic transaction**: Mọi thao tác write (migration, import) PHẢI nằm trong `db.transaction()` — không được phép partial write
2. **Migration order (FK-safe)**: ingredients → dishes → dish_ingredients → day_plans → user_profile → meal_templates (parents trước children)
3. **Import order (16 bảng)**: ingredients → dishes → dish_ingredients → day_plans → meal_templates → user_profile → goals → exercises → training_profile → training_plans → training_plan_days → workouts → workout_sets → weight_log → daily_log → adjustments
4. **Delete order (reverse FK)**: adjustments → daily_log → weight_log → workout_sets → workouts → training_plan_days → training_plans → training_profile → exercises → goals → user_profile → meal_templates → day_plans → dish_ingredients → dishes → ingredients
5. **Zustand state structure**: localStorage value phải có dạng `{ state: { [prop]: T } }` — nếu khác sẽ trả về null/empty
6. **User profile defaults khi migration**: id='default', gender='male', age=30, height=170, activity='moderate', fat_pct=0.25
7. **User profile defaults khi import v1.x**: gender='male', age=30, height=170, weight=70, proteinRatio=2.0
8. **Migration flag**: key `mp-migrated-to-sqlite`, value = ISO timestamp, set SAU KHI commit thành công
9. **Idempotency**: Nếu flag đã set → `isMigrationNeeded()` trả về false → không chạy migration lần 2
10. **Version detection**: `_version === '2.0'` → v2.0; mọi trường hợp khác → v1.x (backward compat)
11. **V2ExportPayload cấu trúc bắt buộc**: `{ _version: '2.0', _exportedAt: ISO string, _format: 'sqlite-json', tables: Record<string, unknown[]> }`
12. **Legacy transform**: hỗ trợ cả camelCase và snake_case fields; dish_ingredients được tạo từ nested ingredients array trong dish
13. **safeJsonParse**: nếu input là string → thử JSON.parse; nếu thất bại → trả về giá trị gốc; nếu không phải string → trả về nguyên bản
14. **FK relationships**: dish_ingredients→(ingredients+dishes), day_plans→dishes, training_profile→user_profile, training_plan_days→training_plans, workout_sets→workouts, weight_log→user_profile, daily_log→user_profile

## Test Cases (55 TCs)

| ID | Mô tả | Loại | Priority |
|----|--------|------|----------|
| TC_MIG_01 | isMigrationCompleted trả về false khi chưa có flag | Positive | P0 |
| TC_MIG_02 | isMigrationCompleted trả về true khi flag đã tồn tại | Positive | P0 |
| TC_MIG_03 | isMigrationNeeded trả về true khi có dữ liệu localStorage | Positive | P0 |
| TC_MIG_04 | isMigrationNeeded trả về false khi đã migrated | Positive | P0 |
| TC_MIG_05 | isMigrationNeeded trả về false khi không có localStorage key nào | Negative | P1 |
| TC_MIG_06 | Migration toàn bộ 5 nhóm dữ liệu thành công | Positive | P0 |
| TC_MIG_07 | Migrate ingredients với đầy đủ fields nutrition | Positive | P0 |
| TC_MIG_08 | Migrate dishes kèm tách dish_ingredients sang bảng riêng | Positive | P0 |
| TC_MIG_09 | Migrate dayPlans với JSON arrays cho breakfast/lunch/dinner | Positive | P0 |
| TC_MIG_10 | Migrate userProfile áp dụng giá trị hardcoded mặc định | Positive | P1 |
| TC_MIG_11 | Migrate mealTemplates với full JSON data trong cột data | Positive | P1 |
| TC_MIG_12 | migratedCounts phản ánh chính xác số lượng từng bảng | Positive | P1 |
| TC_MIG_13 | Migration khi chỉ có ingredients trong localStorage | Edge | P1 |
| TC_MIG_14 | Migration khi chỉ có dishes mà không có ingredients | Edge | P1 |
| TC_MIG_15 | Migration khi thiếu userProfile trong localStorage | Edge | P1 |
| TC_MIG_16 | Migration khi chỉ có dayPlans và dishes | Edge | P2 |
| TC_MIG_17 | Migration khi có mealTemplates nhưng thiếu dishes | Edge | P2 |
| TC_MIG_18 | Migration khi tất cả localStorage keys rỗng (empty arrays) | Edge | P1 |
| TC_MIG_19 | Migration khi localStorage key tồn tại nhưng mảng rỗng [] | Edge | P1 |
| TC_MIG_20 | migratedCounts trả về 0 cho tất cả khi dữ liệu rỗng | Edge | P2 |
| TC_MIG_21 | Migration thất bại khi localStorage chứa JSON không hợp lệ | Negative | P0 |
| TC_MIG_22 | readZustandState xử lý cấu trúc thiếu prop state | Negative | P1 |
| TC_MIG_23 | Migration xử lý ingredient thiếu trường bắt buộc (name_vi) | Negative | P1 |
| TC_MIG_24 | Migration xử lý dish với tags không phải JSON array | Negative | P2 |
| TC_MIG_25 | Migration xử lý dayPlan với date format không chuẩn | Negative | P2 |
| TC_MIG_26 | Chạy migration lần 2 không tạo dữ liệu trùng lặp | Positive | P0 |
| TC_MIG_27 | isMigrationNeeded trả về false ngay sau migration thành công | Positive | P1 |
| TC_MIG_28 | Gọi migrateFromLocalStorage sau khi đã migrate không thay đổi DB | Edge | P1 |
| TC_MIG_29 | Transaction rollback toàn bộ khi lỗi xảy ra giữa chừng | Negative | P0 |
| TC_MIG_30 | DB giữ nguyên trạng thái ban đầu khi migration thất bại | Negative | P0 |
| TC_MIG_31 | Flag không được set khi migration bị rollback | Negative | P1 |
| TC_MIG_32 | dish_ingredients liên kết đúng dish_id và ingredient_id sau migration | Positive | P0 |
| TC_MIG_33 | dayPlans chứa đúng dish_ids tham chiếu đến dishes đã migrate | Positive | P1 |
| TC_MIG_34 | FK constraint không bị vi phạm sau toàn bộ quá trình migration | Positive | P1 |
| TC_MIG_35 | Flag mp-migrated-to-sqlite được set với timestamp sau migration | Positive | P0 |
| TC_MIG_36 | Flag không bị mất khi reload ứng dụng | Positive | P1 |
| TC_MIG_37 | Flag chứa giá trị timestamp ISO 8601 hợp lệ | Boundary | P2 |
| TC_MIG_38 | createV2Export tạo payload đúng cấu trúc V2ExportPayload | Positive | P0 |
| TC_MIG_39 | Export payload chứa _version='2.0' và _format='sqlite-json' | Positive | P0 |
| TC_MIG_40 | Export payload chứa _legacyFormat cho backward compatibility | Positive | P1 |
| TC_MIG_41 | importV2Data restore đầy đủ dữ liệu 16 bảng từ v2.0 payload | Positive | P0 |
| TC_MIG_42 | importedCounts khớp chính xác số lượng rows mỗi bảng | Positive | P1 |
| TC_MIG_43 | Import xóa toàn bộ dữ liệu cũ trước khi chèn dữ liệu mới | Positive | P1 |
| TC_MIG_44 | Round-trip Export→Import→Export tạo kết quả identical | Positive | P0 |
| TC_MIG_45 | Round-trip bảo toàn tất cả FK relationships qua các bảng | Positive | P1 |
| TC_MIG_46 | buildLegacyFormat tái tạo cấu trúc localStorage v1.x từ flat rows | Positive | P1 |
| TC_MIG_47 | Legacy format xử lý bilingual names (name_vi, name_en) đúng cách | Positive | P1 |
| TC_MIG_48 | Legacy format tái tạo dish_ingredients join thành nested array | Edge | P2 |
| TC_MIG_49 | importV2Data tự động chuyển đổi v1.x sang v2.0 khi import | Positive | P0 |
| TC_MIG_50 | transformLegacyToV2Tables xử lý cả camelCase và snake_case | Edge | P1 |
| TC_MIG_51 | detectVersion trả về '2.0' cho payload có _version='2.0' | Positive | P0 |
| TC_MIG_52 | detectVersion trả về '1.x' cho payload không có trường _version | Positive | P1 |
| TC_MIG_53 | Import rollback toàn bộ khi FK constraint bị vi phạm | Negative | P0 |
| TC_MIG_54 | Export/Import xử lý bảng rỗng (0 rows) không gây lỗi | Edge | P1 |
| TC_MIG_55 | IMPORT_ORDER chứa đúng và đủ 16 bảng theo thứ tự FK-safe | Boundary | P0 |
| TC_MIG_56 | isMigrationNeeded: chỉ có key mp-ingredients tồn tại → true | Positive | P0 |
| TC_MIG_57 | isMigrationNeeded: chỉ có key mp-dishes tồn tại → true | Positive | P0 |
| TC_MIG_58 | isMigrationNeeded: chỉ có key mp-day-plans tồn tại → true | Positive | P1 |
| TC_MIG_59 | isMigrationNeeded: chỉ có key mp-user-profile tồn tại → true | Positive | P1 |
| TC_MIG_60 | isMigrationNeeded: chỉ có key meal-templates tồn tại → true | Positive | P1 |
| TC_MIG_61 | isMigrationNeeded: tất cả 5 keys tồn tại → true | Positive | P0 |
| TC_MIG_62 | isMigrationNeeded: không có localStorage data → false | Negative | P0 |
| TC_MIG_63 | isMigrationNeeded: migration flag đã set + có data → false (idempotent) | Positive | P0 |
| TC_MIG_64 | isMigrationCompleted: flag = ISO timestamp hợp lệ → true | Positive | P0 |
| TC_MIG_65 | isMigrationCompleted: flag = chuỗi rỗng → behavior xác định | Boundary | P1 |
| TC_MIG_66 | Migration flag key chính xác = 'mp-migrated-to-sqlite' | Positive | P0 |
| TC_MIG_67 | Migration flag value = ISO timestamp sau migration thành công | Positive | P1 |
| TC_MIG_68 | readZustandState: parse Zustand format {state: {prop: data}} đúng | Positive | P0 |
| TC_MIG_69 | readZustandState: localStorage value không phải Zustand format → null | Negative | P1 |
| TC_MIG_70 | readZustandState: localStorage value là empty string → null | Negative | P1 |
| TC_MIG_71 | readZustandState: localStorage value là invalid JSON → null | Negative | P0 |
| TC_MIG_72 | readZustandState: Zustand state có prop nhưng value=null → null | Boundary | P1 |
| TC_MIG_73 | readZustandState: Zustand state có prop value=[] (empty array) → [] | Boundary | P1 |
| TC_MIG_74 | readZustandState: key không tồn tại trong localStorage → null | Negative | P1 |
| TC_MIG_75 | readZustandState: parse nested object từ Zustand state đúng | Positive | P1 |
| TC_MIG_76 | Migration 5 ingredients với đầy đủ fields → 5 rows trong bảng ingredients | Positive | P0 |
| TC_MIG_77 | Migration 10 ingredients → 10 rows | Positive | P0 |
| TC_MIG_78 | Migration 50 ingredients → 50 rows | Positive | P1 |
| TC_MIG_79 | Migration 100 ingredients → 100 rows | Performance | P1 |
| TC_MIG_80 | Migration 500 ingredients → 500 rows, thời gian < 5s | Performance | P2 |
| TC_MIG_81 | Migration dishes với 0 ingredients mỗi dish | Boundary | P0 |
| TC_MIG_82 | Migration dishes với 1 ingredient mỗi dish | Positive | P0 |
| TC_MIG_83 | Migration dishes với 5 ingredients mỗi dish → dish_ingredients correct | Positive | P0 |
| TC_MIG_84 | Migration day plans cho 1 ngày | Positive | P0 |
| TC_MIG_85 | Migration day plans cho 7 ngày | Positive | P0 |
| TC_MIG_86 | Migration day plans cho 30 ngày | Positive | P1 |
| TC_MIG_87 | Migration day plans cho 365 ngày | Performance | P2 |
| TC_MIG_88 | Migration user profile với tất cả fields có giá trị | Positive | P0 |
| TC_MIG_89 | Migration user profile thiếu fields → dùng defaults | Positive | P0 |
| TC_MIG_90 | User profile defaults: gender='male', age=30, height=170 | Positive | P0 |
| TC_MIG_91 | Migration meal templates: 0 templates → 0 rows | Boundary | P0 |
| TC_MIG_92 | Migration meal templates: 4 templates → 4 rows | Positive | P0 |
| TC_MIG_93 | Migration ingredients: name.vi và name.en → name_vi, name_en | Positive | P0 |
| TC_MIG_94 | Migration ingredients: caloriesPer100 → calories_per_100 (snake_case) | Positive | P0 |
| TC_MIG_95 | Migration dishes: ingredients array → dish_ingredients junction table | Positive | P0 |
| TC_MIG_96 | Migration dayPlans: breakfast/lunch/dinner arrays → JSON strings | Positive | P0 |
| TC_MIG_97 | Migration mealTemplates: full template → JSON trong cột data | Positive | P1 |
| TC_MIG_98 | MigrationResult.success = true khi migration thành công | Positive | P0 |
| TC_MIG_99 | MigrationResult.migratedCounts chính xác cho mỗi entity | Positive | P0 |
| TC_MIG_100 | MigrationResult.error = undefined khi thành công | Positive | P1 |
| TC_MIG_101 | Partial: chỉ có ingredients key → migrate ingredients, skip dishes/plans | Positive | P0 |
| TC_MIG_102 | Partial: chỉ có dishes key → migrate dishes, skip ingredients | Positive | P1 |
| TC_MIG_103 | Partial: ingredients + dishes, không có day-plans | Positive | P1 |
| TC_MIG_104 | Empty arrays: mp-ingredients = {state: {ingredients: []}} → 0 rows | Boundary | P0 |
| TC_MIG_105 | Empty arrays: mp-dishes = {state: {dishes: []}} → 0 rows | Boundary | P0 |
| TC_MIG_106 | Empty arrays: tất cả 5 keys đều empty arrays | Boundary | P1 |
| TC_MIG_107 | Corrupt: mp-ingredients chứa invalid JSON → migration fail gracefully | Negative | P0 |
| TC_MIG_108 | Corrupt: mp-dishes chứa invalid JSON → error | Negative | P0 |
| TC_MIG_109 | Corrupt: mp-day-plans chứa invalid JSON → error | Negative | P1 |
| TC_MIG_110 | Corrupt: ingredient thiếu field 'name' → handle hoặc skip | Negative | P1 |
| TC_MIG_111 | Corrupt: ingredient có caloriesPer100=NaN → handle | Negative | P1 |
| TC_MIG_112 | Corrupt: ingredient có caloriesPer100='abc' (string thay vì number) → handle | Negative | P1 |
| TC_MIG_113 | Corrupt: dish có ingredients=null thay vì array → handle | Negative | P1 |
| TC_MIG_114 | Corrupt: dayPlan có breakfast=undefined → handle | Negative | P1 |
| TC_MIG_115 | Migration idempotency: chạy lần 1 thành công → flag set | Positive | P0 |
| TC_MIG_116 | Migration idempotency: chạy lần 2 → isMigrationNeeded=false, skip | Positive | P0 |
| TC_MIG_117 | Rollback: FK violation giữa dish_ingredients → ingredients → rollback toàn bộ | Negative | P0 |
| TC_MIG_118 | Rollback: exception trong migrate dishes → rollback tất cả (kể cả ingredients đã insert) | Negative | P0 |
| TC_MIG_119 | Rollback: localStorage preserved sau migration failure | Negative | P0 |
| TC_MIG_120 | Rollback: migration flag KHÔNG set khi thất bại | Negative | P0 |
| TC_MIG_121 | FK integrity: dish_ingredients.ingredient_id tham chiếu ingredients.id hợp lệ | Positive | P0 |
| TC_MIG_122 | FK integrity: dish_ingredients.dish_id tham chiếu dishes.id hợp lệ | Positive | P0 |
| TC_MIG_123 | Migration order: ingredients trước dishes (FK-safe) | Positive | P0 |
| TC_MIG_124 | Migration order: dishes trước dish_ingredients | Positive | P0 |
| TC_MIG_125 | Migration order: ingredients → dishes → dish_ingredients → day_plans → user_profile → meal_templates | Positive | P0 |
| TC_MIG_126 | Migration 1000 ingredients: thời gian hợp lý (< 10s) | Performance | P1 |
| TC_MIG_127 | Migration toàn bộ trong 1 transaction atomic | Positive | P0 |
| TC_MIG_128 | Transaction: commit chỉ khi tất cả bước thành công | Positive | P0 |
| TC_MIG_129 | Transaction: rollback khi bất kỳ bước nào thất bại | Positive | P0 |
| TC_MIG_130 | Sau migration thành công: SQLite data query được | Positive | P0 |
| TC_MIG_131 | Export: output có _version='2.0' | Positive | P0 |
| TC_MIG_132 | Export: output có _exportedAt là ISO timestamp | Positive | P0 |
| TC_MIG_133 | Export: output có _format='sqlite-json' | Positive | P0 |
| TC_MIG_134 | Export: output có tables object | Positive | P0 |
| TC_MIG_135 | Export: tables chứa đúng 16 bảng | Positive | P0 |
| TC_MIG_136 | Export: bảng ingredients có đúng số rows từ DB | Positive | P0 |
| TC_MIG_137 | Export: bảng dishes có đúng số rows | Positive | P0 |
| TC_MIG_138 | Export: bảng dish_ingredients có đúng số rows | Positive | P0 |
| TC_MIG_139 | Export: bảng day_plans có đúng số rows | Positive | P0 |
| TC_MIG_140 | Export: bảng user_profile có đúng số rows | Positive | P1 |
| TC_MIG_141 | Export: bảng goals có rows (hoặc empty) | Positive | P1 |
| TC_MIG_142 | Export: bảng exercises có rows | Positive | P1 |
| TC_MIG_143 | Export: bảng training_profile có rows | Positive | P1 |
| TC_MIG_144 | Export: bảng training_plans có rows | Positive | P1 |
| TC_MIG_145 | Export: bảng training_plan_days có rows | Positive | P1 |
| TC_MIG_146 | Export: bảng workouts có rows | Positive | P1 |
| TC_MIG_147 | Export: bảng workout_sets có rows | Positive | P1 |
| TC_MIG_148 | Export: bảng weight_log có rows | Positive | P1 |
| TC_MIG_149 | Export: bảng daily_log có rows | Positive | P1 |
| TC_MIG_150 | Export: bảng adjustments có rows | Positive | P1 |
| TC_MIG_151 | Export: bảng meal_templates có rows | Positive | P1 |
| TC_MIG_152 | Export: JSON output hợp lệ và parseable | Positive | P0 |
| TC_MIG_153 | Export: _legacyFormat tồn tại khi được yêu cầu | Positive | P1 |
| TC_MIG_154 | Export: row counts khớp với SELECT COUNT(*) từ DB | Positive | P0 |
| TC_MIG_155 | Export: empty database → tất cả tables empty arrays | Boundary | P0 |
| TC_MIG_156 | Import v2.0: restores tất cả 16 bảng | Positive | P0 |
| TC_MIG_157 | Import v2.0: clears existing data trước khi insert | Positive | P0 |
| TC_MIG_158 | Import: DELETE theo thứ tự reverse FK (children first) | Positive | P0 |
| TC_MIG_159 | Import: INSERT theo thứ tự FK-safe (parents first) | Positive | P0 |
| TC_MIG_160 | Import: ingredients table restored đúng | Positive | P0 |
| TC_MIG_161 | Import: dishes table restored đúng | Positive | P0 |
| TC_MIG_162 | Import: dish_ingredients table restored đúng | Positive | P0 |
| TC_MIG_163 | Import: day_plans table restored đúng | Positive | P0 |
| TC_MIG_164 | Import: user_profile table restored đúng | Positive | P1 |
| TC_MIG_165 | Import: workouts table restored đúng | Positive | P1 |
| TC_MIG_166 | Import: workout_sets table restored đúng | Positive | P1 |
| TC_MIG_167 | Import: weight_log table restored đúng | Positive | P1 |
| TC_MIG_168 | Import: ImportResult.success = true khi thành công | Positive | P0 |
| TC_MIG_169 | Import: ImportResult.importedCounts chính xác | Positive | P0 |
| TC_MIG_170 | Import: ImportResult.error = undefined khi thành công | Positive | P1 |
| TC_MIG_171 | Round-trip: export → import → export = identical data | Positive | P0 |
| TC_MIG_172 | Round-trip: row counts match giữa 2 exports | Positive | P0 |
| TC_MIG_173 | Round-trip: field values identical | Positive | P0 |
| TC_MIG_174 | Import FK violation → rollback toàn bộ | Negative | P0 |
| TC_MIG_175 | Import: bảng rỗng (0 rows) → import OK, bảng trống | Boundary | P0 |
| TC_MIG_176 | Import: partial data (chỉ một số bảng) → handle gracefully | Boundary | P1 |
| TC_MIG_177 | Import: duplicate primary keys → handle/replace | Boundary | P1 |
| TC_MIG_178 | Import: extra unknown table → ignored | Boundary | P2 |
| TC_MIG_179 | Import: missing required table → error hoặc skip | Negative | P1 |
| TC_MIG_180 | Import trong transaction atomic: toàn bộ hoặc nothing | Positive | P0 |
| TC_MIG_181 | Import large dataset: 10000 rows total → thành công | Performance | P2 |
| TC_MIG_182 | Import: dynamic column detection cho mỗi bảng | Positive | P1 |
| TC_MIG_183 | Import: parameterized inserts (SQL injection safe) | Positive | P0 |
| TC_MIG_184 | Import clears ALL tables trước insert (clean slate) | Positive | P0 |
| TC_MIG_185 | Import: bảng meal_templates restored với JSON data intact | Positive | P1 |
| TC_MIG_186 | detectVersion: payload có _version='2.0' → return '2.0' | Positive | P0 |
| TC_MIG_187 | detectVersion: payload không có _version → return '1.x' | Positive | P0 |
| TC_MIG_188 | detectVersion: payload có _version='1.0' → return '1.x' | Positive | P1 |
| TC_MIG_189 | detectVersion: payload có _version=null → return '1.x' | Boundary | P0 |
| TC_MIG_190 | detectVersion: payload có _version=undefined → return '1.x' | Boundary | P0 |
| TC_MIG_191 | detectVersion: payload có _version='' (empty string) → return '1.x' | Boundary | P1 |
| TC_MIG_192 | detectVersion: payload = null → return '1.x' | Negative | P1 |
| TC_MIG_193 | buildLegacyFormat: output có cấu trúc localStorage v1.x | Positive | P0 |
| TC_MIG_194 | buildLegacyFormat: ingredients → LocalizedString name restoration (vi/en) | Positive | P0 |
| TC_MIG_195 | buildLegacyFormat: dishes → re-embed ingredients array | Positive | P0 |
| TC_MIG_196 | buildLegacyFormat: day_plans → restore meal arrays | Positive | P1 |
| TC_MIG_197 | buildLegacyFormat: user_profile → restore profile object | Positive | P1 |
| TC_MIG_198 | transformLegacyToV2Tables: v1.x ingredients → v2.0 flat rows | Positive | P0 |
| TC_MIG_199 | transformLegacyToV2Tables: v1.x dishes → v2.0 flat rows + dish_ingredients | Positive | P0 |
| TC_MIG_200 | transformLegacyToV2Tables: camelCase → snake_case conversion | Positive | P0 |
| TC_MIG_201 | v1→v2 upgrade: auto-detect v1.x → transform → import | Positive | P0 |
| TC_MIG_202 | v1→v2: ingredient name.vi/name.en → name_vi/name_en | Positive | P0 |
| TC_MIG_203 | v1→v2: dish.ingredients nested → dish_ingredients junction | Positive | P0 |
| TC_MIG_204 | v1→v2: dayPlan breakfast/lunch/dinner → JSON strings | Positive | P1 |
| TC_MIG_205 | v1→v2: user_profile defaults applied (gender='male', age=30) | Positive | P1 |
| TC_MIG_206 | safeJsonParse: input là valid JSON string → parse OK | Positive | P0 |
| TC_MIG_207 | safeJsonParse: input là invalid JSON string → return original | Negative | P0 |
| TC_MIG_208 | safeJsonParse: input không phải string (number) → return as-is | Positive | P1 |
| TC_MIG_209 | safeJsonParse: input là null → return null | Boundary | P1 |
| TC_MIG_210 | IMPORT_ORDER: chứa đúng 16 bảng và thứ tự FK-safe verified | Positive | P0 |

---

## Chi tiết Test Cases

### A. Migration Detection (TC_MIG_01 → TC_MIG_05)

##### TC_MIG_01: isMigrationCompleted trả về false khi chưa có flag
- **Pre-conditions**: localStorage hoàn toàn trống, không có key `mp-migrated-to-sqlite`
- **Steps**:
  1. Xóa toàn bộ localStorage bằng `localStorage.clear()`
  2. Gọi `isMigrationCompleted()`
  3. Kiểm tra giá trị trả về
- **Expected**: Hàm trả về `false`, xác nhận rằng migration chưa từng được thực hiện
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_02: isMigrationCompleted trả về true khi flag đã tồn tại
- **Pre-conditions**: localStorage có key `mp-migrated-to-sqlite` với giá trị timestamp (ví dụ: `'2026-06-12T10:00:00.000Z'`)
- **Steps**:
  1. Set `localStorage.setItem('mp-migrated-to-sqlite', '2026-06-12T10:00:00.000Z')`
  2. Gọi `isMigrationCompleted()`
  3. Kiểm tra giá trị trả về
- **Expected**: Hàm trả về `true`, xác nhận flag đã tồn tại và migration đã hoàn tất trước đó
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_03: isMigrationNeeded trả về true khi có dữ liệu localStorage
- **Pre-conditions**: localStorage chưa có flag migration; key `mp-ingredients` chứa dữ liệu Zustand hợp lệ `{ state: { ingredients: [...] } }`
- **Steps**:
  1. Xóa flag `mp-migrated-to-sqlite` nếu có
  2. Set `localStorage.setItem('mp-ingredients', JSON.stringify({ state: { ingredients: [{ id: '1', name_vi: 'Gạo' }] } }))`
  3. Gọi `isMigrationNeeded()`
  4. Kiểm tra giá trị trả về
- **Expected**: Hàm trả về `true` vì có ít nhất 1 trong 5 localStorage keys tồn tại và flag chưa được set
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_04: isMigrationNeeded trả về false khi đã migrated
- **Pre-conditions**: localStorage có flag `mp-migrated-to-sqlite` đã set; các key dữ liệu vẫn còn tồn tại
- **Steps**:
  1. Set flag `localStorage.setItem('mp-migrated-to-sqlite', '2026-06-12T10:00:00.000Z')`
  2. Set dữ liệu `localStorage.setItem('mp-ingredients', JSON.stringify({ state: { ingredients: [{ id: '1' }] } }))`
  3. Gọi `isMigrationNeeded()`
  4. Kiểm tra giá trị trả về
- **Expected**: Hàm trả về `false` vì flag migration đã tồn tại, bất kể dữ liệu localStorage còn hay không
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_05: isMigrationNeeded trả về false khi không có localStorage key nào
- **Pre-conditions**: localStorage hoàn toàn trống — không có flag, không có bất kỳ key dữ liệu nào trong 5 keys
- **Steps**:
  1. Gọi `localStorage.clear()` xóa toàn bộ
  2. Xác nhận không có key nào: `mp-ingredients`, `mp-dishes`, `mp-day-plans`, `mp-user-profile`, `meal-templates`
  3. Gọi `isMigrationNeeded()`
  4. Kiểm tra giá trị trả về
- **Expected**: Hàm trả về `false` vì không có dữ liệu cũ nào cần di chuyển (fresh install)
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

---

### B. Full Migration (TC_MIG_06 → TC_MIG_12)

##### TC_MIG_06: Migration toàn bộ 5 nhóm dữ liệu thành công
- **Pre-conditions**: localStorage chứa đầy đủ dữ liệu cho 5 keys: mp-ingredients (3 items), mp-dishes (2 items, mỗi dish có 2 ingredients), mp-day-plans (1 ngày), mp-user-profile (1 profile), meal-templates (1 template). SQLite DB đã khởi tạo schema. Flag migration chưa set.
- **Steps**:
  1. Chuẩn bị localStorage với dữ liệu mẫu đầy đủ cho 5 keys theo cấu trúc Zustand `{ state: { [prop]: data } }`
  2. Khởi tạo DatabaseService instance `db`
  3. Gọi `const result = await migrateFromLocalStorage(db)`
  4. Kiểm tra `result.success`
  5. Query SQLite xác nhận dữ liệu trong 6 bảng: ingredients, dishes, dish_ingredients, day_plans, user_profile, meal_templates
  6. Kiểm tra localStorage flag `mp-migrated-to-sqlite` đã được set
- **Expected**: `result.success === true`; tất cả 6 bảng SQLite chứa đúng số lượng rows tương ứng; flag migration đã set với timestamp; `result.migratedCounts` có giá trị hợp lệ cho mỗi nhóm
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_07: Migrate ingredients với đầy đủ fields nutrition
- **Pre-conditions**: localStorage key `mp-ingredients` chứa 2 ingredients với tất cả fields: id, name_vi, name_en, calories_per_100, protein_per_100, carbs_per_100, fat_per_100, fiber_per_100, unit_vi, unit_en
- **Steps**:
  1. Set localStorage với 2 ingredients mẫu (ví dụ: Gạo — 130kcal/100g và Ức gà — 165kcal/100g)
  2. Gọi `migrateFromLocalStorage(db)`
  3. Query `SELECT * FROM ingredients`
  4. So sánh từng field với dữ liệu gốc trong localStorage
- **Expected**: 2 rows trong bảng ingredients; mỗi row có đầy đủ 10 cột (id, name_vi, name_en, calories_per_100, protein_per_100, carbs_per_100, fat_per_100, fiber_per_100, unit_vi, unit_en) khớp chính xác với dữ liệu nguồn
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_08: Migrate dishes kèm tách dish_ingredients sang bảng riêng
- **Pre-conditions**: localStorage có `mp-ingredients` (3 items) và `mp-dishes` (2 dishes, mỗi dish có mảng ingredients nested với ingredient_id và amount)
- **Steps**:
  1. Set localStorage cho ingredients: [{id:'i1'}, {id:'i2'}, {id:'i3'}]
  2. Set localStorage cho dishes: [{id:'d1', name_vi:'Cơm gà', ingredients:[{ingredient_id:'i1', amount:200}, {ingredient_id:'i2', amount:150}]}, {id:'d2', name_vi:'Phở', ingredients:[{ingredient_id:'i3', amount:300}]}]
  3. Gọi `migrateFromLocalStorage(db)`
  4. Query `SELECT * FROM dishes` và `SELECT * FROM dish_ingredients`
  5. Kiểm tra liên kết FK giữa dish_ingredients và dishes/ingredients
- **Expected**: Bảng dishes có 2 rows (d1, d2) với name_vi, name_en, tags(JSON), rating, notes; bảng dish_ingredients có 3 rows liên kết đúng (d1→i1:200, d1→i2:150, d2→i3:300)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_09: Migrate dayPlans với JSON arrays cho breakfast/lunch/dinner
- **Pre-conditions**: localStorage có `mp-day-plans` chứa 2 ngày kế hoạch, mỗi ngày có breakfast_dish_ids, lunch_dish_ids, dinner_dish_ids (JSON arrays) và servings (JSON object)
- **Steps**:
  1. Set localStorage cho day_plans: [{date:'2026-06-10', breakfast_dish_ids:['d1'], lunch_dish_ids:['d1','d2'], dinner_dish_ids:[], servings:{d1:2, d2:1}}, {date:'2026-06-11', breakfast_dish_ids:[], lunch_dish_ids:['d2'], dinner_dish_ids:['d1'], servings:{d1:1, d2:1}}]
  2. Gọi `migrateFromLocalStorage(db)`
  3. Query `SELECT * FROM day_plans`
  4. Parse các cột JSON và so sánh
- **Expected**: 2 rows trong bảng day_plans; cột breakfast_dish_ids, lunch_dish_ids, dinner_dish_ids chứa JSON arrays hợp lệ; cột servings chứa JSON object hợp lệ; tất cả dish_ids tham chiếu đều tồn tại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_10: Migrate userProfile áp dụng giá trị hardcoded mặc định
- **Pre-conditions**: localStorage có `mp-user-profile` chứa user profile data
- **Steps**:
  1. Set localStorage cho user_profile theo cấu trúc Zustand
  2. Gọi `migrateFromLocalStorage(db)`
  3. Query `SELECT * FROM user_profile WHERE id = 'default'`
  4. Kiểm tra từng field giá trị mặc định
- **Expected**: 1 row với id='default', gender='male', age=30, height=170 (height_cm), activity='moderate' (activity_level), fat_pct=0.25; các giá trị hardcoded được áp dụng đúng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_11: Migrate mealTemplates với full JSON data trong cột data
- **Pre-conditions**: localStorage có `meal-templates` chứa 2 meal templates, mỗi template có id, name, và data object phức tạp (chứa meal plan cho 7 ngày)
- **Steps**:
  1. Set localStorage cho meal_templates: [{id:'t1', name:'Keto tuần', data:{monday:{breakfast:['d1'],...},...}}, {id:'t2', name:'Ăn sạch', data:{...}}]
  2. Gọi `migrateFromLocalStorage(db)`
  3. Query `SELECT * FROM meal_templates`
  4. Parse cột data và so sánh với dữ liệu gốc
- **Expected**: 2 rows trong bảng meal_templates; cột id và name khớp chính xác; cột data chứa full JSON serialized data có thể parse ngược lại thành object giống hệt bản gốc
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_12: migratedCounts phản ánh chính xác số lượng từng bảng
- **Pre-conditions**: localStorage có 3 ingredients, 2 dishes (tổng 4 dish_ingredients), 2 day_plans, 1 user_profile, 1 meal_template
- **Steps**:
  1. Chuẩn bị localStorage với số lượng dữ liệu cụ thể như trên
  2. Gọi `const result = await migrateFromLocalStorage(db)`
  3. Kiểm tra `result.migratedCounts`
- **Expected**: `result.migratedCounts` = `{ ingredients: 3, dishes: 2, dishIngredients: 4, dayPlans: 2, userProfile: true, mealTemplates: 1 }`; mỗi con số khớp chính xác với số items trong localStorage
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

---

### C. Partial Data Migration (TC_MIG_13 → TC_MIG_17)

##### TC_MIG_13: Migration khi chỉ có ingredients trong localStorage
- **Pre-conditions**: Chỉ có key `mp-ingredients` trong localStorage (3 items); 4 keys còn lại không tồn tại. Flag migration chưa set.
- **Steps**:
  1. Xóa toàn bộ localStorage
  2. Chỉ set `mp-ingredients` với 3 ingredients hợp lệ
  3. Gọi `migrateFromLocalStorage(db)`
  4. Query tất cả 6 bảng SQLite
- **Expected**: `success: true`; bảng ingredients có 3 rows; các bảng dishes, dish_ingredients, day_plans, meal_templates có 0 rows; user_profile có thể rỗng hoặc có defaults; `migratedCounts.ingredients === 3`, các counts khác === 0; flag được set
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_MIG_14: Migration khi chỉ có dishes mà không có ingredients
- **Pre-conditions**: Chỉ có key `mp-dishes` trong localStorage (2 dishes có nested ingredients); key `mp-ingredients` không tồn tại
- **Steps**:
  1. Set localStorage chỉ với `mp-dishes` chứa 2 dishes (có ingredient references)
  2. Gọi `migrateFromLocalStorage(db)`
  3. Kiểm tra result và query bảng dishes, dish_ingredients, ingredients
- **Expected**: Migration hoàn tất (success: true); bảng dishes có 2 rows; bảng dish_ingredients có thể có rows nhưng ingredient_id references có thể không tồn tại trong bảng ingredients (tùy implementation: hoặc skip dish_ingredients, hoặc insert vẫn thành công nếu FK không enforce)
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_MIG_15: Migration khi thiếu userProfile trong localStorage
- **Pre-conditions**: Có mp-ingredients (2 items), mp-dishes (1 item); KHÔNG có mp-user-profile; flag chưa set
- **Steps**:
  1. Set localStorage cho ingredients và dishes
  2. Không set mp-user-profile
  3. Gọi `migrateFromLocalStorage(db)`
  4. Query bảng user_profile
- **Expected**: Migration thành công; ingredients và dishes được migrate bình thường; bảng user_profile có thể rỗng (0 rows) hoặc service bỏ qua bước migrate profile; `migratedCounts.userProfile === false`
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_MIG_16: Migration khi chỉ có dayPlans và dishes
- **Pre-conditions**: Chỉ có `mp-day-plans` (1 ngày) và `mp-dishes` (2 dishes) trong localStorage; thiếu ingredients, user_profile, meal_templates
- **Steps**:
  1. Set localStorage cho day_plans và dishes
  2. Gọi `migrateFromLocalStorage(db)`
  3. Query day_plans, dishes, và các bảng liên quan
- **Expected**: Migration thành công; dishes: 2 rows, day_plans: 1 row; ingredients: 0, meal_templates: 0; dish_ingredients phụ thuộc vào nested data trong dishes; flag được set
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P2

##### TC_MIG_17: Migration khi có mealTemplates nhưng thiếu dishes
- **Pre-conditions**: Chỉ có `meal-templates` (2 templates) trong localStorage; thiếu tất cả key khác
- **Steps**:
  1. Set localStorage chỉ với `meal-templates` chứa 2 template objects
  2. Gọi `migrateFromLocalStorage(db)`
  3. Kiểm tra result và query meal_templates
- **Expected**: Migration thành công; meal_templates: 2 rows; các bảng khác rỗng; templates chứa references đến dishes không tồn tại trong DB nhưng không gây lỗi vì data được lưu dạng JSON blob
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P2

---

### D. Empty localStorage (TC_MIG_18 → TC_MIG_20)

##### TC_MIG_18: Migration khi tất cả localStorage keys rỗng (empty arrays)
- **Pre-conditions**: 5 localStorage keys tồn tại nhưng mỗi key chứa Zustand state với mảng rỗng: `{ state: { ingredients: [] } }`, tương tự cho dishes, day_plans, meal_templates. User_profile state cũng rỗng.
- **Steps**:
  1. Set 5 keys với dữ liệu Zustand rỗng
  2. Gọi `migrateFromLocalStorage(db)`
  3. Kiểm tra result.success và migratedCounts
  4. Query tất cả bảng SQLite
- **Expected**: `success: true`; tất cả bảng có 0 rows; `migratedCounts` = `{ ingredients: 0, dishes: 0, dishIngredients: 0, dayPlans: 0, userProfile: false, mealTemplates: 0 }`; flag vẫn được set (migration hoàn tất dù không có gì để migrate)
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_MIG_19: Migration khi localStorage key tồn tại nhưng mảng rỗng []
- **Pre-conditions**: Key `mp-ingredients` chứa `{ state: { ingredients: [] } }`; các key khác không tồn tại; `isMigrationNeeded()` vẫn trả về true vì key tồn tại
- **Steps**:
  1. Chỉ set `mp-ingredients` với mảng rỗng theo cấu trúc Zustand
  2. Xác nhận `isMigrationNeeded()` trả về `true`
  3. Gọi `migrateFromLocalStorage(db)`
  4. Kiểm tra result và bảng ingredients
- **Expected**: `isMigrationNeeded()` = true (key tồn tại); migration thành công; bảng ingredients: 0 rows; `migratedCounts.ingredients === 0`; flag được set
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

##### TC_MIG_20: migratedCounts trả về 0 cho tất cả khi dữ liệu rỗng
- **Pre-conditions**: Tất cả 5 keys tồn tại với mảng/object rỗng
- **Steps**:
  1. Set 5 localStorage keys với dữ liệu rỗng
  2. Gọi `const result = await migrateFromLocalStorage(db)`
  3. Kiểm tra từng field trong `result.migratedCounts`
- **Expected**: `migratedCounts.ingredients === 0`, `migratedCounts.dishes === 0`, `migratedCounts.dishIngredients === 0`, `migratedCounts.dayPlans === 0`, `migratedCounts.userProfile === false`, `migratedCounts.mealTemplates === 0`; tổng cộng không có row nào được insert
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P2

---

### E. Corrupt Data (TC_MIG_21 → TC_MIG_25)

##### TC_MIG_21: Migration thất bại khi localStorage chứa JSON không hợp lệ
- **Pre-conditions**: Key `mp-ingredients` chứa chuỗi không phải JSON: `'not a json string {{'`; các key khác hợp lệ
- **Steps**:
  1. Set `localStorage.setItem('mp-ingredients', 'not a json string {{')`
  2. Set các key khác với dữ liệu hợp lệ
  3. Gọi `const result = await migrateFromLocalStorage(db)`
  4. Kiểm tra result.success và result.error
  5. Query tất cả bảng SQLite xác nhận rollback
- **Expected**: `result.success === false`; `result.error` chứa thông báo lỗi mô tả JSON parse failure; tất cả bảng SQLite rỗng (transaction đã rollback); flag KHÔNG được set
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MIG_22: readZustandState xử lý cấu trúc thiếu prop state
- **Pre-conditions**: Key `mp-ingredients` chứa JSON hợp lệ nhưng không theo cấu trúc Zustand: `{ "data": [1,2,3] }` thay vì `{ "state": { "ingredients": [...] } }`
- **Steps**:
  1. Set `localStorage.setItem('mp-ingredients', JSON.stringify({ data: [1,2,3] }))`
  2. Gọi `readZustandState('mp-ingredients', 'ingredients')`
  3. Kiểm tra giá trị trả về
  4. Gọi migration và kiểm tra kết quả
- **Expected**: `readZustandState` trả về null/undefined vì property `state.ingredients` không tồn tại; migration vẫn tiếp tục xử lý các keys khác (hoặc coi như ingredients rỗng); không crash
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_MIG_23: Migration xử lý ingredient thiếu trường bắt buộc (name_vi)
- **Pre-conditions**: Key `mp-ingredients` chứa 2 ingredients: 1 hợp lệ đầy đủ, 1 thiếu trường `name_vi`
- **Steps**:
  1. Set ingredients: `[{id:'i1', name_vi:'Gạo', calories_per_100:130, ...}, {id:'i2', calories_per_100:165, protein_per_100:31}]` (thiếu name_vi)
  2. Gọi `migrateFromLocalStorage(db)`
  3. Kiểm tra result và query bảng ingredients
- **Expected**: Tùy implementation: (a) migration thất bại + rollback nếu name_vi là NOT NULL; hoặc (b) ingredient thiếu field được insert với name_vi = null/empty; hoặc (c) chỉ ingredient hợp lệ được insert. Không được crash ứng dụng.
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_MIG_24: Migration xử lý dish với tags không phải JSON array
- **Pre-conditions**: Key `mp-dishes` chứa 1 dish với `tags: "not-an-array"` thay vì `tags: ["tag1", "tag2"]`
- **Steps**:
  1. Set dish: `{id:'d1', name_vi:'Cơm', tags:'not-an-array', rating:4}`
  2. Gọi `migrateFromLocalStorage(db)`
  3. Query bảng dishes kiểm tra cột tags
- **Expected**: Migration không crash; cột tags trong SQLite chứa giá trị serialized (có thể là string `"not-an-array"` hoặc JSON `"\"not-an-array\""` tùy implementation); phần còn lại của dish được migrate bình thường
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P2

##### TC_MIG_25: Migration xử lý dayPlan với date format không chuẩn
- **Pre-conditions**: Key `mp-day-plans` chứa 1 day_plan với date format sai: `'12/06/2026'` thay vì `'2026-06-12'` (YYYY-MM-DD)
- **Steps**:
  1. Set day_plan: `{date:'12/06/2026', breakfast_dish_ids:['d1'], lunch_dish_ids:[], dinner_dish_ids:[], servings:{}}`
  2. Gọi `migrateFromLocalStorage(db)`
  3. Query bảng day_plans kiểm tra cột date
- **Expected**: Migration không crash; cột date chứa giá trị như được cung cấp (`'12/06/2026'`); service không validate date format mà chỉ lưu nguyên bản (garbage in, garbage out); phần còn lại của migration hoàn tất bình thường
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P2

---

### F. Idempotency (TC_MIG_26 → TC_MIG_28)

##### TC_MIG_26: Chạy migration lần 2 không tạo dữ liệu trùng lặp
- **Pre-conditions**: Migration lần 1 đã hoàn tất thành công, flag đã set, dữ liệu đã có trong SQLite
- **Steps**:
  1. Chuẩn bị localStorage với 2 ingredients, 1 dish
  2. Gọi `migrateFromLocalStorage(db)` lần 1 — thành công
  3. Xác nhận flag đã set và bảng ingredients có 2 rows
  4. Kiểm tra `isMigrationCompleted()` trả về true
  5. Kiểm tra `isMigrationNeeded()` trả về false
  6. Nếu vẫn gọi `migrateFromLocalStorage(db)` lần 2 (bypass check)
  7. Query bảng ingredients đếm rows
- **Expected**: Sau lần 1: 2 rows ingredients; `isMigrationNeeded()` = false → bình thường sẽ không gọi migration lần 2; nếu bypass gọi lại: không tạo thêm rows trùng (hoặc service tự kiểm tra flag và return early)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_27: isMigrationNeeded trả về false ngay sau migration thành công
- **Pre-conditions**: localStorage có dữ liệu; migration chưa chạy
- **Steps**:
  1. Set localStorage với dữ liệu ingredients
  2. Xác nhận `isMigrationNeeded()` = true
  3. Gọi `migrateFromLocalStorage(db)` — thành công
  4. Gọi `isMigrationNeeded()` ngay lập tức sau migration
- **Expected**: Trước migration: `isMigrationNeeded()` = true; sau migration: `isMigrationNeeded()` = false (vì flag `mp-migrated-to-sqlite` đã được set)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_28: Gọi migrateFromLocalStorage sau khi đã migrate không thay đổi DB
- **Pre-conditions**: Migration lần 1 hoàn tất; SQLite có dữ liệu; flag đã set
- **Steps**:
  1. Hoàn tất migration lần 1
  2. Snapshot dữ liệu SQLite (đếm rows tất cả bảng)
  3. Xóa flag tạm thời để force migration lần 2: `localStorage.removeItem('mp-migrated-to-sqlite')`
  4. Gọi `migrateFromLocalStorage(db)` lần 2
  5. So sánh dữ liệu SQLite với snapshot
- **Expected**: Nếu service không kiểm tra flag bên trong: dữ liệu có thể bị duplicate (phát hiện bug); nếu service có logic kiểm tra: DB không thay đổi, rows count giữ nguyên. Test này xác nhận hành vi thực tế của service.
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

---

### G. Rollback (TC_MIG_29 → TC_MIG_31)

##### TC_MIG_29: Transaction rollback toàn bộ khi lỗi xảy ra giữa chừng
- **Pre-conditions**: localStorage có ingredients hợp lệ (3 items) và dishes có dữ liệu gây lỗi (ví dụ: dish tham chiếu ingredient_id không tồn tại với FK constraint enforced, hoặc mock db.insert để throw error khi insert dish thứ 2)
- **Steps**:
  1. Set localStorage với ingredients hợp lệ và dishes có lỗi
  2. Mock hoặc setup điều kiện gây exception trong quá trình insert dishes
  3. Gọi `migrateFromLocalStorage(db)`
  4. Kiểm tra result.success
  5. Query bảng ingredients — phải rỗng (rollback)
  6. Query bảng dishes — phải rỗng (rollback)
- **Expected**: `result.success === false`; `result.error` chứa thông báo lỗi; bảng ingredients RỖNG mặc dù ingredients đã insert trước khi lỗi xảy ra (transaction rollback toàn bộ); bảng dishes rỗng
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MIG_30: DB giữ nguyên trạng thái ban đầu khi migration thất bại
- **Pre-conditions**: SQLite DB đã có sẵn 1 ingredient (insert trước migration). Migration sẽ thất bại do dữ liệu corrupt.
- **Steps**:
  1. Insert 1 ingredient trực tiếp vào DB: `INSERT INTO ingredients VALUES ('pre-existing', ...)`
  2. Set localStorage với dữ liệu gây lỗi migration
  3. Gọi `migrateFromLocalStorage(db)` — expect thất bại
  4. Query bảng ingredients
- **Expected**: Bảng ingredients vẫn có chính xác 1 row (pre-existing ingredient); migration thất bại không xóa dữ liệu cũ; DB hoàn toàn nguyên vẹn như trước migration
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MIG_31: Flag không được set khi migration bị rollback
- **Pre-conditions**: Migration sẽ thất bại; flag chưa tồn tại
- **Steps**:
  1. Xóa flag nếu có
  2. Chuẩn bị dữ liệu gây lỗi migration
  3. Gọi `migrateFromLocalStorage(db)` — expect thất bại
  4. Kiểm tra `localStorage.getItem('mp-migrated-to-sqlite')`
  5. Kiểm tra `isMigrationCompleted()`
- **Expected**: Flag KHÔNG tồn tại trong localStorage; `isMigrationCompleted()` = false; điều này đảm bảo migration sẽ được retry ở lần khởi động tiếp theo
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

---

### H. FK Preservation (TC_MIG_32 → TC_MIG_34)

##### TC_MIG_32: dish_ingredients liên kết đúng dish_id và ingredient_id sau migration
- **Pre-conditions**: localStorage có 3 ingredients (i1, i2, i3) và 2 dishes (d1 với [i1:200g, i2:100g], d2 với [i2:150g, i3:250g])
- **Steps**:
  1. Set localStorage đầy đủ ingredients và dishes
  2. Gọi `migrateFromLocalStorage(db)`
  3. Query `SELECT di.dish_id, di.ingredient_id, di.amount, d.name_vi as dish_name, i.name_vi as ingredient_name FROM dish_ingredients di JOIN dishes d ON di.dish_id = d.id JOIN ingredients i ON di.ingredient_id = i.id`
  4. Kiểm tra kết quả JOIN
- **Expected**: JOIN query trả về 4 rows; mỗi row có dish_name và ingredient_name khớp với dữ liệu gốc; amounts chính xác (d1→i1:200, d1→i2:100, d2→i2:150, d2→i3:250); không có orphaned records trong dish_ingredients
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_33: dayPlans chứa đúng dish_ids tham chiếu đến dishes đã migrate
- **Pre-conditions**: localStorage có 2 dishes (d1, d2) và 1 day_plan tham chiếu cả 2 dish_ids
- **Steps**:
  1. Set dishes: [{id:'d1',...}, {id:'d2',...}]
  2. Set day_plans: [{date:'2026-06-12', breakfast_dish_ids:['d1'], lunch_dish_ids:['d1','d2'], dinner_dish_ids:['d2'], servings:{d1:2,d2:1}}]
  3. Gọi migration
  4. Query day_plans và parse JSON columns
  5. Kiểm tra tất cả dish_ids trong JSON arrays tồn tại trong bảng dishes
- **Expected**: Tất cả dish_ids trong breakfast/lunch/dinner arrays ('d1', 'd2') đều có record tương ứng trong bảng dishes; servings JSON chứa đúng keys khớp với dish_ids
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_34: FK constraint không bị vi phạm sau toàn bộ quá trình migration
- **Pre-conditions**: Full migration với dữ liệu phức tạp: 5 ingredients, 3 dishes (6 dish_ingredients), 3 day_plans, 1 user_profile, 2 meal_templates
- **Steps**:
  1. Chuẩn bị bộ dữ liệu phức tạp
  2. Gọi `migrateFromLocalStorage(db)`
  3. Chạy FK integrity check: `PRAGMA foreign_key_check`
  4. Query orphaned dish_ingredients: `SELECT * FROM dish_ingredients WHERE dish_id NOT IN (SELECT id FROM dishes) OR ingredient_id NOT IN (SELECT id FROM ingredients)`
- **Expected**: `PRAGMA foreign_key_check` trả về 0 violations; query orphaned records trả về 0 rows; tất cả FK relationships nhất quán toàn bộ
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

---

### I. Migration Flag (TC_MIG_35 → TC_MIG_37)

##### TC_MIG_35: Flag mp-migrated-to-sqlite được set với timestamp sau migration
- **Pre-conditions**: Flag chưa tồn tại; localStorage có dữ liệu hợp lệ
- **Steps**:
  1. Xác nhận `localStorage.getItem('mp-migrated-to-sqlite')` = null
  2. Gọi `migrateFromLocalStorage(db)` — thành công
  3. Đọc `localStorage.getItem('mp-migrated-to-sqlite')`
  4. Kiểm tra giá trị
- **Expected**: Flag tồn tại và chứa giá trị non-null; giá trị là timestamp (ví dụ: `'2026-06-12T10:30:00.000Z'` hoặc Unix timestamp); timestamp gần với thời điểm hiện tại (trong khoảng 5 giây)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_36: Flag không bị mất khi reload ứng dụng
- **Pre-conditions**: Migration đã hoàn tất, flag đã set
- **Steps**:
  1. Hoàn tất migration
  2. Xác nhận `isMigrationCompleted()` = true
  3. Simulate app reload (không clear localStorage)
  4. Gọi `isMigrationCompleted()` lần nữa
  5. Gọi `isMigrationNeeded()` lần nữa
- **Expected**: `isMigrationCompleted()` = true sau reload; `isMigrationNeeded()` = false; flag persist trong localStorage qua các lần reload; migration không bị trigger lại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_37: Flag chứa giá trị timestamp ISO 8601 hợp lệ
- **Pre-conditions**: Migration đã hoàn tất
- **Steps**:
  1. Hoàn tất migration
  2. Đọc flag value: `const flag = localStorage.getItem('mp-migrated-to-sqlite')`
  3. Thử parse: `new Date(flag).toISOString()`
  4. Kiểm tra kết quả parse
- **Expected**: `new Date(flag)` tạo Date object hợp lệ (không phải `Invalid Date`); `isNaN(new Date(flag).getTime())` = false; timestamp nằm trong khoảng hợp lý (không phải quá khứ xa hoặc tương lai)
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P2

---

### J. Export Valid JSON (TC_MIG_38 → TC_MIG_40)

##### TC_MIG_38: createV2Export tạo payload đúng cấu trúc V2ExportPayload
- **Pre-conditions**: SQLite DB có dữ liệu trong ít nhất 5 bảng (ingredients: 3, dishes: 2, dish_ingredients: 4, day_plans: 1, user_profile: 1)
- **Steps**:
  1. Populate DB với dữ liệu mẫu
  2. Gọi `const payload = await createV2Export(db)`
  3. Kiểm tra cấu trúc payload
  4. Validate từng field bắt buộc
  5. Thử `JSON.stringify(payload)` và `JSON.parse()` lại
- **Expected**: Payload có đúng cấu trúc `V2ExportPayload`: `_version === '2.0'`, `_exportedAt` là ISO string hợp lệ, `_format === 'sqlite-json'`, `tables` là object chứa các mảng rows; `JSON.stringify → JSON.parse` round-trip thành công không mất dữ liệu
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_39: Export payload chứa _version='2.0' và _format='sqlite-json'
- **Pre-conditions**: DB có dữ liệu
- **Steps**:
  1. Gọi `const payload = await createV2Export(db)`
  2. Kiểm tra `payload._version`
  3. Kiểm tra `payload._format`
  4. Kiểm tra `typeof payload._exportedAt`
- **Expected**: `payload._version === '2.0'` (string, không phải number); `payload._format === 'sqlite-json'` (exact string match); `payload._exportedAt` là string ISO 8601; cả 3 fields đều non-null, non-undefined
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_40: Export payload chứa _legacyFormat cho backward compatibility
- **Pre-conditions**: DB có dữ liệu ingredients, dishes, day_plans
- **Steps**:
  1. Gọi `const payload = await createV2Export(db)`
  2. Kiểm tra `payload._legacyFormat` tồn tại
  3. Kiểm tra cấu trúc legacy format (localStorage-like structure)
  4. Xác nhận có keys tương ứng: mp-ingredients format, mp-dishes format, v.v.
- **Expected**: `payload._legacyFormat` là object non-null; chứa cấu trúc tương tự localStorage v1.x; ingredients được reconstruct với bilingual names; dishes chứa nested ingredients array; đây là backward compat layer cho app v1.x
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

---

### K. Import Restores 16 Tables (TC_MIG_41 → TC_MIG_43)

##### TC_MIG_41: importV2Data restore đầy đủ dữ liệu 16 bảng từ v2.0 payload
- **Pre-conditions**: V2ExportPayload chứa dữ liệu cho tất cả 16 bảng: ingredients(3), dishes(2), dish_ingredients(4), day_plans(2), meal_templates(1), user_profile(1), goals(1), exercises(2), training_profile(1), training_plans(1), training_plan_days(3), workouts(2), workout_sets(4), weight_log(5), daily_log(3), adjustments(1)
- **Steps**:
  1. Chuẩn bị V2ExportPayload đầy đủ 16 bảng
  2. Gọi `const result = await importV2Data(db, payload)`
  3. Kiểm tra `result.success`
  4. Query từng bảng: `SELECT COUNT(*) FROM [table_name]` cho 16 bảng
  5. So sánh counts với dữ liệu gốc
- **Expected**: `result.success === true`; mỗi bảng có đúng số rows: ingredients=3, dishes=2, dish_ingredients=4, day_plans=2, meal_templates=1, user_profile=1, goals=1, exercises=2, training_profile=1, training_plans=1, training_plan_days=3, workouts=2, workout_sets=4, weight_log=5, daily_log=3, adjustments=1; tổng cộng 36 rows across 16 bảng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_42: importedCounts khớp chính xác số lượng rows mỗi bảng
- **Pre-conditions**: V2ExportPayload với dữ liệu cho 8 bảng (không phải tất cả 16)
- **Steps**:
  1. Chuẩn bị payload với: ingredients(5), dishes(3), dish_ingredients(7), day_plans(4), meal_templates(2), user_profile(1), goals(0), exercises(0) — 8 bảng có dữ liệu, 8 bảng rỗng
  2. Gọi `const result = await importV2Data(db, payload)`
  3. Kiểm tra `result.importedCounts`
  4. So sánh từng giá trị
- **Expected**: `result.importedCounts` là object với keys cho mỗi bảng; ingredients=5, dishes=3, dish_ingredients=7, day_plans=4, meal_templates=2, user_profile=1; bảng rỗng có count=0; tổng counts khớp với dữ liệu input
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_43: Import xóa toàn bộ dữ liệu cũ trước khi chèn dữ liệu mới
- **Pre-conditions**: DB đã có dữ liệu cũ (ingredients: 10, dishes: 5). Import payload có ingredients: 3, dishes: 2.
- **Steps**:
  1. Populate DB với 10 ingredients và 5 dishes (dữ liệu cũ)
  2. Chuẩn bị V2 payload với 3 ingredients và 2 dishes (dữ liệu mới)
  3. Gọi `importV2Data(db, payload)`
  4. Query `SELECT COUNT(*) FROM ingredients` và `SELECT COUNT(*) FROM dishes`
- **Expected**: Sau import: ingredients = 3 (KHÔNG PHẢI 13), dishes = 2 (KHÔNG PHẢI 7); dữ liệu cũ đã bị DELETE toàn bộ trước khi INSERT mới; import là REPLACE ALL, không phải MERGE
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

---

### L. Round-trip (TC_MIG_44 → TC_MIG_45)

##### TC_MIG_44: Round-trip Export→Import→Export tạo kết quả identical
- **Pre-conditions**: DB có dữ liệu đầy đủ 16 bảng với dữ liệu phức tạp (text tiếng Việt, JSON nested, special characters)
- **Steps**:
  1. Populate DB với dữ liệu phức tạp: ingredients với tên tiếng Việt (có dấu), dishes với tags JSON array, day_plans với servings object, meal_templates với data JSON lồng nhau
  2. Gọi `const export1 = await createV2Export(db)` — lần 1
  3. Gọi `await importV2Data(db, export1)` — import lại
  4. Gọi `const export2 = await createV2Export(db)` — lần 2
  5. So sánh `export1.tables` và `export2.tables` (bỏ qua `_exportedAt` vì timestamp khác nhau)
- **Expected**: `JSON.stringify(export1.tables) === JSON.stringify(export2.tables)`; mọi dữ liệu bảo toàn 100% qua round-trip; text tiếng Việt không bị encoding lỗi; JSON nested structures giữ nguyên; số lượng rows mỗi bảng giống hệt
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_45: Round-trip bảo toàn tất cả FK relationships qua các bảng
- **Pre-conditions**: DB có dữ liệu với nhiều FK relationships: 5 ingredients, 3 dishes, 8 dish_ingredients, 1 user_profile, 1 training_profile (FK→user_profile), 2 workouts, 4 workout_sets (FK→workouts)
- **Steps**:
  1. Populate DB với dữ liệu có FK relationships
  2. Chạy `PRAGMA foreign_key_check` — baseline = 0 violations
  3. Export → Import → Export
  4. Chạy `PRAGMA foreign_key_check` sau import
  5. Kiểm tra FK integrity cho từng relationship
- **Expected**: 0 FK violations trước và sau round-trip; dish_ingredients vẫn liên kết đúng dishes+ingredients; training_profile vẫn liên kết đúng user_profile; workout_sets vẫn liên kết đúng workouts; không có orphaned records
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

---

### M. Legacy Compatibility (TC_MIG_46 → TC_MIG_48)

##### TC_MIG_46: buildLegacyFormat tái tạo cấu trúc localStorage v1.x từ flat rows
- **Pre-conditions**: Flat SQL rows cho ingredients, dishes, dish_ingredients từ SQLite DB
- **Steps**:
  1. Chuẩn bị tables object: `{ ingredients: [{id:'i1', name_vi:'Gạo', name_en:'Rice', calories_per_100:130,...}], dishes: [{id:'d1', name_vi:'Cơm', name_en:'Rice dish',...}], dish_ingredients: [{dish_id:'d1', ingredient_id:'i1', amount:200}] }`
  2. Gọi `const legacy = buildLegacyFormat(tables)`
  3. Kiểm tra cấu trúc output
- **Expected**: Legacy format có cấu trúc tương thích v1.x localStorage; ingredients được reconstruct thành array of objects; dishes chứa nested ingredients array (join từ dish_ingredients); format có thể được lưu trực tiếp vào localStorage cho app v1.x
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_47: Legacy format xử lý bilingual names (name_vi, name_en) đúng cách
- **Pre-conditions**: DB ingredients có name_vi='Ức gà', name_en='Chicken breast'; DB dishes có name_vi='Cơm gà xối mỡ', name_en='Fried chicken rice'
- **Steps**:
  1. Chuẩn bị flat rows với bilingual names
  2. Gọi `buildLegacyFormat(tables)`
  3. Kiểm tra output cho ingredients và dishes
  4. Xác nhận cấu trúc name trong legacy format
- **Expected**: Legacy format chứa cả name_vi và name_en cho mỗi item; text tiếng Việt có dấu (Ức gà, Cơm gà xối mỡ) được bảo toàn nguyên vẹn; encoding UTF-8 chính xác; không có mojibake hoặc mất dấu
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_48: Legacy format tái tạo dish_ingredients join thành nested array
- **Pre-conditions**: Flat tables: dishes=[{id:'d1',...}, {id:'d2',...}], dish_ingredients=[{dish_id:'d1', ingredient_id:'i1', amount:200}, {dish_id:'d1', ingredient_id:'i2', amount:100}, {dish_id:'d2', ingredient_id:'i3', amount:300}]
- **Steps**:
  1. Gọi `buildLegacyFormat(tables)` với dữ liệu trên
  2. Kiểm tra dishes trong legacy format
  3. Xác nhận dish d1 có nested ingredients array
  4. Xác nhận dish d2 có nested ingredients array
- **Expected**: Dish d1 trong legacy format chứa ingredients: [{ingredient_id:'i1', amount:200}, {ingredient_id:'i2', amount:100}]; dish d2 chứa ingredients: [{ingredient_id:'i3', amount:300}]; join được reconstruct chính xác từ flat dish_ingredients rows; Map groupBy hoạt động đúng
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P2

---

### N. v1→v2 Auto-upgrade (TC_MIG_49 → TC_MIG_50)

##### TC_MIG_49: importV2Data tự động chuyển đổi v1.x sang v2.0 khi import
- **Pre-conditions**: Dữ liệu v1.x format (không có `_version: '2.0'`): cấu trúc localStorage-like với ingredients array, dishes array (nested ingredients), day_plans array, user_profile object
- **Steps**:
  1. Chuẩn bị v1.x data: `{ ingredients: [{id:'i1', name:{vi:'Gạo',en:'Rice'}, caloriesPer100:130,...}], dishes: [{id:'d1', name:{vi:'Cơm'}, ingredients:[{ingredientId:'i1', amount:200}]}], dayPlans: [...], userProfile: {...} }` (camelCase, nested names)
  2. Gọi `const result = await importV2Data(db, v1xData)`
  3. Kiểm tra `result.success`
  4. Query bảng ingredients xác nhận dữ liệu đã transform sang flat schema
  5. Query dish_ingredients xác nhận nested ingredients đã tách thành rows riêng
- **Expected**: `result.success === true`; `detectVersion(v1xData)` = '1.x' → `transformLegacyToV2Tables()` tự động chạy; ingredients trong DB có cột snake_case (name_vi, calories_per_100); dish_ingredients tách thành rows riêng; user_profile áp dụng defaults (gender='male', age=30, height=170, weight=70, proteinRatio=2.0)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_50: transformLegacyToV2Tables xử lý cả camelCase và snake_case
- **Pre-conditions**: Dữ liệu v1.x có mix fields: một số ingredient dùng camelCase (`caloriesPer100`), một số dùng snake_case (`calories_per_100`)
- **Steps**:
  1. Chuẩn bị v1.x data với mixed naming: `[{id:'i1', caloriesPer100:130, proteinPer100:2.7}, {id:'i2', calories_per_100:165, protein_per_100:31}]`
  2. Gọi transform hoặc importV2Data
  3. Query bảng ingredients
  4. Kiểm tra cả 2 records
- **Expected**: Cả 2 ingredients được transform thành công sang snake_case columns; i1: calories_per_100=130, protein_per_100=2.7; i2: calories_per_100=165, protein_per_100=31; function xử lý cả 2 naming conventions mà không crash
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

---

### O. Version Detection (TC_MIG_51 → TC_MIG_52)

##### TC_MIG_51: detectVersion trả về '2.0' cho payload có _version='2.0'
- **Pre-conditions**: Payload object có field `_version: '2.0'`
- **Steps**:
  1. Chuẩn bị data: `{ _version: '2.0', _format: 'sqlite-json', _exportedAt: '2026-06-12T10:00:00Z', tables: {} }`
  2. Gọi `const version = detectVersion(data)`
  3. Kiểm tra giá trị trả về
- **Expected**: `version === '2.0'` (exact string match); function nhận diện chính xác payload v2.0 dựa trên field `_version`
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_52: detectVersion trả về '1.x' cho payload không có trường _version
- **Pre-conditions**: Payload object không có field `_version` — đây là dữ liệu legacy v1.x format
- **Steps**:
  1. Chuẩn bị data v1.x: `{ ingredients: [...], dishes: [...], dayPlans: [...] }` (không có _version)
  2. Gọi `const version = detectVersion(data)`
  3. Kiểm tra giá trị trả về
  4. Thêm test: `detectVersion({})` — object rỗng
  5. Thêm test: `detectVersion({ _version: '1.0' })` — version khác 2.0
  6. Thêm test: `detectVersion({ _version: 2.0 })` — number thay vì string
- **Expected**: Tất cả trả về `'1.x'`; bất kỳ payload nào không có `_version === '2.0'` (exact string match) đều được coi là legacy v1.x; đảm bảo backward compatibility
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

---

### P. FK Violation Rollback (TC_MIG_53)

##### TC_MIG_53: Import rollback toàn bộ khi FK constraint bị vi phạm
- **Pre-conditions**: V2 payload có dish_ingredients tham chiếu ingredient_id='i99' không tồn tại trong bảng ingredients. DB rỗng trước import.
- **Steps**:
  1. Chuẩn bị payload: `tables: { ingredients: [{id:'i1',...}], dishes: [{id:'d1',...}], dish_ingredients: [{dish_id:'d1', ingredient_id:'i99', amount:100}] }` — i99 không có trong ingredients
  2. Enable FK enforcement: `PRAGMA foreign_keys = ON`
  3. Gọi `const result = await importV2Data(db, payload)`
  4. Kiểm tra result
  5. Query tất cả bảng
- **Expected**: Nếu FK enforced: `result.success === false`; `result.error` mô tả FK violation; tất cả bảng rỗng (toàn bộ transaction rollback, kể cả ingredients và dishes đã insert trước dish_ingredients); KHÔNG có partial import
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

---

### Q. Empty Tables (TC_MIG_54)

##### TC_MIG_54: Export/Import xử lý bảng rỗng (0 rows) không gây lỗi
- **Pre-conditions**: DB mới tạo, tất cả 16 bảng tồn tại nhưng có 0 rows
- **Steps**:
  1. Khởi tạo DB với schema đầy đủ (CREATE TABLE cho 16 bảng)
  2. Không insert bất kỳ dữ liệu nào
  3. Gọi `const payload = await createV2Export(db)`
  4. Kiểm tra payload.tables — mỗi bảng phải là mảng rỗng []
  5. Gọi `const result = await importV2Data(db, payload)`
  6. Kiểm tra result.success
- **Expected**: Export thành công: payload.tables chứa 16 keys, mỗi key là mảng rỗng `[]`; Import thành công: `result.success === true`; `result.importedCounts` tất cả = 0; không throw exception cho bảng rỗng; xử lý edge case DELETE FROM empty table + INSERT 0 rows gracefully
- **Kết quả test thực tế**: —
- **Type**: Edge | **Priority**: P1

---

### R. 16 Table Completeness (TC_MIG_55)

##### TC_MIG_55: IMPORT_ORDER chứa đúng và đủ 16 bảng theo thứ tự FK-safe
- **Pre-conditions**: Không cần dữ liệu — kiểm tra constant IMPORT_ORDER trong source code
- **Steps**:
  1. Kiểm tra constant/array IMPORT_ORDER trong syncV2Utils.ts
  2. Đếm số phần tử — phải đúng 16
  3. Xác nhận danh sách đầy đủ: ingredients, dishes, dish_ingredients, day_plans, meal_templates, user_profile, goals, exercises, training_profile, training_plans, training_plan_days, workouts, workout_sets, weight_log, daily_log, adjustments
  4. Kiểm tra thứ tự FK-safe: parents trước children (ví dụ: ingredients trước dish_ingredients, training_plans trước training_plan_days, workouts trước workout_sets)
  5. Xác nhận reverse order cho DELETE: adjustments → ... → ingredients
- **Expected**: IMPORT_ORDER có chính xác 16 phần tử; thứ tự đảm bảo parent tables được INSERT trước child tables; cụ thể: ingredients TRƯỚC dishes TRƯỚC dish_ingredients; user_profile TRƯỚC training_profile; training_plans TRƯỚC training_plan_days; workouts TRƯỚC workout_sets; user_profile TRƯỚC weight_log và daily_log
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0


##### TC_MIG_56: isMigrationNeeded: chỉ có key mp-ingredients tồn tại → true
- **Pre-conditions**: localStorage có key 'mp-ingredients' với data hợp lệ, không có các key khác
- **Steps**:
  1. Gọi isMigrationNeeded()
  2. Kiểm tra return value
- **Expected**: Trả về true vì có ít nhất 1 key chứa dữ liệu legacy
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_57: isMigrationNeeded: chỉ có key mp-dishes tồn tại → true
- **Pre-conditions**: localStorage chỉ có key 'mp-dishes'
- **Steps**:
  1. Gọi isMigrationNeeded()
- **Expected**: Trả về true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_58: isMigrationNeeded: chỉ có key mp-day-plans tồn tại → true
- **Pre-conditions**: localStorage chỉ có key 'mp-day-plans'
- **Steps**:
  1. Gọi isMigrationNeeded()
- **Expected**: Trả về true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_59: isMigrationNeeded: chỉ có key mp-user-profile tồn tại → true
- **Pre-conditions**: localStorage chỉ có key 'mp-user-profile'
- **Steps**:
  1. Gọi isMigrationNeeded()
- **Expected**: Trả về true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_60: isMigrationNeeded: chỉ có key meal-templates tồn tại → true
- **Pre-conditions**: localStorage chỉ có key 'meal-templates'
- **Steps**:
  1. Gọi isMigrationNeeded()
- **Expected**: Trả về true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_61: isMigrationNeeded: tất cả 5 keys tồn tại → true
- **Pre-conditions**: localStorage có tất cả 5 keys với dữ liệu hợp lệ
- **Steps**:
  1. Gọi isMigrationNeeded()
- **Expected**: Trả về true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_62: isMigrationNeeded: không có localStorage data → false
- **Pre-conditions**: localStorage trống hoàn toàn
- **Steps**:
  1. Gọi isMigrationNeeded()
- **Expected**: Trả về false. Không có gì để migrate
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MIG_63: isMigrationNeeded: migration flag đã set + có data → false (idempotent)
- **Pre-conditions**: localStorage có mp-migrated-to-sqlite flag + có dữ liệu legacy
- **Steps**:
  1. Gọi isMigrationNeeded()
- **Expected**: Trả về false. Flag đã set → migration đã hoàn tất trước đó
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_64: isMigrationCompleted: flag = ISO timestamp hợp lệ → true
- **Pre-conditions**: localStorage có key 'mp-migrated-to-sqlite' = '2026-06-12T10:30:00Z'
- **Steps**:
  1. Gọi isMigrationCompleted()
- **Expected**: Trả về true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_65: isMigrationCompleted: flag = chuỗi rỗng → behavior xác định
- **Pre-conditions**: localStorage có key 'mp-migrated-to-sqlite' = ''
- **Steps**:
  1. Gọi isMigrationCompleted()
- **Expected**: Behavior xác định: trả về true (key tồn tại) hoặc false (value rỗng). Không crash
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_MIG_66: Migration flag key chính xác = 'mp-migrated-to-sqlite'
- **Pre-conditions**: Kiểm tra constant migration flag key
- **Steps**:
  1. Verify LS_MIGRATION_FLAG constant
- **Expected**: Key chính xác = 'mp-migrated-to-sqlite'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_67: Migration flag value = ISO timestamp sau migration thành công
- **Pre-conditions**: Migration vừa thành công
- **Steps**:
  1. Kiểm tra localStorage['mp-migrated-to-sqlite']
- **Expected**: Value là ISO timestamp (ví dụ: '2026-06-12T10:30:00.000Z')
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_68: readZustandState: parse Zustand format {state: {prop: data}} đúng
- **Pre-conditions**: localStorage['mp-ingredients'] = '{"state":{"ingredients":[{...}]}}'
- **Steps**:
  1. Gọi readZustandState('mp-ingredients', 'ingredients')
- **Expected**: Trả về array ingredients từ nested Zustand state
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_69: readZustandState: localStorage value không phải Zustand format → null
- **Pre-conditions**: localStorage value = '{"notZustand": true}'
- **Steps**:
  1. Gọi readZustandState('key', 'prop')
- **Expected**: Trả về null vì không match Zustand format {state: {prop: T}}
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_MIG_70: readZustandState: localStorage value là empty string → null
- **Pre-conditions**: localStorage value = ''
- **Steps**:
  1. Gọi readZustandState('key', 'prop')
- **Expected**: Trả về null
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_MIG_71: readZustandState: localStorage value là invalid JSON → null
- **Pre-conditions**: localStorage value = 'not valid json {{{{'
- **Steps**:
  1. Gọi readZustandState('key', 'prop')
- **Expected**: JSON.parse thất bại → trả về null, không crash
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MIG_72: readZustandState: Zustand state có prop nhưng value=null → null
- **Pre-conditions**: localStorage value = '{"state":{"ingredients": null}}'
- **Steps**:
  1. Gọi readZustandState('mp-ingredients', 'ingredients')
- **Expected**: Trả về null
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_MIG_73: readZustandState: Zustand state có prop value=[] (empty array) → []
- **Pre-conditions**: localStorage value = '{"state":{"ingredients": []}}'
- **Steps**:
  1. Gọi readZustandState('mp-ingredients', 'ingredients')
- **Expected**: Trả về [] (empty array)
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_MIG_74: readZustandState: key không tồn tại trong localStorage → null
- **Pre-conditions**: localStorage không có key 'mp-ingredients'
- **Steps**:
  1. Gọi readZustandState('mp-ingredients', 'ingredients')
- **Expected**: localStorage.getItem trả về null → return null
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_MIG_75: readZustandState: parse nested object từ Zustand state đúng
- **Pre-conditions**: localStorage value có nested objects trong Zustand state
- **Steps**:
  1. Gọi readZustandState với key chứa nested data
- **Expected**: Parse đúng nested object structure
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_76: Migration 5 ingredients với đầy đủ fields → 5 rows trong bảng ingredients
- **Pre-conditions**: localStorage có 5 ingredients hợp lệ với i18n names, calories, macros
- **Steps**:
  1. Gọi migrateFromLocalStorage(db)
  2. Query bảng ingredients
- **Expected**: 5 rows trong bảng ingredients. Mỗi row có name_vi, name_en, calories_per_100, protein, carbs, fat
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_77: Migration 10 ingredients → 10 rows
- **Pre-conditions**: localStorage có 10 ingredients
- **Steps**:
  1. Migrate
  2. COUNT(*) FROM ingredients
- **Expected**: 10 rows
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_78: Migration 50 ingredients → 50 rows
- **Pre-conditions**: localStorage có 50 ingredients
- **Steps**:
  1. Migrate
  2. COUNT(*)
- **Expected**: 50 rows
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_79: Migration 100 ingredients → 100 rows
- **Pre-conditions**: localStorage có 100 ingredients
- **Steps**:
  1. Migrate
  2. Đo thời gian
- **Expected**: 100 rows. Thời gian hợp lý
- **Kết quả test thực tế**: —
- **Type**: Performance | **Priority**: P1

##### TC_MIG_80: Migration 500 ingredients → 500 rows, thời gian < 5s
- **Pre-conditions**: localStorage có 500 ingredients
- **Steps**:
  1. Migrate
  2. Đo thời gian
- **Expected**: 500 rows. Thời gian < 5 giây
- **Kết quả test thực tế**: —
- **Type**: Performance | **Priority**: P2

##### TC_MIG_81: Migration dishes với 0 ingredients mỗi dish
- **Pre-conditions**: localStorage có 3 dishes, mỗi dish ingredients=[] (rỗng)
- **Steps**:
  1. Migrate
  2. COUNT(*) FROM dish_ingredients
- **Expected**: 3 rows trong dishes, 0 rows trong dish_ingredients
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_MIG_82: Migration dishes với 1 ingredient mỗi dish
- **Pre-conditions**: 3 dishes, mỗi dish có 1 ingredient
- **Steps**:
  1. Migrate
  2. COUNT(*)
- **Expected**: 3 dish rows, 3 dish_ingredient rows
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_83: Migration dishes với 5 ingredients mỗi dish → dish_ingredients correct
- **Pre-conditions**: 2 dishes, mỗi dish có 5 ingredients
- **Steps**:
  1. Migrate
  2. Verify dish_ingredients
- **Expected**: 2 dish rows, 10 dish_ingredient rows. FK references hợp lệ
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_84: Migration day plans cho 1 ngày
- **Pre-conditions**: localStorage có day_plans cho 1 ngày
- **Steps**:
  1. Migrate
  2. COUNT(*) FROM day_plans
- **Expected**: 1 row với breakfast/lunch/dinner JSON arrays
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_85: Migration day plans cho 7 ngày
- **Pre-conditions**: day_plans cho 7 ngày
- **Steps**:
  1. Migrate
  2. COUNT(*)
- **Expected**: 7 rows
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_86: Migration day plans cho 30 ngày
- **Pre-conditions**: day_plans cho 30 ngày
- **Steps**:
  1. Migrate
  2. COUNT(*)
- **Expected**: 30 rows
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_87: Migration day plans cho 365 ngày
- **Pre-conditions**: day_plans cho 365 ngày
- **Steps**:
  1. Migrate
  2. Đo thời gian
- **Expected**: 365 rows. Performance acceptable
- **Kết quả test thực tế**: —
- **Type**: Performance | **Priority**: P2

##### TC_MIG_88: Migration user profile với tất cả fields có giá trị
- **Pre-conditions**: user_profile có đầy đủ: gender, age, height, weight, activityLevel
- **Steps**:
  1. Migrate
  2. SELECT * FROM user_profile
- **Expected**: 1 row với tất cả fields mapped đúng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_89: Migration user profile thiếu fields → dùng defaults
- **Pre-conditions**: user_profile thiếu gender và age
- **Steps**:
  1. Migrate
  2. SELECT * FROM user_profile
- **Expected**: 1 row với gender='male' (default), age=30 (default)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_90: User profile defaults: gender='male', age=30, height=170
- **Pre-conditions**: user_profile thiếu tất cả fields
- **Steps**:
  1. Migrate
  2. SELECT * FROM user_profile
- **Expected**: Defaults: id='default', gender='male', age=30, height_cm=170
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_91: Migration meal templates: 0 templates → 0 rows
- **Pre-conditions**: localStorage meal-templates = {state: {templates: []}}
- **Steps**:
  1. Migrate
  2. COUNT(*) FROM meal_templates
- **Expected**: 0 rows
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_MIG_92: Migration meal templates: 4 templates → 4 rows
- **Pre-conditions**: 4 meal templates hợp lệ
- **Steps**:
  1. Migrate
  2. COUNT(*) FROM meal_templates
- **Expected**: 4 rows, mỗi row có JSON data chính xác
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_93: Migration ingredients: name.vi và name.en → name_vi, name_en
- **Pre-conditions**: Ingredient có name: {vi: 'Gà', en: 'Chicken'}
- **Steps**:
  1. Migrate
  2. SELECT name_vi, name_en FROM ingredients
- **Expected**: name_vi='Gà', name_en='Chicken'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_94: Migration ingredients: caloriesPer100 → calories_per_100 (snake_case)
- **Pre-conditions**: Ingredient có caloriesPer100: 165
- **Steps**:
  1. Migrate
  2. SELECT calories_per_100 FROM ingredients
- **Expected**: calories_per_100 = 165 (snake_case)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_95: Migration dishes: ingredients array → dish_ingredients junction table
- **Pre-conditions**: Dish có ingredients: [{id:'1', amount:100}, {id:'2', amount:200}]
- **Steps**:
  1. Migrate
  2. SELECT * FROM dish_ingredients WHERE dish_id=...
- **Expected**: 2 rows trong dish_ingredients với đúng ingredient_id và amount
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_96: Migration dayPlans: breakfast/lunch/dinner arrays → JSON strings
- **Pre-conditions**: DayPlan có breakfast: ['dish1','dish2'], lunch: ['dish3']
- **Steps**:
  1. Migrate
  2. SELECT breakfast_dish_ids, lunch_dish_ids FROM day_plans
- **Expected**: breakfast_dish_ids = JSON string, lunch_dish_ids = JSON string
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_97: Migration mealTemplates: full template → JSON trong cột data
- **Pre-conditions**: MealTemplate với full data object
- **Steps**:
  1. Migrate
  2. SELECT data FROM meal_templates
- **Expected**: data = JSON string chứa full template object
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_98: MigrationResult.success = true khi migration thành công
- **Pre-conditions**: Migration toàn bộ 5 nhóm dữ liệu thành công
- **Steps**:
  1. Gọi migrateFromLocalStorage(db)
  2. Kiểm tra result
- **Expected**: result.success = true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_99: MigrationResult.migratedCounts chính xác cho mỗi entity
- **Pre-conditions**: Migration thành công với 10 ingredients, 5 dishes, 7 plans
- **Steps**:
  1. Kiểm tra migratedCounts
- **Expected**: migratedCounts = {ingredients:10, dishes:5, dishIngredients:N, dayPlans:7, userProfile:true, mealTemplates:M}
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_100: MigrationResult.error = undefined khi thành công
- **Pre-conditions**: Migration thành công
- **Steps**:
  1. Kiểm tra result.error
- **Expected**: result.error = undefined
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_101: Partial: chỉ có ingredients key → migrate ingredients, skip dishes/plans
- **Pre-conditions**: Chỉ có localStorage key mp-ingredients
- **Steps**:
  1. Migrate
  2. Kiểm tra các bảng
- **Expected**: ingredients table có data. dishes, day_plans tables rỗng. Không error
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_102: Partial: chỉ có dishes key → migrate dishes, skip ingredients
- **Pre-conditions**: Chỉ có key mp-dishes
- **Steps**:
  1. Migrate
  2. Kiểm tra các bảng
- **Expected**: dishes table có data. ingredients rỗng (dishes có thể thiếu FK references)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_103: Partial: ingredients + dishes, không có day-plans
- **Pre-conditions**: Có ingredients + dishes, không có day-plans
- **Steps**:
  1. Migrate
- **Expected**: ingredients + dishes + dish_ingredients migrated. day_plans rỗng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_104: Empty arrays: mp-ingredients = {state: {ingredients: []}} → 0 rows
- **Pre-conditions**: mp-ingredients value có empty array
- **Steps**:
  1. Migrate
  2. COUNT(*) FROM ingredients
- **Expected**: 0 rows, không error
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_MIG_105: Empty arrays: mp-dishes = {state: {dishes: []}} → 0 rows
- **Pre-conditions**: mp-dishes value có empty array
- **Steps**:
  1. Migrate
  2. COUNT(*) FROM dishes
- **Expected**: 0 rows, không error
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_MIG_106: Empty arrays: tất cả 5 keys đều empty arrays
- **Pre-conditions**: Tất cả 5 keys đều chứa empty arrays
- **Steps**:
  1. Migrate
  2. Kiểm tra tất cả bảng
- **Expected**: Tất cả bảng rỗng. Migration flag vẫn set. success=true
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_MIG_107: Corrupt: mp-ingredients chứa invalid JSON → migration fail gracefully
- **Pre-conditions**: mp-ingredients = 'invalid json string {{'
- **Steps**:
  1. Gọi migrateFromLocalStorage(db)
- **Expected**: Migration fail: result.success=false, result.error chứa parse error message
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MIG_108: Corrupt: mp-dishes chứa invalid JSON → error
- **Pre-conditions**: mp-dishes = '{not valid}'
- **Steps**:
  1. Migrate
- **Expected**: Migration fail gracefully
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MIG_109: Corrupt: mp-day-plans chứa invalid JSON → error
- **Pre-conditions**: mp-day-plans = corrupt JSON
- **Steps**:
  1. Migrate
- **Expected**: Migration fail hoặc skip corrupt key
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_MIG_110: Corrupt: ingredient thiếu field 'name' → handle hoặc skip
- **Pre-conditions**: Ingredient object thiếu field 'name'
- **Steps**:
  1. Migrate
- **Expected**: Handle gracefully: skip invalid ingredient hoặc set default name
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_MIG_111: Corrupt: ingredient có caloriesPer100=NaN → handle
- **Pre-conditions**: Ingredient có caloriesPer100 = NaN
- **Steps**:
  1. Migrate
  2. Kiểm tra inserted value
- **Expected**: Handle: insert 0 hoặc skip ingredient
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_MIG_112: Corrupt: ingredient có caloriesPer100='abc' (string thay vì number) → handle
- **Pre-conditions**: Ingredient có caloriesPer100 = 'abc'
- **Steps**:
  1. Migrate
- **Expected**: Handle: convert to 0 hoặc skip
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_MIG_113: Corrupt: dish có ingredients=null thay vì array → handle
- **Pre-conditions**: Dish có ingredients = null thay vì array
- **Steps**:
  1. Migrate
  2. Kiểm tra dish_ingredients
- **Expected**: Handle: 0 dish_ingredients cho dish này
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_MIG_114: Corrupt: dayPlan có breakfast=undefined → handle
- **Pre-conditions**: DayPlan có breakfast = undefined
- **Steps**:
  1. Migrate
  2. Kiểm tra day_plans row
- **Expected**: Handle: breakfast_dish_ids = '[]' hoặc null
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_MIG_115: Migration idempotency: chạy lần 1 thành công → flag set
- **Pre-conditions**: Migration lần 1 thành công
- **Steps**:
  1. Gọi migrateFromLocalStorage(db)
  2. Kiểm tra flag
- **Expected**: mp-migrated-to-sqlite flag set trong localStorage
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_116: Migration idempotency: chạy lần 2 → isMigrationNeeded=false, skip
- **Pre-conditions**: Flag đã set từ lần 1, gọi migrate lần 2
- **Steps**:
  1. Gọi isMigrationNeeded()
  2. Kiểm tra kết quả
- **Expected**: isMigrationNeeded() = false. Migration không chạy lần 2
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_117: Rollback: FK violation giữa dish_ingredients → ingredients → rollback toàn bộ
- **Pre-conditions**: Insert dish_ingredient với ingredient_id không tồn tại
- **Steps**:
  1. Migrate với data có FK mismatch
- **Expected**: FK constraint violation → db.transaction rollback → tất cả inserts revert
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MIG_118: Rollback: exception trong migrate dishes → rollback tất cả (kể cả ingredients đã insert)
- **Pre-conditions**: Exception xảy ra khi migrate dishes
- **Steps**:
  1. Mock db.insert throw error ở bước dishes
- **Expected**: Transaction rollback: ingredients đã insert cũng bị revert. DB trạng thái sạch
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MIG_119: Rollback: localStorage preserved sau migration failure
- **Pre-conditions**: Migration thất bại (rollback)
- **Steps**:
  1. Kiểm tra localStorage sau failure
- **Expected**: Tất cả localStorage keys vẫn intact. Dữ liệu nguồn không bị mất
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MIG_120: Rollback: migration flag KHÔNG set khi thất bại
- **Pre-conditions**: Migration thất bại
- **Steps**:
  1. Kiểm tra localStorage['mp-migrated-to-sqlite']
- **Expected**: Flag KHÔNG set. Giá trị null/undefined
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MIG_121: FK integrity: dish_ingredients.ingredient_id tham chiếu ingredients.id hợp lệ
- **Pre-conditions**: Migration dishes có ingredients
- **Steps**:
  1. Migrate
  2. SELECT di.ingredient_id FROM dish_ingredients JOIN ingredients
- **Expected**: Tất cả ingredient_id trong dish_ingredients tham chiếu đến id hợp lệ trong ingredients
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_122: FK integrity: dish_ingredients.dish_id tham chiếu dishes.id hợp lệ
- **Pre-conditions**: Migration dishes
- **Steps**:
  1. SELECT di.dish_id FROM dish_ingredients JOIN dishes
- **Expected**: Tất cả dish_id trong dish_ingredients tham chiếu đến id hợp lệ trong dishes
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_123: Migration order: ingredients trước dishes (FK-safe)
- **Pre-conditions**: Kiểm tra thứ tự migration
- **Steps**:
  1. Trace migration execution order
- **Expected**: ingredients INSERT trước dishes INSERT (để FK satisfied)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_124: Migration order: dishes trước dish_ingredients
- **Pre-conditions**: Kiểm tra thứ tự migration (2)
- **Steps**:
  1. Trace execution
- **Expected**: dishes INSERT trước dish_ingredients INSERT
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_125: Migration order: ingredients → dishes → dish_ingredients → day_plans → user_profile → meal_templates
- **Pre-conditions**: Kiểm tra full migration order
- **Steps**:
  1. Verify order trong source code
- **Expected**: Order: ingredients → dishes → dish_ingredients → day_plans → user_profile → meal_templates
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_126: Migration 1000 ingredients: thời gian hợp lý (< 10s)
- **Pre-conditions**: localStorage có 1000 ingredients
- **Steps**:
  1. Migrate
  2. Đo thời gian
- **Expected**: 1000 rows inserted. Thời gian < 10 giây
- **Kết quả test thực tế**: —
- **Type**: Performance | **Priority**: P1

##### TC_MIG_127: Migration toàn bộ trong 1 transaction atomic
- **Pre-conditions**: Migration bất kỳ
- **Steps**:
  1. Kiểm tra db.transaction usage
- **Expected**: Toàn bộ migration nằm trong 1 db.transaction() call
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_128: Transaction: commit chỉ khi tất cả bước thành công
- **Pre-conditions**: Migration thành công
- **Steps**:
  1. Verify transaction commit
- **Expected**: Transaction commit chỉ sau khi tất cả inserts thành công
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_129: Transaction: rollback khi bất kỳ bước nào thất bại
- **Pre-conditions**: Migration thất bại ở giữa
- **Steps**:
  1. Verify transaction rollback
- **Expected**: Transaction rollback, DB trở về trạng thái trước migration
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_130: Sau migration thành công: SQLite data query được
- **Pre-conditions**: Migration thành công
- **Steps**:
  1. SELECT * FROM ingredients LIMIT 5
- **Expected**: Data queryable và chính xác
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_131: Export: output có _version='2.0'
- **Pre-conditions**: Database có data, gọi createV2Export(db)
- **Steps**:
  1. Kiểm tra output._version
- **Expected**: _version = '2.0'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_132: Export: output có _exportedAt là ISO timestamp
- **Pre-conditions**: Gọi createV2Export(db)
- **Steps**:
  1. Kiểm tra output._exportedAt
- **Expected**: _exportedAt là ISO timestamp hợp lệ (ví dụ: 2026-06-12T10:30:00.000Z)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_133: Export: output có _format='sqlite-json'
- **Pre-conditions**: Gọi createV2Export(db)
- **Steps**:
  1. Kiểm tra output._format
- **Expected**: _format = 'sqlite-json'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_134: Export: output có tables object
- **Pre-conditions**: Gọi createV2Export(db)
- **Steps**:
  1. Kiểm tra output.tables
- **Expected**: tables là object không null
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_135: Export: tables chứa đúng 16 bảng
- **Pre-conditions**: Gọi createV2Export(db)
- **Steps**:
  1. Đếm Object.keys(output.tables)
- **Expected**: 16 keys (16 bảng)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_136: Export: bảng ingredients có đúng số rows từ DB
- **Pre-conditions**: DB có 10 ingredients
- **Steps**:
  1. Export
  2. Kiểm tra tables.ingredients.length
- **Expected**: = 10
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_137: Export: bảng dishes có đúng số rows
- **Pre-conditions**: DB có 5 dishes
- **Steps**:
  1. Export
  2. Kiểm tra tables.dishes.length
- **Expected**: = 5
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_138: Export: bảng dish_ingredients có đúng số rows
- **Pre-conditions**: DB có 15 dish_ingredients
- **Steps**:
  1. Export
  2. Kiểm tra count
- **Expected**: = 15
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_139: Export: bảng day_plans có đúng số rows
- **Pre-conditions**: DB có 30 day_plans
- **Steps**:
  1. Export
  2. Kiểm tra count
- **Expected**: = 30
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_140: Export: bảng user_profile có đúng số rows
- **Pre-conditions**: DB có 1 user_profile
- **Steps**:
  1. Export
  2. Kiểm tra count
- **Expected**: = 1
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_141: Export: bảng goals có rows (hoặc empty)
- **Pre-conditions**: Export goals table
- **Steps**:
  1. Kiểm tra tables.goals
- **Expected**: Array tồn tại (có thể rỗng)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_142: Export: bảng exercises có rows
- **Pre-conditions**: Export exercises table
- **Steps**:
  1. Kiểm tra tables.exercises
- **Expected**: Array tồn tại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_143: Export: bảng training_profile có rows
- **Pre-conditions**: Export training_profile
- **Steps**:
  1. Kiểm tra
- **Expected**: Array tồn tại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_144: Export: bảng training_plans có rows
- **Pre-conditions**: Export training_plans
- **Steps**:
  1. Kiểm tra
- **Expected**: Array tồn tại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_145: Export: bảng training_plan_days có rows
- **Pre-conditions**: Export training_plan_days
- **Steps**:
  1. Kiểm tra
- **Expected**: Array tồn tại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_146: Export: bảng workouts có rows
- **Pre-conditions**: Export workouts
- **Steps**:
  1. Kiểm tra
- **Expected**: Array tồn tại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_147: Export: bảng workout_sets có rows
- **Pre-conditions**: Export workout_sets
- **Steps**:
  1. Kiểm tra
- **Expected**: Array tồn tại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_148: Export: bảng weight_log có rows
- **Pre-conditions**: Export weight_log
- **Steps**:
  1. Kiểm tra
- **Expected**: Array tồn tại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_149: Export: bảng daily_log có rows
- **Pre-conditions**: Export daily_log
- **Steps**:
  1. Kiểm tra
- **Expected**: Array tồn tại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_150: Export: bảng adjustments có rows
- **Pre-conditions**: Export adjustments
- **Steps**:
  1. Kiểm tra
- **Expected**: Array tồn tại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_151: Export: bảng meal_templates có rows
- **Pre-conditions**: Export meal_templates
- **Steps**:
  1. Kiểm tra
- **Expected**: Array tồn tại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_152: Export: JSON output hợp lệ và parseable
- **Pre-conditions**: Export output
- **Steps**:
  1. JSON.stringify → JSON.parse output
- **Expected**: Parse thành công, không error
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_153: Export: _legacyFormat tồn tại khi được yêu cầu
- **Pre-conditions**: createV2Export(db, legacyData)
- **Steps**:
  1. Kiểm tra output._legacyFormat
- **Expected**: _legacyFormat tồn tại chứa v1.x format data
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_154: Export: row counts khớp với SELECT COUNT(*) từ DB
- **Pre-conditions**: DB có known row counts
- **Steps**:
  1. Export
  2. So sánh từng table count với SELECT COUNT(*)
- **Expected**: Tất cả counts match
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_155: Export: empty database → tất cả tables empty arrays
- **Pre-conditions**: DB trống (tất cả bảng rỗng)
- **Steps**:
  1. Export
  2. Kiểm tra tables
- **Expected**: 16 bảng, mỗi bảng là empty array []
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_MIG_156: Import v2.0: restores tất cả 16 bảng
- **Pre-conditions**: V2ExportPayload hợp lệ với 16 bảng đầy đủ
- **Steps**:
  1. Gọi importV2Data(db, payload)
  2. Verify tất cả 16 bảng
- **Expected**: Tất cả 16 bảng restored với đúng data
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_157: Import v2.0: clears existing data trước khi insert
- **Pre-conditions**: DB đã có data trước import
- **Steps**:
  1. Import payload mới
  2. Kiểm tra data
- **Expected**: Data cũ bị xóa. Chỉ data mới từ payload tồn tại
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_158: Import: DELETE theo thứ tự reverse FK (children first)
- **Pre-conditions**: Kiểm tra DELETE order khi import
- **Steps**:
  1. Trace DELETE statements
- **Expected**: Delete theo reverse IMPORT_ORDER: adjustments → daily_log → ... → ingredients
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_159: Import: INSERT theo thứ tự FK-safe (parents first)
- **Pre-conditions**: Kiểm tra INSERT order khi import
- **Steps**:
  1. Trace INSERT statements
- **Expected**: Insert theo IMPORT_ORDER: ingredients → dishes → ... → adjustments
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_160: Import: ingredients table restored đúng
- **Pre-conditions**: Import payload có 10 ingredients
- **Steps**:
  1. Import
  2. SELECT * FROM ingredients
- **Expected**: 10 rows chính xác
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_161: Import: dishes table restored đúng
- **Pre-conditions**: Import payload có 5 dishes
- **Steps**:
  1. Import
  2. SELECT * FROM dishes
- **Expected**: 5 rows
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_162: Import: dish_ingredients table restored đúng
- **Pre-conditions**: Import payload có 8 dish_ingredients
- **Steps**:
  1. Import
  2. SELECT * FROM dish_ingredients
- **Expected**: 8 rows với FK hợp lệ
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_163: Import: day_plans table restored đúng
- **Pre-conditions**: Import payload có 30 day_plans
- **Steps**:
  1. Import
  2. SELECT * FROM day_plans
- **Expected**: 30 rows
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_164: Import: user_profile table restored đúng
- **Pre-conditions**: Import payload có user_profile
- **Steps**:
  1. Import
  2. SELECT * FROM user_profile
- **Expected**: 1 row correct
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_165: Import: workouts table restored đúng
- **Pre-conditions**: Import payload có workouts
- **Steps**:
  1. Import
  2. SELECT * FROM workouts
- **Expected**: Rows correct
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_166: Import: workout_sets table restored đúng
- **Pre-conditions**: Import payload có workout_sets
- **Steps**:
  1. Import
  2. SELECT * FROM workout_sets
- **Expected**: Rows correct
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_167: Import: weight_log table restored đúng
- **Pre-conditions**: Import payload có weight_log
- **Steps**:
  1. Import
  2. SELECT * FROM weight_log
- **Expected**: Rows correct
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_168: Import: ImportResult.success = true khi thành công
- **Pre-conditions**: Import thành công
- **Steps**:
  1. Kiểm tra ImportResult
- **Expected**: success = true
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_169: Import: ImportResult.importedCounts chính xác
- **Pre-conditions**: Import thành công
- **Steps**:
  1. Kiểm tra importedCounts
- **Expected**: Record<string, number> với counts chính xác cho mỗi bảng
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_170: Import: ImportResult.error = undefined khi thành công
- **Pre-conditions**: Import thành công
- **Steps**:
  1. Kiểm tra error field
- **Expected**: error = undefined
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_171: Round-trip: export → import → export = identical data
- **Pre-conditions**: DB có data, export → import → export again
- **Steps**:
  1. Export 1
  2. Import export 1 data
  3. Export 2
  4. So sánh export 1 vs export 2
- **Expected**: Export 1 tables data === Export 2 tables data (identical)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_172: Round-trip: row counts match giữa 2 exports
- **Pre-conditions**: Round-trip
- **Steps**:
  1. So sánh row counts
- **Expected**: Mỗi bảng có cùng số rows giữa 2 exports
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_173: Round-trip: field values identical
- **Pre-conditions**: Round-trip
- **Steps**:
  1. So sánh field values mỗi row
- **Expected**: Tất cả field values identical
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_174: Import FK violation → rollback toàn bộ
- **Pre-conditions**: Import payload có dish_ingredient với invalid ingredient_id
- **Steps**:
  1. Import
  2. Kiểm tra behavior
- **Expected**: FK constraint violation → transaction rollback → DB unchanged
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MIG_175: Import: bảng rỗng (0 rows) → import OK, bảng trống
- **Pre-conditions**: Import payload có bảng ingredients=[] (rỗng)
- **Steps**:
  1. Import
  2. SELECT * FROM ingredients
- **Expected**: 0 rows, không error
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_MIG_176: Import: partial data (chỉ một số bảng) → handle gracefully
- **Pre-conditions**: Import payload chỉ có 5 bảng (thiếu 11 bảng)
- **Steps**:
  1. Import
- **Expected**: Handle gracefully: import 5 bảng có, skip 11 bảng thiếu hoặc set empty
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_MIG_177: Import: duplicate primary keys → handle/replace
- **Pre-conditions**: Import payload có ingredient với id trùng existing
- **Steps**:
  1. Import
- **Expected**: Existing data cleared trước → không conflict
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_MIG_178: Import: extra unknown table → ignored
- **Pre-conditions**: Import payload có bảng 'unknown_table' ngoài 16 bảng
- **Steps**:
  1. Import
  2. Kiểm tra behavior
- **Expected**: unknown_table ignored, 16 bảng chính import đúng
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P2

##### TC_MIG_179: Import: missing required table → error hoặc skip
- **Pre-conditions**: Import payload thiếu bảng 'ingredients' (required)
- **Steps**:
  1. Import
- **Expected**: Handle: error hoặc skip table, import tiếp các bảng khác
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_MIG_180: Import trong transaction atomic: toàn bộ hoặc nothing
- **Pre-conditions**: Import bất kỳ
- **Steps**:
  1. Kiểm tra transaction usage
- **Expected**: Toàn bộ import trong 1 db.transaction(). Atomic: all or nothing
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_181: Import large dataset: 10000 rows total → thành công
- **Pre-conditions**: Import payload có 10000 total rows
- **Steps**:
  1. Import
  2. Đo thời gian
- **Expected**: Import thành công. Performance acceptable
- **Kết quả test thực tế**: —
- **Type**: Performance | **Priority**: P2

##### TC_MIG_182: Import: dynamic column detection cho mỗi bảng
- **Pre-conditions**: Import bảng có columns mới/khác
- **Steps**:
  1. Kiểm tra dynamic column detection
- **Expected**: Columns detected từ row data, not hardcoded
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_183: Import: parameterized inserts (SQL injection safe)
- **Pre-conditions**: Import SQL injection attempt trong data values
- **Steps**:
  1. Import payload có giá trị chứa SQL injection
  2. Kiểm tra
- **Expected**: Parameterized queries ngăn SQL injection. Data insert as-is
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_184: Import clears ALL tables trước insert (clean slate)
- **Pre-conditions**: DB có existing data từ lần trước
- **Steps**:
  1. Import mới
  2. SELECT * FROM mỗi bảng
- **Expected**: Chỉ data mới. Data cũ bị xóa hoàn toàn
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_185: Import: bảng meal_templates restored với JSON data intact
- **Pre-conditions**: Import meal_templates với JSON data phức tạp
- **Steps**:
  1. Import
  2. SELECT data FROM meal_templates
- **Expected**: JSON data intact, parseable
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_186: detectVersion: payload có _version='2.0' → return '2.0'
- **Pre-conditions**: Payload: {_version: '2.0', tables: {...}}
- **Steps**:
  1. Gọi detectVersion(payload)
- **Expected**: Return '2.0'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_187: detectVersion: payload không có _version → return '1.x'
- **Pre-conditions**: Payload: {ingredients: [...], dishes: [...]} (no _version)
- **Steps**:
  1. Gọi detectVersion(payload)
- **Expected**: Return '1.x'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_188: detectVersion: payload có _version='1.0' → return '1.x'
- **Pre-conditions**: Payload: {_version: '1.0', ...}
- **Steps**:
  1. Gọi detectVersion(payload)
- **Expected**: Return '1.x' (không phải '2.0')
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_189: detectVersion: payload có _version=null → return '1.x'
- **Pre-conditions**: Payload: {_version: null}
- **Steps**:
  1. Gọi detectVersion(payload)
- **Expected**: Return '1.x'
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_MIG_190: detectVersion: payload có _version=undefined → return '1.x'
- **Pre-conditions**: Payload: {_version: undefined}
- **Steps**:
  1. Gọi detectVersion(payload)
- **Expected**: Return '1.x'
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P0

##### TC_MIG_191: detectVersion: payload có _version='' (empty string) → return '1.x'
- **Pre-conditions**: Payload: {_version: ''}
- **Steps**:
  1. Gọi detectVersion(payload)
- **Expected**: Return '1.x'
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_MIG_192: detectVersion: payload = null → return '1.x'
- **Pre-conditions**: Payload = null
- **Steps**:
  1. Gọi detectVersion(null)
- **Expected**: Return '1.x' hoặc handle gracefully
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P1

##### TC_MIG_193: buildLegacyFormat: output có cấu trúc localStorage v1.x
- **Pre-conditions**: V2 tables data
- **Steps**:
  1. Gọi buildLegacyFormat(tables)
  2. Kiểm tra output structure
- **Expected**: Output có cấu trúc tương thích localStorage v1.x: ingredients, dishes, dayPlans arrays
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_194: buildLegacyFormat: ingredients → LocalizedString name restoration (vi/en)
- **Pre-conditions**: ingredients table có name_vi, name_en columns
- **Steps**:
  1. buildLegacyFormat
  2. Kiểm tra ingredients output
- **Expected**: Mỗi ingredient có name: {vi: name_vi, en: name_en} (LocalizedString restored)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_195: buildLegacyFormat: dishes → re-embed ingredients array
- **Pre-conditions**: dishes table + dish_ingredients table
- **Steps**:
  1. buildLegacyFormat
  2. Kiểm tra dishes output
- **Expected**: Mỗi dish có embedded ingredients array (re-assembled từ junction table)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_196: buildLegacyFormat: day_plans → restore meal arrays
- **Pre-conditions**: day_plans table
- **Steps**:
  1. buildLegacyFormat
  2. Kiểm tra dayPlans output
- **Expected**: Meal arrays restored từ JSON strings
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_197: buildLegacyFormat: user_profile → restore profile object
- **Pre-conditions**: user_profile table
- **Steps**:
  1. buildLegacyFormat
  2. Kiểm tra profile output
- **Expected**: Profile object restored
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_198: transformLegacyToV2Tables: v1.x ingredients → v2.0 flat rows
- **Pre-conditions**: v1.x ingredients data
- **Steps**:
  1. Gọi transformLegacyToV2Tables(legacyData)
  2. Kiểm tra output ingredients
- **Expected**: Flat rows: name_vi, name_en, calories_per_100, protein_per_100, etc.
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_199: transformLegacyToV2Tables: v1.x dishes → v2.0 flat rows + dish_ingredients
- **Pre-conditions**: v1.x dishes data có nested ingredients
- **Steps**:
  1. Transform
  2. Kiểm tra output
- **Expected**: dishes flat rows + separate dish_ingredients rows
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_200: transformLegacyToV2Tables: camelCase → snake_case conversion
- **Pre-conditions**: v1.x data có camelCase fields
- **Steps**:
  1. Transform
  2. Kiểm tra column names
- **Expected**: Tất cả columns snake_case: calories_per_100, protein_per_100, etc.
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_201: v1→v2 upgrade: auto-detect v1.x → transform → import
- **Pre-conditions**: v1.x payload passed to importV2Data
- **Steps**:
  1. importV2Data(db, v1xPayload)
  2. Verify data in DB
- **Expected**: Auto-detect v1.x → transform → import thành công
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_202: v1→v2: ingredient name.vi/name.en → name_vi/name_en
- **Pre-conditions**: v1.x ingredient: {name: {vi:'Gà', en:'Chicken'}}
- **Steps**:
  1. Transform
  2. Kiểm tra output
- **Expected**: name_vi='Gà', name_en='Chicken'
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_203: v1→v2: dish.ingredients nested → dish_ingredients junction
- **Pre-conditions**: v1.x dish: {ingredients: [{id:'1', amount:100}]}
- **Steps**:
  1. Transform
  2. Kiểm tra dish_ingredients
- **Expected**: dish_ingredients row: dish_id, ingredient_id='1', amount=100
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_204: v1→v2: dayPlan breakfast/lunch/dinner → JSON strings
- **Pre-conditions**: v1.x dayPlan: {breakfast: ['d1','d2']}
- **Steps**:
  1. Transform
  2. Kiểm tra
- **Expected**: breakfast_dish_ids = JSON.stringify(['d1','d2'])
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_205: v1→v2: user_profile defaults applied (gender='male', age=30)
- **Pre-conditions**: v1.x user_profile thiếu fields
- **Steps**:
  1. Transform
- **Expected**: Defaults: gender='male', age=30, height=170, weight=70, proteinRatio=2.0
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_206: safeJsonParse: input là valid JSON string → parse OK
- **Pre-conditions**: Input = '{"key": "value"}'
- **Steps**:
  1. Gọi safeJsonParse(input)
- **Expected**: Return {key: 'value'} (parsed object)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

##### TC_MIG_207: safeJsonParse: input là invalid JSON string → return original
- **Pre-conditions**: Input = 'not json {'
- **Steps**:
  1. Gọi safeJsonParse(input)
- **Expected**: JSON.parse fail → return 'not json {' (original string)
- **Kết quả test thực tế**: —
- **Type**: Negative | **Priority**: P0

##### TC_MIG_208: safeJsonParse: input không phải string (number) → return as-is
- **Pre-conditions**: Input = 42 (number)
- **Steps**:
  1. Gọi safeJsonParse(42)
- **Expected**: Return 42 (not a string, return as-is)
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P1

##### TC_MIG_209: safeJsonParse: input là null → return null
- **Pre-conditions**: Input = null
- **Steps**:
  1. Gọi safeJsonParse(null)
- **Expected**: Return null
- **Kết quả test thực tế**: —
- **Type**: Boundary | **Priority**: P1

##### TC_MIG_210: IMPORT_ORDER: chứa đúng 16 bảng và thứ tự FK-safe verified
- **Pre-conditions**: Kiểm tra IMPORT_ORDER constant
- **Steps**:
  1. Inspect IMPORT_ORDER array
- **Expected**: 16 bảng đúng thứ tự: ingredients, dishes, dish_ingredients, day_plans, meal_templates, user_profile, goals, exercises, training_profile, training_plans, training_plan_days, workouts, workout_sets, weight_log, daily_log, adjustments
- **Kết quả test thực tế**: —
- **Type**: Positive | **Priority**: P0

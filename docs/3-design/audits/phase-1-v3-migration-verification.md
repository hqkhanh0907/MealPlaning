# Phase 1 V3 Migration Verification

## Scope
Verify migration V3 that removes legacy runtime schema (`default_entry_unit`, `grams_per_unit`, `ml_per_unit`, `amount_unit`) and leaves runtime aligned to `unit / ingredient_unit / unit_id`.

## Code changes verified
- `src/app/core/services/database/schema.ts`
  - `SCHEMA_VERSION = 3`
  - added `buildNutritionSchemaFinalizationMigration()`
- `src/app/core/services/database/migrations.ts`
  - registry now includes V1, V2, V3
- `src/app/core/services/database/schema.spec.ts`
  - added V3 migration smoke tests
- `src/app/core/services/database/migrations.spec.ts`
  - updated registry expectations to include V3
- `src/app/core/repositories/ingredient.repository.ts`
  - insert path reverted to runtime-final schema (no legacy insert columns)
- `src/app/core/repositories/ingredient.repository.spec.ts`
  - expectations updated for final schema insert

## Technical verification
Commands executed successfully:
- `npm run lint`
- `npm run build`
- targeted tests:
  - `schema.spec.ts`
  - `migrations.spec.ts`
  - `ingredient.repository.spec.ts`
  - `dish-ingredient.repository.spec.ts`
  - `dish.repository.spec.ts`
  - `schema-compatibility.spec.ts`
  - `native-database.service.compat.spec.ts`

Result:
- lint: PASS
- build: PASS
- targeted tests: PASS (23 SUCCESS)

## Emulator verification
Device:
- `emulator-5554`

Deployment steps completed:
- `npx cap sync android`
- `cd android && ./gradlew assembleDebug`
- `adb install -r .../app-debug.apk`
- launch app on emulator

### Runtime log evidence
Observed in live logcat:
- app opened existing DB at `user_version = 2`
- V3 migration executed sequentially
- statements observed:
  - `CREATE TABLE ingredient_v3`
  - `INSERT INTO ingredient_v3 ... FROM ingredient`
  - `CREATE TABLE ingredient_unit_v3`
  - `INSERT INTO ingredient_unit_v3 ...`
  - `CREATE TABLE dish_ingredient_v3`
  - `INSERT INTO dish_ingredient_v3 ...`
  - `DROP TABLE ingredient_unit`
  - `DROP TABLE dish_ingredient`
  - `DROP TABLE ingredient`
  - `ALTER TABLE ... RENAME TO ...`
  - `PRAGMA user_version = 3`

### Database extraction verification
DB copied out of emulator app sandbox using `run-as` after migration.
Verified locally with `sqlite3`.

Observed final state:
- `pragma user_version;` => `3`

Final `ingredient` columns:
- id
- name
- category
- nutrition_basis_unit
- nutrition_basis_quantity
- calories
- protein
- carbs
- fat
- fiber
- density_g_per_ml
- source
- created_at
- updated_at

Final `ingredient_unit` columns:
- ingredient_id
- unit_id
- factor_to_basis
- is_default
- display_label

Final `dish_ingredient` columns:
- id
- dish_id
- ingredient_id
- amount_value
- unit_id
- normalized_amount

Removed successfully from runtime schema:
- `ingredient.default_entry_unit`
- `ingredient.grams_per_unit`
- `ingredient.ml_per_unit`
- `dish_ingredient.amount_unit`

### Functional UI verification after V3
After migration, app relaunched successfully and user flow still worked:
- enter app
- open `Quản lý > Nguyên liệu`
- open `Thêm nguyên liệu`
- input name via emulator keyevents
- save ingredient
- modal closes
- item appears in list

Observed UI outcome:
- management list still renders correctly after migration
- list showed saved ingredient entries named `abc`
- no crash after schema finalization

## Notes
- `PRAGMA journal_mode = WAL` still logs a non-fatal warning on this emulator because the plugin routes it through an execute path that rejects query-style pragmas. App continues normally.
- onboarding style budget warning still exists and is unrelated to V3 migration.

## Verdict
V3 migration is verified end-to-end.

Status:
- migration design: PASS
- migration registration: PASS
- compile/test/build: PASS
- emulator upgrade from V2 -> V3: PASS
- final on-device schema shape: PASS
- post-migration management UI basic create/list smoke test: PASS

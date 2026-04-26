# Phase 1 Emulator QA Progress

## Audit time
- Date: 2026-04-26
- Device: emulator-5554
- APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Technical verification before emulator QA
- `npm run lint` ✅
- `npm run build` ✅
- Selected regression suite ✅ `48 SUCCESS`
- `./gradlew assembleDebug` ✅
- `npx cap sync android` ✅
- `adb install -r .../app-debug.apk` ✅

## Native schema / app launch findings
### Initial issue
- App initially appeared stuck on splash after launch.
- Investigation showed native DB/schema path was the likely blocker.

### Fix applied during this session
- Added schema compatibility guard for native DB init.
- Native path now resets legacy management schema shape before applying v1 + v2 migrations when old table layout is detected.
- Added test coverage:
  - `schema-compatibility.spec.ts`
  - `native-database.service.compat.spec.ts`

### Verification evidence
- After reinstall + launch, logcat showed:
  - `CREATE TABLE IF NOT EXISTS unit`
  - `CREATE TABLE IF NOT EXISTS ingredient_unit`
  - `ALTER TABLE ingredient ADD COLUMN density_g_per_ml`
  - `ALTER TABLE dish ADD COLUMN source ...`
  - `ALTER TABLE dish_ingredient ADD COLUMN unit_id ...`
  - `PRAGMA user_version = 2`
- Splash screen was hidden successfully afterward.

## Real user-like emulator flow executed
### 1. Onboarding launch
Observed screens in order:
1. `Mục tiêu`
2. `Thông tin cơ thể`
3. `Mức hoạt động`
4. Main app shell -> `Tổng quan`

### 2. Onboarding interaction
Performed real taps on emulator to:
- choose goal
- enter body info
- choose activity level
- choose gym experience
- complete onboarding

Result:
- App entered main shell successfully.
- `Tổng quan` tab rendered.
- Current dashboard is still placeholder (`Dashboard — Coming soon`) but navigation works.

### 3. Management tab verification
Tapped bottom tab `Quản lý`.

Observed:
- New management page rendered successfully (not placeholder).
- Segment control rendered:
  - `NGUYÊN LIỆU`
  - `MÓN ĂN`
- Ingredient library empty state rendered with:
  - title `Thư viện nguyên liệu`
  - search toolbar `Tìm nguyên liệu`
  - empty-state CTA `Tải lại`
  - FAB `Thêm mới`

Interpretation:
- UI shell for management is live on device.
- Empty state confirms feature page wiring works.
- Data still empty; seed/data flow is not complete yet.

### 4. Ingredient create flow verification
Tapped FAB `Thêm mới`.

Observed:
- `Thêm nguyên liệu` modal opens successfully on emulator.
- Modal fields rendered:
  - Tên nguyên liệu
  - Nhóm
  - Basis dinh dưỡng
  - Calories
  - Protein
  - Carbs
  - Fat
  - Fiber
  - Density g/ml (optional)
  - `Lưu nguyên liệu`

## Current blocker in emulator QA
### Stylus handwriting overlay interference
When focusing `Tên nguyên liệu` and sending text by emulator input, Android/Gboard stylus handwriting tutorial overlay appears:
- `Try out your stylus`
- Actions: `Write`, `Delete`, `Select`, `Insert`
- Buttons: `Reset`, `Cancel`, `Next`

Impact:
- Emulator text injection goes into handwriting overlay instead of app field.
- `Tên nguyên liệu` field remains empty in UI dump.
- `Lưu nguyên liệu` stays `enabled=false`.

Evidence from UI dump:
- `android.widget.EditText` for name still had `TEXT=''` and `HINT='Tên nguyên liệu'`
- `android.widget.Button` for `Lưu nguyên liệu` had `ENABLED=false`

## Current status by task
- `p8` Build APK, install emulator, launch app: ✅ completed
- `p9` Visual QA on emulator with real interactions: ⏳ in progress
- `p6p` Native schema migration for real app path: ⏳ materially improved and device-validated, but keep in progress until management CRUD path is fully proven
- `p6o` Minimal create/edit ingredient flow: ⏳ modal is implemented and opens on device; save path not yet validated end-to-end because text entry is blocked by emulator stylus overlay

## What is proven now
1. APK builds and installs on emulator.
2. App launches on emulator.
3. Native migration path reaches schema version 2 and does not stay stuck on splash.
4. Onboarding flow works through to main shell.
5. Bottom navigation works.
6. Management page is rendered on real device.
7. Ingredient create modal opens on real device.

## What is not proven yet
1. Successful save of a new ingredient on emulator.
2. Real list refresh after ingredient creation.
3. Dish flow on emulator.
4. End-to-end CRUD for management.

## Recommended next actions
1. Neutralize/disable emulator handwriting overlay or change input strategy.
2. Re-run ingredient creation on emulator until `Lưu nguyên liệu` becomes enabled and save succeeds.
3. Verify post-save list rendering.
4. Continue to `MÓN ĂN` tab and its minimal create/edit flow.

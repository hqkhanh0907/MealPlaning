## Plan: Comprehensive UI Test Cases + Appium E2E for APK

Cập nhật toàn bộ unit/integration test cases hiện có — bổ sung form validation, giá trị từng field, edge cases. Xây dựng kế hoạch Appium E2E test chạy trực tiếp trên file APK sau khi build.

---

### PHẦN A — CẬP NHẬT VITEST UNIT/COMPONENT TESTS

Phân tích hiện trạng 36 test files, xác định gaps, bổ sung test cases.

---

#### A1. `managers.test.tsx` — DishManager + IngredientManager

**Đã có:** render list, search, filter, add/delete, tag validation, grid/list view, empty state.

**Thiếu — DishManager (17 cases):**
- ❌ Nhập tên dish trống → submit → form không save (hiện chỉ test tag validation)
- ❌ Nhập tên dish → không chọn ingredient → submit → form không save
- ❌ Thêm ingredient → thay đổi amount input → verify giá trị mới
- ❌ Thêm ingredient → nhấn nút (-) → amount giảm 10
- ❌ Thêm ingredient → nhấn nút (+) → amount tăng 10
- ❌ Amount nhập 0 hoặc âm → clamp về 0.1
- ❌ Edit existing dish → tất cả fields pre-filled đúng (name, tags, ingredients)
- ❌ Edit dish → thay đổi tên → Lưu → `onUpdate` called với tên mới
- ❌ Edit dish → đóng mà chưa lưu → UnsavedChangesDialog hiển thị
- ❌ UnsavedChangesDialog → "Lưu" → validate + save
- ❌ UnsavedChangesDialog → "Bỏ" → close mà không save
- ❌ UnsavedChangesDialog → "Hủy" → quay lại form
- ❌ Sort by calories → thứ tự đúng
- ❌ Sort by protein → thứ tự đúng
- ❌ Sort by ingredient count → thứ tự đúng
- ❌ Filter by tag "Sáng" → chỉ hiện dish có tag breakfast
- ❌ Filter by tag → click lại → bỏ filter, hiện tất cả
- ❌ Undo delete → `onAdd` called với dish đã xóa

**Thiếu — IngredientManager (11 cases):**
- ❌ Nhập từng nutrition field (calories, protein, carbs, fat, fiber) → verify giá trị
- ❌ Nutrition field nhập âm → clamp về 0
- ❌ Edit ingredient → all fields pre-filled (name, unit, 5 nutrition)
- ❌ Edit ingredient → thay đổi name + calories → Lưu → `onUpdate` called đúng
- ❌ Edit ingredient → UnsavedChangesDialog flow (lưu / bỏ / hủy)
- ❌ AI search button disabled khi name hoặc unit trống
- ❌ AI search button enabled khi cả name + unit có giá trị
- ❌ AI search success → 5 nutrition fields auto-filled đúng giá trị
- ❌ AI search error → `notify.error` called
- ❌ AI search timeout → `notify.warning` called
- ❌ Sort by calories / protein → thứ tự đúng

---

#### A2. `saveAnalyzedDishModal.test.tsx`

**Đã có:** render, tag validation, toggle saveDish, edit name, AI research, toggle ingredients.

**Thiếu (10 cases):**
- ❌ Edit description field → verify value changes
- ❌ Edit ingredient name input → verify updated
- ❌ Edit ingredient amount input → verify number conversion
- ❌ Edit ingredient amount → nhập 0 → clamp về 0
- ❌ Edit ingredient unit input → verify value
- ❌ Edit từng nutrition field (5 fields x N ingredients) → verify từng giá trị
- ❌ Nutrition field nhập âm → clamp về 0
- ❌ Bỏ chọn 1 ingredient → submit → payload chỉ chứa ingredients được chọn (assert exact array)
- ❌ Select multiple tags (Sáng + Trưa) → submit → `tags: ['breakfast', 'lunch']`
- ❌ `saveDish` = false → submit → ingredients vẫn trong payload, `shouldCreateDish: false`

---

#### A3. `smallModals.test.tsx` — GoalSettingsModal

**Đã có:** render, weight/protein/calories change, protein preset, min weight.

**Thiếu (13 cases):**
- ❌ Weight nhập 0 → clamp về 1
- ❌ Weight nhập negative (-5) → clamp về 1
- ❌ Weight nhập text (NaN) → clamp về 1
- ❌ Protein ratio nhập 0 → clamp về 0.1
- ❌ Protein ratio nhập text (NaN) → clamp về 0.1
- ❌ Calories nhập 0 → clamp về 100
- ❌ Calories nhập 50 (< min 100) → clamp về 100
- ❌ Calories nhập text (NaN) → clamp về 100
- ❌ Tất cả 4 protein presets (1.2, 1.6, 2, 2.2) → verify ratio value + highlight
- ❌ Active preset highlighted (className contains `bg-blue-500`)
- ❌ Non-active presets NOT highlighted
- ❌ Computed protein display = `Math.round(weight * ratio)` → updates khi weight thay đổi
- ❌ Computed protein display updates khi ratio thay đổi

---

#### A4. `settingsTab.test.tsx`

**Đã có:** render sections, language switch, theme switch, import.

**Thiếu (4 cases):**
- ❌ After switching to English → section titles in English ("Language", "Theme", "Data")
- ❌ Switch English → switch back Vietnamese → labels restored ("Ngôn ngữ", "Giao diện", "Dữ liệu")
- ❌ Active theme button has `border-emerald-500`, non-active do NOT
- ❌ Active language button has `border-emerald-500`, non-active do NOT (both states)

---

#### A5. `planningModal.test.tsx`

**Đã có:** render, filter by tag, toggle selection, confirm, search, sort.

**Thiếu (4 cases):**
- ❌ Select 2 dishes → total nutrition (calories + protein) summed correctly in footer
- ❌ Deselect all → confirm → `onConfirm([])` empty array
- ❌ Search → no results → empty state message shown
- ❌ Clear search text → all dishes reappear

---

#### A6. `groceryList.test.tsx`

**Đã có:** render items, toggle check, scope switch, copy, share, empty state.

**Thiếu (4 cases):**
- ❌ Week scope → shows items from all `dayPlans` within same week range
- ❌ "Tất cả" scope → shows items from ALL `dayPlans`
- ❌ Progress bar width matches `checkedCount / totalCount`
- ❌ Uncheck previously checked item → progress decreases

---

#### A7. `calendarAndDate.test.tsx`

**Thiếu (5 cases):**
- ❌ Navigate prev → date changes, title updates
- ❌ Navigate next → date changes, title updates
- ❌ Click date that has plan data → `onSelectDate` called
- ❌ Dot indicator visible on dates with plans
- ❌ Nutrition tips display correctly based on plan data

---

#### A8. `dataBackup.test.tsx`

**Đã có:** export/import happy path, error cases, native platform.

**Thiếu (3 cases):**
- ❌ Import file with partial data (only `mp-dishes`, no `mp-ingredients`) → only dishes imported
- ❌ Export with empty localStorage → valid JSON exported (empty arrays)
- ❌ Import → confirmation dialog appears → cancel → data unchanged

---

#### A9. Test files cần tạo MỚI (hiện chỉ test gián tiếp qua parent components)

**`dishEditModal.test.tsx` (18 cases):**
- Render create mode (title = "Tạo món ăn mới")
- Render edit mode (title = "Chỉnh sửa món ăn", fields pre-filled)
- Name input → type value → verify
- Tag selection → click Sáng → active class
- Tag toggle on → off → no active class
- Add ingredient from available list → appears in selected section
- Remove ingredient → removed from selected
- Ingredient amount: +/- buttons change value by 10
- Ingredient amount: manual input → verify value
- Ingredient amount: min clamp 0.1
- Ingredient search filter → narrows available list
- Submit empty name → no submit
- Submit no ingredients → no submit
- Submit no tags → shows tag error message
- Submit valid → `onSubmit` called with correct `Dish` shape
- Close with unsaved changes → UnsavedChangesDialog appears
- UnsavedChangesDialog → Save → validates + saves
- UnsavedChangesDialog → Discard → closes without save
- UnsavedChangesDialog → Cancel → returns to form

**`ingredientEditModal.test.tsx` (17 cases):**
- Render create mode (title = "Thêm nguyên liệu mới")
- Render edit mode (title = "Chỉnh sửa nguyên liệu", all 7 fields pre-filled)
- Name input validation (empty → error message)
- Unit input validation (empty → error message)
- All 5 nutrition inputs → type values → verify each
- Nutrition input negative → clamps to 0
- AI search button: disabled when name empty
- AI search button: disabled when unit empty
- AI search button: enabled when both filled
- AI search loading state → spinner shown
- AI search success → 5 fields auto-filled with correct values
- AI search error → `notify.error` called
- AI search timeout → `notify.warning` called
- Submit valid → `onSubmit` called with correct `Ingredient` shape
- Close with unsaved changes → UnsavedChangesDialog appears
- UnsavedChangesDialog → Save → validates + saves
- UnsavedChangesDialog → Discard → closes without save

---

### PHẦN B — KẾ HOẠCH APPIUM E2E TEST CHO APK

---

#### B1. Kiến trúc & Setup

**Stack:**
- **Appium 2.x** + **UiAutomator2 driver** cho Android
- **WebdriverIO** (WDIO) làm test runner — TypeScript native
- **Mocha** làm test framework (WDIO built-in)
- **APK source:** Output từ `build-apk.sh`

**Thư mục:**
```
e2e/
  wdio.conf.ts
  tsconfig.json
  helpers/
    selectors.ts       # data-testid constants
    utils.ts           # wait, scroll, tap helpers
  specs/
    01-navigation.spec.ts
    02-calendar.spec.ts
    03-dish-management.spec.ts
    04-ingredient-management.spec.ts
    05-meal-planning.spec.ts
    06-grocery-list.spec.ts
    07-ai-analysis.spec.ts
    08-settings.spec.ts
    09-data-backup.spec.ts
    10-goal-settings.spec.ts
  pageobjects/
    BasePage.ts
    CalendarPage.ts
    ManagementPage.ts
    SettingsPage.ts
    GroceryPage.ts
    AIPage.ts
```

**Dependencies (thêm vào `devDependencies`):**
```
@wdio/cli  @wdio/local-runner  @wdio/mocha-framework  @wdio/spec-reporter
appium  appium-uiautomator2-driver  ts-node
```

**WDIO Capabilities:**
```typescript
capabilities: [{
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:app': './MealPlaning.apk',  // APK từ build-apk.sh
  'appium:appPackage': 'com.mealplaner.app',
  'appium:appActivity': 'com.mealplaner.app.MainActivity',
  'appium:autoWebview': true,   // Capacitor = WebView, switch tự động
  'appium:chromedriverAutodownload': true,
  'appium:newCommandTimeout': 300,
  'appium:noReset': false,      // Clean state mỗi test
}]
```

**Lưu ý Capacitor:** Appium switch sang WebView context → selectors dùng CSS/`data-testid` giống web.

---

#### B2. Build + Test Flow

Thêm scripts vào `package.json`:
```json
"test:e2e:build": "chmod +x build-apk.sh && ./build-apk.sh && cp ~/Desktop/MealPlaning_*.apk ./MealPlaning.apk",
"test:e2e": "npm run test:e2e:build && npx wdio run e2e/wdio.conf.ts",
"test:e2e:only": "npx wdio run e2e/wdio.conf.ts"
```

**Flow:**
1. `npm run test:e2e` → build web → sync Capacitor → build APK → copy APK → launch Appium → run specs
2. `npm run test:e2e:only` → skip build, dùng APK hiện có

---

#### B3. Thêm `data-testid` vào source code

Danh sách elements cần thêm `data-testid`:

| Component | Element | `data-testid` |
|-----------|---------|---------------|
| `BottomNavBar` | Tab buttons | `nav-calendar`, `nav-management`, `nav-ai`, `nav-grocery`, `nav-settings` |
| `CalendarTab` | "Lên kế hoạch" | `btn-plan-meal` |
| `CalendarTab` | "Gợi ý AI" | `btn-ai-suggest` |
| `CalendarTab` | MealCards | `meal-card-breakfast`, `meal-card-lunch`, `meal-card-dinner` |
| `DateSelector` | Today button | `btn-today` |
| `DateSelector` | Prev/Next | `btn-prev-date`, `btn-next-date` |
| `Summary` | Edit goals | `btn-edit-goals` |
| `DishManager` | Add button | `btn-add-dish` |
| `DishManager` | Search input | `input-search-dish` |
| `IngredientManager` | Add button | `btn-add-ingredient` |
| `IngredientManager` | Search input | `input-search-ingredient` |
| `DishEditModal` | Name input | `input-dish-name` |
| `DishEditModal` | Tag buttons | `tag-breakfast`, `tag-lunch`, `tag-dinner` |
| `DishEditModal` | Save button | `btn-save-dish` |
| `IngredientEditModal` | Name input | `input-ing-name` |
| `IngredientEditModal` | Unit input | `input-ing-unit` |
| `IngredientEditModal` | Nutrition inputs | `input-ing-calories`, `input-ing-protein`, `input-ing-carbs`, `input-ing-fat`, `input-ing-fiber` |
| `IngredientEditModal` | AI button | `btn-ai-search` |
| `IngredientEditModal` | Save button | `btn-save-ingredient` |
| `GoalSettingsModal` | Weight input | `input-goal-weight` |
| `GoalSettingsModal` | Protein input | `input-goal-protein` |
| `GoalSettingsModal` | Calories input | `input-goal-calories` |
| `GoalSettingsModal` | Done button | `btn-goal-done` |
| `GoalSettingsModal` | Protein presets | `btn-preset-1.2`, `btn-preset-1.6`, `btn-preset-2`, `btn-preset-2.2` |
| `SettingsTab` | Language buttons | `btn-lang-vi`, `btn-lang-en` |
| `SettingsTab` | Theme buttons | `btn-theme-light`, `btn-theme-dark`, `btn-theme-system` |
| `DataBackup` | Export/Import | `btn-export`, `btn-import` |
| `GroceryList` | Scope tabs | `tab-grocery-day`, `tab-grocery-week`, `tab-grocery-all` |
| `GroceryList` | Copy button | `btn-grocery-copy` |
| `PlanningModal` | Search | `input-search-plan` |
| `PlanningModal` | Confirm | `btn-confirm-plan` |
| `SaveAnalyzedDishModal` | Confirm | `btn-confirm-save-analyzed` |

---

#### B4. E2E Test Specs — Chi tiết

**`01-navigation.spec.ts`**
- App launches → Calendar tab active (verify header title)
- Tap each bottom nav → correct content visible
- Tab indicator highlights active tab

**`02-calendar.spec.ts`**
- Default date = today
- Tap "Hôm nay" → today selected
- Navigate prev/next date → date changes
- MealCard empty → shows "Chưa có món"
- Tap MealCard edit → opens PlanningModal
- "Lên kế hoạch" → TypeSelectionModal → select type → PlanningModal
- Nutrition summary values correct

**`03-dish-management.spec.ts`**
- Navigate to Thư viện → dish list shown
- "Thêm món ăn" → modal opens
- **Full form validation:**
  - Submit empty → nothing happens
  - Fill name → no ingredient → no tag → tag error
  - Fill name → add ingredient → select tag → save → dish in list
- Edit dish → modify name → save → updated in list
- Delete dish → confirm → removed
- Search → filters correctly
- Sort → order changes
- Grid ↔ List switch
- Tag filter chips

**`04-ingredient-management.spec.ts`**
- Switch to Nguyên liệu tab
- "Thêm nguyên liệu" → modal opens
- **Full form validation:**
  - Submit empty → name error + unit error
  - Fill name only → unit error
  - Fill name + unit → save → ingredient in list
- **Nutrition inputs:**
  - Type calories = 165 → verify
  - Type protein = 31 → verify
  - All 5 fields testable
- Edit → modify → save → updated
- Delete (unused) → confirm → removed
- Delete (used in dish) → warning toast, not deleted

**`05-meal-planning.spec.ts`**
- Full flow: "Lên kế hoạch" → chọn Bữa Trưa → select 2 dishes → xác nhận
- Calendar updates with selected dishes
- Re-open plan → pre-selected dishes shown
- Deselect → confirm → updated

**`06-grocery-list.spec.ts`**
- Navigate to Đi chợ
- Items listed with correct amounts
- Toggle check → progress updates
- Scope switch (Hôm nay / Tuần / Tất cả)
- Copy button → toast "Đã sao chép"

**`07-ai-analysis.spec.ts`**
- Navigate to AI tab
- Image capture → analyze button enabled
- (With real API) Analyze → result shown
- "Lưu" → SaveAnalyzedDishModal → fill tags → confirm → saved
- (Without API) Error toast shown

**`08-settings.spec.ts`**
- Language switch: VI → EN → labels change
- Language switch: EN → VI → labels restored
- Theme: Light → verify background color
- Theme: Dark → verify dark mode
- Theme: System → default

**`09-data-backup.spec.ts`**
- Export → success toast
- Import valid file → data restored
- Import invalid → error toast

**`10-goal-settings.spec.ts`**
- Open from Summary edit button
- Change weight → protein display updates
- Change protein ratio → protein display updates
- Tap preset → ratio updates + highlight
- Change calories → value updates
- Done → modal closes

---

#### B5. Page Object Pattern

```typescript
// BasePage
class BasePage {
  switchToWebView()    // driver.switchContext('WEBVIEW_...')
  waitForElement(testId: string)
  tapByTestId(testId: string)
  getTextByTestId(testId: string)
}

// CalendarPage
class CalendarPage extends BasePage {
  get planButton()  // $('[data-testid="btn-plan-meal"]')
  get mealCards()   // $$('[data-testid^="meal-card-"]')
  tapPlanMeal()
  getMealCardText(type: string)
}

// ManagementPage
class ManagementPage extends BasePage {
  tapAddDish()
  fillDishForm({ name, tags, ingredients })
  submitDish()
  tapAddIngredient()
  fillIngredientForm({ name, unit, nutrition })
  submitIngredient()
  searchDish(query: string)
  searchIngredient(query: string)
}

// SettingsPage
class SettingsPage extends BasePage {
  switchLanguage(lang: 'vi' | 'en')
  switchTheme(theme: 'light' | 'dark' | 'system')
  tapExport()
}

// GroceryPage
class GroceryPage extends BasePage {
  switchScope(scope: 'day' | 'week' | 'all')
  toggleItem(name: string)
  getProgress(): string
  tapCopy()
}
```

---

#### B6. CI Integration

**GitHub Actions workflow:**
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin' }
      - name: Setup Android SDK
        uses: android-actions/setup-android@v3
      - name: Run E2E on Emulator
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 34
          arch: x86_64
          script: |
            npm ci
            npm run test:e2e
```

---

### PHẦN C — TIMELINE

| Phase | Task | Effort |
|-------|------|--------|
| **1** | Bổ sung unit test gaps A1–A8 (form validation, field values, edge cases) | 2–3 ngày |
| **2** | Tạo test files mới A9 (`dishEditModal.test.tsx`, `ingredientEditModal.test.tsx`) | 1 ngày |
| **3** | Thêm `data-testid` vào tất cả interactive elements (B3) | 0.5 ngày |
| **4** | Setup Appium + WDIO + config (B1) | 1 ngày |
| **5** | Build flow script (B2) | 0.5 ngày |
| **6** | Page Objects (B5) | 1 ngày |
| **7** | E2E specs 01–05 (navigation, calendar, dishes, ingredients, planning) | 2 ngày |
| **8** | E2E specs 06–10 (grocery, AI, settings, backup, goals) | 2 ngày |
| **9** | CI integration (B6) | 1 ngày |
| **Total** | | **~11 ngày** |

---

### PHẦN D — LƯU Ý QUAN TRỌNG

1. **Capacitor = WebView app.** Appium cần `driver.switchContext('WEBVIEW_com.mealplaner.app')` trước khi interact DOM. Selectors dùng CSS trong WebView context.
2. **AI tests:** Set `GEMINI_API_KEY` trống cho E2E → test ErrorBoundary + error handling. Hoặc dùng real API với `newCommandTimeout` dài.
3. **File I/O (backup):** Dùng `adb push` để đưa test fixture JSON vào device trước khi test import.
4. **Emulator cho CI** (deterministic), real device cho final validation.
5. **Test isolation:** `noReset: false` → mỗi spec bắt đầu fresh. Hoặc `driver.execute('window.localStorage.clear()')` trong WebView context.
6. **Existing unit tests vẫn giữ nguyên** — chỉ bổ sung, không xóa test case đang pass.


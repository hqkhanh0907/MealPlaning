# Kế Hoạch Kiểm Thử (Test Plan) — MealPlaning V1.0

> **Version:** 1.0  
> **Ngày tạo:** 2026-07-28  
> **Trạng thái:** Draft  
> **Tài liệu gốc:** [PRODUCT_VISION.md](../PRODUCT_VISION.md)

---

## 1. Tổng Quan Dự Án

**MealPlaning** là ứng dụng di động offline-first cho phép người dùng Việt Nam (16–45 tuổi) lập kế hoạch bữa ăn, theo dõi dinh dưỡng và ghi nhận luyện tập. Ứng dụng chạy trên Android, xây dựng bằng React 19 + Vite 6, triển khai qua Capacitor 8, dữ liệu lưu trữ cục bộ bằng SQLite (native) và sql.js (web).

### 1.1 Đối Tượng Người Dùng (4 Personas)

| Persona                           | Mô tả                                  | Nhu cầu chính                                |
| --------------------------------- | -------------------------------------- | -------------------------------------------- |
| **Minh** (25M, nhân viên VP)      | Lười nhập liệu, muốn nhanh             | Chụp ảnh → AI phân tích < 10s                |
| **Vy** (20F, sinh viên)           | Giảm cân theo mục tiêu, ngân sách thấp | Free app, kiểm tra calorie deficit hàng ngày |
| **Khanh** (25M, nhân viên VP)     | Tăng cân chính xác                     | Nhập tên món → AI tính dinh dưỡng tự động    |
| **Anh** (20M, PT/huấn luyện viên) | Quản lý workout nhanh                  | 1-click xem workout hôm nay + ghi real-time  |

### 1.2 Phạm Vi V1 — 9 Must Have Features

| #   | Feature                | Mô tả                                                                | Scenarios                                |
| --- | ---------------------- | -------------------------------------------------------------------- | ---------------------------------------- |
| M1  | **Onboarding**         | Thu thập health profile, chọn mục tiêu, tạo training plan            | SC25                                     |
| M2  | **Meal Planning**      | Lập kế hoạch 3 bữa/ngày, điều hướng tuần, copy/clear plan            | SC01, SC02, SC10, SC11, SC42             |
| M3  | **Ingredient Library** | CRUD nguyên liệu, dinh dưỡng per 100g, tìm kiếm/lọc                  | SC06, SC07, SC20                         |
| M4  | **Nutrition Tracking** | Tự động tính calo/protein/carbs/fat, progress bars, so sánh target   | SC03, SC34                               |
| M5  | **Workout Logging**    | Ghi set/rep/weight, rest timer, PR detection, cardio logging         | SC26, SC27, SC28, SC29, SC42, SC43       |
| M6  | **Settings**           | Chỉnh profile, goal, training plan, theme, data management           | SC08, SC09, SC22                         |
| M7  | **AI Photo Analysis**  | Chụp ảnh → Gemini API → nhận diện món ăn → trích xuất dinh dưỡng     | SC05                                     |
| M8  | **Google Drive Sync**  | Backup/restore lên GDrive, xử lý xung đột, offline queue             | SC17                                     |
| M9  | **Dashboard**          | Energy balance widget, protein progress, workout streak, AI insights | SC19, SC30, SC31, SC33, SC34, SC35, SC36 |

### 1.3 Bổ Sung — Should Have & Could Have Scenarios

| Scenario   | Feature                          | Ưu tiên                    |
| ---------- | -------------------------------- | -------------------------- |
| SC04       | AI Meal Suggestion               | Should Have                |
| SC12, SC13 | Template Manager / Save Template | Should Have                |
| SC38       | Cross-Feature Navigation         | Should Have (architecture) |
| SC39       | WCAG Accessibility               | Should Have (compliance)   |

---

## 2. Phạm Vi Kiểm Thử

### 2.1 Trong Phạm Vi (In Scope)

| Cấp độ                 | Mô tả                                                                                               | Công cụ                         |
| ---------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------- |
| **Unit Test**          | Pure functions (nutritionEngine, công thức BMR/TDEE/macros), Zustand store actions, utility helpers | Vitest + @testing-library/react |
| **Component Test**     | React components render đúng, user interactions, form validation, i18n keys                         | Vitest + React Testing Library  |
| **Integration Test**   | Store ↔ SQLite persistence, store ↔ store communication, hook composition                           | Vitest + sql.js in-memory       |
| **E2E Manual Test**    | Full user flows trên Android emulator qua Chrome DevTools Protocol                                  | CDP + Python async scripts      |
| **Cross-Tab Test**     | Propagation: Settings → Dashboard → Calendar → Fitness                                              | CDP                             |
| **Performance Test**   | Bundle size < 500kB, render 100+ items < 500ms, rapid interaction no crash                          | Vite analyze + CDP              |
| **Accessibility Test** | WCAG 2.1 Level AA, ARIA attributes, touch targets ≥ 44px                                            | axe-core + manual audit         |

### 2.2 Ngoài Phạm Vi (Out of Scope)

| Hạng mục                    | Lý do                                        |
| --------------------------- | -------------------------------------------- |
| iOS testing                 | V1 chỉ target Android                        |
| Desktop responsive          | V1 mobile-first, desktop là bonus            |
| Multi-language (en)         | V1 Vietnamese-only                           |
| Backend API testing         | Không có backend — offline-first client-only |
| Load/stress testing         | Single-user app, không có server             |
| Gamification (SC32)         | Deferred to V2                               |
| Grocery list (SC14)         | Deferred to V2                               |
| Auto-adjust insights (SC37) | Deferred to V2                               |

---

## 3. Chiến Lược Kiểm Thử

### 3.1 Test Pyramid

```
                    ┌─────────┐
                    │  E2E    │  ← 10% — CDP scripts trên emulator
                    │ Manual  │    Verify UI thực tế, cross-tab propagation
                   ┌┴─────────┴┐
                   │Integration │  ← 20% — Store ↔ SQLite, hook composition
                   │   Tests    │    Verify data flow end-to-end
                  ┌┴────────────┴┐
                  │  Component    │  ← 30% — React components, form validation
                  │    Tests      │    Verify user-facing behavior
                 ┌┴───────────────┴┐
                 │    Unit Tests    │  ← 40% — Pure logic, calculations
                 │  (Foundation)    │    Verify correctness of algorithms
                 └──────────────────┘
```

### 3.2 Test Approach Per Feature

| Feature           | Unit                      | Component                    | Integration                                      | E2E                            |
| ----------------- | ------------------------- | ---------------------------- | ------------------------------------------------ | ------------------------------ |
| M1 Onboarding     | Health profile validation | Multi-step form render       | Store hydration after onboarding                 | Full onboarding flow           |
| M2 Meal Planning  | —                         | Calendar nav, slot render    | dayPlanStore ↔ SQLite                            | Add/remove meals, week nav     |
| M3 Ingredient Lib | Nutrition calc per unit   | CRUD form validation         | ingredientStore ↔ SQLite                         | Create → use in dish → verify  |
| M4 Nutrition      | BMR/TDEE/macro formulas   | Progress bar render          | Cascade: ingredient → dish → dayPlan → nutrition | Change weight → verify all     |
| M5 Workout Log    | Volume calc, 1RM Brzycki  | Set editor, timer            | fitnessStore ↔ SQLite                            | Full workout session           |
| M6 Settings       | Validation rules          | Form render, theme toggle    | Profile update → propagation                     | Change goal → verify dashboard |
| M7 AI Photo       | Response parsing          | Upload UI, result display    | Gemini API mock → save dish                      | Capture → analyze → save       |
| M8 GDrive Sync    | Conflict detection        | Auth flow UI                 | Export → import → verify data                    | Full backup/restore cycle      |
| M9 Dashboard      | Score calculation         | Widget render, progress bars | Cross-store composition                          | Navigate all tabs, verify data |

### 3.3 Regression Strategy

Mỗi lần sửa code → chạy TOÀN BỘ pipeline:

```
npm run lint          → 0 errors, KHÔNG eslint-disable
npm run test          → 0 failures
npm run build         → clean production build
npm run test:coverage → 100% coverage cho code mới
npm run sonar         → 0 issues (Bug, Vulnerability, Code Smell)
```

Nếu bất kỳ bước nào fail → fix → lặp lại từ đầu.

---

## 4. Cấu Hình Môi Trường

### 4.1 Development Environment

| Thành phần          | Cấu hình                                                 |
| ------------------- | -------------------------------------------------------- |
| **OS**              | macOS (dev), Android 14+ (target)                        |
| **Node.js**         | v20+ LTS                                                 |
| **Package Manager** | npm                                                      |
| **IDE**             | VS Code + Copilot CLI                                    |
| **Browser**         | Chrome 120+ (DevTools)                                   |
| **Emulator**        | Android emulator (emulator-5556), 1080×2400, density 420 |
| **Build Tool**      | Vite 6                                                   |
| **Mobile Bridge**   | Capacitor 8                                              |

### 4.2 Test Environment

| Thành phần            | Cấu hình                                                    |
| --------------------- | ----------------------------------------------------------- |
| **Test Framework**    | Vitest                                                      |
| **Component Testing** | @testing-library/react + @testing-library/jest-dom          |
| **Coverage Tool**     | V8 (via Vitest)                                             |
| **Static Analysis**   | ESLint + SonarQube (Docker)                                 |
| **E2E Protocol**      | Chrome DevTools Protocol (CDP) via WebSocket                |
| **Database (test)**   | sql.js WASM (in-memory)                                     |
| **Database (prod)**   | @capacitor-community/sqlite (native persistent)             |
| **AI Service**        | Google Gemini 2.0 Flash (mocked in unit/component tests)    |
| **i18n**              | i18next với Vietnamese translations (`src/locales/vi.json`) |

### 4.3 URLs & Ports

| Service       | URL                     | Ghi chú             |
| ------------- | ----------------------- | ------------------- |
| Dev server    | `http://localhost:3000` | Vite dev server     |
| SonarQube     | `http://localhost:9000` | Docker container    |
| CDP WebSocket | `ws://localhost:9222`   | Forward từ emulator |
| Android app   | `com.mealplaner.app`    | Package name        |

---

## 5. Ma Trận Truy Vết (Traceability Matrix)

### 5.1 V1 Must Have → Scenario → Test Cases

| V1 Feature                | Scenario | TC Count | TC ID Prefix | Trọng tâm kiểm thử                                           |
| ------------------------- | -------- | -------- | ------------ | ------------------------------------------------------------ |
| **M1** Onboarding         | SC25     | 210      | TC*FOB*\*    | Profile collection, conditional UI, training plan generation |
| **M2** Meal Planning      | SC01     | 210      | TC*CAL*\*    | Date nav, 3-slot meal layout, week navigation                |
|                           | SC02     | 210      | TC*MPM*\*    | Meal planner modal, dish selection, nutrition preview        |
|                           | SC10     | 210      | TC*COP*\*    | Copy day/week plan, overwrite handling                       |
|                           | SC11     | 210      | TC*CLR*\*    | Clear day/week/month plan                                    |
|                           | SC42     | 55       | TC*PDE*\*    | Plan day editor, exercise reorder/add/delete                 |
| **M3** Ingredient Library | SC06     | 210      | TC*ING*\*    | Ingredient CRUD, validation, cascade delete                  |
|                           | SC07     | 210      | TC*DSH*\*    | Dish CRUD, ingredient composition, nutrition calc            |
|                           | SC20     | 210      | TC*FIL*\*    | Filter, sort, view switcher                                  |
| **M4** Nutrition Tracking | SC03     | 210      | TC*NUT*\*    | Auto-calc cascade, progress bars, target comparison          |
|                           | SC34     | 265      | TC*EBP*\*    | Energy balance, protein tracking, BMR/TDEE display           |
| **M5** Workout Logging    | SC26     | 210      | TC*TPV*\*    | Training plan view, 7-day strip, rest day card               |
|                           | SC27     | 210      | TC*WLS*\*    | Strength logging, set/rep/weight, PR detection               |
|                           | SC28     | 210      | TC*CRD*\*    | Cardio logging, 7 types, calorie estimation                  |
|                           | SC29     | 210      | TC*WKH*\*    | Workout history, weekly grouping, filter                     |
|                           | SC43     | 45       | TC*FRS*\*    | Freestyle workout, no plan state change                      |
| **M6** Settings           | SC08     | 210      | TC*SET*\*    | Profile/goal/theme/data settings                             |
|                           | SC09     | 210      | TC*GOL*\*    | Goal settings, targetCalories, proteinRatio                  |
|                           | SC22     | 210      | TC*DRK*\*    | Dark mode, 4 modes, schedule                                 |
| **M7** AI Photo Analysis  | SC05     | 210      | TC*AIA*\*    | Image capture, Gemini API, save dish                         |
| **M8** GDrive Sync        | SC17     | 210      | TC*GDS*\*    | OAuth, auto-sync, conflict resolution                        |
| **M9** Dashboard          | SC19     | 210      | TC*QPV*\*    | Quick preview, nutrition progress                            |
|                           | SC30     | 210      | TC*PRG*\*    | Progress dashboard, volume %, 1RM, adherence                 |
|                           | SC31     | 210      | TC*DWI*\*    | Daily weight input, trend, moving avg                        |
|                           | SC33     | 299      | TC*DSL*\*    | Dashboard score, 5-tier layout                               |
|                           | SC35     | 240      | TC*TPC*\*    | Today's plan card, 4 states                                  |
|                           | SC36     | 260      | TC*QAW*\*    | Quick actions, weight log bottom sheet                       |

### 5.2 Bổ Sung — Should Have Scenarios

| Scenario | TC Count | TC ID Prefix | Trọng tâm                              |
| -------- | -------- | ------------ | -------------------------------------- |
| SC04     | 210      | TC*AIS*\*    | AI meal suggestion, API integration    |
| SC12     | 210      | TC*TMP*\*    | Template manager, save/apply templates |
| SC13     | 210      | TC*SVT*\*    | Save template flow                     |
| SC38     | 210      | TC*NAV*\*    | Cross-feature navigation, page stack   |
| SC39     | 210      | TC*A11Y*\*   | WCAG accessibility compliance          |

### 5.3 Tổng Hợp

| Phân loại         | Scenarios    | Test Cases     |
| ----------------- | ------------ | -------------- |
| Must Have (M1–M9) | 27 files     | ~5,694 TCs     |
| Should Have       | 5 files      | ~1,050 TCs     |
| **Tổng cộng**     | **32 files** | **~6,744 TCs** |

---

## 6. Dữ Liệu Kiểm Thử (Test Data)

### 6.1 Seed Data — 10 Nguyên Liệu Chuẩn

| ID  | Tên           | Cal/100g | Pro/100g | Carbs/100g | Fat/100g |
| --- | ------------- | -------- | -------- | ---------- | -------- |
| i1  | Ức gà         | 165      | 31       | 0          | 4        |
| i2  | Trứng gà      | 155      | 13       | 1          | 11       |
| i3  | Yến mạch      | 389      | 17       | 66         | 7        |
| i4  | Sữa chua      | 59       | 10       | 4          | 0        |
| i5  | Khoai lang    | 86       | 2        | 20         | 0        |
| i6  | Bông cải xanh | 34       | 3        | 7          | 0        |
| i7  | Thịt bò       | 250      | 26       | 0          | 15       |
| i8  | Gạo lứt       | 111      | 3        | 23         | 1        |
| i9  | Cá hồi        | 208      | 20       | 0          | 13       |
| i10 | Hạt chia      | 486      | 17       | 42         | 31       |

### 6.2 Seed Data — 5 Món Ăn Chuẩn

| ID  | Tên                | Cal/serving | Pro/serving | Bữa      |
| --- | ------------------ | ----------- | ----------- | -------- |
| d1  | Yến mạch sữa chua  | 332         | 25          | Sáng     |
| d2  | Ức gà áp chảo      | 330         | 62          | Trưa/Tối |
| d3  | Khoai lang luộc    | 129         | 3           | Trưa/Tối |
| d4  | Bông cải xanh luộc | 51          | 5           | Trưa/Tối |
| d5  | Trứng ốp la        | 155         | 13          | Sáng/Tối |

### 6.3 Health Profile Chuẩn

| Field     | Giá trị         | Ghi chú                      |
| --------- | --------------- | ---------------------------- |
| Giới tính | Nam             | Mifflin-St Jeor offset = +5  |
| Cân nặng  | 75 kg           |                              |
| Chiều cao | 175 cm          |                              |
| Ngày sinh | 1996-05-15      | Age tính ĐỘNG theo ngày test |
| Hoạt động | Moderate (1.55) |                              |
| Mục tiêu  | Cut             | Offset = -550 kcal           |
| Tốc độ    | Moderate        |                              |

### 6.4 Công Thức Tính Expected Values

```
Age = today.year - 1996 - ((today.month, today.day) < (5, 15) ? 1 : 0)
BMR = round(10 × 75 + 6.25 × 175 - 5 × Age + 5)
TDEE = round(BMR × 1.55)
Target = TDEE - 550
Protein = round(75 × 2.0)  // 2.0g/kg default
Fat = round(Target × 0.25 / 9)
Carbs = round((Target - Protein × 4 - Fat × 9) / 4)
```

> ⚠️ **QUAN TRỌNG**: Age PHẢI tính dynamic theo ngày test. Sai 1 tuổi → BMR sai 5 kcal → toàn bộ chuỗi sai.

---

## 7. Tiêu Chí Đầu Vào / Đầu Ra

### 7.1 Entry Criteria (Bắt đầu kiểm thử khi)

- [ ] Source code compiled thành công (`npm run build`)
- [ ] Dev server chạy tại localhost:3000
- [ ] Unit tests pass (`npm run test`)
- [ ] ESLint 0 errors (`npm run lint`)
- [ ] SQLite schema tạo đúng (22 tables, schema v6)
- [ ] i18n translations đầy đủ (`vi.json` có tất cả keys)
- [ ] Emulator sẵn sàng (cho E2E tests)

### 7.2 Exit Criteria (Kết thúc kiểm thử khi)

- [ ] 100% Must Have test cases (M1–M9) PASSED
- [ ] 0 P0/P1 bugs mở
- [ ] 0 P2 bugs mở (hoặc có workaround được chấp nhận)
- [ ] Coverage ≥ 100% cho code mới
- [ ] SonarQube 0 issues (Bug, Vulnerability, Code Smell)
- [ ] Chrome DevTools Console: 0 JS errors, 0 React warnings
- [ ] Bundle size < 500 kB (main chunk)
- [ ] Emulator manual test: tất cả critical paths pass

---

## 8. Quality Gates

Mỗi thay đổi code PHẢI qua đầy đủ pipeline:

```
┌─────────────────────────────────────────────────────────┐
│  1. npm run lint        → 0 errors, NO eslint-disable   │
│  2. npm run test        → 0 failures                    │
│  3. npm run build       → clean production build         │
│  4. npm run test:coverage → 100% coverage for new code  │
│  5. npm run sonar       → 0 issues on SonarQube         │
│  6. npx cap sync android → sync web assets              │
│  7. gradle assembleDebug → build debug APK              │
│  8. adb install + CDP test → verify on emulator         │
│  9. Screenshot evidence → lưu bằng chứng               │
└─────────────────────────────────────────────────────────┘
```

**Nếu BẤT KỲ bước nào fail → fix → quay lại bước 1. KHÔNG ĐƯỢC skip.**

---

## 9. Phân Tích Rủi Ro

| #   | Rủi ro                                  | Xác suất   | Tác động   | Giảm thiểu                                                        |
| --- | --------------------------------------- | ---------- | ---------- | ----------------------------------------------------------------- |
| R1  | SQLite data loss sau restart            | Trung bình | Cao        | Test persistence cycle: write → force-stop → relaunch → verify    |
| R2  | AI API rate limit / downtime            | Cao        | Trung bình | Mock trong unit/integration tests; manual test với real API riêng |
| R3  | Nutrition cascade tính sai              | Thấp       | Cao        | Unit test từng bước cascade; propagation test qua CDP             |
| R4  | i18n key thiếu → crash                  | Trung bình | Trung bình | Grep đảm bảo mọi `t('key')` có entry trong vi.json                |
| R5  | CSS layout khác nhau browser vs WebView | Trung bình | Trung bình | APK test bắt buộc, không chỉ dựa vào browser                      |
| R6  | Form validation bypass                  | Thấp       | Cao        | Zod schema validation + React Hook Form                           |
| R7  | XSS qua tên món ăn / nguyên liệu        | Thấp       | Rất cao    | Escape tất cả user input; test TC_CAL_32 (P0)                     |
| R8  | Google Drive sync conflict              | Trung bình | Trung bình | SyncConflictModal; test offline → online cycle                    |

---

## 10. Lịch Trình Kiểm Thử

### Phase 1: Foundation (Tuần 1–2)

- Unit tests cho core logic (nutrition engine, fitness formulas)
- Component tests cho shared UI components
- Store tests cho tất cả 8 Zustand stores

### Phase 2: Feature Testing (Tuần 3–5)

- Integration tests theo feature module
- M1 Onboarding → M2 Meal Planning → M3 Ingredients → M4 Nutrition
- M5 Workout → M6 Settings → M7 AI → M8 GDrive → M9 Dashboard

### Phase 3: System Testing (Tuần 6)

- Cross-feature propagation tests
- E2E manual tests trên emulator
- Performance profiling
- Accessibility audit (WCAG)

### Phase 4: Acceptance (Tuần 7)

- Full regression suite
- Test report generation
- Bug triage & fix
- Test closure

---

## 11. Tài Liệu Tham Chiếu

| Tài liệu          | Đường dẫn                                        | Mục đích                 |
| ----------------- | ------------------------------------------------ | ------------------------ |
| Product Vision    | `docs/PRODUCT_VISION.md`                         | V1 scope, personas, JTBD |
| PRD               | `docs/01-requirements/PRD.md`                    | Requirements chi tiết    |
| Use Cases         | `docs/01-requirements/use-cases.md`              | User flows               |
| SAD               | `docs/02-architecture/SAD.md`                    | System architecture      |
| Data Model        | `docs/02-architecture/data-model.md`             | Database schema          |
| Coding Guidelines | `docs/03-developer-guide/coding-guidelines.md`   | Code standards           |
| UI Design Rules   | `docs/07-ui-design-system/UI-DESIGN-RULES.md`    | UI/UX standards          |
| Color Palette     | `docs/07-ui-design-system/COLOR-PALETTE-SPEC.md` | Design tokens            |
| 32 Test Scenarios | `docs/04-testing/scenarios/SC*.md`               | Chi tiết test cases      |
| Test Cases Index  | `docs/04-testing/test-cases.md`                  | Ma trận tổng hợp TC      |

---

## 12. Phê Duyệt

| Vai trò       | Tên | Ngày | Chữ ký |
| ------------- | --- | ---- | ------ |
| QA Lead       |     |      |        |
| Tech Lead     |     |      |        |
| Product Owner |     |      |        |

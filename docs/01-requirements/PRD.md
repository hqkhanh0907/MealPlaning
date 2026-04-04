# PRD — Smart Meal Planner

**Version:** 3.2  
**Date:** 2026-07-20  
**Status:** Live (Production)

### Changelog

| Version | Ngày       | Thay đổi                                                                                                                   |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| 3.0     | 2026-07-20 | Thêm F-29→F-35, cập nhật tech stack                                                                                        |
| 3.1     | 2026-07-20 | CEO Audit Q3: thêm NFR-11 (Data Resilience), cập nhật yêu cầu fault tolerance cho data layer                               |
| 3.2     | 2026-07-20 | Reverse-sync từ BM/Testing audit: schema v6 (23 tables), thêm NFR-12 (Data Persist), NFR-13 (Calc Guard), fix BM-BUG-01/02 |

---

## Mục lục

- [1. Tổng quan sản phẩm](#1-tổng-quan-sản-phẩm)
- [2. Phạm vi tính năng (Scope)](#2-phạm-vi-tính-năng-scope)
- [3. Chi tiết tính năng](#3-chi-tiết-tính-năng)
  - [F-01/F-02: Calendar & Meal Planning](#f-01f-02-calendar--meal-planning)
  - [F-03: Nutrition Summary](#f-03-nutrition-summary)
  - [F-04: Quản lý Nguyên liệu](#f-04-quản-lý-nguyên-liệu)
  - [F-05: Quản lý Món ăn](#f-05-quản-lý-món-ăn)
  - [F-06: Grocery List](#f-06-grocery-list)
  - [F-07/F-08: AI Phân tích ảnh](#f-07f-08-ai-phân-tích-ảnh)
  - [F-09: AI Gợi ý thực đơn](#f-09-ai-gợi-ý-thực-đơn)
  - [F-11: Export/Import dữ liệu](#f-11-exportimport-dữ-liệu)
  - [F-19: Copy Plan](#f-19-copy-plan)
  - [F-20: Meal Plan Templates](#f-20-meal-plan-templates)
  - [F-21: Food Dictionary](#f-21-food-dictionary)
  - [F-22: AI Ingredient Suggestions for Dish](#f-22-ai-ingredient-suggestions-for-dish)
  - [F-23: Google Drive Cloud Sync](#f-23-google-drive-cloud-sync)
  - [F-24: Quick Copy Plan](#f-24-quick-copy-plan)
  - [F-25: Meal Templates](#f-25-meal-templates)
  - [F-26: Desktop Responsive Layout](#f-26-desktop-responsive-layout)
  - [F-27: AI Suggest Ingredients](#f-27-ai-suggest-ingredients)
  - [F-28: Filter & Sort Bottom Sheet](#f-28-filter--sort-bottom-sheet)
  - [F-29: Fitness Module](#f-29-fitness-module)
  - [F-30: Unified Onboarding](#f-30-unified-onboarding)
  - [F-31: Training Plan System](#f-31-training-plan-system)
  - [F-32: Plan Day Editor](#f-32-plan-day-editor)
  - [F-33: Multi-Session System](#f-33-multi-session-system)
  - [F-34: Dashboard (Tổng quan)](#f-34-dashboard-tổng-quan)
  - [F-35: AI Image Analysis (3-Step)](#f-35-ai-image-analysis-3-step)
- [4. Yêu cầu phi chức năng (Non-Functional Requirements)](#4-yêu-cầu-phi-chức-năng-non-functional-requirements)
- [5. Data Retention & Privacy](#5-data-retention--privacy)
- [6. Constraints & Assumptions](#6-constraints--assumptions)

---

## 1. Tổng quan sản phẩm

### 1.1 Mục tiêu sản phẩm

Smart Meal Planner là ứng dụng di động (Android) + web giúp người dùng:

1. **Lập kế hoạch bữa ăn** theo tuần với giao diện calendar trực quan.
2. **Theo dõi dinh dưỡng** tự động (calories, protein, carbs, fat, fiber) dựa trên các món ăn đã đăng ký.
3. **Phân tích ảnh thức ăn** bằng AI để tự động trích xuất thành phần và dinh dưỡng.
4. **Tạo danh sách mua sắm** tự động từ kế hoạch bữa ăn.
5. **Đề xuất thực đơn** phù hợp mục tiêu calo/protein cá nhân.
6. **Quản lý kế hoạch tập luyện** với auto-generated training plans (PPL/Upper-Lower/Full Body) và workout logging.
7. **Dashboard tổng quan** hiển thị calorie balance, protein progress, workout streak và AI health insights.

### 1.2 Tech Stack

| Công nghệ    | Phiên bản | Vai trò                               |
| ------------ | --------- | ------------------------------------- |
| React        | ^19.0.0   | UI framework                          |
| TypeScript   | ~5.8.2    | Type safety                           |
| Vite         | ^6.2.0    | Build tool & dev server               |
| Capacitor    | ^8.1.0    | Native mobile bridge (Android)        |
| sql.js       | ^1.14.1   | SQLite in WebAssembly (offline-first) |
| Zustand      | ^5.0.11   | State management                      |
| i18next      | ^25.8.13  | i18n (Vietnamese primary)             |
| Tailwind CSS | ^4.1.14   | Styling                               |
| Google GenAI | ^1.42.0   | Gemini API integration                |
| Motion       | ^12.23.24 | Animations                            |

### 1.3 Đối tượng người dùng

| Persona                     | Mô tả                                                 |
| --------------------------- | ----------------------------------------------------- |
| **Người tập gym**           | Theo dõi protein chính xác, tính toán macro hàng ngày |
| **Người ăn kiêng**          | Kiểm soát calo, phân bổ bữa ăn hợp lý trong tuần      |
| **Người nội trợ**           | Lên thực đơn tuần, tự động tạo danh sách đi chợ       |
| **Người quan tâm sức khoẻ** | Muốn biết mình đang ăn gì mà không cần nhập tay       |

### 1.4 Nền tảng

- **Android** (chính): APK cài trực tiếp, Capacitor WebView
- **Web** (hỗ trợ): Trình duyệt hiện đại (Chrome, Safari, Firefox)

### 1.5 Navigation (5 Tab chính)

| Tab | Label (VI)   | Mô tả                                                    |
| --- | ------------ | -------------------------------------------------------- |
| 1   | Lịch trình   | Calendar & Meal Planning tuần                            |
| 2   | Thư viện     | Quản lý nguyên liệu & món ăn                             |
| 3   | AI Phân tích | AI Image Analysis 3-step flow                            |
| 4   | Tập luyện    | Fitness module: training plans, workout logging          |
| 5   | Tổng quan    | Dashboard: score, energy balance, protein, quick actions |

### 1.6 Data Persistence

- **Primary storage:** SQLite — 23 bảng, schema version 6. WebDatabaseService (sql.js WASM) cho web/dev, NativeDatabaseService (@capacitor-community/sqlite) cho Android.
- **Store persistence:** 5 data stores persist mutations to SQLite (ingredientStore, dishStore, dayPlanStore, mealTemplateStore, fitnessStore). 3 stores memory-only by design (navigationStore, uiStore, appOnboardingStore via localStorage).
- **Offline-first:** Toàn bộ dữ liệu lưu local, không cần server
- **Schema:** Xem `src/services/schema.ts` cho chi tiết. Migration tự động khi upgrade version.
- **Fault Tolerance (NFR-11):** Mọi thao tác đọc dữ liệu từ storage (JSON.parse, SQLite query) phải xử lý trường hợp dữ liệu hỏng/malformed — không được để crash toàn bộ app. Dùng safe wrappers với fallback values.

### 1.7 i18n

- **Primary language:** Tiếng Việt (`vi`)
- **Framework:** i18next + react-i18next
- **Translations:** `src/locales/vi.json` (1,387+ entries)
- **Interpolation:** `{{ variable }}` syntax

---

## 2. Phạm vi tính năng (Scope)

### 2.1 Trong phạm vi (In Scope)

| ID   | Tính năng                                                                                                                                                   | Ưu tiên        |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| F-01 | Xem lịch bữa ăn theo tuần                                                                                                                                   | P0 (Must Have) |
| F-02 | Thêm/xoá món ăn vào bữa (sáng/trưa/tối)                                                                                                                     | P0             |
| F-03 | Xem tổng dinh dưỡng theo ngày (calories/protein/carbs/fat)                                                                                                  | P0             |
| F-04 | CRUD nguyên liệu (tên, đơn vị, dinh dưỡng per-100g)                                                                                                         | P0             |
| F-05 | CRUD món ăn (tên, danh sách nguyên liệu kèm khối lượng, tags bữa)                                                                                           | P0             |
| F-06 | Danh sách mua sắm tự động từ kế hoạch bữa ăn                                                                                                                | P1             |
| F-07 | Phân tích ảnh món ăn bằng AI (Gemini Vision)                                                                                                                | P1             |
| F-08 | Lưu kết quả AI thành nguyên liệu + món ăn mới                                                                                                               | P1             |
| F-09 | Gợi ý thực đơn ngày bằng AI dựa trên mục tiêu                                                                                                               | P1             |
| F-10 | Tra cứu thông tin dinh dưỡng nguyên liệu qua AI                                                                                                             | P2             |
| F-11 | Export/Import dữ liệu dạng JSON                                                                                                                             | P1             |
| F-12 | Share dữ liệu qua hệ thống Android Share                                                                                                                    | P2             |
| F-13 | Cài đặt mục tiêu: cân nặng, calo mục tiêu, tỉ lệ protein                                                                                                    | P1             |
| F-14 | Giao diện Dark/Light/System theme                                                                                                                           | P2             |
| F-15 | Giao diện song ngữ (Tiếng Việt / Tiếng Anh)                                                                                                                 | P2             |
| F-16 | Dịch tên nguyên liệu/món ăn offline (OPUS model) — xem thêm [ADR-004](../adr/004-food-dictionary-instant-translation.md)                                    | P2             |
| F-17 | Xoá kế hoạch theo ngày/tuần/tháng                                                                                                                           | P2             |
| F-18 | Favicon/App icon hiển thị đúng trên browser và PWA                                                                                                          | P3             |
| F-19 | Copy Plan — Sao chép kế hoạch bữa ăn sang nhiều ngày                                                                                                        | P2             |
| F-20 | Meal Plan Templates — Lưu/tải/quản lý template bữa ăn                                                                                                       | P2             |
| F-21 | Food Dictionary — Tra cứu dịch tên thực phẩm offline bằng static dictionary 200+ entries — xem [ADR-004](../adr/004-food-dictionary-instant-translation.md) | P2             |
| F-22 | AI Ingredient Suggestions for Dish — Gợi ý nguyên liệu cho món ăn bằng AI                                                                                   | P2             |
| F-23 | Google Drive Cloud Sync — Tự động sao lưu và đồng bộ dữ liệu qua Google Drive                                                                               | P1             |
| F-24 | Quick Copy Plan — Sao chép kế hoạch bữa ăn sang ngày khác với chọn nhanh                                                                                    | P2             |
| F-25 | Meal Templates — Lưu/tải/quản lý template bữa ăn nâng cao                                                                                                   | P2             |
| F-26 | Desktop Responsive Layout — Giao diện tự động chuyển layout desktop ≥ 1024px                                                                                | P1             |
| F-27 | AI Suggest Ingredients — AI gợi ý nguyên liệu với fuzzy-match hệ thống                                                                                      | P2             |
| F-28 | Filter & Sort Bottom Sheet — Lọc và sắp xếp danh sách nguyên liệu/món ăn                                                                                    | P2             |
| F-29 | Fitness Module — Quản lý hồ sơ thể lực, training plans, workout logging, weight tracking                                                                    | P1             |
| F-30 | Unified Onboarding — 7-section wizard với 2 paths: auto plan / manual plan                                                                                  | P0             |
| F-31 | Training Plan System — Auto-generated PPL/Upper-Lower/Full Body plans, weekly calendar                                                                      | P1             |
| F-32 | Plan Day Editor — Edit exercises: add/remove/reorder/swap với undo support                                                                                  | P1             |
| F-33 | Multi-Session System — Nhiều buổi tập/ngày (Buổi 1/2/3), toggle workout/rest                                                                                | P1             |
| F-34 | Dashboard (Tổng quan) — Daily score, energy balance, protein progress, quick actions, AI insights                                                           | P0             |
| F-35 | AI Image Analysis (3-Step) — Capture/Upload → AI Analyze → Save dish with nutrition data                                                                    | P1             |

### 2.2 Ngoài phạm vi (Out of Scope)

- Đồng bộ dữ liệu đa thiết bị (multi-device sync)
- Tính năng social / chia sẻ thực đơn với người dùng khác
- Tích hợp với các app fitness bên ngoài (FitBit, Apple Health, Google Fit)
- Quản lý kho nguyên liệu (inventory tracking)
- Tính năng thanh toán / subscription

---

## 3. Chi tiết tính năng

### F-01/F-02: Calendar & Meal Planning

**User Story:** Là người dùng, tôi muốn xem và chỉnh sửa kế hoạch bữa ăn trong tuần theo dạng lịch.

**Acceptance Criteria:**

- Hiển thị 7 ngày trong tuần, chọn ngày hiện tại theo mặc định
- Mỗi ngày có 3 slot: Sáng / Trưa / Tối
- Mỗi slot hiển thị: danh sách món ăn, tổng calories + protein
- Nhấn vào slot → mở modal chọn món từ thư viện
- Có thể xoá từng món hoặc xoá cả slot
- Thanh điều hướng phép lướt sang tuần trước/sau

### F-03: Nutrition Summary

**User Story:** Là người dùng, tôi muốn biết tổng dinh dưỡng tôi sẽ nạp trong ngày.

**Acceptance Criteria:**

- Hiển thị tổng: Calories / Protein / Carbs / Fat cho ngày được chọn
- So sánh với mục tiêu (target calories, target protein)
- Thanh tiến trình hiển thị % đạt mục tiêu
- Tự động tính lại khi thay đổi bữa ăn

### F-04: Quản lý Nguyên liệu

**User Story:** Là người dùng, tôi muốn thêm/sửa/xoá nguyên liệu với thông tin dinh dưỡng đầy đủ.

**Acceptance Criteria:**

- Form gồm: Tên (vi/en), Đơn vị (dropdown chuẩn + tuỳ chỉnh), Calories/Protein/Carbs/Fat/Fiber per 100g
- Validate: tên bắt buộc, đơn vị bắt buộc, dinh dưỡng ≥ 0
- Hiển thị lỗi validator inline (per-field)
- Có ô tìm kiếm nhanh
- Nút AI: tự điền dinh dưỡng dựa trên tên + đơn vị
- Cảnh báo khi xoá nguyên liệu đang được dùng trong món ăn

### F-05: Quản lý Món ăn

**User Story:** Là người dùng, tôi muốn tạo món ăn từ các nguyên liệu đã có với khối lượng cụ thể.

**Acceptance Criteria:**

- Form gồm: Tên (vi/en), Tags bữa (sáng/trưa/tối), Danh sách nguyên liệu kèm số lượng
- Tìm kiếm nguyên liệu inline trong form
- Tổng dinh dưỡng món ăn tính toán realtime
- Tags ảnh hưởng đến danh sách món gợi ý khi lên kế hoạch bữa ăn

### F-06: Grocery List

**User Story:** Là người dùng, tôi muốn tự động có danh sách mua sắm từ kế hoạch bữa ăn tuần.

**Acceptance Criteria:**

- Tổng hợp tất cả nguyên liệu từ tất cả bữa trong tuần hiện tại
- Gom nhóm cùng nguyên liệu, cộng tổng khối lượng
- Có thể check/uncheck từng item
- Reset check-state khi kế hoạch thay đổi

### F-07/F-08: AI Phân tích ảnh

**User Story:** Là người dùng, tôi muốn chụp ảnh/chọn ảnh món ăn và nhận về thông tin dinh dưỡng.

**Acceptance Criteria:**

- Hỗ trợ chụp từ camera hoặc chọn từ thư viện (Camera API + file input)
- Gửi ảnh lên Gemini API, nhận vể: tên món, mô tả, danh sách nguyên liệu kèm dinh dưỡng
- Nếu ảnh không phải thức ăn → hiển thị thông báo rõ ràng (không crash)
- Preview kết quả trước khi lưu
- Có thể sửa trước khi lưu
- Tuỳ chọn lưu: chỉ lưu nguyên liệu / lưu cả món ăn

### F-09: AI Gợi ý thực đơn

**User Story:** Là người dùng, tôi muốn AI đề xuất thực đơn ngày phù hợp mục tiêu dinh dưỡng.

**Acceptance Criteria:**

- Button "AI Gợi ý" trên Calendar tab
- AI nhận vào: danh sách món ăn hiện có, mục tiêu calo/protein
- AI trả về: gợi ý sáng/trưa/tối + giải thích (reasoning)
- Preview trước khi áp dụng
- Chỉ ghi đè slots AI đề xuất, giữ nguyên slots đã có

### F-11: Export/Import dữ liệu

**User Story:** Là người dùng, tôi muốn sao lưu và khôi phục dữ liệu của mình.

**Acceptance Criteria:**

- Export → tải file JSON gồm: ingredients, dishes, dayPlans, userProfile
- Import → đọc file JSON, validate, merge vào dữ liệu hiện tại
- Share export file qua Android Share sheet
- Hiển thị thông báo success/error sau import

### F-19: Copy Plan

**User Story:** Là người dùng, tôi muốn sao chép kế hoạch bữa ăn từ một ngày sang một hoặc nhiều ngày khác để tiết kiệm thời gian lập kế hoạch.

**Acceptance Criteria:**

- Nút "Copy" hiển thị trên Calendar tab khi ngày đã chọn có ít nhất 1 món ăn
- Mở modal cho phép chọn một hoặc nhiều ngày đích (multi-select)
- Hiển thị preview danh sách ngày đích trước khi xác nhận
- Xác nhận → sao chép toàn bộ 3 slots (sáng/trưa/tối) từ ngày nguồn sang các ngày đích
- Nếu ngày đích đã có kế hoạch → ghi đè (overwrite)
- Hiển thị toast success với số ngày đã copy thành công
- Sử dụng hook `useCopyPlan` để quản lý logic

### F-20: Meal Plan Templates

**User Story:** Là người dùng, tôi muốn lưu kế hoạch bữa ăn thành template để tái sử dụng nhanh cho các ngày khác.

**Acceptance Criteria:**

- Nút "Lưu Template" trên Calendar tab khi ngày có kế hoạch
- Lưu template gồm: tên template, 3 slots (sáng/trưa/tối) với dish IDs
- Xem danh sách templates đã lưu
- Áp dụng template vào ngày đang chọn (ghi đè slots)
- Đổi tên template
- Xoá template
- Templates persist trong `localStorage` (`mp-meal-templates`)
- Sử dụng hook `useMealTemplate` để quản lý logic

### F-21: Food Dictionary

**User Story:** Là người dùng, tôi muốn tên nguyên liệu/món ăn được dịch tức thì khi lưu, không cần đợi model AI tải xong.

**Acceptance Criteria:**

- Static dictionary chứa 200+ entries song ngữ Việt–Anh cho thực phẩm phổ biến
- Tra cứu O(1) tại thời điểm lưu nguyên liệu/món ăn
- Nếu dictionary có kết quả → dùng ngay, không gọi OPUS Worker
- Nếu dictionary không có → fallback sang OPUS Worker (nếu available)
- Bundle size thêm ~5KB (chấp nhận được)
- Xem chi tiết tại [ADR-004](../adr/004-food-dictionary-instant-translation.md)

### F-22: AI Ingredient Suggestions for Dish

**User Story:** Là người dùng, tôi muốn AI gợi ý danh sách nguyên liệu phù hợp cho một món ăn dựa trên tên món.

**Acceptance Criteria:**

- Nút "AI Gợi ý nguyên liệu" trong `DishEditModal`
- Gọi `suggestIngredientsForDish(dishName)` gửi tên món lên Gemini API
- AI trả về danh sách nguyên liệu kèm khối lượng gợi ý và thông tin dinh dưỡng
- Preview kết quả trước khi áp dụng
- User có thể chỉnh sửa, bỏ chọn từng nguyên liệu trước khi apply
- Apply → tự động thêm nguyên liệu vào form (tạo mới nếu chưa tồn tại)
- Timeout 30s — hiển thị toast error nếu quá thời gian

### F-23: Google Drive Cloud Sync

**User Story:** Là người dùng, tôi muốn dữ liệu của mình được tự động sao lưu lên Google Drive để không bị mất dữ liệu và có thể đồng bộ giữa các thiết bị.

**Acceptance Criteria:**

- Đăng nhập bằng Google OAuth2 để kích hoạt tính năng sync
- Tự động sao lưu dữ liệu lên Google Drive (appDataFolder) sau mỗi thay đổi
- Debounce 3 giây — không gửi request liên tục khi thay đổi nhanh
- Khi phát hiện conflict giữa dữ liệu local và cloud → hiển thị `SyncConflictModal`
- Cho phép chọn: Keep Local / Use Cloud khi có conflict
- Thành phần: `AuthContext`, `useAutoSync`, `googleDriveService`, `SyncConflictModal`

### F-24: Quick Copy Plan

**User Story:** Là người dùng, tôi muốn sao chép kế hoạch bữa ăn từ ngày hiện tại sang ngày khác một cách nhanh chóng với các tuỳ chọn chọn nhanh.

**Acceptance Criteria:**

- Mở `CopyPlanModal` từ Calendar tab
- Hỗ trợ chọn nhanh: Ngày mai / Tuần này / Tuỳ chỉnh
- Deep-copy dishIds — thay đổi bản copy không ảnh hưởng ngày nguồn
- Preview danh sách ngày đích trước khi xác nhận
- Hiển thị toast success sau khi copy thành công
- Thành phần: `CopyPlanModal`, `useCopyPlan`

### F-25: Meal Templates

**User Story:** Là người dùng, tôi muốn lưu kế hoạch bữa ăn hiện tại thành template để tái sử dụng cho các ngày khác.

**Acceptance Criteria:**

- Lưu kế hoạch bữa ăn hiện tại thành template qua `SaveTemplateModal`
- CRUD đầy đủ: tạo, xem, sửa tên, xoá template trong `TemplateManager`
- Template lưu trong `localStorage['meal-templates']`
- Apply template vào bất kỳ ngày nào — ghi đè slots hiện tại
- Sử dụng hook `useMealTemplate` để quản lý logic

### F-26: Desktop Responsive Layout

**User Story:** Là người dùng trên desktop, tôi muốn giao diện tự động chuyển sang layout phù hợp màn hình lớn để sử dụng hiệu quả hơn.

**Acceptance Criteria:**

- Breakpoint 1024px — tự động chuyển layout khi màn hình ≥ 1024px
- Navigation chuyển từ bottom bar (mobile) sang sidebar (desktop)
- Tất cả tabs phải hiển thị đúng trên cả mobile và desktop
- Thành phần: `useIsDesktop`, `DesktopNav`, `calendarDesktopLayout`

### F-27: AI Suggest Ingredients

**User Story:** Là người dùng, tôi muốn AI gợi ý nguyên liệu cho món ăn dựa trên tên món và fuzzy-match với nguyên liệu có sẵn trong hệ thống.

**Acceptance Criteria:**

- Gọi `geminiService.suggestIngredientInfo` với tên món ăn
- AI trả về danh sách nguyên liệu gợi ý kèm thông tin dinh dưỡng
- Fuzzy-match kết quả AI với nguyên liệu đã có trong hệ thống
- Kết quả hiển thị trong `AISuggestIngredientsPreview` modal
- Cho phép chọn/bỏ từng nguyên liệu trước khi apply

### F-28: Filter & Sort Bottom Sheet

**User Story:** Là người dùng, tôi muốn lọc và sắp xếp danh sách nguyên liệu/món ăn theo nhiều tiêu chí để tìm kiếm nhanh hơn.

**Acceptance Criteria:**

- Mở `FilterBottomSheet` từ danh sách nguyên liệu hoặc món ăn
- Hỗ trợ sắp xếp theo: tên, calo, protein
- Hỗ trợ quick filter: < 300 cal, high protein
- Hiển thị bottom sheet trên mobile, panel trên desktop
- Sử dụng hook `useListManager` để quản lý logic lọc/sắp xếp

### F-29: Fitness Module

**User Story:** Là người tập gym, tôi muốn quản lý hồ sơ thể lực, lên kế hoạch tập luyện, ghi nhận workout và theo dõi cân nặng để đồng bộ với mục tiêu dinh dưỡng.

**Acceptance Criteria:**

- Tạo và quản lý **Fitness Profile** (experience level, goal, body stats) — lưu trong bảng `fitness_profiles`
- Cấu hình **Fitness Preferences** (hệ đơn vị, rest timer, thông báo) — lưu trong bảng `fitness_preferences`
- Tạo **Training Plans** với split types, exercise selection, periodization
- Ghi nhận **Workout Sessions**: sets, reps, weight, cardio duration
- Lưu **Workout Drafts** cho các buổi tập đang thực hiện dở — lưu trong bảng `workout_drafts`
- Theo dõi **Weight Log** (1 entry/ngày) và **Daily Nutrition Log**
- Dashboard hiển thị streak, milestones, progressive overload suggestions
- Thành phần: `FitnessTab`, `WorkoutLogger`, `ProgressDashboard`, `fitnessStore` (Zustand)
- Tích hợp dinh dưỡng qua hook `useFitnessNutritionBridge`

> **Data schema:** Module sử dụng 3 bảng riêng (`fitness_profiles`, `fitness_preferences`, `workout_drafts`) cùng các bảng training/workout chung — tổng cộng hệ thống có **27 bảng** (xem `src/services/schema.ts`).

### F-30: Unified Onboarding

**User Story:** Là người dùng mới, tôi muốn được hướng dẫn thiết lập hồ sơ sức khoẻ và chọn cách tạo kế hoạch tập luyện (tự động hoặc thủ công) để bắt đầu sử dụng app ngay.

**Acceptance Criteria:**

- Onboarding gồm **7 section** liên tục:
  1. **Welcome** (3 slides) — giới thiệu app
  2. **Health Basic** (4 steps) — thu thập: giới tính, ngày sinh, chiều cao (cm), cân nặng (kg), mức độ hoạt động
  3. **Training Core** (1 step) — mục tiêu tập luyện (strength/hypertrophy/endurance/general)
  4. **Training Detail** (4–9 steps adaptive) — experience level (beginner/intermediate/advanced), số ngày/tuần (2–6), thời lượng session (30/45/60/90 phút), equipment, chấn thương, cardio sessions
  5. **Strategy Choice** — 2 paths phân nhánh:
     - **"Để app lên kế hoạch"** (auto) → tự động tối ưu dựa trên profile
     - **"Tự lên kế hoạch"** (manual) → user tự chọn exercises, workout/rest days
  6. **Plan Computing** (chỉ auto path) — animation hiển thị quá trình tính toán plan
  7. **Plan Preview** — xem trước kế hoạch tập luyện tuần, cho phép chỉnh sửa trước khi xác nhận
- Dữ liệu lưu vào bảng `user_profile`, `training_profile`, `health_profile`
- Thành phần: `UnifiedOnboarding`, `HealthBasicStep`, `TrainingCoreStep`, `StrategyChoice`

### F-31: Training Plan System

**User Story:** Là người tập gym, tôi muốn có kế hoạch tập luyện được tạo tự động dựa trên profile của tôi, hiển thị theo tuần với lịch trực quan.

**Acceptance Criteria:**

- **3 split types** tự động chọn dựa trên số ngày/tuần:
  | Split Type | Số ngày | Mô tả |
  |------------|---------|-------|
  | Full Body | 1–3 ngày/tuần | Alternates A/B, tất cả nhóm cơ mỗi session |
  | Upper/Lower | 4 ngày/tuần | Upper A → Lower A → Upper B → Lower B |
  | Push/Pull/Legs (PPL) | 5–6 ngày/tuần | Push → Pull → Legs, lặp lại hoặc 2x |
- **Weekly calendar** hiển thị 7 day pills: `T2, T3, T4, T5, T6, T7, CN` (Thứ 2 – Chủ Nhật)
- Mỗi day pill hiển thị: loại workout (ví dụ: "Push", "Legs") hoặc "Nghỉ"
- Nhấn vào day pill → mở chi tiết ngày với danh sách exercises (sets × reps × weight)
- Exercises bao gồm: tên bài tập (vi/en), nhóm cơ, equipment, số sets, reps min/max, thời gian rest
- Training plan lưu trong bảng `training_plans` + `training_plan_days`
- Thành phần: `TrainingPlanView`, `useTrainingPlan`

### F-32: Plan Day Editor

**User Story:** Là người tập gym, tôi muốn chỉnh sửa danh sách bài tập cho bất kỳ ngày nào trong kế hoạch, với khả năng undo nếu thao tác nhầm.

**Acceptance Criteria:**

- **6 thao tác** trên danh sách exercises:
  1. **Add exercise** — chọn từ exercise database, default 3 sets + default reps + 90s rest
  2. **Remove exercise** — xoá với undo window 5 giây (pending removal state)
  3. **Move up** — đổi vị trí với exercise phía trên
  4. **Move down** — đổi vị trí với exercise phía dưới
  5. **Swap exercise** — thay thế bằng exercise khác, giữ nguyên sets/reps/rest
  6. **Edit parameters** — chỉnh sửa inline: sets (1–10), reps min/max (1–30), rest seconds (30–300)
- **Undo/Redo support:**
  - Undo removal: cửa sổ 5 giây tự động
  - Restore original: khôi phục về trạng thái trước khi edit
  - Unsaved changes warning dialog khi thoát
- Persist qua `updatePlanDayExercises()` trong fitness store
- Thành phần: `PlanDayEditor`

### F-33: Multi-Session System

**User Story:** Là người tập gym, tôi muốn có nhiều buổi tập trong cùng một ngày (ví dụ: sáng tập weights, chiều cardio) và toggle ngày giữa workout/rest.

**Acceptance Criteria:**

- Mỗi ngày hỗ trợ tối đa **3 sessions**: "Buổi 1", "Buổi 2", "Buổi 3" (format: `Buổi {{order}}`)
- **Session tabs** hiển thị pills với icons (Sun/Moon/Sunset) để switch giữa các sessions
- **Thêm session** qua `AddSessionModal` với 3 loại:
  1. **Strength** — chọn nhóm cơ (chest, back, shoulders, legs, arms, core, glutes)
  2. **Cardio** — session cardio mặc định
  3. **Freestyle** — workout tuỳ chỉnh
- **Toggle workout/rest:** chuyển đổi ngày giữa workout day và rest day
- Long-press hoặc right-click trên session tab để xoá session
- Đánh dấu session đã hoàn thành (completed)
- Thành phần: `SessionTabs`, `AddSessionModal`

### F-34: Dashboard (Tổng quan)

**User Story:** Là người dùng, tôi muốn có trang tổng quan hiển thị tóm tắt dinh dưỡng, tiến trình tập luyện và các hành động nhanh.

**Acceptance Criteria:**

- **5 tier progressive loading** (lazy-loaded với stagger animation):
  | Tier | Delay | Components |
  |------|-------|------------|
  | 1 | 0ms | DailyScoreHero — điểm hiệu suất ngày |
  | 2 | 30ms | EnergyBalanceMini — calorie intake vs target; ProteinProgress — protein progress bar |
  | 3 | 60ms | TodaysPlanCard — preview bữa ăn & workout hôm nay; WeightMini — cân nặng hiện tại (quick log tap); StreakMini — workout streak |
  | 4 | Lazy | AutoAdjustBanner — gợi ý điều chỉnh calo/macro; AiInsightCard — AI health insights |
  | 5 | Lazy | QuickActionsBar — quick actions: log weight, log meal, start workout |
- **Quick actions:** nhấn nhanh để ghi nhận cân nặng, bữa ăn, hoặc bắt đầu workout
- **WeightQuickLog** bottom sheet modal cho việc ghi nhanh cân nặng
- Error boundaries cho từng section
- Tôn trọng reduced motion preference cho accessibility
- Thành phần: `DashboardTab`, `DailyScoreHero`, `EnergyBalanceMini`, `ProteinProgress`, `TodaysPlanCard`, `QuickActionsBar`

### F-35: AI Image Analysis (3-Step)

**User Story:** Là người dùng, tôi muốn chụp ảnh món ăn, để AI phân tích dinh dưỡng, và lưu kết quả vào hệ thống theo quy trình 3 bước rõ ràng.

**Acceptance Criteria:**

- **3-step flow** hiển thị progress indicator:
  1. **Bước 1: "Chụp ảnh"** (Capture/Upload)
     - Chụp từ camera hoặc chọn từ thư viện ảnh
     - Compress ảnh tối đa 1MB (`imageCompression.ts`)
     - Xem trước ảnh, nút xoá để chọn lại
  2. **Bước 2: "AI phân tích"** (AI Analyze)
     - Gửi ảnh base64 lên `geminiService.analyzeDishImage()`
     - Loading spinner với text "Đang phân tích..."
     - Xử lý riêng `NotFoodImageError` (ảnh không phải thức ăn)
     - Timeout 30s, retry 2 lần exponential backoff
  3. **Bước 3: "Lưu món"** (Save Dish)
     - `AnalysisResultView` hiển thị: calories, protein, carbs, fat ước tính
     - Danh sách nguyên liệu với khối lượng
     - Cho phép chỉnh sửa tên món, chọn/bỏ nguyên liệu
     - `SaveAnalyzedDishModal` lưu vào database
- Tab riêng "AI Phân tích" trên navigation (tab thứ 3)
- Thành phần: `AIImageAnalyzer`, `ImageCapture`, `AnalysisResultView`, `SaveAnalyzedDishModal`

---

## 4. Yêu cầu phi chức năng (Non-Functional Requirements)

| NFR    | Mô tả                                                                                                                                                                                                                                                                                       | Mức độ |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| NFR-01 | Thời gian load lần đầu < 3s trên thiết bị mid-range                                                                                                                                                                                                                                         | Must   |
| NFR-02 | Các thao tác CRUD phản hồi < 100ms (SQLite via sql.js)                                                                                                                                                                                                                                      | Must   |
| NFR-03 | Hoạt động offline hoàn toàn (ngoại trừ AI features)                                                                                                                                                                                                                                         | Must   |
| NFR-04 | Giao diện responsive: mobile (360px+), tablet, desktop (1024px+)                                                                                                                                                                                                                            | Must   |
| NFR-05 | AI API timeout 30 giây — không treo UI                                                                                                                                                                                                                                                      | Must   |
| NFR-06 | Dữ liệu người dùng không gửi ra ngoài (ngoại trừ ảnh/tên gửi Gemini)                                                                                                                                                                                                                        | Should |
| NFR-07 | Bundle size < 2MB (code split lazy loading cho AI tab, Grocery tab)                                                                                                                                                                                                                         | Should |
| NFR-08 | Accessibility: labels cho inputs, aria-\* attributes, reduced motion support                                                                                                                                                                                                                | Should |
| NFR-09 | Dashboard progressive loading với 5 tiers staggered animation                                                                                                                                                                                                                               | Should |
| NFR-10 | SQLite schema migration tự động khi upgrade version                                                                                                                                                                                                                                         | Must   |
| NFR-11 | **Data Resilience** — Corrupt/malformed data trong storage (JSON parse errors, missing fields, schema drift) KHÔNG ĐƯỢC crash app. Phải graceful degrade với fallback values và log warning.                                                                                                | Must   |
| NFR-12 | **Data Persist (BM-BUG-01)** — Mọi Zustand store mutation thay đổi dữ liệu PHẢI persist xuống SQLite. Phát hiện từ BM audit: 4 stores (ingredientStore, dishStore, dayPlanStore, mealTemplateStore) thiếu persistence → mất dữ liệu khi restart. Đã fix — tất cả 5 data stores đều persist. | Must   |
| NFR-13 | **Calc Guard (BM-BUG-02)** — Các giá trị tính toán (calories, macros) PHẢI không âm. `calculateTarget()` phải floor tại 0 khi goal offset vượt quá TDEE. Áp dụng cho mọi hàm tính toán dinh dưỡng.                                                                                          | Must   |

---

## 5. Data Retention & Privacy

- **Tất cả dữ liệu** (ingredients, dishes, plans, profile, fitness, workouts) lưu trong **SQLite** (sql.js WebAssembly) trên thiết bị.
- **Binary persistence** qua IndexedDB — database SQLite được serialize/deserialize tự động.
- **Schema:** 27 bảng, version 3 — auto-migration khi upgrade (xem `src/services/schema.ts`).
- **Không gửi dữ liệu** lên server (ngoại trừ: (1) hình ảnh + tên nguyên liệu gửi Gemini API để phân tích, (2) tên nguyên liệu gửi Gemini API để tra cứu dinh dưỡng).
- Người dùng có thể **xoá toàn bộ** dữ liệu bằng cách xoá app hoặc clear browser storage.
- **Export JSON** cho phép người dùng tự backup — `databaseService.exportToJSON()`.
- **Import JSON** cho phép khôi phục — `databaseService.importFromJSON()`.

---

## 6. Constraints & Assumptions

| Constraint      | Mô tả                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| GEMINI_API_KEY  | Client-side — phù hợp cho app cá nhân, cần proxy cho production          |
| SQLite (sql.js) | WASM-based — yêu cầu browser hỗ trợ WebAssembly                          |
| IndexedDB       | Binary persistence cho SQLite database — giới hạn tuỳ browser (~50MB+)   |
| Android target  | minSdkVersion 24 (Android 7.0+), targetSdkVersion 36                     |
| Chrome WebView  | AI features cần Chrome 91+ (Capacitor WebView)                           |
| No backend      | Không có server — cloud sync qua Google Drive API (client-side)          |
| i18n            | Vietnamese-only hiện tại — framework i18next sẵn sàng cho multi-language |

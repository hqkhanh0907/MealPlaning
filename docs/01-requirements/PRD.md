# PRD — Smart Meal Planner

**Version:** 2.1  
**Date:** 2026-03-28  
**Status:** Live (Production)

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

### 1.2 Đối tượng người dùng

| Persona | Mô tả |
|---------|-------|
| **Người tập gym** | Theo dõi protein chính xác, tính toán macro hàng ngày |
| **Người ăn kiêng** | Kiểm soát calo, phân bổ bữa ăn hợp lý trong tuần |
| **Người nội trợ** | Lên thực đơn tuần, tự động tạo danh sách đi chợ |
| **Người quan tâm sức khoẻ** | Muốn biết mình đang ăn gì mà không cần nhập tay |

### 1.3 Nền tảng

- **Android** (chính): APK cài trực tiếp, Capacitor WebView
- **Web** (hỗ trợ): Trình duyệt hiện đại (Chrome, Safari, Firefox)

---

## 2. Phạm vi tính năng (Scope)

### 2.1 Trong phạm vi (In Scope)

| ID | Tính năng | Ưu tiên |
|----|-----------|---------|
| F-01 | Xem lịch bữa ăn theo tuần | P0 (Must Have) |
| F-02 | Thêm/xoá món ăn vào bữa (sáng/trưa/tối) | P0 |
| F-03 | Xem tổng dinh dưỡng theo ngày (calories/protein/carbs/fat) | P0 |
| F-04 | CRUD nguyên liệu (tên, đơn vị, dinh dưỡng per-100g) | P0 |
| F-05 | CRUD món ăn (tên, danh sách nguyên liệu kèm khối lượng, tags bữa) | P0 |
| F-06 | Danh sách mua sắm tự động từ kế hoạch bữa ăn | P1 |
| F-07 | Phân tích ảnh món ăn bằng AI (Gemini Vision) | P1 |
| F-08 | Lưu kết quả AI thành nguyên liệu + món ăn mới | P1 |
| F-09 | Gợi ý thực đơn ngày bằng AI dựa trên mục tiêu | P1 |
| F-10 | Tra cứu thông tin dinh dưỡng nguyên liệu qua AI | P2 |
| F-11 | Export/Import dữ liệu dạng JSON | P1 |
| F-12 | Share dữ liệu qua hệ thống Android Share | P2 |
| F-13 | Cài đặt mục tiêu: cân nặng, calo mục tiêu, tỉ lệ protein | P1 |
| F-14 | Giao diện Dark/Light/System theme | P2 |
| F-15 | Giao diện song ngữ (Tiếng Việt / Tiếng Anh) | P2 |
| F-16 | Dịch tên nguyên liệu/món ăn offline (OPUS model) — xem thêm [ADR-004](../adr/004-food-dictionary-instant-translation.md) | P2 |
| F-17 | Xoá kế hoạch theo ngày/tuần/tháng | P2 |
| F-18 | Favicon/App icon hiển thị đúng trên browser và PWA | P3 |
| F-19 | Copy Plan — Sao chép kế hoạch bữa ăn sang nhiều ngày | P2 |
| F-20 | Meal Plan Templates — Lưu/tải/quản lý template bữa ăn | P2 |
| F-21 | Food Dictionary — Tra cứu dịch tên thực phẩm offline bằng static dictionary 200+ entries — xem [ADR-004](../adr/004-food-dictionary-instant-translation.md) | P2 |
| F-22 | AI Ingredient Suggestions for Dish — Gợi ý nguyên liệu cho món ăn bằng AI | P2 |
| F-23 | Google Drive Cloud Sync — Tự động sao lưu và đồng bộ dữ liệu qua Google Drive | P1 |
| F-24 | Quick Copy Plan — Sao chép kế hoạch bữa ăn sang ngày khác với chọn nhanh | P2 |
| F-25 | Meal Templates — Lưu/tải/quản lý template bữa ăn nâng cao | P2 |
| F-26 | Desktop Responsive Layout — Giao diện tự động chuyển layout desktop ≥ 1024px | P1 |
| F-27 | AI Suggest Ingredients — AI gợi ý nguyên liệu với fuzzy-match hệ thống | P2 |
| F-28 | Filter & Sort Bottom Sheet — Lọc và sắp xếp danh sách nguyên liệu/món ăn | P2 |
| F-29 | Fitness Module — Quản lý hồ sơ thể lực, training plans, workout logging, weight tracking | P1 |

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

> **Data schema:** Module sử dụng 3 bảng riêng (`fitness_profiles`, `fitness_preferences`, `workout_drafts`) cùng các bảng training/workout chung — tổng cộng hệ thống có **19 bảng** (xem `src/services/schema.ts`).

---

## 4. Yêu cầu phi chức năng (Non-Functional Requirements)

| NFR | Mô tả | Mức độ |
|-----|-------|--------|
| NFR-01 | Thời gian load lần đầu < 3s trên thiết bị mid-range | Must |
| NFR-02 | Các thao tác CRUD phản hồi < 100ms (localStorage) | Must |
| NFR-03 | Hoạt động offline hoàn toàn (ngoại trừ AI features) | Must |
| NFR-04 | Giao diện responsive: mobile (360px+) và tablet | Must |
| NFR-05 | AI API timeout 30 giây — không treo UI | Must |
| NFR-06 | Dữ liệu người dùng không gửi ra ngoài (ngoại trừ ảnh/tên gửi Gemini) | Should |
| NFR-07 | Bundle size < 2MB (code split lazy loading cho AI tab, Grocery tab) | Should |
| NFR-08 | Accessibility: labels cho inputs, aria-* attributes | Should |

---

## 5. Data Retention & Privacy

- **Tất cả dữ liệu** (ingredients, dishes, plans, profile) lưu trong `localStorage` của thiết bị.
- **Không gửi dữ liệu** lên server (ngoại trừ: (1) hình ảnh + tên nguyên liệu gửi Gemini API để phân tích, (2) tên nguyên liệu gửi Gemini API để tra cứu dinh dưỡng).
- Người dùng có thể **xoá toàn bộ** dữ liệu bằng cách xoá app hoặc clear browser storage.
- **Export JSON** cho phép người dùng tự backup.

---

## 6. Constraints & Assumptions

| Constraint | Mô tả |
|------------|-------|
| GEMINI_API_KEY | Client-side — phù hợp cho app cá nhân, cần proxy cho production |
| localStorage 5MB | Đủ cho dữ liệu bình thường (<100KB thực tế) |
| Android target | minSdkVersion 24 (Android 7.0+), targetSdkVersion 36 |
| Chrome WebView | AI features cần Chrome 91+ (Capacitor WebView) |
| No backend | Không có server — cloud sync qua Google Drive API (client-side) |

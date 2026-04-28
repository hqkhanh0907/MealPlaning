# Plan — So sánh kiến trúc MealPlaning vs Angular Style Guide & cập nhật doc

**Ngày:** 2026-04-28
**Trạng thái:** Plan only — KHÔNG thực hiện thay đổi code/doc trong lần này.
**Mục tiêu:** Đối chiếu cấu trúc project hiện tại + tài liệu kiến trúc với chuẩn Angular Style Guide 2025 (angular.dev) → đưa ra danh sách doc cần cập nhật + thứ tự ưu tiên + rủi ro.

---

## 1. Goal

1. So sánh **rõ ràng, có bằng chứng** giữa:
   - Cấu trúc thực tế trong `src/app/` của MealPlaning.
   - Cấu trúc mô tả trong `docs/4-architecture/architecture.md` và các tài liệu liên quan.
   - Khuyến nghị chính thức từ Angular Style Guide 2025 (https://angular.dev/style-guide).
2. Liệt kê toàn bộ tài liệu cần update (file path, section, lý do).
3. Đề xuất chiến lược migration tên file (style 2016 → 2025) cho lần triển khai sau, kèm rủi ro.
4. KHÔNG sửa code, KHÔNG đổi tên file, KHÔNG cập nhật doc trong lần này.

---

## 2. Bằng chứng đã thu thập

### 2.1 Nguồn chuẩn (Angular Style Guide 2025 — angular.dev)

Các rule quan trọng:

| # | Rule | Nguồn |
|---|------|-------|
| R1 | Toàn bộ UI code nằm trong `src/` | angular.dev/style-guide §Project structure |
| R2 | One concept per file (1 component/service/directive 1 file) | angular.dev/style-guide |
| R3 | Group closely related files together (ts + html + css + spec cùng thư mục) | angular.dev/style-guide |
| R4 | File name kebab-case (`user-profile.ts`) | angular.dev/style-guide §Naming |
| R5 | Cùng base name cho ts/html/css/spec (`user-profile.ts`, `.html`, `.css`, `.spec.ts`) | angular.dev/style-guide |
| R6 | **Style 2025 (default): bỏ suffix `.component`, `.service`, `.directive`, `.pipe`** ở cả file name và class name | angular.dev/cli/generate/application — option `file-name-style-guide` |
| R7 | Test file luôn `.spec.ts`, đặt cùng thư mục code, KHÔNG tách `/tests` | angular.dev/style-guide |
| R8 | Selector dùng prefix app (`app-user-profile`) | angular.dev/style-guide |
| R9 | Component lớn → tách `templateUrl` + `styleUrl`; nhỏ → inline OK | angular.dev/essentials/components |
| R10 | Nhiều style file cho 1 component → thêm hậu tố mô tả (`x.layout.css`, `x.theme.css`) | angular.dev/style-guide |

### 2.2 Cấu trúc thực tế `src/app/` (snapshot 2026-04-28)

```
src/app/
├── app.component.ts                ← (style 2016: có suffix .component)
├── app.routes.ts
├── core/
│   ├── guards/onboarding.guard.ts
│   ├── models/{ingredient,user-profile,management}.model.ts + .types.ts + .constants.ts
│   ├── repositories/{ingredient,dish,unit,dish-ingredient,user-profile}.repository.ts (+ .spec.ts)
│   ├── services/
│   │   ├── database/
│   │   │   ├── database.service.ts          (abstract)
│   │   │   ├── web-database.service.ts
│   │   │   ├── native-database.service.ts (+ 4 spec files)
│   │   │   ├── database.provider.ts
│   │   │   ├── schema.ts, schema-compatibility.ts, migrations.ts, migration-runner.ts, legacy-sqljs-migrator.ts
│   │   │   └── (các .spec.ts tương ứng)
│   │   ├── seed/seed-loader.service.ts
│   │   └── unit-resolver.ts                  ← (lệch convention: không có suffix, không nằm trong subfolder)
│   └── stores/{profile,ingredient,dish}.store.ts (+ .spec.ts)
├── features/
│   ├── dashboard/{dashboard.page.ts, dashboard.routes.ts}        ← KHÔNG có components/ con
│   ├── calendar/{calendar.page.ts, calendar.routes.ts}           ← KHÔNG có components/ con
│   ├── fitness/{fitness.page.ts, fitness.routes.ts}              ← KHÔNG có components/ con
│   ├── settings/{settings.page.ts, settings.routes.ts}           ← KHÔNG có components/ con
│   ├── management/
│   │   ├── management.page.ts (+ .spec.ts), management.routes.ts
│   │   └── unit-resolver.ts (+ .spec.ts)                         ← TRÙNG TÊN với core/services/unit-resolver.ts (smell)
│   └── onboarding/
│       ├── onboarding.page.ts, onboarding.routes.ts
│       ├── onboarding-validation.ts (+ .spec.ts)
│       ├── onboarding-calculation.ts (+ .spec.ts)
│       └── onboarding-form.types.ts
├── shared/
│   ├── components/{segmented-control, bottom-sheet-picker, nutrition-badge, confirm-dialog,
│   │              ingredient-edit-modal, empty-state, dish-edit-modal, search-toolbar}/
│   │              <name>.component.ts (+ .spec.ts) [+ optional .scss, .types.ts]
│   └── forms/
│       ├── form-field/form-field.component.ts (+ .spec.ts)
│       ├── schemas/{ingredient,dish,onboarding-step2a,common}-form.schema.ts (+ một số .spec.ts)
│       ├── mappers/README.md                  ← thư mục rỗng chỉ có README
│       ├── types.ts
│       └── index.ts                            ← barrel
└── tabs/{tabs.page.ts, tabs.routes.ts}
```

### 2.3 Cấu trúc mô tả trong `docs/4-architecture/architecture.md` §2

Mô tả tham vọng hơn nhiều so với thực tế:

- Có nhánh `core/services/ai/{gemini,nutrition-ai,fitness-ai,insight-ai}.service.ts` → **chưa tồn tại**.
- Có `core/services/{platform,network}.service.ts` → **chưa tồn tại**.
- Có 11 repositories (day-plan, meal-slot, exercise, training-plan, workout, weight-log, streak-log, ai-chat-log, app-config…) → thực tế chỉ có 5.
- Có 7 stores (day-plan, fitness, dashboard, ui…) → thực tế chỉ có 3.
- Có 7 models → thực tế gộp dưới `management.model.ts` + `user-profile.model.ts`.
- Có `shared/pipes/`, `shared/directives/`, `shared/components/{offline-banner, loading-skeleton}` → **chưa tồn tại**.
- Mỗi feature có `components/` con đầy đủ (ai-insight-card, week-view, training-plan-card…) → **thực tế trống** ngoài vài modal đã được nâng lên `shared/components/`.
- Migrations được mô tả đặt ở `core/services/database/migrations/V1_initial_schema.sql` → thực tế là `migrations.ts` (TypeScript inline).

→ **Đây là “design doc tương lai” đã trôi xa khỏi thực tại** (drift đáng kể).

---

## 3. So sánh chuẩn vs hiện tại

| Khía cạnh | Angular Style Guide 2025 | MealPlaning hiện tại | Trạng thái |
|-----------|--------------------------|----------------------|------------|
| Toàn bộ code trong `src/` | Bắt buộc | Đúng | ✅ |
| One concept per file | Bắt buộc | Đúng | ✅ |
| Group related files (ts+html+css+spec) | Bắt buộc | **Sai một phần** — phần lớn component dùng inline `template:` + `styles:` trong `.ts`, không có file `.html`/`.scss` riêng | ⚠️ chấp nhận được vì rule R9 cho phép inline với component nhỏ; cần verify từng case |
| File name kebab-case | Bắt buộc | Đúng | ✅ |
| Cùng base name cho ts/html/css/spec | Bắt buộc | Đúng (theo cặp đang có) | ✅ |
| **Style 2025: bỏ suffix `.component`, `.service`, `.page`, `.repository`, `.store`, `.guard`, `.routes`** | Khuyến nghị mới (default từ Angular CLI 2025) | **Toàn bộ codebase đang dùng style 2016** (`.component.ts`, `.service.ts`, `.page.ts`, `.repository.ts`, `.store.ts`, `.guard.ts`, `.routes.ts`) | ❌ Lệch chuẩn 2025 |
| Class name không suffix (`UserProfile`) | Khuyến nghị | Hầu hết đang có suffix (`AppComponent`, `IngredientStore` thì OK, nhưng `IngredientRepository`, `WebDatabaseService` có suffix) | ⚠️ Cần policy rõ |
| Test cùng thư mục, kết thúc `.spec.ts` | Bắt buộc | Đúng | ✅ |
| Selector prefix app | Bắt buộc | Cần verify (ionic dùng `app-`) | ⚠️ verify |
| Component lớn → tách template/style | Khuyến nghị | Hiện tại gần như inline 100% | ⚠️ cần audit case-by-case |
| Architecture.md phản ánh thực tế | Doc hygiene | Drift lớn (mô tả nhiều thứ chưa có) | ❌ |
| Subfolder `components/` trong từng feature | Pattern phổ biến (không bắt buộc) | Doc nói có, code không có | ⚠️ inconsistency |

### Phát hiện đáng chú ý

1. **Duplicate `unit-resolver.ts`** ở 2 chỗ: `core/services/unit-resolver.ts` và `features/management/unit-resolver.ts` — cần điều tra liệu có phải cùng concept bị copy-paste hay 2 mục đích khác nhau.
2. **`shared/forms/mappers/`** chỉ có README — empty package, có thể là placeholder bị bỏ quên.
3. Một vài util không phải Angular construct (`onboarding-validation.ts`, `onboarding-calculation.ts`, `unit-resolver.ts`) — phù hợp với "one concept per file" nhưng cần xem có nên gom vào `core/utils/` hay không (style guide không cấm cả 2 cách).
4. `app.component.ts` — class `AppComponent` style 2016. Theo Angular CLI 2025 default sẽ là `app.ts` chứa class `App`.
5. `tabs/` đặt ngang `features/` — không sai chuẩn nhưng doc không mô tả.

---

## 4. Danh sách tài liệu cần cập nhật

Phân theo mức độ ưu tiên & loại update.

### 4.1 BẮT BUỘC update — Drift cao, ảnh hưởng định hướng

| # | File | Section cần update | Lý do |
|---|------|---------------------|-------|
| D1 | `docs/4-architecture/architecture.md` | §2 Project Structure | Cấu trúc mô tả lệch nhiều với thực tế (stores, repos, services AI, components con trong feature). Cần tách rõ "Hiện tại" vs "Mục tiêu Phase 2/3". |
| D2 | `docs/4-architecture/architecture.md` | Thêm §2.x **Naming Conventions** | Hiện tại CLAUDE.md có nhưng architecture.md không có section riêng. Cần thống nhất Style 2025 vs 2016 và lý do project chọn cái nào. |
| D3 | `docs/4-architecture/architecture.md` | §1 Tech Stack | Bổ sung dòng "Style Guide: Angular 2025 / 2016 (chọn 1)" + link. |
| D4 | `CLAUDE.md` | §Code Architecture > Coding Guidelines | Bổ sung rule rõ về suffix file (giữ 2016 hay migrate 2025), tránh AI agent generate file mới với convention khác. |

### 4.2 NÊN update — Tránh drift tiếp

| # | File | Lý do |
|---|------|-------|
| D5 | `docs/4-architecture/architecture.md` (mới hoặc section) | Thêm **"Folder Conventions"**: khi nào component nâng lên `shared/`, khi nào để trong `features/<x>/components/`, ngưỡng kích thước để tách `templateUrl/styleUrl`. |
| D6 | `docs/5-development/development-plan.md` | Đối chiếu lại danh sách module/feature đã làm vs roadmap. |
| D7 | `docs/5-development/phase-1-management.md` | Cập nhật cấu trúc thực tế của module management (vd `unit-resolver.ts` đặt ở đâu là chuẩn). |
| D8 | `docs/5-development/signal-forms-migration-plan.md` | Bổ sung ghi chú về naming style nếu migration tạo file mới. |
| D9 | Tạo mới `docs/4-architecture/coding-conventions.md` | Tách riêng convention (file name, class name, selector prefix, folder rule, barrel export) khỏi architecture.md để dễ maintain. |

### 4.3 TUỲ CHỌN — Dọn dẹp doc cũ

| # | File | Lý do |
|---|------|-------|
| D10 | `docs/3-design/audits/*` | Hầu hết là audit phase-1 đã đóng. Cân nhắc move sang `docs/3-design/audits/_archive/`. KHÔNG xoá. |
| D11 | `docs/5-development/_drafts/*`, `_plans/*`, `_qa/*` | Đánh dấu trạng thái (draft / done / superseded). |
| D12 | `docs/4-architecture/ingredient-unit-macro-delta-checklist.md` | Verify còn relevant không, nếu đã hoàn tất → archive. |

### 4.4 KHÔNG đụng

- `docs/1-vision/*`, `docs/2-requirements/prd.md` — không ảnh hưởng kiến trúc kỹ thuật.
- `docs/3-design/mockups/*`, `docs/3-design/explorations/*` — design assets.
- `docs/5-ai/ai-strategy.md` — chiến lược AI, không phải structural.

---

## 5. Quyết định cần user chốt TRƯỚC khi triển khai

Đây là phần **decision points** — cần user confirm để giai đoạn implementation không phải làm lại:

1. **Q1 — Naming style:** Giữ **Style 2016** (`*.component.ts`, `*.service.ts`…) hay migrate sang **Style 2025** (`*.ts` không suffix, class name không suffix)?
   - Pro 2025: theo default mới của Angular CLI, future-proof, doc chính thức ưu tiên.
   - Con 2025: phải rename hàng trăm file, cập nhật mọi import, rủi ro merge conflict cao, breaks git blame.
   - Đề xuất mặc định: **giữ 2016 hiện tại + ghi rõ lý do trong architecture.md**, chỉ migrate khi có lợi ích rõ rệt (ví dụ trước khi mở source).
2. **Q2 — Cách viết lại §2 Project Structure:** chọn 1 trong 2:
   - (a) Mô tả "đúng hiện tại" — minimal, dễ verify, dễ maintain.
   - (b) Tách 2 phần rõ: "Current state" + "Target state (Phase 2/3 roadmap)".
   - Đề xuất: (b) — vẫn giữ tham vọng nhưng không gây nhầm lẫn.
3. **Q3 — Có tạo file riêng `coding-conventions.md` (D9)?** hay nhồi vào `architecture.md`?
   - Đề xuất: tách riêng — architecture.md đã 792 dòng, đang quá dài.
4. **Q4 — Xử lý duplicate `unit-resolver.ts`** (smell phát hiện được): điều tra & sửa code hay chỉ note vào doc?
   - Đề xuất: note vào doc trong lần update này, sửa code ở task riêng (boy-scout sau).
5. **Q5 — Audit selector prefix:** có cần verify toàn bộ component đang dùng prefix `app-` không?
   - Đề xuất: có — quick grep, đưa kết quả vào doc.

---

## 6. Step-by-step plan (cho lần TRIỂN KHAI sau)

> **Lần này KHÔNG làm**, chỉ liệt kê để user duyệt thứ tự.

### Phase 0 — Quyết định (≤ 30 phút)
- [ ] Chốt Q1–Q5 ở §5.

### Phase 1 — Audit chính xác (read-only, ≤ 1h)
- [ ] Quét toàn bộ `src/app/` lập bảng "actual structure" chi tiết (script: `find` + parse).
- [ ] Verify selector prefix của mọi `@Component` (regex grep).
- [ ] Đếm component dùng inline template vs external (ngưỡng nào nên tách).
- [ ] Điều tra duplicate `unit-resolver.ts` — same code hay khác?
- [ ] Verify `shared/forms/mappers/` có cần tồn tại không.
- [ ] Output: `docs/4-architecture/_audit/2026-04-28-structure-audit.md`.

### Phase 2 — Update tài liệu (write, ≤ 2h)
- [ ] Update `docs/4-architecture/architecture.md` §1, §2 (D1, D2, D3) — dựa trên Phase 1.
- [ ] (Nếu chốt D9) tạo `docs/4-architecture/coding-conventions.md`.
- [ ] Update `CLAUDE.md` §Code Architecture (D4) — đảm bảo AI agent generate đúng convention.
- [ ] Update `docs/5-development/development-plan.md` (D6) — sync với thực tế.
- [ ] Update `docs/5-development/phase-1-management.md` (D7).
- [ ] Cross-link giữa các file (architecture ↔ coding-conventions ↔ CLAUDE).

### Phase 3 — Verification (≤ 30 phút)
- [ ] Đọc lại doc xem có còn drift không (compare với output Phase 1).
- [ ] Run `npm run check:form-pattern` + `ng lint` — đảm bảo doc không khẳng định gì lint sẽ fail.
- [ ] Commit theo conventional commit: `docs(architecture): sync project structure with actual codebase + add coding conventions`.

### Phase 4 — (Tuỳ chọn) Cleanup audits cũ
- [ ] Move audits đã đóng sang `_archive/` (D10).
- [ ] Đánh dấu draft/done cho `_drafts/`, `_plans/`, `_qa/` (D11).

---

## 7. Files dự kiến sẽ thay đổi (chỉ liệt kê, KHÔNG sửa lần này)

```
docs/4-architecture/architecture.md                       (UPDATE)
docs/4-architecture/coding-conventions.md                 (NEW, optional)
docs/4-architecture/_audit/2026-04-28-structure-audit.md  (NEW)
docs/5-development/development-plan.md                    (UPDATE)
docs/5-development/phase-1-management.md                  (UPDATE light)
docs/5-development/signal-forms-migration-plan.md         (UPDATE light)
CLAUDE.md                                                 (UPDATE §Code Architecture)
```

Không đụng vào source code (`src/**`) trong toàn bộ scope kế hoạch này.

---

## 8. Risks & Tradeoffs

| Risk | Mức | Mitigation |
|------|-----|------------|
| Doc update mâu thuẫn với code thực tế (lại drift tiếp) | Cao | Phase 1 audit script-based, không viết tay; Phase 3 verify lại |
| User chọn migrate 2025 → tốn 1-2 ngày rename + risk merge conflict | Trung | Khuyến nghị giữ 2016 + ghi rõ trong doc |
| Architecture.md quá dài (792 dòng) sau khi thêm naming + folder rule | Trung | Tách `coding-conventions.md` (D9) |
| Section "Target state" dễ trở thành drift mới trong tương lai | Trung | Mỗi mục target ghi rõ ticket/phase tương ứng + ngày ước tính |
| Duplicate `unit-resolver.ts` có thể là bug functional | Thấp-Trung | Điều tra ở Phase 1, fix riêng task khác (boy-scout) |
| Doc audits cũ trong `_archive/` mất link tham chiếu | Thấp | Dùng `git mv` để giữ history |

---

## 9. Open questions (cần user xác nhận)

- Các Q1–Q5 ở §5.
- Có muốn mình tự chạy Phase 1 audit (read-only) trong turn tiếp theo và present output trước khi update doc không? Hay user muốn review plan này trước rồi mới đi tiếp?
- Có cần đối chiếu thêm với best practice từ nguồn khác (Nx, Angular Architects, John Papa style guide cũ) không, hay chỉ angular.dev là đủ?

# Coding Conventions — HealthMate AI (MealPlaning)

**Version:** 1.0
**Date:** 2026-04-28
**Status:** Active
**Audience:** Developers + AI agents (Claude Code, Hermes, Codex…) generating code trong repo này.

> Tài liệu này tách ra từ `architecture.md` để dễ maintain. Khi có conflict giữa file này và `architecture.md`, **file này thắng**.
>
> Nguồn chuẩn: https://angular.dev/style-guide (Angular Style Guide 2025).

---

## 1. Naming style — Style 2025 (DONE)

### 1.1 Trạng thái (snapshot 2026-04-28)

- ✅ **Đã migrate Style 2016 → Style 2025** trong Phase C refactor.
- Toàn bộ file `.component.ts`, `.service.ts` đã rename → bỏ suffix; class declaration tương ứng cũng bỏ suffix `Component` / `Service`.
- Codemod: `scripts/rename-style-2025.mjs` (ts-morph based). Đã chạy xong, giữ lại trong repo cho reference.
- Ngoại lệ tên class: `AppFormField` (giữ prefix `App`) vì `FormField` đụng symbol từ `@angular/forms/signals`.

### 1.2 Quy tắc Style 2025 (BẮT BUỘC cho mọi file mới)

| Loại | Style 2016 (cũ) | **Style 2025 (mới — TARGET)** |
|------|-----------------|-------------------------------|
| Component file | `user-profile.component.ts` | `user-profile.ts` |
| Component class | `export class UserProfileComponent` | `export class UserProfile` |
| Service file | `auth.service.ts` | `auth.ts` (hoặc `auth-service.ts` nếu trùng tên thực thể) |
| Service class | `export class AuthService` | `export class Auth` |
| Directive file | `highlight.directive.ts` | `highlight.ts` |
| Directive class | `export class HighlightDirective` | `export class Highlight` |
| Pipe file | `currency.pipe.ts` | `currency.ts` (hoặc `currency-pipe.ts`) |
| Pipe class | `export class CurrencyPipe` | `export class Currency` |
| Guard file | `auth.guard.ts` | `auth-guard.ts` |
| Resolver file | `user.resolver.ts` | `user-resolver.ts` |
| Interceptor file | `auth.interceptor.ts` | `auth-interceptor.ts` |
| Module (legacy) | `user.module.ts` | n/a — chỉ standalone |
| Routes | `app.routes.ts` | `app.routes.ts` (giữ — không đổi) |
| Test | `user-profile.spec.ts` | `user-profile.spec.ts` (giữ — không đổi) |
| Model / interface | `user.model.ts` | `user.ts` hoặc giữ `user.model.ts` (Style Guide không cấm) |

### 1.3 Code legacy

Sau Phase C, KHÔNG còn file Style 2016 nào trong `src/app/`. Mọi file mới MUST tuân thủ Style 2025; PR review phải reject Style 2016.

---

## 2. File & folder rules

> **Cách đọc tài liệu này:**
> - Mục có **[Angular]** = quote từ Angular Style Guide chính thức (https://angular.dev/style-guide). Authority cao.
> - Mục có **[Project]** = convention nội bộ HealthMate AI. KHÔNG phải rule official của Angular — chỉ áp dụng trong repo này. Đánh số `PC-N` (Project Convention).
> - Angular Style Guide chính thức **không có hệ thống đánh số R1, R2…** — bất kỳ "R-number" nào trong tài liệu cũ phải hiểu là numbering nội bộ (đã loại bỏ ở phiên bản này).

### 2.1 Bắt buộc — quote từ Angular Style Guide [Angular]

1. Toàn bộ UI code nằm trong `src/`.
2. **One concept per file** — 1 component / service / directive / pipe / store / repository per file.
3. **Group related files together**: `<name>.ts` + `<name>.html` + `<name>.css/scss` + `<name>.spec.ts` cùng thư mục.
4. **kebab-case** cho file name (`user-profile.ts`, không phải `userProfile.ts`).
5. Cùng **base name** cho mọi file của 1 component.
6. `.spec.ts` đặt cùng thư mục với code, **KHÔNG** tách `/tests`.
7. Selector component dùng prefix riêng cho app (project chọn `app-`).
8. Multiple style file → hậu tố mô tả (`user-profile.layout.scss`, `user-profile.theme.scss`).
9. **Template/style: Angular khuyến nghị tách external khi "more than a few lines"** — nguyên văn: *"Consider extracting templates and styles into a separate file when they are more than a few lines."* — không có ngưỡng cứng.

### 2.2 Inline vs external template/style — Project Convention [Project]

Angular không quy định ngưỡng cụ thể cho việc tách external. Project HealthMate AI chọn rule **binary, không ngoại lệ**: mọi component MUST tách `templateUrl` + `styleUrl`.

#### PC-1 — Mọi component tách external (binary, không ngưỡng)

| Trường hợp | Rule |
|---|---|
| Component bất kỳ (kể cả page shell, app root, component < 30 dòng) | **BẮT BUỘC** dùng `templateUrl` + `styleUrl`. Cấm inline `template:` / `styles:` / `styles[]`. |

Lý do chọn binary thay vì threshold:
- Loại bỏ tranh cãi trong code review về "dòng nào tính, đếm comment không…".
- Consistency: mọi component cùng pattern → reviewer nhìn 1 chỗ.
- Tooling (Prettier, IDE syntax highlight cho HTML/SCSS, hot reload) hoạt động tối ưu khi template/style nằm file riêng.
- Diff PR sạch hơn — không còn diff hỗn hợp HTML+TS+CSS trong cùng 1 file.

#### Trạng thái hiện tại (rev 2026-05) — PC-1 đang PASS

Toàn bộ component trong `src/app/` hiện dùng `templateUrl` + `styleUrl` external.
Rule này được enforce bằng `scripts/check-pc1-external-templates.mjs`, chạy trong
`npm run check:guards` và `npm run build`.

Snapshot 2026-04-28 từng ghi nhận 17/17 component vi phạm PC-1; debt đó đã được
xử lý trong Phase B/C refactor. Không tái tạo bảng nợ cũ trong docs hiện hành để
tránh agent/dev refactor ngược.

#### PC-2 — Pattern naming khi tách

Style 2016 (code hiện tại):
```
shared/components/<name>/
├── <name>.component.ts          # @Component({ templateUrl: './<name>.component.html', styleUrl: './<name>.component.scss' })
├── <name>.component.html
├── <name>.component.scss
└── <name>.component.spec.ts
```

Style 2025 (sau migration):
```
shared/components/<name>/
├── <name>.ts                    # @Component({ templateUrl: './<name>.html', styleUrl: './<name>.scss' })
├── <name>.html
├── <name>.scss
└── <name>.spec.ts
```

#### Vì sao project trước đây chọn inline-first

- Sprint Phase 1 ưu tiên tốc độ + ít file → inline gọn cho component nhỏ.
- Đây là quyết định **tactical**, đã hết hạn dùng. PC-1 hiện hành thay thế hoàn toàn.

#### Guard — bắt buộc giữ xanh

Chạy `npm run check:pc1` hoặc full `npm run check:guards` trước khi merge. Nếu
guard fail, sửa component vi phạm thay vì thêm exception.

### 2.3 Folder layout chuẩn

```
src/app/
├── core/                 # singleton — providedIn: 'root'
│   ├── services/         # business + infra services (database, ai, platform, network…)
│   ├── repositories/     # data access (mỗi entity 1 file)
│   ├── stores/           # Signal stores (ingredient, dish, profile…)
│   ├── models/           # interfaces, types, constants
│   └── guards/
├── shared/               # reusable across ≥ 2 features
│   ├── components/<name>/<name>.ts(.html/.scss/.spec.ts)
│   ├── pipes/
│   ├── directives/
│   └── forms/            # Signal Forms infrastructure (form-field, schemas, mappers)
├── features/<feature>/
│   ├── <feature>.page.ts (sẽ thành <feature>.ts ở Style 2025)
│   ├── <feature>.routes.ts
│   └── components/<name>/      # component CHỈ dùng trong feature này
└── tabs/                 # tab bar wrapper (IonTabs)
```

**Quy tắc nâng cấp shared:**
- Component **chỉ 1 feature** dùng → đặt trong `features/<x>/components/`.
- Component **≥ 2 features** dùng → nâng lên `shared/components/`.
- Service **singleton toàn app** → `core/services/` + `@Injectable({ providedIn: 'root' })`.

### 2.4 Empty placeholder folders

KHÔNG tạo thư mục rỗng "để dành". Tạo khi có file đầu tiên thực sự cần. Hiện trạng `shared/pipes/` và `shared/directives/` rỗng được giữ tạm vì doc lịch sử đã reference — sẽ xoá nếu Phase 3 (Calendar) vẫn không có content.

---

## 3. Class & code style

### 3.1 Bắt buộc

- TypeScript strict mode. **KHÔNG** `any`.
- Standalone components — **không** dùng `NgModule` cho code mới.
- Inject bằng `inject()`. **Không** dùng constructor DI cho code mới.
- State: Angular Signals (`signal`, `computed`, `effect`). Không dùng RxJS BehaviorSubject mới.
- Control flow: `@if`, `@for`, `@switch` (không dùng `*ngIf`, `*ngFor`).
- DB columns: snake_case. TypeScript: camelCase. Mapper ở repository layer.
- Primary key: UUID v4 (string).
- Timestamp: ISO 8601 string.

### 3.2 Khuyến nghị

- Pure utility (không decorator) → file không cần suffix: `unit-resolver.ts`, `onboarding-validation.ts`. OK.
- Re-export barrel chỉ tạo khi có ≥ 2 consumer thật. Tránh dead barrel (xem audit 2026-04-28).
- Type-only file: hậu tố `.types.ts` được chấp nhận (vd `management.types.ts`).
- Constants file: hậu tố `.constants.ts`.

---

## 4. Form inputs (đã có rule riêng)

Xem `docs/3-design/design-system.md §8.6` và `CLAUDE.md §Form Inputs`. Tóm tắt: tất cả input dùng `.input-wrapper` + `.input-label` + `.input-native` floating-label, hoặc `.picker-trigger--floating`. Lint script: `npm run check:form-pattern`.

---

## 5. Test conventions

- Framework: Karma + Jasmine (Angular default).
- Unit test cùng thư mục, kết thúc `.spec.ts`.
- Mỗi public function của service/repository/store: ≥ 1 test happy path + ≥ 1 edge case.
- Test naming: `describe('FeatureName')` → `it('should <behaviour> when <condition>')`.

---

## 6. Imports

- Ionic standalone components import từng cái: `import { IonButton, IonContent } from '@ionic/angular/standalone';`
- Icons: `addIcons({ ... })` trong constructor + `<ion-icon name="...">` trong template.
- Path alias: ưu tiên relative path trong cùng feature; cross-feature dùng absolute (`@app/core/...`) khi thiết lập tsconfig path mapping (chưa cấu hình hiện tại).

---

## 7. Vietnamese UI labels

Mọi label hiển thị end-user dùng tiếng Việt: Tổng quan, Lịch ăn, Quản lý, Tập luyện, Cài đặt. Identifier code (variable, class, file) dùng tiếng Anh.

---

## 8. AI agent guidelines

Khi AI agent (Claude Code, Codex, Hermes…) generate code mới trong repo này:

1. Đọc file này TRƯỚC khi tạo file mới.
2. **Code mới → Style 2025** (bỏ suffix). Code sửa file cũ → giữ tên cũ.
3. KHÔNG tạo `NgModule`. KHÔNG dùng `any`. KHÔNG dùng constructor DI.
4. Component mới → tạo selector `app-<kebab>`.
5. Component mới → **bắt buộc** tạo `templateUrl` + `styleUrl` external (PC-1, không ngoại lệ).
6. KHÔNG tạo barrel file `index.ts` trừ khi đã có ≥ 2 consumer.
7. KHÔNG tạo thư mục rỗng "để dành".

---

## 9. References

- Angular Style Guide (2025): https://angular.dev/style-guide
- Angular CLI `file-name-style-guide` option: https://angular.dev/cli/generate/application
- Component basics: https://angular.dev/essentials/components
- Architecture overview: `./architecture.md`

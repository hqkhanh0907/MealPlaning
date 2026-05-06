# Architecture — HealthMate AI

**Date:** 2026-05-06
**Source-of-truth canonical:** `docs/4-architecture/architecture.md` + `docs/4-architecture/coding-conventions.md`. File này là tóm tắt BMAD-friendly, không thay thế canonical.

## 1. Architecture Pattern

**Layered standalone Angular** với 3 tầng rõ ràng:

```
┌────────────────────────────────────────────────────────────┐
│                      features/ (lazy)                       │
│  dashboard | calendar | management | fitness | settings    │
│                       | onboarding                          │
└──────────────────────────────┬─────────────────────────────┘
                               │ inject()
                ▼              ▼              ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ shared/         │  │ core/stores     │  │ core/services   │
│ - components    │  │ - signal-based  │  │ - ai (Gemini)   │
│ - forms         │  │ - reactive view │  │ - notifications │
│ - form-field    │  │   layer state   │  │ - profile/theme │
└─────────────────┘  └────────┬────────┘  └────────┬────────┘
                              │                     │
                              ▼                     ▼
                     ┌─────────────────┐   ┌─────────────────┐
                     │ core/repos      │   │ core/services/  │
                     │ - dish/ingred   │   │   database      │
                     │ - user-profile  │   │ - dual impl     │
                     └────────┬────────┘   │   (web/native)  │
                              │            └────────┬────────┘
                              └─────────┬───────────┘
                                        ▼
                              ┌─────────────────────┐
                              │   SQLite (local)    │
                              │   18 tables, v6     │
                              └─────────────────────┘
```

## 2. Dependency Injection rules

- ✅ `inject()` everywhere — constructor DI deprecated cho code mới.
- ✅ Standalone components — KHÔNG NgModule.
- ✅ Service `providedIn: 'root'` cho singleton (database, repos, stores, ai).
- ✅ Provider factory cho dual-DB: `database.provider.ts` quyết định Web vs Native dựa trên Platform.

## 3. Dual-DB Abstraction (key pattern)

```ts
// core/services/database/database.ts
export abstract class DatabaseService {
  abstract initialize(): Promise<void>;
  abstract query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  abstract execute(sql: string, params?: unknown[]): Promise<void>;
  abstract transaction<T>(fn: () => Promise<T>): Promise<T>;
}

// 2 implementations:
// - WebDatabaseService → sql.js WASM (test/dev/web)
// - NativeDatabaseService → @capacitor-community/sqlite (Android runtime)

// database.provider.ts → factory chọn impl theo Capacitor.isNativePlatform()
```

**Schema management:**
- `schema.ts` — DDL string array (idempotent với `IF NOT EXISTS`), `SCHEMA_VERSION = 6`.
- `migrations.ts` — numbered migrations.
- `migration-runner.ts` — apply pending migrations on app start.
- `legacy-sqljs-migrator.ts` — migrate legacy sql.js DB qua native trên Android.
- `schema-compatibility.ts` — runtime sanity check schema vs code.

## 4. State Management (Signal-based)

**Stores (4 total) ở `core/stores/`:**

| Store | Trách nhiệm |
|---|---|
| `dish.store.ts` | Cache dish list, CRUD operations |
| `ingredient.store.ts` | Cache ingredient list, CRUD operations |
| `profile.store.ts` | User profile state (BMR/TDEE/goals/theme) |
| `network.store.ts` | Online/offline state (cho AI banner) |

**Pattern chuẩn:**
```ts
@Injectable({ providedIn: 'root' })
export class DishStore {
  private repo = inject(DishRepository);

  // Private writable signal
  private _dishes = signal<Dish[]>([]);

  // Public readonly signals
  readonly dishes = this._dishes.asReadonly();
  readonly count = computed(() => this._dishes().length);

  async loadAll() {
    this._dishes.set(await this.repo.findAll());
  }
}
```

> Chi tiết: `state-management.md`.

## 5. AI Integration (Google Gemini)

```
┌─────────────────────────────────────────────────────┐
│              shared/components                       │
│  ai-lookup-sheet | dish-autofill-sheet | ...banner  │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│          core/services/ai/                          │
│                                                      │
│  ┌───────────────┐  ┌──────────────────────┐       │
│  │ gemini-key    │  │ gemini-client        │       │
│  │ - storage     │──▶ - HTTP REST API      │       │
│  │ - obfuscate   │  │ - retry/timeout      │       │
│  └───────────────┘  └──────────┬───────────┘       │
│                                │                    │
│              ┌─────────────────┼─────────────────┐ │
│              ▼                 ▼                 ▼ │
│      ┌───────────────┐ ┌──────────────┐ ┌───────┐ │
│      │ nutrition-ai  │ │dish-autofill-│ │prompts│ │
│      │ - lookup      │ │  applier     │ │       │ │
│      └───────────────┘ └──────────────┘ └───────┘ │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
            ┌─────────────────────────┐
            │  Google Gemini REST API │
            │  (online only)          │
            └─────────────────────────┘
```

- Key lưu obfuscated trong SQLite (`app_config` table).
- Network store theo dõi online state → hiện `ai-offline-banner` khi offline.
- Detail strategy: `docs/5-ai/ai-strategy.md` (canonical).

## 6. Forms Architecture

- **Reactive Forms** (đang là chuẩn hiện tại).
- **Migration plan** sang Signal Forms: `docs/5-development/signal-forms-migration-plan.md`.
- **Schema validation:** Zod v4 (chú ý `.uuid()` strict v1-8).
- **Form ↔ Domain mappers:** `shared/forms/mappers/` (tách parsing khỏi component).
- **Form-field component:** `shared/forms/form-field/` — floating-label canonical (enforced by `check:form-pattern`).

## 7. Coding Conventions (5 CI guards)

| Guard | Rule | Khi vi phạm |
|---|---|---|
| `form-pattern` | Mọi input dùng floating-label canonical markup | CI red |
| `pc1` | `templateUrl` + `styleUrl` external — KHÔNG inline `template:` / `styles:` | CI red |
| `style-2025` | Naming theo Style 2025 (no `__container`/`__page-content` cũ) | CI red |
| `design-tokens` | Color/bg/font-size dùng token, không hardcode | CI red |
| `macro-naming` | BEM 2-level tối đa | CI red |

→ Husky pre-commit chạy guards trước mỗi commit.
→ Local: `npm run check:guards`.

## 8. Build & Deploy

```
Source (TS/HTML/SCSS) ──▶ Angular CLI (Vite) ──▶ www/
                                                   │
                                                   ▼
                                          npx cap sync android
                                                   │
                                                   ▼
                                          android/ Gradle build
                                                   │
                                                   ▼
                                          APK (debug/release)
```

- Gradle 8.14 + AGP 8.13 + JDK 21.
- compileSdk 36, minSdk 24.
- Capacitor `appId = com.healthmate.ai`.
- `signingType: 'apksigner'` (modern signing).

## 9. Out of scope (intentional architectural decisions)

- ❌ **No auth** — single-user offline app.
- ❌ **No sync/cloud DB** — local-first.
- ❌ **No multi-profile** — `user_profile` cố ý không có `display_name`.
- ❌ **No iOS** — Android-only.
- ❌ **No NgModule** — standalone-only.
- ❌ **No NgRx** — Signals đủ cho project size hiện tại.
- ❌ **No inline templates/styles** — PC-1 binary.

## 10. Decision References

| Decision | Source |
|---|---|
| 100g/100ml canonical, dish-first | `docs/3-design/data-model.md` §3 |
| No `display_name` (no-user-name) | `docs/3-design/data-model.md` §3.1 + `docs/2-requirements/prd.md` §13.1 |
| PC-1 binary (external template) | `docs/4-architecture/coding-conventions.md` §2.2 |
| Dual-DB (sql.js + capacitor) | `docs/4-architecture/architecture.md` |
| Signal Forms migration | `docs/5-development/signal-forms-migration-plan.md` |
| Phase 1 management implicit DONE | git commit `646aacc` (cleanup) |

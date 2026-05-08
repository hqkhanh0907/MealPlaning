# Source Tree Analysis — HealthMate AI

> **⚠️ STALE NOTICE (2026-05-08):** This is a BMAD brownfield snapshot from 2026-05-07. Sections referencing `dark mode`, `_dark-mode.scss`, `prefers-color-scheme`, or theme switching are **out of date** as of v0.2.1 (Story 2.6 removed dark mode). Treat dark-mode references as historical context.

**Date:** 2026-05-06
**Scan Level:** Deep
**Source root:** `src/`
**Total LOC** (`*.ts` + `*.html` + `*.scss`): ~21,000

## Top-level layout

```
HealthMate AI/
├── src/                     # Application source
│   ├── main.ts              # Bootstrap
│   ├── app/                 # Application code (chi tiết bên dưới)
│   ├── theme/               # Global SCSS tokens & shared styles
│   ├── assets/              # Icons, images, seed data
│   ├── environments/        # environment.ts / environment.local.ts (gitignored)
│   └── types/               # Custom TS types
├── docs/                    # 17 canonical docs + .bmad/ (this folder)
├── android/                 # Capacitor Android project (gitignored)
├── scripts/                 # CI guard scripts (5 mjs guards) + utilities
├── _bmad/                   # BMAD Method install (config + bmm module)
├── _bmad-output/            # BMAD planning + implementation artifacts
├── .claude/skills/          # 42 BMAD skills bridge
├── package.json             # Node 22 / Angular 21 / Ionic 8 / Capacitor 8 deps
├── angular.json             # Angular CLI config
├── capacitor.config.ts      # appId com.healthmate.ai, Android-only
├── ionic.config.json
└── CLAUDE.md                # Source-of-truth cho AI agent
```

## `src/app/` — Application Code

### Layered architecture

```
src/app/
├── app.component.ts         # Root: <ion-app><ion-router-outlet/></ion-app>
├── app.routes.ts            # Top-level routes (24 lines)
│
├── core/                    # ⭐ Singleton services, repositories, stores
│   ├── guards/              # Route guards
│   ├── models/              # TypeScript interfaces (domain types)
│   ├── repositories/        # 4 repos: dish, dish-ingredient, ingredient, user-profile
│   │   └── *.spec.ts        # Mỗi repo có spec đi cặp
│   ├── services/
│   │   ├── ai/              # Gemini integration (9 files)
│   │   │   ├── gemini-client.ts             # HTTP client
│   │   │   ├── gemini-key.ts                # API key storage
│   │   │   ├── gemini-types.ts              # Request/response types
│   │   │   ├── nutrition-ai.ts              # Nutrition lookup
│   │   │   ├── dish-autofill-applier.ts     # Apply AI suggestions
│   │   │   └── prompts/                     # Prompt templates
│   │   ├── database/        # ⭐ Dual-DB abstraction (19 files)
│   │   │   ├── database.ts                  # Abstract base
│   │   │   ├── database.provider.ts         # DI factory (web vs native)
│   │   │   ├── web-database.ts              # sql.js impl (test/dev)
│   │   │   ├── native-database.ts           # @capacitor-community/sqlite (Android)
│   │   │   ├── schema.ts                    # 18 tables, version 6
│   │   │   ├── migrations.ts                # Numbered migrations
│   │   │   ├── migration-runner.ts          # Runner
│   │   │   ├── legacy-sqljs-migrator.ts     # Legacy compat
│   │   │   ├── schema-compatibility.ts      # Compat layer
│   │   │   └── *.spec.ts                    # 8 spec files
│   │   ├── notifications/   # LocalNotifications wrapper
│   │   ├── profile/         # User profile + BMR/TDEE
│   │   ├── seed/            # Seed data loader
│   │   └── theme/           # Theme service (light/dark/system)
│   ├── stores/              # 4 Signal stores: dish, ingredient, network, profile
│   │   └── *.spec.ts        # Mỗi store có spec
│   └── utils/               # Helpers
│
├── shared/                  # Reusable UI building blocks
│   ├── components/          # 10 shared components (xem ui-component-inventory.md)
│   └── forms/               # Form infrastructure
│       ├── form-field/      # Floating-label form-field component (PC-1 + form-pattern guard)
│       ├── mappers/         # Form ↔ domain model mappers
│       └── schemas/         # Zod schemas (v4 strict UUID)
│
├── features/                # ⭐ Lazy-loaded feature areas (6)
│   ├── dashboard/           # Tab 1: Tổng quan
│   ├── calendar/            # Tab 2: Lịch ăn
│   ├── management/          # Tab 3: Quản lý nguyên liệu & món
│   │   ├── dish-edit/       # Page: edit dish
│   │   └── ingredient-edit/ # Page: edit ingredient
│   ├── fitness/             # Tab 4: Tập luyện
│   ├── settings/            # Push page (không phải tab)
│   │   ├── activity-edit/
│   │   ├── body-edit/
│   │   └── goals-edit/
│   └── onboarding/          # First-run wizard
│
└── tabs/                    # Tab bar wrapper (4 tabs)
```

### Key conventions enforced (5 CI guards)

| Guard | Bắt | Vi phạm điển hình |
|---|---|---|
| `check:form-pattern` | Tất cả input phải dùng floating-label markup chuẩn | `<ion-input>` tự do |
| `check:pc1` | `templateUrl` + `styleUrl` external | `template:` / `styles:` inline |
| `check:style-2025` | Không còn naming Style 2016 | `__container`, `__page-content` cũ |
| `check:design-tokens` | color/background/font-size dùng token | `color: #fff`, `background: var(--bla)` |
| `check:macro-naming` | BEM 2-level | `.block__elem__sub` (3 level) |

## `src/theme/` — Global SCSS

```
theme/
├── variables.scss            # Ionic CSS custom properties + dark mode tokens
├── _dark-mode.scss           # @media (prefers-color-scheme: dark) blocks
├── button-row.scss           # Shared pattern
├── form-field.scss           # Floating-label styling
├── form-modal.scss           # Modal pattern
├── header-elevation.scss     # Header shadow on scroll
├── list-card.scss            # Card list pattern
└── segment-control.scss      # Segment control
```

## Test files distribution

- **Total spec:** 53 (~10% test ratio by file count)
- **Critical-path spec coverage:**
  - Database: 8 spec (provider, migration, native, schema, compat, transaction, ...)
  - Repositories: 4 spec (1:1 với repo)
  - Stores: 4 spec (1:1 với store)
  - AI: gemini-client, gemini-key, dish-autofill-applier, nutrition-ai
  - Guards / utils: smaller coverage

## Files NOT scanned (intentional)

- `node_modules/` — deps
- `android/` — Capacitor-generated, gitignored
- `dist/`, `www/` — build output
- `.angular/`, `.hermes/` — caches
- `coverage/` — test artifacts

## Hot paths khi sửa code

| Khi sửa... | Đụng những file nào | Test cần chạy |
|---|---|---|
| Schema DB | `core/services/database/{schema,migrations}.ts` + `migration-runner.spec.ts` | `ng test --include='**/database/**'` |
| Repository mới | `core/repositories/<name>.repository.{ts,spec.ts}` + `core/models/` | spec của repo |
| Store mới | `core/stores/<name>.store.{ts,spec.ts}` | spec của store |
| Component shared | `shared/components/<name>/` + 5 CI guards | `npm run check:guards` + spec |
| Feature page | `features/<area>/<page>/<page>.page.{ts,html,scss,spec.ts}` | spec page + 5 CI guards |
| Form chuẩn | `shared/forms/form-field/` + đảm bảo `check:form-pattern` pass | guards |
| AI prompt | `core/services/ai/prompts/` | nutrition-ai.spec / dish-autofill-applier.spec |

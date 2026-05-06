# HealthMate AI — Project Overview

**Date:** 2026-05-06
**Type:** Mobile (Android-only, offline-first, single-user)
**Architecture:** Layered standalone components with Signal-based state, dual-DB abstraction

## Executive Summary

HealthMate AI là ứng dụng di động Android được xây dựng cho người Việt, hỗ trợ lập kế hoạch ăn uống và tập luyện theo mục tiêu dinh dưỡng cá nhân. Toàn bộ dữ liệu lưu local trong SQLite, không có auth/sync/cloud — đảm bảo hoạt động hoàn toàn offline. Tích hợp Google Gemini AI để auto-fill thông tin món ăn / nguyên liệu khi có mạng.

## Project Classification

- **Repository Type:** Monolith (1 part)
- **Project Type:** Mobile
- **Primary Language:** TypeScript 5.9 (strict mode, no `any`)
- **Architecture Pattern:** Layered (core / shared / features) + Repository + Signal-based state

## Technology Stack

| Category | Technology | Version | Vai trò |
|---|---|---|---|
| Framework | Angular | 21.2.10 | Standalone components, Signals, control-flow `@if/@for` |
| UI | Ionic | ^8.0.0 | Mobile UI primitives, theming |
| Native bridge | Capacitor | 8.3.0 | Android wrapper |
| Forms | Angular Forms | 21.2.10 | Reactive Forms (đang migrate sang Signal Forms) |
| State | Angular Signals | (built-in) | `signal()`, `computed()`, `effect()` — KHÔNG dùng NgRx/Redux |
| DB (Android) | @capacitor-community/sqlite | ^8.1.0 | Native SQLite |
| DB (web/test) | sql.js | ^1.14.1 | WASM SQLite cho test/dev |
| Validation | zod | ^4.3.6 | Schema validation (chú ý v4 `.uuid()` strict v1-8) |
| AI | Google Gemini | (REST API) | Dish autofill, nutrition lookup |
| Reactive | RxJS | ~7.8 | Tối thiểu — chủ yếu Signals |
| Test | Karma + Jasmine | (devDeps) | Unit test + spec |
| Build | Angular CLI + Vite | 21.x | `ng build`, `ng test`, `ionic build` |
| Native build | Gradle | 8.14 | AGP 8.13, compileSdk 36, minSdk 24, JDK 21 |
| Node | Node.js | 22 LTS | required |

## Key Features

1. **Onboarding** — first-run wizard tính BMR/TDEE, set mục tiêu (lose/gain/maintain/performance).
2. **Quản lý nguyên liệu & món** (`features/management`) — CRUD ingredient/dish, AI autofill.
3. **Lịch ăn** (`features/calendar`) — day-plan với meal slots (breakfast/lunch/dinner/snack).
4. **Dashboard** (`features/dashboard`) — tracking calo/macro/weight, streak.
5. **Fitness** (`features/fitness`) — training plan, workout session, exercise log.
6. **Settings** — theme (light/dark/system), notifications, AI key, weight log.

## Architecture Highlights

- **PC-1 binary rule:** mọi component MUST dùng `templateUrl` + `styleUrl` — inline cấm tuyệt đối.
- **Standalone-only:** KHÔNG có NgModule.
- **Dual-DB pattern:** abstract `DatabaseService` → 2 impl (`WebDatabaseService` cho test, native cho Android). Compatibility layer + migration runner.
- **Repository pattern:** mỗi domain có `*.repository.ts` + `*.spec.ts` (4 repo: dish, dish-ingredient, ingredient, user-profile).
- **Signal stores:** 4 store (`dish`, `ingredient`, `network`, `profile`).
- **Schema version 6:** 18 tables (xem `data-models.md`).
- **Migration system:** `migration-runner.ts` + numbered migrations + `legacy-sqljs-migrator.ts` (legacy compatibility).
- **5 CI guards** (Husky pre-commit + CI):
  - `check:form-pattern` — floating-label markup canonical
  - `check:pc1` — PC-1 binary
  - `check:style-2025` — naming convention
  - `check:design-tokens` — không hardcode color/bg/font-size
  - `check:macro-naming` — BEM 2-level

## Development Overview

### Prerequisites

- Node.js 22 LTS
- Java 21 LTS (`export JAVA_HOME=$(/usr/libexec/java_home -v 21)` trên macOS)
- Android SDK API 36 (compileSdk 36, minSdk 24)

### Getting Started

```bash
npm install
ionic serve              # dev (web)
npm run check:guards     # 5 CI guards local
ng test                  # unit test
ionic build && npx cap sync android && npx cap run android   # Android
```

### Key Commands

- **Install:** `npm install`
- **Dev:** `ionic serve`
- **Build web:** `ionic build` hoặc `ng build`
- **Build APK:** `cd android && ./gradlew assembleRelease`
- **Test:** `ng test`
- **Lint:** `ng lint`, `npm run format:check`
- **5 CI guards:** `npm run check:guards`
- **Commit pattern bắt buộc:** `git -c commit.gpgsign=false commit -F <msg-file>`

## Repository Sizing

- **Total LOC** (src TS/HTML/SCSS): ~21,000
- **Components/Pages:** 12
- **Spec files:** 53
- **DB schema files:** 19 (database/migration/native/web/legacy/compat)
- **AI service files:** 9 (gemini-client, dish-autofill, nutrition-ai, prompts)
- **Shared components:** 10
- **Feature areas:** 6

## Out of Scope (intentional)

- ❌ Authentication / multi-user / multi-profile
- ❌ Cloud sync / backup
- ❌ iOS build (Android-only)
- ❌ Real-time / WebSocket
- ❌ External API ngoài Gemini
- ❌ ADR / phase-spec / phase-QA mới (đã cleanup commit `646aacc`)

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Prerequisites
- **Node.js:** 22 LTS (`node -v`)
- **Java (JDK):** 21 LTS — required for Android build (`java -version`)
  - macOS: `export JAVA_HOME=$(/usr/libexec/java_home -v 21)`
  - AGP 8.13 + Gradle 8.14 support Java 17–24. Java 25+ not supported.
- **Android SDK:** API 36 (compileSdk 36, minSdk 24)

## Build and Test Commands
- **Install dependencies:** `npm install`
- **Development server:** `ionic serve` (Angular dev server with Ionic)
- **Build web:** `ionic build` or `ng build`
- **Build production:** `ionic build --prod`
- **Linting:** `ng lint`
- **Format check:** `npm run format:check`
- **Run all tests:** `ng test`
- **Android development:**
  - `npx cap add android` (first time)
  - `npx cap sync android` (sync web → Android)
  - `npx cap run android` (run on device/emulator)
  - `cd android && ./gradlew assembleRelease` (build APK)

## Code Architecture
### Overview
HealthMate AI is an offline-first Angular 20 + Ionic 8 mobile app built with Capacitor (Android only). It uses a local SQLite database with dual implementations (sql.js WASM for web/tests and @capacitor-community/sqlite for Android native).

### Core Structure
```
src/app/
├── app.component.ts          # Root: IonApp + IonRouterOutlet
├── app.routes.ts              # Top-level routes (onboarding, settings, tabs)
├── core/                      # Singleton services, stores, guards
│   ├── services/database/     # DatabaseService abstract + WebDatabaseService + schema
│   ├── repositories/          # Data access layer
│   ├── stores/                # Angular Signals state management
│   └── models/                # TypeScript interfaces
├── shared/                    # Reusable components, pipes, directives
├── features/                  # Feature pages (lazy loaded)
│   ├── dashboard/             # Tab 1: Tổng quan
│   ├── calendar/              # Tab 2: Lịch ăn
│   ├── management/            # Tab 3: Quản lý nguyên liệu & món
│   ├── fitness/               # Tab 4: Tập luyện
│   ├── settings/              # Push page (not a tab)
│   └── onboarding/            # First-run wizard
└── tabs/                      # Tab bar wrapper (4 tabs)
```

### Coding Guidelines
- **Language:** TypeScript in strict mode. No `any` allowed.
- **Components:** Standalone Angular components (no NgModule). Inline templates preferred for small pages.
- **Styling:** Ionic CSS custom properties via `src/theme/variables.scss`. Dark mode via `@media (prefers-color-scheme: dark)`.
- **State Management:** Angular Signals — `signal()`, `computed()`, `effect()`.
- **Routing:** Lazy-loaded feature routes via `loadChildren()` / `loadComponent()`.
- **Database:** All data goes through Repository → DatabaseService abstraction.
- **Icons:** Use `addIcons()` from ionicons in component constructor + `IonIcon` in template.
- **Imports:** Ionic standalone components imported individually (e.g., `IonButton`, `IonContent`).

### Key Conventions
- Vietnamese labels in UI (Tổng quan, Lịch ăn, Quản lý, Tập luyện, Cài đặt)
- UUID v4 for all primary keys
- snake_case for DB columns, camelCase for TypeScript
- ISO 8601 strings for timestamps in SQLite

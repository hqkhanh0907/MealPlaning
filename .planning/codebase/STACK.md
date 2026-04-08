# Technology Stack

**Analysis Date:** 2025-07-17

## Languages

**Primary:**

- TypeScript ~5.8.2 — All application code (`src/`), config files, tests
- TSX — React components (`src/components/`, `src/features/`)

**Secondary:**

- SQL — Database schema definitions and queries (`src/services/schema.ts`, inline in stores)
- CSS — Tailwind v4 utility styles (`src/index.css`, `src/styles/`)
- JSON — i18n translations (`src/locales/vi.json`), config files

## Runtime

**Environment:**

- Browser (web) — Vite dev server on port 3000
- Android (native) — Capacitor 8.x wrapping the web app in a WebView
- WASM — sql.js runs SQLite in the browser via WebAssembly (`public/wasm/sql-wasm.wasm`)

**Package Manager:**

- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**

- React 19.x — UI framework (`src/components/`, `src/features/`)
- Vite 6.2+ — Build tool and dev server (`vite.config.ts`)
- Capacitor 8.1+ — Native mobile bridge (`capacitor.config.ts`, `@capacitor/core`)
- Tailwind CSS 4.1+ — Utility-first CSS with Vite plugin (`@tailwindcss/vite`)

**State Management:**

- Zustand 5.x — Global stores with SQLite persistence (`src/store/`)
  - Uses `create()` from `zustand` (no Redux-style middleware)
  - Some stores use `zustand/middleware` `persist` for localStorage fallback (`src/store/fitnessStore.ts`)
  - Custom DB write queue for async persistence (`src/store/helpers/dbWriteQueue.ts`)

**Form Handling:**

- react-hook-form 7.72+ — Form state management
- @hookform/resolvers 5.2+ — Validation resolver integration
- Zod 4.3+ — Schema validation for forms (`src/schemas/`)

**Animation:**

- Motion (Framer Motion) 12.x — UI animations (`motion`)
- tw-animate-css 1.4+ — Tailwind animation utilities

**i18n:**

- i18next 25.x + react-i18next 16.x — Internationalization
  - Vietnamese only (hardcoded `lng: 'vi'`)
  - Single translation file: `src/locales/vi.json`
  - Config: `src/i18n.ts`

**Testing:**

- Vitest 4.x — Unit/integration test runner (`vitest.config.ts`)
- @testing-library/react 16.x — React component testing
- @testing-library/jest-dom 6.x — DOM assertion matchers
- @testing-library/user-event 14.x — User interaction simulation
- jsdom 28.x — Browser environment for tests
- @vitest/coverage-v8 4.x — Code coverage via V8

**E2E Testing:**

- WebdriverIO 9.24+ — E2E test runner (`e2e/wdio.conf.ts`)
- Appium 3.2+ — Mobile automation (`appium-uiautomator2-driver`)
- Mocha — E2E test framework (`@wdio/mocha-framework`)

**Build/Dev:**

- @vitejs/plugin-react 5.x — React Fast Refresh for Vite
- vite-plugin-compression 0.5+ — Gzip/Brotli compression (conditional: `COMPRESS=true`)
- rollup-plugin-visualizer 7.x — Bundle analysis (`npm run analyze`)
- ESBuild — Minification, console/debugger stripping in production

**Linting/Formatting:**

- ESLint 10.x — Linting with flat config (`eslint.config.js`)
  - typescript-eslint 8.x — TypeScript rules
  - eslint-plugin-react-hooks 7.x — Hook rules
  - eslint-plugin-react-refresh 0.5+ — Fast Refresh compliance
  - eslint-plugin-simple-import-sort 12.x — Import ordering
  - eslint-config-prettier 10.x — Disables formatting rules
- Prettier 3.8+ — Code formatting
  - prettier-plugin-tailwindcss 0.7+ — Tailwind class sorting
- Husky 9.x — Git hooks
- lint-staged 16.x — Pre-commit linting (`*.{ts,tsx}` → eslint + prettier)

**Code Quality:**

- SonarQube Community (local via Docker) — Static analysis
  - Config: `sonar-project.properties`
  - Docker: `docker-compose.yml` (SonarQube + PostgreSQL)

## Key Dependencies

**Critical (Core App Functionality):**

- `@google/genai` 1.42+ — Google Gemini AI SDK for meal plan suggestions, food image analysis, ingredient lookup (`src/services/geminiService.ts`)
- `@capacitor-community/sqlite` 8.1+ — Native SQLite on Android (`src/services/databaseService.ts`)
- `sql.js` 1.14+ — SQLite via WASM for web browser (`src/services/databaseService.ts`)
- `zustand` 5.x — All app state management (`src/store/`)

**UI Components:**

- `shadcn` 4.1+ — Component library (base-nova style, `components.json`)
  - Uses `@base-ui/react` 1.3+ as underlying primitives
- `lucide-react` 0.546+ — Icon library
- `class-variance-authority` 0.7+ — Variant-based component styling
- `clsx` 2.1+ — Conditional class names
- `tailwind-merge` 3.5+ — Tailwind class deduplication

**Capacitor Plugins:**

- `@capacitor/app` 8.x — App lifecycle, hardware back button (`src/services/backNavigationService.ts`)
- `@capacitor/filesystem` 8.1+ — File read/write for backup export (`src/components/DataBackup.tsx`)
- `@capacitor/haptics` 8.x — Vibration feedback (`src/utils/haptics.ts`)
- `@capacitor/share` 8.x — Native share sheet (`src/components/DataBackup.tsx`)
- `@capacitor/status-bar` 8.x — Status bar styling (`src/main.tsx`)
- `@capgo/capacitor-social-login` 8.3+ — Google Sign-In on native (`src/contexts/AuthContext.tsx`)

**Fonts:**

- `@fontsource-variable/geist` 5.x — Geist variable font

## Configuration

**Environment Variables:**

- `VITE_GEMINI_API_KEY` — Google Gemini API key (required for AI features)
- `.env` file present — contains runtime secrets
- `.env.example` present — documents required vars

**Build-time Environment Flags:**

- `COMPRESS=true` — Enables gzip + brotli compression (`vite.config.ts`)
- `ANALYZE=true` — Generates bundle visualizer (`stats.html`)
- `DISABLE_HMR=true` — Disables Hot Module Replacement
- `import.meta.env.DEV` — Controls debug logging (`src/utils/logger.ts`)

**TypeScript:**

- `tsconfig.json` — Strict mode enabled
  - Target: ES2022
  - Module: ESNext with bundler resolution
  - Path alias: `@/*` → `./src/*`
  - Strict settings: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
  - Global types: `vitest/globals`
  - Decorators enabled: `experimentalDecorators: true`

**Vite Build:**

- `vite.config.ts` — Main build configuration
  - Target: `esnext`
  - Manual chunk splitting: `vendor-react`, `vendor-ui`, `vendor-i18n`, `vendor-genai`, `onboarding-advanced`
  - Production: drops `console.*` and `debugger` statements
  - Dev server CORS headers for SharedArrayBuffer (sql.js requirement):
    - `Cross-Origin-Opener-Policy: same-origin`
    - `Cross-Origin-Embedder-Policy: require-corp`
  - Worker format: ES modules
  - Dependency pre-bundling: react, react-dom, i18next, zustand, lucide-react, motion

**Capacitor:**

- `capacitor.config.ts` — Mobile configuration
  - App ID: `com.mealplaner.app`
  - App Name: "Smart Meal Planner"
  - Web directory: `dist`
  - Android scheme: `https`
  - Google Social Login enabled
  - SQLite: no encryption, iOS database in `Library/CapacitorDatabase`

**Shadcn UI:**

- `components.json` — Component library config
  - Style: `base-nova`
  - No RSC (React Server Components)
  - Icon library: lucide
  - CSS variables enabled
  - Aliases configured for `@/components`, `@/lib`, `@/hooks`, `@/components/ui`

## Platform Requirements

**Development:**

- Node.js (version not pinned — no `.nvmrc`)
- npm (lockfile v3)
- Android SDK (for mobile development)
- Java JDK (for Android/Gradle builds)

**Production:**

- Web: Any modern browser supporting ES2022 + WASM
- Android: Native APK via Capacitor (pre-built APKs: `MealPlaning.apk`, dated variants)
- iOS: Not configured (no `@capacitor/ios` dependency)

**Database:**

- Web: sql.js (in-memory SQLite via WASM, `public/wasm/sql-wasm.wasm`)
- Android: @capacitor-community/sqlite (native SQLite, database name: `mealplaner`)
- Schema version: 6 (with migration chain v1→v6, `src/services/schema.ts`)

---

_Stack analysis: 2025-07-17_

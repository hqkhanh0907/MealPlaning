# External Integrations

**Analysis Date:** 2025-07-17

## APIs & External Services

### Google Gemini AI (Primary AI Backend)

- **Purpose:** AI-powered meal planning suggestions, food image analysis, ingredient nutrition lookup
- **SDK/Client:** `@google/genai` 1.42+ (official Google Gen AI SDK)
- **Auth:** API key via `VITE_GEMINI_API_KEY` environment variable
- **Model:** `gemini-2.5-flash`
- **Implementation:** `src/services/geminiService.ts`
- **Features provided:**
  1. `suggestMealPlan()` — Generates daily meal plans (breakfast/lunch/dinner) from available dish library, targeting calorie and protein goals. Uses structured JSON output with response schema.
  2. `analyzeDishImage()` — Multimodal vision: analyzes food photos to extract dish name, ingredients, and per-ingredient nutrition data. Detects non-food images.
  3. `suggestIngredientInfo()` — Looks up nutritional data for individual ingredients using Google Search grounding.
  4. `suggestDishIngredients()` — Suggests ingredient composition for a dish by name.
- **Resilience patterns:**
  - 30-second timeout per API call (`AI_CALL_TIMEOUT_MS`)
  - Retry with exponential backoff (max 2 retries, 1s/2s/4s delays)
  - AbortSignal support for user cancellation
  - Input sanitization to prevent prompt injection (`sanitizeForPrompt()`)
  - In-memory nutrition cache with 1-hour TTL (per ingredient+unit key)
  - Smart dish sampling: caps prompt at ~60 dishes even with large libraries
  - Telemetry logging for slow (>10s) or failed calls
- **Prompts:** All prompts are in Vietnamese (tiếng Việt)
- **Singleton pattern:** AI client is lazy-initialized and reused (`getAI()`)

### Google Drive API (Cloud Backup/Sync)

- **Purpose:** Cloud backup and sync of all user data via Google Drive appDataFolder
- **SDK/Client:** Direct `fetch()` calls to Google Drive REST API v3 (no SDK)
- **Auth:** OAuth2 access token obtained via Google Sign-In
- **Implementation:** `src/services/googleDriveService.ts`
- **API Endpoints used:**
  - `https://www.googleapis.com/drive/v3/files` — List/delete backups
  - `https://www.googleapis.com/upload/drive/v3/files` — Upload/update backups
- **Backup format:** Single JSON file named `meal-planner-backup.json` in `appDataFolder` scope
- **Operations:**
  - `listBackups()` — Lists existing backups sorted by modification time
  - `downloadBackup()` / `downloadLatestBackup()` — Download backup data
  - `uploadBackup()` — Creates or updates (PATCH) the backup file (multipart upload for new, media upload for update)
  - `deleteBackup()` — Deletes a specific backup file
- **Auto-sync hook:** `src/hooks/useAutoSync.ts`
  - Debounced upload (3-second delay after data changes)
  - Download-on-launch: checks remote vs local timestamp, imports if remote is newer
  - Tracks sync status: `idle` | `uploading` | `downloading` | `error`
  - Last sync timestamp persisted in SQLite `app_settings` table
- **Manual sync UI:** `src/components/GoogleDriveSync.tsx`
  - Conflict resolution modal when remote and local data diverge

### Google OAuth2 / Identity Services

- **Purpose:** User authentication for Google Drive access
- **Implementation:** `src/contexts/AuthContext.tsx`
- **OAuth2 Scope:** `email profile https://www.googleapis.com/auth/drive.appdata`
- **Client ID:** `871833618020-u4bum8ct6lo3a6pcjhhg62e8auiigs68.apps.googleusercontent.com`
- **Two authentication paths:**
  1. **Web:** Google Identity Services (GIS) — loads `https://accounts.google.com/gsi/client` script dynamically, uses `initTokenClient()` for OAuth2 implicit flow
  2. **Native (Android):** `@capgo/capacitor-social-login` plugin — uses `SocialLogin.login()` with Google provider in `online` mode
- **User info endpoint:** `https://www.googleapis.com/oauth2/v3/userinfo`
- **Auth state persistence:** Stored in SQLite `app_settings` table (key: `auth_state`), loaded on app init
- **Auth context definition:** `src/contexts/authContextDef.ts`
- **Auth hook:** `src/hooks/useAuth.ts`

## Data Storage

### SQLite Database (Primary Storage)

- **Type:** SQLite (embedded, local-first)
- **Two implementations via strategy pattern:**
  1. **Web:** sql.js (WASM) — in-memory SQLite, WASM binary at `public/wasm/sql-wasm.wasm`
  2. **Android:** `@capacitor-community/sqlite` — native SQLite, database name: `mealplaner`
- **Factory:** `createDatabaseService()` in `src/services/databaseService.ts` — auto-selects based on `Capacitor.isNativePlatform()`
- **Interface:** `DatabaseService` — `initialize()`, `execute()`, `query()`, `queryOne()`, `transaction()`, `exportToJSON()`, `importFromJSON()`, `close()`
- **Schema:** `src/services/schema.ts`
  - Version: 6 (tracked via `PRAGMA user_version`)
  - 22 tables including: `ingredients`, `dishes`, `dish_ingredients`, `day_plans`, `meal_templates`, `user_profile`, `goals`, `training_profile`, `training_plans`, `training_plan_days`, `exercises`, `workouts`, `workout_sets`, `weight_log`, `daily_log`, `adjustments`, `fitness_profiles`, `fitness_preferences`, `workout_drafts`, `app_settings`, `grocery_checked`, `plan_templates`
  - Foreign keys enabled (`PRAGMA foreign_keys = ON`)
  - Performance indexes on date columns, workout_sets, goals
- **Migrations:** `src/services/schema.ts` → `runSchemaMigrations()` (v1→v6 chain)
- **Data migration from localStorage:** `src/services/migrationService.ts`
  - One-time migration from Zustand localStorage to SQLite
  - Separate fitness data migration path
- **Persistence pattern:** Zustand stores write to SQLite via async write queue (`src/store/helpers/dbWriteQueue.ts`)
  - Fire-and-forget writes with retry on `SQLITE_BUSY` / `database is locked` errors (max 2 retries, 50ms delay)
- **Export/Import:** V2 format (JSON envelope with `_version: '2.0'`, `_format: 'sqlite-json'`)
  - FK-safe import/export order defined in `src/services/syncV2Utils.ts`
  - Backward-compatible with v1.x localStorage format
- **Context provider:** `src/contexts/DatabaseContext.tsx` — initializes DB, runs migrations, loads all stores before rendering

### localStorage (Legacy / Fallback)

- **Purpose:** Legacy data source (migrated to SQLite on first load)
- **Keys:** `mp-ingredients`, `mp-dishes`, `mp-day-plans`, `mp-user-profile`, `meal-templates`, `fitness-storage`
- **Migration flags:** `mp-migrated-to-sqlite`, `fitness_migrated_to_sqlite`
- **Current usage:** Only for migration detection; Zustand `persist` middleware still used by fitness store as fallback

### File System (Native Only)

- **Plugin:** `@capacitor/filesystem`
- **Purpose:** Local backup export/import on Android
- **Implementation:** `src/components/DataBackup.tsx`
  - Exports JSON backup to device filesystem
  - Uses `@capacitor/share` for sharing exported files

**Caching:**

- In-memory ingredient nutrition cache in `src/services/geminiService.ts` (1-hour TTL, Map-based)
- No external caching service (Redis, etc.)

## Authentication & Identity

**Auth Provider:** Google OAuth2 (custom implementation, no Firebase Auth)

- **Implementation:** `src/contexts/AuthContext.tsx`
- **State management:** React Context (`AuthContext`) with `AuthState` type
- **Dual-platform auth:**
  - Web: Google Identity Services (GIS) OAuth2 implicit flow
  - Android: `@capgo/capacitor-social-login` with Google provider
- **Session persistence:** Auth state serialized to SQLite `app_settings` table
- **No server-side auth:** All auth is client-side; access tokens are used directly against Google APIs
- **User type:** `AuthUser` (`id`, `email`, `displayName`, `photoUrl`) defined in `src/types.ts`

## Monitoring & Observability

**Error Tracking:**

- No external error tracking service (no Sentry, Bugsnag, etc.)
- Custom structured logger: `src/utils/logger.ts`
  - Levels: `debug`, `info`, `warn`, `error`
  - Context format: `{ component, action, traceId? }`
  - Debug logs only in development (`import.meta.env.DEV`)
  - Production builds strip all `console.*` via esbuild
- Gemini service has built-in telemetry logging for slow/failed AI calls

**Static Analysis:**

- SonarQube Community (self-hosted via Docker)
  - Config: `sonar-project.properties`
  - Docker Compose: `docker-compose.yml` (SonarQube + PostgreSQL)
  - Coverage reports: lcov format from Vitest
  - Auth: `SONAR_TOKEN` env var

**Logs:**

- Console-based only (browser DevTools / Android logcat)
- Structured format: `[ComponentName] actionName [trace:id]`
- No remote log aggregation

## CI/CD & Deployment

**Hosting:**

- No cloud hosting detected — appears to be local/manual builds
- Pre-built APKs committed to repo root: `MealPlaning.apk`, `MealPlaning_27-02-2026.apk`, `MealPlaning_29-03-2026.apk`

**CI Pipeline:**

- No CI configuration detected (no `.github/workflows/`, no `.gitlab-ci.yml`, no `Jenkinsfile`)

**Build Scripts:**

- `scripts/build-apk.sh` — APK build automation
- `scripts/upload-apk-drive.sh` — Upload APK to Google Drive
- `scripts/sonar-setup.sh` — SonarQube token setup
- `scripts/check-banned-colors.sh` — Design system color compliance check
- `scripts/download-opus-models.sh` — Model download utility

**Git Hooks (Husky):**

- Pre-commit: lint-staged runs ESLint + Prettier on staged `*.ts`, `*.tsx` files

## Environment Configuration

**Required env vars:**

- `VITE_GEMINI_API_KEY` — Google Gemini API key (required for AI features)
- `SONAR_TOKEN` — SonarQube authentication (optional, for code quality scans)

**Secrets location:**

- `.env` file at project root (gitignored — contains `VITE_GEMINI_API_KEY`)
- `.env.example` documents required variables
- Google OAuth2 client ID is hardcoded in `src/contexts/AuthContext.tsx` (not secret — public client ID)

## Webhooks & Callbacks

**Incoming:**

- None — no backend server, fully client-side application

**Outgoing:**

- None — no webhook integrations

## Integration Architecture Summary

```
┌─────────────────────────────────────────┐
│              Smart Meal Planner         │
│           (Client-side only)            │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────┐  ┌──────────┐  ┌────────┐ │
│  │ Gemini  │  │ Google   │  │ Google │ │
│  │ AI API  │  │ Drive    │  │ OAuth2 │ │
│  │         │  │ REST API │  │ (GIS)  │ │
│  └────┬────┘  └────┬─────┘  └───┬────┘ │
│       │            │            │       │
│  geminiService  googleDrive  AuthContext │
│       │         Service        │        │
│       │            │            │       │
│  ┌────┴────────────┴────────────┴────┐  │
│  │         Zustand Stores            │  │
│  │    (ingredientStore, dishStore,   │  │
│  │     dayPlanStore, fitnessStore)   │  │
│  └────────────────┬──────────────────┘  │
│                   │                     │
│  ┌────────────────┴──────────────────┐  │
│  │     SQLite (DatabaseService)      │  │
│  │  Web: sql.js | Android: native    │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

_Integration audit: 2025-07-17_

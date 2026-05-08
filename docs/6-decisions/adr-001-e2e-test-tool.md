# ADR-001: E2E test tool for HealthMate AI (Capacitor + Ionic + Angular)

**Status:** Accepted (2026-05-09)
**Decision date:** 2026-05-09
**Deciders:** Khanh Huynh (solo dev)
**Supersedes:** B6 deferred item (`docs/5-development/deferred-items.md`)

---

## Context

Project stack:
- **Capacitor 8** wrapping an **Angular 21 + Ionic 8** standalone-signals web app, shipped as Android APK (target SDK 36, min SDK 24).
- Storage: dual SQLite layer — `sql.js` (web/dev) + `@capacitor-community/sqlite` (Android).
- AI: Gemini API via Capacitor HTTP plugin.
- Test pyramid today:
  - **418 unit/component tests** (Karma + Jasmine) — fast, cover logic + Angular template render.
  - **9 architecture guards** (Node scripts) — convention/SSOT/style enforcement.
  - **0 end-to-end tests** — manual emulator QA per story (skill `mealplaning-emulator-fast-qa`).

Two regressions slipped past unit tests in the last 60 days:
1. `AndroidManifest.xml` POST_NOTIFICATIONS line wiped on fresh `npx cap sync` (caught only when re-installing APK on emulator) — Story 2.2 era.
2. SQLite schema migration drift (Story 2.6 collapsed 6 migrations into 1) — required full DB wipe + reinstall to verify, no automated coverage.

Phase 3 (F-03 Calendar + F-04 Tracking) introduces a second migration (`planned_dish` table + cascade delete A1) → migration regression risk increases. Manual QA does not scale linearly past ~5-8 user flows.

## Decision drivers (set BEFORE spike)

| # | Criterion | Weight | Pass condition | Result |
|---|---|---|---|---|
| 1 | CI setup under 2 hours | High | GitHub Actions on `macos-latest` or `ubuntu-latest` (KVM) | ✅ Local setup ~30 min; CI wiring deferred to next story |
| 2 | Runs against existing emulator-5554 (no extra Mac runner) | High | `adb devices` visible from test runner | ✅ |
| 3 | Can read SQLite state post-test (verify DB persist) | Critical | Either via `adb shell` SQL dump or test API | ✅ via `adb shell run-as` (proven in Story 2.6 §G2) |
| 4 | Survives Capacitor 8 + Ionic 8 + Angular 21 standalone-signals | Critical | Smoke test "boot + render WebView" green | ✅ smoke-boot.e2e.ts passes in 10s |
| 5 | Spike smoke test working in ≤ 8h hard cap | Procedural | Else escalate | ✅ ~45 min including infra debug |

## Options under spike

### Option 1 — Detox (Wix) — REJECTED (not spiked)

- **Reason:** No Capacitor recipe in Detox docs. Tightly coupled to React-Native bundler conventions that don't apply to Capacitor. Highest risk of blowing the 8h time-box. Per spike protocol step 4, skipped because Option 3 succeeded.

### Option 2 — Playwright (Android Chrome experimental) — REJECTED (analytical)

- **Reason:** Drives the **system Chrome browser**, not the WebView inside the installed APK → does NOT test Capacitor plugins (SQLite, notifications, AndroidManifest invariants). Same blind spot as Karma jsdom — would not have caught either of the two motivating regressions.

### Option 3 — Appium (UiAutomator2 driver) + WebdriverIO — **CHOSEN**

- Native Android UI automation, runs against the installed APK on emulator-5554.
- **NATIVE_APP context only** — we drive `android.webkit.WebView` + `UiSelector().textContains(...)` rather than the chromedriver context, because emulator WebView 147 has documented SIGTRAP under CDP (skill `mealplaning-emulator-fast-qa` §3). This is sufficient for verifying:
  - Capacitor boot (WebView renders)
  - On-screen Vietnamese copy reachable (real user-visible text)
  - SQLite state via `adb shell run-as com.healthmate.ai cat databases/...` post-test
  - Native dialogs (POST_NOTIFICATIONS prompt) via the same UiSelector tree
- Language: TypeScript via `webdriverio` v9 — matches project's strict-TS-no-`any` convention.
- chromedriver pinning **not required** (NATIVE_APP context, no CDP).

## Decision

**Adopt Appium 2.x + UiAutomator2 driver + WebdriverIO 9.x in NATIVE_APP context.**

### Rationale (in priority order)

1. **Catches both motivating regressions.** AndroidManifest invariant (POST_NOTIFICATIONS prompt reachability via native dialog tree) and SQLite migration drift (post-onboarding `adb run-as` SQL dump assertions) are both expressible in this stack. Playwright cannot do either.
2. **Zero risk of WebView 147 SIGTRAP.** NATIVE_APP context never opens a CDP socket → not affected by the documented Chromium 147 quirk that already broke the QA fast-path skill once.
3. **TypeScript-native, fits existing toolchain.** No new language; webdriverio config is one TS file.
4. **CI-ready.** Appium server + UiAutomator2 work on `macos-latest` GitHub Actions runners (KVM emulator). CI wiring is a follow-up story, not a blocker.
5. **Spike completed in 45 min, not 8h.** Lowest-risk option that survived contact with reality.

## Trade-offs accepted

- **Slower than Playwright** (~10s per test vs ~2s) — acceptable for E2E layer (5-10 critical flows, not unit-test-grade volume).
- **chromedriver context unavailable** for now (WebView 147 SIGTRAP). Means we cannot inspect Angular component state directly — must drive via on-screen text + native UI tree. Mitigation: add `data-test-id` attributes to critical Angular elements as needed.
- **First UiAutomator2 session is ~30s slow** (on-device server install). Subsequent sessions are <5s.
- **WDIO v9 dropped `autoCompileOpts`** → use `tsConfigPath` instead (fixed in `e2e/wdio.conf.ts`).

## Acceptance evidence (smoke)

- ✅ `e2e/wdio.conf.ts` — WebdriverIO v9 testrunner config, NATIVE_APP context, 240s connection retry timeout (first-run server install).
- ✅ `e2e/specs/smoke-boot.e2e.ts` — boots app, asserts WebView renders, saves screenshot + page source.
- ✅ `npm run e2e:smoke` — passes locally in ~30s (10s test + ~20s session creation overhead). 1 passing.
- ✅ Screenshot saved to `e2e/artifacts/smoke-boot.png` (138 KB, real Settings page render confirmed via vision_analyze).
- ✅ Devices: appium 2.19.0, uiautomator2-driver 4.2.9, webdriverio 9.27.1, ts-node 10.9.2.

## Operating notes

- **Run order:**
  1. Boot emulator-5554 + install APK (per `references/apk-delivery-and-scss-budget.md`).
  2. `npm run e2e:appium` in shell A (keeps Appium server running on `:4723`).
  3. `npm run e2e:smoke` in shell B (runs WDIO).
- **Reset between flows:** new specs that need a clean state should call `adb shell pm clear com.healthmate.ai` in `before()`, then re-launch via `appium:appWaitActivity`. Smoke uses `appium:noReset: true` for speed.
- **CI wiring** (deferred to a dedicated story): GitHub Actions `macos-latest` runner with `reactivecircus/android-emulator-runner` action. NOT a Phase 3 prerequisite — local-run is enough to catch B-class regressions during dev.

## Follow-ups

- [E2E-001] Onboarding 6-step → DB persist → reload (Story B''.2). First real flow test.
- [E2E-002] CI wiring to GitHub Actions (lower priority — local catches the regressions we care about).
- [E2E-003] Add `data-test-id` Angular attributes to critical elements as flow tests grow (target: only when on-screen text is ambiguous).
- Update skill `mealplaning-emulator-fast-qa` cross-reference: NATIVE_APP context is reusable for QA-style probes too (no CDP required).

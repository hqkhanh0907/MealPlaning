# Visual QA Rulebook — HealthMate AI

**Version:** 1.0
**Created:** 2026-05-15
**Status:** Active
**Owner:** Engineering / QA
**Source of truth (design):** [`docs/3-design/design-system.md`](./3-design/design-system.md) v2.1 (Sage Wellness, light-only)
**Source of truth (UX):** [`docs/3-design/ux-specs/f-03-calendar-plan.md`](./3-design/ux-specs/f-03-calendar-plan.md), [`docs/3-design/ux-specs/f-04-nutrition-tracking.md`](./3-design/ux-specs/f-04-nutrition-tracking.md)
**Code conventions:** [`docs/4-architecture/coding-conventions.md`](./4-architecture/coding-conventions.md), `CLAUDE.md`

This rulebook is the **acceptance gate** before any APK is considered ship-ready. It is intentionally *check-list driven* so a reviewer (human or LLM) can walk through it linearly on real screenshots from `emulator-5554` (or a real device of comparable spec) and either ✅ pass or ❌ fail each item.

If your change does not touch UI, you may scope down to §A (boot + smoke). Any UI/UX or design-token change MUST run §A → §G end-to-end.

---

## §0. Pre-flight (workstation + emulator)

| # | Check | How |
|---|---|---|
| 0.1 | Emulator booted & visible to adb | `adb devices` → at least one `device` |
| 0.2 | Emulator spec ≥ Android 13 (API 33), density ≥ 360dpi, screen ≥ 1080×2200 | `adb shell getprop ro.build.version.release` + `adb shell wm size` + `adb shell wm density` |
| 0.3 | Network reachable (for Gemini AI smoke) | `adb shell ping -c1 generativelanguage.googleapis.com` (may need IPv4) |
| 0.4 | `JAVA_HOME` Java 21 LTS | `java -version` → `21` |
| 0.5 | `npm install` clean (no peer-dep errors) | `npm install` exit 0 |

**Baseline emulator used for the canonical Visual QA screenshots:**
- AVD: `Medium_Phone_API_36.1` / `Fitness_Test` / `UIX_Review`
- Screen: 1080×2400, density 420 (override 480), Android 16
- Light theme only (app is light-only — Story 2.6)

---

## §A. Boot, install, navigation (BLOCKER tier)

These are **hard ship blockers** — any ❌ in this section means do not ship.

| # | Check | Method | Pass criterion |
|---|---|---|---|
| A.1 | Web bundle builds | `npm run build` | exit 0, no stderr ERROR |
| A.2 | Cap sync succeeds | `npx cap sync android` | exit 0 |
| A.3 | Debug APK builds | `cd android && ./gradlew assembleDebug` | `app-debug.apk` produced |
| A.4 | APK installs on emulator | `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` | `Success` |
| A.5 | App cold-starts within 5s, no white screen, no native crash | `adb shell am start -n com.healthmate.ai/.MainActivity` + watch logcat | Main activity launches; `adb shell dumpsys activity activities | grep com.healthmate.ai` shows `RESUMED` |
| A.6 | No `FATAL EXCEPTION` from `com.healthmate.ai` for 30s after launch | `adb logcat -d -t '30 seconds ago' | grep -E "FATAL|AndroidRuntime.*com.healthmate.ai"` | empty (no fatals) |
| A.7 | Splash hides → Onboarding shows (first install) OR Dashboard shows (returning user) | screenshot 5s after launch | UI rendered, no infinite spinner |
| A.8 | Tab bar present with 4 tabs: Tổng quan / Lịch ăn / Quản lý / Tập luyện | screenshot of bottom area | 4 tabs visible, icons + labels |
| A.9 | All 4 tabs navigate without crash | tap each tab, screenshot each | each tab renders content |
| A.10 | Settings page reachable from Dashboard | tap settings icon | Settings hub renders |
| A.11 | Back button from Settings returns to Dashboard | hardware back / IonBack | Dashboard restored |

**Failure mode definitions (any of these = ❌ blocker):**
- White screen for >5s after splash hides
- Foreground crash (`FATAL EXCEPTION` in `com.healthmate.ai`)
- Tab tap navigates to wrong route or no-op
- Hardware back stranded user (no exit, no parent route)

---

## §B. Layout integrity

| # | Check | Pass criterion |
|---|---|---|
| B.1 | No horizontal scroll on any main screen at 1080×2400 | Visual scan of every screenshot |
| B.2 | No text clipped at end of line (`...` overflow only inside designed truncation, never mid-character) | Look for cut diacritics on Vietnamese labels |
| B.3 | No content hidden behind status bar | Top safe area respected (toolbar starts below status bar) |
| B.4 | No content hidden behind tab bar | Bottom safe area; last list item fully visible when scrolled to end |
| B.5 | No element overlap (button on top of input, icon on top of text) | Visual scan |
| B.6 | Modals fill screen as designed; bottom sheet `~85%` height for Logging Modal (F-04 §M1) | F-04 ux-spec compliance |
| B.7 | Form fields use canonical `.input-wrapper` floating-label pattern from `src/theme/form-field.scss` | DOM check in DevTools / source review |
| B.8 | Cards have 12px gap, 16px internal padding, 16px page padding L/R (design-system §4.2) | Screenshot ruler check |
| B.9 | Touch targets ≥ 44dp tall (buttons, tab buttons, chips, input rows) | Measure on screenshot (44dp ≈ 88px at 480dpi or 132px at xxhdpi 480 override) |

---

## §C. Typography & color tokens

| # | Check | Pass criterion |
|---|---|---|
| C.1 | Body text uses Inter; display headings use Fraunces | DOM `font-family` check |
| C.2 | Numbers (kcal, gram, weight, streak) use `font-variant-numeric: tabular-nums` | Check progress bars and dashboard rings — digits don't jitter on update |
| C.3 | Calories visually larger/bolder than macros (design-system §3.7) | Screenshot review |
| C.4 | No raw hex color in screenshot (i.e. design-token guard `npm run check:design-tokens` passes) | CI guard |
| C.5 | Palette is Sage Wellness — no Material blue, no pure black, no saturated red | Visual scan |
| C.6 | Text contrast — body text on `--bg-page` ≥ 4.5:1, large headings ≥ 3:1 (WCAG AA) | Sample with WebAIM contrast checker if questionable |
| C.7 | Macro labels English (`Protein` / `Carbs` / `Fat` / `Fiber`), no `P:`/`C:`/`F:` abbrevs, no `Chất xơ` | `npm run check:macro-naming` |
| C.8 | Light-only invariant respected (no inverted palette, no `prefers-color-scheme`, no theme toggle — Story 2.6) | `npm run check:guards` (light-only guard inside) + visual scan |

---

## §D. Interaction states

| # | Check | Pass criterion |
|---|---|---|
| D.1 | Empty state has illustration / text / CTA where applicable (Dashboard, Calendar empty day, Management empty list) | Visit each empty state |
| D.2 | Loading state shows skeleton or spinner — never empty content + blank screen | Pull-to-refresh or first load |
| D.3 | Error state shows toast or banner with actionable message — never silent failure | Force airplane mode → trigger AI lookup → assert "AI offline" banner appears |
| D.4 | Form validation errors render with `role="alert"` + red border on the bad field | Submit empty required form |
| D.5 | Disabled buttons visually distinct from enabled (opacity ≥ 50%) and don't fire on tap | Visual + tap test |
| D.6 | Focus ring visible on keyboard focus (focus-visible halo, design-system §6) | Tab navigation in onboarding |

---

## §E. Feature-specific UX (per F-03 / F-04 / Settings)

### Calendar (F-03)
| # | Check | Pass criterion |
|---|---|---|
| E.1 | Day View shows 4 meal slots: Sáng / Trưa / Tối / Phụ | Visual |
| E.2 | Week View shows 7 days Mon-Sun, color band per day per macro coverage | F-04 §S3 color universal: xanh ≥80% ≤110%, vàng 50-79%/110-120%, đỏ <50%/>120% |
| E.3 | Date picker modal opens via header tap; clamp ±365 days (CalendarStore guard) | Open picker, scroll far past today, save |
| E.4 | Empty day shows "Chưa có món hôm nay" + CTA "Thêm món" | First-time slot |
| E.5 | Long-press dish opens context menu (Edit / Move / Duplicate / Delete) | F-03 ux-spec |

### Nutrition Tracking (F-04)
| # | Check | Pass criterion |
|---|---|---|
| E.6 | Dashboard Nutrition Card shows 1 calorie ring + 4 macro pills (Protein/Carbs/Fat/Fiber) | F-04 §S1 |
| E.7 | Smart Key Metric ring highlights correct metric per goal (lose=protein, gain=calories, maintain=balanced) | F-04 §S1.3 |
| E.8 | Day Summary Card renders kcal totals vs target with color band | F-04 §S2 |
| E.9 | Trend View shows TrendBarChart 7-day / 30-day | F-04 §S4 |
| E.10 | Recipe-changed banner appears in Edit Modal when `diff_pct > 2%` | F-04 §M2 |
| E.11 | Logged dish keeps snapshot — recipe edit in F-02 does NOT update logged values (Hybrid policy DEC-02) | Manual scenario test |

### Settings
| # | Check | Pass criterion |
|---|---|---|
| E.12 | Settings hub lists: Thông số cơ thể / Mục tiêu / Mức vận động / Nhắc nhở / Giao diện removed (light-only) / Giới thiệu | Visual |
| E.13 | "Năng lượng" row (not "Calo NNN kcal") — D-UX-AUDIT P2-2 fix shipped | Visual |
| E.14 | Activity labels short form everywhere except onboarding (long form) | `ActivityLabelService` canonical |

### Onboarding (first install only)
| # | Check | Pass criterion |
|---|---|---|
| E.15 | 2-step wizard: Body params → Goals | Walk-through |
| E.16 | BMR/TDEE preview recalculates live as user types | Type in age/weight |
| E.17 | "Lưu" CTA only enabled when both steps valid | Try with empty fields |
| E.18 | After save, lands on Dashboard, NOT back to onboarding | Cold-launch after onboarding |

---

## §F. Accessibility (Android)

| # | Check | Pass criterion |
|---|---|---|
| F.1 | TalkBack reads tab labels in Vietnamese ("Tổng quan", "Lịch ăn", …) | Enable TalkBack, focus tab bar |
| F.2 | Decorative icons have `aria-hidden="true"` (already in template); semantic icons have `aria-label` | Code grep |
| F.3 | Calorie ring has `aria-label` of form "{metric} {value} trên {target}, {pct}%" | F-04 NFR-A11Y-01 |
| F.4 | Modals trap focus inside; Escape/back closes modal first, not page | F-04 NFR-A11Y-02 |
| F.5 | Heading levels sequential h1 → h2 → h3 (design-system §3.3) | Inspect DOM |
| F.6 | Color is never the sole signal — Protein/Fat have icon + label | design-system §2.3 |

---

## §G. Release packaging

| # | Check | Pass criterion |
|---|---|---|
| G.1 | versionName + versionCode synced (package.json ↔ build.gradle) | `npm run check:version-sync` |
| G.2 | Signed APK builds via `scripts/release/build-signed-apk.sh` | Manual on workstation with keystore env vars |
| G.3 | `apksigner verify` prints `Verifies` + fingerprint matches keystore | release-signing.md procedure |
| G.4 | App icon + splash render correctly on cold start (no white flash) | Cold-start screenshot |
| G.5 | Notifications small icon renders white silhouette on status bar (not square block) | Schedule test reminder, check status bar |
| G.6 | First-launch requires onboarding completion; cannot back out of onboarding | guard test |

---

## §H. Smoke flow for QA (the "happy path")

A single run-through that touches all four tabs, exercises a write path on each, and reaches all four states (empty, loading, error, success). This is what a reviewer should do for every signed-APK release.

1. **Cold start** → splash hides → either Onboarding (first install) or Dashboard (returning).
2. If Onboarding: enter age 30 / weight 65 / height 170 / activity moderate → goals 1900 kcal → save.
3. **Dashboard tab** → calorie ring renders, 4 macro pills present, streak card present. Pull-to-refresh works.
4. Tap "Hỏi AI" quick action → if offline-aware: banner shows offline; if online: AI sheet opens.
5. **Lịch ăn tab** → today's date highlighted → 4 meal slots visible → tap "+" on Sáng slot.
6. Logging modal opens → tab Search → search "phở" → tap result → save → modal closes → meal slot now shows the dish.
7. Mark dish as eaten → snapshot recorded → modal closes.
8. **Quản lý tab** → "Món ăn" segment first → list of seeded Vietnamese dishes (20 curated) → tap "Tạo món mới" → form opens → fill name + add 1 ingredient → save → returns to list with new dish.
9. Switch segment to "Nguyên liệu" → list of ingredients → tap "AI lookup" → enter "Thịt bò" → confirm → ingredient added.
10. **Tập luyện tab** → either empty state with "Bắt đầu" CTA OR active training plan card → tap an exercise → rest-timer modal works.
11. **Settings (push)** → tap each row → all sub-pages render → back returns to hub.
12. **Hardware back from Dashboard** → app backgrounds (not crashes).

Capture 1 screenshot per numbered step (12 total) into `docs/6-testing/screenshots/<date>-visual-qa/`. Mark each step ✅ / ❌ in the rulebook log.

---

## §I. Rulebook log template

Copy this into a session note when running QA:

```
# Visual QA Run — <date> — <commit-sha>
Emulator: <avd> Android <version> <res>@<density>
APK: <path> (versionName <name>, versionCode <code>, debug|release)

§A Boot: [11/11 pass | n fail]
  A.1 ✅  A.2 ✅  ... (list any ❌ with screenshot path)

§B Layout: [9/9 | …]
§C Type/color: [8/8 | …]
§D States: [6/6 | …]
§E Features: [18/18 | …]
§F a11y: [6/6 | …]
§G Release: [6/6 | …]

Smoke §H: [12/12]

Blocker count: 0 critical, 0 high
Decision: ✅ SHIP / ❌ HOLD (reason …)
```

---

## §J. Living rulebook — how to evolve

- New design rule lands in `design-system.md`? → add a check row to §C or §E.
- New a11y guideline from PRD? → §F.
- Found a real bug that screenshots missed? → write the screenshot-detectable signal of the bug into §B/D/E so future runs catch it.
- Don't remove rules — only deprecate (strike-through + reason).

---

## §J.1 UI Consistency Matrix

Use this matrix during emulator QA to compare canonical patterns across screens. A screen is not "clean" until every applicable column is either `Pass`, `N/A`, or has an explicit UX reason for divergence.

| Screen | App bar | Nav / back | Primary card | Form field | Primary CTA | Empty / error / offline | Notes |
|---|---|---|---|---|---|---|---|
| Onboarding | Serif `ion-title`, progress bar | Step-back stays in wizard, never silently exits mid-flow | Goal / activity radio cards | Floating-label numeric fields + inline error | Sticky bottom CTA pair | Validation visible before dead-end; hardware back mirrors toolbar back | First-install only |
| Dashboard | Large title + settings entry | Tabs preserve active emphasis | Nutrition hero + stat cards | N/A | Quick actions use canonical button row | AI offline banner + disabled AI CTA when offline | Calorie ring must dominate macro pills |
| Calendar | Title + date chip | Tabs + in-page date nav | Day summary + meal-slot cards | Search / logging modal fields | Add / log dish CTA | Empty day, loading, error, offline all distinct | Date copy must be VN-formatted |
| Management list | Title + segment/filter rail | Tabs + push to edit pages | Dish / ingredient list rows | Search + picker fields | FAB / add buttons use safe-area spacing | Empty list, AI offline, delete-block states | Segment + filter strip cannot collapse |
| Dish edit | Back toolbar | Back respects unsaved-changes guard | Nutrition hero | Floating-label Signal Forms | Save disabled by saving; invalid path surfaces inline errors | AI offline banner + disabled AI CTA | Schema is source of truth for bounds |
| Ingredient edit | Back toolbar | Back respects unsaved-changes guard | N/A | Floating-label Signal Forms | Save disabled by saving; invalid path surfaces inline errors | AI offline banner + disabled AI CTA | Must match dish-edit interaction model |
| Fitness | Title + optional plan eyebrow | Tabs + in-page start/free flow | Plan card + progress cards | Search field | Start / save-set CTA | Rest day, no-plan, offline-aware AI states | No EN copy leaks |
| Settings hub | Title + back | Push into sub-pages; back returns to hub | Settings list sections | N/A | N/A | Permission denial surfaces actionable copy | Version string must come from env/build source |
| Body edit | Back toolbar | Back to settings | Preview card | Numeric fields with HTML bounds | Sticky save CTA disabled when invalid | Inline invalid states visible | Mirrors onboarding body-input rules |
| Goals edit | Back toolbar | Back to settings | Goal cards + preview hint | Numeric fields with HTML bounds | Sticky save CTA disabled when invalid | Reset action clear + non-destructive | Auto/manual target behavior documented |
| Activity edit | Back toolbar | Back to settings | Radio list + preview card | N/A | Sticky save CTA disabled when unchanged | No-op save should not feel tappable | Dirty-state must be explicit |

Verification note: runtime proof for this matrix must come from emulator screenshots, `uiautomator dump`, page-state inference, or other non-browser primitives. Source review alone is insufficient for final acceptance.

---

## §K. Recurring bug signatures (caught here, now codified)

These are concrete bug patterns that escaped CI guards + unit tests and were only caught on emulator. Every future visual-QA run MUST grep for them.

| ID | Signal in source | Signal on screen | Caught | Fix pattern |
|---|---|---|---|---|
| K.1 | Internal feature codes (`F-01`…`F-13`, `S-`, `M-`, `DEC-`) inside `<p class="eyebrow">`, `<ion-title>`, `<ion-label>`, headings, captions in `*.html` | UI shows uppercase eyebrow / label like `F-08 TRAINING PLAN` | 2026-05-15 audit (Fitness page) | Run `grep -rnE "F-[0-9]+" src/app --include="*.html" --include="*.ts" \| grep -v "//\|/\*\|spec\."`. Allowed: comments only. Replace user-facing strings with feature names without the code. |
| K.2 | A CTA defined unconditionally outside an `@if (isEmpty()) { … } @else { … }` block while the empty-state component also exposes the same CTA | Two visible buttons with identical text on screen at once | 2026-05-15 audit (Calendar `app-empty-day-state` + `calendar-ai-cta`) | Keep one CTA per state. Move the unconditional button **inside** the `@else` (non-empty) branch, or hide via `@if (!isEmpty())`. |
| K.3 | Inline element (`<strong>`, `<span>`) holding multi-line title + meta inside a vertical `display: grid` parent | Plan/list title text runs into subtitle without space, e.g. `Full Body 3 buổi3 buổi/tuần · 12 bài` | 2026-05-15 audit (Fitness plan card) | Set `display: block` on the inline children, or use explicit `<div>` per line. Don't rely on grid gap to break inlines — inlines lay out side-by-side regardless. |
| K.4 | Italic display serif `<ion-title>` with Vietnamese text (diacritics ạ ộ ụ ặ ợ ọ ử) on default 44px ion-toolbar | Bottom dot diacritics clipped by header bottom edge | 2026-05-15 audit (Onboarding step 3 + every page with italic serif title) | Global fix at `src/theme/header-elevation.scss`: `ion-header ion-toolbar ion-title { line-height: 1.4; padding-block: 4px; }`. Don't patch per-page — diacritic-bearing labels appear on every page. |
| K.5 | `<ion-button>` placed in `<ion-buttons slot="start">` carrying a multi-character text label PLUS an inline glyph (e.g. `{{ label }} ▼` or `Today ⌄`) | Pill or label text clips against the toolbar's left edge; glyph dangles below baseline; reads as broken affordance | 2026-05-15 polish pass 2 (Calendar header `headerLabel` chip) | Replace `ion-button` text+glyph with a real chip element: `<button class="*-date-chip">` with a `<span>` label + `<ion-icon name="chevron-down">`, padded inline-flex, rounded-pill, contained inside the slot. Ionic's `ion-button` is sized for icon-only or short labels — never use it for compound text+glyph. |
| K.6 | DB columns nullable/seeded to `0` for "unset" values (e.g. `day_plan.target_calories=0`) consumed via `??` nullish-coalescing fallback | UI displays `0 / 0` or other dead-zero readouts that look like a goal wasn't set | 2026-05-15 polish pass 2 (Calendar week-view T6 row `0 / 0`) | Use truthy/positive check, not `??`. Pattern: `const target = (raw ?? 0) > 0 ? raw : profileFallback;`. Also pull the real user-level fallback (e.g. `ProfileStore.profile()?.target_calories`) instead of a hardcoded constant — `0` from DB should defer to the user's actual goal, not 2000. |
| K.7 | Compound display:flex strip selectors targeted via adjacent-sibling rule (`segmented-control + .strip { display: block }`) silently kill the strip's own flex layout, collapsing chips into a vertical stack | Filter/chip rail loses horizontal scroll + gap, becomes a wall of stacked buttons. Easy to miss because nothing logs and the chips still render. | 2026-05-15 polish pass 3 (Management filter strip) | Never override `display` on a layout container as a side-effect of a sibling spacing rule. Limit such rules to `margin-top` only, or use a wrapper. Audit any `+ .layoutContainer { display: … }` for unintended display overrides. |
| K.8 | Two SCSS blocks declaring the same selector live in one file; the lower block silently overrides the upper. Often caused by concurrent edits to long files. | UI changes don't appear despite the patch landing. Looks like a cache bug; actually a CSS specificity/order bug. | 2026-05-15 polish pass 3 (`.ai-plan-callout` duplicated in fitness.page.scss) | Before patching long SCSS files, `grep -c '\\.selector\\s*{'` to verify uniqueness. If duplicates exist, consolidate into one block. Add a lint rule for duplicate top-level selectors in component SCSS. |
| K.9 | Emoji literals (U+1F300–1FAFF, U+2600–27BF, U+2300–23FF, U+2B00–2BFF, U+FE0F variation selector) embedded in `*.html`/`*.ts` template strings as UI affordance — e.g. `📌`, `🔒`, `ℹ️`, `✨` used as icons or status markers | UI shows emoji glyphs that render inconsistently across Android versions, clash with ionicon outline set, and break the "Apple-grade" visual language. Often slip past code review because grep on letters misses them. | 2026-05-15 polish pass 5 (sweep across `confirm-eat-modal`, `status-pill`, `meal-slot-card`) | Run the emoji sweep python script (see references, scans `src/app/**/*.{html,ts,scss}` excluding `*.spec.*`). For each hit: replace glyph with semantic ionicon outline (e.g. `📌→bookmark-outline`, `🔒→lock-closed-outline`, `ℹ️→information-circle-outline`, `✨→sparkles-outline`). Register icon in component via `addIcons({…})`. Update specs that assert the old glyph. Reserve emojis for user-generated content only, never app chrome. |
| K.10 | Tab bar uses Ionic default `ion-tab-button` styling — selected state is signaled only by color change of icon+label, with no shape/weight delta | Active tab visually weak; on busy screens user can't tell where they are at a glance. Fails Apple HIG "clear feedback for current selection" rule. | 2026-05-15 polish pass 5 (Tabs accent rail) | In `tabs.page.scss` target `ion-tab-button[aria-selected="true"]`: add a 28×3px accent rail via `::before` (primary color, top-anchored, border-radius), bump `ion-label` font-weight to 700, and scale `ion-icon` to 1.06. This stacks 3 reinforcement signals (color + weight + rail) for accessibility. |
| K.11 | FAB positioned with hardcoded `bottom: 72px` (or any fixed px) — assumes a fixed tab-bar height and ignores gesture-bar safe-area | On gesture-nav phones (Pixel 6+, modern emulators) FAB sits too close to the tab bar or under the gesture bar, blocking tab taps and feeling cramped | 2026-05-15 polish pass 5 (FAB on Management) | Always: `bottom: calc(96px + env(safe-area-inset-bottom, 0px))` where 96px = tab-bar (56) + safe-area buffer (24) + visual gap (16). Pair with matching `padding-bottom` on the scrollable list so the last card never hides under the FAB. |
| K.12 | Day eyebrow renders ISO date or "Ngày {iso}" directly — `Ngày 2026-05-15` reads as machine output, breaks Vietnamese mobile-app voice | Eyebrow looks like debug text, not a polished header. Reduces perceived product quality. | 2026-05-15 polish pass 5 (`day-summary-card`) | Add a `computed()` `displayDate` that formats as `Thứ N, DD/MM/YYYY` using `VN_WEEKDAY_LABELS[Date.UTC(...)]` (UTC to dodge TZ shift). Render `{{ displayDate() }}` instead of raw ISO. Same pattern for week-row labels: `{ Tn, DD }` with a "Hôm nay" pill on today's row. |
| K.13 | English copy slipping into Vietnamese UI surface — full EN phrases (`AI Custom plan`, `Workout weekly streak`, `Dinh dưỡng logged-only`, `Beginner-friendly`, `Intermediate split`) inside `<strong>` / `<span>` / `<p>` in feature templates | UI mixes EN ↔ VN within the same card, breaks Vietnamese-first PRD rule, reads as un-localized draft | 2026-05-15 polish pass 6 (Dashboard stat-grid + Fitness AI callout) | Run grep guard before claiming a feature done: `grep -rnE ">[^<{]*\\b(plan\|workout\|streak\|logged\|custom\|beginner\|intermediate\|advanced)\\b[^<]*<" src/app --include='*.html'` then filter `{{` lines. Replace with VN (`Giáo án AI tùy chỉnh`, `Streak tập luyện theo tuần`, `Streak dinh dưỡng đã log`). Accepted loanwords (do NOT translate): `streak`, `log`, `volume`, `rep`, `set`, `kcal`. |
| K.14 | AI CTA buttons (Dashboard quick-actions, dish-edit "Điền bằng AI", logging-modal "Gợi ý") rendered enabled regardless of network state, only feedback is delayed toast after tap → silent loading then "Cần kết nối mạng" error | User wastes a tap, doesn't know offline until toast fires; inconsistent with ingredient-edit which already shows banner | 2026-05-15 polish pass 7 (Dashboard + dish-edit) | Inject `NetworkStore`, render `<app-ai-offline-banner />` directly above the AI CTA group, and gate `[disabled]` with `|| !network.online()`. Banner self-hides when online → caller does NOT wrap in `@if`. Verify offline behavior on emulator: `adb shell svc wifi disable && adb shell svc data disable`. |
| K.15 | **(CORRECTED 2026-05-16 T7–T10)** Earlier guidance said `uiautomator dump` returns only the WebView shell on Capacitor — this is FALSE for Capacitor 7+. The dump DOES enter Blink and returns the full hydrated DOM, BUT only after the WebView has fully hydrated (~8–12s after fresh install or cold start). A dump fired too early returns a ~2.6 KB skeleton with the single `<node class="android.webkit.WebView" …>` leaf, which looks identical to the "opaque WebView" symptom. | Audit author mistakes early-dump skeleton for permanent opacity, abandons text-grep approach, falls back to CDP-based tap scripts that are themselves fragile (see K.16). | 2026-05-16 T4 pivot + T7/T8 empirical confirmation: post-hydration dumps return 30–90 KB hydrated trees with `text=""` attributes greppable for EN-leak / copy audits (KI-02 closed this way). | Canonical audit primitive is now **uiautomator dump + grep `text=""`**, NOT narrator-on-PNG and NOT CDP. Required sequence: `am start -n com.healthmate.ai/.MainActivity` → `sleep 14` (initial hydration) → `adb shell input tap <x> 2320` → `sleep 5` (route hydration) → `adb shell uiautomator dump /sdcard/dump.xml` → `adb pull` → verify dump size > 20 KB AND first 5 post-`<ion-content>` text nodes are non-empty (size > 30 KB heuristic alone is wrong — empty-state calendar is legitimately 22.6 KB). For taps: hardcoded device-pixel coords on the 4-tab bar are `x=135 / 405 / 675 / 945`, all `y=2320` at 1080×2400 emulator resolution. CDP-via-qa-tap.mjs is DEPRECATED for the audit pipeline (kept in tree for debug only). |
| K.16 | **(CORRECTED 2026-05-16 T3–T10)** Earlier guidance attributed `signal 5 (Trap)` SIGTRAPs to MTE/scudo memory-tagging. EMPIRICALLY FALSE: T3 tombstone decode showed `signal 5 / si_code TRAP_BRKPT / fault_addr == PC / top frame in libwebviewchromium.so metrics/variations init` — this is a **vendor Chromium CHECK macro tripping on CDP attach traffic**, not a memory-tagging violation. Without CDP attach, pid stays alive indefinitely across all 4 tab routes (T3: pid 24880 survived 6 captures with 4 distinct route MD5s; no new tombstones during the no-CDP tour). | Audit author chases an MTE fix that doesn't exist, wastes turns building API-34 fallback AVDs or `--disable-features=PartitionAllocMemoryTagging` plumbing. Meanwhile the real fix is "don't attach CDP". | 2026-05-16 T3 no-CDP tour: 6 captures (1× boot + 4× tabs + 1× back-to-dashboard), all distinct MD5s, no new tombstones. T7/T8/T9 audit pipeline runs this way and has produced 0 SIGTRAPs across ~30 captures. | **Mitigation: never attach CDP for audit captures.** Use the hardcoded-coords + `adb shell input tap` tour described in K.15. The vendor Chromium CHECK is upstream and outside our codebase — not a codebase defect, status `mitigated`. Diagnose only if SIGTRAPs return: `adb pull /data/tombstones/tombstone_<latest>.pb` → `protoc --decode_raw` → confirm `libwebviewchromium.so` in top frame. Do NOT add MTE flags; do NOT downgrade AVD; do NOT mask with `try/catch`. |
| K.17 | **(NEW 2026-05-16 T14)** A schema-layer validation fix lands in `*.schema.ts` + unit-tested green, but emulator verification is requested for the error-text rendering. Sub-agent attaches CDP to query `document.querySelector(...).textContent` to confirm the exact Vietnamese error string is on screen. This violates the Goal Prompt's "Không dùng browser, Chrome, web preview hoặc desktop viewport" rule — CDP is the Chrome DevTools Protocol, attaching it counts as browser usage. | Sub-agent returns `KI-XX_VERIFIED` with the exact-string match, but the verification primitive is forbidden. Parent has to downgrade the verdict to TRANSITIVE-TRUST after the fact, losing audit value. | 2026-05-16 T14 (KI-26 ingredient-form upper bounds): sub-agent confessed "Surface confirmed via CDP (uiautomator hid WebView text)" while delivering KI-26_VERIFIED. | **Allowed primitives for runtime verification on emulator (strict allowlist):** (a) `adb shell uiautomator dump` + grep — works for many WebView text nodes after hydration (K.15), but unreliable for fast-rendering error messages or hidden inputs; (b) page-state inference — confirm Save was blocked by checking the dump still shows the form's header (e.g. "Thêm nguyên liệu"), not the destination route. **Forbidden:** CDP, Chrome inspector, `webview_devtools://`, `chrome://inspect`, any Playwright/Cypress against the WebView. **Rule:** every sub-agent brief MUST contain an explicit "Do NOT use CDP / Chrome DevTools / browser-based DOM access" line. If the only way to verify is via a forbidden primitive, downgrade the fix to "schema/spec-verified + page-state-inferred", do not claim full empirical match. |
| K.18 | **(NEW 2026-05-16 polish pass 9)** Form edit pages (`dish-edit`, `ingredient-edit`) render primary save CTA + destructive "Xóa" button inline at the bottom of scroll content. As the form grows (6+ ingredients), Save scrolls out of viewport; "Xóa" text-link is stacked directly under Save creating mistap risk; the still-visible bottom tab bar competes with the in-content CTAs and the absence of a true app footer means there's no safe-area inset under the buttons → CTA visually collides with the home indicator on gesture-nav phones. | Save unreachable without scrolling on long forms; destructive action sits adjacent to primary → HIG anti-pattern; tab bar shouldn't be visible during modal-style editing; no safe-area handling under buttons. Inconsistent with Settings sub-pages which already use the canonical `<ion-footer>` + `.sticky-save-bar` pattern from `src/theme/_section.scss`. | 2026-05-16 polish pass 9 (`dish-edit`, `ingredient-edit`): saved button moved to `<ion-footer>` w/ `.sticky-save-bar` + `.save-button` (sage primary); "Xóa" moved to toolbar `slot="end"` as `<button class="icon-button icon-button--danger">` w/ `trash-outline` icon (confirm-dialog already exists); both pages add `ngOnInit`/`ngOnDestroy` toggling `document.body.classList.add('edit-overlay-open')` so existing `:host-context(body.edit-overlay-open) ion-tab-bar { display: none }` hook in `tabs.page.scss` finally fires. Verified on emulator: trash icon top-right, tab bar hidden, sticky LƯU THAY ĐỔI pinned bottom w/ home-indicator clearance. | **Canonical edit-page chrome (apply to ANY page that scrolls a form + has Save + Delete):** (1) Save → `<ion-footer class="ion-no-border"><div class="sticky-save-bar"><ion-button expand="block" class="save-button">…</ion-button></div></ion-footer>` — defined once in `src/theme/_section.scss`, no per-page CSS dup. (2) Delete → toolbar `<ion-buttons slot="end">` with `icon-button--danger` + `trash-outline` + `aria-label`, gated by `@if (isEdit())`. (3) Hide tab bar via `document.body.classList.add('edit-overlay-open')` in `ngOnInit` and remove in `ngOnDestroy` (hook lives in `tabs.page.scss:46`). (4) Drop `padding-bottom: 220px` hacks on `.form-content` — footer reserves its own height, 24px buffer is enough. (5) Do NOT keep an inline `.btn-cta` Save in scroll content — only the modal amount-sheets keep `.btn-cta` because they live inside an `<ion-modal>` and have no `<ion-footer>` slot. |
| K.19 | **(NEW 2026-05-16 polish pass 14)** Dashboard / home-screen có **N empty-state cards xếp chồng** — Hero "chưa có món", AI Insight "chưa có dữ liệu", Nutrition "0 kcal" — cùng truyền tải 1 thông điệp "user chưa log gì hôm nay". Mỗi card có CTA "Mở lịch ăn" riêng → user phải parse 3 lần cùng nội dung. Toolbar còn nhồi refresh button bên cạnh tự-refresh on `ionViewWillEnter` → decision noise. Quick-actions section copy lại tab-bar entries ("Quản lý món ăn", "Tập luyện", "Cập nhật cơ thể") → duplicate navigation. Hero card dùng `font-size-display` (~32-36px) + `space-xl` padding + 3-line empty copy → chiếm 40% màn hình cho 0 signal. | Empty home screen feel như debug screen, không có 1 primary focal point. User mở app thấy "0 / 0 / 0 / Chưa có dữ liệu / Chưa có dữ liệu / Chưa có dữ liệu" → ấn tượng app chết. Hierarchy biến mất vì 3-4 card cùng cấp lặp lại nhau. | 2026-05-16 polish pass 14 (Dashboard): bỏ empty branch trong `DashboardStore.insight()` (return null), drop refresh toolbar button, quick-actions 6→2 (chỉ AI features unique), Hero compact, macro-list `@if (hasNutritionData())`. | **Canonical empty-state strategy cho home/dashboard surfaces**: (1) **Một empty-state card duy nhất** (thường là Hero) cover toàn bộ thông điệp "chưa có data" — `heroTitle()` + `heroBody()` short, không lan dài. (2) **Mọi card phụ render conditional**: `@if (data())` ngay store/template level — không có "empty fallback object" trả về placeholder text. Pattern store: `if (totals.calories <= 0) return null;` thay vì `return { title: 'Chưa có dữ liệu...' }`. (3) **Quick actions = entry-points UNIQUE only**. Nếu tab bar đã có "X" → không lặp lại "X" trong quick-actions. Quy tắc: mỗi quick-action phải mở 1 flow không reach được từ tab navigation (vd AI capture, photo analysis). (4) **Toolbar tối đa 1-2 button** (settings + 1 context action). Auto-refresh on `ionViewWillEnter()` đã cover use case → bỏ refresh button khỏi toolbar. Pull-to-refresh là cách Apple-grade nếu user thực sự cần. (5) **Hero card on empty**: padding `lg` (không `xl`), font-size `headline` (không `display`), max 1 dòng title + 1 dòng body. Save vertical real-estate cho core metric card (nutrition ring) lên trên fold. (6) **Macro/detail rows ẩn khi all-zero**: `@if (hasNutritionData())` gate cả `progress-track` lẫn `macro-list` — chỉ render kcal ring + label "Chưa có mục tiêu" tóm gọn. Đừng show 4 dòng 0% xếp dọc. |
| K.20 | **(NEW 2026-05-16 polish pass 15)** Feature page nhồi 3+ widget khác loại vào 1 card section (vd Fitness "Chọn giáo án" gộp active-pill chip + AI callout to + plan-grid + week-strip), và tự động render heavy picker (search input + 100+ exercise chip) trong card khác kể cả khi user không yêu cầu → page dày đặc, mất focus, hierarchy bị flatten. | User mở tab thấy noise dày, không có entry point rõ. Free-mode picker ăn ~30% screen mặc dù 90% user vào tab để start guided workout. AI callout cạnh tranh visual weight với plan thật. | 2026-05-16 polish pass 15 (Fitness): tách week-strip ra section riêng "LỊCH TUẦN" + `@if (activePlan())`; AI callout `--compact` modifier (1 row); free-mode picker gated bởi `freeModeOpen` signal + toggle dashed button; toggle ẩn khi rest-day (CTA tự do đã có). | **Canonical "one section, one purpose" rule**: (1) **1 card section = 1 mental model**. Không gộp selector + preview + picker khác cấp vào cùng 1 fitness-card. Nếu data có 2 chiều (vd plan-list + week-preview-of-active-plan) → tách 2 section, gate section thứ 2 bằng `@if (precondition)`. (2) **Heavy pickers (search input + N>20 chip)** PHẢI collapsed-by-default. Pattern: component-local `signal<boolean>(false)` + dashed-border toggle button (`min-height:40px`, `border:1px dashed var(--border-color)`, `border-radius:var(--radius-md)`) hiển thị label "Thêm X" → `@if (open())` mới render input + list. (3) **Gate trùng-intent CTA**: nếu state hiện tại đã expose 1 CTA cho action X (vd rest-day → "Bắt đầu buổi tự do"), KHÔNG render thêm toggle/button cho cùng action X ở footer card. Pattern: `@if (!stateRequiringCta())` wrap toggle. (4) **AI/secondary callouts**: dùng modifier `--compact` (align-items:center, padding-y:xs, drop paragraph, button size="small") khi feature không phải primary. AI là tùy chọn, không phải hero. (5) **Section header không lặp tên active resource**: nếu plan-card đã có badge "Đang dùng", KHÔNG thêm `active-pill` chip với tên plan trong section header — badge trên card đã đủ. (6) **h2 + eyebrow không trùng**: nếu eyebrow = "Tiến trình", h2 không được là "Tiến trình tập luyện" — đổi h2 thành metric cụ thể ("Khối lượng & sức mạnh") hoặc bỏ eyebrow. |
| K.21 | **(NEW 2026-05-16 polish pass 16)** Set-logging feature audit: backend `addSet` worked but **3 destructive primitives missing** — `deleteSet` (xóa set sai), `removeExerciseFromSession` (xóa bài thêm nhầm), `cancelSession` (hủy buổi tập bắt đầu nhầm). UX gap: active session với 0 exercise rơi vào "dead-end" (Hoàn thành disabled, không có entry point thêm bài từ chính card đó); set history chỉ display weight×reps không có swipe/long-press để xóa; không có "repeat last set" 1-tap cho user lặp same weight 4 lần; rest-day path không cho phép thêm exercise vào active free-workout đang chạy (free-mode picker bị gate by `!isRestDay`). | User log set sai 100kg thay vì 10kg → bị kẹt sống chung; start nhầm free workout → phải đợi backend dangling session mãi mãi; thêm nhầm exercise → kẹt; rest-day + active free-session = không thể thêm bài (UI dead-end vì free-mode toggle bị gate sai). | 2026-05-16 polish pass 16 (Fitness set-logging): WorkoutRepository `deleteSet` (re-number set_number contiguous + sync totals), `removeExerciseFromSession` (cascade workout_set + sync totals), `cancelSession` (delete session + cascade, refuse on completed). FitnessStore actions `deleteSet`, `removeExerciseFromActive`, `cancelActiveSession`, `repeatLastSet`. UI: header active-workout có 2 buttons (X cancel + Hoàn thành); empty active card có CTA "Thêm bài tập" trigger `openFreeModeAndScroll()` (signal + scroll-into-view setTimeout 80ms cover Angular CD); set-history per-row trash button confirm-dialog; set-logger có `repeat-outline` icon button cạnh "Ghi set" (chỉ render khi `sets.length > 0`); free-mode picker gate sửa thành `activeSession() !== null || !isRestDay`. AlertController confirm cho 3 destructive actions ("Hủy buổi tập?" / "Xóa Set N?" / "Xóa bài khỏi buổi tập?"). 3 repo specs added (deleteSet contiguity + idempotent, removeExercise cascade, cancelSession refuse-completed). | **Canonical destructive-action pattern cho mọi feature có write log**: (1) **Backend phải có cả 4 primitives**: create, read, update (or skip), `delete-single` (xóa 1 row), `cancel-aggregate` (xóa session/buổi/log entry root + cascade). Test luôn idempotent (`delete nonexistent → no throw`) + cascade integrity (DB row count + totals sync). (2) **Re-numbering rule**: nếu schema có `*_number` ordinal (set_number, set_order, sort_order) trên child rows, sau khi delete phải UPDATE remaining rows về 1..N contiguous TRONG cùng transaction — không để gap. (3) **Confirm dialog mandatory**: bất kỳ destructive action nào (delete row / cancel session / remove from list) PHẢI gate qua `AlertController.create({header, message, buttons: [{text:'Hủy', role:'cancel'}, {text:'Xóa', role:'destructive', handler}]})`. Không destructive action nào fire trực tiếp từ tap. (4) **Empty active-state phải có entry point**: nếu user ở trạng thái "active session created" nhưng "0 child rows", card đó PHẢI có CTA dẫn user thêm child (vd "Thêm bài tập") thay vì chỉ disable "Hoàn thành". Pattern: `@if (parent.children.length === 0) {<empty-state-cta />} @else {<children-list />}` trong cùng wrapper. (5) **Scroll-to-element timing**: signal set + scrollIntoView trong cùng tick KHÔNG work với OnPush — element chưa được render. Pattern: `signal.set(true); setTimeout(() => el.scrollIntoView({block:'center'}), 80);` (80ms cover Angular CD + paint). (6) **Quick-action shortcut**: nếu user có thể lặp lại 1 action với same input N lần (vd log same-weight set), thêm "+1 same" icon button cạnh primary CTA. Pattern: render `@if (history.length > 0) { <repeat-button /> }` để tránh empty state. (7) **Gate condition cho secondary entry-points**: gate `@if` không được loại trừ active-in-progress state. Pattern sai: `@if (!isRestDay)` (loại trừ user đang trong rest-day + active free-session). Pattern đúng: `@if (activeSession() !== null \|\| !isRestDay)`. (8) **DB-verify destructive flow trên emulator**: post-action `adb shell run-as <pkg> cat databases/<db>` → `sqlite3` check row count + totals — UI signal có thể delay nhưng DB truth là final source. |

### How to use this section in audits

When running §A → §G, ALSO scan source for K.1 via grep and visually scan screenshots for K.2/K.3/K.4 signals. If any return positive, log them as new findings, fix at the root-cause level indicated, and add another row to §K if the bug pattern is novel.


Last updated: 2026-05-16 (v1.16 — polish pass 16: Fitness set-logging full audit. **Audit before**: backend `addSet` worked + tests pass, but 3 destructive primitives missing (`deleteSet` / `removeExerciseFromSession` / `cancelSession`); active session với 0 exercises tạo dead-end ("Hoàn thành" disabled không có entry thêm bài); set-history hiển thị weight×reps không có delete; không có "repeat last set" shortcut; rest-day path gate `!isRestDay` chặn user thêm exercise vào active free-session đang chạy. **Root-cause fixes**: (1) WorkoutRepository: `deleteSet(setId)` re-numbers remaining sets contiguous + syncTotals, `removeExerciseFromSession(workoutExerciseId)` cascade workout_set + syncTotals, `cancelSession(sessionId)` delete session + cascade exercises + sets (refuse on completed); (2) FitnessStore: `deleteSet`, `removeExerciseFromActive`, `cancelActiveSession`, `repeatLastSet` actions (re-fetch session after mutation); (3) Active workout header có 2 buttons (X close-circle-outline cancel + Hoàn thành); empty-state card "Buổi tập trống" với CTA "Thêm bài tập" → `openFreeModeAndScroll()` (signal + setTimeout 80ms scrollIntoView để cover OnPush CD); per-set trash button + AlertController confirm "Xóa Set N?"; per-exercise trash button trong set-logger header confirm "Xóa bài khỏi buổi tập?"; repeat-outline icon button cạnh "Ghi set" (chỉ render khi sets.length > 0); (4) Free-mode gate fix: `@if (activeSession() !== null \|\| !isRestDay)` thay vì `@if (!isRestDay)` — cho phép thêm bài vào active session bất chấp rest-day; (5) 3 specs added (deleteSet idempotent + contiguity, removeExercise cascade, cancelSession refuse-completed) → 805/805 tests. **Emulator E2E verified**: start free session → add Chống đẩy + Deadlift via picker → log 200kg set on Deadlift (DB cat → workout_set 1 row + total_volume=200 confirmed) → tap per-set trash → confirm "Xóa Set 1?" → tap Xóa → DB workout_set 0 rows + total_volume=0 confirmed → tap exercise trash → confirm "Xóa bài khỏi buổi tập?" dialog renders → tap X cancel → confirm "Hủy buổi tập?" → tap Hủy buổi → session deleted (no Đang tập card, free-workout CTA visible). Screenshots: `/tmp/qa-audit/v10/40-94`. 9/9 guards pass. **K.21 added**. **Deferred**: pre-existing visual quirk (`activeSession()` đôi khi không render eyebrow/title sau tab switch — only set-logger renders; có thể là OnPush + nested signal issue, không introduced by pass này — sau relaunch render đúng); inline edit-set (chỉ delete + repeat hiện tại, không có edit weight/reps inline — out of scope).)

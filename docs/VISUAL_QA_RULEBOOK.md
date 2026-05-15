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

## §K. Recurring bug signatures (caught here, now codified)

These are concrete bug patterns that escaped CI guards + unit tests and were only caught on emulator. Every future visual-QA run MUST grep for them.

| ID | Signal in source | Signal on screen | Caught | Fix pattern |
|---|---|---|---|---|
| K.1 | Internal feature codes (`F-01`…`F-13`, `S-`, `M-`, `DEC-`) inside `<p class="eyebrow">`, `<ion-title>`, `<ion-label>`, headings, captions in `*.html` | UI shows uppercase eyebrow / label like `F-08 TRAINING PLAN` | 2026-05-15 audit (Fitness page) | Run `grep -rnE "F-[0-9]+" src/app --include="*.html" --include="*.ts" \| grep -v "//\|/\*\|spec\."`. Allowed: comments only. Replace user-facing strings with feature names without the code. |
| K.2 | A CTA defined unconditionally outside an `@if (isEmpty()) { … } @else { … }` block while the empty-state component also exposes the same CTA | Two visible buttons with identical text on screen at once | 2026-05-15 audit (Calendar `app-empty-day-state` + `calendar-ai-cta`) | Keep one CTA per state. Move the unconditional button **inside** the `@else` (non-empty) branch, or hide via `@if (!isEmpty())`. |
| K.3 | Inline element (`<strong>`, `<span>`) holding multi-line title + meta inside a vertical `display: grid` parent | Plan/list title text runs into subtitle without space, e.g. `Full Body 3 buổi3 buổi/tuần · 12 bài` | 2026-05-15 audit (Fitness plan card) | Set `display: block` on the inline children, or use explicit `<div>` per line. Don't rely on grid gap to break inlines — inlines lay out side-by-side regardless. |
| K.4 | Italic display serif `<ion-title>` with Vietnamese text (diacritics ạ ộ ụ ặ ợ ọ ử) on default 44px ion-toolbar | Bottom dot diacritics clipped by header bottom edge | 2026-05-15 audit (Onboarding step 3 + every page with italic serif title) | Global fix at `src/theme/header-elevation.scss`: `ion-header ion-toolbar ion-title { line-height: 1.4; padding-block: 4px; }`. Don't patch per-page — diacritic-bearing labels appear on every page. |

### How to use this section in audits

When running §A → §G, ALSO scan source for K.1 via grep and visually scan screenshots for K.2/K.3/K.4 signals. If any return positive, log them as new findings, fix at the root-cause level indicated, and add another row to §K if the bug pattern is novel.


Last updated: 2026-05-15 (v1.0 initial draft from design-system.md v2.1 + F-03/F-04 ux-specs + Android UX guidelines).

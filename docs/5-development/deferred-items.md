# Deferred Items — MealPlaning / HealthMate AI

**Status:** Living document
**Last updated:** 2026-05-09 (post v0.2.2 A-milestone ship — B1/B6/B8/B3-Settings/D-UX P2-1/2/3 closed)
**Owner:** Khanh Huynh (solo dev)

---

## At-a-glance status (rev 2026-05-08)

> Per investigation 2026-05-08 §G4 — give a fast read of OPEN vs DONE vs CANCELLED without scanning all 4 sections.

### OPEN (active deferrals)

| Mã | Item | Section | Trigger phase |
|---|---|---|---|
| A1-A8 | F-02 cascade delete, F-03/F-04, F-12, D5, dataset, signal-forms, AI insight | §1 | Phase 3+ / V2 |
| B2 | Radio-circle 18px filled | §2 | On user request only |
| B3 | Phase 1 modals (ingredient-edit, dish-edit) form unify — Settings portion DONE | §2 | Pre-Phase 3 |
| C1-C5, C7 | Phase 1.5B AI tuning, WebView 147 SIGTRAP, mockup-first workflow | §3 | Phase 3+ / on signal |
| C10 | P2-4 Settings hub `Nhắc nhở` collapse → bottom-sheet | §3.1 | Settings expansion or user feedback |

### DONE (logged in §4)

- C6 — Boy-scout prettier 4 files
- D1 — POST_NOTIFICATIONS flow (Story 2.2 + 2.5)
- D2 — styleUrl audit (Story 2.4)
- D3 — Activity label normalization (Story 2.4)
- B6 — E2E tool decision (Appium 2 + WDIO 9, ADR-001 Accepted, `030ceb4`, 2026-05-08)
- B8 — Coverage baseline 74.24% statements (`3a9fd42`, 2026-05-09)
- B3 (Settings portion) — body-edit + goals-edit normalized to `<app-form-field>` (`a64eacf`, 2026-05-09)
- B1 — Sage cream alignment cleanup `#fafaf7` → `#fbf7ef` (`3f8d3c1`, 2026-05-09)
- D-UX-AUDIT-202605 P2-1/2/3 — Settings hub copy polish (`3f8d3c1`, 2026-05-09)

### CANCELLED (per cleanup `646aacc` 2026-04-29)

- B4 — 5 mockup HTML files (mockups deleted intentionally)
- B5 — ADR-002 migration strategy (no ADR pattern in repo)
- B7 — Manual QA 14/15 items Phase 1 (no phase-detail QA docs)
- B9 — Phase 1 Retro + phase-1-qa.md (no phase-detail spec docs)

### Convention

- New deferrals → append to §2 (B-codes) or §3.1 (D-codes); never reuse codes.
- Done → move row to §4 with commit + date; strikethrough the original row.
- Cancelled → strikethrough + add CANCELLED reason inline; do not delete (audit trail).

---

## Mục đích

Track các đầu việc đã được phát hiện trong quá trình phát triển nhưng **chủ động hoãn lại** để không phá scope phase hiện tại. Khác với:

| Loại | Nơi track |
|------|-----------|
| Bug đang sai | Fix ngay, ghi commit message |
| TODO nhỏ trong code | Comment `// TODO:` tại chỗ |
| **Deferred (file này)** | Việc có giá trị, lý do hoãn rõ, dự kiến phase sẽ làm |
| Roadmap phase | `development-plan.md` |

## Quy tắc cập nhật

1. Mỗi item phải có: **mã** (A/B/C + số), **mô tả ngắn**, **lý do hoãn**, **trigger / phase dự kiến**, **nguồn evidence**.
2. Khi item được làm xong → chuyển xuống mục §4 Done log với commit hash.
3. Khi phát hiện item mới → thêm vào nhóm phù hợp, KHÔNG sửa mã cũ.
4. Mã không tái sử dụng (đã dùng C6 cho boy-scout prettier → không gán lại dù đã done).

---

## §1 — Nhóm A: Đã document chính thức trong docs/

Các item này đã có nơi track chi tiết riêng. Liệt kê ở đây để tổng hợp đầy đủ.

| Mã | Item | Hoãn đến | Lý do | Nguồn evidence |
|----|------|----------|-------|----------------|
| A1 | F-02 acceptance #4: cascade delete dish khi đang nằm trong meal plan | Phase 3 | `planned_dish` table chưa tồn tại ở Phase 1 | `phase-1-management.md` |
| A2 | F-03 Calendar, F-04 Tracking | Phase 3 | Roadmap-level | `development-plan.md` |
| A3 | F-12 Dashboard đầy đủ (KPI cards, AI insights) | Phase 4 / 6 | Cần data từ tracking | `development-plan.md` |
| A4 | D5 Backup / Export dữ liệu | V2 | Out-of-scope V1 | `development-plan.md` |
| A5 | Dataset > 20 món Việt + snack dishes | V1.x / V2 | Seed scope giới hạn | `phase-1-management.md` |
| A6 | AI Insight Card real data | Phase 6 | Phase 4 chỉ placeholder | `development-plan.md` |
| A7 | Signal Forms migration Phase 1 forms sang `@angular/forms/signals` stable | Plan B2+ | Đợi unflag stable + plan có sẵn | `signal-forms-migration-plan.md` |
| A8 | `form-field.ts` error mode #3 (`[field]=` binding sau khi Signal Forms graduate) | Phase B2 | Đợi API stable | comment trong `src/app/shared/components/form-field/form-field.ts` |

---

## §2 — Nhóm B: Đã khoanh trong session, chưa vào docs

Các item phát hiện qua các session nhưng chưa có nơi track formal trước file này. Rủi ro cao bị lãng quên.

| Mã | Item | Lý do hoãn | Trigger / Phase dự kiến |
|----|------|-----------|-------------------------|
| ~~B1~~ ✅ DONE (v0.2.2) | ~~Global `--bg-page` cream alignment `#fafaf7 → #F7F2EA` (Sage Wellness DNA)~~ | Resolved: `--bg-page` đã set `#f7f2ea` từ trước; cleanup commit `3f8d3c1` (2026-05-09) fix 2 stale `#fafaf7` references còn lại (`--ion-color-light-tint` → `#fbf7ef`, comment ref trong `--bg-sunken`). Cross-page contrast verified live trên emulator-5554 v0.2.2 install. | — |
| B2 | Radio-circle 18px filled indicator trong onboarding | Code đang dùng 3-cue alternative (bg tint + check icon + bold label) — đã accessible đủ | Chỉ revisit khi user yêu cầu pixel-perfect mockup match |
| B3 (Settings portion) ✅ DONE | Settings forms (`body-edit`, `goals-edit`) normalize to `<app-form-field>` (Boolean mode + AppFormField import). Resolved commit `a64eacf` (2026-05-09); guard `check-form-input-pattern.mjs` enforces. | — |
| B3 (remaining) | Phase 1 modals (`ingredient-edit`, `dish-edit`) form input unify — quyết định A (normalize floating-label) đã chốt qua Settings precedent, áp tương tự cho 2 modal Phase 1 | Cần touch dish-picker + macro inputs; risk medium vì các modal phức tạp hơn Settings | Trước khi Phase 3 mở thêm modal mới |
| ~~B4~~ | ~~5 mockup HTML files thiếu (Phase 1 pre-flight debt)~~ | **CANCELLED** per cleanup commit `646aacc` Q2 (2026-04-29) — phase-1 mockups đã bị xoá có chủ đích, source of truth chuyển sang `design-system.md` + code thực tế. Không tạo lại. | — |
| ~~B5~~ | ~~ADR-002 migration strategy doc chưa viết~~ | **CANCELLED** per cleanup commit `646aacc` Q1 (2026-04-29) — repo không dùng ADR pattern nữa; decisions kiến trúc sống trực tiếp trong `architecture.md` / `data-model.md` / `business-rules.md`. | — |
| ~~B6~~ ✅ DONE (v0.2.2) | ~~E2E tool decision (O2): Playwright / Cypress / Detox?~~ | Resolved: chọn **Appium 2 + WebdriverIO 9 + UiAutomator2 4** (NATIVE_APP context). Lý do: Capacitor WebView không nhận `adb input tap` raw; Detox không support Ionic/Angular; Playwright thiếu native layer. ADR-001 Accepted. Smoke + onboarding-persist + b3-form-unify-visual = 4/4 pass. Commit `030ceb4` (2026-05-08). | — |
| ~~B7~~ | ~~Manual QA 14/15 items Phase 1 (RESTRICT delete, unit conversions, dark mode toggle, restart persistence, ...)~~ | **CANCELLED** per cleanup commit `646aacc` Q3 (2026-04-29) — `phase-1-management.md` (chứa checklist 15 items) đã bị xoá có chủ đích. Code Phase 1 đang chạy production, được coi implicitly DONE; không tạo QA checklist formal. | — |
| ~~B8~~ ✅ DONE (v0.2.2) | ~~Test coverage ≥60% verify~~ | Resolved commit `3a9fd42` (2026-05-09): baseline **74.24% statements / 60% branches / 70% functions / 74.30% lines** (418/418 unit pass). `karma.conf.js` patched với `json-summary` + `lcovonly` reporters. Gap report: `docs/5-development/test-coverage-baseline.md` (risk-weighted gaps: 🔴 native-database.ts 44%, web-database.ts 59%; 🟠 dish-edit 55%, ingredient-edit 45%, management.page 49%). | — |
| ~~B9~~ | ~~Phase 1 Retro §8 + `docs/6-testing/phase-1-qa.md`~~ | **CANCELLED** per cleanup commit `646aacc` Q3 (2026-04-29) — không dùng phase-detail spec docs nữa; `development-plan.md` là roadmap-level duy nhất. Không có Retro formal. | — |

---

## §3 — Nhóm C: Phát hiện trong Phase 1.5B (F-02 AI auto-fill)

| Mã | Item | Lý do hoãn | Trigger nên làm |
|----|------|-----------|----------------|
| C1 | Giảm `maxOutputTokens` 8192 → 6144 trong `nutrition-ai.ts` autofillDish | Đo thực tế max ingredients ~13 (Bún bò Huế stress test), tiết kiệm cost Gemini ~25% per call | Khi tối ưu cost hoặc sau monitor production 1 tuần |
| C2 | WebView 147 SIGTRAP sporadic crash khi mở sheet AI lần đầu sau cold start | Đã document trong skill `mealplaning-emulator-fast-qa`; app tự restart, retry OK; chưa root-cause Chrome WebView | Khi Chrome WebView fix Android 16 hoặc dev decide skip WebView 147 |
| C3 | Tách "Thịt ba chỉ" vs "Thịt heo xay" trong AI prompt output | AI hiện gộp → "Thịt heo 150g" cho Bún chả; simplification acceptable | Khi user complaint về granularity hoặc khi nutrition cần tách rõ |
| C4 | Cache pantry list cho fuzzy match nếu pantry > 100 items | Hiện pantry nhỏ (~10-20), fuzzy match O(n×m) chấp nhận được | Khi user có > 100 ingredients trong pantry |
| C5 | Confidence threshold tuning cho badge "Cần xác nhận" | AI tự quyết, app chưa override; 7/7 món real test threshold AI = OK | Khi thấy noise hoặc miss thực tế trong production |
| C7 | Mockup-first workflow (D8) áp dụng từ Phase 1.5 trở đi | Phase 1 và 1.5B đã skip, không truy cứu | Phase 3 trở đi |

> Mã C6 (boy-scout prettier 4 files) đã DONE — xem §4.

---

## §3.1 — Nhóm D: Phát hiện trong Phase Settings (T10/T11 emulator QA, 2026-05-02; Settings từng là Phase 6 cũ, được reorder thành Phase 2 ngày 2026-05-07)

| Mã | Item | Lý do hoãn | Trigger nên làm |
|----|------|-----------|----------------|
| ~~D1~~ ✅ DONE (Story 2.2 + 2.5) | ~~Settings — POST_NOTIFICATIONS permission grant flow~~ | Resolved Story 2.2 (commit `ba0781b`). AndroidManifest POST_NOTIFICATIONS, capacitor.config.ts smallIcon → `ic_launcher_round`, toast guide, postsync script for `/android/` gitignore persistence. Story 2.5 added release-time hardening: build.gradle signing config + version sync guard + postsync extended. Resolved 2026-05-07 / 2026-05-08. | — |
| ~~D2~~ ✅ DONE (Story 2.4) | ~~Project-wide audit `styleUrl` trên page components~~ | Story 2.4 đã add `styleUrl` + empty `.scss` cho 6 components còn thiếu (`app.ts`, `calendar.page.ts`, `dashboard.page.ts`, `fitness.page.ts`, `form-field.ts`, `segmented-control.ts`) và tighten guard `check-pc1-external-templates.mjs` để require cả `templateUrl` + `styleUrl`. Resolved 2026-05-08. | — |
| ~~D3~~ ✅ DONE (Story 2.4) | ~~Activity label inconsistency giữa onboarding và Settings~~ | Story 2.4 introduce `core/services/profile/activity-label.ts` với canonical short labels parallel `Ít vận động / Vận động nhẹ / Vận động vừa / Vận động nặng`. Wired onboarding (long), settings hub + body-edit + activity-edit (short). Bracket TDEE row fixed (body-edit `· activityLabel`, activity-edit drops redundant). Resolved 2026-05-08. | — |
| D-UX-AUDIT-202605 | Settings UI/UX audit — 4 P2 nice-to-have findings | Audit Sally lens trên 4 màn Settings (hub/body/goals/activity) phát hiện 21 findings; 5 P0 + 12 P1 đã fold vào Stories 2.1/2.4/2.5 (epic-2 rev 2), riêng 4 P2 defer. **P2-1**: hub label `Cơ thể` → `Thông số cơ thể`. **P2-2**: hub `Calo 1946 kcal` dư đơn vị → đổi `Năng lượng` hoặc bỏ kcal value. **P2-3**: `Mục tiêu mới` mơ hồ → before/after (`~~1900~~ → 1946`) hoặc `Mục tiêu đề xuất`. **P2-4**: hub scroll dài → collapse nhóm `Nhắc nhở` thành 1 row → bottom-sheet. Source: `_bmad-output/implementation-artifacts/settings-uiux-audit.md` (commit `6dd6db5`). | Polish pass sau Phase 2 release, hoặc khi mở rộng Settings (vd thêm sub-page Privacy/Backup). Cosmetic only, không block ship. |
| ~~D-UX-AUDIT-202605 P2-1/2/3~~ ✅ DONE (v0.2.2) | ~~Settings hub copy: P2-1 + P2-2 + P2-3~~ | Resolved commit `3f8d3c1` (2026-05-09): "Cơ thể" → "Thông số cơ thể"; "Calo" → "Năng lượng" (bỏ duplicate "Calo NNN kcal"); "Mục tiêu mới" → "Mục tiêu đề xuất" ở body-edit + activity-edit preview. | — |
| C10 | P2-4: Settings hub `Nhắc nhở` collapse → bottom-sheet | Cosmetic only, scroll dài chỉ thành vấn đề khi user enable nhiều reminder type. Effort 30-45min cho 1 component refactor mới (bottom-sheet) không justified trong patch v0.2.2 (chỉ polish). Tách riêng để v0.2.2 stay pure polish. Source: D-UX-AUDIT-202605 P2-4. | Khi thêm Settings sub-pages (Privacy/Backup) hoặc khi user feedback scroll dài. |

---

## §4 — Done log

| Mã | Item | Done date | Commit / Decision | Ghi chú |
|----|------|-----------|-------------------|---------|
| C6 | Boy-scout prettier fixes 4 files (`schema-compatibility.ts`, `unit-resolver.ts`, `dish.store.ts`, `onboarding-calculation.ts`) | ≤ 2026-05-01 | (tree clean, không xác định commit cụ thể) | Verify: `git status` working tree clean |
| B4 | 5 mockup HTML files thiếu | 2026-04-29 | `646aacc` Q2 — CANCELLED | Phase-1 mockups xoá có chủ đích; source of truth = `design-system.md` + code |
| B5 | ADR-002 migration strategy doc | 2026-04-29 | `646aacc` Q1 — CANCELLED | Repo không dùng ADR pattern nữa |
| B7 | Manual QA 14/15 items Phase 1 | 2026-04-29 | `646aacc` Q3 — CANCELLED | `phase-1-management.md` xoá có chủ đích; code production = implicitly DONE |
| B9 | Phase 1 Retro §8 + `phase-1-qa.md` | 2026-04-29 | `646aacc` Q3 — CANCELLED | Không dùng phase-detail spec docs |
| B6 | E2E tool decision → Appium 2 + WDIO 9 + UiAutomator2 4 | 2026-05-08 | `030ceb4` + ADR-001 Accepted | Smoke + onboarding-persist + b3-form-unify-visual = 4/4 pass |
| B8 | Test coverage baseline | 2026-05-09 | `3a9fd42` | 74.24% stmts / 60% br / 70% fn / 74.30% lines; gap report `test-coverage-baseline.md` |
| B3 (Settings) | Settings forms unify to `<app-form-field>` | 2026-05-09 | `a64eacf` | body-edit + goals-edit; remaining = Phase 1 modals (ingredient-edit, dish-edit) |
| B1 | Sage cream `--bg-page` alignment cleanup | 2026-05-09 | `3f8d3c1` | `--ion-color-light-tint` `#fafaf7` → `#fbf7ef`; stale comment ref fixed |
| D-UX-AUDIT-202605 P2-1/2/3 | Settings hub copy polish (Thông số cơ thể / Năng lượng / Mục tiêu đề xuất) | 2026-05-09 | `3f8d3c1` | Live verified emulator-5554 v0.2.2; P2-4 spun off as C10 |

---

## §5 — Cách dùng file này

**Khi bắt đầu phase mới:**
- Lọc deferred items có trigger = phase đó → đưa vào plan của phase
- Update §4 Done log khi xong

**Khi phát hiện item mới trong session:**
- Append vào nhóm phù hợp (B nếu cross-phase, C nếu trong phase hiện tại)
- Mã tiếp theo: B10, B11... / C8, C9...
- Cập nhật `Last updated` ở header

**Khi đóng formal Phase 1:**
- Xử lý B4, B5, B6, B7, B8, B9 → di chuyển sang §4

**Khi review hàng quý:**
- Items đã > 3 tháng không trigger → reassess: vẫn cần? hay drop?

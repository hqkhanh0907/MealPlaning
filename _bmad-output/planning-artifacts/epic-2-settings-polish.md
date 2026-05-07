---
stepsCompleted: ['epic-2-drafted-2026-05-07', 'epic-2-uiux-audit-2026-05-07']
inputDocuments:
  - docs/2-requirements/prd.md (F-13 §13.1/13.2/13.3)
  - docs/5-development/development-plan.md (revision 1.5 — Phase 2 Settings & Polish)
  - docs/5-development/deferred-items.md (D1: POST_NOTIFICATIONS permission flow; D2: styleUrl audit; D3: activity label inconsistency)
  - src/app/features/settings/** (current ship state)
  - src/app/core/services/notifications/local-notifications.ts
  - src/app/core/services/theme/theme-service.ts
  - _bmad-output/implementation-artifacts/settings-uiux-audit.md (21 findings: 5 P0, 12 P1, 4 P2)
epic: 2
phase: 2
status: draft
ownerLanguage: vi
revision: 2
revisionNote: |
  Rev 2 (2026-05-07): Sau khi chạy UI/UX audit toàn bộ Settings (4 màn light mode, Sally + ionic-ui-pixel-verification),
  fold 4 P0 inconsistency vào Story 2.1 (P0-2 goal label, P0-4 selected card color) và
  Story 2.4 (P0-1/3/5 activity label normalization sweep + P1-13 parallel naming).
  Story 2.5 expand thành "Release prep + Phase 2 polish pass" gộp 12 P1 findings (typography tier,
  section spacing, sticky button, button color align brand). Tổng estimate epic tăng từ 5–8 ngày
  lên 6–9 ngày (≈+1 ngày — Story 2.4: 0.5→1, Story 2.1: 0.5→0.75, Story 2.5: 2→2.5).
---

# HealthMate AI — Epic 2: Settings & Polish

> **Phase 2** trong roadmap revision 1.5 (2026-05-07). Settings được đẩy lên trước Calendar/Tracking để (a) finish notification permission flow đang stuck ở D1, (b) cung cấp NotificationService stable cho Phase 3 dùng lại, (c) gom release prep (icon, splash, signed APK) trước khi mở phase code-heavy. Đây là **polish + harden + close gap**, không phải build mới from scratch — Settings đã ship ~80% UI + service layer.

---

## Overview

Phase 2 hoàn tất F-13 (Settings) ở mức production-ready và đóng các deferred item D1/D2/D3, đồng thời chuẩn bị release foundation (signed APK, app icon/splash, version bump policy). Sau Phase 2, Settings được coi là **frozen** cho V1; Phase 3 chỉ wire lại `NotificationService` cho calendar reminders mà không sửa Settings logic.

## Requirements Inventory

### Functional Requirements (từ PRD F-13)

| FR | Mô tả | Trạng thái hiện tại |
|----|-------|---------------------|
| F-13.1 | Profile & Goals editor (height, weight, age, sex, goal, activity, target calo/protein/carbs/fat optional) | ✅ 80% — `body-edit`, `goals-edit`, `activity-edit` đã ship; carbs/fat optional fields **chưa expose** trong UI |
| F-13.2 | Push notifications: 4 slot (morning, lunch, evening, weekly) — toggle bật/tắt riêng | ⚠️ 70% — UI toggle + `NotificationService.reconcile()` đã ship; **D1 permission grant flow chưa wire** → emulator báo "Notifications not enabled" |
| F-13.3 | Theme: Light / Dark / System | ✅ 90% — `ThemeService.apply()` ship, radio group ở settings hub; chưa có visual smoke test "không flash khi switch" |

### Non-Functional Requirements

- **NFR-PERF-01**: Toggle theme < 100ms perceived (no white flash on radio change)
- **NFR-PERF-02**: Notification reconcile < 500ms khi bật/tắt 1 slot
- **NFR-A11Y-01**: Toggle + radio đạt min touch target 44×44dp
- **NFR-RELIABILITY-01**: Notification flags persist qua app restart + qua reboot device
- **NFR-RELEASE-01**: Signed APK build reproducible, version bump theo SemVer trong `package.json` + `android/app/build.gradle`

### Additional Requirements (deferred items hấp thụ vào Phase 2)

- **D1** — POST_NOTIFICATIONS permission flow (commit `5c65e83` follow-up)
- **D2** — Project-wide `styleUrl` audit (PC-1 guard tighten)
- **D3** — Activity label inconsistency Settings vs Onboarding ("Vừa" vs "Trung bình (3-5 ngày/tuần)")
- **Release prep** — App icon adaptive, splash screen, internal testing track

### UX Design Requirements

- Settings hub layout đã match `design-system.md` §8 list pattern; không redesign trong Phase 2
- Mọi sub-page mới (nếu có) MUST dùng floating-label pattern §8.6
- Dark mode contrast verify ở tất cả 4 màn Settings (hub + 3 editors)

### FR Coverage Map

| FR / Item | Story | Verification |
|-----------|-------|--------------|
| F-13.1 (full profile incl. carbs/fat) | 2.1 | Manual edit → reload app → giá trị persist; daily targets tile cập nhật |
| F-13.2 + D1 (permission flow) | 2.2 | Bật toggle → system permission dialog → grant → notification fires đúng giờ trên emulator-5554 |
| F-13.3 (theme) | 2.3 | Switch 3 mode × 4 màn Settings + dashboard tab → no flash, contrast OK light/dark |
| D2 (styleUrl audit) | 2.4 | `npm run check:pc1` pass với guard tightened; tất cả page components có `styleUrl` |
| D3 (label) | 2.4 | Settings hub row khớp Onboarding step 3 wording |
| Release prep | 2.5 | `./gradlew assembleRelease` produce signed APK; install + smoke test trên real device |

---

## Epic List

- **Epic 2: Settings & Polish** — 5 stories, ước lượng **6–9 ngày dev** (rev 2: 2.1=0.75d + 2.2=1.5d + 2.3=1d + 2.4=1d + 2.5=2.5d)

---

## Epic 2: Settings & Polish

**Goal:** Hoàn thiện F-13 production-ready, đóng D1/D2/D3, build signed APK sẵn sàng Play Store internal testing. Sau Phase 2, Settings frozen cho V1 và `NotificationService` được Phase 3 reuse cho meal-time reminders dynamic.

**Done criteria (Epic-level):**
- [ ] Tất cả 5 stories đạt acceptance criteria
- [ ] `npm run check:guards` + `ng test` + `ionic build --prod` pass
- [ ] Signed APK install + smoke test trên emulator-5554 + 1 real device
- [ ] Notification fire thật ở emulator (không còn lỗi "Notifications not enabled")
- [ ] Dark mode QA pass cho 4 màn Settings + Dashboard + Management
- [ ] `deferred-items.md` đánh dấu D1/D2/D3 = DONE

---

### Story 2.1: Profile & Goals — expose carbs/fat + goal label normalize + selected-card color fix

**As a** user theo dõi macro chi tiết,
**I want** set mục tiêu carbs/fat (g/ngày) optional trong Settings → Mục tiêu, đồng thời các goal option và state visual nhất quán với onboarding,
**So that** F-04 Tracking ở Phase 3 có thể tính progress đầy đủ 4 macro, và user không bị confuse giữa "selected state" với "primary action".

**Scope expansion (từ `settings-uiux-audit.md` 2026-05-07):**
- **P0-2** — Goal label `Tăng sức mạnh` (onboarding) ↔ `Tăng hiệu suất` (goals-edit): chốt 1 wording.
- **P0-4** — Selected option card đang dùng nền cam trùng button LƯU primary → state vs action lẫn.

**Acceptance Criteria:**

**AC-1 (carbs/fat input).** **Given** user đang ở `goals-edit` page, **When** scroll xuống dưới input Protein, **Then** thấy 2 input optional "Carbs (g/ngày)" và "Fat (g/ngày)" với placeholder "Tự động" khi null.

**AC-2 (persist).** **Given** user nhập carbs = 250 và fat = 70, **When** bấm "Lưu", **Then** `profile.target_carbs_g = 250`, `profile.target_fat_g = 70` persist; reload app vẫn còn; daily targets tile ở settings hub hiển thị 4 dòng (calo/protein/carbs/fat).

**AC-3 (null vs zero).** **Given** user xoá input carbs (để trống), **When** bấm "Lưu", **Then** `target_carbs_g = null` (không phải 0); UI tile hiển thị "—" cho dòng Carbs.

**AC-4 (validation).** **Given** user nhập carbs = -10 hoặc carbs = 9999, **When** validate, **Then** form báo lỗi "Giá trị phải từ 0 đến 1000"; nút Lưu disabled.

**AC-5 (goal label parity — P0-2).** **Given** repo hiện tại, **When** so sánh wording 4 option goal giữa `onboarding/onboarding.page.html` (step 1) và `settings/goals-edit/goals-edit.page.html`, **Then** cả 2 màn dùng đúng cùng 4 string: `Giảm cân` / `Duy trì` / `Tăng cơ` / **`Tăng sức mạnh`** (chọn wording onboarding làm canonical vì gần PRD F-04 "strength" hơn).

**AC-6 (selected card color — P0-4).** **Given** user mở `goals-edit` và đã chọn 1 option, **When** nhìn vào card selected, **Then** card KHÔNG dùng nền màu trùng `--ion-color-secondary` (cam) của button LƯU; thay vào đó dùng accent xanh brand (border 2px `--ion-color-primary` + tint background 8% + icon ✓ bên phải) — verify bằng screenshot trước/sau, đồng thời selected-state KHÔNG bị nhầm là button.

**AC-7 (regression).** **Given** spec test goals-edit, **When** chạy `ng test --include='**/goals-edit*'`, **Then** pass: persist null vs number, validation range, goal enum value khớp `Goal` type trong `core/models`.

**Technical notes:**
- Schema có sẵn `target_carbs_g`, `target_fat_g` nullable (xem `schema.ts`)
- Reuse floating-label pattern; thêm 2 field vào `goals-edit.page.html` + form group
- Update `profile-store` setters nếu cần
- Goal label fix: grep `Tăng hiệu suất` toàn repo → replace `Tăng sức mạnh`; check `Goal` enum value (có thể là `'strength'` — không cần đổi enum, chỉ đổi label hiển thị)
- Selected card style: refactor SCSS `.goal-option--selected` từ fill cam → border + tint pattern; tham khảo design-system §8 list pattern
- **Activity label D3 KHÔNG fix ở story này** — chuyển sang Story 2.4 (label normalization sweep)
- Spec test extra: AC-5 có thể assert qua text snapshot template

**Estimate:** **0.75 ngày** (0.5 carbs/fat + 0.25 goal label + selected card color)

---

### Story 2.2: Notification permission grant flow (D1) + reconcile robustness

**As a** user bật toggle "Bữa trưa 12:00",
**I want** app xin quyền Notifications của Android nếu chưa có,
**So that** notification thực sự fire vào 12:00 trên thiết bị thay vì silently fail.

**Acceptance Criteria:**

**Given** app vừa cài lần đầu (chưa cấp quyền POST_NOTIFICATIONS),
**When** user bật toggle "Bữa sáng" lần đầu,
**Then** system permission dialog Android xuất hiện ("Allow HealthMate AI to send notifications?").

**Given** dialog hiện và user bấm "Allow",
**When** flow complete,
**Then** `NotificationService.reconcile()` schedule slot morning thành công; toggle giữ trạng thái ON; notification fire vào 7:30 sáng (test bằng `adb shell am broadcast` hoặc đợi).

**Given** dialog hiện và user bấm "Don't allow",
**When** permission denied,
**Then** toggle revert về OFF; toast hiện "Vui lòng bật quyền Notifications trong Cài đặt hệ thống để dùng nhắc nhở" với CTA "Mở cài đặt" → mở `Settings > Apps > HealthMate AI > Notifications`.

**Given** user đã từ chối permission, sau đó vào system settings bật lên,
**When** quay lại app và bật toggle,
**Then** không hiện dialog nữa (đã có quyền); reconcile thành công ngay.

**Given** 4 toggle đều ON,
**When** user kill app + reopen,
**Then** 4 notification vẫn schedule (verify bằng `adb shell dumpsys notification` hoặc fire-time arrival).

**Technical notes:**
- Wire `LocalNotifications.requestPermissions()` vào `onToggleChange` trước khi `reconcile()` khi đang OFF→ON và `flag` enabled count = 0 → 1
- Handle 3 states permission: `granted` / `denied` / `prompt` (Capacitor enum)
- Toast service đã có (xem `core/services/toast` nếu tồn tại) — nếu chưa, dùng `IonToastController`
- "Mở cài đặt" CTA: dùng `@capacitor/app` `App.openSettings()` (cần verify plugin có sẵn)
- Update `local-notifications.spec.ts` cover: granted + denied + already-granted paths
- Sau story: cập nhật `deferred-items.md` D1 → DONE

**Estimate:** 1.5 ngày (bao gồm emulator verify + real-device verify)

---

### Story 2.3: Theme switch — no-flash + dark mode QA pass 4 màn

**As a** user dùng dark mode buổi tối,
**I want** chuyển theme (Sáng / Tối / Hệ thống) không bị flash trắng và mọi màn Settings hiển thị đúng contrast,
**So that** trải nghiệm consistent và không chói mắt.

**Acceptance Criteria:**

**Given** user ở Settings với theme = Light,
**When** chọn radio "Tối",
**Then** background chuyển sang dark trong cùng frame (no white flash > 16ms); `data-theme="dark"` set trên `<html>`; chrome status bar match.

**Given** theme = System và OS đang dark,
**When** mở app,
**Then** `<html>` không có `data-theme` attribute; CSS `@media (prefers-color-scheme: dark)` apply; Settings hub hiển thị dark.

**Given** theme = System,
**When** OS toggle dark/light qua `adb shell cmd uimode night yes/no` + force-stop app,
**Then** sau khi reopen, theme match OS state.

**Given** mỗi 4 màn (Settings hub, body-edit, goals-edit, activity-edit),
**When** view ở dark mode,
**Then** mọi text contrast ≥ 4.5:1 với background; mọi token color resolve đúng dark variant; không có raw `#fff` / `white` leak (verified bởi `check:design-tokens` guard).

**Technical notes:**
- Audit `_dark-mode.scss` cho 4 page scss; thêm overrides nếu thiếu
- Verify bằng `mealplaning-emulator-fast-qa` skill — Pitfall 12 sequence (light + dark + force-stop)
- Visual smoke test: screenshot 4 màn × 2 mode = 8 screenshot cho QA evidence
- No-flash: dùng `transition: background-color 150ms` trên `:root` hoặc apply `data-theme` synchronously trước first paint
- Spec test: `theme-service.spec.ts` cover 3 mode switch + system mode attribute removal

**Estimate:** 1 ngày (chủ yếu QA visual)

---

### Story 2.4: PC-1 styleUrl audit + Activity label normalization sweep (D2 + D3 + audit findings)

**As a** maintainer giữ convention nhất quán + user không bị nhầm lẫn nhãn,
**I want** mọi page component có `styleUrl`, `check:pc1` guard catch missing, đồng thời mọi nơi hiển thị "activity level" dùng cùng 1 string thống nhất qua centralized formatter,
**So that** không drift convention khi thêm page mới ở Phase 3, và user không thấy 3 wording khác nhau cho cùng 1 lựa chọn.

**Scope expansion (từ `settings-uiux-audit.md` 2026-05-07):**
- **P0-1** — Activity dùng 3 wording: hub `Vừa` / Body Edit `Trung bình (3-5 ngày/tuần)` / Activity Edit `Vừa` + sub `Tập vừa 3–5 buổi/tuần` / onboarding `Trung bình (3-5 ngày/tuần)`.
- **P0-3** — Body Edit TDEE label `(Trung bình (3-5 ngày/tuần))` ngoặc lồng nhau, wrap 2 dòng.
- **P0-5** — Activity Edit TDEE row có `(Vừa)` redundant (user vừa chọn ở card phía trên).
- **P1-13** — Option names KHÔNG parallel (`Ít vận động` vs `Nhẹ/Vừa/Nặng`).

**Acceptance Criteria:**

**AC-1 (PC-1 audit).** **Given** repo hiện tại, **When** chạy script audit list page components không có `styleUrl`, **Then** danh sách được liệt kê (settings hub, calendar/dashboard/fitness stubs, etc.).

**AC-2 (PC-1 fix).** **Given** mỗi page component thiếu `styleUrl`, **When** thêm `styleUrl: './foo.page.scss'` + tạo file `.scss` empty với 1 comment header `// Styles for foo page`, **Then** PC-1 guard pass; component render không thay đổi.

**AC-3 (PC-1 guard tighten).** **Given** `scripts/check-pc1-external-templates.mjs`, **When** tighten logic để require `styleUrl` (không chỉ check absence of inline `styles:`), **Then** thêm test fixture: component không có `styleUrl` → guard fail với message rõ ràng.

**AC-4 (activity label canonical — P0-1).** **Given** task tạo `core/pipes/activity-label.pipe.ts` với hàm `activityLabel(value: ActivityLevel): { short: string; long: string }`, **When** apply 4 enum value `sedentary / light / moderate / heavy`, **Then** output:
| Enum | short | long |
|---|---|---|
| sedentary | `Ít vận động` | `Ít vận động (ngồi nhiều)` |
| light | `Vận động nhẹ` | `Nhẹ (1-3 ngày/tuần)` |
| moderate | `Vận động vừa` | `Trung bình (3-5 ngày/tuần)` |
| heavy | `Vận động nặng` | `Nặng (6-7 ngày/tuần)` |

(Drop alias `Vừa` — chuẩn hóa thành `Vận động vừa`. Onboarding chọn level → hiển thị `long`. Hub row hiển thị `short`. Editor option card hiển thị `short` + sub-text mô tả frequency riêng.)

**AC-5 (parity 4 màn — P0-1).** **Given** apply pipe, **When** uiautomator dump 4 màn (onboarding step 3, settings hub, body-edit, activity-edit), **Then** mọi nơi nhắc activity level đều dùng đúng 1 trong 8 string trong bảng AC-4. Không còn chuỗi `Vừa` đơn lẻ ngoài context "Vận động vừa".

**AC-6 (Body Edit TDEE bracket fix — P0-3).** **Given** user xem TDEE row trong `body-edit`, **When** render, **Then** format `TDEE 2446 kcal · Vận động vừa` (1 dòng, KHÔNG có ngoặc lồng `((...))`); width fit trong card không wrap 2 dòng (verify bounds height ≤ 80px).

**AC-7 (Activity Edit redundant — P0-5).** **Given** user mở `activity-edit` đã có selection, **When** xem TDEE row, **Then** chỉ hiển thị `TDEE 2446 kcal` (drop suffix `(Vừa)`); nếu cần context chuyển xuống caption nhỏ bên dưới `Dựa trên: Vận động vừa`.

**AC-8 (parallel naming — P1-13).** **Given** activity-edit option cards, **When** render 4 cards, **Then** title parallel structure: `Ít vận động` / `Vận động nhẹ` / `Vận động vừa` / `Vận động nặng` (hoặc giữ short canonical `Ít / Nhẹ / Vừa / Nặng` đồng đều — chọn 1 trong 2 hướng, đảm bảo parallel).

**AC-9 (regression).** **Given** PR merge, **When** `npm run check:guards`, **Then** all 5 guards pass; `ng build --prod` pass; spec test pipe pass: `activityLabel('moderate').short === 'Vận động vừa'` etc.

**AC-10 (deferred-items closure).** **Given** D2 + D3 đã fix, **When** edit `docs/5-development/deferred-items.md`, **Then** D2 + D3 đánh dấu DONE với commit SHA reference.

**Technical notes:**
- Audit script PC-1 (one-shot, không cần keep): grep `@Component` blocks không match `styleUrl`
- Acceptable alternative PC-1: nếu có page genuine không cần styles, document escape hatch trong guard với comment marker (e.g. `// pc1-no-styles-needed: <reason>`)
- Activity pipe location: `src/app/core/pipes/activity-label.pipe.ts` — pure pipe, signal-friendly, no side effect
- Apply pipe ở 4 file template: `onboarding.page.html` (step 3), `settings.page.html` (row Hoạt động), `body-edit.page.html` (TDEE row), `activity-edit.page.html` (option cards + TDEE row)
- Touch enum constant nếu có: `ActivityLevel` ở `core/models/profile.types.ts` — KHÔNG đổi enum value, chỉ đổi display string
- Cập nhật `coding-conventions.md` §2.2 nếu PC-1 rule clarification cần
- Cross-reference với `settings-uiux-audit.md` AC-1/3/5/13 để verify pixel-perfect

**Estimate:** **1 ngày** (0.5 PC-1 + 0.5 label sweep — extend từ 0.5 lên 1 ngày)

---

### Story 2.5: Release prep + Phase 2 polish pass (P1 settings UX harden)

**As a** product owner muốn ship V1 với chất lượng polished,
**I want** signed APK build reproducible với app icon adaptive + splash screen branded + version policy + Settings UX polish layer (typography tier, section spacing, sticky button, button color align brand),
**So that** sẵn sàng upload Play Console internal testing track và Settings looks production-ready, không drift visually.

**Scope expansion (từ `settings-uiux-audit.md` 2026-05-07 — 12 P1 findings):**

Settings polish (gộp tất cả P1 còn lại sau khi 2.1 + 2.4 đã ăn 4 P0):
- **P1-1** Section caption tier (UPPERCASE 12px letter-spacing, color tertiary)
- **P1-2** Section spacing token chuẩn `--spacing-section: 24px`
- **P1-3** Hub hint `Chỉnh sửa ở mục Mục tiêu` reword + giảm tier
- **P1-4** Body Edit: gap Tuổi → Giới tính chuẩn hóa
- **P1-5** Body Edit: section Giới tính dùng pattern `picker-trigger--floating` hoặc grid 2-chip cùng `--bg-card`
- **P1-6** Body Edit: `Mục tiêu mới` block accent color (output user cần nhất)
- **P1-7** **Sticky button LƯU + đổi sang `--ion-color-primary` xanh brand** (không cam clash header)
- **P1-8** Goals Edit: bỏ section label `Mục tiêu` redundant
- **P1-9** Goals Edit: option cards compact (60px) hoặc chuyển sang `picker-trigger`
- **P1-10** Goals Edit: thêm separator/section header giữa nhóm Options ↔ Inputs
- **P1-11** Goals Edit: `RESET VỀ ĐỀ XUẤT` Title Case + text-button không viền (giảm visual weight)
- **P1-14** Activity Edit: thêm section header `Kết quả tính toán` trước nhóm BMR/TDEE/Mục tiêu

**Acceptance Criteria:**

**AC-1 (adaptive icon).** **Given** brand assets (logo + color palette từ `design-system.md`), **When** generate adaptive icon (foreground 432×432 + background color token), **Then** `android/app/src/main/res/mipmap-*` chứa đầy đủ density (mdpi → xxxhdpi); icon hiển thị đúng trên launcher emulator-5554.

**AC-2 (splash).** **Given** splash screen, **When** mở app cold start, **Then** splash hiển thị logo + brand color < 1 giây trước khi navigate vào first screen; không flash trắng.

**AC-3 (signed APK).** **Given** keystore production (tạo nếu chưa có, lưu path ngoài repo + document trong README local-only), **When** chạy `cd android && ./gradlew assembleRelease`, **Then** sinh `app-release.apk` signed; `apksigner verify` pass; install lên emulator-5554 thành công.

**AC-4 (version policy).** **Given** version policy, **When** document trong `docs/5-development/development-plan.md` hoặc README, **Then** ghi rõ: SemVer `MAJOR.MINOR.PATCH`, sync giữa `package.json:version` ↔ `android/app/build.gradle:versionName` ↔ `versionCode` (integer monotonic increment); script `npm run version:bump` (optional) hoặc manual checklist.

**AC-5 (smoke test signed APK).** **Given** smoke test, **When** install signed APK lên emulator + real device, **Then** onboarding → tabs flow OK; SQLite init OK; no crash trong 5 phút sử dụng cơ bản.

**AC-6 (P1-1 typography tier).** **Given** Settings hub, body-edit, goals-edit, activity-edit, **When** render section header, **Then** dùng class chung `.section-caption` (UPPERCASE 12px, letter-spacing 0.6, color `--text-tertiary`) phân tầng rõ với row label (16px regular). Token mới (nếu chưa có) thêm vào `src/theme/_typography.scss`.

**AC-7 (P1-2 section spacing).** **Given** 4 màn Settings, **When** measure gap giữa các section qua uiautomator bounds, **Then** mọi gap section = `--spacing-section: 24px` ± 4px (tolerance render). Không còn gap > 40px hoặc < 16px ngoài safe-area inset.

**AC-8 (P1-7 LƯU sticky + brand).** **Given** body-edit / goals-edit / activity-edit, **When** content dài hơn viewport, **Then** button LƯU sticky ở bottom với background blur/solid + subtle shadow phía trên + safe-area-inset-bottom padding; màu chuyển từ cam → `--ion-color-primary` (xanh brand).

**AC-9 (Goals Edit polish — P1-8/9/10/11).** **Given** goals-edit, **When** render, **Then**: (1) bỏ section label `Mục tiêu` trùng header; (2) 4 option cards compact ≤ 70px height hoặc dùng `picker-trigger--floating`; (3) có visual divider hoặc section caption `Chỉ số dinh dưỡng` giữa nhóm Options ↔ nhóm Inputs; (4) `RESET` Title Case không uppercase, text-button no border, align cùng grid với LƯU.

**AC-10 (Body Edit polish — P1-4/5/6).** **Given** body-edit, **When** render, **Then**: (1) gap Tuổi → Giới tính = `--spacing-section: 24px`; (2) section Giới tính dùng grid 2-chip cùng `--bg-card`+border floating-label hoặc `picker-trigger--floating`; (3) `Mục tiêu mới` tách thành block riêng với background `--bg-card-accent` + accent text color.

**AC-11 (Activity Edit polish — P1-14).** **Given** activity-edit, **When** render, **Then** thêm section caption `Kết quả tính toán` trước nhóm BMR/TDEE/Mục tiêu mới; spacing trên section caption = `--spacing-section`.

**AC-12 (visual regression evidence).** **Given** trước/sau implement, **When** chạy `mealplaning-emulator-fast-qa` capture 4 màn light, **Then** lưu screenshots vào `docs/qa-annotated/settings-phase2-after/` để compare với baseline `docs/qa-annotated/settings-uiux-audit/`. Cross-check 12 P1 finding đều resolved.

**AC-13 (Phase 2 exit).** **Given** complete, **When** edit `development-plan.md`, **Then** Phase 2 đánh dấu shipped với commit SHA range; `deferred-items.md` D1 + D2 + D3 = DONE.

**Technical notes:**
- Adaptive icon: dùng `@capacitor/assets` hoặc Android Studio Asset Studio
- Splash: Capacitor `@capacitor/splash-screen` plugin (verify đã có hoặc thêm)
- Keystore: **không commit**; document trong `docs/5-development/release-checklist.md` (file mới)
- Reproducibility: ghi Java version (21), Gradle version, AGP version
- Internal testing track upload là **out-of-scope** story này — chỉ cần APK ready
- Sticky button pattern: tham khảo `picker-trigger--floating` location pattern trong design-system §8
- Nếu workload polish > 1 ngày → split P1-4/5/6 (Body Edit) thành Story 2.6 riêng

**Estimate:** **2.5 ngày** (2 ngày release + 0.5 polish pass — nếu polish > 0.5 thì split Story 2.6)

---

## Phase 2 Exit Checklist

- [ ] Story 2.1–2.5 acceptance criteria đều ✅
- [ ] Manual QA: tất cả 4 màn Settings light + dark + system mode
- [ ] Manual QA: 4 notification slot fire đúng giờ trên emulator
- [ ] CI: `npm run check:guards` + `ng test` + `ionic build --prod` green
- [ ] APK signed install + smoke test trên emulator-5554 ≥ 5 phút không crash
- [ ] `deferred-items.md` D1, D2, D3 đánh dấu DONE với evidence link (commit SHA)
- [ ] `development-plan.md` Phase 2 section đánh dấu shipped + ghi commit SHA range
- [ ] `NotificationService` API documented (cho Phase 3 reuse): `requestPermission()`, `reconcile(flags)`, `cancelAll()`

## Out-of-Scope (Phase 2 không làm)

- ❌ Backup / Export dữ liệu (D5 / A4 — V2)
- ❌ Multi-profile / auth (architectural decision — không bao giờ trong V1)
- ❌ Custom notification time (chỉ 4 slot fixed time per PRD F-13.2)
- ❌ Localization khác Vietnamese (V2)
- ❌ Play Console internal testing upload (cần account riêng — task ngoài Phase)
- ❌ Calendar reminder dynamic (Phase 3 — sẽ wire `NotificationService` cho meal slot reminders)

## Dependencies

- ✅ Phase 1 Management shipped → profile store + DB migration system stable
- ✅ Phase 1.5B AI Foundation shipped → không block Phase 2
- ✅ `@capacitor/local-notifications@^8.0.2` installed
- ⚠️ Cần verify `@capacitor/app` plugin (cho `App.openSettings()`) — install nếu thiếu
- ⚠️ Cần verify `@capacitor/splash-screen` plugin — install nếu thiếu

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Permission denied UX gây user frustrate | Notifications không fire → user bỏ feature | Toast + CTA "Mở cài đặt" + onboarding hint sau Phase 2 |
| Keystore mất hoặc commit nhầm | Không update được app trên Play Store | Document local-only path + backup plan; `.gitignore` rule |
| Signed APK build reproducibility fail | Khó debug crash production | Pin Gradle/AGP/Java version trong README release |
| Dark mode contrast miss ở stub pages (calendar/dashboard/fitness) | Phase 3 inherit visual debt | Story 2.3 chỉ cover 4 màn Settings; stub pages defer cho Phase 3 mở chính thức |

---

**Next step sau Epic này:** Chạy `bmad-create-story` cho Story 2.1 (smallest, ít rủi ro nhất) hoặc Story 2.2 (highest value — đóng D1) để tạo story file chi tiết với tasks list cho Dev agent.

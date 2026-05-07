---
stepsCompleted: ['epic-2-drafted-2026-05-07']
inputDocuments:
  - docs/2-requirements/prd.md (F-13 §13.1/13.2/13.3)
  - docs/5-development/development-plan.md (revision 1.5 — Phase 2 Settings & Polish)
  - docs/5-development/deferred-items.md (D1: POST_NOTIFICATIONS permission flow; D2: styleUrl audit; D3: activity label inconsistency)
  - src/app/features/settings/** (current ship state)
  - src/app/core/services/notifications/local-notifications.ts
  - src/app/core/services/theme/theme-service.ts
epic: 2
phase: 2
status: draft
ownerLanguage: vi
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

- **Epic 2: Settings & Polish** — 5 stories, ước lượng 5–8 ngày dev (phụ thuộc release prep tooling sẵn sàng)

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

### Story 2.1: Profile & Goals — expose carbs/fat optional fields

**As a** user theo dõi macro chi tiết,
**I want** set mục tiêu carbs/fat (g/ngày) optional trong Settings → Mục tiêu,
**So that** F-04 Tracking ở Phase 3 có thể tính progress đầy đủ 4 macro (calo + protein + carbs + fat).

**Acceptance Criteria:**

**Given** user đang ở `goals-edit` page,
**When** scroll xuống dưới input Protein,
**Then** thấy 2 input optional "Carbs (g/ngày)" và "Fat (g/ngày)" với placeholder "Tự động" khi null.

**Given** user nhập carbs = 250 và fat = 70,
**When** bấm "Lưu",
**Then** `profile.target_carbs_g = 250`, `profile.target_fat_g = 70` persist; reload app vẫn còn; daily targets tile ở settings hub hiển thị 4 dòng (calo/protein/carbs/fat).

**Given** user xoá input carbs (để trống),
**When** bấm "Lưu",
**Then** `target_carbs_g = null` (không phải 0); UI tile hiển thị "—" cho dòng Carbs.

**Given** user nhập carbs = -10 hoặc carbs = 9999,
**When** validate,
**Then** form báo lỗi "Giá trị phải từ 0 đến 1000"; nút Lưu disabled.

**Technical notes:**
- Schema có sẵn `target_carbs_g`, `target_fat_g` nullable (xem `schema.ts`)
- Reuse floating-label pattern; thêm 2 field vào `goals-edit.page.html` + form group
- Update `profile-store` setters nếu cần
- Spec test: persist null vs number; validation range
- **D3 fix included**: align activity hub row label với onboarding wording — chuyển `goals-edit` summary từ "Vừa" → "Trung bình (3-5 ngày/tuần)" hoặc ngược lại (chọn short label cho row, full label cho editor)

**Estimate:** 0.5 ngày

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

### Story 2.4: PC-1 styleUrl audit + tighten guard (D2)

**As a** maintainer giữ convention nhất quán,
**I want** mọi page component có `styleUrl` (kể cả khi stylesheet rỗng) và `check:pc1` guard catch missing,
**So that** không drift convention khi thêm page mới ở Phase 3.

**Acceptance Criteria:**

**Given** repo hiện tại,
**When** chạy script audit list page components không có `styleUrl`,
**Then** danh sách được liệt kê (settings hub, calendar/dashboard/fitness stubs, etc.).

**Given** mỗi page component thiếu `styleUrl`,
**When** thêm `styleUrl: './foo.page.scss'` + tạo file `.scss` empty với 1 comment header `// Styles for foo page`,
**Then** PC-1 guard pass; component render không thay đổi.

**Given** `scripts/check-pc1-external-templates.mjs`,
**When** tighten logic để require `styleUrl` (không chỉ check absence of inline `styles:`),
**Then** thêm test fixture: component không có `styleUrl` → guard fail với message rõ ràng.

**Given** PR merge,
**When** `npm run check:guards`,
**Then** all 5 guards pass; `ng build --prod` pass.

**Technical notes:**
- Audit script (one-shot, không cần keep): grep `@Component` blocks không match `styleUrl`
- Acceptable alternative: nếu có page genuine không cần styles, document escape hatch trong guard với comment marker (e.g. `// pc1-no-styles-needed: <reason>`)
- Sau story: cập nhật `deferred-items.md` D2 → DONE
- Cập nhật `coding-conventions.md` §2.2 nếu rule clarification

**Estimate:** 0.5 ngày

---

### Story 2.5: Release prep — app icon, splash, signed APK, version policy

**As a** product owner muốn ship V1,
**I want** signed APK build reproducible với app icon adaptive + splash screen branded + version bump rule rõ ràng,
**So that** sẵn sàng upload lên Play Console internal testing track.

**Acceptance Criteria:**

**Given** brand assets (logo + color palette từ `design-system.md`),
**When** generate adaptive icon (foreground 432×432 + background color token),
**Then** `android/app/src/main/res/mipmap-*` chứa đầy đủ density (mdpi → xxxhdpi); icon hiển thị đúng trên launcher emulator-5554.

**Given** splash screen,
**When** mở app cold start,
**Then** splash hiển thị logo + brand color < 1 giây trước khi navigate vào first screen (onboarding hoặc tabs); không flash trắng.

**Given** keystore production (tạo nếu chưa có, lưu path ngoài repo + document trong README local-only),
**When** chạy `cd android && ./gradlew assembleRelease`,
**Then** sinh `app-release.apk` signed; `apksigner verify` pass; install lên emulator-5554 thành công.

**Given** version policy,
**When** document trong `docs/5-development/development-plan.md` hoặc README,
**Then** ghi rõ: SemVer `MAJOR.MINOR.PATCH`, sync giữa `package.json:version` ↔ `android/app/build.gradle:versionName` ↔ `versionCode` (integer monotonic increment); script `npm run version:bump` (optional) hoặc manual checklist.

**Given** smoke test,
**When** install signed APK lên emulator + real device,
**Then** onboarding → tabs flow OK; SQLite init OK; no crash trong 5 phút sử dụng cơ bản (add ingredient, edit goal, toggle theme, toggle notification).

**Technical notes:**
- Adaptive icon: dùng `@capacitor/assets` hoặc Android Studio Asset Studio
- Splash: Capacitor `@capacitor/splash-screen` plugin (verify đã có trong package.json hoặc thêm)
- Keystore: **không commit**; document trong `docs/5-development/release-checklist.md` (file mới)
- Reproducibility: ghi Java version (21), Gradle version, AGP version vào release notes
- Internal testing track upload là **out-of-scope** story này — chỉ cần APK ready; upload Play Console là task riêng khi user có account

**Estimate:** 2 ngày (icon design + keystore + first signed build thường tốn nhiều iteration)

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

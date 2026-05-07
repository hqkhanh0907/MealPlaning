---
auditDate: 2026-05-07
auditor: Sally (BMAD UX Designer) + ionic-ui-pixel-verification + qa-screenshot-annotation
scope: Settings — Hub + Body Edit + Goals Edit + Activity Edit
mode: light only (dark mode defer Story 2.3)
device: emulator-5554, density 420, 1080×2400
inputDocuments:
  - docs/2-requirements/prd.md (F-13)
  - docs/3-design/design-system.md (§8 list pattern, form-field.scss canonical)
  - docs/5-development/deferred-items.md (D3 activity label)
  - _bmad-output/planning-artifacts/epic-2-settings-polish.md
status: review-complete
---

# HealthMate AI — Settings UI/UX Audit (Phase 2)

> Mục đích: catch UX gap **trước khi** implement Story 2.1–2.5, để mỗi story biết chính xác phần UI cần sửa thay vì chỉ patch logic. Audit này thực hiện trên emulator-5554 với debug APK build từ commit `0644856`, navigate qua onboarding xong rồi vào Settings.

## Files

- 4 screenshots gốc: `/tmp/settings-qa/0{1..4}-*.png`
- 4 annotated red-box: `docs/qa-annotated/settings-uiux-audit/0{1..4}-*-annotated.png`
- 4 uiautomator XML dumps: `/tmp/settings-qa/0{1..4}-*.xml`

---

## Tóm tắt findings (21 issues)

| Priority | Count | Action |
|---|---|---|
| 🔴 **P0 — Block release / inconsistency rõ rệt** | 5 | Fix trong Phase 2, không defer |
| 🟡 **P1 — Polish quan trọng** | 12 | Fold vào Story 2.1/2.3/2.4 |
| 🟢 **P2 — Nice-to-have** | 4 | Defer hoặc Story 2.5 |

---

## 🔴 P0 — Inconsistency labels (block release)

### P0-1. Activity label dùng 3 wording khác nhau cho cùng 1 enum

| Vị trí | Hiển thị |
|---|---|
| Onboarding step 3 | `Trung bình (3-5 ngày/tuần)` |
| Settings hub row | **`Vừa`** ⚠️ |
| Body Edit TDEE | `2446 kcal (Trung bình (3-5 ngày/tuần))` ngoặc lồng |
| Activity Edit option | `Vừa` + sub `Tập vừa 3–5 buổi/tuần` |
| Activity Edit TDEE | `2446 kcal (Vừa)` |

**Bằng chứng:** uiautomator dump 4 màn (xem XML).
**Root cause:** chưa có centralized `activityLevelLabel(value)` formatter.
**Fix:** tạo `ActivityLabelPipe` trong `core/pipes/`, rule single-source: `Trung bình` (drop "Vừa" alias). Update onboarding để bỏ phần `(3-5 ngày/tuần)` trong main label, đẩy sang sub-text.
**Map sang story:** ✅ **Story 2.4** (đã có scope D3) — extend scope thành "centralized activity label formatter".

### P0-2. Goal label "Tăng sức mạnh" ↔ "Tăng hiệu suất"

| Onboarding step 1 | Goals Edit option 4 |
|---|---|
| `Tăng sức mạnh` | **`Tăng hiệu suất`** ⚠️ |

**Fix:** chốt 1 wording (đề xuất `Tăng sức mạnh` — gần PRD F-04 "strength" hơn) + apply cho cả 2 màn.
**Map sang story:** ✅ **Story 2.1** (đã touch goals-edit cho carbs/fat) — extend scope.

### P0-3. Body Edit — TDEE label ngoặc lồng nhau, wrap 2 dòng

`TDEE 2446 kcal (Trung bình (3-5 ngày/tuần))`

**Issue:** ngoặc trong ngoặc `((...))` rất rối; wrap 2 dòng phá rhythm card BMR/TDEE/Mục tiêu mới.
**Fix:** sau khi P0-1 chuẩn hóa pipe → output đơn giản `TDEE 2446 kcal · Trung bình`.
**Map:** Story 2.4 (chung với P0-1).

### P0-4. Goals Edit — selected card cam ĐÚNG màu primary CTA "LƯU"

Selected option (`Giảm cân`) dùng background `--ion-color-secondary` (cam terracotta) — trùng y hệt button **LƯU** primary action.

**Hệ quả:** user nhìn 4 cards có thể tưởng card cam là **button bấm để confirm**, không phải state.
**Fix:** đổi selected state sang accent xanh brand (đậm hơn nền) + thêm icon ✓, hoặc dùng border-only highlight thay vì fill cam.
**Map:** **Story 2.1** (đang sửa goals-edit).

### P0-5. Activity Edit — `(Vừa)` redundant trong TDEE row

`TDEE 2446 kcal (Vừa)` — user vừa tap chọn ở card phía trên có radio filled, lặp `(Vừa)` không add value.
**Fix:** drop suffix; nếu cần context dùng dòng caption bên dưới `Dựa trên: Trung bình`.
**Map:** **Story 2.4** (chung activity label refactor).

---

## 🟡 P1 — Polish (12 issues)

### Settings Hub
- **P1-1.** Section header (`Hồ sơ`, `Mục tiêu hằng ngày`, `Giao diện`, `Nhắc nhở`, `Giới thiệu`) cùng size/weight với row label → thiếu tier "section caption". Đề xuất: UPPERCASE 12px, letter-spacing 0.6, color `--text-tertiary`.
- **P1-2.** Gap giữa section "Hồ sơ" và "Mục tiêu hằng ngày" rộng bất thường so với gaps khác (rhythm lệch). Chuẩn hóa `--spacing-section: 24px`.
- **P1-3.** Hint `Chỉnh sửa ở mục Mục tiêu` lặp từ + cùng style với row → user dễ đọc nhầm là item bấm được. Reword `Sửa tại Mục tiêu hằng ngày` + giảm size 13px italic màu phụ.

### Body Edit
- **P1-4.** Gap input `Tuổi` → label `Giới tính` lớn hơn rõ rệt so với gap giữa 3 input trên → break vertical rhythm.
- **P1-5.** Section `Giới tính` dùng segmented buttons KHÔNG cùng floating-label pattern với 3 input phía trên → cảm giác 2 design system. Đề xuất: bọc trong `picker-trigger--floating` (canonical, đã có trong `ai-lookup-sheet`) hoặc grid 2 chip cùng `--bg-card` với border.
- **P1-6.** `Mục tiêu mới` (output user cần nhất) cùng visual weight với BMR/TDEE → khó scan. Tách block riêng accent color.
- **P1-7.** Button **LƯU** màu cam clash với header xanh brand + có vẻ KHÔNG sticky bottom → user phải scroll mới thấy. Đề xuất: đổi sang `--ion-color-primary` (xanh) + sticky với shadow phía trên.

### Goals Edit
- **P1-8.** Section label `Mục tiêu` trùng với title header → redundant. Bỏ hoặc đổi `Chọn mục tiêu của bạn`.
- **P1-9.** Option cards quá lớn (~80–90px mỗi card) chiếm gần nửa screen. Đề xuất: dùng `picker-trigger--floating` (1 row hiển thị goal hiện tại + bottom-sheet để đổi) hoặc compact list 60px.
- **P1-10.** Thiếu separator/section header giữa nhóm Options ↔ nhóm Inputs → mắt không phân biệt được 2 chức năng khác nhau.
- **P1-11.** Button `RESET VỀ ĐỀ XUẤT` uppercase clash với LƯU uppercase → cả 2 đều tỏ ra primary. Hạ visual weight RESET sang text-button không viền hoặc Title Case.
- **P1-12.** **Goals chỉ có Calo + Protein, thiếu Carbs + Fat** (PRD F-13.1 yêu cầu optional). → Đã có **Story 2.1** scope cho phần này.

### Activity Edit
- **P1-13** (gộp). Option names KHÔNG parallel: `Ít vận động` (3 từ) vs `Nhẹ/Vừa/Nặng` (1 từ). Đổi sang `Vận động ít / nhẹ / vừa / nặng` để parallel structure.
- **P1-14.** Spacing options group ↔ result group (BMR/TDEE) không có visual divider → 2 nhóm chức năng khác trộn lẫn.

---

## 🟢 P2 — Nice-to-have (4 issues)

- **P2-1.** Hub: label `Cơ thể` hơi cụt, nên `Thông số cơ thể`.
- **P2-2.** Hub: label `Calo 1946 kcal` dư đơn vị (nhãn "Calo" hàm ý kcal). Đổi `Năng lượng` hoặc giữ "Calo" + bỏ kcal phía value (dùng tabular numerals).
- **P2-3.** `Mục tiêu mới` — từ "mới" mơ hồ. Thêm before/after (`~~1900~~ → 1946`) hoặc đổi `Mục tiêu đề xuất`.
- **P2-4.** Hub: page khá dài (Hồ sơ + 4 nhắc nhở + Giao diện + Giới thiệu) → user phải scroll nhiều. Cân nhắc collapse `Nhắc nhở` thành 1 row → bottom-sheet.

---

## Mapping sang Stories Phase 2

| Story | Original scope | Audit findings cần fold |
|---|---|---|
| **2.1** Profile carbs/fat | F-13.1 carbs/fat input | + P0-2 (goal label) + P0-4 (selected card color) + P1-8/9/10/11 (goals layout) |
| **2.2** Notification permission (D1) | manifest + asset | (no change — ngoài scope UX audit) |
| **2.3** Theme no-flash | Light/dark switch QA | (audit này skip dark — defer cho Story 2.3 chạy QA dark riêng) |
| **2.4** PC-1 styleUrl + activity label | D2 + D3 | + P0-1 (3 wording) + P0-3 (TDEE bracket) + P0-5 (Vừa redundant) + P1-13 (parallel names) — extend story 2.4 thành "label normalization + activity formatter pipe" |
| **2.5** Release prep | Icon + signed APK | + P1-1 (section caption tier) + P1-2 (rhythm) + P1-7 (LƯU sticky+color) — coi như "Phase 2 polish pass" |
| **NEW Story 2.6**? | (optional) | Body Edit overhaul: P1-4/5/6 (gender pattern + Mục tiêu mới block) — nếu không nhét vào 2.5 |

---

## Recommendations cho Sprint Planning

### Bắt buộc trước khi Phase 2 exit (P0)
1. **Story 2.4 mở rộng** — không chỉ PC-1 styleUrl + 1 label D3, mà thành **"label normalization sweep"** (estimate +0.5 ngày): activity formatter pipe, goal label, drop redundant `(Vừa)`, fix TDEE bracket. → **Cập nhật `epic-2-settings-polish.md` story 2.4 description.**
2. **Story 2.1 mở rộng** — fold P0-4 (selected card color) vì đã touch goals-edit (estimate +0.25 ngày).

### Strongly recommended (P1)
3. **Story 2.5 → "Phase 2 polish pass"** — gom typography tier, section spacing, sticky button, button color align brand. Estimate giữ 2 ngày (đã đủ bandwidth).

### Defer (P2)
4. P2-1/2/3/4 → backlog `docs/5-development/deferred-items.md` mới mục `D-UX-AUDIT-202605`.

---

## Verification methodology

| Check | Tool | Status |
|---|---|---|
| Pixel bounds element | uiautomator dump XML | ✅ done |
| Visual hierarchy | vision_analyze GPT-4 | ✅ 4 màn |
| Cross-screen consistency | grep label trong dumps | ✅ 5 inconsistency confirmed |
| Touch target ≥44dp | bounds height check | ✅ pass (Nam/Nữ buttons 135px) |
| Annotation accuracy | vision_analyze trên annotated PNG | ✅ verify pass 2 (4/5 box hub + 5/5 còn lại sau fix) |
| Dark mode | (skip — Story 2.3 owns) | ⏸ deferred |

## Limitations

- Audit này KHÔNG kiểm tra:
  - Dark mode (per user choice — Story 2.3 sẽ chạy QA dark riêng)
  - Touch interaction feedback (haptic, ripple)
  - A11y screen reader (chỉ check touch target)
  - Notification UI (sẽ được verify trong Story 2.2)
- Không có A/B test data — finding base on heuristic + design-system reference.

---

## Annotated screenshots

- ![Settings Hub](../qa-annotated/settings-uiux-audit/01-settings-hub-annotated.png)
- ![Body Edit](../qa-annotated/settings-uiux-audit/02-body-edit-annotated.png)
- ![Goals Edit](../qa-annotated/settings-uiux-audit/03-goals-edit-annotated.png)
- ![Activity Edit](../qa-annotated/settings-uiux-audit/04-activity-edit-annotated.png)

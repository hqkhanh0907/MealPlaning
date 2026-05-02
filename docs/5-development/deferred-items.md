# Deferred Items — MealPlaning / HealthMate AI

**Status:** Living document
**Last updated:** 2026-05-01
**Owner:** Khanh Huynh (solo dev)

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
| A1 | F-02 acceptance #4: cascade delete dish khi đang nằm trong meal plan | Phase 2 | `planned_dish` table chưa tồn tại ở Phase 1 | `phase-1-management.md` |
| A2 | F-03 Calendar, F-04 Tracking | Phase 2 | Roadmap-level | `development-plan.md` |
| A3 | F-12 Dashboard đầy đủ (KPI cards, AI insights) | Phase 3 / 5 | Cần data từ tracking | `development-plan.md` |
| A4 | D5 Backup / Export dữ liệu | V2 | Out-of-scope V1 | `development-plan.md` |
| A5 | Dataset > 20 món Việt + snack dishes | V1.x / V2 | Seed scope giới hạn | `phase-1-management.md` |
| A6 | AI Insight Card real data | Phase 5 | Phase 3 chỉ placeholder | `development-plan.md` |
| A7 | Signal Forms migration Phase 1 forms sang `@angular/forms/signals` stable | Plan B2+ | Đợi unflag stable + plan có sẵn | `signal-forms-migration-plan.md` |
| A8 | `form-field.ts` error mode #3 (`[field]=` binding sau khi Signal Forms graduate) | Phase B2 | Đợi API stable | comment trong `src/app/shared/components/form-field/form-field.ts` |

---

## §2 — Nhóm B: Đã khoanh trong session, chưa vào docs

Các item phát hiện qua các session nhưng chưa có nơi track formal trước file này. Rủi ro cao bị lãng quên.

| Mã | Item | Lý do hoãn | Trigger / Phase dự kiến |
|----|------|-----------|-------------------------|
| B1 | Global `--bg-page` cream alignment `#fafaf7 → #F7F2EA` (Sage Wellness DNA) | Token-level đụng tất cả pages, cần cross-page contrast test cho cards/search bar/segment track | Task riêng "Sage global bg alignment" — trước khi mở Phase 2 nếu user yêu cầu visual consistency |
| B2 | Radio-circle 18px filled indicator trong onboarding | Code đang dùng 3-cue alternative (bg tint + check icon + bold label) — đã accessible đủ | Chỉ revisit khi user yêu cầu pixel-perfect mockup match |
| B3 | Unify form input style Phase 1 modals vs Onboarding (option A normalize floating-label, hoặc option B formalize compact variant trong design-system) | Quyết định giữa A vs B chưa chốt; cả hai đều cần effort medium | Trước khi Phase 2 mở thêm modal mới |
| B4 | 5 mockup HTML files thiếu (Phase 1 pre-flight debt) | Phase 1 đã implement code trước mockup — D8 rule deviation | Cleanup khi đóng formal Phase 1 |
| B5 | ADR-002 migration strategy doc chưa viết | Phase 1 pre-flight debt | Cleanup khi đóng formal Phase 1 |
| B6 | E2E tool decision (O2): Playwright / Cypress / Detox? | Plan nói quyết Phase 1, vẫn unresolved | Trước khi viết E2E tests đầu tiên |
| B7 | Manual QA 14/15 items Phase 1 (RESTRICT delete, unit conversions, dark mode toggle, restart persistence, ...) | Mới pass §5.2.8 smoke test | Đóng formal Phase 1 |
| B8 | Test coverage ≥60% verify | Chưa đo bằng `--code-coverage` | Đóng formal Phase 1 |
| B9 | Phase 1 Retro §8 + `docs/6-testing/phase-1-qa.md` | Phase 1 chưa formal close, doc still says "Status: Draft" | Đóng formal Phase 1 |

---

## §3 — Nhóm C: Phát hiện trong Phase 1.5B (F-02 AI auto-fill)

| Mã | Item | Lý do hoãn | Trigger nên làm |
|----|------|-----------|----------------|
| C1 | Giảm `maxOutputTokens` 8192 → 6144 trong `nutrition-ai.ts` autofillDish | Đo thực tế max ingredients ~13 (Bún bò Huế stress test), tiết kiệm cost Gemini ~25% per call | Khi tối ưu cost hoặc sau monitor production 1 tuần |
| C2 | WebView 147 SIGTRAP sporadic crash khi mở sheet AI lần đầu sau cold start | Đã document trong skill `mealplaning-emulator-fast-qa`; app tự restart, retry OK; chưa root-cause Chrome WebView | Khi Chrome WebView fix Android 16 hoặc dev decide skip WebView 147 |
| C3 | Tách "Thịt ba chỉ" vs "Thịt heo xay" trong AI prompt output | AI hiện gộp → "Thịt heo 150g" cho Bún chả; simplification acceptable | Khi user complaint về granularity hoặc khi nutrition cần tách rõ |
| C4 | Cache pantry list cho fuzzy match nếu pantry > 100 items | Hiện pantry nhỏ (~10-20), fuzzy match O(n×m) chấp nhận được | Khi user có > 100 ingredients trong pantry |
| C5 | Confidence threshold tuning cho badge "Cần xác nhận" | AI tự quyết, app chưa override; 7/7 món real test threshold AI = OK | Khi thấy noise hoặc miss thực tế trong production |
| C7 | Mockup-first workflow (D8) áp dụng từ Phase 1.5 trở đi | Phase 1 và 1.5B đã skip, không truy cứu | Phase 2 trở đi |

> Mã C6 (boy-scout prettier 4 files) đã DONE — xem §4.

---

## §4 — Done log

| Mã | Item | Done date | Commit | Ghi chú |
|----|------|-----------|--------|---------|
| C6 | Boy-scout prettier fixes 4 files (`schema-compatibility.ts`, `unit-resolver.ts`, `dish.store.ts`, `onboarding-calculation.ts`) | ≤ 2026-05-01 | (tree clean, không xác định commit cụ thể) | Verify: `git status` working tree clean |

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

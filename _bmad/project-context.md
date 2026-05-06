# Project Context — MealPlaning (HealthMate AI)

> **Đây là file thủ công, KHÔNG generate bằng `bmad-generate-project-context`.**
> Project đã có context source-of-truth ổn định ở `CLAUDE.md` + 6 doc canonical.
> File này chỉ là **bridge** để các agent BMAD (Mary, John, Winston, Sally, Amelia, Paige)
> biết phải đọc đâu trước khi làm việc.

## 1. Tóm tắt nhanh

- **Tên:** HealthMate AI (codename `MealPlaning`)
- **Loại:** Mobile app, Android-only, offline-first, single-user
- **Stack:** Angular 21 + Ionic 8 + Capacitor 8 + SQLite (sql.js / @capacitor-community/sqlite)
- **AI:** Google Gemini (dish/recipe autofill)
- **Ngôn ngữ UI:** Tiếng Việt (xưng "bạn", KHÔNG có `display_name`)
- **Trạng thái:** Phase 1 (management) implicit DONE; phase tiếp theo TBD

## 2. Source-of-truth (đọc theo thứ tự này)

Mọi agent BMAD trước khi đề xuất / viết code / viết doc **phải** đọc các file dưới đây:

| Ưu tiên | File | Vai trò |
|---|---|---|
| 1 | `CLAUDE.md` | Build commands, prerequisites, conventions, 5 CI guards |
| 2 | `docs/2-requirements/prd.md` | Product requirements canonical |
| 3 | `docs/3-design/data-model.md` | Schema SQLite, decision design (no-user-name, 100g canonical, dish-first) |
| 4 | `docs/3-design/business-rules.md` | Business logic rules |
| 5 | `docs/3-design/design-system.md` | Token màu/typography v2025, component patterns |
| 6 | `docs/4-architecture/architecture.md` | Architecture overview, layering |
| 7 | `docs/4-architecture/coding-conventions.md` | PC-1 (external template), naming, etc. |
| 8 | `docs/5-development/development-plan.md` | Phase plan |
| 9 | `docs/5-development/deferred-items.md` | Backlog defer |

> Không có ADR / phase-spec / phase-QA — đã cleanup trong commit `646aacc`.

## 3. CI guards bắt buộc (5 cái)

Mọi commit code đều phải pass 5 guards (Husky pre-commit + CI):

1. `npm run check:form-pattern` — floating-label markup canonical
2. `npm run check:pc1` — components dùng external templateUrl + styleUrl
3. `npm run check:style-2025` — không còn naming Style 2016
4. `npm run check:design-tokens` — color/bg/font-size dùng token, không hardcode
5. `npm run check:macro-naming` — BEM 2-level, không vi phạm naming

Chạy hết 1 phát: `npm run check:guards`

## 4. Commit pattern bắt buộc

```bash
# multi-line tiếng Việt — đọc message từ file để giữ ký tự đặc biệt
cat > /tmp/msg.txt <<'EOF'
type(scope): subject

Body...
EOF

git add <files>
git -c commit.gpgsign=false commit -F /tmp/msg.txt
```

- **Bắt buộc** `commit.gpgsign=false` (tránh GPG treo passphrase trong agent session).
- **Bắt buộc** `-F <file>` (giữ multi-line + Vietnamese + special chars).
- Tách commit theo concern, KHÔNG gộp 1 cục.

## 5. Quy ước Angular / TypeScript (rút gọn)

- Strict TypeScript, **no `any`**.
- Standalone components, KHÔNG NgModule.
- **PC-1 binary:** mọi component MUST dùng `templateUrl` + `styleUrl`. Inline cấm tuyệt đối.
- Signals (`signal/computed/effect`), Signal Forms ưu tiên.
- `inject()` everywhere; constructor DI deprecated.
- DB: snake_case columns, UUID v4 PK, 100g/100ml canonical, dish-first.

## 6. Môi trường

- Node 22 LTS, Java 21 LTS (`export JAVA_HOME=$(/usr/libexec/java_home -v 21)`).
- Android API 36 (compileSdk 36, minSdk 24).
- Python 3.11+ cho BMAD resolver (macOS default 3.9 fail tomllib — dùng `/opt/homebrew/bin/python3.13`).

## 7. Hướng dẫn cho BMAD agents

- **Mary (Analyst):** đọc `prd.md` + `business-rules.md` trước khi research.
- **John (PM):** dùng PRD hiện tại làm baseline, không đè.
- **Winston (Architect):** tuân thủ `architecture.md` + `coding-conventions.md`.
- **Sally (UX):** bám `design-system.md` v2025 tokens; mockup mới đặt vào `docs/3-design/mockups/`.
- **Amelia (Dev):**
  1. Đọc CLAUDE.md trước.
  2. Code phải pass 5 CI guards local TRƯỚC khi commit.
  3. Commit dùng pattern `git -c commit.gpgsign=false commit -F`.
  4. Test/build/install APK + manual UI verify trước khi claim done.
- **Paige (Tech Writer):** không tạo ADR / phase-spec mới; update doc canonical thay vì thêm doc mới.

## 8. Output folder

- Planning artifacts: `_bmad-output/planning-artifacts/`
- Implementation artifacts: `_bmad-output/implementation-artifacts/`
- Mọi output **commit vào git** (personal repo, không lo size).

---
_Last updated: 2026-05-06_ — manually written, do NOT regenerate.

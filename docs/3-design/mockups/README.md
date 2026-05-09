# Mockups (Spec)

Folder này lưu **HTML mockup pixel-perfect** cho từng feature trước khi vào implementation. Quy trình design Phase 3+ áp dụng **BMAD UX Designer** (skill `bmad-agent-ux-designer` + `bmad-create-ux-design`) — mỗi feature có spec markdown + bộ mockup HTML + design review trước khi code.

## Quy ước đặt tên

- `phase-<N>/<NN>-<screen-slug>.html` — mockup cho màn thuộc Phase N (theo `docs/5-development/development-plan.md`).
- Mỗi file render bằng cách mở trực tiếp trong Chrome; light theme only (Story 2.6 chốt single theme).
- Token kế thừa từ `src/theme/variables.scss` + `docs/3-design/design-system.md` (Sage Wellness DNA).

## Trạng thái hiện tại (2026-05-09)

**Phase 0 (Onboarding) + Phase 1 (Management) + Phase 2 (Settings) đã ship trong code.** Mockup HTML cũ của các phase này đã bị xoá khỏi repo (cleanup commit `<sẽ điền>`, 2026-05-09) — code trong `src/app/features/` + `design-system.md` + `business-rules.md` là **source of truth duy nhất**.

Lý do xoá:
- Mockup phase-1 không sync với code sau khi form-field unify, hero card macro naming, gram-only v6 schema (drift cao).
- `phase-0-onboarding.html` đã được implement đầy đủ.
- `settings-redesign.html` là legacy theme variant mâu thuẫn light-only Story 2.6.
- Color/typography/spacing exploration đã graduate vào `design-system.md` v1.2.

Lịch sử mockup vẫn truy được qua git history (`git log --diff-filter=D --name-only --follow -- 'docs/3-design/**/*.html'`).

## Phase 3+ design pipeline (BMAD)

Mỗi feature mới đi qua:

1. **UX spec** — `docs/3-design/specs/f<NN>-<feature>-spec.md` (user flow, screens, states, copy, edge cases) — generate qua `bmad-create-ux-design`
2. **HTML mockup** — `docs/3-design/mockups/phase-<N>/` — pixel-perfect Sage DNA, mọi screen + state (empty/loading/error/success)
3. **Design review** — `bmad-review-edge-case-hunter` + browser vision verify, lặp 1-2 round
4. **Architecture spec** — `bmad-create-architecture` cho shared platform
5. **Stories breakdown** — `bmad-create-epics-and-stories` reference mockup paths trong dev notes
6. **Readiness gate** — `bmad-check-implementation-readiness` trước khi vào code
7. **Implementation** — `bmad-dev-story` per story

## Spec phụ thuộc

- Token: `docs/3-design/design-system.md` + `src/theme/variables.scss`.
- Schema: `docs/3-design/data-model.md`.
- Business rule: `docs/4-architecture/business-rules.md`.
- Roadmap: `docs/5-development/development-plan.md`.

## Lưu ý drift

Nếu mockup mâu thuẫn với schema/code đã ship → **schema/code là source of truth**. Tạo task sync mockup hoặc xoá mockup nếu phase đã đóng. KHÔNG sửa code theo mockup outdated.

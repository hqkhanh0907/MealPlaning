# Story 2.3: Theme switch (no-flash) + dark mode QA pass 4 màn

Status: superseded

> **Status: superseded by Story 2.6 (commit `fcc7dd4`).**
>
> Story 2.3 shipped a no-flash dark-mode theme switch with QA pass on 4 màn (commit `605a438`, 2026-05-08). Two days later, per sprint-change proposal `_bmad-output/planning-artifacts/sprint-change-proposal-2026-05-08-remove-dark-mode.md`, dark mode itself was removed (Story 2.6, commit `fcc7dd4`). The pre-flash work is therefore historically valid but functionally obsolete: there is no longer a dark theme to flash from.
>
> This file is preserved for audit trail (per BMAD convention — superseded stories are kept, not deleted).

## Original story (preserved)

As **người dùng HealthMate AI**,
I want **chuyển dark/light mode mượt không flash**,
so that **trải nghiệm app premium, không bị giật khó chịu khi đổi theme**.

## Acceptance Criteria (historical)

1. Theme switch không flash white/black khi chuyển light ↔ dark.
2. QA pass 4 màn chính (Tổng quan, Lịch ăn, Quản lý, Cài đặt) under both themes.
3. `prefers-color-scheme` system pref respected on first launch.

## Outcome

- Shipped: commit `605a438` `feat(theme): no-flash transition + dark mode QA pass 4 màn (Story 2.3)`.
- Superseded: commit `fcc7dd4` Story 2.6 (light-only).
- Net code remaining in repo: **none** (all dark-mode CSS variables, `data-theme` attribute, and theme service implementation removed in Story 2.6).

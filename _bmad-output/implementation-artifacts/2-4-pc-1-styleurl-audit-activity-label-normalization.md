# Story 2.4: PC-1 `styleUrl` audit + activity label normalization

Status: done

> **Backfill note (2026-05-08):** Story file backfilled post-ship per investigation 2026-05-08 §G3 SSOT enforcement. Implementation shipped commit `23b9bd6` (`feat(convention): PC-1 styleUrl audit + activity label normalization (Story 2.4)`).

## Story

As **maintainer của HealthMate AI**,
I want **mọi `@Component` trong `src/` đều có cả `templateUrl` và `styleUrl` external (PC-1 binary rule), và label "mức vận động" nhất quán giữa onboarding và Settings**,
so that **convention enforcement uniform + UI labels consistent across surfaces**.

## Acceptance Criteria

1. **AC1 — PC-1 styleUrl audit.** 6 components còn thiếu `styleUrl` được fix: `app.ts`, `calendar.page.ts`, `dashboard.page.ts`, `fitness.page.ts`, `form-field.ts`, `segmented-control.ts`. Mỗi component có file `.scss` empty placeholder.
2. **AC2 — Guard tighten.** `scripts/check-pc1-external-templates.mjs` updated: require **cả** `templateUrl` + `styleUrl` (trước đây chỉ require `templateUrl`).
3. **AC3 — Activity label normalize.** Service `core/services/profile/activity-label.ts` introduce canonical short labels (`Ít vận động / Vận động nhẹ / Vận động vừa / Vận động nặng`). Onboarding (long form) + Settings hub/body-edit/activity-edit (short form) wired qua service này.
4. **AC4 — Bracket TDEE row.** `body-edit` hiển thị `· activityLabel`, `activity-edit` drop redundant bracket.
5. **AC5 — Tests + guards green.** `npm run check:guards` PASS, `ng test` PASS.

## Evidence

- Commit: `23b9bd6` (2026-05-08).
- Closes deferred items D2 + D3 (xem `docs/5-development/deferred-items.md`).
- Source audit: 4 màn Settings emulator QA findings P0/P1.

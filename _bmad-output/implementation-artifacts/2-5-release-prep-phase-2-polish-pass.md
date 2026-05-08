# Story 2.5: Release prep + Phase 2 polish pass

Status: done

> **Backfill note (2026-05-08):** Story file backfilled post-ship per investigation 2026-05-08 §G3 SSOT enforcement. Implementation shipped commit `9ccca1b` (`feat(release): Story 2.5 — Phase 2 polish + release prep (v0.2.0)`).

## Story

As **release manager của HealthMate AI**,
I want **chốt v0.2.0 với release-time hardening (signing config + version sync guard + extended postsync) + Phase 2 polish pass**,
so that **build artefacts reproducible, version invariants enforced, và Phase 2 release ready**.

## Acceptance Criteria

1. **AC1 — Signing config.** `android/app/build.gradle` thêm proper signing config cho debug/release (KHÔNG hardcode keystore secrets).
2. **AC2 — Version sync guard.** `scripts/check-version-sync.mjs` enforce `package.json.version` ↔ `android/app/build.gradle versionName` ↔ `capacitor.config.ts`.
3. **AC3 — Extended postsync.** `scripts/postsync-android.mjs` mở rộng để cover thêm các manifest invariants (POST_NOTIFICATIONS, smallIcon, etc) — closes D1.
4. **AC4 — Phase 2 polish.** Cleanup các P1 còn lại từ Settings UI/UX audit (`settings-uiux-audit.md`).
5. **AC5 — Tests + guards green.** `npm run check:guards` PASS (5 guards + version-sync = 6), `ng test` PASS.

## Evidence

- Commit: `9ccca1b` (2026-05-08).
- Closes D1 (POST_NOTIFICATIONS hardening) per `docs/5-development/deferred-items.md`.
- Phase 2 exit version: **v0.2.0** (later bumped to v0.2.1 in Story 2.6).

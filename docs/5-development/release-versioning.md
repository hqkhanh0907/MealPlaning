# Release Versioning Policy

**Owner:** Build/Release · **Effective:** Story 2.5 (Phase 2 exit) · **Status:** Active

## Schema

`MAJOR.MINOR.PATCH` (SemVer 2.0.0) — pre-1.0 we ship as `0.MINOR.PATCH`.

| Segment | When to bump | Example |
|---|---|---|
| `MAJOR` | Breaking schema/onboarding/data-loss change | 1.0.0 → 2.0.0 |
| `MINOR` (Phase) | Each Phase milestone (Phase 2 = 0.2.0) | 0.1.x → 0.2.0 |
| `PATCH` | Bugfix/polish that doesn't add features | 0.2.0 → 0.2.1 |

## Sources of truth (kept in sync — guarded)

1. `package.json` → `version` (canonical, JS-side build metadata).
2. `android/app/build.gradle` → `versionName` (must equal `package.json#version`).
3. `android/app/build.gradle` → `versionCode` (monotonic integer; **+1 every build that ships off-device**, regardless of versionName change).

CI guard `scripts/check-version-sync.mjs` (wired into `npm run check:guards`) fails the build if (1) ≠ (2).

## Bump procedure

1. Decide segment to bump (MAJOR/MINOR/PATCH).
2. Edit `package.json#version` first.
3. Mirror into `android/app/build.gradle#versionName`.
4. Increment `versionCode` by exactly **1**.
5. `npm run check:guards` → must PASS (`✓ Version sync guard`).
6. Build signed APK (see `release-signing.md`).
7. Tag git: `vX.Y.Z` (annotated).

## Current

- `0.2.0` — Phase 2 exit (Settings polish + release prep). versionCode `2`.

## History

| Version | versionCode | Phase | Date | Notes |
|---|---|---|---|---|
| 0.1.0 | 1 | Phase 1 | 2026-04 | Initial onboarding + dashboard |
| 0.2.0 | 2 | Phase 2 | 2026-05 | Settings polish, notifications, release prep |

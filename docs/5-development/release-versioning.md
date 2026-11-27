# Release Versioning Policy

**Owner:** Build/Release · **Effective:** Story 2.5 (Phase 2 exit) · **Status:** Active

## Schema

`MAJOR.MINOR.PATCH` (SemVer 2.0.0) — pre-1.0 we ship as `0.MINOR.PATCH`.

| Segment | When to bump | Example |
|---|---|---|
| `MAJOR` | Breaking schema/onboarding/data-loss change | 1.0.0 → 2.0.0 |
| `MINOR` (Phase) | Each Phase milestone (Phase 2 = 0.2.0) | 0.1.x → 0.2.0 |
| `PATCH` | Bugfix/polish that doesn't add features | 0.2.0 → 0.2.1 |

## Sources of truth

`package.json#version` sets the Android version name.
`package.json#androidVersionCode` sets the Android version code.
Increase the code by one before distributing a new APK, even if the version name stays the same.

Capacitor sync copies both values to `android/app/build.gradle`.
`npm run check:version-sync` compares the generated Gradle values with `package.json`.

## Bump procedure

Run these steps before distribution:

1. Update `package.json#version` if the release name changes.
2. Increment `package.json#androidVersionCode` by one.
3. Run `npm run cap:sync -- android`.
4. Run `npm run check:guards`.
5. Build the signed APK as described in `release-signing.md`.
6. Add an annotated `vX.Y.Z` tag when the release name changes.

## Current

Workout version `0.3.0` uses Android version code `6`. The preceding `0.2.2` build uses code `5`.

## History

| Version | versionCode | Phase | Date | Notes |
|---|---|---|---|---|
| 0.1.0 | 1 | Phase 1 | 2026-04 | Initial onboarding + dashboard |
| 0.2.0 | 2 | Phase 2 | 2026-05 | Settings polish, notifications, release prep |
| 0.2.1 | 3 | Phase 2 patch | 2026-05 | Light-only cleanup and schema reset patch |
| 0.2.2 | 4 | Phase 2 patch | 2026-05 | Post-release polish and Story 4 foundation work |

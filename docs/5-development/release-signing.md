# Release Signing (Android)

**Owner:** Release · **Status:** Active · **Story:** 2.5 (AC-3)

This project uses **apksigner v2 + v3** (configured in `capacitor.config.ts` →
`android.buildOptions.signingType: 'apksigner'`). Debug builds use the standard
Android debug keystore. Release builds require the project's release keystore.

## One-time setup (per workstation)

```bash
# 1. Generate keystore (KEEP off-repo, back it up to encrypted storage).
keytool -genkey -v \
  -keystore $HOME/keystores/healthmate-ai-release.jks \
  -alias healthmate-ai \
  -keyalg RSA -keysize 4096 -validity 10000

# 2. Export env vars (add to ~/.zshrc / ~/.bashrc).
export HEALTHMATE_KEYSTORE=$HOME/keystores/healthmate-ai-release.jks
export HEALTHMATE_KEYSTORE_PASSWORD='<password>'
export HEALTHMATE_KEY_ALIAS=healthmate-ai
export HEALTHMATE_KEY_PASSWORD='<password>'
```

> **DO NOT** commit the keystore, keystore password, or key password to git.
> The `android/keystore.properties` file is git-ignored.

## Per-release build

```bash
# 1. Bump version per release-versioning.md.
# 2. Run the helper script (renders keystore.properties from env vars).
./scripts/release/build-signed-apk.sh

# Output: android/app/build/outputs/apk/release/app-release.apk
# Verify:
$ANDROID_SDK_ROOT/build-tools/<version>/apksigner verify --verbose \
  android/app/build/outputs/apk/release/app-release.apk
```

The script:
1. Asserts the env vars above are set.
2. Renders `android/keystore.properties` from the env (atomic write).
3. Runs `cd android && ./gradlew clean :app:assembleRelease`.
4. Removes `android/keystore.properties` after build (so it never lingers).
5. Prints SHA-256 fingerprint of the APK + APK size for the changelog entry.

## Verification gate (Story 2.5 AC-5)

After signing:

```bash
$ANDROID_SDK_ROOT/build-tools/<version>/apksigner verify \
  --print-certs \
  android/app/build/outputs/apk/release/app-release.apk
```

Must print `Verifies` and the cert fingerprint must match the one captured at
keystore creation time. Capture both in the release notes.

## Smoke test (Story 2.5 AC-5)

1. `adb install -r app-release.apk` to a real device or emulator.
2. Walk through: cold start → onboarding (or settings if profile exists) →
   change goal → save → reopen app → assert persistence.
3. Trigger a notification (toggle morning reminder) → wait 1 minute → assert
   it appears with the correct icon (Story 2.2 small icon validation).
4. Capture 3 screenshots: cold splash, settings hub, notification banner.
   Save under `docs/6-testing/screenshots/story-2.5/release-smoke/`.

## Rollback

If a signed APK ships with a regression: cut a `0.2.PATCH` per
`release-versioning.md`, bump versionCode by 1, re-sign with the SAME keystore.
Never reuse a versionCode.

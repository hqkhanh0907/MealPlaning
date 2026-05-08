#!/usr/bin/env bash
# Story 2.5 (AC-3) — render keystore.properties + build signed release APK.
# See docs/5-development/release-signing.md for full procedure.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROPS_FILE="$REPO_ROOT/android/keystore.properties"

cleanup() {
  if [[ -f "$PROPS_FILE" ]]; then
    rm -f "$PROPS_FILE"
    echo "🧹 Removed $PROPS_FILE (no plaintext credentials left on disk)."
  fi
}
trap cleanup EXIT

# 1. Validate env vars — fail fast, don't leak partial state.
required=(HEALTHMATE_KEYSTORE HEALTHMATE_KEYSTORE_PASSWORD HEALTHMATE_KEY_ALIAS HEALTHMATE_KEY_PASSWORD)
for v in "${required[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    echo "✗ Missing env var: $v" >&2
    echo "  See docs/5-development/release-signing.md §One-time setup." >&2
    exit 1
  fi
done

if [[ ! -f "$HEALTHMATE_KEYSTORE" ]]; then
  echo "✗ Keystore file not found: $HEALTHMATE_KEYSTORE" >&2
  exit 1
fi

# 2. Version sync gate (AC-4).
( cd "$REPO_ROOT" && npm run check:version-sync )

# 3. Render keystore.properties (atomic, mode 600).
umask 077
cat > "$PROPS_FILE" <<EOF
storeFile=$HEALTHMATE_KEYSTORE
storePassword=$HEALTHMATE_KEYSTORE_PASSWORD
keyAlias=$HEALTHMATE_KEY_ALIAS
keyPassword=$HEALTHMATE_KEY_PASSWORD
EOF

# 4. Build.
( cd "$REPO_ROOT" && npm run build:prod && npx cap sync android )
( cd "$REPO_ROOT/android" && ./gradlew --no-daemon clean :app:assembleRelease )

APK="$REPO_ROOT/android/app/build/outputs/apk/release/app-release.apk"
if [[ ! -f "$APK" ]]; then
  echo "✗ Expected APK not produced: $APK" >&2
  exit 1
fi

echo
echo "✓ Built signed APK: $APK"
echo "  Size: $(du -h "$APK" | cut -f1)"
echo "  SHA-256: $(shasum -a 256 "$APK" | awk '{print $1}')"
echo
echo "Next: verify with apksigner — see docs/5-development/release-signing.md."

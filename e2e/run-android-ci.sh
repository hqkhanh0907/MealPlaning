#!/usr/bin/env bash
set -euo pipefail

apk_path="$(realpath android/app/build/outputs/apk/debug/app-debug.apk)"
evidence_parent="${RUNNER_TEMP:-$(mktemp -d)}/mealplan-workout-acceptance"
export GUIDE_EVIDENCE_DIR="$evidence_parent/guides"
"${ADB:-adb}" -s "${ANDROID_SERIAL:?Select the test emulator}" install -r "$apk_path"
node e2e/exercise-guides/offline-tabs.mjs
node --import tsx e2e/exercise-guides/expected.cjs
node e2e/exercise-guides/flows.mjs
APK_PATH="$apk_path" OUTPUT_DIR="$evidence_parent/release" node e2e/workout-release/verify.mjs

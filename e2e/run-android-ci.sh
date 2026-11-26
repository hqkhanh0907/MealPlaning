#!/usr/bin/env bash
set -euo pipefail

adb install -r android/app/build/outputs/apk/debug/app-debug.apk
node e2e/exercise-guides/offline-tabs.mjs
node --import tsx e2e/exercise-guides/expected.cjs
node e2e/exercise-guides/flows.mjs

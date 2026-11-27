# Exercise guide checks on Android

Drives the debug APK on an emulator through the WebView DevTools socket.

1. Build and install the debug APK (`com.healthmate.ai`) on the emulator.
2. `node --import tsx e2e/exercise-guides/expected.cjs` writes the expected catalogue next to the scripts.
3. `ANDROID_SERIAL=emulator-5556 node e2e/exercise-guides/flows.mjs` runs one full workout offline.
4. `ANDROID_SERIAL=emulator-5556 node e2e/exercise-guides/sweep.mjs` opens every exercise guide offline.

Both scripts clear the app data and turn airplane mode on. Use a test emulator only.

On builds with an account screen, the scripts seed an offline test account in the emulator. They then complete onboarding. The test account fixture needs no server credentials.

Run the checks one at a time on each emulator. A failed check or an incomplete sweep returns a nonzero exit code.

Each run prints its evidence directory. The directory contains JSON results and a `shots/` folder. Set `GUIDE_EVIDENCE_DIR` to select a directory outside the repository.

Use `SHOTS` with a comma-separated list of exercise IDs to capture selected exercises. Use `ONLY` to check a subset. Set `RESUME=1` and reuse the evidence directory with the same APK and catalogue to continue a sweep.

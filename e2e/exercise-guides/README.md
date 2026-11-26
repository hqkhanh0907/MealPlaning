# Exercise guide checks on Android

Drives the debug APK on an emulator through the WebView DevTools socket.

1. Build and install the debug APK (`com.healthmate.ai`) on the emulator.
2. `node --import tsx e2e/exercise-guides/expected.cjs` writes the expected catalogue next to the scripts.
3. `ANDROID_SERIAL=emulator-5556 node e2e/exercise-guides/flows.mjs` runs one full workout offline.
4. `ANDROID_SERIAL=emulator-5556 node e2e/exercise-guides/sweep.mjs` opens every exercise guide offline.

Both scripts clear the app data and turn airplane mode on. Use a test emulator only.

On builds with an account screen, the scripts seed an offline test account in the emulator. They then complete onboarding. The test account fixture needs no server credentials.

Run the checks one at a time on each emulator. A failed check or an incomplete sweep returns a nonzero exit code.

The scripts write `flows-results.json`, `sweep-results.json`, and screenshots to `shots/`. Use `SHOTS` with a comma-separated list of exercise IDs to capture screenshots during the sweep. Use `ONLY` to check a subset. Use `RESUME=1` with the same APK to reuse successful rows from the same expected catalogue.

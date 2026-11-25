# Exercise guide checks on Android

Drives the debug APK on an emulator through the WebView DevTools socket.

1. Build and install the debug APK (`com.healthmate.ai`) on the emulator.
2. `node --import tsx e2e/exercise-guides/expected.cjs` writes the expected catalogue next to the scripts.
3. `ANDROID_SERIAL=emulator-5556 node e2e/exercise-guides/flows.mjs` runs one full workout offline.
4. `ANDROID_SERIAL=emulator-5556 node e2e/exercise-guides/sweep.mjs` opens every exercise guide offline.

Both scripts clear the app data and turn airplane mode on. Use a test emulator only.

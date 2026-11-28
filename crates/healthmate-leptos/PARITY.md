# Dashboard migration contract

The reference screen is `src/app/features/dashboard/dashboard.page.html`, its page controller, `DashboardStore`, `AiAvailability`, `AiOfflineBanner` and `AppFormField`. The existing Ionic shell still owns route caching, the toolbar, settings, scrolling and the tab bar. A Leptos handle renders into two stable elements inside the content and footer. The host supplies serializable display values from its existing stores and handles dispatched actions. Form edits reach the same store as capture, save and discard.

| Feature | Current behavior to retain | Regression evidence |
|---|---|---|
| Entry and retry | Refresh each time Ionic enters the page. Loading precedes error. Errors expose a retry button. | Host refresh tests and rendered state tests |
| Today | Show local date, logged kcal and planned kcal separately. Open the specific pending dish or the ordinary calendar. Add meal passes today's date. | Store fixtures, pending target captured from rendered state, modified-click check |
| Nutrition | Keep target wording. Render the four supplied macro rows only with nutrition data. Keep percentage, unit, color class and capped progress width. | Rendered macro tests |
| Insights | Prefer the current AI result over deterministic insight. Apply warning treatment and preserve the original CTA. Hide the card without either result. | Rendered insight tests |
| Streaks and weight | Preserve missing-value dashes, weekly display and provenance. Show the 80–120% explanation only where a streak exists. | Rendered state tests |
| Connectivity | Preserve offline banner, configuration errors, in-flight controls and live error messages. No network calls originate in this renderer. | Rendered availability tests |
| Photo review | Keep original capture identity, date and meal; edit by index, include/exclude, show uncertainty, validate names and grams, display host-formatted nutrition. | Rendered review and browser reactivity tests |
| Manual entry | Send the command to Angular. The existing host discards the photo only after successful navigation. | Existing page-controller test |
| Save and cancel | Disable during save as in the original. Preserve error recovery, footer grouping and toast behavior. | Rendered footer and host action tests |
| Focus and lifecycle | Retain input identity while typing. Explicit success commands focus the review/insight heading. Dispose releases both mounts. | Browser interaction tests |

## Scoped verification

Use Rust 1.100.1 and wasm-bindgen-cli 0.2.130. The browser test serves the repository's installed Ionic custom elements from localhost. It starts its own headless Chrome profile. Set `CHROME_BIN` for a nonstandard Chrome executable.

Run these commands from this crate. They keep generated files in ignored directories.

````sh
cargo test --locked
cargo clippy --locked --all-targets -- -D warnings
cargo clippy --locked --release --target wasm32-unknown-unknown -- -D warnings
cargo build --locked --release --target wasm32-unknown-unknown
wasm-bindgen --target web --out-name healthmate_dashboard --out-dir pkg target/wasm32-unknown-unknown/release/healthmate_leptos.wasm
node tests/browser.mjs
````

The browser uses the exported handle exactly as the Ionic host does. It checks focus, edits, checkbox events, routes, validation, state updates and teardown. The Android acceptance run remains a separate check of the packaged application.

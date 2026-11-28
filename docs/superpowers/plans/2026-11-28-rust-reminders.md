# Recurring notification policy in Rust

## Kết quả trên Android 17

Máy ảo dùng PIN và khởi động lại thật. Trước lần mở khóa đầu tiên, hệ thống chưa đặt lại hai báo thức. Sau khi mở khóa, Android đặt lại cả hai lịch trước khi mở Activity hoặc đổi giờ thử.

Khi ứng dụng vẫn đóng, Android đã phát Bữa tối trễ khoảng 59 giây và Tổng kết tuần trễ khoảng 140 giây. Cả hai có lịch kế tiếp. Lượt thử dùng đồng hồ của máy ảo để đến gần giờ phát. Đăng xuất An hủy lịch của An. Đăng nhập Bình với hồ sơ mới không làm xuất hiện lại các lịch đó.

## Call sites and regression criteria

| Entry                          | Original behavior                                                                                                                                                            | Acceptance                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| App visibility and cold launch | A visible native App calls ReminderCoordinator.refresh, including on first render. It checks current identity, profile and permission.                                       | Keep foreground orchestration, permission checks and generation checks across awaited operations. |
| Settings                       | Enabling a slot asks permission first. Dietary and weekly settings live in the account profile. The workout opt-in uses localStorage keyed by owner, or web in browser mode. | Preserve permission denial, opt-in isolation and the original profile writes.                     |
| Fitness                        | Seeding, plan changes and some workout changes may request a refresh when the current account has workout reminders enabled.                                                 | Query the active plan only when permission, profile and preference allow it.                      |
| Logout or missing profile      | Logout awaits account clearing, cancels managed reminders, then navigates. Signed-out and profileless refreshes also clear the schedule.                                     | An obsolete owner must never replace the current schedule after waiting.                          |
| Scheduling                     | Cancel eleven app-wide IDs before adding the current selection. Serialize calls and recover the queue after an operation fails.                                              | Use stable package IDs across accounts, deterministic ordering and the same cancellation subset.  |
| Android reboot                 | Capacitor LocalNotifications 8.0.2 restores saved notifications from its receiver. A later app launch reconciles against current preferences.                                | Keep plugin storage, receivers, permission APIs and exact-alarm behavior unchanged.               |
| Earlier Day lab                | The experimental Day adapter included an explicit second of zero. The production Angular schedule omits seconds.                                                             | Emit the production on/hour/minute/weekday/repeats structure exactly.                             |

## Android boundary

`LocalNotifications.reconcile` queues each replacement. Android loads `reminderPlan` from the shared local Wasm module. Web and builds without that export use the original TypeScript policy. Failed module loads may retry. A policy execution or plugin error rejects its own request and releases the queue for the next reconciliation.

The planner receives four numeric profile preferences, permission state, workout opt-in, and the weekday, rest flag and exercise count of each plan day. It receives no account identifier. The coordinator guards the in-flight operation with its request counter and current account identity. The planner returns the full managed ID set and the enabled plugin payloads. The adapter checks identity again after asynchronous planning and after cancellation.

| Notification  | ID              | Device-local recurrence                                            |
| ------------- | --------------- | ------------------------------------------------------------------ |
| Bữa sáng      | 101             | Every day at 07:30                                                 |
| Bữa trưa      | 102             | Every day at 12:00                                                 |
| Bữa tối       | 103             | Every day at 18:30                                                 |
| Tổng kết tuần | 104             | Sunday at 20:00                                                    |
| Nhắc buổi tập | 151 through 157 | At 17:30 on each eligible workout weekday, Sunday through Saturday |

The app checks on first render, visible `pageshow` and `visibilitychange`. Successful login reloads `/`. Settings clears notifications after sign-out and before reloading `/account`. Seeding, activating and editing a plan can reconcile workout reminders. After reboot, the plugin receiver checks that the Android user is unlocked before restoring the persisted schedule. The WebView does not participate in restoration. Delivery time remains subject to Android alarm scheduling.

## Verification

Run `cargo test --manifest-path crates/healthmate-domain/Cargo.toml --locked --test reminders` for pure Rust. Run `ng test --watch=false --browsers=ChromeHeadless --include='src/app/core/services/notifications/*.spec.ts'` for orchestration. After `node scripts/build-leptos.mjs`, run `ng test --configuration leptos-parity --watch=false --browsers=ChromeHeadless --include='src/app/core/services/notifications/reminders.parity.ts'` for the compiled Wasm boundary.

The browser comparison covers every dietary preference mask, both permission states, both workout opt-ins and the missing-profile case. The Android integration test in Chrome intercepts the Capacitor plugin methods. It verifies their arguments and ordering. The earlier reboot probe used a separate package and test IDs 17531–17533 at upcoming fixture times. This slice did not repeat device reboot delivery on an installed production APK.

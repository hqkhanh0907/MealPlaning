# Native dashboard read for the Capacitor candidate

## Kết quả khi tích hợp

`npm run android:leptos` dựng web, đồng bộ Capacitor, liên kết thư viện Rust cho bốn ABI và tạo APK. Trong bài thử Android 17, hai lần tải lại Tổng quan gọi thành công `MealPlanSync.dashboardSummary`. Cả hai kết quả trả đúng tài khoản và cùng 480 kcal đã ăn. Mức theo lịch là 1.100 kcal.

Codex Rescue tìm thấy sai khác khi cân nặng giảm từ 75,04 xuống 75,00 kg. JSON biến số âm được làm tròn về 0 thành số 0 dương. Lớp truyền dữ liệu giữ thêm dấu cho đúng trường hợp đó. Trên Android, giao diện Rust đã hiển thị đúng `-0 kg so với lần cân trước` như Angular.

Đã chạy fmt, Clippy và sáu bài kiểm Rust của cầu nối. Các ca JVM kiểm phiên khi đăng xuất, thu hồi và đổi tài khoản. Dữ liệu giữ nguyên qua nâng cấp APK. Bản thử dùng dữ liệu giả và chứng thư debug.

## Scope

The Leptos candidate currently receives display values from Angular. This slice adds a native read of the signed-in account's existing SQLite database. It does not change the default route, replace the app shell, create accounts, change schema, or migrate a database.

## Call sites

| Existing owner | Current behavior | Native candidate |
|---|---|---|
| DashboardStore.refresh | Six reads for the active local calendar date, with refresh-sequence guards. | Keep the sequence guard. Compare the returned ownerId with the current AccountSession before publishing. |
| MealPlanSyncPlugin.configure | Validates the account-specific database name and stores it with owner and generation in SessionVault. | Resolve the database directory using Android Context. Accept only the date from JavaScript. |
| WorkspaceStore | Opens the local Capacitor database using SQLCipher from the application's existing dependency. | Rust dynamically links that same SQLCipher library on Android, using a separate read-only connection. |
| SessionVault.whileCurrent | Rejects a signed-out or replaced session under the vault lock. A server revocation can update reason without rotating generation. | Capture the session before queueing. Read without the lock. Recheck identity/generation and reauthentication reason under the lock before resolving the call. |
| healthmate_store::dashboard::summary | Produces meal, weight, streak and training statistics from local data. | Call this actual function in a deferred read transaction on schema 13. Query the most recent completed workout's date and volume inside the same transaction. |
| Leptos dashboard host | Supplies formatted presentation, navigation, AI availability, pending requests and photo-edit state. | Keep these effects outside the database read. A raw snapshot is not the renderer DTO. |

## Regression criteria

1. Read two real schema-13 database files containing different sentinel workouts and meal data. Reject mismatched owner/database names and path-like inputs.
2. Return the last committed snapshot during a concurrent WAL write. After commit, observe the complete update. Never use immutable mode to read a live WAL.
3. Reject missing files, unsupported schema, invalid Gregorian dates and malformed database content. Preserve existing data and user_version on every path. Do not call open_account or initialize from the native query.
4. Retain offline access for the same existing local identity. Reject a cleared/replaced session and recorded server revocation, including transitions occurring between query and delivery.
5. Package the Rust shared library for the selected Android ABI. Verify it imports SQLite symbols from the same pinned SQLCipher AAR as Capacitor, exports the fully qualified JNI symbol and supports 16 KiB pages.

## Boundaries

The read returns stored data, including the active profile's personal measurements, only across the authenticated app bridge. Native errors contain neither account identifiers nor paths. Offline access does not renew a token. Android DOM, router, UI labels, network configuration, AI/photo drafts and native notification permissions are separate concerns.

`MealPlanSync.dashboardSummary({ date })` returns the existing summary fields `date`, `profile`, `totals`, `loggedTotals`, `streakDays`, `weight`, `pendingMeal`, `day` and `workout`. Rust adds `lastSession`, either null or an object containing `date` and `total_volume`. Java stamps `ownerId` from the current vault session under its final delivery lock. The native vault can switch accounts before Angular updates its in-memory identity. The host must match `reply.ownerId` against the current AccountSession and discard any mismatch before publishing. The host derives profile nutrient targets and formats the last-session label. An absent profile, weight, meal or completed workout remains distinguishable from a measured zero.

## Build and verification

Install Rust 1.100.1 and its target standard libraries for each selected ABI. Use Android NDK, Node 22 and a JDK with the `jar` command available. Run `node scripts/build-leptos-native.mjs` at the repository root. To build one ABI, append `--abi arm64-v8a`. The script finds the pinned SQLCipher AAR in Gradle's cache or downloads it from Maven Central. Supply `--aar <path>` for a local archive. The script verifies its SHA-256.

The default build writes four release libraries under `target/leptos-native/jniLibs/<abi>/`. Configure this JNI library directory as an Android main source set. Capacitor's SQLite dependency provides the SQLCipher library packaged in the APK. Register `crates/healthmate-capacitor/android-tests` as an Android unit-test source set.

Rust 1.100.1 and NDK r30 produced release libraries for arm64-v8a, armeabi-v7a, x86 and x86_64. Each library exported the JNI method and linked to `libsqlcipher.so`. Each imported SQLite symbol resolved against the provider for that ABI. All load segments of both libraries passed the 16 KiB alignment check.

Five Rust integration tests passed against SQLite on the host. They cover account isolation, snapshot consistency, missing or incompatible files, date validation and selection of the last completed workout. Three JVM tests passed against the actual Capacitor plugin and vault session type. They cover switch, sign-out, rotated generations, expired and revoked sessions, and the identity stamped on successful replies. Android installation, WebView delivery, and the signed APK require the application integration gate.

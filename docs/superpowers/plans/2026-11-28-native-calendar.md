# Read calendar days from the authenticated Capacitor database

## Call sites and risks

| Boundary                                        | Existing behavior                                                                                                                                     | Native acceptance                                                                                                                                                         |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DayPlanRepository.findByDate                    | Assembles one existing day, or returns null. A concurrent creation for that date takes precedence over the initial lookup.                            | Read one stored day with start equal to end. Preserve the repository's pending-create wait and reread its committed result.                                               |
| DayPlanRepository.findByDateRange               | Uses inclusive SQL BETWEEN and sorts dates ascending. Gaps produce no rows.                                                                           | Return only stored dates from one read transaction. An inverted range produces an empty list.                                                                             |
| CalendarStore.hydrateDayPlan                    | Calls getOrCreateForDate after a missing read. It checks the visible date and invalidation tick across awaits.                                        | Keep creation and its four slots in the existing write operation. Preserve stale-result guards and the live profile overlay.                                              |
| CalendarStore week view                         | Builds a grid and totals from stored days, and supplies empty calendar cells.                                                                         | Return raw nested rows. The host keeps its calendar layout and missing-day interpretation.                                                                                |
| Planning, yesterday copy, AI context, dashboard | Existing readers need the same IDs, nutrition, and null values. Writes can overlap a read.                                                            | Read under a SQLite snapshot inside the signed-in database. Wait for the relevant pending creation on the JavaScript side.                                                |
| Logged and planned items                        | Logged rows use stored nutrient snapshots. An old logged fiber value can be null. Planned rows use the current recipe totals divided by recipe yield. | Preserve raw nulls, effective fiber fallback, all five nutrients, fractional servings and original day and slot columns.                                                  |
| Ordering, deletion and undo                     | Slots follow position. Planned dishes use sort order, creation time and SQLite rowid as the final tie breaker. Undo restores a stored identity.       | Reuse the store's canonical SQL and retain the original IDs and ordering.                                                                                                 |
| Account selection and delivery                  | Native session, database binding and generation identify the workspace. A revocation can leave generation unchanged.                                  | Java accepts only dates, captures the vault before queueing, then validates the live vault under its delivery lock. The caller checks returned ownerId before publishing. |
| Missing or incompatible database                | The active schema comes from the production store. Native reading must never create a workspace.                                                      | Share the dashboard's read-only connection, account and flavor binding, schema check and transaction.                                                                     |

## Bridge contract

`MealPlanSync.calendarDays({start,end})` accepts two canonical Gregorian dates. A successful reply contains `ownerId`, `start`, `end` and `days`. Single-day reads pass the same date twice. An existing day without slots returns one row with an empty `meal_slots` array. A missing day returns an empty `days` array. The bridge accepts no caller-supplied owner or database.

Java resolves the database directory and captures the current SessionVault identity before queueing the query. Rust opens the matching account and flavor read-only. The schema check, list of existing dates and every nested meal query share one SQLite transaction. Planned dish records expose the same nineteen named columns as the repository. Java stamps the current vault owner immediately before resolving the result.

A stable expired session retains local access. A cleared session, replaced generation, changed reason or confirmed revocation rejects the read. The foreground caller must still verify the owner and request sequence before publishing. Use the existing repository path for noncanonical strings outside the bridge contract.

## Focused verification

Run `cargo test --manifest-path crates/healthmate-capacitor/Cargo.toml --locked --test calendar`. Four integration cases use real account databases. They cover distinct owners and flavors, gaps, reverse ranges, rejected dates, missing files, schema mismatch and isolation during concurrent WAL writes.

The nutrition fixture uses 150 g of a 100 kcal ingredient in a two-serving recipe. A planned portion of 1.5 servings yields 112.5 kcal. Changing the ingredient to 200 kcal updates that portion to 225 kcal. The logged snapshot stays at 101 kcal. The tests also exercise deletion, undo, stable ordering and omission of extra local columns.

Run `node scripts/build-leptos-native.mjs --abi arm64-v8a` for an Android ARM64 build. Release verification included the SQLCipher dependency, 16 KiB load alignment and the exported `Java_com_healthmate_ai_sync_MealPlanSyncPlugin_calendarDaysNative` symbol. Installed-app verification remains separate.
## Nghiệm thu Android 17

Hai đầu đọc xử lý cùng tệp SQLite. Toàn bộ trường của ngày, bốn bữa, các món, dinh dưỡng và thứ tự hàng đều khớp với repository TypeScript. Khoảng trống không tạo ngày mới. Khi mở Lịch ăn trên Android, WebView gọi phương thức native và nhận đúng chủ tài khoản.

Codex Rescue tái hiện một trường hợp khi chép tuần. Kết nối đọc thứ hai chưa thấy ngày mới trong giao dịch đang mở. Trong trường hợp này, repository đọc từ chính kết nối ghi. Phép kiểm đỏ đã tái hiện ngày bị thiếu. Sau khi sửa, cả đọc một ngày và đọc một khoảng đều thấy ngày trước khi giao dịch hoàn tất.

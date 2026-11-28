# Catalog management in Leptos

## Nghiệm thu Android 17

Hai bản đã tạo nguyên liệu có 110 kcal trên 100 g, rồi tạo món chứa 50 g nguyên liệu và hai phần ăn. Cả hai hiển thị 27,5 kcal mỗi phần. Hủy sửa khối lượng giữ nguyên 50 g. Bộ lọc yêu thích trả đúng một món.

SQLite native chặn xóa nguyên liệu còn dùng trong công thức. Xóa món trước sẽ xóa hàng liên kết. Sau đó cả hai giao diện cho phép xóa nguyên liệu. Với WebDatabase dùng sql.js, thao tác xuất dữ liệu có thể tắt kiểm tra khóa ngoại. Ca đối chứng cho thấy cả hai giao diện web có cùng hành vi này.

Bản APK cuối đã khôi phục khoảng trắng giữa tên nguyên liệu và trọng lượng. Nội dung, kích thước và vị trí dòng khớp. Một số nét chữ sau khoảng trắng lệch tối đa một pixel vật lý. Các trường nhập và giao dịch còn dùng Angular được liệt kê bên dưới.

## Entry points and acceptance

The existing five Angular routes remain the behavior oracle. The candidate retains the same paths, route parameters and unsaved-change guards.

| Interaction               | Existing behavior and acceptance criterion                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog tabs and search   | Query the active store. Preserve repository order, raw Vietnamese search terms, current category, and visible clear and retry actions.              |
| Empty/error/loading views | Announce Vietnamese status and errors. Preserve distinct search, category and truly empty states.                                                   |
| Create and select         | Navigate with the displayed record ID. Offer both dish creation modes, including the AI query parameter.                                            |
| Edit and delete           | Preserve the current recipe links, confirmed deletion, linked-item protection and the return route.                                                 |
| Ingredient entry          | Distinguish an empty optional nutrient from zero. Validate each upper bound and the combined macro limit. Show the first error on submission.       |
| Dish entry                | Preserve the single-line name, description, optional meal tag and servings. Calculate nutrient quantities from gram weights for each serving.       |
| Nested recipe items       | Address each row by local UUID. Cancel weight edits without changing the form. Keep recent ingredients, sort order and reference-protected deletes. |
| Save                      | Use existing transactional repository calls and await success before navigation. Preserve pending/error handling and unsaved changes.               |
| Favorite                  | The existing management page offers delete in its options. A favorite toggle is outside these five templates.                                       |
| Accessibility             | Preserve field labels, error IDs, loading announcements, item actions, focus on the first invalid field and focus on dismissing menus.              |

The Rust renderer consumes real account-store snapshots. Angular owns routing, the database, AI calls and the existing shared pickers and dialogs. An unavailable Wasm module selects the original page before rendering.

## Implemented boundary

The route module is `src/app/features/management/leptos/management.routes.ts`. All four editor routes retain the original unsaved-change guard. `dish/new?mode=ai` retains the original query handling.

`mountManagement(element, kind, json, dispatch)` accepts a single DOM root. The handle supports `update(json)`, idempotent `dispose()` and a final `free()`. Actions contain a type and string value. Row actions carry the displayed record ID. Recipe actions carry the local row UUID.

| Kind          | Input and responsibility                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| catalog       | The current tab, query, filter, create menu, loading and error state, categories and active store rows. Rust renders and filters in database order.     |
| ingredient    | Selected category, five optional nutrients and submission state. Rust renders floating labels and validates limits, including the combined macro limit. |
| dishNutrition | Servings, target and ordered recipe rows with grams and per-100-gram nutrients. Rust computes per-serving totals, ring and macro energy shares.         |
| dishItems     | The same draft, picker loading state and submitted item errors. Rust renders rows, empty states, accessible edit and delete actions.                    |

Angular retains the Ionic header, toolbar, save footer, confirmation dialogs, name controls and unsaved-change checks. The dish description, servings, meal-tag picker, gram modal, AI sheets and transactional save handlers still use their existing Angular implementations. The current management screens have no favorite toggle. Calendar owns the saved-dish filter.

## Evidence and repeatability

Run the focused Rust tests with `cargo test --manifest-path crates/healthmate-leptos/Cargo.toml --locked --lib management::`. Run `node scripts/build-leptos.mjs`, followed by `node crates/healthmate-leptos/src/management/browser-test.mjs target/leptos-web`, for interactive Wasm tests in Chrome.

Run `ng test --configuration leptos-parity --watch=false --browsers=ChromeHeadless --include='src/app/features/management/leptos/management.parity.ts'` for the five Angular and SQLite integration cases. One recipe uses 50 grams of a 110 kcal ingredient and yields two servings at 27.5 kcal each.

The original and candidate catalog screens retained an ingredient reference after deleting its dish on the existing sql.js WebDatabase. The installed sql.js disables foreign keys when the application exports its database. Both screens removed the reference when the test enabled foreign keys on that same connection before deletion. Native Android cascade behavior requires a device observation.

## Android acceptance scenario

| Route                                | Action                                                                                              | Expected outcome                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| /tabs/management/ingredient/new      | Enter Đậu so sánh, select Đậu & Hạt, set calories to 110 and protein to 10. Tap Lưu nguyên liệu.    | The catalog contains the ingredient.                                            |
| /tabs/management/ingredient/edit/:id | Open the saved row and change its protein value to 101. Tap Lưu thay đổi.                           | The form reports the 100 g upper bound and keeps the saved value.               |
| /tabs/management/dish/new            | Enter Món đậu and two servings. Select the ingredient. Enter 50 g in the weight sheet and tap Thêm. | The preview shows 27.5 kcal and Protein 2.5 g per serving.                      |
| /tabs/management/dish/edit/:id       | Open the saved recipe, change its gram draft, then cancel.                                          | The draft and persisted dish each retain 50 g.                                  |
| /tabs/management                     | Try deleting the ingredient while the recipe uses it.                                               | The dialog shows one reference. Xem món selects the dish tab.                   |
| /tabs/management                     | Delete the recipe, then reopen ingredient deletion.                                                 | On a connection enforcing foreign keys, the second dialog permits deletion.     |
| /tabs/management/dish/new?mode=ai    | Open Tạo món and select AI tự điền từ tên món.                                                      | The editor keeps the AI entry instruction and the current service availability. |

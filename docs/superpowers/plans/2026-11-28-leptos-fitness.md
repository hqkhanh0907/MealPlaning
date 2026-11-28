# Workout routes in Leptos

## Kết quả trên Android 17

Ghi 12,5 kg mỗi tay × 6 lần tạo một hiệp 150 kg. Tăng lên 8 lần trong lịch sử cập nhật tổng lên 200 kg và giữ mã hiệp. Tập lại tạo buổi mới, tham chiếu buổi gốc và bắt đầu với 0 hiệp. Hai hiệp plank lưu đúng 45 giây, mỗi hiệp không có lần lặp.

Khi so ảnh, nút Bắt đầu trong bộ đếm nghỉ lệch ngang. CSS trang đã ảnh hưởng đến thành phần Ionic con. Vùng CSS mới vẫn đặt bộ đếm rộng cả hàng và dừng trước các phần tử con của bộ đếm. Bản cuối khớp từng pixel trong khung 604 × 108 và trong nút 137 × 88.

Phép sửa cuối chỉ kiểm lại vùng chịu ảnh hưởng. Các hộp thoại chỉnh giáo án, AI và thao tác lưu vẫn dùng mã ứng dụng đang có.

## Route and regression map

| Entry               | Behavior to preserve                                                                                                                                    | Verification                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| /training/today     | Restore existing session and plan. Offer free, guided, rest day and cancellation undo paths.                                                            | Match each action and original store call.                                  |
| /training/plans     | Show active weekly schedule, rest days, prescriptions and selection. Guard editing or starting while a session is active.                               | Compare selected day, count, start, finder, AI preview and editor controls. |
| /training/exercises | Search exercises, filter by equipment and place, open original movement guides. Back unwinds picker navigation before leaving the library.              | Keep the existing shared picker, exercise assets and platform lifecycle.    |
| /training/session   | Log, skip, repeat and delete sets. Preserve each exercise draft, per-hand loads, timed movements, effort, notes, keyboard scrolling and the rest timer. | Drive real inputs and inspect persisted exercise and set identifiers.       |
| /training/history   | Expand a completed session, inspect logged and skipped sets, update or remove records, preview and repeat a free workout.                               | Load the finished session from the repository and inspect the replay.       |

The current tabs use WorkoutNavigation to remember the calling page. The candidate keeps the tab shell, legacy redirects and account-scoped repository transactions.

## Implemented contract

The candidate route module is `src/app/features/fitness/leptos/fitness.routes.ts`. Each route first loads the local Wasm module. A module load failure selects the original page before mounting.

`mountFitness(element, kind, snapshot, dispatch)` returns the shared region handle. The methods are `update(json)`, `dispose()` and `free()`. Events contain a type and a string value. Record actions carry the displayed record's ID. The host frees every region when Angular destroys its directive.

| Area      | Rust responsibility                                                                                                                                 | Retained Angular or platform behavior                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Today     | Loading and error announcements, undo, resume, guided and free start controls and today's prescriptions.                                            | Repositories determine the local day and current plan. The store awaits creation before navigation.                                               |
| Plans     | Weekly strip, selected day, rest state, prescribed sets, elapsed seconds and disabled actions.                                                      | Plan finder, manual catalog, editor, AI generation and acceptance use existing screens and stores.                                                |
| Exercises | Search, gear and muscle filtering, primary-before-secondary ordering, results, empty states, notes and pagination.                                  | Existing catalog supplies aliases and reviewed facts. Angular retains Unicode normalization, inventory editing, guide assets and back navigation. |
| Recording | Exercise selection, numeric fields, effort, notes, log, skip, repeat, list and delete actions. Rust displays paired, timed and legacy measurements. | The existing store validates and writes SQLite. Ionic retains keyboard reveal, confirmation alerts, rest timer and the completion sheet.          |
| History   | Session summary, weekly trends, exercise and set details, edit eligibility, free-workout replay preview and actions.                                | Angular groups dates and retains history edit and delete confirmations. The repository saves changes and creates the replay.                      |

The search index copies the reviewed catalog into Rust once per exercise-list revision. Queries send the normalized text, muscle, gear and local inventory. An empty inventory and unknown inventory have different meanings. The host frees the index when its picker closes permanently.

## Reproducible checks

Run `cargo test --locked --manifest-path crates/healthmate-leptos/Cargo.toml --lib fitness::` to check Rust-only contracts. Build the Wasm assets with `node scripts/build-leptos.mjs`. Run `ng test --configuration leptos-parity --watch=false --browsers=ChromeHeadless --include='src/app/features/fitness/leptos/fitness.parity.ts'` for the real browser and SQLite path.

The integration suite drives the real Wasm controls and the existing repositories. Its search comparison uses 180 combinations on the application exercise catalog. The repository and catalog tests use synthetic workout records and the bundled exercise assets. Device screenshots and Android background services have separate acceptance gates.

## Android acceptance scenario

| Route             | Interaction                                                                                                   | Expected result                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| /training/today   | Choose Bắt đầu tập tự do.                                                                                     | The session opens. Returning to Today offers Tiếp tục buổi tập.                                     |
| /training/session | Choose Thêm bài tập, search for biceps curl, then select `[data-exercise-id="biceps-curl"]`.                  | The weight field label reads Tạ mỗi tay (kg).                                                       |
| /training/session | Enter 12.5 in `#weight-kg`, 6 in `#reps`, 0 in `#rest-seconds`, a note in `#set-notes`, then choose Ghi hiệp. | The row reads 12,5 kg mỗi tay × 6 lần. SQLite stores 25 kg and six repetitions.                     |
| /training/session | Skip a set, then complete the workout.                                                                        | History shows one logged set and 150 kg. The skipped set stays visible.                             |
| /training/history | Expand the session, edit the first set to eight repetitions and save.                                         | SQLite retains its set ID and the session volume becomes 200 kg.                                    |
| /training/history | Choose Tập lại, check the preview and choose Bắt đầu tập lại.                                                 | The new session points to the old session. It contains the same movement and starts with zero sets. |
| /training/session | Start a separate session with side plank. Record and repeat 45 seconds.                                       | Both sets retain 45 seconds and zero repetitions.                                                   |

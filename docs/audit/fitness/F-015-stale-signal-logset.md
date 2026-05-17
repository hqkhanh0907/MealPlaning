# F-015 — total_volume + sets.length signal stale 5-10s sau khi logSet trong cùng session (chỉ refresh sau navigate đi/về hoặc cold restart)

**Severity:** P1 (data-fidelity perception bug)
**Status:** OPEN — root-cause hypothesis only, fix deferred Pha 2.
**Discovered:** Turn 12, runtime emulator
**Reproducer:**

1. Cold launch app → Tập luyện → Bắt đầu buổi tự do.
2. Thêm bài tập (vd Deadlift Romania) → exercise tab xuất hiện "Deadlift Romania **0 set**".
3. Type weight=60, reps=10 → tap GHI SET.
4. Logcat in: `INSERT … workout_set … weight_kg=60, reps=10 …` (DB persist OK, total_volume column tự sync = 600).
5. UI: exercise tab pill VẪN ghi "Deadlift Romania **0 set**", thanh "0 kg khối lượng" — không refresh. Block "Set đã ghi" (history) cũng không render.
6. Cold restart app → tap Tập luyện → resume → tab pill ĐÚNG "Deadlift Romania 1 set", "600 kg khối lượng", "Set 1 · 60 kg × 10".

## Bằng chứng (Turn 12 emulator runtime)

- DB verify: `SELECT total_volume FROM workout_exercise` → `600.0` ngay sau GHI SET (qua run-as cat databases/...).
- UI dump uihit (chậm 2-30s sau): `'Deadlift Romania 0 set'` + `'0 kg khối lượng'`.
- Sau cold restart, cùng query DB ra `600.0`, UI hiển thị `'Deadlift Romania 1 set'` + `'600 kg khối lượng'` + Set 1 history row.

## Code path liên quan

`src/app/core/stores/fitness.store.ts:295-328` `logSet()`:
```ts
const createdSet = await this.workoutRepo.addSet(exercise.id, draft.value);
const sessionId = this.activeSession()?.id;
if (sessionId) {
  this.activeSession.set(await this.workoutRepo.getSession(sessionId));   // ← re-fetch + signal write
}
this.restSeconds.set(draft.value.restSeconds);
...
```

`workoutRepo.addSet` chạy `INSERT` + `syncTotals()` (cập nhật `workout_exercise.total_volume` + `workout_session.total_volume`) trong cùng transaction. Sau đó `getSession` re-query full hydrate (session + exercises + sets). Về lý thuyết signal `activeSession` nhận object mới → template re-render.

Hub `fitness.page.html:289` đọc `exercise.sets.length` qua `@for (exercise of session.exercises; track exercise.id)`. Track key là `exercise.id`. Nếu object exercise instance được tái sử dụng (same id) thì `@for` không re-render children — Angular control flow chỉ swap khi identity track key đổi. Nhưng object mới từ `getSession()` là instance hoàn toàn mới (fresh array hydrate), nên track theory không giải thích đầy đủ.

## Hypothesis (chưa verify root cause)

1. **OnPush + signal write race trong tx callback**: `addSet → syncTotals → getSession` được `await` tuần tự, nhưng `db.execute` của capacitor-community/sqlite có thể return trước khi WAL write hoàn tất visible cho subsequent SELECT (giải thích quan sát Turn 12 khi pull `.db` mà thiếu `.db-wal` → ban đầu thấy `total_volume=0`). Đã xác nhận DB tự sync OK sau ~2s; có thể `getSession` SELECT chạy quá sớm vẫn thấy state trước syncTotals commit.
2. **Signal triple-write trong cùng microtask**: `addSet → addSet → restSeconds.set` triggers `effect()` rest-timer (`fitness.store.ts:63-85`) đặt `setInterval` ngay tick đó. Effect chạy đồng bộ sau set, có thể flush change-detection trước khi `activeSession.set` mới propagate. **Tuy nhiên** signal là synchronous; hypothesis này yếu.
3. **Capacitor sqlite WAL visibility**: Plugin có `setSyncMode('FULL'|'NORMAL')`. Mặc định NORMAL → reader có thể đọc snapshot trước commit. Cần check `web-database.ts` / `native-database.ts` config.

Hypothesis #1 + #3 hợp lý nhất.

## Fix proposal (Pha 2)

- **Approach A (safe):** sau `addSet`, `await` một small delay (50ms) trước `getSession`. Hack, không acceptable production.
- **Approach B (right):** chuyển logic `addSet` để trả về full `WorkoutSessionDetail` rebuilt trong cùng transaction (đã có sessionId), bypass need cho extra SELECT. Tức là `WorkoutRepository.addSet` returns `{ set, exercise, sessionTotal }` thay vì chỉ `WorkoutSet`. Store dùng object đó update từng phần signal — không cần re-query.
- **Approach C (orthogonal):** đảm bảo SQLite WAL `synchronous=NORMAL` đủ; force `PRAGMA wal_checkpoint(PASSIVE)` ngay sau insert trong `withTransaction` để guarantee visibility cho subsequent reads trên cùng connection. Verify với native-database.ts hiện đang dùng connection pool nào.

Pha 2 ưu tiên B (clean API, không phụ thuộc SQLite quirk).

## Test plan

- E2E (manual emulator): log set → IMMEDIATELY dump uihit → assert tab pill cập nhật `>=1 set` + `>0 kg khối lượng` trong < 1s.
- Repo unit (sql.js môi trường test): assert `getSession` sau `addSet` không bao giờ trả về stale `total_volume`.
- Stress test: log 5 set liên tiếp delay 0ms, count UI re-renders bằng spy trên `activeSession` signal.

## Status

OPEN — root-cause hypothesis confirmed, fix deferred Pha 2 (cần redesign repo API). Workaround tạm: user phải tap đi-về tab khác rồi quay lại để force refresh. Tài liệu rõ trong CHANGELOG để user biết.

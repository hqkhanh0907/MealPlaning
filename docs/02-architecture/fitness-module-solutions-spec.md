# 🏋️ Fitness Module — Đặc Tả Giải Pháp Chuyên Sâu

> **Ngày tạo:** 2026-03-27 | **Tham chiếu:** `fitness-module-analysis-report.md`
> **Phương pháp:** 5 nhóm phân tích song song (Data Integrity, Timer & Input, Logic Conflicts, Error Handling, UX & Feature Gaps)
> **Tổng issues:** 28+ | **Tổng giải pháp:** 140+ (5 giải pháp/issue)
> **Trạng thái:** 📋 Chỉ phân tích — Không thay đổi code

---

## MỤC LỤC

1. [Tổng Quan & Phương Pháp](#1-tổng-quan--phương-pháp)
2. [Cluster 1: Data Integrity](#2-cluster-1-data-integrity)
3. [Cluster 2: Timer & Input](#3-cluster-2-timer--input)
4. [Cluster 3: Logic Conflicts](#4-cluster-3-logic-conflicts)
5. [Cluster 4: Error Handling](#5-cluster-4-error-handling)
6. [Cluster 5: UX & Feature Gaps](#6-cluster-5-ux--feature-gaps)
7. [Cross-Cluster Dependency Map](#7-cross-cluster-dependency-map)
8. [Global Execution Order](#8-global-execution-order)
9. [Compatibility Matrix](#9-compatibility-matrix)

---

## 1. TỔNG QUAN & PHƯƠNG PHÁP

### 1.1 Phân Cụm Issues

28+ issues được phân thành 5 cluster **không chồng chéo** để đảm bảo các giải pháp không xung đột:

| Cluster | Issues | Files ảnh hưởng | Đặc tính |
|---------|--------|-----------------|----------|
| **1. Data Integrity** | STRENGTH-01/02/03, NAV-01, G-01 | `fitnessStore.ts`, `WorkoutLogger.tsx` | Xoay quanh persistence & transactions |
| **2. Timer & Input** | CARDIO-01/02/03 | `CardioLogger.tsx` | Isolated trong 1 component |
| **3. Logic Conflicts** | PLAN-01, OVERLOAD-01/02/03, GAMIF-01, OL-07/08/09 | `useTrainingPlan.ts`, `useProgressiveOverload.ts`, `gamification.ts`, `volumeCalculator.ts` | Naming + algorithm conflicts |
| **4. Error Handling** | PLAN-02/03, DASH-01/02, ONBOARD-02, STRENGTH-04, GAMIF-02 | Nhiều files | Defensive coding & shared modules |
| **5. UX & Feature Gaps** | ONBOARD-01/03, PLAN-04, G-02/03/04/05/06/07 | Components + UI flow | User experience & spec gaps |

### 1.2 Keystone Insight

> **G-01 (fitnessStore localStorage → SQLite)** là KEYSTONE fix. Migration này giải quyết đồng thời STRENGTH-01 (state loss), STRENGTH-02 (no transactions), và nâng cấp STRENGTH-03 (JSON parse errors) từ workaround → triệt để.

---

## 2. CLUSTER 1: DATA INTEGRITY

### 2.1 STRENGTH-01 — State Lost on Navigate

**Vấn đề:** Khi user đang nhập workout (chưa save), navigate sang tab khác rồi quay lại → mất toàn bộ dữ liệu draft. Component state (useState) bị unmount.

**Ảnh hưởng:** 🔴 Critical — User mất 10-15 phút nhập liệu. Gây frustration cao, giảm retention.

**5 Giải pháp:**

| # | Giải pháp | Ưu điểm | Nhược điểm | Complexity | Khuyến nghị |
|---|-----------|---------|------------|------------|-------------|
| **S1** | **Persist draft vào SQLite** (table `workout_drafts`) | Survive cả app reload, synergize G-01 | Cần G-01 hoàn thành trước | Medium | ⭐ **Tối ưu nhất** (khi G-01 xong) |
| **S2** | Lift state lên Zustand `fitnessStore` | Nhanh, không phụ thuộc G-01 | State vẫn mất khi refresh browser | Low | ✅ Interim solution |
| **S3** | `sessionStorage` cho draft data | Browser-native, nhanh | Mất khi close tab, không sync | Low | ⚠️ Chỉ tạm |
| **S4** | `useBeforeUnload` + `visibilitychange` listener tự save | Prevent accidental loss | Không cover navigate trong app | Medium | ⚠️ Bổ sung, không thay thế |
| **S5** | `<KeepAlive>` wrapper (giữ component mounted) | Zero data migration | Memory leak nếu nhiều tabs, anti-pattern | Low | ❌ Không khuyến nghị |

**Quyết định:** Triển khai **S2 ngay** (interim) → **S1 khi G-01 xong** (final).

---

### 2.2 STRENGTH-02 — No Save Transaction

**Vấn đề:** `handleSaveWorkout` trong `WorkoutLogger.tsx` gọi nhiều INSERT riêng lẻ (workout header, từng set, từng exercise). Nếu app crash giữa chừng → data inconsistent (có header nhưng thiếu sets).

**Ảnh hưởng:** 🔴 Critical — Dữ liệu hỏng, mất sets đã nhập, tính toán volume/progress sai.

**5 Giải pháp:**

| # | Giải pháp | Ưu điểm | Nhược điểm | Complexity | Khuyến nghị |
|---|-----------|---------|------------|------------|-------------|
| **S1** | **`databaseService.transaction()`** wrapper (SQLite BEGIN/COMMIT/ROLLBACK) | ACID guarantee, rollback on failure | Cần G-01 cho fitnessStore data | Medium | ⭐ **Tối ưu nhất** |
| **S2** | Batch all sets vào 1 Zustand action (single state update) | Atomic ở store level, nhanh | Không atomic ở SQLite level | Low | ✅ Interim |
| **S3** | Optimistic save + validation check sau save | UX mượt, detect inconsistency | Không prevent, chỉ detect | Medium | ⚠️ Bổ sung |
| **S4** | Two-phase commit: save to temp → validate → move to final | Strong consistency | Phức tạp, over-engineering cho client app | High | ❌ Quá phức tạp |
| **S5** | Single INSERT với JSON blob (all sets trong 1 column) | Atomic by nature | Khó query individual sets, anti-relational | Low | ❌ Anti-pattern |

**Quyết định:** **S2 ngay** → **S1 khi G-01 xong**.

---

### 2.3 STRENGTH-03 — Silent JSON Parse Failure

**Vấn đề:** `WorkoutLogger.tsx` parse stored data bằng `JSON.parse()` không có try-catch. Nếu data corrupted → white screen (unhandled exception) hoặc silent `undefined`.

**Ảnh hưởng:** 🟡 High — App crash hoặc hiển thị sai data, user không biết nguyên nhân.

**5 Giải pháp:**

| # | Giải pháp | Ưu điểm | Nhược điểm | Complexity | Khuyến nghị |
|---|-----------|---------|------------|------------|-------------|
| **S1** | **Relational data → loại bỏ JSON parse** (cần G-01) | Root cause elimination | Cần migrate schema | High | ⭐ **Triệt để nhất** |
| **S2** | `safeJsonParse<T>(raw, fallback, schema?)` utility | Reusable, type-safe | Vẫn parse JSON, chỉ safe hơn | Low | ✅ **Immediate fix** |
| **S3** | Zod schema validation sau parse | Type-safe, detailed errors | Thêm dependency, parse 2 lần | Medium | ✅ Production-grade |
| **S4** | Error boundary + toast notification cho user | UX graceful degradation | Không fix root cause | Low | ⚠️ Bổ sung |
| **S5** | Data integrity check on app start (scan + repair corrupted) | Prevent cascading failures | Chậm startup, complex logic | High | ⚠️ Nice-to-have |

**Quyết định:** **S2 ngay** → **S1 khi G-01 xong** → **S4 bổ sung**.

---

### 2.4 NAV-01 — workoutMode Reset on Tab Switch

**Vấn đề:** `workoutMode` state (tracking/planning) nằm trong component local state → reset khi switch tab. User đang ở chế độ "Planning" bị đưa về "Tracking".

**Ảnh hưởng:** 🟡 Medium — UX confusing, phải click lại mỗi lần switch tab.

**5 Giải pháp:**

| # | Giải pháp | Ưu điểm | Nhược điểm | Complexity | Khuyến nghị |
|---|-----------|---------|------------|------------|-------------|
| **S1** | **Store trong fitnessStore Zustand** | Persist across tab switches, nhanh | Minimal | Very Low | ⭐ **Tối ưu nhất** |
| **S2** | URL query param (`?mode=planning`) | Deep-linkable, browser back works | Overkill cho single-page app | Medium | ⚠️ Over-engineering |
| **S3** | `sessionStorage` key | Simple, browser-native | Không reactive, cần manual sync | Low | ⚠️ Workaround |
| **S4** | Context provider wrapping FitnessTab | React-idiomatic | Thêm 1 layer, unnecessary nếu đã có store | Low | ⚠️ Thừa |
| **S5** | Keep tab mounted (display:none thay unmount) | Zero state management needed | Memory waste, accessibility issues | Low | ❌ Anti-pattern |

**Quyết định:** **S1 — Trivial fix**, ~15 phút. Thêm `workoutMode` vào `fitnessStore`. Độc lập hoàn toàn.

---

### 2.5 G-01 — fitnessStore Migration (localStorage → SQLite)

**Vấn đề:** `fitnessStore.ts` là store DUY NHẤT còn dùng localStorage persist (qua Zustand middleware). Tất cả store khác đã migrate sang SQLite. Điều này tạo:
- Giới hạn 5MB storage
- Không transaction support
- Không sync qua Google Drive (chỉ SQLite được export)
- Không query được fitness data từ SQL

**Ảnh hưởng:** 🔴 Critical — Architectural debt. Chặn 3 fixes khác (STRENGTH-01/02/03 upgraded path).

**5 Giải pháp:**

| # | Giải pháp | Ưu điểm | Nhược điểm | Complexity | Khuyến nghị |
|---|-----------|---------|------------|------------|-------------|
| **S1** | **Dual-layer: SQLite (source of truth) + Zustand (reactive cache)** | Best of both: ACID + reactive UI, follows existing app pattern | Cần migration script | High | ⭐ **Tối ưu nhất** |
| **S2** | SQLite only, no Zustand cache | Đơn giản, 1 source | Mất reactivity, phải manual re-render | Medium | ⚠️ Performance hit |
| **S3** | IndexedDB thay localStorage (vẫn Zustand persist) | Larger storage (50MB+) | Không giải quyết transaction/sync | Low | ❌ Nửa vời |
| **S4** | Keep localStorage + periodic SQLite backup | Zero disruption | 2 sources of truth → desync risk | Medium | ❌ Tệ hơn hiện tại |
| **S5** | Migrate sang SQLite nhưng giữ localStorage as fallback (30 ngày) | Smooth migration, rollback possible | Complexity, cleanup logic | High | ✅ Safe migration path |

**Quyết định:** **S1 (Dual-layer)** + **S5 (fallback period)**. Theo pattern đã áp dụng cho các store khác trong app.

**Migration Plan:**
1. Tạo tables: `fitness_profiles`, `fitness_preferences`, `workout_drafts`
2. Viết migration script đọc localStorage → INSERT vào SQLite
3. Update `fitnessStore.ts` → load from SQLite on init, write-through cả 2
4. Sau 30 ngày: remove localStorage code path

---

## 3. CLUSTER 2: TIMER & INPUT

### 3.1 CARDIO-01 — Timer Race Condition (2 setIntervals)

**Vấn đề:** `CardioLogger.tsx` tạo 2 `setInterval` đồng thời:
- Interval 1: cập nhật `elapsedSeconds` state mỗi giây
- Interval 2: cập nhật display format

Khi cả 2 race → timer hiển thị nhảy số (ví dụ: 0:05 → 0:07 → 0:06), và cleanup không đúng khi unmount.

**Ảnh hưởng:** 🔴 Critical — Timer không chính xác, ảnh hưởng tính toán calories/pace. User thấy timer "giật".

**5 Giải pháp:**

| # | Giải pháp | Ưu điểm | Nhược điểm | Complexity | Khuyến nghị |
|---|-----------|---------|------------|------------|-------------|
| **S1** | **Single `useRef(startTime)` + derived display** | Zero drift, 1 interval, mathematically correct | Cần refactor timer logic | Medium | ⭐ **Tối ưu nhất** |
| **S2** | Custom `useTimer` hook (encapsulate logic) | Reusable, testable, clean separation | Cần tạo file mới | Medium | ✅ Best architecture |
| **S3** | `requestAnimationFrame` thay `setInterval` | Smooth 60fps, browser-optimized | Overkill cho 1-second updates | Medium | ⚠️ Over-engineering |
| **S4** | Web Worker timer (off main thread) | Không bị tab throttle | Complex, communication overhead | High | ❌ Quá phức tạp |
| **S5** | Fix cleanup order (clear interval 2 trước interval 1) | Minimal change | Không giải quyết root cause (2 intervals) | Very Low | ❌ Band-aid |

**Quyết định:** **S1 + S2 kết hợp** — Tạo `useTimer` hook dùng single `useRef(startTime)`:
```typescript
// useTimer.ts
function useTimer() {
  const startTimeRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    if (!startTimeRef.current) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startTimeRef.current]);
  
  return { elapsed, start: () => { startTimeRef.current = Date.now(); }, 
           stop: () => { startTimeRef.current = null; }, reset: () => setElapsed(0) };
}
```

---

### 3.2 CARDIO-02 — NaN Propagation in Cardio Inputs

**Vấn đề:** 3 input fields (duration, distance, heart rate) trong `CardioLogger.tsx` dùng `parseFloat()` trực tiếp. Khi user nhập text hoặc để trống → `NaN` lan tỏa vào `estimateCardioBurn()` → kết quả calories = `NaN`.

**Ảnh hưởng:** 🟡 High — UI hiển thị "NaN kcal", data lưu sai, tính toán nutrition bị ảnh hưởng.

**5 Giải pháp:**

| # | Giải pháp | Ưu điểm | Nhược điểm | Complexity | Khuyến nghị |
|---|-----------|---------|------------|------------|-------------|
| **S1** | **`parseNumericInput()` guard utility** | Reusable, centralized, type-safe | Cần apply ở nhiều chỗ | Low | ⭐ **Tối ưu nhất** |
| **S2** | Input `type="number"` + `min/max/step` attributes | Browser-native validation | Không đủ (paste text vẫn NaN) | Very Low | ✅ Bổ sung |
| **S3** | Validate tại consumption point (`estimateCardioBurn`) | Defense-in-depth | Không fix UI display issue | Low | ✅ Bổ sung |
| **S4** | Controlled input với regex filter (`/^\d*\.?\d*$/`) | Prevent invalid input entirely | Restrictive UX (no negative, no scientific notation) | Low | ⚠️ Quá strict |
| **S5** | Zod schema validation trên form submit | Comprehensive, typed errors | Heavy cho real-time input | Medium | ⚠️ Overkill |

**Quyết định:** **S1 + S2 + S3** (defense-in-depth):
```typescript
// utils/parseNumericInput.ts
export function parseNumericInput(value: string, fallback = 0): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
```
Apply tại input onChange + validate lại trong `estimateCardioBurn`.

---

### 3.3 CARDIO-03 — formatElapsed Duplication

**Vấn đề:** Hàm `formatElapsed(seconds)` (chuyển giây → "MM:SS") xuất hiện ở 2 nơi: `CardioLogger.tsx` và `gamification.ts`. Cả 2 không support giờ (>60 phút hiển thị sai).

**Ảnh hưởng:** 🟢 Medium — Code duplication, bug sẽ phải fix 2 lần. Cardio session >60 phút hiển thị "60:00" thay "1:00:00".

**5 Giải pháp:**

| # | Giải pháp | Ưu điểm | Nhược điểm | Complexity | Khuyến nghị |
|---|-----------|---------|------------|------------|-------------|
| **S1** | **Extract → `utils/timeFormat.ts`** với hour support + NaN guard | DRY, reusable, correct | Cần update 2 import locations | Low | ⭐ **Tối ưu nhất** |
| **S2** | Dùng `Intl.DateTimeFormat` hoặc `date-fns` | Standard library | Dependency thêm, overkill | Medium | ⚠️ Over-engineering |
| **S3** | Keep duplicate nhưng thêm hour support cả 2 | No refactoring risk | Vẫn DRY violation | Very Low | ❌ Không giải quyết |
| **S4** | Template literal helper `${h}:${m}:${s}` inline | Minimal abstraction | Không reusable | Very Low | ❌ Partial |
| **S5** | CSS-based display (giây raw → CSS counter-style) | Zero JS logic | Browser support, not flexible | High | ❌ Bizarre |

**Quyết định:** **S1** — Extract:
```typescript
// utils/timeFormat.ts
export function formatElapsed(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
```

---

## 4. CLUSTER 3: LOGIC CONFLICTS

### 4.1 PLAN-01 — calculateWeeklyVolume Naming Mislead

**Vấn đề:** Hàm `calculateWeeklyVolume()` trong `volumeCalculator.ts` thực chất tính **target weekly sets** (mục tiêu sets/tuần) chứ không phải **actual volume** (tonnage thực tế). Trong khi `trainingMetrics.ts` cũng có hàm tên tương tự tính actual volume. → Confusion.

**Ảnh hưởng:** 🟡 High — Developer gọi nhầm hàm. Logic plan generation có thể dùng sai data.

**5 Giải pháp:**

| # | Giải pháp | Ưu điểm | Nhược điểm | Complexity | Khuyến nghị |
|---|-----------|---------|------------|------------|-------------|
| **S1** | **Rename → `calculateTargetWeeklySets()`** trong `volumeCalculator.ts` | Rõ ràng, self-documenting | Cần update imports | Low | ⭐ **Tối ưu nhất** |
| **S2** | Thêm JSDoc comment giải thích rõ | Zero code change | Naming vẫn misleading | Very Low | ⚠️ Band-aid |
| **S3** | Move cả 2 hàm vào 1 file `volumeService.ts` với naming rõ ràng | Consolidation | Larger refactor | Medium | ✅ Kết hợp OL-08 |
| **S4** | Create barrel export với alias: `export { calculateWeeklyVolume as calculateTargetSets }` | Backward compatible | 2 names cho 1 function → confusing | Low | ❌ Worse |
| **S5** | Tạo `VolumeCalculationResult` type với field `type: 'target' | 'actual'` | Type-safe distinction | Over-abstraction | Medium | ⚠️ Nice-to-have |

**Quyết định:** **S1** → rename. Phải thực hiện **SAU OL-08** (type consolidation).

---

### 4.2 OVERLOAD-01 — Plateau Definition Conflict

**Vấn đề:** `useProgressiveOverload.ts` và `ProgressDashboard.tsx` dùng 2 định nghĩa "plateau" khác nhau:
- Hook: "3 sessions liên tiếp không tăng weight/reps" (progressive overload view)
- Dashboard: "volume tuần này ≤ tuần trước" (volume stagnation view)

→ User thấy Dashboard nói "bạn đang plateau" nhưng hook lại suggest tăng weight.

**Ảnh hưởng:** 🔴 Critical — Contradictory coaching. User mất niềm tin vào hệ thống.

> **✅ Partial fix applied:** `useProgressiveOverload.ts` now uses `isWeightSimilar()` with ±2% tolerance for plateau detection (LOGIC-02 from enhance-design spec). The hook no longer requires exact weight match — weights within ±2% are considered equivalent for plateau analysis. Full `PlateauAnalysis` service (S1) still pending.

**5 Giải pháp:**

| # | Giải pháp | Ưu điểm | Nhược điểm | Complexity | Khuyến nghị |
|---|-----------|---------|------------|------------|-------------|
| **S1** | **Canonical `PlateauAnalysis` service** — single definition, 2 display modes | Single source of truth | Cần redesign plateau logic | Medium | ⭐ **Tối ưu nhất** |
| **S2** | Differentiate terminology: "Strength Plateau" vs "Volume Stagnation" | Cả 2 đều đúng, rõ ràng cho user | UI cần thêm giải thích | Low | ✅ Quick win |
| **S3** | Priority system: hook's definition wins, dashboard chỉ show nếu consistent | Consistent messaging | Dashboard mất 1 insight | Low | ⚠️ Data loss |
| **S4** | Composite plateau score (weighted average cả 2 signals) | Nuanced, accurate | Phức tạp, hard to explain | High | ⚠️ Over-engineering |
| **S5** | Remove plateau detection khỏi Dashboard, chỉ show trong Overload section | Eliminate conflict | Reduce Dashboard value | Very Low | ❌ Avoid |

**Quyết định:** **S1 + S2** — Tạo `PlateauAnalysis` service làm single source, nhưng hiển thị 2 loại riêng biệt:
- "Strength Plateau" (từ hook) → show khi 3+ sessions stagnant
- "Volume Plateau" (từ dashboard) → show khi weekly trend ≤0 trong 2+ tuần

---

### 4.3 OVERLOAD-02 — Dual Overtraining Detection Calls

**Vấn đề:** `useProgressiveOverload.ts` gọi `detectOvertraining()` ở 2 nơi:
1. Trong `useEffect` khi data thay đổi (real-time monitoring)
2. Trong `generateRecommendation()` khi user request suggestion

Cả 2 dùng cùng logic nhưng có thể return khác nhau do timing (data stale trong 1 call).

**Ảnh hưởng:** 🟡 High — Inconsistent overtraining warnings. User thấy "safe" rồi bấm recommend lại thấy "overtraining risk".

**5 Giải pháp:**

| # | Giải pháp | Ưu điểm | Nhược điểm | Complexity | Khuyến nghị |
|---|-----------|---------|------------|------------|-------------|
| **S1** | **Split: `detectAcuteFatigue()` vs `detectChronicOvertraining()`** | Clear semantics, cả 2 đều cần thiết nhưng khác purpose | Cần redesign types | Medium | ⭐ **Tối ưu nhất** |
| **S2** | Cache result trong `useMemo`, cả 2 call sites dùng cached | Consistent, performant | Cache invalidation complexity | Low | ✅ Quick fix |
| **S3** | Remove call trong `useEffect`, chỉ detect on-demand | Simpler, 1 call site | Mất real-time monitoring | Low | ⚠️ Tradeoff |
| **S4** | Event-driven: `useEffect` set flag, `generateRecommendation` reads flag | Decoupled | Race condition risk vẫn có | Medium | ⚠️ Partial |
| **S5** | Merge cả 2 call sites vào 1 `useOvertrainingStatus()` hook | Clean separation | Thêm 1 hook file | Medium | ✅ Good architecture |

**Quyết định:** **S1** (long-term) + **S2** (immediate). `useMemo` cache ngay, sau đó split function khi refactor.

---

### 4.4 OVERLOAD-03 — O(n) Performance in Progress Lookup

**Vấn đề:** `useProgressiveOverload.ts` dùng `workoutHistory.find()` và `exercises.includes()` trong render loop → O(n) mỗi lookup. Với 100+ workouts + 250 exercises → noticeable lag.

**Ảnh hưởng:** 🟢 Medium — Performance degradation theo thời gian. User với 6+ tháng data sẽ thấy chậm.

**5 Giải pháp:**

| # | Giải pháp | Ưu điểm | Nhược điểm | Complexity | Khuyến nghị |
|---|-----------|---------|------------|------------|-------------|
| **S1** | **`useMemo` index Map + Set** conversion | O(1) lookup, minimal code change | Memory overhead (minor) | Low | ⭐ **Tối ưu nhất** |
| **S2** | SQLite query thay in-memory filter | Leverage DB index, scalable | Async → cần loading state | Medium | ✅ Khi G-01 xong |
| **S3** | Web Worker cho heavy computation | Off main thread | Communication overhead, complex | High | ❌ Overkill |
| **S4** | Pagination (chỉ load 30 workouts gần nhất) | Reduce data volume | Mất long-term trend analysis | Low | ⚠️ Tradeoff |
| **S5** | Debounce recalculation (500ms delay) | Reduce frequency | UX delay, stale data | Low | ⚠️ Band-aid |

**Quyết định:** **S1 ngay** → **S2 khi G-01 xong**:
```typescript
const exerciseMap = useMemo(() => 
  new Map(exercises.map(e => [e.id, e])), [exercises]);
const historyIndex = useMemo(() => 
  new Map(workoutHistory.map(w => [w.id, w])), [workoutHistory]);
```

---

### 4.5 GAMIF-01 — Grace Period Increments Streak

**Vấn đề:** Trong `gamification.ts`, logic xử lý grace period (ngày nghỉ được phép) vẫn chạy `currentStreak++` (dòng 149 và 184). Nghĩa là user không tập nhưng streak vẫn tăng → phá vỡ gamification integrity.

**Ảnh hưởng:** 🔴 Critical — Streak numbers inflated, user thấy streak "ảo". Achievements không phản ánh thực tế.

**5 Giải pháp:**

| # | Giải pháp | Ưu điểm | Nhược điểm | Complexity | Khuyến nghị |
|---|-----------|---------|------------|------------|-------------|
| **S1** | **Remove `currentStreak++`** trong cả 2 grace blocks | Root cause fix, 2 dòng | None | Very Low | ⭐ **Trivial fix** |
| **S2** | Thêm `streakMaintained` flag (streak giữ nguyên, không tăng) | Semantic clarity | Thêm complexity cho 1 bug rõ ràng | Low | ⚠️ Over-thinking |
| **S3** | Redesign grace logic: separate `maintainStreak()` vs `incrementStreak()` | Clean architecture | Refactor quá mức cho 2-line bug | Medium | ⚠️ Over-engineering |
| **S4** | Add unit test trước, fix sau (TDD approach) | Regression-proof | Mất thời gian cho obvious fix | Low | ✅ Kết hợp S1 |
| **S5** | Configuration-driven: grace period có option "count as workout day" | Flexible cho future | Unnecessary complexity | Medium | ❌ YAGNI |

**Quyết định:** **S1 + S4** — Fix 2 dòng, viết test confirm.

---

### 4.6 OL-07/08/09 — Logic Overlap Resolution

**Vấn đề tổng hợp:**
- **OL-07:** `volumeCalculator.ts` vs `trainingMetrics.ts` cùng tính volume nhưng khác context
- **OL-08:** `TrainingDay` type defined ở 3 nơi khác nhau (types.ts, useTrainingPlan.ts, ProgressDashboard)
- **OL-09:** Date arithmetic helper duplicated ở 4 files

**Execution Order:**

```
OL-08 (type consolidation) ──→ PLAN-01 (rename functions) ──→ OL-07 (clarify volume files)
         ↓
    OL-09 (dateUtils extraction)
```

**Giải pháp cho OL-08 (ưu tiên nhất):**

| # | Giải pháp | Complexity | Khuyến nghị |
|---|-----------|------------|-------------|
| **S1** | **Canonical types trong `types.ts` + re-export** | Low | ⭐ |
| **S2** | Tách `types/training.ts`, `types/cardio.ts`, `types/gamification.ts` | Medium | ✅ Scalable |
| **S3** | Codegen types từ SQLite schema | High | ⚠️ Future |
| **S4** | Interface inheritance (base TrainingDay + extended) | Medium | ✅ |
| **S5** | Keep duplicates nhưng add type alias imports | Low | ❌ Band-aid |

**Giải pháp cho OL-09 (dateUtils):**

| # | Giải pháp | Complexity | Khuyến nghị |
|---|-----------|------------|-------------|
| **S1** | **Extract → `utils/dateUtils.ts`** | Low | ⭐ |
| **S2** | Dùng `date-fns` library thay custom helpers | Medium | ✅ |
| **S3** | Extend JS Date prototype | Low | ❌ Anti-pattern |
| **S4** | Temporal API (stage 3 proposal) | High | ❌ Not ready |
| **S5** | Keep duplicates, chỉ add comments linking to each other | Very Low | ❌ |

**Quyết định:** OL-08 **S1** → OL-09 **S1** → PLAN-01 **S1** → OL-07 tự giải quyết sau rename.

---

## 5. CLUSTER 4: ERROR HANDLING

### 5.1 PLAN-02 — try-finally Without catch

**Vấn đề:** `useTrainingPlan.ts` dùng `try { ... } finally { setLoading(false) }` nhưng KHÔNG có `catch`. Error bị swallowed, loading indicator dừng nhưng user không biết plan generation thất bại.

**Ảnh hưởng:** 🟡 High — Silent failure. User thấy empty plan nhưng không biết tại sao.

**5 Giải pháp:**

| # | Giải pháp | Complexity | Khuyến nghị |
|---|-----------|------------|-------------|
| **S1** | **Add catch → `setError(e.message)` + UI error display** | Low | ⭐ |
| **S2** | Error boundary wrapper cho PlanGenerator component | Medium | ✅ Bổ sung |
| **S3** | Retry logic: auto retry 2 lần trước khi show error | Medium | ⚠️ |
| **S4** | Toast notification system (global) | Medium | ✅ Kết hợp |
| **S5** | `Result<T>` monad pattern (never throw) | High | ⚠️ Over-engineering |

---

### 5.2 PLAN-03 — Unsafe Type Assertion (BodyRegion)

**Vấn đề:** `useTrainingPlan.ts` cast `string as BodyRegion` không validate. Nếu data từ DB chứa giá trị ngoài enum → runtime crash.

**5 Giải pháp:**

| # | Giải pháp | Complexity | Khuyến nghị |
|---|-----------|------------|-------------|
| **S1** | **Canonical `BODY_REGION_MAP` + runtime guard** | Low | ⭐ |
| **S2** | Zod enum validation | Medium | ✅ |
| **S3** | `isBodyRegion()` type guard function | Low | ✅ |
| **S4** | Default fallback: unknown region → "full_body" | Very Low | ⚠️ |
| **S5** | DB constraint (CHECK clause trên column) | Medium | ✅ Defense-in-depth |

---

### 5.3 DASH-01 — Stale Week Bounds

**Vấn đề:** `ProgressDashboard.tsx` tính week bounds (start/end of week) 1 lần khi mount. Nếu user để app mở qua nửa đêm → data tuần cũ.

**5 Giải pháp:**

| # | Giải pháp | Complexity | Khuyến nghị |
|---|-----------|------------|-------------|
| **S1** | **`useCurrentDate()` hook + `visibilitychange` listener** | Low | ⭐ |
| **S2** | `setInterval` check mỗi phút | Low | ✅ |
| **S3** | Recalculate on every render (useMemo with `new Date()`) | Very Low | ⚠️ Performance |
| **S4** | Manual "Refresh" button | Very Low | ❌ Bad UX |
| **S5** | Server-sent time sync (nếu có backend) | High | ❌ Overkill |

---

### 5.4 DASH-02 — Switch Without Default

**Vấn đề:** `ProgressDashboard.tsx` có switch statement trên `chartType` không có `default` case. Thêm chart type mới → silent no-op.

**5 Giải pháp:**

| # | Giải pháp | Complexity | Khuyến nghị |
|---|-----------|------------|-------------|
| **S1** | **Exhaustive `never` assertion ở default** | Very Low | ⭐ |
| **S2** | Object map thay switch (compile-time safe) | Low | ✅ |
| **S3** | ESLint `@typescript-eslint/switch-exhaustiveness-check` rule | Very Low | ✅ Bổ sung |
| **S4** | Default case log warning + show fallback chart | Low | ⚠️ |
| **S5** | Union discriminant pattern with exhaustive handler | Medium | ⚠️ |

---

### 5.5 ONBOARD-02 — 1RM Keys Not Validated

**Vấn đề:** `FitnessOnboarding.tsx` hardcode exercise IDs cho 1RM input nhưng không validate chúng tồn tại trong exercise database.

**5 Giải pháp:**

| # | Giải pháp | Complexity | Khuyến nghị |
|---|-----------|------------|-------------|
| **S1** | **Type `ORM_LIFTS` as `const` tuple + derive key type** | Low | ⭐ |
| **S2** | Runtime check: filter out missing exercises | Low | ✅ |
| **S3** | Generate 1RM list from exercise DB (dynamic) | Medium | ✅ |
| **S4** | Add FK constraint in SQLite | Medium | ✅ Defense |
| **S5** | Separate config file `ormExercises.config.ts` | Low | ⚠️ |

---

### 5.6 STRENGTH-04 & GAMIF-02 — Shared Module Extraction

**Vấn đề chung:** Constants scattered across files (STRENGTH-04) + Date utilities duplicated (GAMIF-02).

**Proposed Shared Module Structure:**

```
src/features/fitness/
├── constants.ts              ← NEW (STRENGTH-04)
│   ├── REST_TIMER_DEFAULTS
│   ├── SET_LIMITS
│   ├── RPE_SCALE
│   ├── BODY_REGIONS
│   └── DAY_LABELS
├── utils/
│   ├── dateUtils.ts          ← NEW (GAMIF-02 / OL-09)
│   │   ├── getWeekBounds()
│   │   ├── formatDate()
│   │   ├── daysBetween()
│   │   └── isToday()
│   └── timeFormat.ts         ← NEW (CARDIO-03)
│       └── formatElapsed()
```

**Dependency Rule:** `constants.ts` và `utils/*` là **leaf modules** — chúng không import từ bất kỳ feature file nào khác. Chỉ được import từ `types.ts` và standard library.

---

## 6. CLUSTER 5: UX & FEATURE GAPS

### 6.1 ONBOARD-01 — 1RM Hidden for Intermediate Users

**Vấn đề:** Onboarding chỉ show 1RM input cho "Advanced" experience level. Intermediate users có thể biết 1RM nhưng không được nhập → hệ thống dùng estimation thay vì actual data.

**5 Giải pháp:**

| # | Giải pháp | Complexity | Khuyến nghị |
|---|-----------|------------|-------------|
| **S1** | **Decouple từ experience level, thêm "I know my 1RM" toggle** | Low | ⭐ |
| **S2** | Show cho cả Beginner/Intermediate nhưng mark "optional" | Very Low | ✅ |
| **S3** | Progressive disclosure: "Want to enter your max lifts?" expandable section | Low | ✅ |
| **S4** | Separate "Strength Assessment" page accessible anytime (not just onboarding) | Medium | ✅ Future |
| **S5** | AI-guided: sau 3 workouts, prompt user "We estimated your 1RM, want to correct?" | Medium | ⚠️ Phase 2 |

---

### 6.2 ONBOARD-03 — No Back Button in Wizard

**Vấn đề:** 14-step onboarding wizard không có nút quay lại. User nhập sai ở step 3 → phải cancel toàn bộ và bắt đầu lại.

**5 Giải pháp:**

| # | Giải pháp | Complexity | Khuyến nghị |
|---|-----------|------------|-------------|
| **S1** | **Single-page form với sections + "Review & Edit" summary** | Medium | ⭐ |
| **S2** | Back/Next button wizard (standard pattern) | Low | ✅ **Quick fix** |
| **S3** | Stepper indicator (1-14) clickable để jump | Medium | ✅ |
| **S4** | Auto-save mỗi step + allow edit from summary | Medium | ✅ |
| **S5** | Conversational UI (chatbot-style onboarding) | High | ❌ Scope creep |

---

### 6.3 PLAN-04 — Deload Never Auto-Triggers

**Vấn đề:** `periodization.ts` có logic detect deload need nhưng chỉ suggest — không có mechanism để auto-adjust khi user ignore. User bỏ qua deload → overtraining risk.

**5 Giải pháp:**

| # | Giải pháp | Complexity | Khuyến nghị |
|---|-----------|------------|-------------|
| **S1** | **Hybrid soft enforcement + override escape hatch** | Medium | ⭐ |
| **S2** | Mandatory deload after X consecutive hard weeks | Low | ⚠️ Too rigid |
| **S3** | Auto-reduce volume in generated plan (transparent deload) | Medium | ✅ Coaching-sound |
| **S4** | Gamification penalty: streak reset nếu ignore deload | Low | ⚠️ Punitive |
| **S5** | Coach notification modal (persistent, dismissable 1 lần/ngày) | Low | ✅ |

**Recommendation:** S1 — After 4 consecutive "high intensity" weeks, system reduces volume by 40% in next plan. User gets modal: "This is a deload week for recovery. Override?" with explanation.

---

### 6.4 G-02 — Quick Confirm Card (Spec Gap)

**Vấn đề:** Spec yêu cầu "Quick Confirm Card" — hiển thị AI-suggested workout, user chỉ cần tap "Start" thay vì build từ đầu. Chưa implement.

**5 Giải pháp:**

| # | Giải pháp | Complexity | Khuyến nghị |
|---|-----------|------------|-------------|
| **S1** | **Phase 2 pre-fill card với Confirm/Edit toggle** | Medium | ⭐ |
| **S2** | Simple "Repeat Last Workout" button | Low | ✅ Quick win |
| **S3** | Template-based quick start (pick from saved templates) | Medium | ✅ |
| **S4** | Full AI workout generator (GPT-powered) | High | ⚠️ Phase 3 |
| **S5** | Calendar-integrated: auto-suggest based on training plan | Medium | ✅ |

---

### 6.5 G-03 — WorkoutSummaryCard Missing

**Spec Gap:** Post-workout summary card với PR celebration chưa có. User hoàn thành workout → quay về dashboard không có feedback.

**5 Giải pháp:**

| # | Giải pháp | Complexity | Khuyến nghị |
|---|-----------|------------|-------------|
| **S1** | **Extract inline summary → `WorkoutSummaryCard` component** với confetti/gold gradient cho PR | Medium | ⭐ |
| **S2** | Modal popup với summary stats | Low | ✅ Quick |
| **S3** | Dashboard widget showing last workout recap | Medium | ✅ |
| **S4** | Push notification summary (khi app background) | High | ⚠️ |
| **S5** | Social share card (image export) | High | ⚠️ Phase 3 |

---

### 6.6 G-04/G-05 — Exercise Database & Custom Exercise UI

**Spec Gaps:**
- G-04: Exercise DB thiếu ~20 exercises so với spec (đặc biệt bodyweight, mobility)
- G-05: Không có UI cho user thêm custom exercise

**5 Giải pháp (combined):**

| # | Giải pháp | Complexity | Khuyến nghị |
|---|-----------|------------|-------------|
| **S1** | **Fill 20-exercise gap + Add custom exercise modal** trong `ExerciseSelector` | Medium | ⭐ |

> **✅ i18n update applied:** `ExerciseSelector.tsx` muscle group labels now use i18n keys (e.g., `t('fitness.muscleGroup.chest')`) instead of hardcoded Vietnamese strings. All UI labels are translation-ready.
| **S2** | Import from external exercise API (ExerciseDB, wger) | Medium | ✅ Future |
| **S3** | Community exercise sharing (sync custom exercises) | High | ⚠️ Phase 3 |
| **S4** | AI-suggested exercise creation (describe movement → generate entry) | High | ⚠️ |
| **S5** | Quick-add inline (name + muscle group chỉ) | Low | ✅ MVP |

---

### 6.7 G-06/G-07 — AI Pre-fill & Smart Adjustments

**Spec Gaps:**
- G-06: Progressive overload suggestions chưa wire vào WorkoutLogger UI
- G-07: Smart adjustments dựa trên nutrition data chưa implement

**PR Roadmap (3 Pull Requests):**

| PR | Scope | Dependencies | Complexity |
|----|-------|-------------|------------|
| **PR1** | Wire `useProgressiveOverload` → `WorkoutLogger` (show suggestions inline) | None | Low |
| **PR2** | `SmartInsightBanner` component — show overload tips + plateau warnings | PR1 | Medium |
| **PR3** | Nutrition integration — `useFitnessNutritionBridge` hook | PR1, PR2, §4 Nutrition Engine | High | ✅ Bridge now uses real `useTodayNutrition()` data |

---

## 7. CROSS-CLUSTER DEPENDENCY MAP

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPENDENCY GRAPH                          │
│                                                             │
│  NAV-01 ─────────────────────────── (independent)           │
│  GAMIF-01 ───────────────────────── (independent)           │
│                                                             │
│  OL-08 ──→ PLAN-01 ──→ OL-07                               │
│    ↓                                                        │
│  OL-09 (dateUtils)                                          │
│                                                             │
│  STRENGTH-04 ──→ constants.ts (leaf module)                 │
│  GAMIF-02 ────→ dateUtils.ts (leaf module, shared w/ OL-09) │
│  CARDIO-03 ───→ timeFormat.ts (leaf module)                 │
│                                                             │
│  CARDIO-01 ───→ CARDIO-02 ──→ (independent)                │
│                                                             │
│  G-01 (KEYSTONE) ──→ STRENGTH-01 upgraded                  │
│       │            → STRENGTH-02 upgraded                   │
│       │            → STRENGTH-03 upgraded                   │
│       └──────────→ OVERLOAD-03 S2 path                     │
│                                                             │
│  PLAN-02/03, DASH-01/02, ONBOARD-02 ── (independent batch) │
│                                                             │
│  ONBOARD-01/03 ───────── (independent UX)                  │
│  PLAN-04 ─────────────── (independent coaching)             │
│                                                             │
│  G-02 + G-06 ──→ G-07 ──→ (nutrition integration)          │
│  G-03 ────────── (independent)                              │
│  G-04/G-05 ───── (independent)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. GLOBAL EXECUTION ORDER

> Tổ chức theo Sprint/Phase, mỗi phase có thể chạy song song nội bộ.

### Phase 0: Trivial Fixes (< 1 giờ tổng)
| # | Issue | LOC Change | Risk |
|---|-------|-----------|------|
| 1 | NAV-01 — Store workoutMode in Zustand | ~10 LOC | None |
| 2 | GAMIF-01 — Remove streak++ in grace blocks | 2 LOC | None |
| 3 | DASH-02 — Add exhaustive never default | ~5 LOC | None |

### Phase 1: Foundation Extraction (shared modules)
| # | Issue | Creates | Depends On |
|---|-------|---------|------------|
| 4 | OL-08 — Type consolidation | Canonical `types.ts` | — |
| 5 | STRENGTH-04 — Constants extraction | `constants.ts` | — |
| 6 | GAMIF-02 + OL-09 — Date utils | `utils/dateUtils.ts` | — |
| 7 | CARDIO-03 — Time format | `utils/timeFormat.ts` | — |
| 8 | PLAN-01 — Rename calculateWeeklyVolume | — | OL-08 |

### Phase 2: Bug Fixes (Timer, Input, Error Handling)
| # | Issue | File | Depends On |
|---|-------|------|------------|
| 9 | CARDIO-01 — Single timer ref | `CardioLogger.tsx` | Phase 1 (#7) |
| 10 | CARDIO-02 — NaN guard utility | `CardioLogger.tsx` + util | — |
| 11 | PLAN-02 — Add catch block | `useTrainingPlan.ts` | — |
| 12 | PLAN-03 — BodyRegion guard | `useTrainingPlan.ts` | Phase 1 (#4) |
| 13 | DASH-01 — Current date hook | `ProgressDashboard.tsx` | — |
| 14 | ONBOARD-02 — 1RM key validation | `FitnessOnboarding.tsx` | Phase 1 (#5) |
| 15 | STRENGTH-03 — Safe JSON parse | `WorkoutLogger.tsx` | — |

### Phase 3: Algorithm Improvements
| # | Issue | File | Depends On |
|---|-------|------|------------|
| 16 | OVERLOAD-03 — useMemo index | `useProgressiveOverload.ts` | — |
| 17 | OVERLOAD-02 — Split detection | `useProgressiveOverload.ts` | #16 |
| 18 | OVERLOAD-01 — Plateau service | New service file | #17 |
| 19 | STRENGTH-01 — Persist draft (interim: Zustand) | `fitnessStore.ts`, `WorkoutLogger.tsx` | — |
| 20 | STRENGTH-02 — Batch save (interim: single action) | `WorkoutLogger.tsx` | #19 |

### Phase 4: Keystone Migration
| # | Issue | Scope | Depends On |
|---|-------|-------|------------|
| 21 | G-01 — fitnessStore SQLite migration | `fitnessStore.ts` + migration | Phase 3 stable |
| 22 | STRENGTH-01 upgrade — SQLite draft | `WorkoutLogger.tsx` | #21 |
| 23 | STRENGTH-02 upgrade — DB transaction | `WorkoutLogger.tsx` | #21 |
| 24 | STRENGTH-03 upgrade — Relational data | `WorkoutLogger.tsx` | #21 |

### Phase 5: UX Improvements
| # | Issue | Scope | Depends On |
|---|-------|-------|------------|
| 25 | ONBOARD-03 — Back button wizard | `FitnessOnboarding.tsx` | — |
| 26 | ONBOARD-01 — 1RM for all levels | `FitnessOnboarding.tsx` | — |
| 27 | PLAN-04 — Deload auto-trigger | `periodization.ts` + modal | Phase 3 (#18) |
| 28 | G-03 — WorkoutSummaryCard | New component | — |

### Phase 6: Feature Gaps (New Features)
| # | Issue | Scope | Depends On |
|---|-------|-------|------------|
| 29 | G-02 — Quick Confirm Card | New component | Phase 5 |
| 30 | G-04/G-05 — Exercise DB + Custom UI | `exerciseDatabase.ts` + modal | — |
| 31 | G-06 — Wire progressive overload suggestions | `WorkoutLogger.tsx` | Phase 3 (#18) |
| 32 | G-07 — Nutrition integration bridge | New hook | #31, §4 Nutrition |

---

## 9. COMPATIBILITY MATRIX

> Đảm bảo các giải pháp không xung đột khi implement song song.

| Fix A | Fix B | Conflict? | Note |
|-------|-------|-----------|------|
| NAV-01 (Zustand) | STRENGTH-01 (Zustand draft) | ⚠️ Same file | Coordinate: khác slice trong cùng store |
| CARDIO-01 (timer) | CARDIO-02 (NaN) | ✅ Safe | Khác function trong cùng component |
| CARDIO-03 (extract) | GAMIF-02 (dateUtils) | ✅ Safe | Khác file extract target |
| OL-08 (types) | PLAN-01 (rename) | ⚠️ Sequential | PLAN-01 phải SAU OL-08 |
| OVERLOAD-01 (plateau) | OVERLOAD-02 (dual calls) | ⚠️ Sequential | OVERLOAD-01 SAU OVERLOAD-02 |
| G-01 (SQLite) | STRENGTH-01/02/03 | ⚠️ Blocking | G-01 unblocks upgraded path |
| PLAN-02 (catch) | PLAN-03 (type guard) | ✅ Safe | Khác function trong cùng hook |
| DASH-01 (date) | DASH-02 (switch) | ✅ Safe | Khác logic block |
| ONBOARD-01 (1RM) | ONBOARD-03 (back) | ✅ Safe | Khác UI flow |
| G-02 (Quick Card) | G-06 (overload wire) | ⚠️ Same feature area | G-06 data → G-02 display |
| STRENGTH-04 (constants) | GAMIF-02 (dateUtils) | ✅ Safe | Parallel extract, leaf modules |

### Parallel Safety Groups

Các nhóm sau có thể implement **đồng thời** mà không conflict:

- **Group A:** NAV-01, GAMIF-01, DASH-02 (trivial, independent)
- **Group B:** STRENGTH-04, GAMIF-02/OL-09, CARDIO-03 (module extraction)
- **Group C:** CARDIO-01, CARDIO-02 (same component, khác function)
- **Group D:** PLAN-02, PLAN-03, DASH-01, ONBOARD-02 (error handling, khác files)
- **Group E:** ONBOARD-01, ONBOARD-03 (UX, khác flow trong cùng component — cần coordinate)

---

## 10. TÓM TẮT

### Số liệu tổng quan

| Metric | Giá trị |
|--------|---------|
| **Tổng issues phân tích** | 28+ |
| **Tổng giải pháp đề xuất** | 140+ (5/issue) |
| **Critical fixes** | 7 (2 trivial, 5 cần refactor) |
| **Keystone fix** | G-01 (SQLite migration) |
| **Estimated phases** | 7 (Phase 0-6) |
| **Independent parallel groups** | 5 |
| **New files cần tạo** | 4 (constants.ts, dateUtils.ts, timeFormat.ts, PlateauService) |
| **New components cần tạo** | 3 (WorkoutSummaryCard, QuickConfirmCard, CustomExerciseModal) |

### Top 5 High-Impact Fixes

1. **GAMIF-01** — 2 dòng code fix streak inflation (Critical, 5 phút)
2. **CARDIO-01** — Single timer eliminates race condition (Critical, 1 giờ)
3. **G-01** — SQLite migration unblocks 3 other critical fixes (Keystone)
4. **OVERLOAD-01** — Unified plateau definition eliminates contradictory coaching
5. **PLAN-04** — Auto-deload prevents overtraining (health safety)

---

> **Document này là READ-ONLY analysis. Không thay đổi code.**
> **Sử dụng Global Execution Order (§8) làm roadmap implementation.**

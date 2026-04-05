# Kinh nghiệm Phân tích & Debug — MealPlaning

> Rút ra từ session audit BMR/TDEE/calorie logic (2026-04-03 → 04-04).
> Áp dụng cho mọi lần audit code, tìm bug, hoặc phân tích vấn đề.

---

## 1. Chiến lược phân tích ban đầu

### 1.1 Dùng parallel agents để quét 3 góc nhìn đồng thời

Khi audit 1 feature, KHÔNG đọc tuần tự từ đầu đến cuối. Thay vào đó, dispatch 3 explore agents song song:

| Agent   | Nhiệm vụ          | Tìm gì                                  |
| ------- | ----------------- | --------------------------------------- |
| Agent 1 | **Core logic**    | Thuật toán, công thức, pure functions   |
| Agent 2 | **Consumer code** | Nơi sử dụng kết quả (UI, hooks, stores) |
| Agent 3 | **Test coverage** | Test hiện tại có cover đúng logic không |

**Kết quả session này**: Core engine (`nutritionEngine.ts`) hoàn toàn đúng. Tất cả 5 bugs đều nằm ở **consumer code** — nơi GỌI engine, không phải engine.

### 1.2 Bài học: Bug thường KHÔNG ở nơi bạn nghĩ

```
Dự đoán ban đầu: "Công thức BMR/TDEE tính sai"
Thực tế:          Core engine OK, bugs ở hooks gọi engine
```

**Pattern phổ biến**:

- Core logic đúng, nhưng consumer truyền sai param (BUG-02: dùng `.age` thay vì `getAge()`)
- Core logic đúng, nhưng consumer hard-code thay vì dùng config (BUG-01: protein 1.6g/kg)
- Core logic đúng, nhưng consumer dùng sai giá trị trả về (BUG-04: dùng TDEE thay vì Target)

**Quy tắc**: Khi user báo "feature X tính sai" → check **consumer trước**, core logic sau.

---

## 2. Truy vết ngược (Backward Tracing)

### 2.1 Pattern hiệu quả nhất: Từ UI → ngược lên source

Khi thấy giá trị sai trên UI:

```
UI hiển thị sai
    ↑ Component nào render?
        ↑ Prop/state nào cung cấp dữ liệu?
            ↑ Hook nào tính giá trị?
                ↑ Function nào được gọi? Với params gì?
                    ↑ Params đến từ đâu? Đúng chưa?
```

**Ví dụ BUG-04**:

```
Dashboard budget hiển thị TDEE thay vì Target
    ↑ useTodayCaloriesOut hook
        ↑ Dùng `tdee` trực tiếp
            ↑ LẼ RA phải dùng `targetCalories` (= TDEE + offset)
```

Tìm ra trong 5 phút thay vì đọc toàn bộ codebase.

### 2.2 KHÔNG BAO GIỜ đọc code từ đầu đến cuối

**SAI**: Mở `App.tsx` → đọc từ dòng 1 → hy vọng tìm ra bug
**ĐÚNG**: Bắt đầu từ symptom → trace backward → tìm root cause

---

## 3. Phân biệt Bug vs UX Issue vs Architecture Issue

### 3.1 Ba loại vấn đề khác nhau

Trong session này phát hiện cả 3 loại:

| Loại                   | Ví dụ                                              | Cách xử lý                          |
| ---------------------- | -------------------------------------------------- | ----------------------------------- |
| **Code Bug**           | BUG-01→05: Sai logic trong consumer                | Fix code + thêm test                |
| **UX Issue**           | Không có nơi nào hiển thị BMR/TDEE/Target chi tiết | Tạo feature mới (EnergyDetailSheet) |
| **Architecture Issue** | In-memory SQLite, không persist                    | Cần plan lớn, thay đổi infra        |

### 3.2 Bẫy: User nói "tính sai" nhưng thực ra là "không hiển thị"

User ban đầu hỏi: _"audit logic tính BMR/TDEE"_

Phát hiện: Logic tính **đúng**, nhưng user không thấy vì:

- BMR/TDEE chỉ hiển thị trong Settings Health Profile (ẩn sâu)
- Dashboard chỉ hiện eaten/target, không hiện BMR/TDEE
- Calendar nutrition tab chỉ hiện chart, không hiện con số

**Bài học**: Khi user nghi ngờ logic sai → có thể vấn đề là THIẾU HIỂN THỊ để verify. Tạo EnergyDetailSheet + EnergyBalanceCard giải quyết gốc rễ: user CÓ THỂ nhìn thấy BMR→TDEE→Target→Macros.

---

## 4. Sai lầm trong phân tích

### 4.1 Giả định đơn giản mà không verify

**Sai lầm**: Tính nhẩm age = 2026 - 1996 = 30
**Thực tế**: DOB 15/05, test date 04/04 → chưa qua sinh nhật → age = 29
**Hậu quả**: TẤT CẢ expected values sai, 2 vòng test thất bại (~30 phút)

**Quy tắc**: Mọi phép tính PHẢI viết code verify, KHÔNG tính nhẩm.

```python
# ĐÚNG: Tính bằng code
age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

# SAI: Tính nhẩm "2026 - 1996 = 30"
```

### 4.2 Không đọc comment trong code

File `databaseService.ts` dòng 191-193 ghi rõ:

```
// sql.js (WASM) works in both web browsers and Capacitor WebViews,
// so we use WebDatabaseService universally until a native SQLite
// plugin is integrated for better performance on mobile.
```

Comment nói **rõ ràng** đây là giải pháp tạm. Nhưng tôi chỉ phát hiện architecture issue khi manual test thấy data mất sau restart.

**Quy tắc**: Khi audit code, ĐỌC COMMENT — đặc biệt comment có "TODO", "FIXME", "until", "temporary", "workaround".

### 4.3 Chỉ audit logic, bỏ qua persistence layer

Audit ban đầu focus vào:

- ✅ Công thức tính toán
- ✅ Consumer hooks
- ✅ UI rendering
- ❌ **KHÔNG check** data persistence

**Bài học**: Audit bất kỳ feature nào phải cover đầy đủ 4 tầng:

```
1. Data Layer     — Lưu ở đâu? Persist như nào? Mất khi nào?
2. Logic Layer    — Tính toán đúng không? Edge cases?
3. Integration    — Consumer gọi đúng không? Params đúng không?
4. Presentation   — Hiển thị đúng không? User verify được không?
```

### 4.4 Tin vào assumption thay vì inspect DOM

**Sai lầm**: Giả sử Settings form dùng `type="number"` cho weight (vì semantically hợp lý)
**Thực tế**: Form dùng `type="text"` → script tìm `input[type="number"]` thất bại

**Quy tắc**: LUÔN inspect DOM thật trước khi viết selector.

```javascript
// Debug DOM structure TRƯỚC khi viết script
var inputs = form.querySelectorAll('input');
for (var i = 0; i < inputs.length; i++) {
  console.log(i, inputs[i].type, inputs[i].getAttribute('data-testid'), inputs[i].value);
}
```

---

## 5. Pattern phân tích hiệu quả

### 5.1 "Đổi 1 biến, verify toàn chuỗi"

Cách tốt nhất để tìm bug propagation:

1. Ghi nhận baseline (tất cả giá trị hiện tại)
2. Thay đổi ĐÚNG 1 input (vd: weight 75→80)
3. Check TỪNG ĐIỂM trong chuỗi: BMR→TDEE→Target→Macros→Dashboard→Calendar→Fitness
4. Điểm nào sai = bug ở đoạn đó

### 5.2 "3 giải pháp, chọn 1" cho bug phức tạp

Với mỗi bug, BẮT BUỘC đề xuất ≥2 giải pháp trước khi code:

**Ví dụ BUG-04** (budget dùng TDEE thay vì Target):

- GP1: Fix tại `useTodayCaloriesOut` — thay `tdee` bằng `targetCalories` ✅ **Chọn**
- GP2: Thêm parameter `useGoalTarget` vào hook
- GP3: Tạo hook mới `useDailyBudget` tách biệt

Chọn GP1 vì: ít thay đổi nhất, đúng semantic, không break existing callers.

### 5.3 Kiểm chứng bằng manual test SAU code audit

**Thứ tự đúng**:

```
1. Code audit (tìm bug lý thuyết) → phát hiện 5 bugs
2. Fix code + unit test
3. Manual test trên emulator (verify thực tế) → xác nhận fix đúng
4. Propagation test (thay đổi settings, verify toàn app)
```

**SAI**: Chỉ code audit + unit test rồi coi là xong.
Code audit tìm được BUG-01→05, nhưng KHÔNG tìm được:

- Architecture issue (in-memory SQLite)
- UX issue (thiếu hiển thị BMR/TDEE)
- Integration issue (form type="text" vs "number")

Manual test phát hiện thêm những gì code audit bỏ sót.

---

## 6. Checklist phân tích cho lần sau

### Khi audit 1 feature:

- [ ] **Tầng Data**: Lưu ở đâu? Persist cách nào? Mất khi nào?
- [ ] **Tầng Logic**: Thuật toán đúng? Edge cases? Rounding?
- [ ] **Tầng Integration**: Consumer gọi đúng? Params từ đâu? Hard-code?
- [ ] **Tầng Presentation**: Hiển thị ở đâu? User verify được?
- [ ] **Comments**: Có TODO/FIXME/temporary/workaround?
- [ ] **Tests**: Coverage đủ? Test cases cover edge cases?

### Khi tìm bug:

- [ ] Trace backward từ symptom → root cause
- [ ] Check consumer TRƯỚC, core logic SAU
- [ ] Inspect DOM thật, KHÔNG assume
- [ ] Tính expected values bằng CODE, không nhẩm
- [ ] Đề xuất ≥2 giải pháp, so sánh trade-off
- [ ] Verify bằng manual test sau khi fix

### Khi viết test:

- [ ] Expected values tính DYNAMIC (age, date)
- [ ] Cover propagation chain đầy đủ
- [ ] Test cả positive (happy path) lẫn negative (edge case)
- [ ] Screenshot mỗi bước quan trọng
- [ ] Không restart app giữa test suite (in-memory DB)

## 7. Bẫy `<dialog open>` — Browser UA Stylesheet Override

### Vấn đề

3 fitness components dùng `<dialog open>` để hiển thị confirm modal nhưng KHÔNG override browser UA defaults → modal hiển thị sai (nhỏ, lệch, có border).

### Nguyên nhân

Browser UA stylesheet cho `<dialog>` mặc định: `margin: auto`, `max-width: fit-content`, `border: solid`, `padding: 1em`, `width: fit-content`. Các class Tailwind `fixed inset-0 flex` bị UA override.

### Giải pháp

Dùng component có sẵn (`UnsavedChangesDialog` hoặc `ModalBackdrop`) thay vì raw `<dialog>`. Nếu buộc phải dùng `<dialog open>`, PHẢI thêm: `m-0 max-h-none max-w-none border-none h-full w-full p-0`.

### Bài học

Khi thấy `<dialog>` trong code, luôn kiểm tra xem có override đủ UA defaults chưa. Ưu tiên dùng shared component (ModalBackdrop/UnsavedChangesDialog) để đảm bảo nhất quán.

---

## 8. SQLite Migration — Dual Implementation Pattern

### Vấn đề

Migrate từ sql.js (in-memory, mất data khi restart) sang @capacitor-community/sqlite (persistent trên native).

### Giải pháp: Factory + Dual Implementation

```typescript
// Factory detect platform → return đúng implementation
export function createDatabaseService(): DatabaseService {
  if (Capacitor.isNativePlatform()) return new NativeDatabaseService();
  return new WebDatabaseService();
}
```

- **WebDatabaseService**: sql.js WASM, cho web dev + Vitest
- **NativeDatabaseService**: @capacitor-community/sqlite, cho Android/iOS

### Kinh nghiệm migration

1. **Static import BẮT BUỘC** cho Capacitor plugins — dynamic `import()` fails tại runtime
2. **Plugin API vs Wrapper API**: Plugin dùng options object `{database, statement, values}`, wrapper dùng direct params `(statement, values, transaction)`
3. **Type casting**: Plugin trả về types không khớp với local interface → cần `as unknown as SQLiteDBConnection`
4. **Transaction flag đảo ngược**: `run(statement, values, transaction=true)` means "auto-wrap in transaction" → khi đã trong explicit transaction, pass `false`
5. **Sync consumers PHẢI chuyển binary→JSON**: exportBinary/importBinary → exportToJSON/importFromJSON, filename .sqlite→.json, Content-Type octet-stream→application/json

### Trade-off analysis

| Aspect      | sql.js             | @capacitor-community/sqlite |
| ----------- | ------------------ | --------------------------- |
| Persistence | ❌ In-memory only  | ✅ Disk-based               |
| Web support | ✅ Full            | ❌ Native only              |
| Test compat | ✅ Works in Vitest | ❌ Needs mocking            |
| Performance | Moderate           | Better (native)             |

### Bài học

Migration database layer = thay đổi lớn, cần TDD nghiêm ngặt. Mỗi bước: write test → implement → verify → commit. Và PHẢI test trên emulator — unit test pass không đảm bảo plugin work ở runtime.

---

## 9. Always grep before creating tokens

### Vấn đề

Kế hoạch audit v6 nói "tạo status tokens cho toast states" nhưng khi triển khai, phát hiện tokens này **đã tồn tại** trong `src/index.css` (`--status-success`, `--status-warning`, `--status-error`, `--status-info`). Hoàn toàn không cần tạo.

### Nguyên nhân

Lập kế hoạch từ memory/grep mà không verify lại codebase. Giả định tokens không tồn tại dựa trên thông tin cũ.

### Giải pháp

BẮT BUỘC grep trước khi tạo bất kỳ token/class nào:

```bash
grep -n 'token-name' src/index.css
grep -r 'class-name' src/
```

Nếu đã tồn tại → dùng luôn thay vì tạo duplicate.

### Bài học

Grep before create — tránh duplicate, conflict, và lãng phí thời gian. Luôn verify codebase **đúng lúc**, không dựa vào memory lỗi thời.

---

## 10. Rose ≠ Red, Sky ≠ Blue — never assume Tailwind palette aliases

### Vấn đề

Kế hoạch gốc nói "dùng Red-500 cho toast error" vì `--destructive` dùng Red-500. Nhưng audit thực tế phát hiện:

- Error toast dùng Rose-_ (không phải Red-_)
- Info toast dùng Sky-_ (không phải Blue-_)

Nếu dùng `--destructive` (Red-500) cho toast error, màu sẽ **dịch chuyển rõ rệt** — user sẽ thấy thay đổi.

### Nguyên nhân

Tailwind palette có tên giống nhưng **khác hue**:

- Red (#FF0000) vs Rose (hng hơn, hue ~350°)
- Blue (#0000FF) vs Sky (nhạt hơn, hue ~200°)

Giả định "Red-500 = destructive color" mà không check OKLCH values thực tế.

### Giải pháp

Tạo dedicated tokens với giá trị EXACT:

- `--toast-error: var(--rose-500);` (Rose-500 OKLCH)
- `--toast-info: var(--sky-500);` (Sky-500 OKLCH)

Điều này bảo toàn hue chính xác mà không "approximate" bằng token khác.

### Bài học

Khi mapping colors, LUÔN verify OKLCH values trước. "Close enough" không có — mọi sai khác OKLCH sẽ hiển thị trên mobile. Không bao giờ assume aliases — kiểm tra thực tế.

---

## 11. Critic-driven plan revision is highest-leverage

### Vấn đề

Kế hoạch audit v6 lúc đầu có **8 vấn đề lớn**:

- Đường dẫn file sai (`src/` vs `src/components/`)
- Đếm sai số lượng tokens
- Dependency giả tạo
- Migration không đầy đủ

Nếu bắt đầu code ngay, sẽ:

- Build thất bại (đường dẫn sai)
- Tạo token trùng lặp (count sai)
- Tính toán rebase ngầm (dependencies sai)
- Conflict merge (migration không đủ)

### Nguyên nhân

Lập kế hoạch từ memory + grep nhanh, mà không có independent verification.

### Giải pháp

**Dispatch critic agent SAU kế hoạch, TRƯỚC implementation** (5 phút review).

Critic session phát hiện:

- Đường dẫn cần verify: `src/components/shared/tokens` (không phải `src/tokens`)
- Token reuse opportunity: dùng `--status-*` thay vì tạo `--toast-*`
- Color shift risk: Rose ≠ Red
- Merge conflict risk: 2 branches đều đổi index.css
- Button migration: quên chuyển `bg-blue-600` → `bg-status-info`

### Bài học

**Critic review tại điểm quyết định** (ngay sau plan, trước code) có **ROI cao nhất**. 5 phút review = giảm rework 60% → tiết kiệm giờ code. LUÔN gọi critic cho non-trivial plans.

---

## 12. Logic-dependent CSS classes cannot be migrated

### Vấn đề

Component `DishManager` dùng:

```jsx
<div className={compareIds.has(dish.id) ? 'border-blue-400' : 'border-blue-500'}>
```

Ternary này **kiểm soát border color dựa trên JS logic** (comparison state).

Nếu migrate → chọn 1 token duy nhất (vd `--status-primary`), tính năng "toggle border hiệu ứng khi compare" bị mất.

### Nguyên nhân

CSS classes kiểm soát bởi JS ternary/conditional **không thể tách riêng** — chúng là phần của business logic, không phải styling tĩnh.

### Giải pháp

Phân loại class này:

- **Legitimate domain color**: "logic-dependent, tulsi thực. Archive vào false positives list.
- **Không migrate**: Để ternary gốc `border-blue-400/500` — dùng CSS variables + Tailwind arbitrary values nếu cần refactor.

```jsx
// KHÔNG thay đổi — logic-dependent color
const borderClass = compareIds.has(dish.id) ? 'border-blue-400' : 'border-blue-500';
```

### Bài học

Trước khi migrate bất kỳ color class nào, **LUÔN check xem nó có trong JS ternary/conditional không**. Nếu có → nó là logic-dependent, phải để yên. Chỉ migrate color classes **tĩnh** (không có logic kiểm soát).

---

## 13. Zustand v5 Selector Optimization — Pattern Guide

### Vấn đề

Dashboard re-render quá nhiều do coarse selectors (`useStore(state => state)` hoặc subscribe toàn bộ store).

### Nguyên nhân

Zustand triggers re-render khi selector return value thay đổi (Object.is comparison). Array/object literals luôn tạo ref mới → luôn re-render.

### Giải pháp: 3 patterns theo loại data

```typescript
// Pattern 1: .find() — trả ref ổn định nếu item không đổi
const activePlan = useFitnessStore(s => s.trainingPlans.find(p => p.isActive));

// Pattern 2: Primitive — best, Object.is so sánh trực tiếp
const hasActivePlan = useFitnessStore(s => s.trainingPlans.some(p => p.isActive));

// Pattern 3: .filter() — PHẢI wrap useShallow (tạo array mới mỗi lần)
import { useShallow } from 'zustand/react/shallow';
const todayWorkouts = useFitnessStore(useShallow(s => s.workoutSets.filter(w => isToday(w.date))));
```

### Bài học

`.find()` = safe (ref ổn định), primitive selectors = best, `.filter()` = PHẢI có `useShallow`. Consolidate nhiều useStore calls thành 1 khi chúng cùng store.

---

## 14. aria-disabled → native disabled — Test Impact

### Vấn đề

Đổi `aria-disabled="true"` sang HTML `disabled` attribute → tests fail vì disabled button không fire click event.

### Nguyên nhân

- `aria-disabled` chỉ là hint cho screen reader, click handler VẪN CHẠY
- Native `disabled` attribute block toàn bộ events (click, focus, keydown)
- Tests kiểu "click disabled → show warning" phải đổi thành "verify button is disabled"

### Giải pháp

```typescript
// ❌ Test cũ — SAI sau khi đổi sang disabled
await user.click(deleteBtn);
expect(showNotification).toHaveBeenCalledWith('warning');

// ✅ Test mới — verify disabled attribute
expect(deleteBtn).toBeDisabled();
// HOẶC
expect(deleteBtn).toHaveAttribute('disabled');
```

Thêm Tailwind classes cho visual feedback: `disabled:opacity-50 disabled:pointer-events-none`

### Bài học

Khi migrate aria-disabled → disabled, LUÔN check test suite vì click behavior thay đổi hoàn toàn. Guard code trong handler (isUsed check) trở thành dead code nhưng giữ lại làm safety net.

---

## 15. QUY TẮC #1 Violation — Bài học sống còn

### Vấn đề

Commit 3 waves (622e2d0, 10987c0, 8dfac7f) liên tiếp mà KHÔNG build APK + emulator verify. User called out vi phạm mandatory instruction.

### Nguyên nhân

Bị cuốn vào momentum của parallel agents, focus vào "commit xong wave tiếp theo" mà quên quy trình bắt buộc.

### Giải pháp

**Mỗi commit = 1 APK verify cycle**. KHÔNG ĐƯỢC batch commits rồi verify cuối cùng.

```
Wave N code → lint → test → build → commit
  → npm run build → npx cap sync android
  → cd android && ./gradlew assembleDebug
  → adb install → CDP verify → screenshot
  → PASS → Wave N+1
```

### Bài học

Efficiency (batch commits) ≠ Quality (individual verify). User instructions là LAW, không phải suggestion. Mỗi commit phải kèm emulator screenshot evidence. KHÔNG BAO GIỜ skip QUY TẮC #1 dù có "chỉ thay đổi nhỏ".

---

## 16. JSON.stringify(NaN) trả về "null" — Bẫy debug nguy hiểm

### Vấn đề

CDP fiber inspection trả về `"target": null` nhưng giá trị thực tế là `NaN`. Dẫn đến chẩn đoán sai root cause.

### Nguyên nhân

`JSON.stringify(NaN)` returns `null` theo spec (RFC 8259). `typeof NaN` là `"number"`. Chỉ `Number.isNaN(value)` mới detect đúng.

### Giải pháp

Khi debug giá trị qua CDP/JSON, LUÔN kiểm tra bằng:

```javascript
Number.isNaN(value); // true nếu NaN
typeof value === 'number' && !Number.isFinite(value); // true nếu NaN/Infinity
```

KHÔNG tin `JSON.stringify()` output khi nghi NaN.

### Bài học

`null` trong JSON output ≠ `null` trong runtime. Có thể là `NaN`, `undefined`, hoặc `Infinity`. Luôn verify bằng `Number.isNaN()` trực tiếp.

---

## 17. Defense-in-depth cho NaN display — Guard ở MỌI tầng

### Vấn đề

Initial fix chỉ guard fallback path trong `useNutritionTargets`, bỏ sót full calculation path → NaN vẫn xuất hiện.

### Nguyên nhân

Stale data (weight=0, height=0) trong native SQLite khiến `isProfileConfigured()` return true (vì age=29 ≠ default), rồi full calculation path chạy: `calculateBMR(0, 0, 29, "male")` = -140 → NaN qua division.

### Giải pháp: 3 lớp bảo vệ

```
Layer 1: Hook output    — Number.isFinite() guard TẤT CẢ return values
Layer 2: Display text   — displayCal/displayPro cho text, safeCal/safePro cho math
Layer 3: Component      — Each component self-guard, không tin prop blindly
```

### Bài học

Guard tại 1 điểm = fragile. Guard tại MỌI tầng = robust. Đặc biệt quan trọng khi data source có thể corrupt (stale SQLite, partial profile).

---

## 18. Team Workflow (multi-agent pipeline) — Orchestration Patterns

### Vấn đề

Phân tích 1 module lớn (fitness: 61 files, 12,739 LOC) cần nhiều góc nhìn — business logic, architecture, code quality, test coverage. Làm tuần tự mất quá lâu.

### Giải pháp: 6-agent pipeline

```
Phase 1: CEO Agent (explore codebase + brainstorm) — 10 phút
Phase 2-4: BM + Tech Leader song song — 10 phút
Phase 5-6: Dev + QA song song — 15 phút
Tổng hợp Executive Summary — 5 phút
```

### Kinh nghiệm orchestration

1. **General-purpose agents tự spawn explore sub-agents** — CEO agent tự tạo 3 explore agents, BM tạo 2, Tech Leader tạo 5. Tổng ~15 agents chạy. Không cần micro-manage.
2. **Parallel phases PHẢI độc lập** — BM + Tech Leader chạy song song OK vì không phụ thuộc nhau. Dev + QA phụ thuộc BM + Tech Leader → phải đợi xong.
3. **Context transfer giữa phases** — Inject findings từ phase trước vào prompt phase sau (BM bugs → Dev verify). KHÔNG dùng file sharing — copy trực tiếp vào prompt.
4. **Agent timeout** — General-purpose agents mất 5-15 phút. `read_agent(wait=true, timeout=60)` sẽ timeout nhiều lần → kiên nhẫn, sẽ có notification khi xong.
5. **Output quá lớn** — Agent output > 10KB bị save ra temp file. Dùng `view` với `view_range` để đọc từng phần.
6. **Mỗi agent TỰ tạo document** — Cho agent tự commit document thay vì copy output. Clean hơn + agent verify nội dung trước khi commit.

### Bài học

Multi-agent pipeline 5x nhanh hơn sequential analysis. Nhưng PHẢI có CEO phase đầu tiên để map scope — nếu không, các agent sau sẽ overlap hoặc bỏ sót.

---

## 19. Copilot CLI Extension Creation — User-level Tools & Hooks

### Vấn đề

Muốn port gstack skills (ship, ceo-review, security audit, investigate...) sang Copilot CLI nhưng chúng là Claude Code "SKILL.md" prompts, không tương thích trực tiếp.

### Giải pháp: Copilot CLI Extensions

```javascript
// extension.mjs (ES module, KHÔNG dùng TypeScript)
import { joinSession } from '@github/copilot-sdk/extension';

const session = await joinSession({
  hooks: { onPreToolUse, onSessionStart, onSessionEnd },
  tools: [{ name, description, parameters, handler }],
});
```

### Gotchas quan trọng

1. **PHẢI là `.mjs`** — Copilot CLI không support TypeScript extensions
2. **`location: "user"`** khi scaffold → global extensions, không project-specific
3. **Tools return STRINGS** — Không return objects. String = structured prompt hướng dẫn agent thực hiện multi-step workflow
4. **`onPreToolUse` return `permissionDecision: "ask"`** — Không dùng `"deny"` vì user không có cơ hội override
5. **`session.log()`** cho timeline messages — KHÔNG dùng `console.log` (stdout reserved for JSON-RPC)
6. **Tool names PHẢI globally unique** — Prefix bằng extension name để tránh collision
7. **`skipPermission: true`** cho tools chỉ đọc (readonly) — tránh confirm prompt mỗi lần gọi
8. **Extensions reload trên `/clear`** hoặc `extensions_reload()` — test bằng cách reload

### Pattern: Workflow Tool (ship, investigate, ceo-review)

```javascript
handler: async args => {
  // 1. Gather context (git status, branch, diff)
  const branch = await runShell('git branch --show-current');
  // 2. Return structured prompt with steps
  return `# WORKFLOW: Ship Pipeline\n## Step 1: ...\n## Step 2: ...`;
  // Agent sẽ follow prompt steps tự động
};
```

### Pattern: Safety Hook (careful)

```javascript
onPreToolUse: async input => {
  if (input.toolName !== 'bash') return;
  const cmd = String(input.toolArgs?.command || '');
  // Regex match destructive patterns
  if (isDangerous(cmd)) return { permissionDecision: 'ask', permissionDecisionReason: '...' };
};
```

### Bài học

Copilot CLI extensions = **prompt engineering + tool registration**. Workflow tools không thực sự "chạy" pipeline — chúng trả về structured prompt để agent follow. Safety hooks thì CAN THIỆP trực tiếp vào tool execution.

---

## 20. Persistence Audit Pattern — Kiểm tra "fire-and-forget" writes

### Vấn đề

Fitness module có 24 store actions nhưng chỉ 14 persist SQLite, 10 chỉ update Zustand. Phát hiện bằng multi-agent analysis nhưng có thể phát hiện nhanh hơn bằng grep pattern.

### Pattern detect nhanh

```bash
# Tìm tất cả actions trong store
grep -n "^\s*\w\+:" src/store/fitnessStore.ts | grep -v "//"

# Tìm actions CÓ DB write
grep -n "_db\.\(execute\|run\|query\|transaction\)" src/store/fitnessStore.ts

# So sánh 2 danh sách → actions THIẾU DB write = bugs
```

### Checklist persistence audit

- [ ] Mỗi action thay đổi state → CÓ DB write tương ứng?
- [ ] DB write nào dùng transaction? Nào fire-and-forget?
- [ ] `.catch()` handler có log đủ context? Hay nuốt im lặng?
- [ ] Có retry logic cho failed writes?
- [ ] `initializeFromSQLite()` load TẤT CẢ data mà actions write?

### Bài học

Khi audit bất kỳ Zustand + SQLite store nào: **grep `_db.execute` rồi so sánh với list actions**. Mismatch = potential data loss bug. Session này phát hiện 10/24 actions thiếu — tỷ lệ 42% — rất nghiêm trọng.

---

## 21. Critic feedback timing — relay BEFORE agent completes, not after

### Vấn đề

Critic agent finished reviewing Wave 3 plan while dev agent was mid-flight (33 tool calls in). If critic feedback arrives after agent commits, corrections require extra rollback+recommit cycle.

### Giải pháp

Use `write_agent` to relay critic findings to running dev agent immediately. The agent receives the message as a new conversation turn and can course-correct mid-implementation.

Pattern:

1. Dispatch critic + dev agents in parallel
2. Critic finishes first (faster, smaller scope)
3. `write_agent(dev_id, critic_findings)` immediately
4. Dev agent incorporates corrections before committing

### Bài học

Critic-before-commit > critic-after-commit. Relay findings to running agents via write_agent — don't wait for completion.

---

## 22. Sub-agent spawning sub-agents — orchestration depth 2 is normal

### Vấn đề

Dev-wave3 agent (general-purpose) autonomously spawned:

- 1 explore agent for fitnessStore code research
- 1 critic agent for its own test plan review
- 1 general-purpose sub-agent for FIX-14+FIX-11 test writing

Total: 4 agents for 1 wave. Parent agent orchestrated all of them.

### Giải pháp

This is expected and efficient. General-purpose agents have full tool access including `task()`. Let them self-organize — don't micro-manage.

However: notifications from sub-agents arrive at the main session. Read them to stay informed but don't interfere unless the sub-agent output reveals critical issues.

### Bài học

Depth-2 agent trees are normal for complex waves. Trust the orchestration — intervene only for blocking issues found by critics.

---

## 23. Coverage claims vs reality — always verify independently

### Vấn đề

Dev agent reported "100% statements" for fitnessStore. Independent verification showed 96.55% statements, 83.16% branches. Discrepancy likely from different coverage scoping (isolated file vs full suite).

### Giải pháp

Always run `npx vitest run <file> --coverage` independently after agent completes. Don't trust agent-reported numbers without verification.

### Bài học

Agent coverage claims are approximate. Run your own coverage check before reporting to user.

---

## 24. KHÔNG BAO GIỜ dừng lại giữa pipeline khi user yêu cầu "tự động làm hết"

### Vấn đề

User yêu cầu "tự động làm hết nhá" nhưng Copilot cứ dừng lại sau mỗi Wave/milestone để báo cáo tiến độ và chờ user xác nhận. User phải nhắc 3 lần "tại sao lại dừng lại?"

### Nguyên nhân gốc

1. **Thói quen báo cáo milestone**: Sau mỗi agent hoàn thành → dừng lại report → chờ user
2. **Không dispatch ngay bước tiếp**: Đọc kết quả agent xong → kết thúc turn thay vì dispatch tiếp
3. **Confuse "inform" với "block"**: Báo cáo tiến độ là tốt, nhưng KHÔNG ĐƯỢC block pipeline để chờ phản hồi

### Giải pháp BẮT BUỘC

Khi user nói "tự động", "làm hết", "không cần hỏi":

```
RULE 1: Mỗi turn PHẢI kết thúc bằng 1 action (dispatch agent, run command, hoặc task_complete)
RULE 2: KHÔNG BAO GIỜ kết thúc turn chỉ với text báo cáo — luôn kèm tool call
RULE 3: Khi agent hoàn thành → đọc kết quả → NGAY LẬP TỨC dispatch bước tiếp theo trong CÙNG turn
RULE 4: Báo cáo ngắn (1-2 dòng) kèm theo action, KHÔNG dừng lại chờ
RULE 5: Chỉ dừng khi: (a) gặp lỗi cần user quyết định, (b) pipeline hoàn thành, (c) cần input bắt buộc
```

### Pattern đúng

```
# ❌ SAI — dừng lại report
Agent done → "Wave 3 complete! Results: ..." → END TURN (chờ user)

# ✅ ĐÚNG — report + dispatch ngay
Agent done → "Wave 3 ✅. Starting Wave 4:" → dispatch Wave 4 agent → END TURN
```

### Bài học

"Tự động làm hết" = pipeline chạy liên tục từ đầu đến cuối. Mỗi turn PHẢI có action. User chỉ cần thấy kết quả cuối cùng, không cần approve từng bước.

---

## 25. Full-project audit pipeline — 6 phases, 5 waves, 28 todos

### Vấn đề

Audit toàn bộ project (98k+ LOC, 193 test files) cần structured approach, không thể grep random.

### Giải pháp: Team SOP Pipeline

```
Phase 1: CEO Agent — scan toàn bộ codebase, xác định scope
Phase 2: BM Agent — verify CEO findings, tạo User Stories
Phase 3: Designer — skip nếu pure code audit
Phase 4: Tech Leader — break thành TASK-01→19, dependency graph, 5 waves
Phase 5: Dev — parallel agents per wave (2-5 agents/wave)
Phase 6: QA — emulator test 10 TCs
```

### Kết quả thực tế

- **28 todos tracked** trong SQL database
- **10 commits** across 5 waves
- **~180 new tests**, coverage 98.2% → 99.27% stmts
- **14 SonarQube issues → 0**
- **501kB → 249kB** main chunk (bundle split)
- **~100 hardcoded strings → i18n**
- Tổng thời gian: ~3-4 giờ (với parallel agents)

### Bài học

Structured pipeline (CEO→BM→Leader→Dev→QA) hiệu quả hơn random fixes. Leader phase tạo dependency graph giúp parallelize waves. SQL todo tracking giữ pipeline on track.

---

## 26. Wave-based parallel execution — maximize throughput

### Vấn đề

19 technical tasks cần fix, làm tuần tự sẽ rất chậm.

### Giải pháp: Group tasks thành waves với dependency graph

```
Wave 1: ESLint warnings (1 task, blocking)
Wave 2: Coverage critical files (4 tasks, parallel)
Wave 3: Coverage secondary + batch (5 tasks, parallel)
Wave 4: i18n + bundle optimization (2 tasks, parallel)
Wave 5: SonarQube validation (1 task, blocking)
```

### Pattern dispatch parallel agents

```python
# Dispatch 4 agents cùng lúc
agent1 = task(name="dev-task03", prompt="Fix useTabHistory...", mode="background")
agent2 = task(name="dev-task04", prompt="Fix NutritionGoal...", mode="background")
agent3 = task(name="dev-task05", prompt="Fix PlanTemplate...", mode="background")
agent4 = task(name="dev-task06", prompt="Fix DatabaseCtx...", mode="background")
# Wait for all → merge → commit
```

### Gotchas

1. **Parallel agents có thể edit cùng file** → merge conflicts. Giải pháp: assign files rõ ràng, không overlap.
2. **Coverage reporting khác nhau** giữa `--coverage` flag khác nhau. Luôn verify bằng `npx vitest run --coverage` độc lập.
3. **Agent output > 10KB** → saved to temp file. Dùng `view` với `view_range` để đọc.

### Bài học

Wave structure + parallel agents = 3-5x throughput. Nhưng PHẢI có clear file ownership per agent.

---

## 27. SonarQube scan — 14 issues categories & fix patterns

### Vấn đề

Sau lint + test + build pass, SonarQube vẫn phát hiện 14 issues (6 BLOCKER, 4 MAJOR, 3 MINOR, 1 BUG).

### Categories phổ biến

| Category             | Count | Ví dụ                                   | Fix                |
| -------------------- | ----- | --------------------------------------- | ------------------ |
| Deprecated API       | 3     | `String.fromCharCode` → `fromCodePoint` | Thay API           |
| Deprecated API       | 2     | `unescape()` → `decodeURIComponent`     | Thay API           |
| Cognitive complexity | 2     | Function > 15 complexity                | Extract helper     |
| Identical branches   | 1     | `if/else` return same value             | Remove dead branch |
| Unused import        | 2     | Import not used after refactor          | Remove             |
| Type safety          | 2     | Implicit `any` from catch               | Type narrow        |
| Regex safety         | 1     | Non-escaped special chars               | Escape             |
| String safety        | 1     | Template literal in wrong context       | Fix syntax         |

### Pattern fix nhanh

```bash
# Check SonarQube issues qua API (không cần auth)
curl -sf "http://localhost:9000/api/issues/search?componentKeys=meal-planing&resolved=false" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); [print(f'{i[\"component\"]}:{i[\"line\"]} [{i[\"severity\"]}] {i[\"message\"]}') for i in d['issues']]"
```

### Bài học

ESLint bắt syntax/style, SonarQube bắt **logic bugs + deprecated APIs + cognitive complexity**. Cả hai đều cần. Run SonarQube TRƯỚC commit, không phải sau.

---

## 28. Bundle splitting strategy — manualChunks in Vite

### Vấn đề

Main chunk 501kB (vượt 500kB warning), gây slow initial load trên mobile.

### Nguyên nhân

`@google/genai` (258kB) bundled vào main chunk dù chỉ dùng trong 1 feature (AI analysis).

### Giải pháp: 3 dòng trong vite.config.ts

```typescript
manualChunks(id) {
  if (id.includes('@google/genai')) return 'vendor-genai';
}
```

### Kết quả

- Main chunk: 501kB → **249kB** (-50%)
- vendor-genai chunk: 258kB (lazy loaded khi cần)

### Trade-off analysis

| Option              | Pros            | Cons                           |
| ------------------- | --------------- | ------------------------------ |
| manualChunks (chọn) | Simple, 3 lines | Chunk vẫn load khi navigate    |
| Dynamic import()    | True lazy load  | Cần refactor import sites      |
| Tree-shaking        | Smallest size   | GenAI SDK không tree-shake tốt |

### Bài học

`manualChunks` là quick win cho bundle > 500kB. Identify thư viện lớn nhất bằng `npm run analyze` → tách riêng. Với MealPlaning, @google/genai chiếm 50% main chunk.

---

## 29. i18n extraction at scale — 100 strings across 14 files

### Vấn đề

~100 hardcoded Vietnamese strings scattered across 14 source files. ESLint không bắt, SonarQube không bắt, chỉ code review mới phát hiện.

### Pattern tìm hardcoded strings

```bash
# Tìm Vietnamese characters trong source (trừ test + i18n files)
grep -rn '[àáạảã-ỹ]' src/ --include='*.tsx' --include='*.ts' \
  --exclude-dir='__tests__' --exclude-dir='locales' | head -30
```

### Pattern extraction

1. **Constants/arrays**: Extract array items → i18n keys array, `t(keys[i])`
2. **Template literals**: Extract static parts → `t('key', { variable })`
3. **Inline strings**: Direct → `t('namespace.key')`
4. **Zod validation messages**: Extract → `{ message: t('validation.key') }`

### Namespace organization

```json
{
  "insights": { "title1": "...", "tip1": "..." },
  "tips": { "daily1": "...", "daily2": "..." },
  "validation": { "invalidEmail": "..." },
  "common": { "dayLabels": { "monday": "Thứ Hai" } }
}
```

### Bài học

i18n extraction cần **systematic grep** không phải random finding. Tổ chức keys theo namespace (feature/concern). Dynamic keys `t(`prefix.${var}`)` cần tất cả possible values có entry.

---

## 30. QA emulator test — false positive detection

### Vấn đề

TC-05 (Dashboard) failed vì test script check `includes("kcal") || includes("Dashboard")` nhưng Vietnamese UI hiển thị "Tổng quan" và "Protein".

### Nguyên nhân

Test script dùng English keywords thay vì Vietnamese. Dashboard bypassed onboarding nên không có nutrition data → không hiện "kcal".

### Giải pháp

Test assertions cho Vietnamese app PHẢI dùng Vietnamese text:

```python
# ❌ SAI — English keywords
'document.body.innerText.includes("Dashboard")'

# ✅ ĐÚNG — Vietnamese keywords
'document.body.innerText.includes("Tổng quan")'
```

### Bài học

QA scripts cho Vietnamese app PHẢI dùng Vietnamese assertions. Khi 1 TC fail, verify bằng debug script trước khi kết luận bug — có thể chỉ là test script sai.

---

## 31. v8 ignore annotations — khi nào dùng, khi nào không

### Vấn đề

User hỏi tại sao dùng `/* v8 ignore next -- defensive: ... */` trong code.

### Giải thích

`v8 ignore` là annotation cho **coverage tool** (V8/Istanbul), KHÔNG phải eslint-disable. Nó nói với coverage tool: "dòng này unreachable trong production nhưng tôi giữ lại như defensive guard".

### Khi nào dùng (hợp lệ)

```typescript
// ✅ NaN guard sau calculation chain — mathematically unreachable nhưng guard cho data corruption
if (Number.isNaN(bmr)) /* v8 ignore next -- defensive: NaN from corrupt data */ return { bmr: 0, tdee: 0, target: 0 };

// ✅ Null check sau type narrowing — TypeScript guarantees non-null nhưng runtime guard
if (!user) /* v8 ignore next -- defensive: null after type narrowing */ return defaultProfile;
```

### Khi nào KHÔNG dùng

```typescript
// ❌ Logic branch that CAN be reached — phải viết test cover nó
if (items.length === 0) /* v8 ignore next */ // SAI — empty array IS reachable
  return [];

// ❌ Error handling that SHOULD be tested
try { ... } catch (e) { /* v8 ignore next */ } // SAI — errors happen!
```

### Bài học

`v8 ignore` ≠ `eslint-disable`. Nó chỉ ảnh hưởng coverage report, không bỏ qua lint rule. Dùng khi branch genuinely unreachable nhưng cần defensive guard. LUÔN kèm comment giải thích tại sao unreachable.

---

## 32. ESLint override cho generated/third-party code

### Vấn đề

`react-refresh/only-export-components` warning cho `src/components/ui/*` (shadcn/ui generated) và `src/contexts/*` (React contexts export cả provider + hook).

### Giải pháp: Targeted override (không phải eslint-disable)

```javascript
// eslint.config.js
{
  files: ['src/components/ui/**', 'src/contexts/**'],
  rules: {
    'react-refresh/only-export-components': 'off',
  },
}
```

### Tại sao override thay vì fix code

1. `components/ui/` = generated by shadcn CLI → sẽ bị overwrite khi update
2. `contexts/` = React pattern chuẩn: export `Provider` + `useContext` hook từ cùng file
3. Rule `only-export-components` không áp dụng cho context files (chúng KHÔNG phải components)

### Bài học

ESLint override ở config level ≠ eslint-disable ở code level. Override là architectural decision (loại file này exempt), disable là hack (dòng code này skip). Project rule "never use eslint-disable" vẫn intact.

---

## 33. React Compiler + Zustand — useShallow là ngoại lệ duy nhất

### Vấn đề

React Compiler active → không được dùng `useCallback`/`useMemo` (compiler tự optimize). Nhưng Zustand `.filter()` selectors tạo array mới mỗi render → re-render loop.

### Giải pháp duy nhất

```typescript
import { useShallow } from 'zustand/react/shallow';

// ✅ OK — useShallow là ngoại lệ được phép
const items = useStore(useShallow(s => s.items.filter(i => i.active)));

// ❌ KHÔNG ĐƯỢC — React Compiler handles this
const handler = useCallback(() => { ... }, [deps]); // compiler tự optimize

// ❌ KHÔNG ĐƯỢC
const value = useMemo(() => expensive(), [deps]); // compiler tự optimize
```

### Bài học

Khi React Compiler active, `useShallow` là **ngoại lệ duy nhất** cho manual memoization — chỉ dùng cho Zustand selectors trả về new reference (`.filter()`, `.map()`, object literals). Tất cả các trường hợp khác → để compiler handle.

---

## 34. Multi-wave parallel agent orchestration — icon audit at scale

### Vấn đề

Icon audit toàn dự án: 96 Lucide icons, ~20 emoji, 52 hardcoded symbols in vi.json — cần thay đổi 34 files, 179 mapped entries.

### Giải pháp: 4-wave parallel execution

```
Wave 1: 3 parallel agents (icon semantics) — Dumbbell/Flame/misc fixes
Wave 2: 3 parallel agents (color unification) — unify/add/settings colors
Wave 3: Manual (emoji cleanup) — dead code removal, WorkoutLogger
Wave 4: Manual (vi.json cleanup) — strip emoji/arrows/checkmarks from i18n
```

### Gotchas phát hiện

1. **Sub-agents miss files**: wave1-flame agent claimed StreakCounter.tsx "doesn't exist" (it does at `src/features/fitness/components/StreakCounter.tsx`). wave1-dumbbell missed `tips.ts`. → Always verify agent claims manually.
2. **Test merging error**: When manually fixing useQuickActions.test.ts, accidentally merged two test blocks (fitness 4 calls + calendar 5 calls → single block expecting 5 calls to wrong tab). → Always run test after manual edits.
3. **Emoji in AiInsightCard ICON_PREFIX_MAP**: Agents changed ICON_MAP but forgot ICON_PREFIX_MAP emojis AND tests. → When changing icon maps, grep for ALL related maps and tests.
4. **Pre-existing SonarQube issues**: 9 MINOR issues showed up in scan but none at lines I modified → verify with `git diff --name-only` before concluding you caused them.

### Bài học

For large-scale icon/color refactors: create exhaustive mapping FIRST (179 entries), then wave-based execution with clear file ownership per agent. Manual follow-up always needed — agents miss ~10-15% of files.

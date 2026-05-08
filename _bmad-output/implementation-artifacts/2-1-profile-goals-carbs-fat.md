# Story 2.1: Profile & Goals — carbs/fat targets + goal label normalize + selected-card color fix

Status: done

> **Backfill note (2026-05-08):** Story file authored 2026-05-07; implementation shipped commit `8e83bc4` (`feat(settings): add carbs/fat goals + canonical "Tăng sức mạnh" label (Story 2.1)`). Status promoted to `done` 2026-05-08 to match SSOT.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **người dùng theo dõi macro chi tiết trên HealthMate AI**,
I want **set mục tiêu carbs/fat (g/ngày) optional trong Settings → Mục tiêu, đồng thời các option label và selected-state visual nhất quán với onboarding**,
so that **F-04 Tracking ở Phase 3 có thể tính progress đầy đủ 4 macro (calo/protein/carbs/fat), và user không bị confuse giữa "selected state" với "primary action LƯU".**

## Acceptance Criteria

1. **AC1 — Hai input optional carbs/fat.** `goals-edit.page.html` có thêm 2 number input "Carbs (g/ngày)" và "Fat (g/ngày)" ngay dưới input Protein, dùng cùng floating-label pattern hiện tại; placeholder hiển thị `"Tự động"` khi value null/0.
2. **AC2 — Persist `target_carbs` + `target_fat` (cột thật trong schema).** User nhập carbs = 250 + fat = 70 → bấm "Lưu" → `profile.target_carbs = 250`, `profile.target_fat = 70` persist qua `ProfileStore.updateProfile()`; reload app vẫn còn; column name là `target_carbs` / `target_fat` (KHÔNG phải `target_carbs_g` / `target_fat_g` — schema.ts:41-42 đã dùng tên không suffix).
3. **AC3 — Null vs zero (state thật).** User xoá input carbs (để trống) → bấm "Lưu" → `target_carbs = null` (không phải 0). Settings hub nutrition tile hiển thị `—` cho dòng Carbs khi null, hiển thị `<n> g` khi có giá trị.
4. **AC4 — Validation range.** Carbs/fat nhập −10 hoặc 9999 → form invalid: hiển thị message `"Giá trị phải từ 0 đến 1000"` dưới input; nút Lưu disabled. Carbs/fat = empty (null) hợp lệ (optional).
5. **AC5 — Goal label canonical = `Tăng sức mạnh` (P0-2 fold).** Replace mọi chỗ hiển thị `"Tăng hiệu suất"` (hiện ở 2 file: `goals-edit.page.ts:59` + `settings.page.ts:37` map `performance: 'Tăng hiệu suất'`) → `"Tăng sức mạnh"`. Onboarding step 1 đã dùng `Tăng sức mạnh` (`onboarding.page.html:88`) — chốt làm canonical. Enum value `Goal = 'performance'` GIỮ NGUYÊN (chỉ đổi label hiển thị, không migration).
6. **AC6 — Goal options parity 4 màn.** uiautomator/visual diff: 4 string `Giảm cân` / `Duy trì` / `Tăng cơ` / `Tăng sức mạnh` xuất hiện đúng 1 cách ở: (a) `onboarding.page.html` step 1, (b) `goals-edit.page.html` 4 option, (c) `settings.page.ts` goal label map (hub row "Mục tiêu"). Không còn chuỗi `"Tăng hiệu suất"` trong `src/`.
7. **AC7 — Selected card color refactor (P0-4 fold).** `goals-edit.page.scss` `.goal-option--selected` (hoặc class tương đương trong file scss line 30-32, hiện đang dùng `var(--ion-color-secondary)` cam → trùng button LƯU primary): refactor thành pattern `border: 2px solid var(--ion-color-primary)` + `background: rgba(var(--ion-color-primary-rgb), 0.08)` + thêm icon `<ion-icon name="checkmark-circle">` slot end khi selected. Card selected KHÔNG còn fill cam, KHÔNG bị nhầm là button.
8. **AC8 — Visual no-clash với button LƯU.** Screenshot light + dark mode goals-edit có 1 option selected: card selected màu xanh brand, button "LƯU" footer giữ màu cam (`--ion-color-secondary`) → 2 màu phân biệt rõ. Lưu vào `docs/6-testing/screenshots/story-2.1/selected-light.png` + `selected-dark.png`.
9. **AC9 — Settings hub nutrition tile 4 dòng.** `settings.page.html` (hiện chỉ 2 dòng Calo + Protein, line 47-53) bổ sung 2 dòng Carbs + Fat dùng cùng `ion-item` pattern; mỗi dòng hiển thị value hoặc `—` khi null; thứ tự: Calo → Protein → Carbs → Fat.
10. **AC10 — Spec test pass.** `ng test --include='**/goals-edit*' --include='**/settings*'` xanh; thêm các test:
    - `target_carbs/target_fat` persist null vs number qua `updateProfile()` mock
    - validation range −1, 0, 1000, 1001
    - goal label binding render `Tăng sức mạnh` cho enum `'performance'`
    - selected card class apply đúng khi `goal() === option.value`
11. **AC11 — CI guards + build.** `npm run check:guards` 5/5 pass (form-pattern / pc1 / style-2025 / design-tokens / macro-naming); `ionic build` no error.

## Tasks / Subtasks

- [ ] **Task 1 — UserProfile model expose carbs/fat (AC: #2, #3)**
  - [ ] Mở `src/app/core/models/user-profile.types.ts`
  - [ ] Verify type `UserProfile` đã có `target_carbs?: number | null` + `target_fat?: number | null` (nếu chưa, thêm — phải khớp schema.ts cột `REAL` nullable)
  - [ ] Note: tên field = `target_carbs` / `target_fat` (KHÔNG có suffix `_g`)
- [ ] **Task 2 — goals-edit form thêm carbs/fat (AC: #1, #2, #3, #4)**
  - [ ] Mở `src/app/features/settings/goals-edit/goals-edit.page.ts`
  - [ ] Thêm 2 signal: `carbs = signal<number | null>(null)` + `fat = signal<number | null>(null)`
  - [ ] Thêm computed validation: `carbsInvalid` / `fatInvalid` — invalid khi value !== null && (value < 0 || value > 1000)
  - [ ] Cập nhật `formInvalid` computed include carbsInvalid + fatInvalid
  - [ ] Thêm setter `setCarbs(v: number | null)` + `setFat(v: number | null)` (mark `userTouchedTargets` nếu có giá trị) — kế thừa pattern hiện tại của `setCalo` / `setProtein`
  - [ ] `ngOnInit()` seed: `this.carbs.set(p.target_carbs ?? null)` + `this.fat.set(p.target_fat ?? null)`
  - [ ] `save()` payload thêm: `target_carbs: this.carbs(), target_fat: this.fat()` (truyền `null` khi user xoá input)
  - [ ] `recalcTargets()` hiện tại không tính carbs/fat → không thay đổi `recalc`/`reset()` logic; carbs/fat luôn manual
  - [ ] Mở `goals-edit.page.html` thêm 2 floating-label input dưới Protein input (giữ pattern hiện có); bind `[ngModel]="carbs()"` `(ngModelChange)="setCarbs($event)"`; placeholder `"Tự động"`; hiển thị error message khi `carbsInvalid()`
- [ ] **Task 3 — Goal label normalize (AC: #5, #6)**
  - [ ] Mở `src/app/features/settings/goals-edit/goals-edit.page.ts:59` → đổi `'Tăng hiệu suất'` → `'Tăng sức mạnh'`
  - [ ] Mở `src/app/features/settings/settings.page.ts:37` → đổi `performance: 'Tăng hiệu suất'` → `performance: 'Tăng sức mạnh'`
  - [ ] Verify: `grep -rn 'Tăng hiệu suất' src/` → 0 match
  - [ ] Verify: `grep -rn 'Tăng sức mạnh' src/` → ít nhất 3 match (onboarding + goals-edit + settings.page)
- [ ] **Task 4 — Selected card color refactor (AC: #7, #8)**
  - [ ] Mở `src/app/features/settings/goals-edit/goals-edit.page.scss` line 30-32
  - [ ] Selector hiện tại đang style `&[selected="true"]` hoặc `.goal-option--selected` — read code trước rồi thay 3 dòng:
    ```scss
    background: rgba(var(--ion-color-primary-rgb), 0.08);
    border: 2px solid var(--ion-color-primary);
    color: var(--ion-text-color); // KHÔNG đổi text color theo selected
    ```
  - [ ] Mở `goals-edit.page.html` add `<ion-icon name="checkmark-circle" slot="end">` (hoặc element tương đương) chỉ render khi `goal() === option.value`
  - [ ] **KHÔNG dùng** `var(--ion-color-secondary)` (cam) trong style của card selected — màu cam là dành cho button LƯU primary
  - [ ] Verify dark mode: `--ion-color-primary-rgb` token resolve đúng cho dark scheme (chỉ tint 8% nên contrast vẫn đủ ≥ 4.5:1)
- [ ] **Task 5 — Settings hub nutrition tile 4 dòng (AC: #9)**
  - [ ] Mở `src/app/features/settings/settings.page.html` line 47-53 (đang có Calo + Protein)
  - [ ] Thêm 2 `ion-item` Carbs + Fat dùng cùng pattern; bind:
    ```html
    <ion-note slot="end">{{ profile()?.target_carbs ? profile()!.target_carbs + ' g' : '—' }}</ion-note>
    ```
  - [ ] Thứ tự cuối: Calo / Protein / Carbs / Fat
- [ ] **Task 6 — Spec tests (AC: #10)**
  - [ ] Mở `goals-edit.page.spec.ts`:
    - Thêm test "persists target_carbs and target_fat from input" — set carbs=250, fat=70, save → assert `updateProfile` called với `target_carbs: 250, target_fat: 70`
    - Thêm test "persists null when carbs/fat input cleared"
    - Thêm test "carbsInvalid true when value < 0 or > 1000"
    - Thêm test "renders 'Tăng sức mạnh' label for performance enum" (template snapshot hoặc `By.css`)
    - Thêm test "selected option has selected class when goal matches"
  - [ ] Mở `settings.page.spec.ts`: thêm test "renders Carbs and Fat rows with em-dash when null" + "renders value with g unit when set"
- [ ] **Task 7 — Build + visual QA (AC: #8, #11)**
  - [ ] `npm run check:guards` → 5/5 pass
  - [ ] `ng test --include='**/goals-edit*' --include='**/settings*'` → green
  - [ ] `ionic build` → no error
  - [ ] `cd android && ./gradlew assembleDebug` → APK `android/app/build/outputs/apk/debug/app-debug.apk`
  - [ ] Load skill `mealplaning-emulator-fast-qa` để boot emulator-5554
  - [ ] Install APK, walk-through onboarding với goal = `Tăng sức mạnh`
  - [ ] Vào Settings → Mục tiêu → chọn 1 option, capture screenshot light:
    `adb -s emulator-5554 exec-out screencap -p > docs/6-testing/screenshots/story-2.1/selected-light.png`
  - [ ] Toggle dark mode (Sáng/Tối/Hệ thống → Tối), chụp lại `selected-dark.png`
  - [ ] Verify visual: card selected viền xanh + tint nhạt, button LƯU footer cam → KHÔNG đụng nhau
  - [ ] Mkdir folder nếu chưa có: `docs/6-testing/screenshots/story-2.1/`
- [ ] **Task 8 — Commit**
  - [ ] Conventional commit: `feat(settings): expose carbs/fat targets + normalize goal label + fix selected-card color (Story 2.1)`
  - [ ] Body: liệt kê AC pass + screenshot evidence path + reference epic-2 rev 2 fold P0-2 + P0-4

## Dev Notes

### Hiện trạng code (đã ship — KHÔNG reinvent)

| File | Trạng thái | Story này thay đổi |
|------|-----------|---------------------|
| `src/app/core/services/database/schema.ts:39-42` | ✅ Cột `target_carbs REAL` + `target_fat REAL` đã tồn tại nullable trong `profiles` table | KHÔNG sửa schema, KHÔNG cần migration |
| `src/app/core/models/user-profile.types.ts` (4 dòng) | ⚠️ File chỉ export 4 type alias (Gender / Goal / ActivityLevel / GymExperience) — KHÔNG có interface `UserProfile` ở đây | Verify xem `UserProfile` interface ở đâu (có thể `src/app/core/models/profile.ts` hoặc inline trong store); đảm bảo có `target_carbs?` + `target_fat?` |
| `src/app/core/stores/profile.store.ts:36` | ✅ `updateProfile(patch: Partial<UserProfile>)` — chấp nhận partial | KHÔNG sửa store |
| `src/app/features/settings/goals-edit/goals-edit.page.ts` (141 dòng) | ✅ Pattern: signal-based form, `recalcTargets()` auto-suggest cho calo/protein theo goal change, `userTouchedTargets` flag chặn override | Thêm signal carbs/fat (manual, KHÔNG vào auto-suggest), label fix line 59 |
| `src/app/features/settings/goals-edit/goals-edit.page.html` (72 dòng) | ✅ 4 goal option card + 2 input calo/protein + footer LƯU | Thêm 2 input + checkmark icon |
| `src/app/features/settings/goals-edit/goals-edit.page.scss` (49 dòng) | ⚠️ Line 30-32 selected state dùng `--ion-color-secondary` (cam) → CONFLICT với button LƯU primary cam (P0-4) | Refactor 3 dòng → border + tint primary |
| `src/app/features/settings/settings.page.ts:37` | ⚠️ Map `performance: 'Tăng hiệu suất'` (P0-2) | Đổi `'Tăng sức mạnh'` |
| `src/app/features/settings/settings.page.html:47-53` | ⚠️ Chỉ 2 dòng Calo + Protein trong nutrition tile | Thêm 2 dòng Carbs + Fat |
| `src/app/features/onboarding/onboarding.page.html:88` | ✅ Đã dùng `Tăng sức mạnh` — canonical | KHÔNG sửa |

### Schema field naming pitfall (CRITICAL)

Epic-2 rev 2 ban đầu note `target_carbs_g` / `target_fat_g` nhưng schema.ts:41-42 thực tế dùng `target_carbs` / `target_fat` (không suffix `_g`). **Phải dùng tên đúng schema** — sai tên → SQL error hoặc field bị ignore khi persist. Verified bằng:
```bash
grep -n 'target_carbs\|target_fat' src/app/core/services/database/schema.ts
```

### Goal enum vs label separation

`Goal` type union: `'lose_weight' | 'gain_muscle' | 'maintain' | 'performance'`. Story này CHỈ đổi **label hiển thị** của enum value `'performance'` từ `Tăng hiệu suất` → `Tăng sức mạnh`. KHÔNG migration data, KHÔNG đổi enum value. Onboarding đã dùng label `Tăng sức mạnh` → chốt canonical (`Tăng sức mạnh` gần PRD F-04 "strength" hơn về ngữ nghĩa, dù enum vẫn là `'performance'` lý do legacy).

### Selected card color rationale (audit P0-4)

Hiện tại 4 option card khi selected dùng nền cam `--ion-color-secondary` — trùng màu button LƯU footer cũng cam. Visual hierarchy: state selected nhìn giống button → user nhầm "đã chọn = đã save". Refactor: state dùng accent xanh brand (border + tint nhạt + icon ✓) — phân biệt rõ "đây là state, KHÔNG phải action". Pattern này align với design-system §8 list pattern.

### Pitfalls cần tránh

1. ❌ **KHÔNG dùng `target_carbs_g` / `target_fat_g`** — sai tên schema. Chỉ `target_carbs` / `target_fat`.
2. ❌ **KHÔNG tự ý đổi enum `Goal` từ `'performance'` → `'strength'`** — sẽ break migrations + spec test khắp project. Chỉ đổi label hiển thị.
3. ❌ **KHÔNG đưa carbs/fat vào `recalcTargets()`** — out-of-scope; `recalc` chỉ tính calo + protein. Carbs/fat ở story này là manual input only.
4. ❌ **KHÔNG persist `target_carbs = 0` thay vì `null`** khi user xoá input — F-04 Phase 3 progress logic phân biệt "không set" (`null`) vs "set = 0". Strict check trong save.
5. ❌ **KHÔNG dùng `--ion-color-primary` solid fill** cho card selected — vẫn nhìn giống button. Phải là border + tint 8%.
6. ❌ **KHÔNG strip "g" unit khỏi nutrition tile hub** — UI consistent với row Protein hiện tại (`X g`).
7. ❌ **KHÔNG sửa `onboarding.page.html`** — đã dùng đúng canonical label `Tăng sức mạnh`.

### Out-of-scope (Story 2.1 KHÔNG làm)

- ❌ Auto-suggest carbs/fat theo goal/weight (defer Phase 3 hoặc Story 2.5 polish)
- ❌ Activity label normalization (D3) — chuyển sang Story 2.4
- ❌ Body Edit TDEE bracket fix (P0-3) — Story 2.4
- ❌ Activity Edit redundant `(Vừa)` (P0-5) — Story 2.4
- ❌ Typography tier / spacing token (P1) — Story 2.5
- ❌ Sticky button refactor / button color align brand (P1) — Story 2.5
- ❌ Schema migration cho `target_carbs` / `target_fat` — column đã tồn tại từ schema gốc, KHÔNG cần migration
- ❌ Dark mode QA toàn bộ Settings — Story 2.3 (story này chỉ verify selected card render đúng dark)

### Project Structure Notes

- File mới tạo: `docs/6-testing/screenshots/story-2.1/*.png` (folder mới — convention align Story 2.2)
- Không tạo file source mới
- Không thay đổi schema, không migration
- Không impact `recalcTargets()` (`src/app/core/services/profile/recalc-targets.ts`)
- Không impact onboarding flow (label đã đúng)

### Convention rules — MUST follow

- **Strict TS**: no `any`. `signal<number | null>(null)` cho carbs/fat (nullable explicit).
- **PC-1 binary**: KHÔNG thêm `@Component` mới; sửa `.ts` page → giữ nguyên `templateUrl + styleUrl`.
- **Style 2025**: KHÔNG dùng suffix `Service` / `.service.ts` (story này không tạo service).
- **Design tokens**: dùng `var(--ion-color-primary)` + `var(--ion-color-primary-rgb)` — KHÔNG hard-code hex như `#4CAF50` hoặc `rgba(76, 175, 80, 0.08)`. Guard `check:design-tokens` enforce.
- **Form pattern**: floating-label kiểu hiện tại trong `goals-edit.page.html` (calo / protein). Reuse cho carbs / fat.
- **Macro naming**: trường nutrition trong DB dùng `protein` / `carbs` / `fat` (không suffix unit). Trường target dùng `target_protein` / `target_carbs` / `target_fat`. Story này phải khớp 100%.

### References

- [Source: docs/2-requirements/prd.md#F-04: Tracking] — phụ thuộc 4 macro carbs/fat target để tính progress Phase 3
- [Source: docs/3-design/design-system.md#§8 list pattern] — selected card border + tint pattern
- [Source: docs/4-architecture/coding-conventions.md#Style 2025] — naming
- [Source: _bmad-output/planning-artifacts/epic-2-settings-polish.md#Story 2.1] — epic spec rev 2 với scope expansion P0-2 + P0-4
- [Source: _bmad-output/implementation-artifacts/settings-uiux-audit.md#P0-2, P0-4] — audit findings root cause + screenshot evidence
- [Source: src/app/core/services/database/schema.ts:39-42] — column names `target_carbs` / `target_fat` (REAL nullable)
- [Source: src/app/features/settings/goals-edit/goals-edit.page.ts] — current form pattern signal-based
- [Source: src/app/features/settings/goals-edit/goals-edit.page.scss:30-32] — selected state hiện tại dùng cam (P0-4 root cause)
- [Source: src/app/features/onboarding/onboarding.page.html:88] — canonical label `Tăng sức mạnh`
- [Source: docs/qa-annotated/settings-uiux-audit/02-goals-edit-annotated.png + 03-activity-edit-annotated.png] — visual evidence cam clash

## Dev Agent Record

### Agent Model Used

_(Sẽ được dev agent fill khi implement)_

### Debug Log References

_(Sẽ được fill: `npm run check:guards` log, `ng test` summary, screenshot paths)_

### Completion Notes List

_(Sẽ được fill: AC# nào pass tự động, AC# nào pass manual, deviation từ plan, follow-up gaps)_

### File List

_(Sẽ được fill — predicted):_
- `src/app/core/models/user-profile.types.ts` (verify, possibly modify)
- `src/app/features/settings/goals-edit/goals-edit.page.ts` (modify — signal carbs/fat + label)
- `src/app/features/settings/goals-edit/goals-edit.page.html` (modify — 2 input + icon)
- `src/app/features/settings/goals-edit/goals-edit.page.scss` (modify — selected style)
- `src/app/features/settings/goals-edit/goals-edit.page.spec.ts` (modify — new tests)
- `src/app/features/settings/settings.page.ts` (modify — label map)
- `src/app/features/settings/settings.page.html` (modify — 2 nutrition rows)
- `src/app/features/settings/settings.page.spec.ts` (modify — new tests)
- `docs/6-testing/screenshots/story-2.1/selected-light.png` (new)
- `docs/6-testing/screenshots/story-2.1/selected-dark.png` (new)

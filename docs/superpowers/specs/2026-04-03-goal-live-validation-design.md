# VĐ5 Round 3: Live Cross-field Validation — Weight Goal

## Problem

Khi user đổi goalType (ví dụ cut→bulk) mà targetWeight vẫn giữ giá trị cũ, app không validate lại ngay. Nút Lưu/Tiếp tục vẫn active dù form đang invalid. Error chỉ hiển thị khi click Save/Next.

Bug scenario: cân nặng 80kg → Giảm cân → mục tiêu 70kg ✓ → đổi sang Tăng cơ → 70kg < 80kg nên phải fail → nhưng nút Lưu vẫn xanh.

## Root Causes

1. Schema `goalFormSchema` thiếu cross-field validation (superRefine)
2. `handleGoalTypeChange` không trigger revalidation khi cut↔bulk
3. `hasChanges={isEditing}` luôn true → nút Save không bao giờ disabled
4. Onboarding và Settings có validation behavior khác nhau ở 9 điểm

## Solution: Schema-level superRefine

### 1. goalValidation.ts — Thêm `createGoalValidationSchema(currentWeight)`

```typescript
export function createGoalValidationSchema(currentWeight: number | undefined) {
  return goalFormSchema.superRefine((data, ctx) => {
    if (data.goalType !== 'maintain' && data.targetWeightKg != null && currentWeight != null) {
      const error = validateTargetWeight(data.goalType, currentWeight, data.targetWeightKg);
      if (error) {
        ctx.addIssue({ code: 'custom', path: ['targetWeightKg'], message: error });
      }
    }
  });
}
```

Cả 2 bên dùng: `zodResolver(createGoalValidationSchema(currentWeight))`

### 2. GoalPhaseSelector.tsx (Settings)

- Dùng `createGoalValidationSchema(currentWeight)` thay vì `goalFormSchema`
- `handleGoalTypeChange`: khi cut↔bulk → `form.trigger('targetWeightKg')` để trigger schema revalidation
- Bỏ manual `validateTargetWeight()` trong `handleSave()` (schema xử lý)
- Expose `form.formState.isValid` qua callback `onValidityChange`
- Translation keys: `onboarding.goal.*` → `goal.*`

### 3. NutritionGoalStep.tsx (Onboarding)

- Dùng `createGoalValidationSchema(form.getValues('weightKg'))`
- Thêm `handleGoalTypeChange`: maintain → clear targetWeight; cut↔bulk → trigger validation
- Thêm error clearing khi user nhập targetWeight
- Bỏ manual `validateTargetWeight()` trong `handleNext()`
- Next button: disabled khi `!isStepValid` (derived from formState)
- Translation keys: `onboarding.goal.*` → `goal.*`

### 4. GoalDetailPage.tsx

- `hasChanges` dựa trên `isEditing && isFormValid` (not just isEditing)
- `isFormValid` state updated via callback từ GoalPhaseSelector

### 5. vi.json — Thêm missing `goal.*` keys

```json
"goal.type_cut": "Giảm cân",
"goal.type_cut_desc": "Giảm mỡ, giữ cơ",
"goal.type_maintain": "Duy trì",
"goal.type_maintain_desc": "Giữ nguyên cân nặng",
"goal.type_bulk": "Tăng cơ",
"goal.type_bulk_desc": "Tăng cân, xây cơ",
"goal.rate_conservative": "Nhẹ",
"goal.rate_moderate": "Vừa",
"goal.rate_aggressive": "Mạnh",
"goal.rate": "Tốc độ thay đổi"
```

### 6. Behavior After Fix

| Action                         | Before                   | After                     |
| ------------------------------ | ------------------------ | ------------------------- |
| Đổi cut→bulk, target < current | Không error, save OK     | Error ngay, save disabled |
| Đổi bulk→cut, target > current | Không error, save OK     | Error ngay, save disabled |
| Nhập target sai direction      | Error chỉ khi click Save | Error live khi onChange   |
| Sửa target đúng direction      | Error giữ nguyên         | Error tự clear            |
| Nút Save/Next khi form invalid | Luôn active              | Grayed out + disabled     |

## Files Changed

- `src/schemas/goalValidation.ts` — Thêm `createGoalValidationSchema()`
- `src/features/health-profile/components/GoalPhaseSelector.tsx` — Schema + validation + keys
- `src/components/onboarding/NutritionGoalStep.tsx` — Schema + validation + keys
- `src/components/settings/GoalDetailPage.tsx` — hasChanges depends on form validity
- `src/locales/vi.json` — Thêm `goal.type_*`, `goal.rate_*` keys
- `src/__tests__/GoalPhaseSelector.test.tsx` — Tests cho live validation
- `src/__tests__/unifiedOnboarding.test.tsx` — Tests cho onboarding validation

## Quality Gates

- `npm run lint` → 0 errors
- `npm run test` → 0 failures, coverage 100% cho code mới
- `npm run build` → clean
- Emulator-5556 verification: reproduce bug scenario → confirm fix

# Wave 3: Form UX — Developer Guide Update

## New Utility: `blockNegativeKeys`

### Import

```typescript
import { blockNegativeKeys } from '@/utils/numericInputHandlers';
```

### Usage

Attach to any numeric `<input>` that should only accept non-negative values:

```tsx
<input type="number" inputMode="decimal" onKeyDown={blockNegativeKeys} min={0} />
```

### What it blocks

| Key         | Blocked | Reason                             |
| ----------- | ------- | ---------------------------------- |
| `-`         | ✅ Yes  | Prevents negative numbers          |
| `e`         | ✅ Yes  | Prevents scientific notation (1e5) |
| `E`         | ✅ Yes  | Prevents scientific notation (1E5) |
| `0-9`       | ❌ No   | Digits allowed                     |
| `.`         | ❌ No   | Decimal point allowed              |
| `Backspace` | ❌ No   | Navigation allowed                 |
| `Tab`       | ❌ No   | Navigation allowed                 |

## inputMode Guide

Use the correct `inputMode` for each numeric field type:

| Field Type                                           | inputMode | Keyboard Shown             |
| ---------------------------------------------------- | --------- | -------------------------- |
| Weight, height, distance, sleep hours, protein ratio | `decimal` | Number pad + decimal point |
| Calories, reps, duration, heart rate, grams          | `numeric` | Number pad only            |

## Form Validation Mode

All new forms MUST use `mode: 'onTouched'`:

```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  mode: 'onTouched', // ✅ Validates after first blur, then real-time
  // mode: 'onBlur',    // ❌ Deprecated — only validates on blur
  // mode: 'onChange',   // ⚠️ Only use for real-time feedback forms (e.g., GoalPhaseSelector)
});
```

## Character Counter Pattern

For text inputs with `maxLength` in their Zod schema:

```tsx
<Input {...field} maxLength={50} />
<div className="mt-1 text-right text-xs text-muted-foreground">
  {field.value.length}/50
</div>
```

## `noValidate` on `<form>` Elements

All `<form>` elements MUST have `noValidate` to prevent native browser validation:

```tsx
<form onSubmit={handleSubmit(onSubmit)} noValidate>
```

Note: Most forms in this project don't use `<form>` tags — they use manual `handleSubmit()` calls on buttons. Only IngredientEditModal and CustomExerciseModal use `<form>` tags.

## Environment Variables

No new environment variables introduced in Wave 3.

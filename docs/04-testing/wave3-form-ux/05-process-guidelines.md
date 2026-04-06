# Wave 3: Form UX — Process / Coding Guidelines Update

## New Guidelines Added

### GUIDE-W3-01: Always use `blockNegativeKeys` on numeric inputs

**Rule:** Every `<input type="number">` or numeric `<input type="text">` MUST attach `onKeyDown={blockNegativeKeys}` unless negative values are intentionally allowed (e.g., calorie offset manual input).

**Rationale:** HTML `min="0"` only validates on submit — it does NOT prevent typing negative values. Users on mobile can still type `-50` and only see an error on form submission. `blockNegativeKeys` prevents the issue at the input level.

### GUIDE-W3-02: Use `mode: 'onTouched'` for all React Hook Form instances

**Rule:** All `useForm()` calls MUST use `mode: 'onTouched'` unless there's a documented reason for a different mode.

**Rationale:**

- `onBlur` delays feedback too long — users don't know if their input is valid until they leave the field
- `onChange` is too aggressive — shows errors before the user finishes typing
- `onTouched` provides the best UX: wait for first interaction, then validate in real-time

**Exception:** `mode: 'onChange'` is acceptable for real-time feedback forms like GoalPhaseSelector where the user needs instant feedback as they toggle options.

### GUIDE-W3-03: Set correct `inputMode` for mobile keyboard

**Rule:** Every numeric input MUST specify the appropriate `inputMode`:

- `inputMode="decimal"` — for fields that accept decimal values
- `inputMode="numeric"` — for integer-only fields

**Rationale:** Without `inputMode`, mobile browsers show a full QWERTY keyboard for `type="text"` inputs, or an inconsistent keyboard for `type="number"`. Setting `inputMode` ensures the correct numeric keypad appears.

### GUIDE-W3-04: Add `noValidate` to `<form>` elements

**Rule:** All `<form>` tags MUST include the `noValidate` attribute.

**Rationale:** Native browser validation popups are inconsistent across browsers and conflict with our Zod + React Hook Form validation. `noValidate` ensures only our custom validation runs.

### GUIDE-W3-05: Add character counters for bounded text inputs

**Rule:** Any text input with a `maxLength` constraint in its Zod schema SHOULD display a character counter (`X/N` format) below the input.

**Rationale:** Users need to know how much space they have left. Without a counter, they may be surprised by validation errors at the limit.

## Root Cause Analysis

No bugs were found during Wave 3 testing. All changes are preventive UX improvements:

| Issue                            | Root Cause                          | Prevention                         |
| -------------------------------- | ----------------------------------- | ---------------------------------- |
| Users could type negative values | HTML `min` only validates on submit | `blockNegativeKeys` handler        |
| Late validation feedback         | `mode: 'onBlur'` waits for blur     | `mode: 'onTouched'` for real-time  |
| Wrong mobile keyboard            | Missing `inputMode` attribute       | Explicit `inputMode` on all inputs |
| Native validation popups         | Missing `noValidate` on `<form>`    | Added `noValidate` attribute       |
| No character limit visibility    | No counter despite Zod `max()`      | Added `X/N` counters               |

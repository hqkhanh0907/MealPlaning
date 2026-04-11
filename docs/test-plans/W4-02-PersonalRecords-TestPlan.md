# W4-02 — PersonalRecords Component — Test Plan

> **Author**: QA Engineer (TDD-First)
> **Date**: 2026-07-15
> **Component**: `src/features/fitness/components/PersonalRecords.tsx`
> **Test File**: `src/__tests__/PersonalRecords.test.tsx`
> **Status**: TEST_PLAN_READY

---

## 1. Component Analysis

### 1.1 Props Interface

```typescript
interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  bestWeight: number; // kg
  bestReps: number;
  date: string; // YYYY-MM-DD
  history?: Array<{ weight: number; reps: number; date: string }>;
}

interface PersonalRecordsProps {
  records: PersonalRecord[];
  isLoading?: boolean;
}
```

### 1.2 Rendering Requirements

| Element          | Condition              | Visual                               | testid                    |
| ---------------- | ---------------------- | ------------------------------------ | ------------------------- |
| Root container   | Always                 | `bg-card rounded-xl p-4 shadow-sm`   | `personal-records`        |
| Section title    | Always                 | i18n `fitness.personalRecords.title` | `pr-title`                |
| Empty state      | `records.length === 0` | Dumbbell icon + "Chưa có kỷ lục"     | `pr-empty-state`          |
| Loading skeleton | `isLoading === true`   | Skeleton placeholders                | `pr-loading`              |
| PR item row      | Per record             | Exercise name + weight×reps + date   | `pr-item-{exerciseId}`    |
| Trophy icon      | Per record (current)   | Trophy, `text-energy`, `aria-hidden` | `pr-trophy-{exerciseId}`  |
| Weight value     | Per record             | `text-energy` class, `{weight}kg`    | `pr-weight-{exerciseId}`  |
| Reps value       | Per record             | `×{reps}`                            | `pr-reps-{exerciseId}`    |
| Date display     | Per record             | Formatted date `DD/MM/YYYY`          | `pr-date-{exerciseId}`    |
| Expand toggle    | Has history            | ChevronDown, rotates on expand       | `pr-toggle-{exerciseId}`  |
| History list     | Expanded + has history | Last 5 entries                       | `pr-history-{exerciseId}` |
| History entry    | Per history item       | weight × reps + date                 | `pr-history-entry-{i}`    |

### 1.3 Behavior Requirements

1. **Empty state**: When `records=[]` → show Dumbbell icon + empty message
2. **Loading state**: When `isLoading=true` → show skeleton, hide records
3. **PR list**: Render each record with Trophy icon, exercise name, best weight×reps, date
4. **Energy color**: Weight values MUST use `text-energy` Tailwind class
5. **Expand/collapse**: Click toggle → show/hide history; `aria-expanded` attribute toggles
6. **History limit**: Show max 5 entries even if more exist
7. **No history**: If record has no `history` array → no toggle button shown
8. **Date format**: Vietnamese locale display (DD/MM/YYYY)
9. **LOC limit**: ≤200 lines

### 1.4 Accessibility Requirements (from codebase patterns)

- Trophy/Dumbbell icons: `aria-hidden="true"`
- Expand toggle: `aria-expanded="true|false"`, `aria-label`
- Section: semantic `<section>` with `aria-label`

### 1.5 i18n Keys Required (new namespace `fitness.personalRecords.*`)

```json
{
  "fitness": {
    "personalRecords": {
      "title": "Kỷ lục cá nhân",
      "empty": "Chưa có kỷ lục",
      "emptyDescription": "Hoàn thành buổi tập để thiết lập kỷ lục đầu tiên",
      "bestFormat": "{{weight}}kg × {{reps}}",
      "historyLabel": "Lịch sử"
    }
  }
}
```

---

## 2. Test Scenarios

### SC_W402_01 — Empty State

**Goal**: Verify correct rendering when no records exist.

### SC_W402_02 — Loading State

**Goal**: Verify skeleton UI and records hidden during loading.

### SC_W402_03 — Single PR Display

**Goal**: Verify a single PR item renders all required elements correctly.

### SC_W402_04 — Multiple PRs Display

**Goal**: Verify multiple PR items render in correct order with unique testids.

### SC_W402_05 — Expand/Collapse History

**Goal**: Verify toggle behavior, aria-expanded, and history list visibility.

### SC_W402_06 — History Limit (Max 5)

**Goal**: Verify only the last 5 history entries are shown even when more exist.

### SC_W402_07 — No History Available

**Goal**: Verify toggle button is hidden when record has no history.

### SC_W402_08 — Energy-Colored Weight

**Goal**: Verify weight values use `text-energy` class.

### SC_W402_09 — Trophy Icon

**Goal**: Verify Trophy icon is rendered with correct attributes per PR item.

### SC_W402_10 — Date Formatting

**Goal**: Verify YYYY-MM-DD input dates display in user-friendly format.

### SC_W402_11 — Edge Cases

**Goal**: Verify decimal weights, 0 values, very long exercise names.

### SC_W402_12 — Accessibility

**Goal**: Verify aria attributes, icon hiding, semantic structure.

---

## 3. Test Cases

### Mock Setup (shared across all tests)

```typescript
// i18n mock
const translations: Record<string, string> = {
  'fitness.personalRecords.title': 'Kỷ lục cá nhân',
  'fitness.personalRecords.empty': 'Chưa có kỷ lục',
  'fitness.personalRecords.emptyDescription': 'Hoàn thành buổi tập để thiết lập kỷ lục đầu tiên',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const text = translations[key] ?? key;
      if (params) {
        return Object.entries(params).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)), text);
      }
      return text;
    },
    i18n: { language: 'vi' },
  }),
}));

// Test data factory
const BENCH_PRESS_PR: PersonalRecord = {
  exerciseId: 'bench-press',
  exerciseName: 'Bench Press',
  bestWeight: 100,
  bestReps: 5,
  date: '2026-07-10',
  history: [
    { weight: 95, reps: 5, date: '2026-07-03' },
    { weight: 90, reps: 5, date: '2026-06-26' },
    { weight: 85, reps: 5, date: '2026-06-19' },
  ],
};

const SQUAT_PR: PersonalRecord = {
  exerciseId: 'barbell-squat',
  exerciseName: 'Barbell Squat',
  bestWeight: 140,
  bestReps: 3,
  date: '2026-07-12',
  history: [
    { weight: 135, reps: 3, date: '2026-07-05' },
    { weight: 130, reps: 3, date: '2026-06-28' },
  ],
};

const DEADLIFT_PR: PersonalRecord = {
  exerciseId: 'deadlift',
  exerciseName: 'Deadlift',
  bestWeight: 180,
  bestReps: 1,
  date: '2026-07-14',
  // No history — tests SC_W402_07
};
```

---

### TC_W402_01 — Empty state renders Dumbbell icon and message

**Scenario**: SC_W402_01
**Type**: Unit (Vitest + RTL)

| Field         | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Pre-condition | Component rendered with `records=[]`                       |
| Step 1        | `render(<PersonalRecords records={[]} />)`                 |
| Expected 1    | `pr-empty-state` is in the document                        |
| Expected 2    | Text "Chưa có kỷ lục" visible                              |
| Expected 3    | Dumbbell icon is rendered (SVG present inside empty state) |
| Expected 4    | No `pr-item-*` elements exist                              |
| Expected 5    | `pr-title` still visible (section title always shows)      |

```typescript
test('TC_W402_01: empty state with Dumbbell icon and message', () => {
  render(<PersonalRecords records={[]} />);
  expect(screen.getByTestId('pr-empty-state')).toBeInTheDocument();
  expect(screen.getByText('Chưa có kỷ lục')).toBeInTheDocument();
  expect(screen.getByTestId('pr-title')).toBeInTheDocument();
  expect(screen.queryByTestId('pr-item-bench-press')).not.toBeInTheDocument();
});
```

---

### TC_W402_02 — Loading state renders skeleton and hides records

**Scenario**: SC_W402_02
**Type**: Unit (Vitest + RTL)

| Field         | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Pre-condition | Component rendered with `records=[BENCH_PRESS_PR]`, `isLoading=true`      |
| Step 1        | `render(<PersonalRecords records={[BENCH_PRESS_PR]} isLoading={true} />)` |
| Expected 1    | `pr-loading` element is in the document                                   |
| Expected 2    | `pr-item-bench-press` is NOT in the document                              |
| Expected 3    | `pr-empty-state` is NOT in the document                                   |

```typescript
test('TC_W402_02: loading skeleton shown, records hidden', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR]} isLoading={true} />);
  expect(screen.getByTestId('pr-loading')).toBeInTheDocument();
  expect(screen.queryByTestId('pr-item-bench-press')).not.toBeInTheDocument();
  expect(screen.queryByTestId('pr-empty-state')).not.toBeInTheDocument();
});
```

---

### TC_W402_03 — Loading false with records shows PR list (not skeleton)

**Scenario**: SC_W402_02
**Type**: Unit (Vitest + RTL)

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Pre-condition | Component rendered with `records=[BENCH_PRESS_PR]`, `isLoading=false`      |
| Step 1        | `render(<PersonalRecords records={[BENCH_PRESS_PR]} isLoading={false} />)` |
| Expected 1    | `pr-loading` is NOT in the document                                        |
| Expected 2    | `pr-item-bench-press` IS in the document                                   |

```typescript
test('TC_W402_03: isLoading=false shows records, not skeleton', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR]} isLoading={false} />);
  expect(screen.queryByTestId('pr-loading')).not.toBeInTheDocument();
  expect(screen.getByTestId('pr-item-bench-press')).toBeInTheDocument();
});
```

---

### TC_W402_04 — Single PR item renders all required elements

**Scenario**: SC_W402_03
**Type**: Unit (Vitest + RTL)

| Field         | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Pre-condition | Component rendered with `records=[BENCH_PRESS_PR]`         |
| Step 1        | `render(<PersonalRecords records={[BENCH_PRESS_PR]} />)`   |
| Expected 1    | `pr-item-bench-press` is in the document                   |
| Expected 2    | Text "Bench Press" visible in item                         |
| Expected 3    | `pr-weight-bench-press` contains "100"                     |
| Expected 4    | `pr-reps-bench-press` contains "5"                         |
| Expected 5    | `pr-date-bench-press` contains formatted date (10/07/2026) |
| Expected 6    | `pr-trophy-bench-press` is in the document                 |

```typescript
test('TC_W402_04: single PR renders name, weight, reps, date, trophy', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR]} />);
  const item = screen.getByTestId('pr-item-bench-press');
  expect(item).toBeInTheDocument();
  expect(within(item).getByText('Bench Press')).toBeInTheDocument();
  expect(screen.getByTestId('pr-weight-bench-press')).toHaveTextContent('100');
  expect(screen.getByTestId('pr-reps-bench-press')).toHaveTextContent('5');
  expect(screen.getByTestId('pr-date-bench-press')).toBeInTheDocument();
  expect(screen.getByTestId('pr-trophy-bench-press')).toBeInTheDocument();
});
```

---

### TC_W402_05 — Multiple PRs render all items with unique testids

**Scenario**: SC_W402_04
**Type**: Unit (Vitest + RTL)

| Field         | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Pre-condition | Component rendered with `records=[BENCH_PRESS_PR, SQUAT_PR, DEADLIFT_PR]` |
| Step 1        | Render component with 3 records                                           |
| Expected 1    | `pr-item-bench-press` is in the document                                  |
| Expected 2    | `pr-item-barbell-squat` is in the document                                |
| Expected 3    | `pr-item-deadlift` is in the document                                     |
| Expected 4    | 3 Trophy icons present (one per record)                                   |
| Expected 5    | Weight values: 100, 140, 180 respectively                                 |

```typescript
test('TC_W402_05: multiple PRs render with unique testids', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR, SQUAT_PR, DEADLIFT_PR]} />);
  expect(screen.getByTestId('pr-item-bench-press')).toBeInTheDocument();
  expect(screen.getByTestId('pr-item-barbell-squat')).toBeInTheDocument();
  expect(screen.getByTestId('pr-item-deadlift')).toBeInTheDocument();
  expect(screen.getByTestId('pr-weight-bench-press')).toHaveTextContent('100');
  expect(screen.getByTestId('pr-weight-barbell-squat')).toHaveTextContent('140');
  expect(screen.getByTestId('pr-weight-deadlift')).toHaveTextContent('180');
});
```

---

### TC_W402_06 — Expand toggle shows history list

**Scenario**: SC_W402_05
**Type**: Unit (Vitest + RTL)

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Pre-condition | Component rendered with `records=[BENCH_PRESS_PR]` (has 3 history entries) |
| Step 1        | Verify `pr-history-bench-press` is NOT in the document                     |
| Step 2        | `fireEvent.click(screen.getByTestId('pr-toggle-bench-press'))`             |
| Expected 1    | `pr-history-bench-press` IS in the document                                |
| Expected 2    | 3 history entries visible                                                  |
| Expected 3    | First history entry contains "95" (weight) and "5" (reps)                  |
| Expected 4    | Second history entry contains "90" and "5"                                 |
| Expected 5    | Third history entry contains "85" and "5"                                  |

```typescript
test('TC_W402_06: expand toggle reveals history entries', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR]} />);
  expect(screen.queryByTestId('pr-history-bench-press')).not.toBeInTheDocument();

  fireEvent.click(screen.getByTestId('pr-toggle-bench-press'));

  const history = screen.getByTestId('pr-history-bench-press');
  expect(history).toBeInTheDocument();
  const entries = within(history).getAllByTestId(/^pr-history-entry-/);
  expect(entries).toHaveLength(3);
  expect(entries[0]).toHaveTextContent('95');
  expect(entries[1]).toHaveTextContent('90');
  expect(entries[2]).toHaveTextContent('85');
});
```

---

### TC_W402_07 — Collapse toggle hides history

**Scenario**: SC_W402_05
**Type**: Unit (Vitest + RTL)

| Field         | Value                                                       |
| ------------- | ----------------------------------------------------------- |
| Pre-condition | Component with `records=[BENCH_PRESS_PR]`, history expanded |
| Step 1        | Click toggle to expand                                      |
| Step 2        | Verify history visible                                      |
| Step 3        | Click toggle again to collapse                              |
| Expected      | `pr-history-bench-press` is NOT in the document             |

```typescript
test('TC_W402_07: collapse toggle hides history', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR]} />);
  const toggle = screen.getByTestId('pr-toggle-bench-press');

  fireEvent.click(toggle); // expand
  expect(screen.getByTestId('pr-history-bench-press')).toBeInTheDocument();

  fireEvent.click(toggle); // collapse
  expect(screen.queryByTestId('pr-history-bench-press')).not.toBeInTheDocument();
});
```

---

### TC_W402_08 — History limited to 5 entries

**Scenario**: SC_W402_06
**Type**: Unit (Vitest + RTL)

| Field         | Value                                            |
| ------------- | ------------------------------------------------ |
| Pre-condition | Record with 8 history entries                    |
| Step 1        | Create record with `history` array of 8 entries  |
| Step 2        | Render and expand                                |
| Expected 1    | Exactly 5 `pr-history-entry-*` elements rendered |
| Expected 2    | Entries are the LAST 5 (most recent)             |

```typescript
test('TC_W402_08: history capped at 5 entries', () => {
  const recordWith8History: PersonalRecord = {
    exerciseId: 'ohp',
    exerciseName: 'Overhead Press',
    bestWeight: 70,
    bestReps: 5,
    date: '2026-07-14',
    history: [
      { weight: 65, reps: 5, date: '2026-07-07' },
      { weight: 62.5, reps: 5, date: '2026-06-30' },
      { weight: 60, reps: 5, date: '2026-06-23' },
      { weight: 57.5, reps: 5, date: '2026-06-16' },
      { weight: 55, reps: 5, date: '2026-06-09' },
      { weight: 52.5, reps: 5, date: '2026-06-02' },
      { weight: 50, reps: 5, date: '2026-05-26' },
      { weight: 47.5, reps: 5, date: '2026-05-19' },
    ],
  };
  render(<PersonalRecords records={[recordWith8History]} />);
  fireEvent.click(screen.getByTestId('pr-toggle-ohp'));

  const entries = within(screen.getByTestId('pr-history-ohp')).getAllByTestId(/^pr-history-entry-/);
  expect(entries).toHaveLength(5);
  // First displayed = most recent (index 0 of history)
  expect(entries[0]).toHaveTextContent('65');
  // Last displayed = 5th most recent (index 4 of history)
  expect(entries[4]).toHaveTextContent('55');
});
```

---

### TC_W402_09 — No toggle button when history is undefined

**Scenario**: SC_W402_07
**Type**: Unit (Vitest + RTL)

| Field         | Value                                                 |
| ------------- | ----------------------------------------------------- |
| Pre-condition | Component rendered with `DEADLIFT_PR` (no history)    |
| Step 1        | `render(<PersonalRecords records={[DEADLIFT_PR]} />)` |
| Expected 1    | `pr-item-deadlift` is in the document                 |
| Expected 2    | `pr-toggle-deadlift` is NOT in the document           |
| Expected 3    | Text "Deadlift" visible                               |

```typescript
test('TC_W402_09: no toggle when history undefined', () => {
  render(<PersonalRecords records={[DEADLIFT_PR]} />);
  expect(screen.getByTestId('pr-item-deadlift')).toBeInTheDocument();
  expect(screen.queryByTestId('pr-toggle-deadlift')).not.toBeInTheDocument();
});
```

---

### TC_W402_10 — No toggle button when history is empty array

**Scenario**: SC_W402_07
**Type**: Unit (Vitest + RTL)

| Field         | Value                                           |
| ------------- | ----------------------------------------------- |
| Pre-condition | Record with `history: []`                       |
| Step 1        | Create record `{ ...DEADLIFT_PR, history: [] }` |
| Expected      | `pr-toggle-deadlift` is NOT in the document     |

```typescript
test('TC_W402_10: no toggle when history is empty array', () => {
  const noHistory = { ...DEADLIFT_PR, history: [] };
  render(<PersonalRecords records={[noHistory]} />);
  expect(screen.queryByTestId('pr-toggle-deadlift')).not.toBeInTheDocument();
});
```

---

### TC_W402_11 — Weight values use text-energy class

**Scenario**: SC_W402_08
**Type**: Unit (Vitest + RTL)

| Field         | Value                                     |
| ------------- | ----------------------------------------- |
| Pre-condition | Component with `records=[BENCH_PRESS_PR]` |
| Step 1        | Render and query `pr-weight-bench-press`  |
| Expected      | Element has class `text-energy`           |

```typescript
test('TC_W402_11: weight value has text-energy class', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR]} />);
  expect(screen.getByTestId('pr-weight-bench-press')).toHaveClass('text-energy');
});
```

---

### TC_W402_12 — Trophy icon has aria-hidden and text-energy class

**Scenario**: SC_W402_09
**Type**: Unit (Vitest + RTL)

| Field         | Value                                        |
| ------------- | -------------------------------------------- |
| Pre-condition | Component with `records=[BENCH_PRESS_PR]`    |
| Step 1        | Query SVG inside `pr-trophy-bench-press`     |
| Expected 1    | `pr-trophy-bench-press` contains SVG element |
| Expected 2    | SVG has `aria-hidden="true"`                 |

```typescript
test('TC_W402_12: trophy icon with aria-hidden', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR]} />);
  const trophy = screen.getByTestId('pr-trophy-bench-press');
  const svg = trophy.querySelector('svg');
  expect(svg).toBeInTheDocument();
  expect(svg).toHaveAttribute('aria-hidden', 'true');
});
```

---

### TC_W402_13 — Date formatted as DD/MM/YYYY

**Scenario**: SC_W402_10
**Type**: Unit (Vitest + RTL)

| Field         | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Pre-condition | BENCH_PRESS_PR with `date: '2026-07-10'`               |
| Step 1        | Render and query `pr-date-bench-press`                 |
| Expected      | Text content includes "10/07/2026" (DD/MM/YYYY format) |

```typescript
test('TC_W402_13: date displayed in DD/MM/YYYY format', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR]} />);
  expect(screen.getByTestId('pr-date-bench-press')).toHaveTextContent('10/07/2026');
});
```

---

### TC_W402_14 — History entries display dates in DD/MM/YYYY

**Scenario**: SC_W402_10
**Type**: Unit (Vitest + RTL)

| Field         | Value                                                   |
| ------------- | ------------------------------------------------------- |
| Pre-condition | BENCH_PRESS_PR expanded, history[0].date = '2026-07-03' |
| Step 1        | Expand and check first history entry                    |
| Expected      | First entry contains "03/07/2026"                       |

```typescript
test('TC_W402_14: history dates in DD/MM/YYYY', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR]} />);
  fireEvent.click(screen.getByTestId('pr-toggle-bench-press'));
  const entries = within(screen.getByTestId('pr-history-bench-press'))
    .getAllByTestId(/^pr-history-entry-/);
  expect(entries[0]).toHaveTextContent('03/07/2026');
});
```

---

### TC_W402_15 — Decimal weight values (e.g. 62.5kg)

**Scenario**: SC_W402_11
**Type**: Unit (Vitest + RTL)

| Field         | Value                                     |
| ------------- | ----------------------------------------- |
| Pre-condition | Record with `bestWeight: 62.5`            |
| Step 1        | Render record with decimal weight         |
| Expected      | Weight displays "62.5" (not "62" or "63") |

```typescript
test('TC_W402_15: decimal weight renders correctly', () => {
  const decimalPR: PersonalRecord = {
    exerciseId: 'lateral-raise',
    exerciseName: 'Lateral Raise',
    bestWeight: 12.5,
    bestReps: 12,
    date: '2026-07-14',
  };
  render(<PersonalRecords records={[decimalPR]} />);
  expect(screen.getByTestId('pr-weight-lateral-raise')).toHaveTextContent('12.5');
});
```

---

### TC_W402_16 — Single rep display (1RM)

**Scenario**: SC_W402_11
**Type**: Unit (Vitest + RTL)

| Field         | Value                                     |
| ------------- | ----------------------------------------- |
| Pre-condition | DEADLIFT_PR with `bestReps: 1`            |
| Step 1        | Render component                          |
| Expected      | Reps area shows "1" (not "1s" or "1 rep") |

```typescript
test('TC_W402_16: single rep (1RM) renders correctly', () => {
  render(<PersonalRecords records={[DEADLIFT_PR]} />);
  expect(screen.getByTestId('pr-reps-deadlift')).toHaveTextContent('1');
});
```

---

### TC_W402_17 — Expand/collapse aria-expanded attribute

**Scenario**: SC_W402_12
**Type**: Unit (Vitest + RTL)

| Field         | Value                                       |
| ------------- | ------------------------------------------- |
| Pre-condition | Component with `records=[BENCH_PRESS_PR]`   |
| Step 1        | Query toggle button                         |
| Expected 1    | Initial: `aria-expanded="false"`            |
| Step 2        | Click toggle                                |
| Expected 2    | After click: `aria-expanded="true"`         |
| Step 3        | Click toggle again                          |
| Expected 3    | After second click: `aria-expanded="false"` |

```typescript
test('TC_W402_17: aria-expanded toggles correctly', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR]} />);
  const toggle = screen.getByTestId('pr-toggle-bench-press');

  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
```

---

### TC_W402_18 — Section title always visible

**Scenario**: SC_W402_03, SC_W402_01
**Type**: Unit (Vitest + RTL)

| Field         | Value                                    |
| ------------- | ---------------------------------------- |
| Pre-condition | Any state (empty, loading, with records) |
| Step 1        | Render with `records=[]`                 |
| Expected 1    | `pr-title` with text "Kỷ lục cá nhân"    |
| Step 2        | Render with `records=[BENCH_PRESS_PR]`   |
| Expected 2    | `pr-title` with text "Kỷ lục cá nhân"    |

```typescript
test('TC_W402_18: section title always visible', () => {
  const { rerender } = render(<PersonalRecords records={[]} />);
  expect(screen.getByTestId('pr-title')).toHaveTextContent('Kỷ lục cá nhân');

  rerender(<PersonalRecords records={[BENCH_PRESS_PR]} />);
  expect(screen.getByTestId('pr-title')).toHaveTextContent('Kỷ lục cá nhân');
});
```

---

### TC_W402_19 — Expand one PR does not expand others

**Scenario**: SC_W402_05
**Type**: Unit (Vitest + RTL)

| Field         | Value                                                         |
| ------------- | ------------------------------------------------------------- |
| Pre-condition | Component with `[BENCH_PRESS_PR, SQUAT_PR]` both with history |
| Step 1        | Click `pr-toggle-bench-press` to expand bench                 |
| Expected 1    | `pr-history-bench-press` IS in the document                   |
| Expected 2    | `pr-history-barbell-squat` is NOT in the document             |

```typescript
test('TC_W402_19: expanding one PR does not expand others', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR, SQUAT_PR]} />);
  fireEvent.click(screen.getByTestId('pr-toggle-bench-press'));

  expect(screen.getByTestId('pr-history-bench-press')).toBeInTheDocument();
  expect(screen.queryByTestId('pr-history-barbell-squat')).not.toBeInTheDocument();
});
```

---

### TC_W402_20 — Multiple PRs can be expanded simultaneously

**Scenario**: SC_W402_05
**Type**: Unit (Vitest + RTL)

| Field         | Value                                         |
| ------------- | --------------------------------------------- |
| Pre-condition | Component with `[BENCH_PRESS_PR, SQUAT_PR]`   |
| Step 1        | Click `pr-toggle-bench-press`                 |
| Step 2        | Click `pr-toggle-barbell-squat`               |
| Expected 1    | `pr-history-bench-press` IS in the document   |
| Expected 2    | `pr-history-barbell-squat` IS in the document |

```typescript
test('TC_W402_20: multiple PRs expandable simultaneously', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR, SQUAT_PR]} />);
  fireEvent.click(screen.getByTestId('pr-toggle-bench-press'));
  fireEvent.click(screen.getByTestId('pr-toggle-barbell-squat'));

  expect(screen.getByTestId('pr-history-bench-press')).toBeInTheDocument();
  expect(screen.getByTestId('pr-history-barbell-squat')).toBeInTheDocument();
});
```

---

### TC_W402_21 — isLoading defaults to false (optional prop)

**Scenario**: SC_W402_02
**Type**: Unit (Vitest + RTL)

| Field         | Value                                                    |
| ------------- | -------------------------------------------------------- |
| Pre-condition | Component rendered WITHOUT isLoading prop                |
| Step 1        | `render(<PersonalRecords records={[BENCH_PRESS_PR]} />)` |
| Expected 1    | `pr-loading` NOT in document (defaults to false)         |
| Expected 2    | `pr-item-bench-press` IS in the document                 |

```typescript
test('TC_W402_21: isLoading defaults to false', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR]} />);
  expect(screen.queryByTestId('pr-loading')).not.toBeInTheDocument();
  expect(screen.getByTestId('pr-item-bench-press')).toBeInTheDocument();
});
```

---

### TC_W402_22 — Empty state with loading=true shows loading, not empty

**Scenario**: SC_W402_02
**Type**: Unit (Vitest + RTL)

| Field         | Value                                   |
| ------------- | --------------------------------------- |
| Pre-condition | `records=[]`, `isLoading=true`          |
| Step 1        | Render component                        |
| Expected 1    | `pr-loading` IS in the document         |
| Expected 2    | `pr-empty-state` is NOT in the document |

```typescript
test('TC_W402_22: loading takes priority over empty state', () => {
  render(<PersonalRecords records={[]} isLoading={true} />);
  expect(screen.getByTestId('pr-loading')).toBeInTheDocument();
  expect(screen.queryByTestId('pr-empty-state')).not.toBeInTheDocument();
});
```

---

### TC_W402_23 — Root container has data-testid

**Scenario**: SC_W402_12
**Type**: Unit (Vitest + RTL)

| Field         | Value                                            |
| ------------- | ------------------------------------------------ |
| Pre-condition | Any render                                       |
| Expected      | `personal-records` testid exists as root wrapper |

```typescript
test('TC_W402_23: root container has personal-records testid', () => {
  render(<PersonalRecords records={[]} />);
  expect(screen.getByTestId('personal-records')).toBeInTheDocument();
});
```

---

### TC_W402_24 — History entries show weight × reps format

**Scenario**: SC_W402_05
**Type**: Unit (Vitest + RTL)

| Field         | Value                                            |
| ------------- | ------------------------------------------------ |
| Pre-condition | BENCH_PRESS_PR expanded                          |
| Step 1        | Expand and check first history entry             |
| Expected      | Entry contains both "95" (weight) and "5" (reps) |

```typescript
test('TC_W402_24: history entries show weight and reps', () => {
  render(<PersonalRecords records={[BENCH_PRESS_PR]} />);
  fireEvent.click(screen.getByTestId('pr-toggle-bench-press'));
  const entries = within(screen.getByTestId('pr-history-bench-press'))
    .getAllByTestId(/^pr-history-entry-/);
  expect(entries[0]).toHaveTextContent('95');
  expect(entries[0]).toHaveTextContent('5');
});
```

---

### TC_W402_25 — Component memoized (React.memo)

**Scenario**: SC_W402_12
**Type**: Unit (Vitest)

| Field         | Value                                                                |
| ------------- | -------------------------------------------------------------------- |
| Pre-condition | Import PersonalRecords component                                     |
| Expected      | Component is wrapped with React.memo (check displayName or $$typeof) |

```typescript
test('TC_W402_25: component is memoized', () => {
  // React.memo wraps component — verify via $$typeof or displayName
  expect(PersonalRecords).toHaveProperty('$$typeof', Symbol.for('react.memo'));
});
```

---

## 4. Test Coverage Matrix

| Scenario   | Test Cases                        | Priority |
| ---------- | --------------------------------- | -------- |
| SC_W402_01 | TC_01                             | P0       |
| SC_W402_02 | TC_02, TC_03, TC_21, TC_22        | P0       |
| SC_W402_03 | TC_04, TC_18                      | P0       |
| SC_W402_04 | TC_05                             | P0       |
| SC_W402_05 | TC_06, TC_07, TC_19, TC_20, TC_24 | P0       |
| SC_W402_06 | TC_08                             | P1       |
| SC_W402_07 | TC_09, TC_10                      | P0       |
| SC_W402_08 | TC_11                             | P0       |
| SC_W402_09 | TC_12                             | P1       |
| SC_W402_10 | TC_13, TC_14                      | P1       |
| SC_W402_11 | TC_15, TC_16                      | P1       |
| SC_W402_12 | TC_17, TC_23, TC_25               | P1       |

**Total**: 25 test cases covering 12 scenarios.
**Estimated coverage**: 100% statements/branches for ≤200 LOC component.

---

## 5. Test Organization (describe blocks)

```typescript
describe('PersonalRecords', () => {
  describe('Empty State (SC_W402_01)', () => {
    // TC_01
  });

  describe('Loading State (SC_W402_02)', () => {
    // TC_02, TC_03, TC_21, TC_22
  });

  describe('PR Item Display (SC_W402_03, SC_W402_04)', () => {
    // TC_04, TC_05, TC_18
  });

  describe('Expand/Collapse History (SC_W402_05)', () => {
    // TC_06, TC_07, TC_19, TC_20, TC_24
  });

  describe('History Limit (SC_W402_06)', () => {
    // TC_08
  });

  describe('No History Toggle (SC_W402_07)', () => {
    // TC_09, TC_10
  });

  describe('Energy-Colored Weight (SC_W402_08)', () => {
    // TC_11
  });

  describe('Trophy Icon (SC_W402_09)', () => {
    // TC_12
  });

  describe('Date Formatting (SC_W402_10)', () => {
    // TC_13, TC_14
  });

  describe('Edge Cases (SC_W402_11)', () => {
    // TC_15, TC_16
  });

  describe('Accessibility (SC_W402_12)', () => {
    // TC_17, TC_23, TC_25
  });
});
```

---

## 6. Constraints for Dev Implementation

### MUST

- Use `React.memo()` wrapper with named function
- Use `useTranslation()` for ALL user-facing text
- Use `data-testid` exactly as defined in §1.2 testid map
- Use `text-energy` class on weight values
- Use `Trophy` from `lucide-react` with `aria-hidden="true"`
- Use `Dumbbell` from `lucide-react` for empty state
- Limit history display to 5 entries (`.slice(0, 5)`)
- Use `Readonly<PersonalRecordsProps>` for prop destructuring
- Track expanded state per exerciseId (Set or Record)

### MUST NOT

- Fetch data from store (pure presentational — data via props)
- Use `eslint-disable` for any reason
- Exceed 200 LOC
- Import store or database services
- Use `useCallback`/`useMemo` (React Compiler active)

### i18n Keys to Create (in vi.json under `fitness.personalRecords`)

```json
"personalRecords": {
  "title": "Kỷ lục cá nhân",
  "empty": "Chưa có kỷ lục",
  "emptyDescription": "Hoàn thành buổi tập để thiết lập kỷ lục đầu tiên"
}
```

---

## 7. Manual Test Cases (Emulator)

### MT_W402_01 — Visual layout on emulator

**Type**: Manual (CDP + screenshot)
**Steps**:

1. Navigate to fitness tab on emulator
2. Render PersonalRecords with 3 PRs
3. Screenshot full component
   **Expected**: Trophy icons visible, weight in energy color, date formatted, proper spacing

### MT_W402_02 — Expand animation smoothness

**Type**: Manual (CDP)
**Steps**:

1. Click expand toggle
2. Observe animation
   **Expected**: Smooth expand with no jank, ChevronDown rotates

### MT_W402_03 — Empty state visual

**Type**: Manual (CDP + screenshot)
**Steps**:

1. Render with `records=[]`
2. Screenshot
   **Expected**: Dumbbell icon centered, message below, matches app visual style

---

## Appendix: Codebase Pattern References

| Pattern              | Source File             | Relevant Lines                     |
| -------------------- | ----------------------- | ---------------------------------- |
| Expand/collapse      | MilestonesList.tsx      | useState + ChevronDown rotation    |
| Trophy + energy      | StreakCounter.tsx:46    | `<Trophy className="text-energy">` |
| Empty state          | FitnessEmptyState.tsx   | Full component template            |
| Loading skeleton     | WorkoutHistory.tsx:207  | `<Skeleton>` pattern               |
| Date formatting      | dateUtils.ts            | `formatDate()` + `parseDate()`     |
| Test mock pattern    | StreakCounter.test.tsx  | i18n mock + store mock             |
| PR data shape        | gamification.ts:26-33   | `PRDetection` interface            |
| Test expand/collapse | MilestonesList.test.tsx | `expand()` helper + aria checks    |

---

**TEST_PLAN_READY**

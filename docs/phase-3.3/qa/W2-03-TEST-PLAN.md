# W2-03 Test Plan — Compelling Empty States (PlanEmptyState)

> **Status**: TEST_PLAN_READY
> **Component**: MODIFY `src/features/fitness/components/PlanEmptyState.tsx` (117 LOC → expand to 5 contexts)
> **Test file**: MODIFY `src/__tests__/PlanEmptyState.test.tsx` (137 LOC → expand)
> **i18n**: MODIFY `src/locales/vi.json` — `fitness.emptyState.*` keys ONLY
> **Type**: Unit (Vitest + React Testing Library)
> **Author**: QA Engineer
> **Date**: 2025-07-16
> **Design Spec**: §4.3 (Compelling Empty States), §8.6 (i18n Keys)
> **Business Rules**: BR-39, BR-40
> **User Story**: US-10

---

## 1. Source Analysis

### 1.1 Current PlanEmptyState.tsx (117 LOC)

| Context               | Variant       | Icon         | testid             | CTA text                |
| --------------------- | ------------- | ------------ | ------------------ | ----------------------- |
| `no-plan`             | hero (custom) | Dumbbell     | `no-plan-cta`      | "Tạo kế hoạch"          |
| `expired-plan`        | hero (custom) | RefreshCw    | `plan-expired-cta` | "Tạo chu kỳ mới"        |
| `manual-no-exercises` | hero (custom) | CalendarPlus | `manual-plan-cta`  | "Tạo buổi tập đầu tiên" |

**Key observation**: Current component uses CUSTOM layouts with `createSurfaceStateContract()`. W2-03 redesign replaces these 3 contexts with 5 NEW contexts and maps each directly to the shared `<EmptyState>` component with props (no more SurfaceStateContract usage for the new contexts).

### 1.2 Target PlanEmptyState after W2-03 (Design §4.3)

| #   | Context             | variant      | icon      | icon size | title (vi)           | description (vi)                         | CTA (vi)          | CTA behavior          |
| --- | ------------------- | ------------ | --------- | --------- | -------------------- | ---------------------------------------- | ----------------- | --------------------- |
| 1   | `no-plan`           | `"hero"`     | Target    | h-8 w-8   | "Bắt đầu hành trình" | "Tạo kế hoạch tập luyện phù hợp với bạn" | "Tạo kế hoạch"    | `onAction()` callback |
| 2   | `no-history`        | `"standard"` | Dumbbell  | h-6 w-6   | "Chưa có buổi tập"   | "Hoàn thành buổi tập đầu tiên"           | "Bắt đầu tập"     | Navigate to plan tab  |
| 3   | `no-progress`       | `"standard"` | BarChart3 | h-6 w-6   | "Chưa có dữ liệu"    | "Tập luyện để xem tiến trình"            | "Bắt đầu tập"     | Navigate to plan tab  |
| 4   | `empty-plan-day`    | `"compact"`  | Plus      | h-5 w-5   | "Chưa có bài tập"    | —                                        | "Thêm bài tập"    | `onAction()` callback |
| 5   | `search-no-results` | `"compact"`  | Search    | h-5 w-5   | "Không tìm thấy"     | —                                        | "Tạo bài tập mới" | `onAction()` callback |

### 1.3 Shared EmptyState Component (3 Variants)

From `src/components/shared/EmptyState.tsx`:

| Variant    | Animation class    | Icon container                | Icon size | Title style             | CTA style               |
| ---------- | ------------------ | ----------------------------- | --------- | ----------------------- | ----------------------- |
| `hero`     | `animate-slide-up` | `h-16 w-16 bg-primary-subtle` | h-8 w-8   | `text-xl font-semibold` | `bg-primary` solid btn  |
| `standard` | `animate-fade-in`  | `h-12 w-12 bg-muted`          | h-6 w-6   | `text-lg font-semibold` | `bg-primary` solid btn  |
| `compact`  | `animate-fade-in`  | None                          | N/A       | `text-sm font-medium`   | `text-primary` link btn |

**IMPORTANT**: EmptyState `hero` variant uses `animate-slide-up` (NOT `animate-fade-in`). The Design spec §4.3 says "All empty states: `animate-fade-in` entrance" — but the shared component already applies animation classes per variant. The Dev must either:

- (a) Override the hero animation to use `animate-fade-in`, or
- (b) Accept `animate-slide-up` as equivalent entrance animation for hero.

This is flagged as **SPEC AMBIGUITY #1** — test plan covers both possibilities.

### 1.4 Animation System (`src/styles/animations.css`)

- `animate-fade-in`: `fadeIn 200ms var(--ease-enter) both` (opacity 0→1)
- `animate-slide-up`: `slideUp 200ms var(--ease-enter) both` (opacity 0→1 + translateY 8px→0)
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` sets `animation: none; opacity: 1; transform: none;` → BR-40 compliant.

### 1.5 i18n Keys — Required New Keys

Existing keys (fitness.emptyState.\*):

```json
{
  "progressTitle": "Chưa có dữ liệu tiến trình",
  "progressDescription": "Hoàn thành buổi tập đầu tiên để bắt đầu theo dõi tiến trình của bạn",
  "historyTitle": "Chưa có lịch sử tập luyện",
  "historyDescription": "Bắt đầu buổi tập đầu tiên để xem lịch sử tại đây",
  "startWorkout": "Bắt đầu tập ngay"
}
```

**New/modified keys needed** (per Design §4.3):

```json
{
  "fitness.emptyState.noPlanTitle": "Bắt đầu hành trình",
  "fitness.emptyState.noPlanDescription": "Tạo kế hoạch tập luyện phù hợp với bạn",
  "fitness.emptyState.noPlanCta": "Tạo kế hoạch",
  "fitness.emptyState.noHistoryTitle": "Chưa có buổi tập",
  "fitness.emptyState.noHistoryDescription": "Hoàn thành buổi tập đầu tiên",
  "fitness.emptyState.noHistoryCta": "Bắt đầu tập",
  "fitness.emptyState.noProgressTitle": "Chưa có dữ liệu",
  "fitness.emptyState.noProgressDescription": "Tập luyện để xem tiến trình",
  "fitness.emptyState.noProgressCta": "Bắt đầu tập",
  "fitness.emptyState.emptyDayTitle": "Chưa có bài tập",
  "fitness.emptyState.emptyDayCta": "Thêm bài tập",
  "fitness.emptyState.searchNoResultsTitle": "Không tìm thấy",
  "fitness.emptyState.searchNoResultsCta": "Tạo bài tập mới"
}
```

### 1.6 PlanEmptyContext Type Changes

Current: `'no-plan' | 'expired-plan' | 'manual-no-exercises'`
Target: `'no-plan' | 'no-history' | 'no-progress' | 'empty-plan-day' | 'search-no-results'`

**BREAKING CHANGE**: `expired-plan` and `manual-no-exercises` are REMOVED. `no-history`, `no-progress`, `empty-plan-day`, `search-no-results` are ADDED.

---

## 2. Test Strategy

### 2.1 Scope

| Category                           | In Scope | Rationale                                                                                                                |
| ---------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| 5 context rendering                | ✅       | AC-1: All 5 contexts render correctly                                                                                    |
| Variant assignment per context     | ✅       | AC-1: Correct variant for each context                                                                                   |
| Icon rendering per context         | ✅       | AC-1: Correct icon per context                                                                                           |
| i18n text via t() calls            | ✅       | AC-3: All text through translation                                                                                       |
| CTA button text                    | ✅       | AC-1: Correct CTA label                                                                                                  |
| CTA click → onAction callback      | ✅       | AC-4 (BM): CTA navigates to correct action                                                                               |
| Animation class presence           | ✅       | AC-2: `animate-fade-in` entrance                                                                                         |
| Touch target min-h-12              | ✅       | AC-4: 48dp touch targets on CTA buttons                                                                                  |
| Compact variant no description     | ✅       | Design §4.3: compact has `—` for description                                                                             |
| Context isolation (no cross-bleed) | ✅       | Only 1 context renders at a time                                                                                         |
| Reduced motion (BR-40)             | ⚠️       | Covered by shared EmptyState + animations.css globally — verify class present, actual animation suppression is CSS-level |
| Shared EmptyState integration      | ✅       | BR-39: Uses shared component                                                                                             |

### 2.2 Out of Scope

| Category                               | Rationale                                           |
| -------------------------------------- | --------------------------------------------------- |
| EmptyState internal rendering logic    | Owned by shared component, tested separately        |
| SurfaceStateContract validation        | Tested in surfaceState.test.ts                      |
| Actual CSS animation execution         | JSDOM has no CSS engine; verify class presence only |
| TrainingPlanView integration wiring    | W1-06 scope, not W2-03                              |
| `expired-plan` / `manual-no-exercises` | Removed by redesign — old tests will be deleted     |

### 2.3 Test Mock Strategy

```typescript
// Mock react-i18next — return key-based lookup from translations map
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
    i18n: { language: 'vi' },
  }),
}));

// translations map contains ALL fitness.emptyState.* keys
```

**Props interface** (expected after redesign):

```typescript
export type PlanEmptyContext = 'no-plan' | 'no-history' | 'no-progress' | 'empty-plan-day' | 'search-no-results';

export interface PlanEmptyStateProps {
  readonly context: PlanEmptyContext;
  readonly onAction: () => void;
}
```

**Note**: `isGenerating` prop likely removed (only relevant for old `no-plan` context with plan generation). If Dev keeps it, QA adds 1 extra test.

---

## 3. Test Scenarios

### TS-01: Context → Variant Mapping

Verify each of the 5 contexts renders the correct EmptyState variant.

### TS-02: Context → Icon Mapping

Verify each context renders the correct Lucide icon.

### TS-03: Context → i18n Text Mapping

Verify title, description, and CTA text are rendered via `t()` with correct keys.

### TS-04: CTA Button Click Behavior

Verify `onAction` callback is invoked when CTA is clicked for each context.

### TS-05: Animation Class Presence

Verify the correct animation CSS class is present on the rendered container.

### TS-06: Touch Target Compliance

Verify CTA buttons meet `min-h-12` (48dp) touch target for hero/standard variants.

### TS-07: Compact Variant — No Description

Verify compact contexts (`empty-plan-day`, `search-no-results`) do NOT render a description element.

### TS-08: Context Isolation

Verify rendering one context does not leak elements from other contexts.

---

## 4. Detailed Test Cases

### 4.1 TS-01: Context → Variant Mapping

#### TC_ES_01: "no-plan" context renders hero variant

| Field              | Value                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **TC ID**          | TC_ES_01                                                                                                                                 |
| **Scenario**       | TS-01                                                                                                                                    |
| **Priority**       | P0                                                                                                                                       |
| **Pre-conditions** | PlanEmptyState component mounted with `context="no-plan"`                                                                                |
| **Steps**          | 1. Render `<PlanEmptyState context="no-plan" onAction={vi.fn()} />`                                                                      |
|                    | 2. Query the root container of EmptyState                                                                                                |
| **Expected**       | Container has `animate-slide-up` class (hero variant uses slide-up per EmptyState.tsx:53) OR `animate-fade-in` if Dev overrides per §4.3 |
|                    | Container has `rounded-2xl border border-dashed` (hero-specific styling)                                                                 |
| **Assertion**      | `expect(container).toHaveClass('animate-slide-up')` OR `expect(container).toHaveClass('animate-fade-in')`                                |

#### TC_ES_02: "no-history" context renders standard variant

| Field              | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| **TC ID**          | TC_ES_02                                                               |
| **Pre-conditions** | Component mounted with `context="no-history"`                          |
| **Steps**          | 1. Render `<PlanEmptyState context="no-history" onAction={vi.fn()} />` |
|                    | 2. Query container                                                     |
| **Expected**       | Container has `animate-fade-in` class (standard variant)               |
|                    | Container has `px-6 py-12` (standard layout spacing)                   |
| **Assertion**      | `expect(container).toHaveClass('animate-fade-in')`                     |

#### TC_ES_03: "no-progress" context renders standard variant

| Field              | Value                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| **TC ID**          | TC_ES_03                                                                |
| **Pre-conditions** | Component mounted with `context="no-progress"`                          |
| **Steps**          | 1. Render `<PlanEmptyState context="no-progress" onAction={vi.fn()} />` |
| **Expected**       | Container has `animate-fade-in` class (standard variant)                |
| **Assertion**      | `expect(container).toHaveClass('animate-fade-in')`                      |

#### TC_ES_04: "empty-plan-day" context renders compact variant

| Field              | Value                                                                      |
| ------------------ | -------------------------------------------------------------------------- |
| **TC ID**          | TC_ES_04                                                                   |
| **Pre-conditions** | Component mounted with `context="empty-plan-day"`                          |
| **Steps**          | 1. Render `<PlanEmptyState context="empty-plan-day" onAction={vi.fn()} />` |
| **Expected**       | Container has `animate-fade-in` class (compact variant)                    |
|                    | Container has `px-4 py-6` (compact layout spacing)                         |
| **Assertion**      | `expect(container).toHaveClass('animate-fade-in')`                         |

#### TC_ES_05: "search-no-results" context renders compact variant

| Field              | Value                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| **TC ID**          | TC_ES_05                                                                      |
| **Pre-conditions** | Component mounted with `context="search-no-results"`                          |
| **Steps**          | 1. Render `<PlanEmptyState context="search-no-results" onAction={vi.fn()} />` |
| **Expected**       | Container has `animate-fade-in` class (compact variant)                       |
| **Assertion**      | `expect(container).toHaveClass('animate-fade-in')`                            |

---

### 4.2 TS-02: Context → Icon Mapping

#### TC_ES_06: "no-plan" renders Target icon

| Field        | Value                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **TC ID**    | TC_ES_06                                                                                                                  |
| **Steps**    | 1. Render with `context="no-plan"`                                                                                        |
|              | 2. Query for SVG with `aria-hidden="true"` inside icon container                                                          |
| **Expected** | Icon SVG present with `h-8 w-8` classes (hero icon size)                                                                  |
| **Note**     | Lucide icons render as `<svg>` with `aria-hidden="true"`. Test verifies icon container and size class, not SVG path data. |

#### TC_ES_07: "no-history" renders Dumbbell icon

| Field        | Value                                                |
| ------------ | ---------------------------------------------------- |
| **TC ID**    | TC_ES_07                                             |
| **Steps**    | 1. Render with `context="no-history"`                |
| **Expected** | Icon SVG with `h-6 w-6` classes (standard icon size) |

#### TC_ES_08: "no-progress" renders BarChart3 icon

| Field        | Value                                                |
| ------------ | ---------------------------------------------------- |
| **TC ID**    | TC_ES_08                                             |
| **Steps**    | 1. Render with `context="no-progress"`               |
| **Expected** | Icon SVG with `h-6 w-6` classes (standard icon size) |

#### TC_ES_09: "empty-plan-day" — compact has no explicit icon rendering

| Field        | Value                                                                                                                                                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TC ID**    | TC_ES_09                                                                                                                                                                                                                               |
| **Steps**    | 1. Render with `context="empty-plan-day"`                                                                                                                                                                                              |
| **Expected** | Compact variant has NO icon container (per EmptyState compact branch — no icon rendered)                                                                                                                                               |
| **Note**     | Design §4.3 specifies `Plus h-5 w-5` icon for compact, but shared EmptyState compact variant does NOT render icons. Dev must either (a) pass icon to trigger custom render, or (b) modify EmptyState. Test validates actual rendering. |

#### TC_ES_10: "search-no-results" — compact variant icon handling

| Field        | Value                                                     |
| ------------ | --------------------------------------------------------- |
| **TC ID**    | TC_ES_10                                                  |
| **Steps**    | 1. Render with `context="search-no-results"`              |
| **Expected** | Same as TC_ES_09 — verify compact icon rendering behavior |

---

### 4.3 TS-03: Context → i18n Text Mapping

#### TC_ES_11: "no-plan" renders correct title, description, CTA

| Field         | Value                                                               |
| ------------- | ------------------------------------------------------------------- |
| **TC ID**     | TC_ES_11                                                            |
| **Priority**  | P0                                                                  |
| **Steps**     | 1. Render with `context="no-plan"`                                  |
|               | 2. Query for title text                                             |
|               | 3. Query for description text                                       |
|               | 4. Query for CTA button text                                        |
| **Expected**  | Title: "Bắt đầu hành trình"                                         |
|               | Description: "Tạo kế hoạch tập luyện phù hợp với bạn"               |
|               | CTA: "Tạo kế hoạch"                                                 |
| **Assertion** | `screen.getByText('Bắt đầu hành trình')` exists                     |
|               | `screen.getByText('Tạo kế hoạch tập luyện phù hợp với bạn')` exists |
|               | `screen.getByRole('button', { name: /Tạo kế hoạch/ })` exists       |

#### TC_ES_12: "no-history" renders correct title, description, CTA

| Field        | Value                                       |
| ------------ | ------------------------------------------- |
| **TC ID**    | TC_ES_12                                    |
| **Steps**    | 1. Render with `context="no-history"`       |
| **Expected** | Title: "Chưa có buổi tập"                   |
|              | Description: "Hoàn thành buổi tập đầu tiên" |
|              | CTA: "Bắt đầu tập"                          |

#### TC_ES_13: "no-progress" renders correct title, description, CTA

| Field        | Value                                      |
| ------------ | ------------------------------------------ |
| **TC ID**    | TC_ES_13                                   |
| **Steps**    | 1. Render with `context="no-progress"`     |
| **Expected** | Title: "Chưa có dữ liệu"                   |
|              | Description: "Tập luyện để xem tiến trình" |
|              | CTA: "Bắt đầu tập"                         |

#### TC_ES_14: "empty-plan-day" renders title and CTA only (no description)

| Field        | Value                                     |
| ------------ | ----------------------------------------- |
| **TC ID**    | TC_ES_14                                  |
| **Priority** | P0                                        |
| **Steps**    | 1. Render with `context="empty-plan-day"` |
|              | 2. Query title                            |
|              | 3. Query CTA                              |
|              | 4. Verify NO description paragraph        |
| **Expected** | Title: "Chưa có bài tập"                  |
|              | CTA: "Thêm bài tập"                       |
|              | No description element rendered           |

#### TC_ES_15: "search-no-results" renders title and CTA only (no description)

| Field        | Value                                        |
| ------------ | -------------------------------------------- |
| **TC ID**    | TC_ES_15                                     |
| **Steps**    | 1. Render with `context="search-no-results"` |
| **Expected** | Title: "Không tìm thấy"                      |
|              | CTA: "Tạo bài tập mới"                       |
|              | No description element rendered              |

---

### 4.4 TS-04: CTA Button Click Behavior

#### TC_ES_16: "no-plan" CTA calls onAction

| Field         | Value                                                   |
| ------------- | ------------------------------------------------------- |
| **TC ID**     | TC_ES_16                                                |
| **Priority**  | P0                                                      |
| **Steps**     | 1. Render with `context="no-plan"`, `onAction={mockFn}` |
|               | 2. Click CTA button ("Tạo kế hoạch")                    |
| **Expected**  | `mockFn` called exactly once                            |
| **Assertion** | `expect(mockFn).toHaveBeenCalledOnce()`                 |

#### TC_ES_17: "no-history" CTA calls onAction

| Field        | Value                                                       |
| ------------ | ----------------------------------------------------------- |
| **TC ID**    | TC_ES_17                                                    |
| **Steps**    | 1. Render with `context="no-history"`, `onAction={mockFn}`  |
|              | 2. Click CTA button ("Bắt đầu tập")                         |
| **Expected** | `mockFn` called once (caller is responsible for navigation) |

#### TC_ES_18: "no-progress" CTA calls onAction

| Field        | Value                                        |
| ------------ | -------------------------------------------- |
| **TC ID**    | TC_ES_18                                     |
| **Steps**    | Same as TC_ES_17 but `context="no-progress"` |
| **Expected** | `mockFn` called once                         |

#### TC_ES_19: "empty-plan-day" CTA calls onAction

| Field        | Value                                                          |
| ------------ | -------------------------------------------------------------- |
| **TC ID**    | TC_ES_19                                                       |
| **Steps**    | 1. Render with `context="empty-plan-day"`, `onAction={mockFn}` |
|              | 2. Click CTA button ("Thêm bài tập")                           |
| **Expected** | `mockFn` called once                                           |

#### TC_ES_20: "search-no-results" CTA calls onAction

| Field        | Value                                                             |
| ------------ | ----------------------------------------------------------------- |
| **TC ID**    | TC_ES_20                                                          |
| **Steps**    | 1. Render with `context="search-no-results"`, `onAction={mockFn}` |
|              | 2. Click CTA button ("Tạo bài tập mới")                           |
| **Expected** | `mockFn` called once                                              |

---

### 4.5 TS-05: Animation Class Presence

#### TC_ES_21: Hero variant has entrance animation class

| Field        | Value                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| **TC ID**    | TC_ES_21                                                                                                      |
| **Priority** | P1                                                                                                            |
| **Steps**    | 1. Render with `context="no-plan"`                                                                            |
|              | 2. Query the EmptyState container div                                                                         |
| **Expected** | Container has EITHER `animate-fade-in` (per §4.3 literal) OR `animate-slide-up` (per EmptyState hero default) |
| **Note**     | SPEC AMBIGUITY #1 — Dev decides. Test must assert one or the other.                                           |

#### TC_ES_22: Standard variant has animate-fade-in

| Field        | Value                                 |
| ------------ | ------------------------------------- |
| **TC ID**    | TC_ES_22                              |
| **Steps**    | 1. Render with `context="no-history"` |
| **Expected** | Container has `animate-fade-in` class |

#### TC_ES_23: Compact variant has animate-fade-in

| Field        | Value                                     |
| ------------ | ----------------------------------------- |
| **TC ID**    | TC_ES_23                                  |
| **Steps**    | 1. Render with `context="empty-plan-day"` |
| **Expected** | Container has `animate-fade-in` class     |

---

### 4.6 TS-06: Touch Target Compliance

#### TC_ES_24: Hero CTA button has min-h-12 touch target

| Field        | Value                                                                                                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TC ID**    | TC_ES_24                                                                                                                                                                                              |
| **Priority** | P1                                                                                                                                                                                                    |
| **Steps**    | 1. Render with `context="no-plan"`                                                                                                                                                                    |
|              | 2. Query CTA button                                                                                                                                                                                   |
| **Expected** | CTA button's rendered output includes touch-target sizing from EmptyState hero: `py-2.5 px-5` (≥44px with padding). If Dev adds `min-h-12` explicitly per AC-4, assert that.                          |
| **Note**     | EmptyState hero button does NOT have explicit `min-h-12`. Dev may need to add it via `className` override or modify EmptyState. Test checks for `min-h-12` OR equivalent padding that achieves ≥48px. |

#### TC_ES_25: Standard CTA button meets touch target

| Field        | Value                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| **TC ID**    | TC_ES_25                                                                    |
| **Steps**    | 1. Render with `context="no-history"`                                       |
| **Expected** | CTA button present and accessible (rendered by EmptyState standard variant) |

#### TC_ES_26: Compact CTA is link-style (no min-h-12 requirement)

| Field        | Value                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **TC ID**    | TC_ES_26                                                                                                                          |
| **Steps**    | 1. Render with `context="empty-plan-day"`                                                                                         |
| **Expected** | CTA is a text-styled button (link-like), `text-primary` class. Touch target is secondary concern for inline link per Design §1.2. |

---

### 4.7 TS-07: Compact Variant — No Description

#### TC_ES_27: "empty-plan-day" has no description

| Field        | Value                                             |
| ------------ | ------------------------------------------------- |
| **TC ID**    | TC_ES_27                                          |
| **Priority** | P1                                                |
| **Steps**    | 1. Render with `context="empty-plan-day"`         |
|              | 2. Count `<p>` elements inside EmptyState         |
| **Expected** | Only title `<p>` rendered. No description `<p>`.  |
|              | Design §4.3 specifies `—` (none) for description. |

#### TC_ES_28: "search-no-results" has no description

| Field        | Value                                              |
| ------------ | -------------------------------------------------- |
| **TC ID**    | TC_ES_28                                           |
| **Steps**    | Same as TC_ES_27 but `context="search-no-results"` |
| **Expected** | No description element                             |

---

### 4.8 TS-08: Context Isolation

#### TC_ES_29: "no-plan" does not render no-history/compact elements

| Field        | Value                                 |
| ------------ | ------------------------------------- |
| **TC ID**    | TC_ES_29                              |
| **Steps**    | 1. Render with `context="no-plan"`    |
|              | 2. Query for text from other contexts |
| **Expected** | "Chưa có buổi tập" NOT present        |
|              | "Không tìm thấy" NOT present          |
|              | "Chưa có bài tập" NOT present         |

#### TC_ES_30: "empty-plan-day" does not render hero/standard elements

| Field        | Value                                         |
| ------------ | --------------------------------------------- |
| **TC ID**    | TC_ES_30                                      |
| **Steps**    | 1. Render with `context="empty-plan-day"`     |
| **Expected** | "Bắt đầu hành trình" NOT present              |
|              | "Chưa có buổi tập" NOT present                |
|              | No `rounded-2xl border-dashed` hero container |

---

## 5. Edge Cases

### EC-01: All 5 contexts use t() — no hardcoded Vietnamese

| Field        | Value                                                                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TC ID**    | TC_ES_31                                                                                                                                                          |
| **Steps**    | 1. Render each of the 5 contexts with mock `t()` that returns the key itself                                                                                      |
|              | 2. Verify rendered text matches i18n KEY (not Vietnamese)                                                                                                         |
| **Expected** | Title text = `fitness.emptyState.noPlanTitle` (or whichever key pattern Dev uses)                                                                                 |
| **Purpose**  | Ensures no hardcoded strings — all text flows through i18n                                                                                                        |
| **Note**     | This is a defensive test. The primary tests (TC_ES_11–15) use a translations map, so they'd pass even with hardcoded text. This test uses raw keys to catch that. |

### EC-02: onAction not called without user interaction

| Field        | Value                                          |
| ------------ | ---------------------------------------------- |
| **TC ID**    | TC_ES_32                                       |
| **Steps**    | 1. Render any context with `onAction={mockFn}` |
|              | 2. Do NOT click anything                       |
| **Expected** | `mockFn` NOT called                            |

---

## 6. i18n Key Coverage Matrix

| Context             | title key                                 | description key                            | CTA key                                 |
| ------------------- | ----------------------------------------- | ------------------------------------------ | --------------------------------------- |
| `no-plan`           | `fitness.emptyState.noPlanTitle`          | `fitness.emptyState.noPlanDescription`     | `fitness.emptyState.noPlanCta`          |
| `no-history`        | `fitness.emptyState.noHistoryTitle`       | `fitness.emptyState.noHistoryDescription`  | `fitness.emptyState.noHistoryCta`       |
| `no-progress`       | `fitness.emptyState.noProgressTitle`      | `fitness.emptyState.noProgressDescription` | `fitness.emptyState.noProgressCta`      |
| `empty-plan-day`    | `fitness.emptyState.emptyDayTitle`        | — (none)                                   | `fitness.emptyState.emptyDayCta`        |
| `search-no-results` | `fitness.emptyState.searchNoResultsTitle` | — (none)                                   | `fitness.emptyState.searchNoResultsCta` |

**Total new keys**: 11 (5 titles + 3 descriptions + 5 CTAs — 2 compact contexts have no description)

**Note**: Dev may choose different key naming. QA validates the PATTERN (all via `t()`), not exact key names. The Vietnamese TEXT must match Design §4.3 exactly.

---

## 7. Spec Ambiguities & Dev Decisions

| #   | Ambiguity               | Design Says                                       | EmptyState Does                                                        | QA Recommendation                                                                                                                                                 |
| --- | ----------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Hero animation          | "All empty states: `animate-fade-in`" (§4.3)      | Hero uses `animate-slide-up` (EmptyState.tsx:53)                       | Accept `animate-slide-up` — it's a superset of fade-in (includes opacity + translate). Test for EITHER class.                                                     |
| 2   | Compact icons           | "Plus h-5 w-5" / "Search h-5 w-5" for compact     | EmptyState compact variant does NOT render icons                       | If Dev passes `icon` prop, EmptyState compact ignores it. Dev must decide: add icon support to compact variant OR accept no icon. Test validates actual behavior. |
| 3   | Touch target `min-h-12` | AC-4: "CTA buttons have `min-h-12` touch targets" | EmptyState hero/standard buttons use `py-2.5 px-5` (no explicit min-h) | Dev should add `min-h-12` class to CTA buttons or ensure padding achieves ≥48px. Test checks for `min-h-12` if present.                                           |
| 4   | `isGenerating` prop     | Not in new spec                                   | Current `no-plan` has `isGenerating`                                   | Likely removed. If kept, QA adds TC_ES_33 (generating spinner).                                                                                                   |

---

## 8. Test File Structure (Recommended)

```typescript
// src/__tests__/PlanEmptyState.test.tsx

describe('PlanEmptyState', () => {
  describe('context: no-plan (hero)', () => {
    it('renders hero variant with Target icon'); // TC_ES_01 + TC_ES_06
    it('displays correct title, description, CTA'); // TC_ES_11
    it('calls onAction when CTA clicked'); // TC_ES_16
    it('has entrance animation class'); // TC_ES_21
    it('does not render other context content'); // TC_ES_29
  });

  describe('context: no-history (standard)', () => {
    it('renders standard variant with Dumbbell icon'); // TC_ES_02 + TC_ES_07
    it('displays correct title, description, CTA'); // TC_ES_12
    it('calls onAction when CTA clicked'); // TC_ES_17
    it('has animate-fade-in class'); // TC_ES_22
  });

  describe('context: no-progress (standard)', () => {
    it('renders standard variant with BarChart3 icon'); // TC_ES_03 + TC_ES_08
    it('displays correct title, description, CTA'); // TC_ES_13
    it('calls onAction when CTA clicked'); // TC_ES_18
  });

  describe('context: empty-plan-day (compact)', () => {
    it('renders compact variant'); // TC_ES_04
    it('displays title and CTA, no description'); // TC_ES_14 + TC_ES_27
    it('calls onAction when CTA clicked'); // TC_ES_19
    it('has animate-fade-in class'); // TC_ES_23
    it('does not render hero/standard elements'); // TC_ES_30
  });

  describe('context: search-no-results (compact)', () => {
    it('renders compact variant'); // TC_ES_05
    it('displays title and CTA, no description'); // TC_ES_15 + TC_ES_28
    it('calls onAction when CTA clicked'); // TC_ES_20
  });

  describe('edge cases', () => {
    it('all text comes from t() — no hardcoded strings'); // TC_ES_31
    it('onAction not called without user click'); // TC_ES_32
  });
});
```

**Estimated test count**: 19–21 tests (some TCs combined for efficiency)
**Coverage target**: 100% statements, branches, functions, lines

---

## 9. Acceptance Criteria Traceability

| AC#   | Criterion                                                             | Test Cases                                | Status |
| ----- | --------------------------------------------------------------------- | ----------------------------------------- | ------ |
| AC-1  | 5 contexts render with correct variant, icon, title, description, CTA | TC_ES_01–15, TC_ES_27–30                  | ⬜     |
| AC-2  | Hero variant has `animate-fade-in` entrance                           | TC_ES_21 (with SPEC AMBIGUITY #1 note)    | ⬜     |
| AC-3  | All text via `t()` with new i18n keys                                 | TC_ES_11–15, TC_ES_31                     | ⬜     |
| AC-4  | CTA buttons have `min-h-12` touch targets                             | TC_ES_24–26                               | ⬜     |
| AC-5  | Tests cover all 5 contexts                                            | All TCs grouped by context                | ⬜     |
| BR-39 | Uses shared EmptyState component                                      | TC_ES_01–05 (variant classes)             | ⬜     |
| BR-40 | Animations respect prefers-reduced-motion                             | Verified by animations.css:82–99 (global) | ⬜     |

---

## 10. Dev Guidance Notes

1. **Delete old contexts**: Remove `expired-plan` and `manual-no-exercises` branches entirely. Delete `isGenerating` prop if unused.
2. **Type change**: `PlanEmptyContext` must be updated to the 5 new context strings.
3. **Use EmptyState directly**: Pass `variant`, `icon`, `title`, `description`, `actionLabel`, `onAction` props to `<EmptyState>`. No need for `SurfaceStateContract` for these simple states.
4. **i18n keys**: Add 11 keys under `fitness.emptyState.*`. Use `t('fitness.emptyState.noPlanTitle')` pattern.
5. **Touch targets**: Add `min-h-12` to hero/standard CTA buttons if EmptyState doesn't provide it by default.
6. **Compact icon decision**: Design says Plus/Search icons for compact, but EmptyState compact doesn't render icons. Either extend EmptyState or accept no icon for compact.

---

**TEST_PLAN_READY** ✅

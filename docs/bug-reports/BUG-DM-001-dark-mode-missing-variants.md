# BUG-DM-001 — Dark mode missing Tailwind variants across multiple components

| Field | Value |
|-------|-------|
| **ID** | BUG-DM-001 |
| **Severity** | Medium |
| **Priority** | P2 |
| **Component** | `AISuggestionPreviewModal`, `MealActionBar`, `DateSelector`, `AnalysisResultView` |
| **Reported** | 2026-03-07 |
| **Status** | ✅ Fixed |

---

## 1. Bug Description

Multiple components use hardcoded light-mode-only Tailwind CSS classes (e.g., `bg-amber-50`, `bg-blue-50`, `active:bg-rose-100`, `bg-slate-200`) without corresponding `dark:` variants. In dark mode, these elements display bright light backgrounds against the dark theme, causing poor contrast and visual inconsistency.

**Environment:**
- OS: macOS (Darwin)
- Browser: Chrome (latest)
- Theme: Dark mode (`Tối`)
- React: 19

---

## 2. Affected Components

### 2.1 AISuggestionPreviewModal.tsx — Meal type cards (HIGH)

**Symptom:** BỮA SÁNG/TRƯA/TỐI cards displayed with bright light backgrounds (`bg-amber-50`, `bg-blue-50`, `bg-indigo-50`) in dark mode, making text hard to read.

**Root cause:** `MEAL_TYPE_COLORS` constant (lines 11–15) only defined light-mode classes.

**Fix:** Added `dark:bg-{color}-900/20`, `dark:border-{color}-700`, `dark:text-{color}-400` variants to all three meal type color definitions. Also added `dark:border-slate-700` to border separator (line 285).

### 2.2 MealActionBar.tsx — Active state buttons (HIGH)

**Symptom:** When pressing/holding action buttons (delete, copy, save, template), the `active:bg-{color}-100` produced bright white flash in dark mode.

**Root cause:** Lines 47, 58, 69, 80 had `active:bg-rose-100`, `active:bg-indigo-100`, `active:bg-amber-100`, `active:bg-purple-100` without `dark:active:` counterparts.

**Fix:** Added `dark:active:bg-{color}-900/30` to all four buttons.

### 2.3 DateSelector.tsx — Navigation buttons active state (HIGH)

**Symptom:** View mode toggle, prev/next navigation buttons flashed bright `bg-slate-200` on press in dark mode.

**Root cause:** Lines 206, 221, 228 had `active:bg-slate-200` without `dark:active:` variant.

**Fix:** Added `dark:active:bg-slate-600` to all three navigation buttons.

### 2.4 AnalysisResultView.tsx — Skeleton loader (MEDIUM)

**Symptom:** Loading skeleton placeholder bars appeared as bright `bg-slate-200` bars against dark background. Container cards used `bg-white` without dark variant.

**Root cause:** Lines 18–36 used `bg-slate-200` for skeleton bars and `bg-white` for containers without `dark:` variants.

**Fix:** Added `dark:bg-slate-700` to all skeleton bars (8 instances) and `dark:bg-slate-800` to container cards (2 instances).

---

## 3. Steps to Reproduce

1. Open Smart Meal Planner at `localhost:3000`
2. Navigate to **Cài đặt** (Settings) tab
3. Click **Tối** (Dark) theme button
4. Navigate to each affected page:
   - **Lịch trình** → Click **Gợi ý AI** → Observe meal type cards (2.1)
   - **Lịch trình** → Press and hold action bar icons (2.2)
   - **Lịch trình** → Press prev/next date buttons (2.3)
   - **AI Phân tích** → Upload image → Observe skeleton loader (2.4)

---

## 4. Files Changed

| File | Changes |
|------|---------|
| `src/components/modals/AISuggestionPreviewModal.tsx` | `MEAL_TYPE_COLORS` dark variants + border separator |
| `src/components/schedule/MealActionBar.tsx` | 4× `dark:active:bg-{color}-900/30` |
| `src/components/DateSelector.tsx` | 3× `dark:active:bg-slate-600` |
| `src/components/AnalysisResultView.tsx` | 8× `dark:bg-slate-700` + 2× `dark:bg-slate-800` |

---

## 5. Verification

- ✅ Dark mode visual inspection via Chrome DevTools — all affected elements now render correctly
- ✅ Console: 0 errors, 0 warnings
- ✅ Lint: `tsc --noEmit && eslint src/` — 0 errors, 0 warnings
- ✅ Unit tests: 995/995 pass
- ✅ Coverage: 100% Lines, 100% Stmts (99.64%), 100% Funcs (99.88%)

---

## 6. Prevention

**Pattern identified:** Developers adding Tailwind utility classes for light mode without adding corresponding `dark:` variants. This is a systemic risk.

**Recommendation:** Add a code review checklist item in `docs/03-developer-guide/coding-guidelines.md`:
> When adding any `bg-*`, `text-*`, `border-*`, or `active:bg-*` utility class, always include the corresponding `dark:` variant.

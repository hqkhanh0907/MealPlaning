# 🎯 CEO Deliverable — Phase 3.4 Library Screen Redesign

> **Status:** YÊU*CẦU*ĐÃ_RÕ_RÀNG
> **Date:** 2026-08-01
> **Author:** CEO Agent
> **Input:** Phase 0 Audit (M008) + Phase 1-3.3 Design System + Codebase Analysis
> **Output:** Vision, 14 Functional Requirements, 8 Non-Functional Requirements, Risk Matrix, Assumptions

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Philosophy](#2-vision--philosophy)
3. [Current State Diagnosis](#3-current-state-diagnosis)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Constraints & Guardrails](#6-constraints--guardrails)
7. [Risk Matrix](#7-risk-matrix)
8. [Assumptions & Defaults](#8-assumptions--defaults)
9. [Open Questions for User](#9-open-questions-for-user)
10. [Success Criteria](#10-success-criteria)
11. [Appendix: Competitive Landscape Analysis](#11-appendix-competitive-landscape-analysis)

---

## 1. Executive Summary

### Scope

Transform the Library tab from a **utilitarian CRUD manager** into a **world-class recipe & ingredient command center** — the culinary heart of the app that users return to daily with pleasure.

### The Problem in One Sentence

The Library tab crams 876 LOC of search, filter, sort, compare, detail view, and 5 action buttons per card onto a 360px mobile screen, creating a **visually dense, action-overloaded experience** that feels like a developer's admin panel, not a chef's kitchen.

### Key Numbers (Current State — verified from source code)

| Metric                          | Current | Issue                                          |
| ------------------------------- | ------- | ---------------------------------------------- |
| DishManager LOC                 | 876     | Monolith — does everything                     |
| DishEditModal LOC               | 797     | Mega-modal with AI + inline creation           |
| Modal nesting depth             | Up to 4 | DishEdit → QuickAdd → AISuggest → Confirmation |
| Actions per dish card           | 5       | View, Edit, Clone, Delete, Compare             |
| Nutrition values shown per card | 2       | Calories + Protein (always visible)            |
| Sort options                    | 10      | Overwhelming for mobile dropdown               |
| Components total                | 9       | High cognitive load across screens             |
| Total LOC (source)              | ~5,900  | Substantial refactor needed                    |
| Total LOC (tests)               | ~4,400  | Strong foundation to preserve                  |

### Transformation Summary

| Dimension                 | Before (Current)                               | After (Phase 3.4)                                           |
| ------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| **Layout**                | Flat list/grid with everything visible         | Progressive disclosure: browse → preview → detail           |
| **Card density**          | 5 actions + 2 nutrition values + tags + rating | Name + 1 hero stat + meal type dot → tap to reveal          |
| **Compare**               | Checkbox + FAB + z-50 modal                    | Dedicated compare sheet with side-by-side cards             |
| **Edit flow**             | Modal (797 LOC mega-form)                      | Full-page via `pushPage()` — step-by-step form              |
| **Modal depth**           | 4 levels                                       | Max 2 levels (page + 1 sheet/modal)                         |
| **Grocery**               | Separate isolated component                    | Integrated 3rd sub-tab with shared visual language          |
| **AI features**           | Scattered across modals                        | Unified AI assistant surface                                |
| **Information hierarchy** | Flat — everything same weight                  | Clear: Hero stat → Secondary → Expandable detail            |
| **Consistency**           | Pre-Phase 1 design                             | Aligned with Dashboard (3.1), Calendar (3.2), Fitness (3.3) |

---

## 2. Vision & Philosophy

### 2.1 Design Metaphor: "Your Personal Recipe Book"

A great recipe library should feel like flipping through a **beautifully organized personal cookbook** — not scrolling a database table. The key experience pillars:

1. **Scan Fast** — In 2 seconds, find the dish you want among 50+ recipes
2. **Decide Confident** — See just enough nutrition to choose, not so much it overwhelms
3. **Edit Seamless** — Creating/editing a dish feels like writing on a recipe card, not filling out tax forms
4. **Compare Smart** — Side-by-side nutrition comparison as natural as placing two cards on a table
5. **Shop Ready** — Grocery list generation is 1 tap away, not buried in a separate world

### 2.2 The "3-Second Rule"

Every primary user task must reach its first meaningful interaction within 3 seconds:

| Task                  | Current (seconds)                          | Target (seconds)                 |
| --------------------- | ------------------------------------------ | -------------------------------- |
| Find a specific dish  | ~5s (scroll + scan dense cards)            | <2s (search + clean cards)       |
| Check dish calories   | ~3s (visible but lost in noise)            | <1s (hero stat on card)          |
| Start editing a dish  | ~4s (find card → find edit button)         | <2s (tap card → tap edit)        |
| Compare 2 dishes      | ~8s (toggle compare → check → check → FAB) | <4s (long-press → compare sheet) |
| Generate grocery list | ~6s (switch sub-tab → select scope)        | <3s (sub-tab → auto-scope)       |

### 2.3 Progressive Disclosure Hierarchy

```
Level 0 — Browse     : Card title + hero stat + meal type color
Level 1 — Preview    : Tap card → expand inline OR bottom sheet with full nutrition
Level 2 — Full Detail: Push page → complete recipe view (ingredients, notes, AI analysis)
Level 3 — Edit       : Push page → step-by-step form with AI assistance
```

This matches the pattern established in:

- **Dashboard (3.1)**: CombinedHero → tap → EnergyDetailSheet
- **Calendar (3.2)**: MealSlot summary → tap → full nutrition view
- **Fitness (3.3)**: TodayWorkoutCard → tap → WorkoutLogger detail page

---

## 3. Current State Diagnosis

### 3.1 Architectural Debt

| Problem                | File              | LOC | Impact                                                                                                                                                                  |
| ---------------------- | ----------------- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monolith component** | DishManager.tsx   | 876 | Search, filter, sort, compare, cards, detail, empty state — ALL in one file. Impossible to optimize individually.                                                       |
| **Mega-modal form**    | DishEditModal.tsx | 797 | Single modal handling: dish name, tags, ingredient search, ingredient creation, AI suggestions, rating, notes. On mobile, 90dvh modal inside a modal is claustrophobic. |
| **Modal nesting**      | Multiple          | —   | DishEditModal → QuickAddIngredientForm → AISuggestIngredientsPreview → ConfirmationModal. 4 layers on a 360px screen.                                                   |
| **Tight coupling**     | ManagementTab     | 89  | Thin wrapper that passes 12+ callback props down. No clean separation.                                                                                                  |
| **Isolated grocery**   | GroceryList       | 533 | Shares zero visual patterns with dish/ingredient lists. Different card style, different interaction model.                                                              |

### 3.2 UX Friction Points (7 identified)

| #   | Friction                       | Severity | Evidence                                                                                                                                                              |
| --- | ------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **Action overload**            | High     | 5 actions per card (View, Edit, Clone, Delete, Compare) visible simultaneously. On 360px, this means 5 icon buttons crammed into card footer.                         |
| F2  | **Compare mode confusion**     | High     | Compare checkbox (top-right of each card) + floating FAB (bottom-right) + z-50 comparison modal. Three separate UI elements for one feature.                          |
| F3  | **Flat information hierarchy** | High     | Card shows: icon, name, ingredient count, tags, rating stars, 2 nutrition values, 3 action buttons — all at the same visual weight.                                   |
| F4  | **Modal claustrophobia**       | High     | DishEditModal is 90dvh height with 6 form sections in one scroll. On smaller screens (640px height), only 2-3 fields visible at once. Keyboard pushes content up.     |
| F5  | **Sort dropdown overload**     | Medium   | 10 sort options in a dropdown on mobile. Most users use 2-3 sort modes.                                                                                               |
| F6  | **AI features scattered**      | Medium   | AI suggest button on dish name field, AI search button on ingredient modal, AI auto-fill on ingredient name blur. Three different AI entry points with different UIs. |
| F7  | **Grocery disconnect**         | Medium   | GroceryList uses different card patterns, different scope paradigm, different empty state style. Feels like a different app.                                          |

### 3.3 What Works Well (Preserve)

| Strength                         | Why it works                                                           | Preserve how                                        |
| -------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------- |
| **Dual layout (Grid/List)**      | Users have preference; grid for visual scanning, list for quick action | Keep as layout toggle, refine card designs for both |
| **Tag-based filtering**          | Meal type chips (Breakfast, Lunch, Dinner, Snack) are intuitive        | Keep as horizontal scroll chips                     |
| **useItemModalFlow**             | Clean state machine for view → edit → unsaved flow                     | Refactor to use pushPage but keep transitions       |
| **useListManager**               | Generic search/sort/filter — well-abstracted                           | Keep and extend                                     |
| **Ingredient smart fill**        | Auto-populates nutrition from name — delightful                        | Keep and improve response time                      |
| **Grocery aisle categorization** | Smart grouping by category — useful                                    | Keep logic, redesign presentation                   |
| **Comparison nutrition table**   | Best-value highlighting with underline                                 | Keep data model, redesign as side-by-side cards     |

---

## 4. Functional Requirements

### FR-01: Dish Browse Experience — "Scan Fast"

**Intent**: Users browse dishes like flipping through a beautifully organized cookbook. Cards are clean, scannable, and reveal detail progressively.

**Behaviors**:

- Card shows: **Dish name** (primary), **hero stat** (calories, prominent), **meal type indicator** (color dot or subtle badge), **ingredient count** (secondary text)
- Rating stars visible ONLY on cards with rating > 0, displayed subtly (small stars or numeric "4.5★")
- Protein, carbs, fat, fiber hidden by default — revealed on tap/expand (Level 1 disclosure)
- Actions (edit, clone, delete) hidden by default — revealed via swipe gesture (list view) or tap-to-expand (grid view)
- Compare selection via long-press (haptic feedback on supported devices), not persistent checkbox

**Card Visual Spec**:

```
┌─────────────────────────────┐
│  🍳  Ức gà áp chảo     4.5★ │  ← Name + rating (if > 0)
│  330 kcal · 3 nguyên liệu   │  ← Hero stat + ingredient count
│  ● Trưa  ● Tối              │  ← Meal type dots (color-coded)
└─────────────────────────────┘
```

**Grid Card Expanded** (on tap):

```
┌─────────────────────────────┐
│  🍳  Ức gà áp chảo     4.5★ │
│  330 kcal · 3 nguyên liệu   │
│  ● Trưa  ● Tối              │
│─────────────────────────────│
│  Protein  62g    Carbs   0g  │  ← Revealed nutrition
│  Fat       4g    Fiber   0g  │
│─────────────────────────────│
│  [Xem]  [Sửa]  [Clone] [🗑] │  ← Revealed actions
└─────────────────────────────┘
```

### FR-02: Search & Filter — "Find in 2 Seconds"

**Intent**: Search is the primary navigation for libraries with 20+ dishes. It must be fast, forgiving, and front-and-center.

**Behaviors**:

- Search bar is **sticky at top**, always visible when scrolling (not buried below header)
- Search is **instant** (client-side, debounced 150ms) with **fuzzy matching** on dish name
- Filter chips below search: "Tất cả", "Bữa sáng", "Bữa trưa", "Bữa tối", "Bữa phụ" — horizontal scroll
- Active filter chip uses meal-type color token (breakfast=amber, lunch=emerald, dinner=violet, snack=muted)
- Sort accessible via icon button next to search (not inline dropdown) → opens **FilterBottomSheet** (existing Phase 2 archetype)
- Sort options reduced to 6 most useful: Name (A→Z, Z→A), Calories (↑↓), Protein (↑↓), Rating (↑↓)
- Layout toggle (Grid/List) as icon pair next to sort button

**Visual Layout**:

```
┌──────────────────────────────────┐
│  🔍 Tìm kiếm món ăn...    ⇅  ⊞⊟ │  ← Search + Sort + Layout
│  [Tất cả] [Sáng] [Trưa] [Tối]→  │  ← Filter chips (scroll)
├──────────────────────────────────┤
│  Card Grid / List                 │
│  ...                              │
└──────────────────────────────────┘
```

### FR-03: Dish Detail View — "Full Recipe Page"

**Intent**: Tapping a dish card opens a **full-page view** (via `pushPage()`) — not a modal. This gives the recipe room to breathe and matches the Fitness pattern (TodayWorkoutCard → WorkoutLogger).

**Behaviors**:

- Push onto pageStack (max depth maintained)
- Header: Back button + dish name + Edit (icon) + More (...) menu (Clone, Delete)
- Hero section: Large nutrition ring or bar showing calories prominently
- Macro breakdown: 4-column grid (Protein, Carbs, Fat, Fiber) with color-coded bars
- Ingredient list: Expandable section with amounts + unit, each ingredient tappable to view detail
- Notes section: If notes exist, displayed in a subtle card
- Rating: Editable star display (tap to rate inline)
- Tags: Meal type badges with appropriate colors
- AI section (if applicable): "Phân tích AI" card showing AI-generated insights

**Consistency with Phase 3.1-3.3**:

- Uses `PageLayout` wrapper (Phase 2 archetype)
- Nutrition display uses `MacroBar` pattern from Dashboard (3.1)
- Section cards use `CardLayout` (Phase 2)
- Stagger animation: `animate-slide-up` with 30ms tier delays

### FR-04: Dish Edit Flow — "Step-by-Step Recipe Card"

**Intent**: Replace 797-LOC mega-modal with a **full-page, step-by-step form**. Each step fits on one mobile screen without scrolling.

**Behaviors**:

- Opens via `pushPage()` — full-screen, not modal
- **3 steps** with progress indicator at top:
  1. **Thông tin cơ bản** (Basics): Name + Meal type tags + Rating + Notes
  2. **Nguyên liệu** (Ingredients): Search, add, adjust amounts — full screen dedicated to this
  3. **Xem lại** (Review): Preview nutrition summary + ingredient list + confirm save
- Each step validated independently (`form.trigger([...STEP_FIELDS[step]])`)
- Step navigation via "Tiếp tục" / "Quay lại" buttons (not swiping — explicit intent)
- `UnsavedChangesDialog` triggers on back gesture or back button when form is dirty
- AI suggest button on Step 1 (name field) — opens AI suggestion as a **bottom sheet**, not nested modal
- Ingredient quick-add on Step 2 — opens as **bottom sheet** overlay, not nested modal

**Step Layout** (mobile):

```
Step 1:                    Step 2:                    Step 3:
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ ① ━━ ② ── ③ ──  │      │ ① ── ② ━━ ③ ──  │      │ ① ── ② ── ③ ━━  │
│                  │      │                  │      │                  │
│ Tên món ăn       │      │ 🔍 Tìm nguyên...│      │ [Nutrition Hero] │
│ [_____________]  │      │ ┌─ Gần đây ────┐│      │  330 kcal        │
│                  │      │ │ Ức gà    150g ││      │  P:62 C:0 F:4   │
│ Phù hợp cho: *  │      │ │ Trứng     60g ││      │                  │
│ [Sáng][Trưa]    │      │ ├─ Tất cả ─────┤│      │ ─── Nguyên liệu ─│
│ [Tối] [Phụ]     │      │ │ Bông cải  80g ││      │ • Ức gà    150g  │
│                  │      │ │ Khoai lang100g││      │ • Dầu ô liu 10ml │
│ Đánh giá:       │      │ └──────────────┘│      │                  │
│ ★★★★☆           │      │                  │      │ ─── Ghi chú ─────│
│                  │      │ Đã chọn (3):    │      │ Áp chảo 5 phút   │
│ Ghi chú:        │      │ [Ức gà 150g] [×]│      │ mỗi mặt          │
│ [_____________]  │      │ [Dầu     10ml][×]│      │                  │
│                  │      │ [Muối     5g] [×]│      │                  │
│ [Quay lại][Tiếp] │      │ [Quay lại][Tiếp] │      │ [Quay lại][Lưu]  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

**Max modal depth from edit flow: 1** (edit page + 1 bottom sheet for quick-add or AI suggest).

### FR-05: Compare Mode — "Side-by-Side Cards"

**Intent**: Compare is a power-user feature. It should be accessible but not clutter the browse experience.

**Behaviors**:

- **Entry**: Long-press on a dish card → card enters "selected" state (ring highlight + checkmark badge)
- **Multi-select**: After first long-press, subsequent taps toggle selection (max 3)
- **Compare trigger**: When ≥2 selected → sticky bottom bar appears: "[Compare icon] So sánh X món" + "Hủy"
- **Compare view**: Bottom sheet (side="bottom", 85dvh) — NOT a modal
  - Side-by-side cards (2 columns) or stacked (3 dishes)
  - Each column: Dish name + full nutrition breakdown
  - Best values highlighted (green text + bold)
  - Worse values subtle (muted text)
- **Exit**: Close sheet → selection cleared → back to browse

**Consistency**: Matches Calendar's `FilterBottomSheet` and Fitness's `ExerciseSelector` sheet patterns.

### FR-06: Ingredient Management — "Consistent with Dishes"

**Intent**: Ingredient list follows the same visual language as dish list. No "second-class citizen" feeling.

**Behaviors**:

- Same card pattern: Name + hero stat (calories per 100g) + unit badge
- Expanded: Full nutrition (protein, carbs, fat, fiber per 100g)
- "Used in" section: Shows dish names that reference this ingredient — tappable to navigate to dish detail
- Delete protection: If used in any dish → disable delete + show usage count
- Edit: Opens as full-page form (same pattern as dish edit, but single-step since fewer fields)
- AI auto-fill: On name input blur, auto-fills nutrition if match found (existing behavior, keep)

### FR-07: Grocery List — "Integrated Shopping Companion"

**Intent**: Grocery list is the 3rd sub-tab, visually unified with dishes and ingredients. It's the actionable output of meal planning.

**Behaviors**:

- Sub-tab "Đi chợ" with shopping bag icon — 3rd tab after "Món ăn" and "Nguyên liệu"
- Scope selector: Pill group "Hôm nay" / "Tuần này" / "Tất cả" (ButtonGroupSelector, 3 columns)
- Smart default: Scope auto-selects based on whether today has a plan
- Aisle grouping: Toggle between flat list and grouped-by-aisle
- Each item: Checkbox + ingredient name + total amount + unit
- Expandable: Tap item → shows "Dùng trong: Ức gà áp chảo (150g), Salad (50g)"
- Progress: Top progress bar showing "X/Y đã mua" with percentage
- Actions: Copy list (clipboard), Share (native share API)
- Checked items: Move to bottom, strikethrough, muted opacity
- Empty state: "Chưa có kế hoạch bữa ăn" with CTA to Calendar tab

**Visual refresh**: Use `Card` components (Phase 2) with `variant="ghost"` for grocery items. Aisle headers use section heading pattern from Fitness ProgressDashboard.

### FR-08: AI Features — "Unified AI Surface"

**Intent**: Consolidate scattered AI features into a coherent AI assistant experience.

**Current AI features** (all preserved, just reorganized):

1. AI suggest ingredients for a dish (from dish name)
2. AI auto-fill nutrition for an ingredient (from ingredient name)
3. AI save analyzed dish (from image analysis — separate flow, not in library browse)

**Behaviors**:

- AI suggest (dish edit Step 2): "Gợi ý từ AI" button in ingredient search area → bottom sheet with suggestions
- AI auto-fill (ingredient edit): Inline indicator with `--color-ai` accent when auto-filled
- AI features use consistent `--color-ai` / `--color-ai-subtle` tokens
- AI loading state: Skeleton + Sparkles icon animation (not raw spinner)
- AI error: Inline error card with retry button (not toast)

### FR-09: Empty States — "Encouraging, Not Hollow"

**Intent**: Empty states are onboarding moments, not dead ends.

**Behaviors**:

- **No dishes**: Hero empty state with illustration/icon, encouraging text, primary CTA "Tạo món ăn đầu tiên"
- **No ingredients**: Similar hero empty state, CTA "Thêm nguyên liệu"
- **No search results**: Inline empty state with search suggestions: "Thử tìm kiếm khác" or "Tạo món mới"
- **No grocery items**: "Chưa có kế hoạch" with CTA linking to Calendar

Uses `EmptyState` component variants: `hero` for no data, `compact` for no search results.

### FR-10: Sub-Tab Navigation

**Intent**: Library tab has 3 sub-tabs, consistent with Calendar's sub-tab pattern.

**Behaviors**:

- Sub-tab bar: `SubTabBar` component (Phase 2 archetype)
- Tabs: "Món ăn" (dishes, default), "Nguyên liệu" (ingredients), "Đi chợ" (grocery)
- Each tab remembers its scroll position independently
- Sub-tab state managed via `uiStore` (existing pattern)
- No page stack pollution — sub-tabs render inline within library tab panel

### FR-11: Dish Duplication — "Quick Clone"

**Intent**: Cloning a dish is a power-user feature for creating variations.

**Behaviors**:

- Accessible from: dish detail page More menu (⋯) → "Nhân bản"
- Also accessible from: expanded card action row
- Creates copy with name appended " (Bản sao)"
- Opens edit flow immediately with pre-filled data
- User can modify before saving

### FR-12: Delete with Undo

**Intent**: Delete is destructive — protect the user but keep the flow smooth.

**Behaviors**:

- Delete button shows ConfirmationModal (Phase 2 archetype)
- If dish is used in active meal plans → warning in confirmation body: "Món này đang được dùng trong X kế hoạch"
- If ingredient is used in dishes → cannot delete, show inline message
- After confirm delete → toast with "Hoàn tác" action (5-second window)
- Undo restores full state (optimistic deletion pattern)

### FR-13: Batch Operations (Deferred — Track as Future Enhancement)

**Intent**: Multi-select for batch delete/tag is a nice-to-have but not Phase 3.4 scope.

**Decision**: Defer to avoid scope creep. Compare mode already handles multi-select. Batch operations would conflict with compare's long-press gesture.

### FR-14: Data Consistency

**Intent**: Library data changes must propagate correctly to all consumers.

**Behaviors**:

- Dish edit → recalculates nutrition in all active meal plans
- Ingredient edit → recalculates nutrition in all dishes using it → cascades to meal plans
- Delete dish → removes from active meal plans (with confirmation)
- All mutations persist to SQLite immediately (existing autoSync pattern)
- Store subscriptions ensure UI updates across tabs (dashboard budget, calendar meals)

---

## 5. Non-Functional Requirements

### NFR-01: Performance Budget

| Metric                     | Target  | Rationale                         |
| -------------------------- | ------- | --------------------------------- |
| Initial render (50 dishes) | < 200ms | Users notice delays > 200ms       |
| Search input → results     | < 100ms | Must feel instant                 |
| Card expand animation      | 200ms   | Matches `animate-scale-in` timing |
| Page push transition       | 300ms   | Matches `animate-slide-up` timing |
| Dish edit form mount       | < 150ms | Form should feel ready instantly  |

### NFR-02: Bundle Impact

- New chunks should not increase main bundle by more than 5KB
- Library components should be in the same chunk (no unnecessary splits)
- AI features remain in `vendor-genai` chunk (lazy loaded)

### NFR-03: Accessibility

- All interactive elements: `min-h-11 min-w-11` (44×44px touch targets)
- Card actions: `aria-label` for icon-only buttons
- Compare selection: `aria-selected` state announcement
- Filter chips: `role="radiogroup"` with arrow key navigation
- Form steps: `aria-current="step"` for progress indicator
- Sheet/modal: focus trap, escape to close, scroll lock

### NFR-04: Animation & Motion

- All animations respect `prefers-reduced-motion: reduce`
- Stagger delays: 30ms between cards (max 5 staggered, rest instant)
- Touch feedback: `active:scale-[0.98]` on all tappable elements
- Page transitions: `animate-slide-up` for push, reverse for pop

### NFR-05: Offline Behavior

- All browse/search/filter/sort operations work fully offline
- AI features show clear "Cần kết nối mạng" state when offline
- Grocery list generation works offline (all data local)
- Edits persist to SQLite immediately

### NFR-06: Test Coverage

- 100% statement coverage for all new/modified code
- Preserve all existing test scenarios (4,400+ LOC tests)
- New test coverage for: step-by-step form, compare sheet, grocery sub-tab
- SonarQube: 0 issues after completion

### NFR-07: Component Decomposition

- No single component file exceeds **300 LOC** (current max: 876 LOC)
- Extract from DishManager: `DishCard`, `DishGrid`, `DishList`, `DishSearchBar`, `DishFilterChips`, `CompareSheet`
- Extract from DishEditModal: `DishEditPage`, `DishEditStep1`, `DishEditStep2`, `DishEditStep3`

### NFR-08: Design Token Compliance

- Zero hardcoded colors (hex, rgb, hsl) — all via semantic tokens
- Zero hardcoded spacing beyond Tailwind scale
- Meal type colors: breakfast → `--meal-breakfast`, lunch → `--meal-lunch`, dinner → `--meal-dinner`
- AI features: `--color-ai`, `--color-ai-subtle`, `--color-ai-emphasis`
- Nutrition: `--macro-protein`, `--macro-carbs`, `--macro-fat`, `--color-energy`

---

## 6. Constraints & Guardrails

### Must Use (Non-Negotiable)

| Constraint                                                                                                                                             | Reason                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Phase 1 design tokens (88 oklch + 80 semantic)                                                                                                         | Visual consistency across all tabs              |
| Phase 2 component archetypes (Card, Sheet, Button, ModalBackdrop, EmptyState, SubTabBar, FilterBottomSheet, ConfirmationModal, PageLayout, CardLayout) | Architectural consistency                       |
| `pushPage()` for detail/edit views                                                                                                                     | Navigation model spec; hides bottom nav         |
| `useListManager` hook                                                                                                                                  | Proven abstraction for search/sort/filter       |
| `useItemModalFlow` (adapted)                                                                                                                           | Clean state machine for view → edit transitions |
| React Hook Form + Zod                                                                                                                                  | Project convention for all forms                |
| `SubTabBar` for sub-navigation                                                                                                                         | Established pattern in Calendar, Fitness        |
| Vietnamese-only i18n                                                                                                                                   | Project constraint                              |
| Zustand stores (dishStore, ingredientStore)                                                                                                            | Existing data layer                             |

### Must NOT Do

| Anti-Pattern                                                   | Why                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------- |
| New ad-hoc modal patterns                                      | Phase 2 standardized all overlay archetypes                         |
| `eslint-disable`                                               | Project rule — fix the underlying issue                             |
| Inline styles or hardcoded colors                              | Token compliance (NFR-08)                                           |
| More than 2 levels of overlay nesting                          | Mobile claustrophobia                                               |
| New npm dependencies for UI                                    | Use existing shadcn/ui + Tailwind                                   |
| Grid/List views with different data (showing different fields) | Grid and List must show same information, just laid out differently |

### Breaking Changes Accepted

- DishManager.tsx (876 LOC) → decomposed into 6+ smaller components
- DishEditModal.tsx (797 LOC) → replaced with DishEditPage (full-page, multi-step)
- ManagementTab.tsx → restructured with 3 sub-tabs
- Compare mode interaction model changed (checkbox → long-press)
- i18n keys may be restructured under `library.*` namespace

---

## 7. Risk Matrix

| #   | Risk                                                                            | Probability | Impact | Mitigation                                                                                                        |
| --- | ------------------------------------------------------------------------------- | ----------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| R1  | DishManager decomposition (876 LOC) breaks existing test suite                  | High        | High   | Map every test to its new component location BEFORE refactoring. Run tests after each extraction.                 |
| R2  | Step-by-step form (replacing mega-modal) loses existing edit UX nuances         | Medium      | High   | Create behavior test matrix for DishEditModal BEFORE replacing. Verify each scenario works in new flow.           |
| R3  | Long-press gesture for compare conflicts with mobile browser context menu       | Medium      | Medium | Use 300ms threshold (shorter than browser context menu). Add fallback: "So sánh" button in expanded card actions. |
| R4  | Grocery sub-tab integration creates import cycle with dayPlanStore              | Low         | Medium | GroceryList already imports dayPlanStore. Sub-tab just changes mount point, not data flow.                        |
| R5  | 5,900 LOC refactor introduces regressions not caught by 4,400 LOC tests         | Medium      | High   | Phase approach: extract → test → style → test. Never skip intermediate test runs.                                 |
| R6  | AI suggestion bottom sheet (replacing modal) changes z-index stacking           | Low         | Low    | Use `z-60` for page overlay sheets (established Phase 2 convention).                                              |
| R7  | Performance regression from progressive disclosure (expand/collapse animations) | Low         | Medium | Use CSS-only animations (height auto → fixed). No JS-driven layout calculations.                                  |

---

## 8. Assumptions & Defaults

The following assumptions are made based on established patterns, user's stated vision ("world-class, no production app can compare"), and standard UX conventions. These are **default decisions** — user can override any of them.

| #   | Assumption               | Default                                                  | Rationale                                                                |
| --- | ------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| A1  | Card tap behavior        | Tap → expand inline (grid), tap → detail page (list)     | Grid users want quick preview; list users expect direct navigation       |
| A2  | Compare gesture          | Long-press (300ms)                                       | Standard mobile multi-select pattern (iOS Photos, Android Files)         |
| A3  | Edit flow structure      | 3 steps (Basics → Ingredients → Review)                  | Reduces cognitive load; each step fits one screen                        |
| A4  | Grocery sub-tab position | 3rd tab (after Món ăn, Nguyên liệu)                      | Logical flow: create dishes → manage ingredients → generate grocery list |
| A5  | Sort options count       | 6 (reduced from 10)                                      | Remove: ingredient count sort (niche), keep: name/cal/protein/rating     |
| A6  | Dish card hero stat      | Calories                                                 | Most universally understood metric; protein is secondary                 |
| A7  | Rating display           | Numeric "4.5★" on card, interactive stars on detail/edit | Saves space on compact card                                              |
| A8  | Search scope             | Dish name only (Vietnamese)                              | Ingredient-content search is advanced; defer to avoid complexity         |
| A9  | Ingredient edit form     | Single page (not multi-step)                             | Only 5-6 fields — doesn't warrant step-by-step                           |
| A10 | Grocery default scope    | "Tuần này" if week has plans, "Hôm nay" otherwise        | Most useful default; user can change                                     |

---

## 9. Open Questions for User

These are **genuinely ambiguous** areas where multiple valid approaches exist. Assumptions A1-A10 will be used as defaults if no response is provided.

### Q1: Card Tap Behavior — Expand Inline vs. Push Detail Page?

**Option A** (Default for Grid): Tap card → expand inline to show full nutrition + actions. Second tap or "Xem chi tiết" → push detail page.
**Option B**: Tap card always → push detail page immediately (simpler, fewer states).
**Trade-off**: Option A is more progressive but adds complexity. Option B is simpler but requires page push even for quick nutrition glance.

> **Default assumption**: Option A for grid view, Option B for list view.

### Q2: Compare Entry — Long-Press vs. Explicit Button?

**Option A** (Default): Long-press on card → enter compare mode. Natural but discoverable only through exploration.
**Option B**: Explicit "So sánh" icon button visible on each card. More discoverable but adds visual noise.
**Option C**: Compare toggle in toolbar (like current). Familiar but clutters toolbar.

> **Default assumption**: Option A (long-press) + fallback button in expanded card actions.

### Q3: Grocery List — Sub-Tab vs. Separate Page?

**Option A** (Default): 3rd sub-tab within Library tab. Consistent with Calendar's sub-tab pattern.
**Option B**: Accessible from Calendar tab instead (since it's tied to meal plans). Logical but moves it away from ingredients.
**Option C**: Both — accessible from Library AND Calendar via pushPage.

> **Default assumption**: Option A. Library is the "food management hub."

### Q4: AI Features — How Prominent?

**Option A** (Default): AI buttons visible but not dominant. Use `--color-ai-subtle` background, Sparkles icon.
**Option B**: AI as a floating assistant button (like ChatGPT) that can suggest ingredients, auto-fill nutrition, analyze dishes.
**Trade-off**: Option B is more futuristic but adds significant complexity and may feel intrusive for an offline-first app where AI requires connectivity.

> **Default assumption**: Option A. Keep AI as contextual assistant, not global overlay.

### Q5: Ingredient Search within Dish Edit — Full List vs. Categorized?

**Option A** (Default): Flat list with search (current pattern). Simple, works well for <50 ingredients.
**Option B**: Categorized by type (Protein, Dairy, Grains, Produce) with collapsible sections.
**Trade-off**: Option B adds discoverability but increases complexity. Most users search by name, not category.

> **Default assumption**: Option A with "Gần đây" (recently used) section above full list.

---

## 10. Success Criteria

### Quantitative

| Criteria               | Target                       | How to Verify                     |
| ---------------------- | ---------------------------- | --------------------------------- |
| Component max LOC      | ≤ 300 LOC per file           | `wc -l` on each new component     |
| Modal nesting depth    | ≤ 2 (page + 1 overlay)       | Code review: count overlay layers |
| Test coverage          | 100% statements for new code | `vitest --coverage`               |
| SonarQube issues       | 0                            | `npm run sonar`                   |
| Lighthouse performance | ≥ 90 (mobile)                | DevTools audit                    |
| Bundle size impact     | < 5KB increase to main chunk | `npm run analyze` comparison      |
| Existing tests         | 0 new failures               | `npm run test`                    |
| Build                  | Clean, 0 warnings            | `npm run build`                   |
| Lint                   | 0 errors, 0 `eslint-disable` | `npm run lint`                    |

### Qualitative

| Criteria                                           | How to Verify                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| Visual consistency with Dashboard/Calendar/Fitness | Screenshot comparison of all 5 tabs                               |
| Progressive disclosure works intuitively           | Manual test: browse → preview → detail → edit flow                |
| Compare mode is discoverable and usable            | Manual test: first-time user can compare 2 dishes in < 10 seconds |
| Grocery list feels integrated, not bolted-on       | Visual inspection: same card styles, same interaction patterns    |
| AI features are helpful, not intrusive             | Manual test: AI suggestions appear contextually, don't block flow |
| Empty states are encouraging, not hollow           | Visual inspection with cleared data                               |

---

## 11. Appendix: Competitive Landscape Analysis

### Best-in-Class Recipe Library UX (Studied)

| App              | What They Do Well                                                           | What We Should Adopt                                                                                  |
| ---------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Yummly**       | Beautiful food photography cards, progressive disclosure, save/collect flow | Card hierarchy (hero stat + clean design). We don't have photos but can use icon + color effectively. |
| **Paprika**      | Powerful search, clean recipe view, built-in grocery list generation        | Search-first UX, integrated grocery list as natural output of library.                                |
| **MyFitnessPal** | Quick-add focus, minimal friction for logging, nutrition front-and-center   | Hero calorie stat on cards, minimal actions visible by default.                                       |
| **Lifesum**      | Card-based design with beautiful color system, meal type categorization     | Color-coded meal types as primary visual differentiator on cards.                                     |
| **Noom**         | Simple, low cognitive load, guided experience, progress indicators          | Step-by-step form for dish creation, progress bar in grocery list.                                    |
| **Mealime**      | Grocery list with aisle grouping, checking off items, clean mobile UX       | Aisle categorization + checked-off animation + progress tracking.                                     |

### Key Patterns Adopted for Phase 3.4

1. **From Yummly**: Card hierarchy — one hero stat, rest progressive
2. **From Paprika**: Search-first navigation, grocery as output of library
3. **From MyFitnessPal**: Calorie as universal hero stat, minimal initial actions
4. **From Lifesum**: Color-coded meal type indicators on cards
5. **From Noom**: Step-by-step creation flow, encouraging empty states
6. **From Mealime**: Grocery list with progress bar, aisle grouping, check animation

---

## Traceability to Phase 0 Audit

| Audit Finding                                                                       | Phase 3.4 Response                                                            |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **M008**: "Library list is usable but visually dense and action-heavy on mobile"    | FR-01 (card redesign), FR-02 (search-first), NFR-07 (component decomposition) |
| **M008**: "Refactor should reduce friction for high-frequency browse/edit behavior" | FR-03 (full-page detail), FR-04 (step-by-step edit), FR-05 (compare sheet)    |
| Phase 0 baseline screenshot                                                         | Will be compared against Phase 3.4 completion screenshots                     |

---

## Handoff Notes for BM (Business Manager)

1. **14 Functional Requirements** (FR-01 → FR-14) — each needs User Stories with acceptance criteria
2. **8 Non-Functional Requirements** (NFR-01 → NFR-08) — each needs measurable test criteria
3. **5 Open Questions** (Q1-Q5) have default assumptions — proceed with defaults if user doesn't respond within 1 session
4. **7 Risks** (R1-R7) — BM should create edge cases for each risk
5. **10 Assumptions** (A1-A10) — BM should validate each against user's prior decisions
6. Priority ordering: FR-01 → FR-04 → FR-02 → FR-03 → FR-07 → FR-05 → FR-06 → FR-08 → FR-09 → FR-10 → FR-11 → FR-12 → FR-14 (FR-13 deferred)
7. **Breaking changes accepted** — no need to maintain backward compatibility for component APIs
8. **Total estimated effort**: 5 waves of implementation (wave structure to be defined by Tech Leader)

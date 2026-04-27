# `shared/forms/mappers/` — viewModel ⇄ entity convention

This directory holds **pure functions** that translate between the UI form
shape (camelCase, `null`/`undefined` mixed) and the persistence-layer
entity (snake_case, mostly `null`).

## Convention

For every feature that owns a form, create `<feature>-form.mapper.ts` next
to the model:

```ts
import type { Ingredient } from '../../../core/models/ingredient.model';
import type { IngredientFormShape } from '../../../shared/forms/...';

export const ingredientFormMapper = {
  toEntity(form: IngredientFormShape): Ingredient { /* ... */ },
  fromEntity(row: Ingredient): IngredientFormShape { /* ... */ },
  empty(): IngredientFormShape { /* default for "Add new" */ },
};
```

### Required properties

1. **Pure** — no Angular DI, no service calls. Must be unit-testable
   without `TestBed`.
2. **Round-trip stable** — `fromEntity(toEntity(form))` must equal `form`
   for every valid form. Asserted in unit tests.
3. **Strict types** — no `any`. Use `satisfies` to ensure no extra fields
   leak.
4. **Explicit defaults** — `empty()` returns the canonical "blank form"
   shape so component constructors stay one-liner: `signal(mapper.empty())`.

## Why a mapper layer?

- Without it, components branch on `value ?? ''` for inputs, leak DB
  column names into templates, and re-implement the same conversions per
  field.
- With it, the form layer talks the form's language; the repository talks
  SQL's language. The mapper is the only place that knows both.
- Signal Forms (Phase B2+) work cleanly with strongly-typed value objects.
  Mappers make the form value shape exactly that — a value object.

## Test pattern

```ts
import { ingredientFormMapper as m } from './ingredient-form.mapper';

describe('ingredientFormMapper', () => {
  it('round-trips a fully populated entity', () => {
    const entity: Ingredient = { /* ... */ };
    expect(m.toEntity(m.fromEntity(entity))).toEqual(entity);
  });

  it('empty() returns valid IngredientFormShape', () => {
    const blank = m.empty();
    expect(blank.name).toBe('');
    expect(blank.units.length).toBeGreaterThan(0);
  });
});
```

See `docs/5-development/signal-forms-migration-plan.md` §2.2 for the
larger architectural rationale.

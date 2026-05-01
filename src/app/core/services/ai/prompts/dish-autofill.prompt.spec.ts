import {
  buildDishAutofillPrompt,
  dishAutofillGeminiSchema,
  dishAutofillResponseSchema,
  dishAutofillRowSchema,
  DISH_AUTOFILL_SYSTEM_INSTRUCTION,
} from './dish-autofill.prompt';

describe('dish-autofill.prompt — Zod flat row schema (rev 1.5)', () => {
  const validRow = {
    name: 'Bánh phở',
    gram_weight: 200,
    category: 'Ngũ cốc & Tinh bột',
    calories_per_100g: 110,
    protein_per_100g: 3.2,
    carbs_per_100g: 25,
    fat_per_100g: 0.2,
    fiber_per_100g: 0.5,
    confidence: 'high' as const,
  };

  it('parses OK row with full nutrition + category + confidence', () => {
    const result = dishAutofillRowSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  it('rejects row missing calories_per_100g', () => {
    const { calories_per_100g: _drop, ...rest } = validRow;
    const result = dishAutofillRowSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects row with unexpected field is_in_db (strict)', () => {
    const result = dishAutofillRowSchema.safeParse({ ...validRow, is_in_db: true });
    expect(result.success).toBe(false);
  });

  it('rejects row with unexpected field matched_ingredient_id (strict)', () => {
    const result = dishAutofillRowSchema.safeParse({
      ...validRow,
      matched_ingredient_id: '11111111-2222-4333-8444-555555555555',
    });
    expect(result.success).toBe(false);
  });

  it('rejects gram_weight = 0 (must be positive)', () => {
    const result = dishAutofillRowSchema.safeParse({ ...validRow, gram_weight: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects nutrition values out of range', () => {
    expect(dishAutofillRowSchema.safeParse({ ...validRow, calories_per_100g: 1500 }).success).toBe(
      false,
    );
    expect(dishAutofillRowSchema.safeParse({ ...validRow, protein_per_100g: 200 }).success).toBe(
      false,
    );
  });

  it('parses response wrapper { ingredients: [...] }', () => {
    const result = dishAutofillResponseSchema.safeParse({ ingredients: [validRow] });
    expect(result.success).toBe(true);
  });

  it('parses empty ingredients array (Q4-4b empty result)', () => {
    const result = dishAutofillResponseSchema.safeParse({ ingredients: [] });
    expect(result.success).toBe(true);
  });
});

describe('dish-autofill.prompt — buildDishAutofillPrompt (rev 1.5)', () => {
  it('includes the dish name verbatim', () => {
    const prompt = buildDishAutofillPrompt('Phở bò');
    expect(prompt).toContain('Phở bò');
  });

  it('does NOT contain DB ingredient hint list (rev 1.5 — app matches local)', () => {
    const prompt = buildDishAutofillPrompt('Phở bò');
    expect(prompt).not.toContain('DB nguyên liệu hiện có');
    expect(prompt).not.toContain('matched_ingredient_id');
    expect(prompt).not.toContain('is_in_db');
  });

  it('contains snake_case JSON schema field names matching Zod flat schema', () => {
    const prompt = buildDishAutofillPrompt('X');
    for (const f of [
      'gram_weight',
      'calories_per_100g',
      'protein_per_100g',
      'carbs_per_100g',
      'fat_per_100g',
      'fiber_per_100g',
      'confidence',
    ]) {
      expect(prompt).toContain(f);
    }
  });

  it('lists 11 INGREDIENT_CATEGORIES enum values for category', () => {
    const prompt = buildDishAutofillPrompt('X');
    expect(prompt).toContain('"Khác"');
    expect(prompt).toContain('"Ngũ cốc & Tinh bột"');
  });

  it('reminds RULE-DISH-TOTAL-04 invariant', () => {
    const prompt = buildDishAutofillPrompt('X');
    expect(prompt).toContain('RULE-DISH-TOTAL-04');
  });

  it('instructs canonical ingredient names without cooking state', () => {
    const prompt = buildDishAutofillPrompt('X');
    expect(prompt).toContain('app sẽ tự dò trùng');
  });

  it('takes only dishName parameter (no dbIngredients param)', () => {
    // Type-level check: should compile with just one arg.
    expect(buildDishAutofillPrompt.length).toBe(1);
  });

  it('produces a prompt under 2 KB (significantly smaller than rev 1.4)', () => {
    const prompt = buildDishAutofillPrompt('Phở bò');
    expect(prompt.length).toBeLessThan(2048);
  });
});

describe('dish-autofill.prompt — Gemini responseSchema (rev 1.5 flat)', () => {
  it('exposes flat OBJECT with `ingredients` array', () => {
    expect(dishAutofillGeminiSchema.type).toBe('OBJECT');
    expect(
      (dishAutofillGeminiSchema.properties as { ingredients: { type: string } }).ingredients.type,
    ).toBe('ARRAY');
  });

  it('marks ALL row fields as required (no nullable since flat schema)', () => {
    const items = (
      dishAutofillGeminiSchema.properties as {
        ingredients: { items: { required: readonly string[] } };
      }
    ).ingredients.items;
    expect([...items.required]).toEqual([
      'name',
      'gram_weight',
      'category',
      'calories_per_100g',
      'protein_per_100g',
      'carbs_per_100g',
      'fat_per_100g',
      'fiber_per_100g',
      'confidence',
    ]);
  });

  it('does NOT declare is_in_db / matched_ingredient_id fields', () => {
    const props = (
      dishAutofillGeminiSchema.properties as {
        ingredients: { items: { properties: Record<string, unknown> } };
      }
    ).ingredients.items.properties;
    expect(props['is_in_db']).toBeUndefined();
    expect(props['matched_ingredient_id']).toBeUndefined();
  });
});

describe('dish-autofill.prompt — system instruction', () => {
  it('forbids prose and markdown', () => {
    expect(DISH_AUTOFILL_SYSTEM_INSTRUCTION).toContain('JSON');
    expect(DISH_AUTOFILL_SYSTEM_INSTRUCTION).toContain('không thêm prose');
  });
});

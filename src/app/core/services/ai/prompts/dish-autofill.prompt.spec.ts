import {
  buildDishAutofillPrompt,
  dishAutofillGeminiSchema,
  dishAutofillResponseSchema,
  dishAutofillRowSchema,
  DISH_AUTOFILL_SYSTEM_INSTRUCTION,
} from './dish-autofill.prompt';

const VALID_UUID = '11111111-2222-4333-8444-555555555555';

describe('dish-autofill.prompt — Zod discriminatedUnion(is_in_db)', () => {
  it('parses OK row is_in_db=true with matched_ingredient_id', () => {
    const result = dishAutofillRowSchema.safeParse({
      name: 'Hành lá',
      gram_weight: 5,
      is_in_db: true,
      matched_ingredient_id: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it('parses OK row is_in_db=false with full nutrition + category + confidence', () => {
    const result = dishAutofillRowSchema.safeParse({
      name: 'Bánh phở',
      gram_weight: 200,
      is_in_db: false,
      category: 'Ngũ cốc & Tinh bột',
      calories_per_100g: 110,
      protein_per_100g: 3.2,
      carbs_per_100g: 25,
      fat_per_100g: 0.2,
      fiber_per_100g: 0.5,
      confidence: 'high',
    });
    expect(result.success).toBe(true);
  });

  it('rejects row is_in_db=false missing calories_per_100g', () => {
    const result = dishAutofillRowSchema.safeParse({
      name: 'X',
      gram_weight: 10,
      is_in_db: false,
      category: 'Khác',
      // calories_per_100g missing
      protein_per_100g: 0,
      carbs_per_100g: 0,
      fat_per_100g: 0,
      fiber_per_100g: 0,
      confidence: 'low',
    });
    expect(result.success).toBe(false);
  });

  it('rejects row is_in_db=true with extra field calories_per_100g (strict)', () => {
    const result = dishAutofillRowSchema.safeParse({
      name: 'Hành lá',
      gram_weight: 5,
      is_in_db: true,
      matched_ingredient_id: VALID_UUID,
      calories_per_100g: 30,
    });
    expect(result.success).toBe(false);
  });

  it('rejects gram_weight = 0 (must be positive)', () => {
    const result = dishAutofillRowSchema.safeParse({
      name: 'X',
      gram_weight: 0,
      is_in_db: true,
      matched_ingredient_id: VALID_UUID,
    });
    expect(result.success).toBe(false);
  });

  it('parses response wrapper { ingredients: [...] }', () => {
    const result = dishAutofillResponseSchema.safeParse({
      ingredients: [
        {
          name: 'Hành lá',
          gram_weight: 5,
          is_in_db: true,
          matched_ingredient_id: VALID_UUID,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('parses empty ingredients array (Q4-4b empty result)', () => {
    const result = dishAutofillResponseSchema.safeParse({ ingredients: [] });
    expect(result.success).toBe(true);
  });
});

describe('dish-autofill.prompt — buildDishAutofillPrompt', () => {
  it('includes the dish name verbatim', () => {
    const prompt = buildDishAutofillPrompt('Phở bò', []);
    expect(prompt).toContain('Phở bò');
  });

  it('lists DB ingredients as "id | name" lines', () => {
    const prompt = buildDishAutofillPrompt('Phở bò', [
      { id: 'aaa-111', name: 'Hành lá' },
      { id: 'bbb-222', name: 'Bánh phở' },
    ]);
    expect(prompt).toContain('aaa-111 | Hành lá');
    expect(prompt).toContain('bbb-222 | Bánh phở');
  });

  it('emits explicit empty-DB hint when dbIngredients is empty', () => {
    const prompt = buildDishAutofillPrompt('Phở bò', []);
    expect(prompt).toContain('chưa có nguyên liệu nào trong DB');
  });

  it('contains snake_case JSON schema field names matching Zod', () => {
    const prompt = buildDishAutofillPrompt('X', []);
    for (const f of [
      'gram_weight',
      'is_in_db',
      'matched_ingredient_id',
      'calories_per_100g',
      'protein_per_100g',
      'carbs_per_100g',
      'fat_per_100g',
      'fiber_per_100g',
    ]) {
      expect(prompt).toContain(f);
    }
  });

  it('lists 11 INGREDIENT_CATEGORIES enum values for is_in_db=false rows', () => {
    const prompt = buildDishAutofillPrompt('X', []);
    expect(prompt).toContain('"Khác"');
    expect(prompt).toContain('"Ngũ cốc & Tinh bột"');
  });

  it('reminds RULE-DISH-TOTAL-04 invariant', () => {
    const prompt = buildDishAutofillPrompt('X', []);
    expect(prompt).toContain('RULE-DISH-TOTAL-04');
  });
});

describe('dish-autofill.prompt — Gemini responseSchema', () => {
  it('exposes flat OBJECT with `ingredients` array', () => {
    expect(dishAutofillGeminiSchema.type).toBe('OBJECT');
    expect(
      (dishAutofillGeminiSchema.properties as { ingredients: { type: string } }).ingredients.type,
    ).toBe('ARRAY');
  });

  it('marks discriminator-dependent fields as nullable for FLAT schema (A7=A)', () => {
    const item = (
      dishAutofillGeminiSchema.properties as {
        ingredients: { items: { properties: Record<string, { nullable?: boolean }> } };
      }
    ).ingredients.items.properties;
    for (const f of [
      'matched_ingredient_id',
      'category',
      'calories_per_100g',
      'protein_per_100g',
      'carbs_per_100g',
      'fat_per_100g',
      'fiber_per_100g',
      'confidence',
    ]) {
      expect(item[f].nullable).toBe(true);
    }
  });

  it('keeps name + gram_weight + is_in_db as required (NOT nullable)', () => {
    const items = (
      dishAutofillGeminiSchema.properties as {
        ingredients: { items: { required: readonly string[] } };
      }
    ).ingredients.items;
    expect([...items.required]).toEqual(['name', 'gram_weight', 'is_in_db']);
  });
});

describe('dish-autofill.prompt — system instruction', () => {
  it('forbids prose and markdown', () => {
    expect(DISH_AUTOFILL_SYSTEM_INSTRUCTION).toContain('JSON');
    expect(DISH_AUTOFILL_SYSTEM_INSTRUCTION).toContain('không thêm prose');
  });
});

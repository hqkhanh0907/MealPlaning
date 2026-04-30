import {
  buildIngredientLookupPrompt,
  ingredientLookupGeminiSchema,
  ingredientLookupResponseSchema,
  INGREDIENT_LOOKUP_SYSTEM_INSTRUCTION,
} from './ingredient-lookup.prompt';
import { INGREDIENT_CATEGORIES } from '../../../models/management.constants';

describe('ingredient-lookup.prompt', () => {
  // -------------------------------------------------------------------------
  // buildIngredientLookupPrompt
  // -------------------------------------------------------------------------

  describe('buildIngredientLookupPrompt', () => {
    it('embeds the trimmed ingredient name verbatim', () => {
      const prompt = buildIngredientLookupPrompt('  ức gà luộc  ');
      expect(prompt).toContain('"ức gà luộc"');
      expect(prompt).not.toContain('  ức gà'); // no untrimmed leak
    });

    it('lists all 11 category enum values', () => {
      const prompt = buildIngredientLookupPrompt('cà chua');
      for (const cat of INGREDIENT_CATEGORIES) {
        expect(prompt).toContain(`"${cat}"`);
      }
    });

    it('mentions per-100g basis and forbids per-100ml', () => {
      const prompt = buildIngredientLookupPrompt('sữa tươi');
      expect(prompt).toContain('per 100 gram');
      expect(prompt).toContain('Không trả per 100ml');
    });

    it('explicitly forbids unit/density/conversion fields', () => {
      const prompt = buildIngredientLookupPrompt('dầu ăn');
      expect(prompt).toContain('KHÔNG trả unit/measurement/density/conversion');
    });

    it('contains all 3 confidence levels with descriptions', () => {
      const prompt = buildIngredientLookupPrompt('thịt');
      expect(prompt).toContain('"high"');
      expect(prompt).toContain('"medium"');
      expect(prompt).toContain('"low"');
    });

    it('exposes a non-empty system instruction', () => {
      expect(INGREDIENT_LOOKUP_SYSTEM_INSTRUCTION.length).toBeGreaterThan(20);
    });
  });

  // -------------------------------------------------------------------------
  // Gemini responseSchema (JSON-Schema subset)
  // -------------------------------------------------------------------------

  describe('ingredientLookupGeminiSchema', () => {
    it('marks all 9 fields as required', () => {
      expect(ingredientLookupGeminiSchema.required).toEqual([
        'name',
        'category',
        'calories',
        'protein',
        'carbs',
        'fat',
        'fiber',
        'confidence',
        'note',
      ]);
    });

    it('uses NUMBER for the 5 macros', () => {
      const props = ingredientLookupGeminiSchema.properties;
      expect(props.calories.type).toBe('NUMBER');
      expect(props.protein.type).toBe('NUMBER');
      expect(props.carbs.type).toBe('NUMBER');
      expect(props.fat.type).toBe('NUMBER');
      expect(props.fiber.type).toBe('NUMBER');
    });

    it('restricts confidence to high/medium/low', () => {
      expect(ingredientLookupGeminiSchema.properties.confidence.enum).toEqual([
        'high',
        'medium',
        'low',
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // Zod runtime schema
  // -------------------------------------------------------------------------

  describe('ingredientLookupResponseSchema (zod)', () => {
    const valid = {
      name: 'Ức gà luộc',
      category: 'Thịt',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      confidence: 'high' as const,
      note: 'Số liệu USDA, đã nấu chín',
    };

    it('parses a valid response', () => {
      const parsed = ingredientLookupResponseSchema.parse(valid);
      expect(parsed.name).toBe('Ức gà luộc');
    });

    it('defaults note to empty string when missing', () => {
      const { note: _omit, ...without } = valid;
      const parsed = ingredientLookupResponseSchema.parse(without);
      expect(parsed.note).toBe('');
    });

    it('rejects negative calories', () => {
      expect(() => ingredientLookupResponseSchema.parse({ ...valid, calories: -1 })).toThrow();
    });

    it('rejects calories above 900 (sanity ceiling)', () => {
      expect(() => ingredientLookupResponseSchema.parse({ ...valid, calories: 1500 })).toThrow();
    });

    it('rejects unknown confidence value', () => {
      expect(() =>
        ingredientLookupResponseSchema.parse({ ...valid, confidence: 'unsure' }),
      ).toThrow();
    });

    it('accepts non-enum category strings (fuzzy-map handled in service)', () => {
      // Decision #10: zod is permissive; NutritionAi normalizes downstream.
      const parsed = ingredientLookupResponseSchema.parse({
        ...valid,
        category: 'Ngũ cốc', // shorthand of "Ngũ cốc & Tinh bột"
      });
      expect(parsed.category).toBe('Ngũ cốc');
    });
  });
});

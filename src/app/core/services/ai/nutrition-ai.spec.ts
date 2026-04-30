import { TestBed } from '@angular/core/testing';

import { NutritionAi, mapCategory, normalizeIngredientName } from './nutrition-ai';
import { GeminiClient } from './gemini-client';
import type { IngredientLookupResponse } from './prompts/ingredient-lookup.prompt';

describe('NutritionAi', () => {
  // -------------------------------------------------------------------------
  // normalizeIngredientName (Decision #2)
  // -------------------------------------------------------------------------

  describe('normalizeIngredientName', () => {
    it('lowercases input', () => {
      expect(normalizeIngredientName('Ức Gà')).toBe('ức gà');
    });

    it('trims and collapses internal whitespace', () => {
      expect(normalizeIngredientName('  Ức   Gà  ')).toBe('ức gà');
    });

    it('preserves Vietnamese diacritics (does NOT fold)', () => {
      expect(normalizeIngredientName('Mì')).toBe('mì');
      expect(normalizeIngredientName('Mì')).not.toBe('mi');
    });

    it('treats two strings as duplicate when they normalize equal', () => {
      expect(normalizeIngredientName(' Ức Gà ')).toBe(normalizeIngredientName('ức gà'));
    });

    it('does NOT match prefix/substring (exact only)', () => {
      // "ức gà" vs "ức gà luộc" must NOT collide
      expect(normalizeIngredientName('Ức gà')).not.toBe(normalizeIngredientName('Ức gà luộc'));
    });
  });

  // -------------------------------------------------------------------------
  // mapCategory (Decision #10)
  // -------------------------------------------------------------------------

  describe('mapCategory', () => {
    it('exact match (case + diacritic insensitive)', () => {
      expect(mapCategory('Thịt')).toBe('Thịt');
      expect(mapCategory('thit')).toBe('Thịt');
      expect(mapCategory('THỊT')).toBe('Thịt');
    });

    it('substring shorthand maps to full enum value', () => {
      expect(mapCategory('Ngũ cốc')).toBe('Ngũ cốc & Tinh bột');
      expect(mapCategory('Nuoc cham')).toBe('Nước dùng & Nước chấm');
    });

    it('unknown category falls back to "Khác"', () => {
      expect(mapCategory('Thực phẩm chức năng')).toBe('Khác');
    });

    it('empty / whitespace falls back to "Khác"', () => {
      expect(mapCategory('')).toBe('Khác');
      expect(mapCategory('   ')).toBe('Khác');
    });

    it('handles "đ" diacritic correctly', () => {
      expect(mapCategory('dau & mo')).toBe('Dầu & Mỡ');
    });
  });

  // -------------------------------------------------------------------------
  // lookupIngredient — integration with mocked GeminiClient
  // -------------------------------------------------------------------------

  describe('lookupIngredient', () => {
    let geminiSpy: jasmine.SpyObj<GeminiClient>;
    let nutritionAi: NutritionAi;

    const validRaw: IngredientLookupResponse = {
      name: 'Ức gà luộc',
      category: 'Thịt',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      confidence: 'high',
    };

    beforeEach(() => {
      geminiSpy = jasmine.createSpyObj<GeminiClient>('GeminiClient', ['generateContent']);
      TestBed.configureTestingModule({
        providers: [NutritionAi, { provide: GeminiClient, useValue: geminiSpy }],
      });
      nutritionAi = TestBed.inject(NutritionAi);
    });

    it('forwards a structured prompt + ingredient_lookup feature to GeminiClient', async () => {
      geminiSpy.generateContent.and.resolveTo(validRaw);

      await nutritionAi.lookupIngredient('  ức gà luộc  ');

      expect(geminiSpy.generateContent).toHaveBeenCalledTimes(1);
      const args = geminiSpy.generateContent.calls.mostRecent().args;
      const [prompt, options] = args as [string, { feature: string }];
      expect(prompt).toContain('"ức gà luộc"');
      expect(options.feature).toBe('ingredient_lookup');
    });

    it('returns ready-to-prefill result for happy path', async () => {
      geminiSpy.generateContent.and.resolveTo(validRaw);

      const result = await nutritionAi.lookupIngredient('Ức gà luộc');

      expect(result.name).toBe('Ức gà luộc');
      expect(result.category).toBe('Thịt');
      expect(result.calories).toBe(165);
      expect(result.confidence).toBe('high');
      expect(result.raw).toBe(validRaw);
    });

    it('fuzzy-maps non-canonical category to enum', async () => {
      geminiSpy.generateContent.and.resolveTo({
        ...validRaw,
        name: 'Gạo trắng',
        category: 'Ngũ cốc', // shorthand → "Ngũ cốc & Tinh bột"
      });

      const result = await nutritionAi.lookupIngredient('gạo trắng');

      expect(result.category).toBe('Ngũ cốc & Tinh bột');
    });

    it('falls back to "Khác" when category is unmappable', async () => {
      geminiSpy.generateContent.and.resolveTo({
        ...validRaw,
        category: 'Thực phẩm chế biến sẵn',
      });

      const result = await nutritionAi.lookupIngredient('xúc xích');

      expect(result.category).toBe('Khác');
    });

    it('normalizes whitespace-noisy AI name without changing diacritics', async () => {
      geminiSpy.generateContent.and.resolveTo({
        ...validRaw,
        name: '  Ức   gà   luộc  ',
      });

      const result = await nutritionAi.lookupIngredient('ức gà');

      expect(result.name).toBe('Ức gà luộc');
    });

    it('propagates GeminiClient errors verbatim', async () => {
      const err = new Error('boom');
      geminiSpy.generateContent.and.rejectWith(err);

      await expectAsync(nutritionAi.lookupIngredient('cà chua')).toBeRejectedWith(err);
    });
  });
});

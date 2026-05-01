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

  // -------------------------------------------------------------------------
  // autofillDish — F-02 rev 1.5 (app-side fuzzy match, AI = content provider)
  // -------------------------------------------------------------------------

  describe('autofillDish', () => {
    let geminiSpy: jasmine.SpyObj<GeminiClient>;
    let nutritionAi: NutritionAi;

    const newRowResp = {
      name: 'Hành lá',
      gram_weight: 5,
      category: 'Rau củ',
      calories_per_100g: 32,
      protein_per_100g: 1.8,
      carbs_per_100g: 7.3,
      fat_per_100g: 0.2,
      fiber_per_100g: 2.6,
      confidence: 'high' as const,
    };

    beforeEach(() => {
      geminiSpy = jasmine.createSpyObj<GeminiClient>('GeminiClient', ['generateContent']);
      TestBed.configureTestingModule({
        providers: [NutritionAi, { provide: GeminiClient, useValue: geminiSpy }],
      });
      nutritionAi = TestBed.inject(NutritionAi);
    });

    it('does NOT inject DB ingredient list into the prompt (rev 1.5)', async () => {
      geminiSpy.generateContent.and.resolveTo({ ingredients: [newRowResp] });

      await nutritionAi.autofillDish('Phở bò', [
        { id: 'ing-aaa', name: 'Bánh phở' },
        { id: 'ing-bbb', name: 'Hành lá' },
      ]);

      const [prompt] = geminiSpy.generateContent.calls.mostRecent().args as [string, unknown];
      expect(prompt).not.toContain('ing-aaa');
      expect(prompt).not.toContain('ing-bbb');
      expect(prompt).not.toContain('DB nguyên liệu');
    });

    it('distance == 0 → kind="existing" (auto-link, dùng DB id + tên DB)', async () => {
      geminiSpy.generateContent.and.resolveTo({ ingredients: [newRowResp] });

      const result = await nutritionAi.autofillDish('Test', [
        { id: 'ing-hanh', name: 'Hành lá' }, // exact normalized match
      ]);

      expect(result.rows.length).toBe(1);
      const row = result.rows[0];
      expect(row.kind).toBe('existing');
      if (row.kind === 'existing') {
        expect(row.matchedIngredientId).toBe('ing-hanh');
        expect(row.name).toBe('Hành lá');
        expect(row.gramWeight).toBe(5);
      }
    });

    it('distance ∈ {1,2} → kind="fuzzyConfirm" (carry pendingNew nutrition)', async () => {
      geminiSpy.generateContent.and.resolveTo({ ingredients: [newRowResp] });

      // DB tên gần đúng: "Hanh la" vs "Hành lá" — distance 0 sau normalize → existing.
      // Cần candidate distance 1 thật: "Hành la" (thiếu dấu trên la nhưng "hanh la" → distance 1 với "hanh la")
      // Đơn giản: dùng "Hành lát" (Lev=1 với "hành lá").
      const result = await nutritionAi.autofillDish('Test', [{ id: 'ing-near', name: 'Hành lát' }]);

      const row = result.rows[0];
      expect(row.kind).toBe('fuzzyConfirm');
      if (row.kind === 'fuzzyConfirm') {
        expect(row.suggestedMatchId).toBe('ing-near');
        expect(row.distance).toBeGreaterThan(0);
        expect(row.distance).toBeLessThanOrEqual(2);
        expect(row.pendingNew.caloriesPer100g).toBe(32);
        expect(row.pendingNew.category).toBe('Rau củ');
      }
    });

    it('distance > 2 → kind="new" (full nutrition + mapped category)', async () => {
      geminiSpy.generateContent.and.resolveTo({ ingredients: [newRowResp] });

      const result = await nutritionAi.autofillDish('Test', [
        { id: 'ing-far', name: 'Bánh phở' }, // distance > 2
      ]);

      const row = result.rows[0];
      expect(row.kind).toBe('new');
      if (row.kind === 'new') {
        expect(row.name).toBe('Hành lá');
        expect(row.category).toBe('Rau củ');
        expect(row.caloriesPer100g).toBe(32);
        expect(row.proteinPer100g).toBe(1.8);
      }
    });

    it('empty DB → all rows are kind="new"', async () => {
      geminiSpy.generateContent.and.resolveTo({ ingredients: [newRowResp] });

      const result = await nutritionAi.autofillDish('Test', []);

      expect(result.rows[0].kind).toBe('new');
    });

    it('fuzzy-maps non-canonical category from AI', async () => {
      geminiSpy.generateContent.and.resolveTo({
        ingredients: [{ ...newRowResp, category: 'rau' }], // shorthand
      });

      const result = await nutritionAi.autofillDish('Test', []);

      const row = result.rows[0];
      if (row.kind === 'new') {
        expect(row.category).toBe('Rau củ');
      }
    });

    it('forwards dish_autofill feature flag to GeminiClient', async () => {
      geminiSpy.generateContent.and.resolveTo({ ingredients: [] });

      await nutritionAi.autofillDish('Phở bò', []);

      const [, options] = geminiSpy.generateContent.calls.mostRecent().args as [
        string,
        { feature: string },
      ];
      expect(options.feature).toBe('dish_autofill');
    });

    it('propagates GeminiClient errors verbatim', async () => {
      const err = new Error('quota exceeded');
      geminiSpy.generateContent.and.rejectWith(err);

      await expectAsync(nutritionAi.autofillDish('Phở bò', [])).toBeRejectedWith(err);
    });
  });
});

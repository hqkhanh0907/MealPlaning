/**
 * foodDictionary.test.ts
 * Unit tests for the static bilingual food dictionary.
 */

import { describe, it, expect } from 'vitest';
import { lookupFoodTranslation } from '../data/foodDictionary';

describe('lookupFoodTranslation', () => {
  describe('vi-en direction', () => {
    it('translates common ingredients from Vietnamese to English', () => {
      expect(lookupFoodTranslation('Ức gà', 'vi-en')).toBe('Chicken breast');
      expect(lookupFoodTranslation('Cá hồi', 'vi-en')).toBe('Salmon');
      expect(lookupFoodTranslation('Đậu phụ', 'vi-en')).toBe('Tofu');
      expect(lookupFoodTranslation('Trứng gà', 'vi-en')).toBe('Chicken egg');
      expect(lookupFoodTranslation('Bông cải xanh', 'vi-en')).toBe('Broccoli');
    });

    it('translates common dishes from Vietnamese to English', () => {
      expect(lookupFoodTranslation('Phở bò', 'vi-en')).toBe('Beef pho');
      expect(lookupFoodTranslation('Ức gà áp chảo', 'vi-en')).toBe('Pan-seared chicken breast');
      expect(lookupFoodTranslation('Trứng ốp la (2 quả)', 'vi-en')).toBe('Fried eggs (2)');
    });

    it('translates fruits', () => {
      expect(lookupFoodTranslation('Chuối', 'vi-en')).toBe('Banana');
      expect(lookupFoodTranslation('Xoài', 'vi-en')).toBe('Mango');
      expect(lookupFoodTranslation('Dưa hấu', 'vi-en')).toBe('Watermelon');
    });

    it('translates condiments', () => {
      expect(lookupFoodTranslation('Nước mắm', 'vi-en')).toBe('Fish sauce');
      expect(lookupFoodTranslation('Muối', 'vi-en')).toBe('Salt');
      expect(lookupFoodTranslation('Đường', 'vi-en')).toBe('Sugar');
    });
  });

  describe('en-vi direction', () => {
    it('translates common ingredients from English to Vietnamese', () => {
      expect(lookupFoodTranslation('Chicken breast', 'en-vi')).toBe('Ức gà');
      expect(lookupFoodTranslation('Salmon', 'en-vi')).toBe('Cá hồi');
      expect(lookupFoodTranslation('Tofu', 'en-vi')).toBe('Đậu phụ');
      expect(lookupFoodTranslation('Broccoli', 'en-vi')).toBe('Bông cải xanh');
    });

    it('translates common dishes from English to Vietnamese', () => {
      expect(lookupFoodTranslation('Beef pho', 'en-vi')).toBe('Phở bò');
      expect(lookupFoodTranslation('Pan-seared chicken breast', 'en-vi')).toBe('Ức gà áp chảo');
    });
  });

  describe('case insensitivity', () => {
    it('matches regardless of case', () => {
      expect(lookupFoodTranslation('ức gà', 'vi-en')).toBe('Chicken breast');
      expect(lookupFoodTranslation('ỨC GÀ', 'vi-en')).toBe('Chicken breast');
      expect(lookupFoodTranslation('chicken breast', 'en-vi')).toBe('Ức gà');
      expect(lookupFoodTranslation('SALMON', 'en-vi')).toBe('Cá hồi');
    });
  });

  describe('trimming', () => {
    it('trims whitespace from input', () => {
      expect(lookupFoodTranslation('  Cá hồi  ', 'vi-en')).toBe('Salmon');
      expect(lookupFoodTranslation('  Salmon  ', 'en-vi')).toBe('Cá hồi');
    });
  });

  describe('not found', () => {
    it('returns null for unknown terms', () => {
      expect(lookupFoodTranslation('XYZ_UNKNOWN', 'vi-en')).toBeNull();
      expect(lookupFoodTranslation('Something random', 'en-vi')).toBeNull();
    });

    it('returns null for empty input', () => {
      expect(lookupFoodTranslation('', 'vi-en')).toBeNull();
      expect(lookupFoodTranslation('   ', 'vi-en')).toBeNull();
    });
  });

  describe('synonyms and alternatives', () => {
    it('handles multiple Vietnamese names for the same item', () => {
      expect(lookupFoodTranslation('Đậu phụ', 'vi-en')).toBe('Tofu');
      expect(lookupFoodTranslation('Đậu hũ', 'vi-en')).toBe('Tofu');
      expect(lookupFoodTranslation('Tàu hũ', 'vi-en')).toBe('Tofu');
    });

    it('handles Vietnamese regional variants', () => {
      expect(lookupFoodTranslation('Dưa leo', 'vi-en')).toBe('Cucumber');
      expect(lookupFoodTranslation('Dưa chuột', 'vi-en')).toBe('Cucumber');
      expect(lookupFoodTranslation('Thịt heo', 'vi-en')).toBe('Pork');
      expect(lookupFoodTranslation('Thịt lợn', 'vi-en')).toBe('Pork');
    });
  });

  describe('coverage of all initial data', () => {
    it('covers all initial ingredients from initialData.ts', () => {
      const initialNames: Array<[string, string]> = [
        ['Ức gà', 'Chicken breast'],
        ['Trứng gà', 'Chicken egg'],
        ['Yến mạch', 'Oats'],
        ['Sữa chua Hy Lạp', 'Greek yogurt'],
        ['Khoai lang', 'Sweet potato'],
        ['Bông cải xanh', 'Broccoli'],
        ['Thịt bò nạc', 'Lean beef'],
        ['Gạo lứt', 'Brown rice'],
        ['Cá hồi', 'Salmon'],
        ['Hạt chia', 'Chia seeds'],
      ];

      for (const [vi, en] of initialNames) {
        expect(lookupFoodTranslation(vi, 'vi-en')).toBe(en);
        expect(lookupFoodTranslation(en, 'en-vi')).toBe(vi);
      }
    });

    it('covers all initial dishes from initialData.ts', () => {
      const initialDishNames: Array<[string, string]> = [
        ['Yến mạch sữa chua', 'Yogurt oatmeal'],
        ['Ức gà áp chảo', 'Pan-seared chicken breast'],
        ['Khoai lang luộc', 'Boiled sweet potato'],
        ['Bông cải xanh luộc', 'Boiled broccoli'],
        ['Trứng ốp la (2 quả)', 'Fried eggs (2)'],
      ];

      for (const [vi, en] of initialDishNames) {
        expect(lookupFoodTranslation(vi, 'vi-en')).toBe(en);
        expect(lookupFoodTranslation(en, 'en-vi')).toBe(vi);
      }
    });
  });
});

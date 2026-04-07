import { act, renderHook } from '@testing-library/react';

import { useIngredientSmartFill } from '../hooks/useIngredientSmartFill';
import { useIngredientStore } from '../store/ingredientStore';
import type { Ingredient } from '../types';

const CHICKEN: Ingredient = {
  id: 'ing-chicken',
  name: { vi: 'Ức gà', en: 'Chicken breast' },
  caloriesPer100: 165,
  proteinPer100: 31,
  carbsPer100: 0,
  fatPer100: 4,
  fiberPer100: 0,
  unit: { vi: 'g' },
};

const RICE: Ingredient = {
  id: 'ing-rice',
  name: { vi: 'Gạo lứt', en: 'Brown rice' },
  caloriesPer100: 111,
  proteinPer100: 3,
  carbsPer100: 23,
  fatPer100: 1,
  fiberPer100: 2,
  unit: { vi: 'g' },
};

describe('useIngredientSmartFill', () => {
  beforeEach(() => {
    useIngredientStore.setState({ ingredients: [CHICKEN, RICE] });
  });

  it('returns null for empty name', () => {
    const { result } = renderHook(() => useIngredientSmartFill());
    expect(result.current.findMatch('')).toBeNull();
    expect(result.current.findMatch('  ')).toBeNull();
  });

  it('finds exact match by Vietnamese name (case-insensitive)', () => {
    const { result } = renderHook(() => useIngredientSmartFill());
    const match = result.current.findMatch('Ức gà');
    expect(match).toBeTruthy();
    expect(match?.id).toBe('ing-chicken');
  });

  it('matches case-insensitively', () => {
    const { result } = renderHook(() => useIngredientSmartFill());
    expect(result.current.findMatch('ức gà')?.id).toBe('ing-chicken');
    expect(result.current.findMatch('GẠO LỨT')?.id).toBe('ing-rice');
  });

  it('trims whitespace before matching', () => {
    const { result } = renderHook(() => useIngredientSmartFill());
    expect(result.current.findMatch('  Ức gà  ')?.id).toBe('ing-chicken');
  });

  it('returns null for non-matching name', () => {
    const { result } = renderHook(() => useIngredientSmartFill());
    expect(result.current.findMatch('Thịt cừu')).toBeNull();
  });

  it('excludes ingredient by ID when excludeId is provided', () => {
    const { result } = renderHook(() => useIngredientSmartFill('ing-chicken'));
    expect(result.current.findMatch('Ức gà')).toBeNull();
    expect(result.current.findMatch('Gạo lứt')?.id).toBe('ing-rice');
  });

  it('sets isAutoFilled to true on successful match', () => {
    const { result } = renderHook(() => useIngredientSmartFill());
    expect(result.current.isAutoFilled).toBe(false);

    act(() => {
      result.current.findMatch('Ức gà');
    });

    expect(result.current.isAutoFilled).toBe(true);
  });

  it('does not set isAutoFilled on no match', () => {
    const { result } = renderHook(() => useIngredientSmartFill());

    act(() => {
      result.current.findMatch('Unknown ingredient');
    });

    expect(result.current.isAutoFilled).toBe(false);
  });

  it('updates autoFillTimestamp on match', () => {
    const { result } = renderHook(() => useIngredientSmartFill());
    expect(result.current.autoFillTimestamp).toBe(0);

    act(() => {
      result.current.findMatch('Ức gà');
    });

    expect(result.current.autoFillTimestamp).toBeGreaterThan(0);
  });

  it('allows manual reset of isAutoFilled via setAutoFilled', () => {
    const { result } = renderHook(() => useIngredientSmartFill());

    act(() => {
      result.current.findMatch('Ức gà');
    });
    expect(result.current.isAutoFilled).toBe(true);

    act(() => {
      result.current.setAutoFilled(false);
    });
    expect(result.current.isAutoFilled).toBe(false);
  });

  it('returns null when store is empty', () => {
    useIngredientStore.setState({ ingredients: [] });
    const { result } = renderHook(() => useIngredientSmartFill());
    expect(result.current.findMatch('Ức gà')).toBeNull();
  });
});

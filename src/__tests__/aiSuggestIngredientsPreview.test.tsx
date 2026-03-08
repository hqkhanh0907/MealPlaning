import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AISuggestIngredientsPreview } from '../components/modals/AISuggestIngredientsPreview';
import type { Ingredient, SuggestedDishIngredient } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));

const existingIngredients: Ingredient[] = [
  { id: 'i1', name: { vi: 'Bánh phở', en: 'Rice noodles' }, caloriesPer100: 356, proteinPer100: 3, carbsPer100: 80, fatPer100: 0.5, fiberPer100: 1, unit: { vi: 'g', en: 'g' } },
  { id: 'i2', name: { vi: 'Thịt bò', en: 'Beef' }, caloriesPer100: 250, proteinPer100: 26, carbsPer100: 0, fatPer100: 15, fiberPer100: 0, unit: { vi: 'g', en: 'g' } },
];

const suggestions: SuggestedDishIngredient[] = [
  { name: 'Bánh phở', amount: 250, unit: 'g', calories: 356, protein: 3, carbs: 80, fat: 0.5, fiber: 1 },
  { name: 'Thịt bò', amount: 150, unit: 'g', calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0 },
  { name: 'Giá đỗ', amount: 50, unit: 'g', calories: 31, protein: 3, carbs: 5, fat: 0.2, fiber: 2 },
];

describe('AISuggestIngredientsPreview', () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all suggestions with correct badges', () => {
    render(
      <AISuggestIngredientsPreview dishName="Phở bò" suggestions={suggestions} existingIngredients={existingIngredients} onConfirm={onConfirm} onClose={onClose} />
    );
    expect(screen.getByText(/Phở bò/)).toBeInTheDocument();
    expect(screen.getByTestId('ai-suggest-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('ai-suggest-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('ai-suggest-item-2')).toBeInTheDocument();
    // Existing badges for matched items
    expect(screen.getByTestId('ai-suggest-badge-existing-0')).toBeInTheDocument();
    expect(screen.getByTestId('ai-suggest-badge-existing-1')).toBeInTheDocument();
    // New badge for unmatched item
    expect(screen.getByTestId('ai-suggest-badge-new-2')).toBeInTheDocument();
  });

  it('shows empty state when suggestions array is empty', () => {
    render(
      <AISuggestIngredientsPreview dishName="Unknown" suggestions={[]} existingIngredients={existingIngredients} onConfirm={onConfirm} onClose={onClose} />
    );
    expect(screen.getByTestId('ai-suggest-empty')).toBeInTheDocument();
  });

  it('toggles checkbox when clicked', () => {
    render(
      <AISuggestIngredientsPreview dishName="Phở bò" suggestions={suggestions} existingIngredients={existingIngredients} onConfirm={onConfirm} onClose={onClose} />
    );
    const checkbox0 = screen.getByTestId('ai-suggest-checkbox-0');
    // Initially checked (emerald bg)
    expect(checkbox0.className).toContain('bg-emerald-500');
    // Click to uncheck
    fireEvent.click(checkbox0);
    expect(checkbox0.className).not.toContain('bg-emerald-500');
    // Click again to re-check
    fireEvent.click(checkbox0);
    expect(checkbox0.className).toContain('bg-emerald-500');
  });

  it('allows editing amount for an item', () => {
    render(
      <AISuggestIngredientsPreview dishName="Phở bò" suggestions={suggestions} existingIngredients={existingIngredients} onConfirm={onConfirm} onClose={onClose} />
    );
    const amountInput = screen.getByTestId('ai-suggest-amount-1');
    expect((amountInput as HTMLInputElement).value).toBe('150');
    fireEvent.change(amountInput, { target: { value: '200' } });
    expect((amountInput as HTMLInputElement).value).toBe('200');
  });

  it('calls onConfirm with only checked items and custom amounts', () => {
    render(
      <AISuggestIngredientsPreview dishName="Phở bò" suggestions={suggestions} existingIngredients={existingIngredients} onConfirm={onConfirm} onClose={onClose} />
    );
    // Uncheck item 2 (Giá đỗ)
    fireEvent.click(screen.getByTestId('ai-suggest-checkbox-2'));
    // Change amount of item 1
    fireEvent.change(screen.getByTestId('ai-suggest-amount-1'), { target: { value: '200' } });
    // Confirm
    fireEvent.click(screen.getByTestId('btn-ai-suggest-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    const confirmed = onConfirm.mock.calls[0][0];
    expect(confirmed).toHaveLength(2);
    expect(confirmed[0].suggestion.name).toBe('Bánh phở');
    expect(confirmed[0].matchedIngredient).not.toBeNull();
    expect(confirmed[1].suggestion.name).toBe('Thịt bò');
    expect(confirmed[1].amount).toBe(200);
    expect(confirmed[1].matchedIngredient).not.toBeNull();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <AISuggestIngredientsPreview dishName="Phở bò" suggestions={suggestions} existingIngredients={existingIngredients} onConfirm={onConfirm} onClose={onClose} />
    );
    fireEvent.click(screen.getByTestId('btn-ai-suggest-cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    render(
      <AISuggestIngredientsPreview dishName="Phở bò" suggestions={suggestions} existingIngredients={existingIngredients} onConfirm={onConfirm} onClose={onClose} />
    );
    fireEvent.click(screen.getByTestId('btn-ai-suggest-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables confirm button when no items are checked', () => {
    render(
      <AISuggestIngredientsPreview dishName="Phở bò" suggestions={suggestions} existingIngredients={existingIngredients} onConfirm={onConfirm} onClose={onClose} />
    );
    // Uncheck all 3
    fireEvent.click(screen.getByTestId('ai-suggest-checkbox-0'));
    fireEvent.click(screen.getByTestId('ai-suggest-checkbox-1'));
    fireEvent.click(screen.getByTestId('ai-suggest-checkbox-2'));
    const confirmBtn = screen.getByTestId('btn-ai-suggest-confirm');
    expect(confirmBtn).toBeDisabled();
  });

  it('shows nutrition info for each item', () => {
    render(
      <AISuggestIngredientsPreview dishName="Phở bò" suggestions={suggestions} existingIngredients={existingIngredients} onConfirm={onConfirm} onClose={onClose} />
    );
    expect(screen.getByText(/356cal/)).toBeInTheDocument();
    expect(screen.getByText(/250cal/)).toBeInTheDocument();
    expect(screen.getByText(/31cal/)).toBeInTheDocument();
  });

  it('handles amount with invalid value gracefully on confirm', () => {
    render(
      <AISuggestIngredientsPreview dishName="Phở bò" suggestions={suggestions} existingIngredients={existingIngredients} onConfirm={onConfirm} onClose={onClose} />
    );
    // Set invalid amount
    fireEvent.change(screen.getByTestId('ai-suggest-amount-0'), { target: { value: '' } });
    // Uncheck items 1 and 2 so only item 0 is confirmed
    fireEvent.click(screen.getByTestId('ai-suggest-checkbox-1'));
    fireEvent.click(screen.getByTestId('ai-suggest-checkbox-2'));
    fireEvent.click(screen.getByTestId('btn-ai-suggest-confirm'));
    const confirmed = onConfirm.mock.calls[0][0];
    // Should fallback to the original suggestion amount
    expect(confirmed[0].amount).toBe(250);
  });

  it('calls onClose when empty state cancel is clicked', () => {
    render(
      <AISuggestIngredientsPreview dishName="Unknown" suggestions={[]} existingIngredients={existingIngredients} onConfirm={onConfirm} onClose={onClose} />
    );
    // The cancel button in empty state
    const buttons = screen.getAllByRole('button');
    // Last button should be the cancel
    const lastButton = buttons.at(-1);
    if (lastButton) fireEvent.click(lastButton);
    expect(onClose).toHaveBeenCalled();
  });
});

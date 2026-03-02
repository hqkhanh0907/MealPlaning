import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanningModal } from '../components/modals/PlanningModal';
import type { Dish, Ingredient } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));

const ingredients: Ingredient[] = [
  { id: 'i1', name: 'Ức gà', caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0, unit: 'g' },
  { id: 'i2', name: 'Cơm trắng', caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4, unit: 'g' },
];

const dishes: Dish[] = [
  { id: 'd1', name: 'Gà nướng', ingredients: [{ ingredientId: 'i1', amount: 200 }], tags: ['lunch', 'dinner'] },
  { id: 'd2', name: 'Cơm gà', ingredients: [{ ingredientId: 'i1', amount: 100 }, { ingredientId: 'i2', amount: 200 }], tags: ['lunch'] },
  { id: 'd3', name: 'Cháo gà', ingredients: [{ ingredientId: 'i1', amount: 50 }], tags: ['breakfast'] },
];

describe('PlanningModal', () => {
  const defaultProps = {
    planningType: 'lunch' as const,
    dishes,
    ingredients,
    currentDishIds: ['d1'],
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    onBack: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders title with meal type', () => {
    render(<PlanningModal {...defaultProps} />);
    expect(screen.getByText(/Chọn món cho Bữa Trưa/)).toBeInTheDocument();
  });

  it('filters dishes by planning type tags', () => {
    render(<PlanningModal {...defaultProps} />);
    // lunch dishes: d1 (Gà nướng) and d2 (Cơm gà)
    expect(screen.getByText('Gà nướng')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    // breakfast only dish should NOT be shown
    expect(screen.queryByText('Cháo gà')).not.toBeInTheDocument();
  });

  it('shows pre-selected dishes from currentDishIds', () => {
    render(<PlanningModal {...defaultProps} currentDishIds={['d1']} />);
    // Text "Đã chọn:" and "1 món" are split across elements – use container textContent
    const footer = screen.getByText(/Xác nhận/).closest('div')!.parentElement!;
    expect(footer.textContent).toContain('1 món');
  });

  it('toggles dish selection on click', () => {
    render(<PlanningModal {...defaultProps} currentDishIds={[]} />);
    fireEvent.click(screen.getByText('Gà nướng'));
    const footer = screen.getByText(/Xác nhận/).closest('div')!.parentElement!;
    expect(footer.textContent).toContain('1 món');
    // Toggle off
    fireEvent.click(screen.getByText('Gà nướng'));
    expect(footer.textContent).toContain('0 món');
  });

  it('calls onConfirm with selected dish ids', () => {
    render(<PlanningModal {...defaultProps} currentDishIds={['d1']} />);
    fireEvent.click(screen.getByText(/Xác nhận/));
    expect(defaultProps.onConfirm).toHaveBeenCalledWith(expect.arrayContaining(['d1']));
  });

  it('calls onBack when back button is clicked', () => {
    render(<PlanningModal {...defaultProps} />);
    // Back button is the first button (ChevronRight rotated)
    const buttons = screen.getAllByRole('button');
    // The back button is the one before the title
    const backBtn = buttons.find(b => b.querySelector('.rotate-180'));
    if (backBtn) fireEvent.click(backBtn);
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    render(<PlanningModal {...defaultProps} />);
    const closeBtn = screen.getAllByRole('button').find(b => b.querySelector('.lucide-x'));
    if (closeBtn) fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('filters dishes by search query', () => {
    render(<PlanningModal {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Tìm kiếm món ăn...');
    fireEvent.change(searchInput, { target: { value: 'Cơm' } });
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    expect(screen.queryByText('Gà nướng')).not.toBeInTheDocument();
  });

  it('shows empty state when no dishes match tag', () => {
    render(<PlanningModal {...defaultProps} dishes={[]} />);
    expect(screen.getByText(/Chưa có món ăn phù hợp/)).toBeInTheDocument();
  });

  it('shows selected nutrition summary', () => {
    render(<PlanningModal {...defaultProps} currentDishIds={['d1']} />);
    // d1 = 200g chicken: 330 kcal, 62g protein — appears in card and footer
    const matches = screen.getAllByText(/330/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('changes sort order', () => {
    render(<PlanningModal {...defaultProps} currentDishIds={[]} />);
    const select = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(select, { target: { value: 'name-desc' } });
    // Should still show both dishes, just different order
    expect(screen.getByText('Gà nướng')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
  });

  it('sorts dishes by calories ascending', () => {
    render(<PlanningModal {...defaultProps} currentDishIds={[]} />);
    const select = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(select, { target: { value: 'cal-asc' } });
    // d1=330 kcal < d2=425 kcal → d1 first
    const dishCards = screen.getAllByText(/kcal/);
    const firstCalMatch = dishCards[0].textContent;
    expect(firstCalMatch).toContain('330');
  });

  it('sorts dishes by calories descending', () => {
    render(<PlanningModal {...defaultProps} currentDishIds={[]} />);
    const select = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(select, { target: { value: 'cal-desc' } });
    // d2=425 kcal > d1=330 kcal → d2 first
    const dishCards = screen.getAllByText(/kcal/);
    const firstCalMatch = dishCards[0].textContent;
    expect(firstCalMatch).toContain('425');
  });

  it('sorts dishes by protein ascending', () => {
    render(<PlanningModal {...defaultProps} currentDishIds={[]} />);
    const select = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(select, { target: { value: 'pro-asc' } });
    // d2=36.4g < d1=62g → d2 first
    const dishNames = screen.getAllByText(/gà/i);
    expect(dishNames[0].textContent).toContain('Cơm gà');
  });

  it('sorts dishes by protein descending', () => {
    render(<PlanningModal {...defaultProps} currentDishIds={[]} />);
    const select = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(select, { target: { value: 'pro-desc' } });
    // d1=62g > d2=36.4g → d1 first
    const dishNames = screen.getAllByText(/gà/i);
    expect(dishNames[0].textContent).toContain('Gà nướng');
  });

  it('calls onConfirm with empty array when no dishes selected', () => {
    render(<PlanningModal {...defaultProps} currentDishIds={[]} />);
    fireEvent.click(screen.getByText(/Xác nhận/));
    expect(defaultProps.onConfirm).toHaveBeenCalledWith([]);
  });

  it('shows accurate nutrition summary for multiple selected dishes', () => {
    render(<PlanningModal {...defaultProps} currentDishIds={['d1', 'd2']} />);
    // d1: 330 kcal, 62g pro + d2: 425 kcal, 36.4g pro = 755 kcal, 98.4g pro
    const footer = screen.getByText(/Xác nhận/).closest('div')!.parentElement!;
    expect(footer.textContent).toContain('2 món');
    // Check total calories 755 appears somewhere
    const calMatches = screen.getAllByText(/755/);
    expect(calMatches.length).toBeGreaterThan(0);
  });

  it('shows search empty state when no matches found', () => {
    render(<PlanningModal {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Tìm kiếm món ăn...');
    fireEvent.change(searchInput, { target: { value: 'không tồn tại xyz' } });
    // No dish should match
    expect(screen.queryByText('Gà nướng')).not.toBeInTheDocument();
    expect(screen.queryByText('Cơm gà')).not.toBeInTheDocument();
  });

  it('combines search filter with sort order', () => {
    render(<PlanningModal {...defaultProps} currentDishIds={[]} />);
    // Search for "gà" → both dishes match
    const searchInput = screen.getByPlaceholderText('Tìm kiếm món ăn...');
    fireEvent.change(searchInput, { target: { value: 'gà' } });
    expect(screen.getByText('Gà nướng')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    // Sort by cal-desc
    const select = screen.getByDisplayValue('Tên (A-Z)');
    fireEvent.change(select, { target: { value: 'cal-desc' } });
    // Both still visible with different order
    expect(screen.getByText('Gà nướng')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
  });
});

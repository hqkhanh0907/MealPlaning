import { fireEvent, render, screen } from '@testing-library/react';

import { FilterBottomSheet } from '../components/shared/FilterBottomSheet';
import type { FilterConfig } from '../types';

vi.mock('../hooks/useModalBackHandler', () => ({ useModalBackHandler: vi.fn() }));

describe('FilterBottomSheet', () => {
  const defaultConfig: FilterConfig = { sortBy: 'name-asc' };
  const defaultProps = {
    config: defaultConfig,
    onChange: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders sort chips with correct active state', () => {
    render(<FilterBottomSheet {...defaultProps} />);
    const chips = screen
      .getAllByRole('button')
      .filter(
        b => b.textContent?.includes('Tên') || b.textContent?.includes('Calo') || b.textContent?.includes('Protein'),
      );
    const activeChips = chips.filter(b => b.className.includes('bg-primary'));
    expect(activeChips).toHaveLength(1);
    expect(activeChips[0].textContent).toContain('Tên (A-Z)');
  });

  it('clicking a sort chip updates selection', () => {
    render(<FilterBottomSheet {...defaultProps} />);
    const calDescChip = screen.getByText('Calo (Cao → Thấp)');
    fireEvent.click(calDescChip);
    expect(calDescChip.className).toContain('bg-primary');
    const nameAscChip = screen.getByText('Tên (A-Z)');
    expect(nameAscChip.className).not.toContain('bg-primary');
  });

  it('renders quick filter tags', () => {
    render(<FilterBottomSheet {...defaultProps} />);
    expect(screen.getByText('< 300 kcal')).toBeInTheDocument();
    expect(screen.getByText('< 500 kcal')).toBeInTheDocument();
    expect(screen.getByText('Protein cao (≥20g)')).toBeInTheDocument();
  });

  it('toggling maxCalories filter works', () => {
    render(<FilterBottomSheet {...defaultProps} />);
    const btn300 = screen.getByText('< 300 kcal');
    expect(btn300.className).not.toContain('bg-primary');
    fireEvent.click(btn300);
    expect(btn300.className).toContain('bg-primary');
    fireEvent.click(btn300);
    expect(btn300.className).not.toContain('bg-primary');
  });

  it('toggling minProtein filter works', () => {
    render(<FilterBottomSheet {...defaultProps} />);
    const btnProtein = screen.getByText('Protein cao (≥20g)');
    expect(btnProtein.className).not.toContain('bg-primary');
    fireEvent.click(btnProtein);
    expect(btnProtein.className).toContain('bg-primary');
    fireEvent.click(btnProtein);
    expect(btnProtein.className).not.toContain('bg-primary');
  });

  it('selecting one calorie filter deselects the other', () => {
    render(<FilterBottomSheet {...defaultProps} />);
    const btn300 = screen.getByText('< 300 kcal');
    const btn500 = screen.getByText('< 500 kcal');
    fireEvent.click(btn300);
    expect(btn300.className).toContain('bg-primary');
    fireEvent.click(btn500);
    expect(btn500.className).toContain('bg-primary');
    expect(btn300.className).not.toContain('bg-primary');
  });

  it('reset button clears all filters', () => {
    render(<FilterBottomSheet {...defaultProps} config={{ sortBy: 'cal-desc', maxCalories: 300, minProtein: 20 }} />);
    const calDescChip = screen.getByText('Calo (Cao → Thấp)');
    expect(calDescChip.className).toContain('bg-primary');

    fireEvent.click(screen.getByTestId('filter-reset-btn'));

    const nameAscChip = screen.getByText('Tên (A-Z)');
    expect(nameAscChip.className).toContain('bg-primary');
    expect(calDescChip.className).not.toContain('bg-primary');
    expect(screen.getByText('< 300 kcal').className).not.toContain('bg-primary');
    expect(screen.getByText('Protein cao (≥20g)').className).not.toContain('bg-primary');
  });

  it('apply button calls onChange with current config and closes', () => {
    render(<FilterBottomSheet {...defaultProps} />);
    fireEvent.click(screen.getByText('Calo (Cao → Thấp)'));
    fireEvent.click(screen.getByText('< 300 kcal'));
    fireEvent.click(screen.getByTestId('filter-apply-btn'));

    expect(defaultProps.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'cal-desc', maxCalories: 300 }),
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders with data-testid on root', () => {
    render(<FilterBottomSheet {...defaultProps} />);
    expect(screen.getByTestId('filter-bottom-sheet')).toBeInTheDocument();
  });
});

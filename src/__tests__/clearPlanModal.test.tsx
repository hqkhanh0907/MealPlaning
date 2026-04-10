import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ClearPlanModal } from '../components/modals/ClearPlanModal';
import type { DayPlan, MealType } from '../types';

const originalMatchMedia = globalThis.matchMedia;

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

vi.mock('../services/backNavigationService', () => ({
  pushBackEntry: vi.fn(),
  removeTopBackEntry: vi.fn(),
}));

const makePlan = (date: string, breakfast: string[] = [], lunch: string[] = [], dinner: string[] = []): DayPlan => ({
  date,
  breakfastDishIds: breakfast,
  lunchDishIds: lunch,
  dinnerDishIds: dinner,
});

describe('ClearPlanModal', () => {
  const selectedDate = '2024-01-15';
  const dayPlans: DayPlan[] = [
    makePlan('2024-01-15', ['d1'], ['d2'], ['d3']),
    makePlan('2024-01-16', ['d4'], [], ['d5']),
    makePlan('2024-01-17', [], ['d6'], []),
  ];

  let onClear: ReturnType<typeof vi.fn<(scope: 'month' | 'week' | 'day', meals?: MealType[]) => void>>;
  let onClose: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    onClear = vi.fn<(scope: 'month' | 'week' | 'day', meals?: MealType[]) => void>();
    onClose = vi.fn<() => void>();
    vi.clearAllMocks();
    vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => undefined);
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  });

  const renderModal = (plans: DayPlan[] = dayPlans) =>
    render(<ClearPlanModal dayPlans={plans} selectedDate={selectedDate} onClear={onClear} onClose={onClose} />);

  it('renders alertdialog semantics and shared close button', () => {
    renderModal();

    const dialog = screen.getByRole('alertdialog', { name: 'Xóa kế hoạch' });
    expect(dialog).toHaveAttribute('aria-describedby');
    expect(screen.getByText('Chọn phạm vi thời gian muốn xóa').id).toBe(dialog.getAttribute('aria-describedby'));
    expect(screen.getByTestId('btn-close-clear-plan')).toHaveAttribute('aria-label', 'Đóng hộp thoại');
  });

  it('maps backdrop, escape, and close button dismissals only to onClose', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByTestId('btn-close-clear-plan'));
    await user.click(screen.getByLabelText('Đóng'));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(3);
    expect(onClear).not.toHaveBeenCalled();
  });

  it('keeps at least one meal filter selected', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByTestId('meal-toggle-breakfast'));
    await user.click(screen.getByTestId('meal-toggle-lunch'));
    await user.click(screen.getByTestId('meal-toggle-dinner'));
    await user.click(screen.getByTestId('btn-clear-scope-day'));

    expect(onClear).toHaveBeenCalledWith('day', ['dinner']);
  });

  it('prevents disabled scopes from being actionable', async () => {
    const user = userEvent.setup();
    renderModal([makePlan('2024-01-15'), makePlan('2024-01-16')]);

    const dayButton = screen.getByTestId('btn-clear-scope-day');
    expect(dayButton).toBeDisabled();
    expect(dayButton).toHaveAttribute('aria-disabled', 'true');

    await user.click(dayButton);
    expect(onClear).not.toHaveBeenCalled();
  });

  it('passes scoped meal filters only when subset selected', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByTestId('meal-toggle-breakfast'));
    await user.click(screen.getByTestId('btn-clear-scope-week'));

    expect(onClear).toHaveBeenCalledWith('week', ['lunch', 'dinner']);
  });
});

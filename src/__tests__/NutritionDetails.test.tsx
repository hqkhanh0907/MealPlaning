import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'calendar.nutritionDetailsHeader': 'Chi tiết theo bữa',
        'calendar.nutritionDetailsTotalLabel': 'Tổng',
        'calendar.nutritionDetailsNoMeals': 'Chưa có bữa ăn',
        'calendar.nutritionDetailsGoalCta': 'Chỉnh mục tiêu',
        'calendar.nutritionDetailsSwitch': 'Xem bữa ăn',
        'meal.breakfastFull': 'Bữa Sáng',
        'meal.lunchFull': 'Bữa Trưa',
        'meal.dinnerFull': 'Bữa Tối',
        'common.protein': 'Protein',
      };
      return map[key] ?? key;
    },
  }),
}));

import { NutritionDetails } from '../components/schedule/NutritionDetails';
import type { DayNutritionSummary } from '../types';

const EMPTY_SLOT = { dishIds: [], calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };

function makeDayNutrition(
  overrides?: Partial<Record<'breakfast' | 'lunch' | 'dinner', Partial<DayNutritionSummary['breakfast']>>>,
): DayNutritionSummary {
  return {
    breakfast: { ...EMPTY_SLOT, ...overrides?.breakfast },
    lunch: { ...EMPTY_SLOT, ...overrides?.lunch },
    dinner: { ...EMPTY_SLOT, ...overrides?.dinner },
  };
}

function makeProps(overrides: Partial<Parameters<typeof NutritionDetails>[0]> = {}) {
  return {
    dayNutrition: makeDayNutrition({
      breakfast: { dishIds: ['d1'], calories: 487, protein: 38, fat: 15, carbs: 67, fiber: 5 },
      lunch: { dishIds: ['d2', 'd3'], calories: 510, protein: 70, fat: 12, carbs: 40, fiber: 8 },
      dinner: { dishIds: ['d4'], calories: 330, protein: 62, fat: 15, carbs: 18, fiber: 3 },
    }),
    targetCalories: 2091,
    targetProtein: 170,
    isSetup: false,
    onSwitchToMeals: vi.fn(),
    onEditGoal: vi.fn(),
    ...overrides,
  };
}

describe('NutritionDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders collapsed by default — only header visible', () => {
    render(<NutritionDetails {...makeProps()} />);
    expect(screen.getByTestId('nutrition-details-header')).toBeInTheDocument();
    expect(screen.getByText('Chi tiết theo bữa')).toBeInTheDocument();
    expect(screen.queryByTestId('nutrition-details-content')).not.toBeInTheDocument();
  });

  it('expands on header click — shows per-meal table', async () => {
    const user = userEvent.setup();
    render(<NutritionDetails {...makeProps()} />);

    await user.click(screen.getByTestId('nutrition-details-header'));

    expect(screen.getByTestId('nutrition-details-content')).toBeInTheDocument();
    expect(screen.getByTestId('per-meal-table')).toBeInTheDocument();
  });

  it('collapses on second header click', async () => {
    const user = userEvent.setup();
    render(<NutritionDetails {...makeProps()} />);

    await user.click(screen.getByTestId('nutrition-details-header'));
    expect(screen.getByTestId('nutrition-details-content')).toBeInTheDocument();

    await user.click(screen.getByTestId('nutrition-details-header'));
    expect(screen.queryByTestId('nutrition-details-content')).not.toBeInTheDocument();
  });

  it('renders per-meal rows with correct data and meal names', async () => {
    const user = userEvent.setup();
    render(<NutritionDetails {...makeProps()} />);
    await user.click(screen.getByTestId('nutrition-details-header'));

    const breakfastRow = screen.getByTestId('meal-row-breakfast');
    expect(breakfastRow).toHaveTextContent('Bữa Sáng');
    expect(breakfastRow).toHaveTextContent('487');
    expect(breakfastRow).toHaveTextContent('38g');
    expect(breakfastRow).toHaveTextContent('15g');
    expect(breakfastRow).toHaveTextContent('67g');

    const lunchRow = screen.getByTestId('meal-row-lunch');
    expect(lunchRow).toHaveTextContent('Bữa Trưa');
    expect(lunchRow).toHaveTextContent('510');

    const dinnerRow = screen.getByTestId('meal-row-dinner');
    expect(dinnerRow).toHaveTextContent('Bữa Tối');
    expect(dinnerRow).toHaveTextContent('330');
  });

  it('renders total row with summed values', async () => {
    const user = userEvent.setup();
    render(<NutritionDetails {...makeProps()} />);
    await user.click(screen.getByTestId('nutrition-details-header'));

    const totalRow = screen.getByTestId('meal-row-total');
    expect(totalRow).toHaveTextContent('Tổng');
    expect(totalRow).toHaveTextContent('1327');
    expect(totalRow).toHaveTextContent('170g');
    expect(totalRow).toHaveTextContent('42g');
    expect(totalRow).toHaveTextContent('125g');
  });

  it('shows success tip when protein >= target', async () => {
    const user = userEvent.setup();
    const props = makeProps({ targetProtein: 150 });
    render(<NutritionDetails {...props} />);
    await user.click(screen.getByTestId('nutrition-details-header'));

    expect(screen.getByTestId('tip-success')).toBeInTheDocument();
    expect(screen.getByTestId('tip-success')).toHaveTextContent('Protein');
    expect(screen.getByTestId('tip-success')).toHaveTextContent('150g');
  });

  it('shows warning tip when calorie deficit > 300kcal', async () => {
    const user = userEvent.setup();
    render(<NutritionDetails {...makeProps()} />);
    await user.click(screen.getByTestId('nutrition-details-header'));

    // deficit = 2091 - 1327 = 764
    expect(screen.getByTestId('tip-warning')).toBeInTheDocument();
    expect(screen.getByTestId('tip-warning')).toHaveTextContent('-764');
  });

  it('shows no tips when neither condition is met', async () => {
    const user = userEvent.setup();
    const props = makeProps({
      targetCalories: 1400,
      targetProtein: 170,
    });
    render(<NutritionDetails {...props} />);
    await user.click(screen.getByTestId('nutrition-details-header'));

    // deficit = 1400 - 1327 = 73 (< 300) and protein = 170 = target
    // protein is exactly equal so proteinMet = true => success tip shows
    // but deficit is NOT > 300 => no warning tip
    expect(screen.getByTestId('tip-success')).toBeInTheDocument();
    expect(screen.queryByTestId('tip-warning')).not.toBeInTheDocument();
  });

  it('shows no tips section when neither condition is met', async () => {
    const user = userEvent.setup();
    const props = makeProps({
      targetCalories: 1400,
      targetProtein: 200,
    });
    render(<NutritionDetails {...props} />);
    await user.click(screen.getByTestId('nutrition-details-header'));

    // deficit = 1400 - 1327 = 73 (< 300) and protein 170 < 200 => no tips
    expect(screen.queryByTestId('tips-section')).not.toBeInTheDocument();
  });

  it('returns null when isSetup=true', () => {
    const { container } = render(<NutritionDetails {...makeProps({ isSetup: true })} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows empty state when all meals have no dishes', async () => {
    const user = userEvent.setup();
    const props = makeProps({ dayNutrition: makeDayNutrition() });
    render(<NutritionDetails {...props} />);
    await user.click(screen.getByTestId('nutrition-details-header'));

    expect(screen.getByTestId('nutrition-details-empty')).toBeInTheDocument();
    expect(screen.getByText('Chưa có bữa ăn')).toBeInTheDocument();
    expect(screen.getByTestId('btn-switch-meals')).toHaveTextContent('Xem bữa ăn');
  });

  it('calls onEditGoal when CTA is clicked', async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<NutritionDetails {...props} />);
    await user.click(screen.getByTestId('nutrition-details-header'));
    await user.click(screen.getByTestId('btn-edit-goal'));

    expect(props.onEditGoal).toHaveBeenCalledOnce();
  });

  it('calls onSwitchToMeals when empty-state CTA is clicked', async () => {
    const user = userEvent.setup();
    const props = makeProps({ dayNutrition: makeDayNutrition() });
    render(<NutritionDetails {...props} />);
    await user.click(screen.getByTestId('nutrition-details-header'));
    await user.click(screen.getByTestId('btn-switch-meals'));

    expect(props.onSwitchToMeals).toHaveBeenCalledOnce();
  });

  it('has correct aria-expanded attribute on header', async () => {
    const user = userEvent.setup();
    render(<NutritionDetails {...makeProps()} />);

    const header = screen.getByTestId('nutrition-details-header');
    expect(header).toHaveAttribute('aria-expanded', 'false');

    await user.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });
});

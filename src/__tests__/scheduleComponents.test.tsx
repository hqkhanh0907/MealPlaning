import { fireEvent, render, screen } from '@testing-library/react';

import { MacroChart } from '../components/schedule/MacroChart';
import { MealActionBar } from '../components/schedule/MealActionBar';
import { MealSlot } from '../components/schedule/MealSlot';
import { MealsSubTab } from '../components/schedule/MealsSubTab';
import { MiniNutritionBar } from '../components/schedule/MiniNutritionBar';
import { NutritionSubTab } from '../components/schedule/NutritionSubTab';
import type { DayNutritionSummary, Dish, SlotInfo } from '../types';

vi.mock('@/components/ui/dropdown-menu', () => {
  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-root">{children}</div>,
    DropdownMenuTrigger: ({ children, ...props }: Record<string, unknown>) => (
      <button {...props}>{children as React.ReactNode}</button>
    ),
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="more-actions-menu" role="menu">
        {children}
      </div>
    ),
    DropdownMenuItem: ({
      children,
      onClick,
      disabled,
      variant,
      ...props
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      variant?: string;
      [key: string]: unknown;
    }) => (
      <button
        role="menuitem"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        data-variant={variant}
        {...props}
      >
        {children}
      </button>
    ),
    DropdownMenuSeparator: () => <hr data-testid="menu-separator" role="separator" />,
  };
});

vi.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => ({ isDark: false, theme: 'light', cycleTheme: vi.fn(), setTheme: vi.fn() }),
}));

vi.mock('@/components/nutrition/EnergyBalanceCard', () => ({
  EnergyBalanceCard: (props: Record<string, unknown>) => (
    <div
      data-testid="energy-balance-card"
      data-calories-in={props.caloriesIn}
      data-calories-out={props.caloriesOut}
      data-target={props.targetCalories}
      data-protein-current={props.proteinCurrent}
      data-protein-target={props.proteinTarget}
    />
  ),
}));

const makeSlot = (dishIds: string[], cal = 0, pro = 0): SlotInfo => ({
  dishIds,
  calories: cal,
  protein: pro,
  carbs: 0,
  fat: 0,
  fiber: 0,
});

const makeFullSlot = (dishIds: string[], cal: number, pro: number, carbs: number, fat: number): SlotInfo => ({
  dishIds,
  calories: cal,
  protein: pro,
  carbs,
  fat,
  fiber: 0,
});

const emptyNutrition: DayNutritionSummary = {
  breakfast: makeSlot([]),
  lunch: makeSlot([]),
  dinner: makeSlot([]),
};

const filledNutrition: DayNutritionSummary = {
  breakfast: makeSlot(['d1'], 400, 20),
  lunch: makeSlot(['d2'], 600, 30),
  dinner: makeSlot(['d3'], 500, 25),
};

const dishes: Dish[] = [
  { id: 'd1', name: { vi: 'Trứng chiên', en: 'Fried Egg' }, ingredients: [], tags: ['breakfast'] },
  { id: 'd2', name: { vi: 'Cơm gà', en: 'Chicken Rice' }, ingredients: [], tags: ['lunch'] },
  { id: 'd3', name: { vi: 'Canh rau', en: 'Veggie Soup' }, ingredients: [], tags: ['dinner'] },
  { id: 'd4', name: { vi: 'Phở bò', en: 'Beef Pho' }, ingredients: [], tags: ['breakfast'] },
  { id: 'd5', name: { vi: 'Bún chả', en: 'Bun Cha' }, ingredients: [], tags: ['lunch'] },
];

// ─── MealSlot ────────────────────────────────────────────────────────
describe('MealSlot', () => {
  it('renders empty state with "Chưa có món" and add button', () => {
    const onEdit = vi.fn();
    render(<MealSlot type="breakfast" slot={makeSlot([])} dishes={dishes} onEdit={onEdit} />);
    expect(screen.getByText('Chưa có món')).toBeInTheDocument();
    const addBtn = screen.getByLabelText(/Thêm món cho/);
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('renders filled state with dish names', () => {
    render(<MealSlot type="breakfast" slot={makeSlot(['d1'], 400, 20)} dishes={dishes} onEdit={vi.fn()} />);
    expect(screen.getByText('Trứng chiên')).toBeInTheDocument();
    expect(screen.getByText('400 kcal')).toBeInTheDocument();
    expect(screen.getByText(/P 20g/)).toBeInTheDocument();
  });

  it('renders "+N thêm" when more than MAX_VISIBLE dishes', () => {
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot(['d1', 'd2', 'd3', 'd4', 'd5'], 1500, 70)}
        dishes={dishes}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText('Trứng chiên')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    expect(screen.getByText('+1 thêm')).toBeInTheDocument();
  });

  it('shows all dishes without "more" when count <= MAX_VISIBLE (4)', () => {
    render(
      <MealSlot type="lunch" slot={makeSlot(['d1', 'd2', 'd3', 'd4'], 1200, 60)} dishes={dishes} onEdit={vi.fn()} />,
    );
    expect(screen.getByText('Trứng chiên')).toBeInTheDocument();
    expect(screen.getByText('Phở bò')).toBeInTheDocument();
    expect(screen.queryByText(/thêm/)).not.toBeInTheDocument();
  });

  it('fires onEdit when edit button clicked on filled card', () => {
    const onEdit = vi.fn();
    render(<MealSlot type="lunch" slot={makeSlot(['d2'], 600, 30)} dishes={dishes} onEdit={onEdit} />);
    const editBtn = screen.getByLabelText('Chỉnh sửa Trưa');
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('renders correct meal icons for each type', () => {
    const { rerender } = render(<MealSlot type="breakfast" slot={makeSlot([])} dishes={[]} onEdit={vi.fn()} />);
    expect(screen.getByText('Sáng')).toBeInTheDocument();

    rerender(<MealSlot type="lunch" slot={makeSlot([])} dishes={[]} onEdit={vi.fn()} />);
    expect(screen.getByText('Trưa')).toBeInTheDocument();

    rerender(<MealSlot type="dinner" slot={makeSlot([])} dishes={[]} onEdit={vi.fn()} />);
    expect(screen.getByText('Tối')).toBeInTheDocument();
  });

  it('filters out dishes not found in the dishes array', () => {
    render(
      <MealSlot type="breakfast" slot={makeSlot(['d1', 'nonexistent'], 400, 20)} dishes={dishes} onEdit={vi.fn()} />,
    );
    expect(screen.getByText('Trứng chiên')).toBeInTheDocument();
    expect(screen.queryByText('nonexistent')).not.toBeInTheDocument();
  });

  it('renders serving stepper when onUpdateServings is provided', () => {
    const onUpdate = vi.fn();
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot(['d1'], 400, 20)}
        dishes={dishes}
        servings={{}}
        onEdit={vi.fn()}
        onUpdateServings={onUpdate}
      />,
    );
    expect(screen.getByTestId('serving-count-d1')).toHaveTextContent('1x');
    expect(screen.getByTestId('btn-serving-plus-d1')).toBeInTheDocument();
    expect(screen.getByTestId('btn-serving-minus-d1')).toBeInTheDocument();
  });

  it('serving buttons meet WCAG touch target minimum', () => {
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot(['d1'], 400, 20)}
        dishes={dishes}
        onEdit={vi.fn()}
        servings={{}}
        onUpdateServings={vi.fn()}
      />,
    );
    const plusBtn = screen.getByTestId('btn-serving-plus-d1');
    const minusBtn = screen.getByTestId('btn-serving-minus-d1');
    expect(plusBtn.className).toContain('min-h-11');
    expect(plusBtn.className).toContain('min-w-11');
    expect(minusBtn.className).toContain('min-h-11');
    expect(minusBtn.className).toContain('min-w-11');
  });

  it('does not render serving stepper when onUpdateServings is absent', () => {
    render(<MealSlot type="breakfast" slot={makeSlot(['d1'], 400, 20)} dishes={dishes} onEdit={vi.fn()} />);
    expect(screen.queryByTestId('serving-count-d1')).not.toBeInTheDocument();
  });

  it('displays correct serving count from servings prop', () => {
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot(['d1'], 400, 20)}
        dishes={dishes}
        servings={{ d1: 3 }}
        onEdit={vi.fn()}
        onUpdateServings={vi.fn()}
      />,
    );
    expect(screen.getByTestId('serving-count-d1')).toHaveTextContent('3x');
  });

  it('calls onUpdateServings with incremented value on plus click', () => {
    const onUpdate = vi.fn();
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot(['d1'], 400, 20)}
        dishes={dishes}
        servings={{ d1: 2 }}
        onEdit={vi.fn()}
        onUpdateServings={onUpdate}
      />,
    );
    fireEvent.click(screen.getByTestId('btn-serving-plus-d1'));
    expect(onUpdate).toHaveBeenCalledWith('d1', 3);
  });

  it('calls onUpdateServings with decremented value on minus click', () => {
    const onUpdate = vi.fn();
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot(['d1'], 400, 20)}
        dishes={dishes}
        servings={{ d1: 3 }}
        onEdit={vi.fn()}
        onUpdateServings={onUpdate}
      />,
    );
    fireEvent.click(screen.getByTestId('btn-serving-minus-d1'));
    expect(onUpdate).toHaveBeenCalledWith('d1', 2);
  });

  it('disables minus button when serving is 1', () => {
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot(['d1'], 400, 20)}
        dishes={dishes}
        servings={{ d1: 1 }}
        onEdit={vi.fn()}
        onUpdateServings={vi.fn()}
      />,
    );
    expect(screen.getByTestId('btn-serving-minus-d1')).toBeDisabled();
  });

  it('disables plus button when serving is 10', () => {
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot(['d1'], 400, 20)}
        dishes={dishes}
        servings={{ d1: 10 }}
        onEdit={vi.fn()}
        onUpdateServings={vi.fn()}
      />,
    );
    expect(screen.getByTestId('btn-serving-plus-d1')).toBeDisabled();
  });

  it('does not call onUpdateServings when minus is clicked at 1 (disabled)', () => {
    const onUpdate = vi.fn();
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot(['d1'], 400, 20)}
        dishes={dishes}
        servings={{ d1: 1 }}
        onEdit={vi.fn()}
        onUpdateServings={onUpdate}
      />,
    );
    fireEvent.click(screen.getByTestId('btn-serving-minus-d1'));
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('does not call onUpdateServings when plus is clicked at 10 (disabled)', () => {
    const onUpdate = vi.fn();
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot(['d1'], 400, 20)}
        dishes={dishes}
        servings={{ d1: 10 }}
        onEdit={vi.fn()}
        onUpdateServings={onUpdate}
      />,
    );
    fireEvent.click(screen.getByTestId('btn-serving-plus-d1'));
    expect(onUpdate).not.toHaveBeenCalled();
  });
});

// ─── MealActionBar ────────────────────────────────────────────────────
describe('MealActionBar', () => {
  const baseProps = {
    allEmpty: false,
    isSuggesting: false,
    onOpenTypeSelection: vi.fn(),
    onSuggestMealPlan: vi.fn(),
    onOpenClearPlan: vi.fn(),
    onCopyPlan: vi.fn(),
    onSaveTemplate: vi.fn(),
    onOpenTemplateManager: vi.fn(),
    onOpenGrocery: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  // AC1: allEmpty=true → exactly 1 button, no overflow
  it('renders only primary button when allEmpty is true', () => {
    render(<MealActionBar allEmpty={true} onOpenTypeSelection={vi.fn()} />);
    expect(screen.getByTestId('btn-plan-meal-section')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-more-actions')).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renders full-width primary button with correct text when allEmpty', () => {
    render(<MealActionBar allEmpty={true} onOpenTypeSelection={vi.fn()} />);
    const btn = screen.getByTestId('btn-plan-meal-section');
    expect(btn).toHaveTextContent('Thêm món ăn');
  });

  // AC2: allEmpty=false → primary + overflow toggle
  it('renders primary button and overflow toggle when allEmpty is false', () => {
    render(<MealActionBar {...baseProps} />);
    expect(screen.getByTestId('btn-plan-meal-section')).toBeInTheDocument();
    expect(screen.getByTestId('btn-more-actions')).toBeInTheDocument();
  });

  it('calls onOpenTypeSelection when primary button clicked', () => {
    render(<MealActionBar {...baseProps} />);
    fireEvent.click(screen.getByTestId('btn-plan-meal-section'));
    expect(baseProps.onOpenTypeSelection).toHaveBeenCalledTimes(1);
  });

  // AC3: Menu items ordered per BR-3.2-19, destructive last
  it('renders menu items in correct order (BR-3.2-19)', () => {
    render(<MealActionBar {...baseProps} />);
    const items = screen.getAllByRole('menuitem');
    const testIds = items.map(item => item.getAttribute('data-testid'));
    expect(testIds).toEqual([
      'btn-ai-suggest',
      'btn-open-grocery',
      'btn-copy-plan',
      'btn-save-template',
      'btn-template-manager',
      'btn-clear-plan',
    ]);
  });

  it('renders separator between non-destructive and destructive items', () => {
    render(<MealActionBar {...baseProps} />);
    expect(screen.getByTestId('menu-separator')).toBeInTheDocument();
  });

  it('renders clear plan item with destructive variant', () => {
    render(<MealActionBar {...baseProps} />);
    const clearBtn = screen.getByTestId('btn-clear-plan');
    expect(clearBtn).toHaveAttribute('data-variant', 'destructive');
  });

  // AC4: Optional handlers omitted → items not rendered
  it('does not render AI suggest when onSuggestMealPlan not provided', () => {
    const { onSuggestMealPlan: _removed, ...props } = baseProps;
    render(<MealActionBar {...props} />);
    expect(screen.queryByTestId('btn-ai-suggest')).not.toBeInTheDocument();
  });

  it('does not render grocery when onOpenGrocery not provided', () => {
    const { onOpenGrocery: _removed, ...props } = baseProps;
    render(<MealActionBar {...props} />);
    expect(screen.queryByTestId('btn-open-grocery')).not.toBeInTheDocument();
  });

  it('does not render copy when onCopyPlan not provided', () => {
    const { onCopyPlan: _removed, ...props } = baseProps;
    render(<MealActionBar {...props} />);
    expect(screen.queryByTestId('btn-copy-plan')).not.toBeInTheDocument();
  });

  it('does not render save template when onSaveTemplate not provided', () => {
    const { onSaveTemplate: _removed, ...props } = baseProps;
    render(<MealActionBar {...props} />);
    expect(screen.queryByTestId('btn-save-template')).not.toBeInTheDocument();
  });

  it('does not render template manager when onOpenTemplateManager not provided', () => {
    const { onOpenTemplateManager: _removed, ...props } = baseProps;
    render(<MealActionBar {...props} />);
    expect(screen.queryByTestId('btn-template-manager')).not.toBeInTheDocument();
  });

  it('does not render clear plan when onOpenClearPlan not provided', () => {
    const { onOpenClearPlan: _removed, ...props } = baseProps;
    render(<MealActionBar {...props} />);
    expect(screen.queryByTestId('btn-clear-plan')).not.toBeInTheDocument();
  });

  it('hides overflow when no optional handlers provided', () => {
    render(<MealActionBar allEmpty={false} onOpenTypeSelection={vi.fn()} />);
    expect(screen.queryByTestId('btn-more-actions')).not.toBeInTheDocument();
  });

  it('does not render separator when only destructive item present', () => {
    render(<MealActionBar allEmpty={false} onOpenTypeSelection={vi.fn()} onOpenClearPlan={vi.fn()} />);
    expect(screen.queryByTestId('menu-separator')).not.toBeInTheDocument();
    expect(screen.getByTestId('btn-clear-plan')).toBeInTheDocument();
  });

  it('does not render separator when only non-destructive items present', () => {
    render(<MealActionBar allEmpty={false} onOpenTypeSelection={vi.fn()} onSuggestMealPlan={vi.fn()} />);
    expect(screen.queryByTestId('menu-separator')).not.toBeInTheDocument();
    expect(screen.getByTestId('btn-ai-suggest')).toBeInTheDocument();
  });

  // AC5: AI loading → spinner + disabled + text
  it('shows spinner and loading text when AI is suggesting', () => {
    render(<MealActionBar {...baseProps} isSuggesting={true} />);
    const aiItem = screen.getByTestId('btn-ai-suggest');
    expect(aiItem).toBeDisabled();
    expect(aiItem).toHaveTextContent('Đang gợi ý...');
    const sparklesIcon = aiItem.querySelector('.animate-spin');
    expect(sparklesIcon).toBeInTheDocument();
  });

  it('shows normal AI text when not suggesting', () => {
    render(<MealActionBar {...baseProps} isSuggesting={false} />);
    const aiItem = screen.getByTestId('btn-ai-suggest');
    expect(aiItem).not.toBeDisabled();
    expect(aiItem).toHaveTextContent('Gợi ý AI');
    expect(aiItem.querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  // Handler calls
  it('calls onSuggestMealPlan when AI item clicked', () => {
    render(<MealActionBar {...baseProps} />);
    fireEvent.click(screen.getByTestId('btn-ai-suggest'));
    expect(baseProps.onSuggestMealPlan).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenGrocery when grocery item clicked', () => {
    render(<MealActionBar {...baseProps} />);
    fireEvent.click(screen.getByTestId('btn-open-grocery'));
    expect(baseProps.onOpenGrocery).toHaveBeenCalledTimes(1);
  });

  it('calls onCopyPlan when copy item clicked', () => {
    render(<MealActionBar {...baseProps} />);
    fireEvent.click(screen.getByTestId('btn-copy-plan'));
    expect(baseProps.onCopyPlan).toHaveBeenCalledTimes(1);
  });

  it('calls onSaveTemplate when save item clicked', () => {
    render(<MealActionBar {...baseProps} />);
    fireEvent.click(screen.getByTestId('btn-save-template'));
    expect(baseProps.onSaveTemplate).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenTemplateManager when template item clicked', () => {
    render(<MealActionBar {...baseProps} />);
    fireEvent.click(screen.getByTestId('btn-template-manager'));
    expect(baseProps.onOpenTemplateManager).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenClearPlan when clear item clicked', () => {
    render(<MealActionBar {...baseProps} />);
    fireEvent.click(screen.getByTestId('btn-clear-plan'));
    expect(baseProps.onOpenClearPlan).toHaveBeenCalledTimes(1);
  });

  it('does not call onSuggestMealPlan when AI item clicked while suggesting', () => {
    render(<MealActionBar {...baseProps} isSuggesting={true} />);
    fireEvent.click(screen.getByTestId('btn-ai-suggest'));
    expect(baseProps.onSuggestMealPlan).not.toHaveBeenCalled();
  });

  // Overflow trigger accessibility
  it('has aria-label on overflow trigger', () => {
    render(<MealActionBar {...baseProps} />);
    const trigger = screen.getByTestId('btn-more-actions');
    expect(trigger).toHaveAttribute('aria-label', 'Thao tác khác');
  });

  // isSuggesting defaults to false
  it('defaults isSuggesting to false when not provided', () => {
    render(<MealActionBar allEmpty={false} onOpenTypeSelection={vi.fn()} onSuggestMealPlan={vi.fn()} />);
    const aiItem = screen.getByTestId('btn-ai-suggest');
    expect(aiItem).not.toBeDisabled();
    expect(aiItem).toHaveTextContent('Gợi ý AI');
  });
});

// ─── MiniNutritionBar ────────────────────────────────────────────────
describe('MiniNutritionBar', () => {
  it('renders calorie and protein totals', () => {
    const onSwitch = vi.fn();
    render(
      <MiniNutritionBar
        dayNutrition={filledNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={onSwitch}
      />,
    );
    // 400 + 600 + 500 = 1500
    expect(screen.getByText('1500/2000 kcal')).toBeInTheDocument();
    // 20 + 30 + 25 = 75
    expect(screen.getByText('75/140g Pro')).toBeInTheDocument();
  });

  it('fires onSwitchToNutrition when clicked', () => {
    const onSwitch = vi.fn();
    render(
      <MiniNutritionBar
        dayNutrition={filledNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={onSwitch}
      />,
    );
    fireEvent.click(screen.getByTestId('mini-nutrition-bar'));
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });

  it('renders progress bars', () => {
    render(
      <MiniNutritionBar
        dayNutrition={filledNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.getByTestId('mini-cal-bar')).toBeInTheDocument();
    expect(screen.getByTestId('mini-pro-bar')).toBeInTheDocument();
  });

  it('shows zero totals for empty nutrition', () => {
    render(
      <MiniNutritionBar
        dayNutrition={emptyNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.getByText('0/2000 kcal')).toBeInTheDocument();
    expect(screen.getByText('0/140g Pro')).toBeInTheDocument();
  });

  it('shows remaining calories in mini bar', () => {
    render(
      <MiniNutritionBar
        dayNutrition={filledNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.getByTestId('mini-remaining-cal')).toHaveTextContent('500');
    expect(screen.getByTestId('mini-remaining-pro')).toHaveTextContent('65');
  });

  it('shows over text when exceeding targets in mini bar', () => {
    const overNutrition: typeof filledNutrition = {
      breakfast: { dishIds: ['d1'], calories: 1000, protein: 80, carbs: 50, fat: 15, fiber: 5 },
      lunch: { dishIds: ['d2'], calories: 800, protein: 60, carbs: 70, fat: 20, fiber: 8 },
      dinner: { dishIds: ['d3'], calories: 500, protein: 40, carbs: 60, fat: 18, fiber: 6 },
    };
    render(
      <MiniNutritionBar
        dayNutrition={overNutrition}
        targetCalories={2000}
        targetProtein={140}
        onSwitchToNutrition={vi.fn()}
      />,
    );
    expect(screen.getByTestId('mini-remaining-cal')).toHaveTextContent('300');
    expect(screen.getByTestId('mini-remaining-pro')).toHaveTextContent('40');
  });
});

// ─── MealsSubTab ─────────────────────────────────────────────────────
describe('MealsSubTab', () => {
  const baseProps = {
    dayNutrition: filledNutrition,
    dishes,
    targetCalories: 2000,
    targetProtein: 140,
    isSuggesting: false,
    onPlanMeal: vi.fn(),
    onOpenTypeSelection: vi.fn(),
    onSuggestMealPlan: vi.fn(),
    onOpenClearPlan: vi.fn(),
    onCopyPlan: vi.fn(),
    onSaveTemplate: vi.fn(),
    onOpenTemplateManager: vi.fn(),
    onSwitchToNutrition: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders meals-subtab with action bar and meal slots', () => {
    render(<MealsSubTab {...baseProps} />);
    expect(screen.getByTestId('meals-subtab')).toBeInTheDocument();
    expect(screen.getByTestId('meal-action-bar')).toBeInTheDocument();
    expect(screen.getByTestId('meal-slot-breakfast')).toBeInTheDocument();
    expect(screen.getByTestId('meal-slot-lunch')).toBeInTheDocument();
    expect(screen.getByTestId('meal-slot-dinner')).toBeInTheDocument();
  });

  it('shows empty state tip when all meals are empty', () => {
    render(<MealsSubTab {...baseProps} dayNutrition={emptyNutrition} />);
    expect(screen.getByText('Ngày này chưa có kế hoạch ăn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lên kế hoạch ngày này' })).toBeInTheDocument();
  });

  it('shows missing meals message when partially filled', () => {
    const partial: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 400, 20),
      lunch: makeSlot([]),
      dinner: makeSlot([]),
    };
    render(<MealsSubTab {...baseProps} dayNutrition={partial} />);
    expect(screen.getByText('Ngày này vẫn còn bữa chưa lên kế hoạch')).toBeInTheDocument();
    expect(screen.getByText(/Thiếu: bữa trưa, bữa tối/)).toBeInTheDocument();
  });

  it('shows plan complete message when all meals filled', () => {
    render(<MealsSubTab {...baseProps} />);
    expect(screen.getByText('Kế hoạch ăn trong ngày đã đủ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xem dinh dưỡng' })).toBeInTheDocument();
  });

  it('shows meal progress indicator when not all empty', () => {
    render(<MealsSubTab {...baseProps} />);
    const progress = screen.getByTestId('meal-progress');
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveTextContent('3/3');
  });

  it('shows partial progress when some meals filled', () => {
    const partial: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 400, 20),
      lunch: makeSlot([]),
      dinner: makeSlot([]),
    };
    render(<MealsSubTab {...baseProps} dayNutrition={partial} />);
    const progress = screen.getByTestId('meal-progress');
    expect(progress).toHaveTextContent('1/3');
  });

  it('does not show meal progress when all meals are empty', () => {
    render(<MealsSubTab {...baseProps} dayNutrition={emptyNutrition} />);
    expect(screen.queryByTestId('meal-progress')).not.toBeInTheDocument();
  });

  it('integrates MiniNutritionBar', () => {
    render(<MealsSubTab {...baseProps} />);
    expect(screen.getByTestId('mini-nutrition-bar')).toBeInTheDocument();
  });

  it('calls onPlanMeal with correct type when meal slot edit is clicked', () => {
    render(<MealsSubTab {...baseProps} />);
    const editButtons = screen.getAllByLabelText(/Chỉnh sửa/);
    fireEvent.click(editButtons[0]);
    expect(baseProps.onPlanMeal).toHaveBeenCalledWith('breakfast');
  });

  it('shows missing only lunch when breakfast and dinner are filled', () => {
    const partial: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 400, 20),
      lunch: makeSlot([]),
      dinner: makeSlot(['d3'], 500, 25),
    };
    render(<MealsSubTab {...baseProps} dayNutrition={partial} />);
    expect(screen.getByText(/Thiếu: bữa trưa/)).toBeInTheDocument();
  });

  it('renders recent dishes section when recentDishIds and onQuickAdd provided with empty slots', () => {
    const partial: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 400, 20),
      lunch: makeSlot([]),
      dinner: makeSlot([]),
    };
    const onQuickAdd = vi.fn();
    render(<MealsSubTab {...baseProps} dayNutrition={partial} recentDishIds={['d2', 'd4']} onQuickAdd={onQuickAdd} />);
    expect(screen.getByTestId('recent-dishes-section')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    expect(screen.getByText('Phở bò')).toBeInTheDocument();
  });

  it('does not render recent dishes when no empty slots', () => {
    const onQuickAdd = vi.fn();
    render(<MealsSubTab {...baseProps} recentDishIds={['d2']} onQuickAdd={onQuickAdd} />);
    expect(screen.queryByTestId('recent-dishes-section')).not.toBeInTheDocument();
  });

  it('does not render recent dishes when recentDishIds is empty', () => {
    const onQuickAdd = vi.fn();
    const partial: DayNutritionSummary = { breakfast: makeSlot([]), lunch: makeSlot([]), dinner: makeSlot([]) };
    render(<MealsSubTab {...baseProps} dayNutrition={partial} recentDishIds={[]} onQuickAdd={onQuickAdd} />);
    expect(screen.queryByTestId('recent-dishes-section')).not.toBeInTheDocument();
  });

  it('quick-adds directly when only one empty slot', () => {
    const partial: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 400, 20),
      lunch: makeSlot(['d2'], 600, 30),
      dinner: makeSlot([]),
    };
    const onQuickAdd = vi.fn();
    render(<MealsSubTab {...baseProps} dayNutrition={partial} recentDishIds={['d4']} onQuickAdd={onQuickAdd} />);
    fireEvent.click(screen.getByTestId('btn-recent-d4'));
    expect(onQuickAdd).toHaveBeenCalledWith('dinner', 'd4');
  });

  it('shows meal type dropdown when multiple empty slots', () => {
    const partial: DayNutritionSummary = {
      breakfast: makeSlot([]),
      lunch: makeSlot([]),
      dinner: makeSlot(['d3'], 500, 25),
    };
    const onQuickAdd = vi.fn();
    render(<MealsSubTab {...baseProps} dayNutrition={partial} recentDishIds={['d4']} onQuickAdd={onQuickAdd} />);
    fireEvent.click(screen.getByTestId('btn-recent-d4'));
    expect(screen.getByTestId('btn-quick-add-breakfast-d4')).toBeInTheDocument();
    expect(screen.getByTestId('btn-quick-add-lunch-d4')).toBeInTheDocument();
  });

  it('calls onQuickAdd when meal type selected from dropdown', () => {
    const partial: DayNutritionSummary = {
      breakfast: makeSlot([]),
      lunch: makeSlot([]),
      dinner: makeSlot(['d3'], 500, 25),
    };
    const onQuickAdd = vi.fn();
    render(<MealsSubTab {...baseProps} dayNutrition={partial} recentDishIds={['d4']} onQuickAdd={onQuickAdd} />);
    fireEvent.click(screen.getByTestId('btn-recent-d4'));
    fireEvent.click(screen.getByTestId('btn-quick-add-lunch-d4'));
    expect(onQuickAdd).toHaveBeenCalledWith('lunch', 'd4');
  });

  it('toggles dropdown off when clicking same dish again', () => {
    const partial: DayNutritionSummary = {
      breakfast: makeSlot([]),
      lunch: makeSlot([]),
      dinner: makeSlot(['d3'], 500, 25),
    };
    const onQuickAdd = vi.fn();
    render(<MealsSubTab {...baseProps} dayNutrition={partial} recentDishIds={['d4']} onQuickAdd={onQuickAdd} />);
    fireEvent.click(screen.getByTestId('btn-recent-d4'));
    expect(screen.getByTestId('btn-quick-add-breakfast-d4')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-recent-d4'));
    expect(screen.queryByTestId('btn-quick-add-breakfast-d4')).not.toBeInTheDocument();
  });

  it('does not render recent dishes when onQuickAdd not provided', () => {
    const partial: DayNutritionSummary = { breakfast: makeSlot([]), lunch: makeSlot([]), dinner: makeSlot([]) };
    render(<MealsSubTab {...baseProps} dayNutrition={partial} recentDishIds={['d2']} />);
    expect(screen.queryByTestId('recent-dishes-section')).not.toBeInTheDocument();
  });
});

// ─── NutritionSubTab ─────────────────────────────────────────────────
describe('NutritionSubTab', () => {
  const baseProps = {
    dayNutrition: filledNutrition,
    targetCalories: 2000,
    targetProtein: 140,
    userWeight: 70,
    onEditGoals: vi.fn(),
    onSwitchToMeals: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it('renders nutrition-subtab with Summary and RecommendationPanel', () => {
    render(<NutritionSubTab {...baseProps} />);
    expect(screen.getByTestId('nutrition-subtab')).toBeInTheDocument();
    expect(screen.getByText('Gợi ý cho bạn')).toBeInTheDocument();
    expect(screen.getByText(/70kg/)).toBeInTheDocument();
    expect(screen.getAllByText(/2000 kcal/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows plan complete when all meals are filled', () => {
    render(<NutritionSubTab {...baseProps} />);
    expect(screen.getByText('Kế hoạch ngày hôm nay đã hoàn tất!')).toBeInTheDocument();
  });

  it('shows missing meals text for partial state (missing lunch)', () => {
    const partial: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 400, 20),
      lunch: makeSlot([]),
      dinner: makeSlot(['d3'], 500, 25),
    };
    render(<NutritionSubTab {...baseProps} dayNutrition={partial} />);
    expect(screen.getByText(/Bạn còn thiếu.*bữa trưa/)).toBeInTheDocument();
  });

  it('shows missing meals text for partial state (missing breakfast and dinner)', () => {
    const partial: DayNutritionSummary = {
      breakfast: makeSlot([]),
      lunch: makeSlot(['d2'], 600, 30),
      dinner: makeSlot([]),
    };
    render(<NutritionSubTab {...baseProps} dayNutrition={partial} />);
    expect(screen.getByText(/Bạn còn thiếu.*bữa sáng.*bữa tối/)).toBeInTheDocument();
  });

  it('shows missing meals text for partial state (missing dinner only)', () => {
    const partial: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 400, 20),
      lunch: makeSlot(['d2'], 600, 30),
      dinner: makeSlot([]),
    };
    render(<NutritionSubTab {...baseProps} dayNutrition={partial} />);
    expect(screen.getByText(/Bạn còn thiếu.*bữa tối/)).toBeInTheDocument();
  });

  it('shows switch-to-meals button when empty and callback provided', () => {
    render(<NutritionSubTab {...baseProps} dayNutrition={emptyNutrition} />);
    const switchBtn = screen.getByTestId('btn-switch-to-meals');
    expect(switchBtn).toBeInTheDocument();
    expect(screen.getByText('Chưa có dữ liệu dinh dưỡng cho ngày này')).toBeInTheDocument();
    expect(screen.getByText(/Tiếp theo: chuyển sang tab Bữa ăn/)).toBeInTheDocument();
  });

  it('fires onSwitchToMeals when switch button is clicked', () => {
    render(<NutritionSubTab {...baseProps} dayNutrition={emptyNutrition} />);
    fireEvent.click(screen.getByTestId('btn-switch-to-meals'));
    expect(baseProps.onSwitchToMeals).toHaveBeenCalledTimes(1);
  });

  it('does not show switch button when onSwitchToMeals is undefined', () => {
    render(
      <NutritionSubTab
        dayNutrition={emptyNutrition}
        targetCalories={2000}
        targetProtein={140}
        userWeight={70}
        onEditGoals={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('btn-switch-to-meals')).not.toBeInTheDocument();
  });

  it('does not show switch button when meals have data', () => {
    render(<NutritionSubTab {...baseProps} />);
    expect(screen.queryByTestId('btn-switch-to-meals')).not.toBeInTheDocument();
  });

  it('renders macro chart within nutrition subtab', () => {
    const nutritionWithMacros: DayNutritionSummary = {
      breakfast: makeFullSlot(['d1'], 400, 20, 50, 10),
      lunch: makeFullSlot(['d2'], 600, 30, 70, 15),
      dinner: makeFullSlot(['d3'], 500, 25, 40, 20),
    };
    render(<NutritionSubTab {...baseProps} dayNutrition={nutritionWithMacros} />);
    expect(screen.getByTestId('macro-chart')).toBeInTheDocument();
  });

  it('renders macro chart empty state when no nutrition data', () => {
    render(<NutritionSubTab {...baseProps} dayNutrition={emptyNutrition} />);
    expect(screen.getByTestId('macro-chart-empty')).toBeInTheDocument();
  });

  it('does not render EnergyBalanceCard when caloriesOut is undefined', () => {
    render(<NutritionSubTab {...baseProps} />);
    expect(screen.queryByTestId('energy-balance-card')).not.toBeInTheDocument();
  });

  it('renders EnergyBalanceCard when caloriesOut is provided', () => {
    render(<NutritionSubTab {...baseProps} caloriesOut={350} />);
    const card = screen.getByTestId('energy-balance-card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('data-calories-in', '1500');
    expect(card).toHaveAttribute('data-calories-out', '350');
    expect(card).toHaveAttribute('data-target', '2000');
    expect(card).toHaveAttribute('data-protein-current', '75');
    expect(card).toHaveAttribute('data-protein-target', '140');
  });

  it('renders EnergyBalanceCard before Summary', () => {
    render(<NutritionSubTab {...baseProps} caloriesOut={350} />);
    const container = screen.getByTestId('nutrition-subtab');
    const energyCard = screen.getByTestId('energy-balance-card');
    const summaryCalories = screen.getByTestId('summary-total-calories');
    const children = Array.from(container.children);
    const energyIndex = children.findIndex(child => child.contains(energyCard));
    const summaryIndex = children.findIndex(child => child.contains(summaryCalories));
    expect(energyIndex).toBeLessThan(summaryIndex);
  });
});

// ─── MacroChart ──────────────────────────────────────────────────────
describe('MacroChart', () => {
  it('shows empty state when all macros are zero', () => {
    render(<MacroChart dayNutrition={emptyNutrition} />);
    expect(screen.getByTestId('macro-chart-empty')).toBeInTheDocument();
    expect(screen.getByText('Chưa có dữ liệu dinh dưỡng')).toBeInTheDocument();
    expect(screen.getByText('Thêm bữa ăn để xem biểu đồ dinh dưỡng')).toBeInTheDocument();
  });

  it('renders pie chart with macro percentages', () => {
    const nutrition: DayNutritionSummary = {
      breakfast: makeFullSlot(['d1'], 400, 25, 50, 10),
      lunch: makeFullSlot([], 0, 0, 0, 0),
      dinner: makeFullSlot([], 0, 0, 0, 0),
    };
    render(<MacroChart dayNutrition={nutrition} />);
    expect(screen.getByTestId('macro-chart')).toBeInTheDocument();
    expect(screen.getByText('Tỉ lệ dinh dưỡng')).toBeInTheDocument();
    expect(screen.getByText('Protein')).toBeInTheDocument();
    expect(screen.getByText('Carbs')).toBeInTheDocument();
    expect(screen.getByText('Chất béo')).toBeInTheDocument();
  });

  it('calculates correct macro percentages', () => {
    const nutrition: DayNutritionSummary = {
      breakfast: makeFullSlot(['d1'], 500, 50, 50, 0),
      lunch: makeFullSlot([], 0, 0, 0, 0),
      dinner: makeFullSlot([], 0, 0, 0, 0),
    };
    render(<MacroChart dayNutrition={nutrition} />);
    // protein: 50g * 4 = 200 cal, carbs: 50g * 4 = 200 cal, fat: 0
    // total = 400 cal → protein 50%, carbs 50%, fat 0%
    expect(screen.getByTestId('macro-percent-Protein')).toHaveTextContent('50%');
    expect(screen.getByTestId('macro-percent-Carbs')).toHaveTextContent('50%');
    expect(screen.getByTestId('macro-percent-Chất béo')).toHaveTextContent('0%');
  });

  it('aggregates macros across all meals', () => {
    const nutrition: DayNutritionSummary = {
      breakfast: makeFullSlot(['d1'], 200, 10, 20, 5),
      lunch: makeFullSlot(['d2'], 300, 20, 30, 10),
      dinner: makeFullSlot(['d3'], 400, 10, 50, 5),
    };
    render(<MacroChart dayNutrition={nutrition} />);
    // protein: 40g, carbs: 100g, fat: 20g
    // pCal: 160, cCal: 400, fCal: 180 → total: 740
    // p%: 22, c%: 54, f%: 24
    expect(screen.getByTestId('macro-percent-Protein')).toHaveTextContent('22%');
    expect(screen.getByTestId('macro-percent-Carbs')).toHaveTextContent('54%');
    expect(screen.getByTestId('macro-percent-Chất béo')).toHaveTextContent('24%');
  });

  it('displays gram values for each macro', () => {
    const nutrition: DayNutritionSummary = {
      breakfast: makeFullSlot(['d1'], 500, 30, 60, 15),
      lunch: makeFullSlot([], 0, 0, 0, 0),
      dinner: makeFullSlot([], 0, 0, 0, 0),
    };
    render(<MacroChart dayNutrition={nutrition} />);
    expect(screen.getByText('30g')).toBeInTheDocument();
    expect(screen.getByText('60g')).toBeInTheDocument();
    expect(screen.getByText('15g')).toBeInTheDocument();
  });

  it('renders SVG circles for each macro segment', () => {
    const nutrition: DayNutritionSummary = {
      breakfast: makeFullSlot(['d1'], 400, 25, 40, 10),
      lunch: makeFullSlot([], 0, 0, 0, 0),
      dinner: makeFullSlot([], 0, 0, 0, 0),
    };
    const { container } = render(<MacroChart dayNutrition={nutrition} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(3);
  });
});

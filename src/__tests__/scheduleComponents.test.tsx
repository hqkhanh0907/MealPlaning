import { render, screen, fireEvent } from '@testing-library/react';
import { MealSlot } from '../components/schedule/MealSlot';
import { MealActionBar } from '../components/schedule/MealActionBar';
import { MiniNutritionBar } from '../components/schedule/MiniNutritionBar';
import { MealsSubTab } from '../components/schedule/MealsSubTab';
import { NutritionSubTab } from '../components/schedule/NutritionSubTab';
import { MacroChart } from '../components/schedule/MacroChart';
import type { DayNutritionSummary, Dish, SlotInfo } from '../types';

const makeSlot = (dishIds: string[], cal = 0, pro = 0): SlotInfo => ({
  dishIds, calories: cal, protein: pro, carbs: 0, fat: 0, fiber: 0,
});

const makeFullSlot = (dishIds: string[], cal: number, pro: number, carbs: number, fat: number): SlotInfo => ({
  dishIds, calories: cal, protein: pro, carbs, fat, fiber: 0,
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
  it('renders empty state with "Chưa có món" and "Thêm" button', () => {
    const onEdit = vi.fn();
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot([])}
        dishes={dishes}
        onEdit={onEdit}
      />,
    );
    expect(screen.getByText('Chưa có món')).toBeInTheDocument();
    const addBtn = screen.getByLabelText('Thêm');
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('renders filled state with dish names', () => {
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot(['d1'], 400, 20)}
        dishes={dishes}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText('Trứng chiên')).toBeInTheDocument();
    expect(screen.getByText('400 kcal')).toBeInTheDocument();
    expect(screen.getByText('20g Pro')).toBeInTheDocument();
  });

  it('renders "+N món nữa" when more than 2 dishes', () => {
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot(['d1', 'd2', 'd3'], 900, 45)}
        dishes={dishes}
        onEdit={vi.fn()}
      />,
    );
    // Only first 2 visible
    expect(screen.getByText('Trứng chiên')).toBeInTheDocument();
    expect(screen.getByText('Cơm gà')).toBeInTheDocument();
    // Extra count text
    expect(screen.getByText('+1 món nữa')).toBeInTheDocument();
  });

  it('renders "+N món nữa" with count > 1 when more than 3 dishes', () => {
    render(
      <MealSlot
        type="lunch"
        slot={makeSlot(['d1', 'd2', 'd3', 'd4'], 1200, 60)}
        dishes={dishes}
        onEdit={vi.fn()}
      />,
    );
    expect(screen.getByText('+2 món nữa')).toBeInTheDocument();
  });

  it('fires onEdit when edit button clicked on filled card', () => {
    const onEdit = vi.fn();
    render(
      <MealSlot
        type="lunch"
        slot={makeSlot(['d2'], 600, 30)}
        dishes={dishes}
        onEdit={onEdit}
      />,
    );
    const editBtn = screen.getByLabelText('Chỉnh sửa Trưa');
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('renders correct meal icons for each type', () => {
    const { rerender } = render(
      <MealSlot type="breakfast" slot={makeSlot([])} dishes={[]} onEdit={vi.fn()} />,
    );
    expect(screen.getByText('Sáng')).toBeInTheDocument();

    rerender(
      <MealSlot type="lunch" slot={makeSlot([])} dishes={[]} onEdit={vi.fn()} />,
    );
    expect(screen.getByText('Trưa')).toBeInTheDocument();

    rerender(
      <MealSlot type="dinner" slot={makeSlot([])} dishes={[]} onEdit={vi.fn()} />,
    );
    expect(screen.getByText('Tối')).toBeInTheDocument();
  });

  it('filters out dishes not found in the dishes array', () => {
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot(['d1', 'nonexistent'], 400, 20)}
        dishes={dishes}
        onEdit={vi.fn()}
      />,
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

  it('does not render serving stepper when onUpdateServings is absent', () => {
    render(
      <MealSlot
        type="breakfast"
        slot={makeSlot(['d1'], 400, 20)}
        dishes={dishes}
        onEdit={vi.fn()}
      />,
    );
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
  };

  beforeEach(() => vi.clearAllMocks());

  const openMenu = () => {
    fireEvent.click(screen.getByTestId('btn-more-actions'));
  };

  it('renders plan meal and AI suggest buttons', () => {
    render(<MealActionBar {...baseProps} />);
    expect(screen.getByTestId('btn-plan-meal-section')).toBeInTheDocument();
    expect(screen.getByTestId('btn-ai-suggest')).toBeInTheDocument();
  });

  it('renders more actions button and shows menu items when clicked', () => {
    render(<MealActionBar {...baseProps} />);
    expect(screen.getByTestId('btn-more-actions')).toBeInTheDocument();
    openMenu();
    expect(screen.getByTestId('more-actions-menu')).toBeInTheDocument();
    expect(screen.getByTestId('btn-clear-plan')).toBeInTheDocument();
    expect(screen.getByTestId('btn-copy-plan')).toBeInTheDocument();
    expect(screen.getByTestId('btn-save-template')).toBeInTheDocument();
    expect(screen.getByTestId('btn-template-manager')).toBeInTheDocument();
  });

  it('hides clear, copy, save items in menu when allEmpty is true', () => {
    render(<MealActionBar {...baseProps} allEmpty={true} />);
    openMenu();
    expect(screen.queryByTestId('btn-clear-plan')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-copy-plan')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-save-template')).not.toBeInTheDocument();
  });

  it('disables AI button when isSuggesting is true', () => {
    render(<MealActionBar {...baseProps} isSuggesting={true} />);
    expect(screen.getByTestId('btn-ai-suggest')).toBeDisabled();
  });

  it('calls onOpenTypeSelection when plan button clicked', () => {
    render(<MealActionBar {...baseProps} />);
    fireEvent.click(screen.getByTestId('btn-plan-meal-section'));
    expect(baseProps.onOpenTypeSelection).toHaveBeenCalled();
  });

  it('calls onSuggestMealPlan when AI button clicked', () => {
    render(<MealActionBar {...baseProps} />);
    fireEvent.click(screen.getByTestId('btn-ai-suggest'));
    expect(baseProps.onSuggestMealPlan).toHaveBeenCalled();
  });

  it('calls onOpenClearPlan when clear menu item clicked', () => {
    render(<MealActionBar {...baseProps} />);
    openMenu();
    fireEvent.click(screen.getByTestId('btn-clear-plan'));
    expect(baseProps.onOpenClearPlan).toHaveBeenCalled();
  });

  it('calls onCopyPlan when copy menu item clicked', () => {
    render(<MealActionBar {...baseProps} />);
    openMenu();
    fireEvent.click(screen.getByTestId('btn-copy-plan'));
    expect(baseProps.onCopyPlan).toHaveBeenCalled();
  });

  it('calls onSaveTemplate when save menu item clicked', () => {
    render(<MealActionBar {...baseProps} />);
    openMenu();
    fireEvent.click(screen.getByTestId('btn-save-template'));
    expect(baseProps.onSaveTemplate).toHaveBeenCalled();
  });

  it('calls onOpenTemplateManager when template menu item clicked', () => {
    render(<MealActionBar {...baseProps} />);
    openMenu();
    fireEvent.click(screen.getByTestId('btn-template-manager'));
    expect(baseProps.onOpenTemplateManager).toHaveBeenCalled();
  });

  it('hides more actions button when no callbacks are provided', () => {
    render(
      <MealActionBar
        allEmpty={false}
        isSuggesting={false}
        onOpenTypeSelection={vi.fn()}
        onSuggestMealPlan={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('btn-more-actions')).not.toBeInTheDocument();
  });

  it('closes menu after clicking a menu item', () => {
    render(<MealActionBar {...baseProps} />);
    openMenu();
    expect(screen.getByTestId('more-actions-menu')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-clear-plan'));
    expect(screen.queryByTestId('more-actions-menu')).not.toBeInTheDocument();
  });

  it('closes menu when clicking outside', () => {
    render(<MealActionBar {...baseProps} />);
    openMenu();
    expect(screen.getByTestId('more-actions-menu')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('more-actions-menu')).not.toBeInTheDocument();
  });

  it('toggles menu open and closed on button clicks', () => {
    render(<MealActionBar {...baseProps} />);
    openMenu();
    expect(screen.getByTestId('more-actions-menu')).toBeInTheDocument();
    openMenu();
    expect(screen.queryByTestId('more-actions-menu')).not.toBeInTheDocument();
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
    expect(screen.getByText(/Bắt đầu lên kế hoạch/)).toBeInTheDocument();
  });

  it('shows missing meals message when partially filled', () => {
    const partial: DayNutritionSummary = {
      breakfast: makeSlot(['d1'], 400, 20),
      lunch: makeSlot([]),
      dinner: makeSlot([]),
    };
    render(<MealsSubTab {...baseProps} dayNutrition={partial} />);
    expect(screen.getByText(/Bạn còn thiếu.*bữa trưa.*bữa tối/)).toBeInTheDocument();
  });

  it('shows plan complete message when all meals filled', () => {
    render(<MealsSubTab {...baseProps} />);
    expect(screen.getByText(/Kế hoạch ngày hôm nay đã hoàn tất/)).toBeInTheDocument();
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
    expect(screen.getByText(/Bạn còn thiếu.*bữa trưa/)).toBeInTheDocument();
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
    expect(screen.getByText('Chuyển sang tab Bữa ăn để bắt đầu')).toBeInTheDocument();
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
});

// ─── MacroChart ──────────────────────────────────────────────────────
describe('MacroChart', () => {
  it('shows empty state when all macros are zero', () => {
    render(<MacroChart dayNutrition={emptyNutrition} />);
    expect(screen.getByTestId('macro-chart-empty')).toBeInTheDocument();
    expect(screen.getByText('Chưa có dữ liệu dinh dưỡng')).toBeInTheDocument();
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

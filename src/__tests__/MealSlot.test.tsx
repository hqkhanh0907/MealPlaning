import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'meal.breakfast': 'Sáng',
        'meal.lunch': 'Trưa',
        'meal.dinner': 'Tối',
        'calendar.meal.emptySlot': 'Chưa có món',
        'calendar.meal.addCTA': 'Thêm',
        'calendar.meal.moreCount': '+{{count}} thêm',
        'calendar.meal.slotLabel': '{{type}}: {{count}} món, {{cal}} kcal',
        'calendar.meal.clearSlot': 'Xóa bữa {{type}}',
        'calendar.meal.clearConfirmTitle': 'Xóa bữa {{type}}?',
        'calendar.meal.clearConfirmDesc': 'Tất cả món ăn trong bữa {{type}} sẽ bị xóa.',
        'calendar.addDishForMeal': 'Thêm món cho {{meal}}',
        'common.edit': 'Sửa',
        'common.delete': 'Xóa',
        'common.cancel': 'Hủy',
        'common.confirm': 'Xác nhận',
        'common.decrease': 'Giảm',
        'common.increase': 'Tăng',
      };
      let text = map[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{{${k}}}`, String(v));
        }
      }
      return text;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../components/modals/ConfirmationModal', () => ({
  ConfirmationModal: () => null,
}));

import { MealSlot, MealSlotProps } from '../components/schedule/MealSlot';
import { Dish } from '../types';

const SAMPLE_DISHES: Dish[] = [
  {
    id: 'd1',
    name: { vi: 'Trứng ốp la' },
    ingredients: [{ ingredientId: 'i1', amount: 100 }],
    tags: ['breakfast', 'dinner'],
  },
  {
    id: 'd2',
    name: { vi: 'Yến mạch sữa chua' },
    ingredients: [{ ingredientId: 'i2', amount: 100 }],
    tags: ['breakfast'],
  },
  {
    id: 'd3',
    name: { vi: 'Ức gà áp chảo' },
    ingredients: [{ ingredientId: 'i3', amount: 100 }],
    tags: ['lunch', 'dinner'],
  },
  {
    id: 'd4',
    name: { vi: 'Khoai lang luộc' },
    ingredients: [{ ingredientId: 'i4', amount: 100 }],
    tags: ['lunch', 'dinner'],
  },
  {
    id: 'd5',
    name: { vi: 'Bông cải xanh luộc' },
    ingredients: [{ ingredientId: 'i5', amount: 100 }],
    tags: ['lunch', 'dinner'],
  },
];

function makeProps(overrides: Partial<MealSlotProps> = {}): MealSlotProps {
  return {
    type: 'breakfast',
    slot: {
      dishIds: ['d1', 'd2'],
      calories: 487,
      protein: 38,
      fat: 15,
      carbs: 67,
      fiber: 3,
    },
    dishes: SAMPLE_DISHES,
    onEdit: vi.fn(),
    ...overrides,
  };
}

describe('MealSlot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('empty state', () => {
    const emptySlot = { dishIds: [], calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };

    it('renders empty slot with dashed border and centered layout', () => {
      const props = makeProps({ slot: emptySlot });
      render(<MealSlot {...props} />);

      expect(screen.getByText('Sáng')).toBeInTheDocument();
      expect(screen.getByText('Chưa có món')).toBeInTheDocument();
      expect(screen.getByText('Thêm')).toBeInTheDocument();

      const card = screen.getByTestId('meal-slot-breakfast');
      expect(card.className).toContain('border-dashed');
      expect(card.className).toContain('border-border');
      expect(card.className).not.toContain('bg-muted');
    });

    it('renders UtensilsCrossed icon with meal color', () => {
      const props = makeProps({ slot: emptySlot });
      render(<MealSlot {...props} />);
      const card = screen.getByTestId('meal-slot-breakfast');
      const svgs = card.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(1);
    });

    it('has region role with aria-label', () => {
      const props = makeProps({ slot: emptySlot });
      render(<MealSlot {...props} />);
      const card = screen.getByTestId('meal-slot-breakfast');
      expect(card.tagName).toBe('SECTION');
      expect(card).toHaveAttribute('aria-label', 'Sáng: 0 món, 0 kcal');
    });

    it('has left border accent for breakfast', () => {
      const props = makeProps({ slot: emptySlot });
      render(<MealSlot {...props} />);
      const card = screen.getByTestId('meal-slot-breakfast');
      expect(card.className).toContain('border-l-[3px]');
      expect(card.className).toContain('border-l-meal-breakfast');
    });

    it('has left border accent for lunch', () => {
      const props = makeProps({ slot: emptySlot, type: 'lunch' });
      render(<MealSlot {...props} />);
      const card = screen.getByTestId('meal-slot-lunch');
      expect(card.className).toContain('border-l-meal-lunch');
    });

    it('has left border accent for dinner', () => {
      const props = makeProps({ slot: emptySlot, type: 'dinner' });
      render(<MealSlot {...props} />);
      const card = screen.getByTestId('meal-slot-dinner');
      expect(card.className).toContain('border-l-meal-dinner');
    });

    it('calls onEdit when add CTA is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const props = makeProps({ slot: emptySlot, onEdit });
      render(<MealSlot {...props} />);
      await user.click(screen.getByLabelText('Thêm món cho Sáng'));
      expect(onEdit).toHaveBeenCalledOnce();
    });

    it('CTA button has min-h-11 for 44px touch target', () => {
      const props = makeProps({ slot: emptySlot });
      render(<MealSlot {...props} />);
      const btn = screen.getByLabelText('Thêm món cho Sáng');
      expect(btn.className).toContain('min-h-11');
    });

    it('shows 0 kcal explicitly for empty slot (EC-13)', () => {
      const props = makeProps({
        slot: { dishIds: ['d1'], calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
      });
      render(<MealSlot {...props} />);
      expect(screen.getByText('0 kcal')).toBeInTheDocument();
    });
  });

  describe('with dishes - filled state', () => {
    it('renders meal type label with inline nutrition header', () => {
      render(<MealSlot {...makeProps()} />);
      expect(screen.getByText('Sáng')).toBeInTheDocument();
      expect(screen.getByText('487 kcal · 38g')).toBeInTheDocument();
    });

    it('renders dish names', () => {
      render(<MealSlot {...makeProps()} />);
      expect(screen.getByText('Trứng ốp la')).toBeInTheDocument();
      expect(screen.getByText('Yến mạch sữa chua')).toBeInTheDocument();
    });

    it('has region role with aria-label showing count and calories', () => {
      render(<MealSlot {...makeProps()} />);
      const card = screen.getByTestId('meal-slot-breakfast');
      expect(card.tagName).toBe('SECTION');
      expect(card).toHaveAttribute('aria-label', 'Sáng: 2 món, 487 kcal');
    });

    it('has left border accent for filled breakfast', () => {
      render(<MealSlot {...makeProps()} />);
      const card = screen.getByTestId('meal-slot-breakfast');
      const content = card.querySelector('[class*="bg-card"]')!;
      expect(content.className).toContain('border-l-[3px]');
      expect(content.className).toContain('border-l-meal-breakfast');
    });

    it('shows 4 dishes without "+N" indicator (MAX_VISIBLE=4)', () => {
      const props = makeProps({
        slot: {
          dishIds: ['d1', 'd2', 'd3', 'd4'],
          calories: 800,
          protein: 100,
          fat: 30,
          carbs: 90,
          fiber: 5,
        },
      });
      render(<MealSlot {...props} />);
      expect(screen.getByText('Trứng ốp la')).toBeInTheDocument();
      expect(screen.getByText('Yến mạch sữa chua')).toBeInTheDocument();
      expect(screen.getByText('Ức gà áp chảo')).toBeInTheDocument();
      expect(screen.getByText('Khoai lang luộc')).toBeInTheDocument();
      expect(screen.queryByText(/\+\d+ thêm/)).not.toBeInTheDocument();
    });

    it('shows "+N thêm" for dishes beyond MAX_VISIBLE (5 dishes)', () => {
      const props = makeProps({
        slot: {
          dishIds: ['d1', 'd2', 'd3', 'd4', 'd5'],
          calories: 1000,
          protein: 120,
          fat: 40,
          carbs: 100,
          fiber: 6,
        },
      });
      render(<MealSlot {...props} />);
      expect(screen.getByText('+1 thêm')).toBeInTheDocument();
      expect(screen.queryByText('Bông cải xanh luộc')).not.toBeInTheDocument();
    });

    it('expands to show all dishes when "+N thêm" is clicked', async () => {
      const user = userEvent.setup();
      const props = makeProps({
        slot: {
          dishIds: ['d1', 'd2', 'd3', 'd4', 'd5'],
          calories: 1000,
          protein: 120,
          fat: 40,
          carbs: 100,
          fiber: 6,
        },
      });
      render(<MealSlot {...props} />);
      await user.click(screen.getByText('+1 thêm'));
      expect(screen.getByText('Bông cải xanh luộc')).toBeInTheDocument();
      expect(screen.queryByText('+1 thêm')).not.toBeInTheDocument();
    });

    it('renders calorie badge with energy styling', () => {
      render(<MealSlot {...makeProps()} />);
      const calBadge = screen.getByText('487 kcal');
      expect(calBadge).toBeInTheDocument();
      expect(calBadge.className).toContain('text-energy-emphasis');
      expect(calBadge.className).toContain('text-sm');
    });

    it('renders full P/F/C macro pills in footer', () => {
      render(<MealSlot {...makeProps()} />);
      expect(screen.getByText(/P 38g/)).toBeInTheDocument();
      expect(screen.getByText(/F 15g/)).toBeInTheDocument();
      expect(screen.getByText(/C 67g/)).toBeInTheDocument();
    });

    it('applies correct color classes to macro pills', () => {
      render(<MealSlot {...makeProps()} />);
      const proteinPill = screen.getByText(/P 38g/);
      const fatPill = screen.getByText(/F 15g/);
      const carbsPill = screen.getByText(/C 67g/);
      expect(proteinPill.className).toContain('text-macro-protein');
      expect(fatPill.className).toContain('text-macro-fat');
      expect(carbsPill.className).toContain('text-macro-carbs');
    });

    it('rounds macro values', () => {
      const props = makeProps({
        slot: {
          dishIds: ['d1'],
          calories: 155.6,
          protein: 13.4,
          fat: 11.2,
          carbs: 1.8,
          fiber: 0.1,
        },
      });
      render(<MealSlot {...props} />);
      expect(screen.getByText('156 kcal')).toBeInTheDocument();
      expect(screen.getByText(/P 13g/)).toBeInTheDocument();
      expect(screen.getByText(/F 11g/)).toBeInTheDocument();
      expect(screen.getByText(/C 2g/)).toBeInTheDocument();
    });

    it('shows inline nutrition header with rounded values', () => {
      const props = makeProps({
        slot: {
          dishIds: ['d1'],
          calories: 155.6,
          protein: 13.4,
          fat: 11.2,
          carbs: 1.8,
          fiber: 0.1,
        },
      });
      render(<MealSlot {...props} />);
      expect(screen.getByText('156 kcal · 13g')).toBeInTheDocument();
    });
  });

  describe('servings', () => {
    it('renders serving controls when onUpdateServings is provided', () => {
      const props = makeProps({ onUpdateServings: vi.fn() });
      render(<MealSlot {...props} />);
      expect(screen.getByTestId('btn-serving-minus-d1')).toBeInTheDocument();
      expect(screen.getByTestId('btn-serving-plus-d1')).toBeInTheDocument();
      expect(screen.getByTestId('serving-count-d1')).toHaveTextContent('1x');
    });

    it('calls onUpdateServings with incremented value', async () => {
      const user = userEvent.setup();
      const onUpdateServings = vi.fn();
      const props = makeProps({ onUpdateServings });
      render(<MealSlot {...props} />);
      await user.click(screen.getByTestId('btn-serving-plus-d1'));
      expect(onUpdateServings).toHaveBeenCalledWith('d1', 2);
    });

    it('calls onUpdateServings with decremented value', async () => {
      const user = userEvent.setup();
      const onUpdateServings = vi.fn();
      const props = makeProps({
        onUpdateServings,
        servings: { d1: 3 },
      });
      render(<MealSlot {...props} />);
      await user.click(screen.getByTestId('btn-serving-minus-d1'));
      expect(onUpdateServings).toHaveBeenCalledWith('d1', 2);
    });

    it('disables decrease button when servings is 1', () => {
      const props = makeProps({ onUpdateServings: vi.fn(), servings: { d1: 1 } });
      render(<MealSlot {...props} />);
      expect(screen.getByTestId('btn-serving-minus-d1')).toBeDisabled();
    });

    it('disables increase button when servings is 10', () => {
      const props = makeProps({ onUpdateServings: vi.fn(), servings: { d1: 10 } });
      render(<MealSlot {...props} />);
      expect(screen.getByTestId('btn-serving-plus-d1')).toBeDisabled();
    });

    it('displays custom serving count', () => {
      const props = makeProps({ onUpdateServings: vi.fn(), servings: { d1: 5 } });
      render(<MealSlot {...props} />);
      expect(screen.getByTestId('serving-count-d1')).toHaveTextContent('5x');
    });

    it('does not render serving controls when onUpdateServings is not provided', () => {
      render(<MealSlot {...makeProps()} />);
      expect(screen.queryByTestId('btn-serving-minus-d1')).not.toBeInTheDocument();
    });
  });

  describe('meal types', () => {
    it('renders lunch type with correct border', () => {
      render(<MealSlot {...makeProps({ type: 'lunch' })} />);
      expect(screen.getByText('Trưa')).toBeInTheDocument();
      const card = screen.getByTestId('meal-slot-lunch');
      expect(card).toBeInTheDocument();
      const content = card.querySelector('[class*="bg-card"]')!;
      expect(content.className).toContain('border-l-meal-lunch');
    });

    it('renders dinner type with correct border', () => {
      render(<MealSlot {...makeProps({ type: 'dinner' })} />);
      expect(screen.getByText('Tối')).toBeInTheDocument();
      const card = screen.getByTestId('meal-slot-dinner');
      expect(card).toBeInTheDocument();
      const content = card.querySelector('[class*="bg-card"]')!;
      expect(content.className).toContain('border-l-meal-dinner');
    });
  });

  describe('edit button', () => {
    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<MealSlot {...makeProps({ onEdit })} />);
      await user.click(screen.getByLabelText('Sửa Sáng'));
      expect(onEdit).toHaveBeenCalledOnce();
    });
  });

  describe('card elevation', () => {
    it('uses raised card style with shadow-sm for populated slot', () => {
      render(<MealSlot {...makeProps()} />);
      const card = screen.getByTestId('meal-slot-breakfast');
      const content = card.querySelector('[class*="bg-card"]')!;
      expect(content.className).toContain('shadow-sm');
      expect(content.className).toContain('hover:shadow-md');
    });

    it('uses flat style without shadow for empty slot', () => {
      const props = makeProps({
        slot: { dishIds: [], calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
      });
      render(<MealSlot {...props} />);
      const card = screen.getByTestId('meal-slot-breakfast');
      expect(card.className).not.toContain('shadow-sm');
    });
  });

  describe('handles missing dishes', () => {
    it('filters out unresolved dish IDs gracefully', () => {
      const props = makeProps({
        slot: {
          dishIds: ['d1', 'unknown-id'],
          calories: 155,
          protein: 13,
          fat: 11,
          carbs: 1,
          fiber: 0,
        },
      });
      render(<MealSlot {...props} />);
      expect(screen.getByText('Trứng ốp la')).toBeInTheDocument();
      expect(screen.queryByText('unknown-id')).not.toBeInTheDocument();
    });
  });
});

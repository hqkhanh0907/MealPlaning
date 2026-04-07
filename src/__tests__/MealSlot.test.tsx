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
        'quickPreview.empty': 'Chưa có món',
        'quickPreview.add': 'Thêm',
        'quickPreview.more': '+{{count}} món',
        'common.edit': 'Sửa',
        'common.decrease': 'Giảm',
        'common.increase': 'Tăng',
        'common.macroP': 'P',
        'common.macroF': 'F',
        'common.macroC': 'C',
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
  });

  describe('empty state', () => {
    it('renders empty slot with add button', () => {
      const props = makeProps({
        slot: { dishIds: [], calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
      });
      render(<MealSlot {...props} />);

      expect(screen.getByText('Sáng')).toBeInTheDocument();
      expect(screen.getByText('Chưa có món')).toBeInTheDocument();
      expect(screen.getByLabelText('Thêm')).toBeInTheDocument();
    });

    it('calls onEdit when add button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const props = makeProps({
        slot: { dishIds: [], calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
        onEdit,
      });
      render(<MealSlot {...props} />);
      await user.click(screen.getByLabelText('Thêm'));
      expect(onEdit).toHaveBeenCalledOnce();
    });
  });

  describe('with dishes', () => {
    it('renders meal type label with correct icon color class', () => {
      render(<MealSlot {...makeProps()} />);
      expect(screen.getByText('Sáng')).toBeInTheDocument();
    });

    it('renders dish names', () => {
      render(<MealSlot {...makeProps()} />);
      expect(screen.getByText('Trứng ốp la')).toBeInTheDocument();
      expect(screen.getByText('Yến mạch sữa chua')).toBeInTheDocument();
    });

    it('shows "+N" for extra dishes beyond MAX_VISIBLE_DISHES', () => {
      const props = makeProps({
        slot: {
          dishIds: ['d1', 'd2', 'd3'],
          calories: 800,
          protein: 100,
          fat: 30,
          carbs: 90,
          fiber: 5,
        },
      });
      render(<MealSlot {...props} />);
      expect(screen.getByText('+1 món')).toBeInTheDocument();
    });

    it('renders calorie badge with energy styling', () => {
      render(<MealSlot {...makeProps()} />);
      const calBadge = screen.getByText('487 kcal');
      expect(calBadge).toBeInTheDocument();
      expect(calBadge.className).toContain('text-energy-emphasis');
      expect(calBadge.className).toContain('text-sm');
    });

    it('renders full P/F/C macro pills', () => {
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
    it('renders lunch type', () => {
      render(<MealSlot {...makeProps({ type: 'lunch' })} />);
      expect(screen.getByText('Trưa')).toBeInTheDocument();
      expect(screen.getByTestId('meal-slot-lunch')).toBeInTheDocument();
    });

    it('renders dinner type', () => {
      render(<MealSlot {...makeProps({ type: 'dinner' })} />);
      expect(screen.getByText('Tối')).toBeInTheDocument();
      expect(screen.getByTestId('meal-slot-dinner')).toBeInTheDocument();
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
      expect(card.className).toContain('shadow-sm');
      expect(card.className).toContain('hover:shadow-md');
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

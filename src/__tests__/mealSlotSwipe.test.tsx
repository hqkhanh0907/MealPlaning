import { fireEvent, render, screen } from '@testing-library/react';
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
        'calendar.addDishForMeal': 'Thêm món cho {{meal}}',
        'calendar.meal.clearSlot': 'Xóa bữa {{type}}',
        'calendar.meal.clearConfirmTitle': 'Xóa bữa {{type}}?',
        'calendar.meal.clearConfirmDesc': 'Tất cả món ăn trong bữa {{type}} sẽ bị xóa.',
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
  ConfirmationModal: (props: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: string;
  }) => {
    if (!props.isOpen) return null;
    return (
      <div data-testid="confirmation-modal" role="alertdialog">
        <span data-testid="modal-title">{props.title}</span>
        <span data-testid="modal-message">{props.message}</span>
        <button data-testid="modal-confirm" type="button" onClick={props.onConfirm}>
          {props.confirmLabel ?? 'Xác nhận'}
        </button>
        <button data-testid="modal-cancel" type="button" onClick={props.onCancel}>
          {props.cancelLabel ?? 'Hủy'}
        </button>
      </div>
    );
  },
}));

vi.mock('../../data/constants', async () => {
  const FallbackIcon = (p: Record<string, unknown>) => <svg data-testid={String(p['data-testid'] ?? 'icon')} />;
  return {
    MEAL_TYPE_ICONS: { breakfast: FallbackIcon, lunch: FallbackIcon, dinner: FallbackIcon },
    MEAL_TYPE_ICON_COLORS: { breakfast: 'text-orange', lunch: 'text-green', dinner: 'text-purple' },
  };
});

import { MealSlot, MealSlotProps } from '../components/schedule/MealSlot';
import { Dish, SlotInfo } from '../types';

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
];

const FILLED_SLOT: SlotInfo = {
  dishIds: ['d1', 'd2'],
  calories: 487,
  protein: 38,
  fat: 15,
  carbs: 67,
  fiber: 3,
};

const EMPTY_SLOT: SlotInfo = {
  dishIds: [],
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
  fiber: 0,
};

function makeProps(overrides: Partial<MealSlotProps> = {}): MealSlotProps {
  return {
    type: 'breakfast',
    slot: FILLED_SLOT,
    dishes: SAMPLE_DISHES,
    onEdit: vi.fn(),
    onClearMeal: vi.fn(),
    isSwipeOpen: false,
    onSwipeOpen: vi.fn(),
    onSwipeClose: vi.fn(),
    ...overrides,
  };
}

function simulateSwipe(element: HTMLElement, startX: number, endX: number, startY = 100, endY = 100) {
  fireEvent.touchStart(element, {
    touches: [{ clientX: startX, clientY: startY }],
  });
  fireEvent.touchMove(element, {
    touches: [{ clientX: endX, clientY: endY }],
  });
  fireEvent.touchEnd(element);
}

describe('MealSlot — Swipe-to-Clear Gesture', () => {
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

  describe('empty slot — no swipe', () => {
    it('does not attach touch handlers to empty slot', () => {
      const onSwipeOpen = vi.fn();
      render(<MealSlot {...makeProps({ slot: EMPTY_SLOT, onSwipeOpen })} />);

      const section = screen.getByTestId('meal-slot-breakfast');
      fireEvent.touchStart(section, { touches: [{ clientX: 300, clientY: 100 }] });
      fireEvent.touchMove(section, { touches: [{ clientX: 200, clientY: 100 }] });
      fireEvent.touchEnd(section);

      expect(onSwipeOpen).not.toHaveBeenCalled();
    });

    it('does not render destructive zone for empty slot', () => {
      render(<MealSlot {...makeProps({ slot: EMPTY_SLOT })} />);
      expect(screen.queryByTestId('swipe-delete-breakfast')).not.toBeInTheDocument();
    });
  });

  describe('filled slot — destructive zone', () => {
    it('renders destructive zone behind content', () => {
      render(<MealSlot {...makeProps()} />);
      const deleteZone = screen.getByTestId('swipe-delete-breakfast');
      expect(deleteZone).toBeInTheDocument();
      expect(deleteZone.className).toContain('bg-destructive');
    });

    it('destructive zone has delete button with aria-label', () => {
      render(<MealSlot {...makeProps()} />);
      const deleteBtn = screen.getByLabelText('Xóa bữa Sáng');
      expect(deleteBtn).toBeInTheDocument();
    });

    it('destructive zone shows Xóa text', () => {
      render(<MealSlot {...makeProps()} />);
      const deleteZone = screen.getByTestId('swipe-delete-breakfast');
      expect(deleteZone).toHaveTextContent('Xóa');
    });

    it('renders correctly for lunch type', () => {
      render(<MealSlot {...makeProps({ type: 'lunch' })} />);
      expect(screen.getByTestId('swipe-delete-lunch')).toBeInTheDocument();
      expect(screen.getByLabelText('Xóa bữa Trưa')).toBeInTheDocument();
    });

    it('renders correctly for dinner type', () => {
      render(<MealSlot {...makeProps({ type: 'dinner' })} />);
      expect(screen.getByTestId('swipe-delete-dinner')).toBeInTheDocument();
      expect(screen.getByLabelText('Xóa bữa Tối')).toBeInTheDocument();
    });
  });

  describe('swipe gestures', () => {
    it('calls onSwipeOpen on left swipe ≥ 50px', () => {
      const onSwipeOpen = vi.fn();
      render(<MealSlot {...makeProps({ onSwipeOpen })} />);

      const section = screen.getByTestId('meal-slot-breakfast');
      const draggable = section.querySelector('[class*="bg-card"]') as HTMLElement;

      simulateSwipe(draggable, 300, 240);
      expect(onSwipeOpen).toHaveBeenCalledOnce();
    });

    it('calls onSwipeClose on left swipe < 50px (snap back)', () => {
      const onSwipeClose = vi.fn();
      render(<MealSlot {...makeProps({ onSwipeClose })} />);

      const section = screen.getByTestId('meal-slot-breakfast');
      const draggable = section.querySelector('[class*="bg-card"]') as HTMLElement;

      simulateSwipe(draggable, 300, 270);
      expect(onSwipeClose).toHaveBeenCalledOnce();
    });

    it('ignores diagonal swipe (|diffY| > |diffX|)', () => {
      const onSwipeOpen = vi.fn();
      const onSwipeClose = vi.fn();
      render(<MealSlot {...makeProps({ onSwipeOpen, onSwipeClose })} />);

      const section = screen.getByTestId('meal-slot-breakfast');
      const draggable = section.querySelector('[class*="bg-card"]') as HTMLElement;

      simulateSwipe(draggable, 300, 270, 100, 200);
      expect(onSwipeOpen).not.toHaveBeenCalled();
      expect(onSwipeClose).not.toHaveBeenCalled();
    });

    it('does not call onSwipeOpen on right swipe when closed', () => {
      const onSwipeOpen = vi.fn();
      render(<MealSlot {...makeProps({ onSwipeOpen })} />);

      const section = screen.getByTestId('meal-slot-breakfast');
      const draggable = section.querySelector('[class*="bg-card"]') as HTMLElement;

      simulateSwipe(draggable, 200, 300);
      expect(onSwipeOpen).not.toHaveBeenCalled();
    });
  });

  describe('controlled open/close (isSwipeOpen)', () => {
    it('container at translateX(0) when isSwipeOpen=false', () => {
      render(<MealSlot {...makeProps({ isSwipeOpen: false })} />);

      const section = screen.getByTestId('meal-slot-breakfast');
      const draggable = section.querySelector('[class*="bg-card"]') as HTMLElement;

      expect(draggable.style.transform).toBe('translateX(0)');
    });

    it('container animates to translateX(0) when isSwipeOpen transitions false', () => {
      const { rerender } = render(<MealSlot {...makeProps({ isSwipeOpen: true })} />);

      rerender(<MealSlot {...makeProps({ isSwipeOpen: false })} />);

      const section = screen.getByTestId('meal-slot-breakfast');
      const draggable = section.querySelector('[class*="bg-card"]') as HTMLElement;

      expect(draggable.style.transform).toBe('translateX(0)');
    });
  });

  describe('confirmation modal', () => {
    it('tap Xóa button shows ConfirmationModal', async () => {
      const user = userEvent.setup();
      render(<MealSlot {...makeProps()} />);

      expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();

      await user.click(screen.getByLabelText('Xóa bữa Sáng'));

      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Xóa bữa Sáng?');
      expect(screen.getByTestId('modal-message')).toHaveTextContent('Tất cả món ăn trong bữa Sáng sẽ bị xóa.');
    });

    it('confirm clear calls onClearMeal + onSwipeClose', async () => {
      const user = userEvent.setup();
      const onClearMeal = vi.fn();
      const onSwipeClose = vi.fn();
      render(<MealSlot {...makeProps({ onClearMeal, onSwipeClose })} />);

      await user.click(screen.getByLabelText('Xóa bữa Sáng'));
      await user.click(screen.getByTestId('modal-confirm'));

      expect(onClearMeal).toHaveBeenCalledOnce();
      expect(onSwipeClose).toHaveBeenCalledOnce();
    });

    it('cancel clear closes modal without calling onClearMeal', async () => {
      const user = userEvent.setup();
      const onClearMeal = vi.fn();
      render(<MealSlot {...makeProps({ onClearMeal })} />);

      await user.click(screen.getByLabelText('Xóa bữa Sáng'));
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();

      await user.click(screen.getByTestId('modal-cancel'));
      expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
      expect(onClearMeal).not.toHaveBeenCalled();
    });

    it('modal has correct confirm/cancel labels', async () => {
      const user = userEvent.setup();
      render(<MealSlot {...makeProps()} />);

      await user.click(screen.getByLabelText('Xóa bữa Sáng'));

      expect(screen.getByTestId('modal-confirm')).toHaveTextContent('Xóa');
      expect(screen.getByTestId('modal-cancel')).toHaveTextContent('Hủy');
    });
  });

  describe('prefers-reduced-motion', () => {
    it('uses 0ms transition when prefers-reduced-motion is active', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: true,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { rerender } = render(<MealSlot {...makeProps({ isSwipeOpen: true })} />);
      rerender(<MealSlot {...makeProps({ isSwipeOpen: false })} />);

      const section = screen.getByTestId('meal-slot-breakfast');
      const draggable = section.querySelector('[class*="bg-card"]') as HTMLElement;

      expect(draggable.style.transform).toBe('translateX(0)');
      expect(draggable.style.transition).toBe('');
    });
  });

  describe('backward compatibility', () => {
    it('works without swipe props (all optional)', () => {
      const props: MealSlotProps = {
        type: 'breakfast',
        slot: FILLED_SLOT,
        dishes: SAMPLE_DISHES,
        onEdit: vi.fn(),
      };
      render(<MealSlot {...props} />);

      expect(screen.getByTestId('meal-slot-breakfast')).toBeInTheDocument();
      expect(screen.getByText('Trứng ốp la')).toBeInTheDocument();
    });

    it('renders existing content correctly with swipe wrapper', () => {
      render(<MealSlot {...makeProps()} />);

      expect(screen.getByText('Sáng')).toBeInTheDocument();
      expect(screen.getByText('487 kcal · 38g')).toBeInTheDocument();
      expect(screen.getByText('Trứng ốp la')).toBeInTheDocument();
      expect(screen.getByText('Yến mạch sữa chua')).toBeInTheDocument();
      expect(screen.getByText(/P 38g/)).toBeInTheDocument();
      expect(screen.getByText(/F 15g/)).toBeInTheDocument();
      expect(screen.getByText(/C 67g/)).toBeInTheDocument();
    });

    it('edit button still works in swipe wrapper', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(<MealSlot {...makeProps({ onEdit })} />);

      await user.click(screen.getByLabelText('Sửa Sáng'));
      expect(onEdit).toHaveBeenCalledOnce();
    });
  });
});

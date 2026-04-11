import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'calendar.budgetStripTitle': 'Dinh dưỡng hôm nay',
        'calendar.budgetSetupLabel': 'Chưa thiết lập mục tiêu',
        'calendar.budgetSetupCta': 'Thiết lập',
        'calendar.budgetGoalReached': 'Đã đạt mục tiêu! 🎉',
        'calendar.budgetRemaining': 'Còn: {{value}} {{unit}}',
        'calendar.budgetOverflow': 'Vượt: {{value}} {{unit}}',
        'nutrition.proteinNudge': 'Còn thiếu {{amount}}g protein — thêm {{suggestion}}?',
        'nutrition.proteinNudgeSuggestions': 'ức gà, cá hồi hoặc trứng',
        'nutrition.calorieNudge': 'Còn {{amount}} kcal — thêm bữa phụ nhẹ hoặc snack?',
      };
      let text = map[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{{${k}}}`, String(v));
        }
      }
      return text;
    },
  }),
}));

import { MiniNutritionBar, MiniNutritionBarProps } from '../components/schedule/MiniNutritionBar';
import { DayNutritionSummary } from '../types';

function makeDayNutrition(
  overrides?: Partial<Record<'breakfast' | 'lunch' | 'dinner', Partial<DayNutritionSummary['breakfast']>>>,
): DayNutritionSummary {
  const defaults = { dishIds: [], calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
  return {
    breakfast: { ...defaults, ...overrides?.breakfast },
    lunch: { ...defaults, ...overrides?.lunch },
    dinner: { ...defaults, ...overrides?.dinner },
  };
}

function makeProps(overrides: Partial<MiniNutritionBarProps> = {}): MiniNutritionBarProps {
  return {
    dayNutrition: makeDayNutrition({
      breakfast: { calories: 487, protein: 38, fat: 15, carbs: 67 },
      lunch: { calories: 510, protein: 70, fat: 12, carbs: 40 },
      dinner: { calories: 330, protein: 62, fat: 15, carbs: 18 },
    }),
    targetCalories: 2091,
    targetProtein: 170,
    onSwitchToNutrition: vi.fn(),
    ...overrides,
  };
}

describe('MiniNutritionBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calorie display', () => {
    it('shows total calories and target', () => {
      render(<MiniNutritionBar {...makeProps()} />);
      expect(screen.getByText(/1327\/2091 kcal/)).toBeInTheDocument();
    });

    it('shows remaining calories when under target', () => {
      render(<MiniNutritionBar {...makeProps()} />);
      expect(screen.getByTestId('mini-remaining-cal')).toHaveTextContent('Còn: 764 kcal');
    });

    it('shows over calories when exceeding target', () => {
      const props = makeProps({ targetCalories: 1000 });
      render(<MiniNutritionBar {...props} />);
      expect(screen.getByTestId('mini-remaining-cal')).toHaveTextContent('Vượt: 327 kcal');
    });
  });

  describe('protein display', () => {
    it('shows total protein and target', () => {
      render(<MiniNutritionBar {...makeProps()} />);
      expect(screen.getByText(/170\/170g Pro/)).toBeInTheDocument();
    });

    it('shows remaining protein', () => {
      render(<MiniNutritionBar {...makeProps()} />);
      expect(screen.getByTestId('mini-remaining-pro')).toHaveTextContent('Còn: 0 g');
    });

    it('shows over protein when exceeding target', () => {
      const props = makeProps({ targetProtein: 100 });
      render(<MiniNutritionBar {...props} />);
      expect(screen.getByTestId('mini-remaining-pro')).toHaveTextContent('Vượt: 70 g');
    });
  });

  describe('macro pills (P/F/C)', () => {
    it('renders macro pills with all 3 macros when data exists', () => {
      render(<MiniNutritionBar {...makeProps()} />);
      const pills = screen.getByTestId('mini-macro-pills');
      expect(pills).toBeInTheDocument();
      expect(pills).toHaveTextContent('P 170g');
      expect(pills).toHaveTextContent('F 42g');
      expect(pills).toHaveTextContent('C 125g');
    });

    it('applies correct color classes to macro pill text', () => {
      render(<MiniNutritionBar {...makeProps()} />);
      const pills = screen.getByTestId('mini-macro-pills');
      const spans = pills.querySelectorAll('span');
      expect(spans[0].className).toContain('text-macro-protein');
      expect(spans[1].className).toContain('text-macro-fat');
      expect(spans[2].className).toContain('text-macro-carbs');
    });

    it('does not render macro pills when all values are zero', () => {
      const props = makeProps({
        dayNutrition: makeDayNutrition(),
      });
      render(<MiniNutritionBar {...props} />);
      expect(screen.queryByTestId('mini-macro-pills')).not.toBeInTheDocument();
    });
  });

  describe('progress bars', () => {
    it('renders calorie progress bar', () => {
      render(<MiniNutritionBar {...makeProps()} />);
      const bar = screen.getByTestId('mini-cal-bar');
      expect(bar).toBeInTheDocument();
      expect(bar.style.width).toBe('63%');
    });

    it('renders protein progress bar', () => {
      render(<MiniNutritionBar {...makeProps()} />);
      const bar = screen.getByTestId('mini-pro-bar');
      expect(bar).toBeInTheDocument();
      expect(bar.style.width).toBe('100%');
    });

    it('caps progress bar at 100%', () => {
      const props = makeProps({ targetCalories: 100 });
      render(<MiniNutritionBar {...props} />);
      const bar = screen.getByTestId('mini-cal-bar');
      expect(bar.style.width).toBe('100%');
    });
  });

  describe('interaction', () => {
    it('calls onSwitchToNutrition when clicked', async () => {
      const user = userEvent.setup();
      const onSwitchToNutrition = vi.fn();
      render(<MiniNutritionBar {...makeProps({ onSwitchToNutrition })} />);
      await user.click(screen.getByTestId('mini-nutrition-bar'));
      expect(onSwitchToNutrition).toHaveBeenCalledOnce();
    });
  });

  describe('nutrition nudge', () => {
    it('shows protein nudge when deficit > 30g and has intake', () => {
      const props = makeProps({
        dayNutrition: makeDayNutrition({
          breakfast: { calories: 300, protein: 20, fat: 10, carbs: 40 },
        }),
        targetProtein: 170,
      });
      render(<MiniNutritionBar {...props} />);
      const nudge = screen.getByTestId('mini-nutrition-nudge');
      expect(nudge).toHaveTextContent('Còn thiếu 150g protein — thêm ức gà, cá hồi hoặc trứng?');
    });

    it('hides protein nudge when deficit is exactly 30g', () => {
      const props = makeProps({
        dayNutrition: makeDayNutrition({
          breakfast: { calories: 1900, protein: 140, fat: 10, carbs: 40 },
        }),
        targetCalories: 2000,
        targetProtein: 170,
      });
      render(<MiniNutritionBar {...props} />);
      expect(screen.queryByTestId('mini-nutrition-nudge')).not.toBeInTheDocument();
    });

    it('hides protein nudge when deficit <= 30g', () => {
      const props = makeProps({
        dayNutrition: makeDayNutrition({
          breakfast: { calories: 1900, protein: 150, fat: 10, carbs: 40 },
        }),
        targetCalories: 2000,
        targetProtein: 170,
      });
      render(<MiniNutritionBar {...props} />);
      expect(screen.queryByTestId('mini-nutrition-nudge')).not.toBeInTheDocument();
    });

    it('shows calorie nudge when calorie deficit > 200 kcal and protein deficit <= 30g', () => {
      const props = makeProps({
        dayNutrition: makeDayNutrition({
          breakfast: { calories: 300, protein: 150, fat: 10, carbs: 40 },
        }),
        targetCalories: 2000,
        targetProtein: 170,
      });
      render(<MiniNutritionBar {...props} />);
      const nudge = screen.getByTestId('mini-nutrition-nudge');
      expect(nudge).toHaveTextContent('Còn 1700 kcal — thêm bữa phụ nhẹ hoặc snack?');
    });

    it('protein nudge takes priority over calorie nudge when both qualify', () => {
      const props = makeProps({
        dayNutrition: makeDayNutrition({
          breakfast: { calories: 300, protein: 20, fat: 10, carbs: 40 },
        }),
        targetCalories: 2000,
        targetProtein: 170,
      });
      render(<MiniNutritionBar {...props} />);
      const nudge = screen.getByTestId('mini-nutrition-nudge');
      expect(nudge).toHaveTextContent('protein');
      expect(nudge).not.toHaveTextContent('bữa phụ');
    });

    it('hides nudge when no intake data (all zeros)', () => {
      const props = makeProps({
        dayNutrition: makeDayNutrition(),
        targetProtein: 170,
        targetCalories: 2000,
      });
      render(<MiniNutritionBar {...props} />);
      expect(screen.queryByTestId('mini-nutrition-nudge')).not.toBeInTheDocument();
    });

    it('hides nudge when remaining is negative (over target)', () => {
      const props = makeProps({
        targetProtein: 100,
        targetCalories: 1000,
      });
      render(<MiniNutritionBar {...props} />);
      expect(screen.queryByTestId('mini-nutrition-nudge')).not.toBeInTheDocument();
    });

    it('hides calorie nudge when deficit is exactly 200 kcal', () => {
      const props = makeProps({
        dayNutrition: makeDayNutrition({
          breakfast: { calories: 1800, protein: 150, fat: 10, carbs: 40 },
        }),
        targetCalories: 2000,
        targetProtein: 170,
      });
      render(<MiniNutritionBar {...props} />);
      expect(screen.queryByTestId('mini-nutrition-nudge')).not.toBeInTheDocument();
    });

    it('includes nudge text in aria-label when nudge is visible', () => {
      const props = makeProps({
        dayNutrition: makeDayNutrition({
          breakfast: { calories: 300, protein: 20, fat: 10, carbs: 40 },
        }),
        targetProtein: 170,
      });
      render(<MiniNutritionBar {...props} />);
      const button = screen.getByTestId('mini-nutrition-bar');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Còn thiếu 150g protein'));
    });

    it('uses standard aria-label when no nudge is shown', () => {
      const props = makeProps({
        dayNutrition: makeDayNutrition({
          breakfast: { calories: 1900, protein: 150, fat: 10, carbs: 40 },
        }),
        targetCalories: 2000,
        targetProtein: 170,
      });
      render(<MiniNutritionBar {...props} />);
      const button = screen.getByTestId('mini-nutrition-bar');
      expect(button).toHaveAttribute('aria-label', 'Dinh dưỡng hôm nay');
    });
  });

  describe('edge cases', () => {
    it('handles zero target calories safely', () => {
      const props = makeProps({ targetCalories: 0 });
      render(<MiniNutritionBar {...props} />);
      expect(screen.getByTestId('budget-setup-label')).toHaveTextContent('Chưa thiết lập mục tiêu');
    });

    it('handles non-finite target calories', () => {
      const props = makeProps({ targetCalories: NaN });
      render(<MiniNutritionBar {...props} />);
      expect(screen.getByTestId('budget-setup-label')).toHaveTextContent('Chưa thiết lập mục tiêu');
    });

    it('handles non-finite target protein', () => {
      const props = makeProps({ targetProtein: Infinity });
      render(<MiniNutritionBar {...props} />);
      expect(screen.getByText(/170\/0g Pro/)).toBeInTheDocument();
    });
  });
});

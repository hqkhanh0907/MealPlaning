import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'calendar.nutritionOverviewLabel': 'Tổng quan dinh dưỡng',
        'calendar.nutritionCalorieLabel': 'Năng lượng',
        'calendar.nutritionProteinLabel': 'Protein',
        'calendar.nutritionCaloriesOut': 'Tiêu hao',
        'calendar.nutritionNet': 'Ròng',
        'calendar.nutritionSetupTitle': 'Thiết lập mục tiêu dinh dưỡng',
        'calendar.nutritionSetupDesc': 'Thiết lập hồ sơ sức khỏe và mục tiêu để theo dõi dinh dưỡng',
        'calendar.nutritionSetupAction': 'Thiết lập ngay',
        'calendar.nutritionProteinNotConfigured': 'Chưa thiết lập',
        'summary.remaining': 'Còn lại: {{value}} {{unit}}',
        'summary.over': 'Vượt: {{value}} {{unit}}',
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

vi.mock('../components/shared/EmptyState', () => ({
  EmptyState: ({
    title,
    description,
    actionLabel,
    onAction,
  }: {
    icon?: unknown;
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => (
    <div data-testid="empty-state">
      {title && <p>{title}</p>}
      {description && <p>{description}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  ),
}));

import { NutritionOverview, NutritionOverviewProps } from '../components/schedule/NutritionOverview';

function makeProps(overrides: Partial<NutritionOverviewProps> = {}): NutritionOverviewProps {
  return {
    eaten: 1327,
    target: 2091,
    protein: 170,
    targetProtein: 150,
    fat: 42,
    carbs: 125,
    caloriesOut: null,
    isSetup: false,
    onSetup: vi.fn(),
    ...overrides,
  };
}

describe('NutritionOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normal render with all props', () => {
    it('renders as single card with correct styling and aria', () => {
      render(<NutritionOverview {...makeProps()} />);
      const region = screen.getByRole('region', { name: 'Tổng quan dinh dưỡng' });
      expect(region).toBeInTheDocument();
      expect(region).toHaveClass('bg-card', 'rounded-2xl', 'border', 'p-6', 'shadow-sm');
    });

    it('renders calorie section with eaten/target text', () => {
      render(<NutritionOverview {...makeProps()} />);
      expect(screen.getByText('1327/2091 kcal')).toBeInTheDocument();
    });

    it('renders calorie progress bar with bg-energy', () => {
      render(<NutritionOverview {...makeProps()} />);
      const bar = screen.getByTestId('calorie-bar');
      expect(bar).toBeInTheDocument();
      expect(bar).toHaveClass('bg-energy');
      expect(bar.style.width).toBe('63%');
    });

    it('renders calorie remaining in text-primary when positive', () => {
      render(<NutritionOverview {...makeProps()} />);
      const remaining = screen.getByTestId('calorie-remaining');
      expect(remaining).toHaveTextContent('Còn lại: 764 kcal');
      expect(remaining).toHaveClass('text-primary');
    });

    it('renders protein section with eaten/target text', () => {
      render(<NutritionOverview {...makeProps()} />);
      expect(screen.getByText('170/150g')).toBeInTheDocument();
    });

    it('renders protein progress bar with bg-macro-protein', () => {
      render(<NutritionOverview {...makeProps()} />);
      const bar = screen.getByTestId('protein-bar');
      expect(bar).toBeInTheDocument();
      expect(bar).toHaveClass('bg-macro-protein');
    });

    it('renders macro donut SVG with correct dimensions', () => {
      render(<NutritionOverview {...makeProps()} />);
      const donut = screen.getByTestId('macro-donut');
      expect(donut).toBeInTheDocument();
      expect(donut).toHaveAttribute('viewBox', '0 0 100 100');
      expect(donut).toHaveClass('h-12', 'w-12');
    });

    it('renders P/F/C legend with grams and percentages', () => {
      render(<NutritionOverview {...makeProps()} />);
      const pLegend = screen.getByTestId('macro-legend-protein');
      expect(pLegend).toHaveTextContent('P');
      expect(pLegend).toHaveTextContent('170g');

      const fLegend = screen.getByTestId('macro-legend-fat');
      expect(fLegend).toHaveTextContent('F');
      expect(fLegend).toHaveTextContent('42g');

      const cLegend = screen.getByTestId('macro-legend-carbs');
      expect(cLegend).toHaveTextContent('C');
      expect(cLegend).toHaveTextContent('125g');
    });

    it('renders correct number of arcs in SVG donut', () => {
      render(<NutritionOverview {...makeProps()} />);
      const donut = screen.getByTestId('macro-donut');
      const circles = donut.querySelectorAll('circle');
      expect(circles).toHaveLength(3);
    });
  });

  describe('calorie overflow (eaten > target)', () => {
    it('shows overflow text with text-destructive', () => {
      render(<NutritionOverview {...makeProps({ eaten: 2500, target: 2091 })} />);
      const remaining = screen.getByTestId('calorie-remaining');
      expect(remaining).toHaveTextContent('Vượt: 409 kcal');
      expect(remaining).toHaveClass('text-destructive');
    });

    it('caps progress bar at 100%', () => {
      render(<NutritionOverview {...makeProps({ eaten: 2500, target: 2091 })} />);
      const bar = screen.getByTestId('calorie-bar');
      expect(bar.style.width).toBe('100%');
    });
  });

  describe('caloriesOut present', () => {
    it('shows Tiêu hao and Ròng rows when caloriesOut is not null', () => {
      render(<NutritionOverview {...makeProps({ caloriesOut: 300 })} />);
      const section = screen.getByTestId('energy-out-section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveTextContent('Tiêu hao');
      expect(section).toHaveTextContent('300 kcal');
      expect(section).toHaveTextContent('Ròng');
      expect(section).toHaveTextContent('1027 kcal');
    });

    it('shows caloriesOut=0 row', () => {
      render(<NutritionOverview {...makeProps({ caloriesOut: 0 })} />);
      const section = screen.getByTestId('energy-out-section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveTextContent('0 kcal');
    });
  });

  describe('caloriesOut null/undefined', () => {
    it('hides energy-out section when caloriesOut is null', () => {
      render(<NutritionOverview {...makeProps({ caloriesOut: null })} />);
      expect(screen.queryByTestId('energy-out-section')).not.toBeInTheDocument();
    });

    it('hides energy-out section when caloriesOut is undefined', () => {
      render(<NutritionOverview {...makeProps({ caloriesOut: undefined })} />);
      expect(screen.queryByTestId('energy-out-section')).not.toBeInTheDocument();
    });
  });

  describe('isSetup=true (EmptyState)', () => {
    it('renders EmptyState with setup content', () => {
      const onSetup = vi.fn();
      render(<NutritionOverview {...makeProps({ isSetup: true, onSetup })} />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Thiết lập mục tiêu dinh dưỡng')).toBeInTheDocument();
      expect(screen.getByText('Thiết lập hồ sơ sức khỏe và mục tiêu để theo dõi dinh dưỡng')).toBeInTheDocument();
    });

    it('fires onSetup when CTA is clicked', async () => {
      const user = userEvent.setup();
      const onSetup = vi.fn();
      render(<NutritionOverview {...makeProps({ isSetup: true, onSetup })} />);
      await user.click(screen.getByText('Thiết lập ngay'));
      expect(onSetup).toHaveBeenCalledOnce();
    });

    it('still renders within region container', () => {
      render(<NutritionOverview {...makeProps({ isSetup: true })} />);
      expect(screen.getByRole('region', { name: 'Tổng quan dinh dưỡng' })).toBeInTheDocument();
    });

    it('does not render calorie or protein sections', () => {
      render(<NutritionOverview {...makeProps({ isSetup: true })} />);
      expect(screen.queryByTestId('nutrition-calorie-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nutrition-protein-section')).not.toBeInTheDocument();
    });
  });

  describe('targetProtein <= 0 (not configured)', () => {
    it('shows "Chưa thiết lập" when targetProtein is 0', () => {
      render(<NutritionOverview {...makeProps({ targetProtein: 0 })} />);
      expect(screen.getByTestId('protein-not-configured')).toHaveTextContent('Chưa thiết lập');
      expect(screen.queryByTestId('protein-bar')).not.toBeInTheDocument();
    });

    it('shows "Chưa thiết lập" when targetProtein is negative', () => {
      render(<NutritionOverview {...makeProps({ targetProtein: -10 })} />);
      expect(screen.getByTestId('protein-not-configured')).toBeInTheDocument();
    });
  });

  describe('SVG donut proportions', () => {
    it('renders donut arcs with correct stroke properties', () => {
      render(<NutritionOverview {...makeProps({ protein: 100, fat: 50, carbs: 100 })} />);
      const donut = screen.getByTestId('macro-donut');
      const circles = donut.querySelectorAll('circle');

      circles.forEach(circle => {
        expect(circle.getAttribute('r')).toBe('35');
        expect(circle.getAttribute('stroke-width')).toBe('14');
        expect(circle.getAttribute('cx')).toBe('50');
        expect(circle.getAttribute('cy')).toBe('50');
        expect(circle.getAttribute('fill')).toBe('none');
      });
    });

    it('hides donut when all macros are zero', () => {
      render(<NutritionOverview {...makeProps({ protein: 0, fat: 0, carbs: 0 })} />);
      expect(screen.queryByTestId('macro-donut')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nutrition-macro-section')).not.toBeInTheDocument();
    });

    it('shows donut with single macro when others are zero', () => {
      render(<NutritionOverview {...makeProps({ protein: 100, fat: 0, carbs: 0 })} />);
      const donut = screen.getByTestId('macro-donut');
      expect(donut).toBeInTheDocument();
      const pLegend = screen.getByTestId('macro-legend-protein');
      expect(pLegend).toHaveTextContent('100%');
    });
  });

  describe('all zero values (defensive)', () => {
    it('renders without crashing when all values are zero', () => {
      render(
        <NutritionOverview
          {...makeProps({
            eaten: 0,
            target: 0,
            protein: 0,
            targetProtein: 0,
            fat: 0,
            carbs: 0,
            caloriesOut: null,
          })}
        />,
      );
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByText('0/0 kcal')).toBeInTheDocument();
    });

    it('shows protein not configured when targetProtein is 0', () => {
      render(
        <NutritionOverview {...makeProps({ eaten: 0, target: 0, protein: 0, targetProtein: 0, fat: 0, carbs: 0 })} />,
      );
      expect(screen.getByTestId('protein-not-configured')).toBeInTheDocument();
    });

    it('calorie bar shows 0% width when target is 0', () => {
      render(
        <NutritionOverview {...makeProps({ eaten: 0, target: 0, protein: 0, targetProtein: 0, fat: 0, carbs: 0 })} />,
      );
      const bar = screen.getByTestId('calorie-bar');
      expect(bar.style.width).toBe('0%');
    });
  });

  describe('aria roles and labels', () => {
    it('has role="region" with correct aria-label', () => {
      render(<NutritionOverview {...makeProps()} />);
      const region = screen.getByRole('region', { name: 'Tổng quan dinh dưỡng' });
      expect(region).toBeInTheDocument();
    });

    it('has native <progress> for calorie bar with correct values', () => {
      render(<NutritionOverview {...makeProps()} />);
      const bars = screen.getAllByRole('progressbar');
      const calBar = bars[0];
      expect(calBar).toHaveAttribute('value', '1327');
      expect(calBar).toHaveAttribute('max', '2091');
      expect(calBar).toHaveAttribute('aria-label', 'Năng lượng');
    });

    it('has native <progress> for protein bar with correct values', () => {
      render(<NutritionOverview {...makeProps()} />);
      const bars = screen.getAllByRole('progressbar');
      const proBar = bars[1];
      expect(proBar).toHaveAttribute('value', '170');
      expect(proBar).toHaveAttribute('max', '150');
      expect(proBar).toHaveAttribute('aria-label', 'Protein');
    });

    it('has aria-hidden on SVG donut', () => {
      render(<NutritionOverview {...makeProps()} />);
      const donut = screen.getByTestId('macro-donut');
      expect(donut).toHaveAttribute('aria-hidden', 'true');
    });

    it('has aria-hidden on icons', () => {
      render(<NutritionOverview {...makeProps()} />);
      const section = screen.getByTestId('nutrition-calorie-section');
      const svg = section.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('protein overflow', () => {
    it('shows overflow text with text-destructive when protein exceeds target', () => {
      render(<NutritionOverview {...makeProps({ protein: 200, targetProtein: 150 })} />);
      const remaining = screen.getByTestId('protein-remaining');
      expect(remaining).toHaveTextContent('Vượt: 50 g');
      expect(remaining).toHaveClass('text-destructive');
    });

    it('shows remaining with text-primary when protein under target', () => {
      render(<NutritionOverview {...makeProps({ protein: 100, targetProtein: 150 })} />);
      const remaining = screen.getByTestId('protein-remaining');
      expect(remaining).toHaveTextContent('Còn lại: 50 g');
      expect(remaining).toHaveClass('text-primary');
    });
  });

  describe('edge cases', () => {
    it('renders macro donut percentage labels correctly', () => {
      // protein: 100g × 4 = 400cal, fat: 0g, carbs: 100g × 4 = 400cal → 50/50 split
      render(<NutritionOverview {...makeProps({ protein: 100, fat: 0, carbs: 100 })} />);
      const pLegend = screen.getByTestId('macro-legend-protein');
      expect(pLegend).toHaveTextContent('50%');
      const cLegend = screen.getByTestId('macro-legend-carbs');
      expect(cLegend).toHaveTextContent('50%');
    });

    it('handles large values without crash', () => {
      render(
        <NutritionOverview
          {...makeProps({ eaten: 99999, target: 99999, protein: 9999, targetProtein: 9999, fat: 9999, carbs: 9999 })}
        />,
      );
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByText('99999/99999 kcal')).toBeInTheDocument();
    });

    it('renders calorie section label text', () => {
      render(<NutritionOverview {...makeProps()} />);
      expect(screen.getByText('Năng lượng')).toBeInTheDocument();
    });

    it('renders protein section label text', () => {
      render(<NutritionOverview {...makeProps()} />);
      expect(screen.getByText('Protein')).toBeInTheDocument();
    });
  });
});

import { render, screen } from '@testing-library/react';

import { MacroDonutChart } from '../components/nutrition/MacroDonutChart';

describe('MacroDonutChart', () => {
  const baseProps = {
    proteinG: 100,
    fatG: 50,
    carbsG: 200,
  };

  it('renders SVG donut', () => {
    render(<MacroDonutChart {...baseProps} />);

    const chart = screen.getByTestId('macro-donut-chart');
    expect(chart).toBeInTheDocument();

    const svg = chart.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-label');
  });

  it('shows 3 arcs for macros', () => {
    render(<MacroDonutChart {...baseProps} />);

    expect(screen.getByTestId('arc-protein')).toBeInTheDocument();
    expect(screen.getByTestId('arc-fat')).toBeInTheDocument();
    expect(screen.getByTestId('arc-carbs')).toBeInTheDocument();
  });

  it('center shows total calories', () => {
    render(<MacroDonutChart {...baseProps} />);

    // protein: 100*4=400, fat: 50*9=450, carbs: 200*4=800 → total: 1650
    expect(screen.getByTestId('donut-total-cal')).toHaveTextContent('1650');
  });

  it('handles zero values', () => {
    render(<MacroDonutChart proteinG={0} fatG={0} carbsG={0} />);

    expect(screen.getByTestId('donut-total-cal')).toHaveTextContent('0');
    expect(screen.queryByTestId('arc-protein')).not.toBeInTheDocument();
    expect(screen.queryByTestId('arc-fat')).not.toBeInTheDocument();
    expect(screen.queryByTestId('arc-carbs')).not.toBeInTheDocument();
  });

  it('shows hint text when all values are zero', () => {
    render(<MacroDonutChart proteinG={0} fatG={0} carbsG={0} />);

    expect(screen.getByTestId('donut-no-data-hint')).toBeInTheDocument();
    expect(screen.getByTestId('donut-no-data-hint')).toHaveTextContent('Chưa có dữ liệu');
  });

  it('does not show hint text when values are non-zero', () => {
    render(<MacroDonutChart proteinG={100} fatG={50} carbsG={200} />);

    expect(screen.queryByTestId('donut-no-data-hint')).not.toBeInTheDocument();
  });

  it('renders with custom size', () => {
    render(<MacroDonutChart {...baseProps} size={200} />);

    const svg = screen.getByTestId('macro-donut-chart').querySelector('svg');
    expect(svg).toHaveAttribute('width', '200');
    expect(svg).toHaveAttribute('height', '200');
  });

  it('uses default size of 120', () => {
    render(<MacroDonutChart {...baseProps} />);

    const svg = screen.getByTestId('macro-donut-chart').querySelector('svg');
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('height', '120');
  });

  it('handles partial zero values showing only non-zero arcs', () => {
    render(<MacroDonutChart proteinG={50} fatG={0} carbsG={100} />);

    expect(screen.getByTestId('arc-protein')).toBeInTheDocument();
    expect(screen.queryByTestId('arc-fat')).not.toBeInTheDocument();
    expect(screen.getByTestId('arc-carbs')).toBeInTheDocument();
    // protein: 50*4=200, carbs: 100*4=400 → total: 600
    expect(screen.getByTestId('donut-total-cal')).toHaveTextContent('600');
  });

  it('has accessible aria-label with macro details', () => {
    render(<MacroDonutChart {...baseProps} />);

    const svg = screen.getByTestId('macro-donut-chart').querySelector('svg');
    const label = svg?.getAttribute('aria-label');
    expect(label).toContain('100');
    expect(label).toContain('50');
    expect(label).toContain('200');
  });
});

import { render, screen } from '@testing-library/react';

import { ProteinProgress } from '../features/dashboard/components/ProteinProgress';

describe('ProteinProgress', () => {
  it('renders with correct display text', () => {
    render(<ProteinProgress current={142} target={166} />);

    expect(screen.getByTestId('protein-display')).toHaveTextContent('142g / 166g');
  });

  it('has minimum height of 48px', () => {
    render(<ProteinProgress current={142} target={166} />);

    expect(screen.getByTestId('protein-progress')).toHaveStyle({
      minHeight: '48px',
    });
  });

  // --- Bar width calculation ---

  it('calculates bar width correctly', () => {
    render(<ProteinProgress current={80} target={100} />);

    expect(screen.getByTestId('protein-bar')).toHaveStyle({ width: '80%' });
  });

  it('calculates bar width at 50%', () => {
    render(<ProteinProgress current={50} target={100} />);

    expect(screen.getByTestId('protein-bar')).toHaveStyle({ width: '50%' });
  });

  it('caps bar at 100% when exceeded', () => {
    render(<ProteinProgress current={120} target={100} />);

    expect(screen.getByTestId('protein-bar')).toHaveStyle({ width: '100%' });
  });

  it('shows 0% bar when current is zero', () => {
    render(<ProteinProgress current={0} target={100} />);

    expect(screen.getByTestId('protein-bar')).toHaveStyle({ width: '0%' });
  });

  // --- Color by percentage ---

  it('shows emerald bar when ≥80%', () => {
    render(<ProteinProgress current={85} target={100} />);

    expect(screen.getByTestId('protein-bar').className).toContain('primary');
  });

  it('shows emerald bar at exactly 80%', () => {
    render(<ProteinProgress current={80} target={100} />);

    expect(screen.getByTestId('protein-bar').className).toContain('primary');
  });

  it('shows amber bar when 50-79%', () => {
    render(<ProteinProgress current={60} target={100} />);

    expect(screen.getByTestId('protein-bar').className).toContain('amber');
  });

  it('shows amber bar at exactly 50%', () => {
    render(<ProteinProgress current={50} target={100} />);

    expect(screen.getByTestId('protein-bar').className).toContain('amber');
  });

  it('shows slate bar when <50%', () => {
    render(<ProteinProgress current={30} target={100} />);

    expect(screen.getByTestId('protein-bar').className).toContain('slate');
  });

  it('shows emerald bar at 100%', () => {
    render(<ProteinProgress current={100} target={100} />);

    expect(screen.getByTestId('protein-bar').className).toContain('primary');
  });

  // --- Suggestion text by deficit range ---

  it('shows met goal message when target reached', () => {
    render(<ProteinProgress current={170} target={166} />);

    expect(screen.getByTestId('protein-suggestion')).toHaveTextContent('Đã đạt mục tiêu protein!');
  });

  it('shows met goal message when exactly at target', () => {
    render(<ProteinProgress current={166} target={166} />);

    expect(screen.getByTestId('protein-suggestion')).toHaveTextContent('Đã đạt mục tiêu protein!');
  });

  it('shows near goal message when deficit ≤20g', () => {
    render(<ProteinProgress current={150} target={166} />);

    expect(screen.getByTestId('protein-suggestion')).toHaveTextContent('Gần đạt mục tiêu protein');
  });

  it('shows near goal message at deficit exactly 20g', () => {
    render(<ProteinProgress current={146} target={166} />);

    expect(screen.getByTestId('protein-suggestion')).toHaveTextContent('Gần đạt mục tiêu protein');
  });

  it('shows food suggestion when deficit 20-50g', () => {
    render(<ProteinProgress current={130} target={166} />);

    const suggestion = screen.getByTestId('protein-suggestion');
    expect(suggestion.textContent).toMatch(/Gợi ý/);
  });

  it('shows food suggestion at deficit exactly 50g', () => {
    render(<ProteinProgress current={116} target={166} />);

    const suggestion = screen.getByTestId('protein-suggestion');
    expect(suggestion.textContent).toMatch(/Gợi ý/);
  });

  it('shows significant deficit message when deficit >50g', () => {
    render(<ProteinProgress current={50} target={166} />);

    expect(screen.getByTestId('protein-suggestion')).toHaveTextContent('Cần bổ sung thêm protein');
  });

  // --- Edge cases ---

  it('handles zero current', () => {
    render(<ProteinProgress current={0} target={100} />);

    expect(screen.getByTestId('protein-display')).toHaveTextContent('0g / 100g');
    expect(screen.getByTestId('protein-bar')).toHaveStyle({ width: '0%' });
    expect(screen.getByTestId('protein-suggestion')).toHaveTextContent('Cần bổ sung thêm protein');
  });

  it('handles zero target gracefully', () => {
    render(<ProteinProgress current={50} target={0} />);

    expect(screen.getByTestId('protein-progress')).toBeInTheDocument();
    expect(screen.getByTestId('protein-display')).toHaveTextContent('50g / 0g');
  });

  it('handles both zero values', () => {
    render(<ProteinProgress current={0} target={0} />);

    expect(screen.getByTestId('protein-progress')).toBeInTheDocument();
    expect(screen.getByTestId('protein-display')).toHaveTextContent('0g / 0g');
    expect(screen.getByTestId('protein-suggestion')).toHaveTextContent('Đã đạt mục tiêu protein!');
  });

  // --- Accessibility ---

  it('has correct accessibility attributes', () => {
    render(<ProteinProgress current={142} target={166} />);

    const container = screen.getByTestId('protein-progress');
    expect(container).toHaveAttribute('aria-valuenow', '142');
    expect(container).toHaveAttribute('aria-valuemin', '0');
    expect(container).toHaveAttribute('aria-valuemax', '166');
  });

  it('has correct aria-label with current, target and suggestion', () => {
    render(<ProteinProgress current={142} target={166} />);

    const container = screen.getByTestId('protein-progress');
    const label = container.getAttribute('aria-label');
    expect(label).toContain('142g');
    expect(label).toContain('166g');
    expect(label).toContain('Protein');
  });

  it('has correct aria-label when goal met', () => {
    render(<ProteinProgress current={170} target={166} />);

    const container = screen.getByTestId('protein-progress');
    const label = container.getAttribute('aria-label');
    expect(label).toContain('Đã đạt mục tiêu protein');
  });

  // --- tabular-nums ---

  it('uses tabular-nums for number display', () => {
    render(<ProteinProgress current={142} target={166} />);

    expect(screen.getByTestId('protein-display').className).toContain('tabular-nums');
  });

  // --- Protein label ---

  it('shows protein label', () => {
    render(<ProteinProgress current={142} target={166} />);

    const container = screen.getByTestId('protein-progress');
    expect(container).toHaveTextContent('Protein');
  });
});

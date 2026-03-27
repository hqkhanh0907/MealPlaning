import { render, screen, fireEvent } from '@testing-library/react';
import { EnergyBalanceCard } from '../components/nutrition/EnergyBalanceCard';

describe('EnergyBalanceCard', () => {
  const baseProps = {
    caloriesIn: 1800,
    caloriesOut: 300,
    targetCalories: 2000,
    proteinCurrent: 80,
    proteinTarget: 120,
  };

  it('renders calorie in/out/net values', () => {
    render(<EnergyBalanceCard {...baseProps} />);

    expect(screen.getByTestId('calories-in')).toHaveTextContent('1800');
    expect(screen.getByTestId('calories-out')).toHaveTextContent('300');
    expect(screen.getByTestId('net-calories')).toHaveTextContent('1500');
  });

  it('progress bar width proportional to intake', () => {
    render(<EnergyBalanceCard {...baseProps} />);

    const foodBar = screen.getByTestId('bar-food');
    expect(foodBar).toHaveStyle({ width: '90%' });

    const exerciseBar = screen.getByTestId('bar-exercise');
    expect(exerciseBar).toHaveStyle({ width: '15%' });
  });

  it('protein bar shows current/target', () => {
    render(<EnergyBalanceCard {...baseProps} />);

    expect(screen.getByTestId('protein-display')).toHaveTextContent('80/120');
    const proteinBar = screen.getByTestId('protein-bar');
    expect(proteinBar).toHaveStyle({ width: '67%' });
  });

  it('collapsible toggle works', () => {
    render(<EnergyBalanceCard {...baseProps} isCollapsible />);

    const toggle = screen.getByTestId('collapse-toggle');
    expect(screen.getByTestId('calorie-progress-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('collapsed-summary')).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByTestId('calorie-progress-bar')).not.toBeInTheDocument();
    expect(screen.getByTestId('collapsed-summary')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.getByTestId('calorie-progress-bar')).toBeInTheDocument();
  });

  it('collapsed shows single-line summary', () => {
    render(<EnergyBalanceCard {...baseProps} isCollapsible />);

    fireEvent.click(screen.getByTestId('collapse-toggle'));
    const summary = screen.getByTestId('collapsed-summary');
    expect(summary).toHaveTextContent('1800');
    expect(summary).toHaveTextContent('300');
    expect(summary).toHaveTextContent('1500');
  });

  it('zero exercise calories handled', () => {
    render(
      <EnergyBalanceCard
        {...baseProps}
        caloriesOut={0}
      />,
    );

    expect(screen.getByTestId('calories-out')).toHaveTextContent('0');
    expect(screen.getByTestId('net-calories')).toHaveTextContent('1800');
    expect(screen.getByTestId('bar-exercise')).toHaveStyle({ width: '0%' });
  });

  it('does not render toggle when isCollapsible is false', () => {
    render(<EnergyBalanceCard {...baseProps} />);

    expect(screen.queryByTestId('collapse-toggle')).not.toBeInTheDocument();
  });

  it('shows negative remaining when over target', () => {
    render(
      <EnergyBalanceCard
        {...baseProps}
        caloriesIn={2500}
        caloriesOut={0}
      />,
    );

    expect(screen.getByTestId('remaining-display')).toHaveTextContent('-500');
  });

  it('handles zero target calories gracefully', () => {
    render(
      <EnergyBalanceCard
        {...baseProps}
        targetCalories={0}
      />,
    );

    expect(screen.getByTestId('energy-balance-card')).toBeInTheDocument();
  });

  it('handles zero protein target gracefully', () => {
    render(
      <EnergyBalanceCard
        {...baseProps}
        proteinTarget={0}
      />,
    );

    expect(screen.getByTestId('protein-bar')).toBeInTheDocument();
  });

  it('caps progress bar at 100% when over target', () => {
    render(
      <EnergyBalanceCard
        {...baseProps}
        caloriesIn={3000}
        proteinCurrent={200}
      />,
    );

    expect(screen.getByTestId('bar-food')).toHaveStyle({ width: '100%' });
    expect(screen.getByTestId('protein-bar')).toHaveStyle({ width: '100%' });
  });
});

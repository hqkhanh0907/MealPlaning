import { render, screen, fireEvent } from '@testing-library/react';
import { EnergyBalanceMini } from '../components/nutrition/EnergyBalanceMini';

describe('EnergyBalanceMini', () => {
  const baseProps = {
    eaten: 1500,
    burned: 400,
    target: 2000,
  };

  it('renders compact format with min height', () => {
    render(<EnergyBalanceMini {...baseProps} />);

    const container = screen.getByTestId('energy-balance-mini');
    expect(container).toBeInTheDocument();
    expect(container).toHaveStyle({ minHeight: '80px' });
  });

  it('calculates and displays correct net value', () => {
    render(<EnergyBalanceMini {...baseProps} />);

    expect(screen.getByTestId('mini-eaten')).toHaveTextContent('1500');
    expect(screen.getByTestId('mini-burned')).toHaveTextContent('400');
    expect(screen.getByTestId('mini-net')).toHaveTextContent('1100');
  });

  it('shows green color when net is within target ±100kcal', () => {
    render(<EnergyBalanceMini eaten={2050} burned={0} target={2000} />);

    const net = screen.getByTestId('mini-net');
    expect(net.className).toContain('emerald');
  });

  it('shows green color when net equals target exactly', () => {
    render(<EnergyBalanceMini eaten={2000} burned={0} target={2000} />);

    const net = screen.getByTestId('mini-net');
    expect(net.className).toContain('emerald');
  });

  it('shows green color at boundary (target + 100)', () => {
    render(<EnergyBalanceMini eaten={2100} burned={0} target={2000} />);

    const net = screen.getByTestId('mini-net');
    expect(net.className).toContain('emerald');
  });

  it('shows amber color when over target by more than 100kcal', () => {
    render(<EnergyBalanceMini eaten={2200} burned={0} target={2000} />);

    const net = screen.getByTestId('mini-net');
    expect(net.className).toContain('amber');
  });

  it('shows default color when significantly under target', () => {
    render(<EnergyBalanceMini eaten={500} burned={0} target={2000} />);

    const net = screen.getByTestId('mini-net');
    expect(net.className).toContain('slate');
  });

  it('calls onTapDetail when clicked', () => {
    const handler = vi.fn();
    render(<EnergyBalanceMini {...baseProps} onTapDetail={handler} />);

    fireEvent.click(screen.getByTestId('energy-balance-mini'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('calls onTapDetail on Enter key when interactive', () => {
    const handler = vi.fn();
    render(<EnergyBalanceMini {...baseProps} onTapDetail={handler} />);

    const container = screen.getByTestId('energy-balance-mini');
    fireEvent.keyDown(container, { key: 'Enter' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('calls onTapDetail on Space key when interactive', () => {
    const handler = vi.fn();
    render(<EnergyBalanceMini {...baseProps} onTapDetail={handler} />);

    const container = screen.getByTestId('energy-balance-mini');
    fireEvent.keyDown(container, { key: ' ' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('has role=button and tabIndex when onTapDetail provided', () => {
    const handler = vi.fn();
    render(<EnergyBalanceMini {...baseProps} onTapDetail={handler} />);

    const container = screen.getByTestId('energy-balance-mini');
    expect(container).toHaveAttribute('tabindex', '0');
  });

  it('has no role or tabIndex when onTapDetail not provided', () => {
    render(<EnergyBalanceMini {...baseProps} />);

    const container = screen.getByTestId('energy-balance-mini');
    expect(container).not.toHaveAttribute('role');
    expect(container).not.toHaveAttribute('tabindex');
  });

  it('displays labels below each number', () => {
    render(<EnergyBalanceMini {...baseProps} />);

    const container = screen.getByTestId('energy-balance-mini');
    expect(container).toHaveTextContent('Nạp vào');
    expect(container).toHaveTextContent('Tiêu hao');
    expect(container).toHaveTextContent('Cân bằng');
  });

  it('uses tabular-nums for number displays', () => {
    render(<EnergyBalanceMini {...baseProps} />);

    expect(screen.getByTestId('mini-eaten')).toHaveStyle({
      fontVariantNumeric: 'tabular-nums',
    });
    expect(screen.getByTestId('mini-burned')).toHaveStyle({
      fontVariantNumeric: 'tabular-nums',
    });
    expect(screen.getByTestId('mini-net')).toHaveStyle({
      fontVariantNumeric: 'tabular-nums',
    });
  });

  it('handles zero eaten and burned', () => {
    render(<EnergyBalanceMini eaten={0} burned={0} target={2000} />);

    expect(screen.getByTestId('mini-eaten')).toHaveTextContent('0');
    expect(screen.getByTestId('mini-burned')).toHaveTextContent('0');
    expect(screen.getByTestId('mini-net')).toHaveTextContent('0');
  });

  it('handles zero target gracefully', () => {
    render(<EnergyBalanceMini eaten={500} burned={200} target={0} />);

    expect(screen.getByTestId('energy-balance-mini')).toBeInTheDocument();
    expect(screen.getByTestId('mini-net')).toHaveTextContent('300');
  });

  it('handles exceeded target', () => {
    render(<EnergyBalanceMini eaten={2500} burned={0} target={2000} />);

    expect(screen.getByTestId('mini-net')).toHaveTextContent('2500');
  });

  it('shows negative net when burned exceeds eaten', () => {
    render(<EnergyBalanceMini eaten={200} burned={500} target={2000} />);

    expect(screen.getByTestId('mini-net')).toHaveTextContent('-300');
  });

  it('renders without onTapDetail handler', () => {
    render(<EnergyBalanceMini {...baseProps} />);

    const container = screen.getByTestId('energy-balance-mini');
    expect(container).toBeInTheDocument();
    fireEvent.click(container);
  });
});

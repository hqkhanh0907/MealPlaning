import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NextActionStrip } from '../features/dashboard/components/NextActionStrip';

afterEach(cleanup);

describe('NextActionStrip', () => {
  // ===== Rendering per action type =====

  describe('log-meal action', () => {
    it('renders with log-meal label', () => {
      render(<NextActionStrip actionType="log-meal" onAction={vi.fn()} />);
      expect(screen.getByTestId('next-action-strip')).toHaveTextContent('Thêm bữa ăn hôm nay');
    });

    it('renders UtensilsCrossed icon', () => {
      render(<NextActionStrip actionType="log-meal" onAction={vi.fn()} />);
      const btn = screen.getByTestId('next-action-strip');
      expect(btn.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('start-workout action', () => {
    it('renders with start-workout label', () => {
      render(<NextActionStrip actionType="start-workout" onAction={vi.fn()} />);
      expect(screen.getByTestId('next-action-strip')).toHaveTextContent('Bắt đầu buổi tập');
    });

    it('renders Dumbbell icon', () => {
      render(<NextActionStrip actionType="start-workout" onAction={vi.fn()} />);
      const btn = screen.getByTestId('next-action-strip');
      expect(btn.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('log-weight action', () => {
    it('renders with log-weight label', () => {
      render(<NextActionStrip actionType="log-weight" onAction={vi.fn()} />);
      expect(screen.getByTestId('next-action-strip')).toHaveTextContent('Ghi cân nặng');
    });

    it('renders Scale icon', () => {
      render(<NextActionStrip actionType="log-weight" onAction={vi.fn()} />);
      const btn = screen.getByTestId('next-action-strip');
      expect(btn.querySelector('svg')).toBeInTheDocument();
    });
  });

  // ===== Click handler =====

  describe('Click handler', () => {
    it('fires onAction callback on click', async () => {
      const onAction = vi.fn();
      const user = userEvent.setup();
      render(<NextActionStrip actionType="log-meal" onAction={onAction} />);

      await user.click(screen.getByTestId('next-action-strip'));
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('fires onAction for start-workout', async () => {
      const onAction = vi.fn();
      const user = userEvent.setup();
      render(<NextActionStrip actionType="start-workout" onAction={onAction} />);

      await user.click(screen.getByTestId('next-action-strip'));
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('fires onAction for log-weight', async () => {
      const onAction = vi.fn();
      const user = userEvent.setup();
      render(<NextActionStrip actionType="log-weight" onAction={onAction} />);

      await user.click(screen.getByTestId('next-action-strip'));
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  // ===== Accessibility =====

  describe('Accessibility', () => {
    it('has aria-label with action description for log-meal', () => {
      render(<NextActionStrip actionType="log-meal" onAction={vi.fn()} />);
      const btn = screen.getByTestId('next-action-strip');
      expect(btn).toHaveAttribute('aria-label', 'Hành động tiếp theo: Thêm bữa ăn hôm nay');
    });

    it('has aria-label with action description for start-workout', () => {
      render(<NextActionStrip actionType="start-workout" onAction={vi.fn()} />);
      const btn = screen.getByTestId('next-action-strip');
      expect(btn).toHaveAttribute('aria-label', 'Hành động tiếp theo: Bắt đầu buổi tập');
    });

    it('has aria-label with action description for log-weight', () => {
      render(<NextActionStrip actionType="log-weight" onAction={vi.fn()} />);
      const btn = screen.getByTestId('next-action-strip');
      expect(btn).toHaveAttribute('aria-label', 'Hành động tiếp theo: Ghi cân nặng');
    });

    it('icons are hidden from screen readers', () => {
      const { container } = render(<NextActionStrip actionType="log-meal" onAction={vi.fn()} />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs).toHaveLength(2); // action icon + chevron
      for (const svg of svgs) {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      }
    });

    it('renders as a button element', () => {
      render(<NextActionStrip actionType="log-meal" onAction={vi.fn()} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  // ===== Styling =====

  describe('Styling', () => {
    it('has interactive class for press feedback', () => {
      render(<NextActionStrip actionType="log-meal" onAction={vi.fn()} />);
      const btn = screen.getByTestId('next-action-strip');
      expect(btn.className).toContain('interactive');
    });

    it('has primary-subtle background', () => {
      render(<NextActionStrip actionType="log-meal" onAction={vi.fn()} />);
      const btn = screen.getByTestId('next-action-strip');
      expect(btn.className).toContain('bg-primary-subtle');
    });

    it('has primary text color', () => {
      render(<NextActionStrip actionType="log-meal" onAction={vi.fn()} />);
      const btn = screen.getByTestId('next-action-strip');
      expect(btn.className).toContain('text-primary');
    });

    it('has min-h-11 touch target', () => {
      render(<NextActionStrip actionType="log-meal" onAction={vi.fn()} />);
      const btn = screen.getByTestId('next-action-strip');
      expect(btn.className).toContain('min-h-11');
    });

    it('has rounded-xl border radius', () => {
      render(<NextActionStrip actionType="log-meal" onAction={vi.fn()} />);
      const btn = screen.getByTestId('next-action-strip');
      expect(btn.className).toContain('rounded-xl');
    });
  });

  // ===== React.memo =====

  describe('React.memo', () => {
    it('component is wrapped in React.memo', () => {
      expect((NextActionStrip as unknown as { $$typeof: symbol }).$$typeof).toBe(Symbol.for('react.memo'));
    });
  });
});

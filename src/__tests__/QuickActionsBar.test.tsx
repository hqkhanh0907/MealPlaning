import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QuickActionsBar } from '../features/dashboard/components/QuickActionsBar';
import { useNavigationStore } from '../store/navigationStore';

function resetStores() {
  useNavigationStore.setState({ navigateTab: vi.fn() });
}

afterEach(cleanup);

describe('QuickActionsBar', () => {
  beforeEach(resetStores);

  /* ------------------------------------------------------------ */
  /* Rendering */
  /* ------------------------------------------------------------ */
  it('renders the quick actions bar with two buttons', () => {
    render(<QuickActionsBar />);
    expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('renders a nav element with accessible label', () => {
    render(<QuickActionsBar />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label');
  });

  /* ------------------------------------------------------------ */
  /* Fixed actions: log-weight + log-cardio */
  /* ------------------------------------------------------------ */
  it('shows log-weight as the first action', () => {
    render(<QuickActionsBar />);
    expect(screen.getByTestId('quick-action-log-weight')).toBeInTheDocument();
  });

  it('shows log-cardio as the second action', () => {
    render(<QuickActionsBar />);
    expect(screen.getByTestId('quick-action-log-cardio')).toBeInTheDocument();
  });

  /* ------------------------------------------------------------ */
  /* Outline button styling */
  /* ------------------------------------------------------------ */
  describe('Outline button styling', () => {
    it('both buttons use outline variant with card background', () => {
      render(<QuickActionsBar />);
      const buttons = screen.getAllByRole('button');
      for (const button of buttons) {
        expect(button.className).toContain('bg-card');
        expect(button.className).toContain('text-primary');
        expect(button.className).toContain('border');
        expect(button.className).toContain('border-border');
      }
    });

    it('both buttons have h-12 height', () => {
      render(<QuickActionsBar />);
      const buttons = screen.getAllByRole('button');
      for (const button of buttons) {
        expect(button.className).toContain('h-12');
      }
    });

    it('both buttons have flex-1 and rounded-full', () => {
      render(<QuickActionsBar />);
      const buttons = screen.getAllByRole('button');
      for (const button of buttons) {
        expect(button.className).toContain('rounded-full');
        expect(button.className).toContain('flex-1');
      }
    });

    it('nav uses compact flex gap-2 layout', () => {
      render(<QuickActionsBar />);
      const nav = screen.getByTestId('quick-actions-bar');
      expect(nav.className).toContain('gap-2');
    });
  });

  /* ------------------------------------------------------------ */
  /* Action handlers – navigation */
  /* ------------------------------------------------------------ */
  describe('Action handlers', () => {
    it('tapping log-weight navigates to fitness tab', async () => {
      const mockNavigateTab = vi.fn();
      useNavigationStore.setState({ navigateTab: mockNavigateTab });
      const user = userEvent.setup();

      render(<QuickActionsBar />);
      await user.click(screen.getByTestId('quick-action-log-weight'));

      expect(mockNavigateTab).toHaveBeenCalledWith('fitness');
    });

    it('tapping log-weight calls onLogWeight callback when provided', async () => {
      const mockOnLogWeight = vi.fn();
      const user = userEvent.setup();

      render(<QuickActionsBar onLogWeight={mockOnLogWeight} />);
      await user.click(screen.getByTestId('quick-action-log-weight'));

      expect(mockOnLogWeight).toHaveBeenCalledTimes(1);
    });

    it('tapping log-cardio navigates to fitness tab', async () => {
      const mockNavigateTab = vi.fn();
      useNavigationStore.setState({ navigateTab: mockNavigateTab });
      const user = userEvent.setup();

      render(<QuickActionsBar />);
      await user.click(screen.getByTestId('quick-action-log-cardio'));

      expect(mockNavigateTab).toHaveBeenCalledWith('fitness');
    });
  });

  /* ------------------------------------------------------------ */
  /* Labels */
  /* ------------------------------------------------------------ */
  describe('Labels', () => {
    it('buttons show translated text', () => {
      render(<QuickActionsBar />);
      expect(screen.getByText('Ghi cân nặng')).toBeInTheDocument();
      expect(screen.getByText('Ghi cardio')).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------ */
  /* Accessibility */
  /* ------------------------------------------------------------ */
  describe('Accessibility', () => {
    it('each button has an aria-label', () => {
      render(<QuickActionsBar />);
      const buttons = screen.getAllByRole('button');
      for (const button of buttons) {
        expect(button).toHaveAttribute('aria-label');
        expect(button.getAttribute('aria-label')).not.toBe('');
      }
    });

    it('icons are hidden from screen readers', () => {
      const { container } = render(<QuickActionsBar />);
      const svgs = container.querySelectorAll('svg');
      for (const svg of svgs) {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      }
    });
  });
});

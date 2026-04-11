import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Star } from 'lucide-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let mockReducedMotion = false;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = { 'action.undo': 'Hoàn tác' };
      return map[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

vi.mock('../hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}));

import { UndoToast, type UndoToastProps } from '../components/schedule/UndoToast';

const defaultProps: UndoToastProps = {
  message: 'Đã thêm Trứng ốp la vào Sáng',
  icon: Star,
  duration: 6000,
  onUndo: vi.fn(),
  onDismiss: vi.fn(),
};

function renderToast(overrides: Partial<UndoToastProps> = {}) {
  return render(<UndoToast {...defaultProps} {...overrides} />);
}

describe('UndoToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockReducedMotion = false;
    (defaultProps.onUndo as ReturnType<typeof vi.fn>).mockClear();
    (defaultProps.onDismiss as ReturnType<typeof vi.fn>).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('renders message and icon', () => {
    renderToast();
    expect(screen.getByTestId('undo-toast')).toBeInTheDocument();
    expect(screen.getByText('Đã thêm Trứng ốp la vào Sáng')).toBeInTheDocument();
    expect(screen.getByText('Hoàn tác')).toBeInTheDocument();
  });

  it('shows progress bar', () => {
    renderToast();
    expect(screen.getByTestId('undo-toast-progress')).toBeInTheDocument();
  });

  it('calls onUndo when "Hoàn tác" clicked', () => {
    renderToast();
    fireEvent.click(screen.getByTestId('undo-toast-action'));
    expect(defaultProps.onUndo).toHaveBeenCalledOnce();
    expect(defaultProps.onDismiss).not.toHaveBeenCalled();
  });

  it('calls onDismiss after duration', () => {
    renderToast({ duration: 3000 });
    expect(defaultProps.onDismiss).not.toHaveBeenCalled();

    // Advance past duration → starts exit animation
    act(() => vi.advanceTimersByTime(3000));
    // Exit animation = 200ms
    act(() => vi.advanceTimersByTime(200));
    expect(defaultProps.onDismiss).toHaveBeenCalledOnce();
  });

  it('timer cleared on unmount (no memory leak)', () => {
    const { unmount } = renderToast({ duration: 5000 });
    unmount();
    act(() => vi.advanceTimersByTime(10000));
    expect(defaultProps.onDismiss).not.toHaveBeenCalled();
  });

  it('new props reset timer', () => {
    const { rerender } = renderToast({ duration: 4000 });
    act(() => vi.advanceTimersByTime(3000));
    expect(defaultProps.onDismiss).not.toHaveBeenCalled();

    // Re-render with new message → timer resets
    rerender(<UndoToast {...defaultProps} message="New message" duration={4000} />);
    act(() => vi.advanceTimersByTime(3000));
    expect(defaultProps.onDismiss).not.toHaveBeenCalled();

    // After full new duration → dismiss
    act(() => vi.advanceTimersByTime(1000));
    // exit animation
    act(() => vi.advanceTimersByTime(200));
    expect(defaultProps.onDismiss).toHaveBeenCalledOnce();
  });

  it('prefers-reduced-motion: instant show/hide, no slide animation', () => {
    mockReducedMotion = true;
    renderToast();
    const toastEl = screen.getByTestId('undo-toast');
    // With reduced motion, no transform style applied
    expect(toastEl.style.transform).toBe('');
    expect(toastEl.style.opacity).toBe('');
  });

  it('reduced motion: dismiss calls onDismiss immediately without exit delay', () => {
    mockReducedMotion = true;
    renderToast({ duration: 2000 });
    act(() => vi.advanceTimersByTime(2000));
    // No 200ms exit delay with reduced motion
    expect(defaultProps.onDismiss).toHaveBeenCalledOnce();
  });

  it('clicking undo prevents auto-dismiss', () => {
    renderToast({ duration: 3000 });

    // Click undo (this clears timer)
    fireEvent.click(screen.getByTestId('undo-toast-action'));

    // Advance past duration - onDismiss should NOT be called
    act(() => vi.advanceTimersByTime(5000));
    expect(defaultProps.onDismiss).not.toHaveBeenCalled();
  });

  it('progress bar transitions from 100% to 0% over duration', () => {
    renderToast({ duration: 6000 });
    const progress = screen.getByTestId('undo-toast-progress');
    // Trigger rAF to enter visible phase
    act(() => vi.advanceTimersByTime(16));
    // The progress bar should have transition style when visible
    expect(progress.style.transition).toContain('width');
    expect(progress.style.width).toBe('0%');
  });

  it('has correct z-index and positioning', () => {
    renderToast();
    const el = screen.getByTestId('undo-toast');
    expect(el.className).toContain('z-[60]');
    expect(el.className).toContain('fixed');
    expect(el.className).toContain('bottom-20');
  });

  it('enter animation applies translateY(100%) initially', () => {
    renderToast();
    const el = screen.getByTestId('undo-toast');
    // On first render (enter phase), transform should be set
    // Note: The rAF callback will transition to visible
    expect(el.style.transform).toBe('translateY(100%)');
  });

  it('transitions to visible phase via requestAnimationFrame', () => {
    renderToast();
    const el = screen.getByTestId('undo-toast');
    expect(el.style.transform).toBe('translateY(100%)');

    // Trigger rAF
    act(() => vi.advanceTimersByTime(16));
    expect(el.style.transform).toBe('translateY(0)');
    expect(el.style.opacity).toBe('1');
  });

  it('renders <output> element with aria-live="polite" for accessibility', () => {
    renderToast();
    const el = screen.getByTestId('undo-toast');
    expect(el.tagName).toBe('OUTPUT');
    expect(el).toHaveAttribute('aria-live', 'polite');
  });
});

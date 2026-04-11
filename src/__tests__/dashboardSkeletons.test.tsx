import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AiInsightCardSkeleton } from '@/features/dashboard/components/AiInsightCardSkeleton';
import { TodaysPlanCardSkeleton } from '@/features/dashboard/components/TodaysPlanCardSkeleton';

describe('TodaysPlanCardSkeleton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when isLoading is false', () => {
    const { container } = render(<TodaysPlanCardSkeleton isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders skeleton when isLoading is true', () => {
    render(<TodaysPlanCardSkeleton isLoading={true} />);
    expect(screen.getByTestId('todays-plan-card-skeleton')).toBeInTheDocument();
  });

  it('sets aria-busy on the container', () => {
    render(<TodaysPlanCardSkeleton isLoading={true} />);
    expect(screen.getByTestId('todays-plan-card-skeleton')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders 3 meal slot skeleton rows', () => {
    render(<TodaysPlanCardSkeleton isLoading={true} />);
    const container = screen.getByTestId('todays-plan-card-skeleton');
    const rows = container.querySelectorAll('[data-slot="skeleton"]');
    // header (2) + 3 meal rows + 1 button = 6
    expect(rows.length).toBe(6);
  });

  it('renders a skeleton button at bottom', () => {
    render(<TodaysPlanCardSkeleton isLoading={true} />);
    const container = screen.getByTestId('todays-plan-card-skeleton');
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    const lastSkeleton = skeletons[skeletons.length - 1];
    expect(lastSkeleton).toHaveClass('h-10');
  });

  it('stays visible for minimum delay after loading stops', () => {
    const { rerender } = render(<TodaysPlanCardSkeleton isLoading={true} />);
    expect(screen.getByTestId('todays-plan-card-skeleton')).toBeInTheDocument();

    rerender(<TodaysPlanCardSkeleton isLoading={false} />);
    // Still visible during minimum delay
    expect(screen.getByTestId('todays-plan-card-skeleton')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByTestId('todays-plan-card-skeleton')).toBeNull();
  });

  it('accepts custom minDelay', () => {
    const { rerender } = render(<TodaysPlanCardSkeleton isLoading={true} minDelay={500} />);
    expect(screen.getByTestId('todays-plan-card-skeleton')).toBeInTheDocument();

    rerender(<TodaysPlanCardSkeleton isLoading={false} minDelay={500} />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    // Still visible at 200ms with 500ms minDelay
    expect(screen.getByTestId('todays-plan-card-skeleton')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByTestId('todays-plan-card-skeleton')).toBeNull();
  });

  it('has accessible aria-label', () => {
    render(<TodaysPlanCardSkeleton isLoading={true} />);
    expect(screen.getByTestId('todays-plan-card-skeleton')).toHaveAttribute('aria-label', "Loading today's plan");
  });
});

describe('AiInsightCardSkeleton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when isLoading is false', () => {
    const { container } = render(<AiInsightCardSkeleton isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders skeleton when isLoading is true', () => {
    render(<AiInsightCardSkeleton isLoading={true} />);
    expect(screen.getByTestId('ai-insight-card-skeleton')).toBeInTheDocument();
  });

  it('sets aria-busy on the container', () => {
    render(<AiInsightCardSkeleton isLoading={true} />);
    expect(screen.getByTestId('ai-insight-card-skeleton')).toHaveAttribute('aria-busy', 'true');
  });

  it('has min-h-14 for proper visual height', () => {
    render(<AiInsightCardSkeleton isLoading={true} />);
    expect(screen.getByTestId('ai-insight-card-skeleton')).toHaveClass('min-h-14');
  });

  it('renders icon skeleton and text skeleton', () => {
    render(<AiInsightCardSkeleton isLoading={true} />);
    const container = screen.getByTestId('ai-insight-card-skeleton');
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBe(2);
    // icon: rounded-full, 8x8
    expect(skeletons[0]).toHaveClass('rounded-full');
    // text: flex-1
    expect(skeletons[1]).toHaveClass('flex-1');
  });

  it('stays visible for minimum delay after loading stops', () => {
    const { rerender } = render(<AiInsightCardSkeleton isLoading={true} />);
    expect(screen.getByTestId('ai-insight-card-skeleton')).toBeInTheDocument();

    rerender(<AiInsightCardSkeleton isLoading={false} />);
    expect(screen.getByTestId('ai-insight-card-skeleton')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByTestId('ai-insight-card-skeleton')).toBeNull();
  });

  it('accepts custom minDelay', () => {
    const { rerender } = render(<AiInsightCardSkeleton isLoading={true} minDelay={300} />);
    expect(screen.getByTestId('ai-insight-card-skeleton')).toBeInTheDocument();

    rerender(<AiInsightCardSkeleton isLoading={false} minDelay={300} />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByTestId('ai-insight-card-skeleton')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByTestId('ai-insight-card-skeleton')).toBeNull();
  });

  it('has accessible aria-label', () => {
    render(<AiInsightCardSkeleton isLoading={true} />);
    expect(screen.getByTestId('ai-insight-card-skeleton')).toHaveAttribute('aria-label', 'Loading AI insight');
  });
});

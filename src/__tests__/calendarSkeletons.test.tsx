import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MealSlotSkeleton } from '@/components/schedule/MealSlotSkeleton';
import { NutritionDetailsSkeleton } from '@/components/schedule/NutritionDetailsSkeleton';
import { NutritionOverviewSkeleton } from '@/components/schedule/NutritionOverviewSkeleton';

describe('MealSlotSkeleton', () => {
  it('renders with aria-hidden="true"', () => {
    const { container } = render(<MealSlotSkeleton />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no explicit role (aria-hidden is sufficient)', () => {
    const { container } = render(<MealSlotSkeleton />);
    const root = container.firstElementChild!;
    expect(root).not.toHaveAttribute('role');
  });

  it('has animate-pulse class', () => {
    const { container } = render(<MealSlotSkeleton />);
    const root = container.firstElementChild!;
    expect(root).toHaveClass('animate-pulse');
  });

  it('has bg-card rounded-xl border p-4 classes', () => {
    const { container } = render(<MealSlotSkeleton />);
    const root = container.firstElementChild!;
    expect(root).toHaveClass('bg-card', 'rounded-xl', 'border', 'p-4');
  });

  it('has left border accent with border-muted', () => {
    const { container } = render(<MealSlotSkeleton />);
    const root = container.firstElementChild!;
    expect(root).toHaveClass('border-l-[3px]', 'border-muted');
  });

  it('has min-height of 120px', () => {
    const { container } = render(<MealSlotSkeleton />);
    const root = container.firstElementChild!;
    expect(root).toHaveStyle({ minHeight: '120px' });
  });

  it('renders 2 placeholder bars with bg-muted rounded', () => {
    const { container } = render(<MealSlotSkeleton />);
    const bars = container.querySelectorAll('.bg-muted.rounded');
    expect(bars.length).toBe(2);
  });
});

describe('NutritionOverviewSkeleton', () => {
  it('renders with aria-hidden="true"', () => {
    const { container } = render(<NutritionOverviewSkeleton />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no explicit role (aria-hidden is sufficient)', () => {
    const { container } = render(<NutritionOverviewSkeleton />);
    const root = container.firstElementChild!;
    expect(root).not.toHaveAttribute('role');
  });

  it('has animate-pulse class', () => {
    const { container } = render(<NutritionOverviewSkeleton />);
    const root = container.firstElementChild!;
    expect(root).toHaveClass('animate-pulse');
  });

  it('has bg-card rounded-2xl border p-6 classes', () => {
    const { container } = render(<NutritionOverviewSkeleton />);
    const root = container.firstElementChild!;
    expect(root).toHaveClass('bg-card', 'rounded-2xl', 'border', 'p-6');
  });

  it('has min-height of 200px', () => {
    const { container } = render(<NutritionOverviewSkeleton />);
    const root = container.firstElementChild!;
    expect(root).toHaveStyle({ minHeight: '200px' });
  });

  it('renders 2 progress bar placeholders (h-2 w-full rounded-full bg-muted)', () => {
    const { container } = render(<NutritionOverviewSkeleton />);
    const bars = container.querySelectorAll('.h-2.w-full.rounded-full.bg-muted');
    expect(bars.length).toBe(2);
  });

  it('renders donut placeholder (h-12 w-12 rounded-full bg-muted)', () => {
    const { container } = render(<NutritionOverviewSkeleton />);
    const donut = container.querySelector('.h-12.w-12.rounded-full.bg-muted');
    expect(donut).toBeInTheDocument();
  });

  it('renders text placeholders (h-4 w-24 rounded bg-muted)', () => {
    const { container } = render(<NutritionOverviewSkeleton />);
    const texts = container.querySelectorAll('.h-4.w-24.rounded.bg-muted');
    expect(texts.length).toBe(2);
  });
});

describe('NutritionDetailsSkeleton', () => {
  it('renders with aria-hidden="true"', () => {
    const { container } = render(<NutritionDetailsSkeleton />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no explicit role (aria-hidden is sufficient)', () => {
    const { container } = render(<NutritionDetailsSkeleton />);
    const root = container.firstElementChild!;
    expect(root).not.toHaveAttribute('role');
  });

  it('has animate-pulse class', () => {
    const { container } = render(<NutritionDetailsSkeleton />);
    const root = container.firstElementChild!;
    expect(root).toHaveClass('animate-pulse');
  });

  it('has bg-card rounded-2xl border p-6 classes', () => {
    const { container } = render(<NutritionDetailsSkeleton />);
    const root = container.firstElementChild!;
    expect(root).toHaveClass('bg-card', 'rounded-2xl', 'border', 'p-6');
  });

  it('has min-height of 56px', () => {
    const { container } = render(<NutritionDetailsSkeleton />);
    const root = container.firstElementChild!;
    expect(root).toHaveStyle({ minHeight: '56px' });
  });

  it('renders collapsed header placeholder (h-5 w-40 rounded bg-muted)', () => {
    const { container } = render(<NutritionDetailsSkeleton />);
    const header = container.querySelector('.h-5.w-40.rounded.bg-muted');
    expect(header).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'common.aiBadge': 'AI',
      };
      return map[key] ?? key;
    },
  }),
}));

import { AiBadge } from '../components/shared/AiBadge';

describe('AiBadge', () => {
  it('renders with AI label', () => {
    render(<AiBadge />);
    expect(screen.getByTestId('ai-badge')).toHaveTextContent('AI');
  });

  it('renders sparkles icon', () => {
    render(<AiBadge />);
    const badge = screen.getByTestId('ai-badge');
    const svg = badge.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies AI color classes', () => {
    render(<AiBadge />);
    const badge = screen.getByTestId('ai-badge');
    expect(badge.className).toContain('text-ai');
    expect(badge.className).toContain('bg-ai-subtle');
    expect(badge.className).toContain('border-ai/20');
  });

  it('applies custom className', () => {
    render(<AiBadge className="ml-2" />);
    const badge = screen.getByTestId('ai-badge');
    expect(badge.className).toContain('ml-2');
  });

  it('renders as inline-flex element', () => {
    render(<AiBadge />);
    const badge = screen.getByTestId('ai-badge');
    expect(badge.tagName).toBe('SPAN');
    expect(badge.className).toContain('inline-flex');
  });
});

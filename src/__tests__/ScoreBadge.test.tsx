import { cleanup, render, screen } from '@testing-library/react';

import { ScoreBadge } from '../features/dashboard/components/ScoreBadge';

/* ---------- mock useReducedMotion ---------- */
let mockReducedMotion = false;

vi.mock('../hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}));

/* ---------- helpers ---------- */
function renderBadge(score: number, className?: string) {
  return render(<ScoreBadge score={score} className={className} />);
}

function getBadge() {
  return screen.getByTestId('score-badge');
}

afterEach(() => {
  cleanup();
  mockReducedMotion = false;
});

describe('ScoreBadge', () => {
  describe('rendering', () => {
    it('renders score number', () => {
      renderBadge(85);
      expect(getBadge()).toHaveTextContent('85');
    });

    it('renders just the number without suffix', () => {
      renderBadge(42);
      expect(getBadge().textContent).toBe('42');
    });

    it('has data-testid="score-badge"', () => {
      renderBadge(50);
      expect(getBadge()).toBeInTheDocument();
    });

    it('has correct aria-label', () => {
      renderBadge(73);
      expect(getBadge()).toHaveAttribute('aria-label', 'Điểm hôm nay: 73 trên 100');
    });

    it('uses tabular-nums class', () => {
      renderBadge(60);
      expect(getBadge().className).toContain('tabular-nums');
    });
  });

  describe('color thresholds', () => {
    it('score >= 80 gets success colors', () => {
      renderBadge(90);
      const badge = getBadge();
      expect(badge.className).toContain('bg-success-subtle');
      expect(badge.className).toContain('text-success');
      expect(badge.className).toContain('border-success/20');
    });

    it('score = 80 (boundary) gets success colors', () => {
      renderBadge(80);
      const badge = getBadge();
      expect(badge.className).toContain('bg-success-subtle');
      expect(badge.className).toContain('text-success');
    });

    it('score = 79 gets warning colors', () => {
      renderBadge(79);
      const badge = getBadge();
      expect(badge.className).toContain('bg-warning-subtle');
      expect(badge.className).toContain('text-warning');
      expect(badge.className).toContain('border-warning/20');
    });

    it('score 50-79 gets warning colors', () => {
      renderBadge(65);
      const badge = getBadge();
      expect(badge.className).toContain('bg-warning-subtle');
      expect(badge.className).toContain('text-warning');
    });

    it('score = 50 (boundary) gets warning colors', () => {
      renderBadge(50);
      const badge = getBadge();
      expect(badge.className).toContain('bg-warning-subtle');
      expect(badge.className).toContain('text-warning');
    });

    it('score = 49 gets muted colors', () => {
      renderBadge(49);
      const badge = getBadge();
      expect(badge.className).toContain('bg-muted');
      expect(badge.className).toContain('text-muted-foreground');
      expect(badge.className).toContain('border-border');
    });

    it('score < 50 gets muted colors', () => {
      renderBadge(10);
      const badge = getBadge();
      expect(badge.className).toContain('bg-muted');
      expect(badge.className).toContain('text-muted-foreground');
    });
  });

  describe('NaN safety', () => {
    it('NaN is treated as 0', () => {
      renderBadge(NaN);
      const badge = getBadge();
      expect(badge).toHaveTextContent('0');
      expect(badge.className).toContain('bg-muted');
      expect(badge).toHaveAttribute('aria-label', 'Điểm hôm nay: 0 trên 100');
    });

    it('Infinity is treated as 0', () => {
      renderBadge(Infinity);
      const badge = getBadge();
      expect(badge).toHaveTextContent('0');
      expect(badge.className).toContain('bg-muted');
    });

    it('-Infinity is treated as 0', () => {
      renderBadge(-Infinity);
      const badge = getBadge();
      expect(badge).toHaveTextContent('0');
      expect(badge.className).toContain('bg-muted');
    });
  });

  describe('reduced motion', () => {
    it('applies pulse animation style when motion is allowed', () => {
      renderBadge(80);
      const badge = getBadge();
      expect(badge.style.animation).toContain('score-pulse');
      expect(badge.className).toContain('score-badge-pulse');
    });

    it('does not apply pulse animation when reduced motion is preferred', () => {
      mockReducedMotion = true;
      renderBadge(80);
      const badge = getBadge();
      expect(badge.style.animation).toBe('');
      expect(badge.className).not.toContain('score-badge-pulse');
    });
  });

  describe('className prop', () => {
    it('merges custom className', () => {
      renderBadge(80, 'my-custom-class');
      expect(getBadge().className).toContain('my-custom-class');
    });

    it('works without className', () => {
      renderBadge(80);
      expect(getBadge()).toBeInTheDocument();
    });
  });

  describe('React.memo', () => {
    it('exports a memoized component', async () => {
      const mod = await import('../features/dashboard/components/ScoreBadge');
      expect(mod.ScoreBadge.$$typeof).toBe(Symbol.for('react.memo'));
    });
  });
});

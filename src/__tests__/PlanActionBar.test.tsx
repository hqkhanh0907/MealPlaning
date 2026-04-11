import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlanActionBar, type PlanActionBarProps } from '../features/fitness/components/PlanActionBar';

function createProps(overrides: Partial<PlanActionBarProps> = {}): PlanActionBarProps {
  return {
    onEditSchedule: vi.fn(),
    onChangeSplit: vi.fn(),
    onBrowseTemplates: vi.fn(),
    ...overrides,
  };
}

afterEach(cleanup);

describe('PlanActionBar', () => {
  // §3.1 — Rendering
  describe('Rendering', () => {
    it('TC_PAB_R01: renders container with data-testid', () => {
      render(<PlanActionBar {...createProps()} />);
      expect(screen.getByTestId('plan-action-bar')).toBeInTheDocument();
    });

    it('TC_PAB_R02: renders exactly 3 buttons', () => {
      render(<PlanActionBar {...createProps()} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('TC_PAB_R03: first button shows "Chỉnh lịch"', () => {
      render(<PlanActionBar {...createProps()} />);
      expect(screen.getByText('Chỉnh lịch')).toBeInTheDocument();
    });

    it('TC_PAB_R04: second button shows "Đổi Split"', () => {
      render(<PlanActionBar {...createProps()} />);
      expect(screen.getByText('Đổi Split')).toBeInTheDocument();
    });

    it('TC_PAB_R05: third button shows "Mẫu Plan"', () => {
      render(<PlanActionBar {...createProps()} />);
      expect(screen.getByText('Mẫu Plan')).toBeInTheDocument();
    });

    it('TC_PAB_R06: edit schedule button has testid', () => {
      render(<PlanActionBar {...createProps()} />);
      expect(screen.getByTestId('action-edit-schedule')).toBeInTheDocument();
    });

    it('TC_PAB_R07: change split button has testid', () => {
      render(<PlanActionBar {...createProps()} />);
      expect(screen.getByTestId('action-change-split')).toBeInTheDocument();
    });

    it('TC_PAB_R08: templates button has testid', () => {
      render(<PlanActionBar {...createProps()} />);
      expect(screen.getByTestId('action-templates')).toBeInTheDocument();
    });
  });

  // §3.2 — Icons
  describe('Icons', () => {
    it('TC_PAB_I01: CalendarCog icon in edit-schedule button is decorative', () => {
      render(<PlanActionBar {...createProps()} />);
      const btn = screen.getByTestId('action-edit-schedule');
      const svg = btn.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('TC_PAB_I02: ArrowRightLeft icon in change-split button is decorative', () => {
      render(<PlanActionBar {...createProps()} />);
      const btn = screen.getByTestId('action-change-split');
      const svg = btn.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('TC_PAB_I03: BookOpen icon in templates button is decorative', () => {
      render(<PlanActionBar {...createProps()} />);
      const btn = screen.getByTestId('action-templates');
      const svg = btn.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // §3.3 — Disabled state
  describe('Disabled state', () => {
    it('TC_PAB_D01: all buttons disabled when isDisabled=true', () => {
      render(<PlanActionBar {...createProps({ isDisabled: true })} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => expect(btn).toBeDisabled());
    });

    it('TC_PAB_D02: disabled buttons have opacity-50 class', () => {
      render(<PlanActionBar {...createProps({ isDisabled: true })} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => expect(btn.className).toContain('disabled:opacity-50'));
    });

    it('TC_PAB_D03: click on disabled edit-schedule does NOT fire callback', async () => {
      const props = createProps({ isDisabled: true });
      render(<PlanActionBar {...props} />);
      const user = userEvent.setup();
      await user.click(screen.getByTestId('action-edit-schedule'));
      expect(props.onEditSchedule).not.toHaveBeenCalled();
    });

    it('TC_PAB_D04: all 3 callbacks NOT fired when disabled', async () => {
      const props = createProps({ isDisabled: true });
      render(<PlanActionBar {...props} />);
      const user = userEvent.setup();
      await user.click(screen.getByTestId('action-edit-schedule'));
      await user.click(screen.getByTestId('action-change-split'));
      await user.click(screen.getByTestId('action-templates'));
      expect(props.onEditSchedule).not.toHaveBeenCalled();
      expect(props.onChangeSplit).not.toHaveBeenCalled();
      expect(props.onBrowseTemplates).not.toHaveBeenCalled();
    });

    it('TC_PAB_D05: buttons enabled by default (isDisabled omitted)', () => {
      const { onEditSchedule, onChangeSplit, onBrowseTemplates } = createProps();
      render(
        <PlanActionBar
          onEditSchedule={onEditSchedule}
          onChangeSplit={onChangeSplit}
          onBrowseTemplates={onBrowseTemplates}
        />,
      );
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => expect(btn).not.toBeDisabled());
    });

    it('TC_PAB_D06: isDisabled=false → buttons enabled', () => {
      render(<PlanActionBar {...createProps({ isDisabled: false })} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => expect(btn).not.toBeDisabled());
    });
  });

  // §3.4 — Click handlers
  describe('Click handlers', () => {
    it('TC_PAB_C01: click edit-schedule fires onEditSchedule', async () => {
      const props = createProps();
      render(<PlanActionBar {...props} />);
      const user = userEvent.setup();
      await user.click(screen.getByTestId('action-edit-schedule'));
      expect(props.onEditSchedule).toHaveBeenCalledOnce();
    });

    it('TC_PAB_C02: click change-split fires onChangeSplit', async () => {
      const props = createProps();
      render(<PlanActionBar {...props} />);
      const user = userEvent.setup();
      await user.click(screen.getByTestId('action-change-split'));
      expect(props.onChangeSplit).toHaveBeenCalledOnce();
    });

    it('TC_PAB_C03: click templates fires onBrowseTemplates', async () => {
      const props = createProps();
      render(<PlanActionBar {...props} />);
      const user = userEvent.setup();
      await user.click(screen.getByTestId('action-templates'));
      expect(props.onBrowseTemplates).toHaveBeenCalledOnce();
    });

    it('TC_PAB_C04: callbacks fire independently (no cross-talk)', async () => {
      const props = createProps();
      render(<PlanActionBar {...props} />);
      const user = userEvent.setup();
      await user.click(screen.getByTestId('action-edit-schedule'));
      expect(props.onEditSchedule).toHaveBeenCalledOnce();
      expect(props.onChangeSplit).not.toHaveBeenCalled();
      expect(props.onBrowseTemplates).not.toHaveBeenCalled();
    });
  });

  // §3.5 — Touch target & styling (BR-37, BR-42)
  describe('Touch targets (BR-37, BR-42)', () => {
    it('TC_PAB_T01: all buttons have min-h-12 (48px) touch target', () => {
      render(<PlanActionBar {...createProps()} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => expect(btn.className).toContain('min-h-12'));
    });

    it('TC_PAB_T02: all buttons have active:scale-[0.98] feedback', () => {
      render(<PlanActionBar {...createProps()} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => expect(btn.className).toContain('active:scale-[0.98]'));
    });

    it('TC_PAB_T03: all buttons have focus-visible:ring-2', () => {
      render(<PlanActionBar {...createProps()} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => expect(btn.className).toContain('focus-visible:ring-2'));
    });

    it('TC_PAB_T04: all buttons have touch-manipulation', () => {
      render(<PlanActionBar {...createProps()} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => expect(btn.className).toContain('touch-manipulation'));
    });

    it('TC_PAB_T05: container uses flex layout with gap', () => {
      render(<PlanActionBar {...createProps()} />);
      const container = screen.getByTestId('plan-action-bar');
      expect(container.className).toContain('flex');
      expect(container.className).toContain('gap-2');
    });

    it('TC_PAB_T06: each button has flex-1 for equal width', () => {
      render(<PlanActionBar {...createProps()} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => expect(btn.className).toContain('flex-1'));
    });
  });

  // §3.6 — Accessibility
  describe('Accessibility', () => {
    it('TC_PAB_A01: each button has non-empty aria-label', () => {
      render(<PlanActionBar {...createProps()} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => {
        expect(btn).toHaveAttribute('aria-label');
        expect(btn.getAttribute('aria-label')).not.toBe('');
      });
    });

    it('TC_PAB_A02: edit-schedule aria-label matches i18n', () => {
      render(<PlanActionBar {...createProps()} />);
      expect(screen.getByTestId('action-edit-schedule')).toHaveAttribute('aria-label', 'Chỉnh lịch');
    });

    it('TC_PAB_A03: change-split aria-label matches i18n', () => {
      render(<PlanActionBar {...createProps()} />);
      expect(screen.getByTestId('action-change-split')).toHaveAttribute('aria-label', 'Đổi Split');
    });

    it('TC_PAB_A04: templates aria-label matches i18n', () => {
      render(<PlanActionBar {...createProps()} />);
      expect(screen.getByTestId('action-templates')).toHaveAttribute('aria-label', 'Mẫu Plan');
    });

    it('TC_PAB_A05: all buttons have type="button"', () => {
      render(<PlanActionBar {...createProps()} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => expect(btn).toHaveAttribute('type', 'button'));
    });

    it('TC_PAB_A06: all icons are decorative (aria-hidden)', () => {
      render(<PlanActionBar {...createProps()} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => {
        const svg = btn.querySelector('svg');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  // §3.7 — Layout contract (360px)
  describe('Layout contract (360px)', () => {
    it('TC_PAB_L01: container does not force horizontal overflow', () => {
      render(<PlanActionBar {...createProps()} />);
      const container = screen.getByTestId('plan-action-bar');
      expect(container.className).not.toContain('overflow-x-auto');
      expect(container.className).not.toContain('overflow-hidden');
    });

    it('TC_PAB_L02: text labels render without text-ellipsis', () => {
      render(<PlanActionBar {...createProps()} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => {
        expect(btn.className).not.toContain('truncate');
        expect(btn.className).not.toContain('text-ellipsis');
      });
    });

    it('TC_PAB_L03: labels are short enough for 3-column fit', () => {
      render(<PlanActionBar {...createProps()} />);
      const labels = ['Chỉnh lịch', 'Đổi Split', 'Mẫu Plan'];
      labels.forEach(label => {
        const el = screen.getByText(label);
        expect(el).toBeInTheDocument();
        expect(label.length).toBeLessThanOrEqual(12);
      });
    });
  });
});

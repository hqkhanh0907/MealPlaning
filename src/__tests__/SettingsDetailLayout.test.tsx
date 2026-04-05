import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SettingsDetailLayout } from '../components/settings/SettingsDetailLayout';

afterEach(cleanup);

function renderLayout(overrides: Partial<Parameters<typeof SettingsDetailLayout>[0]> = {}) {
  const defaults: Parameters<typeof SettingsDetailLayout>[0] = {
    title: 'Hồ sơ sức khỏe',
    icon: <span data-testid="icon">💪</span>,
    isEditing: false,
    hasChanges: false,
    onBack: vi.fn(),
    onEdit: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
    children: <div data-testid="content">content</div>,
  };
  const props = { ...defaults, ...overrides };
  return { ...render(<SettingsDetailLayout {...props} />), props };
}

describe('SettingsDetailLayout', () => {
  /* ---------------------------------------------------------------- */
  /* View mode                                                         */
  /* ---------------------------------------------------------------- */
  describe('view mode (isEditing=false)', () => {
    it('renders layout container', () => {
      renderLayout();
      expect(screen.getByTestId('settings-detail-layout')).toBeInTheDocument();
    });

    it('shows title without edit prefix', () => {
      renderLayout({ title: 'Hồ sơ sức khỏe' });
      expect(screen.getByText('Hồ sơ sức khỏe')).toBeInTheDocument();
    });

    it('shows edit button', () => {
      renderLayout();
      expect(screen.getByTestId('settings-detail-edit')).toBeInTheDocument();
    });

    it('does NOT show footer', () => {
      renderLayout();
      expect(screen.queryByTestId('settings-detail-footer')).not.toBeInTheDocument();
    });

    it('renders children', () => {
      renderLayout();
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('calls onBack when back button clicked', () => {
      const { props } = renderLayout();
      fireEvent.click(screen.getByTestId('settings-detail-back'));
      expect(props.onBack).toHaveBeenCalledTimes(1);
    });

    it('calls onEdit when edit button clicked', () => {
      const { props } = renderLayout();
      fireEvent.click(screen.getByTestId('settings-detail-edit'));
      expect(props.onEdit).toHaveBeenCalledTimes(1);
    });
  });

  /* ---------------------------------------------------------------- */
  /* Edit mode                                                         */
  /* ---------------------------------------------------------------- */
  describe('edit mode (isEditing=true)', () => {
    it('shows title with edit prefix', () => {
      renderLayout({ isEditing: true, title: 'Hồ sơ' });
      // t('settings.edit') returns the Vietnamese translation for 'edit'
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading.textContent).toContain('Hồ sơ');
    });

    it('hides edit button', () => {
      renderLayout({ isEditing: true });
      expect(screen.queryByTestId('settings-detail-edit')).not.toBeInTheDocument();
    });

    it('shows save/cancel footer', () => {
      renderLayout({ isEditing: true });
      expect(screen.getByTestId('settings-detail-footer')).toBeInTheDocument();
      expect(screen.getByTestId('settings-detail-cancel')).toBeInTheDocument();
      expect(screen.getByTestId('settings-detail-save')).toBeInTheDocument();
    });

    it('calls onCancel when cancel clicked', () => {
      const { props } = renderLayout({ isEditing: true });
      fireEvent.click(screen.getByTestId('settings-detail-cancel'));
      expect(props.onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onSave when save clicked and hasChanges=true', () => {
      const { props } = renderLayout({ isEditing: true, hasChanges: true });
      fireEvent.click(screen.getByTestId('settings-detail-save'));
      expect(props.onSave).toHaveBeenCalledTimes(1);
    });

    it('save button is disabled when hasChanges=false', () => {
      renderLayout({ isEditing: true, hasChanges: false });
      expect(screen.getByTestId('settings-detail-save')).toBeDisabled();
    });

    it('save button is enabled when hasChanges=true', () => {
      renderLayout({ isEditing: true, hasChanges: true });
      expect(screen.getByTestId('settings-detail-save')).not.toBeDisabled();
    });

    it('applies different classNames based on hasChanges', () => {
      const { rerender } = render(
        <SettingsDetailLayout
          title="T"
          icon={<span>I</span>}
          isEditing={true}
          hasChanges={false}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        >
          <div />
        </SettingsDetailLayout>,
      );

      expect(screen.getByTestId('settings-detail-save').className).toContain('cursor-not-allowed');

      rerender(
        <SettingsDetailLayout
          title="T"
          icon={<span>I</span>}
          isEditing={true}
          hasChanges={true}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        >
          <div />
        </SettingsDetailLayout>,
      );

      expect(screen.getByTestId('settings-detail-save').className).not.toContain('cursor-not-allowed');
    });

    it('content area gets extra padding in edit mode', () => {
      const { container } = render(
        <SettingsDetailLayout
          title="T"
          icon={<span>I</span>}
          isEditing={true}
          hasChanges={false}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        >
          <div data-testid="child" />
        </SettingsDetailLayout>,
      );

      const contentDiv = container.querySelector('.pb-24');
      expect(contentDiv).toBeInTheDocument();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Icon rendering                                                    */
  /* ---------------------------------------------------------------- */
  it('renders the provided icon', () => {
    renderLayout({ icon: <span data-testid="custom-icon">🎯</span> });
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});

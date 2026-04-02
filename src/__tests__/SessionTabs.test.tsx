import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SessionTabs } from '../features/fitness/components/SessionTabs';
import type { TrainingPlanDay } from '../features/fitness/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'fitness.plan.sessionTab') return `Buổi ${String(opts?.order ?? '')}`;
      if (key === 'fitness.plan.sessionTabs') return 'Buổi tập';
      if (key === 'fitness.plan.addSession') return 'Thêm buổi tập';
      if (key === 'fitness.plan.deleteSessionConfirm') return 'Xóa buổi tập này?';
      if (key === 'fitness.plan.delete') return 'Xóa';
      if (key === 'fitness.plan.cancelDelete') return 'Hủy';
      return key;
    },
  }),
}));

afterEach(cleanup);

const makePlanDay = (overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay => ({
  id: 'pd-1',
  planId: 'plan-1',
  dayOfWeek: 1,
  sessionOrder: 1,
  workoutType: 'Upper Push',
  exercises: '[]',
  originalExercises: '[]',
  isUserAssigned: false,
  originalDayOfWeek: 1,
  ...overrides,
});

describe('SessionTabs', () => {
  it('renders with add button when only 1 session', () => {
    render(
      <SessionTabs
        sessions={[makePlanDay()]}
        activeSessionId="pd-1"
        completedSessionIds={[]}
        onSelectSession={vi.fn()}
        onAddSession={vi.fn()}
      />,
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByTestId('add-session-tab')).toBeInTheDocument();
  });

  it('does not render when sessions list is empty', () => {
    const { container } = render(
      <SessionTabs
        sessions={[]}
        activeSessionId=""
        completedSessionIds={[]}
        onSelectSession={vi.fn()}
        onAddSession={vi.fn()}
      />,
    );
    expect(container.querySelector('[role="tablist"]')).toBeNull();
  });

  it('renders tabs for 2+ sessions', () => {
    render(
      <SessionTabs
        sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
        activeSessionId="pd-1"
        completedSessionIds={[]}
        onSelectSession={vi.fn()}
        onAddSession={vi.fn()}
      />,
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  it('fires onSelectSession when tab clicked', () => {
    const onSelect = vi.fn();
    render(
      <SessionTabs
        sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
        activeSessionId="pd-1"
        completedSessionIds={[]}
        onSelectSession={onSelect}
        onAddSession={vi.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('tab')[1]);
    expect(onSelect).toHaveBeenCalledWith('pd-2');
  });

  it('shows check icon on completed sessions', () => {
    render(
      <SessionTabs
        sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
        activeSessionId="pd-2"
        completedSessionIds={['pd-1']}
        onSelectSession={vi.fn()}
        onAddSession={vi.fn()}
      />,
    );
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('data-completed', 'true');
  });

  it('disables add button when maxSessions reached', () => {
    render(
      <SessionTabs
        sessions={[
          makePlanDay({ id: 'pd-1', sessionOrder: 1 }),
          makePlanDay({ id: 'pd-2', sessionOrder: 2 }),
          makePlanDay({ id: 'pd-3', sessionOrder: 3 }),
        ]}
        activeSessionId="pd-1"
        completedSessionIds={[]}
        onSelectSession={vi.fn()}
        onAddSession={vi.fn()}
        maxSessions={3}
      />,
    );
    const addBtn = screen.getByTestId('add-session-tab');
    expect(addBtn).toBeDisabled();
  });

  it('fires onAddSession when plus button clicked', () => {
    const onAdd = vi.fn();
    render(
      <SessionTabs
        sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
        activeSessionId="pd-1"
        completedSessionIds={[]}
        onSelectSession={vi.fn()}
        onAddSession={onAdd}
      />,
    );
    fireEvent.click(screen.getByTestId('add-session-tab'));
    expect(onAdd).toHaveBeenCalled();
  });

  describe('delete session', () => {
    it('shows confirmation on context menu (right-click) with 2+ sessions', () => {
      render(
        <SessionTabs
          sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
          activeSessionId="pd-1"
          completedSessionIds={[]}
          onSelectSession={vi.fn()}
          onAddSession={vi.fn()}
          onDeleteSession={vi.fn()}
        />,
      );
      fireEvent.contextMenu(screen.getAllByRole('tab')[1]);
      expect(screen.getByTestId('delete-session-confirm')).toBeInTheDocument();
      expect(screen.getByText('Xóa buổi tập này?')).toBeInTheDocument();
    });

    it('does not show confirmation on context menu when only 1 session', () => {
      render(
        <SessionTabs
          sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 })]}
          activeSessionId="pd-1"
          completedSessionIds={[]}
          onSelectSession={vi.fn()}
          onAddSession={vi.fn()}
          onDeleteSession={vi.fn()}
        />,
      );
      fireEvent.contextMenu(screen.getByRole('tab'));
      expect(screen.queryByTestId('delete-session-confirm')).toBeNull();
    });

    it('calls onDeleteSession when confirm button clicked', () => {
      const onDelete = vi.fn();
      render(
        <SessionTabs
          sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
          activeSessionId="pd-1"
          completedSessionIds={[]}
          onSelectSession={vi.fn()}
          onAddSession={vi.fn()}
          onDeleteSession={onDelete}
        />,
      );
      fireEvent.contextMenu(screen.getAllByRole('tab')[1]);
      fireEvent.click(screen.getByTestId('confirm-delete-session'));
      expect(onDelete).toHaveBeenCalledWith('pd-2');
    });

    it('hides confirmation when cancel button clicked', () => {
      render(
        <SessionTabs
          sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
          activeSessionId="pd-1"
          completedSessionIds={[]}
          onSelectSession={vi.fn()}
          onAddSession={vi.fn()}
          onDeleteSession={vi.fn()}
        />,
      );
      fireEvent.contextMenu(screen.getAllByRole('tab')[0]);
      expect(screen.getByTestId('delete-session-confirm')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('cancel-delete-session'));
      expect(screen.queryByTestId('delete-session-confirm')).toBeNull();
    });

    it('does not show confirmation when onDeleteSession is not provided', () => {
      render(
        <SessionTabs
          sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
          activeSessionId="pd-1"
          completedSessionIds={[]}
          onSelectSession={vi.fn()}
          onAddSession={vi.fn()}
        />,
      );
      fireEvent.contextMenu(screen.getAllByRole('tab')[0]);
      expect(screen.queryByTestId('delete-session-confirm')).toBeNull();
    });

    it('shows confirmation on long press via pointerDown timer', () => {
      vi.useFakeTimers();
      render(
        <SessionTabs
          sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
          activeSessionId="pd-1"
          completedSessionIds={[]}
          onSelectSession={vi.fn()}
          onAddSession={vi.fn()}
          onDeleteSession={vi.fn()}
        />,
      );
      const tab = screen.getAllByRole('tab')[1];
      fireEvent.pointerDown(tab);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(screen.getByTestId('delete-session-confirm')).toBeInTheDocument();
      vi.useRealTimers();
    });

    it('does not show confirmation if pointer released before 500ms', () => {
      vi.useFakeTimers();
      render(
        <SessionTabs
          sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
          activeSessionId="pd-1"
          completedSessionIds={[]}
          onSelectSession={vi.fn()}
          onAddSession={vi.fn()}
          onDeleteSession={vi.fn()}
        />,
      );
      const tab = screen.getAllByRole('tab')[1];
      fireEvent.pointerDown(tab);
      act(() => {
        vi.advanceTimersByTime(300);
      });
      fireEvent.pointerUp(tab);
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.queryByTestId('delete-session-confirm')).toBeNull();
      vi.useRealTimers();
    });

    it('confirmation has alertdialog role with proper aria-label', () => {
      render(
        <SessionTabs
          sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
          activeSessionId="pd-1"
          completedSessionIds={[]}
          onSelectSession={vi.fn()}
          onAddSession={vi.fn()}
          onDeleteSession={vi.fn()}
        />,
      );
      fireEvent.contextMenu(screen.getAllByRole('tab')[0]);
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-label', 'Xóa buổi tập này?');
    });

    it('shows visible delete button on active tab when 2+ sessions', () => {
      render(
        <SessionTabs
          sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
          activeSessionId="pd-1"
          completedSessionIds={[]}
          onSelectSession={vi.fn()}
          onAddSession={vi.fn()}
          onDeleteSession={vi.fn()}
        />,
      );
      const deleteBtn = screen.getByTestId('delete-session-pd-1');
      expect(deleteBtn).toBeInTheDocument();
    });

    it('does not show delete button when only 1 session', () => {
      render(
        <SessionTabs
          sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 })]}
          activeSessionId="pd-1"
          completedSessionIds={[]}
          onSelectSession={vi.fn()}
          onAddSession={vi.fn()}
          onDeleteSession={vi.fn()}
        />,
      );
      expect(screen.queryByTestId('delete-session-pd-1')).not.toBeInTheDocument();
    });

    it('clicking visible delete button shows confirmation', async () => {
      const user = userEvent.setup();
      render(
        <SessionTabs
          sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
          activeSessionId="pd-1"
          completedSessionIds={[]}
          onSelectSession={vi.fn()}
          onAddSession={vi.fn()}
          onDeleteSession={vi.fn()}
        />,
      );
      const deleteBtn = screen.getByTestId('delete-session-pd-1');
      await user.click(deleteBtn);
      expect(screen.getByTestId('delete-session-confirm')).toBeInTheDocument();
    });

    it('dismisses delete confirmation with cancel button', async () => {
      const user = userEvent.setup();
      render(
        <SessionTabs
          sessions={[makePlanDay({ id: 'pd-1', sessionOrder: 1 }), makePlanDay({ id: 'pd-2', sessionOrder: 2 })]}
          activeSessionId="pd-1"
          completedSessionIds={[]}
          onSelectSession={vi.fn()}
          onAddSession={vi.fn()}
          onDeleteSession={vi.fn()}
        />,
      );
      const deleteBtn = screen.getByTestId('delete-session-pd-1');
      await user.click(deleteBtn);
      expect(screen.getByTestId('delete-session-confirm')).toBeInTheDocument();
      await user.click(screen.getByTestId('cancel-delete-session'));
      expect(screen.queryByTestId('delete-session-confirm')).not.toBeInTheDocument();
    });
  });
});

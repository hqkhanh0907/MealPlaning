import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { SessionTabs } from '../features/fitness/components/SessionTabs';
import type { TrainingPlanDay } from '../features/fitness/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => {
    if (key === 'fitness.plan.sessionTab') return `Buổi ${String(opts?.order ?? '')}`;
    if (key === 'fitness.plan.addSession') return 'Thêm buổi tập';
    return key;
  } }),
}));

afterEach(cleanup);

const makePlanDay = (overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay => ({
  id: 'pd-1', planId: 'plan-1', dayOfWeek: 1, sessionOrder: 1,
  workoutType: 'Upper Push', exercises: '[]', originalExercises: '[]',
  ...overrides,
});

describe('SessionTabs', () => {
  it('does not render when only 1 session and showAlways=false', () => {
    const { container } = render(
      <SessionTabs
        sessions={[makePlanDay()]}
        activeSessionId="pd-1"
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
    expect(screen.getAllByRole('tab')).toHaveLength(3); // 2 sessions + 1 add button
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
    fireEvent.click(screen.getAllByRole('tab')[1]); // click session 2
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
});

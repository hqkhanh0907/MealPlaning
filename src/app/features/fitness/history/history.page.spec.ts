import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { WorkoutSessionDetail, WorkoutSet } from '../../../core/models/fitness.types';
import { WorkoutRepository } from '../../../core/repositories/workout.repository';
import FitnessHistoryPage from './history.page';

describe('FitnessHistoryPage._isoWeekStart (F-016)', () => {
  // Reproducer turn 12: Sunday 2026-05-17 was grouped under week 10-16 May.
  // Expected: Monday week-start for May 17 (Sun) is May 11 (Mon).
  it('Sunday → previous Monday (same ISO week)', () => {
    expect(FitnessHistoryPage._isoWeekStart('2026-05-17')).toBe('2026-05-11');
  });

  it('Monday → itself', () => {
    expect(FitnessHistoryPage._isoWeekStart('2026-05-11')).toBe('2026-05-11');
  });

  it('Wednesday → preceding Monday', () => {
    expect(FitnessHistoryPage._isoWeekStart('2026-05-13')).toBe('2026-05-11');
  });

  it('Saturday → preceding Monday', () => {
    expect(FitnessHistoryPage._isoWeekStart('2026-05-16')).toBe('2026-05-11');
  });

  it('handles month boundary (Sat May 2 → Mon Apr 27)', () => {
    expect(FitnessHistoryPage._isoWeekStart('2026-05-02')).toBe('2026-04-27');
  });

  it('handles year boundary (Sun 2026-01-04 → Mon 2025-12-29)', () => {
    expect(FitnessHistoryPage._isoWeekStart('2026-01-04')).toBe('2025-12-29');
  });

  it('formats local date components (timezone-safe, no UTC drift)', () => {
    // Regression guard for the original bug: toISOString() shifted GMT+7 dates by -1 day.
    // The output should always look like a local YYYY-MM-DD without crossing midnight UTC.
    const result = FitnessHistoryPage._isoWeekStart('2026-05-17');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result).not.toBe('2026-05-10'); // the buggy GMT+7 output
  });
});

describe('FitnessHistoryPage._formatLocalIsoDate (F-016)', () => {
  it('formats local components, not UTC', () => {
    // Construct a date that would differ in UTC for GMT+7.
    const d = new Date(2026, 4, 11); // May 11 2026 local midnight
    expect(FitnessHistoryPage._formatLocalIsoDate(d)).toBe('2026-05-11');
  });

  it('zero-pads month and day', () => {
    const d = new Date(2026, 0, 5);
    expect(FitnessHistoryPage._formatLocalIsoDate(d)).toBe('2026-01-05');
  });
});

describe('FitnessHistoryPage session details', () => {
  const recordedAt = '2026-05-17T08:00:00Z';
  const loggedSet: WorkoutSet = {
    id: 'set-1',
    workout_exercise_id: 'exercise-1',
    set_number: 1,
    weight_kg: 42.5,
    reps: 12,
    rest_seconds: null,
    effort: null,
    notes: null,
    status: 'logged',
    completed_at: recordedAt,
    created_at: recordedAt,
  };
  const completedWorkout: WorkoutSessionDetail = {
    id: 'session-1',
    date: '2026-05-17',
    training_plan_day_id: null,
    training_day_name: null,
    mode: 'free',
    total_volume: 510,
    duration_minutes: 30,
    started_at: '2026-05-17T07:30:00Z',
    completed_at: recordedAt,
    created_at: recordedAt,
    exercises: [
      {
        id: 'exercise-1',
        workout_session_id: 'session-1',
        exercise_id: 'bench-press',
        exercise_name: 'Bench Press',
        exercise_name_vi: 'Đẩy ngực',
        muscle_group: 'chest',
        category: 'compound',
        sort_order: 0,
        total_volume: 510,
        sets: [
          loggedSet,
          {
            ...loggedSet,
            id: 'set-2',
            set_number: 2,
            weight_kg: 70,
            reps: 8,
            status: 'skipped',
            completed_at: null,
          },
        ],
      },
    ],
  };

  async function showHistory(sessions: WorkoutSessionDetail[]): Promise<HTMLElement> {
    const workoutRepo = jasmine.createSpyObj<WorkoutRepository>('WorkoutRepository', [
      'recentSessions',
    ]);
    workoutRepo.recentSessions.and.resolveTo(sessions);
    await TestBed.configureTestingModule({
      imports: [FitnessHistoryPage],
      providers: [provideRouter([]), { provide: WorkoutRepository, useValue: workoutRepo }],
    }).compileComponents();
    const fixture = TestBed.createComponent(FitnessHistoryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('expands a workout and shows logged values separately from skipped sets', async () => {
    const host = await showHistory([completedWorkout]);
    const details = host.querySelector<HTMLDetailsElement>('details')!;
    const summary = details.querySelector('summary')!;

    expect(details.open).toBeFalse();
    expect(summary.textContent).toContain('1 hiệp đã ghi');
    expect(summary.textContent).toContain('510 kg');
    summary.click();

    expect(details.open).toBeTrue();
    expect(details.textContent).toContain('Đẩy ngực');
    expect(details.textContent).toContain('42.5 kg × 12 lần');
    expect(details.textContent).toContain('Đã bỏ qua');
    expect(details.textContent).not.toContain('70 kg');
  });

  it('explains when a completed workout has no saved exercise details', async () => {
    const host = await showHistory([{ ...completedWorkout, exercises: [] }]);
    const details = host.querySelector('details')!;
    details.querySelector('summary')!.click();

    expect(details.textContent).toContain('Không có chi tiết bài tập.');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkoutSummaryModal } from './workout-summary-modal';
import type { WorkoutSessionDetail } from '../../../core/models/fitness.types';

function makeSession(overrides: Partial<WorkoutSessionDetail> = {}): WorkoutSessionDetail {
  return {
    id: 's-1',
    date: '2025-01-01',
    training_plan_day_id: null,
    training_day_name: 'Push A',
    mode: 'guided',
    total_volume: 1234.6,
    duration_minutes: 42,
    started_at: '2025-01-01T09:00:00.000Z',
    completed_at: '2025-01-01T09:42:00.000Z',
    created_at: '2025-01-01T09:00:00.000Z',
    exercises: [
      {
        id: 'we-1',
        exercise_id: 'e-1',
        exercise_name: 'Bench Press',
        exercise_name_vi: 'Đẩy ngực',
        muscle_group: 'chest',
        category: 'strength',
        sort_order: 1,
        total_volume: 900,
        sets: [
          {
            id: 'st-1',
            set_number: 1,
            weight_kg: 50,
            reps: 8,
            status: 'logged',
            effort: null,
            notes: null,
            logged_at: 't',
            created_at: 't',
          } as never,
          {
            id: 'st-2',
            set_number: 2,
            weight_kg: 60,
            reps: 6,
            status: 'logged',
            effort: null,
            notes: null,
            logged_at: 't',
            created_at: 't',
          } as never,
          { id: 'st-3', set_number: 3, weight_kg: 90, reps: 8, status: 'skipped' } as never,
        ],
      },
      {
        id: 'we-2',
        exercise_id: 'e-2',
        exercise_name: 'Empty',
        exercise_name_vi: null,
        muscle_group: 'back',
        category: 'strength',
        sort_order: 2,
        total_volume: 0,
        sets: [],
      },
    ],
    ...overrides,
  } as WorkoutSessionDetail;
}

describe('WorkoutSummaryModal', () => {
  let fixture: ComponentFixture<WorkoutSummaryModal>;
  let cmp: WorkoutSummaryModal;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WorkoutSummaryModal] }).compileComponents();
    fixture = TestBed.createComponent(WorkoutSummaryModal);
    cmp = fixture.componentInstance;
  });

  it('aggregates sets, volume, and duration from the session snapshot', () => {
    cmp.session = makeSession();
    fixture.detectChanges();
    const aggregates = cmp as unknown as {
      totalSets(): number;
      totalVolume(): number;
      durationLabel(): string;
      exerciseRows(): { id: string; name: string; sets: number; volume: number; topSet: string }[];
    };
    expect(aggregates.totalSets()).toBe(2);
    expect(aggregates.totalVolume()).toBe(1235);
    expect(aggregates.durationLabel()).toBe('42 phút');
    const rows = aggregates.exerciseRows();
    expect(rows.length).toBe(1); // empty exercise filtered out
    expect(rows[0].name).toBe('Đẩy ngực');
    expect(rows[0].topSet).toBe('60 kg × 6');
  });

  it('renders "<1 phút" for sub-minute sessions', () => {
    cmp.session = makeSession({ duration_minutes: 0.4 });
    fixture.detectChanges();
    expect((cmp as unknown as { durationLabel(): string }).durationLabel()).toBe('<1 phút');
  });

  it('renders "—" when duration is null', () => {
    cmp.session = makeSession({ duration_minutes: null });
    fixture.detectChanges();
    expect((cmp as unknown as { durationLabel(): string }).durationLabel()).toBe('—');
  });

  it('emits closed and flips isOpen on close()', () => {
    cmp.isOpen = true;
    const spy = jasmine.createSpy('closed');
    cmp.closed.subscribe(spy);
    (cmp as unknown as { close(): void }).close();
    expect(cmp.isOpen).toBeFalse();
    expect(spy).toHaveBeenCalled();
  });

  it('returns empty totals when session is null', () => {
    cmp.session = null;
    fixture.detectChanges();
    const aggregates = cmp as unknown as {
      totalSets(): number;
      totalVolume(): number;
      durationLabel(): string;
      exerciseRows(): unknown[];
    };
    expect(aggregates.totalSets()).toBe(0);
    expect(aggregates.totalVolume()).toBe(0);
    expect(aggregates.durationLabel()).toBe('—');
    expect(aggregates.exerciseRows().length).toBe(0);
  });
});

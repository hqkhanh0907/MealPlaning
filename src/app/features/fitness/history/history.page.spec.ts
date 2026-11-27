import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { WorkoutSessionDetail, WorkoutSet } from '../../../core/models/fitness.types';
import { ExerciseRepository } from '../../../core/repositories/exercise.repository';
import { WorkoutRepository } from '../../../core/repositories/workout.repository';
import {
  createTestDatabase,
  teardownTestDatabase,
} from '../../../core/services/database/__test__/create-test-database';
import { Database } from '../../../core/services/database/database';
import { FitnessStore } from '../../../core/stores/fitness.store';
import { WorkoutNavigation } from '../workout-navigation';
import { exerciseGuideText } from '../../../core/models/exercise-guide-texts';
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
      'progressSummary',
      'weeklyVolumes',
    ]);
    workoutRepo.progressSummary.and.resolveTo({
      currentWeekVolume: 510,
      previousWeekVolume: 100,
      workoutStreakWeeks: 1,
      weightSource: null,
      weeklyAvgWeightKg: null,
      volumeByMuscle: [],
      strength: [],
    });
    workoutRepo.weeklyVolumes.and.resolveTo([]);
    workoutRepo.recentSessions.and.resolveTo(sessions);
    await TestBed.configureTestingModule({
      imports: [FitnessHistoryPage],
      providers: [provideRouter([]), { provide: WorkoutRepository, useValue: workoutRepo }],
    }).compileComponents();
    const fixture = TestBed.createComponent(FitnessHistoryPage);
    fixture.detectChanges();
    await fixture.componentInstance.refresh();
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
    expect(details.textContent).toContain('42,5 kg × 12 lần');
    expect(details.textContent).toContain('Đã bỏ qua');
    expect(details.textContent).not.toContain('70 kg');
  });

  it('explains when a completed workout has no saved exercise details', async () => {
    const host = await showHistory([{ ...completedWorkout, exercises: [] }]);
    const details = host.querySelector('details')!;
    details.querySelector('summary')!.click();

    expect(details.textContent).toContain('Không có chi tiết bài tập.');
  });

  it('keeps guided sessions in the schedule and offers replay for independent sessions', async () => {
    const host = await showHistory([
      completedWorkout,
      { ...completedWorkout, id: 'guided-day', mode: 'guided', origin: 'plan_day' },
    ]);
    const rows = host.querySelectorAll('.session-card');
    expect(rows[0].querySelector('[data-testid="replay-workout"]')).not.toBeNull();
    expect(rows[1].querySelector('[data-testid="replay-workout"]')).toBeNull();
    expect(host.querySelector('.trend')?.textContent).toContain('100 kg tuần trước');
  });

  it('shows decimal kilograms for a workout above one tonne', async () => {
    const host = await showHistory([{ ...completedWorkout, total_volume: 1254.25 }]);

    expect(host.querySelector('summary')?.textContent).toContain('1.254,25 kg');
  });
});

describe('FitnessHistoryPage changes to a finished workout', () => {
  let db: Database;
  let repository: WorkoutRepository;
  let fixture: ComponentFixture<FitnessHistoryPage>;
  let host: HTMLElement;
  let sessionId: string;
  let first: WorkoutSet;
  let second: WorkoutSet;
  let revise: jasmine.Spy<WorkoutRepository['reviseCompletedSet']>;
  let deleteWorkout: jasmine.Spy<WorkoutRepository['deleteCompletedSession']>;

  beforeEach(async () => {
    db = await createTestDatabase();
    await TestBed.configureTestingModule({
      imports: [FitnessHistoryPage],
      providers: [provideRouter([]), { provide: Database, useValue: db }],
    }).compileComponents();
    repository = TestBed.inject(WorkoutRepository);
    await TestBed.inject(ExerciseRepository).ensureSeedExercises();
    const session = await repository.startFreeSession(new Date('2026-05-17T07:30:00Z'));
    sessionId = session.id;
    const exercise = await repository.addExerciseToSession(sessionId, 'bench-press');
    const measurement = {
      weightKg: 40,
      restSeconds: 90,
      effort: 'hard',
      notes: 'Hiệp thử',
    } as const;
    first = (await repository.addSet(exercise.id, { ...measurement, reps: 6 })).set;
    second = (await repository.addSet(exercise.id, { ...measurement, reps: 5 })).set;
    await repository.completeSession(sessionId, new Date('2026-05-17T08:00:00Z'));
    revise = spyOn(repository, 'reviseCompletedSet').and.callThrough();
    deleteWorkout = spyOn(repository, 'deleteCompletedSession').and.callThrough();
    fixture = TestBed.createComponent(FitnessHistoryPage);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await fixture.componentInstance.refresh();
    await updateView();
    const detailsToggle = host.querySelector('summary');
    if (!detailsToggle) throw new Error(host.textContent?.trim());
    detailsToggle.click();
  });

  afterEach(teardownTestDatabase);

  async function updateView(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function click(action: string): void {
    const selector = `[aria-label="${action}"]`;
    const button = Array.from(host.querySelectorAll<HTMLElement>('ion-button')).find(
      (element) => element.matches(selector) || element.shadowRoot?.querySelector(selector),
    );
    if (!button) {
      throw new Error(
        `Missing history action: ${action}. Visible history: ${host.textContent?.trim()}`,
      );
    }
    fixture.ngZone!.run(() => button.click());
    fixture.detectChanges();
  }

  function editRepetitions(value: string): Promise<WorkoutSessionDetail> {
    click('Sửa hiệp 2');
    const field = host.querySelector<HTMLInputElement>('#history-set-amount')!;
    expect(field.value).toBe('5');
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    const save = host.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    fixture.ngZone!.run(() => save.click());
    fixture.detectChanges();
    return revise.calls.mostRecent().returnValue;
  }

  it('previews the effective movement and respects leaving History during replay startup', async () => {
    const fitness = TestBed.inject(FitnessStore);
    const exerciseId = 'push-up';
    const venue = {
      placeId: 'home',
      placeName: 'Ở nhà',
      equipment: [],
      movements: [{ sourceId: 'bench-press', exerciseId }],
    };
    spyOn(fitness, 'previewReplay').and.resolveTo(venue);
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => (finish = resolve));
    const replay = spyOn(fitness, 'replay').and.returnValue(pending);
    const navigate = spyOn(TestBed.inject(WorkoutNavigation), 'session').and.resolveTo(true);
    fixture.ngZone!.run(() =>
      host.querySelector<HTMLElement>('[data-testid="replay-workout"]')!.click(),
    );
    await updateView();
    const preview = host.querySelector('.session-replay')!;
    expect(preview.textContent).toContain(venue.placeName);
    expect(preview.querySelector('li')?.textContent).toContain(
      exerciseGuideText(exerciseId)!.nameVi,
    );
    expect(preview.querySelector('li')?.textContent).not.toContain('Cần ');
    fixture.ngZone!.run(() =>
      host.querySelector<HTMLElement>('[data-testid="start-replay"]')!.click(),
    );
    expect(replay).toHaveBeenCalledWith(sessionId, venue);
    fixture.componentInstance.ionViewWillLeave();
    fitness.activeSession.set(await repository.getSession(sessionId));
    finish();
    await updateView();
    expect(navigate).not.toHaveBeenCalled();
    expect(host.querySelector('.session-replay')).toBeNull();
  });

  it('changes one recorded set to 7 reps and preserves IDs, the other set, and the set notes', async () => {
    expect(host.querySelector('summary')?.textContent).toContain('440 kg');
    await editRepetitions('7');
    await updateView();

    const saved = (await repository.getSession(sessionId))!;
    expect(saved.id).toBe(sessionId);
    expect(saved.total_volume).toBe(520);
    expect(saved.exercises[0].total_volume).toBe(520);
    expect(saved.exercises[0].sets).toEqual([first, { ...second, reps: 7 }]);
    expect(host.querySelector('summary')?.textContent).toContain('520 kg');
    expect(host.querySelector('details')?.open).toBeTrue();
    expect(host.querySelector('form')).toBeNull();
  });

  it('keeps the draft and rolls back the set when recalculating the workout fails', async () => {
    await db.execute(`CREATE TRIGGER abort_history_update BEFORE UPDATE ON workout_session
      BEGIN SELECT RAISE(ABORT, 'test workout save failure'); END`);
    await expectAsync(editRepetitions('7')).toBeRejected();
    await updateView();

    const saved = (await repository.getSession(sessionId))!;
    expect(saved.total_volume).toBe(440);
    expect(saved.exercises[0].sets[1]).toEqual(second);
    expect(host.querySelector<HTMLInputElement>('#history-set-amount')?.value).toBe('7');
    expect(host.querySelector('form [role="alert"]')?.textContent?.trim()).toBeTruthy();
  });

  it('keeps the session when canceling and deletes only that finished session after confirmation', async () => {
    const active = await repository.startFreeSession(new Date('2026-05-18T07:30:00Z'));
    click('Xóa buổi tập');
    click('Hủy xóa buổi tập');
    expect((await repository.getSession(sessionId))?.id).toBe(sessionId);

    click('Xóa buổi tập');
    click('Xác nhận xóa buổi tập');
    await deleteWorkout.calls.mostRecent().returnValue;
    await updateView();

    expect(await repository.getSession(sessionId)).toBeNull();
    expect(await db.getOne('SELECT id FROM workout_set WHERE id = ?', [first.id])).toBeNull();
    expect((await repository.getActiveSession())?.id).toBe(active.id);
    expect(host.querySelector('summary')).toBeNull();
  });
});

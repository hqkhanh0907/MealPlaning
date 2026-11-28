import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Database } from '../../../core/services/database/database';
import {
  createTestDatabase,
  teardownTestDatabase,
} from '../../../core/services/database/__test__/create-test-database';
import { WorkoutRepository } from '../../../core/repositories/workout.repository';
import { FitnessStore } from '../../../core/stores/fitness.store';
import { WorkoutNavigation } from '../workout-navigation';
import LeptosWorkoutToday from './today.page';
import LeptosWorkoutSession from './session.page';
import LeptosWorkoutHistory from './history.page';
import LeptosWorkoutPlans from './plans.page';
import LeptosWorkoutLibrary from './library.page';
import { loadFitness, createFitnessIndex } from './renderer';
import { filterExerciseIndex, indexExercise } from '../../../core/models/exercise-discovery';
import { normalize } from '../../../core/utils/fuzzy-match';

describe('Fitness Leptos, actual SQLite workout records', () => {
  beforeAll(async () => {
    await loadFitness();
  });
  beforeEach(async () => {
    const db = await createTestDatabase();
    await TestBed.configureTestingModule({
      imports: [
        LeptosWorkoutToday,
        LeptosWorkoutSession,
        LeptosWorkoutHistory,
        LeptosWorkoutPlans,
        LeptosWorkoutLibrary,
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: Database, useValue: db },
        {
          provide: WorkoutNavigation,
          useValue: { today: async () => true, session: async () => true, back: async () => true },
        },
      ],
    }).compileComponents();
  });
  afterEach(() => teardownTestDatabase());
  async function render<T>(f: ComponentFixture<T>): Promise<void> {
    f.detectChanges();
    await f.whenStable();
    await new Promise<void>((done) => requestAnimationFrame(() => done()));
    f.detectChanges();
  }
  function element<T>(f: ComponentFixture<T>, selector: string): HTMLElement {
    const node = f.nativeElement.querySelector(selector) as HTMLElement | null;
    if (!node) throw Error('Missing workout control ' + selector);
    return node;
  }
  function type<T>(f: ComponentFixture<T>, selector: string, value: string): void {
    const el = element(f, selector) as HTMLInputElement;
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
  it('records a per-hand load, skips a set, completes and replays the saved workout', async () => {
    const store = TestBed.inject(FitnessStore),
      repo = TestBed.inject(WorkoutRepository);
    await store.initialize();
    expect(store.errorMessage()).toBeNull();
    const today = TestBed.createComponent(LeptosWorkoutToday);
    await render(today);
    const begin = spyOn(store, 'startFree').and.callThrough();
    element(today, '[data-testid="start-free"]').click();
    await begin.calls.mostRecent().returnValue;
    const original = store.activeSession()!.id;
    await render(today);
    expect(element(today, '[data-testid="resume-workout"]').textContent).toContain('Tiếp tục');
    today.destroy();
    await store.addExerciseToActive('biceps-curl');
    const session = TestBed.createComponent(LeptosWorkoutSession);
    await render(session);
    expect(element(session, 'label[for="weight-kg"]').textContent).toBe('Tạ mỗi tay (kg)');
    type(session, '#weight-kg', '12.5');
    type(session, '#reps', '6');
    type(session, '#rest-seconds', '0');
    type(session, '#set-notes', 'Hiệp kiểm thử');
    element(session, '.effort-chip').click();
    const log = spyOn(store, 'logSet').and.callThrough();
    element(session, '.log-set').click();
    await log.calls.mostRecent().returnValue;
    await render(session);
    expect(element(session, '.set-history__main').textContent).toContain('12,5 kg mỗi tay × 6 lần');
    const skip = spyOn(store, 'skipSet').and.callThrough();
    element(session, '.logger-actions ion-button').click();
    await skip.calls.mostRecent().returnValue;
    await render(session);
    expect(element(session, '.set-history__skipped-label').textContent).toContain('Đã bỏ qua');
    const complete = spyOn(store, 'completeWorkout').and.callThrough();
    element(session, 'ion-footer ion-button').click();
    await complete.calls.mostRecent().returnValue;
    const [saved] = await repo.recentSessions(2);
    expect(saved.id).toBe(original);
    expect(saved.total_volume).toBe(150);
    expect(saved.exercises[0].sets[0]).toEqual(
      jasmine.objectContaining({ weight_kg: 25, reps: 6, effort: 'easy', notes: 'Hiệp kiểm thử' }),
    );
    expect(saved.exercises[0].sets[1].status).toBe('skipped');
    session.destroy();

    const history = TestBed.createComponent(LeptosWorkoutHistory);
    await history.componentInstance.refresh();
    await render(history);
    expect(element(history, '.session-card__summary').textContent).toContain('1 hiệp đã ghi');
    expect(element(history, '.session-card__summary').textContent).toContain('150 kg');
    element(history, '.session-card__summary').click();
    element(history, '.session-exercise .session-sets li ion-button').click();
    await render(history);
    type(history, '#history-set-amount', '8');
    const revise = spyOn(repo, 'reviseCompletedSet').and.callThrough();
    element(history, '.session-set-editor').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await revise.calls.mostRecent().returnValue;
    await render(history);
    expect(element(history, '.session-card__summary').textContent).toContain('200 kg');
    expect((await repo.recentSessions())[0].exercises[0].sets[0].reps).toBe(8);
    element(history, '[data-testid="replay-workout"]').click();
    await render(history);
    expect(element(history, '.session-replay').textContent).toContain('Cuốn tay trước tạ đơn');
    const replay = spyOn(store, 'replay').and.callThrough();
    element(history, '[data-testid="start-replay"]').click();
    await replay.calls.mostRecent().returnValue;
    const next = await repo.getActiveSession();
    expect(next?.source_session_id).toBe(original);
    expect(next?.id).not.toBe(original);
    expect(next?.exercises[0].exercise_id).toBe('biceps-curl');
    expect(next?.exercises[0].sets).toEqual([]);
    expect((await repo.recentSessions())[0].exercises[0].sets.length).toBe(2);
  }, 30000);

  it('records and repeats seconds for a timed movement trained on each side', async () => {
    const store = TestBed.inject(FitnessStore);
    await store.initialize();
    await store.startFree();
    await store.addExerciseToActive('side-plank');
    const f = TestBed.createComponent(LeptosWorkoutSession);
    await render(f);
    expect(element(f, 'label[for="reps"]').textContent).toBe('Tập mỗi bên (giây)');
    expect(element(f, '#reps').getAttribute('max')).toBe('86400');
    type(f, '#weight-kg', '0');
    type(f, '#reps', '45');
    type(f, '#rest-seconds', '0');
    const log = spyOn(store, 'logSet').and.callThrough();
    element(f, '.log-set').click();
    await log.calls.mostRecent().returnValue;
    await render(f);
    const repeat = spyOn(store, 'repeatLastSet').and.callThrough();
    element(f, '.repeat-set').click();
    await repeat.calls.mostRecent().returnValue;
    await render(f);
    const saved = await TestBed.inject(WorkoutRepository).getActiveSession();
    expect(saved?.exercises[0].sets.map((s) => [s.reps, s.duration_seconds])).toEqual([
      [0, 45],
      [0, 45],
    ]);
    expect(f.nativeElement.querySelectorAll('.set-history__main').length).toBe(2);
    expect(element(f, '.set-history__main').textContent).toContain('45 giây');
  }, 30000);

  it('keeps search, guide selection, the active plan and its prescription', async () => {
    const f = TestBed.inject(FitnessStore);
    await f.initialize();
    expect(f.exercises().length).toBeGreaterThan(400);
    const rows = f.exercises().map(indexExercise);
    const index = createFitnessIndex(
      JSON.stringify(
        rows.map(({ exercise, primary, secondary, equipment, required, searchTerms }) => ({
          id: exercise.id,
          primary,
          secondary,
          equipment,
          required,
          searchTerms,
        })),
      ),
    );
    try {
      for (const q of ['', 'plank', 'đẩy tạ', 'ĐÙI', 'không có tên này'])
        for (const muscle of [null, 'chest', 'abs'] as const)
          for (const available of [null, [], ['hex-dumbbell'], ['dual-cable', 'cable-handle-pair']])
            for (const gear of [null, 'dumbbell', 'no-equipment']) {
              const expected = filterExerciseIndex(rows, {
                query: q,
                muscle,
                equipment: gear,
                available,
              }).map((r) => [r.exercise.id, r.muscleMatch]);
              const result = JSON.parse(
                index.query(JSON.stringify({ query: normalize(q), muscle, gear, available })),
              ) as [number, string | null][];
              expect(result.map(([i, match]) => [rows[i].exercise.id, match]))
                .withContext(JSON.stringify({ q, muscle, gear, available }))
                .toEqual(expected);
            }
    } finally {
      index.free();
    }
    const library = TestBed.createComponent(LeptosWorkoutLibrary);
    await render(library);
    expect(library.nativeElement.querySelectorAll('.eps-row').length).toBe(40);
    type(library, '#eps-search-input', 'plank');
    await render(library);
    const first = element(library, '.eps-row');
    expect(first.dataset['exerciseId']).toBeTruthy();
    first.click();
    await render(library);
    expect(library.nativeElement.querySelector('app-exercise-guide-sheet')).toBeTruthy();
    library.destroy();
    const plan = f.plans()[0];
    await f.activatePlan(plan.id);
    const plans = TestBed.createComponent(LeptosWorkoutPlans);
    await render(plans);
    expect(element(plans, '#active-plan-title').textContent).toBe(plan.name);
    element(plans, '.week-day:not(.week-day--rest)').click();
    await render(plans);
    expect(element(plans, '[aria-label="Chi tiết buổi tập"]').textContent).toContain('nghỉ');
  }, 30000);
});

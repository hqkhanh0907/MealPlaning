import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { FitnessStore } from '../../../core/stores/fitness.store';
import { WorkoutNavigation } from '../workout-navigation';
import { AiAvailability } from '../../../shared/ai-availability';
import { WorkoutPlanFinder } from '../components/workout-plan-finder/workout-plan-finder';
import { TrainingPlanRepository } from '../../../core/repositories/training-plan.repository';
import { ExercisePlaceRepository } from '../../../core/repositories/exercise-place.repository';
import { UserProfileRepository } from '../../../core/repositories/user-profile.repository';
import WorkoutPlans from './workout-plans';

describe('WorkoutPlans lifecycle', () => {
  const loading = signal(false);
  const nav = jasmine.createSpyObj<WorkoutNavigation>('nav', ['today', 'session']);
  const store = {
    loading,
    progress: signal({}),
    activePlan: signal(null),
    activeSession: signal<{ id: string } | null>(null),
    errorMessage: signal(null),
    successMessage: signal(null),
    pendingAiPlan: signal(null),
    initialize: () => Promise.resolve(),
    dismissAiPlan: jasmine.createSpy('dismissAiPlan'),
    startFree: jasmine.createSpy('startFree'),
  };
  beforeEach(() => {
    loading.set(false);
    store.activeSession.set(null);
    nav.session.calls.reset();
    TestBed.configureTestingModule({
      imports: [WorkoutPlans],
      providers: [
        provideIonicAngular(),
        { provide: FitnessStore, useValue: store },
        { provide: WorkoutNavigation, useValue: nav },
        { provide: AiAvailability, useValue: {} },
        {
          provide: TrainingPlanRepository,
          useValue: { listPlans: async () => [], getFinderSchedule: async () => null },
        },
        {
          provide: ExercisePlaceRepository,
          useValue: { list: async () => [], getDefaultId: async () => null },
        },
        { provide: UserProfileRepository, useValue: { getProfile: async () => null } },
      ],
    });
  });
  it('retains the same finder during a background refresh', () => {
    const fixture = TestBed.createComponent(WorkoutPlans);
    fixture.detectChanges();
    const finder = fixture.debugElement.query(By.directive(WorkoutPlanFinder)).componentInstance;
    loading.set(true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(WorkoutPlanFinder))?.componentInstance).toBe(
      finder,
    );
    loading.set(false);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(WorkoutPlanFinder))?.componentInstance).toBe(
      finder,
    );
  });
  it('keeps the selected tab when starting a session finishes on a later visit', async () => {
    const fixture = TestBed.createComponent(WorkoutPlans);
    let finish!: () => void;
    store.startFree.and.returnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    const pending = fixture.componentInstance['free']();
    fixture.componentInstance.ionViewWillLeave();
    await fixture.componentInstance.ionViewWillEnter();
    store.activeSession.set({ id: 'started' });
    finish();
    await pending;
    expect(nav.session).not.toHaveBeenCalled();
  });
});

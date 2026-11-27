import { TestBed } from '@angular/core/testing';
import { WorkoutNavigation } from '../workout-navigation';
import { FitnessStore } from '../../../core/stores/fitness.store';
import WorkoutToday from './workout-today';

describe('WorkoutToday navigation', () => {
  it('keeps a later navigation when session creation completes after leaving', async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const nav = jasmine.createSpyObj<WorkoutNavigation>('nav', ['session']);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: FitnessStore,
          useValue: {
            activeSession: () => ({ id: 'started' }),
            startFree: () => pending,
            initialize: () => Promise.resolve(),
          },
        },
        { provide: WorkoutNavigation, useValue: nav },
      ],
    });
    const page = TestBed.runInInjectionContext(() => new WorkoutToday());
    page.ionViewWillEnter();
    const starting = page['start'](false);
    page.ionViewWillLeave();
    page.ionViewWillEnter();
    finish();
    await starting;
    expect(nav.session).not.toHaveBeenCalled();
  });
});

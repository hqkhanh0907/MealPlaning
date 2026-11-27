import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import type { TrainingPlanExerciseDraft } from '../../../../core/models/fitness.types';
import type { WorkoutPreferences } from '../../../../core/models/workout-plan-recommendation';
import { workoutExerciseName } from '../../../../core/models/workout-plan-recommendation';
import { FitnessStore } from '../../../../core/stores/fitness.store';
import {
  defaultExercisePlaces,
  ExercisePlaceRepository,
} from '../../../../core/repositories/exercise-place.repository';
import { UserProfileRepository } from '../../../../core/repositories/user-profile.repository';
import { TrainingPlanRepository } from '../../../../core/repositories/training-plan.repository';
import { WorkoutPlanFinder } from './workout-plan-finder';

describe('WorkoutPlanFinder', () => {
  const [home] = defaultExercisePlaces;
  let fixture: ComponentFixture<WorkoutPlanFinder>;
  let root: HTMLElement;
  const planRepo = jasmine.createSpyObj<TrainingPlanRepository>('TrainingPlanRepository', [
    'listPlans',
    'getFinderSchedule',
    'saveFinderSchedule',
    'activatePlanById',
    'savePresetPreview',
  ]);
  const placeRepo = jasmine.createSpyObj<ExercisePlaceRepository>('ExercisePlaceRepository', [
    'list',
    'getDefaultId',
    'save',
    'setDefaultId',
  ]);
  let birthDate: string | null;

  beforeEach(() => {
    birthDate = '1988-01-01';
    planRepo.listPlans.and.resolveTo([]);
    planRepo.getFinderSchedule.and.resolveTo(null);
    planRepo.saveFinderSchedule.and.resolveTo();
    planRepo.activatePlanById.calls.reset();
    placeRepo.list.and.resolveTo(defaultExercisePlaces);
    placeRepo.getDefaultId.and.resolveTo(null);
    placeRepo.save.and.resolveTo(defaultExercisePlaces);
    placeRepo.setDefaultId.and.resolveTo();
    TestBed.configureTestingModule({
      imports: [WorkoutPlanFinder],
      providers: [
        provideIonicAngular(),
        {
          provide: FitnessStore,
          useValue: {
            previewComposed: async (
              draft: readonly TrainingPlanExerciseDraft[],
              placeId: string,
            ) => ({
              placeId,
              placeName: home.name,
              equipment: ['dumbbell'],
              draft,
              movements: draft.map((item) => ({
                sourceId: item.exerciseId,
                exerciseId:
                  item.exerciseId === 'dumbbell-floor-press' ? 'push-up' : item.exerciseId,
              })),
            }),
          },
        },
        { provide: TrainingPlanRepository, useValue: planRepo },
        { provide: ExercisePlaceRepository, useValue: placeRepo },
        {
          provide: UserProfileRepository,
          useValue: { getProfile: async () => ({ birth_date: birthDate }) },
        },
      ],
    });
  });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(WorkoutPlanFinder);
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }
  function click(selector: string): void {
    const element = root.querySelector<HTMLElement>(selector);
    if (!element) throw new Error('Missing ' + selector);
    element.click();
    fixture.detectChanges();
  }

  it('requires a deliberate start and emits exactly the previewed one-off exercises', async () => {
    await render();
    let items: readonly TrainingPlanExerciseDraft[] = [];
    let aiContext: WorkoutPreferences | null = null;
    fixture.componentInstance.aiContextChanged.subscribe((value) => {
      aiContext = value;
    });
    fixture.componentInstance.composedRequested.subscribe((preview) => {
      expect(preview.placeId).toBe(home.id);
      expect(preview.draft.map((item) => item.exerciseId)).toContain('dumbbell-floor-press');
      items = preview.draft.map((item, index) => ({
        ...item,
        exerciseId: preview.movements[index].exerciseId,
      }));
    });
    click('[data-finder-day="3"]');
    click('[data-finder-day="6"]');
    const field = root.querySelector<HTMLInputElement>('#finder-minutes')!;
    field.value = '25';
    field.dispatchEvent(new Event('input'));
    click('[data-finder-place="Nhà"]');
    click('[data-finder-gear="dumbbell"]');
    click('[data-finder-avoid="none"]');
    expect(aiContext).toBeNull();
    click('[data-finder-submit]');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(placeRepo.setDefaultId).toHaveBeenCalledWith(home.id);
    expect(placeRepo.save).toHaveBeenCalledWith({ ...home, equipment: ['dumbbell'] });
    expect(items.length).toBe(0);
    expect(planRepo.activatePlanById).not.toHaveBeenCalled();
    expect(root.textContent).toContain('Buổi gợi ý hôm nay');
    expect(root.textContent).toContain('25 phút');
    expect(aiContext).toEqual(
      jasmine.objectContaining({ minutes: 25, weekdays: [3, 6], equipment: ['dumbbell'] }),
    );
    const rows = root.querySelectorAll('.preview li');
    click('[data-finder-start-composed]');
    expect(items.map((item) => item.exerciseId)).toEqual([
      'goblet-squat',
      'push-up',
      'dumbbell-romanian-deadlift',
    ]);
    expect(rows.length).toBe(items.length);
    for (const [index, item] of items.entries()) {
      expect(rows[index].textContent).toContain(workoutExerciseName(item.exerciseId));
      expect(rows[index].textContent).toContain(String(item.sets) + ' hiệp');
    }
  });

  it('keeps manual entry available without an eligible birth date', async () => {
    birthDate = null;
    await render();
    expect(root.querySelector('[data-finder-submit]')).toBeNull();
    expect(root.querySelector('[data-finder-free]')).not.toBeNull();
    expect(root.textContent).toContain('18 tuổi');
  });

  it('retains a review on returning until an actual venue or schedule change invalidates it', async () => {
    const configured = { ...home, equipment: ['hex-dumbbell'] };
    planRepo.getFinderSchedule.and.resolveTo({ weekdays: [2, 5], minutes: 35 });
    placeRepo.list.and.resolveTo([configured]);
    placeRepo.save.and.resolveTo([configured]);
    placeRepo.getDefaultId.and.resolveTo(home.id);
    await render();
    click('[data-finder-avoid="none"]');
    click('[data-finder-submit]');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    await fixture.componentInstance.refreshPreview();
    fixture.detectChanges();
    expect(root.textContent).toContain('Giáo án gợi ý');
    placeRepo.list.and.resolveTo([{ ...home, equipment: [] }]);
    await fixture.componentInstance.refreshPreview();
    fixture.detectChanges();
    expect(root.querySelector('[data-finder-submit]')).not.toBeNull();
    expect(root.textContent).toContain('Điều kiện tập đã thay đổi');
  });

  it('opens a saved schedule and activates the exact template only after confirmation', async () => {
    planRepo.getFinderSchedule.and.resolveTo({ weekdays: [2, 5], minutes: 35 });
    placeRepo.list.and.resolveTo([{ ...home, equipment: ['hex-dumbbell'] }]);
    placeRepo.getDefaultId.and.resolveTo(home.id);
    await render();
    click('[data-finder-avoid="none"]');
    click('[data-finder-submit]');
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    expect(root.textContent).toContain('Hai tạ đơn và sàn');
    const choose = root.querySelector<HTMLIonButtonElement>('.preview ion-button')!;
    expect(choose.disabled).toBeTrue();
    click('.confirm-option input');
    expect(choose.disabled).toBeFalse();
    choose.click();
    expect(planRepo.activatePlanById).toHaveBeenCalledOnceWith('plan_two_dumbbells_floor', null);
  });
});
